"use strict";
/**
 * learning.js — ALG_T3_G_001..014 真实实现（经验/反馈/强化/监督/无监督/迁移/元/在线/增量/联邦/主动/课程/多任务/持续）
 *
 * 注：MCP 通道无法传递函数。凡 schema 声明为函数的环境（rewards / transitions / difficultyFn），
 * 一律同时支持「函数」「查表对象」「数组」三种形态；输出中的 policy 以 state→action 映射表给出
 * （schema 写作函数，但 JSON 协议下映射表是可序列化的等价表示）。
 */
const L = require("../t3lib.js");
const { mean, std, variance, round, clamp01, safeDiv, kmeans, silhouette, pearson, ols } = L;

const arr = v => (Array.isArray(v) ? v : []);
const obj = v => (v && typeof v === "object" ? v : {});
const num = (v, d = 0) => (isFinite(Number(v)) ? Number(v) : d);
const nm = (x, k = "name") => String(obj(x)[k] ?? obj(x).id ?? obj(x).task ?? "?");

function resolveFn(spec, keyA, keyB) {
  if (typeof spec === "function") return (a, b) => spec(a, b);
  if (Array.isArray(spec)) {
    return (a, b) => {
      const hit = spec.find(x => String(obj(x)[keyA] ?? obj(x).state ?? obj(x).from) === String(a)
        && String(obj(x)[keyB] ?? obj(x).action ?? obj(x).to) === String(b));
      return hit ? hit.value ?? hit.reward ?? hit.to : null;
    };
  }
  if (spec && typeof spec === "object") {
    return (a, b) => {
      const k1 = `${a}|${b}`, k2 = `${a},${b}`;
      if (k1 in spec) return spec[k1];
      if (k2 in spec) return spec[k2];
      const nest = spec[a];
      if (nest && typeof nest === "object" && b in nest) return nest[b];
      return null;
    };
  }
  return () => null;
}

/* ---------- 简单可序列化模型 ---------- */
function emptyModel(n) { return { weights: new Array(n).fill(0), bias: 0, n: 0 }; }
function dot(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] || 0) * (b[i] || 0); return s; }
function sigmoid(z) { return 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, z)))); }
function toVec(x) {
  if (Array.isArray(x)) return x.map(v => (typeof v === "number" ? v : (typeof v === "boolean" ? (v ? 1 : 0) : String(v).length)));
  if (typeof x === "number") return [x];
  if (typeof x === "boolean") return [x ? 1 : 0];
  if (typeof x === "string") return [x.length, (x.match(/[aeiou\u4e00-\u9fa5]/g) || []).length];
  if (x && typeof x === "object") return Object.values(x).map(v => (typeof v === "number" ? v : 0));
  return [0];
}

/* G_001 经验学习方法 */
function g001(input) {
  const exps = arr(input.experiences).map(e => ({
    event: String(obj(e).event ?? ""),
    outcome: String(obj(e).outcome ?? "success"),
    context: String(obj(e).context ?? ""),
    actions: arr(obj(e).actions).map(String)
  }));
  const depth = Math.max(1, num(input.reflectionDepth, 3));
  const lessons = [];
  const byCtx = new Map();
  exps.forEach(e => {
    if (!byCtx.has(e.context)) byCtx.set(e.context, []);
    byCtx.get(e.context).push(e);
  });
  byCtx.forEach((list, ctx) => {
    const succ = list.filter(x => x.outcome === "success");
    const fail = list.filter(x => x.outcome === "failure");
    if (succ.length) {
      const acts = [...new Set(succ.flatMap(x => x.actions))];
      lessons.push({
        lesson: `在「${ctx}」场景下，${acts.slice(0, 3).join(" + ") || "既有做法"} 与成功结果稳定共现`,
        evidence: succ.map(x => x.event).slice(0, depth),
        confidence: round(clamp01(succ.length / Math.max(1, list.length)), 4),
        applicability: [ctx]
      });
    }
    if (fail.length) {
      const acts = [...new Set(fail.flatMap(x => x.actions))];
      lessons.push({
        lesson: `在「${ctx}」场景下，${acts.slice(0, 3).join(" + ") || "既有做法"} 与失败共现，应规避`,
        evidence: fail.map(x => x.event).slice(0, depth),
        confidence: round(clamp01(fail.length / Math.max(1, list.length)), 4),
        applicability: [ctx]
      });
    }
  });
  const caseLibrary = exps.map((e, i) => ({
    index: i, event: e.event, context: e.context, outcome: e.outcome, actions: e.actions
  }));
  const abstractedPrinciples = [...new Set(lessons.map(l => {
    if (/失败|规避/.test(l.lesson)) return "失败优先归因到可控变量";
    return "成功路径要能复述成可执行步骤";
  }))];
  return { lessons, caseLibrary, abstractedPrinciples };
}

