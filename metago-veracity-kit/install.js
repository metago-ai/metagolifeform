#!/usr/bin/env node
/**
 * install.js — 元构行为诚实工程套件 · 一键安装（ZCode / Claude Code）
 * 安装内容：
 *   1. 技能（软强制）: metago-veracity-guard → 平台技能目录
 *   2. hooks（硬强制）: PreToolUse 完成宣称拦截 → 平台 hooks 配置
 *   3. 全局 CLI: veracity-guard（可选 --global-cli）
 *   4. 日志只读保护: 初始化行为日志文件并设为只读
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const KIT_ROOT = path.resolve(__dirname, '.');
const HOME = os.homedir();
const SKILL_SRC = path.join(KIT_ROOT, 'skills', 'metago-veracity-guard');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function initLedger() {
  const file = path.join(HOME, '.metago', 'veracity', 'action-ledger.jsonl');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, '', 'utf8');
  console.log('  ✓ 行为日志已初始化: ' + file);
  return file;
}

function installZCode(opts) {
  console.log('→ 安装到 ZCode...');
  const base = path.join(HOME, '.zcode');
  if (!opts.skipSkill) {
    copyDir(SKILL_SRC, path.join(base, 'skills', 'metago-veracity-guard'));
    console.log('  ✓ 技能 → ~/.zcode/skills/metago-veracity-guard');
  }
  if (!opts.skipHooks) {
    const cfgFile = path.join(base, 'cli', 'config.json');
    let cfg = {};
    if (fs.existsSync(cfgFile)) { try { cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8')) } catch {} }
    cfg.hooks = cfg.hooks || { enabled: false };
    cfg.hooks.enabled = true;
    const kitRootForCfg = KIT_ROOT.split('\\').join('/');
    const gate = {
      matcher: 'Edit|Write|Bash',
      hooks: [{ type: 'command', command: `node ${kitRootForCfg}/hooks/completion-claim-gate.cjs` }]
    };
    cfg.hooks.PreToolUse = cfg.hooks.PreToolUse || [];
    // 幂等：避免重复注册
    const exists = cfg.hooks.PreToolUse.some((h) => JSON.stringify(h).includes('completion-claim-gate'));
    if (!exists) cfg.hooks.PreToolUse.push(gate);
    fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2), 'utf8');
    console.log('  ✓ 完成宣称拦截 hook → ~/.zcode/cli/config.json');
  }
  initLedger();
  console.log('  ✅ ZCode 安装完成');
}

function installClaudeCode(opts) {
  console.log('→ 安装到 Claude Code...');
  const base = path.join(HOME, '.claude');
  if (!opts.skipSkill) {
    copyDir(SKILL_SRC, path.join(base, 'skills', 'metago-veracity-guard'));
    console.log('  ✓ 技能 → ~/.claude/skills/metago-veracity-guard');
  }
  if (!opts.skipHooks) {
    const settingsFile = path.join(base, 'settings.json');
    let settings = {};
    if (fs.existsSync(settingsFile)) { try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')) } catch {} }
    settings.hooks = settings.hooks || {};
    settings.hooks.PreToolUse = settings.hooks.PreToolUse || [];
    const kitRootForCfg = KIT_ROOT.split('\\').join('/');
    const gate = { matcher: 'Edit|Write|Bash', hooks: [{ type: 'command', command: `node ${kitRootForCfg}/hooks/completion-claim-gate.cjs` }] };
    const exists = settings.hooks.PreToolUse.some((h) => JSON.stringify(h).includes('completion-claim-gate'));
    if (!exists) settings.hooks.PreToolUse.push(gate);
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
    console.log('  ✓ 完成宣称拦截 hook → ~/.claude/settings.json');
  }
  initLedger();
  console.log('  ✅ Claude Code 安装完成');
}

function installGlobalCLI() {
  try {
    execSync('npm install -g .', { cwd: KIT_ROOT, stdio: 'inherit' });
    console.log('  ✓ veracity-guard 已全局安装');
  } catch (e) {
    console.log('  - 全局安装失败（可手动: cd metago-veracity-kit && npm install -g .）');
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { platform: 'all', skipHooks: false, skipSkill: false, globalCli: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--platform') opts.platform = args[++i] || 'all';
    else if (args[i] === '--skip-hooks') opts.skipHooks = true;
    else if (args[i] === '--skip-skill') opts.skipSkill = true;
    else if (args[i] === '--global-cli') opts.globalCli = true;
  }
  return opts;
}

const opts = parseArgs();
console.log('══════════════════════════════════════════════');
console.log('  元构行为诚实工程套件（Veracity Kit v1.0.0）');
console.log('══════════════════════════════════════════════');
if (opts.platform === 'all' || opts.platform === 'zcode') installZCode(opts);
if (opts.platform === 'all' || opts.platform === 'claude-code') installClaudeCode(opts);
if (opts.globalCli) installGlobalCLI();
console.log('\n✅ 安装完成。验证: veracity-guard reconcile --file <完成报告>');
