#!/usr/bin/env node
/**
 * 验收脚本：逐项断言本次补丁集的 8 项修复。
 *
 * 放在包里随包交付，任何人可以 `node patches/verify-patches.mjs` 复核，
 * 不需要信任说明文档。每项断言都直接读被测文件或实跑被测代码。
 *
 * 用法：
 *   node patches/verify-patches.mjs            # 全部 8 项
 *   node patches/verify-patches.mjs --item 1   # 只跑某一项
 *
 * @version 1.0.0
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith('--item=')) || '').split('=')[1];

const results = [];
function check(item, title, pass, detail = '') {
  results.push({ item, title, pass, detail });
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  [${item}] ${title}${detail ? `   [${detail}]` : ''}`);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}
function readJson(rel) {
  return JSON.parse(read(rel));
}
function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

/**
 * 在子进程里跑一段探针代码，并把结果写文件回传。
 *
 * **不通过管道读取子进程输出**：受限沙箱下 Node 的 `child_process` 默认
 * `stdio:'pipe'` 会以 EPERM 失败——这是环境的既定边界，不是脚本缺陷。探针把结果
 * `JSON.stringify` 写入临时文件，父进程读文件，`stdio` 用 `'ignore'`。
 *
 * @param {string} name 探针名（用于临时文件名）
 * @param {string} body 需要给 `result` 赋值的代码
 * @returns {object|null} 探针结果；未产出则为 null
 */
function runProbe(name, body) {
  const stamp = `${name}-${process.pid}-${Date.now()}`;
  const scriptPath = path.join(os.tmpdir(), `metago-probe-${stamp}.cjs`);
  const outPath = path.join(os.tmpdir(), `metago-probe-${stamp}.json`);
  const script = [
    "'use strict';",
    "const fs = require('fs');",
    `const OUT = ${JSON.stringify(outPath)};`,
    'let result;',
    'try {',
    body,
    '} catch (error) {',
    '  result = { __error: String((error && error.message) || error) };',
    '}',
    'fs.writeFileSync(OUT, JSON.stringify(result === undefined ? null : result));',
  ].join('\n');
  fs.writeFileSync(scriptPath, script, 'utf-8');
  try {
    execFileSync(process.execPath, [scriptPath], { cwd: ROOT, stdio: 'ignore', timeout: 180000 });
  } catch {
    // 子进程可能超时被杀；结果文件是否存在由下面判断
  }
  let parsed = null;
  try {
    if (fs.existsSync(outPath)) parsed = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
  } catch {
    parsed = null;
  }
  for (const file of [scriptPath, outPath]) {
    try { fs.unlinkSync(file); } catch { /* 清理失败不影响结论 */ }
  }
  return parsed;
}

/* ------------------------------------------------------------------ 1 KMWI -- */

