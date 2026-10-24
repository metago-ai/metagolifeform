"use strict";
/**
 * negentropy.js — ALG_T3_N_001..014 真实实现（负熵 / 有序度 / 社会责任 / 熵流）
 * 熵一律用 Shannon 定义：H = -Σ p·log2(p)
 */
const L = require("../t3lib.js");
const { mean, std, round, clamp01, safeDiv, entropy, maxEntropy, ols } = L;

const arr = v => (Array.isArray(v) ? v : []);
const obj = v => (v && typeof v === "object" ? v : {});
const num = (v, d = 0) => (isFinite(Number(v)) ? Number(v) : d);

/* 把 {key: count} 转成概率并算 Shannon 熵 */
function shannon(dist, base = 2) {
  const vs = Object.values(obj(dist)).map(x => Math.max(0, Number(x) || 0));
  const tot = vs.reduce((a, b) => a + b, 0);
  if (tot <= 0) return 0;
  let h = 0;
  vs.forEach(v => { if (v > 0) { const p = v / tot; h -= p * Math.log(p) / Math.log(base); } });
  return h;
}

/* N_001 负熵监测机制 */
function n001(input) {
  const s = obj(input.systemState);
  const hist = arr(input.history).map(h => ({ time: num(obj(h).time), entropy: num(obj(h).entropy) })).sort((a, b) => a.time - b.time);
  const thr = num(input.threshold, 0.6);
  // 三个维度各自 0..1，越高越有序；熵取"离完全有序的距离"
  const structure = clamp01(num(s.structure));
  const func = clamp01(num(s.function));
  const info = clamp01(num(s.information));
  const order = (structure + func + info) / 3;
  const currentEntropy = round(1 - order, 6);
  let entropyTrend = "stable";
  if (hist.length >= 2) {
    const { slope } = ols(hist.map(h => h.entropy));
    entropyTrend = slope > 0.01 ? "increasing" : slope < -0.01 ? "decreasing" : "stable";
  }
  // 社会贡献：有序度提升 → 正贡献
  const socialContribution = round(order - 0.5, 4);
  const alertLevel = currentEntropy >= 0.6 ? "red" : currentEntropy >= 0.4 ? "yellow" : "green";
  const recommendation = alertLevel === "red"
    ? "熵已过高，优先做结构化（补索引/分层/去重）而不是继续新增功能"
    : alertLevel === "yellow"
      ? "熵在警戒区，建议对最弱维度做一次定向梳理"
      : "有序度良好，维持现有节奏";
  return { currentEntropy, entropyTrend, socialContribution, alertLevel, recommendation };
}

/* N_002 熵增检测方法 */
function n002(input) {
  const cur = obj(input.current), prev = obj(input.previous);
  const dt = Math.max(1e-9, num(input.timeDelta, 1));
  const thr = num(input.threshold, 0.1);
  const dims = [
    ["information", num(cur.information), num(prev.information)],
    ["structure", num(cur.structure), num(prev.structure)],
    ["function", num(cur.function), num(prev.function)],
    ["diversity", num(cur.diversity, 0), num(prev.diversity, 0)]
  ];
  // 各维度值越高代表越无序
  const contributions = dims.map(([type, c, p]) => ({
    type, contribution: round((c - p) / dt, 6)
  }));
  const entropyIncrease = round(contributions.reduce((s, x) => s + x.contribution, 0), 6);
  const entropyRate = round(entropyIncrease / dt, 6);
  const alertLevel = entropyRate > thr * 2 ? "red" : entropyRate > thr ? "yellow" : "green";
  return { entropyIncrease, entropyRate, sources: contributions, alertLevel };
}

