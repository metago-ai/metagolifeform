"use strict";
/** fix-29.cjs — 按源码精确构造剩余 29 条 */
const fs = require("fs");
const path = require("path");
const T3 = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/t3impl";
const REG = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js");
const { bind } = require(path.join(T3, "bind.cjs"));
const P = path.join(T3, "shapes.json");
const SH = JSON.parse(fs.readFileSync(P, "utf8"));
const B = bind(REG);
const ok = r => !!(r && (r.success || r.degraded));

const FIX = {
  /* B：samples 元素 actual/expected 都是数组 */
  ALG_T1_B_005: [
    { actual: [1, 2], expected: [1.5, 2.4] },
    { actual: [2, 3], expected: [2.4, 3.9] },
    { actual: [3, 4], expected: [3.9, 4.1] },
  ],
  ALG_T1_B_006: [
    { actual: [1, 2], expected: [1.5, 2.4] },
    { actual: [2, 3], expected: [2.4, 3.9] },
  ],

  /* C：graph 需 nodes[{id}] + edges[{from,to,score}] */
  ALG_T2_C_003: {
    nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
    edges: [{ from: "a", to: "b", score: 0.8 }, { from: "b", to: "c", score: 0.6 }],
  },
  ALG_T2_C_008: { scores: [0.8, 0.4, 0.6, 0.9], bins: 2 },

  /* E：population 元素需 traits[] */
  ALG_T2_E_012: {
    population: [
      { id: "s1", traits: [1.0, 2.0], fitness: 0.8 },
      { id: "s2", traits: [3.0, 4.0], fitness: 0.4 },
      { id: "s3", traits: [1.0, 2.0], fitness: 0.6 },
    ],
  },
  ALG_T1_E_009: [
    { id: "s1", traits: [1, 2], fitness: 0.8 },
    { id: "s2", traits: [3, 4], fitness: 0.4 },
  ],

  /* D：content 需 required[] + provided{} */
  ALG_T2_D_004: {
    required: ["a", "b"],
    optional: ["c"],
    provided: { a: 1, b: 2, c: 3 },
  },
  ALG_T2_D_008: {
    id: "d1",
    options: [{ name: "a", risk: 0.3, reward: 0.8 }, { name: "b", risk: 0.6, reward: 0.5 }],
    chosen: "a",
    risks: [{ probability: 0.3, impact: 0.8 }],
    confidence: 0.8,
  },
  ALG_T2_D_009: {
    id: "d1",
    sideEffects: [{ target: "A", severity: 0.6 }, { target: "B", severity: 0.3 }],
    chosen: "a",
    confidence: 0.8,
  },
  ALG_T2_D_018: {
    id: "d1",
    options: ["a", "b"],
    criteria: [{ name: "c1", weight: 0.5 }],
    scores: { a: 8, b: 6 },
    weights: [0.6, 0.4],
  },

  /* M：creation 需 relations/sources 等数组 */
  ALG_T2_M_004: { id: "c1", relations: [{ from: "a", to: "b", type: "part-of", weight: 0.8 }], elements: ["a", "b"], novelty: 0.8 },
  ALG_T2_M_006: {
    id: "c1", elements: ["a", "b"], tags: ["降本"], capabilities: ["x"], domain: "x", novelty: 0.8,
    needs: [{ id: "n1", description: "降本", tags: ["降本"], weight: 0.6 }],
  },
  ALG_T2_M_008: {
    id: "c0", issues: [{ id: "i1", description: "成本高", severity: 0.8 }], elements: ["a"], novelty: 0.5,
    improvements: [{ id: "i1", targets: ["i1"], novelty: 0.7 }],
    maxIterations: 3,
  },
  ALG_T2_M_011: {
    id: "c1", sources: [{ id: "s1", type: "patent", weight: 0.7 }], transformations: [{ from: "a", to: "b", op: "merge" }],
    elements: ["a"], novelty: 0.8,
  },
  ALG_T2_M_013: [
    { id: "c1", elements: ["a", "b"], capabilities: ["x"], novelty: 0.9 },
    { id: "c2", elements: ["b", "c"], capabilities: ["x", "y"], novelty: 0.4 },
  ],
  ALG_T2_M_016: {
    id: "c1", elements: ["a", "b"], metrics: [{ name: "novelty", value: 0.8 }], novelty: 0.8, feasibility: 0.6,
  },

  /* G：强化学习 episodes 元素需 s0/action/reward/s1 且状态表 */
  ALG_T1_G_003: {
    episodes: [{ s0: 0, action: 0, reward: 1, s1: 1 }, { s0: 1, action: 1, reward: -1, s1: 0 }],
    numStates: 2, numActions: 2, learningRate: 0.1, discountFactor: 0.9,
  },
  ALG_T1_G_006: {
    samples: [{ x: [0.5, 0.3], y: 1 }, { x: [0.2, 0.8], y: 0 }],
    model: { weights: [0.5, 0.3], bias: 0.1 },
    learningRate: 0.1,
  },
};

let n = 0;
const bad = [];
for (const [id, v] of Object.entries(FIX)) {
  if (!SH[id]) { bad.push([id, "无此算法"]); continue; }
  let r;
  try { r = B.run(id, JSON.parse(JSON.stringify(v))); } catch (e) { r = null; }
  if (ok(r)) { SH[id] = v; n++; }
  else bad.push([id, String(r && (r.error || r.output)).slice(0, 54)]);
}

fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p))) fs.copyFileSync(P, p);
}
console.log("修好:", n, "/", Object.keys(FIX).length);
bad.forEach(([id, e]) => console.log("  ✗ " + id.padEnd(16) + e));
