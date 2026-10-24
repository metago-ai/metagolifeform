// verify_examples_exec.mjs — K17 · 全 57 工具按官方 examples 实调
//
// ════ 为什么必须有这一层（第六轮复检点出）════
// 我原有的 `audit_by_examples.mjs` 只覆盖 30 个 L3 工具。
// **L4 的 20 个族级工具从未做过 examples 实调** —— creation_create 的
// 「examples 写 "rng":"Math.random" 但函数桥接的 preset 走不到」就是从这个缝里漏过去的。
//
// 复检说得对：verify-package.cjs 仍是 K1–K16，没有「examples 可执行性」这一条。
//
// ════ 判据 ════
// 对全部 57 个工具，用各自的 examples[0] 通过 MCP 工具层实调：
//   E-1 调用成功（success === true）
//   E-2 输出有实质（非空壳；合法的「查了没有」须 provenance 或字段名表达「无」）
//   E-3 无脏数（不含 NaN / Infinity）
//
// ════ 分类（如实报出，不隐瞒）════
//   OK             成功且输出有意义
//   LEGIT_EMPTY    成功但输出为空/零 —— 若是「合法零值」（如相同输入的漂移=0）则通过
//   NONTRIVIAL_SUSPECT  examples 本身语义可疑（占位值填充），标注但单独统计
//   FAIL_EXEC      调用失败 —— 真缺陷
import { spawn } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'

function runServer(script) {
  return new Promise((resolve) => {
    const c = spawn(process.execPath, [script], { stdio: ['pipe', 'pipe', 'pipe'] })
    let b = '', i = 0
    const p = new Map()
    let settled = false
    const done = (v) => { if (settled) return; settled = true; resolve(v) }
    const tm = setTimeout(() => done({ error: 'timeout' }), 180000)
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
      await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'k17', version: '1' } })
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

function findBad(v, path = '') {
  if (typeof v === 'number') return isFinite(v) ? null : `${path || '根'}=${v}`
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) { const r = findBad(v[i], `${path}[${i}]`); if (r) return r }
    return null
  }
  if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) { const r = findBad(v[k], path ? `${path}.${k}` : k); if (r) return r }
    return null
  }
  return null
}

function isEmptyShell(v) {
  if (v === null || v === undefined) return true
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') {
    const ks = Object.keys(v).filter(k => k !== 'provenance' && k !== 'durationMs' && k !== 'algorithmFamily')
    if (!ks.length) return true
    return ks.every(k => {
      const x = v[k]
      if (x === null || x === undefined) return true
      if (Array.isArray(x)) return x.length === 0
      if (typeof x === 'object') return Object.keys(x).length === 0
      if (typeof x === 'number') return x === 0
      return false
    })
  }
  return false
}

console.log('='.repeat(96))
console.log('K17 · 全 57 工具按官方 examples 实调')
console.log('='.repeat(96))

const files = readdirSync(A + '/tools').filter(f => f.endsWith('.json')).sort()
const srv = await runServer(A + '/index.js')
if (srv.error) { console.log('✗ 服务器启动失败:', srv.error); process.exit(1) }

const rows = []
for (const f of files) {
  const nm = f.replace(/\.json$/, '')
  let d, ex
  try {
    d = JSON.parse(readFileSync(`${A}/tools/${f}`, 'utf8'))
    const a = d.arguments || d.inputSchema || {}
    ex = (Array.isArray(a.examples) && a.examples[0]) ? a.examples[0] : null
  } catch (e) { }
  if (!ex) { rows.push({ nm, st: 'NO_EXAMPLE', why: '无 examples' }); continue }

  let r
  try { r = await srv.call(nm, ex) } catch (e) { r = { error: e.message } }

  if (!(r && r.success === true)) {
    const err = String((r && (r.error || r.reason)) || JSON.stringify(r).slice(0, 80))
    rows.push({ nm, st: 'FAIL_EXEC', why: err.slice(0, 90) })
    continue
  }

  const o = r.output !== undefined ? r.output : r
  const bad = findBad(o)
  if (bad) { rows.push({ nm, st: 'FAIL_EXEC', why: '含脏数 ' + bad }); continue }

  if (isEmptyShell(o)) {
    // 合法零值判定：provenance 或字段名表达了「无」
    const prov = JSON.stringify((o && o.provenance) || [])
    const keys = (o && typeof o === 'object' && !Array.isArray(o)) ? Object.keys(o).filter(k => k !== 'provenance') : []
    const semantic = /conflict|tradeoff|vulnerab|missing|circular|error|issue|anomal|orphan|violation|gap|risk|empty|none|无|空/i
    const legit = /[=:\s]0(?![0-9])|空|empty|none|无/.test(prov) || (keys.length >= 2 && keys.every(k => semantic.test(k)))
    rows.push({ nm, st: legit ? 'LEGIT_EMPTY' : 'SUSPECT_EMPTY', why: JSON.stringify(o).slice(0, 70) })
    continue
  }

  rows.push({ nm, st: 'OK', why: '' })
}
srv.kill()

const by = {}
for (const r of rows) (by[r.st] = by[r.st] || []).push(r)

console.log(`\n工具总数 ${rows.length}`)
for (const [k, v] of Object.entries(by).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${k.padEnd(18)} ${String(v.length).padStart(2)}`)
}

const fail = by['FAIL_EXEC'] || []
const suspect = by['SUSPECT_EMPTY'] || []
const noex = by['NO_EXAMPLE'] || []
const legitEmpty = by['LEGIT_EMPTY'] || []

if (fail.length) {
  console.log('\n❌ FAIL_EXEC（调用失败 —— 真缺陷）：')
  for (const x of fail) console.log(`  ${x.nm.padEnd(28)} ${x.why}`)
}
if (suspect.length) {
  console.log('\n⚠️  SUSPECT_EMPTY（成功但输出全空/全零，且无说明 —— 需逐个定性）：')
  for (const x of suspect) console.log(`  ${x.nm.padEnd(28)} ${x.why}`)
}
if (legitEmpty.length) {
  console.log('\n◎ LEGIT_EMPTY（合法零值/合法空结果 —— 通过）：')
  for (const x of legitEmpty) console.log(`  ${x.nm.padEnd(28)} ${x.why}`)
}
if (noex.length) {
  console.log('\n⚠️  无 examples：')
  for (const x of noex) console.log(`  ${x.nm}`)
}

console.log('\n' + '-'.repeat(96))
const allOk = fail.length === 0 && suspect.length === 0 && noex.length === 0
console.log(allOk
  ? `总判定：PASS（K17：${rows.length}/${rows.length} 工具按 examples 实调通过）`
  : `总判定：FAIL（失败 ${fail.length} ｜ 可疑 ${suspect.length} ｜ 无样例 ${noex.length}）`)
process.exit(allOk ? 0 : 1)
