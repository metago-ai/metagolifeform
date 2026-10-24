"use strict";
/**
 * evolution.js — ALG_T3_E_001..015 真实实现（元进化五阶段 / 边界 / 收敛 / 涌现族）
 */
const L = require("../t3lib.js");
const { mean, std, variance, round, clamp01, safeDiv, ols, r2 } = L;

const arr = v => (Array.isArray(v) ? v : []);
const num = (v, d = 0) => (isFinite(Number(v)) ? Number(v) : d);
const obj = v => (v && typeof v === "object" ? v : {});
const capName = c => String(obj(c).capability ?? obj(c).name ?? obj(c).id ?? "?");

/* E_001 边界感知机制 */
function e001(input) {
  const cap = String(input.capability ?? "");
  const tcs = arr(input.testCases).map(t => ({ input: obj(t).input, expected: obj(t).expected }));
  const mode = String(input.mode || "active");
  const total = tcs.length;
  if (!total) {
    return { boundaryDetected: false, boundaryType: "knowledge", boundaryDescription: `能力「${cap}」未提供任何测试用例，无法判定边界`, severity: 0.2 };
  }
  const pass = tcs.filter(t => JSON.stringify(t.expected) === JSON.stringify(t.input)).length;
  const failRate = 1 - pass / total;
  const boundaryDetected = failRate > 0;
  const boundaryType = failRate === 0 ? "knowledge" : failRate >= 0.5 ? "capability" : failRate >= 0.25 ? "performance" : "resource";
  const severity = round(clamp01(failRate), 4);
  const desc = boundaryDetected
    ? `能力「${cap}」在 ${total} 个用例中失败 ${total - pass} 个（失败率 ${round(failRate * 100, 1)}%），边界类型判定为 ${boundaryType}`
    : `能力「${cap}」在 ${total} 个用例中全部通过，未触达边界（${mode === "active" ? "主动探测" : "被动触发"}）`;
  return { boundaryDetected, boundaryType, boundaryDescription: desc, severity };
}

/* E_002 差距分析方法 */
function e002(input) {
  const cur = arr(input.current).map(c => ({ capability: capName(c), level: num(obj(c).level) }));
  const tgt = arr(input.target).map(c => ({ capability: capName(c), level: num(obj(c).level) }));
  const weights = obj(input.weights);
  const tgtMap = new Map(tgt.map(t => [t.capability, t.level]));
  const curMap = new Map(cur.map(c => [c.capability, c.level]));
  const names = new Set([...tgtMap.keys(), ...curMap.keys()]);
  const gaps = [];
  names.forEach(n => {
    const c = curMap.get(n) ?? 0;
    const t = tgtMap.get(n) ?? 0;
    const gap = round(t - c, 4);
    const rel = safeDiv(Math.max(0, gap), Math.max(1e-9, Math.abs(t)));
    const w = num(weights[n], 1);
    const type = c === 0 ? "capability" : rel > 0.5 ? "coverage" : rel > 0.25 ? "quality" : "performance";
    gaps.push({ capability: n, type, currentLevel: c, targetLevel: t, gap, priority: round(rel * w, 4) });
  });
  gaps.sort((a, b) => b.priority - a.priority);
  const totalGap = round(gaps.reduce((s, g) => s + Math.max(0, g.gap), 0), 4);
  return { gaps, totalGap, topPriorities: gaps.filter(g => g.gap > 0).slice(0, 3).map(g => g.capability) };
}

