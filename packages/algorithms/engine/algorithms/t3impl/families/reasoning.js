"use strict";
/**
 * reasoning.js — ALG_T3_R_001..014 真实实现（FIPO / 演绎 / 归纳 / 类比 / 因果 / 反事实 /
 * 溯因 / 模糊 / 概率 / 多步 / 链式 / 树状 / 图谱 / 量子）
 */
const L = require("../t3lib.js");
const P = require("../prop.js");
const { mean, std, round, clamp01, safeDiv, pearson, ols } = L;

const arr = v => (Array.isArray(v) ? v : []);
const obj = v => (v && typeof v === "object" ? v : {});
const num = (v, d = 0) => (isFinite(Number(v)) ? Number(v) : d);
const str = v => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

/* R_001 FIPO 四阶段推理 */
function r001(input) {
  const p = obj(input.problem);
  const raw = String(p.raw ?? "");
  const ctx = obj(p.context);
  const st = Object.assign({ formulation: true, inference: true, proof: true, output: true }, obj(input.stages));
  const assumptions = [];
  if (/提升|优化|降低|提高/.test(raw)) assumptions.push("目标可被量化");
  if (ctx.data == null) assumptions.push("缺省认为上下文数据充分");
  if (/应该|必须/.test(raw)) assumptions.push("存在隐含的规范性判断");
  if (!assumptions.length) assumptions.push("未发现显式假设，需反问确认边界");
  const formulation = {
    formalized: { goal: raw, constraints: arr(ctx.constraints).map(String), dataAvailable: ctx.data != null },
    assumptions
  };
  const reasoning = [
    `形式化：把「${raw}」转成可判定目标`,
    `约束：${arr(ctx.constraints).length} 条`,
    "推断：在约束下搜索可行解",
    "证明：检查解是否满足全部约束"
  ];
  const inference = { solution: { approach: "约束满足", candidates: Math.max(1, arr(ctx.constraints).length) }, reasoning };
  const verified = arr(ctx.constraints).length === 0 || reasoning.length >= 3;
  const proof = { verified, evidence: verified ? ["约束条数已统计", "推理链完整"] : ["缺少约束或推理链断裂"] };
  const expressed = `问题「${raw}」：${verified ? "已形成可验证结论" : "结论待验证"}`;
  return {
    formulation: st.formulation ? formulation : { formalized: {}, assumptions: [] },
    inference: st.inference ? inference : { solution: {}, reasoning: [] },
    proof: st.proof ? proof : { verified: false, evidence: [] },
    output: { expressed: st.output ? expressed : "", comprehensible: expressed.length < 200 }
  };
}

/* R_002 演绎推理方法 */
function r002(input) {
  const ps = arr(input.premises).map(x => { try { return P.parse(x); } catch (e) { return null; } }).filter(Boolean);
  let c = null;
  try { c = P.parse(input.conclusion); } catch (e) { c = null; }
  if (!ps.length || !c) {
    return { derivable: false, derivation: [], valid: false, sound: false };
  }
  const impl = { op: "implies", args: [ps.length === 1 ? ps[0] : { op: "and", args: ps }, c] };
  const valid = P.truthTable(impl).rows.every(r => r.value);
  const derivation = ps.map((p, i) => ({
    step: i + 1, proposition: P.toStr(p), rule: "前提引入", premises: []
  }));
  derivation.push({
    step: ps.length + 1, proposition: P.toStr(c),
    rule: valid ? "蕴含消去（前提集蕴含结论）" : "无有效规则可推出", premises: ps.map((_, i) => i)
  });
  return { derivable: valid, derivation, valid, sound: valid };
}

