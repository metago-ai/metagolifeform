"use strict";
/** fix-15-manual.cjs — 最后 15 条手工构造（读源码后逐条写） */
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
  if (polluted(r.output)) return { ok: false, err: "污染: " + JSON.stringify(r.output).slice(0, 64) };
  return { ok: true, out: r.output };
}

const CANDIDATES = {
  /* source/target 是节点 id（字符串），不是数组；边权重需真实 */
  ALG_T2_C_004: [
    { graph: { nodes: [{ id: "a" }, { id: "b" }, { id: "c" }], edges: [{ from: "a", to: "b", weight: 1 }, { from: "b", to: "c", weight: 2 }] }, source: "a", target: "c" },
  ],
  /* current < threshold 才有正预测余量；velocity 必须 > 0 */
  ALG_T2_C_011: [
    { current: 0.1, velocity: 0.02, threshold: 0.6 },
    { current: 0.5, velocity: 0.05, threshold: 1.0 },
  ],
  /* claim 是判定函数；variables 是变量名数组 */
  ALG_T2_L_013: [
    { claim: { __fn__: "v => v.a > 0 && v.b > 0" }, variables: ["a", "b"], maxAttempts: 20 },
  ],
  /* decision 需 startTime/timeoutMs 数值 */
  ALG_T2_D_016: [
    { decision: { id: "d1", startTime: 1000, timeoutMs: 5000 }, now: 2000 },
  ],
  /* resourceUsage 与 limits 需 cpu/memory/network 数值 */
  ALG_T2_D_019: [
    { decision: { resourceUsage: { cpu: 40, memory: 60, network: 20 } }, limits: { cpu: 100, memory: 100, network: 100 } },
  ],
  /* entry 需 importance/lastAccess；halfLifeMs 数值；now 数值 */
  ALG_T2_K_002: [
    { entry: { importance: 0.8, lastAccess: 1000, accessCount: 3, layer: 1 }, halfLifeMs: 60000, now: 5000 },
  ],
  /* models 元素需 predictions 为「标签→值」映射或数组；用数组 + weights */
  ALG_T2_G_016: [
    { models: [{ id: "m1", predictions: [{ id: "a", value: 0.8 }, { id: "b", value: 0.2 }], accuracy: 0.9 },
               { id: "m2", predictions: [{ id: "a", value: 0.6 }, { id: "b", value: 0.4 }], accuracy: 0.7 }], method: "average", weights: [0.5, 0.5] },
    { models: [{ id: "m1", predictions: [0.8, 0.2], accuracy: 0.9 }, { id: "m2", predictions: [0.6, 0.4], accuracy: 0.7 }], method: "average", weights: [0.5, 0.5] },
  ],
  /* conflicts 需 evidence.supportsA / supportsB */
  ALG_T2_R_017: [
    { evidence: { supportsA: 0.8, supportsB: 0.2 }, claimA: "A", claimB: "B" },
  ],
  /* signals 元素需 strength 数值；context 数值 */
  ALG_T2_I_020: [
    { signals: [{ strength: 0.8 }, { strength: 0.6 }, { strength: 0.7 }], context: 0.6 },
  ],
  /* state 需 intensity 数值 */
  ALG_T2_X_014: [
    { state: { intensity: 0.9 }, targetIntensity: 0.2 },
  ],
  /* 熵监控：trend 需要 >=3 点且值不同 */
  ALG_T1_N_015: [
    { history: [{ entropy: 0.8 }, { entropy: 0.9 }, { entropy: 1.0 }, { entropy: 1.2 }], thresholds: { warning: 1.5, critical: 2.0 } },
  ],
  /* 零和检测：规则方阵 */
  ALG_T1_X_013: [
    [[1, -1], [-1, 1]],
  ],
  /* 记忆复述：item 必须是对象且含 strength */
  ALG_T1_K_007: [
    { item: { id: "m1", content: "x", strength: 0.5, recallCount: 1 }, rehearsalCount: 3, boostPerRehearsal: 0.1 },
  ],
  /* 综合评分：需 overallScore 相关字段 */
  ALG_T2_H_020: [
    { ideas: [{ id: "i1", novelty: 0.8, feasibility: 0.6, impact: 0.7 }, { id: "i2", novelty: 0.5, feasibility: 0.9, impact: 0.4 }] },
  ],
  /* 审计风险评估：entries + rules */
  ALG_T2_U_010: [
    { entries: [{ id: "e1", action: "read", risk: 0.2 }, { id: "e2", action: "delete", risk: 0.9 }], rules: [{ name: "r1", severity: "high", check: { __fn__: "e => e.action === 'delete'" } }] },
  ],
};

let ok = 0;
const bad = [];
console.log("=".repeat(88));
console.log("最后 15 条手工构造");
console.log("=".repeat(88));
for (const [id, cands] of Object.entries(CANDIDATES)) {
  let done = false;
  for (const c of cands) {
    const r = trial(id, c);
    if (r.ok) {
      SH[id] = c; ok++; done = true;
      console.log("  ✓ " + id.padEnd(16) + JSON.stringify(r.out).slice(0, 68));
      break;
    }
  }
  if (!done) {
    bad.push([id, trial(id, cands[cands.length - 1]).err]);
    console.log("  ✗ " + id.padEnd(16) + bad[bad.length - 1][1]);
  }
}
fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p2 of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.12.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p2))) fs.copyFileSync(P, p2);
}
console.log();
console.log("修好:", ok, "/", Object.keys(CANDIDATES).length);
