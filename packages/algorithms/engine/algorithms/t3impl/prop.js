"use strict";
/**
 * prop.js — 命题逻辑引擎（LOGIC 族的地基）
 * 支持：解析 / 求值 / NNF / CNF / DNF / 化简 / DPLL 求解 / 真值表
 * AST: {op, args?, name?}
 *   op ∈ var | const | not | and | or | implies | iff
 */

const PREC = { iff: 1, implies: 2, or: 3, and: 4, not: 5 };

function tokenize(src) {
  const s = String(src);
  const out = [];
  let i = 0;
  const DUAL = [
    ["<->", "iff"], ["->", "implies"], ["&&", "and"], ["||", "or"],
    ["&", "and"], ["|", "or"], ["!", "not"], ["~", "not"], ["¬", "not"],
    ["∧", "and"], ["∨", "or"], ["→", "implies"], ["↔", "iff"],
    ["(", "("], [")", ")"], ["（", "("], ["）", ")"],
    ["true", "const:true"], ["false", "const:false"],
    ["⊤", "const:true"], ["⊥", "const:false"]
  ];
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    let hit = false;
    for (const [pat, kind] of DUAL) {
      if (s.startsWith(pat, i)) {
        if (/^[a-z]/i.test(pat) && /[A-Za-z0-9_]/.test(s[i + pat.length] || "")) continue;
        out.push({ t: kind, v: pat }); i += pat.length; hit = true; break;
      }
    }
    if (hit) continue;
    const m = /^[A-Za-z_\u4e00-\u9fa5][A-Za-z0-9_\u4e00-\u9fa5]*/.exec(s.slice(i));
    if (m) { out.push({ t: "var", v: m[0] }); i += m[0].length; continue; }
    throw new Error(`命题解析失败：位置 ${i} 出现无法识别字符「${c}」`);
  }
  return out;
}

function parse(src) {
  if (src && typeof src === "object" && src.op) return normalizeAst(src);
  const tk = tokenize(src);
  let p = 0;
  const peek = () => tk[p];
  const eat = v => {
    if (!tk[p] || tk[p].v !== v) throw new Error(`期望 "${v}"，实际 "${tk[p] ? tk[p].v : "结束"}"`);
    return tk[p++];
  };
  function parseExpr(minPrec) {
    let left = parseUnary();
    for (;;) {
      const t = peek();
      if (!t) break;
      const op = t.t;
      if (!(op in PREC) || PREC[op] < minPrec) break;
      p++;
      const right = parseExpr(PREC[op] + 1);
      left = { op, args: [left, right] };
    }
    return left;
  }
  function parseUnary() {
    const t = peek();
    if (!t) throw new Error("命题意外结束");
    if (t.t === "not") { p++; return { op: "not", args: [parseUnary()] }; }
    if (t.t === "(") { p++; const e = parseExpr(1); eat(")"); return e; }
    if (t.t === "var") { p++; return { op: "var", name: t.v }; }
    if (t.t.startsWith && t.t.startsWith("const:")) { p++; return { op: "const", value: t.t.endsWith("true") }; }
    throw new Error(`无法解析记号「${t.v}」`);
  }
  const ast = parseExpr(1);
  if (p !== tk.length) throw new Error("命题解析后仍有剩余记号：" + tk.slice(p).map(x => x.v).join(" "));
  return ast;
}

function normalizeAst(a) {
  if (typeof a === "string") return parse(a);
  if (!a || typeof a !== "object") return { op: "const", value: !!a };
  const op = String(a.op || "var").toLowerCase();
  const map = { "∧": "and", "∨": "or", "¬": "not", "→": "implies", "↔": "iff", "&": "and", "|": "or", "!": "not", "~": "not" };
  const O = map[op] || op;
  if (O === "var") return { op: "var", name: String(a.name ?? a.variable ?? "p") };
  if (O === "const") return { op: "const", value: !!(a.value ?? a.val ?? true) };
  const args = Array.isArray(a.args) ? a.args : (a.left !== undefined ? [a.left, a.right] : (a.proposition ? [a.proposition] : []));
  return { op: O, args: args.map(normalizeAst) };
}

function vars(a, set = new Set()) {
  if (a.op === "var") set.add(a.name);
  (a.args || []).forEach(x => vars(x, set));
  return set;
}
function varList(a) { return [...vars(a)].sort(); }

