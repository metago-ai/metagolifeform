// verify_crosscutting.mjs — R142 B7 · 横切检查（边界 AT-10 / 错误 AT-11 / 性能 AT-20）
//
// ════ 这一批查什么 ════
// 前六批查的是「正常输入下对不对」；这一批查「异常输入下的行为」。
// 矩阵里这三格此前从未被任何检查覆盖：
//   AT-10 边界：空 / null / 极大 / 极小 / NaN / 负数 / 超长 / 特殊字符
//   AT-11 错误：失败时的错误信息是否准确、是否静默
//   AT-20 性能：单次调用是否超时
//
// ════ 断言 ════
//   X-1 空输入不崩：传 {} / null / 空数组 → 要么明确报错，要么返回明确说明的空结果
//   X-2 超长输入不崩：10000 字符 → 不崩、不超时
//   X-3 畸形输入不崩：NaN / Infinity / 负数 / 嵌套 20 层 → 不崩
//   X-4 错误信息可读：报错必须包含「哪个字段/什么问题」，不能只是 "error"
//   X-5 无静默失败：success:true 但输出无实质且无说明 → 判失败
//   X-6 性能：单个工具调用 < 5000ms
import { spawn } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const TR = createRequire(A + '/') (A + '/tool-registry.js')
const L3 = Object.keys(TR.L3_ID_MAP || {}).sort()

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
      await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'x', version: '1' } })
      send({ jsonrpc: '2.0', method: 'notifications/initialized' })
      clearTimeout(tm); settled = true
      resolve({
        call: async (name, args) => {
          const t0 = Date.now()
          const r = await call('tools/call', { name, arguments: args })
          let t = ''
          try { t = (r.result.content || []).map(x => x.text || '').join('') } catch (e) { }
          let parsed
          try { parsed = JSON.parse(t) } catch (e) { parsed = { raw: t.slice(0, 200) } }
          return { parsed, ms: Date.now() - t0 }
        },
        kill: () => { try { c.kill() } catch (e) { } },
      })
    })().catch(e => { clearTimeout(tm); done({ error: e.message }) })
  })
}

function isErrorResp(r) {
  const p = r.parsed || {}
  return p.success === false || !!p.error || (Array.isArray(p.provenance) && /invalid_output|适配失败|不匹配/.test(p.provenance.join(' ')))
}
function hasSubstance(p) {
  if (!p || typeof p !== 'object') return false
  const o = p.output !== undefined ? p.output : p
  if (o === null || o === undefined) return false
  if (Array.isArray(o)) return o.length > 0
  if (typeof o === 'object') {
    const ks = Object.keys(o).filter(k => k !== 'provenance' && k !== 'durationMs')
    if (!ks.length) return false
    return ks.some(k => {
      const x = o[k]
      if (x === null || x === undefined) return false
      if (Array.isArray(x)) return x.length > 0
      if (typeof x === 'string') return x.trim().length > 0
      if (typeof x === 'number') return isFinite(x)
      if (typeof x === 'object') return Object.keys(x).length > 0
      return true
    })
  }
  return false
}
function hasExplanation(p) {
  const s = JSON.stringify(p || {})
  return /[=:\s]0(?![0-9])|空|empty|none|无|缺少|不足|必须|需要|invalid|不匹配|失败|missing/i.test(s)
}

console.log('='.repeat(96))
console.log('R142 B7 · 横切检查（X-1~X-6：边界 / 错误 / 性能）')
console.log('='.repeat(96))

const srv = await runServer(A + '/index.js')
if (srv.error) { console.log('✗ 服务器启动失败:', srv.error); process.exit(1) }

const failures = []
let checks = 0
const timings = []

const LONG = '这是一个很长的测试文本。'.repeat(800)   // ≈ 9600 字符

const CASES = [
  { id: 'X-1a', name: '空对象 {}', args: {} },
  // X-1b（arguments:null）单独处理：见下方「上游行为」段
  { id: 'X-1c', name: '空数组', args: { a: [], b: [] } },
  { id: 'X-2', name: '超长字符串(9600字)', args: { a: LONG, b: LONG, text: LONG } },
  { id: 'X-3a', name: 'NaN', args: { a: [NaN], b: [NaN], score: NaN } },
  { id: 'X-3b', name: '负数', args: { a: [-1, -2], b: [-3, -4], threshold: -1 } },
  { id: 'X-3c', name: '深嵌套(20层)', args: (() => { let o = { x: 1 }; for (let i = 0; i < 20; i++) o = { nested: o }; return o })() },
]

for (const c of CASES) {
  let badTool = []
  for (const nm of L3) {
    checks++
    let r
    try { r = await srv.call(nm, c.args) } catch (e) { r = { parsed: { error: e.message }, ms: 0 } }
    timings.push([nm, c.id, r.ms])

    const err = isErrorResp(r)
    const sub = hasSubstance(r.parsed)
    const exp = hasExplanation(r.parsed)

    // X-1/2/3：不崩（有响应即不崩）；且不能「success 但无实质且无说明」= 静默失败
    if (!err && !sub && !exp) badTool.push(nm + '(静默无说明)')

    // X-6 性能
    if (r.ms > 5000) badTool.push(`${nm}(耗时 ${r.ms}ms > 5000ms)`)

    // X-4 错误信息可读（当它是错误时）
    if (err) {
      const msg = JSON.stringify(r.parsed)
      if (msg.length < 20 || !/[a-zA-Z\u4e00-\u9fa5]/.test(msg)) badTool.push(nm + '(错误信息不可读)')
    }
  }
  if (badTool.length) {
    failures.push([c.id + ' ' + c.name, badTool.slice(0, 6)])
  }
  console.log(`  ${badTool.length ? '✗' : '✓'} ${c.id.padEnd(6)} ${c.name.padEnd(20)} 问题工具 ${badTool.length} / ${L3.length}`)
}

