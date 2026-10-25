"use strict";
/** fix-batch-A.cjs — 按源码构造 24 条中的前 12 条 */
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
  // frequencyAdapt(history, targetIntegrity, adjustmentRate): history 元素需 integrity
  ALG_T1_F_003: {
    history: [{ integrity: 0.95, at: 1 }, { integrity: 0.97, at: 2 }, { integrity: 0.99, at: 3 }],
    targetIntegrity: 0.98,
    adjustmentRate: 0.1,
  },
  // memoryRetrieve(store, query, topK, minSimilarity): store 是 Map，item 需 embedding[]
  ALG_T1_K_003: {
    store: { __map__: true, entries: [["a", { embedding: [0.8, 0.2], value: 1 }], ["b", { embedding: [0.4, 0.6], value: 2 }]] },
    query: [0.8, 0.2],
    topK: 2,
    minSimilarity: 0.1,
  },
  // reinforcementLearn(episodes, numStates, numActions, lr, df)
  ALG_T1_G_003: {
    episodes: [{ s0: 0, action: 0, reward: 1, s1: 1 }, { s0: 1, action: 1, reward: -1, s1: 0 }],
    numStates: 2, numActions: 2, learningRate: 0.1, discountFactor: 0.9,
  },
  // passiveLearning(samples, model, lr): model.weights 是数组，samples 元素需 x/y
  ALG_T1_G_006: {
    samples: [{ x: [0.5, 0.3], y: 1 }, { x: [0.2, 0.8], y: 0 }],
    model: { weights: [0.5, 0.3], bias: 0.1 },
    learningRate: 0.01,
  },
  // fuzzyReasoning(inputs, rules): rule.if 元素需 name/a/b/c
  ALG_T1_R_012: {
    inputs: [{ name: "x", value: 0.5 }],
    rules: [{ if: [{ name: "x", a: 0, b: 0.5, c: 1 }], then: "high" }],
  },
  // heuristicIntuition(situation, heuristics)
  ALG_T1_I_002: {
    situation: { risk: 0.8, urgency: 0.9, familiarity: 0.2 },
    heuristics: [{ condition: { __fn__: "s => s.risk > 0.5" }, priority: 2, name: "h1", action: "act" }],
  },
  // conflictProvenance(conflict): rootCauses[{depth, weight, cause}]
  ALG_T1_X_015: {
    rootCauses: [{ depth: 1, weight: 0.6, cause: "资源竞争" }, { depth: 2, weight: 0.4, cause: "沟通缺失" }],
  },
  // TSP(start, destinations): start 需 x/y
  ALG_T1_T_015: {
    start: { x: 0, y: 0 },
    destinations: [{ id: "d1", x: 1, y: 1 }, { id: "d2", x: 3, y: 2 }],
  },
  // couplingBinning(scores, bins)
  ALG_T2_C_008: { scores: [0.8, 0.4, 0.6, 0.9], bins: 2 },
  // truthTableGenerate(variables, expression)
  ALG_T2_L_017: { variables: ["A", "B"], expression: "A AND B" },
  // evolutionDiversityMaintain(population): 元素需 traits[]
  ALG_T2_E_012: [
    { id: "s1", traits: [1.0, 2.0], fitness: 0.8 },
    { id: "s2", traits: [3.0, 4.0], fitness: 0.4 },
    { id: "s3", traits: [1.0, 2.0], fitness: 0.6 },
  ],
  // creationInherit(creation): relations[]
  ALG_T2_M_004: {
    id: "c1",
    relations: [{ from: "a", to: "b", type: "part-of", weight: 0.8 }],
    elements: ["a", "b"], novelty: 0.8,
  },
};

let n = 0;
const bad = [];
for (const [id, v] of Object.entries(FIX)) {
  let r;
  try { r = B.run(id, JSON.parse(JSON.stringify(v))); } catch (e) { r = null; }
  if (ok(r)) { SH[id] = v; n++; }
  else bad.push([id, String(r && (r.error || r.output)).slice(0, 50)]);
}

fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.12.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p))) fs.copyFileSync(P, p);
}
console.log("修好:", n, "/", Object.keys(FIX).length);
bad.forEach(([id, e]) => console.log("  ✗ " + id.padEnd(16) + e));
