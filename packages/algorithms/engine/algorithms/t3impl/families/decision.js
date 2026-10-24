"use strict";
/**
 * decision.js — ALG_T3_D_001..013 真实实现（决策锁 / 意图 / 风险 / 权衡族）
 */
const L = require("../t3lib.js");
const { mean, std, round, clamp01, safeDiv, cosine, euclid, ols } = L;

const arr = v => (Array.isArray(v) ? v : []);
const obj = v => (v && typeof v === "object" ? v : {});
const num = (v, d = 0) => (isFinite(Number(v)) ? Number(v) : d);
const str = v => (typeof v === "string" ? v : JSON.stringify(v ?? ""));
const nm = (x, k = "name") => String(obj(x)[k] ?? obj(x).id ?? obj(x).option ?? "?");

/* 轻量词向量：按字符二元组散列，用于意图对齐的近似语义比较 */
function vecOf(text, dim = 64) {
  const v = new Array(dim).fill(0);
  const t = String(text);
  for (let i = 0; i < t.length - 1; i++) {
    const bg = t.slice(i, i + 2);
    let h = 2166136261;
    for (let k = 0; k < bg.length; k++) { h ^= bg.charCodeAt(k); h = Math.imul(h, 16777619); }
    v[(h >>> 0) % dim] += 1;
  }
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map(x => x / n);
}

/* D_001 决策锁强制校验 */
function d001(input) {
  const intent = String(input.intent ?? "");
  const output = input.output;
  const ctx = obj(input.context);
  const lineage = input.lineage == null ? null : obj(input.lineage);
  const outText = str(output);
  const checks = [];

  // 关卡 1 · IVL 意图验证
  const iv = vecOf(intent), ov = vecOf(outText);
  const align = clamp01((cosine(iv, ov) + 1) / 2);
  checks.push({
    name: "IVL 意图验证", passed: align >= 0.15 || outText.length === 0 || intent.length === 0,
    details: `意图与输出的向量对齐度 ${round(align, 4)}（阈值 0.15）`
  });

  // 关卡 2 · ILT 意图谱系追踪
  const steps = lineage ? arr(lineage.steps ?? lineage.transformations) : [];
  const lineageOk = !!lineage && (steps.length > 0 || !!lineage.rootIntent);
  checks.push({
    name: "ILT 意图谱系追踪", passed: lineageOk,
    details: lineageOk ? `谱系链 ${steps.length} 步，根意图「${String(lineage.rootIntent ?? "").slice(0, 24)}」` : "未提供意图谱系，无法追溯输出来源"
  });

  // 关卡 3 · OSG 语义输出门
  const forbidden = arr(obj(ctx).forbiddenTerms ?? obj(ctx).forbidden).map(String);
  const hits = forbidden.filter(t => t && outText.includes(t));
  checks.push({
    name: "OSG 语义输出门", passed: hits.length === 0,
    details: hits.length ? `命中禁用词：${hits.join("、")}` : "未命中禁用词"
  });

  // 关卡 4 · 内容完整性
  const placeholders = (outText.match(/TODO|FIXME|待补充|xxx|占位|\.\.\.\s*$/gi) || []);
  const emptyish = outText.trim().length === 0 || outText === "{}" || outText === "null";
  checks.push({
    name: "内容完整性", passed: placeholders.length === 0 && !emptyish,
    details: emptyish ? "输出为空" : placeholders.length ? `存在 ${placeholders.length} 处占位符` : "无占位符、非空"
  });

  const passed = checks.every(c => c.passed);
  const failed = checks.filter(c => !c.passed);
  return {
    passed, checks,
    blockedReason: passed ? undefined : failed.map(c => c.name).join(" / ") + " 未通过",
    recommendation: passed
      ? "四道关卡全部通过，允许输出"
      : `先修复「${failed[0].name}」——${failed[0].details}`
  };
}

