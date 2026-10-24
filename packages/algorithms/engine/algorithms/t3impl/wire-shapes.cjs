"use strict";
/**
 * wire-shapes.cjs — 把 shapes.json 里已发现的精确样例接入 bind，提升 T1/T2 可调率
 * 并重新测量 495 条位置多参算法的实际可调数
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
const REG = require(__pick([
  __p.join(__dirname, "..", "registry.js"),
  "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js",
]));
const { bind } = require("./bind.cjs");

const SHAPES = path.join(__dirname, "shapes.json");
const shapes = fs.existsSync(SHAPES) ? JSON.parse(fs.readFileSync(SHAPES, "utf8")) : {};

const B = bind(REG);
const reg = REG.getRegistry();
const targets = reg.filter(e => typeof e.handler === "function"
  && Array.isArray(e.paramNames) && e.paramNames.length > 1);

function buildShapes(e) {
  const names = e.paramNames;
  const out = [];
  // 1) 已发现的精确样例优先
  if (shapes[e.id]) out.push(shapes[e.id]);
  // 2) 基础形态
  out.push(Object.fromEntries(names.map(n => [n, [1, 2, 3]])));
  out.push(Object.fromEntries(names.map(n => [n, "sample"])));
  out.push(Object.fromEntries(names.map(n => [n, 2])));
  out.push(Object.fromEntries(names.map(n => [n, {}])));
  out.push(Object.fromEntries(names.map(n => [n, []])));
  out.push(Object.fromEntries(names.map(n => [n, { steps: [], items: [], values: [] }])));
  if (names.length === 2) {
    out.push({ [names[0]]: "hello world", [names[1]]: "hello there" });
    out.push({ [names[0]]: [1, 2, 3], [names[1]]: [2, 4, 6] });
  }
  return out;
}

const FN = /(Fn$|^fn$|^func|^callback|^cb$|^predicate|^comparator|^reducer|^mapper|^handler|^loss$|^rng$|^rand|^objective$|^keyExtractor|^hashFn|^scoreFn|^evolveFn|^valueFn|^distanceFn|^filterFn|^transform)/i;

let ok = 0, no = 0, fnSkip = 0, viaShape = 0;
const still = [];
const byTier = { T1: [0, 0], T2: [0, 0] };

targets.forEach(e => {
  byTier[e.tier] = byTier[e.tier] || [0, 0];
  byTier[e.tier][1]++;
  if (e.paramNames.some(n => FN.test(n))) { fnSkip++; return; }
  let hit = null;
  const list = buildShapes(e).map(sh => {
    if (!sh) return sh;
    const o = Object.assign({}, sh);
    Object.keys(o).forEach(k => { if (o[k] && o[k].__map__) o[k] = new Map(o[k].entries || []); });
    return o;
  });
  for (let i = 0; i < list.length; i++) {
    let r;
    try { r = B.run(e.id, list[i]); } catch (err) { continue; }
    if (r && (r.success || r.degraded)) { hit = { r, fromShape: i === 0 && !!shapes[e.id] }; break; }
  }
  if (hit) {
    ok++;
    byTier[e.tier][0]++;
    if (hit.fromShape) viaShape++;
  } else {
    no++;
    if (still.length < 10) still.push(e.id);
  }
});

console.log("=".repeat(78));
console.log("接入 shapes.json 后的可调率");
console.log("=".repeat(78));
console.log(`位置多参总数 ${targets.length}`);
console.log(`可调通 ${ok}  （${(ok / Math.max(1, targets.length - fnSkip) * 100).toFixed(1)}%）`);
console.log(`  其中靠 shapes.json 精确样例首击命中: ${viaShape}`);
console.log(`完全调不通 ${no}`);
console.log(`函数型形参跳过 ${fnSkip}`);
console.log();
["T1", "T2"].forEach(t => {
  if (byTier[t]) console.log(`  ${t}: ${byTier[t][0]}/${byTier[t][1]}`);
});
if (still.length) console.log("\n仍调不通样例:", still.join(", "));

// 落盘覆盖率
fs.writeFileSync(path.join(__dirname, "shapes-coverage.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  positionalTotal: targets.length,
  callable: ok,
  callableRate: +(ok / Math.max(1, targets.length - fnSkip)).toFixed(4),
  viaShapeFile: viaShape,
  notCallable: no,
  functionParamSkipped: fnSkip,
  byTier,
  shapeFileEntries: Object.keys(shapes).length
}, null, 2), "utf8");
console.log("\n覆盖率报告已写出: shapes-coverage.json");
