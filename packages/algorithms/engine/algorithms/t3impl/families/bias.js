"use strict";
/**
 * bias.js — ALG_T3_B_001..015 真实实现（偏差 / 漂移 / 退化 检测族）
 */
const L = require("../t3lib.js");
const { mean, std, min, max, round, clamp01, safeDiv, pearson, ols, r2,
  ksTest, zScores, iqrOutliers, quantile, ema } = L;

const A = v => (Array.isArray(v) ? v.map(Number) : []);

/* B_001 漂移分数量化 */
function b001(input) {
  const e = A(input.expected), a = A(input.actual);
  const n = Math.min(e.length, a.length);
  if (!n) return { score: 0, normalizedScore: 0, direction: [], severity: "none" };
  const w = Array.isArray(input.weights) && input.weights.length >= n ? input.weights.map(Number) : new Array(n).fill(1);
  const tw = w.slice(0, n).reduce((s, x) => s + Math.abs(x), 0) || n;
  const direction = [];
  let acc = 0, maxMag = 1e-9;
  for (let i = 0; i < n; i++) {
    const d = a[i] - e[i];
    const scale = Math.max(Math.abs(e[i]), 1e-9);
    acc += Math.abs(d) / scale * Math.abs(w[i]);
    maxMag = Math.max(maxMag, Math.abs(d) / scale);
    direction.push(round(d, 6));
  }
  const score = round(acc / tw, 6);
  const normalizedScore = round(clamp01(score / Math.max(1, maxMag)), 4);
  const severity = normalizedScore >= 0.5 ? "high" : normalizedScore >= 0.3 ? "medium" : normalizedScore >= 0.1 ? "low" : "none";
  return { score, normalizedScore, direction, severity };
}

/* B_002 偏差向量分析 */
function b002(input) {
  const e = A(input.expected), a = A(input.actual);
  const n = Math.min(e.length, a.length);
  const dims = Array.isArray(input.dimensions) && input.dimensions.length >= n
    ? input.dimensions.slice(0, n) : Array.from({ length: n }, (_, i) => `维度${i + 1}`);
  const vector = [], directions = [];
  for (let i = 0; i < n; i++) {
    const d = a[i] - e[i];
    vector.push(round(d, 6));
    directions.push({ dimension: dims[i], direction: d >= 0 ? "positive" : "negative", magnitude: round(Math.abs(d), 6) });
  }
  const totalMagnitude = round(Math.sqrt(vector.reduce((s, x) => s + x * x, 0)), 6);
  const dominant = directions.length
    ? directions.slice().sort((x, y) => y.magnitude - x.magnitude)[0].dimension : "";
  return { vector, directions, dominant, totalMagnitude };
}

/* B_003 异常检测方法 */
function b003(input) {
  const v = A(input.values);
  const zt = Number(input.zThreshold);
  const Z = isFinite(zt) ? zt : 3;
  const w = Math.max(2, Number(input.windowSize) || v.length || 2);
  const dynamic = String(input.baseline || "static") === "dynamic";
  const anomalies = [];
  if (!v.length) return { anomalies: [], mean: 0, std: 0, anomalyRate: 0 };
  if (dynamic) {
    // 滑动窗口基线：只用窗口内历史判断当前点
    for (let i = 0; i < v.length; i++) {
      const seg = v.slice(Math.max(0, i - w + 1), i + 1);
      if (seg.length < 2) continue;
      const m = mean(seg), s = std(seg);
      if (s === 0) continue;
      const z = (v[i] - m) / s;
      if (Math.abs(z) > Z) anomalies.push({ index: i, value: v[i], zScore: round(z, 4) });
    }
  } else {
    zScores(v).forEach((z, i) => {
      if (Math.abs(z) > Z) anomalies.push({ index: i, value: v[i], zScore: round(z, 4) });
    });
  }
  return {
    anomalies, mean: round(mean(v), 6), std: round(std(v), 6),
    anomalyRate: round(v.length ? anomalies.length / v.length : 0, 4)
  };
}

