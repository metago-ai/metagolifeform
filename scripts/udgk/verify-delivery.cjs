#!/usr/bin/env node
/*============================================================================
 * UDGK · verify-delivery.cjs — 通用门禁脚本（资产 ④）
 * ---------------------------------------------------------------------------
 * 一键扫描 RTM + 跑形态断言 + 跑视觉 diff + 汇总报告。任何项目 node 即跑。
 *
 * 四重门禁（任何一道不过 = 系统判定「未完成」）：
 *   [门禁 1] RTM 完整性   —— requirements-traceability.md 表头四列齐备 + 无空要求 + 无空证据
 *   [门禁 2] 形态断言     —— e2e/asserts/ 下断言文件全部通过（把「长什么样」翻译成 DOM 断言）
 *   [门禁 3] 视觉 diff    —— current/ 与 baseline/ 像素对比 ≤ 阈值（量化「变了没有」）
 *   [门禁 4] 报告生成     —— 输出 delivery-report.md 全绿才允许宣告完成
 *
 * 配置驱动：读 delivery.config.json（换项目只改配置不改代码）
 *
 * 用法：
 *   node verify-delivery.cjs                 # 读 delivery.config.json 执行四重门禁
 *   node verify-delivery.cjs --project=X     # 指定项目名
 *   node verify-delivery.cjs --strict        # 严格模式（警告也 FAIL）
 *   node verify-delivery.cjs --init          # 若缺 config，自动初始化骨架
 *
 * 零依赖：仅需 Node。断言/截图可适配任意栈（Playwright/Vitest 可选）。
 *
 * @author MetaGO / UDGK
 * @version 2.0.0
 *============================================================================*/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const pick = (flag, def) => {
  const hit = args.find((a) => a.startsWith(flag + '='));
  return hit ? hit.split('=').slice(1).join('=') : def;
};
const ROOT = path.resolve('.');
const CONFIG_NAME = 'delivery.config.json';

/* ---------------------------------------------------------------------------
 * 配置加载（配置驱动：换项目只改 config 不改代码）
 * ------------------------------------------------------------------------- */
function loadConfig() {
  const cfgPath = path.join(ROOT, CONFIG_NAME);
  if (!fs.existsSync(cfgPath)) {
    // 无配置 → 提示用 init-delivery.cjs 初始化（若 --init 则自动初始化）
    if (args.includes('--init')) {
      console.log('  [INFO] 未找到 delivery.config.json，自动初始化 UDGK 骨架…');
      execSync(`node "${path.join(__dirname, 'init-delivery.cjs')}"`, { stdio: 'inherit' });
    } else {
      console.log('  [WARN] 未找到 delivery.config.json');
      console.log('         运行: node init-delivery.cjs  初始化 UDGK 骨架');
      console.log('         （或: node verify-delivery.cjs --init）');
    }
    return defaultConfig();
  }
  return Object.assign(defaultConfig(), JSON.parse(fs.readFileSync(cfgPath, 'utf8')));
}

function defaultConfig() {
  return {
    project: path.basename(ROOT),
    requirements: { doc: 'docs/requirements.md', traceability: 'docs/rtm.md' },
    assertions: { dir: 'e2e/asserts', pattern: '\\.(js|cjs|mjs|ts|spec\\.ts)$' },
    visual: { baseline: '.visual-baseline/baseline', current: '.visual-baseline/current', diffThreshold: 0.02, diffOutput: '.visual-baseline/diff' },
    gate: { strict: false, requireRTM: true, requireAssertions: true, requireVisual: true },
    report: { output: 'docs/delivery-report.md' },
  };
}

const CONFIG = loadConfig();
// CLI 覆盖 config
if (args.includes('--strict')) CONFIG.gate.strict = true;
const P = pick('--project', CONFIG.project);
const THRESHOLD = CONFIG.visual.diffThreshold || 0.02;

const results = [];
let failCount = 0;
let warnCount = 0;
let skipCount = 0;

function record(id, desc, ok, detail, level = 'fail') {
  results.push({ id, desc, ok, detail });
  const mark = ok === true ? 'PASS' : ok === null ? 'SKIP' : 'FAIL';
  if (ok === false && level === 'fail') failCount++;
  if (ok === false && level === 'warn') warnCount++;
  if (ok === null) skipCount++;
  console.log(`  [${mark}] ${id} ${desc}${detail ? ` — ${detail}` : ''}`);
}