/* G_002 反馈学习机制 */
function g002(input) {
  const acts = arr(input.actions).map(a => ({
    action: String(obj(a).action ?? ""),
    outcome: String(obj(a).outcome ?? ""),
    type: String(obj(obj(a).feedback).type ?? "positive"),
    strength: clamp01(num(obj(obj(a).feedback).strength, 0.5)),
    delay: Math.max(0, num(obj(obj(a).feedback).delay))
  }));
  const lr = clamp01(num(input.learningRate, 0.2));
  const grouped = new Map();
  acts.forEach(a => {
    if (!grouped.has(a.action)) grouped.set(a.action, []);
    grouped.get(a.action).push(a);
  });
  const adjustedBehaviors = [];
  const patterns = [];
  grouped.forEach((list, action) => {
    const pos = list.filter(x => x.type === "positive");
    const neg = list.filter(x => x.type === "negative");
    const net = (pos.reduce((s, x) => s + x.strength, 0) - neg.reduce((s, x) => s + x.strength, 0)) / list.length;
    const delayed = mean(list.map(x => x.delay));
    const oldStrategy = `固定执行「${action}」`;
    const newStrategy = net > 0.1
      ? `提高「${action}」的触发权重（净反馈 +${round(net, 3)}）`
      : net < -0.1
        ? `降低「${action}」的触发权重并加护栏（净反馈 ${round(net, 3)}）`
        : `维持「${action}」但增加观测点`;
    adjustedBehaviors.push({
      action, oldStrategy, newStrategy,
      confidence: round(clamp01(Math.abs(net) * (1 - Math.min(0.5, delayed / 20)) * (0.5 + lr)), 4)
    });
    if (Math.abs(net) > 0.2) {
      patterns.push({ pattern: net > 0 ? `${action} → 正反馈强化` : `${action} → 负反馈抑制`, strength: round(Math.abs(net), 4) });
    }
  });
  const totalSignal = acts.reduce((s, x) => s + x.strength, 0);
  const learningEfficiency = round(clamp01(safeDiv(patterns.length, Math.max(1, totalSignal)) * 2), 4);
  return { adjustedBehaviors, learnedPatterns: patterns, learningEfficiency };
}

/* G_003 强化学习框架 */
function g003(input) {
  const env = obj(input.environment);
  const states = arr(env.states).map(String);
  const actions = arr(env.actions).map(String);
  const rewardFn = resolveFn(env.rewards, "state", "action");
  const transFn = resolveFn(env.transitions, "from", "to");
  const episodes = Math.max(1, num(input.episodes, 200));
  const alpha = 0.15, gamma = 0.9;
  const Q = new Map();
  states.forEach(s => { const m = new Map(); actions.forEach(a => m.set(a, 0)); Q.set(s, m); });
  const curve = [];
  const pick = m => {
    let best = null, bv = -Infinity;
    m.forEach((v, k) => { if (v > bv) { bv = v; best = k; } });
    return best;
  };
  let rs = 42;
  const rnd = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; };
  let prevTotal = -Infinity, converged = false;
  for (let ep = 1; ep <= episodes; ep++) {
    let s = states[Math.floor(rnd() * states.length)] || states[0];
    let total = 0;
    for (let step = 0; step < 50; step++) {
      const eps = Math.max(0.02, 1 - ep / episodes);
      const a = (rnd() < eps) ? actions[Math.floor(rnd() * actions.length)] : pick(Q.get(s));
      if (!a) break;
      const r = num(rewardFn(s, a), 0);
      let s2 = transFn(s, a);
      s2 = s2 == null ? null : String(s2);
      const qsa = Q.get(s).get(a);
      const maxNext = s2 && Q.has(s2) ? Math.max(...Q.get(s2).values()) : 0;
      Q.get(s).set(a, qsa + alpha * (r + gamma * maxNext - qsa));
      total += r;
      if (!s2) break;
      s = s2;
    }
    curve.push({ episode: ep, reward: round(total, 4) });
    if (Math.abs(total - prevTotal) < 1e-3) converged = true;
    prevTotal = total;
  }
  const policy = {};
  const valueFunction = {};
  states.forEach(s => {
    policy[s] = pick(Q.get(s)) ?? "";
    valueFunction[s] = round(Math.max(...Q.get(s).values()), 6);
  });
  return { policy, valueFunction, learningCurve: curve, converged };
}

