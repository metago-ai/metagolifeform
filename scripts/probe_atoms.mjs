// probe_atoms.mjs — U-07 深挖：597 条原子契约 vs 可执行实现的真实覆盖
//
// 疑点：
//   verify-package 的 K1 输出「契约 597 条，原子匹配 50/50，校验通过 50」
//   —— 若只有 50 个原子有 compute 实现，那覆盖率是 8.4%，与「590 实现」的说法差很远。
// 本脚本查清三件事：
//   ① 契约表里到底有多少条（按表格行数数，不按正则）
//   ② compute 原子实现清单在哪、多少个
//   ③ 两者的差集是什么
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const H = 'D:/DSH-Official/home'
const NPM = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai'

// ── ① 契约条数（按表格行数） ────────────────────────────────
const CONTRACT = H + '/metago/blueprint/元构初始文档/附录卷-原子契约补全-V36.11.md'
const t = readFileSync(CONTRACT, 'utf8')
const lines = t.split('\n')

const tableRows = []
for (const l of lines) {
  const m = l.match(/^\|\s*(ATOM_[A-Za-z0-9_]+)\s*\|/)
  if (m) tableRows.push(m[1])
}
const uniqRows = [...new Set(tableRows)]
console.log('='.repeat(90))
console.log('① 契约表')
console.log('='.repeat(90))
console.log(`  表格行（ATOM_ 开头）：${tableRows.length} 行 ｜ 唯一 ID：${uniqRows.length}`)

// 不同格式的 ID
const allIds = [...new Set([...t.matchAll(/\bATOM_[A-Za-z0-9_]{2,}\b/g)].map(m => m[0]))]
console.log(`  正文中出现的唯一 ATOM_ ID：${allIds.length}`)

// 按末尾数字段统计（ATOM_xxx_yyy_507）
const tail3 = allIds.filter(id => /_\d{3}$/.test(id))
console.log(`  以三位数字结尾的 ID：${tail3.length}`)

// 找出不在表格里的
const notInTable = allIds.filter(id => !uniqRows.includes(id))
console.log(`  出现在正文但不在表格行首的：${notInTable.length}`)
if (notInTable.length) console.log('   ', notInTable.slice(0, 8).join(', '))

// ── ② compute 原子实现 ──────────────────────────────────────
console.log('\n' + '='.repeat(90))
console.log('② compute 原子实现')
console.log('='.repeat(90))

// verify-package 里 K1 调的脚本
const vp = readFileSync(H + '/scripts/verify-package.cjs', 'utf8')
const mi = vp.indexOf('compute 原子匹配契约')
const around = vp.slice(Math.max(0, mi - 1200), mi + 300)
const scripts = [...around.matchAll(/scripts\/([A-Za-z0-9_\-\.]+\.(cjs|mjs|js|py))/g)].map(m => m[1])
console.log('  K1 调用的脚本：', [...new Set(scripts)])

// 全盘找 compute 原子实现文件
const CAND = [
  H + '/scripts/atom-contract-check.cjs',
  H + '/scripts/compute-atoms.cjs',
  NPM + '/engine/RUNTIME/dist/atoms.js',
  NPM + '/mcp-server/dist/atoms.js',
]
for (const c of CAND) {
  console.log(`  ${existsSync(c) ? '✓' : '✗'} ${c}`)
}

// 扫 home/scripts 里名字含 atom 的
console.log('\n  home/scripts 里含 atom 的脚本：')
for (const f of readdirSync(H + '/scripts')) {
  if (/atom/i.test(f)) console.log('    ' + f)
}

// ── ③ 找 compute 原子清单 ───────────────────────────────────
console.log('\n' + '='.repeat(90))
console.log('③ compute 原子清单（找 50 个在哪定义）')
console.log('='.repeat(90))
for (const f of readdirSync(H + '/scripts')) {
  if (!/atom/i.test(f)) continue
  const p = H + '/scripts/' + f
  const tt = readFileSync(p, 'utf8')
  const ids = [...new Set([...tt.matchAll(/\bATOM_[A-Za-z0-9_]{2,}\b/g)].map(m => m[0]))]
  if (ids.length) {
    console.log(`  ${f}: ${ids.length} 个 ID`)
    console.log('    ' + ids.slice(0, 6).join(', ') + (ids.length > 6 ? ' …' : ''))
  }
}
