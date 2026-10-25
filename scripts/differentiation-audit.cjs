"use strict";
/**
 * differentiation-audit.cjs — 「应当有差异的东西是否真的不同」
 *
 * 起因（DEF-037）：11 个平台适配文件版本对、章节齐、无占位符，检查全绿，
 * 但 SHA256 全同 —— 核心功能（平台差异化）完全没生效。
 *
 * 通用化：任何「一组应当彼此不同」的产物，只要出现哈希相同，就是可疑的。
 * 本脚本按组扫描全包。
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PKG = "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.12.0";

function sha(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}
function walk(dir, filter) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, filter));
    else if (!filter || filter(p)) out.push(p);
  }
  return out;
}

/* 应当彼此不同的「组」 */
const GROUPS = [];

/* 1) 平台适配模板 */
GROUPS.push({
  name: "平台适配模板（11 个平台）",
  files: walk(path.join(PKG, "adapters"), p => /\.template/.test(p)),
  expectUnique: true,
});

/* 2) 专家团 agents（每个角色不同） */
GROUPS.push({
  name: "专家团 agents",
  files: walk(path.join(PKG, "agents"), p => p.endsWith(".md")),
  expectUnique: true,
});

/* 3) 技能 SKILL.md（每个技能不同） */
GROUPS.push({
  name: "技能 SKILL.md",
  files: walk(path.join(PKG, "skills"), p => path.basename(p) === "SKILL.md"),
  expectUnique: true,
});

/* 4) 插件包（不同 pack 应不同） */
{
  const plugs = path.join(PKG, "plugins");
  const packs = fs.existsSync(plugs)
    ? fs.readdirSync(plugs, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => path.join(plugs, d.name))
    : [];
  GROUPS.push({
    name: "插件包目录（每个 pack 的代表文件）",
    files: packs.map(d => path.join(d, "plugin.json")).filter(p => fs.existsSync(p)),
    expectUnique: true,
  });
}

/* 5) 子包 package.json（每个子包不同） */
GROUPS.push({
  name: "子包 package.json",
  files: walk(path.join(PKG, "packages"), p => path.basename(p) === "package.json" && !p.includes("node_modules")),
  expectUnique: true,
});

/* 6) 附录卷（每卷内容不同） */
GROUPS.push({
  name: "附录卷 / 全息文档卷",
  files: walk(path.join(PKG, "docs"), p => p.endsWith(".md")),
  expectUnique: true,
});

/* 7) 两个 kit 的对应文件不应全同 */
{
  const a = walk(path.join(PKG, "completeness-kit"), p => p.endsWith(".js") || p.endsWith(".md"));
  const b = walk(path.join(PKG, "metago-veracity-kit"), p => p.endsWith(".js") || p.endsWith(".md"));
  const byName = new Map();
  for (const f of [...a, ...b]) {
    const n = path.basename(f);
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push(f);
  }
  const samePairs = [];
  for (const [n, fs2] of byName) {
    if (fs2.length === 2 && sha(fs2[0]) === sha(fs2[1])) samePairs.push(n);
  }
  GROUPS.push({
    name: "两套 kit 的同名文件（应各自不同）",
    files: [],
    custom: () => samePairs.length === 0
      ? { ok: true, detail: "无同名同内容文件" }
      : { ok: false, detail: `${samePairs.length} 个同名文件内容相同: ${samePairs.slice(0, 3).join(",")}` },
  });
}

console.log("=".repeat(94));
console.log("差异化审计：应当彼此不同的产物，是否真的不同");
console.log("=".repeat(94));

let bad = 0;
for (const g of GROUPS) {
  if (g.custom) {
    const r = g.custom();
    if (!r.ok) bad++;
    console.log(`\n${r.ok ? "✓" : "✗"} ${g.name}`);
    console.log(`    ${r.detail}`);
    continue;
  }
  const total = g.files.length;
  if (total === 0) {
    console.log(`\n- ${g.name}：无文件（跳过）`);
    continue;
  }
  const map = new Map();
  for (const f of g.files) {
    const h = sha(f);
    if (!map.has(h)) map.set(h, []);
    map.get(h).push(path.relative(PKG, f));
  }
  const dupGroups = [...map.values()].filter(v => v.length > 1);
  const uniq = map.size;
  const ok = uniq === total;
  if (!ok) bad++;
  console.log(`\n${ok ? "✓" : "✗"} ${g.name}`);
  console.log(`    文件 ${total} 个 ｜ 唯一哈希 ${uniq} 个` + (ok ? "  → 全部不同" : `  → ${dupGroups.length} 组重复`));
  if (!ok) {
    for (const d of dupGroups.slice(0, 5)) {
      console.log(`    ⚠ ${d.length} 个文件内容相同:`);
      for (const f of d.slice(0, 4)) console.log(`        ${f}`);
      if (d.length > 4) console.log(`        … 其余 ${d.length - 4}`);
    }
  }
}

console.log();
console.log("-".repeat(94));
console.log(bad === 0 ? "总判定：PASS（所有「应当不同」的组都真的不同）"
  : `总判定：需关注（${bad} 组存在不应有的重复）`);
process.exitCode = bad === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
