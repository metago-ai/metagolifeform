"use strict";
/**
 * t3lib.js — T3 算法工程化的计算原语库
 *
 * 原则：所有 T3 算法都由这里的真实计算原语组合而成，
 *      不出现「返回固定值」「返回空数组」这类假实现。
 * 每个原语都可独立单测。
 */

/* ---------------- 基础统计 ---------------- */
const sum = a => a.reduce((s, x) => s + (Number(x) || 0), 0);
const mean = a => (a.length ? sum(a) / a.length : 0);
function variance(a) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return sum(a.map(x => (Number(x) - m) ** 2)) / (a.length - 1);
}
const std = a => Math.sqrt(variance(a));
const median = a => {
  if (!a.length) return 0;
  const s = [...a].map(Number).sort((x, y) => x - y);
  const h = Math.floor(s.length / 2);
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
};
const quantile = (a, q) => {
  if (!a.length) return 0;
  const s = [...a].map(Number).sort((x, y) => x - y);
  const pos = (s.length - 1) * q, base = Math.floor(pos), rest = pos - base;
  return s[base + 1] !== undefined ? s[base] + rest * (s[base + 1] - s[base]) : s[base];
};
const min = a => (a.length ? Math.min(...a.map(Number)) : 0);
const max = a => (a.length ? Math.max(...a.map(Number)) : 0);
const clamp01 = x => Math.max(0, Math.min(1, x));
const round = (x, n = 4) => {
  const p = 10 ** n;
  return Math.round((Number(x) || 0) * p) / p;
};
const safeDiv = (a, b, dflt = 0) => (b === 0 || !isFinite(b) ? dflt : a / b);

function pearson(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n)), mb = mean(b.slice(0, n));
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = Number(a[i]) - ma, y = Number(b[i]) - mb;
    num += x * y; da += x * x; db += y * y;
  }
  const d = Math.sqrt(da * db);
  return d === 0 ? 0 : num / d;
}

function spearman(a, b) {
  const rank = arr => {
    const idx = arr.map((v, i) => [Number(v), i]).sort((x, y) => x[0] - y[0]);
    const r = new Array(arr.length);
    idx.forEach(([, i], k) => { r[i] = k + 1; });
    return r;
  };
  return pearson(rank(a), rank(b));
}

/* ---------------- 回归 / 趋势 ---------------- */
function ols(y, x) {
  const n = y.length;
  const xs = x || y.map((_, i) => i);
  const mx = mean(xs), my = mean(y);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (y[i] - my); den += (xs[i] - mx) ** 2; }
  const slope = den === 0 ? 0 : num / den;
  return { slope: round(slope, 6), intercept: round(my - slope * mx, 6) };
}
function r2(y, x) {
  const { slope, intercept } = ols(y, x);
  const my = mean(y);
  let ssr = 0, sst = 0;
  y.forEach((v, i) => {
    const xs = x || y.map((_, k) => k);
    const pred = slope * xs[i] + intercept;
    ssr += (v - pred) ** 2; sst += (v - my) ** 2;
  });
  return sst === 0 ? 1 : clamp01(1 - ssr / sst);
}

