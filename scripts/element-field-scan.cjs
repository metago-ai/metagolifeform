"use strict";
/**
 * element-field-scan.cjs — 元素级字段错配扫描（DEF-007 类）
 *
 * 手法：从 handler 源码提取「对形参元素」的属性访问，如
 *   values[i].xxx / t.max / item.fitness / c.id
 * 再检查样例里对应形参的元素对象是否真的含这些字段。
 * 缺字段 → 该分支永远不会进入 → 静默失效。
 */
const path = require("path");
const T3 = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/t3impl";
const REG = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js");
const { bind } = require(path.join(T3, "bind.cjs"));
const SH = require(path.join(T3, "shapes.json"));
const B = bind(REG);

/* 内置属性/方法名：这些不是业务字段，必须排除 */
const BUILTIN = new Set([
  "map", "filter", "reduce", "forEach", "find", "some", "every", "sort", "slice",
  "concat", "join", "length", "push", "pop", "shift", "unshift", "includes", "indexOf",
  "flat", "keys", "values", "entries", "toString", "hasOwnProperty", "then", "catch",
  "split", "trim", "toFixed", "name", "message", "substring", "replace", "charAt"
]);


/* 从源码里找 param 的元素属性访问 */
function elementFields(src, param) {
  const esc = param.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fields = new Set();
  // 形式1：param[i].field  或  param.map(x=>x.field) 里的 x.field 需要另外处理
  const re1 = new RegExp(esc + "\\s*\\[[^\\]]+\\]\\s*\\.\\s*([A-Za-z_$][\\w$]*)", "g");
  let m;
  while ((m = re1.exec(src))) fields.add(m[1]);
  // 形式2：const x = param[i]; 之后 x.field —— 简化处理：找 param[i] 赋值给谁
  const re2 = new RegExp("(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*" + esc + "\\s*\\[[^\\]]+\\]", "g");
  const aliases = [];
  while ((m = re2.exec(src))) aliases.push(m[1]);
  // 形式3：param.map(x => x.field) / param.forEach(x => ...) / for (const x of param)
  const re3 = new RegExp(esc + "\\s*\\.\\s*(?:map|filter|forEach|find|some|every|sort)\\s*\\(\\s*\\(?\\s*([A-Za-z_$][\\w$]*)", "g");
  while ((m = re3.exec(src))) aliases.push(m[1]);
  const re4 = new RegExp("for\\s*\\(\\s*(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s+of\\s+" + esc, "g");
  while ((m = re4.exec(src))) aliases.push(m[1]);

  for (const a of new Set(aliases)) {
    if (BUILTIN.has(a)) continue;
    if (BUILTIN.has(a)) continue;
    const reA = new RegExp("\\b" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\.\\s*([A-Za-z_$][\\w$]*)", "g");
    while ((m = reA.exec(src))) fields.add(m[1]);
  }
  return [...fields].filter(f => !BUILTIN.has(f));
}

const issues = [];

REG.getRegistry().forEach(e => {
  if (typeof e.handler !== "function" || !SH[e.id]) return;
  const src = Function.prototype.toString.call(e.handler);
  const shape = SH[e.id];
  if (!shape || typeof shape !== "object" || Array.isArray(shape)) return;

  for (const [k, v] of Object.entries(shape)) {
    if (!Array.isArray(v) || v.length === 0) continue;
    const fields = elementFields(src, k);
    if (!fields.length) continue;

    // 样例元素若是对象，检查是否含这些字段
    const elem = v[0];
    if (elem && typeof elem === "object" && !Array.isArray(elem)) {
      const missing = fields.filter(f => !(f in elem) && !["length"].includes(f));
      if (missing.length) {
        issues.push({ id: e.id, desc: String(e.description || "").slice(0, 28), param: k,
          missing: missing.slice(0, 4), sample: JSON.stringify(elem).slice(0, 40) });
      }
    } else if (typeof elem === "number" || typeof elem === "string") {
      // 元素是标量，但算法在读元素字段 → 必然 undefined
      issues.push({ id: e.id, desc: String(e.description || "").slice(0, 28), param: k,
        missing: fields.slice(0, 4), sample: "标量元素 " + JSON.stringify(elem) });
    }
  }
});

console.log("=".repeat(86));
console.log("元素级字段错配扫描");
console.log("=".repeat(86));
console.log(`命中 ${issues.length} 处，涉及 ${new Set(issues.map(x => x.id)).size} 条算法`);
console.log();

const byId = {};
issues.forEach(x => { (byId[x.id] = byId[x.id] || []).push(x); });

Object.keys(byId).sort().forEach(id => {
  console.log("● " + id + "  " + byId[id][0].desc);
  byId[id].forEach(x => {
    console.log("   参数 " + x.param.padEnd(14) + " 算法读取字段 " + JSON.stringify(x.missing) + "  样例元素 " + x.sample);
  });
});

console.log();
console.log("-".repeat(86));
console.log(issues.length === 0 ? "总判定：PASS" : `总判定：需关注（${issues.length} 处元素字段错配）`);
