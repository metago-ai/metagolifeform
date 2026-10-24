"use strict";
/**
 * value.js — ALG_T3_V_001..015 真实实现（DCV 六维价值 / 价值工程族）
 */
const L = require("../t3lib.js");
const { mean, variance, std, min, max, round, clamp01, safeDiv, pearson, euclid,
  cosine, entropy, maxEntropy, gini, ols, quantile } = L;

const toNumArr = v => (Array.isArray(v) ? v.map(Number) : []);

/* V_001 DCV 六维价值体系 */
function v001(input) {
  const c = input.contribution || {};
  const KEYS = [
    ["dT", "技术维度"], ["dI", "信息维度"], ["dO", "组织维度"],
    ["dG", "增长维度"], ["coYuan", "共元维度"], ["yuYuan", "育元维度"]
  ];
  const w = Array.isArray(input.weights) && input.weights.length === 6
    ? input.weights.map(Number) : [1, 1, 1, 1, 1, 1];
  const totalW = w.reduce((a, b) => a + b, 0) || 6;
  const dimensions = KEYS.map(([k, cn], i) => {
    const raw = Number(c[k]) || 0;
    return { key: k, name: cn, raw, weight: round(w[i], 4), score: round(raw * w[i], 4) };
  });
  const totalScore = round(dimensions.reduce((s, d) => s + d.score, 0) / totalW, 4);
  const mx = Math.max(1, ...dimensions.map(d => Math.abs(d.raw)));
  const normalizedScore = round(clamp01(safeDiv(totalScore, mx)), 4);
  const grade = normalizedScore >= 0.85 ? "卓越" : normalizedScore >= 0.7 ? "优秀"
    : normalizedScore >= 0.55 ? "良好" : normalizedScore >= 0.4 ? "合格" : "待改进";
  const dominantDimension = dimensions.slice().sort((a, b) => Math.abs(b.raw) - Math.abs(a.raw))[0].name;
  return { dimensions, totalScore, normalizedScore, grade, dominantDimension };
}

/* V_002 价值对齐度评估 */
function v002(input) {
  const cur = toNumArr(input.current), tgt = toNumArr(input.target);
  const thr = Number(input.threshold);
  const T = isFinite(thr) ? thr : 0.2;
  const n = Math.min(cur.length, tgt.length);
  if (!n) return { alignment: 0, deviation: 0, conflicts: [], needsCalibration: true };
  const vecAlign = (a, b) => {
    const m = Math.min(a.length, b.length);
    const A = a.slice(0, m), B = b.slice(0, m);
    return { align: clamp01((cosine(A, B) + 1) / 2), dev: euclid(A, B) / Math.max(1e-9, Math.sqrt(m)) };
  };
  const base = vecAlign(cur, tgt);
  const add = Array.isArray(input.additionalTargets) ? input.additionalTargets.map(toNumArr) : [];
  const conflicts = [];
  for (let i = 0; i < add.length; i++) {
    for (let j = i + 1; j < add.length; j++) {
      const a = vecAlign(add[i], add[j]);
      if (a.align < 0.5) conflicts.push({ targets: [i + 1, j + 1], conflict: round(1 - a.align, 4) });
    }
    const a = vecAlign(cur, add[i]);
    if (a.align < 0.5) conflicts.push({ targets: [0, i + 1], conflict: round(1 - a.align, 4) });
  }
  return {
    alignment: round(base.align, 4),
    deviation: round(base.dev, 4),
    conflicts,
    needsCalibration: base.dev > T || conflicts.length > 0
  };
}

