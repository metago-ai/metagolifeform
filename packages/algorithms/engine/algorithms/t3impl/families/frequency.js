"use strict";
/**
 * frequency.js — ALG_T3_F_001..013 真实实现（创造频率自适应族）
 */
const L = require("../t3lib.js");
const { mean, std, variance, round, clamp01, safeDiv, ols, pearson } = L;

const arr = v => (Array.isArray(v) ? v : []);
const obj = v => (v && typeof v === "object" ? v : {});
const num = (v, d = 0) => (isFinite(Number(v)) ? Number(v) : d);
const nm = (x, k = "name") => String(obj(x)[k] ?? obj(x).id ?? obj(x).activity ?? "?");

/* F_001 频率自适应调控 */
function f001(input) {
  const integrity = clamp01(num(input.systemIntegrity, 0.9));
  const cur = num(input.currentFrequency, 1);
  const hist = arr(input.history).map(h => ({
    time: num(obj(h).time), integrity: clamp01(num(obj(h).integrity)), frequency: num(obj(h).frequency)
  })).sort((a, b) => a.time - b.time);
  const state = integrity >= 0.98 ? "dormant" : integrity >= 0.9 ? "standby" : "active";
  const mode = integrity >= 0.98 ? "deep-dive" : "high-frequency";
  const target = 0.98;
  const gap = Math.max(0, target - integrity);
  const trend = hist.length >= 2 ? hist[hist.length - 1].integrity - hist[0].integrity : 0;
  const recommendedFrequency = round(mode === "deep-dive"
    ? Math.max(0.4, cur * 0.55)
    : Math.min(6, cur * (1 + gap * 5) + (trend < -0.02 ? 0.6 : 0)), 4);
  const adjustment = round(recommendedFrequency - cur, 4);
  const rationale = mode === "deep-dive"
    ? `完整性 ${round(integrity * 100, 1)}% 已过 98% 线，转入低频深潜，用质量换数量`
    : `完整性 ${round(integrity * 100, 1)}%，距 98% 还差 ${round(gap * 100, 2)} 个点，` +
      (trend < 0 ? "且近期在下滑，需高频修补" : "保持高频输出直至补齐缺口");
  return { recommendedFrequency, state, mode, adjustment, rationale };
}

/* F_002 高频激活模式 */
function f002(input) {
  const integrity = clamp01(num(input.integrity, 0.9));
  const target = clamp01(num(input.targetIntegrity, 0.98));
  const gaps = arr(input.gaps);
  const res = obj(input.resources);
  const compute = Math.max(0, num(res.compute, 1));
  const time = Math.max(0, num(res.time, 1));
  const budget = Math.max(0, num(res.budget, 1));
  const gapN = gaps.length;
  const deficit = Math.max(0, target - integrity);
  const activated = deficit > 0.005 && gapN > 0;
  // 频率与缺口成正比，与资源成反比
  const frequency = activated
    ? round(clamp01(Math.min(1, deficit * 4) + Math.min(1, gapN / 5)) * 4 / Math.max(1, 1 / Math.max(0.5, compute * 0.5 + budget * 0.3 + time * 0.2)), 4)
    : 0;
  const estimatedDuration = activated ? round(gapN * Math.max(1, 2 / Math.max(0.5, compute)), 2) : 0;
  const resourceConsumption = round(frequency * estimatedDuration * 0.25, 4);
  const expectedGain = round(clamp01(deficit) * (activated ? 1 : 0), 4);
  const riskLevel = round(clamp01(resourceConsumption / Math.max(1, budget + compute)), 4);
  return { activated, frequency, estimatedDuration, resourceConsumption, expectedGain, riskLevel };
}

/* F_003 低频深潜模式 */
function f003(input) {
  const integrity = clamp01(num(input.integrity, 0.98));
  const depth = Math.max(1, num(input.explorationDepth, 1));
  const domains = arr(input.domains).map(String);
  const budget = Math.max(1, num(input.timeBudget, 1));
  const activated = integrity >= 0.98;
  const frequency = activated ? round(Math.max(0.3, 1 / depth), 4) : 0;
  const span = Math.min(depth, domains.length || depth);
  const expectedNovelty = round(clamp01((span / Math.max(1, domains.length || depth)) * 0.7 * (activated ? 1 : 0.2)), 4);
  // 突破概率：深度越深、时间越充裕越高，但边际递减
  const breakthroughProbability = round(clamp01(activated
    ? 1 - Math.exp(-(depth * 0.5) * Math.min(2, budget / Math.max(1, depth))) : 0), 4);
  const durationEstimate = round(activated ? depth * Math.max(1, 4 / Math.max(0.5, budget)) : 0, 2);
  return { activated, frequency, explorationDepth: depth, expectedNovelty, breakthroughProbability, durationEstimate };
}

