"use strict";
/**
 * hollow-scalar-solve.cjs — 行为式求解：对空壳算法逐个试「数组参数→标量」
 *
 * 只做一件事：找出让空壳变非空的最小改动。
 * 比静态启发式可靠 —— 以「输出是否变得有内容」为判据，而非猜类型。
 */
const fs = require("fs");
const path = require("path");
const T3 = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/t3impl";
const REG = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js");
const { bind } = require(path.join(T3, "bind.cjs"));
const SHAPES_P = path.join(T3, "shapes.json");
const SH = JSON.parse(fs.readFileSync(SHAPES_P, "utf8"));
const B = bind(REG);

function hydrate(o) {
  if (Array.isArray(o)) return o.map(hydrate);
  if (o && typeof o === "object") {
    if (o.__map__) return new Map(o.entries || []);
    const c = {};
    for (const k of Object.keys(o)) c[k] = hydrate(o[k]);
    return c;
  }
  return o;
}
const isEmpty = v => v === null || v === undefined
  || (Array.isArray(v) && !v.length)
  || (typeof v === "string" && !v.trim())
  || (typeof v === "object" && !(v instanceof Map) && !Object.keys(v).length);
function hollow(out) {
  const ks = Object.keys(out || {}).filter(k => !k.startsWith("__") && k !== "provenance");
  if (!ks.length) return true;
  return ks.every(k => isEmpty(out[k]));
}
const clone = o => JSON.parse(JSON.stringify(o));

/* 找空壳算法 */
const hollowIds = [];
REG.getRegistry().forEach(e => {
  if (typeof e.handler !== "function" || !SH[e.id]) return;
  let r;
  try { r = B.run(e.id, hydrate(SH[e.id])); } catch (err) { return; }
  if (r && r.success && hollow(r.output)) hollowIds.push(e.id);
});

/* 标量化候选 */
function scalarize(v) {
  if (!Array.isArray(v) || !v.length) return null;
  const e = v[0];
  if (typeof e === "number") return v[0];
  if (typeof e === "string") return v[0];
  if (e && typeof e === "object" && "id" in e) return e.id;
  if (e && typeof e === "object" && "value" in e) return e.value;
  return null;
}

console.log("=".repeat(84));
console.log("空壳行为求解：找出让输出变非空的最小改动");
console.log("=".repeat(84));
console.log(`空壳 ${hollowIds.length} 条`);
console.log();

let solved = 0;
const stillHollow = [];

for (const id of hollowIds) {
  const base = clone(SH[id]);
  const keys = Object.keys(base);
  let fixed = null;

  // 单参数改动
  for (const k of keys) {
    const sv = scalarize(base[k]);
    if (sv === null) continue;
    const trial = clone(base);
    trial[k] = sv;
    let r;
    try { r = B.run(id, hydrate(trial)); } catch (e) { continue; }
    if (r && r.success && !hollow(r.output)) { fixed = { k, from: base[k], to: sv, mode: "标量化" }; break; }
  }

  // 双参数组合（如 values + lag）
  if (!fixed) {
    const cands = keys.filter(k => scalarize(base[k]) !== null);
    for (let i = 0; i < cands.length && !fixed; i++) {
      for (let j = i + 1; j < cands.length && !fixed; j++) {
        const trial = clone(base);
        trial[cands[i]] = scalarize(base[cands[i]]);
        trial[cands[j]] = scalarize(base[cands[j]]);
        let r;
        try { r = B.run(id, hydrate(trial)); } catch (e) { continue; }
        if (r && r.success && !hollow(r.output)) {
          fixed = { k: cands[i] + "+" + cands[j], from: [base[cands[i]], base[cands[j]]], to: [trial[cands[i]], trial[cands[j]]], mode: "双参数标量化" };
        }
      }
    }
  }

  const e = REG.getRegistry().find(x => x.id === id);
  if (fixed) {
    const trial = clone(base);
    if (fixed.k.includes("+")) {
      const [a, b] = fixed.k.split("+");
      trial[a] = fixed.to[0]; trial[b] = fixed.to[1];
    } else {
      trial[fixed.k] = fixed.to;
    }
    SH[id] = trial;
    solved++;
    const t = cloned(trial);
    function cloned(x) { return JSON.parse(JSON.stringify(x)); }
    console.log("  ✓ " + id.padEnd(18) + fixed.mode + "  " + fixed.k + "  " + JSON.stringify(fixed.from).slice(0, 26) + " → " + JSON.stringify(fixed.to).slice(0, 26));
  } else {
    stillHollow.push({ id, desc: String(e && e.description || "").slice(0, 30) });
  }
}

fs.writeFileSync(SHAPES_P, JSON.stringify(SH, null, 1), "utf8");
for (const p of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p))) fs.copyFileSync(SHAPES_P, p);
}

console.log();
console.log("-".repeat(84));
console.log(`已修复 ${solved} 条 ｜ 仍空壳 ${stillHollow.length} 条`);
stillHollow.forEach(x => console.log("  ? " + x.id.padEnd(18) + x.desc));
