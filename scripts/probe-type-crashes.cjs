"use strict";
/** probe-type-crashes.cjs — 对真实入口逐个用对象输入试，确认哪些真崩 */
const ROOT = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine";
const m = require(ROOT);

const OBJ = { text: "元构测试", intent: "验证" };
const ARR = ["元构测试", "因为所以"];

const CASES = [];

/* AxiomValidator 中带参数的方法 */
for (const fn of ["checkProvenance", "checkClosure", "checkCompliance", "checkDataTraceability",
  "checkObjectivity", "checkCriticality", "checkFirstPrinciples", "checkAdversarialReview",
  "checkOutputIntegrity", "checkComplianceProactive"]) {
  if (typeof m.AxiomValidator[fn] === "function") {
    CASES.push(["AxiomValidator." + fn, () => m.AxiomValidator[fn](OBJ, OBJ)]);
  }
}

/* DecisionLock 各关卡 */
for (const fn of ["gateIVL", "gateILT", "gateOSG", "gateIntegrity"]) {
  if (typeof m.DecisionLock[fn] === "function") {
    CASES.push(["DecisionLock." + fn, () => m.DecisionLock[fn](OBJ, OBJ, OBJ)]);
  }
}

/* KMWIMemory */
try {
  const kmwi = new m.KMWIMemory("");
  CASES.push(["KMWIMemory.addKnowledge", () => kmwi.addKnowledge(OBJ, "c", [], "s")]);
  CASES.push(["KMWIMemory.addMemory", () => kmwi.addMemory(OBJ, "t", [], "s")]);
  CASES.push(["KMWIMemory.addWisdom", () => kmwi.addWisdom(OBJ, "d", "c", [], "s")]);
  CASES.push(["KMWIMemory.addIntuition", () => kmwi.addIntuition(OBJ, "e", [], "s")]);
} catch (e) { console.log("KMWI 实例化失败:", e.message.slice(0, 60)); }

/* Perception */
try {
  const perc = new m.Perception();
  CASES.push(["Perception.detectFromFeedback", () => perc.detectFromFeedback(OBJ)]);
  CASES.push(["Perception.detectFromFailure", () => perc.detectFromFailure(OBJ)]);
} catch (e) { console.log("Perception 实例化失败:", e.message.slice(0, 60)); }

const p = (x, n) => String(x).padEnd(n).slice(0, n);
console.log("=".repeat(84));
console.log("对象输入崩溃确认");
console.log("=".repeat(84));
console.log(p("入口", 42) + "结果");
console.log("-".repeat(84));
const bad = [];
for (const [name, fn] of CASES) {
  try {
    const r = fn();
    console.log(p(name, 42) + "OK " + (r && r.status ? r.status : ""));
  } catch (e) {
    bad.push([name, e.message.slice(0, 50)]);
    console.log(p(name, 42) + "崩 " + e.message.slice(0, 50));
  }
}
console.log();
console.log("-".repeat(84));
console.log(`共 ${CASES.length} 个入口 ｜ 崩溃 ${bad.length}`);
bad.forEach(([n, e]) => console.log("  ✗ " + n + " : " + e));
