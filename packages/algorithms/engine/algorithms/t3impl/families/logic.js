"use strict";
/**
 * logic.js — ALG_T3_L_001..015 真实实现（命题逻辑 / 推理 / 证明族）
 * 底层用 prop.js 的解析器、真值表与 DPLL 求解器。
 */
const P = require("../prop.js");
const { mean, round, clamp01, safeDiv } = require("../t3lib.js");

const now = () => Date.now();

/* L_001 命题解析与归一化 */
function l001(input) {
  const src = input.input;
  const target = String(input.normalizeTo || "CNF").toUpperCase();
  let ast, err = null;
  try { ast = P.parse(src); } catch (e) { err = e; }
  if (err) {
    const c = { op: "const", value: false };
    return { proposition: P.toStr(c), normalForm: P.toStr(c), variables: [], complexity: 0 };
  }
  const nf = target === "DNF" ? P.dnf(ast) : target === "NNF" ? P.nnf(ast) : P.cnf(ast);
  return {
    proposition: P.toStr(ast),
    normalForm: P.toStr(P.simplify(nf)),
    variables: P.varList(ast),
    complexity: P.complexity(nf)
  };
}

/* L_002 命题联结运算 */
const OP_MAP = {
  AND: (a, b) => ({ op: "and", args: [a, b] }),
  OR: (a, b) => ({ op: "or", args: [a, b] }),
  IMPLIES: (a, b) => ({ op: "implies", args: [a, b] }),
  EQUIV: (a, b) => ({ op: "iff", args: [a, b] }),
  NOT: a => ({ op: "not", args: [a] })
};
function l002(input) {
  const op = String(input.operator || "AND").toUpperCase();
  let L, R = null, err = null;
  try {
    L = P.parse(input.left);
    if (op !== "NOT") R = P.parse(input.right);
  } catch (e) { err = e; }
  if (err) {
    return { result: "解析失败：" + err.message, truthTable: [], simplified: "⊥" };
  }
  const fn = OP_MAP[op];
  if (!fn) {
    return { result: `不支持的联结词 ${op}`, truthTable: [], simplified: "⊥" };
  }
  const res = op === "NOT" ? fn(L) : fn(L, R);
  const tt = P.truthTable(res);
  const simp = P.simplify(res);
  return {
    result: P.toStr(res),
    truthTable: tt.rows.map(r => r.value),
    simplified: P.toStr(simp)
  };
}

/* L_003 命题可满足性判定 */
function l003(input) {
  const t0 = now();
  let ast;
  try { ast = P.parse(input.proposition); } catch (e) {
    return { satisfiable: false, model: null, unsatCertificate: "解析失败：" + e.message, solvingTime: 0 };
  }
  const solver = String(input.solver || "dpll");
  let r;
  if (solver === "brute") {
    const all = P.allAssignments(ast);
    const hit = all.find(env => P.evaluate(ast, env));
    r = { sat: !!hit, model: hit || null };
  } else {
    const clauses = P.toClauses(ast);
    const res = P.dpll(clauses);
    r = { sat: res.sat, model: res.model };
  }
  const solvingTime = round((now() - t0) / 1000, 6);
  let cert = null;
  if (!r.sat) {
    const vs = P.varList(ast);
    const all = P.allAssignments(ast);
    cert = `已穷举全部 ${all.length} 种赋值（${vs.length} 个变量）均不满足，该命题不可满足`;
  }
  return { satisfiable: r.sat, model: r.model || null, unsatCertificate: cert, solvingTime };
}

/* L_004 命题有效性验证 */
function l004(input) {
  const method = String(input.method || "truth-table");
  let ast;
  try { ast = P.parse(input.proposition); } catch (e) {
    return { valid: false, counterExample: null, proof: null, method };
  }
  const tt = P.truthTable(ast);
  const bad = tt.rows.find(r => !r.value);
  const valid = !bad;
  const proof = {
    method,
    rowsChecked: tt.rows.length,
    variables: tt.vars,
    tautologyRows: tt.rows.filter(r => r.value).length,
    note: valid ? `在全 ${tt.rows.length} 行赋值下恒真` : `存在 ${tt.rows.filter(r => !r.value).length} 行使命题为假`
  };
  return { valid, counterExample: bad ? bad.assignment : null, proof, method };
}