function evaluate(a, env) {
  switch (a.op) {
    case "var": return !!env[a.name];
    case "const": return !!a.value;
    case "not": return !evaluate(a.args[0], env);
    case "and": return a.args.every(x => evaluate(x, env));
    case "or": return a.args.some(x => evaluate(x, env));
    case "implies": return !evaluate(a.args[0], env) || evaluate(a.args[1], env);
    case "iff": return evaluate(a.args[0], env) === evaluate(a.args[1], env);
    default: throw new Error("未知运算符：" + a.op);
  }
}

function truthTable(a) {
  const vs = varList(a);
  const rows = [];
  const n = vs.length;
  for (let m = 0; m < (1 << n); m++) {
    const env = {};
    vs.forEach((v, i) => { env[v] = !!((m >> (n - 1 - i)) & 1); });
    rows.push({ assignment: env, value: evaluate(a, env) });
  }
  return { vars: vs, rows };
}

/* 否定范式 */
function nnf(a, neg = false) {
  switch (a.op) {
    case "var": return neg ? { op: "not", args: [a] } : a;
    case "const": return { op: "const", value: neg ? !a.value : a.value };
    case "not": return nnf(a.args[0], !neg);
    case "and":
    case "or": {
      const op = neg ? (a.op === "and" ? "or" : "and") : a.op;
      return { op, args: a.args.map(x => nnf(x, neg)) };
    }
    case "implies": {
      const left = nnf(a.args[0], !neg ? true : false);
      const right = nnf(a.args[1], neg ? false : false);
      if (!neg) return { op: "or", args: [nnf(a.args[0], true), nnf(a.args[1], false)] };
      return { op: "and", args: [nnf(a.args[0], false), nnf(a.args[1], true)] };
    }
    case "iff": {
      const A = a.args[0], B = a.args[1];
      if (!neg) return nnf({ op: "and", args: [{ op: "implies", args: [A, B] }, { op: "implies", args: [B, A] }] });
      return nnf({ op: "or", args: [{ op: "and", args: [A, { op: "not", args: [B] }] }, { op: "and", args: [{ op: "not", args: [A] }, B] }] });
    }
    default: throw new Error("NNF 不支持的运算符：" + a.op);
  }
}

/* 分配律展开 */
function distribute(a, target) {
  if (a.op !== "and" && a.op !== "or") return a;
  const op = a.op;
  if (op === target) return { op, args: a.args.map(x => distribute(x, target)) };
  // 需要把子项分配到另一运算符里
  const other = op;
  const flat = [];
  a.args.forEach(x => {
    const d = distribute(x, target);
    if (d.op === target) flat.push(...d.args);
    else flat.push(d);
  });
  // 把 flat 里每个都是 target 分支的进行笛卡尔积
  const groups = flat.map(f => (f.op === target ? f.args : [f]));
  let acc = [[]];
  groups.forEach(g => {
    const next = [];
    acc.forEach(prefix => g.forEach(item => next.push(prefix.concat([item]))));
    acc = next;
  });
  const result = acc.map(combo => {
    const uniq = [];
    const seen = new Set();
    combo.forEach(c => {
      const k = toStr(c);
      if (!seen.has(k)) { seen.add(k); uniq.push(c); }
    });
    return uniq.length === 1 ? uniq[0] : { op: other, args: uniq };
  });
  return result.length === 1 ? result[0] : { op: target, args: result };
}

function cnf(a) {
  const n = nnf(a);
  return distribute(n, "and");
}
function dnf(a) {
  const n = nnf(a);
  return distribute(n, "or");
}

function simplify(a) {
  if (!a.args) return a;
  const args = a.args.map(simplify);
  if (a.op === "not") {
    const x = args[0];
    if (x.op === "not") return simplify(x.args[0]);
    if (x.op === "const") return { op: "const", value: !x.value };
    return { op: "not", args };
  }
  const flat = [];
  args.forEach(x => { if (x.op === a.op) flat.push(...x.args); else flat.push(x); });
  if (a.op === "and") {
    if (flat.some(x => x.op === "const" && !x.value)) return { op: "const", value: false };
    const keep = flat.filter(x => !(x.op === "const" && x.value));
    if (!keep.length) return { op: "const", value: true };
    if (keep.length === 1) return keep[0];
    const ks = keep.map(toStr);
    if (new Set(ks).size !== ks.length) {
      const seen = new Set(); const uniq = [];
      keep.forEach((x, i) => { if (!seen.has(ks[i])) { seen.add(ks[i]); uniq.push(x); } });
      return uniq.length === 1 ? uniq[0] : { op: "and", args: uniq };
    }
    // x ∧ ¬x = false
    for (const x of keep) {
      if (x.op === "not" && keep.some(y => toStr(y) === toStr(x.args[0]))) return { op: "const", value: false };
    }
    return { op: "and", args: keep };
  }
  if (a.op === "or") {
    if (flat.some(x => x.op === "const" && x.value)) return { op: "const", value: true };
    const keep = flat.filter(x => !(x.op === "const" && !x.value));
    if (!keep.length) return { op: "const", value: false };
    if (keep.length === 1) return keep[0];
    for (const x of keep) {
      if (x.op === "not" && keep.some(y => toStr(y) === toStr(x.args[0]))) return { op: "const", value: true };
    }
    return { op: "or", args: keep };
  }
  return { op: a.op, args };
}

