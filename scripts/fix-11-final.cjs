"use strict";
/** fix-11-final.cjs — 按完整源码构造最后 11 条 */
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
  // history 元素需 integrity + frequency（两者都是数值）
  ALG_T1_F_003: {
    history: [{ integrity: 0.95, frequency: 1 }, { integrity: 0.97, frequency: 1.2 }, { integrity: 0.99, frequency: 1.5 }],
    targetIntegrity: 0.98,
    adjustmentRate: 0.1,
  },
  // heuristics 元素需 applies（函数）+ weight（数值）+ name
  ALG_T1_I_002: {
    situation: { risk: 0.8, urgency: 0.9 },
    heuristics: [
      { applies: { __fn__: "s => s.risk > 0.5" }, weight: 0.8, name: "h1" },
      { applies: { __fn__: "s => s.risk > 0.9" }, weight: 0.4, name: "h2" },
    ],
  },
  // strategies 元素需 appropriateness（数值）+ name
  ALG_T2_A_015: {
    context: { intent: "查询", ambiguity: 0.6 },
    strategies: [
      { name: "澄清", appropriateness: 0.8, condition: "ambiguous" },
      { name: "直接回答", appropriateness: 0.5 },
    ],
  },
  // TSP：destinations 元素需 x/y 数值 + 时间窗
  ALG_T1_T_015: {
    start: { x: 0, y: 0 },
    destinations: [
      { id: "d1", x: 1, y: 1, windowStart: 0, windowEnd: 100 },
      { id: "d2", x: 3, y: 2, windowStart: 0, windowEnd: 100 },
    ],
  },
  // 强化学习：episodes 元素需 state/action/reward/nextState 且与 numStates/numActions 匹配
  ALG_T1_G_003: {
    episodes: [
      { state: 0, action: 0, reward: 1, nextState: 1 },
      { state: 1, action: 1, reward: -1, nextState: 0 },
    ],
    numStates: 2, numActions: 2, learningRate: 0.1, discountFactor: 0.9,
  },
  // 模糊推理：rules[].then 需 {name, set}；inputs 元素需 name/value
  ALG_T1_R_012: {
    inputs: [{ name: "x", value: 0.5 }],
    rules: [{ if: [{ name: "x", a: 0, b: 0.5, c: 1 }], then: { name: "high", set: [0.3, 1.0] } }],
  },
  // 创造完整性：components 是普通值数组（Set 构造用），relations 是 [a,b] 对数组
  ALG_T2_M_004: {
    components: ["c1", "c2", "c3"],
    relations: [["c1", "c2"], ["c2", "c3"]],
  },
  // 创造验证：spec/implementation 都是字符串数组
  ALG_T2_M_016: {
    spec: ["f1", "f2", "f3"],
    implementation: ["f1", "f2"],
  },
  // 记忆重放：memories 元素需 id/content；sequence 是 id 序列
  ALG_T2_K_009: {
    memories: [{ id: "m1", content: "A" }, { id: "m2", content: "B" }],
    sequence: ["m1", "m2", "m1"],
  },
  // 学习策略：task 需 type/difficulty/dataVolume；strategies 需 difficultyRange/dataReq/name
  ALG_T2_G_011: {
    task: { type: "classification", difficulty: 0.5, dataVolume: 1000 },
    strategies: [
      { name: "监督学习", difficultyRange: [0, 0.7], dataReq: 500, score: 0.8 },
      { name: "迁移学习", difficultyRange: [0.5, 1], dataReq: 100, score: 0.6 },
    ],
  },
  // 想法新颖性：idea 需 content/novelty；sources 需 id/novelty
  ALG_T2_H_013: {
    idea: { content: "元构新方案", novelty: 0.8 },
    sources: [{ id: "s1", novelty: 0.9 }, { id: "s2", novelty: 0.7 }],
  },
};

let n = 0;
const bad = [];
for (const [id, v] of Object.entries(FIX)) {
  let r;
  try { r = B.run(id, JSON.parse(JSON.stringify(v))); } catch (e) { r = null; }
  if (ok(r)) { SH[id] = v; n++; }
  else bad.push([id, String(r && (r.error || r.output)).slice(0, 52)]);
}

fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.12.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p))) fs.copyFileSync(P, p);
}
console.log("修好:", n, "/", Object.keys(FIX).length);
bad.forEach(([id, e]) => console.log("  ✗ " + id.padEnd(16) + e));
