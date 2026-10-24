// verify_bcm_via_mcp.mjs — 通过真实 MCP 工具层验证 build_coupling_matrix
//
// 为什么不能只测适配器：适配器输出 (labels, scoreFn) 要经过 handler 才成矩阵。
// 真实使用路径是 MCP 工具 tools/call → tool-registry handler → 适配器 → 算法。
// 本脚本 spawn 全新 MCP 服务器（避开活界面旧模块），走完整链路。
import { spawn } from 'node:child_process'

const SCRIPT = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/index.js'

function runServer(script) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], { stdio: ['pipe', 'pipe', 'pipe'] })
    let buf = ''
    let id = 0
    const pending = new Map()
    let settled = false
    const done = (v) => { if (settled) return; settled = true; resolve(v) }
    const timer = setTimeout(() => done({ error: 'timeout' }), 120000)
    const send = (o) => { try { child.stdin.write(JSON.stringify(o) + '\n') } catch (e) { } }
    const call = (m, p) => new Promise((res) => { const i = ++id; pending.set(i, res); send({ jsonrpc: '2.0', id: i, method: m, params: p }) })
    child.stdout.on('data', (d) => {
      buf += d.toString()
      let i
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
        if (!line) continue
        let m; try { m = JSON.parse(line) } catch (e) { continue }
        if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
      }
    })
    child.on('error', e => done({ error: e.message }))
    ;(async () => {
      await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'bcm', version: '1' } })
      send({ jsonrpc: '2.0', method: 'notifications/initialized' })
      const api = {
        call: async (name, args) => {
          const r = await call('tools/call', { name, arguments: args })
          let text = ''
          try { text = (r.result.content || []).map(x => x.text || '').join('') } catch (e) { }
          try { return JSON.parse(text) } catch (e) { return { raw: text.slice(0, 300) } }
        },
      }
      clearTimeout(timer); settled = true
      resolve({ api, kill: () => { try { child.kill() } catch (e) { } } })
    })().catch(e => { clearTimeout(timer); done({ error: e.message }) })
  })
}

const CASES = [
  {
    name: '① 数组形式关系（复检报告第一组）',
    args: { entities: [{ id: 'A' }, { id: 'B' }, { id: 'C' }], relations: [['A', 'B', 0.1], ['A', 'C', 0.2], ['B', 'C', 0.3]] },
    expect: [0.1, 0.2, 0.3],
  },
  {
    name: '② 不同权重（复检报告第二组，须与①不同）',
    args: { entities: [{ id: 'law' }, { id: 'skill' }, { id: 'mcp' }], relations: [['law', 'skill', 0.9], ['law', 'mcp', 0.7], ['skill', 'mcp', 0.6]] },
    expect: [0.9, 0.7, 0.6],
  },
  {
    name: '③ 对象形式关系（复检报告第三组）',
    args: { entities: [{ id: 'A' }, { id: 'B' }, { id: 'C' }], relations: [{ from: 'A', to: 'B', weight: 0.9 }, { from: 'A', to: 'C', weight: 0.5 }, { from: 'B', to: 'C', weight: 0.7 }] },
    expect: [0.9, 0.5, 0.7],
  },
  {
    name: '④ 双向关系取平均',
    args: { entities: [{ id: 'A' }, { id: 'B' }], relations: [{ from: 'A', to: 'B', weight: 0.8 }, { from: 'B', to: 'A', weight: 0.6 }] },
    expect: [0.7],
  },
  {
    name: '⑤ 对角必须为 1',
    args: { entities: [{ id: 'X' }, { id: 'Y' }], relations: [{ from: 'X', to: 'Y', weight: 0.4 }] },
    expect: [0.4], diag: true,
  },
  {
    name: '⑥ 无关系 → 非对角 0',
    args: { entities: [{ id: 'P' }, { id: 'Q' }], relations: [] },
    expect: [0],
  },
]

console.log('='.repeat(94))
console.log('build_coupling_matrix · 真实 MCP 工具层验证（全新进程）')
console.log('='.repeat(94))

const srv = await runServer(SCRIPT)
if (srv.error) { console.log('✗ 服务器启动失败:', srv.error); process.exit(1) }

let pass = 0
const bad = []
for (const c of CASES) {
  let r
  try { r = await srv.api.call('build_coupling_matrix', c.args) } catch (e) { r = { error: e.message } }
  const m = r && r.output && r.output.matrix
  if (!m) {
    console.log(`\n  ✗ ${c.name}`)
    console.log(`      无矩阵返回：${JSON.stringify(r).slice(0, 200)}`)
    bad.push(c.name); continue
  }
  const n = m.length
  const nonDiag = []
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) nonDiag.push(m[i][j])
  const diagOk = !c.diag || m.every((row, i) => row[i] === 1)
  const symOk = m.every((row, i) => row.every((v, j) => v === m[j][i]))
  const eq = JSON.stringify(nonDiag.map(x => Math.round(x * 1e6) / 1e6)) === JSON.stringify(c.expect)
  const ok = eq && diagOk && symOk
  if (ok) pass++
  else bad.push(c.name)
  console.log(`\n  ${ok ? '✓' : '✗'} ${c.name}`)
  console.log(`      矩阵：${JSON.stringify(m)}`)
  console.log(`      非对角：${JSON.stringify(nonDiag)}  期望：${JSON.stringify(c.expect)}`)
  console.log(`      对角=1 ${diagOk ? '✓' : '✗'} ｜ 对称 ${symOk ? '✓' : '✗'} ｜ success=${r.success}`)
}
srv.kill()

console.log('\n' + '-'.repeat(94))
console.log(`通过 ${pass} / ${CASES.length}`)
if (bad.length) console.log(`失败：${bad.join(' | ')}`)
console.log(pass === CASES.length ? '\n总判定：PASS（build_coupling_matrix 在真实工具层已算对）' : '\n总判定：FAIL')
process.exit(pass === CASES.length ? 0 : 1)
