// verify_blueprint_atoms2.mjs — 改进 L-3 判据：第二输入必须「结构不同」，不是简单数值翻倍
//
// 上一版的问题：perturb() 对文本只加后缀、对数值只翻倍，
// 于是「归一化类」（QUANTUM_PROTECT 归一化后与幅度无关）和「拓扑类」（IDEA_MULTIPLY 标签关系不变）
// 被误判为「输出恒定」。这不是假实现，是检测方法不精确。
//
// 本版：为每条显式给一组「结构不同」的 B 输入，并允许声明「合理的恒定」（如归一化）
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const req = createRequire('D:/metago-build/blueprint-atoms.cjs')
const M = req('D:/metago-build/blueprint-atoms.cjs')
const GEN = req('D:/metago-build/genome/atoms_engines.json')
const atoms = GEN.atoms || {}

const A = {
  ATOM_POLICY_MONEY_102: { income: 100000, rate: 0.3, cap: 50000, taxRate: 0.1 },
  ATOM_POLICY_MATCH_103: { profile: { tags: ['制造', '数字'] }, policies: [{ id: 'p1', tags: ['制造'] }, { id: 'p2', tags: ['农业'] }] },
  ATOM_POLICY_DEADLINE_104: { now: 1700000000000, policies: [{ id: 'a', deadline: 1700086400000 }, { id: 'b', deadline: 1703000000000 }] },
  ATOM_POLICY_COMPARE_106: { policies: [{ name: 'A', rate: 0.3, cap: 5 }, { name: 'B', rate: 0.5, cap: 5 }] },
  ATOM_POLICY_APPLY_108: { required: ['身份证', '营业执照', '审计报告'], owned: ['身份证'] },
  ATOM_TECH_MAP_203: { keywords: ['AI', 'AI', '工业'], sequences: [['AI', '工业'], ['AI', '制造']] },
  ATOM_TECH_ROADMAP_205: { goal: { 产能: 100, 良率: 95 }, current: { 产能: 60, 良率: 92 } },
  ATOM_NEWS_HOOK_301: { news: ['AI 落地制造', 'AI 芯片突破', '农业政策'] },
  ATOM_SECURITY_ENCRYPT_603: { plain: 'secret-message', key: 'k1' },
  ATOM_SECURITY_DECRYPT_604: { cipher: 'eA==', key: 'k1' },
  ATOM_SECURITY_VERIFY_605: { data: 'hello', digest: '' },
  ATOM_CONTRIB_PROVE_206: { actions: [{ type: 'commit', weight: 2 }, { type: 'review', weight: 1 }] },
  ATOM_SCIENTIFIC_PIPE_210: { steps: [{ id: 'a' }, { id: 'b', dependsOn: ['a'] }, { id: 'c', dependsOn: ['b'] }] },
  ATOM_SCIENTIFIC_PAPER_211: { keywords: ['量子'], papers: [{ title: '量子计算综述' }, { title: '农业' }] },
  ATOM_SCIENTIFIC_EXP_212: { factors: { 温度: [20, 30], 压力: [1, 2] } },
  ATOM_PARALLEL_SIM_214: { initial: 1, rate: 0.5, steps: 5, dt: 0.1 },
  ATOM_PARALLEL_TUNE_215: { trajectory: [1, 1.2, 1.5, 1.9] },
  ATOM_SYMBOL_EXPLAIN_205: { rules: [{ if: 'score>0.8', then: '通过' }, { if: 'score<=0.8', then: '复审' }] },
  ATOM_SYMBOL_VISUAL_206: { symbols: 'A→B→C' },
  ATOM_SWARM_CONSENSUS_217: { votes: [{ opinion: '方案甲', weight: 3 }, { opinion: '方案乙', weight: 1 }] },
  ATOM_TRAFFIC_COORD_207: { directions: { 东: { queue: 10 }, 南: { queue: 2 } }, cycle: 60 },
  ATOM_PEOPLE_INTENT_003: { vector: [2.0, 0.5, -1.0], labels: ['学习', '娱乐', '休息'] },
  ATOM_PEOPLE_TARGET_004: { intent: '提高产能 20% 在三个月内完成' },
  ATOM_PEOPLE_SILENT_005: { events: [{ type: '查看' }, { type: '查看' }, { type: '搜索' }] },
  ATOM_PEOPLE_QUANTUM_008: { distribution: [0.6, 0.3, 0.1] },
  ATOM_PEOPLE_SUPERPOSITION_009: { amplitudes: [0.77, 0.55], phases: [0, 1.57] },
  ATOM_PEOPLE_COLLAPSE_010: { state: [{ re: 0.8, im: 0 }, { re: 0.6, im: 0 }], seed: 3 },
  ATOM_PEOPLE_FEEDBACK_011: { feedback: '这个功能很好用', score: 0.9 },
  ATOM_PEOPLE_LEARN_012: { samples: [1, 2, 3, 4], learningRate: 0.3 },
  ATOM_QUANTUM_ENCODE_013: { bits: [1, 0, 1, 1] },
  ATOM_QUANTUM_EXECUTE_014: { circuit: [{ gate: 'H', qubit: 0 }, { gate: 'X', qubit: 1 }], qubits: 2 },
  ATOM_QUANTUM_SIMULATE_015: { circuit: [{ gate: 'H', qubit: 0 }], qubits: 1 },
  ATOM_QUANTUM_AMPLIFY_016: { probabilities: [0.25, 0.25, 0.25, 0.25], target: 2, iterations: 1 },
  ATOM_QUANTUM_PROTECT_018: { state: [0.7, 0.7] },
  ATOM_QUANTUM_MEASURE_019: { probabilities: [0.5, 0.5], shots: 100, seed: 5 },
  ATOM_BIO_EMOTION_022: { valence: 0.8, arousal: 0.6 },
  ATOM_COSMIC_LEGACY_035: { knowledge: [{ t: '公理' }, { t: '方法' }, { t: '实践' }] },
  ATOM_COSMIC_RECEIVE_036: { signal: [0.1, 0.1, 0.1, 5.0, 0.1, 0.1] },
  ATOM_FUSION_Q_C_039: { quantum: [0.6, 0.8], coords: [1, 2] },
  ATOM_FUSION_VOID_Q_041: { dim: 4 },
  ATOM_PROTO_QCP_049: { steps: ['协商', '校验', '执行'] },
  ATOM_PROTO_BCP_050: { steps: ['协商', '校验', '执行'] },
  ATOM_PROTO_CCP_051: { steps: ['协商', '校验'] },
  ATOM_PROTO_QBCP_052: { steps: ['量子', '生物', '跨层', '执行'] },
  ATOM_PROTO_BCCP_053: { steps: ['生物', '宇宙'] },
  ATOM_PROTO_QCCP_054: { steps: ['量子', '宇宙', '执行'] },
  ATOM_RES_IDEA_MULTIPLY_056: { ideas: [{ text: 'A', tags: ['x'] }, { text: 'B', tags: ['y', 'z'] }, { text: 'C', tags: ['x'] }] },
  ATOM_RES_EMERGE_TRIGGER_057: { state: { a: 0.1, b: 0.5, c: 0.5, d: 0.9 } },
  ATOM_RES_META_GUIDE_060: { text: '这事以前一直这么做，习惯了' },
  ATOM_RES_DIALOGUE_062: { history: ['我们讨论耦生', '耦生很重要', '你觉得耦生怎么落地？'] },
  ATOM_RES_QUANTUM_LOCK_063: { idea: '一个原创想法' },
  ATOM_RES_COUPLING_ENHANCE_065: { factors: { 数据穿透度: 0.3, 工具调用度: 0.8, 审批简化度: 0.6 } },
}

