/**
 * selftest.mjs — 分发层全量自检（597 条逐条 invoke）
 *
 * 验收线（与 R141 完全对齐）：
 *   597 条 = 594 可调（ok + degraded） + 3 unsupported + 0 error
 *
 * 运行：node $METAGO_LIFEFORM_HOME\plugins\dsh-metago-atom\test\selftest.mjs
 * 退出码 0 = 全过；1 = 有失败
 */

import { allIds, describe, dispatch, invoke, list, load, snapshot } from '../lib/dispatch.mjs'

let pass = 0
let fail = 0
const failures = []
const ok = (label, cond, detail = '') => {
  if (cond) { pass += 1 } else { fail += 1; failures.push(`${label} ${detail}`) }
}

console.log('\n  atom-dispatch selftest\n')

/* ---- 0. 加载 ---- */
const loaded = load()
ok('加载成功', loaded.ok === true, JSON.stringify(loaded))
const snap = snapshot()
console.log(`  索引 ${snap.indexed} 条 · 校验器 ${snap.hasValidator ? '有' : '无'} · loadError=${snap.loadError || 'none'}`)

const ids = allIds()
ok('原子总数 = 597', ids.length === 597, `实际 ${ids.length}`)

/* ---- 1. 全量 invoke 扫描（用官方候选输入池，照抄 atoms/verify.cjs 的做法）---- */
// 为什么不用 undefined：undefined 是"最差输入"，会让 585 条被误判为 degraded，
// 那验的是"缺输入会不会降级"，不是"能不能算"。引擎自带的 verify.cjs 用候选池逐试取第一个成功者，
// 这里照抄同一策略，判据换成"契约校验通过"。
const CAND = [
  { v: [1, 2, 3, 4, 5] },
  { value: [0.8, 0.6, 0.9] },
  { values: [10, 20, 15], a: [1, 2], b: [2, 4] },
  { a: [1, 2], b: [2, 4] },
  { text: '测试文本 内容分析', u: [0.5, 0.6, 0.7] },
  [1, 2, 3, 4, 5],
  { features: [0.1, 0.9, 0.5] },
  { items: ['a', 'b', 'c'] },
]

const buckets = { contractPass: 0, noSample: 0, unsupported: 0, error: 0 }
const unsupportedIds = []
const errorIds = []
const noSampleIds = []
const operatorDist = {}
const bestInputFor = new Map()

for (const id of ids) {
  // 先判 unsupported（不浪费候选池）
  const first = invoke(id, undefined, { validate: false })
  if (first.ok === false && first.unsupported === true) {
    buckets.unsupported += 1
    unsupportedIds.push(id)
    continue
  }
  if (first.ok === false) {
    buckets.error += 1
    errorIds.push(id)
    continue
  }
  // 逐个候选输入试，取第一个契约通过的
  let hit = null
  for (const cand of CAND) {
    const r = invoke(id, cand, { validate: true })
    if (r.ok === false) continue
    if (r.contract && Array.isArray(r.checks) && r.checks.every((c) => c.ok)) { hit = { cand, r }; break }
  }
  if (hit) {
    buckets.contractPass += 1
    bestInputFor.set(id, hit.cand)
    if (hit.r.operator) operatorDist[hit.r.operator] = (operatorDist[hit.r.operator] || 0) + 1
  } else {
    buckets.noSample += 1
    if (noSampleIds.length < 5) noSampleIds.push(id)
  }
}

console.log(`  扫描结果（官方候选池）: contractPass=${buckets.contractPass} noSample=${buckets.noSample} unsupported=${buckets.unsupported} error=${buckets.error}`)
console.log(`  算子分布（仅 contractPass）: ${JSON.stringify(operatorDist)}`)
if (noSampleIds.length) console.log(`  无合适样例的原子样例: ${noSampleIds.join(', ')}`)

ok('0 条 error', buckets.error === 0, errorIds.slice(0, 5).join(', '))
ok('unsupported 恰好 3 条', buckets.unsupported === 3, `实际 ${buckets.unsupported}`)
ok('594 条可调（contractPass + noSample）', buckets.contractPass + buckets.noSample === 594, `实际 ${buckets.contractPass + buckets.noSample}`)
ok('契约通过率 > 80%（候选池覆盖度）', buckets.contractPass / 594 > 0.8, `${(buckets.contractPass / 594 * 100).toFixed(1)}%`)

const EXTERNAL_EXPECT = ['ATOM_SECURE_LOCK_201', 'ATOM_ACCESSIBLE_SIGN_507', 'ATOM_BIO_NEURAL_021'].sort()
ok('unsupported 三条 ID 精确匹配', JSON.stringify(unsupportedIds.sort()) === JSON.stringify(EXTERNAL_EXPECT), unsupportedIds.join(', '))