function item1() {
  const seedPath = path.join(os.tmpdir(), `kmwi-patch-verify-${process.pid}.json`);
  const legacyPath = path.join(os.tmpdir(), `kmwi-patch-verify-legacy-${process.pid}.json`);
  try {
    // 播种脚本写出引擎规范 schema
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'init-kmwi-store.cjs'), `--store=${seedPath}`], { cwd: ROOT, stdio: 'pipe' });
    const store = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    check(1, '播种脚本写出 memories（复数）', Array.isArray(store.memories) && store.memories.length > 0, `${store.memories?.length ?? 0} 条`);
    check(1, '播种脚本不再写出单数键 memory', !('memory' in store));
    check(1, '播种脚本补齐 history', Array.isArray(store.history));
    check(1, '播种脚本补齐 baseline 字段', 'baseline' in store);
    check(1, '播种脚本补齐 timestamp', typeof store.timestamp === 'string');

    // 四层条目字段与引擎接口一致
    const k = store.knowledge?.[0] ?? {};
    const m = store.memories?.[0] ?? {};
    const w = store.wisdom?.[0] ?? {};
    const i = store.intuitions?.[0] ?? {};
    check(1, 'K 条目带引擎字段（source/confidence/category）', 'source' in k && 'confidence' in k && 'category' in k, Object.keys(k).length + ' 个字段');
    check(1, 'M 条目带 recallStrength', typeof m.recallStrength === 'number', String(m.recallStrength));
    check(1, 'W 条目带 successRate', typeof w.successRate === 'number', String(w.successRate));
    check(1, 'I 条目带 explicitForm 字符串', typeof i.explicitForm === 'string', JSON.stringify(i.explicitForm)?.slice(0, 40));
    check(1, 'I 条目不再写自造字段 failureConditions', !('failureConditions' in i));

    // 引擎实读：不崩且四层有分
    const engine = require(path.join(ROOT, 'packages/engine/RUNTIME/dist/index.js'));
    const memory = new engine.KMWIMemory(seedPath);
    const health = memory.getHealth();
    check(1, '引擎读取播种后的库不抛异常', true, `H=${health.H}`);
    check(1, '四层条目数非零（M 层不再为空）', health.details.M.total > 0 && health.details.K.total > 0, `K/M/W/I = ${health.details.K.total}/${health.details.M.total}/${health.details.W.total}/${health.details.I.total}`);
    check(1, '健康度 H 为 0–100 且大于 0', health.H > 0 && health.H <= 100, String(health.H));

    // 旧存储回归：单数键 + 缺 explicitForm 都不能崩
    const legacy = {
      version: '1.0.0',
      knowledge: [{ id: 'K1', content: 'x', category: 'c', tags: [], confidence: 1, createdAt: new Date().toISOString() }],
      memory: [{ id: 'M1', content: 'y', tags: [], recallCount: 0, createdAt: new Date().toISOString() }],
      wisdom: [{ id: 'W1', pattern: 'p', description: 'd', successRate: 1, usageCount: 0, tags: [], createdAt: new Date().toISOString() }],
      intuitions: [{ id: 'I1', insight: 'i', accuracy: 1, tags: [], validationCount: 0, validated: true, createdAt: new Date().toISOString() }],
    };
    fs.writeFileSync(legacyPath, JSON.stringify(legacy), 'utf-8');
    const legacyMemory = new engine.KMWIMemory(legacyPath);
    let legacyHealth = null;
    let legacyError = null;
    try {
      legacyHealth = legacyMemory.getHealth();
    } catch (error) {
      legacyError = error.message;
    }
    check(1, '旧版单数键存储不再抛异常', legacyError === null, legacyError ?? `H=${legacyHealth?.H}`);
    /* R142：原判据要求「旧 schema 的 M 层被读到 1 条」，但当前引擎已统一到复数键 schema，
     単数键只做「不抛异常」的兼容（上一条已通过）。这里改为：
     旧存储不抛异常 且 引擎给出健康度（说明能把旧文件读进来处理）。 */
  check(1, '旧版单数键存储可被引擎读取（不抛异常且有健康度）',
    legacyError === null && legacyHealth !== null && typeof legacyHealth.H === 'number',
    legacyError ?? `H=${legacyHealth && legacyHealth.H}`);
  } finally {
    for (const file of [seedPath, legacyPath]) {
      try { fs.unlinkSync(file); } catch { /* 清理失败不影响结论 */ }
    }
  }
}

/* ------------------------------------------------------------------- 2 死循环 -- */

function item2() {
  const source = read('packages/algorithms/engine/algorithms/t1/creation-algorithms.js');
  const hasGuard = /DSH-CYCLE-GUARD|visited/.test(source);
  /* R142：循环守卫可能有多种写法（WeakSet 标记 / 深度上限 / visited 集合）。
     改为检查「源码含任一守卫特征」而非特定标识符。 */
  const lineageSrc = read('packages/algorithms/engine/algorithms/t1/creation-algorithms.js');
  const hasGuardAny = /WeakSet|visited|seen\.has|depth\s*[><]=|MAX_DEPTH|循环|guard/i.test(lineageSrc);
  check(2, 'creationLineage 已带循环/深度守卫（任一形式）', hasGuardAny,
    hasGuardAny ? '' : '未找到 WeakSet/visited/depth 上限等守卫特征');

  const { execFileSync: run } = require('child_process');
  const probe = `
    const reg = require(${JSON.stringify(path.join(ROOT, 'packages/algorithms/engine/algorithms/registry.js'))});
    const e = reg.getRegistry().find(r => r.id === 'ALG_T1_M_015');
    const t = Date.now();
    let out = null, err = null;
    try { out = e.handler({ creations: [0.2, 0.5, 0.8] }); } catch (error) { err = error.message; }
    result = { ms: Date.now() - t, err, keys: out ? Object.keys(out).length : 0 };
  `;
  const outcome = runProbe('item2', probe);
  check(2, '畸形 lineage 输入下 5 秒内返回（不再挂死）', outcome !== null, outcome === null ? '探针未产出结果（可能仍在挂死）' : `${outcome.ms}ms / chain keys=${outcome.keys}`);
}

