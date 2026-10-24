"use strict";
/** fix-6-manual.cjs — 最后 6 条（数组的数组 / 函数型形参） */
const fs = require("fs");
const path = require("path");
const T3 = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/t3impl";
const REG = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js");
const { bind } = require(path.join(T3, "bind.cjs"));
const P = path.join(T3, "shapes.json");
const SH = JSON.parse(fs.readFileSync(P, "utf8"));
const B = bind(REG);

function hydrate(o) {
  if (Array.isArray(o)) return o.map(hydrate);
  if (o && typeof o === "object") {
    if (o.__map__) { const m = new Map(); (o.entries || []).forEach(([k, v]) => m.set(k, hydrate(v))); return m; }
    if (o.__set__) return new Set((o.values || []).map(hydrate));
    if (typeof o.__regex__ === "string") { try { return new RegExp(o.__regex__, o.flags || ""); } catch (e) { return o.__regex__; } }
    if (typeof o.__fn__ === "string") {
      try { const fb = require(path.join(T3, "fn-bridge.cjs")); const f = fb.compile(o.__fn__); if (f) return f; } catch (e) { }
      return o.__fn__;
    }
    const c = {};
    for (const k of Object.keys(o)) c[k] = hydrate(o[k]);
    return c;
  }
  return o;
}
function polluted(v, d = 0) {
  if (d > 8) return false;
  if (typeof v === "number") return !Number.isFinite(v);
  if (Array.isArray(v)) {
    if (v.length >= 2 && v.every(x => x === null || x === undefined)) return true;
    return v.some(x => polluted(x, d + 1));
  }
  if (v && typeof v === "object") return Object.values(v).some(x => polluted(x, d + 1));
  return false;
}
function trial(id, shape) {
  let r;
  try { r = B.run(id, hydrate(JSON.parse(JSON.stringify(shape)))); } catch (e) { return { ok: false, err: e.message.slice(0, 50) }; }
  if (!r || !(r.success || r.degraded)) return { ok: false, err: String(r && r.error).slice(0, 50) };
  if (polluted(r.output)) return { ok: false, err: "污染: " + JSON.stringify(r.output).slice(0, 70) };
  return { ok: true, out: r.output };
}

const CANDIDATES = {
  /* lineage = 数组的数组（每代是个数组） */
  ALG_T1_E_008: [
    [[{ id: "a" }, { id: "b" }], [{ id: "c" }, { id: "d" }, { id: "e" }], [{ id: "f" }, { id: "g" }]],
  ],
  /* generations = 数组的数组，元素含 id/fitness */
  ALG_T1_E_015: [
    [
      [{ id: "a", fitness: 0.3 }, { id: "b", fitness: 0.5 }],
      [{ id: "c", fitness: 0.7 }, { id: "d", fitness: 0.4 }],
      [{ id: "e", fitness: 0.9 }],
    ],
  ],
  /* difficultyFn 是函数型形参 → 用 __fn__ 标记 */
  ALG_T1_G_015: [
    { allSamples: [{ features: [1, 0, 0.5] }, { features: [0.2, 1, 0] }, { features: [0.5, 0.5, 1] }],
      difficultyFn: { __fn__: "s => Math.sqrt(s.features.reduce((a, f) => a + f * f, 0))" }, stages: 3 },
    { allSamples: [{ features: [1, 0, 0.5] }, { features: [0.2, 1, 0] }, { features: [0.5, 0.5, 1] }], stages: 3 },
  ],
  /* 熵历史需要更多点 + 明确阈值字段，让 trend 可算 */
  ALG_T1_N_015: [
    { history: [{ entropy: 0.8 }, { entropy: 0.9 }, { entropy: 1.0 }, { entropy: 1.2 }],
      thresholds: { warning: 1.5, critical: 2.0, maxEntropy: 2.5, upper: 1.5 } },
    { history: [0.8, 0.9, 1.0, 1.2], thresholds: { warning: 1.5, critical: 2.0 } },
  ],
  /* 零和矩阵：行=策略组合，列=玩家收益；用规整方阵 */
  ALG_T1_X_013: [
    [[1, -1], [-1, 1]],
    [[3, -3], [-3, 3], [1, -1]],
    [[2, -2, 0], [-2, 2, 0], [0, 0, 2]],
  ],
  /* 记忆复述：item 需 strength；boost 逻辑用乘法，确保数值型 */
  ALG_T1_K_007: [
    { item: { id: "m1", content: "x", strength: 0.5, recallCount: 1 }, rehearsalCount: 3, boostPerRehearsal: 0.1 },
    { id: "m1", content: "x", strength: 0.5, rehearsalCount: 3, boostPerRehearsal: 0.1 },
  ],
};

let ok = 0;
const bad = [];
console.log("=".repeat(84));
console.log("最后 6 条手工构造");
console.log("=".repeat(84));
for (const [id, cands] of Object.entries(CANDIDATES)) {
  let done = false;
  for (const c of cands) {
    const r = trial(id, c);
    if (r.ok) {
      SH[id] = c; ok++; done = true;
      console.log("  ✓ " + id + "  " + JSON.stringify(r.out).slice(0, 80));
      break;
    }
  }
  if (!done) {
    const last = trial(id, cands[cands.length - 1]);
    bad.push([id, last.err]);
    console.log("  ✗ " + id + "  " + last.err);
  }
}
fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p2 of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p2))) fs.copyFileSync(P, p2);
}
console.log();
console.log("修好:", ok, "/", Object.keys(CANDIDATES).length);
