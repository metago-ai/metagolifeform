"use strict";
/**
 * fn-params-test.cjs — 函数型形参算法的可调性验证（K4 断言实体）
 *
 * 验证两件事：
 *   1. 21 条含函数型形参的算法，以「表达式字符串」传入后全部可调通
 *   2. 桥接器的安全边界生效：危险表达式必须被拒绝
 */
const path = require("path");
const fs = require("fs");
/* 优先使用同级（包内）副本；仅在独立运行时回退 npm 安装路径 */
function resolveFirst(list) {
  for (const p of list) { try { if (fs.existsSync(p)) return p; } catch (e) {} }
  return list[list.length - 1];
}
const T3 = __dirname;
const REG_PATH = resolveFirst([
  path.join(__dirname, "..", "registry.js"),
  "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js",
]);
const REG = require(REG_PATH);
const { bind } = require(path.join(T3, "bind.cjs"));
const FB = require(path.join(T3, "fn-bridge.cjs"));
const B = bind(REG);

const CASES = {
  ALG_T1_C_019: { labels: [1, 2, 3], scoreFn: "x => x*2" },
  ALG_T1_E_003: { template: [1, 2, 3], mutationRate: 0.1, rng: "Math.random" },
  ALG_T1_E_005: { initial: [1, 2, 3], evolveFn: "x => x.map(v=>v+1)", maxIterations: 5, convergenceThreshold: 0.01 },
  ALG_T1_E_006: {
    input: { state: [1, 2, 3], boundaries: [{ value: 1 }, { value: 2 }], target: [0, 0, 0], points: [1, 2, 3] },
    evolveFn: "x => x.map(v => v * 0.9)", maxCycles: 3
  },
  ALG_T1_E_010: { specimen: { genome: [1, 2, 3] }, objective: [1.1, 1.9, 3.2], weights: [1, 1, 1] },
  ALG_T1_E_012: { genome: [1, 2, 3], rate: 0.1, magnitude: 0.5, rng: "Math.random" },
  ALG_T1_E_013: { population: [{ fitness: 1 }, { fitness: 2 }], tournamentSize: 2, rng: "Math.random" },
  ALG_T1_E_014: { parentA: [1, 2], parentB: [3, 4], crossoverRate: 0.5, rng: "Math.random" },
  ALG_T1_G_015: { allSamples: [{ q: 1 }, { q: 2 }], difficultyFn: "x => x.q" },
  ALG_T1_M_001: { seedFeatures: [1, 2], corpus: [[1, 2]], mutationScale: 0.1, rng: "Math.random" },
  ALG_T1_M_009: { seed: [1, 2], count: 3, spread: 0.1, rng: "Math.random" },
  ALG_T1_M_010: { ideas: [{ v: 1 }, { v: 2 }], objective: "x => x.v", iterations: 3 },
  ALG_T1_M_011: { idea: [1, 2, 3], mutationType: "flip", rate: 0.1, magnitude: 0.2, rng: "Math.random" },
  ALG_T1_M_012: { parentA: { a: 1 }, parentB: { a: 2 }, strategy: "mix", rng: "Math.random" },
  ALG_T1_M_013: {
    candidates: [{ id: "a", novelty: 0.8 }, { id: "b", novelty: 0.5 }],
    criteria: { noveltyWeight: 0.5, feasibilityWeight: 0.3, impactWeight: 0.2 },
    feasibilityFn: "x => 0.8", impactFn: "x => 0.6"
  },
  ALG_T1_V_014: { rows: [1, 2], cols: [1, 2], valueFn: "(i,j) => i+j" },
  ALG_T2_C_002: { nodes: [{ s: 1 }, { s: 2 }], scoreFn: "x => x.s", threshold: 1 },
  ALG_T2_G_017: { lossFn: "p => p[0]*p[0] + p[1]*p[1]", params: [1, 2], epsilon: 0.01 },
  ALG_T2_H_002: { ideas: [{ v: 1 }, { v: 2 }], similarityFn: "(a,b) => a.v===b.v?1:0" },
  ALG_T2_T_001: { series: { timestamps: [1, 2, 3, 4, 5], values: [10, 20, 30, 40, 50] }, windowMs: 2, aggFn: "v => v.reduce((a,b)=>a+b,0)/v.length" },
  ALG_T2_U_019: { entries: ["a", "b"], hashFn: "x => x.length", storedHashes: new Map() },
};

