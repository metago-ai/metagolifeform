#!/usr/bin/env node
/**
 * audit-consistency.cjs — 口径一致性扫描器（V36.9.6 · 阶段 2/6 交付）
 * 五类口径：版本 / 技能数 / 工具数 / 公理与属性 / 平台数。
 * 事实源：根 package.json（version / metago.mcpServer.tools / metago.axioms）。
 * 豁免清单（历史快照区，不参与扫描）：
 *   - 带"历史设计文档 / 历史章节 / 历史快照"标注的文件（docs/ARCHITECTURE|PRD|STRATEGY|WHITEPAPER 等）
 *   - CHANGELOG.md（历史发行叙述区）
 *   - packages/docs-site/**（营销站点快照文案，非当前口径事实源）
 *   - 脚本内"36.9.x 修复/新增/并入/起"等历史归属注释（非现行口径戳）
 * 用法：node scripts/audit-consistency.cjs   （零漂移 exit 0，否则 exit 1）
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
function rd(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }
function jd(p) { return JSON.parse(rd(p)); }
const rootPkg = jd('package.json');
const V = rootPkg.version;                 // 36.9.6
const VX = 'V' + V;
const TOOLS = rootPkg.metago.mcpServer.tools;   // 53（阶段 3 后 55，自动跟随）
const AXIOMS = rootPkg.metago.axioms;           // 10
const SKILLS = rootPkg.metago.skills;           // 100
const ALGO_TOOLS = 57;
const TOTAL_TOOLS = TOOLS + ALGO_TOOLS;         // 110（阶段 3 后 112）
const PLATFORMS = 11;
let drift = [];
function chk(ok, msg) { if (!ok) drift.push(msg); }
function scanVersion(file, exemptRe) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  const lines = rd(file).split(/\r?\n/);
  lines.forEach((l, i) => {
    if (exemptRe && exemptRe.test(l)) return;
    const m = /V?36\.(?:9|10|11)\.(\d+)/.exec(l);
    if (m && m[1] !== V.split('.')[2]) drift.push(`版本: ${file}:${i + 1} 含 36.9.${m[1]} → ${l.trim().slice(0, 70)}`);
  });
}
// 历史归属注释豁免（脚本类）；UPGRADE（历史章节声明）、AXIOMS/ATTRIBUTES（公理原文不可修改/加载基线）整文件豁免
const HIST = /36\.9\.\d+ (修复|新增|并入|起|已|统一|套件|修复轮|发行|资产合流|安全修复|修正|动态化)|版本对齐|历史轮|pre-36\.9\.2|公理原文|加载基线版本|V36\.9\.1（公理原文/;
const VER_SKIP = new Set([
  'docs/UPGRADE.md',
  'packages/engine/CONSTITUTION/AXIOMS.md',
  'packages/engine/CORE/ATTRIBUTES.md',
  'scripts/cli.js', 'scripts/regen-sha256.cjs', 'local-edition/verify-local-install.cjs',
]);

// ============ 1. 版本 ============
const verFiles = [
  'README.md', 'SECURITY.md', 'CONTRIBUTING.md', 'MANIFESTO.md', 'MANIFESTO_EN.md',
  'core/METAGO_CORE.md',
  'docs/MANIFEST.json', 'docs/MCP_SERVER.md', 'docs/PLUGINS.md', 'docs/UPGRADE.md',
  'docs/MAP.md', 'docs/GETTING_STARTED.md', 'docs/RELEASE-CHECKLIST.md', 'docs/PLATFORMS.md',
  'plugins/platform-matrix.json',
  'plugins/agent-plugins-1.0.0/plugin.json',
  'plugins/agent-plugins-1.0.0/com.metago.life/manifest.json',
  'plugins/claude/.claude-plugin/plugin.json',
  'plugins/zcode/.zcode-plugin/plugin.json',
  'plugins/codex/.codex-plugin/plugin.json',
  'plugins/claude/commands/metago-activate.md', 'plugins/claude/commands/metago-skills.md',
  'plugins/zcode/commands/metago-activate.md', 'plugins/zcode/commands/metago-skills.md',
  'adapters/trae/README.md', 'adapters/chatgpt-work/README.md', 'adapters/kimi/README.md', 'adapters/workbuddy/README.md',
  'scripts/cli.js', 'scripts/regen-sha256.cjs', 'local-edition/verify-local-install.cjs',
  'packages/engine/CONSTITUTION/AXIOMS.md', 'packages/engine/CORE/ATTRIBUTES.md',
];
for (const f of verFiles) {
  if (VER_SKIP.has(f)) continue;
  scanVersion(f, HIST);
}
// JSON 事实源比对
if (rootPkg.metago.version !== VX) drift.push(`版本: 根 package.json metago.version=${rootPkg.metago.version} != V${V}`);
for (const sub of ['algorithms', 'dev-kit', 'engine', 'verify-kit', 'mcp-server']) {
  const m = jd(`packages/${sub}/package.json`).metago || {};
  const rv = m.rules_version || m.metago_version;
  if (rv && rv !== VX) drift.push(`版本: ${sub} metago.rules_version=${rv} != ${VX}`);
}
const agentsM = /基于《元构全息智能引擎》V(\d+\.\d+\.\d+)/.exec(rd('AGENTS.md'));
if (agentsM && agentsM[1] !== V) drift.push(`版本: AGENTS.md 头部=${agentsM[1]} != ${V}`);
if (!rd('AGENTS.md').includes(`由 MetaGO Agent Harness ${VX} 安装`)) drift.push('版本: AGENTS.md 页脚非 ' + VX);
if (!rd('AGENTS.md').includes(`| AGENTS.md | ${VX} | 本文件 |`)) drift.push('版本: AGENTS.md §17.10 表非 ' + VX);
const genome = jd('packages/engine/GENOME.json');
if (genome.package_version !== V || genome.metago_version !== VX) drift.push(`版本: GENOME.json=${genome.package_version}/${genome.metago_version}`);

// ============ 2. 技能数 ============
const skillDirs = fs.readdirSync(path.join(ROOT, 'skills')).filter(d => d.startsWith('metago-') && fs.existsSync(path.join(ROOT, 'skills', d, 'SKILL.md')));
chk(skillDirs.length === SKILLS, `技能: 目录=${skillDirs.length} != ${SKILLS}`);
chk(jd('packages/engine/INDEX/skills.json').total === SKILLS, '技能: INDEX/skills.json total 漂移');
const manifestJ = jd('docs/MANIFEST.json');
chk(manifestJ.skills.total === SKILLS, '技能: docs/MANIFEST.json skills.total 漂移');
chk(jd('plugins/platform-matrix.json').resources.skills.count === SKILLS, '技能: platform-matrix count 漂移');
for (const cmd of ['plugins/claude/commands/metago-skills.md', 'plugins/zcode/commands/metago-skills.md']) {
  if (!rd(cmd).includes(`${SKILLS} 个元构技能`)) drift.push(`技能: ${cmd} 未含 ${SKILLS} 个`);
}

// ============ 3. 工具数 ============
chk(rootPkg.metago.mcpServer.tools === TOOLS, '工具: 根 package.json metago.mcpServer.tools 自检失败');
for (const sub of ['engine', 'dev-kit', 'algorithms', 'verify-kit', 'mcp-server']) {
  const meta = jd(`packages/${sub}/package.json`).metago || {};
  if (meta.algorithms && meta.algorithms.tools !== ALGO_TOOLS) drift.push(`工具: ${sub} algorithms.tools=${meta.algorithms.tools}`);
}
const toolsJson = jd('packages/engine/INDEX/tools.json');
const tTotal = (toolsJson.total !== undefined) ? toolsJson.total : (toolsJson.tools ? toolsJson.tools.length : null);
chk(tTotal === TOOLS, `工具: INDEX/tools.json total=${tTotal} != ${TOOLS}`);
chk(manifestJ.mcp_tools.total === TOOLS, `工具: docs/MANIFEST.json mcp_tools.total=${manifestJ.mcp_tools.total} != ${TOOLS}`);
chk(manifestJ.mcp_tools.version === '1.3.4', `工具: MANIFEST mcp 版本=${manifestJ.mcp_tools.version}`);
countIn('scripts/cli.js', `tools: ${TOOLS}`, 10, `工具: cli.js 平台常量 tools:${TOOLS} 出现次数不足（10 个可注入 MCP 平台 + kimi-work 无）`);
countIn('scripts/build-adapters.cjs', `tools: ${TOOLS}`, 1, '工具: build-adapters.cjs tools 常量缺失');
// 描述性总工具数（110/112）
for (const f of ['package.json', 'docs/PLUGINS.md', 'docs/GETTING_STARTED.md']) {
  const c = rd(f);
  const okLine = c.split(/\r?\n/).some(l => l.includes(`${TOTAL_TOOLS}`) && l.includes('工具'));
  if (!okLine) drift.push(`工具: ${f} 缺 ${TOTAL_TOOLS} 工具口径`);
}
for (const f of ['package.json']) {
  const c = rd(f);
  const basic = `核心 MCP ${TOTAL_TOOLS} 工具（${TOOLS}+${ALGO_TOOLS}）`;
  if (!c.includes(basic)) drift.push(`工具: ${f} 缺描述 "${basic}"`);
}
function countIn(file, needle, min, msg) {
  const c = rd(file);
  const n = c.split(needle).length - 1;
  if (n < min) drift.push(msg + `（实际 ${n} 次）`);
}

// ============ 4. 公理与属性 ============
const axioms = rd('packages/engine/CONSTITUTION/AXIOMS.md');
const attrs = rd('packages/engine/CORE/ATTRIBUTES.md');
for (const id of ['A37', 'A38']) if (!axioms.includes(id)) drift.push(`公理: AXIOMS.md 缺 ${id}`);
if (!/V36\.9\.4|36\.9\.4/.test(axioms)) drift.push('公理: AXIOMS.md 缺 36.9.4 版本注记');
for (const id of ['D44', 'D45']) if (!attrs.includes(id)) drift.push(`属性: ATTRIBUTES.md 缺 ${id}`);
if (!/V36\.9\.4|36\.9\.4/.test(attrs)) drift.push('属性: ATTRIBUTES.md 缺 36.9.4 版本注记');
const gText = rd('packages/engine/GENOME.json');
for (const id of ['A37', 'A38', 'D44', 'D45']) if (!gText.includes(id)) drift.push(`公理: GENOME.json 缺 ${id}`);
chk(rootPkg.metago.axioms === AXIOMS, `公理: 根 package.json metago.axioms=${rootPkg.metago.axioms} != ${AXIOMS}`);
if (!rd('docs/GETTING_STARTED.md').includes(`38 条核心公理`)) drift.push('公理: GETTING_STARTED 未含 38 条核心公理');

// ============ 5. 平台数 ============
const PLATFORM_IDS = ['trae', 'claude-code', 'codex', 'cursor', 'codebuddy', 'qoder', 'zcode', 'chatgpt-work', 'workbuddy', 'kimi-code', 'kimi-work'];
const cliText = rd('scripts/cli.js');
const cliPlatforms = PLATFORM_IDS.filter(id => new RegExp(`'${id}':\\s*\\{`).test(cliText));
chk(cliPlatforms.length === PLATFORMS, `平台: cli.js 配置数=${cliPlatforms.length} != ${PLATFORMS}（缺 ${PLATFORM_IDS.filter(id => !cliPlatforms.includes(id)).join(',')}）`);
chk(jd('plugins/platform-matrix.json').platforms.length === PLATFORMS, '平台: platform-matrix platforms 数漂移');
chk(manifestJ.platforms.length === PLATFORMS, '平台: docs/MANIFEST.json platforms 数漂移');
const pd = rd('docs/PLATFORMS.md');
const pdMain = pd.split('## 测试台账')[0];
const pmRows = (pdMain.match(/^\| (?:trae|claude-code|codex|cursor|codebuddy|qoder|zcode|chatgpt-work|workbuddy|kimi-code|kimi-work) \|/gm) || []).length;
chk(pmRows === PLATFORMS, `平台: docs/PLATFORMS.md 承诺矩阵行=${pmRows} != ${PLATFORMS}`);

// ============ 汇总 ============
if (drift.length === 0) {
  console.log(`✅ 口径扫描零漂移（V${V} / ${SKILLS} 技能 / ${TOOLS}+${ALGO_TOOLS}=${TOTAL_TOOLS} 工具 / ${AXIOMS} 公理 / ${PLATFORMS} 平台）`);
  process.exit(0);
}
console.log(`❌ 口径扫描发现 ${drift.length} 处漂移：`);
for (const d of drift) console.log('  - ' + d);
process.exit(1);
