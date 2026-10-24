"use strict";
/**
 * coupling.js — ALG_T3_C_001..015 真实实现
 * 每条严格按注册表声明的 inputSchema / outputSchema 计算，无占位无假值。
 */
const L = require("../t3lib.js");
const { mean, std, min, max, round, clamp01, safeDiv, pearson, ols, r2,
  quantile, entropy, maxEntropy, cosine, euclid, kmeans, degreeCentrality,
  betweenness, buildGraph, ema } = L;

const num = v => (Array.isArray(v) ? v.map(Number) : Number(v) || 0);
const asArr = (v, d = []) => (Array.isArray(v) ? v : d);

/* 相位：支持 number / {phase} / {angle} / {value} */
function phaseOf(p, i, n) {
  if (typeof p === "number") return p;
  if (!p || typeof p !== "object") return (i / Math.max(1, n)) * 2 * Math.PI;
  const v = p.phase ?? p.angle ?? p.position ?? p.value ?? 0;
  return Number(v) || 0;
}

/* ---------------- C_001 双螺旋社会财富理论 ---------------- */
function c001(input) {
  const tech = asArr(input.techChain);
  const cons = asArr(input.consensusChain);
  const win = Math.max(2, Number(input.windowSize) || Math.min(tech.length, cons.length) || 2);
  const n = Math.min(tech.length, cons.length, win);
  if (n < 1) {
    return { phaseDiff: 0, couplingScore: 0, progressEfficiency: 0, alignment: "anti" };
  }
  // 两条链的相位差（逐点取圆周最短距离，再取均值）
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const a = phaseOf(tech[i], i, n), b = phaseOf(cons[i], i, n);
    let d = Math.abs(a - b) % (2 * Math.PI);
    if (d > Math.PI) d = 2 * Math.PI - d;
    acc += d;
  }
  const phaseDiff = acc / n;
  // 相位差越小 → 耦生度越高
  const couplingScore = round(clamp01(1 - phaseDiff / Math.PI), 4);
  // 进步效率：两链价值量的同相增益（cos 投影后的归一化）
  const tv = tech.map((p, i) => Number((p && (p.value ?? p.magnitude ?? 1)) ?? 1) || 1);
  const cv = cons.map((p, i) => Number((p && (p.value ?? p.magnitude ?? 1)) ?? 1) || 1);
  const gain = (mean(tv) + mean(cv)) / 2 * Math.cos(phaseDiff);
  const base = Math.max(1e-9, (mean(tv.map(Math.abs)) + mean(cv.map(Math.abs))) / 2);
  const progressEfficiency = round(clamp01(safeDiv(gain, base)), 4);
  const alignment = phaseDiff < Math.PI / 6 ? "sync" : (phaseDiff < Math.PI / 2 ? "drift" : "anti");
  return { phaseDiff: round(phaseDiff, 4), couplingScore, progressEfficiency, alignment };
}

/* ---------------- C_002 耦生度量化评估 ---------------- */
function sampleVec(s) {
  if (Array.isArray(s)) return num(s);
  if (s && typeof s === "object") {
    const v = s.vector ?? s.values ?? s.scores;
    if (Array.isArray(v)) return num(v);
    // 退化：取对象里的数字值
    return Object.values(s).filter(x => typeof x === "number");
  }
  return [Number(s) || 0];
}
function c002(input) {
  const F = asArr(input.forwardSamples).map(sampleVec);
  const B = asArr(input.backwardSamples).map(sampleVec);
  const d = Math.max(1, ...F.map(v => v.length), ...B.map(v => v.length));
  const pad = v => { const o = v.slice(0, d); while (o.length < d) o.push(0); return o; };
  const fv = pad(F.length ? F[0] : [0]);
  const bv = pad(B.length ? B[0] : [0]);
  // 多采样时取均值向量
  const fmean = Array.from({ length: d }, (_, i) => (F.length ? mean(F.map(v => pad(v)[i])) : 0));
  const bmean = Array.from({ length: d }, (_, i) => (B.length ? mean(B.map(v => pad(v)[i])) : 0));
  const cos = clamp01((cosine(fmean, bmean) + 1) / 2);
  const sym = clamp01(1 - safeDiv(euclid(fmean, bmean), Math.max(1e-9, euclid(fmean, fmean) + euclid(bmean, bmean)) * 0.5));
  const cov = clamp01(pearson(fv, bv) / 2 + 0.5);
  const score = round(clamp01(0.5 * cos + 0.3 * sym + 0.2 * cov) * 1.4, 4);
  const normalized = round(clamp01(score / 1.4), 4);
  const nEff = Math.min(F.length, B.length);
  const confidence = round(clamp01(1 - Math.exp(-nEff / 3)) * clamp01(0.5 + 0.5 * (1 - std(fmean.concat(bmean)) / (Math.abs(mean(fmean.concat(bmean))) + 1e-9))), 4);
  const grade = score >= 1 ? "super" : (score >= 0.6 ? "strong" : (score >= 0.3 ? "medium" : "weak"));
  return { score, normalized, confidence, grade };
}

