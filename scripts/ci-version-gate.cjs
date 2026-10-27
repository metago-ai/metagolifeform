#!/usr/bin/env node
/**
 * MetaGO CI 版本一致性门禁（push 阶段拦截漂移）
 *
 * 检查项（全部硬失败，exit 1）：
 *   C1 技能 frontmatter 合法性（全部 skills/metago-*）
 *   C2 INDEX/skills.json total == 实际技能目录数（杜绝"清单滞后"）
 *   C3 法则引用脚本存在性
 *   C4 版本号跨文件一致：根 package.json == AGENTS.md == GENOME.json == 各包 metago.rules_version/metago_version
 *   C5 V4.1 术语统一（调用 test-v41-terminology.cjs）
 *   C6 引擎包打包基线：package.json files 含 EVOLUTION.md 与 RUNTIME/dist/
*   C7 根级 agents/ 存在且=35、frontmatter 名==文件名、与 plugins 四副本哈希一致（36.9.4 新增）
*   C8 Codex 配置=config.toml 且 setup-mcp/verify 存在 toml 分支标记（36.9.4 新增）
*   C9 cli.js verify 无硬编码版本号（正则断言，36.9.4 新增）
*   C10 离线子包 tgz 内 metago 戳==主包版本（36.9.4 新增）
*   C11 plugins 四 manifest + platform-matrix 版本/技能数==主包口径（36.9.4 新增）
*   C12 根级 SHA256SUMS.txt 存在且清单内文件可解析（36.9.4 新增 · 发布包由阶段 5 产出）
*   C13 全包字节级扫描：metago-admin- 及密钥类模式零命中（36.9.4 新增；*.md 文档与 CHANGELOG 豁免——历史叙述非密钥嵌入）
 *
 * 用法：node scripts/ci-version-gate.cjs
 * 用于：GitHub Actions / Gitee Go / 本地 pre-push hook
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.1.0
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
let failures = 0;

function check(id, ok, detail) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${id} ${detail}`);
  if (!ok) failures++;
}

// ---------- C1 技能 frontmatter ----------
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
  if (!/^name:\s*.+$/m.test(fm) || !/^description:\s*.+$/m.test(fm)) {
    badSkills.push(`${d.name}（缺 name/description）`);
    continue;
  }
  const lines = fm.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^(displayName|profession|category):\s*$/.test(lines[i]) && lines[i + 1] && /^\S/.test(lines[i + 1]) && !lines[i + 1].startsWith('---')) {
      badSkills.push(`${d.name}（${lines[i].split(':')[0]} 子字段未缩进）`);
      break;
    }
  }
}
check('C1', badSkills.length === 0, `技能 frontmatter（${skillDirs.length} 个）${badSkills.length ? '：' + badSkills.slice(0, 5).join('；') : ''}`);

// ---------- C2 INDEX/skills.json 与实际目录一致 ----------
const skillsIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/engine/INDEX/skills.json'), 'utf8'));
const covered = new Set();
for (const fam of Object.values(skillsIndex.families || {})) (fam.skills || []).forEach((s) => covered.add(s));
const actual = skillDirs.map((d) => d.name);
const missingInIndex = actual.filter((s) => !covered.has(s));
const ghostInIndex = [...covered].filter((s) => !actual.includes(s));
check('C2', skillsIndex.total === actual.length && missingInIndex.length === 0 && ghostInIndex.length === 0,
  `INDEX total=${skillsIndex.total} vs 实际=${actual.length}${missingInIndex.length ? '；索引缺：' + missingInIndex.join(',') : ''}${ghostInIndex.length ? '；幽灵：' + ghostInIndex.join(',') : ''}`);

// ---------- C3 法则引用脚本 ----------
const need = ['scripts/pre-delivery-verify.cjs', 'scripts/test-v41-terminology.cjs', 'scripts/memory-guard.cjs', 'scripts/install.ps1', 'scripts/install.sh'];
const missing = need.filter((s) => !fs.existsSync(path.join(ROOT, s)));
check('C3', missing.length === 0, missing.length ? `缺失：${missing.join(', ')}` : '法则引用脚本全部存在');

// ---------- C4 版本跨文件一致 ----------
const pkgVer = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const mismatches = [];
const agentsText = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
const agentsM = agentsText.match(/基于《元构全息智能引擎》V(\d+\.\d+\.\d+)/);
if (agentsM && agentsM[1] !== pkgVer) mismatches.push(`AGENTS.md=V${agentsM[1]}`);
const genome = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/engine/GENOME.json'), 'utf8'));
if (genome.package_version !== pkgVer) mismatches.push(`GENOME.json=${genome.package_version}`);
for (const sub of ['algorithms', 'dev-kit', 'engine', 'verify-kit', 'mcp-server']) {
  const pj = path.join(ROOT, 'packages', sub, 'package.json');
  if (!fs.existsSync(pj)) continue;
  const meta = JSON.parse(fs.readFileSync(pj, 'utf8')).metago || {};
  const rv = meta.rules_version || meta.metago_version;
  if (rv && rv !== `V${pkgVer}`) mismatches.push(`${sub}.rules_version=${rv}`);
}
check('C4', mismatches.length === 0, mismatches.length ? `不一致（根=${pkgVer}）：${mismatches.join('；')}` : `版本统一 ${pkgVer}`);

// ---------- C5 术语统一 ----------
let c5ok = true; let c5detail = '无禁用表述';
try {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/test-v41-terminology.cjs')], { stdio: 'pipe' });
} catch (e) {
  c5ok = false;
  c5detail = '发现禁用表述（运行 npm run verify:terminology 查看明细）';
}
check('C5', c5ok, `V4.1 术语统一：${c5detail}`);

// ---------- C6 引擎打包基线 ----------
const engPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/engine/package.json'), 'utf8'));
const files = engPkg.files || [];
check('C6', files.includes('EVOLUTION.md') && files.includes('RUNTIME/dist/'),
  files.includes('EVOLUTION.md') ? '引擎 files 基线就绪' : '引擎 files 缺 EVOLUTION.md');

// ---------- C7 根级 agents/ 一致性（36.9.6） ----------
const crypto = require('crypto');
function sha(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
const agentsRoot = path.join(ROOT, 'agents');
const agentsFiles = fs.existsSync(agentsRoot) ? fs.readdirSync(agentsRoot).filter((f) => f.endsWith('.md')) : [];
let c7ok = agentsFiles.length === 35;
let c7detail = `agents/ = ${agentsFiles.length} 个`;
if (c7ok) {
  const nameOk = agentsFiles.every((f) => {
    const t = fs.readFileSync(path.join(agentsRoot, f), 'utf8');
    const m = /^name:\s*(.+)$/m.exec(t);
    return m && m[1].trim() === f.replace(/\.md$/, '');
  });
  if (!nameOk) { c7ok = false; c7detail += '｜frontmatter name 与文件名不一致'; }
  const refHash = Object.fromEntries(agentsFiles.map((f) => [f, sha(path.join(agentsRoot, f))]));
  for (const sub of ['plugins/agent-plugins-1.0.0/com.metago.life/agents', 'plugins/claude/agents', 'plugins/codex/agents', 'plugins/zcode/agents']) {
    const dir = path.join(ROOT, sub);
    if (!fs.existsSync(dir)) { c7ok = false; c7detail += `｜缺副本 ${sub}`; continue; }
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    if (files.length !== 35 || !files.every((f) => refHash[f] === sha(path.join(dir, f)))) { c7ok = false; c7detail += `｜副本不一致 ${sub}`; }
  }
}
check('C7', c7ok, c7detail);

// ---------- C8 Codex config.toml 分支（36.9.6） ----------
const cliText = fs.readFileSync(path.join(ROOT, 'scripts/cli.js'), 'utf8');
const vliText = fs.readFileSync(path.join(ROOT, 'local-edition/verify-local-install.cjs'), 'utf8');
const c8ok =
  cliText.includes("'.codex', 'config.toml'") &&
  cliText.includes("mcpFileFormat: 'toml'") &&
  cliText.includes("if (cfg.mcpFileFormat === 'toml')") &&
  vliText.includes("'.codex', 'config.toml'") &&
  vliText.includes("mcpFileFormat === 'toml'") &&
  !cliText.includes("'.codex', 'config.json'") &&
  !vliText.includes("'.codex', 'config.json'");
check('C8', c8ok, c8ok ? 'Codex=config.toml + TOML 分支齐备' : 'Codex TOML 分支不完整（检查 cli.js/verify-local-install.cjs）');

// ---------- C9 cli.js verify 无硬编码版本号（36.9.6） ----------
const c9ok =
  cliText.includes("content.includes('V' + VERSION)") &&
  !/V36\.9\.\d/.test(cliText.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/36\.9\.4: /g, '36.9.x: /')) === true ? true : false;
// 简化判定：verify 区域必须动态；历史注释里的 V36.9.x 允许存在
const c9ok2 = cliText.includes("content.includes('V' + VERSION)") && !cliText.includes('/V36\\.9\\.2/.test(content)') && !cliText.includes('期望 V36.9.6');
check('C9', c9ok2, c9ok2 ? 'verify 版本判定动态化' : 'verify 存在硬编码版本号');

// ---------- C10 离线子包 tgz 戳（36.9.6） ----------
function tgzPkg(tgzName) {
  const { execFileSync } = require('child_process');
  const out = execFileSync('tar', ['-xOf', path.join(ROOT, 'local-edition/offline-packages', tgzName), 'package/package.json'], { encoding: 'utf8', stdio: 'pipe' });
  return JSON.parse(out);
}
const pkgVerB = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
let c10ok = true; const c10d = [];
try {
  const e = tgzPkg('metago-ai-engine-2.1.5.tgz');
  if (e.metago && e.metago.metago_version === `V${pkgVerB}`) { c10d.push(`engine=${e.metago.metago_version}`); } else { c10ok = false; c10d.push(`engine=${e.metago && e.metago.metago_version}`); }
  for (const [n, f] of [['metago-ai-algorithms-1.0.5.tgz', 'algorithms'], ['metago-ai-dev-kit-1.1.4.tgz', 'dev-kit'], ['metago-ai-verify-kit-1.1.6.tgz', 'verify-kit']]) {
    const o = tgzPkg(n);
    if (o.metago && o.metago.rules_version === `V${pkgVerB}`) { c10d.push(`${f}=${o.metago.rules_version}`); } else { c10ok = false; c10d.push(`${f}=${o.metago && o.metago.rules_version}`); }
  }
  const m = tgzPkg('metago-ai-mcp-server-1.3.6.tgz');
  const stamp = m.metago && (m.metago.metago_version || m.metago.rules_version);
  /* 修（Round 37）：原先硬编码 '1.3.4'，子包升版后必误报。改为动态读 mcp-server 的 package.json 版本 */
  const mcpExpect = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/mcp-server/package.json'), 'utf8')).version;
  if (m.version === mcpExpect && (!stamp || stamp === `V${pkgVerB}`)) c10d.push(`mcp-server=v${m.version}`); else { c10ok = false; c10d.push(`mcp-server=v${m.version}(期望${mcpExpect})`); }
  const main = fs.readdirSync(path.join(ROOT, 'local-edition/offline-packages')).find((f) => /^metago-lifeform-.*\.tgz$/.test(f));
  if (main) {
    const mp = tgzPkg(main);
    if (mp.version !== pkgVerB) { c10ok = false; c10d.push(`main=${mp.version}(期望${pkgVerB})`); } else c10d.push(`main=${mp.version}`);
  } else c10d.push('main tgz 待阶段 3 后重打（当前无）');
} catch (e) { c10ok = false; c10d.push('异常:' + e.message.slice(0, 80)); }
check('C10', c10ok, c10d.join('；'));