/* B_004 离群点识别 */
function b004(input) {
  const v = A(input.values);
  const mult = Number(input.multiplier);
  const K = isFinite(mult) && mult > 0 ? mult : 1.5;
  if (!v.length) return { outliers: [], q1: 0, q3: 0, iqr: 0, bounds: { lower: 0, upper: 0 } };
  const q1 = quantile(v, 0.25), q3 = quantile(v, 0.75), iqr = q3 - q1;
  const lower = q1 - K * iqr, upper = q3 + K * iqr;
  const extLow = q1 - 3 * iqr, extUp = q3 + 3 * iqr;
  const outliers = [];
  v.forEach((x, i) => {
    if (x < lower || x > upper) {
      const extreme = x < extLow || x > extUp;
      outliers.push({ index: i, value: x, type: extreme ? "extreme" : "mild" });
    }
  });
  return { outliers, q1: round(q1, 6), q3: round(q3, 6), iqr: round(iqr, 6), bounds: { lower: round(lower, 6), upper: round(upper, 6) } };
}

/* B_005 分布偏移检测 */
function b005(input) {
  const ref = A(input.reference), cur = A(input.current);
  const alpha = Number(input.significanceLevel);
  const ALPHA = isFinite(alpha) && alpha > 0 && alpha < 1 ? alpha : 0.05;
  if (!ref.length || !cur.length) {
    return { ksStatistic: 0, pValue: 1, shifted: false, shiftMagnitude: 0, criticalRegions: [] };
  }
  const { statistic, pValue } = ksTest(ref, cur);
  const shiftMagnitude = round(Math.abs(mean(cur) - mean(ref)), 6);
  // 找出两分布差最大的区间
  const all = [...ref, ...cur].sort((x, y) => x - y);
  const lo = all[Math.floor(all.length * 0.05)], hi = all[Math.floor(all.length * 0.95)];
  const BINS = 10;
  const criticalRegions = [];
  if (hi > lo) {
    const cdf = (arr, x) => arr.filter(y => y <= x).length / arr.length;
    for (let b = 0; b < BINS; b++) {
      const x0 = lo + ((hi - lo) * b) / BINS, x1 = lo + ((hi - lo) * (b + 1)) / BINS;
      const dr = Math.abs(cdf(ref, x1) - cdf(cur, x1));
      if (dr > 0.2) criticalRegions.push([round(x0, 4), round(x1, 4), round(dr, 4)]);
    }
  }
  return { ksStatistic: statistic, pValue, shifted: pValue < ALPHA, shiftMagnitude, criticalRegions };
}

/* B_006 概念漂移检测 */
function b006(input) {
  const runs = (Array.isArray(input.errorRates) ? input.errorRates : []).map(r => ({
    window: Number(r && r.window) || 0,
    errorRate: Number(r && r.errorRate) || 0,
    sampleSize: Number(r && r.sampleSize) || 0
  })).sort((x, y) => x.window - y.window);
  const thrIn = Number(input.threshold);
  const minWin = Math.max(2, Number(input.minWindows) || 3);
  if (runs.length < minWin) {
    return { driftDetected: false, driftPoint: -1, driftType: "incremental", severity: 0, confidence: 0 };
  }
  const rates = runs.map(r => r.errorRate);
  const baseMean = mean(rates.slice(0, minWin));
  const baseStd = Math.max(1e-6, std(rates.slice(0, minWin)));
  const T = isFinite(thrIn) ? thrIn : baseMean + 2 * baseStd;
  let driftIdx = -1;
  for (let i = minWin; i < rates.length; i++) {
    if (rates[i] > T) { driftIdx = i; break; }
  }
  const detected = driftIdx >= 0;
  const jump = detected ? rates[driftIdx] - mean(rates.slice(0, driftIdx)) : 0;
  const driftType = !detected ? "incremental" : jump > 2 * baseStd ? "sudden" : jump > baseStd ? "gradual" : "incremental";
  const severity = round(clamp01(detected ? jump / Math.max(1e-6, Math.max(...rates)) : 0), 4);
  const nEff = runs.reduce((s, r) => s + r.sampleSize, 0);
  const confidence = round(clamp01(1 - Math.exp(-nEff / 500)) * (detected ? 1 : 0.5), 4);
  return {
    driftDetected: detected,
    driftPoint: detected ? runs[driftIdx].window : -1,
    driftType, severity, confidence
  };
}

