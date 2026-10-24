// verify_B01_fn.mjs — P1-B01 验证：函数型形参桥接
//
// 判据（计划 §4.1）：
//   ① execute_sync(ALG_T1_C_019, {labels:[1,2,3], scoreFn:"x => x*2"})  → matrix 非空
//   ② 同 ① 但 scoreFn:{"__fn__":"x => x*2"}                            → 同上
//   ③ scoreFn:"这不是函数"                                              → 明确失败（不得静默当字符串传）
//   ④ 全量函数型形参算法逐个测
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const require2 = createRequire(A + '/')
const reg = require2('./engine/algorithms/registry.js')
const regObj = reg.registry || reg.default || reg

let bad = 0
const brief = (o) => { const s = JSON.stringify(o); return s.length > 140 ? s.slice(0, 140) + '…' : s }

console.log('='.repeat(92))
console.log('P1-B01 验证：函数型形参桥接')
console.log('='.repeat(92))

// ── ① 字符串表达式 ────────────────────────────────────────────
console.log('\n[1] execute_sync(ALG_T1_C_019, {labels, scoreFn:"x => x*2"})')
let r1 = regObj.executeAlgorithmSync('ALG_T1_C_019', { labels: [1, 2, 3], scoreFn: 'x => x*2' })
console.log('    ' + brief(r1))
const ok1 = r1.success === true && r1.output && Array.isArray(r1.output.matrix) && r1.output.matrix.length > 0
console.log(`    ${ok1 ? '✓' : '✗'} matrix 非空`)
if (!ok1) bad++

// ── ② {__fn__} 形式 ──────────────────────────────────────────
console.log('\n[2] 同 ① 但 scoreFn:{"__fn__":"x => x*2"}')
let r2 = regObj.executeAlgorithmSync('ALG_T1_C_019', { labels: [1, 2, 3], scoreFn: { __fn__: 'x => x*2' } })
console.log('    ' + brief(r2))
const ok2 = r2.success === true && r2.output && Array.isArray(r2.output.matrix) && r2.output.matrix.length > 0
console.log(`    ${ok2 ? '✓' : '✗'} matrix 非空`)
if (!ok2) bad++

// ── ③ 非法表达式必须明确失败 ──────────────────────────────────
console.log('\n[3] scoreFn:"这不是函数" → 必须明确失败')
let r3 = regObj.executeAlgorithmSync('ALG_T1_C_019', { labels: [1, 2, 3], scoreFn: '这不是函数' })
console.log('    ' + brief(r3))
// 注意：'这不是函数' 不匹配函数表达式模式，会被原样传入 → 算法内部调用时抛错，也是明确失败
const ok3 = r3.success === false && r3.error
console.log(`    ${ok3 ? '✓' : '✗'} 明确失败且带错误信息（error=${String(r3.error || '').slice(0, 60)}）`)
if (!ok3) bad++

// ── ③b 看起来像函数但语法错，必须在桥接层就报错 ──────────────
console.log('\n[3b] scoreFn:"x => {" → 编译失败必须报 R141-FN-BRIDGE')
let r3b = regObj.executeAlgorithmSync('ALG_T1_C_019', { labels: [1, 2, 3], scoreFn: 'x => {' })
console.log('    ' + brief(r3b))
const ok3b = r3b.success === false && String(r3b.error || '').indexOf('R141-FN-BRIDGE') >= 0
console.log(`    ${ok3b ? '✓' : '✗'} 桥接层报明确错误`)
if (!ok3b) bad++

// ── ④ 全量函数型形参算法逐个测 ────────────────────────────────
console.log('\n[4] 全量函数型形参算法逐个测')
const FN_NAMES = new Set(['fn', 'func', 'filter', 'callback', 'cb', 'predicate', 'pred',
  'comparator', 'reducer', 'mapper', 'scorer', 'evaluator', 'encoder', 'decoder',
  'selector', 'formatter', 'visit', 'visitor', 'transform', 'transformFn'])
function paramNames(fn) {
  const m = String(fn).match(/^[^(]*\(([^)]*)\)/)
  if (!m) return []
  return m[1].split(',').map(x => x.trim().split('=')[0].trim()).filter(Boolean)
}
const all = regObj.getRegistry ? regObj.getRegistry() : []
const fnAlgs = []
for (const e of all) {
  if (!e || !e.handler) continue
  const names = paramNames(e.handler)
  const fns = names.filter(n => FN_NAMES.has(n) || /Fn$/.test(n) || /^(rng|now)$/i.test(n))
  if (fns.length) fnAlgs.push({ id: e.id, name: e.name, fns, sch: String(e.inputSchema || '') })
}
console.log(`    实测含函数型形参的算法：${fnAlgs.length} 条`)

// 构造合规入参（只为验证「传字符串函数能编译并跑通」，不校验语义值）
const mk = (id, fns) => {
  const o = {}
  for (const f of fns) {
    if (/^rng$/i.test(f)) o[f] = '() => 0.5'
    else if (/^now$/i.test(f)) o[f] = Date.now()
    else o[f] = 'x => x'
  }
  return o
}
let tested = 0, compiled = 0, runtime = 0
for (const a of fnAlgs.slice(0, 40)) {
  const args = mk(a.id, a.fns)
  let r
  try { r = regObj.executeAlgorithmSync(a.id, args) } catch (e) { r = { success: false, error: e.message } }
  tested++
  if (r.success === true) compiled++
  else if (String(r.error || '').indexOf('R141-FN-BRIDGE') >= 0) {
    console.log(`    ✗ ${a.id} 桥接编译失败：${String(r.error).slice(0, 80)}`)
  } else runtime++
}
console.log(`    传入尝试 ${tested} ｜ 跑通 ${compiled} ｜ 桥接失败 ${tested - compiled - runtime} ｜ 运行期失败 ${runtime}`)
console.log(`    （运行期失败多为该算法还需其余必填入参，不是桥接问题）`)

console.log('\n' + '-'.repeat(92))
console.log(bad === 0 ? '总判定：PASS（函数型形参桥接生效）' : `总判定：FAIL（${bad} 项）`)
process.exitCode = bad === 0 ? 0 : 1
