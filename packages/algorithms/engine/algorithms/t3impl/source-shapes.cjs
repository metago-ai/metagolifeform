"use strict";
/**
 * source-shapes.cjs — 最后 43 条难调算法：读 handler 源码反推入参形状
 *
 * 方法：从 handler.toString() 里抽取 `参数名.属性` 的访问模式，
 *       据此构造对象形状（对象 / 数组 / 数值 / 字符串），再实调验证。
 * 这是「按实现事实推断」而非「猜」，推断不出就如实留在失败清单里。
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

const B = bind(REG);
const reg = REG.getRegistry();
const SHAPES = JSON.parse(fs.readFileSync(path.join(__dirname, "shapes.json"), "utf8"));

const FN = /(Fn$|^fn$|^func|^callback|^cb$|^predicate|^comparator|^reducer|^mapper|^handler|^loss$|^rng$|^rand|^objective$|^keyExtractor|^hashFn|^scoreFn|^evolveFn|^valueFn|^distanceFn|^filterFn|^transform)/i;

/** 从源码推断某个形参被当成什么用 */
function inferParamUse(src, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const use = { props: new Set(), arrayOps: new Set(), stringOps: new Set(), numOps: new Set(), indexed: false, iterated: false };

  // name.prop
  const reProp = new RegExp("\\b" + esc + "\\s*\\.\\s*([A-Za-z_$][\\w$]*)", "g");
  let m;
  while ((m = reProp.exec(src))) use.props.add(m[1]);

  // name[0]
  if (new RegExp("\\b" + esc + "\\s*\\[").test(src)) use.indexed = true;

  // for (const x of name) / [...name]
  if (new RegExp("of\\s+" + esc + "\\b").test(src) || new RegExp("\\[\\s*\\.\\.\\.\\s*" + esc).test(src)) use.iterated = true;

  // name.map( / .filter( / .length
  const reArr = new RegExp("\\b" + esc + "\\s*\\.\\s*(map|filter|reduce|forEach|some|every|find|slice|sort|concat|length|flatMap)\\b", "g");
  while ((m = reArr.exec(src))) use.arrayOps.add(m[1]);

  // name.toLowerCase etc
  const reStr = new RegExp("\\b" + esc + "\\s*\\.\\s*(toLowerCase|toUpperCase|trim|split|startsWith|endsWith|replace|charAt|padStart)\\b", "g");
  while ((m = reStr.exec(src))) use.stringOps.add(m[1]);

  // Math.*(name) or name + 1 / name * 2
  if (new RegExp("\\bMath\\.[a-z]+\\s*\\([^)]*\\b" + esc + "\\b").test(src)) use.numOps.add("math");
  if (new RegExp("\\b" + esc + "\\s*[+\\-*/]\\s*[\\d(]").test(src) || new RegExp("[\\d)]\\s*[+\\-*/]\\s*" + esc + "\\b").test(src)) use.numOps.add("arith");

  // name.get( / .set(
  if (new RegExp("\\b" + esc + "\\s*\\.\\s*(get|set|has)\\s*\\(").test(src)) use.numOps.add("map");

  return use;
}

/** 按用法构造一个值 */
function valueFor(use, depth = 0) {
  if (use.numOps.has("map")) return new Map();
  if (use.stringOps.size) return "sample";
  if (use.props.size) {
    const o = {};
    use.props.forEach(p => {
      if (p === "length" || p === "size" || p === "count") o[p] = 3;
      else if (p === "id" || p === "name" || p === "key") o[p] = "sample";
      else if (p === "steps" || p === "items" || p === "list" || p === "values" || p === "premises") o[p] = [];
      else o[p] = depth < 2 ? [] : 1;
    });
    // 常见嵌套修正
    if ("steps" in o) o.steps = [];
    if ("premises" in o) o.premises = [];
    return o;
  }
  if (use.arrayOps.size || use.iterated || use.indexed) return [1, 2, 3];
  if (use.numOps.has("arith") || use.numOps.has("math")) return 2;
  return [1, 2, 3];
}

const targets = reg.filter(e => typeof e.handler === "function" && Array.isArray(e.paramNames) && e.paramNames.length > 1
  && !e.paramNames.some(n => FN.test(n)));

function baseShapes(e) {
  const n = e.paramNames;
  return [
    SHAPES[e.id],
    Object.fromEntries(n.map(x => [x, [1, 2, 3]])),
    Object.fromEntries(n.map(x => [x, "sample"])),
    Object.fromEntries(n.map(x => [x, 2])),
    Object.fromEntries(n.map(x => [x, {}])),
    Object.fromEntries(n.map(x => [x, []]))
  ].filter(Boolean);
}

let stillFail = [];
let fixedBySource = 0;
let alreadyOk = 0;

targets.forEach(e => {
  // 先看是否已能调通
  let ok = false;
  for (const s of baseShapes(e)) {
    const r = B.run(e.id, s);
    if (r && (r.success || r.degraded)) { ok = true; break; }
  }
  if (ok) { alreadyOk++; return; }

  // 源码推断
  let src = "";
  try { src = Function.prototype.toString.call(e.handler); } catch (err) { src = ""; }
  if (!src || /\[native code\]/.test(src)) { stillFail.push({ id: e.id, why: "源码不可读" }); return; }

  const input = {};
  e.paramNames.forEach(n => { input[n] = valueFor(inferParamUse(src, n)); });

  let r = B.run(e.id, input);
  if (r && (r.success || r.degraded)) {
    SHAPES[e.id] = input;
    fixedBySource++;
    return;
  }

  // 二次：按报错再补一层
  const err = String(r && r.error || "");
  const mm = err.match(/Cannot read properties of undefined \(reading '([^']+)'\)/);
  if (mm) {
    const prop = mm[1];
    e.paramNames.forEach(n => {
      if (input[n] && typeof input[n] === "object" && !Array.isArray(input[n])) {
        if (input[n][prop] === undefined) input[n][prop] = [];
      }
    });
    r = B.run(e.id, input);
    if (r && (r.success || r.degraded)) {
      SHAPES[e.id] = input;
      fixedBySource++;
      return;
    }
  }
  stillFail.push({ id: e.id, why: err.slice(0, 70) });
});

fs.writeFileSync(path.join(__dirname, "shapes.json"), JSON.stringify(SHAPES, null, 1), "utf8");

console.log("=".repeat(78));
console.log("源码推断补形状");
console.log("=".repeat(78));
console.log(`位置多参（排除函数型）总数: ${targets.length}`);
console.log(`  原本已可调通: ${alreadyOk}`);
console.log(`  本轮源码推断修复: ${fixedBySource}`);
console.log(`  仍调不通: ${stillFail.length}`);
console.log(`  合计可调通: ${alreadyOk + fixedBySource} / ${targets.length} = ${((alreadyOk + fixedBySource) / targets.length * 100).toFixed(1)}%`);
console.log(`  shapes.json 现有样例: ${Object.keys(SHAPES).length} 条`);
if (stillFail.length) {
  console.log("\n仍调不通：");
  stillFail.slice(0, 12).forEach(x => console.log(`  ✗ ${x.id}: ${x.why}`));
}
