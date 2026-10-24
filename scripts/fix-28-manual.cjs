"use strict";
/**
 * fix-28-manual.cjs — 手工构造剩余 28 条的样例（读源码后逐条写）
 *
 * 为什么手工：前几轮自动构造把部分形状改坏了
 *   （例：ALG_T1_N_015 出现 {"entropy":1,"toFixed":1}——把方法名当字段；
 *     ALG_T1_G_002 给了 "sample text" 但 kmeans 需要数值向量数组）。
 * 原则：宁可少修，不可再污染。
 */
const fs = require("fs");
const path = require("path");
const T3 = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/t3impl";
const REG = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js");
const { bind } = require(path.join(T3, "bind.cjs"));
const P = path.join(T3, "shapes.json");
const SH = JSON.parse(fs.readFileSync(P, "utf8"));
const B = bind(REG);

function hydrate(o) {
  if (Array.isArray(o)) return o.map(hydrate);
  if (o && typeof o === "object") {
    if (o.__map__) { const m = new Map(); (o.entries || []).forEach(([k, v]) => m.set(k, hydrate(v))); return m; }
    if (o.__set__) return new Set((o.values || []).map(hydrate));
    if (typeof o.__regex__ === "string") { try { return new RegExp(o.__regex__, o.flags || ""); } catch (e) { return o.__regex__; } }
    if (typeof o.__fn__ === "string") return o.__fn__;
    const c = {};
    for (const k of Object.keys(o)) c[k] = hydrate(o[k]);
    return c;
  }
  return o;
}
function polluted(v, d = 0) {
  if (d > 8) return false;
  if (typeof v === "number") return !Number.isFinite(v);
  if (Array.isArray(v)) {
    if (v.length >= 2 && v.every(x => x === null || x === undefined)) return true;
    return v.some(x => polluted(x, d + 1));
  }
  if (v && typeof v === "object") return Object.values(v).some(x => polluted(x, d + 1));
  return false;
}
function trial(id, shape) {
  let r;
  try { r = B.run(id, hydrate(JSON.parse(JSON.stringify(shape)))); } catch (e) { return { ok: false, err: e.message.slice(0, 50) }; }
  if (!r || !(r.success || r.degraded)) return { ok: false, err: String(r && r.error).slice(0, 50) };
  if (polluted(r.output)) return { ok: false, err: "污染: " + JSON.stringify(r.output).slice(0, 80) };
  return { ok: true, out: r.output };
}

