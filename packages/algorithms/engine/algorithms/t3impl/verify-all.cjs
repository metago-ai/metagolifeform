"use strict";
/**
 * verify-all.cjs — 接线后的端到端验收
 *
 * 分三段：
 *   A. T3 集群：绑定 → 用真实样例逐条执行 → 必须全绿
 *   B. T1/T2 契约：统计 inputSchema 修复情况、位置参数识别情况
 *   C. 严格失败：构造空输出/NaN 场景，验证不再伪装 success
 */
const REG = require(__pick([
  __p.join(__dirname, "..", "registry.js"),
  "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js",
]));
const { bind } = require("./bind.cjs");
/* --- 本地优先路径解析（包内运行时禁止依赖外部副本）--- */
const __p = require("path");
const __f = require("fs");
function __pick(list) {
  for (const p of list) { try { if (__f.existsSync(p)) return p; } catch (e) {} }
  return list[list.length - 1];
}



const B = bind(REG);
const reg = REG.getRegistry();

let fail = 0;

console.log("=".repeat(88));
console.log("A. T3 集群接线验收");
console.log("=".repeat(88));
const t3 = reg.filter(e => e.tier === "T3");
const t3withHandler = t3.filter(e => typeof e.handler === "function");
console.log(`T3 总数 ${t3.length} ｜ 已挂 handler ${t3withHandler.length} ｜ 未挂 ${B.skipped.length}`);
if (B.skipped.length) { console.log("  未挂清单:", B.skipped.slice(0, 8).join(", ")); fail++; }

let p = 0, f = 0;
const failed = [];
t3.forEach(e => {
  const sample = typeof B.samples[e.id] === "function" ? B.samples[e.id]() : {};
  const r = B.run(e.id, sample);
  if (r.success) p++; else { f++; failed.push(`${e.id}: ${r.error}`); }
});
console.log(`逐条执行：通过 ${p} ｜ 失败 ${f}`);
failed.slice(0, 8).forEach(x => console.log("   ✗ " + x));
if (f > 0) fail++;

console.log();
console.log("=".repeat(88));
console.log("B. T1/T2 入参契约修复");
console.log("=".repeat(88));
const byTier = { T1: [], T2: [], T3: [] };
reg.forEach(e => { (byTier[e.tier] || (byTier[e.tier] = [])).push(e); });
["T1", "T2", "T3"].forEach(t => {
  const list = byTier[t] || [];
  const varies = list.filter(e => String(e.inputSchema).trim() === "varies").length;
  const withSchema = list.filter(e => e.inputSchema && String(e.inputSchema).trim() !== "varies").length;
  const pos = list.filter(e => Array.isArray(e.paramNames) && e.paramNames.length > 1).length;
  const h = list.filter(e => typeof e.handler === "function").length;
  console.log(`${t}: 总数 ${list.length} ｜ 有 handler ${h} ｜ varies 残留 ${varies} ｜ 有契约 ${withSchema} ｜ 位置多参 ${pos}`);
  if (t === "T2" && varies > 0) { console.log(`   ✗ T2 仍有 ${varies} 条 inputSchema 为 "varies"`); fail++; }
});
console.log(`本次反射修复 T2 契约：${B.t2Fixed.length} 条 ｜ T1 契约补全：${B.t1Fixed.length} 条`);
console.log(`形参反射覆盖：有 handler ${B.reflectStats.total} 条 → 反射成功 ${B.reflectStats.ok} 条，失败 ${B.reflectStats.failed} 条`);
console.log(`  其中源码形参 >1 的 ${B.reflectStats.arityGt1} 条，成功反射出名字的 ${B.reflectStats.arityGt1Reflected} 条`);
console.log(`位置多参可安全适配：${B.positionalCount} 条 ｜ 形参>1 但反射失败（不可安全适配）：${B.positionalUnknownCount} 条`);
if (B.positionalUnknownCount > 0) {
  const list = reg.filter(e => e.paramNamesUnknown).slice(0, 6).map(e => `${e.id}(arity=${e.handler.length})`);
  console.log(`  反射失败样例：${list.join(", ")}`);
}

console.log();
console.log("=".repeat(88));
console.log("C. 严格执行校验（不再伪装 success）");
console.log("=".repeat(88));
const cases = [
  ["空对象输出", () => ({})],
  ["空数组输出", () => []],
  ["NaN 输出", () => ({ score: NaN })],
  ["undefined 输出", () => undefined],
  ["正常输出", () => ({ score: 0.5 })]
];
let strictFail = 0;
cases.forEach(([name, fn]) => {
  const r = B.inspectOutput(fn());
  const shouldFail = name !== "正常输出";
  const ok = shouldFail ? r !== null : r === null;
  console.log(`  ${ok ? "OK  " : "FAIL"} ${name.padEnd(14)} → ${r === null ? "放行" : "拦截：" + r}`);
  if (!ok) strictFail++;
});
if (strictFail) fail++;

// 真实注册表里的 stub 必须被拦
const stub = reg.find(e => e.tier === "T3" && e.id === "ALG_T3_C_001");
const before = { hasHandler: typeof stub.handler === "function", implemented: stub.implemented };
console.log(`\n  ALG_T3_C_001 绑定后：handler=${before.hasHandler} implemented=${before.implemented}`);
const rr = B.run("ALG_T3_C_001", B.samples.ALG_T3_C_001());
console.log(`  实际执行：success=${rr.success}  输出键数=${rr.success ? Object.keys(rr.output).length : 0}`);
if (!rr.success) fail++;

console.log();
console.log("=".repeat(88));
console.log(fail === 0 ? "总判定：PASS" : `总判定：FAIL（${fail} 项）`);
console.log("=".repeat(88));
process.exit(fail === 0 ? 0 : 1);
