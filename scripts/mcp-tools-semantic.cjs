// mcp-tools-semantic.cjs — MCP 工具语义检测器（P1-B04 的落实）
//
// 为什么需要它：
//   原 mcp-tools-callable.cjs 只判 result.isError，于是
//   · {success:false, error:"..."} 被判 PASS（协议层没错）
//   · {success:true, output:{matrix:[]}} 空壳被判 PASS
//   → 4 个坏工具 + 1 个失效桥接全部漏过，「112/112 可调用」是假绿。
//
// 本检测器判据（三层，缺一不可）：
//   L2 调用层：success !== false 且无协议错误
//   L3 语义层：输出非空壳、无 NaN/Infinity
//   L3 断言层：关键字段存在且值满足该工具的数学性质（对已建模的工具）
//
// 同时自带「检测器有牙」自检：喂入已知错误样本，必须报 FAIL。
const path = require('node:path')
const { createRequire } = require('node:module')

const ALG = path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@metago-ai', 'algorithms')
const req = createRequire(path.join(ALG, 'index.js'))

let TR, reg, regObj
try {
  TR = req('./tool-registry.js')
  reg = req('./engine/algorithms/registry.js')
  regObj = reg.registry || reg.default || reg
  TR.initialize()
} catch (e) {
  console.log('[FATAL] 无法加载 tool-registry：' + e.message)
  process.exit(1)
}

