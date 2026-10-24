"use strict";
/**
 * t3test.cjs — T3 实现自测台
 *
 * 对每条已实现的 T3 算法：
 *   1. 用符合它 inputSchema 的样例输入调用
 *   2. 校验不抛错、返回对象
 *   3. 逐字段比对 outputSchema 声明的键是否全部产出
 *   4. 校验数值字段不是 NaN / 非有限数
 * 任一条不过 → 整体 FAIL
 */
const path = require("path");
/* --- 本地优先路径解析（包内运行时禁止依赖外部副本）--- */
const __p = require("path");
const __f = require("fs");
function __pick(list) {
  for (const p of list) { try { if (__f.existsSync(p)) return p; } catch (e) {} }
  return list[list.length - 1];
}


const REG = require(__pick([
  __p.join(__dirname, "..", "registry.js"),
  "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js",
]));
const DIR = path.join(__dirname, "families");
const FAMILIES = ["coupling", "value", "bias", "logic", "evolution", "creation", "learning", "frequency", "decision", "security", "negentropy", "time", "memory", "reasoning", "intuition", "conflict"];

function outKeys(schema) {
  const s = String(schema || "");
  const seg = s.replace(/^\s*\{/, "").replace(/\}\s*$/, "");
  let depth = 0, buf = "";
  const parts = [];
  for (const ch of seg) {
    if ("{[(".includes(ch)) depth++;
    if ("}])".includes(ch)) depth--;
    if (ch === ";" && depth === 0) { parts.push(buf); buf = ""; continue; }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf);
  const keys = [];
  parts.forEach(p => {
    const m = p.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\??\s*:/);
    if (m) keys.push(m[1]);
  });
  return keys;
}

/* 载入各族：支持 {handlers, samples} 或直接导出 handlers */
const impl = {}, samples = {};
FAMILIES.forEach(f => {
  const mod = require(path.join(DIR, f + ".js"));
  const h = mod.handlers || mod;
  Object.assign(impl, h);
  if (mod.samples) Object.assign(samples, mod.samples);
});

function autoSample(schema) {
  const o = {};
  const re = /([A-Za-z_][A-Za-z0-9_]*)\s*\??\s*:\s*([^;{}]+(?:\[\])?|[A-Za-z_]+)/g;
  let m;
  while ((m = re.exec(String(schema || "")))) {
    const [, name, type] = m;
    const t = String(type).trim();
    if (t.endsWith("[]")) o[name] = [];
    else if (/number/.test(t)) o[name] = 1;
    else if (/string/.test(t)) o[name] = "x";
    else if (/boolean/.test(t)) o[name] = true;
    else o[name] = {};
  }
  return o;
}

const reg = REG.getRegistry().filter(e => e.tier === "T3");
let pass = 0, fail = 0, warn = 0;
const missing = [];
const rows = [];
const stubs = [];

/* 反桩检测：把输入做扰动，输出必须跟着变——否则就是「返回常量」的假实现
 * 关键：优先扰动数值叶子。若只改名字/ID 这类语义无关字段，
 * 输出本来就不该变，那会造出假 FAIL（假 FAIL 和假 PASS 一样有害）。 */
function numericPaths(v, path = [], out = []) {
  if (typeof v === "number") out.push(path);
  else if (Array.isArray(v)) v.forEach((x, i) => numericPaths(x, path.concat(i), out));
  else if (v && typeof v === "object") Object.keys(v).forEach(k => numericPaths(v[k], path.concat(k), out));
  return out;
}
function stringPaths(v, path = [], out = []) {
  if (typeof v === "string") out.push(path);
  else if (Array.isArray(v)) v.forEach((x, i) => stringPaths(x, path.concat(i), out));
  else if (v && typeof v === "object") Object.keys(v).forEach(k => stringPaths(v[k], path.concat(k), out));
  return out;
}
function clone(v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); }
function setPath(obj, path, val) {
  if (!path.length) return;
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
  cur[path[path.length - 1]] = val;
}
function perturbAt(v, path, factor) {
  const c = clone(v);
  if (!path.length) return c;
  const old = path.reduce((o, k) => o[k], c);
  setPath(c, path, typeof old === "number" ? (old === 0 ? factor : old * factor) : String(old) + "_p" + factor);
  return c;
}
function perturbAllNums(v, factor) {
  const c = clone(v);
  numericPaths(c).forEach(p => {
    const old = p.reduce((o, k) => o[k], c);
    setPath(c, p, old === 0 ? factor : old * factor);
  });
  return c;
}
/* 生成一组多样化扰动：逐个数叶子 × 全部数值同时 × 一个字符串叶子
 * 阈值类参数在不触发时本不该影响输出，所以"某一个扰动无变化"不算桩。 */