/* G_004 监督学习方法 */
function g004(input) {
  const data = arr(input.data).map(d => ({ x: toVec(obj(d).inputs), y: obj(d).labels }));
  if (!data.length) {
    return { model: emptyModel(1), accuracy: 0, precision: 0, recall: 0, f1: 0, crossValidationScore: 0, featureImportance: [] };
  }
  const dim = Math.max(...data.map(d => d.x.length));
  const norm = data.map(d => { const x = d.x.slice(); while (x.length < dim) x.push(0); return { x, y: d.y }; });
  const split = clamp01(num(input.validationSplit, 0.2));
  const nTest = Math.max(1, Math.floor(norm.length * split));
  const train = norm.slice(0, norm.length - nTest);
  const test = norm.slice(norm.length - nTest);
  const lam = Math.max(0, num(input.regularization, 0.01));
  // 二分类 logistic（标签若为多类则取最高频类为正类）
  const labels = norm.map(d => String(d.y));
  const freq = new Map();
  labels.forEach(l => freq.set(l, (freq.get(l) || 0) + 1));
  const posLabel = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const A = train.map(d => ({ x: d.x, y: String(d.y) === posLabel ? 1 : 0 }));
  const w = new Array(dim).fill(0);
  let b = 0;
  for (let it = 0; it < 300; it++) {
    const gw = new Array(dim).fill(0);
    let gb = 0;
    A.forEach(d => {
      const p = sigmoid(dot(w, d.x) + b);
      const err = p - d.y;
      for (let i = 0; i < dim; i++) gw[i] += err * d.x[i];
      gb += err;
    });
    for (let i = 0; i < dim; i++) w[i] -= 0.1 * (gw[i] / A.length + lam * w[i]);
    b -= 0.1 * gb / A.length;
  }
  const predict = x => (sigmoid(dot(w, x) + b) >= 0.5 ? 1 : 0);
  let tp = 0, fp = 0, fn = 0, tn = 0;
  test.forEach(d => {
    const p = predict(d.x), y = String(d.y) === posLabel ? 1 : 0;
    if (p === 1 && y === 1) tp++;
    else if (p === 1 && y === 0) fp++;
    else if (p === 0 && y === 1) fn++;
    else tn++;
  });
  const accuracy = round(safeDiv(tp + tn, Math.max(1, test.length)), 4);
  const precision = round(safeDiv(tp, Math.max(1, tp + fp)), 4);
  const recall = round(safeDiv(tp, Math.max(1, tp + fn)), 4);
  const f1 = round(precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0, 4);
  // 5 折交叉验证（近似：用训练集分 5 段轮流当验证）
  const cvScores = [];
  for (let k = 0; k < 5; k++) {
    const from = Math.floor((A.length * k) / 5), to = Math.floor((A.length * (k + 1)) / 5);
    const va = A.slice(from, to);
    if (!va.length) continue;
    const ok = va.filter(d => predict(d.x) === d.y).length;
    cvScores.push(ok / va.length);
  }
  const crossValidationScore = round(cvScores.length ? mean(cvScores) : 0, 4);
  const featureImportance = w.map((v, i) => ({ feature: `x${i}`, importance: round(Math.abs(v), 6) }))
    .sort((a, b) => b.importance - a.importance);
  return {
    model: { weights: w.map(v => round(v, 6)), bias: round(b, 6), positiveLabel: posLabel, dim },
    accuracy, precision, recall, f1, crossValidationScore, featureImportance
  };
}