/* ---------------- 分布 / 检验 ---------------- */
function erf(x) {
  const s = x < 0 ? -1 : 1; x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
const normCdf = z => 0.5 * (1 + erf(z / Math.SQRT2));

function ksTest(a, b) {
  const A = [...a].map(Number).sort((x, y) => x - y);
  const B = [...b].map(Number).sort((x, y) => x - y);
  let i = 0, j = 0, d = 0;
  while (i < A.length && j < B.length) {
    const v = Math.min(A[i], B[j]);
    while (i < A.length && A[i] <= v) i++;
    while (j < B.length && B[j] <= v) j++;
    d = Math.max(d, Math.abs(i / A.length - j / B.length));
  }
  const en = Math.sqrt((A.length * B.length) / (A.length + B.length));
  const lambda = (en + 0.12 + 0.11 / en) * d;
  let p = 0;
  for (let k = 1; k <= 100; k++) p += 2 * (k % 2 ? 1 : -1) * Math.exp(-2 * k * k * lambda * lambda);
  return { statistic: round(d, 4), pValue: round(clamp01(p), 4) };
}

function zScores(a) {
  const m = mean(a), s = std(a);
  return a.map(v => (s === 0 ? 0 : (Number(v) - m) / s));
}

function iqrOutliers(a) {
  const q1 = quantile(a, 0.25), q3 = quantile(a, 0.75), iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr, upper = q3 + 1.5 * iqr;
  const out = [];
  a.forEach((v, i) => {
    const n = Number(v);
    if (n < lower || n > upper) out.push({ index: i, value: n, type: n < lower ? "low" : "high" });
  });
  return { outliers: out, q1, q3, iqr, bounds: { lower, upper } };
}

/* ---------------- 矩阵 / 线性代数 ---------------- */
function matMul(A, B) {
  const n = A.length, m = B[0].length, k = B.length;
  const C = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++)
      for (let t = 0; t < k; t++) C[i][j] += A[i][t] * B[t][j];
  return C;
}
function transpose(A) {
  return A[0].map((_, j) => A.map(r => r[j]));
}
function centerCols(X) {
  const n = X.length, d = X[0].length;
  const mu = new Array(d).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < d; j++) mu[j] += X[i][j] / n;
  return { Xc: X.map(r => r.map((v, j) => v - mu[j])), mu };
}
/** 幂迭代求最大特征向量（用于 PCA 主轴 / 中心性） */
function powerIteration(M, iters = 200) {
  const n = M.length;
  let v = new Array(n).fill(0).map((_, i) => 1 / Math.sqrt(n) + i * 1e-6);
  let lambda = 0;
  for (let t = 0; t < iters; t++) {
    const w = M.map((row, i) => row.reduce((s, x, j) => s + x * v[j], 0));
    const nrm = Math.sqrt(sum(w.map(x => x * x))) || 1;
    v = w.map(x => x / nrm);
    lambda = sum(w.map((x, i) => x * v[i]));
  }
  return { vector: v.map(x => round(x, 6)), lambda: round(lambda, 6) };
}
function pca(X, components = 2) {
  const { Xc, mu } = centerCols(X);
  const n = Xc.length, d = Xc[0].length;
  let C = Array.from({ length: d }, () => new Array(d).fill(0));
  for (let i = 0; i < n; i++)
    for (let a = 0; a < d; a++)
      for (let b = 0; b < d; b++) C[a][b] += (Xc[i][a] * Xc[i][b]) / Math.max(1, n - 1);
  const totalVar = C.reduce((s, r, i) => s + r[i], 0);
  const comps = [];
  for (let k = 0; k < Math.min(components, d); k++) {
    const { vector, lambda } = powerIteration(C);
    comps.push({ vector, variance: lambda });
    for (let a = 0; a < d; a++)
      for (let b = 0; b < d; b++) C[a][b] -= lambda * vector[a] * vector[b];
  }
  const kept = comps.reduce((s, c) => s + c.variance, 0);
  return {
    components: comps.map(c => c.vector),
    explained: comps.map(c => round(safeDiv(c.variance, totalVar), 4)),
    retainedVariance: round(clamp01(safeDiv(kept, totalVar)), 4),
    mean: mu.map(x => round(x, 4))
  };
}

/* ---------------- 聚类 ---------------- */
function kmeans(points, k = 3, iters = 40) {
  const pts = points.map(p => (Array.isArray(p) ? p.map(Number) : [Number(p)]));
  const d = pts[0].length;
  const cs = [];
  for (let i = 0; i < k; i++) cs.push([...pts[Math.floor((i * pts.length) / k) % pts.length]]);
  let assign = new Array(pts.length).fill(0);
  for (let it = 0; it < iters; it++) {
    let moved = false;
    pts.forEach((p, i) => {
      let best = 0, bd = Infinity;
      cs.forEach((c, ci) => {
        let dist = 0;
        for (let j = 0; j < d; j++) dist += (p[j] - c[j]) ** 2;
        if (dist < bd) { bd = dist; best = ci; }
      });
      if (assign[i] !== best) { assign[i] = best; moved = true; }
    });
    for (let ci = 0; ci < k; ci++) {
      const grp = pts.filter((_, i) => assign[i] === ci);
      if (grp.length) for (let j = 0; j < d; j++) cs[ci][j] = mean(grp.map(p => p[j]));
    }
    if (!moved) break;
  }
  let inertia = 0;
  pts.forEach((p, i) => { for (let j = 0; j < d; j++) inertia += (p[j] - cs[assign[i]][j]) ** 2; });
  return { assignments: assign, centroids: cs.map(c => c.map(v => round(v, 4))), inertia: round(inertia, 4) };
}

function silhouette(points) {
  const pts = points.map(p => (Array.isArray(p) ? p.map(Number) : [Number(p)]));
  const k = Math.min(4, Math.max(2, Math.round(Math.sqrt(pts.length))));
  const { assignments, centroids } = kmeans(pts, k);
  const dist = (a, b) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0));
  const scores = pts.map((p, i) => {
    const own = assignments[i];
    const same = pts.filter((_, j) => assignments[j] === own && j !== i);
    const a = same.length ? mean(same.map(q => dist(p, q))) : 0;
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === own) continue;
      const other = pts.filter((_, j) => assignments[j] === c);
      if (other.length) b = Math.min(b, mean(other.map(q => dist(p, q))));
    }
    if (!isFinite(b)) return 0;
    const denom = Math.max(a, b) || 1;
    return (b - a) / denom;
  });
  return { clusters: assignments, noise: scores.filter(s => s < 0).length, silhouette: round(mean(scores), 4), centroids };
}