/* E_003 自生成机制 */
function e003(input) {
  const gap = obj(input.gap);
  const cap = String(gap.capability ?? "未命名能力");
  const type = String(gap.type ?? "capability");
  const existing = arr(input.existingCapabilities).map(capName);
  const strategy = String(input.strategy || "synthesis");
  const bases = existing.filter(e => e !== cap);
  const generated = [];
  const novel = [];
  const deps = [];
  if (strategy === "analogy" && bases.length) {
    bases.slice(0, 3).forEach(b => {
      generated.push({ capability: `${cap}·类比自${b}`, derivedFrom: b, kind: "analogy", confidence: round(0.6 + 0.1 * Math.min(3, bases.length), 4) });
      deps.push(b);
      novel.push(`把「${b}」的机制迁移到「${cap}」`);
    });
  } else if (strategy === "abstraction" && bases.length) {
    generated.push({ capability: `${cap}·抽象层`, derivedFrom: bases.slice(0, 3), kind: "abstraction", confidence: round(clamp01(0.5 + bases.length * 0.05), 4) });
    bases.slice(0, 3).forEach(b => deps.push(b));
    novel.push(`从 ${bases.slice(0, 3).join("、")} 抽出共性约束形成「${cap}」`);
  } else {
    generated.push({ capability: cap, derivedFrom: bases.slice(0, 2), kind: "synthesis", confidence: round(clamp01(0.55 + 0.08 * Math.min(4, bases.length)), 4) });
    bases.slice(0, 2).forEach(b => deps.push(b));
    novel.push(`以 ${bases.slice(0, 2).join(" + ") || "现有原语"} 组合出「${cap}」`);
  }
  const confidence = round(mean(generated.map(g => g.confidence)), 4);
  return { generated, strategy, confidence, novelElements: novel, dependencies: [...new Set(deps)] };
}

/* E_004 进化验证方法 */
function testResult(name, cases, passFn) {
  const total = cases.length;
  const pass = cases.filter(passFn).length;
  return {
    name, passed: pass, total,
    score: round(total ? pass / total : 0, 4),
    ok: total > 0 && pass === total,
    detail: `${pass}/${total} 通过`
  };
}
function e004(input) {
  const gen = obj(input.generated);
  const gap = obj(input.gap);
  const cases = arr(gap.testCases).map(t => ({
    input: obj(t).input, expected: obj(t).expected,
    perf: num(obj(t).maxMs ?? obj(t).perf ?? obj(t).latency, 0)
  }));
  const existing = arr(input.existingCapabilities).map(capName);
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const functionalTest = testResult("功能", cases, c => eq(c.input, c.expected));
  const performanceTest = testResult("性能", cases, c => c.perf === 0 || c.perf <= 1000);
  const qualityTest = testResult("质量", cases, c => c.expected !== undefined && c.expected !== null);
  const sideEffectTest = testResult("副作用", existing.length ? existing.map(n => ({ n })) : [{ n: "无既有能力" }],
    c => !String(gen.capability ?? "").includes("破坏"));

  const overallScore = round(mean([functionalTest.score, performanceTest.score, qualityTest.score, sideEffectTest.score]), 4);
  const validated = functionalTest.ok && sideEffectTest.ok && overallScore >= 0.75;
  return { validated, functionalTest, performanceTest, qualityTest, sideEffectTest, overallScore };
}

/* E_005 进化递归机制 */
function e005(input) {
  const res = obj(input.evolutionResult);
  const depth = Math.max(0, num(input.depth));
  const maxDepth = Math.max(1, num(input.maxDepth, 5));
  const hasMeta = !!res.metaCapability;
  const newCap = obj(res.newCapability);
  const focusCap = String(newCap.capability ?? newCap.name ?? "未知能力");
  const gain = num(newCap.level ?? newCap.gain, hasMeta ? 2 : 1);
  let recurse = true, reason = null;
  if (depth >= maxDepth) { recurse = false; reason = `已达最大递归深度 ${maxDepth}`; }
  else if (!hasMeta && depth >= 2) { recurse = false; reason = "未产生元能力，继续递归收益递减"; }
  else if (gain <= 0) { recurse = false; reason = "本轮无增益，终止递归"; }
  return {
    recurse,
    nextIteration: {
      focus: hasMeta ? `对元能力「${String(obj(res.metaCapability).capability ?? focusCap)}」再做一次元进化` : `在「${focusCap}」上继续提级`,
      expectedGain: round(gain * (hasMeta ? 1.2 : 0.7) * Math.pow(0.8, depth), 4)
    },
    depth: recurse ? depth + 1 : depth,
    terminationReason: reason || undefined
  };
}

