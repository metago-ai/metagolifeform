// probe_atoms2.mjs — 精确算 597 条契约的实现覆盖差集
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const PKG = 'D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0'
const req = createRequire(PKG + '/packages/engine/atoms/contract-validator.cjs')

const CV = req(PKG + '/packages/engine/atoms/contract-validator.cjs')
const CONTRACTS = CV.CONTRACTS
const allIds = Object.keys(CONTRACTS)

let E = null
try { E = req(PKG + '/packages/engine/atoms/engine.cjs') } catch (e) { console.log('engine.cjs 加载失败:', e.message) }
const COMPUTE = (E && E.COMPUTE) || {}
const computeIds = Object.keys(COMPUTE)

let F = null
try { F = req(PKG + '/packages/engine/atoms/atom-factory.cjs') } catch (e) { console.log('atom-factory 加载失败:', e.message) }

console.log('='.repeat(90))
console.log('597 条契约的实现覆盖')
console.log('='.repeat(90))
console.log(`  契约总数：${allIds.length}`)
const bySrc = {}
for (const id of allIds) bySrc[CONTRACTS[id].src] = (bySrc[CONTRACTS[id].src] || 0) + 1
console.log('  按来源：', JSON.stringify(bySrc))
console.log(`  COMPUTE 原子：${computeIds.length}`)

// 工厂覆盖：调用 F 看它生成哪些
let factoryIds = []
if (F) {
  try {
    // 尝试常见导出
    const fnNames = Object.keys(F)
    console.log(`  atom-factory 导出：${JSON.stringify(fnNames)}`)
    for (const fn of fnNames) {
      if (typeof F[fn] !== 'function') continue
      if (/generate|create|build|make|all/i.test(fn)) {
        let out
        try { out = F[fn](CONTRACTS) } catch (e) { continue }
        if (out && typeof out === 'object') {
          factoryIds = Object.keys(out)
          if (factoryIds.length) { console.log(`    用 ${fn}() 得到 ${factoryIds.length} 条`); break }
        }
      }
    }
    if (!factoryIds.length && F.ATOMS) factoryIds = Object.keys(F.ATOMS)
    if (!factoryIds.length && F.COMPUTE) factoryIds = Object.keys(F.COMPUTE)
  } catch (e) { console.log('  工厂调用失败:', e.message) }
}

const computeSet = new Set(computeIds.filter(id => CONTRACTS[id]))
const factorySet = new Set(factoryIds.filter(id => CONTRACTS[id]))
const covered = new Set([...computeSet, ...factorySet])
const missing = allIds.filter(id => !covered.has(id))

console.log('\n' + '='.repeat(90))
console.log('覆盖分析')
console.log('='.repeat(90))
console.log(`  compute 覆盖：${computeSet.size}`)
console.log(`  工厂覆盖：  ${factorySet.size}`)
console.log(`  合计覆盖：  ${covered.size} / ${allIds.length}（${(covered.size / allIds.length * 100).toFixed(1)}%）`)
console.log(`  ✗ 无实现：  ${missing.length}`)

if (missing.length) {
  const bySrcMiss = {}
  for (const id of missing) bySrcMiss[CONTRACTS[id].src] = (bySrcMiss[CONTRACTS[id].src] || 0) + 1
  console.log('  无实现按来源：', JSON.stringify(bySrcMiss))
  console.log('\n  无实现清单（前 40）：')
  for (const id of missing.slice(0, 40)) {
    console.log(`    ${id.padEnd(42)} ${CONTRACTS[id].src} ｜ ${String(CONTRACTS[id].action).slice(0, 12)}`)
  }
}

writeFileSync('D:/metago-build/atom_coverage.json', JSON.stringify({
  total: allIds.length,
  bySrc,
  computeCovered: computeSet.size,
  factoryCovered: factorySet.size,
  covered: covered.size,
  missing,
  missingDetail: missing.map(id => ({ id, ...CONTRACTS[id] })),
}, null, 1), 'utf8')
console.log('\n已写出 D:/metago-build/atom_coverage.json')