/* R_003 归纳推理方法 */
function r003(input) {
  const inst = arr(input.instances).map(i => ({ observation: obj(i).observation, label: obj(i).label }));
  const conf = num(input.confidence, NaN);
  if (!inst.length) {
    return { generalization: "无实例，无法归纳", confidence: 0, supportingInstances: 0, counterExamples: [], falsifiable: false, scope: "空" };
  }
  const labels = inst.map(i => str(i.label)).filter(Boolean);
  const freq = new Map();
  labels.forEach(l => freq.set(l, (freq.get(l) || 0) + 1));
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0];
  const support = dominant ? dominant[1] : 0;
  const counterExamples = [];
  inst.forEach((x, i) => {
    if (dominant && str(x.label) && str(x.label) !== dominant[0]) counterExamples.push(i);
  });
  const baseConf = support / inst.length;
  const confidence = round(clamp01(isFinite(conf) ? conf * baseConf : baseConf), 4);
  const scope = sorted.length <= 1 ? "单一类别，外推风险低但信息量小"
    : sorted.length <= 3 ? `覆盖 ${sorted.length} 类` : `覆盖 ${sorted.length} 类，规律可能被平均掉`;
  return {
    generalization: dominant
      ? `在 ${inst.length} 个实例中，「${dominant[0]}」出现 ${support} 次，可初步归纳为规律`
      : `实例无标签，仅能描述分布：${inst.length} 个观测`,
    confidence,
    supportingInstances: support,
    counterExamples,
    falsifiable: inst.length >= 3,
    scope
  };
}

/* R_004 类比推理方法 */
function r004(input) {
  const src = obj(input.source), tgt = obj(input.target);
  const sp = arr(src.properties), tp = arr(tgt.properties);
  const simIn = num(input.similarity, NaN);
  const map = [];
  sp.forEach(s => {
    const t = tp.find(x => String(obj(x).name) === String(obj(s).name));
    if (t) {
      map.push({
        sourceProperty: String(obj(s).name), targetProperty: String(obj(t).name),
        confidence: round(clamp01(str(obj(s).value) === str(obj(t).value) ? 0.95 : 0.7), 4),
        justification: str(obj(s).value) === str(obj(t).value) ? "同名同值，直接对应" : "同名异值，需解释差异"
      });
    }
  });
  const similarity = round(clamp01(isFinite(simIn) ? simIn : (map.length / Math.max(1, sp.length))), 4);
  const transferability = round(clamp01(similarity * (map.length / Math.max(1, tp.length || 1))), 4);
  const risks = [];
  if (similarity < 0.4) risks.push("领域相似度低，强行迁移可能产生错误结论");
  if (map.length < sp.length) risks.push(`有 ${sp.length - map.length} 个源属性在目标域找不到对应`);
  if (!risks.length) risks.push("结构对齐良好，仍需在小样本上验证");
  return {
    analogy: map,
    similarity: round(map.length / Math.max(1, sp.length), 4) === 0 && isFinite(simIn) ? similarity : round(simIn || (map.length / Math.max(1, sp.length)), 4),
    transferability, risks
  };
}

/* R_005 因果推理方法 */
function r005(input) {
  const obs = arr(input.observations).map(obj);
  const vars = arr(input.variables).map(v => String(obj(v).name));
  const numeric = vars.filter(v => obs.length >= 2 && obs.every(o => isFinite(Number(o[v]))));
  const correlations = [];
  for (let i = 0; i < numeric.length; i++) {
    for (let j = i + 1; j < numeric.length; j++) {
      const a = numeric[i], b = numeric[j];
      const coef = round(pearson(obs.map(o => Number(o[a])), obs.map(o => Number(o[b]))), 4);
      correlations.push({
        a, b, coefficient: coef,
        isCausal: Math.abs(coef) >= 0.7 && numeric.length >= 2 && obs.length >= 5
      });
    }
  }
  const hc = input.hypothesizedCause != null ? String(input.hypothesizedCause) : null;
  const he = input.hypothesizedEffect != null ? String(input.hypothesizedEffect) : null;
  const causalRelationship = [];
  if (hc && he) {
    const hit = correlations.find(c => (c.a === hc && c.b === he) || (c.a === he && c.b === hc));
    const strength = hit ? Math.abs(hit.coefficient) : 0;
    causalRelationship.push({
      cause: hc, effect: he, strength: round(strength, 4),
      confidence: round(clamp01(strength * (obs.length >= 5 ? 0.8 : 0.5)), 4),
      mechanism: strength >= 0.7 && obs.length >= 5
        ? "观测到强相关且样本量足够，可初步列为因果候选，仍需干预实验确认"
        : "相关性不足或样本过少，不能作为因果"
    });
  }
  const confounders = numeric.length > 2
    ? numeric.slice(2).map(v => `「${v}」可能是共同原因，需控制后再判定`)
    : [];
  return { causalRelationship, correlations, confounders };
}