/* B_007 数据漂移监控 */
function b007(input) {
  const r = input.refStats || {}, c = input.curStats || {};
  const tIn = Number(input.threshold);
  const T = isFinite(tIn) ? tIn : 0.2;
  const rMean = Number(r.mean) || 0, rStd = Math.max(1e-9, Number(r.std) || 1e-9), rSkew = Number(r.skew) || 0;
  const cMean = Number(c.mean) || 0, cStd = Math.max(1e-9, Number(c.std) || 1e-9), cSkew = Number(c.skew) || 0;
  const meanShift = round(safeDiv(cMean - rMean, rStd), 4);
  const stdShift = round(cStd / rStd - 1, 4);
  const skewShift = round(cSkew - rSkew, 4);
  const driftScore = round(Math.sqrt(meanShift ** 2 + (stdShift * 2) ** 2 + (skewShift * 2) ** 2) / 3, 4);
  const affectedFeatures = [];
  if (Math.abs(meanShift) > T) affectedFeatures.push("均值");
  if (Math.abs(stdShift) > T) affectedFeatures.push("方差");
  if (Math.abs(skewShift) > T) affectedFeatures.push("偏度");
  return { drifted: affectedFeatures.length > 0, meanShift, stdShift, skewShift, driftScore, affectedFeatures };
}

/* B_008 模型漂移诊断 */
function b008(input) {
  const hist = (Array.isArray(input.performanceHistory) ? input.performanceHistory : [])
    .map(h => ({ time: Number(h && h.time) || 0, metric: String((h && h.metric) ?? ""), value: Number(h && h.value) || 0 }))
    .sort((x, y) => x.time - y.time);
  const tIn = Number(input.threshold);
  const T = isFinite(tIn) ? tIn : 0.05;
  if (hist.length < 2) {
    return { drifting: false, degradationRate: 0, acceleration: 0, driftStart: -1, projectedFailure: -1, rootCauseHypotheses: [] };
  }
  const y = hist.map(h => h.value), x = hist.map(h => h.time);
  const { slope } = ols(y, x);
  const degradationRate = round(-slope, 6); // 指标下滑为正
  const half = Math.floor(y.length / 2);
  const early = half >= 2 ? ols(y.slice(0, half), x.slice(0, half)).slope : slope;
  const late = y.length - half >= 2 ? ols(y.slice(half), x.slice(half)).slope : slope;
  const acceleration = round(-(late - early), 6);
  const maxV = max(y);
  let driftStart = -1;
  for (let i = 0; i < y.length; i++) {
    if (maxV - y[i] >= T) { driftStart = hist[i].time; break; }
  }
  const minV = min(y);
  const projectedFailure = slope < 0 && minV > 0
    ? round(hist[hist.length - 1].time + (minV * 0.5 - minV) / slope, 4) : -1;
  const hypotheses = [];
  if (degradationRate > 0) hypotheses.push("训练分布与线上分布发生漂移，模型输入已偏离训练支撑集");
  if (acceleration > 0) hypotheses.push("退化在加速，可能存在特征管道上游变更");
  if (degradationRate <= 0) hypotheses.push("指标未下滑，波动可能来自样本量不足而非模型退化");
  return { drifting: degradationRate > 0, degradationRate, acceleration, driftStart, projectedFailure, rootCauseHypotheses: hypotheses };
}

