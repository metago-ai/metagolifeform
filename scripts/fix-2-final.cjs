"use strict";
/** fix-2-final.cjs — 最后 2 条（已找到辅助函数的精确定义） */
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
  try { r = B.run(id, hydrate(JSON.parse(JSON.stringify(shape)))); } catch (e) { return { ok: false, err: e.message.slice(0, 62) }; }
  if (!r || !(r.success || r.degraded)) return { ok: false, err: String(r && r.error).slice(0, 62) };
  if (polluted(r.output)) return { ok: false, err: "污染: " + JSON.stringify(r.output).slice(0, 66) };
  return { ok: true, out: r.output };
}

const C = {
  /* fuseIntuitionSignals 读 s.source / s.strength / s.confidence
     assessIntuitionConfidence 读 signals.map(s=>s.strength)
     context 需 riskTolerance / timePressure */
  ALG_T2_I_020: [
    {
      signals: [
        { source: "pattern", strength: 0.9, confidence: 0.9 },
        { source: "memory", strength: 0.85, confidence: 0.8 },
        { source: "emotion", strength: 0.8, confidence: 0.85 },
      ],
      context: { riskTolerance: 0.2, timePressure: 0.8 },
    },
  ],
  /* assessIdeaNovelty 读 idea.content（字符串, toLowerCase）与 existing[].content
     analyzeIdeaFeasibility 读 idea.feasibility 与 constraints.resources/technology/time
     还读 idea.impact */
  ALG_T2_H_020: [
    {
      idea: { id: "i1", content: "元构 新 方案 创新", feasibility: 0.9, impact: 0.8, novelty: 0.8 },
      context: {
        existing: [{ id: "e1", content: "旧 方案 常规" }, { id: "e2", content: "另外 的 思路" }],
        constraints: { resources: 1.0, technology: 1.0, time: 1.0 },
      },
    },
  ],
};

let ok = 0;
console.log("=".repeat(78));
console.log("最后 2 条");
console.log("=".repeat(78));
for (const [id, cands] of Object.entries(C)) {
  let done = false, lastErr = "";
  for (const c of cands) {
    const r = trial(id, c);
    if (r.ok) { SH[id] = c; ok++; done = true; console.log("  ✓ " + id.padEnd(16) + JSON.stringify(r.out).slice(0, 76)); break; }
    lastErr = r.err;
  }
  if (!done) console.log("  ✗ " + id.padEnd(16) + lastErr);
}
fs.writeFileSync(P, JSON.stringify(SH, null, 1), "utf8");
for (const p2 of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p2))) fs.copyFileSync(P, p2);
}
console.log();
console.log("修好:", ok, "/", Object.keys(C).length);