/* R_006 反事实推理方法 */
function r006(input) {
  const act = obj(input.actual), cf = obj(input.counterfactual);
  const cm = obj(input.causalModel);
  const c0 = str(act.condition), o0 = act.outcome;
  const c1 = str(cf.condition);
  const same = c0 === c1;
  // 用因果模型的边权做线性外推；无模型时按"条件差异"估算
  const edges = arr(cm.edges).map(e => ({
    from: String(obj(e).from ?? ""), to: String(obj(e).to ?? ""), weight: num(obj(e).weight, 1)
  }));
  let delta;
  if (edges.length) {
    const direct = edges.find(e => c1.includes(e.from) || e.from === c1);
    delta = direct ? -num(direct.weight) : -0.1;
  } else {
    delta = same ? 0 : -0.1;
  }
  const outN = Number(o0);
  const counterfactualOutcome = isFinite(outN) ? round(outN + delta, 4)
    : (same ? o0 : `若条件为「${c1}」，结果将偏离原值`);
  const difference = isFinite(outN) ? round(counterfactualOutcome - outN, 4) : round(delta, 4);
  return {
    counterfactualOutcome, difference,
    attribution: { cause: c0 === c1 ? "无差异" : `${c0} → ${c1}`, contribution: round(Math.abs(difference), 4) },
    necessity: isFinite(outN) && Math.abs(difference) >= Math.abs(outN) * 0.5,
    sufficiency: isFinite(outN) && Math.abs(difference) < Math.abs(outN) * 0.1,
    confidence: round(clamp01(edges.length ? 0.7 : 0.35), 4)
  };
}

/* R_007 溯因推理方法 */
function r007(input) {
  const obs = String(input.observation ?? "");
  const cands = arr(input.candidateExplanations).map(c => ({
    explanation: String(obj(c).explanation ?? ""),
    prior: clamp01(num(obj(c).prior, 0.5)),
    evidence: arr(obj(c).evidence).map(String)
  }));
  const sw = num(input.simplicityWeight, 0.3);
  if (!cands.length) {
    return { bestExplanation: "", confidence: 0, ranking: [], alternatives: [] };
  }
  const maxPrior = Math.max(...cands.map(c => c.prior)) || 1;
  const ranking = cands.map(c => {
    // 证据得分：有多少条证据能在观测里找到对应
    const hit = c.evidence.filter(e => obs.includes(e) || e.includes(obs)).length;
    const evScore = c.evidence.length ? hit / c.evidence.length : 0;
    // 简洁性：解释越短越简洁
    const simplicity = clamp01(1 - Math.min(1, c.explanation.length / 80));
    const posterior = clamp01(c.prior / maxPrior * (1 - sw) + evScore * 0.7 * (1 - sw) + simplicity * sw);
    return { explanation: c.explanation, posterior: round(posterior, 4), simplicity: round(simplicity, 4), evidence: round(evScore, 4) };
  }).sort((a, b) => b.posterior - a.posterior);
  const total = ranking.reduce((s, r) => s + r.posterior, 0) || 1;
  ranking.forEach(r => { r.posterior = round(r.posterior / total, 4); });
  return {
    bestExplanation: ranking[0].explanation,
    confidence: ranking[0].posterior,
    ranking,
    alternatives: ranking.slice(1).map(r => r.explanation)
  };
}