/* B_009 行为漂移检测 */
function b009(input) {
  const exp = (Array.isArray(input.expectedActions) ? input.expectedActions : []).map(String);
  const act = (Array.isArray(input.actualActions) ? input.actualActions : []).map(String);
  const freq = arr => { const m = new Map(); arr.forEach(x => m.set(x, (m.get(x) || 0) + 1)); return m; };
  const fe = freq(exp), fa = freq(act);
  const newActions = [...fa.keys()].filter(k => !fe.has(k));
  const missingActions = [...fe.keys()].filter(k => !fa.has(k));
  const allKeys = new Set([...fe.keys(), ...fa.keys()]);
  const frequencyChanges = [];
  allKeys.forEach(k => {
    const e = fe.get(k) || 0, a = fa.get(k) || 0;
    if (e !== a) frequencyChanges.push({ action: k, expected: e, actual: a });
  });
  const denom = Math.max(1, exp.length + act.length);
  const symDiff = newActions.length + missingActions.length;
  const totalExp = [...fe.values()].reduce((s, x) => s + x, 0) || 1;
  const l1 = [...allKeys].reduce((s, k) => s + Math.abs((fe.get(k) || 0) / totalExp - (fa.get(k) || 0) / Math.max(1, act.length)), 0);
  const driftScore = round(clamp01(0.5 * (symDiff / denom) + 0.5 * (l1 / 2)), 4);
  return { driftScore, newActions, missingActions, frequencyChanges: frequencyChanges.sort((a, b) => Math.abs(b.actual - b.expected) - Math.abs(a.actual - a.expected)) };
}

/* B_010 价值漂移监测 */
function b010(input) {
  const hist = (Array.isArray(input.historicalValues) ? input.historicalValues : [])
    .map(h => ({ time: Number(h && h.time) || 0, vector: A(h && h.vector) }));
  const cur = A(input.currentValue);
  const sens = Number(input.sensitivity);
  const S = isFinite(sens) && sens > 0 ? sens : 2;
  if (!hist.length || !cur.length) {
    return { drifted: false, zScore: 0, driftDirection: [], driftMagnitude: 0, interpretation: "neutral" };
  }
  const d = cur.length;
  const means = Array.from({ length: d }, (_, i) =>
    mean(hist.map(h => Number(h.vector[i] ?? 0) || 0)));
  const sds = Array.from({ length: d }, (_, i) =>
    Math.max(1e-9, std(hist.map(h => Number(h.vector[i] ?? 0) || 0))));
  const z = cur.map((v, i) => (v - means[i]) / sds[i]);
  const zScore = round(Math.sqrt(mean(z.map(x => x * x))), 4);
  const driftDirection = z.map(x => round(x, 4));
  const driftMagnitude = round(Math.sqrt(z.reduce((s, x, i) => s + (cur[i] - means[i]) ** 2, 0)), 6);
  const tgt = A(input.targetVector);
  let interpretation;
  if (tgt.length === d) {
    const dCur = Math.sqrt(cur.reduce((s, v, i) => s + (v - tgt[i]) ** 2, 0));
    const dHist = Math.sqrt(means.reduce((s, v, i) => s + (v - tgt[i]) ** 2, 0));
    interpretation = dCur < dHist ? "growth" : dCur > dHist * 1.1 ? "deviation" : "neutral";
  } else {
    interpretation = zScore > S ? "deviation" : mean(z) > 0 ? "growth" : "neutral";
  }
  return { drifted: zScore > S, zScore, driftDirection, driftMagnitude, interpretation };
}