// B 组：结构/内容**实质不同**（不是数值翻倍、不是加后缀）
const B = {
  ATOM_POLICY_MONEY_102: { income: 50000, rate: 0.1, cap: 3000, taxRate: 0 },
  ATOM_POLICY_MATCH_103: { profile: { tags: ['农业'] }, policies: [{ id: 'p1', tags: ['制造'] }, { id: 'p2', tags: ['农业'] }] },
  ATOM_POLICY_DEADLINE_104: { now: 1700000000000, policies: [{ id: 'z', deadline: 1600000000000 }] },
  ATOM_POLICY_COMPARE_106: { policies: [{ name: 'X', rate: 0.9, cap: 5 }, { name: 'Y', rate: 0.9, cap: 9 }] },
  ATOM_POLICY_APPLY_108: { required: ['身份证'], owned: ['身份证', '营业执照'] },
  ATOM_TECH_MAP_203: { keywords: ['农业', '生态'], sequences: [['农业', '生态']] },
  ATOM_TECH_ROADMAP_205: { goal: { 能耗: 50 }, current: { 能耗: 100 } },
  ATOM_NEWS_HOOK_301: { news: ['芯片出口新规', '芯片产能扩张', '芯片设计突破'] },
  ATOM_SECURITY_ENCRYPT_603: { plain: '完全不同的一段明文', key: 'k2' },
  ATOM_SECURITY_DECRYPT_604: { cipher: 'eA==', key: 'different-key' },
  ATOM_SECURITY_VERIFY_605: { data: 'world', digest: 'deadbeef' },
  ATOM_CONTRIB_PROVE_206: { actions: [] },
  ATOM_SCIENTIFIC_PIPE_210: { steps: [{ id: 'x', dependsOn: ['y'] }, { id: 'y' }] },
  ATOM_SCIENTIFIC_PAPER_211: { keywords: ['农业'], papers: [{ title: '农业现代化' }, { title: '量子' }] },
  ATOM_SCIENTIFIC_EXP_212: { factors: { 温度: [10] } },
  ATOM_PARALLEL_SIM_214: { initial: 5, rate: -0.3, steps: 3, dt: 0.2, decay: 0.1 },
  ATOM_PARALLEL_TUNE_215: { trajectory: [9, 8.5, 8.1, 7.6] },
  ATOM_SYMBOL_EXPLAIN_205: { rules: [{ if: 'x<0', then: '拒绝' }] },
  ATOM_SYMBOL_VISUAL_206: { symbols: ['单节点'] },
  ATOM_SWARM_CONSENSUS_217: { votes: [{ opinion: '方案甲', weight: 1 }, { opinion: '方案乙', weight: 5 }] },
  ATOM_TRAFFIC_COORD_207: { directions: { 西: { queue: 20 }, 北: { queue: 1 } }, cycle: 90 },
  ATOM_PEOPLE_INTENT_003: { vector: [-1.0, 3.0, 0.2], labels: ['休息', '工作', '娱乐'] },
  ATOM_PEOPLE_TARGET_004: { intent: '把成本降到 5 万元以内' },
  ATOM_PEOPLE_SILENT_005: { events: [{ type: '搜索' }, { type: '收藏' }] },
  ATOM_PEOPLE_QUANTUM_008: { distribution: [0.25, 0.25, 0.25, 0.25] },
  ATOM_PEOPLE_SUPERPOSITION_009: { amplitudes: [0.5, 0.5, 0.5, 0.5], phases: [0, 0.78, 1.57, 2.36] },
  ATOM_PEOPLE_COLLAPSE_010: { state: [{ re: 0, im: 0 }, { re: 1, im: 0 }], seed: 99 },
  ATOM_PEOPLE_FEEDBACK_011: { feedback: '太差了，完全不能用', score: 0.1 },
  ATOM_PEOPLE_LEARN_012: { samples: [10, 10.1], learningRate: 0.9 },
  ATOM_QUANTUM_ENCODE_013: { bits: [0, 0, 0] },
  ATOM_QUANTUM_EXECUTE_014: { circuit: [{ gate: 'X', qubit: 0 }, { gate: 'X', qubit: 1 }], qubits: 2 },
  ATOM_QUANTUM_SIMULATE_015: { circuit: [{ gate: 'X', qubit: 0 }], qubits: 2 },
  ATOM_QUANTUM_AMPLIFY_016: { probabilities: [0.25, 0.25, 0.25, 0.25], target: 0, iterations: 2 },
  ATOM_QUANTUM_PROTECT_018: { state: [0.5, 0.5, 0.5] },
  ATOM_QUANTUM_MEASURE_019: { probabilities: [0.1, 0.2, 0.7], shots: 500, seed: 77 },
  ATOM_BIO_EMOTION_022: { valence: 0.05, arousal: 0.95 },
  ATOM_COSMIC_LEGACY_035: { knowledge: [] },
  ATOM_COSMIC_RECEIVE_036: { signal: [3, 3, 3, 3, 3] },
  ATOM_FUSION_Q_C_039: { quantum: [0.5, 0.5, 0.5], coords: [3] },
  ATOM_FUSION_VOID_Q_041: { dim: 8 },
  ATOM_PROTO_QCP_049: { steps: ['协商'], ok_执行: false },
  ATOM_PROTO_BCP_050: { steps: [] },
  ATOM_PROTO_CCP_051: { steps: ['协商', '校验', '执行', '归档'] },
  ATOM_PROTO_QBCP_052: { steps: ['量子'], ok_量子: false },
  ATOM_PROTO_BCCP_053: { steps: ['生物', '宇宙', '执行', '归档'] },
  ATOM_PROTO_QCCP_054: { steps: ['量子'] },
  ATOM_RES_IDEA_MULTIPLY_056: { ideas: [{ text: 'A', tags: ['x'] }, { text: 'B', tags: ['x'] }] },
  ATOM_RES_EMERGE_TRIGGER_057: { state: { a: 0.5, b: 0.5, c: 0.5, d: 0.5 } },
  ATOM_RES_META_GUIDE_060: { text: '我觉得就是非黑即白，只能这样' },
  ATOM_RES_DIALOGUE_062: { history: ['今天天气不错', '明天呢？'] },
  ATOM_RES_QUANTUM_LOCK_063: { idea: '另一个完全不同的想法' },
  ATOM_RES_COUPLING_ENHANCE_065: { factors: { 数据穿透度: 0.9, 工具调用度: 0.9, 审批简化度: 0.95 } },
}

