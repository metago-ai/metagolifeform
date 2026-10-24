// scan_prompts_and_atoms.mjs — U-08（8 prompts）+ U-07（597 原子）扫描
//
// U-08 判据：prompts/get 返回的内容必须实质（有文本、有结构），不能是空壳或纯占位
// U-07 判据：597 条契约里，有多少条对应真实可执行的原子实现
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const H = 'D:/DSH-Official/home'
const NPM = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai'

// ── U-08：8 prompts ───────────────────────────────────────────
function runForPrompts(script) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], { stdio: ['pipe', 'pipe', 'pipe'] })
    let buf = ''
    let id = 0
    const pending = new Map()
    let settled = false
    const done = (v) => { if (settled) return; settled = true; try { child.kill() } catch (e) { } resolve(v) }
    const timer = setTimeout(() => done({ error: 'timeout' }), 180000)
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
      await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'scan', version: '1' } })
      send({ jsonrpc: '2.0', method: 'notifications/initialized' })
      const pl = await call('prompts/list', {})
      const prompts = (pl.result && pl.result.prompts) || []
      const out = []
      for (const p of prompts) {
        const args = {}
        for (const a of (p.arguments || [])) args[a.name] = '测试输入'
        let r
        try { r = await Promise.race([call('prompts/get', { name: p.name, arguments: args }), new Promise(res => setTimeout(() => res({ timeout: true }), 8000))]) }
        catch (e) { r = { error: e.message } }
        let text = ''
        try {
          const msgs = (r.result && r.result.messages) || []
          text = msgs.map(m => (m.content && m.content.text) || '').join('\n')
        } catch (e) { }
        out.push({ name: p.name, desc: String(p.description || '').slice(0, 70), argCount: (p.arguments || []).length, len: text.length, head: text.slice(0, 200) })
      }
      clearTimeout(timer)
      done({ prompts: out })
    })().catch(e => { clearTimeout(timer); done({ error: e.message }) })
  })
}

console.log('='.repeat(92))
console.log('U-08：metago 的 8 个 prompts')
console.log('='.repeat(92))
const pr = await runForPrompts(NPM + '/mcp-server/dist/index.js')
if (pr.error) { console.log('  ✗ 失败:', pr.error) }
else {
  let bad = 0
  for (const p of pr.prompts) {
    const ok = p.len >= 50
    if (!ok) bad++
    console.log(`  ${ok ? '✓' : '✗'} ${p.name.padEnd(34)} ${String(p.len).padStart(5)} B  参数 ${p.argCount}`)
  }
  console.log(`\n  合计 ${pr.prompts.length} 个 ｜ 实质（≥50 B）${pr.prompts.length - bad} ｜ 不足 ${bad}`)
}

// ── U-07：597 原子 ────────────────────────────────────────────
console.log('\n' + '='.repeat(92))
console.log('U-07：597 原子契约的实现覆盖')
console.log('='.repeat(92))

// 找原子清单
const CAND = [
  H + '/metago/blueprint/元构初始文档/附录卷-原子契约补全-V36.11.md',
  H + '/packages/engine/ATOMS.md',
  NPM + '/engine/CORE/ATOMS.md',
]
let atomFile = null
for (const c of CAND) { if (existsSync(c)) { atomFile = c; break } }
console.log('  契约文件:', atomFile || '未找到')

let contractCount = 0
if (atomFile) {
  const t = readFileSync(atomFile, 'utf8')
  const ids = new Set([...t.matchAll(/\bATOM_[A-Z0-9_]+\b/g)].map(m => m[0]))
  contractCount = ids.size
  const prefixes = {}
  for (const id of ids) {
    const p = id.split('_')[1] || '?'
    prefixes[p] = (prefixes[p] || 0) + 1
  }
  console.log(`  契约唯一原子 ID：${contractCount}`)
  console.log('  按域分布：', JSON.stringify(prefixes))
}

// 找实现：K1 提到「原子匹配 50/50」——查 verify-package 怎么算的
console.log('\n  实现侧：查 verify-package 的 K1 判据')
const vp = readFileSync(H + '/scripts/verify-package.cjs', 'utf8')
const i = vp.indexOf('K1')
const seg = vp.slice(Math.max(0, i - 300), i + 1600)
for (const line of seg.split('\n')) {
  if (/ATOM|atom|contract|契约|K1/.test(line)) console.log('    ' + line.trim().slice(0, 110))
}

writeFileSync('D:/metago-build/prompts_atoms_scan.json', JSON.stringify({ prompts: pr.prompts || [], contractCount }, null, 1), 'utf8')
console.log('\n已写出 D:/metago-build/prompts_atoms_scan.json')