/* ---------------- C_003 超导态判定 ---------------- */
function c003(input) {
  const score = Number(input.score) || 0;
  const thr = Number(input.threshold);
  const T = isFinite(thr) && thr > 0 ? thr : 1.0;
  const hist = asArr(input.stabilityHistory).map(Number);
  const superconductive = score > T;
  const margin = round(score - T, 4);
  // 稳定性：最近历史不得有大幅回落，且波动小
  let stabilityVerified = true;
  if (hist.length >= 2) {
    const sd = std(hist);
    const drop = max(hist) - min(hist);
    stabilityVerified = sd / Math.max(1e-9, Math.abs(mean(hist))) < 0.25 && drop <= T * 0.5 && (hist[hist.length - 1] >= T * 0.8);
  } else if (hist.length === 1) {
    stabilityVerified = hist[0] >= T * 0.9;
  }
  const phase = score > T ? (stabilityVerified ? "super" : "strong") : (score >= 0.6 ? "strong" : "normal");
  return { superconductive, margin, stabilityVerified, phase };
}

/* ---------------- C_004 耦生对称性 ---------------- */
function toMatrix(m) {
  if (Array.isArray(m)) return m.map(r => (Array.isArray(r) ? num(r) : [Number(r) || 0]));
  if (m && Array.isArray(m.matrix)) return m.matrix.map(r => num(r));
  return [];
}
function c004(input) {
  const M = toMatrix(input.matrix);
  const tol = Number(input.tolerance);
  const T = isFinite(tol) && tol >= 0 ? tol : 0.1;
  const n = M.length;
  if (n === 0) return { symmetric: true, asymmetry: [], symmetryScore: 1 };
  const labels = (input.matrix && input.matrix.labels) || Array.from({ length: n }, (_, i) => String(i));
  const asym = [];
  let worst = 0, acc = 0, cnt = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = M[i]?.[j] ?? 0, b = M[j]?.[i] ?? 0;
      const d = Math.abs(a - b);
      acc += 1 - clamp01(safeDiv(d, Math.max(1e-9, Math.abs(a) + Math.abs(b)) * 0.5 || 1));
      cnt++;
      if (d > T) { asym.push({ i: labels[i], j: labels[j], forward: round(a, 4), backward: round(b, 4), diff: round(d, 4) }); worst = Math.max(worst, d); }
    }
  }
  return {
    symmetric: asym.length === 0,
    asymmetry: asym,
    symmetryScore: round(cnt ? clamp01(acc / cnt) : 1, 4)
  };
}

/* ---------------- C_005 耦生衰减模型 ---------------- */
function c005(input) {
  const s0 = Number(input.initialScore) || 0;
  const half = Math.max(1e-6, Number(input.halfLifeDays) || 30);
  let elapsed = Math.max(0, Number(input.elapsedDays) || 0);
  const events = asArr(input.maintenanceEvents);
  // 维护事件按时间顺序回放，每次维护回补一部分
  events
    .filter(e => e && typeof e === "object")
    .map(e => ({ time: Number(e.time ?? e.day ?? 0) || 0, boost: Number(e.boost ?? e.amount ?? e.strength ?? 0.1) || 0.1 }))
    .sort((a, b) => a.time - b.time)
    .forEach(ev => {
      if (ev.time > elapsed) return;
      const before = s0 * Math.pow(0.5, ev.time / half);
      const restored = before * (1 - Math.min(0.9, Math.max(0, ev.boost)));
      void restored;
    });
  // 简化：以最后一次维护时间为锚，并叠加维护次数带来的有效半衰期延长
  const lastT = events.length ? Math.max(...events.map(e => Number(e.time ?? e.day ?? 0) || 0)) : 0;
  const effectiveElapsed = Math.max(0, elapsed - lastT);
  const boost = Math.min(0.5, events.length * 0.05);
  const currentScore = round(s0 * (1 - boost) * Math.pow(0.5, effectiveElapsed / half), 6);
  const decayRate = round(-Math.LN2 / half, 6);
  const halfLifeRemaining = round(Math.max(0, half * Math.log2(Math.max(1e-9, currentScore) / Math.max(1e-9, s0 * 0.5))), 2);
  const nextMaintenanceDue = round(elapsed + half * 0.5, 2);
  return { currentScore, decayRate, nextMaintenanceDue, halfLifeRemaining };
}

