"use strict";
/** fix-8-manual.cjs — 最后 8 条（已读到精确计算式） */
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
    if (typeof o.__fn__ === "string") {
      try { const fb = require(path.join(T3, "fn-bridge.cjs")); const f = fb.compile(o.__fn__); if (f) return f; } catch (e) { }
      return o.__fn__;
    }
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
  try { r = B.run(id, hydrate(JSON.parse(JSON.stringify(shape)))); } catch (e) { return { ok: false, err: e.message.slice(0, 46) }; }
  if (!r || !(r.success || r.degraded)) return { ok: false, err: String(r && r.error).slice(0, 46) };
  if (polluted(r.output)) return { ok: false, err: "污染: " + JSON.stringify(r.output).slice(0, 62) };
  return { ok: true, out: r.output };
}

const C = {
  /* 边格式两试：{from,to,weight} 与 {source,target,weight} */
  ALG_T2_C_004: [
    { graph: { nodes: [{ id: "a" }, { id: "b" }, { id: "c" }], edges: [{ source: "a", target: "b", weight: 1 }, { source: "b", target: "c", weight: 2 }] }, source: "a", target: "c" },
    { graph: { nodes: [{ id: "a" }, { id: "b" }, { id: "c" }], edges: [{ from: "a", to: "b", weight: 1, score: 1 }, { from: "b", to: "c", weight: 2, score: 2 }] }, source: "a", target: "c" },
  ],
  /* 源码只有 velocity < 0 才算有限值 */
  ALG_T2_C_011: [
    { current: 0.8, velocity: -0.05, threshold: 0.6 },
    { current: 0.5, velocity: -0.02, threshold: 0.6 },
  ],
  /* score = fusion.score * confidence * riskAdjustment * timeBoost；给足 context 字段 */
  ALG_T2_I_020: [
    { signals: [{ strength: 0.9, confidence: 0.9 }, { strength: 0.85, confidence: 0.8 }, { strength: 0.95, confidence: 0.9 }],
      context: { risk: 0.1, time: 1, urgency: 0.2, stability: 0.9, timeBoost: 1, riskAdjustment: 1 } },
    { signals: [{ strength: 0.9 }, { strength: 0.85 }, { strength: 0.95 }], context: 0.6 },
  ],
  /* trend 来自内部熵率；给更多点 + 递增熵 */
  ALG_T1_N_015: [
    { history: [{ time: 1, entropy: 0.5 }, { time: 2, entropy: 0.7 }, { time: 3, entropy: 1.0 }, { time: 4, entropy: 1.4 }], thresholds: { warning: 1.5, critical: 2.0 }, maxEntropy: 3 },
    { history: [0.5, 0.7, 1.0, 1.4], thresholds: { warning: 1.5, critical: 2.0 } },
  ],
  /* 零和：列和方差非零的方阵 */
  ALG_T1_X_013: [
    [[3, -3], [-1, 1], [2, -2]],
    [[4, -4], [-2, 2]],
    [[1, -1, 0], [-1, 1, 0], [0.5, -0.5, 1]],
  ],
  /* 复述：补齐所有被读字段 */
  ALG_T1_K_007: [
    { item: { id: "m1", content: "x", strength: 0.5, recallCount: 1, accessCount: 1, importance: 0.5, layer: 1 }, rehearsalCount: 3, boostPerRehearsal: 0.1 },
  ],
  /* 综合评分：补足维度字段 */
  ALG_T2_H_020: [
    { ideas: [{ id: "i1", novelty: 0.8, feasibility: 0.6, impact: 0.7, originality: 0.8, practicality: 0.6, value: 0.7 }] },
    { ideas: [{ id: "i1", scores: { novelty: 0.8, feasibility: 0.6 } }] },
  ],
  /* 审计风险：需 riskWeights */
  ALG_T2_U_010: [
    { entries: [{ id: "e1", action: "read", result: "failure" }, { id: "e2", action: "delete", result: "warning" }],
      rules: [{ name: "r1", severity: "high", check: { __fn__: "e => e.action === 'delete'" } }],
      riskWeights: { failure: 1, warning: 0.5, info: 0.1 } },
  ],
};

let ok = 0;
const bad = [];
console.log("=".repeat(86));
console.log("最后 8 条");
console.log("=".repeat(86));
for (const [id, cands] of Object.entries(C)) {
  let done = false, lastErr = "";
  for (const c of cands) {
    const r = trial(id, c);
    if (r.ok) { SH[id] = c; ok++; done = true; console.log("  ✓ " + id.padEnd(16) + JSON.stringify(r.out).slice(0, 66)); break; }
    lastErr = r.err;
  }
  if (!done) { bad.push([id, lastErr]); console.log("  ✗ " + id.padEnd(16) + lastErr); }
}
fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p2 of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.12.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p2))) fs.copyFileSync(P, p2);
}
console.log();
console.log("修好:", ok, "/", Object.keys(C).length);
