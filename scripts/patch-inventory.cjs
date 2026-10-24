"use strict";
/**
 * patch-inventory.cjs — 盘点所有对 vendor 包打过的补丁（在 node_modules 里）
 *
 * 存在的风险：@metago-ai/engine 与 @metago-ai/mcp-server 是 npm 安装的，
 * 我直接改了它们的 dist 文件。一次 `npm install/update` 就会全部丢失，
 * 系统会静默退回「带缺陷」的状态。
 *
 * 本脚本用「补丁标记」逐个探测是否在位，输出清单供 reapply 使用。
 */
const fs = require("fs");
const path = require("path");

const NPM = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai";

/* 每个补丁：包、文件、唯一标记（用于探测在位）、说明 */
const PATCHES = [
  { pkg: "engine", file: "RUNTIME/dist/kmwi-memory.js", mark: "(i.explicitForm || '')",
    id: "P1", what: "explicitForm 判空（DEF-016）", sev: "high" },
  { pkg: "engine", file: "RUNTIME/dist/kmwi-memory.js", mark: "/* TYPENORM */",
    id: "P2", what: "addKnowledge/addMemory/addWisdom/addIntuition 入参归一化（DEF-020）", sev: "high" },
  { pkg: "engine", file: "RUNTIME/dist/validators.js", mark: "/* NORMALIZED：",
    id: "P3", what: "validateAll 入口 output 归一化（DEF-017）", sev: "high" },
  { pkg: "engine", file: "RUNTIME/dist/validators.js", mark: "PLACEHOLDER_PATTERNS_V2",
    id: "P4", what: "占位符检测扩宽（DEF-018）", sev: "high" },
  { pkg: "engine", file: "RUNTIME/dist/validators.js", mark: "/* TYPENORM */",
    id: "P5", what: "checkProvenance/checkCompliance/checkComplianceProactive/checkDataTraceability 归一化（DEF-020）", sev: "high" },
  { pkg: "engine", file: "RUNTIME/dist/decision-lock.js", mark: "/* DC_NORMALIZED：",
    id: "P6", what: "DecisionLock.validate 三入参归一化（DEF-019）", sev: "critical" },
  { pkg: "engine", file: "RUNTIME/dist/decision-lock.js", mark: "/* TYPENORM */",
    id: "P7", what: "gateIVL/gateILT/gateOSG/gateIntegrity 归一化（DEF-020）", sev: "critical" },
  { pkg: "engine", file: "RUNTIME/dist/perception.js", mark: "/* TYPENORM */",
    id: "P8", what: "detectFromFeedback 归一化（DEF-020）", sev: "medium" },
  { pkg: "mcp-server", file: "dist/index.js", mark: "handleDecisionLock",
    id: "P9", what: "decision_lock 硬驱动接入 DecisionLock", sev: "medium" },
  { pkg: "mcp-server", file: "dist/index.js", mark: "handleOutputIntegrity",
    id: "P10", what: "output_integrity 硬驱动接入 AxiomValidator", sev: "medium" },
  { pkg: "mcp-server", file: "dist/index.js", mark: "handleSelfCheck",
    id: "P11", what: "self_check 硬驱动接入 validateAll", sev: "medium" },
  { pkg: "mcp-server", file: "dist/index.js", mark: "AxiomValidator }",
    id: "P12", what: "import 补 AxiomValidator", sev: "medium" },
];

const p = (x, n) => String(x).padEnd(n).slice(0, n);

console.log("=".repeat(92));
console.log("vendor 包补丁在位盘点");
console.log("=".repeat(92));
console.log(p("ID", 5) + p("包/文件", 46) + p("状态", 8) + "说明");
console.log("-".repeat(92));

const missing = [];
for (const patch of PATCHES) {
  const f = path.join(NPM, patch.pkg, patch.file);
  let ok = false, note = "";
  if (!fs.existsSync(f)) { note = "文件不存在"; }
  else {
    try {
      const t = fs.readFileSync(f, "utf8");
      ok = t.includes(patch.mark);
    } catch (e) { note = "读取失败"; }
  }
  if (!ok) missing.push(patch);
  console.log(p(patch.id, 5) + p(patch.pkg + "/" + patch.file, 46) +
    p(ok ? "在位" : "缺失", 8) + patch.what.slice(0, 34));
}

console.log();
console.log("-".repeat(92));
console.log(`共 ${PATCHES.length} 个补丁 ｜ 在位 ${PATCHES.length - missing.length} ｜ 缺失 ${missing.length}`);
if (missing.length) {
  console.log();
  console.log("缺失补丁（需重放）:");
  missing.forEach(m => console.log(`  ✗ ${m.id} ${m.what}  →  ${m.pkg}/${m.file}`));
}
console.log();
console.log(missing.length === 0 ? "总判定：PASS（全部补丁在位）" : "总判定：需关注（有补丁缺失，npm update 后需重放）");
process.exitCode = missing.length === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