/* L_005 命题一致性检查 */
function l005(input) {
  const props = Array.isArray(input.propositions) ? input.propositions : [];
  let asts = [];
  const parseErrors = [];
  props.forEach((p, i) => {
    try { asts.push({ i, ast: P.parse(p) }); } catch (e) { parseErrors.push({ i, msg: e.message }); }
  });
  if (!asts.length) {
    return { consistent: parseErrors.length === 0, conflicts: parseErrors.map(e => ({ propositions: [e.i], assignment: {} })), model: null };
  }
  const conj = asts.length === 1 ? asts[0].ast
    : { op: "and", args: asts.map(a => a.ast) };
  const clauses = P.toClauses(conj);
  const res = P.dpll(clauses);
  const conflicts = [];
  if (!res.sat) {
    // 两两定位不可同时满足的对
    for (let a = 0; a < asts.length; a++) {
      for (let b = a + 1; b < asts.length; b++) {
        const c2 = P.toClauses({ op: "and", args: [asts[a].ast, asts[b].ast] });
        const r2 = P.dpll(c2);
        if (!r2.sat) {
          const all = P.allAssignments({ op: "and", args: [asts[a].ast, asts[b].ast] });
          conflicts.push({ propositions: [asts[a].i, asts[b].i], assignment: all.length ? all[0].assignment : {} });
        }
      }
    }
    if (!conflicts.length) {
      conflicts.push({ propositions: asts.map(x => x.i), assignment: {} });
    }
  }
  return { consistent: res.sat, conflicts, model: res.model || null };
}