function exists(p) { return fs.existsSync(path.join(ROOT, p)); }
function tryExec(cmd) {
  try {
    return { ok: true, out: execSync(cmd, { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'], timeout: 600000 }).toString() };
  } catch (e) {
    return { ok: false, out: (e.stdout || '').toString() + (e.stderr || '').toString() };
  }
}

/* ---------------------------------------------------------------------------
 * [门禁 1] RTM 完整性
 * ------------------------------------------------------------------------- */
function checkRTM() {
  console.log('\n[门禁 1/4] RTM 完整性（requirements-traceability）');
  const rtmPath = CONFIG.requirements.traceability;
  if (!exists(rtmPath)) {
    record('RTM.1', 'RTM 文件存在', CONFIG.gate.requireRTM ? false : null,
      `${rtmPath} 不存在（运行 node init-delivery.cjs 生成空表）`);
    return;
  }
  const text = fs.readFileSync(path.join(ROOT, rtmPath), 'utf8');
  const lines = text.split('\n');
  const header = lines.find((l) => l.includes('|') && l.includes('要求') && l.includes('代码'));
  const hasHeader = !!header;
  const hasCode = header && /代码/.test(header);
  const hasAssert = header && /断言/.test(header);
  const hasEvidence = header && /证据/.test(header);
  record('RTM.1', 'RTM 表头含四列（要求/代码/断言/证据）', hasHeader && hasCode && hasAssert && hasEvidence,
    header ? `表头: ${header.trim().replace(/\s+/g, ' ')}` : '未找到含「要求+代码」的表头');

  const dataRows = lines.filter((l) => l.startsWith('|') && !/^\|[\s\-|]+\|*$/.test(l) && !/要求/.test(l));
  const emptyReq = dataRows.filter((l) => { const c = l.split('|').map((x) => x.trim()); return c.length >= 2 && c[1] === ''; });
  record('RTM.2', `RTM 数据行（${dataRows.length} 行）要求列非空`, emptyReq.length === 0,
    emptyReq.length ? `${emptyReq.length} 行要求为空` : '全部要求列已填写');

  const emptyEv = dataRows.filter((l) => { const c = l.split('|').map((x) => x.trim()); return c.length >= 5 && c[4] === ''; });
  record('RTM.3', 'RTM 数据行证据列非空', emptyEv.length === 0,
    emptyEv.length ? `${emptyEv.length} 行证据为空` : '全部证据列已填写');
}

/* ---------------------------------------------------------------------------
 * [门禁 2] 形态断言
 * ------------------------------------------------------------------------- */
function runAssertions() {
  console.log('\n[门禁 2/4] 形态断言（form assertions）');
  const dir = path.join(ROOT, CONFIG.assertions.dir);
  if (!fs.existsSync(dir)) {
    record('TTD.1', '形态断言目录存在', CONFIG.gate.requireAssertions ? false : null,
      `${CONFIG.assertions.dir} 不存在（把「长什么样」翻译成 DOM 断言放这里）`);
    return;
  }
  const re = new RegExp(CONFIG.assertions.pattern);
  const files = fs.readdirSync(dir).filter((f) => re.test(f));
  if (files.length === 0) {
    record('TTD.1', '形态断言文件存在', CONFIG.gate.requireAssertions ? false : null,
      `${CONFIG.assertions.dir} 下无断言文件（*.spec.ts / *.cjs）`);
    return;
  }
  record('TTD.1', `形态断言文件（${files.length} 个）`, true, files.join(', '));
  let passed = 0, failed = 0;
  for (const f of files) {
    // 优先用 npx（如 vitest/playwright），否则纯 Node 跑 cjs
    let r;
    if (/\.spec\.ts$/.test(f)) {
      r = tryExec(`npx vitest run "${path.join(dir, f)}" --reporter=verbose 2>&1`);
      if (!r.ok && /playwright/i.test(r.out)) r = tryExec(`npx playwright test "${path.join(dir, f)}" --reporter=line 2>&1`);
    } else {
      r = tryExec(`node "${path.join(dir, f)}"`);
    }
    if (r.ok) { passed++; record('TTD.2', `断言 ${f} 通过`, true, (r.out.trim().split('\n').pop() || 'ok').slice(0, 80)); }
    else { failed++; record('TTD.2', `断言 ${f} 失败`, false, (r.out.trim().split('\n').pop() || 'error').slice(0, 120)); }
  }
  record('TTD.3', `形态断言通过率（${passed}/${passed + failed}）`, failed === 0, `passed=${passed} failed=${failed}`);
}

/* ---------------------------------------------------------------------------
 * [门禁 3] 视觉 diff（集成 visual-regression.cjs）
 * ------------------------------------------------------------------------- */
function checkVisual() {
  console.log('\n[门禁 3/4] 视觉 diff（visual regression）');
  const baselineDir = path.join(ROOT, CONFIG.visual.baseline);
  if (!fs.existsSync(baselineDir)) {
    record('VIS.1', '视觉基线目录存在', CONFIG.gate.requireVisual ? false : null,
      `${CONFIG.visual.baseline} 不存在（先 node visual-regression.cjs --baseline）`);
    return;
  }
  const shots = fs.readdirSync(baselineDir).filter((f) => /\.png$/i.test(f));
  if (shots.length === 0) {
    record('VIS.1', '视觉基线（截图）', CONFIG.gate.requireVisual ? false : null,
      `${CONFIG.visual.baseline} 下无 PNG 基线截图`);
    return;
  }
  record('VIS.1', `视觉基线（${shots.length} 张）`, true, shots.slice(0, 5).join(', '));
  // 调用 visual-regression.cjs --diff 做真实像素对比
  const vr = tryExec(`node "${path.join(__dirname, 'visual-regression.cjs')}" --diff --threshold=${THRESHOLD}`);
  const failLines = vr.out.split('\n').filter((l) => l.includes('[FAIL]'));
  record('VIS.2', `视觉 diff（阈值 ${(THRESHOLD * 100).toFixed(2)}%）`, failLines.length === 0,
    failLines.length ? failLines.slice(0, 3).join('；') : '全部像素差在阈值内');
}

/* ---------------------------------------------------------------------------
 * [门禁 4] 报告生成
 * ------------------------------------------------------------------------- */
function generateReport() {
  console.log('\n[门禁 4/4] 报告生成（delivery report）');
  const lines = [];
  lines.push(`# UDGK 交付门禁报告 · ${P}`);
  lines.push('');
  lines.push(`- 生成时间：${new Date().toISOString()}`);
  lines.push(`- 门禁命令：node verify-delivery.cjs${CONFIG.gate.strict ? ' --strict' : ''}`);
  lines.push('');
  lines.push(`## 结果：${failCount === 0 ? '✅ 全部通过' : '❌ ' + failCount + ' 项 FAIL'}`);
  lines.push('');
  lines.push('| 门禁 | 检查项 | 结果 | 证据 |');
  lines.push('|------|--------|------|------|');
  for (const r of results) {
    const mark = r.ok === true ? 'PASS' : r.ok === null ? 'SKIP' : 'FAIL';
    lines.push(`| ${r.id} | ${r.desc} | ${mark} | ${r.detail || '-'} |`);
  }
  lines.push('');
  lines.push(`> 统计：${failCount} 失败 / ${warnCount} 警告 / ${skipCount} 跳过 / ${results.length} 项检查`);
  lines.push(`> **${failCount === 0 ? '门禁通过，允许宣告任务完成' : '门禁未通过，禁止宣告完成，回到对应步骤修复'}**`);
  const out = path.join(ROOT, CONFIG.report.output);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, lines.join('\n'), 'utf8');
  record('RPT.1', `报告已生成`, true, out);
}

/* ---------------------------------------------------------------------------
 * 主流程
 * ------------------------------------------------------------------------- */
console.log('==========================================');
console.log(`  UDGK 通用交付门禁 · project=${P}`);
console.log(`  config=${CONFIG_NAME} strict=${CONFIG.gate.strict} root=${ROOT}`);
console.log('==========================================');

checkRTM();
runAssertions();
checkVisual();
generateReport();

console.log('\n==========================================');
console.log(`  结果：${failCount} 失败 / ${warnCount} 警告 / ${skipCount} 跳过 / ${results.length} 项检查`);
console.log('==========================================');
if (failCount > 0 || (CONFIG.gate.strict && warnCount > 0)) {
  console.log('  ❌ UDGK 交付硬门未通过，禁止宣告完成。回到对应步骤修复后重跑。');
  process.exit(1);
}
console.log('  ✅ UDGK 交付验证通过，允许宣告任务完成（附报告：' + CONFIG.report.output + '）');
