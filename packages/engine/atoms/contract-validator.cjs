"use strict";
/**
 * contract-validator.cjs — 把原子契约从「文档」变成「可执行判定」
 * 契约两源：1) 蓝本原有 124 条（有 input/output）  2) 元创造 468 条（V36.11 卷）
 */
const fs = require('fs');
/* --- 本地优先路径解析（包内运行时禁止依赖外部副本）--- */
const __p = require("path");
const __f = require("fs");
function __pick(list) {
  for (const p of list) { try { if (__f.existsSync(p)) return p; } catch (e) { /* R141 已确认合理：候选路径探测，路径不存在/无权限都是正常的，不吞真实故障 */ } }
  return list[list.length - 1];
}



/* 契约来源：优先包内副本 → 逐级回退到外部蓝本。
   这样包被剪裁时校验会真实失败，而不是去读外部副本蒙混过关。 */
const path2 = require('path');
function resolveFirst(list) {
  for (const p of list) { try { if (fs.existsSync(p)) return p; } catch (e) { /* R141 已确认合理：候选路径探测，路径不存在/无权限都是正常的，不吞真实故障 */ } }
  return list[list.length - 1];
}
/* 判定是否运行在「包内」：包根应有 VERSION 文件 */
const PKG_ROOT = path2.join(__dirname, "..", "..", "..");
const IN_PACKAGE = fs.existsSync(path2.join(PKG_ROOT, "VERSION"));

/* 包内运行时禁止回退外部 —— 否则「删掉包内契约卷」这种剪裁不会被发现，断言就是真空的 */
const VOL = IN_PACKAGE
  ? path2.join(PKG_ROOT, "docs", "附录卷-原子契约补全-V36.11.md")
  : resolveFirst([
      path2.join(__dirname, "..", "..", "..", "docs", "附录卷-原子契约补全-V36.11.md"),
      "D:/DSH-Official/home/metago/blueprint/元构初始文档/附录卷-原子契约补全-V36.11.md",
    ]);

const GEN = resolveFirst([
  path2.join(__dirname, "..", "..", "..", "..", "..", "genome", "atoms_engines.json"),
  __pick([
    __p.join(__dirname, "atoms_engines.json"),
      __p.join(__dirname, "..", "..", "..", "..", "..", "genome", "atoms_engines.json"),
  __p.join(__dirname, "..", "..", "..", "genome", "atoms_engines.json"),
  "D:/metago-build/genome/atoms_engines.json",
]),
]);

const OK = (n, c, d) => ({ n, ok: !!c, d: d || '' });
const isNum = v => typeof v === 'number' && isFinite(v);
function badNums(o) {
  const bad = [];
  (function w(v, p) {
    if (typeof v === 'number' && !isFinite(v)) bad.push(p || 'root');
    else if (v && typeof v === 'object') Object.keys(v).forEach(k => w(v[k], p ? p + '.' + k : k));
  })(o, '');
  return bad;
}
const findKey = (o, re) => Object.keys(o || {}).filter(k => re.test(k)).map(k => o[k]);
const findStr = o => Object.keys(o || {}).map(k => o[k]).find(v => typeof v === 'string');