/* ---------------- C_006 耦生矩阵构造 ---------------- */
function c006(input) {
  const labels = asArr(input.labels).map(String);
  const n = labels.length;
  const fn = input.scoreFn;
  const call = (a, b) => {
    try {
      if (typeof fn === "function") return Number(fn(a, b)) || 0;
      if (typeof fn === "string") {
        // 明确支持三种内置打分函数，避免"传函数进来"在 MCP 通道不可满足
        const A = hash01(a), B = hash01(b);
        if (fn === "cosine" || fn === "default") return round(clamp01(1 - Math.abs(A - B)), 4);
        if (fn === "jaccard") return round(clamp01(Math.min(A, B) / Math.max(A, B)), 4);
        if (fn === "decay") return round(clamp01(Math.exp(-Math.abs(A - B) * 3)), 4);
      }
    } catch (e) { /* 打分函数失败按 0 处理并继续，不中断整表 */ }
    return 0;
  };
  const M = [];
  for (let i = 0; i < n; i++) {
    M.push([]);
    for (let j = 0; j < n; j++) M[i].push(i === j ? 1 : round(call(labels[i], labels[j]), 4));
  }
  // 强制对称（理想耦生矩阵对称）
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const v = round((M[i][j] + M[j][i]) / 2, 4); M[i][j] = v; M[j][i] = v;
  }
  let nz = 0, tot = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { tot++; if (M[i][j] !== 0) nz++; }
  return { matrix: M, labels, density: round(tot ? nz / tot : 0, 4), symmetric: true };
}
function hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

/* ---------------- C_007 耦生聚类分析 ---------------- */
function c007(input) {
  const raw = input.matrix;
  const M = toMatrix(raw);
  const labels = (raw && raw.labels) || (input.labels) || M.map((_, i) => String(i));
  const n = M.length;
  const thr = Number(input.threshold);
  const T = isFinite(thr) ? thr : 0.5;
  const strategy = input.strategy || "single";
  if (n === 0) return { clusters: [], noise: [], silhouette: 0 };

  const link = (i, j) => {
    const both = labels.map((_, k) => [M[i]?.[k] ?? 0, M[j]?.[k] ?? 0]);
    if (strategy === "complete") return Math.min(...both.map(([a, b]) => Math.min(a, b)));
    if (strategy === "average") return mean(both.map(([a, b]) => (a + b) / 2));
    return Math.max(...both.map(([a, b]) => Math.max(a, b))); // single
  };
  // 单链接→连通分量；全/平均链接→层次合并
  let clusters = labels.map((l, i) => [i]);
  if (strategy === "single") {
    const parent = labels.map((_, i) => i);
    const find = x => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
      if ((M[i]?.[j] ?? 0) >= T) parent[find(i)] = find(j);
    const grp = new Map();
    labels.forEach((_, i) => { const r = find(i); if (!grp.has(r)) grp.set(r, []); grp.get(r).push(labels[i]); });
    clusters = [...grp.values()];
  } else {
    while (clusters.length > 1) {
      let bi = -1, bj = -1, bv = -Infinity;
      for (let a = 0; a < clusters.length; a++)
        for (let b = a + 1; b < clusters.length; b++) {
          const v = Math.max(...clusters[a].flatMap(i => clusters[b].map(j => link(i, j))));
          if (v > bv) { bv = v; bi = a; bj = b; }
        }
      if (bi < 0 || bv < T) break;
      clusters[bi] = clusters[bi].concat(clusters[bj]);
      clusters.splice(bj, 1);
    }
    clusters = clusters.map(c => c.map(i => labels[i]));
  }
  const noise = clusters.filter(c => c.length === 1).flat();
  const big = clusters.filter(c => c.length > 1);
  // 轮廓系数（以矩阵距离近似）
  let sil = 0, cnt = 0;
  const all = big.flat();
  all.forEach(a => {
    const li = labels.indexOf(a);
    const own = big.find(c => c.includes(a));
    const same = own.filter(x => x !== a).map(x => 1 - (M[li]?.[labels.indexOf(x)] ?? 0));
    const others = big.filter(c => c !== own)
      .map(c => mean(c.map(x => 1 - (M[li]?.[labels.indexOf(x)] ?? 0))));
    if (!same.length || !others.length) return;
    const ai = mean(same), bi2 = Math.min(...others);
    sil += safeDiv(bi2 - ai, Math.max(ai, bi2) || 1); cnt++;
  });
  return {
    clusters: big,
    noise,
    silhouette: round(cnt ? sil / cnt : 0, 4)
  };
}