/* B_011 性能退化分析 */
function b011(input) {
  const b = input.baseline || {}, c = input.current || {};
  const tIn = Number(input.threshold);
  const T = isFinite(tIn) ? tIn : 0.1;
  const metrics = [
    ["latency", Number(b.latency) || 0, Number(c.latency) || 0, +1],   // 越高越差
    ["throughput", Number(b.throughput) || 0, Number(c.throughput) || 0, -1], // 越低越差
    ["errorRate", Number(b.errorRate) || 0, Number(c.errorRate) || 0, +1]
  ];
  const degradation = [];
  let worst = 0;
  metrics.forEach(([name, bv, cv, dir]) => {
    const absolute = round(cv - bv, 6);
    const relative = round(safeDiv(cv - bv, Math.abs(bv) || 1), 6);
    const bad = dir * relative; // 正值代表变差
    worst = Math.max(worst, bad);
    degradation.push({ metric: name, absolute, relative });
  });
  const degradationRate = round(worst, 6);
  const degraded = worst > T;
  const severity = !degraded ? "none" : worst > T * 2.5 ? "critical" : "warning";
  return { degraded, degradation, degradationRate, severity };
}

/* B_012 偏差归因分析 */
function b012(input) {
  const dev = Number(input.deviation) || 0;
  const factors = (Array.isArray(input.factors) ? input.factors : []).map(f => ({
    name: String((f && f.name) ?? "?"),
    contribution: Number(f && f.contribution) || 0,
    confidence: clamp01(Number(f && f.confidence) || 0)
  }));
  const method = String(input.method || "linear");
  const totAbs = factors.reduce((s, f) => s + Math.abs(f.contribution), 0) || 1;
  const attributed = factors.map(f => ({
    name: f.name,
    contribution: round(f.contribution, 6),
    percentage: round(safeDiv(Math.abs(f.contribution), totAbs) * 100, 2),
    confidence: round(f.confidence, 4)
  })).sort((a, b) => b.percentage - a.percentage);
  const totalExplained = round(factors.reduce((s, f) => s + f.contribution, 0), 6);
  const residual = round(dev - totalExplained, 6);
  if (method === "shapley") {
    // 按置信度加权重新分配，保证贡献和与偏差一致
    const wsum = factors.reduce((s, f) => s + f.confidence, 0) || 1;
    attributed.forEach(a => {
      const f = factors.find(x => x.name === a.name);
      a.contribution = round(dev * (f.confidence / wsum), 6);
    });
  }
  return { attributed, residual, totalExplained };
}

/* B_013 偏差根因定位 */
function b013(input) {
  const symptoms = (Array.isArray(input.symptoms) ? input.symptoms : []).map(String);
  const causes = (Array.isArray(input.causes) ? input.causes : []).map(c => ({
    name: String((c && c.name) ?? "?"),
    evidence: (Array.isArray(c && c.evidence) ? c.evidence : []).map(String),
    prior: clamp01(Number(c && c.prior) || 0.5)
  }));
  if (!causes.length) {
    return { rootCause: "", confidence: 0, evidenceChain: [], alternatives: [], recommendation: "无候选因，无法定位" };
  }
  const scored = causes.map(c => {
    const hit = c.evidence.filter(e => symptoms.some(s => s.includes(e) || e.includes(s))).length;
    const coverage = c.evidence.length ? hit / c.evidence.length : 0;
    const posterior = clamp01(0.6 * coverage + 0.4 * c.prior);
    return { ...c, coverage, posterior };
  }).sort((a, b) => b.posterior - a.posterior);
  const top = scored[0];
  const evidenceChain = top.evidence.map(e => {
    const s = symptoms.find(x => x.includes(e) || e.includes(x));
    return s ? `${e} ← 症状「${s}」` : `${e} ← 未见对应症状（弱证据）`;
  });
  const alternatives = scored.slice(1).map(c => ({ name: c.name, confidence: round(c.posterior, 4) }));
  const recommendation = top.posterior >= 0.7
    ? `优先处置「${top.name}」，其证据覆盖率 ${round(top.coverage * 100, 0)}%`
    : `「${top.name}」证据不足（${round(top.posterior * 100, 0)}%），建议补充取证后再定性`;
  return { rootCause: top.name, confidence: round(top.posterior, 4), evidenceChain, alternatives, recommendation };
}