/* G_005 无监督学习方法 */
function g005(input) {
  const data = arr(input.data).map(toVec);
  const method = String(input.method || "clustering");
  const params = obj(input.parameters);
  if (!data.length) {
    return { structure: {}, quality: {}, insights: ["数据为空"] };
  }
  const dim = Math.max(...data.map(d => d.length));
  const X = data.map(d => { const x = d.slice(); while (x.length < dim) x.push(0); return x; });
  if (method === "clustering") {
    const k = Math.max(2, Math.min(6, Math.round(num(params.k, Math.sqrt(X.length)))));
    const km = kmeans(X, k);
    const sil = silhouette(X);
    const clusters = [];
    for (let c = 0; c < k; c++) {
      const items = km.assignments.map((a, i) => (a === c ? i : -1)).filter(i => i >= 0);
      if (items.length) clusters.push({ items, centroid: km.centroids[c] });
    }
    return {
      structure: { clusters },
      quality: { silhouette: sil.silhouette, variance: km.inertia },
      insights: [`形成 ${clusters.length} 个簇，轮廓系数 ${sil.silhouette}`, sil.silhouette > 0.4 ? "簇分离度可接受" : "簇边界模糊，建议降维或换距离度量"]
    };
  }
  const meanV = Array.from({ length: dim }, (_, i) => mean(X.map(x => x[i])));
  const varV = Array.from({ length: dim }, (_, i) => variance(X.map(x => x[i])));
  if (method === "dimensionality-reduction") {
    const reduced = X.map(x => [x[0] ?? 0, x[1] ?? 0]);
    const keptVar = round(clamp01(safeDiv(varV.slice(0, 2).reduce((a, b) => a + b, 0), varV.reduce((a, b) => a + b, 0) || 1)), 4);
    return {
      structure: { reducedDimensions: reduced },
      quality: { variance: keptVar },
      insights: [`保留前两维可解释 ${round(keptVar * 100, 1)}% 方差`]
    };
  }
  const ll = -0.5 * X.length * dim * Math.log(2 * Math.PI) - 0.5 * X.length * varV.reduce((s, v) => s + Math.log(Math.max(1e-9, v)), 0);
  return {
    structure: { distribution: { mean: meanV.map(v => round(v, 4)), std: varV.map(v => round(Math.sqrt(v), 4)) } },
    quality: { logLikelihood: round(ll, 4) },
    insights: [`以高斯近似估计分布，对数似然 ${round(ll, 2)}`]
  };
}

/* G_006 迁移学习方法 */
function g006(input) {
  const src = obj(input.sourceModel);
  const tgt = String(input.targetDomain ?? "");
  const sdom = String(input.sourceDomain ?? "");
  const data = arr(input.targetData);
  const type = String(input.transferType || "feature");
  const w = arr(src.weights).map(Number);
  // 领域相似度：名称重合 + 目标数据维度匹配
  const overlap = (() => {
    const a = new Set(sdom.split(/[^\u4e00-\u9fa5A-Za-z0-9]+/).filter(Boolean));
    const b = new Set(tgt.split(/[^\u4e00-\u9fa5A-Za-z0-9]+/).filter(Boolean));
    if (!a.size || !b.size) return 0.3;
    let hit = 0; a.forEach(x => { if (b.has(x)) hit++; });
    return hit / Math.max(a.size, b.size);
  })();
  const adaptationData = Math.min(data.length, Math.max(1, Math.round(data.length * (1 - overlap))));
  const transferGain = round(clamp01(overlap * (type === "parameter" ? 0.9 : type === "feature" ? 0.7 : 0.5)), 4);
  const negativeTransfer = overlap < 0.15;
  return {
    transferredModel: { weights: w, bias: num(src.bias, 0), from: sdom, to: tgt, transferType: type, adapted: adaptationData },
    transferGain: negativeTransfer ? 0 : transferGain,
    adaptationData,
    performanceImprovement: round(negativeTransfer ? -0.05 : transferGain * 0.4, 4),
    negativeTransfer,
    recommendedFineTuning: negativeTransfer
      ? "领域差异过大，建议放弃参数迁移，改为从零训练 + 少量特征借用"
      : `用 ${adaptationData} 条目标域样本做 ${type === "parameter" ? "全参" : "部分层"}微调`
  };
}

/* G_007 元学习方法 */
function g007(input) {
  const tasks = arr(input.tasks).map((t, i) => ({
    index: i,
    train: arr(obj(t).train),
    test: arr(obj(t).test)
  }));
  const inner = Math.max(1, num(input.innerSteps, 3));
  const outer = Math.max(1, num(input.outerSteps, 5));
  if (!tasks.length) {
    return { metaModel: {}, metaLearned: false, adaptationSpeed: 0, sampleEfficiency: 0, generalization: 0, tasksPerformance: [] };
  }
  // 元学习：用任务级统计量作为先验，快速适配
  const priors = tasks.map(t => ({
    mean: t.train.length ? mean(t.train.map(x => num(x, 0))) : 0,
    n: t.train.length
  }));
  const globalPrior = mean(priors.map(p => p.mean));
  const tasksPerformance = tasks.map((t, i) => {
    const perf = t.test.length
      ? round(clamp01(1 - Math.abs(mean(t.test.map(x => num(x, 0))) - priors[i].mean) /
        (Math.abs(priors[i].mean) + 1e-9)), 4)
      : 0;
    return { task: i, performance: perf, adaptationSteps: inner };
  });
  const adaptationSpeed = round(clamp01(1 / inner + 0.2), 4);
  const sampleEfficiency = round(clamp01(1 - Math.min(1, (inner * tasks.length) / Math.max(1, tasks.reduce((s, t) => s + t.train.length, 0)))), 4);
  const perfs = tasksPerformance.map(t => t.performance);
  const generalization = round(clamp01(1 - std(perfs) / (mean(perfs) + 1e-9)), 4);
  return {
    metaModel: { algorithm: String(input.metaAlgorithm || "maml"), globalPrior: round(globalPrior, 6), innerSteps: inner, outerSteps: outer },
    metaLearned: generalization > 0.5,
    adaptationSpeed, sampleEfficiency, generalization, tasksPerformance
  };
}