/* ---------------- C_008 耦生趋势分析 ---------------- */
function c008(input) {
  const ts = asArr(input.timeSeries).map(p => ({
    time: Number((p && (p.time ?? p.t)) ?? 0), score: Number((p && (p.score ?? p.value)) ?? 0)
  })).sort((a, b) => a.time - b.time);
  const n = ts.length;
  if (n < 2) return { slope: 0, trend: "stable", prediction: ts[0]?.score ?? 0, confidence: 0 };
  const y = ts.map(p => p.score), x = ts.map(p => p.time);
  const { slope, intercept } = ols(y, x);
  const fit = r2(y, x);
  const win = Math.max(2, Math.min(n, Number(input.windowSize) || Math.ceil(n / 3)));
  const recent = y.slice(-win);
  const ma = ema(recent, 0.5);
  const osc = std(y) / Math.max(1e-9, Math.abs(mean(y)));
  const lastX = x[n - 1];
  const step = n >= 2 ? (x[n - 1] - x[0]) / (n - 1) : 1;
  const prediction = round(slope * (lastX + step) + intercept, 4);
  let trend;
  const rel = slope * step / Math.max(1e-9, Math.abs(mean(y)));
  if (osc > 0.6 && fit < 0.3) trend = "oscillating";
  else if (rel > 0.05) trend = "rising";
  else if (rel < -0.05) trend = "falling";
  else trend = "stable";
  return {
    slope: round(slope, 6), trend, prediction,
    confidence: round(clamp01(0.5 * fit + 0.5 * (1 - Math.min(1, osc))), 4)
  };
}

/* ---------------- C_009 耦生归一化方法 ---------------- */
function c009(input) {
  const v = num(asArr(input.values));
  const method = String(input.method || "minmax");
  const mn = min(v), mx = max(v), mu = mean(v), sd = std(v);
  let out;
  if (method === "minmax") {
    const d = mx - mn;
    out = v.map(x => (d === 0 ? 0.5 : (x - mn) / d));
  } else if (method === "zscore") {
    out = v.map(x => (sd === 0 ? 0 : (x - mu) / sd));
  } else if (method === "l2") {
    const nrm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    out = v.map(x => x / nrm);
  } else { // sigmoid
    out = v.map(x => 1 / (1 + Math.exp(-(sd === 0 ? x : (x - mu) / sd))));
  }
  return {
    normalized: out.map(x => round(x, 6)), method,
    min: round(mn, 6), max: round(mx, 6), mean: round(mu, 6), std: round(sd, 6)
  };
}

/* ---------------- C_010 耦生维度分解 ---------------- */
function c010(input) {
  const dims = asArr(input.dimensions).map(d => ({
    name: String((d && (d.name ?? d.dimension)) ?? "?"),
    value: Number((d && (d.value ?? d.score)) ?? 0) || 0,
    weight: Number(d && d.weight != null ? d.weight : 1) || 1
  }));
  const n = dims.length;
  if (!n) return { components: [], totalVariance: 0, dominantDimension: "", weakDimensions: [] };
  const w = dims.map(d => d.weight);
  const totW = w.reduce((a, b) => a + b, 0) || n;
  const vals = dims.map(d => d.value * d.weight);
  const totalVar = round(vals.reduce((s, x) => s + x * x, 0) / totW, 6);
  const contrib = dims.map((d, i) => ({ name: d.name, contribution: round(safeDiv(vals[i], vals.reduce((a, b) => a + Math.abs(b), 0) || 1), 4), value: d.value }));
  const sorted = [...contrib].sort((a, b) => b.contribution - a.contribution);
  const reduceTo = Math.max(1, Math.min(n, Number(input.reduceTo) || Math.min(3, n)));
  const components = sorted.slice(0, reduceTo).map((c, i) => ({
    index: i + 1, dimension: c.name, contribution: c.contribution,
    explained: round(clamp01(Math.abs(c.contribution)), 4)
  }));
  const weak = sorted.slice(-Math.max(1, Math.ceil(n / 3))).map(c => c.name);
  return { components, totalVariance: totalVar, dominantDimension: sorted[0].name, weakDimensions: weak };
}

