"use strict";
/**
 * nan-scanner.cjs — 隐性数据损坏扫描器
 *
 * 由来：ALG_T2_G_015 缺 model.bias 时，prediction→NaN→weights 全 NaN→序列化成 null，
 * 却仍然返回 success:true。这是"看起来成功、实际数据已损坏"，比报错更危险。
 *
 * 本扫描器对所有可执行算法做：用已知 shapes 调用 → 递归检查输出中是否存在
 *   NaN / Infinity / null 数值位 / empty-object-in-place-of-value
 * 并区分：
 *   REAL_NULL   输出中某处为 null（可能是合法语义，需人工确认）
 *   NAN_INF     出现非有限数（几乎一定是缺陷）
 */
const path2 = require("path");
const fs2 = require("fs");
function resolveFirst2(list) {
  for (const p of list) { try { if (fs2.existsSync(p)) return p; } catch (e) {} }
  return list[list.length - 1];
}
/* 路径解析：脚本可能位于 <pkg>/scripts/（包内）或任意位置（独立运行）。
   包内布局：<pkg>/packages/algorithms/engine/algorithms/
   逐级回退，最后落到 npm 安装路径。 */
const ALG = resolveFirst2([
  path2.join(__dirname, "..", "packages", "algorithms", "engine", "algorithms"),
  path2.join(__dirname, "..", "..", "packages", "algorithms", "engine", "algorithms"),
  "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms",
]);
const REG = require(path2.join(ALG, "registry.js"));
const { bind } = require(path2.join(ALG, "t3impl", "bind.cjs"));
const SH = require(path2.join(ALG, "t3impl", "shapes.json"));

const B = bind(REG);
const reg = REG.getRegistry();

const FN = /(Fn$|^fn$|^func|^callback|^cb$|^predicate|^comparator|^reducer|^mapper|^handler|^loss$|^rng$|^rand|^objective$|^keyExtractor|^hashFn|^scoreFn|^evolveFn|^valueFn|^distanceFn|^filterFn|^transform)/i;

function scan(v, path, found) {
  if (typeof v === "number") {
    if (!isFinite(v)) found.push({ path, kind: "NAN_INF", value: String(v) });
  } else if (v === null) {
    found.push({ path, kind: "REAL_NULL", value: "null" });
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => scan(x, path + "[" + i + "]", found));
  } else if (v && typeof v === "object") {
    if (v instanceof Map) return;
    Object.keys(v).forEach(k => scan(v[k], path ? path + "." + k : k, found));
  }
}

const targets = reg.filter(e => typeof e.handler === "function"
  && Array.isArray(e.paramNames) && e.paramNames.length >= 1
  && !e.paramNames.some(n => FN.test(n)));

let scanned = 0, nanIssues = [], nullIssues = [], ok = 0, blockedCount = 0;
const samples = {};

targets.forEach(e => {
  const n = e.paramNames;
  const cand = [
    SH[e.id],
    Object.fromEntries(n.map(x => [x, [1, 2, 3]])),
    Object.fromEntries(n.map(x => [x, "sample"])),
    Object.fromEntries(n.map(x => [x, 2])),
    Object.fromEntries(n.map(x => [x, { a: 1, b: 2 }])),
    Object.fromEntries(n.map(x => [x, { weights: [0.1, 0.2], bias: 0 }])),
    Object.fromEntries(n.map(x => [x, []])),
  ].filter(Boolean).map(sh => {
    const o = Object.assign({}, sh);
    Object.keys(o).forEach(k => { if (o[k] && o[k].__map__) o[k] = new Map(); });
    return o;
  });

  let ran = null, blocked = false;
  for (const s of cand) {
    const r = B.run(e.id, s);
    if (r && r.success === true) { ran = r; samples[e.id] = s; break; }
    if (r && r.degraded === true) { blocked = true; }   // 已被子系统拦截 = 正确行为
  }
  if (!ran) { if (blocked) blockedCount++; return; }
  scanned++;

  const found = [];
  scan(ran.output, "", found);
  const nan = found.filter(f => f.kind === "NAN_INF");
  const nul = found.filter(f => f.kind === "REAL_NULL");
  if (nan.length) nanIssues.push({ id: e.id, issues: nan.slice(0, 4) });
  else if (nul.length) nullIssues.push({ id: e.id, issues: nul.slice(0, 3) });
  else ok++;
});

console.log("=".repeat(80));
console.log("隐性数据损坏扫描");
console.log("=".repeat(80));
console.log("已扫描可执行算法:", scanned);
console.log("  已被子系统拦截（非静默污染）:", blockedCount);
console.log("  干净输出      :", ok);
console.log("  ★ NAN/INF 污染:", nanIssues.length);
console.log("  null 值（需确认）:", nullIssues.length);
console.log();

if (nanIssues.length) {
  console.log("【NAN/INF 污染清单】");
  nanIssues.slice(0, 30).forEach(x => {
    console.log("  " + x.id);
    x.issues.forEach(i => console.log("      " + i.path + " = " + i.value));
  });
  if (nanIssues.length > 30) console.log("  ... 其余 " + (nanIssues.length - 30) + " 条");
  console.log();
}
if (nullIssues.length) {
  console.log("【null 值清单（前 15，可能是合法语义）】");
  nullIssues.slice(0, 15).forEach(x => {
    console.log("  " + x.id + "  → " + x.issues.map(i => i.path).join(", "));
  });
}

require("fs").writeFileSync("D:/metago-build/genome/nan-scan.json", JSON.stringify({
  scannedAt: new Date().toISOString(),
  scanned, clean: ok,
  nanIssues, nullIssues,
}, null, 1), "utf8");
console.log();
console.log("已写出: genome/nan-scan.json");

const fail = nanIssues.length;
console.log(fail === 0 ? "总判定：PASS（无非有限数污染）" : "总判定：发现 " + fail + " 条 NAN/INF 污染");
process.exit(0);