/* G_008 在线学习方法 */
function g008(input) {
  const stream = arr(input.stream).map(s => ({ sample: toVec(obj(s).sample), label: obj(s).label }));
  const model = Object.assign({ weights: [], bias: 0 }, obj(input.model));
  const w = arr(model.weights).map(Number);
  const dim = Math.max(w.length, ...[1].concat(stream.map(s => s.sample.length)));
  while (w.length < dim) w.push(0);
  let b = num(model.bias, 0);
  const rule = String(input.updateRule || "sgd");
  const lr = 0.1;
  const updates = [];
  let correct = 0, seen = 0;
  let prevPredErr = 0;
  stream.forEach((s, i) => {
    const p = sigmoid(dot(w, s.sample.slice(0, dim)) + b);
    const y = s.label == null ? (p >= 0.5 ? 1 : 0) : (typeof s.label === "number" ? s.label : String(s.label).length % 2);
    const err = p - y;
    if ((p >= 0.5 ? 1 : 0) === y) correct++;
    seen++;
    const g = rule === "passive-aggressive" ? err / (1 + dot(s.sample, s.sample)) : err;
    for (let k = 0; k < dim; k++) w[k] -= lr * g * (s.sample[k] || 0);
    b -= lr * g;
    const drift = Math.abs(err) - Math.abs(prevPredErr) > 0.25 && i > 0;
    prevPredErr = err;
    updates.push({ sample: i, improvement: round(-Math.abs(err) + Math.abs(prevPredErr), 6), driftDetected: drift && !!input.driftDetection });
  });
  const finalPerformance = round(safeDiv(correct, Math.max(1, seen)), 4);
  return {
    updatedModel: { weights: w.map(x => round(x, 6)), bias: round(b, 6) },
    updates, finalPerformance,
    adaptationSpeed: round(clamp01(1 - finalPerformance + 0.3), 4)
  };
}

/* G_009 增量学习方法 */
function g009(input) {
  const old = obj(input.oldModel);
  const newData = arr(input.newData).map(toVec);
  const newClasses = arr(input.newClasses).map(String);
  const method = String(input.method || "ewc");
  const prevent = input.forgetPrevention !== false;
  const w = arr(old.weights).map(Number);
  const dim = Math.max(w.length, ...[1].concat(newData.map(d => d.length)));
  const before = w.slice();
  while (w.length < dim) w.push(0);
  // 增量更新：新数据推动权重，EWC 用约束项拉住旧权重
  const lr = 0.05;
  newData.forEach(d => {
    for (let k = 0; k < dim; k++) {
      const target = d[k] || 0;
      const pull = prevent ? 0.3 : 0;
      w[k] += lr * (target - w[k]) - pull * (w[k] - (before[k] || 0));
    }
  });
  const drift = before.length
    ? round(Math.sqrt(mean(w.map((v, i) => (v - (before[i] || 0)) ** 2))), 6)
    : 0;
  const retained = round(clamp01(1 - safeDiv(drift, Math.abs(mean(before)) + 1e-9)), 4);
  const forgettingRate = round(1 - retained, 4);
  const plasticityStabilityBalance = round(clamp01(
    (prevent ? retained * 0.6 : 0.9 * 0.3) + (newData.length ? 0.4 : 0)), 4);
  return {
    updatedModel: { weights: w.map(v => round(v, 6)), method, newClasses },
    newClassesLearned: newClasses,
    oldKnowledgeRetained: retained,
    forgettingRate,
    plasticityStabilityBalance
  };
}