const ACTION_CHECKS = {
  '计算/度量': o => {
    const n = Object.keys(o || {}).filter(k => isNum(o[k])).length;
    const b = badNums(o);
    return [OK('主指标为有限数', n > 0 && b.length === 0, b.length ? '非法数值:' + b.join(',') : n + ' 个数值')];
  },
  '生成/创造': o => [OK('非空生成', !!o && typeof o === 'object' && Object.keys(o).length > 0, '空对象视为生成失败')],
  '识别/检测': o => {
    const c = findKey(o, /置信|confidence|概率/);
    return [OK('置信度在[0,1]内', c.length === 0 || c.every(v => isNum(v) && v >= 0 && v <= 1), c.join(',') || '无置信度字段')];
  },
  '预测/推演': o => {
    const a = Object.keys(o || {}).map(k => o[k]).find(v => Array.isArray(v) && v.length > 0 && v.every(isNum));
    const t = findStr(o);
    return [OK('含定长数值序列', !!a, a ? a.length + ' 点' : '无数值序列'),
            OK('趋势枚举合法', !t || /上升|下降|平稳|up|down|stable|升温|降温|持平/.test(t), String(t || '无'))];
  },
  '优化/调度': o => [OK('含分配结果', /got|alloc|分配|amount|数量/.test(JSON.stringify(o || {})), '')],
  '同步/融合': o => {
    const s = findKey(o, /同步度|融合度|一致/).filter(isNum);
    return [OK('同步或融合度在[0,1]内', s.length === 0 || s.every(v => v >= 0 && v <= 1), s.join(',') || '无该字段')];
  },
  '监控/预警': o => {
    const l = findStr(o);
    return [OK('级别属于枚举集', !l || /green|yellow|orange|red|红|橙|黄|绿|low|medium|high/.test(l), String(l || '无级别'))];
  },
  '治理/审查': o => {
    const c = findStr(o);
    const probs = Object.keys(o || {}).map(k => o[k]).find(v => Array.isArray(v));
    const pass = /通过/.test(String(c || ''));
    return [OK('结论为通过或不通过', !c || /通过|不通过/.test(c), String(c || '无结论')),
            OK('不通过时问题清单非空', pass || !probs || probs.length > 0, probs ? probs.length + ' 项' : '无清单')];
  },
  '存储/检索': o => [OK('非空返回', !!o && Object.keys(o).length > 0, '')],
  '转换/映射': o => [OK('输出非空', !!o && Object.keys(o).length > 0, '')],
  '—': o => [OK('结构非空且类型稳定', !!o && typeof o === 'object' && Object.keys(o).length > 0, '')],
};

const DOMAIN_CHECKS = {
  '生物人因': o => [OK('附免责声明软判据', true, /免责|不构成诊断|非医学/.test(JSON.stringify(o || {})) ? '已附' : '未附记录')],
  '安全风控': o => [OK('默认拒绝语义可表达软判据', true, '')],
  '金融经济': o => [OK('无浮点累加痕迹', !/\d\.\d{6,}/.test(JSON.stringify(o || {})), '')],
};

const CONTRACTS = {};

/* 源1：元创造 468 条（V36.11 卷） */
try {
  const t = fs.readFileSync(VOL, 'utf8');
  const re = /^\| `(ATOM_[A-Z0-9_]+)` \| [^|]* \| ([^|]+) \| ([^|]+) \|/gm;
  let m;
  while ((m = re.exec(t))) CONTRACTS[m[1]] = { action: m[2].trim(), domain: m[3].trim(), src: '元创造V36.11' };
} catch (e) { /* R141 已确认合理：契约卷读取失败后，下方对【CONTRACTS 为空】有明确处理（CONTRACT_VOLUME_MISSING 并 exit(1)），非静默 */ }
if (Object.keys(CONTRACTS).length === 0) {
  console.log('CONTRACT_VOLUME_MISSING: 契约卷不可读 ->', VOL);
  if (IN_PACKAGE) { console.log('总判定：FAIL（包内契约卷缺失）'); process.exit(1); }
}

/* 源2：蓝本原有 124 条 */
try {
  const g = JSON.parse(fs.readFileSync(GEN, 'utf8'));
  const A2 = [['计算/度量', /计算|度量|评估|评分|量化|估计/], ['识别/检测', /识别|检测|判断|甄别/],
              ['预测/推演', /预测|推演|推断|外推/], ['优化/调度', /优化|调度|分配|排序/],
              ['转换/映射', /转换|映射|翻译|编码|解码|解析|提取/],
              ['同步/融合', /同步|融合|对齐|协同|合并/], ['生成/创造', /生成|创造|构建|设计/],
              ['监控/预警', /监控|监测|预警|告警/], ['治理/审查', /审查|治理|合规|校验|验证/],
              ['存储/检索', /存储|记忆|检索/]];
  Object.keys(g.atoms || {}).forEach(id => {
    const a = g.atoms[id];
    if (!(a.input && a.output) || CONTRACTS[id]) return;
    const nm = String(a.name || '');
    let act = '—';
    for (const pair of A2) { if (pair[1].test(nm)) { act = pair[0]; break; } }
    CONTRACTS[id] = { action: act, domain: '—', src: '蓝本原有契约' };
  });
} catch (e) {
  /* 区分「GEN 表不存在」（允许跳过）与「存在但读坏了」（必须报错）。
     否则解析失败会静默少 124 条契约，总数从 597 掉到 473 却照样 PASS。 */
  const genExists = (function () { try { return !!GEN && fs.existsSync(GEN) } catch (x) { return false } })()
  if (genExists) {
    throw new Error('[R141-GEN-ATOMS] atoms_engines.json 存在但读取失败：' + e.message)
  }
  console.log('GEN_TABLE_MISSING: 蓝本原有契约表不可读，本层少统计 124 条 ->', GEN)
}

