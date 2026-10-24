"use strict";
/**
 * fix-38.cjs — 按错误信息逐个构造剩余 38 条
 * 每条都严格对应源码要求的字段与类型
 */
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
  /* M 创造族 —— creation 需要 relations/sources/elements/issues */
  ALG_T2_M_004: {
    creation: { id: "c1", relations: [{ from: "a", to: "b", type: "part-of" }], elements: ["a", "b"], novelty: 0.8 },
  },
  ALG_T2_M_006: {
    creation: { id: "c1", elements: ["a", "b"], tags: ["降本"], domain: "x", novelty: 0.8 },
    needs: [{ id: "n1", description: "降本", tags: ["降本"], weight: 0.6 }],
  },
  ALG_T2_M_008: {
    current: { id: "c0", issues: ["成本高", "效率低"], elements: ["a"], novelty: 0.5 },
    improvements: [{ id: "i1", targets: ["成本高"], novelty: 0.7 }],
    maxIterations: 3,
  },
  ALG_T2_M_011: {
    creation: { id: "c1", sources: ["专利A", "论文B"], elements: ["a"], novelty: 0.8 },
  },
  ALG_T2_M_013: [
    { id: "c1", elements: ["a", "b"], novelty: 0.9, domain: "x" },
    { id: "c2", elements: ["b", "c"], novelty: 0.4, domain: "y" },
  ],
  ALG_T2_M_016: {
    creation: { id: "c1", elements: ["a", "b"], metrics: { novelty: 0.8, usefulness: 0.7 }, novelty: 0.8 },
  },

  /* G 学习族 */
  ALG_T1_G_003: {
    episodes: [
      { s0: "s0", action: "a0", reward: 1, s1: "s1" },
      { s0: "s1", action: "a1", reward: -1, s1: "s0" },
    ],
    numStates: 2, numActions: 2, learningRate: 0.1, discountFactor: 0.9,
  },
  ALG_T1_G_006: {
    samples: [{ x: [0.5, 0.3], y: 1 }, { x: [0.2, 0.8], y: 0 }],
    model: { weights: [0.5, 0.3], bias: 0.1 },
    learningRate: 0.1,
  },
  ALG_T2_G_011: {
    task: { id: "t1", type: "classification", difficulty: 0.6 },
    strategies: [{ name: "增量", suitableTypes: ["classification"], score: 0.8 }],
  },
  ALG_T2_G_016: {
    models: [
      { id: "m1", predictions: [0.8, 0.2], accuracy: 0.9 },
      { id: "m2", predictions: [0.6, 0.4], accuracy: 0.7 },
    ],
    method: "average",
    weights: [0.5, 0.5],
  },

  /* D 决策族 */
  ALG_T2_D_004: {
    content: { required: ["a", "b"], fields: { a: 1, b: 2, c: 3 } },
  },
  ALG_T2_D_008: {
    decision: { id: "d1", options: ["a", "b"], chosen: "a", risks: [{ probability: 0.3, impact: 0.8 }], confidence: 0.8 },
  },
  ALG_T2_D_009: {
    decision: { id: "d1", sideEffects: ["影响A", "影响B"], chosen: "a", confidence: 0.8 },
  },
  ALG_T2_D_018: {
    decision: { id: "d1", options: ["a", "b"], criteria: [{ name: "c1", weight: 0.5 }], scores: { a: 8, b: 6 } },
  },

  /* K 记忆族 */
  ALG_T1_K_001: {
    content: "元构测试内容",
    encoder: { __fn__: "(x) => x.split('').map(c => c.charCodeAt(0))" },
  },
  ALG_T1_K_003: {
    store: { __map__: true, entries: [["a", { value: 0.8, importance: 0.6 }], ["b", { value: 0.4, importance: 0.9 }]] },
    query: "a", topK: 2, minSimilarity: 0.1,
  },
  ALG_T2_K_009: {
    memories: [{ id: "m1", content: "A" }, { id: "m2", content: "B" }],
    sequence: ["m1", "m2"],
  },

  /* H 想法族 */
  ALG_T2_H_004: {
    ideas: [{ id: "i1", content: "降本方案", novelty: 0.8 }, { id: "i2", content: "增效方案", novelty: 0.6 }],
  },
  ALG_T2_H_013: {
    ideas: [{ id: "i1", content: "元构能力声明", novelty: 0.8 }, { id: "i2", content: "元构能力声明", novelty: 0.6 }],
  },
  ALG_T2_H_016: {
    idea: { id: "i1", content: "元构新方案", novelty: 0.8, feasibility: 0.6, impact: 0.7 },
  },

  /* B 偏差族 */
  ALG_T1_B_005: [{ value: 0.1, at: 1 }, { value: 0.3, at: 2 }, { value: 0.8, at: 3 }],
  ALG_T1_B_006: [0.1, 0.3, 0.8],

  /* E 进化族 */
  ALG_T1_E_009: [{ id: "s1", fitness: 0.8, genome: [1, 2] }, { id: "s2", fitness: 0.4, genome: [3, 4] }],
  ALG_T2_E_012: {
    population: [{ id: "s1", fitness: 0.8, genome: [1, 2] }, { id: "s2", fitness: 0.4, genome: [3, 4] }],
  },

  /* R 推理族 */
  ALG_T1_R_012: {
    inputs: [{ name: "x", value: 0.5 }],
    rules: [{ if: [{ name: "x", a: 0, b: 0.5, c: 1 }], then: "high" }],
  },
  ALG_T2_R_009: {
    proposition: { statement: "A" },
    modality: "necessary",
    worlds: [
      { id: "w1", truths: { __set__: true, values: ["A"] } },
      { id: "w2", truths: { __set__: true, values: ["A", "B"] } },
    ],
  },

  /* T 时间族 */
  ALG_T1_T_014: [{ id: "e1", timestamp: 1, type: "start" }, { id: "e2", timestamp: 2, type: "end" }],
  ALG_T1_T_015: {
    start: { x: 0, y: 0 },
    destinations: [{ id: "d1", x: 1, y: 1 }, { id: "d2", x: 3, y: 2 }],
  },

  /* C 耦生族 */
  ALG_T2_C_003: {
    graph: { nodes: [{ id: "a" }, { id: "b" }], edges: [{ from: "a", to: "b", weight: 0.8 }] },
  },
  ALG_T2_C_008: {
    scores: [0.8, 0.4, 0.6], bins: 2,
  },

  /* A 对话族 */
  ALG_T2_A_015: {
    context: { intent: "查询", sentiment: "neutral", ambiguity: 0.6, history: [] },
    strategies: [{ name: "澄清", condition: "ambiguous", score: 0.8 }],
  },
  ALG_T2_A_017: {
    text: "订单号 12345",
    entityTypes: [{ name: "订单号", patterns: ["\\d{5}"] }, { name: "日期", patterns: ["\\d{4}-\\d{2}"] }],
  },
};

let n = 0;
const bad = [];
for (const [id, v] of Object.entries(FIX)) {
  if (!SH[id]) { bad.push([id, "无此算法"]); continue; }
  let r;
  try { r = B.run(id, JSON.parse(JSON.stringify(v))); } catch (e) { r = null; }
  if (ok(r)) { SH[id] = v; n++; }
  else bad.push([id, String(r && (r.error || r.output)).slice(0, 58)]);
}

fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p))) fs.copyFileSync(P, p);
}
console.log("修好:", n, "/", Object.keys(FIX).length);
bad.forEach(([id, e]) => console.log("  ✗ " + id.padEnd(16) + e));
