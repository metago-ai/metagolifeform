"use strict";
/**
 * atom-hollow-scan.cjs — 原子层空壳扫描（把算法层有效的方法用到原子层）
 *
 * 对 587 条工厂生成的原子，用一组通用数值输入执行，
 * 检查输出是否所有业务字段都为空壳。
 */
const path = require("path");
const B = "D:/metago-build/outbound/v36.10.0/packages/engine/atoms";
const V = require(path.join(B, "contract-validator.cjs"));
const F = require(path.join(B, "atom-factory.cjs"));
const E = require(path.join(B, "engine.cjs"));

function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
}

function hollowOf(out) {
  if (!out || typeof out !== "object") return null;
  const keys = Object.keys(out).filter(k => !k.startsWith("__") && k !== "provenance" && k !== "reason");
  if (!keys.length) return null;
  const emp = keys.filter(k => isEmpty(out[k]));
  return emp.length === keys.length ? keys : null;
}

/* 多组差异极大的输入 */
const INPUTS = [
  { items: [1, 2, 3, 4, 5], values: [0.8, 0.6, 0.2, 0.9], a: 1.2, b: 3.4 },
  { items: [100, 200], values: [0.99, 0.01], a: 999, b: -5 },
  { data: [0.5, 0.5], text: "元构测试文本内容", n: 3 },
];

const hollowAll = [], hollowSome = [], fine = [];
const allIds = Object.keys(V.CONTRACTS).filter(id =>
  !F.CONSTRAINT_IDS.has(id) && !F.EXTERNAL_NEEDED.has(id));

for (const id of allIds) {
  const fn = F.make(id);
  if (!fn) continue;
  let anyFilled = false, anyOk = false, keysSeen = null;
  for (const inp of INPUTS) {
    let r;
    try { r = fn(inp); } catch (e) { continue; }
    if (!r || (r.ok === false && !r.value)) continue;
    anyOk = true;
    const h = hollowOf(r);
    if (h) { keysSeen = keysSeen || h; }
    else { anyFilled = true; break; }
  }
  if (!anyOk) continue;
  if (anyFilled) fine.push(id);
  else if (keysSeen) hollowAll.push({ id, keys: keysSeen.slice(0, 4) });
}

console.log("=".repeat(84));
console.log("原子层空壳扫描");
console.log("=".repeat(84));
console.log(`可执行原子 ${fine.length + hollowAll.length} 条`);
console.log(`  有实质输出  ${String(fine.length).padStart(4)} 条`);
console.log(`  三组输入皆空壳 ${String(hollowAll.length).padStart(4)} 条`);
console.log(`  空壳率 ${(hollowAll.length / (fine.length + hollowAll.length) * 100).toFixed(1)}%`);
console.log();
if (hollowAll.length) {
  console.log("【空壳原子】");
  hollowAll.slice(0, 40).forEach(h => console.log("  " + h.id.padEnd(30) + JSON.stringify(h.keys)));
  if (hollowAll.length > 40) console.log("  … 其余 " + (hollowAll.length - 40));
}
console.log();
console.log(hollowAll.length === 0 ? "总判定：PASS（原子层无空壳）"
  : `总判定：需关注（${hollowAll.length} 条空壳原子）`);
process.exitCode = hollowAll.length === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