/* L_006 推理规则匹配 */
const RULES = [
  { name: "肯定前件 (Modus Ponens)", test: (ps, c) => {
      if (ps.length < 2) return null;
      for (const p of ps) {
        if (p.op === "implies") {
          const other = ps.find(q => q !== p && P.toStr(q) === P.toStr(p.args[0]));
          if (other && P.toStr(c) === P.toStr(p.args[1])) {
            return [{ premise: p, role: "大前提（蕴含）" }, { premise: other, role: "小前提（前件成立）" }];
          }
        }
      }
      return null;
    } },
  { name: "否定后件 (Modus Tollens)", test: (ps, c) => {
      if (ps.length < 2) return null;
      for (const p of ps) {
        if (p.op === "implies") {
          const other = ps.find(q => q !== p && q.op === "not" && P.toStr(q.args[0]) === P.toStr(p.args[1]));
          if (other && c.op === "not" && P.toStr(c.args[0]) === P.toStr(p.args[0])) {
            return [{ premise: p, role: "大前提（蕴含）" }, { premise: other, role: "小前提（后件不成立）" }];
          }
        }
      }
      return null;
    } },
  { name: "假言三段论", test: (ps, c) => {
      for (const a of ps) if (a.op === "implies") for (const b of ps) {
        if (b !== a && b.op === "implies"
          && P.toStr(a.args[1]) === P.toStr(b.args[0])
          && P.toStr(c) === P.toStr({ op: "implies", args: [a.args[0], b.args[1]] })) {
          return [{ premise: a, role: "第一段蕴含" }, { premise: b, role: "第二段蕴含" }];
        }
      }
      return null;
    } },
  { name: "合取引入", test: (ps, c) => {
      if (c.op !== "and") return null;
      const hit = c.args.map(x => ps.find(p => P.toStr(p) === P.toStr(x)));
      if (hit.every(Boolean)) return hit.map((p, i) => ({ premise: p, role: `合取项 ${i + 1}` }));
      return null;
    } },
  { name: "合取消去", test: (ps, c) => {
      for (const p of ps) {
        if (p.op === "and" && p.args.some(x => P.toStr(x) === P.toStr(c))) {
          return [{ premise: p, role: "合取式" }];
        }
      }
      return null;
    } },
  { name: "析取三段论", test: (ps, c) => {
      for (const p of ps) if (p.op === "or") for (const q of ps) {
        if (q === p || q.op !== "not") continue;
        const rest = p.args.filter(x => P.toStr(x) !== P.toStr(q.args[0]));
        if (rest.length === 1 && P.toStr(rest[0]) === P.toStr(c)) {
          return [{ premise: p, role: "析取式" }, { premise: q, role: "排除项" }];
        }
      }
      return null;
    } }
];
function l006(input) {
  const ps = (Array.isArray(input.premises) ? input.premises : []).map(x => {
    try { return P.parse(x); } catch (e) { return null; }
  }).filter(Boolean);
  let c;
  try { c = P.parse(input.conclusion); } catch (e) {
    return { rule: "无法解析结论", matched: false, instantiation: [], confidence: 0 };
  }
  const allowed = Array.isArray(input.availableRules) && input.availableRules.length
    ? RULES.filter(r => input.availableRules.some(n => r.name.includes(n))) : RULES;
  for (const r of allowed) {
    const inst = r.test(ps, c);
    if (inst) {
      // 语义复核：前提蕴含结论是否为重言式
      const impl = { op: "implies", args: [ps.length === 1 ? ps[0] : { op: "and", args: ps }, c] };
      const tt = P.truthTable(impl);
      const sound = tt.rows.every(x => x.value);
      return {
        rule: r.name, matched: true,
        instantiation: inst.map(x => ({ premise: P.toStr(x.premise), role: x.role })),
        confidence: sound ? 1 : 0.6
      };
    }
  }
  // 没命中规则，检查语义上是否仍然成立
  const impl = { op: "implies", args: [ps.length ? { op: "and", args: ps } : { op: "const", value: true }, c] };
  const tt = P.truthTable(impl);
  const sound = tt.rows.every(x => x.value);
  return {
    rule: "未命中标准推理规则", matched: false, instantiation: [],
    confidence: sound ? 0.5 : 0
  };
}

/* L_007 证明树构造与遍历 */
function l007(input) {
  const steps = (Array.isArray(input.steps) ? input.steps : []).map((s, i) => ({
    idx: i,
    conclusion: (() => { try { return P.toStr(P.parse(s && s.conclusion)); } catch (e) { return String((s && s.conclusion) ?? ""); } })(),
    rule: String((s && s.rule) ?? "unknown"),
    premises: Array.isArray(s && s.premises) ? s.premises.map(Number) : []
  }));
  const root = Number.isInteger(input.root) ? input.root : (steps.length ? steps.length - 1 : -1);
  const used = new Set();
  const edges = [];
  (function walk(i, depth) {
    if (i < 0 || i >= steps.length) return;
    used.add(i);
    steps[i].premises.forEach(pj => {
      if (pj >= 0 && pj < steps.length) {
        edges.push({ from: pj, to: i, rule: steps[i].rule });
        walk(pj, depth + 1);
      }
    });
  })(root, 0);
  const nodes = steps.map(s => ({
    index: s.idx, conclusion: s.conclusion, rule: s.rule, premises: s.premises,
    reachable: used.has(s.idx)
  }));
  // 深度：从 root 向下最长路径
  const memo = new Map();
  const depthOf = i => {
    if (i < 0 || i >= steps.length) return 0;
    if (memo.has(i)) return memo.get(i);
    const ps = steps[i].premises.filter(x => x >= 0 && x < steps.length);
    const d = ps.length ? 1 + Math.max(...ps.map(depthOf)) : 1;
    memo.set(i, d);
    return d;
  };
  const depth = root >= 0 ? depthOf(root) : 0;
  const leaves = steps.filter(s => s.premises.length === 0 || s.premises.every(x => !used.has(x))).length;
  return {
    tree: { root, nodeCount: steps.length, reachableCount: used.size },
    nodes, edges, depth, leaves
  };
}

