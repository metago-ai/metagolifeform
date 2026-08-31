#!/usr/bin/env node
/**
 * install.js — 元构完整性治理套件 · 一键安装（ZCode / Claude Code / 通用）
 *
 * 用法: node install.js [--platform zcode|claude-code|all] [--skip-hooks] [--skip-law-inject] [--global-cli]
 * 安装内容（分级强制）:
 *   1. 技能（软强制）: metago-completeness-guard → 平台技能目录
 *   2. hooks（硬强制）: PreToolUse 拦截禁用声明词 + Stop 提醒 → 平台 hooks 配置
 *   3. 法则注入（声明纪律）: AGENTS.md/CLAUDE.md 追加完整性治理条款（幂等）
 *   4. 全局 CLI: completeness-guard 命令（--global-cli 时执行 npm install -g）
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const KIT_ROOT = path.resolve(__dirname, '.');
const HOME = os.homedir();
const SKILL_SRC = path.join(KIT_ROOT, 'skills', 'metago-completeness-guard');

const LAW_SECTION = `

---

## 完整性治理条款（由 metago-completeness-kit 注入 · 强制生效）

1. **禁止禁用声明词**：绝对完整 / 100%完美 / 100%完整 / 不会再缺 / 不可能有遗漏——任何输出不得使用。
2. **宣称完整前置条件**：必须运行 \`completeness-guard verify\`（或等价验证）且全绿，并附验证报告。
3. **标准声明格式**："当前基线（Vx，N 项）覆盖全绿 + 已知缺口 M 项已登记（completeness-guard gaps list 查看）"。
4. **缺口登记**：所有已知未覆盖/分期项必须登记在 completeness-gaps.json；可见的缺口优于隐藏的完美。
5. **完整性是持续治理**：定期运行 \`completeness-guard radar check\` 扫描行业/竞品/元构升级；基线是活的（baseline add 可扩展）。
<!-- METAGO-COMPLETENESS-KIT-MARK -->
`;

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function injectLaw(lawFile) {
  if (!fs.existsSync(lawFile)) return false;
  const content = fs.readFileSync(lawFile, 'utf8');
  if (content.includes('METAGO-COMPLETENESS-KIT-MARK')) return 'already';
  fs.appendFileSync(lawFile, LAW_SECTION);
  return 'injected';
}

function installZCode(opts) {
  console.log('→ 安装到 ZCode...');
  const base = path.join(HOME, '.zcode');
  // 1. 技能
  if (!opts.skipSkill) {
    copyDir(SKILL_SRC, path.join(base, 'skills', 'metago-completeness-guard'));
    console.log('  ✓ 技能 → ~/.zcode/skills/metago-completeness-guard');
  }
  // 2. hooks（合并到 cli/config.json）
  if (!opts.skipHooks) {
    const cfgFile = path.join(base, 'cli', 'config.json');
    let cfg = {};
    if (fs.existsSync(cfgFile)) { try { cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8')); } catch {} }
    cfg.hooks = cfg.hooks || { enabled: false };
    cfg.hooks.enabled = true;
    const kitRootForCfg = KIT_ROOT.split('\\').join('/');
    cfg.hooks.PreToolUse = cfg.hooks.PreToolUse || [];
    cfg.hooks.PreToolUse.push({
      matcher: 'Edit|Write|Bash',
      hooks: [{ type: 'command', command: `node ${kitRootForCfg}/hooks/scripts/pre-tool-use-guard.cjs` }]
    });
    cfg.hooks.Stop = cfg.hooks.Stop || [];
    cfg.hooks.Stop.push({
      hooks: [{ type: 'command', command: `node ${kitRootForCfg}/hooks/scripts/stop-verify.cjs` }]
    });
    fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2), 'utf8');
    console.log('  ✓ hooks 强制门 → ~/.zcode/cli/config.json（PreToolUse 拦截 + Stop 提醒）');
  }
  // 3. 法则注入
  if (!opts.skipLawInject) {
    for (const f of [path.join(base, 'AGENTS.md'), path.join(base, 'CLAUDE.md')]) {
      const r = injectLaw(f);
      if (r === 'injected') console.log(`  ✓ 声明纪律已注入: ${path.basename(f)}`);
      else if (r === 'already') console.log(`  = 声明纪律已在: ${path.basename(f)}（幂等跳过）`);
    }
  }
  console.log('  ✅ ZCode 安装完成（技能+强制门+声明纪律 三层生效）');
}

function installClaudeCode(opts) {
  console.log('→ 安装到 Claude Code...');
  const base = path.join(HOME, '.claude');
  if (!opts.skipSkill) {
    copyDir(SKILL_SRC, path.join(base, 'skills', 'metago-completeness-guard'));
    console.log('  ✓ 技能 → ~/.claude/skills/metago-completeness-guard');
  }
  if (!opts.skipHooks) {
    const settingsFile = path.join(base, 'settings.json');
    let settings = {};
    if (fs.existsSync(settingsFile)) { try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')); } catch {} }
    settings.hooks = settings.hooks || {};
    const kitRootForCfg = KIT_ROOT.split('\\').join('/');
    settings.hooks.PreToolUse = settings.hooks.PreToolUse || [];
    settings.hooks.PreToolUse.push({
      matcher: 'Edit|Write|Bash',
      hooks: [{ type: 'command', command: `node ${kitRootForCfg}/hooks/scripts/pre-tool-use-guard.cjs` }]
    });
    settings.hooks.Stop = settings.hooks.Stop || [];
    settings.hooks.Stop.push({ hooks: [{ type: 'command', command: `node ${kitRootForCfg}/hooks/scripts/stop-verify.cjs` }] });
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
    console.log('  ✓ hooks 强制门 → ~/.claude/settings.json');
  }
  if (!opts.skipLawInject) {
    const lawFile = path.join(HOME, 'CLAUDE.md');
    const r = injectLaw(lawFile);
    console.log(r === 'injected' ? '  ✓ 声明纪律已注入: ~/CLAUDE.md' : r === 'already' ? '  = 声明纪律已在（幂等）' : '  - 跳过（无 CLAUDE.md）');
  }
  console.log('  ✅ Claude Code 安装完成');
}

function installGlobalCLI() {
  console.log('→ 全局 CLI（completeness-guard 命令）...');
  try {
    execSync('npm install -g .', { cwd: KIT_ROOT, stdio: 'inherit' });
    console.log('  ✓ completeness-guard 已全局安装');
  } catch (e) {
    console.log('  - 全局安装失败（可手动: cd completeness-kit && npm install -g .）');
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { platform: 'all', skipHooks: false, skipSkill: false, skipLawInject: false, globalCli: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--platform') opts.platform = args[++i] || 'all';
    else if (args[i] === '--skip-hooks') opts.skipHooks = true;
    else if (args[i] === '--skip-skill') opts.skipSkill = true;
    else if (args[i] === '--skip-law-inject') opts.skipLawInject = true;
    else if (args[i] === '--global-cli') opts.globalCli = true;
  }
  return opts;
}

const opts = parseArgs();
console.log('══════════════════════════════════════════════');
console.log('  元构完整性治理套件（Completeness Kit v1.0.0）');
console.log('══════════════════════════════════════════════');

if (opts.platform === 'all' || opts.platform === 'zcode') installZCode(opts);
if (opts.platform === 'all' || opts.platform === 'claude-code') installClaudeCode(opts);
if (opts.globalCli) installGlobalCLI();

console.log('\n✅ 安装完成。验证: completeness-guard verify --doc <文档>');
console.log('   技能: metago-completeness-guard（Agent 将自动遵守）');
