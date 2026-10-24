"use strict";
/**
 * repair-shapes.cjs — 错误驱动的入参形状自修复
 *
 * 思路：不靠人工为 139 条算法逐条写样例，而是从运行时报错反推所需形状，
 *       对入参做定向修补后重试，最多迭代 N 轮。修成功的形状落盘成 shapes.json。
 *
 * 支持的修补规则（来自真实报错的模式）：
 *   - "X.y is not iterable"              → X = { y: [] } / [ ... ]
 *   - "X.map is not a function"          → X = []
 *   - "X.get is not a function"          → X = new Map()
 *   - "X.set is not a function"          → X = new Map()
 *   - "X.steps is not iterable"          → X = { steps: [] }
 *   - "Cannot read properties of undefined (reading 'Y')" → 上一条语句里被取的属性缺 Y
 *   - "X is not a function"              → 该形参是函数型，MCP 结构性不可传，标记放弃
 *   - "X.toLowerCase is not a function"  → X = "sample"
 *   - "X.toFixed is not a function"      → X = 1
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
const targets = reg.filter(e => typeof e.handler === "function"
  && Array.isArray(e.paramNames) && e.paramNames.length > 1);

const FN_LIKE = /(Fn$|^fn$|^func|^callback|^cb$|^predicate|^comparator|^reducer|^mapper|^handler|^loss$|^rng$|^rand|^objective$|^keyExtractor|^hashFn|^scoreFn|^evolveFn|^valueFn|^distanceFn|^filterFn|^transform)/i;

function baseShapes(e) {
  const names = e.paramNames;
  return [
    Object.fromEntries(names.map(n => [n, [1, 2, 3]])),
    Object.fromEntries(names.map(n => [n, "sample"])),
    Object.fromEntries(names.map(n => [n, 2])),
    Object.fromEntries(names.map(n => [n, {}])),
    Object.fromEntries(names.map(n => [n, []])),
    Object.fromEntries(names.map(n => [n, { steps: [], items: [], values: [] }]))
  ];
}

/** 把报错翻译成修补动作 */
function repairPlan(msg, input, names) {
  const acts = [];
  let m;

  // X.y is not iterable
  m = msg.match(/([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*) is not iterable/);
  if (m) {
    const [, root, prop] = m;
    if (names.includes(root)) {
      acts.push(() => { input[root] = { [prop]: [] }; });
    } else {
      // 根不在顶层：尝试给所有对象型形参加该属性
      names.forEach(n => {
        if (input[n] && typeof input[n] === "object" && !Array.isArray(input[n])) {
          acts.push(() => { input[n][prop] = []; });
        }
      });
    }
    return acts;
  }

  // 裸 X is not iterable（形参本身需要可迭代）
  m = msg.match(/^([A-Za-z_$][\w$]*) is not iterable/);
  if (m && names.includes(m[1])) {
    acts.push(() => { input[m[1]] = []; });
    return acts;
  }
  // Cannot convert undefined or null to object
  if (/Cannot convert undefined or null to object/.test(msg)) {
    names.forEach(n => { acts.push(() => { if (input[n] == null) input[n] = {}; }); });
    if (!acts.length && names.length) acts.push(() => { input[names[0]] = {}; });
    return acts;
  }

  // X.map / X.filter / X.reduce is not a function
  m = msg.match(/([A-Za-z_$][\w$]*)\.(map|filter|reduce|forEach|flatMap|some|every|find) is not a function/);
  if (m && names.includes(m[1])) {
    acts.push(() => { input[m[1]] = []; });
    return acts;
  }

  // X.get / X.set / X.has is not a function
  m = msg.match(/([A-Za-z_$][\w$]*)\.(get|set|has|delete|entries|keys|values) is not a function/);
  if (m && names.includes(m[1])) {
    const M = new Map();
    acts.push(() => { input[m[1]] = M; });
    return acts;
  }

  // X.toLowerCase / X.trim / X.split / X.includes is not a function
  m = msg.match(/([A-Za-z_$][\w$]*)\.(toLowerCase|toUpperCase|trim|split|includes|startsWith|endsWith|replace|length) is not a function/);
  if (m && names.includes(m[1])) {
    acts.push(() => { input[m[1]] = "sample"; });
    return acts;
  }

  // X.toFixed / X.toPrecision is not a function
  m = msg.match(/([A-Za-z_$][\w$]*)\.(toFixed|toPrecision) is not a function/);
  if (m && names.includes(m[1])) {
    acts.push(() => { input[m[1]] = 1; });
    return acts;
  }

  // Cannot read properties of undefined (reading 'Y')
  m = msg.match(/Cannot read properties of undefined \(reading '([^']+)'\)/);
  if (m) {
    const prop = m[1];
    names.forEach(n => {
      if (input[n] && typeof input[n] === "object" && !Array.isArray(input[n])) {
        acts.push(() => { if (input[n][prop] === undefined) input[n][prop] = []; });
      }
    });
    if (!acts.length) {
      // 顶层都是数组/标量：给第一个形参套一层对象
      if (names.length) acts.push(() => { input[names[0]] = { [prop]: [] }; });
    }
    return acts;
  }

  // X.steps is not iterable 已被上面覆盖；补充 "X.Y is not a function"
  m = msg.match(/([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*) is not a function/);
  if (m) {
    const [, root, prop] = m;
    if (names.includes(root)) {
      acts.push(() => {
        const cur = input[root];
        if (cur && typeof cur === "object") input[root] = { ...cur, [prop]: () => 0 };
        else input[root] = { [prop]: () => 0 };
      });
    }
    return acts;
  }

  return acts;
}

const found = {};
const giveUp = [];
let okCount = 0;

targets.forEach(e => {
  const names = e.paramNames;
  if (names.some(n => FN_LIKE.test(n))) { giveUp.push({ id: e.id, reason: "函数型形参（MCP 不可传）" }); return; }

  // 先试基础形态
  for (const s of baseShapes(e)) {
    const r = B.run(e.id, s);
    if (r && (r.success || r.degraded)) {
      if (r.success) { found[e.id] = s; okCount++; }
      else { okCount++; }   // 能跑出结构（哪怕含 NaN）也算可调
      return;
    }
  }

  // 再试错误驱动修复
  let input = Object.fromEntries(names.map(n => [n, [1, 2, 3]]));
  let lastErr = "";
  for (let iter = 0; iter < 8; iter++) {
    const r = B.run(e.id, input);
    if (r && r.success) { found[e.id] = input; okCount++; return; }
    if (r && r.degraded) { okCount++; return; }          // 已调通，只是输出劣质
    lastErr = String(r && r.error || "");
    if (/is not a function/.test(lastErr)) {
      const m2 = lastErr.match(/([A-Za-z_$][\w$]*) is not a function/);
      if (m2 && names.includes(m2[1]) && !FN_LIKE.test(m2[1])) {
        // 把该形参换成对象（很多时候是期望 {x:...} 而不是数组）
        input[m2[1]] = {};
        continue;
      }
    }
    const acts = repairPlan(lastErr, input, names);
    if (!acts.length) break;
    acts.forEach(fn => { try { fn(); } catch (err) { /* 修复动作本身失败则跳过 */ } });
  }
  giveUp.push({ id: e.id, reason: lastErr.slice(0, 90) });
});

const out = path.join(__dirname, "shapes.json");
fs.writeFileSync(out, JSON.stringify(found, null, 1), "utf8");

console.log("=".repeat(84));
console.log("错误驱动形状自修复结果");
console.log("=".repeat(84));
console.log(`位置多参总数: ${targets.length}`);
console.log(`最终可调通: ${targets.length - giveUp.length}  （含未落盘的降级可调）`);
console.log(`落盘精确样例: ${Object.keys(found).length} 条 → ${out}`);
console.log(`放弃: ${giveUp.length}`);
const fn = giveUp.filter(g => /函数型/.test(g.reason)).length;
console.log(`  其中函数型形参: ${fn} ｜ 其余（形状仍无法自动推导）: ${giveUp.length - fn}`);
console.log("\n放弃样例（前 12）：");
giveUp.filter(g => !/函数型/.test(g.reason)).slice(0, 12)
  .forEach(g => console.log(`   ✗ ${g.id}: ${g.reason}`));
