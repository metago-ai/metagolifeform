"use strict";
/**
 * audit-expectations.cjs — 元验证：检查脚本里的「硬编码期望值」是否还与实测一致
 *
 * 已发现三处同源缺陷（DEF-027 / DEF-030 / DEF-031）：
 *   检查脚本自己写死了错误的预期（python 路径、包位置），于是把正常报成故障。
 * 本轮把这类「期望值」全部抽出来，逐条用实测值核对。
 */
const fs = require("fs");
const path = require("path");

const HOME = "D:/DSH-Official/home";
const SC = path.join(HOME, "scripts");

/* 要核对的期望：名字 → 实测函数 */

/** 去掉注释 / 块注释 / 文档字符串（CORR-033） */
function stripComments(src, isPy) {
  let t = src;
  if (isPy) {
    t = t.replace(/"""[\s\S]*?"""/g, '""');
    t = t.replace(/'''[\s\S]*?'''/g, "''");
    t = t.replace(/#[^\n]*/g, "");
  } else {
    t = t.replace(/\/\*[\s\S]*?\*\//g, "");
    t = t.replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  }
  return t;
}

function countSkills() {
  return fs.readdirSync(path.join(HOME, "skills"), { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(HOME, "skills", d.name, "SKILL.md"))).length;
}
function countBlueprint() {
  const bp = path.join(HOME, "metago/blueprint/元构初始文档");
  return fs.readdirSync(bp).filter(f => f.endsWith(".md")).length;
}
function countAtoms() {
  const p = path.join(HOME, "metago/blueprint/元构初始文档/附录卷-原子契约补全-V36.11.md");
  let t = fs.readFileSync(p, "utf8");
  /* CORR-033：去掉注释与文档字符串，避免把说明文字里的数字当硬编码期望 */
  t = stripComments(t, p.endsWith(".py"));
  return (t.match(/`ATOM_[A-Z0-9_]+`/g) || []).length;
}
function countScripts() {
  return fs.readdirSync(SC).filter(f => [".cjs", ".py", ".mjs", ".js"].includes(path.extname(f))).length;
}

/* 检查脚本里出现的「数字型期望」 */
const CHECKS = [
  { file: "verify-package.cjs", patterns: [
      { re: /技能\s*(\d+)\s*个/, name: "技能数", actual: countSkills },
      { re: /(\d+)\s*个 SKILL\.md/, name: "SKILL.md 数", actual: countSkills },
    ] },
  { file: "audit_skills.py", patterns: [
      { re: /(\d+)\s*个技能/, name: "技能数", actual: countSkills },
    ] },
];

console.log("=".repeat(92));
console.log("元验证：检查脚本的硬编码期望 vs 实测");
console.log("=".repeat(92));
console.log();
console.log("实测基线：");
const BASE = {
  技能数: countSkills(),
  蓝本卷数: countBlueprint(),
  原子契约标注数: countAtoms(),
  装机脚本数: countScripts(),
};
for (const [k, v] of Object.entries(BASE)) console.log("  " + k.padEnd(18) + v);
console.log();

let issues = 0;
for (const c of CHECKS) {
  const p = path.join(SC, c.file);
  if (!fs.existsSync(p)) { console.log("跳过（不存在）: " + c.file); continue; }
  const t = fs.readFileSync(p, "utf8");
  for (const pt of c.patterns) {
    const m = pt.re.exec(t);
    if (!m) continue;
    const expect = parseInt(m[1], 10);
    const actual = pt.actual();
    const ok = expect === actual;
    if (!ok) issues++;
    console.log((ok ? "  ✓ " : "  ✗ ") + c.file.padEnd(24) + pt.name + "  期望 " + expect + " / 实测 " + actual);
  }
}

/* 额外：扫描所有脚本里的「断言硬编码数字」——必须能对上实测 */
console.log();
console.log("-".repeat(92));
console.log("其它可能过期的硬编码（需人工判定）：");
const SUSPECT = [
  { re: /427\s*个/, note: "与「被引用脚本名 427」一致，属统计口径说明" },
  { re: /157\s*个脚本/, note: "清理前的脚本数，现为 122+39" },
  { re: /42\s*个/, note: "归档数 42 → 后恢复 3 个，现 39" },
];
const ALL = fs.readdirSync(SC).filter(f => [".cjs", ".py"].includes(path.extname(f)));
for (const s of SUSPECT) {
  const hits = [];
  for (const f of ALL) {
    const t = fs.readFileSync(path.join(SC, f), "utf8");
    if (s.re.test(t)) hits.push(f);
  }
  if (hits.length) console.log("  ⚠ " + s.re.source.padEnd(14) + "→ " + hits.slice(0, 4).join(", ") + "   [" + s.note + "]");
}

console.log();
console.log("-".repeat(92));
console.log(issues === 0 ? "总判定：PASS（脚本期望与实测一致）" : `总判定：需关注（${issues} 处期望与实测不符）`);
process.exitCode = issues === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