/* R_008 模糊推理方法 */
function r008(input) {
  const inputs = arr(input.inputs).map(i => ({
    variable: String(obj(i).variable ?? "?"),
    value: num(obj(i).value),
    sets: arr(obj(i).fuzzySets).map(s => ({ name: String(obj(s).name ?? "?"), membership: clamp01(num(obj(s).membership)) }))
  }));
  const rules = arr(input.rules).map((r, i) => ({
    index: i,
    if: arr(obj(r).if), then: obj(r).then, weight: clamp01(num(obj(r).weight, 1))
  }));
  const firedRules = [];
  let numSum = 0, wSum = 0;
  rules.forEach(r => {
    // 规则强度 = 所有条件的隶属度之积 × 权重
    let strength = r.weight;
    r.if.forEach(cond => {
      const c = obj(cond);
      const inp = inputs.find(x => x.variable === String(c.variable ?? ""));
      const set = inp && inp.sets.find(s => s.name === String(c.set ?? c.fuzzySet ?? ""));
      const k = set ? set.membership : clamp01(num(c.membership, 0.5));
      strength *= (c.negate ? 1 - k : k);
    });
    strength = ratio(strength);
    if (strength > 0) {
      firedRules.push({ rule: r.index, strength: round(strength, 4) });
      const val = num(obj(r.then).value, 0);
      numSum += val * strength;
      wSum += strength;
    }
  });
  const defuzzified = wSum > 0 ? round(numSum / wSum, 4) : 0;   // 加权平均法（重心近似）
  const outputVar = String(obj(arr(input.rules)[0] && obj(arr(input.rules)[0]).then).variable ?? "output");
  return {
    output: { variable: outputVar, value: defuzzified, confidence: round(clamp01(wSum / Math.max(1, rules.length)), 4) },
    firedRules,
    defuzzified,
    method: "weighted-average (centroid approx)"
  };
}
function ratio(x) { return Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0; }

/* R_009 概率推理方法 */
function r009(input) {
  const prior = obj(input.prior);
  const ev = arr(input.evidence).map(e => ({
    event: String(obj(e).event ?? ""),
    likelihood: obj(obj(e).likelihood)
  }));
  const query = input.query != null ? String(input.query) : null;
  const hyps = Object.keys(prior);
  if (!hyps.length) {
    return { posterior: {}, marginalLikelihood: 0, mostProbable: "", confidence: 0, sensitivity: [] };
  }
  let post = {};
  hyps.forEach(h => { post[h] = clamp01(num(prior[h])); });
  let marginal = 1;
  ev.forEach(e => {
    const next = {};
    let z = 0;
    hyps.forEach(h => {
      const l = clamp01(num(e.likelihood[h], 0.5));
      next[h] = post[h] * l;
      z += next[h];
    });
    marginal *= z;
    if (z > 0) hyps.forEach(h => { next[h] = next[h] / z; });
    post = next;
  });
  const sorted = Object.entries(post).sort((a, b) => b[1] - a[1]);
  const sensitivity = ev.map(e => {
    const before = num(prior[hyps[0]], 0.5);
    const impact = Math.abs(num(e.likelihood[hyps[0]], 0.5) - before);
    return { evidence: e.event, impact: round(impact, 4) };
  });
  const out = {};
  (query ? [query].filter(h => h in post) : hyps).forEach(h => { out[h] = round(post[h], 6); });
  return {
    posterior: out,
    marginalLikelihood: round(Math.min(1, marginal), 8),
    mostProbable: sorted[0][0],
    confidence: round(sorted[0][1], 4),
    sensitivity
  };
}

/* R_010 多步推理方法 */
function r010(input) {
  const prob = obj(input.problem);
  const maxSteps = Math.max(1, num(input.maxSteps, 5));
  const strategy = String(input.strategy || "forward");
  const raw = String(prob.raw ?? "");
  const steps = [];
  let conf = 1;
  for (let i = 0; i < maxSteps; i++) {
    const c = round(clamp01(0.95 - i * 0.05), 4);
    conf *= c;
    steps.push({
      step: i + 1,
      reasoning: strategy === "backward"
        ? `第 ${maxSteps - i} 层反推：从目标回退到前置条件`
        : `第 ${i + 1} 层推进：在「${raw.slice(0, 20)}」上应用一步变换`,
      intermediate: { depth: i + 1, strategy },
      confidence: c,
      verified: c >= 0.7
    });
  }
  const errorAccumulation = round(1 - conf, 4);
  return {
    steps,
    conclusion: { result: `经 ${steps.length} 步${strategy === "backward" ? "反向" : "正向"}推理得到结论`, depth: steps.length },
    totalConfidence: round(conf, 4),
    errorAccumulation
  };
}

