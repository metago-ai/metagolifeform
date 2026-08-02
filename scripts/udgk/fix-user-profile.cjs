#!/usr/bin/env node
/*============================================================================
 * UDGK · fix-user-profile.cjs — 修复 user_profile.md 中重复的 UDGK 记忆段落
 * ---------------------------------------------------------------------------
 * 问题：UDGK 记忆注入片段原先无安装标记，install-udgk.ps1 每次安装都追加，
 *       导致 user_profile.md 中 UDGK 段落重复 5 份。
 * 修复：删除全部旧 UDGK 段落，在用户原有内容末尾追加一份新版记忆片段。
 *
 * 用法：
 *   node fix-user-profile.cjs [--profile=user_profile.md路径] [--inject=记忆片段路径]
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

const PROFILE = path.resolve(pick('--profile', path.join(require('os').homedir(), '.trae-cn', 'memory', 'user_profile.md')));
const INJECT_ARG = pick('--inject', '');

if (!INJECT_ARG) {
  console.error('[FAIL] 未指定 --inject=UDGK记忆片段文件路径');
  console.error('       元构包母本已内置 UDGK 记忆规范（AGENTS.md 第零节），本脚本仅用于修复历史重复注入；');
  console.error('       如确需修复，请传入 --inject=05-Memory/UDGK-memory-injection.md');
  process.exit(1);
}
const INJECT = path.resolve(INJECT_ARG);

if (!fs.existsSync(PROFILE)) { console.error(`[FAIL] 未找到 user_profile.md: ${PROFILE}`); process.exit(1); }
if (!fs.existsSync(INJECT)) { console.error(`[FAIL] 未找到记忆片段: ${INJECT}`); process.exit(1); }

const text = fs.readFileSync(PROFILE, 'utf8');
const injectText = fs.readFileSync(INJECT, 'utf8').trim();

// 找到第一个 UDGK 记忆段落（# UDGK 记忆注入片段）
const lines = text.split('\n');
const firstIdx = lines.findIndex((l) => l.startsWith('# UDGK 记忆注入片段'));
if (firstIdx === -1) {
  const clean = text.trimEnd() + '\n\n' + injectText + '\n';
  fs.writeFileSync(PROFILE, clean, 'utf8');
  console.log('  [DONE] user_profile.md 未找到旧 UDGK 段落，直接追加一份');
  process.exit(0);
}

// 保留用户原有内容（第一个 UDGK 段落之前，去掉多余空行）
const keepLines = lines.slice(0, firstIdx).filter((l) => l.trim() !== '').join('\n');
const fixed = keepLines + '\n\n' + injectText + '\n';

fs.writeFileSync(PROFILE, fixed, 'utf8');

const after = fs.readFileSync(PROFILE, 'utf8');
const count = (after.match(/# UDGK 记忆注入片段/g) || []).length;
console.log(`  [DONE] user_profile.md 已修复`);
console.log(`   - 删除重复段落行: ${lines.length - firstIdx - 1}`);
console.log(`   - 当前 UDGK 段落数: ${count}（应为 1）`);
console.log(`   - 总行数: ${after.split('\n').length}（原 ${lines.length}）`);
