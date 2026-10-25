"use strict";
/** fix-16-unwrapped.cjs — 16 条单参非位置型：样例 = 参数值本身（不包裹） */
const fs = require("fs");
const path = require("path");
const T3 = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/t3impl";
const REG = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js");
const { bind } = require(path.join(T3, "bind.cjs"));
const P = path.join(T3, "shapes.json");
const SH = JSON.parse(fs.readFileSync(P, "utf8"));
const B = bind(REG);
const ok = r => !!(r && (r.success || r.degraded));

/* 全部是「解包」形态（参数值本身） */
const FIX = {
  ALG_T1_B_005: [{ actual: 1, expected: 1.5, timestamp: 1 }, { actual: 2, expected: 2.4, timestamp: 2 }, { actual: 3, expected: 3.9, timestamp: 3 }],
  ALG_T1_B_006: [{ actual: 1, expected: 1.5 }, { actual: 2, expected: 2.4 }, { actual: 3, expected: 3.9 }],
  ALG_T1_X_015: {
    rootCauses: [{ depth: 1, weight: 0.6, cause: "资源竞争" }, { depth: 2, weight: 0.4, cause: "沟通缺失" }],
  },
  ALG_T1_T_014: [
    { id: "e1", timestamp: 1, dependencies: [] },
    { id: "e2", timestamp: 2, dependencies: ["e1"] },
  ],
  ALG_T2_C_003: {
    graph: { nodes: [{ id: "a" }, { id: "b" }], edges: [{ from: "a", to: "b", weight: 0.8 }] },
  },
  ALG_T2_C_008: { scores: [0.8, 0.4, 0.6], bins: 2 },
  ALG_T2_E_012: {
    population: [{ id: "s1", fitness: 0.8, genome: [1, 2] }, { id: "s2", fitness: 0.4, genome: [3, 4] }],
  },
  ALG_T2_M_004: {
    id: "c1", relations: [{ from: "a", to: "b", type: "part-of" }], elements: ["a", "b"], novelty: 0.8,
  },
  ALG_T2_M_011: { id: "c1", sources: ["专利A", "论文B"], elements: ["a"], novelty: 0.8 },
  ALG_T2_M_013: [
    { id: "c1", elements: ["a", "b"], capabilities: ["x"], novelty: 0.9 },
    { id: "c2", elements: ["b", "c"], capabilities: ["x", "y"], novelty: 0.4 },
  ],
  ALG_T2_M_016: { id: "c1", elements: ["a", "b"], metrics: { novelty: 0.8, usefulness: 0.7 }, novelty: 0.8 },
  ALG_T2_D_004: { required: ["a", "b"], fields: { a: 1, b: 2, c: 3 } },
  ALG_T2_D_008: { id: "d1", options: ["a", "b"], chosen: "a", risks: [{ probability: 0.3, impact: 0.8 }], confidence: 0.8 },
  ALG_T2_D_009: { id: "d1", sideEffects: ["影响A", "影响B"], chosen: "a", confidence: 0.8 },
  ALG_T2_D_018: { id: "d1", options: ["a", "b"], criteria: [{ name: "c1", weight: 0.5 }], scores: { a: 8, b: 6 } },
  ALG_T2_S_010: {
    policies: [{ id: "p1", rules: [{ effect: "allow", action: "read" }] }],
    request: { actor: "u1", action: "read", resource: "r1" },
  },
};

let n = 0;
const bad = [];
for (const [id, v] of Object.entries(FIX)) {
  let r;
  try { r = B.run(id, JSON.parse(JSON.stringify(v))); } catch (e) { r = null; }
  if (ok(r)) { SH[id] = v; n++; }
  else bad.push([id, String(r && (r.error || r.output)).slice(0, 56)]);
}

fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.12.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p))) fs.copyFileSync(P, p);
}
console.log("修好:", n, "/", Object.keys(FIX).length);
bad.forEach(([id, e]) => console.log("  ✗ " + id.padEnd(16) + e));
