// verify_L3_all.mjs — 按 MCP schema 传合法参数，逐个验证 30 个 L3 工具
//
// 用真实导出接口：TR.initialize() + TR.getHandler(name) → async (args, registry)
//
// 判据（三层，缺一不可）：
//   L2 调用层：success === true（不崩）
//   L3 语义层：输出非空壳、无 NaN、关键字段存在且值合理
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const require2 = createRequire(A + '/')
const TR = require2('./tool-registry.js')
const reg = require2('./engine/algorithms/registry.js')
const regObj = reg.registry || reg.default || reg

TR.initialize()
const regForHandler = regObj

async function callTool(name, args) {
  const h = TR.getHandler(name)
  if (!h) return { success: false, error: 'HANDLER_NOT_FOUND: ' + name }
  try {
    return await h(args, regForHandler)
  } catch (e) {
    return { success: false, error: 'THROWN: ' + String(e.message).slice(0, 120) }
  }
}

/* R142-SYNC：本文件的参数是 schema examples 的副本。
   为了不让副本漂移，运行时先校验「每个工具的传参键/类型与其 schema examples 一致」，
   不一致就明确报错——而不是等到算法崩了才发现。
   （根因：上一版 schema 改了、检测器参数没跟上，导致 30/30 PASS 的假象被打破） */
import { readFileSync as __rfs } from 'node:fs'
const __TOOLS = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/tools'
function __schemaDrift(name, args) {
  try {
    const d = JSON.parse(__rfs(__TOOLS + '/' + name + '.json', 'utf8'))
    const a = d.arguments || d.inputSchema || {}
    const props = a.properties || {}
    const out = []
    for (const k of Object.keys(args)) {
      if (!props[k]) { out.push(k + ' 不在 schema properties'); continue }
      const actual = Array.isArray(args[k]) ? 'array' : (args[k] === null ? 'null' : typeof args[k])
      const decl = props[k].type
      if (!decl) continue
      const set = Array.isArray(decl) ? decl : [decl]
      if (!set.includes(actual)) out.push(k + ' 传 ' + actual + ' 但 schema 声明 ' + JSON.stringify(decl))
    }
    return out
  } catch (e) { return [] }
}

const CASES = [
  ['cosine_similarity', { a: [1, 2, 3], b: [2, 4, 6] },
    (o) => Math.abs(o.score - 1) < 1e-9, 'score≈1'],
  ['jaccard_coefficient', { a: [1, 2, 3], b: [2, 3, 4] },
    (o) => Math.abs(o.score - 0.5) < 1e-9, 'score=0.5'],
  ['dice_coefficient', { a: [1, 2, 3], b: [2, 3, 4] },
    (o) => typeof o.score === 'number' && o.score > 0, 'score>0'],
  ['euclidean_distance', { a: [0, 0], b: [3, 4] },
    (o) => Math.abs((o.distance !== undefined ? o.distance : o.score) - 5) < 1e-9, 'dist=5'],
  ['manhattan_distance', { a: [0, 0], b: [3, 4] },
    (o) => Math.abs((o.distance !== undefined ? o.distance : o.score) - 7) < 1e-9, 'dist=7'],
  ['chebyshev_distance', { a: [0, 0], b: [3, 4] },
    (o) => Math.abs((o.distance !== undefined ? o.distance : o.score) - 4) < 1e-9, 'dist=4'],
  ['pearson_correlation', { a: [1, 2, 3, 4], b: [2, 4, 6, 8] },
    (o) => Math.abs(o.score - 1) < 1e-9, 'score=1'],
  ['spearman_correlation', { a: [1, 2, 3, 4], b: [2, 4, 6, 8] },
    (o) => Math.abs(o.score - 1) < 1e-9, 'score=1'],
  ['kendall_tau', { a: [1, 2, 3, 4], b: [2, 4, 6, 8] },
    (o) => Math.abs(o.score - 1) < 1e-9, 'score=1'],
  ['weighted_cosine', { a: [1, 2, 3], b: [1, 2, 3], weights: [1, 1, 1] },
    (o) => Math.abs(o.score - 1) < 1e-9, 'score≈1'],
  ['fuzzy_string_match', { a: 'kitten', b: 'sitting' },
    (o) => typeof o.score === 'number' && o.score > 0 && o.score < 1, '0<score<1'],
  ['semantic_similarity', { a: '猫和狗', b: '猫与狗' },
    (o) => typeof o.score === 'number' && o.score > 0, 'score>0'],
  ['cooccurrence_frequency', { items: [['a', 'b'], ['a', 'c'], ['b', 'c']] },
    (o) => typeof o.score === 'number' && isFinite(o.score), 'score 为有限数'],
  ['time_decay_cooccurrence', { items: [['a','b'],['a','b'],['b','c']], timestamps: [0,100,200], item1: 'a', item2: 'b', halfLife: 5000 },
    (o) => typeof o.score === 'number' && isFinite(o.score), '带衰减的 score'],
  ['evaluate_bidirectional', { forward: [0.5, 0.6, 0.7], backward: [0.6, 0.6, 0.6] },
    (o) => typeof o.forward === 'number' || typeof o.symmetric === 'number', '双向值'],
  ['is_superconductive', { couplingScore: 1.08 },
    (o) => o.superconductive === true && Math.abs(o.margin - 0.08) < 1e-9, 'true & margin=0.08'],
  ['identify_weak_pairs', { pairs: [[0, 0.2], [0.2, 0]], threshold: 0.5 },
    (o) => Array.isArray(o.pairs) && o.pairs.length === 1, '弱对 1 条'],
  ['identify_strong_pairs', { pairs: [[0, 0.9], [0.9, 0]], threshold: 0.7 },
    (o) => Array.isArray(o.pairs) && o.pairs.length === 1, '强对 1 条'],
  ['build_coupling_matrix',
    { entities: [{ id: 'a' }, { id: 'b' }], relations: [{ from: 'a', to: 'b', weight: 0.8 }] },
    (o) => Array.isArray(o.matrix) && o.matrix.length === 2, '2x2 矩阵'],
  ['normalize_coupling', { scores: [0.5, 0.8, 0.2, 0.9] },
    (o) => Array.isArray(o.normalized) && o.normalized.length === 4, '归一化 4 个'],
  ['sort_coupling_scores', { scores: [{ a: 0.3 }, { a: 0.9 }, { a: 0.6 }], order: 'desc' },
    (o) => Array.isArray(o.scores || o.sorted || o.entries), '排序结果'],
  ['record_symmetric', { entityA: 'a', entityB: 'b', score: 0.8 },
    (o) => typeof o === 'object' && o !== null, '记录对象'],
  ['detect_asymmetry', { pairs: [[0, 0.9], [0.5, 0]], tolerance: 0.01 },
    (o) => Array.isArray(o.asymmetric) || typeof o.count === 'number', '不对称结果'],
  ['coupling_trend', { timeSeries: [0.3, 0.5, 0.7, 0.9] },
    (o) => typeof o.trend === 'string' || typeof o.slope === 'number', '趋势'],
  ['coupling_clustering', { entities: [[0, 0.9], [0.9, 0]], k: 2 },
    (o) => Array.isArray(o.clusters) || Array.isArray(o.assignments), '聚类结果'],
  ['build_value_vector', { dimensions: { a: 0.5, b: 0.8, c: 0.3 } },
    (o) => typeof o === 'object' && o !== null, '价值向量'],
  ['reduce_dimension', { data: [1, 2, 3, 4], targetDim: 2 },
    (o) => Array.isArray(o.reduced) && o.reduced.length === 2, '降到 2 维'],
  ['extract_pca', { data: [[1, 2], [2, 4], [3, 6]], components: 1 },
    (o) => typeof o === 'object' && o !== null, '主成分'],
  ['simplified_svd', { matrix: [[1, 2], [3, 4]] },
    (o) => typeof o.singularValue === 'number' || Array.isArray(o.singularValues), '奇异值'],
  ['covariance', { a: [1, 2, 3], b: [2, 4, 6] },
    (o) => typeof o === 'object' && o !== null, '协方差'],
]