/* D_002 意图验证机制 */
function d002(input) {
  const ui = String(input.userInput ?? "");
  const outText = str(input.output);
  const thr = num(input.threshold, 0.2);
  const iv = Array.isArray(input.intentVector) ? input.intentVector.map(Number) : vecOf(ui);
  const ov = vecOf(outText, iv.length);
  const score = clamp01((cosine(iv, ov) + 1) / 2);
  const dev = [];
  const n = Math.min(iv.length, ov.length);
  for (let i = 0; i < n; i++) {
    const d = Math.abs(iv[i] - ov[i]);
    if (d > 0.15) dev.push(`维度${i} 偏差 ${round(d, 4)}`);
  }
  return {
    aligned: score >= thr,
    alignmentScore: round(score, 4),
    intentVector: iv.map(x => round(x, 6)),
    outputVector: ov.map(x => round(x, 6)),
    deviation: dev.slice(0, 8)
  };
}

/* D_003 意图谱系追踪 */
function d003(input) {
  const root = String(input.rootIntent ?? "");
  const trans = arr(input.transformations).map(t => ({
    step: String(obj(t).step ?? ""),
    from: String(obj(t).from ?? ""),
    to: String(obj(t).to ?? ""),
    reason: String(obj(t).reason ?? "")
  }));
  const deviations = [];
  trans.forEach((t, i) => {
    const fromV = vecOf(t.from), toV = vecOf(t.to);
    const sim = clamp01((cosine(fromV, toV) + 1) / 2);
    if (sim < 0.5) {
      const justified = t.reason.trim().length >= 8;
      deviations.push({ step: i, type: justified ? "有理由的偏移" : "无理由的漂移", justified });
    }
  });
  const unjustified = deviations.filter(d => !d.justified).length;
  const integrityScore = round(clamp01(1 - safeDiv(unjustified, Math.max(1, trans.length))), 4);
  const lineage = {
    rootIntent: root,
    steps: trans.length,
    chain: trans.map((t, i) => ({ index: i, from: t.from, to: t.to, reason: t.reason })),
    finalOutput: str(input.finalOutput).slice(0, 200)
  };
  return { lineage, traceable: trans.length > 0 && integrityScore >= 0.6, deviations, integrityScore };
}

/* D_004 语义输出门 */
function d004(input) {
  const outText = str(input.output);
  const rules = arr(input.rules).map(obj);
  const violations = [];
  const warnings = [];
  let checked = 0;
  rules.forEach((r, ri) => {
    const forbid = arr(r.forbiddenTerms).map(String).filter(Boolean);
    const required = arr(r.requiredFields).map(String).filter(Boolean);
    if (forbid.length) {
      checked++;
      forbid.forEach(t => {
        if (outText.includes(t)) violations.push({
          type: "禁用词", location: `规则${ri + 1}`, detail: `出现「${t}」`, severity: "high"
        });
      });
    }
    if (required.length) {
      checked++;
      required.forEach(f => {
        const present = outText.includes(f) || (input.output && typeof input.output === "object" && f in input.output);
        if (!present) violations.push({
          type: "必需字段缺失", location: `规则${ri + 1}`, detail: `缺少「${f}」`, severity: "high"
        });
      });
    }
    if (r.consistencyCheck) {
      checked++;
      // 一致性：数字自相矛盾检测（同一名词出现两个不同数字）
      const nums = [...outText.matchAll(/([\u4e00-\u9fa5A-Za-z]{2,10})[^\d]{0,6}(\d+(?:\.\d+)?)/g)];
      const byWord = new Map();
      nums.forEach(m => {
        const k = m[1];
        if (!byWord.has(k)) byWord.set(k, new Set());
        byWord.get(k).add(m[2]);
      });
      byWord.forEach((set, k) => {
        if (set.size > 1) violations.push({
          type: "一致性冲突", location: k, detail: `「${k}」出现 ${set.size} 个不同数字：${[...set].join(" / ")}`, severity: "medium"
        });
      });
    }
  });
  if (!rules.length) warnings.push("未提供规则，语义门形同未启用");
  const high = violations.filter(v => v.severity === "high").length;
  const semanticScore = round(clamp01(1 - safeDiv(high * 2 + (violations.length - high), Math.max(1, checked * 3))), 4);
  return { passed: high === 0, violations, warnings, semanticScore };
}

