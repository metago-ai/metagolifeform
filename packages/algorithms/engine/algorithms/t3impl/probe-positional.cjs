"use strict";
/**
 * probe-positional.cjs — 位置多参算法的真实可调率
 *
 * 方法：对每条位置多参算法，用多种"输入形态"重试（数组 / 字符串 / 数字 / 混合），
 *       任一种能跑通即判定「该算法可通过单对象入参调用」。
 * 注意：这衡量的是「能不能调通」，不是「算得对不对」——后者需要逐条期望值断言。
 */
const REG = require(__pick([
  __p.join(__dirname, "..", "registry.js"),
  "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js",
]));
const { bind } = require("./bind.cjs");
/* --- 本地优先路径解析（包内运行时禁止依赖外部副本）--- */
const __p = require("path");
const __f = require("fs");
function __pick(list) {
  for (const p of list) { try { if (__f.existsSync(p)) return p; } catch (e) {} }
  return list[list.length - 1];
}



const B = bind(REG);
const reg = REG.getRegistry();
const targets = reg.filter(e => typeof e.handler === "function" && Array.isArray(e.paramNames) && e.paramNames.length > 1);

const FN_LIKE = /(Fn\$|^fn\$|^func|^callback|^cb\$|^predicate|^comparator|^reducer|^mapper|^handler|^loss\$|^rng\$|^rand|^objective\$|^keyExtractor|^hashFn|^scoreFn|^evolveFn|^valueFn|^distanceFn|^filterFn|^transform)/i;

function buildShapes(e) {
  const names = e.paramNames;
  const nm = String(e.name || "") + " " + String(e.description || "");
  const shapes = [];

  // 形态 1：全数组
  shapes.push(Object.fromEntries(names.map(n => [n, [1, 2, 3]])));
  // 形态 2：全字符串
  shapes.push(Object.fromEntries(names.map(n => [n, "sample"])));
  // 形态 3：全数字
  shapes.push(Object.fromEntries(names.map(n => [n, 2])));
  // 形态 4：按名推断
  shapes.push(Object.fromEntries(names.map(n => {
    const k = n.toLowerCase();
    if (/^s\d$|^str|text|string|^name|^query|^labels?$|^ids?$/.test(k)) return [n, k === "labels" || k === "ids" ? ["a", "b", "c"] : "sample"];
    if (/^store|^map$|^cache$|^registry$|^record$/.test(k)) return [n, new Map()];
    if (/^pair|^pairA|^pairB/.test(k)) return [n, { a: [1, 2, 3], b: [2, 4, 6] }];
    if (/^seq|^sequences|^matrix|^rows|^points/.test(k)) return [n, [[1, 2], [2, 4], [3, 6]]];
    if (/count|num|n$|k$|size|dim|dimension|target|threshold|window|period|steps/.test(k)) return [n, 2];
    if (/^a$|^b$|^x$|^y$|^v$|^w$|only/i.test(k) && /array|vector|list/i.test(nm)) return [n, [1, 2, 3]];
    if (/value|score|weight|rate|ratio|alpha|beta|level|amount|initial/i.test(k)) return [n, 1.5];
    return [n, [1, 2, 3]];
  })));

  // 形态 5：字符串对字符串（相似度类）
  if (names.length === 2) {
    shapes.push({ [names[0]]: "hello world", [names[1]]: "hello there" });
    shapes.push({ [names[0]]: [1, 2, 3], [names[1]]: [2, 4, 6] });
  }
  return shapes;
}

const stats = {
  total: targets.length,
  callable: 0, neverRan: 0, fnSkip: 0,
  byTier: { T1: { ok: 0, all: 0 }, T2: { ok: 0, all: 0 }, T3: { ok: 0, all: 0 } }
};
const neverRanList = [];

targets.forEach(e => {
  const t = e.tier;
  if (!stats.byTier[t]) stats.byTier[t] = { ok: 0, all: 0 };
  stats.byTier[t].all++;

  if (e.paramNames.some(n => FN_LIKE.test(n))) { stats.fnSkip++; return; }

  let ran = false, best = null;
  for (const shape of buildShapes(e)) {
    let r;
    try { r = B.run(e.id, shape); } catch (err) { continue; }
    // 只要能跑出结果（哪怕 NaN）就算"调通"；抛错才算没调通
    if (r && (r.success || r.degraded)) { ran = true; best = r.success ? "ok" : "degraded"; break; }
    if (!best) best = String(r && r.error).slice(0, 60);
  }
  if (ran) {
    stats.callable++;
    stats.byTier[t].ok++;
  } else {
    stats.neverRan++;
    if (neverRanList.length < 15) neverRanList.push(`${e.id}(${e.paramNames.join(",")}): ${best}`);
  }
});

console.log("=".repeat(84));
console.log("位置多参算法 · 单对象入参可调率");
console.log("=".repeat(84));
console.log(`总数（形参名 >1）: ${stats.total}`);
console.log(`可调通: ${stats.callable}  （${(stats.callable / Math.max(1, stats.total - stats.fnSkip) * 100).toFixed(1)}%）`);
console.log(`完全调不通: ${stats.neverRan}`);
console.log(`含函数型形参（MCP 结构性不可传）跳过: ${stats.fnSkip}`);
console.log();
["T1", "T2"].forEach(t => {
  const s = stats.byTier[t];
  if (s && s.all) console.log(`  ${t}: ${s.ok}/${s.all}`);
});
if (neverRanList.length) {
  console.log("\n完全调不通样例：");
  neverRanList.forEach(x => console.log("   ✗ " + x));
}