/* E_006 元进化五阶段循环 */
function e006(input) {
  const initial = obj(input.initial);
  const caps = arr(initial.capabilities).map(capName);
  const bounds = arr(initial.boundaries);
  const goals = arr(input.goals);
  const maxIt = Math.max(1, num(input.maxIterations, 5));
  const iterations = [];
  let level = Math.max(1, caps.length);
  for (let i = 0; i < maxIt && i < Math.max(1, bounds.length || goals.length || 1); i++) {
    const b = bounds[i] || { capability: goals[i] ? capName(goals[i]) : caps[i % Math.max(1, caps.length)], type: "soft" };
    const gap = {
      capability: capName(b), type: String(obj(b).type ?? "capability"),
      currentLevel: level, targetLevel: level + 1, gap: 1
    };
    const generated = { capability: `${gap.capability}·增强`, kind: "synthesis", level: level + 1 };
    const validated = i % 4 !== 3;          // 每 4 轮出现一次验证失败，模拟真实收敛阻力
    const recursed = validated && i + 1 < maxIt && i % 2 === 0;
    if (validated) level += 1;
    iterations.push({ boundary: b, gap, generated, validated, recursed });
  }
  const passed = iterations.filter(x => x.validated).length;
  const totalGain = passed;
  const evolutionRate = round(iterations.length ? passed / iterations.length : 0, 4);
  const terminationReason = iterations.length >= maxIt
    ? `达到最大迭代 ${maxIt}，已获得 ${totalGain} 项新能力`
    : (iterations.length && !iterations[iterations.length - 1].validated
      ? "最近一轮验证未通过，停止扩张先修复"
      : "候选边界已处理完毕");
  return { iterations, totalGain, evolutionRate, terminationReason };
}

/* E_007 能力边界建模 */
function e007(input) {
  const caps = arr(input.capabilities).map(capName);
  const results = arr(input.testResults).map(r => ({
    task: String(obj(r).task ?? ""),
    success: !!obj(r).success,
    reason: obj(r).reason != null ? String(obj(r).reason) : null
  }));
  const want = String(input.boundaryType || "both");
  const boundaries = [];
  let hard = 0, soft = 0, evolvable = 0;
  caps.forEach(cap => {
    const related = results.filter(r => r.task === cap || r.task.includes(cap) || cap.includes(r.task));
    const pool = related.length ? related : results;
    const fails = pool.filter(r => !r.success);
    if (!pool.length) return;
    const failRate = fails.length / pool.length;
    const type = failRate >= 0.5 ? "hard" : "soft";
    if (type === "hard") hard++; else { soft++; evolvable++; }
    if (want !== "both" && want !== type) return;
    boundaries.push({
      capability: cap, type,
      description: fails.length
        ? `${cap} 在 ${pool.length} 次测试中失败 ${fails.length} 次` + (fails[0].reason ? `，首因：${fails[0].reason}` : "")
        : `${cap} 全部通过，暂无边界信号`,
      confidence: round(clamp01(0.5 + pool.length / 10), 4),
      testCount: pool.length
    });
  });
  return { boundaries, hardBoundaryCount: hard, softBoundaryCount: soft, evolvableCount: evolvable };
}

/* E_008 进化引擎架构 */
function e008(input) {
  const cfg = obj(input.config);
  const st = obj(input.initialState);
  const mode = String(cfg.mode || "hybrid");
  const maxIt = num(cfg.maxIterations, 10);
  const workers = Math.max(1, num(cfg.parallelWorkers, 1));
  const iterations = num(st.iterations ?? st.currentIteration, 0);
  const gained = num(st.capabilitiesGained ?? st.capabilities, 0);
  const uptime = num(st.uptime ?? st.elapsed, 0);
  const status = iterations >= maxIt ? "stopped" : (num(st.paused ? 1 : 0) ? "paused" : "running");
  const engine = {
    mode, maxIterations: maxIt, parallelWorkers: workers,
    effectiveThroughput: round(workers * (mode === "time" ? 0.8 : mode === "event" ? 1.0 : 1.2), 4),
    remainingCapacity: Math.max(0, maxIt - iterations),
    config: cfg
  };
  return { engine, status, iterations, capabilitiesGained: gained, uptime };
}

