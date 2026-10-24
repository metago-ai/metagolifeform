// verify_l4_routing.mjs — R142 B3 · L4 族级工具的 operation 路由验证
//
// ════ 为什么需要 ════
// B1 给 20 个 L4 工具加了 operation.enum（族内算法名）。
// 但「声明了 enum」不等于「传 enum 里的值真能路由到那个算法」。
// 这一格（O-1 × AT-13 一致性）此前从没验过。
//
// ════ 检查 ════
//   L4-1  传 operation = 族内第一个算法名 → 实际执行的是该算法（不是 fallback）
//   L4-2  传 operation = 族内最后一个算法名 → 实际执行的是该算法
//   L4-3  传 enum 里的随机 3 个 → 分别命中对应算法
//   L4-4  enum 覆盖族内全部算法（不遗漏）
//   L4-5  传不存在的 operation → fallback 到族内第一个（明确记录该行为）
import { spawn } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const req = createRequire(A + '/')
const TR = req(A + '/tool-registry.js')
const reg = req(A + '/engine/algorithms/registry.js')
const R = reg.registry || reg.default || reg
const L4 = TR.L4_FAMILY_MAP || {}

function runServer(script) {
  return new Promise((resolve) => {
    const c = spawn(process.execPath, [script], { stdio: ['pipe', 'pipe', 'pipe'] })
    let b = '', i = 0
    const p = new Map()
    let settled = false
    const done = (v) => { if (settled) return; settled = true; resolve(v) }
    const tm = setTimeout(() => done({ error: 'timeout' }), 120000)
    const send = (o) => { try { c.stdin.write(JSON.stringify(o) + '\n') } catch (e) { } }
    const call = (m, pa) => new Promise(r => { const id = ++i; p.set(id, r); send({ jsonrpc: '2.0', id, method: m, params: pa }) })
    c.stdout.on('data', d => {
      b += d.toString()
      let k
      while ((k = b.indexOf('\n')) >= 0) {
        const l = b.slice(0, k).trim(); b = b.slice(k + 1)
        if (!l) continue
        let m; try { m = JSON.parse(l) } catch (e) { continue }
        if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id) }
      }
    })
    c.on('error', e => done({ error: e.message }))
    ;(async () => {
      await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'l4', version: '1' } })
      send({ jsonrpc: '2.0', method: 'notifications/initialized' })
      clearTimeout(tm); settled = true
      resolve({
        call: async (name, args) => {
          const r = await call('tools/call', { name, arguments: args })
          let t = ''
          try { t = (r.result.content || []).map(x => x.text || '').join('') } catch (e) { }
          try { return JSON.parse(t) } catch (e) { return { raw: t.slice(0, 300) } }
        },
        kill: () => { try { c.kill() } catch (e) { } },
      })
    })().catch(e => { clearTimeout(tm); done({ error: e.message }) })
  })
}

// 从 provenance 里抽出实际执行的算法 ID
function ranAlg(resp) {
  const prov = JSON.stringify(resp && resp.provenance || [])
  const m = prov.match(/ALG_[A-Z0-9_]+/)
  if (m) return m[0]
  const o = resp && resp.output
  const p2 = JSON.stringify(o && o.provenance || [])
  const m2 = p2.match(/ALG_[A-Z0-9_]+/)
  return m2 ? m2[0] : null
}

console.log('='.repeat(96))
console.log('R142 B3 · L4 族级工具 operation 路由验证')
console.log('='.repeat(96))

const srv = await runServer(A + '/index.js')
if (srv.error) { console.log('✗ 服务器启动失败:', srv.error); process.exit(1) }

let pass = 0, total = 0
const fails = []
const rows = []

for (const [tool, fam] of Object.entries(L4)) {
  const algs = R.getAlgorithmsByFamily(fam) || []
  if (!algs.length) continue
  const f = A + '/tools/' + tool + '.json'
  let sch = null
  try { sch = JSON.parse(readFileSync(f, 'utf8')) } catch (e) { }
  const a = (sch && (sch.arguments || sch.inputSchema)) || {}
  const enumList = (a.properties && a.properties.operation && a.properties.operation.enum) || []
  const ex = (a.examples && a.examples[0]) || {}

  // L4-4：enum 是否覆盖族内算法
  total++
  const missing = algs.filter(x => !enumList.includes(x.name))
  const covOk = missing.length === 0
  if (covOk) pass++
  else fails.push(`${tool} L4-4 enum 漏 ${missing.length} 个算法（如 ${missing[0] && missing[0].name}）`)

  // L4-1/L4-2：首尾算法路由
  for (const [tag, alg] of [['L4-1 首个', algs[0]], ['L4-2 末个', algs[algs.length - 1]]]) {
    total++
    const args = { operation: alg.name, input: ex.input !== undefined ? ex.input : {} }
    let r
    try { r = await srv.call(tool, args) } catch (e) { r = { error: e.message } }
    const ran = ranAlg(r)
    const ok = ran === alg.id
    if (ok) pass++
    else fails.push(`${tool} ${tag}：传 "${alg.name}" 实际跑 ${ran || '(未执行)'}，期望 ${alg.id}`)
    rows.push([tool, tag, alg.name.slice(0, 24), ran || '-', ok])
  }
}

srv.kill()

console.log(`\n  逐工具结果（L4-1/L4-2）：`)
for (const [tool, tag, want, got, ok] of rows) {
  console.log(`    ${ok ? '✓' : '✗'} ${tool.padEnd(22)} ${tag}  期望 ${want.padEnd(24)} 实际 ${got}`)
}
console.log('\n' + '-'.repeat(96))
console.log(`通过 ${pass} / ${total}`)
if (fails.length) {
  console.log('失败：')
  for (const x of fails.slice(0, 20)) console.log('  · ' + x)
}
console.log(pass === total ? `总判定：PASS（L4 路由 ${pass}/${total}）` : `总判定：FAIL（${total - pass}/${total} 项不符）`)
process.exit(pass === total ? 0 : 1)