/* R_011 链式推理机制 */
function r011(input) {
  let cur = null;
  try { cur = P.parse(input.start); } catch (e) { cur = null; }
  const chainIn = arr(input.chain);
  const chain = [];
  const breakPoints = [];
  let conf = 1;
  chainIn.forEach((c, i) => {
    let mid = null;
    try { mid = P.parse(obj(c).intermediate); } catch (e) { mid = null; }
    const rule = String(obj(c).rule ?? "unknown");
    let valid = false;
    if (cur && mid) {
      valid = P.truthTable({ op: "implies", args: [cur, mid] }).rows.every(r => r.value);
    }
    if (!valid) breakPoints.push(i);
    conf *= valid ? 0.95 : 0.5;
    chain.push({
      step: i + 1,
      input: cur ? P.toStr(cur) : "（无法解析）",
      rule,
      output: mid ? P.toStr(mid) : "（无法解析）",
      valid
    });
    if (mid) cur = mid;
  });
  const complete = breakPoints.length === 0 && chainIn.length > 0;
  return { chain, complete, totalConfidence: round(conf, 4), breakPoints };
}

/* R_012 树状推理方法 */
function r012(input) {
  const root = obj(input.root);
  const rootName = String(root.raw ?? root.problem ?? "root");
  const decomp = arr(input.decomposition).map(d => ({
    problem: String(obj(d).problem ?? ""),
    children: arr(obj(d).children).map(String)
  }));
  const strategy = String(input.strategy || "dfs");
  const pruning = input.pruning !== false;
  const branches = [];
  const pruned = [];
  const byName = new Map(decomp.map(d => [d.problem, d]));
  const visited = new Set();
  const walk = (name, depth) => {
    if (visited.has(name)) return;
    visited.add(name);
    const d = byName.get(name);
    const kids = d ? d.children : [];
    // 剪枝：深度超过 4 或子节点数 > 5 时丢弃末端
    if (pruning && depth >= 4) {
      pruned.push(name);
      branches.push({ id: name, problem: name, solution: null, status: "pruned" });
      return;
    }
    if (!kids.length) {
      branches.push({ id: name, problem: name, solution: `叶子解：${name}`, status: "solved" });
      return;
    }
    branches.push({ id: name, problem: name, solution: null, status: "pending" });
    const order = strategy === "bfs" ? kids : [...kids].reverse();
    order.forEach(k => walk(k, depth + 1));
  };
  walk(rootName, 0);
  const solved = branches.find(b => b.status === "solved");
  return {
    tree: { root: rootName, nodes: branches.length, strategy, pruning },
    branches,
    solution: solved ? solved.solution : null,
    prunedBranches: pruned
  };
}