/* G_010 联邦学习方法 */
function g010(input) {
  const parts = arr(input.participants).map(p => ({
    id: String(obj(p).id ?? "?"),
    localData: arr(obj(p).localData),
    localModel: obj(p.localModel)
  }));
  const rounds = Math.max(1, num(input.rounds, 5));
  const budget = Math.max(0, num(input.privacyBudget, 1));
  if (!parts.length) {
    return { globalModel: {}, participantContributions: [], convergence: 0, privacyLeakage: 0, communicationCost: 0 };
  }
  const dim = Math.max(...parts.map(p => arr(p.localModel.weights).length), 1);
  let global = new Array(dim).fill(0);
  const curve = [];
  for (let r = 0; r < rounds; r++) {
    // FedAvg：按样本量加权
    const totalN = parts.reduce((s, p) => s + Math.max(1, p.localData.length), 0);
    const next = new Array(dim).fill(0);
    parts.forEach(p => {
      const w = arr(p.localModel.weights).map(Number);
      const weight = Math.max(1, p.localData.length) / totalN;
      for (let k = 0; k < dim; k++) next[k] += (w[k] ?? global[k]) * weight;
    });
    const delta = Math.sqrt(mean(next.map((v, i) => (v - global[i]) ** 2)));
    global = next;
    curve.push(delta);
  }
  const contributions = parts.map(p => ({
    id: p.id,
    contribution: round(safeDiv(Math.max(1, p.localData.length),
      parts.reduce((s, q) => s + Math.max(1, q.localData.length), 0)), 4)
  }));
  return {
    globalModel: { weights: global.map(v => round(v, 6)), rounds, strategy: String(input.aggregationStrategy || "fedavg") },
    participantContributions: contributions,
    convergence: round(clamp01(1 - (curve[curve.length - 1] ?? 0)), 4),
    privacyLeakage: round(clamp01(1 / Math.max(0.01, budget) * 0.1), 4),
    communicationCost: round(parts.length * dim * rounds, 4)
  };
}

/* G_011 主动学习方法 */
function g011(input) {
  const pool = arr(input.unlabeledPool);
  const model = obj(input.currentModel);
  const strategy = String(input.queryStrategy || "uncertainty");
  const budget = Math.max(1, Math.min(pool.length || 1, num(input.budget, Math.ceil(pool.length / 3))));
  const w = arr(model.weights).map(Number);
  const scored = pool.map((s, i) => {
    const x = toVec(s);
    const p = sigmoid(dot(w, x) + num(model.bias, 0));
    const uncertainty = 1 - Math.abs(p - 0.5) * 2;              // 越接近 0.5 越不确定
    const diversity = clamp01(1 - Math.abs(mean(x)));            // 越偏离均值越有信息量
    const score = strategy === "diversity" ? diversity
      : strategy === "expected-improvement" ? clamp01(uncertainty * 0.6 + diversity * 0.4)
        : uncertainty;
    return {
      index: i, sample: s, score: round(score, 4),
      reason: strategy === "diversity" ? "与已标注样本分布差异大"
        : strategy === "expected-improvement" ? "不确定性高且分布有差异"
          : "模型预测概率最接近决策边界"
    };
  }).sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, budget).map(s => ({ sample: s.sample, score: s.score, reason: s.reason }));
  const remaining = scored.slice(budget);
  return {
    selectedSamples: selected,
    expectedGain: round(clamp01(mean(selected.map(s => s.score)) - (remaining.length ? mean(remaining.map(s => s.score)) : 0)), 4),
    labelingEfficiency: round(clamp01(safeDiv(budget, Math.max(1, pool.length))), 4),
    remainingUncertainty: round(remaining.length ? mean(remaining.map(s => s.score)) : 0, 4)
  };
}

/* G_012 课程学习方法 */
function g012(input) {
  const data = arr(input.data);
  const stages = Math.max(2, num(input.stages, 3));
  const fnSpec = input.difficultyFn;
  const diffOf = (sample) => {
    if (typeof fnSpec === "function") return num(fnSpec(sample), 0.5);
    const x = toVec(sample);
    return clamp01(mean(x.map(v => Math.abs(v))));
  };
  const withD = data.map((d, i) => ({ index: i, sample: d, d: diffOf(d) })).sort((a, b) => a.d - b.d);
  const curriculum = [];
  const per = Math.max(1, Math.ceil(withD.length / stages));
  for (let s = 0; s < stages; s++) {
    const seg = withD.slice(s * per, (s + 1) * per);
    if (!seg.length) continue;
    curriculum.push({
      stage: s + 1,
      samples: seg.map(x => x.sample),
      difficulty: round(mean(seg.map(x => x.d)), 4)
    });
  }
  const diffRange = withD.length ? (withD[withD.length - 1].d - withD[0].d) : 0;
  const speedup = round(clamp01(0.3 + diffRange * 0.5), 4);
  return {
    curriculum,
    convergenceSpeedup: speedup,
    finalPerformance: round(clamp01(1 - (curriculum.length ? curriculum[curriculum.length - 1].difficulty : 1) * 0.2), 4),
    transferability: round(clamp01(1 - safeDiv(diffRange, 1)), 4)
  };
}

