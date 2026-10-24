"use strict";
/**
 * fix-family-R.cjs — 按源码构造推理族 9 条
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
  // rules: [{ if: [...条件], then: 结论 }]  —— rule.if 必须是数组
  ALG_T1_R_012: {
    inputs: [{ name: "x", value: 0.8 }],
    rules: [
      { if: [{ name: "x", a: 0, b: 0.5, c: 1 }], then: "high" },
      { if: [{ name: "x", a: 0.6, b: 0.9, c: 1 }], then: "veryhigh" },
    ],
  },

  // heuristics: [{ condition: fn, priority, name, action }]
  ALG_T1_R_014: {
    problem: { features: [1, 2, 3], goal: "G" },
    heuristics: [
      { condition: { __fn__: "f => f.length > 0" }, priority: 2, name: "h1", action: "act" },
      { condition: { __fn__: "f => f.length > 5" }, priority: 1, name: "h2", action: "wait" },
    ],
  },

  // hypotheses: [{ name, explains: [...], complexity, prior }]
  ALG_T2_R_005: {
    observations: ["o1", "o2"],
    hypotheses: [
      { name: "H1", explains: ["o1", "o2"], complexity: 0.2, prior: 0.8 },
      { name: "H2", explains: ["o1"], complexity: 0.6, prior: 0.4 },
    ],
  },
  ALG_T2_L_009: {
    observations: ["o1", "o2"],
    hypotheses: [
      { name: "H1", explains: ["o1", "o2"], complexity: 0.2, prior: 0.8 },
      { name: "H2", explains: ["o1"], complexity: 0.5, prior: 0.5 },
    ],
  },

  // rules: [{ if: [...前提], then: 结论 }]
  ALG_T2_R_006: {
    premises: ["A", "A→B"],
    rules: [
      { if: ["A"], then: "B" },
      { if: ["B"], then: "C" },
    ],
  },
  ALG_T2_L_007: {
    premises: ["A", "A→B"],
    conclusion: "B",
    rules: [
      { if: ["A"], then: "B" },
      { pattern: "A→B", if: ["A"], then: "B" },
    ],
  },

  // modalReasoning(proposition, modality, worlds)
  ALG_T2_R_009: {
    proposition: { statement: "A" },
    modality: "necessary",
    worlds: [{ id: "w1", facts: ["A"] }, { id: "w2", facts: ["A", "B"] }],
  },

  // fuzzyReasoning(inputs, rules) —— 同 R_012 结构
  ALG_T2_R_011: {
    inputs: [{ name: "x", value: 0.8 }],
    rules: [{ if: [{ name: "x", a: 0, b: 0.5, c: 1 }], then: "high" }],
  },

  // reasoningChain(chain, axioms)
  ALG_T2_R_015: {
    chain: [{ statement: "A", rule: "axiom" }, { statement: "B", rule: "A→B" }],
    axioms: [{ statement: "A", truth: true }],
  },

  // hypothesisGeneration(observations, knowledgeBase)
  ALG_T2_R_018: {
    observations: ["obs1", "obs2"],
    knowledgeBase: { rules: [{ if: ["obs1"], then: "H1" }], facts: ["obs1"] },
  },

  // reasoningOptimize(chain)
  ALG_T2_R_019: {
    chain: [
      { step: 1, statement: "A", cost: 1 },
      { step: 2, statement: "B", cost: 3 },
      { step: 3, statement: "C", cost: 2 },
    ],
  },
};

let n = 0;
const bad = [];
for (const [id, v] of Object.entries(FIX)) {
  if (!SH[id]) continue;
  let r;
  try { r = B.run(id, JSON.parse(JSON.stringify(v))); } catch (e) { r = null; }
  if (ok(r)) { SH[id] = v; n++; }
  else bad.push([id, JSON.stringify(r && (r.error || r.output)).slice(0, 70)]);
}

fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p))) fs.copyFileSync(P, p);
}
console.log("R 族修好:", n, "/", Object.keys(FIX).length);
bad.forEach(([id, e]) => console.log("  ✗ " + id + " : " + e));