/* ---- 2. describe ---- */
const d1 = describe('ATOM_RESOURCE_ALLOCATE_001')
ok('describe 已知 ID → ok', d1.ok === true, JSON.stringify(d1).slice(0, 200))
ok('describe 回传 action/domain', typeof d1.action === 'string' && typeof d1.domain === 'string', `${d1.action}/${d1.domain}`)
ok('describe 含 contract', d1.contract && typeof d1.contract.action === 'string')

const d2 = describe('ATOM_NOT_EXIST_999')
ok('describe 未知 ID → ok:false', d2.ok === false, JSON.stringify(d2))
ok('describe 未知 ID 带 reason', typeof d2.reason === 'string')

const d3 = describe('ATOM_SECURE_LOCK_201')
ok('describe 不支持原子标 unsupported 状态', d3.status === 'unsupported', JSON.stringify(d3.status))
ok('describe 不支持原子带 note', typeof d3.note === 'string', String(d3.note))

/* ---- 3. list ---- */
const l1 = list({})
ok('list 全量 total=597', l1.total === 597, `实际 ${l1.total}`)
ok('list 返回 facets', l1.facets && l1.facets.byAction && l1.facets.byStatus)

const l2 = list({ status: 'unsupported' })
ok('list status=unsupported → 3 条', l2.total === 3, `实际 ${l2.total}`)

const l3 = list({ action: '计算/度量' })
ok('list action=计算/度量 → >0', l3.total > 0, `实际 ${l3.total}`)

const l4 = list({ action: '生成/创造', limit: 5 })
ok('list 分页 limit 生效', l4.count <= 5 && l4.ids.length === l4.count, `count=${l4.count}`)

const l5 = list({ action: '不存在的动作' })
ok('list 无匹配 → total=0', l5.total === 0, `实际 ${l5.total}`)

/* ---- 4. dispatch 统一入口 ---- */
const r1 = dispatch({ operation: 'ATOM_RESOURCE_ALLOCATE_001', input: [10, 20, 30] })
ok('dispatch invoke 成功', r1.ok === true, JSON.stringify(r1).slice(0, 200))
ok('dispatch 成功回传 contract', r1.contract && typeof r1.contract.action === 'string')
ok('dispatch 成功回传 output', r1.output !== undefined)

const r2 = dispatch({ operation: 'ATOM_SECURE_LOCK_201' })
ok('dispatch 不支持原子 → unsupported:true', r2.unsupported === true, JSON.stringify(r2).slice(0, 160))
ok('dispatch 不支持原子带 reason', typeof r2.reason === 'string' && r2.reason.length > 0)

const r3 = dispatch({ operation: '' })
ok('dispatch 空 operation → ok:false', r3.ok === false)
ok('dispatch 空 operation 带 reason', typeof r3.reason === 'string')

const r4 = dispatch({ mode: 'list' })
ok('dispatch mode:list 可用', r4.ok === true && r4.total === 597)

const r5 = dispatch({ operation: 'ATOM_RESOURCE_ALLOCATE_001', mode: 'describe' })
ok('dispatch mode:describe 可用', r5.ok === true && r5.atom === 'ATOM_RESOURCE_ALLOCATE_001')

/* ---- 5. 幂等 / 无副作用 ---- */
const a = JSON.stringify(dispatch({ operation: 'ATOM_RESOURCE_ALLOCATE_001', input: [1, 2, 3] }).output)
const b = JSON.stringify(dispatch({ operation: 'ATOM_RESOURCE_ALLOCATE_001', input: [1, 2, 3] }).output)
ok('同输入同输出（确定性）', a === b, a.slice(0, 80))

/* ---- 6. 异常安全：脏入参不得抛 ---- */
let dirty = true
for (const bad of [null, 123, 'x'.repeat(10000), { __fn__: 'x => x' }, [null, undefined, NaN]]) {
  const r = invoke('ATOM_RESOURCE_ALLOCATE_001', bad)
  if (!r || typeof r.ok !== 'boolean') dirty = false
}
ok('脏入参不抛错且返回结构化结果', dirty)

/* ---- 汇总 ---- */
const final = snapshot()
console.log(`\n  统计: ${JSON.stringify(final.stats)}`)
console.log(`\n  ${pass} passed, ${fail} failed`)
if (fail > 0) {
  console.log('\n  失败项:')
  for (const f of failures) console.log('   ✘ ' + f)
  process.exit(1)
}
console.log('  ✅ 分发层自检通过（597 = 594 可调 + 3 不支持 + 0 error）\n')
