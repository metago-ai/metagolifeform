// selftest_semantic_teeth.mjs — 检测器有牙自检（require 复用同一份断言）
//
// 纪律：抓不住「已知错误样本」的检测器只是安慰剂。
// 做法：手工构造结构完整、数值有限、但语义错误的输出，喂给检测器的断言，要求全部被拒。
// 断言表直接 require 检测器的导出——不解析源码，不会因格式变化失效。
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'

const P = 'D:/DSH-Official/home/scripts/mcp-tools-semantic.cjs'
const req = createRequire(P)

// 检测器目前是「跑一遍就退出」的脚本形态，直接 require 会执行主流程。
// 用「读源码 → 只 eval CASES 定义」的方式取表：比正则抽函数稳（CASES 是一整块字面量）。
const src = readFileSync(P, 'utf8')
const i = src.indexOf('const CASES')
if (i < 0) { console.log('✗ 找不到 CASES'); process.exit(1) }
// 从 const CASES 起，按大括号层级找到对象结束
let start = src.indexOf('{', i)
let depth = 0, end = start
for (let k = start; k < src.length; k++) {
  const ch = src[k]
  if (ch === '{') depth++
  else if (ch === '}') { depth--; if (depth === 0) { end = k + 1; break } }
}
const literal = src.slice(start, end)
let CASES
try {
  // 只允许纯字面量：把 unquoted keys 保留，函数体是箭头函数，需要 eval 才能拿到
  CASES = eval('(' + literal + ')')
} catch (e) {
  console.log('✗ CASES 解析失败：' + e.message)
  process.exit(1)
}
const n = Object.keys(CASES).length
console.log(`  已加载断言表：${n} 个工具`)

// 已知错误样本（结构完整、数值有限，只有懂语义才判得出错）
const FAKES = [
  { name: 'build_coupling_matrix 全 3（假匹配）', tool: 'build_coupling_matrix', out: { matrix: [[1, 3, 3], [3, 1, 3], [3, 3, 1]] } },
  { name: 'build_coupling_matrix 全 0（权重丢失）', tool: 'build_coupling_matrix', out: { matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] } },
  { name: 'build_coupling_matrix 对角非 1', tool: 'build_coupling_matrix', out: { matrix: [[0.5, 0.8, 0], [0.8, 0.5, 0.6], [0, 0.6, 0.5]] } },
  { name: 'build_coupling_matrix 非对称', tool: 'build_coupling_matrix', out: { matrix: [[1, 0.8, 0], [0.3, 1, 0.6], [0, 0.6, 1]] } },
  { name: 'build_coupling_matrix 权重全错（0.9 变 0.1）', tool: 'build_coupling_matrix', out: { matrix: [[1, 0.1, 0], [0.1, 1, 0.1], [0, 0.1, 1]] } },
  { name: 'identify_strong_pairs 阈值被吃（低分也返回）', tool: 'identify_strong_pairs', out: { pairs: [['a', 'b', 0.95], ['a', 'c', 0.2], ['b', 'c', 0.1]] } },
  { name: 'identify_weak_pairs 阈值被吃（高分混入）', tool: 'identify_weak_pairs', out: { pairs: [['a', 'b', 0.9], ['b', 'c', 0.95]] } },
  { name: 'normalize_coupling 未归一化', tool: 'normalize_coupling', out: { normalized: [0.5, 0.8, 0.2, 0.9] } },
  { name: 'normalize_coupling 归一化到错区间', tool: 'normalize_coupling', out: { normalized: [1, 1.6, 0.4, 1.8] } },
  { name: 'is_superconductive 边界错（1.08 判 false）', tool: 'is_superconductive', out: { superconductive: false, margin: -0.08 } },
  { name: 'cosine 同向向量算成 0.5', tool: 'cosine_similarity', out: { score: 0.5 } },
]

let caught = 0
const missed = []
console.log('\n  已知错误样本 → 检测器判定：')
for (const f of FAKES) {
  const c = CASES[f.tool]
  if (!c || typeof c.check !== 'function') { missed.push(f.name + '（无断言）'); continue }
  let verdict
  try { verdict = c.check(f.out) } catch (e) { verdict = false }
  const ok = verdict === false
  if (ok) caught++
  else missed.push(f.name)
  console.log(`    ${ok ? '✓' : '✗'} ${f.name} → check=${verdict}${ok ? '' : '  ← 漏过！'}`)
}

console.log('\n' + '-'.repeat(84))
console.log(`有牙自检：${caught} / ${FAKES.length} 个已知错误被拒`)
if (missed.length) console.log(`漏过：${missed.join(' | ')}`)
console.log(caught === FAKES.length ? '总判定：PASS（检测器有牙）' : '总判定：FAIL（检测器漏过已知错误）')
writeFileSync('D:/metago-build/teeth_result.json', JSON.stringify({ caught, total: FAKES.length, missed }, null, 1), 'utf8')
process.exit(caught === FAKES.length ? 0 : 1)