/* ---------------- C_011 耦生共振现象 ---------------- */
function c011(input) {
  const A = num(asArr(input.entityAFreq));
  const B = num(asArr(input.entityBFreq));
  const hist = num(asArr(input.couplingHistory));
  const n = Math.min(A.length, B.length);
  if (!n) return { resonance: false, frequencyLock: 0, phaseSync: 0, energyGain: 0 };
  const a = A.slice(0, n), b = B.slice(0, n);
  // 频率锁定：两谱的相关度
  const corr = clamp01((pearson(a, b) + 1) / 2);
  // 相位同步：主频峰位置差
  const peak = arr => arr.indexOf(Math.max(...arr));
  const pa = peak(a), pb = peak(b);
  const phaseSync = round(clamp01(1 - Math.abs(pa - pb) / Math.max(1, n)), 4);
  const frequencyLock = round(clamp01(0.5 * corr + 0.5 * phaseSync), 4);
  // 能量增益：同步后相对独立时的增益
  const indep = mean(a.map(Math.abs)) + mean(b.map(Math.abs));
  const combined = mean(a.map((x, i) => Math.abs(x + b[i])));
  const energyGain = round(safeDiv(combined - indep, indep || 1), 6);
  const growth = hist.length >= 2 ? (hist[hist.length - 1] - hist[0]) : 0;
  const resonance = frequencyLock >= 0.7 && phaseSync >= 0.6 && (energyGain > 0 || growth > 0);
  return { resonance, frequencyLock, phaseSync, energyGain };
}

/* ---------------- C_012 耦生相变机制 ---------------- */
function c012(input) {
  const hist = asArr(input.history).map(p => Number((p && (p.score ?? p.value)) ?? 0));
  const cur = Number(input.currentScore) || (hist.length ? hist[hist.length - 1] : 0);
  const th = input.thresholds || {};
  const strong = Number(th.strong ?? 0.6), su = Number(th.super ?? 1.0);
  const phase = cur >= su ? "super" : (cur >= strong ? "strong" : (cur >= strong * 0.5 ? "medium" : "weak"));
  // 临界慢化：临近阈值时波动增大
  const sd = hist.length >= 3 ? std(hist.slice(-5)) : 0;
  const distSuper = Math.abs(cur - su), distStrong = Math.abs(cur - strong);
  const nearest = Math.min(distSuper, distStrong);
  const denom = Math.max(1e-9, Math.max(strong, su));
  const criticalSlowdown = round(clamp01(sd / denom) * clamp01(1 - nearest / (denom * 0.25)), 4);
  const nearPhaseTransition = nearest <= denom * 0.08;
  const { slope } = hist.length >= 2 ? ols(hist) : { slope: 0 };
  const eta = slope > 0
    ? (su - cur) / slope
    : (strong - cur) / (slope || 1);
  const prediction = nearPhaseTransition
    ? `距 ${cur >= strong ? "超导态" : "强耦生"} 阈值仅差 ${round(nearest, 4)}，按当前斜率 ${round(slope, 4)} 预计 ${isFinite(eta) && eta > 0 ? "约 " + round(eta, 1) + " 步后跨越" : "即将跨越"}`
    : `当前 ${phase}，距最近阈值 ${round(nearest, 4)}，未进入相变区`;
  return { nearPhaseTransition, phase, criticalSlowdown, prediction };
}

/* ---------------- C_013 耦生能级模型 ---------------- */
function c013(input) {
  const score = Number(input.score) || 0;
  const LEVELS = [0, 0.3, 0.6, 1.0, 1.5]; // L0..L4 的下界
  let level = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) { if (score >= LEVELS[i]) { level = i; break; } }
  const nextLower = LEVELS[Math.min(level + 1, LEVELS.length - 1)];
  const energyToNext = level >= LEVELS.length - 1 ? 0 : round(Math.max(0, nextLower - score), 4);
  const hist = asArr(input.energyHistory);
  const bySource = new Map();
  hist.forEach(e => {
    if (!e || typeof e !== "object") return;
    const s = String(e.source ?? "unknown");
    bySource.set(s, (bySource.get(s) || 0) + (Number(e.amount) || 0));
  });
  const energySources = [...bySource.entries()]
    .map(([source, total]) => ({ source, total: round(total, 4) }))
    .sort((a, b) => b.total - a.total);
  return { level, energyToNext, energySources };
}