/* D_005 内容完整性校验 */
function d005(input) {
  const outText = str(input.output);
  const expected = arr(input.expectedElements).map(String).filter(Boolean);
  const patterns = arr(input.placeholderPatterns).map(String).filter(Boolean);
  const DEFAULTS = ["TODO", "FIXME", "待补充", "占位", "xxx", "TBD", "…略", "[待填]"];
  const pats = patterns.length ? patterns : DEFAULTS;
  const issues = [];

  pats.forEach(p => {
    let idx = outText.indexOf(p);
    while (idx >= 0) {
      issues.push({ type: "placeholder", location: `位置 ${idx}`, detail: `出现占位符「${p}」`, severity: "high" });
      idx = outText.indexOf(p, idx + p.length);
    }
  });

  expected.forEach(e => {
    if (!outText.includes(e)) issues.push({ type: "missing", location: e, detail: `缺少必需元素「${e}」`, severity: "high" });
  });

  // 重复检测：同一行出现两次以上
  const lines = outText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 30);
  const seen = new Map();
  lines.forEach(l => seen.set(l, (seen.get(l) || 0) + 1));
  seen.forEach((c, l) => {
    if (c > 1) issues.push({ type: "duplicate", location: l.slice(0, 24) + "…", detail: `同一段内容重复 ${c} 次`, severity: "medium" });
  });

  // 幻觉迹象：引用看起来像文件/函数/接口但格式不合常理
  const fakeRefs = outText.match(/[A-Za-z_][A-Za-z0-9_]*\.(?:py|js|ts|go|java|rs)\b/g) || [];
  const refs = arr(input.referenceData).map(r => String(obj(r).path ?? obj(r).name ?? r));
  if (refs.length) {
    fakeRefs.forEach(f => {
      if (!refs.some(r => r.includes(f))) {
        issues.push({ type: "hallucination", location: f, detail: `引用了参考数据中不存在的文件「${f}」`, severity: "high" });
      }
    });
  }

  const high = issues.filter(i => i.severity === "high").length;
  const completenessScore = round(clamp01(1 - safeDiv(high * 2 + (issues.length - high), Math.max(4, expected.length * 2 + 4))), 4);
  return { complete: high === 0, issues, completenessScore };
}

/* D_006 决策回溯机制 */
function d006(input) {
  const nodes = arr(input.decisionTree).map(n => ({
    id: String(obj(n).id ?? ""),
    parent: obj(n).parent != null ? String(obj(n).parent) : null,
    option: String(obj(n).option ?? obj(n).name ?? ""),
    outcome: String(obj(n).outcome ?? "")
  }));
  const fp = obj(input.failurePoint);
  const failId = String(fp.nodeId ?? "");
  const mode = String(input.mode || "partial");
  const byId = new Map(nodes.map(n => [n.id, n]));
  if (!byId.has(failId)) {
    return { rolledBack: false, restoredNode: null, alternativePaths: [], learnedLessons: ["失败点不在决策树中，无法回溯"] };
  }
  // 向上追溯到根或最近的分叉点
  let cur = byId.get(failId);
  const chain = [cur];
  while (cur.parent && byId.has(cur.parent)) {
    cur = byId.get(cur.parent);
    chain.push(cur);
    if (mode === "full") continue;
    const siblings = nodes.filter(n => n.parent === cur.id);
    if (siblings.length > 1) break;      // partial：停在最近分叉点
  }
  const restoredNode = mode === "full" ? chain[chain.length - 1] : cur;
  const siblings = nodes.filter(n => n.parent === restoredNode.id && n.id !== chain[chain.indexOf(restoredNode) - 1]?.id);
  const alternativePaths = nodes
    .filter(n => n.parent === restoredNode.id && n.id !== failId && (mode === "full" || siblings.length > 1))
    .map(n => ({ nodeId: n.id, option: n.option, estimatedOutcome: n.outcome || "未记录" }));
  return {
    rolledBack: true,
    restoredNode,
    alternativePaths,
    learnedLessons: [
      `在节点「${restoredNode.id}」处选择「${restoredNode.option}」最终导致「${String(fp.error ?? "")}」`,
      alternativePaths.length ? `可改选「${alternativePaths[0].option}」` : "该点无可替代分支，应回到更早层级"
    ]
  };
}