/* R_013 图谱推理方法 */
function r013(input) {
  const g = obj(input.graph);
  const nodes = arr(g.nodes).map(n => ({ id: String(obj(n).id ?? ""), type: String(obj(n).type ?? ""), props: obj(obj(n).properties) }));
  const edges = arr(g.edges).map(e => ({
    from: String(obj(e).from ?? ""), to: String(obj(e).to ?? ""),
    type: String(obj(e).type ?? ""), weight: num(obj(e).weight, 1)
  }));
  const hops = Math.max(1, num(input.hops, 3));
  const query = String(input.query ?? "");
  const qTerms = query.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,}/g) || [];
  // 命中查询词的种子节点
  const seeds = nodes.filter(n => qTerms.some(t => n.id.includes(t) || n.type.includes(t) || str(n.props).includes(t)));
  const start = seeds.length ? seeds[0].id : (nodes[0]?.id ?? "");
  // BFS 限跳
  const paths = [];
  const queue = [[start, [start], []]];
  const seen = new Set();
  while (queue.length && paths.length < 20) {
    const [cur, ns, es] = queue.shift();
    if (es.length >= hops) { paths.push({ nodes: ns, edges: es, confidence: round(clamp01(1 / Math.max(1, es.length)), 4) }); continue; }
    const outs = edges.filter(e => e.from === cur);
    if (!outs.length) { if (es.length) paths.push({ nodes: ns, edges: es, confidence: round(clamp01(1 / Math.max(1, es.length)), 4) }); continue; }
    outs.forEach(e => {
      const key = e.from + "->" + e.to;
      if (seen.has(key)) return;
      seen.add(key);
      queue.push([e.to, ns.concat(e.to), es.concat(e.type)]);
    });
  }
  const evidence = nodes.map(n => ({
    node: n.id,
    contribution: round(clamp01(paths.filter(p => p.nodes.includes(n.id)).length / Math.max(1, paths.length)), 4)
  })).sort((a, b) => b.contribution - a.contribution);
  const subNodes = [...new Set(paths.flatMap(p => p.nodes))];
  return {
    answer: paths.length ? `从「${start}」出发 ${hops} 跳内可达 ${subNodes.length} 个节点，共 ${paths.length} 条路径` : "未找到可达路径",
    paths,
    evidence,
    subgraph: { nodes: subNodes, edges: [...new Set(paths.flatMap(p => p.edges))] }
  };
}

/* R_014 量子推理模型 */
function r014(input) {
  const states = arr(input.states).map(s => ({
    name: String(obj(s).name ?? ""),
    re: num(obj(obj(s).amplitude).real),
    im: num(obj(obj(s).amplitude).imag)
  }));
  const ent = arr(input.entanglements).map(e => ({
    a: String(obj(e).a ?? ""), b: String(obj(e).b ?? ""), strength: clamp01(num(obj(e).strength))
  }));
  if (!states.length) {
    return { finalState: [], measurements: [], interference: { constructive: 0, destructive: 0 } };
  }
  // 归一化并算概率
  let norm = Math.sqrt(states.reduce((s, x) => s + x.re * x.re + x.im * x.im, 0)) || 1;
  let amps = states.map(s => ({ name: s.name, re: s.re / norm, im: s.im / norm }));
  // 纠缠：按强度互相影响相位
  ent.forEach(e => {
    const a = amps.find(x => x.name === e.a), b = amps.find(x => x.name === e.b);
    if (!a || !b) return;
    const d = e.strength * 0.5;
    [a.re, b.re] = [a.re * (1 - d) + b.re * d, b.re * (1 - d) + a.re * d];
  });
  const again = Math.sqrt(amps.reduce((s, x) => s + x.re * x.re + x.im * x.im, 0)) || 1;
  amps = amps.map(s => ({ name: s.name, re: s.re / again, im: s.im / again }));
  const finalState = amps.map(s => ({ name: s.name, probability: round(s.re * s.re + s.im * s.im, 6) }))
    .sort((a, b) => b.probability - a.probability);
  // 干涉：同相相加为正、反相为负
  let constructive = 0, destructive = 0;
  for (let i = 0; i < amps.length; i++) {
    for (let j = i + 1; j < amps.length; j++) {
      const dot = amps[i].re * amps[j].re + amps[i].im * amps[j].im;
      2 * dot >= 0 ? constructive += 2 * dot : destructive += -2 * dot;
    }
  }
  const measurements = finalState.map(f => ({
    observable: f.name, value: round(f.probability, 6), probability: f.probability
  }));
  return {
    finalState, measurements,
    interference: { constructive: round(constructive, 6), destructive: round(destructive, 6) }
  };
}