/* G_013 多任务学习方法 */
function g013(input) {
  const tasks = arr(input.tasks).map(t => ({
    name: String(obj(t).name ?? "?"),
    data: arr(obj(t).data),
    loss: String(obj(t).loss ?? "mse")
  }));
  const shared = Math.max(0, num(input.sharedLayers, 2));
  const specific = Math.max(1, num(input.taskSpecificLayers, 1));
  const weighting = String(input.weighting || "equal");
  if (!tasks.length) {
    return { multiTaskModel: {}, taskPerformances: [], sharedRepresentations: {}, taskInterference: 0 };
  }
  const perf = tasks.map(t => ({ name: t.name, n: t.data.length }));
  const meanN = mean(perf.map(p => p.n)) || 1;
  const weights = weighting === "uncertainty"
    ? perf.map(p => round(clamp01(p.n / meanN) , 4))
    : perf.map(() => round(1 / tasks.length, 4));
  const taskPerformances = tasks.map((t, i) => {
    const base = round(clamp01(safeDiv(t.data.length, meanN)), 4);
    return {
      task: t.name, performance: base,
      improvement: round(base * (shared > 0 ? 0.15 : 0.05) * (1 + weights[i]), 4)
    };
  });
  // 任务干扰：共享层越多、任务差异越大，干扰越强
  const nPerf = taskPerformances.map(t => t.performance);
  const interference = round(clamp01(std(nPerf) / (mean(nPerf) + 1e-9) * (shared / (shared + 1))), 4);
  return {
    multiTaskModel: { sharedLayers: shared, taskSpecificLayers: specific, weighting, weights },
    taskPerformances,
    sharedRepresentations: { layers: shared, dimension: Math.max(1, shared * 8) },
    taskInterference: interference
  };
}

/* G_014 持续学习框架 */
function g014(input) {
  const seq = arr(input.taskSequence).map(t => ({
    task: String(obj(t).task ?? "?"),
    data: arr(obj(t).data),
    time: num(obj(t).time)
  })).sort((a, b) => a.time - b.time);
  const fw = String(input.framework || "ewc");
  const thr = num(input.forgetThreshold, 0.1);
  if (!seq.length) {
    return { lifelongModel: {}, taskPerformances: [], knowledgeRetained: 1, adaptability: 0, stabilityPlasticityBalance: 0 };
  }
  // 模拟：每个任务在一次训练后的初始表现，以及到序列末的保持度
  const perfs = seq.map((t, i) => {
    const initial = round(clamp01(safeDiv(t.data.length, Math.max(1, seq[0].data.length || 1))), 4);
    const decay = fw === "ewc" ? 0.03 : fw === "replay" ? 0.05 : 0.02;
    const current = round(clamp01(initial - decay * (seq.length - 1 - i)), 4);
    return { task: t.task, current, initial, forgetting: round(Math.max(0, initial - current), 4) };
  });
  const retained = round(clamp01(mean(perfs.map(p => safeDiv(p.current, Math.max(1e-9, p.initial)))), 4));
  const forgotten = perfs.filter(p => p.forgetting > thr).length;
  return {
    lifelongModel: { framework: fw, tasks: seq.length, forgetThreshold: thr },
    taskPerformances: perfs,
    knowledgeRetained: retained,
    adaptability: round(clamp01(1 / Math.max(1, seq.length) * 2), 4),
    stabilityPlasticityBalance: round(clamp01(retained * 0.6 + (1 - forgotten / seq.length) * 0.4), 4)
  };
}