function setAllNums(v, fn) {
  const c = clone(v);
  numericPaths(c).forEach(p => {
    const old = p.reduce((o, k) => o[k], c);
    setPath(c, p, fn(old));
  });
  return c;
}
/* 生成一组多样化扰动：
 *  - 逐个数叶子（头/尾）
 *  - 全部数值同乘
 *  - 字符串叶子
 *  - 跨区间试验：全零 / 全同值 —— 把输入推到另一个状态，
 *    否则"正确地说 false"和"永远说 false"无法区分 */
function trialInputs(v) {
  const nums = numericPaths(v);
  const strs = stringPaths(v);
  const trials = [];
  nums.slice(0, 4).forEach((p, i) => trials.push(perturbAt(v, p, 1 + 0.37 * (i + 1))));
  nums.slice(-4).forEach((p, i) => trials.push(perturbAt(v, p, 1 + 0.23 * (i + 1))));
  if (nums.length > 1) trials.push(perturbAllNums(v, 1.37));
  strs.slice(0, 4).forEach((p, i) => trials.push(perturbAt(v, p, 1 + i)));
  if (nums.length) {
    trials.push(setAllNums(v, () => 0));
    trials.push(setAllNums(v, () => 1));
    trials.push(setAllNums(v, x => -x));
  }
  const seen = new Set();
  return trials.filter(t => {
    const k = JSON.stringify(t);
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
}

reg.forEach(e => {
  const fn = impl[e.id];
  if (!fn) { missing.push(e.id); return; }
  const keys = outKeys(e.outputSchema);
  const hasSample = !!samples[e.id];
  const sample = hasSample ? samples[e.id]() : autoSample(e.inputSchema);
  let out, err = null;
  try { out = fn(sample); } catch (ex) { err = ex; }
  const problems = [];
  if (err) problems.push("抛错: " + err.message);
  else if (!out || typeof out !== "object") problems.push("未返回对象");
  else {
    keys.forEach(k => {
      if (!(k in out)) problems.push("缺字段 " + k);
      else if (typeof out[k] === "number" && !isFinite(out[k])) problems.push("字段 " + k + " 非有限数");
    });
  }

  // 反桩：一组多样化扰动，只要有任意一次输出变化即视为「真的在算」
  let responsive = false;
  let trials = 0;
  if (!err) {
    const base = JSON.stringify(out);
    for (const t of trialInputs(sample)) {
      trials++;
      try {
        const o2 = fn(t);
        if (JSON.stringify(o2) !== base) { responsive = true; break; }
      } catch (ex) { /* 扰动后抛错不算通过，也不阻断 */ }
    }
    if (!responsive) problems.push(`反桩未通过：${trials} 组扰动后输出均不变`);
  }

  if (problems.length) { fail++; rows.push(["FAIL", e.id, e.name, problems.join(" / ")]); }
  else {
    pass++;
    if (!hasSample) warn++;
    rows.push(["OK  ", e.id, e.name, keys.length + " 字段全中 · 反桩通过" + (hasSample ? "" : "（自动样例）")]);
  }
});

console.log("=".repeat(100));
console.log("T3 实现自测 —— 族: " + FAMILIES.join(", "));
console.log("=".repeat(100));
console.log("T3 总数 " + reg.length + " ｜ 已实现并测试 " + (pass + fail) + " ｜ 未实现 " + missing.length);
console.log("-".repeat(100));
rows.forEach(r => console.log(r[0] + " " + String(r[1]).padEnd(16) + " " + String(r[2]).padEnd(16) + " " + r[3]));
console.log("-".repeat(100));
console.log("通过 " + pass + " ｜ 失败 " + fail + " ｜ 未实现 " + missing.length + " ｜ 无专属样例 " + warn);
if (missing.length) console.log("未实现: " + missing.slice(0, 24).join(", ") + (missing.length > 24 ? " …" : ""));
process.exit(fail === 0 ? 0 : 1);
