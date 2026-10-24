"use strict";
/**
 * scan-type-assumptions.cjs — 系统性扫描「假设入参是字符串/数组」的代码
 *
 * 已发现同类缺陷 4 个：DEF-016 / DEF-017 / DEF-019。逐个碰太慢，
 * 改为静态扫描 + 动态验证两步：
 *   1. 静态：找出 `param.方法()` 且 param 是函数形参、方法属字符串/数组专有的位置
 *   2. 动态：对找到的每个函数，用「对象」作为入参试调用，看是否崩溃
 */
const fs = require("fs");
const path = require("path");

const ROOT = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine";

/* 字符串/数组专有方法（对象没有） */
const STR_METHODS = ["substring", "toLowerCase", "toUpperCase", "trim", "split", "startsWith",
  "endsWith", "charAt", "charCodeAt", "padStart", "padEnd", "match", "replaceAll", "normalize"];
const ARR_METHODS = ["map", "filter", "reduce", "forEach", "some", "every", "find", "sort",
  "slice", "concat", "join", "flat", "push", "includes"];

const files = [];
(function walk(d) {
  let ents;
  try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
  for (const e of ents) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") walk(p); }
    else if (e.name.endsWith(".js")) files.push(p);
  }
})(ROOT);

console.log("=".repeat(88));
console.log("类型假设静态扫描");
console.log("=".repeat(88));
console.log("扫描文件数:", files.length);
console.log();

const hits = [];
for (const f of files) {
  let t;
  try { t = fs.readFileSync(f, "utf8"); } catch (e) { continue; }
  const lines = t.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // 形如 xxx.substring( / xxx.split( 等
    const m = new RegExp("\\b([a-zA-Z_$][\\w$]*)\\s*\\.\\s*(" + STR_METHODS.join("|") + ")\\s*\\(").exec(l);
    if (!m) continue;
    const v = m[1];
    // 排除常见安全来源
    if (/(String|JSON|Array|Object|Math|Number|Boolean|Date|RegExp|console|process|fs|path|os|crypto)\./.test(l)) continue;
    if (l.includes("String(" + v) || l.includes(v + " ||") || l.includes(v + "?.") ||
        l.includes("typeof " + v) || l.includes("&& " + v) || l.includes(v + " &&")) continue;
    hits.push({ file: path.relative(ROOT, f), line: i + 1, param: v, method: m[2], code: l.trim().slice(0, 110) });
  }
}

console.log("疑似直接调用字符串方法的行:", hits.length);
const byFile = {};
hits.forEach(h => { (byFile[h.file] = byFile[h.file] || []).push(h); });
Object.entries(byFile).sort((a, b) => b[1].length - a[1].length).forEach(([f, arr]) => {
  console.log(`\n● ${f}（${arr.length} 处）`);
  arr.slice(0, 8).forEach(h => console.log(`   L${String(h.line).padEnd(5)} ${h.param}.${h.method}()  ${h.code.slice(0, 78)}`));
  if (arr.length > 8) console.log(`   … 其余 ${arr.length - 8} 处`);
});

/* 动态验证：对已归一化的入口做对比 */
console.log();
console.log("=".repeat(88));
console.log("动态验证：关键校验入口传对象 vs 传字符串");
console.log("=".repeat(88));

const mod = require(ROOT);
const OBJ = { text: "元构测试", list: [1, 2] };
const STR = "元构测试，因为耦生度大于1所以超导。依据是定理。";

const ENTRIES = [
  ["AxiomValidator.validateAll", (v) => mod.AxiomValidator.validateAll(v, { input: v })],
  ["AxiomValidator.checkProvenance", (v) => mod.AxiomValidator.checkProvenance(v, v)],
  ["AxiomValidator.checkOutputIntegrity", (v) => mod.AxiomValidator.checkOutputIntegrity(v)],
  ["AxiomValidator.checkObjectivity", (v) => mod.AxiomValidator.checkObjectivity(v)],
  ["AxiomValidator.checkCriticality", (v) => mod.AxiomValidator.checkCriticality(v)],
  ["AxiomValidator.checkFirstPrinciples", (v) => mod.AxiomValidator.checkFirstPrinciples(v)],
  ["AxiomValidator.checkAdversarialReview", (v) => mod.AxiomValidator.checkAdversarialReview(v)],
  ["AxiomValidator.checkDataTraceability", (v) => mod.AxiomValidator.checkDataTraceability(v, v)],
  ["DecisionLock.gateIVL", (v) => mod.DecisionLock.gateIVL(v, v, v)],
  ["DecisionLock.gateILT", (v) => mod.DecisionLock.gateILT(v, v)],
  ["DecisionLock.gateOSG", (v) => mod.DecisionLock.gateOSG(v)],
  ["DecisionLock.gateIntegrity", (v) => mod.DecisionLock.gateIntegrity(v)],
];

const p = (x, n) => String(x).padEnd(n).slice(0, n);
let bad = 0;
console.log(p("入口", 40) + p("字符串", 10) + "对象");
console.log("-".repeat(88));
for (const [name, fn] of ENTRIES) {
  let sOk = "OK", oOk = "OK";
  try { fn(STR); } catch (e) { sOk = "崩:" + e.message.slice(0, 20); }
  try { fn(OBJ); } catch (e) { oOk = "崩:" + e.message.slice(0, 26); bad++; }
  console.log(p(name, 40) + p(sOk, 10) + oOk);
}

console.log();
console.log("-".repeat(88));
console.log(`静态疑似 ${hits.length} 处 ｜ 动态崩溃 ${bad} 个入口`);
console.log(bad === 0 ? "动态判定：PASS（关键入口对象输入均不崩溃）" : "动态判定：需关注");