/* F_004 频率切换机制 */
function f004(input) {
  const curMode = String(input.currentMode || "high-frequency");
  const integrity = clamp01(num(input.currentIntegrity, 0.9));
  const thr = clamp01(num(input.threshold, 0.98));
  const strategy = String(input.transitionStrategy || "gradual");
  const want = integrity >= thr ? "deep-dive" : "high-frequency";
  const switchTriggered = want !== curMode;
  const steps = [];
  const n = strategy === "buffered" ? 3 : 5;
  const fromF = curMode === "deep-dive" ? 0.6 : 3.2;
  const toF = want === "deep-dive" ? 0.6 : 3.2;
  for (let i = 1; i <= n; i++) {
    steps.push({
      time: round(i, 2),
      frequency: round(fromF + (toF - fromF) * (i / n), 4),
      mode: i / n >= 0.5 ? want : curMode
    });
  }
  const transitionDuration = round(n * (strategy === "buffered" ? 1.5 : 1), 2);
  // 切换风险：跨越的频幅越大、越突然越不稳
  const jump = Math.abs(toF - fromF);
  const stabilityRisk = round(clamp01(switchTriggered ? (jump / 4) * (strategy === "buffered" ? 0.5 : 1) : 0), 4);
  return { switchTriggered, targetMode: want, transitionDuration, transitionSteps: steps, stabilityRisk };
}

/* F_005 频率监测系统 */
function f005(input) {
  const acts = arr(input.activities).map(a => ({
    time: num(obj(a).time),
    type: String(obj(a).type ?? "?"),
    quality: clamp01(num(obj(a).quality, 0.5)),
    novelty: clamp01(num(obj(a).novelty, 0.5))
  })).sort((a, b) => a.time - b.time);
  const win = Math.max(2, num(input.windowSize, Math.min(10, acts.length || 2)));
  const recent = acts.slice(-win);
  const span = recent.length >= 2 ? (recent[recent.length - 1].time - recent[0].time) || 1 : 1;
  const currentRate = round(recent.length / span, 4);
  const averageQuality = round(recent.length ? mean(recent.map(a => a.quality)) : 0, 4);
  const types = new Set(recent.map(a => a.type));
  const diversityScore = round(clamp01(types.size / Math.max(1, recent.length)), 4);
  const depthScore = round(recent.length ? mean(recent.map(a => a.novelty * a.quality)) : 0, 4);
  const th = Object.assign({ high: 5, low: 0.5, variance: 0.3 }, obj(input.alertThresholds));
  const alerts = [];
  if (currentRate > th.high) alerts.push({ type: "频率过高", severity: "medium", message: `当前速率 ${currentRate} 超过上限 ${th.high}，质量可能被稀释` });
  if (currentRate < th.low) alerts.push({ type: "频率过低", severity: "medium", message: `当前速率 ${currentRate} 低于下限 ${th.low}，可能停滞` });
  const qv = variance(recent.map(a => a.quality));
  if (qv > th.variance) alerts.push({ type: "质量波动", severity: "high", message: `质量方差 ${round(qv, 3)} 超过阈值 ${th.variance}` });
  const trend = [["quality", recent.map(a => a.quality)], ["novelty", recent.map(a => a.novelty)]].map(([k, ys]) => ({
    metric: k, slope: round(ys.length >= 2 ? ols(ys).slope : 0, 6)
  }));
  return { currentRate, averageQuality, diversityScore, depthScore, alerts, trend };
}