/* N_003 熵减策略库 */
const STRATEGIES = [
  { strategy: "信息分层与索引", target: "information", rate: 0.35, cost: 2 },
  { strategy: "模块解耦", target: "structure", rate: 0.3, cost: 4 },
  { strategy: "目标对齐", target: "function", rate: 0.25, cost: 3 },
  { strategy: "去重与归一", target: "diversity", rate: 0.2, cost: 1 },
  { strategy: "建立唯一真相源", target: "structure", rate: 0.4, cost: 5 }
];
function n003(input) {
  const srcs = arr(input.entropySources).map(s => ({ type: String(obj(s).type ?? ""), contribution: num(obj(s).contribution) }));
  const available = arr(input.availableStrategies).map(String);
  const pool = available.length ? STRATEGIES.filter(s => available.some(a => s.strategy.includes(a) || a.includes(s.target))) : STRATEGIES;
  const total = srcs.reduce((s, x) => s + Math.abs(x.contribution), 0) || 1;
  const recommendedStrategies = [];
  srcs.forEach(src => {
    pool.filter(p => p.target === src.type).forEach(p => {
      const expectedReduction = round(p.rate * Math.abs(src.contribution), 4);
      recommendedStrategies.push({
        strategy: p.strategy, target: src.type, expectedReduction, cost: p.cost,
        priority: round(safeDiv(expectedReduction, p.cost), 4)
      });
    });
  });
  recommendedStrategies.sort((a, b) => b.priority - a.priority);
  const top = recommendedStrategies.slice(0, 3);
  const totalReduction = round(top.reduce((s, x) => s + x.expectedReduction, 0), 4);
  const implementationPlan = top.length
    ? `按性价比依次执行：${top.map((t, i) => `${i + 1}) ${t.strategy}（预计降熵 ${t.expectedReduction}，成本 ${t.cost}）`).join("；")}，合计可降 ${round(totalReduction / total * 100, 1)}% 熵`
    : "当前没有可匹配的熵源，暂不需要干预";
  return { recommendedStrategies: top, totalReduction, implementationPlan };
}

/* N_004 系统有序度量化 */
function n004(input) {
  const s = obj(obj(input.system).structure);
  const f = obj(obj(input.system).function);
  const i = obj(obj(input.system).information);
  const layers = clamp01(num(s.layers, 0) / 6);
  const modularity = clamp01(num(s.modularity));
  const couplingInv = clamp01(1 - num(s.coupling));     // 耦合越低越有序
  const structureOrder = round((layers + modularity + couplingInv) / 3, 4);
  const functionOrder = round((clamp01(num(f.alignment)) + clamp01(num(f.coverage))) / 2, 4);
  const informationOrder = round((clamp01(num(i.structured)) + clamp01(num(i.categorized)) + clamp01(num(i.indexed))) / 3, 4);
  const orderScore = round((structureOrder * 0.35 + functionOrder * 0.35 + informationOrder * 0.3), 4);
  const disorder = round(1 - orderScore, 4);
  const healthGrade = orderScore >= 0.85 ? "A" : orderScore >= 0.7 ? "B" : orderScore >= 0.55 ? "C" : "D";
  return { orderScore, structureOrder, functionOrder, informationOrder, disorder, healthGrade };
}

/* N_005 熵变计算方法 */
function n005(input) {
  const A = obj(obj(input.stateA).distribution);
  const B = obj(obj(input.stateB).distribution);
  const dims = arr(input.dimensions).map(String).filter(Boolean);
  const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
  const useKeys = dims.length ? dims.filter(k => keys.has(k)) : [...keys];
  const hA = shannon(A), hB = shannon(B);
  const entropyChange = round(hB - hA, 6);
  const byDimension = useKeys.map(k => {
    const a = num(A[k]), b = num(B[k]);
    const totA = Object.values(A).reduce((x, y) => x + (Number(y) || 0), 0) || 1;
    const totB = Object.values(B).reduce((x, y) => x + (Number(y) || 0), 0) || 1;
    return { dimension: k, change: round(b / totB - a / totA, 6) };
  });
  const absoluteChange = round(Math.abs(entropyChange), 6);
  const relativeChange = round(safeDiv(entropyChange, hA || 1), 4);
  const interpretation = entropyChange > 0.05 ? "熵增：分布趋于分散，有序度下降"
    : entropyChange < -0.05 ? "熵减：分布趋于集中，有序度上升"
      : "熵基本不变，结构稳定";
  return { entropyChange, absoluteChange, relativeChange, byDimension, interpretation };
}