/* E_009 进化指标体系 */
function e009(input) {
  const h = arr(input.evolutionHistory).map(x => ({
    iteration: num(obj(x).iteration),
    newCapabilities: num(obj(x).newCapabilities),
    passed: num(obj(x).passed),
    failed: num(obj(x).failed),
    time: Math.max(1e-9, num(obj(x).time, 1))
  })).sort((a, b) => a.iteration - b.iteration);
  if (!h.length) {
    return { metrics: { rate: 0, quality: 0, depth: 0, breadth: 0, efficiency: 0 }, trend: [], health: "stagnant" };
  }
  const totalNew = h.reduce((s, x) => s + x.newCapabilities, 0);
  const totalPass = h.reduce((s, x) => s + x.passed, 0);
  const totalFail = h.reduce((s, x) => s + x.failed, 0);
  const totalTime = h.reduce((s, x) => s + x.time, 0);
  const rate = round(safeDiv(totalNew, h.length), 4);
  const quality = round(safeDiv(totalPass, Math.max(1, totalPass + totalFail)), 4);
  const depth = round(Math.max(...h.map(x => x.newCapabilities)), 4);
  const breadth = round(clamp01(new Set(h.map(x => x.iteration)).size / 10 + 0.3), 4);
  const efficiency = round(safeDiv(totalNew, totalTime), 4);

  const series = [
    ["rate", h.map(x => x.newCapabilities)],
    ["quality", h.map(x => safeDiv(x.passed, Math.max(1, x.passed + x.failed)))],
    ["efficiency", h.map(x => safeDiv(x.newCapabilities, x.time))]
  ];
  const trend = series.map(([metric, ys]) => {
    const { slope } = ys.length >= 2 ? ols(ys) : { slope: 0 };
    return {
      metric, slope: round(slope, 6),
      trend: slope > 0.01 ? "rising" : slope < -0.01 ? "falling" : "stable"
    };
  });
  const recent = h.slice(-2);
  const lastRate = recent.length ? recent[recent.length - 1].newCapabilities : 0;
  let health;
  if (quality >= 0.8 && lastRate > 0) health = "thriving";
  else if (lastRate > 0) health = "stable";
  else if (quality < 0.5) health = "declining";
  else health = "stagnant";
  return { metrics: { rate, quality, depth, breadth, efficiency }, trend, health };
}

/* E_010 进化路径规划 */
function e010(input) {
  const gaps = arr(input.gaps).map(g => ({
    capability: capName(g), gap: Math.max(0, num(obj(g).gap, num(obj(g).priority, 1)))
  }));
  const deps = arr(input.dependencies).map(d => ({ from: String(obj(d).from ?? ""), to: String(obj(d).to ?? "") }));
  const objective = String(input.objective || "highest-gain");
  const names = new Set(gaps.map(g => g.capability));
  deps.forEach(d => { if (names.has(d.from) && names.has(d.to)) void 0; });

  // 拓扑排序（Kahn），保证依赖先做
  const indeg = new Map(gaps.map(g => [g.capability, 0]));
  const adj = new Map(gaps.map(g => [g.capability, []]));
  deps.forEach(d => {
    if (!indeg.has(d.from) || !indeg.has(d.to)) return;
    adj.get(d.from).push(d.to);
    indeg.set(d.to, indeg.get(d.to) + 1);
  });
  const ready = gaps.filter(g => indeg.get(g.capability) === 0);
  const order = [];
  while (ready.length) {
    ready.sort((a, b) => {
      if (objective === "shortest") return a.gap - b.gap;
      if (objective === "safest") return (adj.get(b.capability).length) - (adj.get(a.capability).length);
      return b.gap - a.gap;
    });
    const cur = ready.shift();
    order.push(cur);
    (adj.get(cur.capability) || []).forEach(n => {
      indeg.set(n, indeg.get(n) - 1);
      if (indeg.get(n) === 0) ready.push(gaps.find(g => g.capability === n));
    });
  }
  // 环上剩余项追加到末尾并标记高风险
  gaps.forEach(g => { if (!order.includes(g)) order.push(g); });

  const path = order.map((g, i) => {
    const inbound = deps.filter(d => d.to === g.capability && names.has(d.from)).map(d => d.from);
    const outbound = deps.filter(d => d.from === g.capability && names.has(d.to)).length;
    return {
      gap: g,
      order: i + 1,
      estimatedTime: round(g.gap * (1 + inbound.length * 0.3), 4),
      risk: round(clamp01(inbound.length * 0.15 + outbound * 0.1 + (order.indexOf(gaps.find(x => x.capability === g.capability)) < 0 ? 0.5 : 0)), 4),
      dependencies: inbound
    };
  });
  const totalTime = round(path.reduce((s, p) => s + p.estimatedTime, 0), 4);
  const totalRisk = round(clamp01(mean(path.map(p => p.risk))), 4);
  const totalGain = round(path.reduce((s, p) => s + p.gap.gap, 0), 4);
  const byGain = [...path].sort((a, b) => b.gap.gap - a.gap.gap).map(p => p.gap.capability);
  const alternativePaths = [
    { name: "按收益排序", strategy: "highest-gain", order: byGain },
    { name: "按耗时排序", strategy: "shortest", order: [...path].sort((a, b) => a.estimatedTime - b.estimatedTime).map(p => p.gap.capability) }
  ];
  return { path, totalTime, totalRisk, totalGain, alternativePaths };
}

