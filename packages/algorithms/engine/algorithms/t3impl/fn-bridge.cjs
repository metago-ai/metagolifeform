"use strict";
/**
 * fn-bridge.cjs — 函数型形参的 MCP 桥接层（元创造）
 *
 * 问题：MCP 是 JSON 协议，无法传函数。21 条算法因函数型形参在 MCP 侧结构性不可调。
 * 解法：允许以**受限表达式字符串**传入，运行时安全编译为函数。
 *
 * 安全边界（必须理解）：
 *   - 只允许纯表达式/箭头函数，禁止访问 require/process/global/module/eval/Function/import
 *   - 长度上限 512 字符
 *   - 编译失败返回 null，由调用方抛明确错误
 *   - 执行时 try/catch，异常不外泄
 *   - 这是本地可信环境下对 JSON 协议限制的补足，不是沙箱；不可用于执行不可信代码
 */

const MAX_LEN = 512;
const BANNED = /\b(require|process|global|globalThis|module|exports|eval|Function|import|__proto__|constructor\s*\.\s*constructor|setTimeout|setInterval|Buffer|child_process)\b/;

/** 预置常用函数（字符串简写 → 实现） */
const PRESETS = {
  "Math.random": () => Math.random,
  "random": () => Math.random,
  "identity": () => (x) => x,
  "sum": () => (a, b) => (a || 0) + (b || 0),
  "avg": () => (a, b) => ((a || 0) + (b || 0)) / 2,
  "max": () => (a, b) => Math.max(a, b),
  "min": () => (a, b) => Math.min(a, b),
  "euclidean": () => (a, b) => Math.sqrt((a - b) ** 2),
  "absdiff": () => (a, b) => Math.abs(a - b),
  "length": () => (x) => (x && x.length) || 0,
  "count": () => (x) => (x && x.length) || 0,
  "first": () => (x) => (Array.isArray(x) ? x[0] : x),
};

function compile(expr) {
  if (typeof expr !== "string") return null;
  const s = expr.trim();
  if (!s || s.length > MAX_LEN) return null;
  if (BANNED.test(s)) return null;

  const preset = PRESETS[s];
  if (preset) return preset();

  try {
    // 先尝试当作箭头函数/函数表达式
    let fn;
    try {
      fn = new Function("return (" + s + ");")();
    } catch (e) {
      // 再尝试当作函数体
      fn = new Function("a", "b", "return (" + s + ");");
    }
    if (typeof fn !== "function") return null;
    // 包一层，异常不外泄
    return function () {
      try { return fn.apply(null, arguments); }
      catch (err) { return undefined; }
    };
  } catch (e) {
    return null;
  }
}

/** 函数型形参名识别（与 bind 侧一致） */
const FN_PARAM = /(Fn$|^fn$|^func|^callback|^cb$|^predicate|^comparator|^reducer|^mapper|^handler|^loss$|^rng$|^rand|^objective$|^keyExtractor|^hashFn|^scoreFn|^evolveFn|^valueFn|^distanceFn|^filterFn|^transform|^similarityFn$|^aggFn$|^difficultyFn$|^feasibilityFn$)/i;

/**
 * 把输入对象里的「字符串函数形参」编译成真函数。
 * @returns {{ok:boolean, input:object, compiled:string[], failed:string[]}}
 */
function hydrate(input, paramNames) {
  const out = Object.assign({}, input || {});
  const compiled = [], failed = [];
  const names = Array.isArray(paramNames) ? paramNames : Object.keys(out);

  names.forEach(n => {
    if (!FN_PARAM.test(n)) return;
    const v = out[n];
    if (typeof v === "function") return;              // 已是函数
    if (typeof v !== "string") return;                // 非字符串：原样透传（该形参可能就是普通值）
    const fn = compile(v);
    if (fn) { out[n] = fn; compiled.push(n); }
    else failed.push(n);
  });

  return { ok: failed.length === 0, input: out, compiled, failed };
}

module.exports = { compile, hydrate, PRESETS, FN_PARAM, MAX_LEN };

/* ---------------- 自测 ---------------- */
if (require.main === module) {
  const CASES = [
    ["Math.random", "function", true],
    ["random", "function", true],
    ["x => x * 2", "function", true],
    ["(a, b) => a + b", "function", true],
    ["a * b", "function", true],
    ["require('fs')", "null", false],
    ["process.exit(1)", "null", false],
    ["eval('1')", "null", false],
    ["global.x = 1", "null", false],
    ["x".repeat(600), "null", false],
  ];
  console.log("=".repeat(72));
  console.log("函数桥接器自测");
  console.log("=".repeat(72));
  let pass = 0, fail = 0;
  CASES.forEach(([expr, expect, shouldOk]) => {
    const fn = compile(expr);
    const got = fn === null ? "null" : typeof fn;
    const ok = got === expect;
    if (ok) pass++; else fail++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${String(expr).slice(0, 26).padEnd(28)} → ${got.padEnd(9)} 期望 ${expect}`);
  });

  console.log();
  console.log("--- hydrate 测试 ---");
  const h = hydrate({ labels: [1, 2], scoreFn: "x => x * 10" }, ["labels", "scoreFn"]);
  console.log("编译成功:", h.ok, "| compiled:", h.compiled, "| scoreFn(3) =", h.input.scoreFn(3));
  const h2 = hydrate({ scoreFn: "require('fs')" }, ["scoreFn"]);
  console.log("危险表达式被拒:", !h2.ok, "| failed:", h2.failed);

  console.log();
  console.log(`用例 ${CASES.length} ｜ 通过 ${pass} ｜ 失败 ${fail}`);
  console.log(fail === 0 ? "总判定：PASS" : "总判定：FAIL");
  process.exit(fail === 0 ? 0 : 1);
}