/* F_006 频率校准方法 */
function f006(input) {
  const actual = num(input.actualFrequency, 1);
  const target = num(input.targetFrequency, 1);
  const method = String(input.method || "direct");
  const period = Math.max(1, num(input.validationPeriod, 3));
  let nf;
  const sideEffects = [];
  if (method === "direct") {
    nf = target;
    sideEffects.push("直接设定目标值可能触发执行者的抵触，短期到位但持续性差");
  } else if (method === "incentive") {
    nf = actual + (target - actual) * 0.6;
    sideEffects.push("激励式校准到位较慢，需要持续投放激励");
  } else {
    nf = actual + (target - actual) * 0.4;
    sideEffects.push("约束式校准易产生规避行为（形式达标、实质不变）");
  }
  nf = round(nf, 4);
  const residualError = round(Math.abs(target - nf), 6);
  const validationPassed = residualError <= Math.abs(target) * 0.15 + 1e-9;
  return {
    calibrated: validationPassed, newFrequency: nf, residualError, method,
    sideEffects, validationPassed
  };
}

/* F_007 频率共振现象 */
function f007(input) {
  const A = arr(input.entityAFrequencies).map(Number);
  const B = arr(input.entityBFrequencies).map(Number);
  const hist = arr(input.couplingHistory).map(Number);
  const tol = num(input.tolerance, 0.2);
  const n = Math.min(A.length, B.length);
  if (!n) return { resonance: false, frequencyLock: 0, phaseSync: 0, energyGain: 0, resonanceType: "neutral" };
  const a = A.slice(0, n), b = B.slice(0, n);
  const freqLock = round(clamp01((pearson(a, b) + 1) / 2), 4);
  // 相位同步：主峰位置相对差
  let pa = 0, pb = 0;
  a.forEach((v, i) => { if (v > a[pa]) pa = i; });
  b.forEach((v, i) => { if (v > b[pb]) pb = i; });
  const phaseSync = round(clamp01(1 - Math.abs(pa - pb) / Math.max(1, n)), 4);
  const indep = mean(a.map(Math.abs)) + mean(b.map(Math.abs));
  const combined = mean(a.map((x, i) => Math.abs(x + b[i])));
  const energyGain = round(safeDiv(combined - indep, indep || 1), 6);
  const grown = hist.length >= 2 ? hist[hist.length - 1] - hist[0] : 0;
  const resonance = freqLock >= 1 - tol && phaseSync >= 1 - tol && (energyGain > 0 || grown > 0);
  const resonanceType = !resonance && Math.abs(energyGain) <= 0.05 ? "neutral"
    : energyGain > 0 ? "constructive" : "destructive";
  return { resonance, frequencyLock: freqLock, phaseSync, energyGain, resonanceType };
}

/* F_008 频率衰减模型 */
function f008(input) {
  const f0 = num(input.initialFrequency, 1);
  const half = Math.max(1e-6, num(input.halfLifeDays, 30));
  let elapsed = Math.max(0, num(input.elapsedDays, 0));
  const inc = arr(input.incentives).map(x => ({
    time: num(obj(x).time), type: String(obj(x).type ?? ""), strength: clamp01(num(obj(x).strength, 0.2))
  })).sort((a, b) => a.time - b.time);
  // 逐次激励回补
  let f = f0;
  let last = 0;
  inc.forEach(x => {
    if (x.time > elapsed) return;
    f = f * Math.pow(0.5, (x.time - last) / half);
    f = f + (f0 - f) * x.strength;
    last = x.time;
  });
  f = f * Math.pow(0.5, Math.max(0, elapsed - last) / half);
  const currentFrequency = round(Math.max(0, f), 6);
  const decayRate = round(-Math.LN2 / half, 6);
  const nextIncentiveDue = round(elapsed + half * 0.5, 2);
  const halfLifeRemaining = round(Math.max(0, half * Math.log2(Math.max(1e-9, currentFrequency) / Math.max(1e-9, f0 * 0.5))), 2);
  const maintenanceStrategy = currentFrequency < f0 * 0.4
    ? "频率已跌破四成，应立刻安排强激励并缩短激励周期"
    : inc.length
      ? "维持当前激励节奏，按半衰期的一半安排下一次回补"
      : "尚无任何激励记录，衰减将按纯半衰期推进，建议先建立激励锚点";
  return { currentFrequency, decayRate, nextIncentiveDue, halfLifeRemaining, maintenanceStrategy };
}