function toStr(a) {
  switch (a.op) {
    case "var": return a.name;
    case "const": return a.value ? "⊤" : "⊥";
    case "not": return `¬${toStr(a.args[0])}`;
    case "and": return `(${a.args.map(toStr).join(" ∧ ")})`;
    case "or": return `(${a.args.map(toStr).join(" ∨ ")})`;
    case "implies": return `(${toStr(a.args[0])} → ${toStr(a.args[1])})`;
    case "iff": return `(${toStr(a.args[0])} ↔ ${toStr(a.args[1])})`;
    default: return "?";
  }
}

/* 把 CNF 转成子句集 [[{v,neg}]] */
function toClauses(a) {
  const c = cnf(a);
  const parts = c.op === "and" ? c.args : [c];
  return parts.map(p => {
    const lits = p.op === "or" ? p.args : [p];
    return lits.map(l => {
      if (l.op === "var") return { v: l.name, neg: false };
      if (l.op === "not" && l.args[0].op === "var") return { v: l.args[0].name, neg: true };
      if (l.op === "const") return { const: l.value };
      return { complex: toStr(l) };
    });
  });
}

/* DPLL */
function dpll(clauses) {
  const cs = clauses
    .map(c => c.filter(l => !l.complex))
    .filter(c => c.length > 0 || true)
    .map(c => c.slice());
  if (cs.some(c => c.some(l => l.const === false))) return { sat: false, model: null };
  const clean = cs.map(c => c.filter(l => l.const === undefined)).filter(c => c.length > 0);
  let steps = 0;

  function solve(cls, assign) {
    if (++steps > 200000) return { sat: false, model: null, timeout: true };
    // 单元传播
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of cls) {
        const un = c.filter(l => assign[l.v] === undefined);
        const sat = c.some(l => assign[l.v] !== undefined && assign[l.v] === !l.neg);
        if (sat) continue;
        if (un.length === 0) return { sat: false, model: null };
        if (un.length === 1) {
          const l = un[0];
          assign[l.v] = !l.neg;
          changed = true;
        }
      }
      cls = cls.filter(c => !c.some(l => assign[l.v] !== undefined && assign[l.v] === !l.neg));
      if (cls.some(c => c.every(l => assign[l.v] !== undefined))) return { sat: false, model: null };
    }
    if (cls.length === 0) return { sat: true, model: { ...assign } };
    // 选变量
    const l0 = cls[0].filter(l => assign[l.v] === undefined)[0];
    if (!l0) return { sat: true, model: { ...assign } };
    for (const val of [!l0.neg, l0.neg]) {
      const a2 = { ...assign, [l0.v]: val };
      const r = solve(cls.map(c => c.filter(l => !(l.v === l0.v))), a2);
      if (r.sat) return r;
    }
    return { sat: false, model: null };
  }
  return solve(clean.length ? clean : [], {});
}

/* 所有变量上的暴力枚举（用于有效性/反例） */
function allAssignments(a) {
  const vs = varList(a);
  const out = [];
  for (let m = 0; m < (1 << vs.length); m++) {
    const env = {};
    vs.forEach((v, i) => { env[v] = !!((m >> (vs.length - 1 - i)) & 1); });
    out.push(env);
  }
  return out;
}

function complexity(a) {
  let n = 0;
  (function walk(x) { n++; (x.args || []).forEach(walk); })(a);
  return n;
}

module.exports = {
  parse, normalizeAst, vars, varList, evaluate, truthTable,
  nnf, cnf, dnf, simplify, toStr, toClauses, dpll, allAssignments, complexity
};