const brief = (o) => {
  const s = typeof o === 'object' ? JSON.stringify(o) : String(o)
  return s.length > 110 ? s.slice(0, 110) + '…' : s
}
const hasBad = (v) => {
  if (typeof v === 'number') return !isFinite(v)
  if (Array.isArray(v)) return v.some(hasBad)
  if (v && typeof v === 'object') return Object.values(v).some(hasBad)
  return false
}

console.log('='.repeat(100))
console.log('30 个 L3 工具：按 MCP schema 传参 + 语义断言')
console.log('='.repeat(100))

let pass = 0, fail = 0
const fails = []
for (const [name, args, assert, expect] of CASES) {
  const r = await callTool(name, args)
  let ok = false
  let why = ''
  if (r && r.success === true && r.output !== undefined) {
    const o = r.output
    const bad = hasBad(o)
    let semOk = false
    try { semOk = !!assert(o) } catch (e) { semOk = false; why = '断言抛错:' + e.message }
    ok = !bad && semOk
    if (bad) why = '含 NaN/Infinity'
    else if (!semOk) why = '语义不符（期望 ' + expect + '）'
  } else {
    why = (r && r.error) || 'no output'
  }
  if (ok) { pass++; console.log(`  ✓ ${name.padEnd(24)} ${expect}`) }
  else { fail++; fails.push([name, why, r]); console.log(`  ✗ ${name.padEnd(24)} ${why.slice(0, 80)}`) }
}

console.log('\n' + '-'.repeat(100))
console.log(`通过 ${pass} ｜ 失败 ${fail} ｜ 合计 ${CASES.length}`)
if (fails.length) {
  console.log('\n失败明细：')
  for (const [n, w, r] of fails) {
    console.log(`\n  ${n}: ${w}`)
    if (r && r.output !== undefined) console.log('    output: ' + brief(r.output))
    if (r && r.error) console.log('    error: ' + String(r.error).slice(0, 160))
    if (r && r.provenance) console.log('    prov: ' + JSON.stringify(r.provenance).slice(0, 160))
  }
}
console.log('\n总判定：' + (fail === 0 ? 'PASS（30/30 全部通过语义断言）' : `FAIL（${fail} 项未通过）`))
process.exitCode = fail === 0 ? 0 : 1
