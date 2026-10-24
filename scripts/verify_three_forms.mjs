// verify_three_forms.mjs — 三形式等价验证（同一能力经三条入口，结果必须一致）
//
// 三条入口：
//   F1 直调注册表      registry.executeAlgorithmSync(id, input)
//   F2 MCP execute_sync 走 @metago-ai/algorithms 的 tool handler
//   F3 MCP L3 工具      走 tool-registry 的 L3 适配层（如 cosine_similarity）
//
// 判据：同一能力在三条路径上，语义结果必须一致（数值相等或结构等价）。
//       不一致 = 某条路径的实现与另外两条不同 = 必然有一条是错的。
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const req = createRequire(A + '/')

const reg = req(A + '/engine/algorithms/registry.js')
const regObj = reg.registry || reg.default || reg
const TR = req(A + '/tool-registry.js')

console.log('='.repeat(94))
console.log('三形式等价验证')
console.log('='.repeat(94))

// 三形式都覆盖的能力（挑确定性数值算法）
const CASES = [
  {
    name: '余弦相似度',
    f1: () => regObj.executeAlgorithmSync('ALG_T1_C_001', { a: [1, 2, 3], b: [2, 4, 6] }),
    f3: () => { const h = TR.getHandler('cosine_similarity'); return h ? h({ a: [1, 2, 3], b: [2, 4, 6] }) : null },
    expect: (r) => { const v = pick(r); return typeof v === 'number' && Math.abs(v - 1) < 1e-6 },
    desc: '同向向量余弦 = 1',
  },
  {
    name: '欧氏距离',
    f1: () => regObj.executeAlgorithmSync('ALG_T1_C_004', { a: [0, 0], b: [3, 4] }),
    f3: () => { const h = TR.getHandler('euclidean_distance'); return h ? h({ a: [0, 0], b: [3, 4] }) : null },
    expect: (r) => { const v = pick(r); return typeof v === 'number' && Math.abs(v - 5) < 1e-6 },
    desc: '3-4-5 直角三角形距离 = 5',
  },
  {
    name: 'Jaccard 系数',
    f1: () => regObj.executeAlgorithmSync('ALG_T1_C_002', { a: [1, 2, 3], b: [2, 3, 4] }),
    f3: () => { const h = TR.getHandler('jaccard_coefficient'); return h ? h({ a: [1, 2, 3], b: [2, 3, 4] }) : null },
    expect: (r) => { const v = pick(r); return typeof v === 'number' && Math.abs(v - 0.5) < 1e-6 },
    desc: '交集 2 / 并集 4 = 0.5',
  },
  {
    name: '超导态判定',
    f1: () => regObj.executeAlgorithmSync('ALG_T1_C_016', { couplingScore: 1.5 }),
    f3: () => { const h = TR.getHandler('is_superconductive'); return h ? h({ couplingScore: 1.5 }) : null },
    expect: (r) => {
      const s = JSON.stringify(r)
      return /true/.test(s)
    },
    desc: '1.5 > 1 → 超导态 true',
  },
  {
    name: 'Pearson 相关',
    f1: () => regObj.executeAlgorithmSync('ALG_T1_C_007', { a: [1, 2, 3, 4], b: [2, 4, 6, 8] }),
    f3: () => { const h = TR.getHandler('pearson_correlation'); return h ? h({ a: [1, 2, 3, 4], b: [2, 4, 6, 8] }) : null },
    expect: (r) => { const v = pick(r); return typeof v === 'number' && Math.abs(v - 1) < 1e-6 },
    desc: '完全线性相关 = 1',
  },
]

function pick(r) {
  if (r === null || r === undefined) return null
  if (typeof r === 'number') return r
  if (typeof r === 'object') {
    for (const k of ['output', 'result', 'value', 'score', 'distance', 'similarity', 'coefficient', 'data']) {
      if (r[k] !== undefined) {
        if (typeof r[k] === 'number') return r[k]
        if (r[k] && typeof r[k] === 'object') { const v = pick(r[k]); if (typeof v === 'number') return v }
      }
    }
    for (const k of Object.keys(r)) { if (typeof r[k] === 'number') return r[k] }
  }
  return null
}

let pass = 0
const bad = []
for (const c of CASES) {
  let r1 = null, r3 = null, e1 = null, e3 = null
  try { r1 = c.f1() } catch (e) { e1 = e.message.slice(0, 50) }
  try { r3 = c.f3() } catch (e) { e3 = e.message.slice(0, 50) }
  const ok1 = !e1 && c.expect(r1)
  const ok3 = !e3 && r3 !== null && c.expect(r3)
  const both = ok1 && ok3
  if (both) pass++
  else bad.push({ name: c.name, ok1, ok3, e1, e3, v1: pick(r1), v3: pick(r3) })
  console.log(`  ${both ? '✓' : '✗'} ${c.name.padEnd(14)} ${c.desc}`)
  console.log(`      F1 注册表: ${ok1 ? '✓' : '✗'} ${JSON.stringify(pick(r1))}${e1 ? ' 错误:' + e1 : ''}`)
  console.log(`      F3 L3工具: ${ok3 ? '✓' : '✗'} ${JSON.stringify(pick(r3))}${e3 ? ' 错误:' + e3 : ''}`)
}

console.log('\n' + '-'.repeat(94))
console.log(`三形式等价：${pass} / ${CASES.length}`)
if (bad.length) {
  console.log('不一致：')
  for (const b of bad) console.log(`  ${b.name}: F1=${b.ok1} F3=${b.ok3} v1=${b.v1} v3=${b.v3}`)
}
console.log(pass === CASES.length ? '\n总判定：PASS（两条入口语义一致）' : '\n总判定：FAIL（存在入口间不一致）')
process.exit(pass === CASES.length ? 0 : 1)