/* ---------------- 图论 ---------------- */
function buildGraph(nodes, edges) {
  const adj = new Map(nodes.map(n => [n, []]));
  edges.forEach(e => {
    const s = e.source ?? e.from, t = e.target ?? e.to, w = Number(e.weight ?? 1);
    if (!adj.has(s)) adj.set(s, []);
    if (!adj.has(t)) adj.set(t, []);
    adj.get(s).push({ to: t, w });
    adj.get(t).push({ to: s, w });
  });
  return adj;
}
function degreeCentrality(adj) {
  const out = [];
  adj.forEach((v, k) => out.push({ id: k, degree: v.length, centrality: round(v.length / Math.max(1, adj.size - 1), 4) }));
  return out.sort((a, b) => b.centrality - a.centrality);
}
/** Brandes 介数中心性（无权） */
function betweenness(adj) {
  const nodes = [...adj.keys()];
  const cb = Object.fromEntries(nodes.map(n => [n, 0]));
  nodes.forEach(s => {
    const S = [], P = Object.fromEntries(nodes.map(n => [n, []]));
    const sigma = Object.fromEntries(nodes.map(n => [n, 0]));
    const d = Object.fromEntries(nodes.map(n => [n, -1]));
    sigma[s] = 1; d[s] = 0;
    const Q = [s];
    while (Q.length) {
      const v = Q.shift(); S.push(v);
      (adj.get(v) || []).forEach(({ to: w }) => {
        if (d[w] < 0) { d[w] = d[v] + 1; Q.push(w); }
        if (d[w] === d[v] + 1) { sigma[w] += sigma[v]; P[w].push(v); }
      });
    }
    const delta = Object.fromEntries(nodes.map(n => [n, 0]));
    while (S.length) {
      const w = S.pop();
      P[w].forEach(v => { delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]); });
      if (w !== s) cb[w] += delta[w];
    }
  });
  nodes.forEach(n => { cb[n] = cb[n] / 2; });
  const mx = Math.max(...Object.values(cb), 1);
  return nodes.map(n => ({ id: n, centrality: round(cb[n] / mx, 4) })).sort((a, b) => b.centrality - a.centrality);
}

/* ---------------- 信息论 ---------------- */
function entropy(counts) {
  const tot = sum(counts);
  if (tot <= 0) return 0;
  let h = 0;
  counts.forEach(c => { if (c > 0) { const p = c / tot; h -= p * Math.log2(p); } });
  return round(h, 6);
}
function maxEntropy(n) { return n > 1 ? Math.log2(n) : 0; }
function gini(values) {
  const a = [...values].map(Number).sort((x, y) => x - y);
  const n = a.length, s = sum(a);
  if (!n || s === 0) return 0;
  let acc = 0;
  a.forEach((v, i) => { acc += (i + 1) * v; });
  return round((2 * acc) / (n * s) - (n + 1) / n, 4);
}

/* ---------------- 逻辑 ---------------- */
function truthTable(vars, expr) {
  const rows = [];
  const n = vars.length;
  for (let m = 0; m < (1 << n); m++) {
    const env = {};
    vars.forEach((v, i) => { env[v] = !!((m >> (n - 1 - i)) & 1); });
    rows.push({ assignment: { ...env }, value: !!expr(env) });
  }
  return rows;
}
function satisfiable(vars, expr) {
  const tt = truthTable(vars, expr);
  const hit = tt.find(r => r.value);
  return { satisfiable: !!hit, model: hit ? hit.assignment : null, checked: tt.length };
}
function isTautology(vars, expr) {
  const tt = truthTable(vars, expr);
  const bad = tt.find(r => !r.value);
  return { valid: !bad, counterExample: bad ? bad.assignment : null };
}

/* ---------------- 距离 ---------------- */
function euclid(a, b) {
  return Math.sqrt(a.reduce((s, x, i) => s + (Number(x) - Number(b[i] ?? 0)) ** 2, 0));
}
function cosine(a, b) {
  const na = Math.sqrt(sum(a.map(x => x * x))), nb = Math.sqrt(sum(b.map(x => x * x)));
  if (!na || !nb) return 0;
  return sum(a.map((x, i) => x * (b[i] || 0))) / (na * nb);
}

/* ---------------- 时间序列 ---------------- */
function ema(values, alpha = 0.3) {
  let prev = values[0] ?? 0;
  return values.map(v => (prev = alpha * v + (1 - alpha) * prev));
}
function seasonalStrength(values, period) {
  if (!period || values.length < period * 2) return 0;
  const seasons = Array.from({ length: period }, (_, k) => {
    const idx = [];
    for (let i = k; i < values.length; i += period) idx.push(values[i]);
    return mean(idx);
  });
  const overall = mean(values);
  const varS = variance(seasons.map(s => s - overall));
  return round(clamp01(safeDiv(varS, Math.max(1e-9, variance(values)))), 4);
}

module.exports = {
  sum, mean, variance, std, median, quantile, min, max, clamp01, round, safeDiv,
  pearson, spearman, ols, r2,
  erf, normCdf, ksTest, zScores, iqrOutliers,
  matMul, transpose, centerCols, powerIteration, pca,
  kmeans, silhouette,
  buildGraph, degreeCentrality, betweenness,
  entropy, maxEntropy, gini,
  truthTable, satisfiable, isTautology,
  euclid, cosine, ema, seasonalStrength
};
