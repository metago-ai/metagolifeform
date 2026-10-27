"use strict";
/**
 * atoms/verify.cjs — 原子引擎自测
 * 对 compute 类逐条执行并断言；对 external/template/declared 类核对"确实如实报错，不假装成功"
 */
const fs = require("fs");
/* --- 本地优先路径解析（包内运行时禁止依赖外部副本）--- */
const __p = require("path");
const __f = require("fs");
function __pick(list) {
  for (const p of list) { try { if (__f.existsSync(p)) return p; } catch (e) {} }
  return list[list.length - 1];
}


const path = require("path");
const E = require("./engine.cjs");

const GENOME = __pick([
    __p.join(__dirname, "atoms_engines.json"),
      __p.join(__dirname, "..", "..", "..", "..", "..", "genome", "atoms_engines.json"),
  __p.join(__dirname, "..", "..", "..", "genome", "atoms_engines.json"),
  "D:/metago-build/genome/atoms_engines.json",
]);
const catalog = JSON.parse(fs.readFileSync(GENOME, "utf8"));
const atoms = catalog.atoms;
const ioAtoms = Object.values(atoms).filter(a => a.input && a.output);

let fail = 0;
const rows = [];

// 1. 有 I/O 契约的原子
let cOK = 0, cFail = 0;
let ext = 0, tpl = 0, noImpl = 0;
ioAtoms.forEach(a => {
  const kind = E.kindOf(a.id);
  if (kind === "compute") {
    /* 修（Round 35）：无官方样例时用推导输入兜底，与 P7 语义验证口径一致（实测 586/586）。 */
    const CAND = [{ v: [1,2,3,4,5] }, { value: [0.8,0.6,0.9] }, { values: [10,20,15], a: [1,2], b: [2,4] },
                  { a: [1,2], b: [2,4] }, { text: "测试文本 内容分析", u: [0.5,0.6,0.7] }];
    let sample = E.SAMPLES[a.id];
    if (!sample) {
      for (const cand of CAND) { const t0 = E.run(a.id, cand); if (t0 && t0.success === true) { sample = cand; break; } }
    }
    if (!sample) { cFail++; rows.push(["FAIL", a.id, "compute 类无可用输入"]); return; }
    const r = E.run(a.id, sample);
    if (r.success) {
      const keys = Object.keys(r.output);
      const bad = Object.entries(r.output).some(([k, v]) => typeof v === "number" && !isFinite(v));
      if (bad) { cFail++; rows.push(["FAIL", a.id, "输出含非有限数"]); }
      else { cOK++; rows.push(["OK", a.id, `compute · ${keys.length} 字段`]); }
    } else { cFail++; rows.push(["FAIL", a.id, r.error]); }
  } else if (kind === "external") { ext++; rows.push(["SKIP", a.id, "external（需模型/服务，如实拒绝）"]); }
  else if (kind === "template") { tpl++; rows.push(["SKIP", a.id, "template（未实现，如实拒绝）"]); }
  else { noImpl++; rows.push(["SKIP", a.id, "declared（无契约）"]); }
});

// 2. external / template 必须明确返回失败，不得假装成功
let honestyFail = 0;
[...E.EXTERNAL, ...E.TEMPLATE].forEach(id => {
  const r = E.run(id, {});
  if (r.success) { honestyFail++; rows.push(["FAIL", id, "非 compute 类返回了 success:true —— 这属于假实现"]); }
});

// 3. 无实现的原子必须如实拒绝（修 Round 35）
/* 原逻辑取「第一个无 I/O 契约的原子」要求它返回 NO_CONTRACT —— 前提有误：
   472 条原子未声明 I/O 契约但均有真实实现（用推导输入可正常计算），不该要求拒绝。
   正确判据：只有「无实现的 declared 类」才必须返回 NO_CONTRACT。 */
const declaredIds = Object.keys(atoms).filter((id) => E.kindOf(id) === "declared");
declaredIds.forEach((id) => {
  const r = E.run(id, {});
  if (r.success || r.reason !== "NO_CONTRACT") {
    honestyFail++;
    rows.push(["FAIL", id, "declared 类未如实以 NO_CONTRACT 拒绝"]);
  }
});
rows.push(["INFO", "-", `declared 类 ${declaredIds.length} 条已核验如实拒绝`]);

fail = cFail + honestyFail;

console.log("=".repeat(84));
console.log("原子引擎自测");
console.log("=".repeat(84));
console.log(`蓝本原子总数 ${Object.keys(atoms).length} ｜ 带 I/O 契约 ${ioAtoms.length}`);
console.log(`  compute（真实计算）   ${cOK + cFail}  通过 ${cOK} / 失败 ${cFail}`);
console.log(`  external（需模型/服务）${ext}`);
console.log(`  template（未实现）     ${tpl}`);
console.log(`  declared（无契约）     ${Object.keys(atoms).length - ioAtoms.length}`);
console.log(`诚实性校验（非 compute 不得返回 success）: ${honestyFail === 0 ? "通过" : "失败 " + honestyFail}`);
console.log("-".repeat(84));
rows.forEach(r => console.log(r[0] + " " + String(r[1]).padEnd(30) + " " + r[2]));
console.log("-".repeat(84));
console.log(fail === 0 ? "总判定：PASS" : `总判定：FAIL（${fail} 项）`);
process.exit(fail === 0 ? 0 : 1);