/* N_006 社会责任评估 */
function n006(input) {
  const s = obj(input.system);
  const pos = arr(s.contributions).map(c => ({ type: String(obj(c).type ?? ""), amount: num(obj(c).amount), positivity: clamp01(num(obj(c).positivity, 1)) }));
  const neg = arr(s.negativeImpacts).map(c => ({ type: String(obj(c).type ?? ""), amount: num(obj(c).amount) }));
  const baseline = num(input.societyBaseline, 0);
  const posNet = pos.reduce((t, c) => t + c.amount * c.positivity, 0);
  const negNet = neg.reduce((t, c) => t + c.amount, 0);
  const netContribution = round(posNet - negNet - baseline, 4);
  const grade = netContribution > posNet * 0.5 ? "A" : netContribution > 0 ? "B" : netContribution > -posNet * 0.2 ? "C" : "D";
  return {
    netContribution,
    positiveContributions: pos.map(c => ({ type: c.type, amount: c.amount })),
    negativeImpacts: neg,
    socialValue: netContribution > 0,
    grade
  };
}

/* N_007 熵流分析方法 */
function n007(input) {
  const s = obj(input.system);
  const ins = arr(s.inputs).map(x => num(obj(x).entropy));
  const outs = arr(s.outputs).map(x => num(obj(x).entropy));
  const gen = num(s.internalGeneration);
  const inputEntropy = round(ins.reduce((a, b) => a + b, 0), 4);
  const outputEntropy = round(outs.reduce((a, b) => a + b, 0), 4);
  const netFlow = round(outputEntropy - inputEntropy - gen, 4);
  const balance = netFlow > 0.01 ? "surplus" : netFlow < -0.01 ? "deficit" : "equilibrium";
  const sustainability = round(clamp01(1 - Math.max(0, netFlow) / Math.max(1e-9, inputEntropy + gen)), 4);
  return { netFlow, inputEntropy, outputEntropy, internalGeneration: gen, balance, sustainability };
}

/* N_008 熵平衡策略 */
function n008(input) {
  const c = obj(input.current), t = obj(input.target);
  const gen = Math.max(0, num(c.generation));
  const inp = Math.max(0, num(c.input));
  const out = Math.max(0, num(c.output));
  const maxGen = Math.max(0, num(t.maxGeneration, gen));
  const minIn = Math.max(0, num(t.minInput, 0));
  const minOut = Math.max(0, num(t.minOutput, 0));
  const generationRate = round(gen, 4), inputRate = round(inp, 4), outputRate = round(out, 4);
  const deficit = round(Math.max(0, gen - (out - inp)), 4);
  const adjustments = [];
  if (gen > maxGen) adjustments.push({ type: "抑制生成", action: `把熵生成从 ${gen} 压到 ${maxGen}`, impact: round(gen - maxGen, 4) });
  if ((out - inp) < minOut) adjustments.push({ type: "提高排出", action: `把净排出从 ${round(out - inp, 3)} 提到 ${minOut}`, impact: round(minOut - (out - inp), 4) });
  if (inp < minIn) adjustments.push({ type: "增加负熵输入", action: `把输入从 ${inp} 提到 ${minIn}`, impact: round(minIn - inp, 4) });
  const balanced = gen <= maxGen && (out - inp) >= minOut && inp >= minIn;
  return { balanced, generationRate, inputRate, outputRate, deficit, adjustments };
}

/* N_009 熵阈值设计 */
function n009(input) {
  const h = arr(input.history).map(x => ({ entropy: num(obj(x).entropy), outcome: String(obj(x).outcome || "good") }));
  const margin = Math.max(0, num(input.safetyMargin, 0.1));
  const good = h.filter(x => x.outcome === "good").map(x => x.entropy);
  const bad = h.filter(x => x.outcome === "bad").map(x => x.entropy);
  const alert = good.length ? Math.max(...good) : 0.5;
  const critical = bad.length ? Math.min(...bad) : alert + margin * 2;
  const intervention = round((alert + critical) / 2, 4);
  const thresholds = {
    alert: round(alert, 4),
    intervention,
    critical: round(critical, 4)
  };
  let correct = 0;
  h.forEach(x => {
    const pred = x.entropy <= alert ? "good" : "bad";
    if (pred === x.outcome) correct++;
  });
  return {
    thresholds,
    confidence: round(clamp01(h.length / 20), 4),
    adaptiveAdjustment: h.length >= 10,
    expectedAccuracy: round(safeDiv(correct, Math.max(1, h.length)), 4)
  };
}

