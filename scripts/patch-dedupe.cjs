"use strict";
/**
 * patch-dedupe.cjs — 补丁重复收敛器（DEF-056）
 *
 * 背景：部分补丁脚本不幂等（每次运行都追加一份），反复执行会把同一个块插成几十份，
 *       直接抛 SyntaxError 让 engine / mcp-server 无法加载。
 * 本脚本对已知的「可重复块」做收敛，只保留第一份。
 *
 * 用法：node scripts/patch-dedupe.cjs [--check]
 */
const fs = require("fs");
const path = require("path");

const NPM = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules";
const CHECK = process.argv.includes("--check");

/* 已知可重复块：(相对路径, 起始特征, 结束特征, 说明) */
const BLOCKS = [
  {
    file: "@metago-ai/engine/RUNTIME/dist/decision-lock.js",
    start: "/* DC_NORMALIZED：",
    endLine: /^\s*userRequest = _norm\(userRequest\);\s*$/,
    name: "DC_NORMALIZED 归一化块",
  },
  {
    file: "@metago-ai/mcp-server/dist/index.js",
    start: "function handleAxiomCheck",
    braced: true,
    name: "handleAxiomCheck 函数",
  },
];

function dedupeBraced(text, startMarker) {
  const spans = [];
  let i = 0;
  while (true) {
    const j = text.indexOf(startMarker, i);
    if (j < 0) break;
    const k = text.indexOf("{", j);
    if (k < 0) break;
    let depth = 0, m = k;
    while (m < text.length) {
      if (text[m] === "{") depth++;
      else if (text[m] === "}") {
        depth--;
        if (depth === 0) break;
      }
      m++;
    }
    spans.push([j, m + 1]);
    i = m + 1;
  }
  if (spans.length <= 1) return { text, removed: 0 };
  const keep = spans[spans.length - 1];
  let out = "", prev = 0;
  for (const [a, b] of spans.slice(0, -1)) {
    out += text.slice(prev, a);
    prev = b;
  }
  out += text.slice(prev);
  return { text: out, removed: spans.length - 1 };
}

function dedupeLines(text, startMarker, endLineRe) {
  const lines = text.split("\n");
  const out = [];
  let seen = false, skipping = false, removed = 0;
  for (const ln of lines) {
    if (!seen && ln.includes(startMarker)) {
      seen = true;
      out.push(ln);
      continue;
    }
    if (seen && !skipping && ln.includes(startMarker)) {
      skipping = true;
      removed++;
      // 回退掉上一条被 push 的注释行（如果它是同类注释）
      if (out.length && (out[out.length - 1].includes(startMarker))) out.pop();
      continue;
    }
    if (skipping) {
      if (endLineRe.test(ln) || /^\s*(output|intent|userRequest)\s*=\s*_norm\(/.test(ln)) {
        // 继续吞掉后续同类赋值行
        continue;
      }
      skipping = false;
    }
    out.push(ln);
  }
  return { text: out.join("\n"), removed };
}

let bad = 0;
console.log("=".repeat(84));
console.log("补丁重复收敛");
console.log("=".repeat(84));
console.log(`模式：${CHECK ? "检查（不修改）" : "收敛（只保留一份）"}\n`);

for (const b of BLOCKS) {
  const abs = path.join(NPM, b.file);
  if (!fs.existsSync(abs)) {
    console.log(`- ${b.name}：文件不存在（跳过）`);
    continue;
  }
  const before = fs.readFileSync(abs, "utf8");
  const n = before.split(b.start).length - 1;
  let r;
  if (b.braced) r = dedupeBraced(before, b.start);
  else r = dedupeLines(before, b.start, b.endLine);

  if (r.removed === 0) {
    console.log(`✓ ${b.name}：${n} 份（正常）`);
    continue;
  }
  if (CHECK) {
    bad++;
    console.log(`✗ ${b.name}：${n} 份（应 1 份）—— 需运行本脚本收敛`);
    continue;
  }
  fs.writeFileSync(abs, r.text, "utf8");
  console.log(`✓ ${b.name}：${n} 份 → 1 份 ｜ ${before.length} → ${r.text.length} B`);
}

console.log();
console.log("-".repeat(84));
if (CHECK) {
  console.log(bad === 0 ? "总判定：PASS（无重复块）" : `总判定：需处理（${bad} 处重复）`);
  process.exitCode = bad === 0 ? 0 : 1;
} else {
  console.log("总判定：收敛完成");
  process.exitCode = 0;
}