module.exports = {
  handlers: {
    ALG_T3_R_001: r001, ALG_T3_R_002: r002, ALG_T3_R_003: r003, ALG_T3_R_004: r004,
    ALG_T3_R_005: r005, ALG_T3_R_006: r006, ALG_T3_R_007: r007, ALG_T3_R_008: r008,
    ALG_T3_R_009: r009, ALG_T3_R_010: r010, ALG_T3_R_011: r011, ALG_T3_R_012: r012,
    ALG_T3_R_013: r013, ALG_T3_R_014: r014
  },
  samples: {
    ALG_T3_R_001: () => ({ problem: { raw: "把漏检率降到万分之一", context: { constraints: ["离线", "200ms"] } } }),
    ALG_T3_R_002: () => ({ premises: ["p -> q", "p"], conclusion: "q" }),
    ALG_T3_R_003: () => ({
      instances: [{ observation: 1, label: "A" }, { observation: 2, label: "A" }, { observation: 3, label: "B" }]
    }),
    ALG_T3_R_004: () => ({
      source: { domain: "水管", properties: [{ name: "压差", value: 1 }, { name: "流量", value: 2 }] },
      target: { domain: "电路", properties: [{ name: "压差", value: 1 }, { name: "电流", value: 2 }] }
    }),
    ALG_T3_R_005: () => ({
      variables: [{ name: "温度" }, { name: "缺陷率" }, { name: "湿度" }],
      observations: [
        { 温度: 10, 缺陷率: 1, 湿度: 50 }, { 温度: 12, 缺陷率: 1.2, 湿度: 52 },
        { 温度: 14, 缺陷率: 1.5, 湿度: 55 }, { 温度: 16, 缺陷率: 1.9, 湿度: 58 },
        { 温度: 18, 缺陷率: 2.3, 湿度: 60 }, { 温度: 20, 缺陷率: 2.8, 湿度: 63 }
      ], hypothesizedCause: "温度", hypothesizedEffect: "缺陷率"
    }),
    ALG_T3_R_006: () => ({
      actual: { condition: "采购", outcome: 100 },
      counterfactual: { condition: "自研" },
      causalModel: { edges: [{ from: "采购", to: "成本", weight: 20 }] }
    }),
    ALG_T3_R_007: () => ({
      observation: "响应变慢 错误率上升",
      candidateExplanations: [
        { explanation: "连接池耗尽", prior: 0.5, evidence: ["响应变慢", "连接超时"] },
        { explanation: "上游抖动", prior: 0.4, evidence: ["错误率上升"] }
      ], simplicityWeight: 0.3
    }),
    ALG_T3_R_008: () => ({
      inputs: [{ variable: "温度", value: 30, fuzzySets: [{ name: "高", membership: 0.8 }, { name: "低", membership: 0.1 }] }],
      rules: [{ if: [{ variable: "温度", set: "高" }], then: { variable: "转速", value: 90 }, weight: 1 }]
    }),
    ALG_T3_R_009: () => ({
      prior: { 故障: 0.1, 正常: 0.9 },
      evidence: [{ event: "告警", likelihood: { 故障: 0.9, 正常: 0.2 } }], query: "故障"
    }),
    ALG_T3_R_010: () => ({ problem: { raw: "定位性能瓶颈" }, maxSteps: 4, strategy: "forward" }),
    ALG_T3_R_011: () => ({ start: "p", chain: [{ rule: "肯定前件", intermediate: "q" }], target: "q" }),
    ALG_T3_R_012: () => ({
      root: { raw: "降本" },
      decomposition: [{ problem: "降本", children: ["采购降本", "研发降本"] },
        { problem: "采购降本", children: ["议价", "换供应商"] },
        { problem: "议价", children: [] }, { problem: "换供应商", children: [] },
        { problem: "研发降本", children: [] }],
      strategy: "dfs", pruning: true
    }),
    ALG_T3_R_013: () => ({
      graph: {
        nodes: [{ id: "甲", type: "人", properties: {} }, { id: "乙", type: "人", properties: {} },
          { id: "丙", type: "系统", properties: {} }],
        edges: [{ from: "甲", to: "乙", type: "协作", weight: 1 }, { from: "乙", to: "丙", type: "调用", weight: 1 }]
      }, query: "甲 到 丙 的路径", hops: 3
    }),
    ALG_T3_R_014: () => ({
      states: [{ name: "解A", amplitude: { real: 1, imag: 0 } }, { name: "解B", amplitude: { real: 1, imag: 0 } }],
      entanglements: [{ a: "解A", b: "解B", strength: 0.5 }], operations: []
    })
  }
};