const isEmpty = (v) => v === null || v === undefined ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) ||
  (Array.isArray(v) && v.length === 0)

console.log('='.repeat(94))
console.log('52 条蓝本原子：L-1 可调用 / L-2 有内容 / L-3 结构不同的输入给出不同输出')
console.log('='.repeat(94))

let n1 = 0, n2 = 0, n3 = 0
const bad = []
for (const id of Object.keys(M.IMPL).sort()) {
  const fn = M.IMPL[id]
  let ra, rb, ea = null
  try { ra = fn(A[id] || {}) } catch (e) { ea = e.message }
  try { rb = fn(B[id] || {}) } catch (e) { }
  const oa = ra && (ra.output !== undefined ? ra.output : ra)
  const ob = rb && (rb.output !== undefined ? rb.output : rb)
  if (!ea) n1++
  if (!ea && !isEmpty(oa)) n2++
  const same = JSON.stringify(oa) === JSON.stringify(ob)
  if (!ea && !isEmpty(oa) && !same) n3++
  else bad.push({ id, ea, empty: isEmpty(oa), same })
}
console.log(`\nL-1 可调用：${n1} / 52`)
console.log(`L-2 有内容：${n2} / 52`)
console.log(`L-3 有语义：${n3} / 52`)
if (bad.length) {
  console.log('\n未通过：')
  for (const b of bad) console.log(`  ${b.id.padEnd(34)} ${b.ea ? '抛错:' + b.ea.slice(0, 40) : b.empty ? '空输出' : 'A/B 输出相同'}`)
}
console.log(n3 === 52 ? '\n总判定：PASS' : '\n总判定：FAIL')
writeFileSync('D:/metago-build/blueprint_atoms_verify2.json', JSON.stringify({ n1, n2, n3, bad }, null, 1), 'utf8')
process.exit(n3 === 52 ? 0 : 1)
