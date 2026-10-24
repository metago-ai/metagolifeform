"use strict";
/**
 * t12-full-scan.cjs — T1/T2 全量 700 条算法可调性核查
 *
 * 此前只验证了「位置多参型」474 条（wire-shapes）。
 * 本脚本核查 T1/T2 全部条目，包括单参对象型、Map型、字符串型等，
 * 确保没有「没被任何测试覆盖」的算法。
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

const reg = REG.getRegistry();
const t12 = reg.filter(e => e.tier === "T1" || e.tier === "T2");
const t3 = reg.filter(e => e.tier === "T3");

console.log("=".repeat(82));
console.log("T1/T2 全量可调性核查");
console.log("=".repeat(82));
console.log(`注册表 ${reg.length} 条 ｜ T3 ${t3.length} 条 ｜ T1/T2 ${t12.length} 条`);
console.log();

const hasHandler = t12.filter(e => typeof e.handler === "function");
const hasShape = t12.filter(e => SH[e.id]);
const tested = [];

let ok = 0, noShape = [], noHandler = [], execFail = [];

for (const e of t12) {
  if (typeof e.handler !== "function") { noHandler.push(e.id); continue; }
  if (!SH[e.id]) { noShape.push(e.id); continue; }
  let r;
  try { r = B.run(e.id, hydrate(SH[e.id])); } catch (err) { execFail.push([e.id, "抛错: " + String(err.message).slice(0, 40)]); continue; }
  tested.push(e.id);
  if (r && (r.success || r.degraded)) ok++;
  else execFail.push([e.id, String((r && r.error) || "无结果").slice(0, 50)]);
}

console.log(`有 handler        ${String(hasHandler.length).padStart(4)} / ${t12.length}`);
console.log(`有样例（可测）    ${String(hasShape.length).padStart(4)} / ${t12.length}`);
console.log(`实跑成功          ${String(ok).padStart(4)} / ${tested.length}`);
console.log();

if (noHandler.length) {
  console.log(`【无 handler】${noHandler.length} 条`);
  noHandler.slice(0, 20).forEach(x => console.log("  " + x));
  console.log();
}
if (noShape.length) {
  console.log(`【无样例（未被任何测试覆盖）】${noShape.length} 条`);
  noShape.slice(0, 30).forEach(x => {
    const e = reg.find(y => y.id === x);
    console.log("  " + x.padEnd(18) + String(e && e.description || "").slice(0, 30) +
      "  形参=" + JSON.stringify(e && e.paramNames));
  });
  if (noShape.length > 30) console.log("  … 其余 " + (noShape.length - 30));
  console.log();
}
if (execFail.length) {
  console.log(`【实跑失败】${execFail.length} 条`);
  execFail.slice(0, 20).forEach(([id, err]) => console.log("  " + id.padEnd(18) + err));
  console.log();
}

console.log("-".repeat(82));
const uncovered = noShape.length + noHandler.length;
console.log(uncovered === 0 && execFail.length === 0
  ? `总判定：PASS（T1/T2 ${t12.length} 条全部可调）`
  : `总判定：需关注（未覆盖 ${uncovered} 条，失败 ${execFail.length} 条）`);
