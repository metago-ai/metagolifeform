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
 *   L3 契约层（仓库自检）：技能 frontmatter / 法则引用脚本存在性 / 版本号一致性
 *   L4 渲染层（仓库自检）：技能内容完整性 / 文档占位符残留
 *   L5 交互层（仓库自检）：安装/卸载/验证脚本转发一致性 / 平台清单一致性
 *   L6 状态层（仓库自检）：记忆守护脚本可用性 / 备份机制存在性
 *   L7 防御层（仓库自检）：非法平台防御 / 空参数防御（cli.js 幂等性）
 *
 * 设计原则（14.4）：活文档、可独立运行、不依赖外部环境变量；发现新缺陷类型时必须把检查加进来。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.1.0
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

// ---------- L4 渲染层（仓库自检） ----------
// L4.1 技能内容完整性：每个 SKILL.md 非空且含核心流程章节
const emptySkills = [];
for (const d of skillDirs) {
  const md = path.join(skillsDir, d.name, 'SKILL.md');
  if (!fs.existsSync(md)) continue;
  const text = fs.readFileSync(md, 'utf8');
  if (text.trim().length < 200) emptySkills.push(`${d.name}（内容过短 ${text.trim().length} 字符）`);
  else if (!/^#{1,3}\s/m.test(text)) emptySkills.push(`${d.name}（缺少 Markdown 标题结构）`);
}
record('L4.1', `技能内容完整性（${skillDirs.length} 个技能）`, emptySkills.length === 0, emptySkills.length ? emptySkills.slice(0, 5).join('；') + (emptySkills.length > 5 ? ` 等 ${emptySkills.length} 项` : '') : '全部含完整内容');

// L4.2 文档占位符残留：docs/*.md 中无未替换的 {{...}} 占位符
// 注：AGENTS.md 是跨平台模板母本，含 {{PLATFORM_NAME}}/{{MCP_SERVERS_TABLE}} 等设计内占位符（安装时替换），豁免扫描
const placeholderRe = /\{\{[A-Z_]+\}\}/;
const docFiles = walk(path.join(ROOT, 'docs'), ['.md']);
const placeholderFiles = [];
for (const f of docFiles) {
  let text;
  try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (placeholderRe.test(text)) placeholderFiles.push(path.relative(ROOT, f));
}
record('L4.2', '文档占位符残留扫描（docs/，AGENTS.md 母本模板豁免）', placeholderFiles.length === 0, placeholderFiles.length ? `残留：${placeholderFiles.join(', ')}` : '无 {{...}} 占位符');

// ---------- L5 交互层（仓库自检） ----------
// L5.1 安装/卸载/验证脚本必须统一转发 cli.js（消除双轨）
const forwardScripts = ['install.ps1', 'uninstall.ps1', 'verify.ps1', 'setup-mcp-server.ps1', 'install.sh'];
const nonForwarding = forwardScripts.filter((s) => {
  const p = path.join(ROOT, 'scripts', s);
  if (!fs.existsSync(p)) return true; // 缺失视为未转发
  const text = fs.readFileSync(p, 'utf8');
  return !/cli\.js/.test(text);
});
record('L5.1', '脚本转发一致性（install/uninstall/verify/setup-mcp/install.sh → cli.js）', nonForwarding.length === 0, nonForwarding.length ? `未转发 cli.js：${nonForwarding.join(', ')}` : '5/5 全部统一转发');

// L5.2 平台清单一致性：AGENTS.md 声明 7 平台 vs cli.js 实现 7 平台
const cliJsText = fs.existsSync(path.join(ROOT, 'scripts', 'cli.js')) ? fs.readFileSync(path.join(ROOT, 'scripts', 'cli.js'), 'utf8') : '';
const cliPlatforms = (cliJsText.match(/'(trae|claude-code|codex|cursor|codebuddy|qoder|zcode)'/g) || []).length;
record('L5.2', '平台清单一致性（7 大平台）', cliPlatforms >= 7, cliPlatforms >= 7 ? 'cli.js 含 7 平台配置' : `cli.js 平台引用异常：${cliPlatforms}`);

// ---------- L6 状态层（仓库自检） ----------
// L6.1 记忆守护脚本可用性（第十六章 L4 冻记忆硬门）
const memoryGuardPath = path.join(ROOT, 'scripts', 'memory-guard.cjs');
const memoryGuardOk = fs.existsSync(memoryGuardPath);
if (memoryGuardOk) {
  try {
    execFileSync('node', ['--check', memoryGuardPath], { timeout: 30000 });
    record('L6.1', '记忆守护脚本（memory-guard.cjs）', true, '存在且语法正确');
  } catch {
    record('L6.1', '记忆守护脚本（memory-guard.cjs）', false, '存在但语法错误');
  }
} else {
  record('L6.1', '记忆守护脚本（memory-guard.cjs）', false, '缺失');
}

// L6.2 备份机制存在性（cli.js 含 backupNative/listBackups）
const hasBackup = /function backupNative/.test(cliJsText) && /function listBackups/.test(cliJsText);
record('L6.2', '备份机制（cli.js backupNative/listBackups）', hasBackup, hasBackup ? '备份函数齐全' : '备份函数缺失');

// ---------- L7 防御层（仓库自检） ----------
// L7.1 非法平台防御：cli.js 对未知平台必须拒绝（exit 1）
const invalidPlatformGuard = /不支持的平台/.test(cliJsText) && /process\.exit\(1\)/.test(cliJsText);
record('L7.1', '非法平台防御（cli.js 拒绝未知平台）', invalidPlatformGuard, invalidPlatformGuard ? '含平台校验 + 退出码 1' : '缺少平台校验');

// L7.2 空参数防御：cli.js 无命令/空参数时应输出 help 而非崩溃
const helpFallback = /default:\s*\n\s*showHelp\(\);/.test(cliJsText) || /showHelp\(\);/.test(cliJsText);
record('L7.2', '空参数防御（cli.js 默认回退 help）', helpFallback, helpFallback ? '含 help 兜底分支' : '缺少 help 兜底');

// ---------- 汇总 ----------
console.log('\n==========================================');
console.log(`  结果：${failCount} 失败 / ${warnCount} 警告 / ${results.length} 项检查`);
console.log('==========================================');
if (failCount > 0 || (OPT.strict && warnCount > 0)) {
  console.log('  ❌ 交付硬门未通过，按第十四章要求修复后重新验证');
  process.exit(1);
}
console.log('  ✅ 交付验证通过');