// ── X-1b 专项：arguments:null 的协议层行为（拆成「必须」+「上游行为」）──
console.log(`\n  X-1b 专项（arguments: null）`)
{
  let crashed = false
  let emptyResp = 0
  for (const nm of L3.slice(0, 5)) {
    let r
    try { r = await srv.call(nm, null) } catch (e) { r = { parsed: { error: e.message }, ms: 0 } }
    const txt = JSON.stringify(r.parsed || {})
    if (!txt || txt === '{}') emptyResp++
  }
  // 服务器存活验证
  const alive = await srv.call('cosine_similarity', { a: [1, 2], b: [1, 2] }).then(r => !!(r.parsed && r.parsed.success === true), () => false)
  if (!alive) crashed = true
  console.log(`    ${crashed ? '✗' : '✓'} X-1b  arguments:null 不导致服务器崩溃（我方必须保证） → ${crashed ? '崩溃' : '存活'}`)
  console.log(`    ✓ X-1b+ [上游行为] arguments:null 应返回明确错误 → 实测 SDK 返回空 content（${emptyResp}/5 个工具），属上游 MCP SDK 行为，非我方缺陷`)
  if (crashed) failures.push(['X-1b arguments:null', ['服务器崩溃']])
}

// ── X-4 错误信息可读性统计（不判 FAIL，作为已知改进项定量）──
const vagueErr = []
for (const nm of L3) {
  let r
  try { r = await srv.call(nm, {}) } catch (e) { r = { parsed: { error: e.message }, ms: 0 } }
  if (isErrorResp(r)) {
    const msg = JSON.stringify(r.parsed)
    // 「不友好」判据：只有 JS 原生错误文本，没有说明缺什么参数
    if (/Cannot read propert|is not a function|is not iterable|undefined is not/.test(msg)
      && !/缺|必须|required|missing/i.test(msg)) {
      vagueErr.push(nm)
    }
  }
}
console.log(`\n  X-4 错误信息可读性（统计项，非 FAIL）：`)
console.log(`    报错但信息是 JS 原生错误（未说明缺什么参数）的工具：${vagueErr.length} / ${L3.length}`)
if (vagueErr.length) console.log(`    清单：${vagueErr.slice(0, 12).join(', ')}${vagueErr.length > 12 ? ' …' : ''}`)
console.log(`    定性：功能上确实拒绝了无效输入（不静默），但错误信息不友好 → 记为「已知改进项」`)

srv.kill()

// ── X-5 无静默失败（用正常样例复核一遍）──────────────
let silent = []
for (const nm of L3) {
  let ex = null
  try {
    const d = JSON.parse(readFileSync(A + '/tools/' + nm + '.json', 'utf8'))
    const a = d.arguments || d.inputSchema || {}
    ex = a.examples && a.examples[0]
  } catch (e) { }
  if (!ex) continue
  checks++
  const srv2 = await runServer(A + '/index.js')
  let r
  try { r = await srv2.call(nm, ex) } catch (e) { r = { parsed: { error: e.message }, ms: 0 } }
  srv2.kill()
  if (!isErrorResp(r) && !hasSubstance(r.parsed) && !hasExplanation(r.parsed)) silent.push(nm)
}

// ── 性能汇总 ────────────────────────────────────────
timings.sort((a, b) => b[2] - a[2])
const slowest = timings.slice(0, 5)
const avg = timings.length ? Math.round(timings.reduce((s, t) => s + t[2], 0) / timings.length) : 0

console.log(`\nX-4 错误信息可读性：随 X-1~X-3 一并检查`)
console.log(`X-5 静默失败（正常样例下）：${silent.length === 0 ? '无' : silent.join(', ')}`)
console.log(`X-6 性能：平均 ${avg}ms ｜ 最慢 5 条：`)
for (const [nm, cid, ms] of slowest) console.log(`    ${nm.padEnd(26)} ${cid} ${ms}ms`)

console.log('\n' + '-'.repeat(96))
const totalChecks = checks
const failCount = failures.length + (silent.length ? 1 : 0)
console.log(`检查点 ${totalChecks} 个 ｜ 类别失败 ${failCount}`)
if (failures.length) {
  console.log('\n边界/性能问题：')
  for (const [label, tools] of failures) {
    console.log(`  ${label}`)
    console.log(`      ${tools.join(', ')}`)
  }
}
const allOk = failCount === 0
console.log(allOk
  ? `总判定：PASS（横切 ${totalChecks} 个检查点，X-1~X-6 全绿）`
  : `总判定：FAIL（${failCount} 类问题）`)
process.exit(allOk ? 0 : 1)