/* D_007 决策评估方法 */
function d007(input) {
  const d = obj(input.decision);
  const options = arr(d.options);
  const selected = String(d.selected ?? "");
  const reasoning = String(d.reasoning ?? "");
  const evidence = arr(d.evidence);
  const stage = String(input.stage || "pre");
  const dims = [];
  // 逻辑完整性：是否列出多个选项并给出理由
  dims.push({
    dimension: "逻辑完整性",
    score: round(clamp01((options.length >= 2 ? 0.5 : 0.2) + (reasoning.length >= 20 ? 0.5 : reasoning.length / 40)), 4),
    rationale: `候选 ${options.length} 个，理由长度 ${reasoning.length} 字`
  });
  // 证据充分性
  dims.push({
    dimension: "证据充分性",
    score: round(clamp01(evidence.length / 3), 4),
    rationale: `提供 ${evidence.length} 条证据`
  });
  // 风险可控性：证据里带 mitigation 的比例
  const mitig = evidence.filter(e => !!obj(e).mitigation || !!obj(e).risk).length;
  dims.push({
    dimension: "风险可控性",
    score: round(clamp01(0.4 + safeDiv(mitig, Math.max(1, evidence.length)) * 0.6), 4),
    rationale: `${mitig} 条证据附带风险/缓解说明`
  });
  // 替代方案
  dims.push({
    dimension: "替代方案考虑",
    score: round(clamp01(options.length / 3), 4),
    rationale: `候选数 ${options.length}`
  });
  // 可执行性（post 阶段用结果校验）
  if (stage === "post") {
    const ok = String(input.outcome ?? "").length > 0;
    dims.push({ dimension: "可执行性（已执行）", score: ok ? 1 : 0.3, rationale: ok ? "已产生实际结果" : "无结果记录" });
  } else {
    dims.push({ dimension: "可执行性", score: round(clamp01(selected ? 0.7 : 0.3), 4), rationale: selected ? `已选定「${selected}」` : "尚未选定方案" });
  }
  const overallScore = round(mean(dims.map(x => x.score)), 4);
  const grade = overallScore >= 0.85 ? "A" : overallScore >= 0.7 ? "B" : overallScore >= 0.55 ? "C" : "D";
  const risks = [];
  if (options.length < 2) risks.push({ type: "单方案风险", detail: "未比较替代方案", level: "high" });
  if (evidence.length === 0) risks.push({ type: "无证据决策", detail: "全部结论缺乏证据支撑", level: "high" });
  if (reasoning.length < 20) risks.push({ type: "理由不足", detail: "决策理由过短", level: "medium" });
  const improvements = dims.filter(x => x.score < 0.6).map(x => `补强「${x.dimension}」：${x.rationale}`);
  return { scores: dims, overallScore, grade, risks, improvements };
}

