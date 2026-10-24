"use strict";
/** fix-5-last.cjs — 最后 5 条精确构造 */
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
  // start 需 {point, time}；destinations 需 {point, time, priority}
  ALG_T1_T_015: {
    start: { point: { x: 0, y: 0 }, time: 0 },
    destinations: [
      { id: "d1", point: { x: 1, y: 1 }, time: 10, priority: 0.8 },
      { id: "d2", point: { x: 3, y: 2 }, time: 20, priority: 0.4 },
    ],
  },
  // inputs 是对象：{value, membership:{setName: [a,b]}}
  ALG_T1_R_012: {
    inputs: { value: 0.5, membership: { low: [0, 0.3], high: [0.6, 0.4] } },
    rules: [{ if: [{ set: "high" }], then: { name: "out_high", set: "HIGH" } }],
  },
  // sequence 是字符串（排序策略）
  ALG_T2_K_009: {
    memories: [
      { id: "m1", content: "A", timestamp: 1, importance: 0.5 },
      { id: "m2", content: "B", timestamp: 2, importance: 0.9 },
    ],
    sequence: "chronological",
  },
};

let n = 0;
const bad = [];
for (const [id, v] of Object.entries(FIX)) {
  let r;
  try { r = B.run(id, JSON.parse(JSON.stringify(v))); } catch (e) { r = null; }
  if (ok(r)) { SH[id] = v; n++; console.log("✓ " + id + " → " + JSON.stringify(r.output).slice(0, 70)); }
  else bad.push([id, String(r && (r.error || r.output)).slice(0, 50)]);
}

fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p))) fs.copyFileSync(P, p);
}
console.log("修好:", n, "/", Object.keys(FIX).length);
bad.forEach(([id, e]) => console.log("  ✗ " + id.padEnd(16) + e));