/* V_003 价值冲突检测 */
function v003(input) {
  const vals = (Array.isArray(input.values) ? input.values : []).map(v => ({
    name: String((v && v.name) ?? "?"),
    vector: toNumArr(v && v.vector),
    importance: Number(v && v.importance) || 1
  }));
  const thr = Number(input.threshold);
  const T = isFinite(thr) ? thr : 0.5;
  const conflicts = [], tradeoffs = [];
  for (let i = 0; i < vals.length; i++) {
    for (let j = i + 1; j < vals.length; j++) {
      const cos = cosine(vals[i].vector, vals[j].vector);
      const angle = round((Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI, 2);
      const opposition = clamp01((1 - cos) / 2);
      if (opposition >= T) {
        const sev = opposition >= 0.85 ? "high" : opposition >= 0.65 ? "medium" : "low";
        conflicts.push({ a: vals[i].name, b: vals[j].name, angle, severity: sev });
        tradeoffs.push({
          pair: [vals[i].name, vals[j].name],
          weight: round(vals[i].importance * vals[j].importance, 4),
          suggestion: opposition >= 0.85 ? "二者不可兼得，需择一或分层处理" : "可按时序分阶段满足"
        });
      }
    }
  }
  return { conflicts, tradeoffs };
}

/* V_004 价值衰减模型 */
function v004(input) {
  const v0 = Number(input.initialValue) || 0;
  const half = Math.max(1e-6, Number(input.halfLifeDays) || 90);
  const days = Math.max(0, Number(input.elapsedDays) || 0);
  const kind = String(input.type || "knowledge");
  // 不同类型衰减系数不同：物质最快、知识居中、关系最慢
  const k = kind === "material" ? 1.35 : kind === "relationship" ? 0.72 : 1.0;
  const effHalf = half / k;
  const currentValue = round(v0 * Math.pow(0.5, days / effHalf), 6);
  const decayRate = round(-Math.LN2 / effHalf, 6);
  const preservationActions = kind === "material"
    ? ["建立折旧台账并按期计提", "高价值资产优先投保", "设定残值下限与处置阈值"]
    : kind === "relationship"
      ? ["按半衰期安排定期触达", "记录共同经历以延缓衰减", "关键节点提供确定性响应"]
      : ["建立知识复核周期", "把隐性知识沉淀为可检索资产", "对高频引用条目做版本固化"];
  return { currentValue, decayRate, preservationActions, reinvestmentDue: round(effHalf, 2) };
}

/* V_005 价值增益计算 */
function v005(input) {
  const base = Number(input.baseline) || 0;
  const act = Number(input.actual) || 0;
  const maxP = Number(input.maxPossible);
  const cost = Number(input.cost) || 0;
  const absoluteGain = round(act - base, 6);
  const relativeGain = round(safeDiv(absoluteGain, Math.abs(base) || 1), 6);
  const netGain = round(absoluteGain - cost, 6);
  const roi = round(safeDiv(netGain, Math.abs(cost) || Math.abs(base) || 1), 6);
  const ceil = isFinite(maxP) && maxP > base ? maxP : Math.max(act, base);
  const ratio = clamp01(safeDiv(act - base, Math.max(1e-9, ceil - base)));
  const performance = netGain < 0 ? "loss" : netGain === 0 ? "neutral" : ratio >= 0.7 ? "excellent" : "gain";
  return { absoluteGain, relativeGain, netGain, roi, performance };
}

/* V_006 价值转移机制 */
function acct(a) {
  const o = { ...(a && typeof a === "object" ? a : {}) };
  const bal = Number(o.balance ?? o.value ?? o.amount ?? 0) || 0;
  o.balance = round(bal, 6);
  return o;
}
function v006(input) {
  const from = acct(input.from), to = acct(input.to);
  const amount = Math.max(0, Number(input.amount) || 0);
  const costRate = Math.max(0, Number(input.transferCost) || 0);
  const cost = round(amount * costRate, 6);
  const keyF = input.fromKey || "balance", keyT = input.toKey || "balance";
  const avail = Number(from[keyF] ?? from.balance ?? 0) || 0;
  const transferred = round(Math.min(amount, Math.max(0, avail)), 6);
  from[keyF] = round(avail - transferred - Math.min(cost, Math.max(0, avail - transferred)), 6);
  to[keyT] = round((Number(to[keyT] ?? to.balance ?? 0) || 0) + transferred, 6);
  const delay = round(transferred > 0 ? Math.log1p(transferred) / 10 : 0, 4);
  const receipt = transferred === 0
    ? `转移失败：可用余额 ${avail} 不足以覆盖转移额 ${amount}`
    : `已转移 ${transferred}（手续费 ${cost}），发起于 ${(from.name || from.id || "来源")} → ${(to.name || to.id || "目标")}`;
  return { from, to, transferred, cost, delay, receipt };
}

/* V_007 价值平衡分析 */
function v007(input) {
  const vals = (Array.isArray(input.values) ? input.values : []).map(v => ({
    dimension: String((v && v.dimension) ?? "?"),
    value: Number(v && v.value) || 0,
    targetWeight: Number(v && v.targetWeight) || 0
  }));
  const v = vals.map(x => x.value);
  const m = mean(v), va = variance(v);
  const imbalance = vals.map(x => ({ dimension: x.dimension, deviation: round(x.value - x.targetWeight, 6) }));
  const totDev = imbalance.reduce((s, x) => s + Math.abs(x.deviation), 0);
  const balanceScore = round(clamp01(1 - safeDiv(totDev, Math.max(1e-9, vals.reduce((s, x) => s + Math.abs(x.targetWeight), 0)))), 4);
  const suggestions = imbalance
    .filter(x => Math.abs(x.deviation) > 0.1)
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
    .slice(0, 3)
    .map(x => x.deviation > 0 ? `${x.dimension} 超出目标 ${round(x.deviation, 3)}，建议回收投入` : `${x.dimension} 低于目标 ${round(-x.deviation, 3)}，建议补强`);
  return { mean: round(m, 6), variance: round(va, 6), balanceScore, imbalance, suggestions };
}

/* V_008 价值审计方法 */
function v008(input) {
  const claimed = Array.isArray(input.claimed) ? input.claimed : [];
  const actual = Array.isArray(input.actual) ? input.actual : [];
  const scope = Array.isArray(input.auditScope) && input.auditScope.length ? input.auditScope : null;
  const keyOf = x => String((x && (x.id ?? x.name ?? x.key)) ?? "");
  const amap = new Map(actual.map(a => [keyOf(a), Number((a && (a.value ?? a.amount)) ?? 0) || 0]));
  const discrepancies = [];
  let totClaim = 0, totDev = 0;
  claimed.forEach(c => {
    const k = keyOf(c);
    if (scope && !scope.includes(k)) return;
    const cv = Number((c && (c.value ?? c.amount)) ?? 0) || 0;
    totClaim += cv;
    const av = amap.has(k) ? amap.get(k) : 0;
    const d = round(cv - av, 6);
    if (Math.abs(d) > 1e-9) {
      discrepancies.push({ key: k, claimed: cv, actual: av, discrepancy: d, relative: round(safeDiv(d, Math.abs(cv) || 1), 4) });
      totDev += Math.abs(d);
    }
  });
  const auditScore = round(clamp01(1 - safeDiv(totDev, Math.max(1e-9, totClaim))), 4);
  const riskLevel = auditScore >= 0.9 ? "low" : auditScore >= 0.75 ? "medium" : auditScore >= 0.5 ? "high" : "critical";
  const report = { itemsChecked: scope ? scope.length : claimed.length, discrepancies: discrepancies.length, discrepancyRate: round(safeDiv(discrepancies.length, Math.max(1, claimed.length)), 4), totalClaimed: round(totClaim, 4), totalDeviation: round(totDev, 4) };
  const suggestions = riskLevel === "low"
    ? ["维持现有核算口径，按季度复审"]
    : ["对差异项逐条追溯原始凭证", "把宣称值改为可机器核对的实测值", "对高风险条目建立双人复核"];
  return { discrepancies, auditScore, riskLevel, report, suggestions };
}

/* V_009 价值溯源链 */
function v009(input) {
  const chain = (Array.isArray(input.chain) ? input.chain : []).map(c => ({
    source: String((c && c.source) ?? "unknown"),
    contribution: Number(c && c.contribution) || 0,
    timestamp: Number(c && c.timestamp) || 0,
    signature: c && c.signature != null ? String(c.signature) : null
  }));
  const totalValue = round(chain.reduce((s, c) => s + c.contribution, 0), 6);
  const bySrc = new Map();
  chain.forEach(c => bySrc.set(c.source, (bySrc.get(c.source) || 0) + c.contribution));
  const sources = [...bySrc.entries()]
    .map(([source, total]) => ({ source, total: round(total, 6), percentage: round(safeDiv(total, Math.abs(totalValue) || 1) * 100, 2) }))
    .sort((a, b) => b.total - a.total);
  const tamperEvidence = [];
  for (let i = 1; i < chain.length; i++) {
    if (chain[i].timestamp < chain[i - 1].timestamp) {
      tamperEvidence.push(`第 ${i} 条时间戳 ${chain[i].timestamp} 早于前一条 ${chain[i - 1].timestamp}，时序倒置`);
    }
  }
  const signed = chain.filter(c => c.signature).length;
  if (chain.length > 1 && signed > 0 && signed < chain.length) {
    tamperEvidence.push(`${chain.length - signed} 条记录缺少签名，存在插入风险`);
  }
  if (chain.some(c => !c.source || c.source === "unknown")) {
    tamperEvidence.push("存在来源缺失的记录");
  }
  return { sources, totalValue, chainIntegrity: tamperEvidence.length === 0, tamperEvidence };
}

/* V_010 价值校准流程 */
function v010(input) {
  const meas = toNumArr(input.measured), std = toNumArr(input.standard);
  const n = Math.min(meas.length, std.length);
  const method = String(input.method || "additive");
  if (!n) return { calibrated: [], offsets: [], calibrationFactors: [], residualError: 0 };
  let offsets, factors, calibrated;
  if (method === "multiplicative") {
    factors = meas.slice(0, n).map((m, i) => round(safeDiv(std[i], m || 1) || 1, 6));
    offsets = meas.slice(0, n).map(() => 0);
    calibrated = meas.slice(0, n).map((m, i) => round(m * factors[i], 6));
  } else if (method === "nonlinear") {
    // 用标准值对实测值做一次线性回归，反解校准函数
    const { slope, intercept } = ols(std.slice(0, n), meas.slice(0, n));
    factors = meas.slice(0, n).map(() => round(slope || 1, 6));
    offsets = meas.slice(0, n).map(() => round(intercept || 0, 6));
    calibrated = meas.slice(0, n).map(m => round(slope * m + intercept, 6));
  } else {
    offsets = meas.slice(0, n).map((m, i) => round(std[i] - m, 6));
    factors = meas.slice(0, n).map(() => 1);
    calibrated = meas.slice(0, n).map((m, i) => round(m + offsets[i], 6));
  }
  const residualError = round(Math.sqrt(mean(calibrated.map((c, i) => (c - std[i]) ** 2))), 6);
  return { calibrated, offsets, calibrationFactors: factors, residualError };
}

/* V_011 价值投影方法 */
function v011(input) {
  const vec = toNumArr(input.vector);
  const basis = (Array.isArray(input.basis) ? input.basis : []).map(toNumArr).filter(b => b.length === vec.length && vec.length > 0);
  const type = String(input.projectionType || "strategic");
  if (!vec.length || !basis.length) {
    return { projection: [], retainedVariance: 0, lostDimensions: [], interpretation: "缺少与向量同维的基，无法投影" };
  }
  const proj = new Array(vec.length).fill(0);
  const coeffs = basis.map(b => {
    const nb = Math.sqrt(b.reduce((s, x) => s + x * x, 0)) || 1;
    return { u: b.map(x => x / nb), c: 0 };
  });
  coeffs.forEach(k => { k.c = vec.reduce((s, v, i) => s + v * k.u[i], 0); });
  coeffs.forEach(k => { for (let i = 0; i < vec.length; i++) proj[i] += k.c * k.u[i]; });
  const orig = vec.reduce((s, x) => s + x * x, 0);
  const kept = proj.reduce((s, x) => s + x * x, 0);
  const retainedVariance = round(clamp01(safeDiv(kept, orig)), 4);
  const residPerDim = vec.map((v, i) => Math.abs(v - proj[i]));
  const lost = residPerDim
    .map((r, i) => ({ i, r }))
    .filter(x => x.r > (orig / vec.length) * 0.5)
    .map(x => `维度${x.i + 1}`);
  const interpretation = type === "risk"
    ? `投影到风险基后保留 ${round(retainedVariance * 100, 1)}% 价值能量，损失维度主要落在 ${lost.join("、") || "无"}`
    : type === "temporal"
      ? `投影到时间基后保留 ${round(retainedVariance * 100, 1)}% 价值能量，短期可实现部分占比 ${round(retainedVariance * 100, 1)}%`
      : `投影到战略基后可解释 ${round(retainedVariance * 100, 1)}% 的价值构成，${lost.length} 个维度未被子空间覆盖`;
  return { projection: proj.map(x => round(x, 6)), retainedVariance, lostDimensions: lost, interpretation };
}

/* V_012 价值密度度量 */
function v012(input) {
  const tv = Number(input.totalValue) || 0;
  const vol = Number(input.volume) || 0;
  const unit = String(input.unit || "resource");
  const density = round(vol === 0 ? 0 : tv / vol, 6);
  const a = Math.abs(density);
  const classification = a === 0 ? "sparse" : a < 0.1 ? "sparse" : a < 0.5 ? "medium" : a < 2 ? "dense" : "ultra-dense";
  const strategy = classification === "ultra-dense"
    ? `单位${unit}承载价值极高，优先保供并防止单点塌陷`
    : classification === "dense"
      ? `单位${unit}价值密集，适合规模化复制`
      : classification === "medium"
        ? `密度中等，可扩量同时观察边际递减`
        : `密度稀疏，应压缩${unit}占用或提升单量价值`;
  return { density, classification, strategy };
}

/* V_013 价值熵分析 */
function v013(input) {
  const vals = (Array.isArray(input.values) ? input.values : []).map(v => ({
    dimension: String((v && v.dimension) ?? "?"),
    value: Math.max(0, Number(v && v.value) || 0)
  }));
  const H = entropy(vals.map(v => v.value));
  const Hmax = maxEntropy(vals.length || 1);
  const normalizedEntropy = round(Hmax ? clamp01(H / Hmax) : 0, 4);
  const diversification = normalizedEntropy;
  const total = vals.reduce((s, v) => s + v.value, 0) || 1;
  const concentration = round(clamp01(vals.reduce((s, v) => s + (v.value / total) ** 2, 0)), 4);
  const strategy = String(input.strategy || "balanced");
  const top = vals.slice().sort((a, b) => b.value - a.value)[0];
  const recommendation = strategy === "conservative"
    ? `保守策略下应把 ${top ? top.dimension : "主维度"} 的占比再提 10%，降低不确定性`
    : strategy === "aggressive"
      ? `激进策略下可削减低贡献维度，把资源集中到 ${top ? top.dimension : "主维度"} 追求单点突破`
      : normalizedEntropy < 0.5
        ? `分布过度集中（归一化熵 ${normalizedEntropy}），建议补充 2-3 个次维度以增强抗风险`
        : `分布较均衡（归一化熵 ${normalizedEntropy}），维持现结构并监测集中度`;
  return { entropy: round(H, 4), normalizedEntropy, diversification, concentration, recommendation };
}

/* V_014 价值深度评估 */
function v014(input) {
  const chain = (Array.isArray(input.chain) ? input.chain : []).map(c => ({
    level: Number(c && c.level) || 0,
    value: Number(c && c.value) || 0,
    description: String((c && c.description) ?? "")
  }));
  if (!chain.length) return { maxDepth: 0, avgDepth: 0, depthDistribution: [], moatStrength: 0 };
  const byLevel = new Map();
  chain.forEach(c => {
    const g = byLevel.get(c.level) || { level: c.level, count: 0, value: 0 };
    g.count++; g.value += c.value;
    byLevel.set(c.level, g);
  });
  const depthDistribution = [...byLevel.values()]
    .map(g => ({ level: g.level, count: g.count, value: round(g.value, 6) }))
    .sort((a, b) => a.level - b.level);
  const maxDepth = Math.max(...chain.map(c => c.level));
  const avgDepth = round(mean(chain.map(c => c.level)), 4);
  // 护城河强度：层级越深、上层价值占比越高越强
  const totalV = chain.reduce((s, c) => s + Math.abs(c.value), 0) || 1;
  const deepShare = chain.filter(c => c.level >= maxDepth * 0.6).reduce((s, c) => s + Math.abs(c.value), 0) / totalV;
  const moatStrength = round(clamp01(0.5 * clamp01(maxDepth / 5) + 0.5 * deepShare), 4);
  return { maxDepth, avgDepth, depthDistribution, moatStrength };
}

/* V_015 价值广度评估 */
function v015(input) {
  const domains = (Array.isArray(input.domains) ? input.domains : []).map(String);
  const cov = (Array.isArray(input.coverage) ? input.coverage : []).map(c => ({
    domain: String((c && c.domain) ?? "?"),
    value: Number(c && c.value) || 0,
    depth: Number(c && c.depth) || 0
  }));
  const coveredSet = new Set(cov.filter(c => c.value > 0 || c.depth > 0).map(c => c.domain));
  const coveredDomains = domains.filter(d => coveredSet.has(d));
  const uncoveredDomains = domains.filter(d => !coveredSet.has(d));
  const breadth = round(domains.length ? coveredDomains.length / domains.length : 0, 4);
  const depths = cov.map(c => c.depth);
  const dMean = mean(depths), dMax = max(depths);
  let pattern;
  if (breadth < 0.34 && dMax >= 2) pattern = "I";
  else if (breadth >= 0.34 && breadth < 0.75 && dMean < 2) pattern = "T";
  else if (breadth >= 0.75 && dMean >= 1) pattern = "π";
  else pattern = "comb";
  const depthUniformity = clamp01(1 - safeDiv(std(depths), Math.max(1e-9, dMean)));
  const transferability = round(clamp01(0.6 * breadth + 0.4 * depthUniformity), 4);
  return { breadth, coveredDomains, uncoveredDomains, pattern, transferability };
}

module.exports = {
  handlers: {
    ALG_T3_V_001: v001, ALG_T3_V_002: v002, ALG_T3_V_003: v003, ALG_T3_V_004: v004,
    ALG_T3_V_005: v005, ALG_T3_V_006: v006, ALG_T3_V_007: v007, ALG_T3_V_008: v008,
    ALG_T3_V_009: v009, ALG_T3_V_010: v010, ALG_T3_V_011: v011, ALG_T3_V_012: v012,
    ALG_T3_V_013: v013, ALG_T3_V_014: v014, ALG_T3_V_015: v015
  },
  samples: {
    ALG_T3_V_001: () => ({ contribution: { dT: 0.8, dI: 0.6, dO: 0.7, dG: 0.9, coYuan: 0.5, yuYuan: 0.4 }, weights: [1, 1, 1, 1.2, 1, 1] }),
    ALG_T3_V_002: () => ({
      current: [0.8, 0.6, 0.7], target: [0.9, 0.6, 0.75],
      additionalTargets: [[0.2, 0.9, 0.3]], threshold: 0.2
    }),
    ALG_T3_V_003: () => ({
      values: [{ name: "效率", vector: [1, 0, 0], importance: 1.2 },
        { name: "公平", vector: [-1, 0.1, 0], importance: 1.0 },
        { name: "创新", vector: [0.9, 0.2, 0.1], importance: 0.8 }],
      threshold: 0.5
    }),
    ALG_T3_V_004: () => ({ initialValue: 100, halfLifeDays: 90, elapsedDays: 60, type: "knowledge" }),
    ALG_T3_V_005: () => ({ baseline: 100, actual: 168, maxPossible: 200, cost: 20 }),
    ALG_T3_V_006: () => ({ from: { id: "account-A", balance: 500 }, to: { id: "account-B", balance: 30 }, amount: 120, transferCost: 0.01 }),
    ALG_T3_V_007: () => ({
      values: [{ dimension: "认知", value: 0.8, targetWeight: 0.25 }, { dimension: "情感", value: 0.4, targetWeight: 0.25 },
        { dimension: "行为", value: 0.7, targetWeight: 0.25 }, { dimension: "价值", value: 0.6, targetWeight: 0.25 }]
    }),
    ALG_T3_V_008: () => ({
      claimed: [{ id: "A", value: 100 }, { id: "B", value: 80 }, { id: "C", value: 60 }],
      actual: [{ id: "A", value: 96 }, { id: "B", value: 80 }, { id: "C", value: 41 }]
    }),
    ALG_T3_V_009: () => ({
      chain: [{ source: "团队A", contribution: 40, timestamp: 1, signature: "sig-a" },
        { source: "团队B", contribution: 25, timestamp: 2, signature: "sig-b" },
        { source: "团队A", contribution: 15, timestamp: 3, signature: "sig-c" }]
    }),
    ALG_T3_V_010: () => ({ measured: [10.2, 20.1, 29.7, 40.3], standard: [10, 20, 30, 40], method: "additive" }),
    ALG_T3_V_011: () => ({ vector: [1, 2, 3, 4], basis: [[1, 0, 0, 0], [0, 1, 0, 0]], projectionType: "strategic" }),
    ALG_T3_V_012: () => ({ totalValue: 480, volume: 120, unit: "time" }),
    ALG_T3_V_013: () => ({
      values: [{ dimension: "直接价值", value: 60 }, { dimension: "间接价值", value: 25 },
        { dimension: "期权价值", value: 10 }, { dimension: "社会价值", value: 5 }],
      strategy: "balanced"
    }),
    ALG_T3_V_014: () => ({
      chain: [{ level: 1, value: 100, description: "接口层" }, { level: 2, value: 60, description: "组件层" },
        { level: 3, value: 30, description: "算法层" }, { level: 3, value: 20, description: "数据层" }]
    }),
    ALG_T3_V_015: () => ({
      domains: ["认知", "情感", "行为", "价值", "时间"],
      coverage: [{ domain: "认知", value: 0.8, depth: 3 }, { domain: "情感", value: 0.4, depth: 2 },
        { domain: "行为", value: 0.7, depth: 2 }, { domain: "价值", value: 0.2, depth: 1 }]
    })
  }
};