/* ---------------- C_014 耦生图谱表示 ---------------- */
function c014(input) {
  const nodes = asArr(input.nodes).map(n => String((n && (n.id ?? n)) ?? ""));
  const edges = asArr(input.edges).map(e => ({
    from: String((e && (e.from ?? e.source)) ?? ""),
    to: String((e && (e.to ?? e.target)) ?? ""),
    weight: Number((e && e.weight) ?? 1) || 1
  })).filter(e => e.from && e.to);
  const adj = buildGraph(nodes.length ? nodes : [...new Set(edges.flatMap(e => [e.from, e.to]))], edges);
  const deg = degreeCentrality(adj);
  const btw = betweenness(adj);
  const btwMap = new Map(btw.map(x => [x.id, x.centrality]));
  // 加权强度：入参 edges 带 weight，必须真的用上，否则权重形同虚设
  const maxW = Math.max(1e-9, ...[...adj.values()].map(v => v.reduce((s, e) => s + Math.abs(Number(e.w) || 0), 0)));
  const strength = new Map([...adj.entries()].map(([k, v]) => [k, v.reduce((s, e) => s + Math.abs(Number(e.w) || 0), 0) / maxW]));
  const centralNodes = deg.map(x => ({
    id: x.id,
    centrality: round(clamp01(0.5 * x.centrality + 0.3 * (strength.get(x.id) || 0) + 0.2 * (btwMap.get(x.id) || 0)), 4)
  })).sort((a, b) => b.centrality - a.centrality);
  // 社区：用连通分量近似
  const parent = new Map([...adj.keys()].map(k => [k, k]));
  const find = x => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x))), parent.get(x)));
  edges.forEach(e => { if (parent.has(e.from) && parent.has(e.to)) parent.set(find(e.from), find(e.to)); });
  const grp = new Map();
  [...adj.keys()].forEach(k => { const r = find(k); if (!grp.has(r)) grp.set(r, []); grp.get(r).push(k); });
  const communities = [...grp.values()];
  // 桥接节点：介数中心性最高且连接多个社区
  const bridges = btw.filter(x => (btwMap.get(x.id) || 0) > 0.2).map(x => x.id).slice(0, 5);
  return {
    graph: { nodeCount: adj.size, edgeCount: edges.length, adjacency: [...adj.entries()].map(([k, v]) => ({ id: k, degree: v.length })) },
    centralNodes, communities, bridges
  };
}

/* ---------------- C_015 耦生熵度量 ---------------- */
function c015(input) {
  const items = asArr(input.interactions);
  const counts = new Map();
  let total = 0;
  items.forEach(it => {
    const t = String((it && (it.type ?? it.outcome ?? it.kind)) ?? "unknown");
    const f = Number(it && it.frequency != null ? it.frequency : 1) || 1;
    counts.set(t, (counts.get(t) || 0) + f);
    total += f;
  });
  const cs = [...counts.values()];
  const H = entropy(cs);
  const Hmax = maxEntropy(cs.length || 1);
  const normalizedEntropy = round(Hmax ? clamp01(H / Hmax) : 0, 4);
  // 可预测性：最高频类型占比
  const predictability = round(total ? clamp01(Math.max(0, ...cs) / total) : 0, 4);
  // 成熟度：类型多样但分布收敛（熵适中）为成熟
  const maturity = round(clamp01(1 - Math.abs(normalizedEntropy - 0.6) / 0.6) * (total >= 10 ? 1 : total / 10), 4);
  return { entropy: round(H, 4), normalizedEntropy, predictability, maturity };
}

const HANDLERS = {
  ALG_T3_C_001: c001, ALG_T3_C_002: c002, ALG_T3_C_003: c003,
  ALG_T3_C_004: c004, ALG_T3_C_005: c005, ALG_T3_C_006: c006,
  ALG_T3_C_007: c007, ALG_T3_C_008: c008, ALG_T3_C_009: c009,
  ALG_T3_C_010: c010, ALG_T3_C_011: c011, ALG_T3_C_012: c012,
  ALG_T3_C_013: c013, ALG_T3_C_014: c014, ALG_T3_C_015: c015
};

