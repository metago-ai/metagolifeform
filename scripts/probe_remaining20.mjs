// probe_remaining20.mjs — 查那 20 条「需模型/需硬件」的原子现在是什么状态
//
// 疑点：契约校验器显示「无实现 0」，597 条分布里 null 只有 2 条。
// 但按 output 语义，20 条是「需模型生成自然语言」或「需硬件」的。
// 如果它们被工厂 GEN 生成了「计算实现」，那就是**假实现**——
//   契约要求「政策原文 → 通俗解释」，工厂却返回数值指标，这不是实现，是错位。
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const P = 'D:/metago-build/outbound/v36.10.0/metagolifeform-v36.12.0/packages/engine/atoms'
const req = createRequire(P + '/contract-validator.cjs')
const CV = req(P + '/contract-validator.cjs')
const F = req(P + '/atom-factory.cjs')
const BP = req(P + '/blueprint-atoms.cjs')
const GEN = JSON.parse(readFileSync('D:/metago-build/genome/atoms_engines.json', 'utf8'))
const atoms = GEN.atoms || {}
const C = CV.CONTRACTS

// 20 条：72 无归属清单里，减去 blueprint 已实现的 52 条
const UNCOV = JSON.parse(readFileSync('D:/metago-build/atom_uncovered.json', 'utf8'))
const remaining = UNCOV.missing.filter(id => !BP.IMPL[id])

console.log('='.repeat(96))
console.log(`剩余 ${remaining.length} 条（72 无归属 − 52 已实现）的真实状态`)
console.log('='.repeat(96))

const rows = []
for (const id of remaining) {
  let fn = null, kind = 'null'
  try { fn = F.make(id); kind = fn ? (fn.kind || 'factory-gen') : 'null' } catch (e) { kind = 'ERR:' + e.message.slice(0, 30) }
  let out = null
  if (fn) { try { out = fn([0.8, 0.6, 0.75]) } catch (e) { out = 'THROW:' + e.message.slice(0, 40) } }
  const a = atoms[id] || {}
  rows.push({
    id, kind,
    name: String(a.name || ''),
    contractIo: `${String(a.input || '').slice(0, 16)} → ${String(a.output || '').slice(0, 20)}`,
    outSample: JSON.stringify(out).slice(0, 110),
  })
}

const g = {}
for (const r of rows) (g[r.kind] = g[r.kind] || []).push(r)
for (const k of Object.keys(g)) {
  console.log(`\n【${k}】${g[k].length} 条`)
  for (const r of g[k]) {
    console.log(`  ${r.id.padEnd(32)} ${r.name.slice(0, 12).padEnd(14)} ${r.contractIo}`)
    console.log(`      实测输出: ${r.outSample}`)
  }
}

console.log('\n' + '='.repeat(96))
console.log('判定要点：若 kind=factory-gen 但契约要求「→通俗解释/摘要/报告」，那是假实现（错位）')
console.log(`null: ${(g.null || []).length} ｜ factory-gen: ${(g['factory-gen'] || []).length} ｜ 其它: ${Object.keys(g).filter(k => k !== 'null' && k !== 'factory-gen').length} 类`)
