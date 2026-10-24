"use strict";
/**
 * guide-quality.cjs — 用正确判据评估 MCP guide 质量
 *
 * 修正：此前用「guide 是否是 SKILL.md 的子集」判定，得出 39 条「不同源」——
 *      这是错误判据。guide 是**为 MCP 场景设计的精简版**，本就不该等于全文。
 *
 * 正确判据：guide 必须包含可操作的三要素
 *   - 触发条件（何时用）
 *   - 执行流程（怎么做，含编号步骤）
 *   - 输出格式（产出什么）
 */
const fs = require("fs");
const path = require("path");

const SD = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/mcp-server/dist/skills-data.js";
const SK = "D:/DSH-Official/home/skills";

const skills = (require(SD).SKILLS || require(SD).default || []);
const p = (x, n) => String(x).padEnd(n).slice(0, n);

console.log("=".repeat(84));
console.log("MCP guide 质量评估（触发条件 / 执行流程 / 输出格式）");
console.log("=".repeat(84));
console.log("技能总数:", skills.length);
console.log();

const sections = { 触发: /触发|何时|适用/, 流程: /流程|步骤|执行|方法/, 输出: /输出|格式|产出|返回/ };
const bad = [];
const stat = { 齐全: 0, 缺一项: 0, 缺多项: 0 };

for (const s of skills) {
  const g = s.guide || "";
  const has = {};
  for (const [k, re] of Object.entries(sections)) has[k] = re.test(g);
  const n = Object.values(has).filter(Boolean).length;
  const steps = (g.match(/^\s*\d+[.、)]/gm) || []).length;

  if (n === 3 && g.length >= 80) stat["齐全"]++;
  else if (n === 2) { stat["缺一项"]++; bad.push({ s, has, n, len: g.length, steps }); }
  else { stat["缺多项"]++; bad.push({ s, has, n, len: g.length, steps }); }
}

console.log("三要素齐全:", stat["齐全"]);
console.log("缺一项    :", stat["缺一项"]);
console.log("缺多项    :", stat["缺多项"]);
console.log();

if (bad.length) {
  console.log(p("技能", 34) + p("触发", 6) + p("流程", 6) + p("输出", 6) + p("字数", 7) + "步骤数");
  console.log("-".repeat(84));
  bad.slice(0, 30).forEach(b => {
    console.log(p(b.s.toolName, 34) + p(b.has["触发"] ? "✓" : "✗", 6) +
      p(b.has["流程"] ? "✓" : "✗", 6) + p(b.has["输出"] ? "✓" : "✗", 6) +
      p(b.len, 7) + b.steps);
  });
  if (bad.length > 30) console.log("… 其余 " + (bad.length - 30));
}

// 长度分布
const lens = skills.map(s => (s.guide || "").length).sort((a, b) => a - b);
console.log();
console.log("guide 字数分布：min=%d  中位=%d  max=%d  平均=%d" % (
  lens[0], lens[Math.floor(lens.length / 2)], lens[lens.length - 1],
  Math.round(lens.reduce((a, x) => a + x, 0) / lens.length)));

console.log();
console.log("-".repeat(84));
console.log(bad.length === 0 ? "总判定：PASS（全部 guide 三要素齐全）" : `总判定：需关注（${bad.length} 个 guide 不完整）`);
