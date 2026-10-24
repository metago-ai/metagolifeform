"use strict";
/**
 * null-nan-scan.cjs — 扫描「success=true 但输出含 null/NaN/undefined」的算法
 *
 * 之前的空输出扫描只看「输出是否为空对象/空数组」，NaN 扫描只看顶层数值，
 * 漏掉了「数组里全是 null」「嵌套字段是 NaN」这类污染。
 * 这类输出对调用方毫无意义，但所有既有检查都放行。
 */
const path = require("path");
const T3 = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/t3impl";
const REG = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js");
const { bind } = require(path.join(T3, "bind.cjs"));
const SH = require(path.join(T3, "shapes.json"));
const B = bind(REG);

function hydrate(o) {
  if (Array.isArray(o)) return o.map(hydrate);
  if (o && typeof o === "object") {
    if (o.__map__) { const m = new Map(); (o.entries || []).forEach(([k, v]) => m.set(k, hydrate(v))); return m; }
    if (o.__set__) return new Set((o.values || []).map(hydrate));
    if (typeof o.__regex__ === "string") { try { return new RegExp(o.__regex__, o.flags || ""); } catch (e) { return o.__regex__; } }
    if (typeof o.__fn__ === "string") return o.__fn__;
    const c = {};
    for (const k of Object.keys(o)) c[k] = hydrate(o[k]);
    return c;
  }
  return o;
}

/** 递归统计输出里的 NaN / null / undefined / Infinity */
function inspect(v, pathStr, acc, depth) {
  if (depth > 6) return;
  if (typeof v === "number") {
    if (Number.isNaN(v)) acc.nan.push(pathStr);
    else if (!Number.isFinite(v)) acc.inf.push(pathStr);
    return;
  }
  if (v === null) { acc.nullv.push(pathStr); return; }
  if (v === undefined) { acc.undef.push(pathStr); return; }
  if (Array.isArray(v)) {
    if (v.length === 0) return;
    const allBad = v.every(x => x === null || x === undefined || (typeof x === "number" && !Number.isFinite(x)));
    if (allBad && v.length >= 2) acc.allBad.push(pathStr + `[${v.length}]`);
    v.slice(0, 20).forEach((x, i) => inspect(x, `${pathStr}[${i}]`, acc, depth + 1));
    return;
  }
  if (typeof v === "object") {
    for (const k of Object.keys(v)) inspect(v[k], pathStr ? pathStr + "." + k : k, acc, depth + 1);
  }
}

const p = (x, n) => String(x).padEnd(n).slice(0, n);
console.log("=".repeat(94));
console.log("null / NaN / Infinity 污染全量扫描");
console.log("=".repeat(94));

const reg = REG.getRegistry();
let checked = 0, dirty = 0;
const rows = [];

for (const e of reg) {
  if (typeof e.handler !== "function") continue;
  const shape = SH[e.id];
  if (shape === undefined) continue;
  let r;
  try { r = B.run(e.id, hydrate(shape)); } catch (err) { continue; }
  if (!r || !(r.success || r.degraded)) continue;
  checked++;
  const acc = { nan: [], inf: [], nullv: [], undef: [], allBad: [] };
  inspect(r.output, "", acc, 0);
  const problems = acc.nan.length + acc.inf.length + acc.allBad.length;
  if (problems > 0) {
    dirty++;
    rows.push({ id: e.id, desc: String(e.description || "").slice(0, 26),
      nan: acc.nan, inf: acc.inf, allBad: acc.allBad, nullv: acc.nullv.length });
  }
}

console.log(`已检查 ${checked} 条（success 的）｜ 有 NaN/Inf/全 null 的 ${dirty} 条`);
console.log();
if (rows.length) {
  console.log(p("算法 ID", 18) + p("描述", 28) + "问题");
  console.log("-".repeat(94));
  rows.slice(0, 40).forEach(r => {
    const parts = [];
    if (r.nan.length) parts.push("NaN×" + r.nan.length + " 如 " + r.nan[0]);
    if (r.inf.length) parts.push("Inf×" + r.inf.length + " 如 " + r.inf[0]);
    if (r.allBad.length) parts.push("全空数组 " + r.allBad[0]);
    console.log(p(r.id, 18) + p(r.desc, 28) + parts.join(" ; ").slice(0, 46));
  });
  if (rows.length > 40) console.log("… 其余 " + (rows.length - 40));
}

console.log();
console.log("-".repeat(94));
console.log(dirty === 0 ? "总判定：PASS" : `总判定：需关注（${dirty} 条输出被污染）`);
process.exitCode = dirty === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
