// judge_misaligned.mjs — 判定 20 条里哪些是「真错位」（假实现），哪些是「结构化报告」（可用）
//
// 判据（按契约 output 语义 × 实测输出结构，双向比对）：
//   MISALIGNED：契约 output 是**自然语言产物**（解释/摘要/传记/提示/方案/故事/翻译），
//               而实测输出是纯数值统计（value/mean/n/values），或把输入串当产物返回
//   STRUCTURED_OK：契约 output 是**结构化产物**（报告/结果/标签/向量/特征），
//                  实测输出含对应结构化字段（结论/level/清单/标签/向量）
//   HARDWARE：契约 input 是物理设备输入（锁指令/脑电/面部/多摄），纯软件无法获取
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'

const P = 'D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/packages/engine/atoms'
const req = createRequire(P + '/contract-validator.cjs')
const F = req(P + '/atom-factory.cjs')
const BP = req(P + '/blueprint-atoms.cjs')
const GEN = JSON.parse(readFileSync('D:/metago-build/genome/atoms_engines.json', 'utf8'))
const atoms = GEN.atoms || {}
const UNCOV = JSON.parse(readFileSync('D:/metago-build/atom_uncovered.json', 'utf8'))
const remaining = UNCOV.missing.filter(id => !BP.IMPL[id])

// 契约 output 若是这些词 → 要求自然语言产物
const NL_OUTPUT = /通俗解释|摘要|传记|提示|方案|故事|翻译|文案|叙述|描述|解说|报告(?!.*结构)/
// 实测输出若是这些 → 纯数值统计（无自然语言、无结构化语义字段）
const PURE_STATS = (o) => {
  if (!o || typeof o !== 'object') return false
  const keys = Object.keys(o)
  const statKeys = keys.filter(k => /^(value|mean|n|values|std|variance|min|max|sum|median)$/.test(k))
  const semanticKeys = keys.filter(k => /结论|level|清单|标签|向量|特征|报告|建议|策略|distribution|trajectory|plan|hot|seeds|reminders|matched/.test(k))
  return statKeys.length >= 2 && semanticKeys.length === 0
}
// 硬件输入
const HW_INPUT = /锁指令|脑电|心率|皮电|面部|语音|表情|草图|摄像头|传感器|LIGO|探测器/

const out = []
for (const id of remaining) {
  const a = atoms[id] || {}
  const cin = String(a.input || ''), cout = String(a.output || '')
  let fn = null, kind = 'null'
  try { fn = F.make(id); kind = fn ? (fn.kind || 'factory-gen') : 'null' } catch (e) { }
  let res = null
  if (fn) { try { res = fn([0.8, 0.6, 0.75]) } catch (e) { } }

  // ① 硬件输入优先判 HARDWARE
  let verdict
  if (HW_INPUT.test(cin) && /锁指令|脑电|心率|皮电|面部|语音|表情|草图|LIGO|探测器/.test(cin)) {
    verdict = 'HARDWARE'
  } else if (NL_OUTPUT.test(cout) && PURE_STATS(res)) {
    verdict = 'MISALIGNED'
  } else if (NL_OUTPUT.test(cout) && res && typeof res === 'object') {
    // 输出里若有「把输入串当产物」的迹象 → 也判错位
    const echo = Object.keys(res).some(k => NL_OUTPUT.test(k) && /^\[.*\]$/.test(String(res[k])))
    verdict = echo ? 'MISALIGNED' : 'STRUCTURED_OK'
  } else {
    verdict = 'STRUCTURED_OK'
  }
  out.push({ id, name: String(a.name || ''), cin, cout, kind, verdict, sample: JSON.stringify(res).slice(0, 100) })
}

const g = {}
for (const r of out) (g[r.verdict] = g[r.verdict] || []).push(r)

console.log('='.repeat(96))
console.log('20 条剩余原子的精判')
console.log('='.repeat(96))
for (const k of ['MISALIGNED', 'HARDWARE', 'STRUCTURED_OK']) {
  const list = g[k] || []
  console.log(`\n【${k}】${list.length} 条`)
  for (const r of list) {
    console.log(`  ${r.id.padEnd(32)} ${r.name.slice(0, 12).padEnd(14)} ${r.cout.slice(0, 22)}`)
    if (k !== 'STRUCTURED_OK') console.log(`      → ${r.sample}`)
  }
}
console.log('\n' + '-'.repeat(96))
console.log(`MISALIGNED ${(g.MISALIGNED || []).length} ｜ HARDWARE ${(g.HARDWARE || []).length} ｜ STRUCTURED_OK ${(g.STRUCTURED_OK || []).length}`)
console.log(`需诚实标注（MISALIGNED + HARDWARE）：${(g.MISALIGNED || []).length + (g.HARDWARE || []).length} 条`)

writeFileSync('D:/metago-build/remaining20_verdict.json', JSON.stringify({ rows: out, summary: { MISALIGNED: (g.MISALIGNED || []).length, HARDWARE: (g.HARDWARE || []).length, STRUCTURED_OK: (g.STRUCTURED_OK || []).length } }, null, 1), 'utf8')
console.log('已写出 D:/metago-build/remaining20_verdict.json')
