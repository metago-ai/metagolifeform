"use strict";
/**
 * find-hangs.cjs — 找出「在样例输入下会死循环/极慢」的算法
 *
 * 每个算法单次执行的耗时若超过阈值，判为疑似挂死。
 * 这类算法是「用错误输入跑」时的最大风险：不是报错，而是卡死进程。
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

const SLOW_MS = 300;
const slow = [];
const reg = REG.getRegistry();
const t12 = reg.filter(e => (e.tier === "T1" || e.tier === "T2") && typeof e.handler === "function");

console.log("=".repeat(78));
console.log("慢/挂死算法探测（阈值 " + SLOW_MS + "ms）");
console.log("=".repeat(78));
console.log("共", t12.length, "条");

let i = 0;
for (const e of t12) {
  i++;
  const inp = SH[e.id];
  if (inp === undefined) continue;
  const t0 = Date.now();
  let err = null;
  try { B.run(e.id, hydrate(inp)); } catch (ex) { err = String(ex.message).slice(0, 40); }
  const ms = Date.now() - t0;
  if (ms >= SLOW_MS) slow.push({ id: e.id, ms, desc: String(e.description || "").slice(0, 26), err });
  if (i % 100 === 0) process.stderr.write("  ..." + i + "\n");
}

console.log();
console.log(`慢的 ${slow.length} 条：`);
slow.sort((a, b) => b.ms - a.ms).slice(0, 30).forEach(s =>
  console.log("  " + String(s.ms).padStart(6) + "ms  " + s.id.padEnd(18) + s.desc + (s.err ? "  [抛错]" : "")));
console.log();
console.log(slow.length === 0 ? "总判定：PASS（无慢算法）" : `总判定：需关注（${slow.length} 条慢）`);

// 退出码（门禁语义）：slow.length === 0 ? 0 : 1
process.exit(slow.length === 0 ? 0 : 1);