/* N_010 稳态监测机制 */
function n010(input) {
  const h = arr(input.entropyHistory).map(x => ({ time: num(obj(x).time), entropy: num(obj(x).entropy) })).sort((a, b) => a.time - b.time);
  const win = Math.max(2, num(input.windowSize, Math.min(8, h.length || 2)));
  const th = Object.assign({ mean: 0.5, variance: 0.1, trend: 0.05 }, obj(input.thresholds));
  const recent = h.slice(-win);
  const vals = recent.map(x => x.entropy);
  const m = round(vals.length ? mean(vals) : 0, 4);
  const v = round(vals.length > 1 ? std(vals) ** 2 : 0, 6);
  const slope = round(vals.length > 1 ? ols(vals).slope : 0, 6);
  const anomalies = [];
  vals.forEach((x, i) => {
    if (x > th.mean + Math.sqrt(th.variance) * 2) anomalies.push({ time: recent[i].time, type: "突增", severity: "high" });
  });
  if (Math.abs(slope) > th.trend) anomalies.push({ time: recent[recent.length - 1]?.time ?? 0, type: "趋势漂移", severity: "medium" });
  const stable = m <= th.mean && v <= th.variance && Math.abs(slope) <= th.trend;
  const healthScore = round(clamp01(1 - m / Math.max(1e-9, th.mean) * 0.6 - v / Math.max(1e-9, th.variance) * 0.4), 4);
  return { stable, mean: m, variance: v, trend: slope, anomalies, healthScore };
}

/* N_011 熵溯源方法 */
function n011(input) {
  const inc = num(input.entropyIncrease);
  const sys = obj(input.system);
  const comps = arr(sys.components).map(c => String(obj(c).name ?? obj(c).id ?? "?"));
  const ops = arr(sys.operations).map(o => String(obj(o).name ?? o));
  const tl = arr(sys.timeline).map(e => ({ time: num(obj(e).time), event: String(obj(e).event ?? "") }));
  const sources = [];
  // 归因：把熵增均摊到 timeline 事件上，组件/操作按出现顺序配对（可解释、可复算）
  const n = Math.max(1, tl.length);
  tl.forEach((e, i) => {
    const contribution = round(inc / n, 6);
    sources.push({
      component: comps[i % Math.max(1, comps.length)] || "未登记组件",
      operation: ops[i % Math.max(1, ops.length)] || "未登记操作",
      time: e.time,
      contribution,
      percentage: round(100 / n, 2)
    });
  });
  sources.sort((a, b) => b.contribution - a.contribution);
  const primarySource = sources.length ? sources[0].component : "无法归因";
  const attributionChain = tl.map((e, i) =>
    `t=${e.time} 事件「${e.event}」经 ${ops[i % Math.max(1, ops.length)] || "未登记操作"} 产生熵 ${round(inc / n, 6)}`);
  return { sources, primarySource, attributionChain };
}

/* N_012 熵审计方法 */
function n012(input) {
  const p = obj(input.auditPeriod);
  const s = obj(input.system);
  const expected = num(input.expectedEntropy, NaN);
  const structure = clamp01(num(s.structure, 0.5));
  const func = clamp01(num(s.function, 0.5));
  const info = clamp01(num(s.information, 0.5));
  const entropyState = round(1 - (structure + func + info) / 3, 6);
  const generationRate = round(Math.max(0, entropyState) * 0.5, 4);
  const eliminationRate = round((1 - entropyState) * 0.3, 4);
  const balance = round(eliminationRate - generationRate, 4);
  const issues = [];
  if (isFinite(expected) && Math.abs(entropyState - expected) > 0.15) {
    issues.push({ type: "偏离预期", severity: "high", description: `实测熵 ${entropyState} 与预期 ${expected} 相差 ${round(entropyState - expected, 4)}` });
  }
  if (balance < 0) issues.push({ type: "排出不足", severity: "medium", description: `生成 ${generationRate} > 消除 ${eliminationRate}，系统在累积熵` });
  if (!issues.length) issues.push({ type: "无异常", severity: "low", description: "熵收支平衡" });
  const auditScore = round(clamp01(1 - issues.filter(i => i.severity === "high").length * 0.4 - issues.filter(i => i.severity === "medium").length * 0.2), 4);
  return {
    auditReport: {
      period: `${p.start ?? 0} → ${p.end ?? 0}`,
      entropyState, generationRate, eliminationRate, balance
    },
    issues,
    recommendations: issues.filter(i => i.severity !== "low").map(i => i.type === "偏离预期" ? "复核数据口径，确认预期值来源" : "提高负熵输入（结构化/索引/去重）"),
    auditScore
  };
}