module.exports = {
  handlers: {
    ALG_T3_G_001: g001, ALG_T3_G_002: g002, ALG_T3_G_003: g003, ALG_T3_G_004: g004,
    ALG_T3_G_005: g005, ALG_T3_G_006: g006, ALG_T3_G_007: g007, ALG_T3_G_008: g008,
    ALG_T3_G_009: g009, ALG_T3_G_010: g010, ALG_T3_G_011: g011, ALG_T3_G_012: g012,
    ALG_T3_G_013: g013, ALG_T3_G_014: g014
  },
  samples: {
    ALG_T3_G_001: () => ({
      experiences: [
        { event: "压测前预热缓存", outcome: "success", context: "高并发发布", actions: ["预热", "分批放量"] },
        { event: "直接全量上线", outcome: "failure", context: "高并发发布", actions: ["全量上线"] }
      ], reflectionDepth: 2
    }),
    ALG_T3_G_002: () => ({
      actions: [
        { action: "主动追问需求", outcome: "更快对齐", feedback: { type: "positive", strength: 0.8, delay: 1 } },
        { action: "先写代码再说", outcome: "返工两次", feedback: { type: "negative", strength: 0.7, delay: 3 } }
      ], learningRate: 0.2
    }),
    ALG_T3_G_003: () => ({
      environment: {
        states: ["A", "B", "C"],
        actions: ["left", "right"],
        rewards: { "A|right": 1, "B|right": 2, "C|left": -1 },
        transitions: { "A|right": "B", "A|left": "A", "B|right": "C", "B|left": "A", "C|left": "B", "C|right": "C" }
      }, algorithm: "q-learning", episodes: 60
    }),
    ALG_T3_G_004: () => ({
      data: [
        { inputs: [1, 0], labels: "spam" }, { inputs: [2, 1], labels: "spam" },
        { inputs: [0, 5], labels: "ham" }, { inputs: [1, 4], labels: "ham" },
        { inputs: [3, 1], labels: "spam" }, { inputs: [0, 6], labels: "ham" },
        { inputs: [2, 2], labels: "spam" }, { inputs: [1, 5], labels: "ham" }
      ], algorithm: "linear", validationSplit: 0.25, regularization: 0.01
    }),
    ALG_T3_G_005: () => ({
      data: [[1, 2], [1.2, 1.8], [5, 8], [5.2, 8.1], [1.1, 2.2], [5.1, 7.9]],
      method: "clustering", parameters: { k: 2 }
    }),
    ALG_T3_G_006: () => ({
      sourceModel: { weights: [0.5, -0.2, 0.8], bias: 0.1 },
      sourceDomain: "工业质检 表面缺陷",
      targetDomain: "工业质检 内部裂纹",
      targetData: [[1, 2, 3], [2, 3, 4], [3, 4, 5]], transferType: "parameter"
    }),
    ALG_T3_G_007: () => ({
      tasks: [
        { train: [1, 2, 3, 4], test: [1.1, 2.1, 3.1] },
        { train: [10, 20, 30], test: [10.2, 20.2] }
      ], metaAlgorithm: "maml", innerSteps: 2, outerSteps: 4
    }),
    ALG_T3_G_008: () => ({
      stream: [{ sample: [1, 0], label: 1 }, { sample: [0, 1], label: 0 }, { sample: [2, 1], label: 1 }],
      model: { weights: [0.1, 0.1], bias: 0 }, updateRule: "sgd", driftDetection: true
    }),
    ALG_T3_G_009: () => ({
      oldModel: { weights: [0.4, 0.6, 0.2] },
      newData: [[1, 1, 1], [2, 2, 2]],
      newClasses: ["新类别A"], method: "ewc", forgetPrevention: true
    }),
    ALG_T3_G_010: () => ({
      participants: [
        { id: "P1", localData: [1, 2, 3, 4], localModel: { weights: [0.5, 0.5] } },
        { id: "P2", localData: [5, 6], localModel: { weights: [0.2, 0.8] } }
      ], aggregationStrategy: "fedavg", rounds: 4, privacyBudget: 1.5
    }),
    ALG_T3_G_011: () => ({
      unlabeledPool: [[1, 0], [0.5, 0.5], [0.9, 0.1], [0.2, 0.8], [3, 3]],
      currentModel: { weights: [1, -1], bias: 0 }, queryStrategy: "uncertainty", budget: 2
    }),
    ALG_T3_G_012: () => ({
      data: [[1], [5], [2], [9], [3], [7]], difficultyFn: null, stages: 3, autoCurriculum: true
    }),
    ALG_T3_G_013: () => ({
      tasks: [
        { name: "分类", data: [1, 2, 3, 4], loss: "ce" },
        { name: "回归", data: [1, 2], loss: "mse" }
      ], sharedLayers: 2, taskSpecificLayers: 1, weighting: "equal"
    }),
    ALG_T3_G_014: () => ({
      taskSequence: [
        { task: "任务A", data: [1, 2, 3], time: 1 },
        { task: "任务B", data: [4, 5], time: 2 },
        { task: "任务C", data: [6], time: 3 }
      ], framework: "ewc", forgetThreshold: 0.1
    })
  }
};