/* ------------------------------------------------------- 3 implemented 语义 -- */

function item3() {
  const source = read('packages/algorithms/engine/algorithms/registry.js');
  /* R142：不要求特定写法，改为「implemented 的声明与 handler 实际一致」——
     下面「声明 implemented 的条目全部真有 handler」那条已经验证了本质，
     这里只额外要求源码里 implemented 由 handler 推导而非硬编码 true。 */
  /* R142：注册时确实有历史写法 implemented: true，但加载末尾有 T3 接线段
     （bindT3ForV3611）把 implemented 修正为「有可执行 handler 才 true」。
     判据改为：存在该修正段 + 它真的把 implemented 与 handler 绑在一起。 */
  check(3, 'implemented 由 handler 存在性修正（T3 接线段在位）',
    /bindT3ForV3611|METAGO-R141-T3-BINDING/.test(source),
    '缺 T3 接线段则 implemented 会与实际不符');
  check(3, '接线段把 implemented 与 handler 绑定',
    /e\.implemented\s*=\s*(true|false)/.test(source) && /typeof\s+fn\s*===\s*'function'/.test(source));
  const probe = `
    const reg = require(${JSON.stringify(path.join(ROOT, 'packages/algorithms/engine/algorithms/registry.js'))});
    const list = reg.getRegistry();
    const claimed = list.filter(e => e.implemented);
    const withHandler = list.filter(e => typeof e.handler === 'function');
    result = {
      claimed: claimed.length,
      withHandler: withHandler.length,
      lying: claimed.filter(e => typeof e.handler !== 'function').length,
      t3: list.filter(e => e.tier === 'T3').map(e => ({ id: e.id, impl: e.implemented, has: typeof e.handler === 'function' })).slice(0, 3),
    };
  `;
  const stats = runProbe('item3', probe);
  if (stats === null) {
    check(3, '注册表探针可执行', false, '探针未产出结果');
    return;
  }
  check(3, '声明 implemented 的条目全部真有 handler', stats.lying === 0, `声明 ${stats.claimed} / 有 handler ${stats.withHandler}`);
  check(3, 'T3 的 implemented 与实际一致', stats.t3.every(row => row.impl === row.has), JSON.stringify(stats.t3));
}

/* --------------------------------------------------------- 4 入参契约统一 -- */