/* 手工构造：读源码后的精确形状 */
const MANUAL = {
  /* vectors 是「向量数组」，每个元素本身是数组 */
  ALG_T1_C_028: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [2, 4, 6]],
  /* 元素需五维字段 */
  ALG_T1_V_004: {
    deposits: [{ knowledge: 1, social: 2, economic: 3, cultural: 4, spiritual: 5 }],
    withdrawals: [{ knowledge: 1, social: 1, economic: 1, cultural: 1, spiritual: 1 }],
  },
  /* from/to 是账户对象，fromKey/toKey 是字段名 */
  ALG_T1_V_011: { from: { sample: 100 }, to: { sample: 0 }, amount: 10, fromKey: "sample", toKey: "sample" },
  /* samples 元素 actual/expected 为数组 —— 已正确，问题在 slope 需 t，补 index 字段 */
  ALG_T1_B_005: [
    { actual: [1, 2], expected: [1.5, 2.4], timestamp: 1 },
    { actual: [2, 3], expected: [2.4, 3.9], timestamp: 2 },
    { actual: [3, 4], expected: [3.9, 4.1], timestamp: 3 },
  ],
  /* lineage 是「谱系数组」，元素需 depth/branches */
  ALG_T1_E_008: [
    { id: "g0", depth: 0, branches: 2, parentId: null },
    { id: "g1", depth: 1, branches: 2, parentId: "g0" },
    { id: "g2", depth: 2, branches: 0, parentId: "g1" },
  ],
  /* generations 是「世代数组」，元素需 specimens */
  ALG_T1_E_015: [
    { generation: 0, specimens: [{ id: "s0", fitness: 0.3 }] },
    { generation: 1, specimens: [{ id: "s1", fitness: 0.6 }, { id: "s2", fitness: 0.5 }] },
  ],
  /* idea / corpus 需为向量（数值数组），corpus 需为「向量数组」 */
  ALG_T1_M_003: { idea: [0.5, 0.8, 0.2], corpus: [[0.1, 0.2, 0.3], [0.9, 0.1, 0.4]] },
  /* requests 元素需 userId/timestamp；config 需 now/windowMs/limit */
  ALG_T1_S_013: {
    requests: [{ userId: 1, timestamp: 990 }, { userId: 1, timestamp: 995 }],
    userId: 1,
    config: { now: 1000, windowMs: 60000, maxRequests: 10, limit: 10 },
  },
  /* history 元素只需 entropy（清掉被误加的 toFixed）；thresholds 需数值字段 */
  ALG_T1_N_015: {
    history: [{ entropy: 1 }, { entropy: 1.1 }, { entropy: 1.25 }],
    thresholds: { warning: 1.5, critical: 2.0, max: 2.5 },
  },
  /* item 需 strength 字段 */
  ALG_T1_K_007: { item: { id: "m1", content: "x", strength: 0.5, recallCount: 1 }, rehearsalCount: 3, boostPerRehearsal: 0.1 },
  /* kmeans 需要数值向量数组 */
  ALG_T1_G_002: { data: [[1, 2], [3, 4], [5, 6], [7, 8]], k: 2, maxIterations: 10 },
  /* unlabeled 需向量数组；model 需 weights(数组)/bias(数值) */
  ALG_T1_G_005: {
    unlabeled: [[1, 2], [3, 4], [5, 6]],
    model: { weights: [0.5, 0.3], bias: 0.1 },
    budget: 2,
  },
  /* pairs 元素需 stimulus/response 向量 */
  ALG_T1_G_007: {
    pairs: [
      { stimulus: [1, 0], response: [1, 0] },
      { stimulus: [0, 1], response: [0, 1] },
    ],
    learningRate: 0.1,
  },
  /* allSamples 元素需 features 数组；stages 需整数 */
  ALG_T1_G_015: {
    allSamples: [{ features: [1, 0, 0.5] }, { features: [0.2, 1, 0] }, { features: [0.5, 0.5, 1] }],
    stages: 3,
  },
  /* payoffMatrix 是二维数值矩阵 */
  ALG_T1_X_013: [[1, -1], [-1, 1], [2, -2]],
  /* known 元素需 point{x,y}/time/value；target 同样 */
  ALG_T1_T_005: {
    known: [
      { point: { x: 0, y: 0 }, time: 0, value: 10 },
      { point: { x: 10, y: 0 }, time: 10, value: 20 },
      { point: { x: 0, y: 10 }, time: 20, value: 30 },
    ],
    target: { point: { x: 5, y: 5 }, time: 15 },
    power: 2,
  },
};

const p = (x, n) => String(x).padEnd(n).slice(0, n);
console.log("=".repeat(90));
console.log("手工构造剩余样例");
console.log("=".repeat(90));

let ok = 0;
const bad = [];
for (const [id, shape] of Object.entries(MANUAL)) {
  const r = trial(id, shape);
  if (r.ok) {
    SH[id] = shape;
    ok++;
    console.log("  ✓ " + p(id, 18) + JSON.stringify(r.out).slice(0, 70));
  } else {
    bad.push([id, r.err]);
    console.log("  ✗ " + p(id, 18) + r.err);
  }
}

fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p2 of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p2))) fs.copyFileSync(P, p2);
}
console.log();
console.log("修好:", ok, "/", Object.keys(MANUAL).length);
if (bad.length) { console.log("未修:"); bad.forEach(([i, e]) => console.log("  " + i + " → " + e)); }