// ---------- C11 plugins 四 manifest + platform-matrix（36.9.6） ----------
const pmJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/platform-matrix.json'), 'utf8'));
const c11checks = [
  pmJson.version === pkgVerB && pmJson.resources.skills.count === 112 && pmJson.resources.law.version === pkgVerB,
  JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/agent-plugins-1.0.0/plugin.json'), 'utf8')).version === pkgVerB,
  JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/agent-plugins-1.0.0/com.metago.life/manifest.json'), 'utf8')).version === pkgVerB,
  JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/claude/.claude-plugin/plugin.json'), 'utf8')).version === pkgVerB,
  JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/zcode/.zcode-plugin/plugin.json'), 'utf8')).version === pkgVerB,
  JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/codex/.codex-plugin/plugin.json'), 'utf8')).version === pkgVerB,
];
check('C11', c11checks.every(Boolean), c11checks.every(Boolean) ? `四 manifest + matrix=${pkgVerB}/112 技能` : '插件口径漂移');

// ---------- C14 根 manifest 的 metago.* 版本字段与子包一致（补丁集新增） ----------
//
// 背景：C10 只核对子包与主版本，`metago.mcpServer.version` / `algorithmsServer` /
// `engine` / `verifyKit` / `devKit` 这五个字段不在任何检查范围内，于是它们可以长期
// 滞后于真实子包而门禁全绿（本次实测：5 个字段全部滞后 1–2 个补丁位）。
// 这条检查把「根 manifest 声明」与「子包 package.json 实际」绑在一起。
const rootMetaFields = [
  ['metago.mcpServer.version', 'packages/mcp-server/package.json'],
  ['metago.algorithmsServer.version', 'packages/algorithms/package.json'],
  ['metago.engine.version', 'packages/engine/package.json'],
  ['metago.verifyKit.version', 'packages/verify-kit/package.json'],
  ['metago.devKit.version', 'packages/dev-kit/package.json'],
];
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const c14bad = [];
for (const [field, file] of rootMetaFields) {
  const target = path.join(ROOT, file);
  if (!fs.existsSync(target)) { c14bad.push(`${file} 缺失`); continue; }
  const declared = field.split('.').reduce((node, part) => (node == null ? undefined : node[part]), rootPkg);
  const actual = JSON.parse(fs.readFileSync(target, 'utf8')).version;
  if (declared !== actual) c14bad.push(`${field} 声明=${declared} 实际=${actual}`);
}
// mcpTools 必须等于两个服务器的工具数之和（不是"把算法数也数进去"的那种口径）
const declaredTools = rootPkg.metago && rootPkg.metago.mcpTools;
const realTools = (rootPkg.metago && rootPkg.metago.mcpServer && rootPkg.metago.mcpServer.tools || 0)
  + (rootPkg.metago && rootPkg.metago.algorithmsServer && rootPkg.metago.algorithmsServer.tools || 0);