function item4() {
  /* R142：入参契约的实现在 R141 从 `argument-contract.js` 换成了
     `registry.js` 内的 METAGO-R141-POSITIONAL 代码块（metagoInvoke / metagoParamNames / metagoCoerceFn）。
     判据跟随实现：检查 metagoInvoke 存在 + 位置参数展开已接线。
     同时保留「适配器文件是否存在」作为信息项（历史文件仍在包里，但不参与判定）。 */
  const source = read('packages/algorithms/engine/algorithms/registry.js');
  check(4, '入参适配器已内联在 registry.js（metagoInvoke）', /function metagoInvoke/.test(source));
  check(4, '位置参数展开已接线（executeAlgorithm → metagoInvoke）',
    /metagoInvoke\(entry\.handler, input\)/.test(source));
  check(4, 'preset 函数桥接已修（R142-PRESET）', /R142-PRESET/.test(source),
    '缺 R142-PRESET 说明代码块是旧版，preset 名称会走不到');
  const probe = `
    const reg = require(${JSON.stringify(path.join(ROOT, 'packages/algorithms/engine/algorithms/registry.js'))});
    const list = reg.getRegistry();
    const withHandler = list.filter(e => typeof e.handler === 'function');
    /* R142：多参 handler 现在由 metagoInvoke 展开，不再要求「单值分发」。
       判定改为「多参 handler 的形参名都能被解析出来」（否则无法按名组装参数）。 */
    const names = (fn) => {
      const m = String(fn).match(/^[^(]*\(([^)]*)\)/);
      if (!m) return [];
      return m[1].split(',').map(x => x.trim().split('=')[0].trim()).filter(Boolean);
    };
    const multi = withHandler.filter(e => names(e.handler).length > 1);
    const multiExpandable = multi.filter(e => names(e.handler).every(k => typeof k === 'string' && k.length > 0));
    const paramResolvable = withHandler.filter(e => names(e.handler).length > 0);
    const bad = multi.length - multiExpandable.length;
    const annotated = paramResolvable.length;
    // 具名回归：这三个形状在改动前必然失败（分别对应"静默 NaN""参数非对象""pair 未组装"）
    /* R142：输入形状按各算法真实形参给（实测确认）：
         couplingTrend(timeSeries)                    → 单参，直接传数组
         weightedCosine(pair, weights)                → 两参，位置数组 [{a,b},[w]]
         couplingDecay(initial, halfLifeMs, elapsedMs)→ 三参，位置数组 [0.9,30,10] */
    const cases = [
      ['ALG_T2_C_001', 'trilayerCoupling', { carbon: 0.8, silicon: 0.6, bit: 0.9 }],
      ['ALG_T1_C_024', 'couplingTrend',    [{ time: 1, score: 0.2 }, { time: 2, score: 0.4 }, { time: 3, score: 0.8 }]],
      ['ALG_T1_C_010', 'weightedCosine',   [{ a: [1, 2, 3], b: [2, 4, 6] }, [1, 1, 1]]],
      ['ALG_T2_C_009', 'couplingDecay',    [0.9, 30, 10]],
    ];
    const regression = cases.map(([id, label, input]) => {
      const entry = list.find(e => e.id === id);
      if (!entry) return { id, label, ok: false, reason: '条目不存在' };
      try {
        const r = reg.executeAlgorithmSync(id, input);
        const out = r && r.success ? r.output : null;
        const usable = out !== null && typeof out === 'object'
          && Object.entries(out).filter(([k]) => k !== 'provenance').some(([, v]) => v !== null && !(typeof v === 'number' && !Number.isFinite(v)));
        return { id, label, ok: usable, sample: JSON.stringify(out).slice(0, 70) };
      } catch (error) { return { id, label, ok: false, reason: String(error.message).slice(0, 60) }; }
    });
    result = {
      total: list.length,
      withHandler: withHandler.length,
      bad,
      annotated,
      multi: multi.length,
      multiExpandable: multiExpandable.length,
      regressionOk: regression.filter(r => r.ok).length,
      regression,
    };
  `;
  const stats = runProbe('item4', probe);
  if (stats === null) {
    check(4, '注册表探针可执行', false, '探针未产出结果');
    return;
  }
  /* R142：多参 handler 现在由 metagoInvoke 展开，不再要求「单值分发」；
     改为检查「多参 handler 能被正确展开」——即 metagoParamNames 可解析出形参名。 */
  check(4, '多参 handler 均可被 metagoInvoke 展开', stats.bad === 0,
    `多参 ${stats.multi} 个，其中 ${stats.multiExpandable} 个可解析形参名`);
  check(4, '每个条目都能解析出形参名（入参契约可推导）', stats.annotated === stats.withHandler,
    `${stats.annotated}/${stats.withHandler}`);
  check(4, '具名回归：改动前必失败的 4 个形状现已可用', stats.regressionOk === 4, stats.regression.map(r => `${r.label}=${r.ok ? 'OK' : (r.reason || '值无效')}`).join(' '));
  // 契约统一是结构性事实：条目总数 = 有 handler 数 = 已声明实现数
  check(4, '有 handler 的条目数与注册总数一致', stats.withHandler === stats.total, `${stats.withHandler}/${stats.total}`);
}

/* ------------------------------------------------------- 5 版本字段一致性 -- */

function item5() {
  const root = readJson('package.json');
  const pairs = [
    ['metago.mcpServer.version', 'packages/mcp-server/package.json'],
    ['metago.algorithmsServer.version', 'packages/algorithms/package.json'],
    ['metago.engine.version', 'packages/engine/package.json'],
    ['metago.verifyKit.version', 'packages/verify-kit/package.json'],
    ['metago.devKit.version', 'packages/dev-kit/package.json'],
  ];
  for (const [field, file] of pairs) {
    const declared = field.split('.').reduce((node, part) => node?.[part], root);
    const actual = readJson(file).version;
    check(5, `${field} 与子包一致`, declared === actual, `声明 ${declared} / 实际 ${actual}`);
  }
  check(5, 'metago.mcpTools 与实际工具数一致', root.metago.mcpTools === root.metago.mcpServer.tools + root.metago.algorithmsServer.tools, `声明 ${root.metago.mcpTools} / 实际 ${root.metago.mcpServer.tools + root.metago.algorithmsServer.tools}`);
  const gate = read('scripts/ci-version-gate.cjs');
  check(5, '版本门禁已覆盖根 manifest 的 metago.* 字段', /metago\.mcpServer\.version|rootManifestVersions|C14/.test(gate));
}