/* N_013 熵优化策略 */
function n013(input) {
  const s = obj(input.system);
  const c = Object.assign({ resources: 1, time: 1, cost: 1 }, obj(input.constraints));
  const o = Object.assign({ minimizeGeneration: 0.5, maximizeInput: 0.25, maximizeOutput: 0.25 }, obj(input.objectives));
  const entropy = 1 - (clamp01(num(s.structure, 0.5)) + clamp01(num(s.function, 0.5)) + clamp01(num(s.information, 0.5))) / 3;
  const cands = [
    { target: "生成端", action: "压缩重复内容与无效分支", rate: 0.35 * o.minimizeGeneration, cost: 2 },
    { target: "输入端", action: "增加结构化负熵输入", rate: 0.3 * o.maximizeInput, cost: 3 },
    { target: "输出端", action: "提高产物复用率与可检索性", rate: 0.3 * o.maximizeOutput, cost: 2.5 }
  ];
  const budget = c.resources + c.time + c.cost;
  const optimizations = cands.map(x => {
    const expectedReduction = round(x.rate * entropy, 4);
    const cost = round(x.cost * (1 + 1 / Math.max(1, budget)), 4);
    return { target: x.target, action: x.action, expectedReduction, cost, roi: round(safeDiv(expectedReduction, cost), 4), priority: 0 };
  }).sort((a, b) => b.roi - a.roi).map((x, i) => ({ ...x, priority: i + 1 }));
  const totalReduction = round(optimizations.reduce((t, x) => t + x.expectedReduction, 0), 4);
  const totalCost = round(optimizations.reduce((t, x) => t + x.cost, 0), 4);
  return { optimizations, totalReduction, totalCost, netBenefit: round(totalReduction - totalCost * 0.1, 4) };
}

/* N_014 熵进化机制 */
function n014(input) {
  const h = arr(input.history).map(x => ({
    stage: String(obj(x).stage ?? ""), entropy: num(obj(x).entropy), order: clamp01(num(obj(x).order)), time: num(obj(x).time)
  })).sort((a, b) => a.time - b.time);
  const input_ = Math.max(0, num(input.negativeEntropyInput));
  const cur = String(input.currentStage || (h.length ? h[h.length - 1].stage : "maintenance"));
  const order = h.length ? clamp01(mean(h.map(x => x.order))) : 0.5;
  const evolutionStage = order >= 0.85 ? "phase-transition" : order >= 0.6 ? "optimization" : "maintenance";
  const stageProgress = round(clamp01((order - (evolutionStage === "maintenance" ? 0 : evolutionStage === "optimization" ? 0.6 : 0.85)) /
    Math.max(1e-9, evolutionStage === "maintenance" ? 0.6 : evolutionStage === "optimization" ? 0.25 : 0.15)), 4);
  const nextStageRequirements = {
    negativeEntropy: round(Math.max(0, (evolutionStage === "maintenance" ? 0.6 : evolutionStage === "optimization" ? 0.85 : 1) - order) * 10, 4),
    resources: Math.ceil(input_ > 0 ? 3 / input_ : 6),
    time: round(Math.max(1, h.length * 0.5), 2)
  };
  const evolutionRate = round(clamp01(input_ * 0.2 + (h.length >= 2 ? (h[h.length - 1].order - h[0].order) : 0) * 2), 4);
  void cur;
  return { evolutionStage, stageProgress, nextStageRequirements, evolutionRate };
}