/* F_009 频率阈值设计 */
function f009(input) {
  const h = arr(input.history).map(x => ({
    integrity: clamp01(num(obj(x).integrity, 0.9)),
    frequency: num(obj(x).frequency),
    outcome: String(obj(x).outcome || "good")
  }));
  const sens = num(input.sensitivity, 0.5);
  const adapt = input.adaptationRate != null ? num(input.adaptationRate, 0.1) : (input.adaptationRate !== undefined ? 0.1 : 0);
  const adaptationEnabled = input.adaptationRate !== undefined && input.adaptationRate !== null;
  const good = h.filter(x => x.outcome === "good");
  const bad = h.filter(x => x.outcome === "bad");
  const act = good.length ? Math.min(...good.map(x => x.integrity)) : 0.9;
  const deep = good.length ? Math.max(...good.map(x => x.integrity)) : 0.98;
  const fr = h.map(x => x.frequency);
  const mu = fr.length ? mean(fr) : 1;
  const sd = fr.length > 1 ? std(fr) : 0.5;
  const alarmHigh = round(mu + sd * (1 + sens), 4);
  const alarmLow = round(Math.max(0, mu - sd * (1 + sens)), 4);
  // 准确率：用阈值重判历史，与真实标签比对
  let correct = 0;
  h.forEach(x => {
    const predGood = x.integrity >= act && x.frequency <= alarmHigh && x.frequency >= alarmLow;
    if ((predGood && x.outcome === "good") || (!predGood && x.outcome === "bad")) correct++;
  });
  const expectedAccuracy = round(safeDiv(correct, Math.max(1, h.length)), 4);
  const falsePositiveRate = round(bad.length ? bad.filter(x => x.integrity >= act).length / bad.length : 0, 4);
  return {
    thresholds: { activation: round(act, 4), deepDive: round(deep, 4), alarmHigh, alarmLow },
    adaptationEnabled,
    expectedAccuracy,
    falsePositiveRate
  };
}

/* F_010 频率稳态维持 */
function f010(input) {
  const target = num(input.targetFrequency, 1);
  const cur = num(input.currentFrequency, 1);
  const h = arr(input.history).map(x => num(obj(x).frequency));
  const tol = Math.abs(num(input.tolerance, Math.max(0.1, target * 0.15)));
  const deviation = round(Math.abs(cur - target), 6);
  const withinTolerance = deviation <= tol;
  const recent = h.slice(-5);
  const sd = recent.length > 1 ? std(recent) : 0;
  const adjustmentsNeeded = Math.ceil(Math.max(0, deviation - tol) / Math.max(1e-6, tol * 0.5)) + (sd > tol ? 1 : 0);
  const projectedStability = round(clamp01(1 - deviation / Math.max(1e-9, target) - sd / Math.max(1e-9, target) * 0.5), 4);
  return {
    stable: withinTolerance && sd <= tol,
    deviation, withinTolerance, adjustmentsNeeded, projectedStability
  };
}

/* F_011 频率涌现现象 */
function f011(input) {
  const acts = arr(input.lowFreqActivities).map(a => ({
    activity: nm(a, "activity"),
    frequency: num(obj(a).frequency),
    quality: clamp01(num(obj(a).quality, 0.5))
  }));
  const combined = num(input.combinedOutput);
  const expected = num(input.expectedSum);
  const factor = round(safeDiv(combined, Math.max(1e-9, expected)), 4);
  const emerged = combined > expected * 1.05;
  const emergenceFactor = round(factor - 1, 4);
  // 临界点：累计质量达到总量 50% 的位置
  const totalQ = acts.reduce((s, a) => s + a.quality * a.frequency, 0) || 1;
  let acc = 0, criticalPoint = -1;
  acts.forEach((a, i) => {
    if (criticalPoint >= 0) return;
    acc += a.quality * a.frequency;
    if (acc / totalQ >= 0.5) criticalPoint = i + 1;
  });
  const novelProperties = emerged
    ? [`低频率活动叠加后产出 ${combined} 超出线性预期 ${expected}，超线性增益 ${round((factor - 1) * 100, 1)}%`]
    : [];
  const catalysts = acts.filter(a => a.quality >= 0.7).map(a => a.activity);
  return {
    emerged, emergenceFactor, criticalPoint,
    novelProperties,
    unpredictability: round(clamp01(Math.abs(factor - 1)), 4),
    catalysts
  };
}

