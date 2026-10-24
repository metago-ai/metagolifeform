"use strict";
/**
 * analyze-22.cjs — 逐条判定剩余 22 条：输入可修 / 算法缺陷
 *
 * 判据：
 *   1) 只喂「最简但字段齐全」的输入，看错误是否指向**算法内部逻辑**
 *   2) 若错误涉及访问保留字/不存在的属性路径（如 .for / .of），判为算法缺陷
 *   3) 若错误是「X 不是函数」，判断该 X 是否本应由输入提供函数
 */
const fs = require("fs");
const path = require("path");
const T3 = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/t3impl";
const REG = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js");
const { bind } = require(path.join(T3, "bind.cjs"));
const SH = require(path.join(T3, "shapes.json"));
const B = bind(REG);

function hydrate(o) {
  if (Array.isArray(o)) return o.map(hydrate);
  if (o && typeof o === "object") {
    if (o.__map__) { const m = new Map(); (o.entries || []).forEach(([k, v]) => m.set(hydrate(k), hydrate(v))); return m; }
    if (o.__set__) return new Set((o.values || []).map(hydrate));
    if (typeof o.__regex__ === "string") { try { return new RegExp(o.__regex__, o.flags || ""); } catch (e) { return o.__regex__; } }
    if (typeof o.__fn__ === "string") { try { const fb = require(path.join(T3, "fn-bridge.cjs")); const f = fb.compile(o.__fn__); if (f) return f; } catch (e) {} return o.__fn__; }
    const c = {};
    for (const k of Object.keys(o)) c[k] = hydrate(o[k]);
    return c;
  }
  return o;
}
const ok = r => !!(r && (r.success || r.degraded));

const fails = [];
REG.getRegistry().forEach(e => {
  if (typeof e.handler !== "function" || (e.tier !== "T1" && e.tier !== "T2")) return;
  let r, err = null;
  try { r = B.run(e.id, hydrate(SH[e.id])); } catch (x) { err = x.message; }
  if (!ok(r)) fails.push({ e, err: String(err || (r && r.error) || "") });
});

/* 判定算法缺陷的特征 */
const SUSPECT_BUG = [
  { re: /\.(for|of|in)\b is not iterable/, why: "访问了保留字属性（.for/.of/.in），源码可能写错" },
  { re: /Cannot read properties of undefined \(reading 'undefined'\)/, why: "属性名为 undefined，源码拼写错误" },
  { re: /is not a function/, why: "把数据当函数调用（需确认是否本应由输入提供函数）" },
];

console.log("=".repeat(88));
console.log("剩余 22 条甄别");
console.log("=".repeat(88));

const suspend = [], inputIssue = [];
for (const { e, err } of fails) {
  const hit = SUSPECT_BUG.find(s => s.re.test(err));
  const src = Function.prototype.toString.call(e.handler);
  if (hit && hit.why.includes("保留字")) {
    suspend.push({ id: e.id, desc: e.description, err, why: hit.why, src: src.slice(0, 260) });
  } else {
    inputIssue.push({ id: e.id, desc: e.description, err });
  }
}

console.log();
console.log("【疑似算法自身缺陷】" + suspend.length + " 条");
suspend.forEach(s => {
  console.log("  " + s.id.padEnd(18) + s.desc);
  console.log("     错误: " + s.err);
  console.log("     判据: " + s.why);
  console.log("     源码: " + s.src.replace(/\n\s*/g, " ").slice(0, 180));
  console.log();
});

console.log("【输入形态问题】" + inputIssue.length + " 条");
inputIssue.forEach(s => console.log("  " + s.id.padEnd(18) + String(s.desc || "").slice(0, 24).padEnd(26) + s.err.slice(0, 48)));
