"use strict";
/**
 * reflect.cjs — 从 handler 源码反射出真实入参契约
 *
 * 解决两个问题：
 *   1. T2 全部 400 条的 inputSchema 字面值是 "varies"（等于零契约）
 *   2. 位置多参算法在 MCP 单对象通道上无法直接调用，需要知道形参名才能按名展开
 */

/** 从函数源码里抽出形参名 */
function paramNames(fn) {
  let src;
  try { src = Function.prototype.toString.call(fn); } catch (e) { return []; }
  if (!src || /\[native code\]/.test(src)) return [];
  // 去掉注释
  src = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  let list = null;

  // 1) function 声明/表达式
  let m = src.match(/^[^(]*?function\s*\*?\s*[A-Za-z0-9_$]*\s*\(([^)]*)\)/);
  if (m) list = m[1];

  // 2) 箭头函数（单参无括号）
  if (!list) {
    m = src.match(/^\s*(?:async\s*)?([A-Za-z_$][\w$]*)\s*=>/);
    if (m) return [m[1]];
  }
  // 3) 箭头函数（带括号），取顶层第一个参数列表
  if (!list) {
    const idx = src.indexOf("=>");
    if (idx > 0) {
      const head = src.slice(0, idx).trim();
      const open = head.indexOf("(");
      if (open >= 0) {
        let depth = 0, end = -1;
        for (let i = open; i < head.length; i++) {
          if (head[i] === "(") depth++;
          else if (head[i] === ")") { depth--; if (depth === 0) { end = i; break; } }
        }
        if (end > open) list = head.slice(open + 1, end);
      }
    }
  }
  if (!list) return [];

  // 拆分顶层逗号
  const out = [];
  let depth = 0, cur = "";
  for (const ch of list) {
    if ("([{<".includes(ch)) depth++;
    if (")]}>".includes(ch)) depth--;
    if (ch === "," && depth === 0) { if (cur.trim()) out.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());

  return out.map(p => {
    // 去默认值与解构，只取名字
    const name = p.split("=")[0].trim().replace(/^\.\.\./, "");
    const simple = name.match(/^([A-Za-z_$][\w$]*)/);
    return simple ? simple[1] : null;
  }).filter(Boolean);
}

/** 生成人类可读的 inputSchema 字符串 */
function schemaOf(fn, extra = {}) {
  const names = paramNames(fn);
  if (!names.length) {
    return extra.fallback || "{ input: any }";
  }
  if (names.length === 1) {
    // 单参：如果是对象风格，说明它吃一个 input 对象
    return `{ ${names[0]}: any }`;
  }
  return `{ ${names.map(n => `${n}: any`).join("; ")} }  /* 位置参数 ${names.length} 个，MCP 侧按名展开 */`;
}

/** 把单对象入参按形参名展开成位置参数 */
function toPositional(input, names) {
  if (names.length <= 1) return [input];
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const keys = Object.keys(input);
    const byName = names.map(n => (n in input ? input[n] : undefined));
    const missing = names.filter(n => !(n in input));
    if (missing.length === 0) return byName;
    // 名字对不上就按值顺序喂，并保留缺失位置为 undefined
    const vals = keys.map(k => input[k]);
    return names.map((n, i) => (n in input ? input[n] : vals[i]));
  }
  if (Array.isArray(input)) return names.map((_, i) => input[i]);
  return names.map(() => input);
}

module.exports = { paramNames, schemaOf, toPositional };