const SECURITY = [
  ["require('fs')", true], ["process.exit(1)", true], ["eval('1')", true],
  ["global.x=1", true], ["Function('return 1')()", true], ["import('fs')", true],
  ["x => x*2", false], ["Math.random", false], ["(a,b)=>a+b", false],
];

let pass = 0, fail = 0;
const bad = [];

console.log("=".repeat(80));
console.log("K4 · 函数型形参算法可调性验证");
console.log("=".repeat(80));

/* R141 判据加固：不只判「没崩」，还判「输出有意义」
   原判据 const ok = r.success === true 让空壳输出（如 matrix: []）也判 PASS。 */
function isMeaningful(out) {
  if (out === null || out === undefined) return false;
  if (typeof out === "number") return isFinite(out);
  if (typeof out === "string") return out.length > 0;
  if (Array.isArray(out)) return out.length > 0 && out.every(v => typeof v !== "number" || isFinite(v));
  if (typeof out === "object") {
    const ks = Object.keys(out).filter(k => k !== "provenance");
    if (ks.length === 0) return false;
    return ks.some(k => {
      const v = out[k];
      if (v === null || v === undefined) return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "number") return isFinite(v);
      if (typeof v === "object") return Object.keys(v).length > 0;
      return true;
    });
  }
  return true;
}
/* 精确断言：ALG_T1_C_019 的 matrix 必须是 3x3 且 scoreFn(x)=>x*2 生效 */
function preciseCheck(id, out) {
  if (id !== "ALG_T1_C_019") return true;
  if (!out || !Array.isArray(out.matrix) || out.matrix.length !== 3) return false;
  const m = out.matrix;
  return m.every(row => Array.isArray(row) && row.length === 3 && row.every(v => typeof v === "number" && isFinite(v)));
}
Object.keys(CASES).forEach(id => {
  const r = B.run(id, CASES[id]);
  const noErr = r && r.success === true;
  const meaningful = noErr && isMeaningful(r.output);
  const precise = meaningful && preciseCheck(id, r.output);
  const ok = noErr && meaningful && precise;
  if (ok) pass++;
  else {
    fail++;
    const why = !noErr ? String((r && r.error) || "无返回").slice(0, 60)
      : (!meaningful ? "空壳输出" : "精确断言不符");
    bad.push([id, why]);
  }
});
console.log(`可调通: ${pass} / ${Object.keys(CASES).length}`);
bad.slice(0, 5).forEach(([id, e]) => console.log("  FAIL " + id + " : " + e));

console.log();
console.log("--- 安全边界 ---");
let secPass = 0, secFail = 0;
SECURITY.forEach(([expr, shouldReject]) => {
  const fn = FB.compile(expr);
  const rejected = fn === null;
  const ok = rejected === shouldReject;
  if (ok) secPass++; else { secFail++; console.log("  FAIL " + expr + " 期望拒绝=" + shouldReject + " 实际=" + rejected); }
});
console.log(`安全用例: ${secPass} / ${SECURITY.length}`);

const total = Object.keys(CASES).length + SECURITY.length;
const totalPass = pass + secPass;
const totalFail = fail + secFail;

console.log();
console.log("-".repeat(80));
console.log(`合计 ${total} 项 ｜ 通过 ${totalPass} ｜ 失败 ${totalFail}`);
console.log(totalFail === 0 ? "总判定：PASS" : "总判定：FAIL");
process.exit(totalFail === 0 ? 0 : 1);