/* D_008 决策风险分析 */
function d008(input) {
  const d = obj(input.decision);
  const ctx = obj(input.context);
  const appetite = String(input.riskAppetite || "medium");
  const opts = arr(d.options);
  const ev = arr(d.evidence);
  const text = str(d);
  const candidates = [];
  if (opts.length <= 1) candidates.push({ type: "方案单点", p: 0.9, i: 0.7, why: "只有一个候选方案" });
  if (ev.length === 0) candidates.push({ type: "证据缺失", p: 0.9, i: 0.8, why: "无任何证据支撑" });
  if (ctx.deadline != null && num(ctx.deadline) < 3) candidates.push({ type: "时间紧迫", p: 0.7, i: 0.6, why: `剩余时间 ${ctx.deadline}` });
  if (ctx.reversible === false) candidates.push({ type: "不可逆", p: 0.6, i: 0.9, why: "决策不可回退" });
  if (/必须|一定|绝对|100%/.test(text)) candidates.push({ type: "过度自信", p: 0.8, i: 0.5, why: "出现绝对化表述" });
  if (!candidates.length) candidates.push({ type: "常规执行风险", p: 0.3, i: 0.3, why: "未发现结构性风险" });
  const risks = candidates.map(c => {
    const severity = round(clamp01(c.p * c.i * (appetite === "low" ? 1.3 : appetite === "high" ? 0.8 : 1)), 4);
    return {
      type: c.type, description: c.why, probability: round(c.p, 4), impact: round(c.i, 4), severity,
      mitigation: c.type === "证据缺失" ? "先补证据再决策"
        : c.type === "方案单点" ? "强制生成至少一个替代方案"
          : c.type === "时间紧迫" ? "缩小题面或申请延期"
            : c.type === "不可逆" ? "先做小范围可回退试点"
              : c.type === "过度自信" ? "加入反证环节"
                : "纳入常规监控"
    };
  }).sort((a, b) => b.severity - a.severity);
  const overallRisk = round(clamp01(1 - risks.reduce((s, r) => s * (1 - r.severity * 0.6), 1)), 4);
  const riskLevel = overallRisk >= 0.6 ? "critical" : overallRisk >= 0.4 ? "high" : overallRisk >= 0.2 ? "medium" : "low";
  const recommendations = risks.filter(r => r.severity >= 0.3).map(r => `${r.type}：${r.mitigation}`);
  if (!recommendations.length) recommendations.push("风险可控，按计划执行并设观测点");
  return { risks, overallRisk, riskLevel, recommendations };
}

/* D_009 决策权衡方法 */
function d009(input) {
  const objs = arr(input.objectives).map(o => ({
    name: String(obj(o).name ?? "?"),
    direction: String(obj(o).direction || "max"),
    weight: Math.max(1e-9, num(obj(o).weight, 1)),
    currentValue: num(obj(o).currentValue)
  }));
  const opts = arr(input.options).map((o, i) => ({
    id: i, name: nm(o, "option") || `选项${i + 1}`,
    metrics: obj(obj(o).metrics ?? o)
  }));
  const strategy = String(input.strategy || "balanced");
  const val = (opt, o) => {
    const v = opt.metrics[o.name];
    return isFinite(Number(v)) ? Number(v) : o.currentValue;
  };
  // 支配关系 → Pareto 前沿
  const dominates = (a, b) => {
    let better = false, worse = false;
    objs.forEach(o => {
      const va = val(a, o), vb = val(b, o);
      const sa = o.direction === "max" ? va : -va;
      const sb = o.direction === "max" ? vb : -vb;
      if (sa > sb + 1e-9) better = true;
      if (sa < sb - 1e-9) worse = true;
    });
    return better && !worse;
  };
  const paretoFront = opts.filter(a => !opts.some(b => b !== a && dominates(b, a)));
  // 加权打分选优
  const tw = objs.reduce((s, o) => s + o.weight, 0) || 1;
  const scored = opts.map(o => {
    const ranges = objs.map(ob => {
      const vs = opts.map(x => val(x, ob));
      return Math.max(...vs) - Math.min(...vs) || 1;
    });
    let s = 0;
    objs.forEach((ob, i) => {
      const v = val(o, ob);
      const minV = Math.min(...opts.map(x => val(x, ob)));
      const norm = (v - minV) / ranges[i];
      s += (ob.direction === "max" ? norm : 1 - norm) * ob.weight;
    });
    return { ...o, score: round(s / tw, 4) };
  }).sort((a, b) => b.score - a.score);
  const selected = strategy === "conservative"
    ? (paretoFront.length ? paretoFront.sort((a, b) => {
        const ca = objs.reduce((s, o) => s + val(a, o), 0);
        const cb = objs.reduce((s, o) => s + val(b, o), 0);
        return cb - ca;
      }) : opts)[0]
    : scored[0];
  const bestVals = objs.map(o => Math.max(...opts.map(x => val(x, o))));
  const tradeoffs = objs.map((o, i) => {
    const v = val(selected, o);
    return {
      objective: o.name,
      sacrifice: round(Math.max(0, bestVals[i] - v), 4),
      gain: round(Math.max(0, v - Math.min(...opts.map(x => val(x, o)))), 4)
    };
  });
  const inPareto = paretoFront.some(p => p.id === selected.id);
  const justification = `${strategy} 策略下选定「${selected.name}」（加权得分 ${(scored.find(s => s.id === selected.id) || {}).score ?? "-"}）；` +
    (inPareto ? "该方案位于 Pareto 前沿，不存在全面优于它的选项" : "该方案不在 Pareto 前沿，说明有其他选项在部分维度更优");
  return { paretoFront: paretoFront.map(p => ({ name: p.name })), selected: { name: selected.name }, tradeoffs, justification };
}