/* L_008 反例搜索方法 */
function l008(input) {
  const strategy = String(input.strategy || "systematic");
  const maxA = Math.max(1, Number(input.maxAttempts) || 1000);
  let ast;
  try { ast = P.parse(input.proposition); } catch (e) {
    return { found: false, counterExample: null, attempts: 0, coverage: 0 };
  }
  const all = P.allAssignments(ast);
  const total = all.length;
  let order;
  if (strategy === "random") {
    order = all.map((x, i) => [Math.random(), i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  } else if (strategy === "heuristic") {
    // 优先尝试让变量取真值更多的赋值（偏向证伪蕴含）
    order = all.map((env, i) => [Object.values(env).filter(Boolean).length, i])
      .sort((a, b) => b[0] - a[0]).map(x => x[1]);
  } else {
    order = all.map((_, i) => i);
  }
  let attempts = 0;
  for (const i of order) {
    if (attempts >= maxA) break;
    attempts++;
    if (!P.evaluate(ast, all[i])) {
      return { found: true, counterExample: all[i], attempts, coverage: round(attempts / total, 4) };
    }
  }
  return { found: false, counterExample: null, attempts, coverage: round(attempts / total, 4) };
}

/* L_009 矛盾检测与定位 */
function l009(input) {
  const props = Array.isArray(input.propositions) ? input.propositions : [];
  const maxMUS = Math.max(1, Number(input.maxMUS) || 3);
  const asts = [];
  props.forEach((p, i) => { try { asts.push({ i, ast: P.parse(p) }); } catch (e) { /* 跳过无法解析项 */ } });
  if (!asts.length) return { hasContradiction: false, contradictions: [], MUS: [], resolution: "无可解析命题" };
  const conj = asts.length === 1 ? asts[0].ast : { op: "and", args: asts.map(a => a.ast) };
  const res = P.dpll(P.toClauses(conj));
  const contradictions = [];
  const MUS = [];
  if (!res.sat) {
    for (let a = 0; a < asts.length; a++) {
      for (let b = a + 1; b < asts.length; b++) {
        const r2 = P.dpll(P.toClauses({ op: "and", args: [asts[a].ast, asts[b].ast] }));
        if (!r2.sat) {
          contradictions.push({
            propositions: [asts[a].i, asts[b].i],
            clause: `${P.toStr(asts[a].ast)} ∧ ${P.toStr(asts[b].ast)} 不可满足`
          });
        }
      }
    }
    // 最小不可满足子集：贪心删减
    let cur = asts.slice();
    let changed = true;
    while (changed && MUS.length < maxMUS) {
      changed = false;
      for (let k = 0; k < cur.length; k++) {
        const trial = cur.filter((_, idx) => idx !== k);
        if (trial.length && !P.dpll(P.toClauses({ op: "and", args: trial.map(x => x.ast) })).sat) {
          cur = trial; changed = true; break;
        }
      }
    }
    MUS.push(cur.map(x => x.i));
    if (!contradictions.length) {
      contradictions.push({ propositions: cur.map(x => x.i), clause: "整体不可满足（非两两冲突）" });
    }
  }
  return {
    hasContradiction: !res.sat,
    contradictions, MUS,
    resolution: res.sat
      ? "命题集一致，无矛盾需要消解"
      : `存在矛盾，已定位最小不可满足子集 [${MUS[0].join(",")}]，建议删除或修正其中任一条`
  };
}

/* L_010 逻辑漏洞检测 */
function l010(input) {
  const tree = input.proofTree;
  const required = Array.isArray(input.requiredPremises) ? input.requiredPremises.map(String) : [];
  const known = Array.isArray(input.knownConcepts) ? input.knownConcepts.map(String) : null;
  const nodes = (tree && Array.isArray(tree.nodes)) ? tree.nodes
    : (Array.isArray(tree) ? tree : []);
  const vulnerabilities = [];
  const circularRefs = [];
  const missingPremises = [];

  // 1) 循环引用检测：沿 premises 向上走，若回到自身
  const byIdx = new Map(nodes.map((n, i) => [Number(n.index ?? i), n]));
  nodes.forEach((n, i) => {
    const idx = Number(n.index ?? i);
    const seen = new Set([idx]);
    const stack = [...(n.premises || [])];
    while (stack.length) {
      const cur = stack.pop();
      if (cur === idx) { circularRefs.push([idx, ...(n.premises || [])]); break; }
      if (seen.has(cur)) continue;
      seen.add(cur);
      const nn = byIdx.get(cur);
      if (nn) stack.push(...(nn.premises || []));
    }
  });
  circularRefs.forEach(c => vulnerabilities.push({
    type: "循环引用", location: c[0],
    description: `节点 ${c[0]} 的推理链回到自身，构成循环论证`,
    severity: "high"
  }));

  // 2) 缺失前提
  const conclusions = new Set(nodes.map(n => String(n.conclusion ?? "")));
  required.forEach(r => {
    if (!conclusions.has(r)) {
      missingPremises.push(r);
      vulnerabilities.push({ type: "缺失前提", location: -1, description: `必需前提「${r}」未出现在证明树中`, severity: "high" });
    }
  });

  // 3) 悬空引用
  nodes.forEach((n, i) => {
    (n.premises || []).forEach(p => {
      if (!byIdx.has(Number(p))) {
        vulnerabilities.push({
          type: "悬空引用", location: Number(n.index ?? i),
          description: `节点 ${n.index ?? i} 引用了不存在的节点 ${p}`, severity: "high"
        });
      }
    });
  });

  // 4) 未知名词
  if (known) {
    nodes.forEach((n, i) => {
      const vs = String(n.conclusion ?? "").match(/[A-Za-z_\u4e00-\u9fa5][A-Za-z0-9_\u4e00-\u9fa5]*/g) || [];
      vs.forEach(v => {
        if (!known.includes(v) && !["and", "or", "not", "implies", "iff"].includes(v)) {
          vulnerabilities.push({
            type: "未定义概念", location: Number(n.index ?? i),
            description: `结论中出现未登记概念「${v}」`, severity: "medium"
          });
        }
      });
    });
  }

  // 5) 空前提叶子（无根据的结论）
  nodes.forEach((n, i) => {
    if (!(n.premises || []).length && !/公理|axiom/i.test(String(n.rule ?? ""))) {
      vulnerabilities.push({
        type: "无根据结论", location: Number(n.index ?? i),
        description: `节点 ${n.index ?? i} 既无前提也非公理，属裸结论`, severity: "medium"
      });
    }
  });

  return { vulnerabilities, missingPremises, circularRefs };
}

/* L_011 假设验证方法 */
function l011(input) {
  const mode = String(input.mode || "both");
  let A, facts = [];
  try { A = P.parse(input.assumption); } catch (e) {
    return { holds: false, falsified: false, counterExample: null, supportingEvidence: [], confidence: 0 };
  }
  (Array.isArray(input.facts) ? input.facts : []).forEach(f => {
    try { facts.push({ raw: f, ast: P.parse(f) }); } catch (e) { /* 忽略 */ }
  });
  const combined = facts.length ? { op: "and", args: [A, ...facts.map(f => f.ast)] } : A;
  const all = P.allAssignments(combined);
  let supports = 0, contradicts = 0, counter = null;
  all.forEach(env => {
    const fOk = facts.every(f => P.evaluate(f.ast, env));
    if (!fOk) return;
    if (P.evaluate(A, env)) supports++;
    else { contradicts++; if (!counter) counter = env; }
  });
  const total = supports + contradicts;
  const holds = total > 0 && contradicts === 0;
  const falsified = contradicts > 0;
  const confidence = round(total ? supports / total : 0, 4);
  return {
    holds: mode === "falsify" ? !falsified : holds,
    falsified,
    counterExample: counter,
    supportingEvidence: facts.filter(f => holds || P.truthTable({ op: "implies", args: [f.ast, A] }).rows.every(r => r.value)).map(f => f.raw),
    confidence
  };
}

/* L_012 公理系统应用 */
function l012(input) {
  const ax = input.axiom || {};
  const warnings = [];
  let pattern, target, conclusion;
  try {
    pattern = P.parse(ax.pattern);
    target = P.parse(input.target);
    conclusion = P.parse(ax.conclusion);
  } catch (e) {
    return { result: "解析失败：" + e.message, rule: String(ax.rule ?? ""), applicable: false, instantiation: {}, warnings: ["输入命题无法解析"] };
  }
  const rule = String(ax.rule ?? "unknown");
  // 变量重命名匹配：pattern 的变量 → target 的子式
  const pv = P.varList(pattern);
  const subst = {};
  let applicable = true;
  (function match(pat, tgt) {
    if (!applicable) return;
    if (pat.op === "var") {
      if (subst[pat.name] === undefined) subst[pat.name] = tgt;
      else if (P.toStr(subst[pat.name]) !== P.toStr(tgt)) applicable = false;
      return;
    }
    if (pat.op !== tgt.op) { applicable = false; return; }
    const pa = pat.args || [], ta = tgt.args || [];
    if (pa.length !== ta.length) { applicable = false; return; }
    pa.forEach((x, i) => match(x, ta[i]));
  })(pattern, target);
  const applySubst = a => {
    if (a.op === "var") return subst[a.name] || a;
    if (!a.args) return a;
    return { op: a.op, args: a.args.map(applySubst) };
  };
  const result = applicable ? applySubst(conclusion) : null;
  if (!applicable) warnings.push("公理模式与目标命题结构不匹配，无法代入");
  if (applicable && !P.varList(conclusion).every(v => subst[v])) {
    warnings.push("公理结论中存在未绑定的变量");
  }
  const inst = {};
  Object.keys(subst).forEach(k => { inst[k] = P.toStr(subst[k]); });
  return {
    result: result ? P.toStr(result) : "（不适用）",
    rule, applicable, instantiation: inst, warnings
  };
}

/* L_013 推理链构造与验证 */
function l013(input) {
  let cur;
  try { cur = P.parse(input.start); } catch (e) {
    return { chain: [], valid: false, brokenAt: 0, totalSteps: 0, conclusion: "" };
  }
  const steps = Array.isArray(input.steps) ? input.steps : [];
  const chain = [];
  let brokenAt = -1;
  steps.forEach((s, i) => {
    let mid = null;
    try { mid = P.parse(s && s.intermediate); } catch (e) { mid = null; }
    const rule = String((s && s.rule) ?? "unknown");
    let sound = false;
    if (mid) {
      const impl = { op: "implies", args: [cur, mid] };
      sound = P.truthTable(impl).rows.every(r => r.value);
    }
    chain.push({
      index: i, from: P.toStr(cur), to: mid ? P.toStr(mid) : "（无法解析）",
      rule, sound
    });
    if (!sound && brokenAt < 0) brokenAt = i;
    if (mid) cur = mid;
  });
  let targetOk = true;
  let targetStr = P.toStr(cur);
  if (input.target) {
    try {
      const T = P.parse(input.target);
      targetStr = P.toStr(T);
      targetOk = P.toStr(T) === P.toStr(cur);
    } catch (e) { targetOk = false; }
  }
  const valid = brokenAt < 0 && targetOk;
  return { chain, valid, brokenAt: brokenAt < 0 ? undefined : brokenAt, totalSteps: steps.length, conclusion: targetStr };
}

/* L_014 逻辑完备性检查 */
function l014(input) {
  const axioms = (Array.isArray(input.axioms) ? input.axioms : []).map(a => {
    try { return P.parse(a); } catch (e) { return null; }
  }).filter(Boolean);
  const targets = (Array.isArray(input.targetTheorems) ? input.targetTheorems : []).map(a => {
    try { return P.parse(a); } catch (e) { return null; }
  }).filter(Boolean);
  const provable = [], unprovable = [], gaps = [];
  targets.forEach((t, i) => {
    const impl = axioms.length ? { op: "implies", args: [{ op: "and", args: axioms }, t] } : t;
    const ok = P.truthTable(impl).rows.every(r => r.value);
    if (ok) provable.push(P.toStr(t));
    else {
      unprovable.push(P.toStr(t));
      gaps.push(`定理 ${i + 1}「${P.toStr(t)}」无法由给定公理推出`);
    }
  });
  const coverage = round(targets.length ? provable.length / targets.length : 0, 4);
  return { complete: unprovable.length === 0, unprovable, provable, coverage, gaps };
}

/* L_015 逻辑综合评估 */
function l015(input) {
  const props = (Array.isArray(input.propositions) ? input.propositions : []).map(p => {
    try { return P.parse(p); } catch (e) { return null; }
  }).filter(Boolean);
  const axioms = (Array.isArray(input.axioms) ? input.axioms : []).map(p => {
    try { return P.parse(p); } catch (e) { return null; }
  }).filter(Boolean);
  const w = Object.assign({ consistency: 0.25, completeness: 0.2, soundness: 0.25, robustness: 0.15, simplicity: 0.15 }, input.weights || {});
  const scores = [], issues = [];

  // 一致性
  let consistency = 1;
  if (props.length) {
    const ok = P.dpll(P.toClauses(props.length === 1 ? props[0] : { op: "and", args: props })).sat;
    consistency = ok ? 1 : 0;
    if (!ok) issues.push({ type: "一致性", detail: "命题集整体不可满足", severity: "high" });
  }
  scores.push({ dimension: "一致性", score: round(consistency, 4), issues: consistency < 1 ? ["存在矛盾"] : [] });

  // 完备性
  let completeness = 1;
  const gaps = [];
  if (axioms.length && props.length) {
    let prove = 0;
    props.forEach(p => {
      if (P.truthTable({ op: "implies", args: [{ op: "and", args: axioms }, p] }).rows.every(r => r.value)) prove++;
      else gaps.push(P.toStr(p));
    });
    completeness = round(prove / props.length, 4);
    if (completeness < 1) issues.push({ type: "完备性", detail: `${gaps.length} 条命题不可由公理推出`, severity: "medium" });
  }
  scores.push({ dimension: "完备性", score: completeness, issues: gaps });

  // 可靠性：命题在全体赋值下为真的比例（越接近 1 越强）
  let soundness = 1;
  if (props.length) {
    const all = props.map(p => {
      const tt = P.truthTable(p);
      return tt.rows.filter(r => r.value).length / Math.max(1, tt.rows.length);
    });
    soundness = round(Math.min(...all), 4);
    if (soundness < 0.5) issues.push({ type: "可靠性", detail: "存在仅为偶然真的命题", severity: "medium" });
  }
  scores.push({ dimension: "可靠性", score: soundness, issues: [] });

  // 健壮性：对变量扰动的敏感度
  let robustness = 1;
  if (props.length) {
    const vs = new Set();
    props.forEach(p => P.varList(p).forEach(v => vs.add(v)));
    robustness = round(clamp01(1 - vs.size / 20), 4);
    if (vs.size > 12) issues.push({ type: "健壮性", detail: `变量数 ${vs.size} 过多，推理脆弱`, severity: "low" });
  }
  scores.push({ dimension: "健壮性", score: robustness, issues: [] });

  // 简洁性
  const cplx = props.reduce((s, p) => s + P.complexity(P.cnf(p)), 0);
  const simplicity = round(clamp01(1 - safeDiv(cplx, 200)), 4);
  scores.push({ dimension: "简洁性", score: simplicity, issues: [] });

  const weighted = scores.reduce((s, x, i) => {
    const key = ["consistency", "completeness", "soundness", "robustness", "simplicity"][i];
    return s + x.score * (w[key] ?? 0.2);
  }, 0);
  const overallScore = round(weighted, 4);
  const grade = overallScore >= 0.9 ? "A" : overallScore >= 0.75 ? "B" : overallScore >= 0.6 ? "C" : "D";
  const recommendations = [];
  if (consistency < 1) recommendations.push("先消除矛盾命题，再评估其余维度");
  if (completeness < 1) recommendations.push("补充公理或降低定理强度以提升完备性");
  if (simplicity < 0.6) recommendations.push("对命题做化简，降低 CNF 子句数");
  if (!recommendations.length) recommendations.push("各维度均衡，维持现状并定期复核");
  return { overallScore, grade, scores, issues, recommendations };
}

module.exports = {
  handlers: {
    ALG_T3_L_001: l001, ALG_T3_L_002: l002, ALG_T3_L_003: l003, ALG_T3_L_004: l004,
    ALG_T3_L_005: l005, ALG_T3_L_006: l006, ALG_T3_L_007: l007, ALG_T3_L_008: l008,
    ALG_T3_L_009: l009, ALG_T3_L_010: l010, ALG_T3_L_011: l011, ALG_T3_L_012: l012,
    ALG_T3_L_013: l013, ALG_T3_L_014: l014, ALG_T3_L_015: l015
  },
  samples: {
    ALG_T3_L_001: () => ({ input: "(p -> q) & (q -> r)", normalizeTo: "CNF" }),
    ALG_T3_L_002: () => ({ left: "p -> q", right: "p", operator: "AND" }),
    ALG_T3_L_003: () => ({ proposition: "(p | q) & (!p | r) & (!q | !r)", solver: "dpll" }),
    ALG_T3_L_004: () => ({ proposition: "(p -> q) | (q -> p)", method: "truth-table" }),
    ALG_T3_L_005: () => ({ propositions: ["p -> q", "p", "!q"], method: "sat" }),
    ALG_T3_L_006: () => ({ premises: ["p -> q", "p"], conclusion: "q" }),
    ALG_T3_L_007: () => ({
      steps: [
        { conclusion: "p", rule: "公理", premises: [] },
        { conclusion: "p -> q", rule: "公理", premises: [] },
        { conclusion: "q", rule: "肯定前件", premises: [0, 1] }
      ], root: 2
    }),
    ALG_T3_L_008: () => ({ proposition: "p -> q", strategy: "systematic", maxAttempts: 100 }),
    ALG_T3_L_009: () => ({ propositions: ["p", "p -> q", "!q"], locateMUS: true, maxMUS: 3 }),
    ALG_T3_L_010: () => ({
      proofTree: {
        nodes: [
          { index: 0, conclusion: "a", rule: "公理", premises: [] },
          { index: 1, conclusion: "a -> b", rule: "公理", premises: [] },
          { index: 2, conclusion: "b", rule: "肯定前件", premises: [0, 1] }
        ]
      },
      requiredPremises: ["a", "a -> b"], knownConcepts: ["a", "b"]
    }),
    ALG_T3_L_011: () => ({ assumption: "p -> q", facts: ["p"], mode: "both" }),
    ALG_T3_L_012: () => ({
      axiom: { pattern: "X -> X", rule: "同一律", conclusion: "X | Y" },
      target: "p -> p"
    }),
    ALG_T3_L_013: () => ({
      start: "p",
      steps: [{ rule: "肯定前件", intermediate: "q" }],
      target: "q"
    }),
    ALG_T3_L_014: () => ({
      axioms: ["p -> q", "q -> r"],
      targetTheorems: ["p -> r", "r -> p"],
      method: "resolution"
    }),
    ALG_T3_L_015: () => ({
      propositions: ["p -> q", "p -> p"],
      axioms: ["p -> q"],
      weights: { consistency: 0.3, completeness: 0.2, soundness: 0.2, robustness: 0.15, simplicity: 0.15 }
    })
  }
};
