"use strict";
/**
 * fix-22-exact.cjs — 按提取出的属性链精确构造剩余 22 条
 * 每条都用到 extract-chains 得到的真实字段名
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
  // history 元素需 integrity（前面已试过，错误是 toFixed → 需 integrity 为数值）
  ALG_T1_F_003: {
    history: [{ integrity: 0.95 }, { integrity: 0.97 }, { integrity: 0.99 }],
    targetIntegrity: 0.98,
    adjustmentRate: 0.1,
  },
  // episodes 元素需 state/action/nextState/reward（字符串键）
  ALG_T1_G_003: {
    episodes: [
      { state: "s0", action: "a0", nextState: "s1", reward: 1 },
      { state: "s1", action: "a1", nextState: "s0", reward: -1 },
    ],
    numStates: 2, numActions: 2, learningRate: 0.1, discountFactor: 0.9,
  },
  // samples 元素需 features/label；model 需 weights/bias
  ALG_T1_G_006: {
    samples: [{ features: [0.5, 0.3], label: 1 }, { features: [0.2, 0.8], label: 0 }],
    model: { weights: [0.5, 0.3], bias: 0.1 },
    learningRate: 0.01,
  },
  // rules[].then 需 {name, set}
  ALG_T1_R_012: {
    inputs: [{ name: "x", value: 0.5 }],
    rules: [{ if: [{ name: "x", a: 0, b: 0.5, c: 1 }], then: { name: "high", set: "H" } }],
  },
  // heuristics[].applies 是函数
  ALG_T1_I_002: {
    situation: { risk: 0.8, urgency: 0.9, familiarity: 0.2 },
    heuristics: [{ applies: { __fn__: "s => s.risk > 0.5" }, priority: 2, name: "h1", action: "act" }],
  },
  // conflict 需 rootCauses[{depth,weight,cause}] + parties
  ALG_T1_X_015: {
    rootCauses: [{ depth: 1, weight: 0.6, cause: "资源竞争" }, { depth: 2, weight: 0.4, cause: "沟通缺失" }],
    parties: ["p1", "p2"],
  },
  // TSP: start 需 x/y
  ALG_T1_T_015: {
    start: { x: 0, y: 0 },
    destinations: [{ id: "d1", x: 1, y: 1 }, { id: "d2", x: 3, y: 2 }],
  },
  // graph 需 edges[].score
  ALG_T2_C_008: {
    nodes: [{ id: "a" }, { id: "b" }],
    edges: [{ from: "a", to: "b", score: 0.8 }, { from: "b", to: "a", score: 0.4 }],
  },
  // expression 是函数
  ALG_T2_L_017: {
    variables: ["A", "B"],
    expression: { __fn__: "(v) => v.A && v.B" },
  },
  // creation 需 components + relations
  ALG_T2_M_004: {
    components: [{ id: "c1", type: "a" }, { id: "c2", type: "b" }],
    relations: [{ from: "c1", to: "c2", type: "part-of" }],
  },
  // creation.capabilities
  ALG_T2_M_006: {
    creation: { capabilities: ["降本", "增效"], elements: ["a"] },
    needs: [{ id: "n1", description: "降本", required: ["降本"] }],
  },
  // current.quality/issues + improvements[].issue
  ALG_T2_M_008: {
    current: { quality: 0.5, issues: [{ id: "i1", severity: 0.8 }] },
    improvements: [{ id: "p1", issue: "i1", gain: 0.3 }],
    maxIterations: 3,
  },
  // creation.spec + implementation
  ALG_T2_M_016: { spec: { requirements: ["a"] }, implementation: { features: ["b"] }, metrics: { coverage: 0.8 } },
  // decision.consequences[{probability,impact}]
  ALG_T2_D_008: {
    consequences: [{ probability: 0.3, impact: 0.8 }, { probability: 0.6, impact: 0.2 }],
    options: ["a", "b"], chosen: "a",
  },
  // decision.sideEffects
  ALG_T2_D_018: {
    sideEffects: [{ target: "A", severity: 0.6 }, { target: "B", severity: 0.3 }],
    chosen: "a", confidence: 0.8,
  },
  // config 需 algorithm/keyLength/mode/iv
  ALG_T2_S_010: {
    algorithm: "aes-256-gcm", keyLength: 256, mode: "gcm", iv: "00112233445566778899aabb",
    plaintext: "元构测试",
  },
  // memories + sequence
  ALG_T2_K_009: {
    memories: [{ id: "m1", content: "A", embedding: [0.8, 0.2] }, { id: "m2", content: "B", embedding: [0.4, 0.6] }],
    sequence: ["m1", "m2"],
  },
  // task.type/difficulty/dataVolume + strategies[].difficultyRange/dataReq
  ALG_T2_G_011: {
    task: { type: "classification", difficulty: 0.6, dataVolume: 1000 },
    strategies: [{ name: "增量", difficultyRange: [0, 1], dataReq: 100, score: 0.8 }],
  },
  // context + strategies
  ALG_T2_A_015: {
    context: { intent: "查询", ambiguity: 0.6, sentiment: "neutral" },
    strategies: [{ name: "澄清", condition: "ambiguous", score: 0.8 }],
  },
  // idea.content/novelty + sources[].novelty/id
  ALG_T2_H_013: {
    idea: { content: "元构新方案", novelty: 0.8 },
    sources: [{ id: "s1", novelty: 0.6 }, { id: "s2", novelty: 0.4 }],
  },
  // idea.content + existing
  ALG_T2_H_016: {
    idea: { content: "元构新方案", novelty: 0.8 },
    existing: [{ content: "元构旧方案", novelty: 0.5 }],
  },
  // rules[].check 是函数
  ALG_T2_U_004: {
    entries: [{ id: "e1", action: "create" }, { id: "e2", action: "delete" }],
    rules: [{ check: { __fn__: "e => e.action === 'delete'" }, name: "禁止删除", severity: "high" }],
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