/* D_010 决策收敛机制 */
function d010(input) {
  const cands = arr(input.candidates);
  const cons = arr(input.constraints);
  const objs = arr(input.objectives);
  const strategy = String(input.convergenceStrategy || "balanced");
  const path = [];
  let cur = cands.slice();
  path.push({ stage: "初始候选", candidatesRemaining: cur.length, criteria: `候选 ${cur.length} 个` });

  // 硬约束过滤
  cur = cur.filter(c => {
    const cs = obj(c).constraints;
    if (!Array.isArray(cs)) return true;
    return !cons.some(k => cs.includes(nm(k)) || cs.includes(String(obj(k).name ?? "")));
  });
  path.push({ stage: "硬约束过滤", candidatesRemaining: cur.length, criteria: `${cons.length} 条约束` });

  // 目标筛选
  if (objs.length && cur.length > 1) {
    const keep = strategy === "fast" ? 1 : strategy === "thorough" ? cur.length : Math.max(1, Math.ceil(cur.length * 0.5));
    cur = cur.slice(0, keep);
    path.push({ stage: "目标收敛", candidatesRemaining: cur.length, criteria: `${objs.length} 个目标，策略 ${strategy}` });
  }

  const selected = cur[0] ?? cands[0] ?? null;
  const abandoned = cands.filter(c => c !== selected);
  if (strategy === "satisficing" && selected) {
    path.push({ stage: "满意终止", candidatesRemaining: 1, criteria: "达到满意阈值即停，不再穷举" });
  }
  return {
    converged: selected,
    path,
    abandoned: abandoned.map(a => ({ name: nm(a, "name") || String(obj(a).option ?? "?") })),
    convergenceTime: round(path.length * 1.5, 2)
  };
}

/* D_011 决策分叉管理 */
function d011(input) {
  const dp = obj(input.decisionPoint);
  const branches = arr(input.branches).map(b => ({
    path: String(obj(b).path ?? "?"),
    probability: clamp01(num(obj(b).probability, 1 / Math.max(1, arr(input.branches).length))),
    estimatedValue: num(obj(b).estimatedValue),
    cost: Math.max(1e-9, num(obj(b).cost, 1))
  }));
  const budget = Math.max(0, num(input.resourceBudget, 1));
  const totalP = branches.reduce((s, b) => s + b.probability, 0) || 1;
  const allocation = branches.map(b => {
    const ev = b.probability * b.estimatedValue;
    return {
      path: b.path,
      resources: round(budget * (b.probability / totalP), 4),
      expectedValue: round(ev, 4)
    };
  });
  const totalExpectedValue = round(allocation.reduce((s, a) => s + a.expectedValue, 0), 4);
  const terminationCriteria = branches.map(b => ({
    path: b.path,
    condition: `当「${b.path}」的期望值跌破 ${round(b.estimatedValue * 0.5, 4)} 或成本超过 ${round(b.cost * 2, 4)} 时终止`
  }));
  const mergeStrategy = branches.length <= 1
    ? "单一分支，无需合并"
    : `按期望值排序后保留前 ${Math.min(2, branches.length)} 条，其余资源回收并入最优分支`;
  void dp;
  return { allocation, terminationCriteria, mergeStrategy, totalExpectedValue };
}