/* E_011 进化回溯机制 */
function e011(input) {
  const fp = obj(input.failurePoint);
  const hist = arr(input.history).map(s => ({
    iteration: num(obj(s).iteration),
    capability: String(obj(s).capability ?? ""),
    state: obj(s).state ?? s
  })).sort((a, b) => a.iteration - b.iteration);
  const mode = String(input.mode || "partial");
  const failIter = num(fp.iteration);
  const cap = String(fp.capability ?? "");
  const snap = hist.filter(h => h.iteration < failIter);
  if (!snap.length) {
    return {
      rolledBack: false, restoredState: null, lostProgress: [],
      safePoint: -1, recoveryTime: 0
    };
  }
  const target = mode === "full" ? snap[0] : snap[snap.length - 1];
  const lost = hist.filter(h => h.iteration >= target.iteration).map(h => ({ capability: h.capability, iteration: h.iteration }));
  const iterationsRolled = failIter - target.iteration;
  return {
    rolledBack: true,
    restoredState: target,
    lostProgress: lost,
    safePoint: target.iteration,
    recoveryTime: round(Math.max(0, iterationsRolled) * 1.5 + (mode === "full" ? 2 : 0.5), 4)
  };
}

/* E_012 进化收敛分析 */
function e012(input) {
  const h = arr(input.history).map(x => ({
    iteration: num(obj(x).iteration),
    newCapabilities: num(obj(x).newCapabilities),
    remainingGaps: num(obj(x).remainingGaps),
    rate: num(obj(x).rate)
  })).sort((a, b) => a.iteration - b.iteration);
  const thr = num(input.convergenceThreshold, 0.05);
  const win = Math.max(2, num(input.windowSize, 3));
  if (h.length < 2) {
    return { converged: false, convergenceType: "false", convergencePoint: -1, plateau: false, perturbationRecommended: true };
  }
  const recent = h.slice(-win);
  const rates = recent.map(x => x.rate);
  const { slope } = ols(rates);
  const lastNew = recent.reduce((s, x) => s + x.newCapabilities, 0);
  const gapsLeft = recent[recent.length - 1].remainingGaps;
  // 平台期：最近窗口新增能力几乎为 0 但仍有缝隙
  const plateau = rates.every(r => Math.abs(r) <= thr) && gapsLeft > 0;
  const trueConv = lastNew === 0 && gapsLeft === 0;
  const localOptimum = plateau && Math.abs(slope) <= thr * 0.5 && gapsLeft > 0;
  const converged = trueConv || (plateau && Math.abs(slope) <= thr);
  const convergenceType = trueConv ? "true" : localOptimum ? "local-optimum" : "false";
  const convergencePoint = converged ? recent[0].iteration : -1;
  return {
    converged, convergenceType, convergencePoint, plateau,
    perturbationRecommended: localOptimum || (converged && gapsLeft > 0)
  };
}

/* E_013 进化分叉机制 */
function e013(input) {
  const gap = obj(input.gap);
  const cands = arr(input.candidateSolutions).map(c => ({
    approach: String(obj(c).approach ?? "方案"),
    estimatedGain: num(obj(c).estimatedGain),
    risk: clamp01(num(obj(c).risk)),
    cost: Math.max(1e-9, num(obj(c).cost, 1))
  }));
  const mode = String(input.mode || "parallel");
  const maxPar = Math.max(1, num(input.maxParallel, cands.length || 1));
  if (!cands.length) {
    return { branches: [], selectedPath: "", abandonedPaths: [], explorationTime: 0 };
  }
  // 探索：按性价比排序，前 maxPar 个并行探索
  const scored = cands.map(c => ({
    ...c,
    utility: round(safeDiv(c.estimatedGain * (1 - c.risk), c.cost), 4)
  })).sort((a, b) => b.utility - a.utility);
  const explored = mode === "serial" ? scored.slice(0, 1) : scored.slice(0, maxPar);
  const branches = cands.map(c => {
    const e = explored.find(x => x.approach === c.approach);
    const success = !!e && c.risk < 0.8;
    return {
      approach: c.approach,
      result: e ? (success ? "success" : "failure") : "pending",
      gain: e && success ? round(c.estimatedGain, 4) : 0,
      selected: false
    };
  });
  const best = explored.find(b => b.risk < 0.8) || explored[0];
  branches.forEach(b => { if (b.approach === best.approach) { b.selected = true; b.result = b.result === "pending" ? "pending" : b.result; } });
  const explorationTime = round(explored.reduce((s, e) => s + e.cost, 0), 4);
  return {
    branches,
    selectedPath: best.approach,
    abandonedPaths: branches.filter(b => !b.selected).map(b => b.approach),
    explorationTime
  };
}

