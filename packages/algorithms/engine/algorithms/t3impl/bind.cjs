"use strict";
/**
 * bind.cjs — 把 T3 真实实现接入运行时注册表，并统一执行语义
 *
 * 设计原则（不修改任何第三方包文件）：
 *   - 只在运行时给注册表条目挂 handler / 修 implemented
 *   - 执行路径统一走「入参适配 → 严格执行 → 输出校验」
 *   - 空输出 / NaN / undefined 一律判失败，不再伪装 success:true
 */
const path = require("path");
const { paramNames, schemaOf, toPositional } = require("./reflect.cjs");

const FAMILIES = [
  "coupling", "value", "bias", "logic", "evolution", "creation", "learning",
  "frequency", "decision", "security", "negentropy", "time",
  "memory", "reasoning", "intuition", "conflict"
];

const IMPL = {};
const SAMPLES = {};
FAMILIES.forEach(f => {
  const mod = require(path.join(__dirname, "families", f + ".js"));
  Object.assign(IMPL, mod.handlers || mod);
  Object.assign(SAMPLES, mod.samples || {});
});

/** 输出体检：空对象/空数组/NaN/undefined 一律视为不可用 */
function inspectOutput(out) {
  if (out === undefined) return "输出为 undefined";
  if (out === null) return "输出为 null";
  if (typeof out === "number" && !isFinite(out)) return "输出为 NaN/Infinity";
  if (Array.isArray(out) && out.length === 0) return "输出为空数组（疑似未真正计算）";
  if (typeof out === "object") {
    const keys = Object.keys(out);
    if (!keys.length) return "输出为空对象";
    const bad = [];
    (function walk(v, p, depth) {
      if (depth > 4) return;
      if (typeof v === "number" && !isFinite(v)) bad.push(p);
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`, depth + 1));
      else if (v && typeof v === "object") Object.keys(v).forEach(k => walk(v[k], `${p}.${k}`, depth + 1));
    })(out, "out", 0);
    if (bad.length) return `输出含非有限数：${bad.slice(0, 3).join(", ")}`;
  }
  return null;
}

/**
 * 绑定 T3 实现并返回一个可用的执行器包
 * @param {object} registry 原注册表模块（require 结果）
 */
function bind(registry) {
  const reg = registry.getRegistry();
  const bound = [];
  const skipped = [];
  reg.forEach(e => {
    if (e.tier !== "T3") return;
    const fn = IMPL[e.id];
    if (typeof fn !== "function") { skipped.push(e.id); return; }
    e.handler = fn;
    e.implemented = true;
    e.kind = "algorithm";
    e.paramNames = paramNames(fn);
    // 入参契约：T3 本来就是单对象风格
    if (!e.inputSchema || e.inputSchema === "varies") {
      e.inputSchema = `{ input: object }  /* T3 概念算法，入参见实现声明 */`;
    }
    bound.push(e.id);
  });

  /* ---- T2 契约反射：把 "varies" 换成从源码抽出的形参名 ---- */
  const t2Fixed = [];
  reg.forEach(e => {
    if (e.tier !== "T2") return;
    if (String(e.inputSchema).trim() !== "varies") return;
    if (typeof e.handler !== "function") return;
    e.paramNames = paramNames(e.handler);
    e.inputSchema = schemaOf(e.handler, { fallback: "{ input: object }" });
    t2Fixed.push(e.id);
  });

  /* ---- 全量形参反射（T1/T2 都要，否则位置多参会漏算）---- */
  const reflectStats = { total: 0, ok: 0, failed: 0, arityGt1: 0, arityGt1Reflected: 0 };
  reg.forEach(e => {
    if (typeof e.handler !== "function") return;
    reflectStats.total++;
    const arity = e.handler.length;
    if (!Array.isArray(e.paramNames) || !e.paramNames.length) {
      e.paramNames = paramNames(e.handler);
    }
    const got = e.paramNames.length;
    if (got > 0) reflectStats.ok++; else reflectStats.failed++;
    if (arity > 1) {
      reflectStats.arityGt1++;
      if (got > 1) reflectStats.arityGt1Reflected++;
    }
  });

  /* ---- T1 契约补全：凡 inputSchema 为空或含糊的，用反射结果替换 ---- */
  const t1Fixed = [];
  reg.forEach(e => {
    if (e.tier !== "T1") return;
    if (typeof e.handler !== "function") return;
    const s = String(e.inputSchema ?? "").trim();
    if (s && s !== "varies" && s !== "any" && s !== "-") return;
    e.inputSchema = schemaOf(e.handler, { fallback: "{ input: object }" });
    t1Fixed.push(e.id);
  });

  /* ---- 位置参数统计（用于入参适配）---- */
  const positional = reg.filter(e => Array.isArray(e.paramNames) && e.paramNames.length > 1);
  positional.forEach(e => { e.positional = true; });
  // 有多个形参但反射失败的：标记为不可安全适配，交给调用方显式按数组传参
  const positionalUnknown = reg.filter(e => typeof e.handler === "function"
    && e.handler.length > 1 && !(Array.isArray(e.paramNames) && e.paramNames.length > 1));
  positionalUnknown.forEach(e => { e.positional = false; e.paramNamesUnknown = true; });

  const byId = new Map(reg.map(e => [e.id, e]));

  /* ---- 统一执行 ---- */
  /* ---- 输出有效性守卫（与 registry 侧一致，覆盖 bind.run 路径）---- */
function _badPaths(v, prefix, out, depth) {
  if (depth > 8) return;
  if (typeof v === "number") { if (!isFinite(v)) out.push(prefix || "root"); }
  else if (Array.isArray(v)) { for (let i = 0; i < v.length && out.length < 12; i++) _badPaths(v[i], prefix + "[" + i + "]", out, depth + 1); }
  else if (v && typeof v === "object") {
    if (v instanceof Map || v instanceof Set) return;
    for (const k of Object.keys(v)) { if (out.length >= 12) break; _badPaths(v[k], prefix ? prefix + "." + k : k, out, depth + 1); }
  }
}
function _guard(res, id) {
  if (!res || typeof res !== "object" || res.success !== true) return res;
  const bad = [];
  _badPaths(res.output !== undefined ? res.output : res, "", bad, 0);
  if (bad.length === 0) return res;
  return {
    success: false, degraded: false, id,
    error: "invalid_output: 输出含非有限数（NaN/Infinity）于 " + bad.join(", ") + " —— 该算法未校验输入，已拦截",
    reason: "INVALID_OUTPUT", invalidPaths: bad, rawOutput: res.output,
  };
}

let _fnBridge = null;
function fnBridge() {
  if (!_fnBridge) {
    try { _fnBridge = require("./fn-bridge.cjs"); } catch (e) { _fnBridge = false; }
  }
  return _fnBridge || null;
}

/* 标记还原：JSON 无法表达 Map / RegExp，用标记承载，运行时还原 */
function revive(v, depth) {
  depth = depth || 0;
  if (depth > 12) return v;
  if (v === null || typeof v !== "object") return v;
  // 已经是原生实例：原样放行（否则 for...in 会把 Map/Set/RegExp 变成空对象）
  if (v instanceof Map || v instanceof Set || v instanceof RegExp || v instanceof Date ||
      v instanceof Error || ArrayBuffer.isView(v)) return v;
  if (Array.isArray(v)) return v.map(function (x) { return revive(x, depth + 1); });
  if (v.__map__) {
    var m = new Map();
    var es = v.entries || [];
    for (var i = 0; i < es.length; i++) {
      var pr = es[i];
      if (Array.isArray(pr)) m.set(revive(pr[0], depth + 1), revive(pr[1], depth + 1));
    }
    return m;
  }
  if (v.__set__) return new Set((v.values || []).map(function (x) { return revive(x, depth + 1); }));
  if (typeof v.__regex__ === "string") {
    try { return new RegExp(v.__regex__, v.flags || ""); } catch (e) { return v.__regex__; }
  }
  if (typeof v.__fn__ === "string") {
    // 编译为真函数（与 fn-bridge 同源规则：禁 require/process/eval 等）
    try {
      var b = fnBridge();
      if (b && typeof b.compile === "function") {
        var cf = b.compile(v.__fn__);
        if (typeof cf === "function") return cf;
      }
    } catch (e) { /* 编译失败则退回原字符串 */ }
    return v.__fn__;
  }
  var o = {};
  for (var k in v) { if (Object.prototype.hasOwnProperty.call(v, k)) o[k] = revive(v[k], depth + 1); }
  return o;
}

function run(id, input) {
    const e = byId.get(id);
    if (!e) return { success: false, error: `算法 ${id} 不存在`, provenance: [], durationMs: 0 };
    if (typeof e.handler !== "function") {
      return { success: false, error: `算法 ${id} 未实现（NOT_IMPLEMENTED）`, provenance: [`[${id}] NOT_IMPLEMENTED`], durationMs: 0 };
    }
    const t0 = Date.now();
    let out;
    try {
      // 标记还原（Map / Set / RegExp）
      input = revive(input);

      // 函数型形参桥接：字符串 → 真函数（MCP 无法传函数的补足）
      let hydrated = input;
      const fb = fnBridge();
      if (fb && e.paramNames && (e.positional || e.paramNames.length > 1)) {
        const h = fb.hydrate(input, e.paramNames);
        if (h.compiled.length) hydrated = h.input;
        if (!h.ok && h.failed.length) {
          return {
            success: false,
            error: `函数型形参无法编译: ${h.failed.join(", ")} —— 请传受限表达式字符串（如 "x => x*2" 或 "Math.random"）`,
            reason: "FN_COMPILE_FAILED",
            provenance: [`[${id}] fn_compile_failed`],
            durationMs: Date.now() - t0,
          };
        }
      }
      const args = e.positional ? toPositional(hydrated, e.paramNames) : [hydrated];
      out = e.handler.apply(null, args);
      if (out && typeof out.then === "function") {
        return { success: false, error: `算法 ${id} 的 handler 是异步的，请使用异步执行入口`, provenance: [`[${id}] async_handler_detected`], durationMs: Date.now() - t0 };
      }
    } catch (err) {
      return { success: false, error: err.message, provenance: [`[${id}] error: ${err.message}`], durationMs: Date.now() - t0 };
    }
    const bad = inspectOutput(out);
    if (bad) {
      return {
        success: false,
        error: `${id} 输出不可用：${bad}`,
        degraded: true,
        provenance: [`[${id}] EMPTY_OR_INVALID_OUTPUT`, bad],
        output: out,
        durationMs: Date.now() - t0
      };
    }
    return {
      success: true, output: out,
      provenance: [`[${id}] executed${e.positional ? "_positional" : ""}`],
      durationMs: Date.now() - t0
    };
  }

  function runAll() {
    const results = [];
    const samples = SAMPLES;
    reg.forEach(e => {
      if (typeof e.handler !== "function") {
        results.push({ id: e.id, tier: e.tier, ok: false, reason: "无 handler" });
        return;
      }
      let sample = samples[e.id];
      if (typeof sample === "function") {
        try { sample = sample(); } catch (err) { sample = { input: {} }; }
      } else {
        sample = {};
      }
      const r = run(e.id, sample);
      results.push({ id: e.id, tier: e.tier, ok: r.success, reason: r.success ? "" : r.error });
    });
    return results;
  }

  return {
    registry,
    bound, skipped, t2Fixed, t1Fixed,
    reflectStats,
    positionalCount: positional.length,
    positionalUnknownCount: positionalUnknown.length,
    impl: IMPL, samples: SAMPLES,
    run, runAll, inspectOutput,
    get: id => byId.get(id)
  };
}

module.exports = { bind, inspectOutput, IMPL, SAMPLES, FAMILIES };