/* D_012 决策记忆机制 */
function d012(input) {
  const d = obj(input.decision);
  const outcome = String(input.outcome || "success");
  const ctx = obj(input.context);
  const pats = arr(input.patterns).map(p => String(obj(p).name ?? obj(p).pattern ?? p));
  const memoryType = pats.length ? "pattern" : outcome === "success" ? "success" : "failure";
  const retrievalKeys = [...new Set([
    String(obj(d).selected ?? ""), String(obj(d).reasoning ?? "").slice(0, 20),
    String(ctx.domain ?? ""), String(ctx.scene ?? ""), ...pats
  ].filter(Boolean))].slice(0, 8);
  const transferableTo = [];
  if (String(ctx.domain ?? "")) transferableTo.push(`${ctx.domain} 内的同类决策`);
  if (pats.length) transferableTo.push(...pats.map(p => `命中「${p}」模式的新场景`));
  const strength = round(clamp01(
    (outcome === "success" ? 0.65 : 0.55) +
    0.08 * Math.min(3, retrievalKeys.length) +
    0.08 * Math.min(2, transferableTo.length)), 4);
  return {
    stored: retrievalKeys.length > 0,
    memoryType, retrievalKeys, transferableTo, memoryStrength: strength
  };
}

/* D_013 决策进化机制 */
function d013(input) {
  const hist = arr(input.decisionHistory).map(h => ({
    outcome: String(obj(h).outcome ?? ""),
    lesson: String(obj(h).lesson ?? ""),
    feedback: obj(h.feedback)
  }));
  const method = obj(input.currentMethod);
  const succ = hist.filter(h => h.outcome === "success").length;
  const total = hist.length || 1;
  const winRate = round(succ / total, 4);
  const lessonCount = new Set(hist.map(h => h.lesson).filter(Boolean)).size;
  // 阶段：经验 → 模式 → 元
  const stage = lessonCount >= 5 && winRate >= 0.7 ? "meta" : lessonCount >= 2 ? "pattern" : "experience";
  const evolvedMethod = {
    name: `${String(method.name ?? "决策方法")}·${stage}`,
    base: String(method.name ?? "决策方法"),
    winRate, lessons: lessonCount,
    rule: stage === "meta"
      ? "把已验证的决策模式再抽象为选模策略，先选模型再用模型决策"
      : stage === "pattern"
        ? "把重复出现的胜负因归纳为可复用的判断模式"
        : "只做事后复盘，尚未形成模式"
  };
  const improvementGain = round(clamp01(winRate * 0.6 + Math.min(1, lessonCount / 8) * 0.4), 4);
  const emergentInsights = [];
  if (winRate >= 0.7 && lessonCount >= 2) emergentInsights.push("高胜率与多教训同时出现，说明失败被有效转化");
  if (winRate < 0.4 && lessonCount < 2) emergentInsights.push("低胜率且教训少，说明复盘不足，需先补记录");
  const nextEvolutionFocus = stage === "experience" ? "建立结构化复盘模板，把每次决策的教训落成条目"
    : stage === "pattern" ? "对高频模式做跨场景验证，剔除只在单场景成立的伪模式"
      : "把选模策略本身纳入被评估对象，防止元层僵化";
  return { evolvedMethod, improvementGain, evolutionStage: stage, emergentInsights, nextEvolutionFocus };
}