module.exports = {
  handlers: {
    ALG_T3_N_001: n001, ALG_T3_N_002: n002, ALG_T3_N_003: n003, ALG_T3_N_004: n004,
    ALG_T3_N_005: n005, ALG_T3_N_006: n006, ALG_T3_N_007: n007, ALG_T3_N_008: n008,
    ALG_T3_N_009: n009, ALG_T3_N_010: n010, ALG_T3_N_011: n011, ALG_T3_N_012: n012,
    ALG_T3_N_013: n013, ALG_T3_N_014: n014
  },
  samples: {
    ALG_T3_N_001: () => ({
      systemState: { structure: 0.8, function: 0.7, information: 0.6 },
      history: [{ time: 1, entropy: 0.35 }, { time: 2, entropy: 0.32 }, { time: 3, entropy: 0.3 }], threshold: 0.6
    }),
    ALG_T3_N_002: () => ({
      current: { information: 0.6, structure: 0.5, function: 0.4, diversity: 0.7 },
      previous: { information: 0.4, structure: 0.5, function: 0.35, diversity: 0.6 },
      timeDelta: 2, threshold: 0.05
    }),
    ALG_T3_N_003: () => ({
      entropySources: [{ type: "information", contribution: 0.4 }, { type: "structure", contribution: 0.2 }],
      systemState: { structure: 0.5, function: 0.6, information: 0.4 }, availableStrategies: []
    }),
    ALG_T3_N_004: () => ({
      system: {
        structure: { layers: 4, modularity: 0.7, coupling: 0.3 },
        function: { alignment: 0.8, coverage: 0.7 },
        information: { structured: 0.7, categorized: 0.6, indexed: 0.5 }
      }
    }),
    ALG_T3_N_005: () => ({
      stateA: { distribution: { a: 10, b: 10, c: 10 } },
      stateB: { distribution: { a: 27, b: 2, c: 1 } }
    }),
    ALG_T3_N_006: () => ({
      system: {
        contributions: [{ type: "效率提升", amount: 40, positivity: 0.9 }, { type: "就业", amount: 10, positivity: 0.8 }],
        negativeImpacts: [{ type: "算力能耗", amount: 8 }]
      }, societyBaseline: 5
    }),
    ALG_T3_N_007: () => ({
      system: {
        inputs: [{ type: "人力", entropy: 2 }, { type: "数据", entropy: 1 }],
        outputs: [{ type: "产品", entropy: 1 }], internalGeneration: 3
      }
    }),
    ALG_T3_N_008: () => ({
      current: { generation: 5, input: 2, output: 4 }, target: { maxGeneration: 3, minInput: 3, minOutput: 2 }
    }),
    ALG_T3_N_009: () => ({
      history: [{ time: 1, entropy: 0.3, outcome: "good" }, { time: 2, entropy: 0.35, outcome: "good" },
        { time: 3, entropy: 0.8, outcome: "bad" }, { time: 4, entropy: 0.9, outcome: "bad" }], safetyMargin: 0.1
    }),
    ALG_T3_N_010: () => ({
      entropyHistory: [{ time: 1, entropy: 0.3 }, { time: 2, entropy: 0.32 }, { time: 3, entropy: 0.31 }],
      windowSize: 3, thresholds: { mean: 0.5, variance: 0.1, trend: 0.05 }
    }),
    ALG_T3_N_011: () => ({
      entropyIncrease: 0.6,
      system: {
        components: [{ name: "采集器" }, { name: "转换器" }, { name: "存储" }],
        operations: [{ name: "抓取" }, { name: "解析" }, { name: "写入" }],
        timeline: [{ time: 1, event: "批量抓取" }, { time: 2, event: "格式混乱" }, { time: 3, event: "重复写入" }]
      }
    }),
    ALG_T3_N_012: () => ({
      auditPeriod: { start: 1, end: 30 }, system: { structure: 0.6, function: 0.5, information: 0.4 }, expectedEntropy: 0.3
    }),
    ALG_T3_N_013: () => ({
      system: { structure: 0.5, function: 0.5, information: 0.4 },
      constraints: { resources: 3, time: 2, cost: 4 },
      objectives: { minimizeGeneration: 0.5, maximizeInput: 0.3, maximizeOutput: 0.2 }
    }),
    ALG_T3_N_014: () => ({
      history: [{ stage: "maintenance", entropy: 0.5, order: 0.5, time: 1 },
        { stage: "optimization", entropy: 0.4, order: 0.65, time: 2 }],
      currentStage: "optimization", negativeEntropyInput: 2
    })
  }
};
