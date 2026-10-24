// probe_atoms3.mjs — 验证 597 条契约的「实现」是真能执行，还是只是契约对象
import { createRequire } from 'node:module'

const PKG = 'D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0'
const req = createRequire(PKG + '/packages/engine/atoms/atom-factory.cjs')
const F = req(PKG + '/packages/engine/atoms/atom-factory.cjs')
const CV = req(PKG + '/packages/engine/atoms/contract-validator.cjs')
const CONTRACTS = CV.CONTRACTS

console.log('='.repeat(90))
console.log('atom-factory 真实能力')
console.log('='.repeat(90))
console.log('  CONSTRAINT_IDS:', F.CONSTRAINT_IDS ? (Array.isArray(F.CONSTRAINT_IDS) ? F.CONSTRAINT_IDS.length + ' 条 ' + JSON.stringify(F.CONSTRAINT_IDS.slice(0, 8)) : typeof F.CONSTRAINT_IDS) : '无')
console.log('  EXTERNAL_NEEDED:', F.EXTERNAL_NEEDED ? (Array.isArray(F.EXTERNAL_NEEDED) ? F.EXTERNAL_NEEDED.length + ' 条 ' + JSON.stringify(F.EXTERNAL_NEEDED.slice(0, 8)) : Object.keys(F.EXTERNAL_NEEDED).length + ' 条 ' + JSON.stringify(Object.keys(F.EXTERNAL_NEEDED).slice(0, 8))) : '无')

const all = F.getAllContracts ? F.getAllContracts() : {}
const ids = Object.keys(all)
console.log(`\n  getAllContracts(): ${ids.length} 条`)

// 抽一条看结构
const sample = all[ids[0]]
console.log(`  样例 ${ids[0]} 的键：${JSON.stringify(Object.keys(sample || {}))}`)
console.log(`  样例内容：${JSON.stringify(sample).slice(0, 300)}`)

// 关键：能不能执行？
console.log('\n' + '='.repeat(90))
console.log('能否执行（make 出来的东西是函数吗）')
console.log('='.repeat(90))
let fnCount = 0, constCount = 0, extCount = 0, otherCount = 0
const kinds = { fn: [], constraint: [], external: [], other: [] }
for (const id of ids) {
  let atom
  try { atom = F.make ? F.make(id, CONTRACTS[id]) : all[id] } catch (e) { atom = null }
  const isFn = typeof atom === 'function' || (atom && typeof atom.compute === 'function') || (atom && typeof atom.run === 'function')
  if (isFn) { fnCount++; if (kinds.fn.length < 6) kinds.fn.push(id) }
  else if (F.CONSTRAINT_IDS && (Array.isArray(F.CONSTRAINT_IDS) ? F.CONSTRAINT_IDS.includes(id) : F.CONSTRAINT_IDS[id])) { constCount++; if (kinds.constraint.length < 6) kinds.constraint.push(id) }
  else if (F.EXTERNAL_NEEDED && (Array.isArray(F.EXTERNAL_NEEDED) ? F.EXTERNAL_NEEDED.includes(id) : F.EXTERNAL_NEEDED[id])) { extCount++; if (kinds.external.length < 6) kinds.external.push(id) }
  else { otherCount++; if (kinds.other.length < 8) kinds.other.push(id + ':' + (atom ? Object.keys(atom).join('|') : 'null')) }
}
console.log(`  可执行（function / 有 compute / 有 run）：${fnCount}`)
console.log(`  约束型：${constCount}`)
console.log(`  外部依赖型：${extCount}`)
console.log(`  其它：${otherCount}`)
console.log('\n  各类样例：')
for (const k of Object.keys(kinds)) if (kinds[k].length) console.log(`    ${k}: ${JSON.stringify(kinds[k])}`)

// 真跑几个
console.log('\n' + '='.repeat(90))
console.log('实跑抽样（5 个）')
console.log('='.repeat(90))
for (const id of ids.slice(0, 5)) {
  let atom
  try { atom = F.make ? F.make(id, CONTRACTS[id]) : all[id] } catch (e) { atom = null }
  let out = null
  try {
    if (typeof atom === 'function') out = atom({})
    else if (atom && typeof atom.compute === 'function') out = atom.compute({})
    else if (atom && typeof atom.run === 'function') out = atom.run({})
  } catch (e) { out = { thrown: e.message.slice(0, 60) } }
  console.log(`  ${id.padEnd(40)} → ${JSON.stringify(out).slice(0, 120)}`)
}