/* B_014 偏差修正策略 */
function b014(input) {
  const vals = A(input.values), devs = A(input.deviations);
  const method = String(input.method || "direct");
  const n = Math.min(vals.length, devs.length);
  const corrected = [];
  const sideEffects = [];
  for (let i = 0; i < n; i++) {
    const v = vals[i], d = devs[i];
    let c;
    if (method === "direct") c = v - d;
    else if (method === "compensate") c = v - d * 0.7;
    else if (method === "calibrate") c = v === 0 ? v : v * (1 - safeDiv(d, v));
    else c = v - ema([d], 0.5)[0]; // learn：用指数平滑后的偏差做修正
    corrected.push(round(c, 6));
  }
  if (method === "direct" && corrected.some(c => Math.abs(c) > 1e6)) {
    sideEffects.push("直接相减在极值点可能放大误差");
  }
  if (method === "compensate") sideEffects.push("只补偿 70%，偏差会残留并累积");
  if (method === "learn") sideEffects.push("学习式修正依赖历史，冷启动阶段不准确");
  const residualDeviation = round(Math.sqrt(mean(corrected.map((c, i) => (c - (vals[i] - devs[i])) ** 2))), 6);
  const vd = A(input.validationData);
  let validationPassed = true;
  if (vd.length) {
    const m1 = mean(corrected), m2 = mean(vd.slice(0, corrected.length));
    validationPassed = Math.abs(m1 - m2) <= Math.max(0.05 * Math.abs(m2), 1e-6);
  }
  return { corrected, residualDeviation, method, sideEffects, validationPassed };
}

/* B_015 偏差预警机制 */
function b015(input) {
  const trend = Number(input.trend) || 0;
  const cur = Number(input.currentValue) || 0;
  const thr = Number(input.threshold) || 0;
  const ttt = Number(input.timeToThreshold);
  const hist = (Array.isArray(input.history) ? input.history : []).map(h => Number((h && (h.value ?? h)) ?? 0));
  let estimatedBreachTime;
  if (isFinite(ttt) && ttt > 0) estimatedBreachTime = round(ttt, 4);
  else if (trend !== 0) estimatedBreachTime = round(Math.max(0, (thr - cur) / trend), 4);
  else estimatedBreachTime = Infinity;
  const willBreach = trend > 0 ? cur < thr : trend < 0 ? cur > thr : false;
  const distance = Math.abs(thr - cur);
  const relDist = safeDiv(distance, Math.max(1e-9, Math.abs(thr)));
  const alertLevel = !willBreach ? "green"
    : relDist < 0.05 ? "red" : relDist < 0.15 ? "orange" : relDist < 0.35 ? "yellow" : "green";
  const vol = hist.length >= 3 ? safeDiv(std(hist), Math.max(1e-9, Math.abs(mean(hist)))) : 0.3;
  const confidence = round(clamp01((willBreach ? 0.7 : 0.9) * (1 - Math.min(0.5, vol))), 4);
  const recommendedAction = alertLevel === "red" ? "立即阻断继续恶化并启动应急预案"
    : alertLevel === "orange" ? "启动预警响应，2 个观测周期内复核"
      : alertLevel === "yellow" ? "提高监测频率，准备缓解方案"
        : "维持常规监测";
  return { willBreach, estimatedBreachTime, alertLevel, recommendedAction, confidence };
}