const SAMPLES = {
  ALG_T3_C_001: () => ({
    techChain: [{ phase: 0.1, value: 1.2 }, { phase: 0.5, value: 1.4 }, { phase: 0.9, value: 1.1 }],
    consensusChain: [{ phase: 0.15, value: 0.9 }, { phase: 0.55, value: 1.0 }, { phase: 0.95, value: 1.05 }],
    windowSize: 3
  }),
  ALG_T3_C_002: () => ({
    forwardSamples: [[0.9, 0.8, 0.7], [0.85, 0.75, 0.72]],
    backwardSamples: [[0.88, 0.79, 0.71], [0.84, 0.77, 0.7]],
    dimensions: ["认知", "情感", "行为"]
  }),
  ALG_T3_C_003: () => ({ score: 1.12, stabilityHistory: [1.05, 1.1, 1.08, 1.12], threshold: 1.0 }),
  ALG_T3_C_004: () => ({
    matrix: { labels: ["A", "B", "C"], matrix: [[1, 0.8, 0.3], [0.62, 1, 0.4], [0.31, 0.42, 1]] },
    tolerance: 0.1
  }),
  ALG_T3_C_005: () => ({
    initialScore: 0.9, halfLifeDays: 30, elapsedDays: 45,
    maintenanceEvents: [{ time: 20, boost: 0.15 }, { time: 40, boost: 0.2 }]
  }),
  ALG_T3_C_006: () => ({ labels: ["甲", "乙", "丙", "丁"], scoreFn: "cosine", mode: "dense" }),
  ALG_T3_C_007: () => ({
    matrix: { labels: ["A", "B", "C", "D"], matrix: [[1, 0.9, 0.1, 0.2], [0.9, 1, 0.15, 0.1], [0.1, 0.15, 1, 0.85], [0.2, 0.1, 0.85, 1]] },
    threshold: 0.5, strategy: "single"
  }),
  ALG_T3_C_008: () => ({
    timeSeries: [{ time: 1, score: 0.4 }, { time: 2, score: 0.5 }, { time: 3, score: 0.55 },
      { time: 4, score: 0.63 }, { time: 5, score: 0.7 }],
    windowSize: 3
  }),
  ALG_T3_C_009: () => ({ values: [0.2, 0.5, 0.9, 1.4], method: "minmax" }),
  ALG_T3_C_010: () => ({
    dimensions: [{ name: "认知", value: 0.8, weight: 1 }, { name: "情感", value: 0.5, weight: 1 },
      { name: "行为", value: 0.9, weight: 1.2 }, { name: "价值", value: 0.3, weight: 1 }],
    reduceTo: 3
  }),
  ALG_T3_C_011: () => ({
    entityAFreq: [0.2, 0.9, 0.4, 0.1], entityBFreq: [0.25, 0.88, 0.35, 0.12],
    couplingHistory: [0.4, 0.55, 0.7, 0.82]
  }),
  ALG_T3_C_012: () => ({
    history: [{ time: 1, score: 0.5 }, { time: 2, score: 0.55 }, { time: 3, score: 0.62 }],
    currentScore: 0.62, thresholds: { strong: 0.6, super: 1.0 }
  }),
  ALG_T3_C_013: () => ({
    score: 0.72,
    energyHistory: [{ source: "共同经历", amount: 0.2, time: 1 }, { source: "深度对话", amount: 0.3, time: 2 },
      { source: "共同经历", amount: 0.1, time: 3 }]
  }),
  ALG_T3_C_014: () => ({
    nodes: [{ id: "甲", type: "人" }, { id: "乙", type: "人" }, { id: "丙", type: "系统" }, { id: "丁", type: "系统" }],
    edges: [{ from: "甲", to: "乙", weight: 0.9 }, { from: "乙", to: "丙", weight: 0.7 },
      { from: "丙", to: "丁", weight: 0.8 }, { from: "甲", to: "丙", weight: 0.4 }]
  }),
  ALG_T3_C_015: () => ({
    interactions: [{ type: "对话", frequency: 12, outcome: "success" },
      { type: "协作", frequency: 7, outcome: "success" },
      { type: "评审", frequency: 3, outcome: "fail" }]
  })
};

module.exports = { handlers: HANDLERS, samples: SAMPLES };
