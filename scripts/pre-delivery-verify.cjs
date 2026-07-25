#!/usr/bin/env node
/**
 * MetaGO 交付前七层验证脚本（AGENTS.md 第十四章硬门）
 *
 * 用法：
 *   node scripts/pre-delivery-verify.cjs [--project=lifeform] [--web] [--strict]
 *
 * 层级：
 *   L1 技术层：环境前置 / tsc 类型检查 / 构建 / 产物扫描（localhost·mock·密钥）/ 依赖审计
 *   L2 链路层：Web 可达性（仅 --web 时执行，需要网络；默认跳过并显式报告）
 *   L3 仓库完整性（本仓库专用）：技能 frontmatter / 法则引用脚本存在性 / 版本号一致性
 *
 * 设计原则（14.4）：活文档、可独立运行、不依赖外部环境变量；发现新缺陷类型时必须把检查加进来。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

const args = process.argv.slice(2);
const OPT = {
  project: (args.find((a) => a.startsWith('--project=')) || '--project=lifeform').split('=')[1],
  web: args.includes('--web'),
  strict: args.includes('--strict'),
};

const ROOT = path.resolve(__dirname, '..');
const results = [];
let failCount = 0;
let warnCount = 0;

function record(id, desc, ok, detail, level = 'fail') {
  results.push({ id, desc, ok, detail });
  const mark = ok === true ? 'PASS' : ok === null ? 'SKIP' : 'FAIL';
  if (ok === false && level === 'fail') failCount++;
  if (ok === false && level === 'warn') warnCount++;
  console.log(`  [${mark}] ${id} ${desc}${detail ? ` — ${detail}` : ''}`);
}

function tryExec(cmd, opts = {}) {
  try {
    return { ok: true, out: execSync(cmd, { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'], timeout: 300000, ...opts }).toString() };
  } catch (e) {
    return { ok: false, out: (e.stdout || '').toString() + (e.stderr || '').toString(), code: e.status };
  }
}

function walk(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.metago-backup')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    else if (exts.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

console.log('==========================================');
console.log(`  MetaGO 交付前验证 · project=${OPT.project}`);
console.log('==========================================\n');

// ---------- L1.1 环境前置 ----------
const nodeOk = process.version;
record('L1.1', '环境前置（Node 运行时）', true, `node ${nodeOk}`);

// ---------- L1.2 TypeScript 类型检查（仅当根 tsconfig 存在时执行） ----------
const hasTsconfig = fs.existsSync(path.join(ROOT, 'tsconfig.json'));
if (hasTsconfig) {
  const tsc = tryExec('npx --no-install tsc -b --pretty false');
  record('L1.2', 'TypeScript 类型检查', tsc.ok, tsc.ok ? '0 错误' : `失败：${tsc.out.split('\n')[0] || 'tsc 不可用'}`, 'warn');
} else {
  record('L1.2', 'TypeScript 类型检查', null, '根目录无 tsconfig（各 packages 构建时自检）');
}

// ---------- L1.3 构建（本仓库为文档/脚本型，无强制构建步骤） ----------
record('L1.3', '构建', null, 'lifeform 仓库无统一构建步骤（引擎构建见 packages/engine）');

// ---------- L1.4 产物/源码扫描：localhost · mock · 密钥泄露 ----------
const scanFiles = walk(ROOT, ['.js', '.cjs', '.mjs', '.ts', '.json', '.md', '.ps1', '.sh']);
const secretRe = /(ghp_[A-Za-z0-9]{20,}|glpat-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|OPENSSH|EC) PRIVATE KEY-----)/;
const hardcodedLocalRe = /(c:\\\\Users\\\\MetaGO|d:\\\\元构能力|\/Users\/yixiao)/i;
let leaks = [];
let hardcoded = [];
for (const f of scanFiles) {
  let text;
  try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
  const rel = path.relative(ROOT, f);
  // 脚本自身与法则文档中的"禁用清单示例"豁免
  const isLawDoc = /^(AGENTS\.md|docs[\\/])/i.test(rel) && !/\.(cjs|js|ts)$/i.test(rel);
  if (secretRe.test(text)) leaks.push(rel);
  if (!isLawDoc && hardcodedLocalRe.test(text)) hardcoded.push(rel);
}
record('L1.4a', '密钥/令牌泄露扫描', leaks.length === 0, leaks.length ? `命中：${leaks.join(', ')}` : '无明文密钥');
record('L1.4b', '作者机器私有路径硬编码扫描', hardcoded.length === 0, hardcoded.length ? `命中：${hardcoded.join(', ')}` : '无私有路径', 'warn');

// ---------- L1.5 依赖审计 ----------
const audit = tryExec('npm audit --omit=dev --json');
if (audit.ok || audit.out) {
  try {
    const report = JSON.parse(audit.out);
    const v = (report.metadata && report.metadata.vulnerabilities) || {};
    const bad = (v.high || 0) + (v.critical || 0);
    record('L1.5', '依赖审计（npm audit High/Critical）', bad === 0, `high=${v.high || 0} critical=${v.critical || 0}`, 'warn');
  } catch {
    record('L1.5', '依赖审计', null, 'audit 输出不可解析（可能无 lock 文件）');
  }
} else {
  record('L1.5', '依赖审计', null, 'npm audit 不可用');
}

// ---------- L2 链路层（仅 --web） ----------
if (OPT.web) {
  const head = tryExec('curl -sI -o NUL -w "%{http_code}" https://metago.life/ --max-time 15');
  record('L2.1', 'Web 端可达性（metago.life）', head.ok && head.out.trim().startsWith('2'), `HTTP ${head.out.trim() || '不可达'}`, 'warn');
} else {
  record('L2.x', '链路层（Web 可达性）', null, '未指定 --web，跳过（部署后必须补跑）');
}

// ---------- L3 仓库完整性 ----------
// L3.1 全部技能含合法 frontmatter
const skillsDir = path.join(ROOT, 'skills');
const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith('metago-'));
const badSkills = [];
for (const d of skillDirs) {
  const md = path.join(skillsDir, d.name, 'SKILL.md');
  if (!fs.existsSync(md)) { badSkills.push(`${d.name}（缺 SKILL.md）`); continue; }
  const text = fs.readFileSync(md, 'utf8');
  if (!text.startsWith('---')) { badSkills.push(`${d.name}（无 frontmatter）`); continue; }
  const fm = text.slice(3, text.indexOf('\n---', 3));
  if (!/^name:\s*.+$/m.test(fm) || !/^description:\s*.+$/m.test(fm)) badSkills.push(`${d.name}（frontmatter 缺 name/description）`);
  // 缩进校验：displayName/profession/category 为"空值键"（: 后无内容）时，下一行必须缩进
  const lines = fm.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^(displayName|profession|category):\s*$/.test(lines[i]) && lines[i + 1] && /^\S/.test(lines[i + 1]) && !lines[i + 1].startsWith('---')) {
      badSkills.push(`${d.name}（${lines[i].split(':')[0]} 子字段未缩进）`);
      break;
    }
  }
}
record('L3.1', `技能 frontmatter 校验（${skillDirs.length} 个技能）`, badSkills.length === 0, badSkills.length ? badSkills.slice(0, 5).join('；') + (badSkills.length > 5 ? ` 等 ${badSkills.length} 项` : '') : '全部合法');

// L3.2 法则引用的脚本必须存在
const lawScripts = ['scripts/pre-delivery-verify.cjs', 'scripts/test-v41-terminology.cjs', 'scripts/memory-guard.cjs', 'scripts/install.ps1', 'scripts/install.sh'];
const missingScripts = lawScripts.filter((s) => !fs.existsSync(path.join(ROOT, s)));
record('L3.2', '法则引用脚本存在性', missingScripts.length === 0, missingScripts.length ? `缺失：${missingScripts.join(', ')}` : '全部存在');

// L3.3 版本一致性：根 package.json vs AGENTS.md vs cli.js
const pkgVer = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const agentsText = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
const agentsVerM = agentsText.match(/V(\d+\.\d+\.\d+)/);
const cliText = fs.existsSync(path.join(ROOT, 'scripts', 'cli.js')) ? fs.readFileSync(path.join(ROOT, 'scripts', 'cli.js'), 'utf8') : '';
const cliVerM = cliText.match(/V(\d+\.\d+\.\d+)/);
const versionIssues = [];
if (agentsVerM && agentsVerM[1] !== pkgVer) versionIssues.push(`AGENTS.md=V${agentsVerM[1]} vs package.json=${pkgVer}`);
if (cliVerM && cliVerM[1] !== pkgVer) versionIssues.push(`cli.js=V${cliVerM[1]} vs package.json=${pkgVer}`);
record('L3.3', '版本号跨文件一致性', versionIssues.length === 0, versionIssues.length ? versionIssues.join('；') : `统一 ${pkgVer}`);

// ---------- 汇总 ----------
console.log('\n==========================================');
console.log(`  结果：${failCount} 失败 / ${warnCount} 警告 / ${results.length} 项检查`);
console.log('==========================================');
if (failCount > 0 || (OPT.strict && warnCount > 0)) {
  console.log('  ❌ 交付硬门未通过，按第十四章要求修复后重新验证');
  process.exit(1);
}
console.log('  ✅ 交付验证通过');