module.exports = {
  handlers: {
    ALG_T3_D_001: d001, ALG_T3_D_002: d002, ALG_T3_D_003: d003, ALG_T3_D_004: d004,
    ALG_T3_D_005: d005, ALG_T3_D_006: d006, ALG_T3_D_007: d007, ALG_T3_D_008: d008,
    ALG_T3_D_009: d009, ALG_T3_D_010: d010, ALG_T3_D_011: d011, ALG_T3_D_012: d012,
    ALG_T3_D_013: d013
  },
  samples: {
    ALG_T3_D_001: () => ({
      intent: "说明耦生度的计算方法",
      output: "耦生度 = 满意度 × 理解准确率 × 协同效率，大于 1 进入超导态。",
      context: { forbiddenTerms: ["绝对完整"] },
      lineage: { rootIntent: "说明耦生度计算方法", steps: [{ step: "拆解", from: "耦生度", to: "三因子", reason: "便于计算" }] }
    }),
    ALG_T3_D_002: () => ({
      userInput: "请评估这个方案的可行性",
      output: "方案可行性评估：技术上可行，成本偏高。", threshold: 0.2
    }),
    ALG_T3_D_003: () => ({
      rootIntent: "把漏检率降到万分之一",
      transformations: [{ step: "第一步", from: "漏检率降到万分之一", to: "提升成像分辨率", reason: "分辨率是主要瓶颈" },
        { step: "第二步", from: "提升成像分辨率", to: "改用高光谱", reason: "常规相机已到极限" }],
      finalOutput: "改用高光谱成像"
    }),
    ALG_T3_D_004: () => ({
      output: "本方案绝对完整，成本 30 万，另一处成本 50 万。",
      rules: [{ forbiddenTerms: ["绝对完整"], consistencyCheck: true }]
    }),
    ALG_T3_D_005: () => ({
      output: "第一步 TODO\n第二步 已完成模块 main.py\n第三步 已完成模块 main.py\n第四步 已完成模块 main.py\n第五步 已完成模块 main.py",
      expectedElements: ["第一步", "第二步", "第三步"], referenceData: [{ path: "core/main.py" }]
    }),
    ALG_T3_D_006: () => ({
      decisionTree: [
        { id: "n0", parent: null, option: "立项", outcome: "" },
        { id: "n1", parent: "n0", option: "自研", outcome: "周期长" },
        { id: "n2", parent: "n0", option: "采购", outcome: "成本高" },
        { id: "n3", parent: "n1", option: "加人", outcome: "预算超支" }
      ],
      failurePoint: { nodeId: "n3", error: "预算超支" }, mode: "partial"
    }),
    ALG_T3_D_007: () => ({
      decision: {
        options: [{ name: "自研" }, { name: "采购" }, { name: "外包" }],
        selected: "采购", reasoning: "自研周期超出窗口，外包质量不可控，采购是当前约束下的最优解。",
        evidence: [{ detail: "供应商报价", risk: "单一供应商", mitigation: "备选二供" }, { detail: "历史交付周期" }]
      }, stage: "pre"
    }),
    ALG_T3_D_008: () => ({
      decision: { options: [{ name: "采购" }], evidence: [], reasoning: "必须采购" },
      context: { deadline: 2, reversible: false }, riskAppetite: "low"
    }),
    ALG_T3_D_009: () => ({
      objectives: [
        { name: "成本", direction: "min", weight: 2, currentValue: 100 },
        { name: "性能", direction: "max", weight: 2, currentValue: 50 },
        { name: "周期", direction: "min", weight: 1, currentValue: 30 }
      ],
      options: [
        { option: "甲", metrics: { 成本: 80, 性能: 60, 周期: 40 } },
        { option: "乙", metrics: { 成本: 120, 性能: 85, 周期: 20 } },
        { option: "丙", metrics: { 成本: 100, 性能: 70, 周期: 30 } }
      ], strategy: "balanced"
    }),
    ALG_T3_D_010: () => ({
      candidates: [{ name: "甲" }, { name: "乙" }, { name: "丙" }, { name: "丁" }],
      constraints: [{ name: "预算" }], objectives: [{ name: "成本" }, { name: "性能" }],
      convergenceStrategy: "balanced"
    }),
    ALG_T3_D_011: () => ({
      decisionPoint: { name: "技术路线" },
      branches: [{ path: "自研", probability: 0.5, estimatedValue: 100, cost: 40 },
        { path: "采购", probability: 0.3, estimatedValue: 80, cost: 20 },
        { path: "外包", probability: 0.2, estimatedValue: 40, cost: 10 }],
      resourceBudget: 100
    }),
    ALG_T3_D_012: () => ({
      decision: { selected: "采购", reasoning: "供应商成熟度高" },
      outcome: "success", context: { domain: "工业质检" }, patterns: [{ name: "成熟度优先" }]
    }),
    ALG_T3_D_013: () => ({
      decisionHistory: [
        { decision: {}, outcome: "success", feedback: {}, lesson: "先查约束再选方案" },
        { decision: {}, outcome: "failure", feedback: {}, lesson: "不要只比报价" },
        { decision: {}, outcome: "success", feedback: {}, lesson: "先查约束再选方案" }
      ], currentMethod: { name: "加权打分法" }
    })
  }
};