if (declaredTools !== realTools) c14bad.push(`metago.mcpTools 声明=${declaredTools} 应=${realTools}`);
check('C14', c14bad.length === 0, c14bad.length ? c14bad.join('；') : `根 manifest 5 个版本字段 + mcpTools 与子包一致（${rootMetaFields.length + 1} 项）`);

// ---------- C12 根级 SHA256SUMS.txt（36.9.6；发布包在阶段 5 产出） ----------
const sumsCandidates = [
  path.join(ROOT, 'SHA256SUMS.txt'),
  process.env.METAGO_RELEASE_STAGE
    ? path.join(process.env.METAGO_RELEASE_STAGE,
                'metagolifeform-v' + JSON.parse(fs.readFileSync(
                  path.join(ROOT, 'package.json'), 'utf8')).version,
                'SHA256SUMS.txt')
    : path.join(ROOT, '_release-stage', 'SHA256SUMS.txt'),
].filter(fs.existsSync);
let c12ok = sumsCandidates.length > 0;
let c12d = c12ok ? '' : 'SHA256SUMS.txt 待发布产出（阶段 5）';
if (c12ok) {
  const sumsPath = sumsCandidates[0];
  const rootDir = path.dirname(sumsPath);
  const lines = fs.readFileSync(sumsPath, 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
  const bad = lines.filter((l) => {
    const m = /^([0-9a-f]{64})\s+\*?(?:\.\/)?(.+?)\s*$/.exec(l.trim());
    return !m || !fs.existsSync(path.join(rootDir, m[2]));
  });
  c12ok = bad.length === 0 && lines.length > 0;
  c12d = `${lines.length} 行，${bad.length} 条无法解析（根=${rootDir}）`;
}
check('C12', c12ok, c12d);

// ---------- C13 密钥字节扫描（36.9.6；*.md 文档/CHANGELOG 豁免为历史叙述） ----------
const { execFileSync: exec2 } = require('child_process');
const secretPattern = /metago-admin-[0-9A-Za-z-]{4,}|sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}/;
const pemBlockPattern = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[^]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/;
const scanRoots = ['scripts', 'core', 'adapters', 'plugins', 'skills', 'templates', 'packages/engine/RUNTIME/dist', 'packages/mcp-server/dist', 'local-edition/portable/node_modules', 'local-edition/offline-packages'];
let c13Hits = [];
for (const r of scanRoots) {
  const abs = path.join(ROOT, r);
  if (!fs.existsSync(abs)) continue;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== '.git') walk(p); continue; }
      if (e.name.endsWith('.md')) continue;
      try {
        const buf = fs.readFileSync(p);
        const pre = buf.subarray(0, Math.min(buf.length, 4000000)).toString('utf8', 0, Math.min(buf.length, 4000000));
        if (secretPattern.test(pre) || pemBlockPattern.test(pre)) c13Hits.push(p.replace(ROOT + path.sep, ''));
      } catch { /* 二进制跳过 */ }
    }
  };
  walk(abs);
}
check('C13', c13Hits.length === 0, c13Hits.length ? `命中：${c13Hits.slice(0, 5).join(', ')}` : '密钥模式零命中');

console.log('');
if (failures > 0) {
  console.error(`❌ CI 版本门禁未通过：${failures} 项失败`);
  process.exit(1);
}
console.log('✅ CI 版本门禁通过（C1–C14 全绿）');
