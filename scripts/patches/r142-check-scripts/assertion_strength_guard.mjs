// assertion_strength_guard.mjs — R142 · 断言强度守卫
//
// ════ 为什么需要这个 ════
// R142 期间我犯过一个错：批量同步脚本时从旧目录 copy 到新目录，
// 把 R141 强化的 4 条断言（查数值）覆盖回弱版（只查结构）。
// 是有牙自检当场抓到的——但如果那天没跑有牙自检，这个回退会一直潜伏。
//
// 本守卫的作用：把「断言强度」变成一个可检查的事实。
// 谁把强断言改回弱版，回归立刻红。
import { readFileSync, existsSync } from 'node:fs'

const FILES = [
  'D:/DSH-Official/home/scripts/mcp-tools-semantic.cjs',
  'D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/scripts/mcp-tools-semantic.cjs',
]

// 每条强断言的特征串（改这些就说明被弱化了）
const MARKERS = [
  ['R142-STRONG 标记块', /R142-STRONG/],
  ['build_coupling_matrix 查对角', /diagOk/],
  ['build_coupling_matrix 查对称', /symOk/],
  ['normalize_coupling 查极值', /Math\.min\(\.\.\.n\)/],
  ['identify_strong_pairs 查阈值', /w\s*>=\s*0\.7/],
  ['identify_weak_pairs 查区间', /w\s*<\s*0\.3/],
]

console.log('='.repeat(88))
console.log('R142 · 断言强度守卫')
console.log('='.repeat(88))

let bad = 0
for (const f of FILES) {
  if (!existsSync(f)) { console.log(`  ✗ 文件不存在：${f}`); bad++; continue }
  const t = readFileSync(f, 'utf8')
  const miss = MARKERS.filter(([, re]) => !re.test(t)).map(([n]) => n)
  const tag = f.includes('DSH-Official') ? 'HOME' : 'PKG'
  if (miss.length) {
    bad++
    console.log(`  ✗ ${tag}：缺 ${miss.length} 个强度标记 → ${miss.join('、')}`)
  } else {
    console.log(`  ✓ ${tag}：${MARKERS.length} 个强度标记齐备`)
  }
  // 反向检查：确认弱版特征已消失
  const weak = []
  if (/build_coupling_matrix:\s*\{\s*args:\s*\{\s*entities:\s*\[\{\s*id:\s*'a'\s*\},\s*\{\s*id:\s*'b'\s*\}\]/.test(t)) weak.push('bcm 仍是 2 元素弱样例')
  if (/check:\s*\(o\)\s*=>\s*Array\.isArray\(o\.normalized\)\s*&&\s*o\.normalized\.length\s*===\s*4\s*\}/.test(t)) weak.push('norm 仍是只查 length')
  if (weak.length) { bad++; console.log(`      ⚠ 弱版特征仍在：${weak.join('、')}`) }
}

console.log('\n' + '-'.repeat(88))
console.log(bad === 0 ? `总判定：PASS（断言强度 ${FILES.length}/${FILES.length}）` : `总判定：FAIL（${bad} 处断言被弱化）`)
process.exit(bad === 0 ? 0 : 1)