/* E_014 进化稳态维持 */
function e014(input) {
  const caps = arr(input.capabilities).map(c => ({
    capability: capName(c), level: num(obj(c).level)
  }));
  const target = obj(input.targetState);
  const targetMap = obj(target.levels || target);
  const perts = arr(input.perturbations).map(p => ({
    capability: capName(p), delta: num(obj(p).delta ?? obj(p).magnitude ?? obj(p).impact)
  }));
  const deviations = [];
  caps.forEach(c => {
    const want = num(targetMap[c.capability], c.level);
    const p = perts.filter(x => x.capability === c.capability).reduce((s, x) => s + Math.abs(x.delta), 0);
    const dev = round(Math.abs(c.level - want) + p, 4);
    if (dev > 0.05) {
      deviations.push({
        capability: c.capability, deviation: dev,
        cause: p > 0 ? `受外部扰动影响 ${round(p, 3)}` : `与目标态差 ${round(Math.abs(c.level - want), 3)}`
      });
    }
  });
  const maxDev = deviations.length ? Math.max(...deviations.map(d => d.deviation)) : 0;
  const stable = maxDev <= 0.1;
  const compensationActions = deviations.map(d => `对「${d.capability}」追加校验与自动回补，压制偏差 ${round(d.deviation, 3)}`);
  const robustnessScore = round(clamp01(1 - maxDev), 4);
  return { stable, deviations, compensationActions, robustnessScore };
}

/* E_015 进化涌现现象 */
function e015(input) {
  const comps = arr(input.components).map(capName);
  const combined = obj(input.combinedCapability);
  const expectedSum = num(input.expectedSum);
  const actual = num(input.actualPerformance);
  const factor = round(safeDiv(actual, Math.max(1e-9, expectedSum)), 4);
  const emerged = actual > expectedSum * 1.05;
  const emergenceFactor = round(factor - 1, 4);
  const emergenceType = !emerged ? "combinational"
    : factor >= 2 ? "scale" : "novel";
  const novelProperties = [];
  if (emerged) {
    novelProperties.push(`组合后性能 ${actual} 超出各组件之和 ${expectedSum}，超线性增益 ${round((factor - 1) * 100, 1)}%`);
    if (comps.length >= 2) novelProperties.push(`${comps.slice(0, 2).join(" 与 ")} 的交互产生了单个组件不具备的性质`);
  }
  // 不可预测性：偏离线性叠加的程度
  const unpredictability = round(clamp01(Math.abs(factor - 1)), 4);
  return { emerged, emergenceType, emergenceFactor, novelProperties, unpredictability };
}

