"use strict";
/**
 * final-shapes.cjs — 最后 12 条：按报错类型做类型纠正，直到调通或用尽重试
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
const SH = JSON.parse(fs.readFileSync(path.join(__dirname, "shapes.json"), "utf8"));
const FN = /(Fn$|^fn$|^func|^callback|^cb$|^predicate|^comparator|^reducer|^mapper|^handler|^loss$|^rng$|^rand|^objective$|^keyExtractor|^hashFn|^scoreFn|^evolveFn|^valueFn|^distanceFn|^filterFn|^transform)/i;

const targets = reg.filter(e => typeof e.handler === "function" && Array.isArray(e.paramNames)
  && e.paramNames.length > 1 && !e.paramNames.some(n => FN.test(n)));

function canRun(id, input) {
  const r = B.run(id, input);
  return (r && (r.success || r.degraded)) ? r : null;
}

/** 按报错把某个 param（或嵌套路径）改成正确类型 */
function applyFix(msg, input, names) {
  const changed = [];

  const set = (p, v) => { input[p] = v; changed.push(p); };

  // X.toFixed / toPrecision is not a function → 需要数字
  let m = msg.match(/([A-Za-z_$][\w$]*)\.(toFixed|toPrecision) is not a function/);
  if (m) {
    const root = m[1];
    if (names.includes(root)) { set(root, 1); return { changed, root }; }
    // 嵌套：thesis.strength
    const nm = msg.match(/([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\.(toFixed|toPrecision) is not a function/);
    if (nm) {
      const [, r2, p2] = nm;
      if (names.includes(r2) && input[r2] && typeof input[r2] === "object" && !Array.isArray(input[r2])) {
        input[r2][p2] = 1; changed.push(`${r2}.${p2}`);
      }
      return { changed, root: r2 };
    }
  }

  // X.toLowerCase / trim / split → 需要字符串
  m = msg.match(/([A-Za-z_$][\w$]*)\.(toLowerCase|toUpperCase|trim|split|startsWith|endsWith|replace) is not a function/);
  if (m && names.includes(m[1])) { set(m[1], "sample"); return { changed, root: m[1] }; }

  // X is not iterable → 需要数组
  m = msg.match(/^([A-Za-z_$][\w$]*) is not iterable/);
  if (m && names.includes(m[1])) { set(m[1], []); return { changed, root: m[1] }; }

  // X.map/filter is not a function → 需要数组
  m = msg.match(/([A-Za-z_$][\w$]*)\.(map|filter|reduce|forEach|slice|length) is not a function/);
  if (m && names.includes(m[1])) {
    set(m[1], m[2] === "length" ? "sample" : []);
    return { changed, root: m[1] };
  }

  // Cannot read properties of undefined (reading 'Y')
  m = msg.match(/Cannot read properties of undefined \(reading '([^']+)'\)/);
  if (m) {
    const prop = m[1];
    names.forEach(n => {
      if (input[n] && typeof input[n] === "object" && !Array.isArray(input[n]) && input[n][prop] === undefined) {
        input[n][prop] = (prop === "length" || prop === "cumulative" || prop === "size") ? 3 : [];
        changed.push(`${n}.${prop}`);
      }
    });
    if (changed.length) return { changed, root: changed[0] };
    if (names.length) { set(names[0], { [prop]: 3 }); return { changed, root: names[0] }; }
  }

  // Cannot read properties of null/undefined (reading 'Y') 变体
  m = msg.match(/Cannot read property '([^']+)' of (undefined|null)/);
  if (m && names.length) { set(names[0], { [m[1]]: 3 }); return { changed, root: names[0] }; }

  return { changed, root: null };
}

let fixed = 0, still = [];
targets.forEach(e => {
  let input = SH[e.id];
  // __map__ 标记还原成真 Map
  if (input) { Object.keys(input).forEach(k => { if (input[k] && input[k].__map__) input[k] = new Map(); }); }
  if (!input) return;
  if (canRun(e.id, input)) return;

  for (let round = 0; round < 12; round++) {
    const r = B.run(e.id, input);
    if (r && (r.success || r.degraded)) {
      SH[e.id] = input; fixed++; return;
    }
    const msg = String(r && r.error || "");
    const { changed } = applyFix(msg, input, e.paramNames);
    if (!changed.length) break;
  }
  const r2 = B.run(e.id, input);
  if (r2 && (r2.success || r2.degraded)) { SH[e.id] = input; fixed++; }
  else still.push({ id: e.id, why: String(r2 && r2.error || "").slice(0, 64) });
});

fs.writeFileSync(path.join(__dirname, "shapes.json"), JSON.stringify(SH, null, 1), "utf8");

// 总测
let ok = 0;
targets.forEach(e => {
  const input = SH[e.id] || Object.fromEntries(e.paramNames.map(n => [n, [1, 2, 3]]));
  if (canRun(e.id, input)) ok++;
});

console.log("=".repeat(74));
console.log("最终一轮类型纠正");
console.log("=".repeat(74));
console.log(`本轮再修复: ${fixed}`);
console.log(`仍调不通  : ${still.length}`);
console.log(`最终可调通: ${ok} / ${targets.length} = ${(ok / targets.length * 100).toFixed(1)}%`);
console.log(`shapes.json 样例: ${Object.keys(SH).length} 条`);
if (still.length) {
  console.log("\n仍不通：");
  still.forEach(x => console.log(`  ✗ ${x.id}: ${x.why}`));
}
