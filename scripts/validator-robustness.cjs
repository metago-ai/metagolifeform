"use strict";
/**
 * validator-robustness.cjs — 校验器鲁棒性扫描
 *
 * 思路：ATOM_RESPONSIVE_SCAN 的同类做法——对每个校验函数喂「应通过」与「应失败」两组输入，
 *     看它是否真的给出不同结论。若两组都返回同一 status，说明该校验是**恒定输出**（失效）。
 */
const E = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine";
const { AxiomValidator, DecisionLock } = require(E);

const p = (x, n) => String(x).padEnd(n).slice(0, n);

/* 应通过与应失败的两组样例 */
const GOOD = "元构体系包含 38 条公理，因为耦生度大于 1 所以系统处于超导态，依据是定理推导。来源：附录卷。本结论完整，无占位符，包含批判性分析：该结论在边界条件下可能不成立。";
const BAD = "TODO 这里待补充 XXX";

console.log("=".repeat(88));
console.log("AxiomValidator 14 项校验鲁棒性");
console.log("=".repeat(88));

const CHECKS = [
  "checkProvenance", "checkClosure", "checkMetaEvolution", "checkBoundaryAwareness",
  "checkEndogenousCreation", "checkMetaMetaEvolution", "checkCreationEvolution",
  "checkCompliance", "checkObjectivity", "checkCriticality", "checkComplianceProactive",
  "checkDataTraceability", "checkFirstPrinciples", "checkAdversarialReview", "checkOutputIntegrity",
];

let constOut = 0, errors = 0, differentiated = 0;
const rows = [];

for (const fn of CHECKS) {
  if (typeof AxiomValidator[fn] !== "function") { rows.push([fn, "不存在", "-", "-"]); continue; }
  let sGood, sBad, err = "";
  try { sGood = AxiomValidator[fn](GOOD, GOOD).status; } catch (e) { err = "GOOD:" + e.message.slice(0, 30); }
  try { sBad = AxiomValidator[fn](BAD, BAD).status; } catch (e) { err += " BAD:" + e.message.slice(0, 30); }
  if (err) { errors++; rows.push([fn, "抛错", err.slice(0, 40), ""]); continue; }
  if (sGood === sBad) { constOut++; rows.push([fn, "恒定", sGood, sBad]); }
  else { differentiated++; rows.push([fn, "有区分", sGood, sBad]); }
}

console.log(p("校验函数", 28) + p("判定", 10) + p("合规输入", 10) + "违规输入");
console.log("-".repeat(88));
rows.forEach(r => console.log(p(r[0], 28) + p(r[1], 10) + p(r[2], 10) + r[3]));

console.log();
console.log(`有区分 ${differentiated} ｜ 恒定输出 ${constOut} ｜ 抛错 ${errors}`);

/* 边界输入不崩溃测试 */
console.log();
console.log("=".repeat(88));
console.log("边界输入不崩溃测试（空串 / 对象 / 超长 / 特殊字符）");
console.log("=".repeat(88));
const EDGE = [
  ["空串", ""],
  ["对象", { a: 1 }],
  ["数组", [1, 2, 3]],
  ["null", null],
  ["undefined", undefined],
  ["超长", "元".repeat(5000)],
  ["特殊字符", "<script>alert(1)</script> ' OR 1=1 --"],
];
let crash = 0;
for (const [label, v] of EDGE) {
  let ok = true, msg = "";
  try {
    const r = AxiomValidator.validateAll(v, { input: v });
    if (!Array.isArray(r)) { ok = false; msg = "返回非数组"; }
  } catch (e) { ok = false; msg = e.message.slice(0, 50); }
  if (!ok) crash++;
  console.log("  " + (ok ? "✓" : "✗") + " " + p(label, 12) + (msg || "不崩溃"));
}

console.log();
console.log("=".repeat(88));
console.log("DecisionLock 鲁棒性");
console.log("=".repeat(88));
(async () => {
  for (const [label, v] of EDGE) {
    let ok = true, msg = "";
    try {
      const r = await DecisionLock.validate(v, v, v);
      if (!r || !Array.isArray(r.gates)) { ok = false; msg = "返回结构异常"; }
      else msg = `gates=${r.gates.length} passed=${r.passed}`;
    } catch (e) { ok = false; msg = e.message.slice(0, 50); }
    if (!ok) crash++;
    console.log("  " + (ok ? "✓" : "✗") + " " + p(label, 12) + msg);
  }
  console.log();
  console.log("-".repeat(88));
  console.log(`总判定：${crash === 0 ? "PASS（全部边界输入不崩溃）" : "需关注（" + crash + " 项崩溃）"}`);
})();