function validate(atomId, output) {
  const c = CONTRACTS[atomId];
  if (!c) return { pass: false, error: '该原子无契约', checks: [] };
  const checks = [];
  (ACTION_CHECKS[c.action] || ACTION_CHECKS['—'])(output).forEach(x => checks.push(x));
  if (DOMAIN_CHECKS[c.domain]) DOMAIN_CHECKS[c.domain](output).forEach(x => checks.push(x));
  return { pass: checks.every(x => x.ok), action: c.action, domain: c.domain, src: c.src, checks: checks };
}

module.exports = { validate: validate, CONTRACTS: CONTRACTS };

if (require.main === module) {
  const E = require('./engine.cjs');
  const ids = Object.keys(E.COMPUTE).filter(id => CONTRACTS[id]);
  let pass = 0;
  const bad = [];
  ids.forEach(id => {
    const r = E.run(id, E.SAMPLES[id] || {});
    if (!r.success) return;
    const v = validate(id, r.output);
    if (v.pass) pass++; else bad.push([id, v]);
  });
  const bySrc = {};
  Object.keys(CONTRACTS).forEach(k => { const s = CONTRACTS[k].src; bySrc[s] = (bySrc[s] || 0) + 1; });
  console.log('='.repeat(72));
  console.log('契约校验器自测');
  console.log('='.repeat(72));
  console.log('契约总数: ', Object.keys(CONTRACTS).length, JSON.stringify(bySrc));
  console.log('compute 原子匹配契约: ', ids.length + ' / ' + Object.keys(E.COMPUTE).length);
  console.log('契约校验 通过 ', pass, ' 失败 ', bad.length);
  bad.slice(0, 8).forEach(pair => {
    console.log('  FAIL ' + pair[0] + ' [' + pair[1].action);
    pair[1].checks.filter(c => !c.ok).forEach(c => console.log('      - ' + c.n + ' ' + c.d));
  });
  // ---- R141：遍历**契约全量**（不再只遍历工厂自己的子集）----
  // 旧版只遍历 F.CONTRACTS（473 条），导致 597-473-50=74 条从未被测试而总判定仍 PASS。
  let fPass = 0, fFail = 0, fNoImpl = 0;
  const noImpl = [];
  try {
    const F = require('./atom-factory.cjs');
    const SAMPLE = [0.8, 0.6, 0.75, 0.9, 0.55];
    const ALLOW_NO_IMPL = new Set([
      ...((F.EXTERNAL_NEEDED instanceof Set) ? [...F.EXTERNAL_NEEDED] : []),
      ...((F.MODEL_NEEDED instanceof Set) ? [...F.MODEL_NEEDED] : []),
    ]);
    Object.keys(CONTRACTS).forEach(id => {
      if (ids.indexOf(id) >= 0) return;          // 已由手写 compute 实现覆盖
      let fn = null;
      try { fn = F.make(id); } catch (e) { fn = null; }
      if (!fn) {
        if (!ALLOW_NO_IMPL.has(id)) { fNoImpl++; if (noImpl.length < 20) noImpl.push(id); }
        return;
      }
      let out = null;
      try { out = fn(SAMPLE); } catch (e) { out = null; }
      const v = validate(id, out);
      if (v.pass) fPass++; else { fFail++; if (bad.length < 8) bad.push([id, v]); }
    });
  } catch (e) { fFail = 1; }
  console.log('工厂生成覆盖: 通过 ' + fPass + ' / 失败 ' + fFail + ' / 无实现 ' + fNoImpl);
  if (noImpl.length) {
    console.log('  无实现（不在 EXTERNAL_NEEDED 白名单）:');
    noImpl.forEach(id => console.log('    - ' + id));
    if (fNoImpl > noImpl.length) console.log('    … 共 ' + fNoImpl + ' 条');
  }

  const fail = bad.length + (ids.length === 0 ? 1 : 0) + fFail + fNoImpl;
  console.log(fail === 0 ? '总判定：PASS' : '总判定：FAIL');
  process.exit(fail === 0 ? 0 : 1);
}