/* F_012 频率耦合机制 */
function f012(input) {
  const ents = arr(input.entities).map(e => ({
    id: String(obj(e).id ?? "?"),
    frequency: num(obj(e).frequency),
    sensitivity: clamp01(num(obj(e).sensitivity, 0.5))
  }));
  const M = arr(input.couplingMatrix).map(r => arr(r).map(Number));
  const n = ents.length;
  if (!n) {
    return { couplingStrength: 0, couplingType: "weak", synchronyScore: 0, diversityPreserved: 1, recommendations: ["无实体，无法计算耦合"] };
  }
  // 耦合强度：矩阵非对角均值
  let sum = 0, cnt = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i === j) continue;
    sum += Math.abs(M[i]?.[j] ?? 0); cnt++;
  }
  const couplingStrength = round(cnt ? clamp01(sum / cnt) : 0, 4);
  const couplingType = couplingStrength >= 0.7 ? "strong" : couplingStrength >= 0.35 ? "medium" : "weak";
  const fr = ents.map(e => e.frequency);
  const synchronyScore = round(clamp01(1 - safeDiv(std(fr), Math.abs(mean(fr)) + 1e-9)), 4);
  const diversityPreserved = round(clamp01(1 - couplingStrength * synchronyScore), 4);
  const recommendations = [];
  if (couplingStrength >= 0.7 && diversityPreserved < 0.4) {
    recommendations.push("强耦合已压制多样性，建议人为制造频率差以恢复探索能力");
  }
  if (couplingStrength < 0.35) recommendations.push("耦合偏弱，考虑增加共享目标或同步机制");
  if (synchronyScore < 0.5) recommendations.push("各实体频率离散度大，需先对齐基本节奏再谈耦合");
  if (!recommendations.length) recommendations.push("耦合强度与多样性处于均衡区间，维持现状");
  return { couplingStrength, couplingType, synchronyScore, diversityPreserved, recommendations };
}

/* F_013 频率谱分析 */
function f013(input) {
  const ts = arr(input.timeSeries).map(x => ({
    time: num(obj(x).time),
    count: num(obj(x).activityCount),
    quality: clamp01(num(obj(x).quality, 0.5))
  })).sort((a, b) => a.time - b.time);
  const method = String(input.method || "dft");
  const N = ts.length;
  if (N < 2) {
    return { spectrum: [], dominantFrequencies: [], periodicities: [], trend: 0 };
  }
  const x = ts.map(t => t.count);
  // 去均值
  const mu = mean(x);
  const xs = x.map(v => v - mu);
  // 朴素 DFT
  const half = Math.floor(N / 2);
  const spectrum = [];
  for (let k = 1; k <= half; k++) {
    let re = 0, im = 0;
    for (let n2 = 0; n2 < N; n2++) {
      const ang = (-2 * Math.PI * k * n2) / N;
      re += xs[n2] * Math.cos(ang);
      im += xs[n2] * Math.sin(ang);
    }
    const amp = (2 / N) * Math.sqrt(re * re + im * im);
    const phase = Math.atan2(im, re);
    spectrum.push({
      frequency: round(k / N, 6),
      amplitude: round(amp, 6),
      phase: round(phase, 6)
    });
  }
  const sorted = [...spectrum].sort((a, b) => b.amplitude - a.amplitude);
  const maxAmp = sorted[0]?.amplitude || 1e-9;
  const dominantFrequencies = sorted.filter(s => s.amplitude >= maxAmp * 0.4).slice(0, 3).map(s => s.frequency);
  const periodicities = dominantFrequencies.map(f => ({
    period: round(f > 0 ? 1 / f : 0, 4),
    confidence: round(clamp01((spectrum.find(s => s.frequency === f)?.amplitude || 0) / maxAmp), 4)
  }));
  const trend = round(ts.length >= 2 ? ols(x).slope : 0, 6);
  void method;
  return { spectrum, dominantFrequencies, periodicities, trend };
}

