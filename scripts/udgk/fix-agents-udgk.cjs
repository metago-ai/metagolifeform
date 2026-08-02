#!/usr/bin/env node
/*============================================================================
 * UDGK · fix-agents-udgk.cjs — 修复 AGENTS.md 中重复的 UDGK 规则段落
 * ---------------------------------------------------------------------------
 * 问题：install-udgk.ps1 的 MARK 检测失效，导致每次安装都向 AGENTS.md
 *       追加一份 UDGK 规则段落（当前已重复 5 份）。
 * 修复：保留正文（第一个 UDGK 段落之前），删除全部旧段落，追加一份新版规则。
 *
 * 用法：
 *   node fix-agents-udgk.cjs [--agents=AGENTS.md路径] [--rules=规则文件路径]
 *
 * @author MetaGO / UDGK
 * @version 1.0.0
 *============================================================================*/

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const pick = (flag, def) => {
  const hit = args.find((a) => a.startsWith(flag + '='));
  return hit ? hit.split('=').slice(1).join('=') : def;
};

// 元构包母本 AGENTS.md 已内置 UDGK 第零节（无重复注入场景）。
// --rules 必须显式提供 UDGK 规则文件；未提供时明确报错，防止误把 AGENTS.md 全文当规则追加。
const AGENTS = path.resolve(pick('--agents', path.join(require('os').homedir(), '.trae-cn', 'AGENTS.md')));
const RULES_ARG = pick('--rules', '');

if (!RULES_ARG) {
  console.error('[FAIL] 未指定 --rules=UDGK规则文件路径');
  console.error('       元构包母本已内置 UDGK 第零节，本脚本仅用于修复历史重复注入；');
  console.error('       如确需修复，请传入 --rules=03-Rules/AGENTS-UDGK-section.md');
  process.exit(1);
}
const RULES = path.resolve(RULES_ARG);

if (!fs.existsSync(AGENTS)) { console.error(`[FAIL] 未找到 AGENTS.md: ${AGENTS}`); process.exit(1); }
if (!fs.existsSync(RULES)) { console.error(`[FAIL] 未找到规则文件: ${RULES}`); process.exit(1); }

const text = fs.readFileSync(AGENTS, 'utf8');
const rulesText = fs.readFileSync(RULES, 'utf8').trim();

// 找到 UDGK 段落第一次出现的行（# UDGK 规则注入片段）
const lines = text.split('\n');
const firstIdx = lines.findIndex((l) => l.startsWith('# UDGK 规则注入片段'));
if (firstIdx === -1) {
  console.log('  [SKIP] AGENTS.md 未找到 UDGK 段落，直接追加');
  const clean = text.trimEnd() + '\n\n' + rulesText + '\n';
  fs.writeFileSync(AGENTS, clean, 'utf8');
  console.log('  [DONE] 已追加一份 UDGK 规则');
  process.exit(0);
}

// 保留正文：第一个 UDGK 段落之前（去掉末尾多余空行）
const keepLines = lines.slice(0, firstIdx).filter((l) => l.trim() !== '').join('\n');
const fixed = keepLines + '\n\n' + rulesText + '\n';

fs.writeFileSync(AGENTS, fixed, 'utf8');

// 统计
const after = fs.readFileSync(AGENTS, 'utf8');
const count = (after.match(/# UDGK 规则注入片段/g) || []).length;
console.log(`  [DONE] AGENTS.md 已修复`);
console.log(`   - 删除重复段落: ${lines.length - firstIdx - 1} 行`);
console.log(`   - 当前 UDGK 段落数: ${count}（应为 1）`);
console.log(`   - 总行数: ${after.split('\n').length}（原 ${lines.length}）`);