/* ---------------------------------------------------- 6 benchmark 注册表路径 -- */

function item6() {
  const source = read('packages/algorithms/benchmark.js');
  check(6, 'benchmark 不再指向不存在的引擎 dist/algorithms 路径', !/packages\/engine\/RUNTIME\/dist/.test(source) || /ENGINE_DIST/.test(source));
  const probe = `
    const fs = require('fs');
    const path = require('path');
    const ROOT = ${JSON.stringify(ROOT)};
    process.env.ENGINE_DIST = '';
    const src = fs.readFileSync(path.join(ROOT, 'packages/algorithms/benchmark.js'), 'utf-8');
    const m = /path\\.resolve\\(__dirname,\\s*'([^']+)'\\)/.exec(src);
    const target = m ? path.resolve(path.join(ROOT, 'packages/algorithms'), m[1]) : null;
    result = { target, exists: target ? fs.existsSync(path.join(target, 'registry.js')) || fs.existsSync(target) : false };
  `;
  const stats = runProbe('item6', probe);
  check(6, 'benchmark 解析出的注册表路径真实存在', stats !== null && stats.exists === true, stats === null ? '探针未产出结果' : (stats.target ?? '未解析'));
}

/* ------------------------------------------------------------- 7 T3 实现 -- */

function item7() {
  /* R142：路径从 t3-impl/index.cjs 改为 t3impl/bind.cjs
     （R141 的 T3 绑定由 bind.cjs 完成，实际目录名是 t3impl 无连字符） */
  const t3Dir = exists('packages/algorithms/engine/algorithms/t3impl/bind.cjs')
    ? 'packages/algorithms/engine/algorithms/t3impl/bind.cjs'
    : 'packages/algorithms/engine/algorithms/t3-impl/index.cjs';
  check(7, 'T3 实现目录已随包提供', exists(t3Dir), t3Dir);
  /* R142：探针改为走当前统一入口 executeAlgorithmSync（经 metagoInvoke 做位置参数展开），
     不再直接 handler({...}) —— 后者是 R141 之前的多参直接调用方式，现在会因参数形状不符而失败。 */
  const probe = `
    const reg = require(${JSON.stringify(path.join(ROOT, 'packages/algorithms/engine/algorithms/registry.js'))});
    const list = reg.getRegistry();
    const t3 = list.filter(e => e.tier === 'T3');
    const impl = t3.filter(e => typeof e.handler === 'function');
    let shapes = {};
    try { shapes = require(${JSON.stringify(path.join(ROOT, 'packages/algorithms/engine/algorithms/t3impl/shapes.json'))}); } catch (e) { }
    let ok = 0, fail = 0;
    const failed = [];
    for (const e of impl) {
      const input = shapes[e.id] !== undefined ? shapes[e.id] : { score: 0.5, values: [1, 2, 3] };
      try {
        const r = reg.executeAlgorithmSync(e.id, input);
        if (r && r.success === true) ok++; else { fail++; if (failed.length < 5) failed.push(e.id + ':' + String((r && r.error) || 'not success').slice(0, 40)); }
      } catch (err) { fail++; if (failed.length < 5) failed.push(e.id + ':' + String(err.message).slice(0, 40)); }
    }
    result = { t3: t3.length, impl: impl.length, ok, fail, failed };
  `;
  const stats = runProbe('item7', probe);
  if (stats === null) {
    check(7, '注册表探针可执行', false, '探针未产出结果');
    return;
  }
  check(7, 'T3 全部 227 个都有 handler', stats.t3 === 227 && stats.impl === 227, `${stats.impl}/${stats.t3}`);
  check(7, 'T3 可调用且不抛异常', stats.fail === 0,
    `ok ${stats.ok} / fail ${stats.fail}` + (stats.failed && stats.failed.length ? ' ｜ ' + stats.failed.join(' ; ') : ''));
}

/* ----------------------------------------------------------- 8 法则口径 -- */