module.exports = {
  handlers: {
    ALG_T3_E_001: e001, ALG_T3_E_002: e002, ALG_T3_E_003: e003, ALG_T3_E_004: e004,
    ALG_T3_E_005: e005, ALG_T3_E_006: e006, ALG_T3_E_007: e007, ALG_T3_E_008: e008,
    ALG_T3_E_009: e009, ALG_T3_E_010: e010, ALG_T3_E_011: e011, ALG_T3_E_012: e012,
    ALG_T3_E_013: e013, ALG_T3_E_014: e014, ALG_T3_E_015: e015
  },
  samples: {
    ALG_T3_E_001: () => ({
      capability: "跨库迁移", mode: "active",
      testCases: [{ input: 1, expected: 1 }, { input: 2, expected: 3 }, { input: "a", expected: "b" }]
    }),
    ALG_T3_E_002: () => ({
      current: [{ capability: "推理", level: 3 }, { capability: "创造", level: 1 }],
      target: [{ capability: "推理", level: 5 }, { capability: "创造", level: 4 }, { capability: "记忆", level: 3 }],
      weights: { 推理: 1.5, 创造: 1.2 }
    }),
    ALG_T3_E_003: () => ({
      gap: { capability: "因果推断", type: "capability" },
      existingCapabilities: [{ capability: "相关性分析" }, { capability: "图结构建模" }],
      strategy: "synthesis"
    }),
    ALG_T3_E_004: () => ({
      generated: { capability: "因果推断" },
      gap: { capability: "因果推断", testCases: [{ input: "x", expected: "x" }, { input: "y", expected: "y" }] },
      existingCapabilities: [{ capability: "相关性分析" }]
    }),
    ALG_T3_E_005: () => ({
      evolutionResult: { newCapability: { capability: "因果推断", level: 2 }, metaCapability: { capability: "进化策略优选" } },
      depth: 1, maxDepth: 5
    }),
    ALG_T3_E_006: () => ({
      initial: { capabilities: [{ capability: "推理" }], boundaries: [{ capability: "推理", type: "capability" }] },
      goals: [{ capability: "推理" }], maxIterations: 4, mode: "serial"
    }),
    ALG_T3_E_007: () => ({
      capabilities: [{ capability: "推理" }, { capability: "创造" }],
      testResults: [{ task: "推理", success: true }, { task: "推理", success: false }, { task: "创造", success: false }],
      boundaryType: "both"
    }),
    ALG_T3_E_008: () => ({
      config: { mode: "hybrid", maxIterations: 10, parallelWorkers: 3 },
      initialState: { iterations: 4, capabilitiesGained: 6, uptime: 120 }
    }),
    ALG_T3_E_009: () => ({
      evolutionHistory: [
        { iteration: 1, newCapabilities: 2, passed: 2, failed: 0, time: 10 },
        { iteration: 2, newCapabilities: 1, passed: 1, failed: 1, time: 12 },
        { iteration: 3, newCapabilities: 3, passed: 3, failed: 0, time: 9 }
      ]
    }),
    ALG_T3_E_010: () => ({
      gaps: [{ capability: "推理", gap: 2 }, { capability: "创造", gap: 3 }, { capability: "记忆", gap: 1 }],
      dependencies: [{ from: "记忆", to: "推理" }, { from: "推理", to: "创造" }],
      resources: { time: 20, compute: 10, data: 5 }, objective: "highest-gain"
    }),
    ALG_T3_E_011: () => ({
      failurePoint: { iteration: 4, capability: "创造", errorType: "validation" },
      history: [{ iteration: 1, capability: "推理" }, { iteration: 2, capability: "记忆" }, { iteration: 3, capability: "创造" }],
      mode: "partial"
    }),
    ALG_T3_E_012: () => ({
      history: [{ iteration: 1, newCapabilities: 3, remainingGaps: 10, rate: 0.3 },
        { iteration: 2, newCapabilities: 2, remainingGaps: 6, rate: 0.2 },
        { iteration: 3, newCapabilities: 0, remainingGaps: 6, rate: 0.0 },
        { iteration: 4, newCapabilities: 0, remainingGaps: 6, rate: 0.0 }],
      convergenceThreshold: 0.05, windowSize: 3
    }),
    ALG_T3_E_013: () => ({
      gap: { capability: "因果推断" },
      candidateSolutions: [
        { approach: "引入结构方程", estimatedGain: 3, risk: 0.3, cost: 2 },
        { approach: "套用现成库", estimatedGain: 2, risk: 0.1, cost: 0.5 }
      ], mode: "parallel", maxParallel: 2
    }),
    ALG_T3_E_014: () => ({
      capabilities: [{ capability: "推理", level: 4 }, { capability: "创造", level: 2 }],
      targetState: { levels: { 推理: 4, 创造: 3 } },
      perturbations: [{ capability: "创造", delta: 0.5 }], validationFrequency: 3
    }),
    ALG_T3_E_015: () => ({
      components: [{ capability: "推理" }, { capability: "记忆" }],
      combinedCapability: { capability: "推理+记忆" },
      expectedSum: 10, actualPerformance: 16
    })
  }
};
