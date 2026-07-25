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
 *
 * 用法：node scripts/ci-version-gate.cjs
 * 用于：GitHub Actions / Gitee Go / 本地 pre-push hook
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
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

console.log('');
if (failures > 0) {
  console.error(`❌ CI 版本门禁未通过：${failures} 项失败`);
  process.exit(1);
}
console.log('✅ CI 版本门禁通过（C1–C6 全绿）');
