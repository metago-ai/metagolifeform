// probe_atoms6.mjs — 查 74 条「蓝本原有契约」的实现归属
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const PKG = 'D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0'
const req = createRequire(PKG + '/packages/engine/atoms/contract-validator.cjs')
const CV = req(PKG + '/packages/engine/atoms/contract-validator.cjs')
const F = req(PKG + '/packages/engine/atoms/atom-factory.cjs')
let E = null
try { E = req(PKG + '/packages/engine/atoms/engine.cjs') } catch (e) { }

const CONTRACTS = CV.CONTRACTS
const allIds = Object.keys(CONTRACTS)
const COMPUTE = (E && E.COMPUTE) || {}
const computeIds = new Set(Object.keys(COMPUTE))
const factoryContracts = F.CONTRACTS || {}
const factoryIds = new Set(Object.keys(factoryContracts))

const ciList = F.CONSTRAINT_IDS instanceof Set ? [...F.CONSTRAINT_IDS] : []
const enList = F.EXTERNAL_NEEDED instanceof Set ? [...F.EXTERNAL_NEEDED] : []

console.log('='.repeat(92))
console.log('597 条契约的归属核对')
console.log('='.repeat(92))
console.log(`  契约总数：${allIds.length}`)
console.log(`  COMPUTE（手写 compute 原子）：${computeIds.size}`)
console.log(`  工厂 CONTRACTS：${factoryIds.size}`)
console.log(`  CONSTRAINT_IDS：${ciList.length}`)
console.log(`  EXTERNAL_NEEDED：${enList.length}`)

const covered = new Set()
for (const id of allIds) {
  if (computeIds.has(id) || factoryIds.has(id) || ciList.includes(id) || enList.includes(id)) covered.add(id)
}
const missing = allIds.filter(id => !covered.has(id))

console.log(`\n  有归属：${covered.size} / ${allIds.length}`)
console.log(`  ✗ 无归属：${missing.length}`)

if (missing.length) {
  const bySrc = {}
  for (const id of missing) bySrc[CONTRACTS[id].src] = (bySrc[CONTRACTS[id].src] || 0) + 1
  console.log('  无归属按来源：', JSON.stringify(bySrc))
  console.log('\n  清单（前 30）：')
  for (const id of missing.slice(0, 30)) {
    console.log(`    ${id.padEnd(40)} ${CONTRACTS[id].src.padEnd(14)} ${String(CONTRACTS[id].action).slice(0, 26)}`)
  }
  // 这些 ID 在 GEN json 里有 input/output 吗（说明是蓝本原有）
  const GEN = 'D:/DSH-Official/home/metago/genome/FACTS.json'
  console.log('\n  这些 ID 是否在工厂的 atomMeta / GEN 里：')
  let inMeta = 0
  for (const id of missing) {
    try {
      const m = F.atomMeta ? F.atomMeta(id) : null
      if (m) inMeta++
    } catch (e) { }
  }
  console.log(`    atomMeta 能查到：${inMeta} / ${missing.length}`)
}

writeFileSync('D:/metago-build/atom_uncovered.json', JSON.stringify({
  total: allIds.length,
  compute: computeIds.size, factory: factoryIds.size,
  constraint: ciList.length, external: enList.length,
  covered: covered.size, missing, missingDetail: missing.map(id => ({ id, ...CONTRACTS[id] })),
}, null, 1), 'utf8')
console.log('\n已写出 D:/metago-build/atom_uncovered.json')