module.exports = {
  handlers: {
    ALG_T3_B_001: b001, ALG_T3_B_002: b002, ALG_T3_B_003: b003, ALG_T3_B_004: b004,
    ALG_T3_B_005: b005, ALG_T3_B_006: b006, ALG_T3_B_007: b007, ALG_T3_B_008: b008,
    ALG_T3_B_009: b009, ALG_T3_B_010: b010, ALG_T3_B_011: b011, ALG_T3_B_012: b012,
    ALG_T3_B_013: b013, ALG_T3_B_014: b014, ALG_T3_B_015: b015
  },
  samples: {
    ALG_T3_B_001: () => ({ expected: [100, 200, 50], actual: [108, 190, 62], weights: [1, 1, 2] }),
    ALG_T3_B_002: () => ({ expected: [10, 20, 30], actual: [12, 18, 35], dimensions: ["成本", "速度", "质量"] }),
    ALG_T3_B_003: () => ({ values: [10, 10.2, 9.8, 10.1, 25, 9.9, 10.05], zThreshold: 2 }),
    ALG_T3_B_004: () => ({ values: [10, 11, 9, 10.5, 10.2, 40, 9.8], multiplier: 1.5 }),
    ALG_T3_B_005: () => ({ reference: [1, 2, 2, 3, 3, 3, 4, 4, 5], current: [3, 4, 4, 5, 5, 6, 6, 7, 7], significanceLevel: 0.05 }),
    ALG_T3_B_006: () => ({
      errorRates: [{ window: 1, errorRate: 0.05, sampleSize: 200 }, { window: 2, errorRate: 0.06, sampleSize: 200 },
        { window: 3, errorRate: 0.05, sampleSize: 200 }, { window: 4, errorRate: 0.19, sampleSize: 200 },
        { window: 5, errorRate: 0.24, sampleSize: 200 }],
      threshold: 0.12
    }),
    ALG_T3_B_007: () => ({
      refStats: { mean: 100, std: 15, skew: 0.2 },
      curStats: { mean: 118, std: 22, skew: 0.9 }, threshold: 0.2
    }),
    ALG_T3_B_008: () => ({
      performanceHistory: [{ time: 1, metric: "f1", value: 0.92 }, { time: 2, metric: "f1", value: 0.9 },
        { time: 3, metric: "f1", value: 0.87 }, { time: 4, metric: "f1", value: 0.83 },
        { time: 5, metric: "f1", value: 0.78 }], threshold: 0.05
    }),
    ALG_T3_B_009: () => ({
      expectedActions: ["查询", "查询", "下单", "支付", "查询"],
      actualActions: ["查询", "查询", "下单", "查询", "退款"], method: "frequency"
    }),
    ALG_T3_B_010: () => ({
      historicalValues: [{ time: 1, vector: [0.5, 0.5, 0.5] }, { time: 2, vector: [0.52, 0.48, 0.5] },
        { time: 3, vector: [0.49, 0.51, 0.5] }],
      currentValue: [0.9, 0.2, 0.5], sensitivity: 2
    }),
    ALG_T3_B_011: () => ({
      baseline: { latency: 100, throughput: 1000, errorRate: 0.01 },
      current: { latency: 135, throughput: 820, errorRate: 0.03 }, threshold: 0.1
    }),
    ALG_T3_B_012: () => ({
      deviation: 25,
      factors: [{ name: "上游数据延迟", contribution: 12, confidence: 0.8 },
        { name: "缓存命中率下降", contribution: 9, confidence: 0.7 },
        { name: "并发上升", contribution: 3, confidence: 0.5 }],
      method: "linear"
    }),
    ALG_T3_B_013: () => ({
      symptoms: ["响应变慢", "错误率上升"],
      causes: [{ name: "数据库连接池耗尽", evidence: ["响应变慢", "连接超时"], prior: 0.5 },
        { name: "上游接口抖动", evidence: ["错误率上升"], prior: 0.4 }]
    }),
    ALG_T3_B_014: () => ({ values: [10, 20, 30, 40], deviations: [1, -2, 3, -1], method: "compensate" }),
    ALG_T3_B_015: () => ({
      trend: 0.8, currentValue: 92, threshold: 100, timeToThreshold: 10,
      history: [{ time: 1, value: 88 }, { time: 2, value: 90 }, { time: 3, value: 92 }]
    })
  }
};
