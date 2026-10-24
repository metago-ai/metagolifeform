"use strict";
/** fix-last2.cjs — 最后 2 条 */
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
  // task 需 {type, difficulty, dataVolume}；strategies 元素需 suitableTypes[] / difficultyRange[2] / dataReq / name
  ALG_T2_G_011: {
    task: { type: "classification", difficulty: 0.5, dataVolume: 1000 },
    strategies: [
      { name: "监督学习", suitableTypes: ["classification", "regression"], difficultyRange: [0, 0.7], dataReq: 500 },
      { name: "迁移学习", suitableTypes: ["classification"], difficultyRange: [0.5, 1], dataReq: 100 },
    ],
  },
  // idea 需 {content: 字符串}；sources 元素需 {content: 字符串, novelty, id}
  ALG_T2_H_013: {
    idea: { content: "元构 新 方案 创新", novelty: 0.8 },
    sources: [
      { id: "s1", content: "元构 新 方案 设计", novelty: 0.9 },
      { id: "s2", content: "其他 方案 参考", novelty: 0.4 },
    ],
  },
};

let n = 0;
for (const [id, v] of Object.entries(FIX)) {
  let r;
  try { r = B.run(id, JSON.parse(JSON.stringify(v))); } catch (e) { r = null; }
  if (ok(r)) { SH[id] = v; n++; console.log("✓ " + id + " → " + JSON.stringify(r.output).slice(0, 78)); }
  else console.log("✗ " + id + " → " + JSON.stringify(r && (r.error || r.output)).slice(0, 60));
}

fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p))) fs.copyFileSync(P, p);
}
console.log("修好:", n, "/ 2");
