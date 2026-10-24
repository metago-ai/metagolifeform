// probe_atoms4.mjs — 590 条工厂原子：给数值输入能否跑通；7 个 null 是什么
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const PKG = 'D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0'
const req = createRequire(PKG + '/packages/engine/atoms/atom-factory.cjs')
const F = req(PKG + '/packages/engine/atoms/atom-factory.cjs')
const CV = req(PKG + '/packages/engine/atoms/contract-validator.cjs')
const CONTRACTS = CV.CONTRACTS
const all = F.getAllContracts()
const ids = Object.keys(all)

function mk(id) {
  try { return F.make ? F.make(id, CONTRACTS[id]) : all[id] } catch (e) { return null }
}
function run(atom, input) {
  try {
    if (typeof atom === 'function') return atom(input)
    if (atom && typeof atom.compute === 'function') return atom.compute(input)
    if (atom && typeof atom.run === 'function') return atom.run(input)
  } catch (e) { return { thrown: e.message.slice(0, 80) } }
  return null
}

// 给数值输入（工厂原子报 NO_NUMERIC_INPUT，说明它要数值）
const INPUTS = [
  { value: 0.5, score: 0.5, x: 0.5 },
  0.5,
  { values: [0.3, 0.5, 0.7], scores: [0.3, 0.5, 0.7] },
]

console.log('='.repeat(90))
console.log('590 条工厂原子：给数值输入跑通率')
console.log('='.repeat(90))

let ok = 0, noNum = 0, err = 0
const errList = []
for (const id of ids) {
  const atom = mk(id)
  if (!atom) continue
  let got = null
  for (const inp of INPUTS) {
    const r = run(atom, inp)
    if (r && !(r.reason === 'NO_NUMERIC_INPUT')) { got = r; break }
    got = r
  }
  const isOk = got && (got.ok === true || (typeof got === 'object' && !got.reason && !got.thrown))
  if (isOk) ok++
  else if (got && got.reason === 'NO_NUMERIC_INPUT') { noNum++; if (errList.length < 5) errList.push(id + ': NO_NUMERIC_INPUT') }
  else { err++; if (errList.length < 12) errList.push(id + ': ' + JSON.stringify(got).slice(0, 70)) }
}
console.log(`  跑通：${ok} ｜ 仍报 NO_NUMERIC_INPUT：${noNum} ｜ 其它错误：${err} ｜ 合计 ${ok + noNum + err}`)
if (errList.length) { console.log('  样例：'); errList.forEach(x => console.log('    ' + x)) }

// 7 个 null 逐个查
console.log('\n' + '='.repeat(90))
console.log('7 个 null 原子：契约里怎么写的')
console.log('='.repeat(90))
const NULLS = ids.filter(id => !mk(id))
for (const id of NULLS) {
  const c = CONTRACTS[id] || {}
  console.log(`\n  ${id}`)
  console.log(`    契约：action=${c.action} ｜ domain=${c.domain} ｜ src=${c.src}`)
  // 从契约卷里找该原子的描述行
  const { readFileSync } = await import('node:fs')
  const VOL = 'D:/DSH-Official/home/metago/blueprint/元构初始文档/附录卷-原子契约补全-V36.11.md'
  try {
    const t = readFileSync(VOL, 'utf8')
    const line = t.split('\n').find(l => l.includes(id))
    if (line) console.log(`    原文：${line.trim().slice(0, 160)}`)
  } catch (e) { }
}

writeFileSync('D:/metago-build/atom_run.json', JSON.stringify({
  total: ids.length, ok, noNumeric: noNum, err,
  nullAtoms: NULLS.map(id => ({ id, ...CONTRACTS[id] })),
}, null, 1), 'utf8')
console.log('\n已写出 D:/metago-build/atom_run.json')
