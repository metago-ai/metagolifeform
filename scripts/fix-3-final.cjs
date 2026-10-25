"use strict";
/** fix-3-final.cjs — 最后 3 条（已读到完整实现） */
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
  try { r = B.run(id, hydrate(JSON.parse(JSON.stringify(shape)))); } catch (e) { return { ok: false, err: e.message.slice(0, 60) }; }
  if (!r || !(r.success || r.degraded)) return { ok: false, err: String(r && r.error).slice(0, 60) };
  if (polluted(r.output)) return { ok: false, err: "污染: " + JSON.stringify(r.output).slice(0, 60) };
  return { ok: true, out: r.output };
}

const C = {
  /* 矩阵元素必须是对象 {rowPlayer, colPlayer} */
  ALG_T1_X_013: [
    [[{ rowPlayer: 1, colPlayer: -1 }, { rowPlayer: -2, colPlayer: 2 }],
     [{ rowPlayer: 3, colPlayer: -3 }, { rowPlayer: -4, colPlayer: 4 }]],
    [[{ rowPlayer: 2, colPlayer: -2 }, { rowPlayer: -2, colPlayer: 2 }]],
  ],
  /* 单参：signals 与 context 需在同一对象里；context 需 riskTolerance / timePressure */
  ALG_T2_I_020: [
    { signals: [{ strength: 0.9 }, { strength: 0.85 }, { strength: 0.95 }],
      context: { riskTolerance: 0.2, timePressure: 0.8 } },
  ],
  /* 单参：idea + context{existing, constraints}；idea 需 impact */
  ALG_T2_H_020: [
    { idea: { id: "i1", content: "元构新方案", impact: 0.8, novelty: 0.8 },
      context: { existing: [{ id: "e1", content: "旧方案", novelty: 0.4 }], constraints: ["预算", "工期"] } },
  ],
};

let ok = 0;
const bad = [];
console.log("=".repeat(80));
console.log("最后 3 条");
console.log("=".repeat(80));
for (const [id, cands] of Object.entries(C)) {
  let done = false, lastErr = "";
  for (const c of cands) {
    const r = trial(id, c);
    if (r.ok) { SH[id] = c; ok++; done = true; console.log("  ✓ " + id.padEnd(16) + JSON.stringify(r.out).slice(0, 72)); break; }
    lastErr = r.err;
  }
  if (!done) { bad.push([id, lastErr]); console.log("  ✗ " + id.padEnd(16) + lastErr); }
}
fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p2 of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.12.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p2))) fs.copyFileSync(P, p2);
}
console.log();
console.log("修好:", ok, "/", Object.keys(C).length);
