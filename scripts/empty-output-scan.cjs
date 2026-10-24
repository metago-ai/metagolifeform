"use strict";
/**
 * empty-output-scan.cjs — 找出「样例输入下输出为空壳」的算法
 *
 * 判定：一个算法的样例输出里，若**所有**业务字段都是
 *   空数组 [] / null / 空对象 {} / 空字符串 ""
 * 则认为该算法在样例下产不出任何实质内容 —— 可能是输入没到位，也可能是实现失效。
 *
 * 注意：有些算法「空结果」是正确结论（如无异常→空告警列表），
 *      所以这里只做**清单**，不直接判缺陷；需要人工/二次确认。
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
    if (o.__map__) return new Map(o.entries || []);
    const c = {};
    for (const k of Object.keys(o)) c[k] = hydrate(o[k]);
    return c;
  }
  return o;
}

function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "object" && !(v instanceof Map)) return Object.keys(v).length === 0;
  return false;
}

const hollow = [], filled = [];
let skip = 0;

REG.getRegistry().forEach(e => {
  if (typeof e.handler !== "function" || !SH[e.id]) return;
  let r;
  try { r = B.run(e.id, hydrate(SH[e.id])); } catch (err) { return; }
  if (!r) return;
  if (!r.success) { skip++; return; }

  const out = r.output || {};
  const keys = Object.keys(out).filter(k => !k.startsWith("__") && k !== "provenance");
  if (!keys.length) { skip++; return; }

  const emptyCount = keys.filter(k => isEmpty(out[k])).length;
  if (emptyCount === keys.length) {
    hollow.push({ id: e.id, desc: String(e.description || "").slice(0, 30), keys: keys.slice(0, 5) });
  } else {
    filled.push(e.id);
  }
});

console.log("=".repeat(86));
console.log("空壳输出扫描：样例输入下所有业务字段皆空");
console.log("=".repeat(86));
console.log(`有实质输出 ${filled.length} 条 ｜ 空壳 ${hollow.length} 条 ｜ 跳过 ${skip} 条`);
console.log();

if (hollow.length) {
  console.log("【空壳输出清单（需逐条确认：是正确结论还是实现失效）】");
  hollow.forEach(h => {
    console.log("  " + h.id.padEnd(18) + h.desc.padEnd(24) + JSON.stringify(h.keys));
  });
}

console.log();
console.log("-".repeat(86));
console.log(`空壳率：${(hollow.length / (hollow.length + filled.length) * 100).toFixed(1)}%`);
console.log(hollow.length === 0 ? "总判定：PASS（无空壳输出）"
  : `总判定：清单已出（${hollow.length} 条待确认）`);