// ── 语义断言表：工具名 → { args, check(output) } ─────────────────────
const CASES = {
  cosine_similarity: { args: { a: [1, 2, 3], b: [2, 4, 6] }, check: (o) => Math.abs(o.score - 1) < 1e-9 },
  jaccard_coefficient: { args: { a: [1, 2, 3], b: [2, 3, 4] }, check: (o) => Math.abs(o.score - 0.5) < 1e-9 },
  dice_coefficient: { args: { a: [1, 2, 3], b: [2, 3, 4] }, check: (o) => o.score > 0 },
  euclidean_distance: { args: { a: [0, 0], b: [3, 4] }, check: (o) => Math.abs((o.distance ?? o.score) - 5) < 1e-9 },
  manhattan_distance: { args: { a: [0, 0], b: [3, 4] }, check: (o) => Math.abs((o.distance ?? o.score) - 7) < 1e-9 },
  chebyshev_distance: { args: { a: [0, 0], b: [3, 4] }, check: (o) => Math.abs((o.distance ?? o.score) - 4) < 1e-9 },
  pearson_correlation: { args: { a: [1, 2, 3, 4], b: [2, 4, 6, 8] }, check: (o) => Math.abs(o.score - 1) < 1e-9 },
  spearman_correlation: { args: { a: [1, 2, 3, 4], b: [2, 4, 6, 8] }, check: (o) => Math.abs(o.score - 1) < 1e-9 },
  kendall_tau: { args: { a: [1, 2, 3, 4], b: [2, 4, 6, 8] }, check: (o) => Math.abs(o.score - 1) < 1e-9 },
  weighted_cosine: { args: { a: [1, 2, 3], b: [1, 2, 3], weights: [1, 1, 1] }, check: (o) => Math.abs(o.score - 1) < 1e-9 },
  fuzzy_string_match: { args: { a: 'kitten', b: 'sitting' }, check: (o) => o.score > 0 && o.score < 1 },
  semantic_similarity: { args: { a: '猫和狗', b: '猫与狗' }, check: (o) => typeof o.score === 'number' && o.score >= 0 },
  cooccurrence_frequency: { args: { items: [['a', 'b'], ['a', 'c'], ['b', 'c']] }, check: (o) => typeof o.score === 'number' || typeof o.frequency === 'number' },
  time_decay_cooccurrence: { args: { items: [['a','b'],['a','b'],['b','c']], timestamps: [0,100,200], item1: 'a', item2: 'b', halfLife: 5000 }, check: (o) => typeof o.score === 'number' && isFinite(o.score) },
  evaluate_bidirectional: { args: { forward: [0.5, 0.6, 0.7], backward: [0.6, 0.6, 0.6] }, check: (o) => typeof o.forward === 'number' || typeof o.symmetric === 'number' },
  is_superconductive: { args: { couplingScore: 1.08 }, check: (o) => o.superconductive === true && Math.abs(o.margin - 0.08) < 1e-9 },
  /* R142-STRONG：查 weak 的对必须 0 < w < threshold（实测 0.2 与 0.05 共 2 条）。 */
  identify_weak_pairs: {
    args: { pairs: [[0, 0.2, 0.05], [0.2, 0, 0.9], [0.05, 0.9, 0]], threshold: 0.3 },
    check: (o) => {
      const ps = o && o.pairs
      if (!Array.isArray(ps) || ps.length !== 2) return false
      const ws = ps.map(p => p[2]).sort((a, b) => a - b)
      if (!ws.every(w => typeof w === 'number' && w > 0 && w < 0.3)) return false
      return Math.abs(ws[0] - 0.05) < 1e-9 && Math.abs(ws[1] - 0.2) < 1e-9
    }
  },
  /* R142-STRONG：查阈值真的生效——返回的对必须全部 >= threshold。 */
  identify_strong_pairs: {
    args: { pairs: [[0, 0.95, 0.2], [0.95, 0, 0.1], [0.2, 0.1, 0]], threshold: 0.7 },
    check: (o) => {
      const ps = o && o.pairs
      if (!Array.isArray(ps) || ps.length !== 1) return false
      const w = ps[0][2]
      return typeof w === 'number' && w >= 0.7 - 1e-9 && Math.abs(w - 0.95) < 1e-9
    }
  },
  /* R142-STRONG：查数值（对角=1 / 非对角=权重 / 对称 / 无关=0）。
     原弱版只查「matrix 是长度 2 的数组」——算出全 3 或全 0 也照样 PASS。 */
  build_coupling_matrix: {
    args: { entities: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], relations: [{ from: 'a', to: 'b', weight: 0.8 }, { from: 'b', to: 'c', weight: 0.6 }] },
    check: (o) => {
      const m = o && o.matrix
      if (!Array.isArray(m) || m.length !== 3) return false
      const diagOk = m.every((row, i) => row[i] === 1)
      const abOk = Math.abs(m[0][1] - 0.8) < 1e-9
      const bcOk = Math.abs(m[1][2] - 0.6) < 1e-9
      const acOk = m[0][2] === 0
      const symOk = m.every((row, i) => row.every((v, j) => v === m[j][i]))
      return diagOk && abOk && bcOk && acOk && symOk
    }
  },
  /* R142-STRONG：查归一化后是否真的落在 [0,1] 且极值为 0/1。 */
  normalize_coupling: {
    args: { scores: [0.5, 0.8, 0.2, 0.9] },
    check: (o) => {
      const n = o && o.normalized
      if (!Array.isArray(n) || n.length !== 4) return false
      if (!n.every(x => typeof x === 'number' && isFinite(x) && x >= 0 && x <= 1)) return false
      return Math.abs(Math.min(...n) - 0) < 1e-9 && Math.abs(Math.max(...n) - 1) < 1e-9
    }
  },
  sort_coupling_scores: { args: { scores: [{ a: 0.3 }, { a: 0.9 }, { a: 0.6 }], order: 'desc' }, check: (o) => Array.isArray(o.scores || o.sorted || o.entries) },
  record_symmetric: { args: { entityA: 'a', entityB: 'b', score: 0.8 }, check: (o) => typeof o === 'object' && o !== null },
  detect_asymmetry: { args: { pairs: [[0, 0.9], [0.5, 0]], tolerance: 0.01 }, check: (o) => Array.isArray(o.asymmetric) || typeof o.count === 'number' },
  coupling_trend: { args: { timeSeries: [0.3, 0.5, 0.7, 0.9] }, check: (o) => typeof o.trend === 'string' || typeof o.slope === 'number' },
  coupling_clustering: { args: { entities: [[0, 0.9], [0.9, 0]], k: 2 }, check: (o) => Array.isArray(o.clusters) || Array.isArray(o.assignments) },
  build_value_vector: { args: { dimensions: { a: 0.5, b: 0.8, c: 0.3 } }, check: (o) => typeof o === 'object' && o !== null },
  reduce_dimension: { args: { data: [1, 2, 3, 4], targetDim: 2 }, check: (o) => Array.isArray(o.reduced) && o.reduced.length === 2 },
  extract_pca: { args: { data: [[1, 2], [2, 4], [3, 6]], components: 1 }, check: (o) => typeof o === 'object' && o !== null },
  simplified_svd: { args: { matrix: [[1, 2], [3, 4]] }, check: (o) => typeof o.singularValue === 'number' || Array.isArray(o.singularValues) },
  covariance: { args: { a: [1, 2, 3], b: [2, 4, 6] }, check: (o) => typeof o === 'object' && o !== null },
}

