// verify_blueprint_atoms.mjs — 逐条验证 52 条蓝本原子的实现（不能空壳、不能恒 return）
//
// 判据（三层）：
//   L-1 可调用：传入样本不抛异常
//   L-2 有内容：输出不是 null/undefined/空对象
//   L-3 有语义：两条不同输入的输出**必须不同**（防「恒返回固定值」的假实现）
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const req = createRequire('D:/metago-build/blueprint-atoms.cjs')
const M = req('D:/metago-build/blueprint-atoms.cjs')
const GEN = req('D:/metago-build/genome/atoms_engines.json')
const atoms = GEN.atoms || {}

// 为每条构造两组不同输入（A/B），用于 L-3 差异检测
const INPUT_A = {
  ATOM_POLICY_MONEY_102: { income: 100000, rate: 0.3, cap: 50000, taxRate: 0.1 },
  ATOM_POLICY_MATCH_103: { profile: { tags: ['制造', '数字'] }, policies: [{ id: 'p1', tags: ['制造'] }, { id: 'p2', tags: ['农业'] }] },
  ATOM_POLICY_DEADLINE_104: { now: 1700000000000, policies: [{ id: 'a', deadline: 1700086400000 }, { id: 'b', deadline: 1703000000000 }] },
  ATOM_POLICY_COMPARE_106: { policies: [{ name: 'A', rate: 0.3, cap: 5 }, { name: 'B', rate: 0.5, cap: 5 }] },
  ATOM_POLICY_APPLY_108: { required: ['身份证', '营业执照', '审计报告'], owned: ['身份证'] },
  ATOM_TECH_MAP_203: { keywords: ['AI', 'AI', '工业'], sequences: [['AI', '工业'], ['AI', '制造']] },
  ATOM_TECH_ROADMAP_205: { goal: { 产能: 100, 良率: 95 }, current: { 产能: 60, 良率: 92 } },
  ATOM_NEWS_HOOK_301: { news: ['AI 落地制造', 'AI 芯片突破', '农业政策'] },
  ATOM_SECURITY_ENCRYPT_603: { plain: 'secret-message', key: 'k1' },
  ATOM_SECURITY_DECRYPT_604: { cipher: Buffer.from('x').toString('base64'), key: 'k1' },
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

// B 组：把数值都改掉，用于 L-3 差异检测
function perturb(obj) {
  if (obj === null || obj === undefined) return 7
  if (typeof obj === 'number') return obj === 0 ? 7 : obj * 2 + 1
  if (typeof obj === 'string') return obj + '-B'
  if (Array.isArray(obj)) return obj.map(perturb)
  if (typeof obj === 'object') {
    const o = {}
    for (const k of Object.keys(obj)) o[k] = perturb(obj[k])
    return o
  }
  return obj
}

const isEmpty = (v) => v === null || v === undefined ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'string' && v.length === 0)

console.log('='.repeat(94))
console.log(`52 条蓝本原子实现验证（L-1 可调用 / L-2 有内容 / L-3 有语义）`)
console.log('='.repeat(94))

const rows = []
let l1ok = 0, l2ok = 0, l3ok = 0
for (const id of Object.keys(M.IMPL).sort()) {
  const fn = M.IMPL[id]
  const A = INPUT_A[id] !== undefined ? INPUT_A[id] : {}
  let ra, rb, errA = null, errB = null
  try { ra = fn(A) } catch (e) { errA = e.message }
  try { rb = fn(perturb(A)) } catch (e) { errB = e.message }

  const ok1 = !errA
  if (ok1) l1ok++
  const outA = ra && (ra.output !== undefined ? ra.output : ra)
  const ok2 = ok1 && !isEmpty(outA)
  if (ok2) l2ok++
  // L-3：两组输出序列化后必须不同
  const sa = ok2 ? JSON.stringify(outA) : ''
  const sb = (!errB && rb) ? JSON.stringify(rb.output !== undefined ? rb.output : rb) : ''
  const ok3 = ok2 && sb && sa !== sb
  if (ok3) l3ok++

  rows.push({ id, name: (atoms[id] && atoms[id].name) || '', l1: ok1, l2: ok2, l3: !!ok3, err: errA, same: ok2 && sb && sa === sb })

  const flag = ok3 ? '✓' : (ok2 ? '△' : '✗')
  const note = errA ? '抛错:' + errA.slice(0, 40) : (ok2 && sb && sa === sb ? '输出恒定（疑似假实现）' : '')
  if (!ok3) console.log(`  ${flag} ${id.padEnd(34)} ${note}`)
}

console.log('\n' + '-'.repeat(94))
console.log(`L-1 可调用：${l1ok} / ${Object.keys(M.IMPL).length}`)
console.log(`L-2 有内容：${l2ok} / ${Object.keys(M.IMPL).length}`)
console.log(`L-3 有语义（两组输出不同）：${l3ok} / ${Object.keys(M.IMPL).length}`)
console.log(l3ok === Object.keys(M.IMPL).length ? '\n总判定：PASS' : '\n总判定：FAIL')

writeFileSync('D:/metago-build/blueprint_atoms_verify.json', JSON.stringify({ rows, l1ok, l2ok, l3ok, total: Object.keys(M.IMPL).length }, null, 1), 'utf8')
console.log('已写出 D:/metago-build/blueprint_atoms_verify.json')
process.exit(l3ok === Object.keys(M.IMPL).length ? 0 : 1)