module.exports = {
  handlers: {
    ALG_T3_F_001: f001, ALG_T3_F_002: f002, ALG_T3_F_003: f003, ALG_T3_F_004: f004,
    ALG_T3_F_005: f005, ALG_T3_F_006: f006, ALG_T3_F_007: f007, ALG_T3_F_008: f008,
    ALG_T3_F_009: f009, ALG_T3_F_010: f010, ALG_T3_F_011: f011, ALG_T3_F_012: f012,
    ALG_T3_F_013: f013
  },
  samples: {
    ALG_T3_F_001: () => ({
      systemIntegrity: 0.94, currentFrequency: 2,
      history: [{ time: 1, integrity: 0.91, frequency: 2 }, { time: 2, integrity: 0.93, frequency: 2.2 }]
    }),
    ALG_T3_F_002: () => ({
      integrity: 0.9, gaps: [{ name: "g1" }, { name: "g2" }, { name: "g3" }],
      resources: { compute: 4, time: 6, budget: 3 }, targetIntegrity: 0.98
    }),
    ALG_T3_F_003: () => ({
      integrity: 0.99, explorationDepth: 3, domains: ["认知", "工程", "经济"], timeBudget: 8
    }),
    ALG_T3_F_004: () => ({
      currentMode: "high-frequency", currentIntegrity: 0.99, threshold: 0.98, transitionStrategy: "buffered"
    }),
    ALG_T3_F_005: () => ({
      activities: [{ time: 1, type: "分析", quality: 0.8, novelty: 0.6 }, { time: 2, type: "写作", quality: 0.7, novelty: 0.5 },
        { time: 3, type: "分析", quality: 0.75, novelty: 0.7 }, { time: 4, type: "评审", quality: 0.9, novelty: 0.4 }],
      windowSize: 4, alertThresholds: { high: 3, low: 0.2, variance: 0.3 }
    }),
    ALG_T3_F_006: () => ({ actualFrequency: 1.2, targetFrequency: 3, method: "incentive", validationPeriod: 4 }),
    ALG_T3_F_007: () => ({
      entityAFrequencies: [0.1, 0.8, 0.3, 0.1], entityBFrequencies: [0.12, 0.78, 0.28, 0.11],
      couplingHistory: [0.4, 0.55, 0.7], tolerance: 0.2
    }),
    ALG_T3_F_008: () => ({
      initialFrequency: 3, halfLifeDays: 20, elapsedDays: 35,
      incentives: [{ time: 10, type: "回顾", strength: 0.3 }, { time: 25, type: "激励", strength: 0.2 }]
    }),
    ALG_T3_F_009: () => ({
      history: [{ integrity: 0.92, frequency: 2, outcome: "good" }, { integrity: 0.97, frequency: 1, outcome: "good" },
        { integrity: 0.85, frequency: 4, outcome: "bad" }, { integrity: 0.6, frequency: 6, outcome: "bad" }],
      sensitivity: 0.5, adaptationRate: 0.1
    }),
    ALG_T3_F_010: () => ({
      targetFrequency: 2, currentFrequency: 2.1,
      history: [{ time: 1, frequency: 2.0 }, { time: 2, frequency: 2.1 }, { time: 3, frequency: 1.95 }], tolerance: 0.3
    }),
    ALG_T3_F_011: () => ({
      lowFreqActivities: [{ activity: "阅读", frequency: 0.2, quality: 0.8 }, { activity: "笔记", frequency: 0.3, quality: 0.75 }],
      combinedOutput: 12, expectedSum: 8
    }),
    ALG_T3_F_012: () => ({
      entities: [{ id: "A", frequency: 2, sensitivity: 0.6 }, { id: "B", frequency: 2.1, sensitivity: 0.5 },
        { id: "C", frequency: 3, sensitivity: 0.4 }],
      couplingMatrix: [[1, 0.8, 0.5], [0.8, 1, 0.4], [0.5, 0.4, 1]]
    }),
    ALG_T3_F_013: () => ({
      timeSeries: [{ time: 1, activityCount: 2, quality: 0.7 }, { time: 2, activityCount: 5, quality: 0.7 },
        { time: 3, activityCount: 2, quality: 0.8 }, { time: 4, activityCount: 5, quality: 0.75 },
        { time: 5, activityCount: 2, quality: 0.7 }, { time: 6, activityCount: 5, quality: 0.8 }],
      method: "dft"
    })
  }
};