const hasBad = (v) => {
  if (typeof v === 'number') return !isFinite(v)
  if (Array.isArray(v)) return v.some(hasBad)
  if (v && typeof v === 'object') return Object.values(v).some(hasBad)
  return false
}
function isEmptyShell(o) {
  if (o === null || o === undefined) return true
  if (Array.isArray(o)) return o.length === 0
  if (typeof o !== 'object') return false
  const keys = Object.keys(o).filter((k) => k !== 'provenance')
  if (keys.length === 0) return true
  return keys.every((k) => {
    const v = o[k]
    if (v === null || v === undefined) return true
    if (Array.isArray(v)) return v.length === 0
    if (typeof v === 'object') return Object.keys(v).length === 0
    if (typeof v === 'string') return v.trim() === ''
    return false
  })
}

// 判据：三层任一不过即 FAIL
function judge(r, check) {
  if (!r) return { ok: false, why: '无返回' }
  if (r.error) return { ok: false, why: 'error: ' + String(r.error).slice(0, 80) }
  if (r.success === false) return { ok: false, why: 'success:false ' + String(r.error || '').slice(0, 70) }
  if (r.output === undefined) return { ok: false, why: '无 output' }
  if (isEmptyShell(r.output)) return { ok: false, why: '空壳输出' }
  if (hasBad(r.output)) return { ok: false, why: '含 NaN/Infinity' }
  if (check) {
    let sem = false
    try { sem = !!check(r.output) } catch (e) { return { ok: false, why: '断言抛错: ' + e.message } }
    if (!sem) return { ok: false, why: '语义断言不通过' }
  }
  return { ok: true, why: '' }
}

async function runOne(name, args) {
  const h = TR.getHandler(name)
  if (!h) return { error: 'HANDLER_NOT_FOUND' }
  try { return await h(args, regObj) } catch (e) { return { error: 'THROWN: ' + String(e.message).slice(0, 90) } }
}

;(async () => {
  console.log('='.repeat(88))
  console.log('MCP 工具语义检测（三层判据 + 检测器有牙自检）')
  console.log('='.repeat(88))

  // ── 检测器有牙自检：喂入已知错误样本，必须 FAIL ──────────────────
  let teethOk = 0, teethTotal = 0
  const selfTests = [
    [{ success: false, error: 'boom' }, null, 'success:false'],
    [{ success: true, output: { matrix: [] } }, null, '空壳'],
    [{ success: true, output: { score: NaN } }, null, 'NaN'],
    [{ success: true, output: { score: 0.5 } }, (o) => o.score === 1, '断言不通过'],
  ]
  for (const [fake, chk, label] of selfTests) {
    teethTotal++
    const j = judge(fake, chk)
    if (!j.ok) teethOk++
    else console.log(`  ✗ 有牙自检漏判：${label}`)
  }
  // 正向：正确样本必须 PASS
  teethTotal++
  if (judge({ success: true, output: { score: 1 } }, (o) => o.score === 1).ok) teethOk++
  else console.log('  ✗ 有牙自检误判：正确样本被判失败')
  const teeth = teethOk === teethTotal
  console.log(`\n① 检测器有牙自检：${teethOk}/${teethTotal} ${teeth ? '✓' : '✗'}`)

  // ── 30 个 L3 工具语义验证 ─────────────────────────────────────────
  console.log('\n② L3 工具语义验证')
  let pass = 0, fail = 0
  const fails = []
  for (const [name, c] of Object.entries(CASES)) {
    const r = await runOne(name, c.args)
    const j = judge(r, c.check)
    if (j.ok) { pass++ } else { fail++; fails.push([name, j.why]) }
  }
  for (const [n, w] of fails) console.log(`  ✗ ${n.padEnd(24)} ${w}`)
  console.log(`  通过 ${pass} ｜ 失败 ${fail} ｜ 合计 ${Object.keys(CASES).length}`)

  console.log('\n' + '-'.repeat(88))
  const overall = teeth && fail === 0
  console.log(overall
    ? `总判定：PASS（有牙 ${teethOk}/${teethTotal} ｜ 语义 ${pass}/${Object.keys(CASES).length}）`
    : `总判定：FAIL（有牙 ${teethOk}/${teethTotal} ｜ 语义 ${pass}/${Object.keys(CASES).length}）`)
  process.exitCode = overall ? 0 : 1
})()
