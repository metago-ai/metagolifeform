// probe_atoms5.mjs — U-07 收官：5 个哲学族 constraint 原子是否真有实现
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const PKG = 'D:/metago-build/outbound/v36.10.0/metagolifeform-v36.12.0'
const req = createRequire(PKG + '/packages/engine/atoms/atom-factory.cjs')
const F = req(PKG + '/packages/engine/atoms/atom-factory.cjs')
const CV = req(PKG + '/packages/engine/atoms/contract-validator.cjs')
const CONTRACTS = CV.CONTRACTS

console.log('='.repeat(92))
console.log('CONSTRAINT_IDS / EXTERNAL_NEEDED 的真实内容')
console.log('='.repeat(92))
const CI = F.CONSTRAINT_IDS
const EN = F.EXTERNAL_NEEDED
const ciList = CI instanceof Set ? [...CI] : (Array.isArray(CI) ? CI : Object.keys(CI || {}))
const enList = EN instanceof Set ? [...EN] : (Array.isArray(EN) ? EN : Object.keys(EN || {}))
console.log(`  CONSTRAINT_IDS（${ciList.length} 条）：`)
for (const id of ciList) console.log(`    ${id.padEnd(34)} ${CONTRACTS[id] ? CONTRACTS[id].action.slice(0, 40) : '(无契约)'}`)
console.log(`  EXTERNAL_NEEDED（${enList.length} 条）：`)
for (const id of enList) console.log(`    ${id.padEnd(34)} ${CONTRACTS[id] ? CONTRACTS[id].action.slice(0, 40) : '(无契约)'}`)

console.log('\n' + '='.repeat(92))
console.log('这 5 个 constraint 原子有没有可执行实现')
console.log('='.repeat(92))

// 找 SPECIAL_IMPL / constraint 实现
const src = readFileSync(PKG + '/packages/engine/atoms/atom-factory.cjs', 'utf8')
const si = src.indexOf('SPECIAL_IMPL')
console.log(`  atom-factory 里 SPECIAL_IMPL 出现位置：${si >= 0 ? si : '未找到'}`)
const ciIdx = src.indexOf('CONSTRAINT_IDS = new Set')
console.log('\n  CONSTRAINT_IDS 定义原文：')
console.log(src.slice(ciIdx, ciIdx + 700).split('\n').map(l => '    ' + l).join('\n'))

// 逐个测：传"违背"的文本，看是否返回 violated
const TESTS = {
  ATOM_WORD_BEING_153: ['本系统绝对完整，100% 完美，不可能有遗漏', '本结论基于 3 次实测，样本 100 条'],
  ATOM_WORD_DECIDE_151: [{ confidence: 0.1, decision: '执行' }, { confidence: 0.95, decision: '执行' }],
  ATOM_WORD_DISSOLVE_152: [{ category: 'A', antiCategory: 'B', objects: [{ c: 'A' }, { c: 'B' }] }, {}],
  ATOM_WORD_TEACH_154: ['你必须知道，你应该明白，务必记住这些道理。', '## 步骤\n1. 打开\n2. 输入'],
  ATOM_VOID_WITNESS_150: [{ invalid: 5, valid: 1, deprecated: ['x'], referenced: ['x'] }, { invalid: 1, valid: 5, deprecated: [], referenced: [] }],
}
for (const [id, cases] of Object.entries(TESTS)) {
  console.log(`\n  ${id}`)
  const atom = (() => { try { return F.make ? F.make(id, CONTRACTS[id]) : null } catch (e) { return null } })()
  console.log(`    make() → ${atom === null ? 'null（工厂不生成）' : typeof atom}`)
  for (const c of cases) {
    let out = null
    try {
      if (typeof atom === 'function') out = atom(c)
      else if (atom && atom.compute) out = atom.compute(c)
      else if (atom && atom.constraint) out = atom.constraint(c)
      else if (F.CONSTRAINTS && F.CONSTRAINTS[id]) out = F.CONSTRAINTS[id](c)
    } catch (e) { out = { thrown: e.message.slice(0, 60) } }
    console.log(`      输入 ${JSON.stringify(c).slice(0, 60)}`)
    console.log(`      → ${JSON.stringify(out).slice(0, 140)}`)
  }
}

// 看导出里有没有 CONSTRAINTS
console.log('\n  atom-factory 全部导出：', JSON.stringify(Object.keys(F)))