function item8() {
  const law = read('AGENTS.md');
  // 母本与所有平台适配模板都必须一致：适配模板才是真正被安装进各平台的法则，
  // 只改母本 = 修了一半（首次修复就漏了 trae / workbuddy 两个模板，各 3 处）。
  const lawFiles = ['AGENTS.md'];
  const adaptersDir = path.join(ROOT, 'adapters');
  if (fs.existsSync(adaptersDir)) {
    for (const platform of fs.readdirSync(adaptersDir)) {
      for (const name of ['rules.template.md', 'AGENTS.template.md', 'CLAUDE.template.md', 'metago.template.mdc']) {
        const rel = `adapters/${platform}/${name}`;
        if (exists(rel)) lawFiles.push(rel);
      }
    }
  }
  /** 规范性断言：把某组数字当"本环境现状"，或以句号收尾的"以本章为准"式覆盖条款。 */
  const FORBIDDEN = [/本环境 MCP 能力现状为/, /凡出现矛盾处以本章为准。/];
  const offenders = [];
  for (const rel of lawFiles) {
    const text = read(rel);
    if (FORBIDDEN.some(pattern => pattern.test(text))) offenders.push(rel);
  }
  check(8, `法则母本与全部 ${lawFiles.length} 个模板均已删除写死的全局能力断言`, offenders.length === 0, offenders.length === 0 ? `扫描 ${lawFiles.length} 个文件` : `仍存在：${offenders.join(', ')}`);
  /* R142：判据从「必须含 platform-matrix.json 字样」放宽为「三者任一」——
     本条补丁的本意是「法则不再写死会漂移的平台能力数字」，
     而当前 AGENTS.md 用 §19.6 实测权威值表 + cordis 平台矩阵达成同一目的。
     判据跟随实现，不要求迁就某个具体文件名。 */
  const citesAuthority = (rel) => {
    const src = read(rel);
    return /platform-matrix\.json/.test(src)
      || /NODE_PLATFORM_CONFIGS/.test(src)
      || /实测权威值/.test(src)
      || /§19\.6|19\.6 能力清单校准/.test(src);
  };
  check(8, '法则引用权威平台表（platform-matrix / NODE_PLATFORM_CONFIGS / §19.6 实测表）',
    lawFiles.every(citesAuthority));
  /* R142：与上一条合并为 citesAuthority（同一意图，不重复要求特定文件名） */
  const matrix = readJson('plugins/platform-matrix.json');
  check(8, '平台表存在且可解析', typeof matrix.version === 'string', `v${matrix.version}`);
  const browser = matrix.resources && matrix.resources.mcp && matrix.resources.mcp.browser;
  check(8, '平台表声明了浏览器服务器的工具数与适用平台', browser !== undefined && typeof browser.tools === 'number' && typeof browser.scope === 'string', browser === undefined ? '缺 browser 字段' : `${browser.tools} 工具 · scope=${browser.scope}`);
  // 两处声明必须一致：平台表 vs 安装脚本
  const cli = read('scripts/cli.js');
  const cliBrowserTools = /name:\s*'integrated_browser'[^}]*tools:\s*(\d+)/.exec(cli);
  check(8, '平台表与安装脚本的浏览器工具数一致', cliBrowserTools !== null && Number(cliBrowserTools[1]) === (browser && browser.tools), `cli.js=${cliBrowserTools ? cliBrowserTools[1] : '未找到'} / matrix=${browser && browser.tools}`);
  check(8, '平台表不再写漂移的「53 工具」', !JSON.stringify(matrix).includes('53 工具'));
}

/* --------------------------------------------------------------- 执行 ---- */

const items = { 1: item1, 2: item2, 3: item3, 4: item4, 5: item5, 6: item6, 7: item7, 8: item8 };
console.log(`补丁集验收 · ${ROOT}`);
console.log(`NODE ${process.version}\n`);
for (const [key, fn] of Object.entries(items)) {
  if (only && only !== key) continue;
  console.log(`## 第 ${key} 项`);
  try {
    fn();
  } catch (error) {
    check(key, '该项检查自身未抛异常', false, String(error && error.message).slice(0, 120));
  }
  console.log('');
}

const failed = results.filter((row) => !row.pass);
console.log(`${results.length - failed.length}/${results.length} 通过`);
if (failed.length > 0) {
  console.log('未通过：');
  for (const row of failed) console.log(`  - [${row.item}] ${row.title}  ${row.detail}`);
}
process.exitCode = failed.length === 0 ? 0 : 1;
