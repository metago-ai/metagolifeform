"use strict";
/**
 * conflict.js — ALG_T3_X_001..014 真实实现（冲突识别 / 分析 / 调解 / 仲裁 / 升级降级 / 利益价值资源）
 */
const L = require("../t3lib.js");
const { mean, std, round, clamp01, safeDiv } = L;

const arr = v => (Array.isArray(v) ? v : []);
const obj = v => (v && typeof v === "object" ? v : {});
const num = (v, d = 0) => (isFinite(Number(v)) ? Number(v) : d);
const str = v => (typeof v === "string" ? v : JSON.stringify(v ?? ""));
const nm = (x, k = "id") => String(obj(x)[k] ?? obj(x).name ?? "?");

/* X_001 冲突识别方法 */
function x001(input) {
  const ents = arr(input.entities).map(e => ({
    id: nm(e), goals: arr(obj(e).goals).map(String),
    values: arr(obj(e).values).map(String), resources: arr(obj(e).resources).map(String)
  }));
  const conflicts = [];
  for (let i = 0; i < ents.length; i++) {
    for (let j = i + 1; j < ents.length; j++) {
      const a = ents[i], b = ents[j];
      const gOverlap = a.goals.filter(g => b.goals.some(h => h === g));
      const gDiff = a.goals.filter(g => !b.goals.some(h => h === g || h.includes(g) || g.includes(h)));
      const rOverlap = a.resources.filter(r => b.resources.includes(r));
      const vDiff = a.values.filter(v => !b.values.some(w => w.includes(v) || v.includes(w)));
      if (gDiff.length && b.goals.length) {
        conflicts.push({
          type: "goal", parties: [a.id, b.id],
          description: `目标不重合：${a.id} 的「${gDiff[0]}」在 ${b.id} 处无对应`,
          severity: gOverlap.length === 0 ? "high" : "medium"
        });
      }
      if (rOverlap.length) {
        conflicts.push({
          type: "resource", parties: [a.id, b.id],
          description: `争用同一资源：${rOverlap.join("、")}`,
          severity: rOverlap.length >= 2 ? "high" : "medium"
        });
      }
      if (vDiff.length && b.values.length) {
        conflicts.push({
          type: "value", parties: [a.id, b.id],
          description: `价值取向不一致：${vDiff[0]}`,
          severity: vDiff.length >= 2 ? "high" : "low"
        });
      }
    }
  }
  return {
    conflicts,
    conflictCount: conflicts.length,
    criticalConflicts: conflicts.filter(c => c.severity === "high").length
  };
}

/* X_002 冲突分析方法 */
function x002(input) {
  const c = obj(input.conflict);
  const ctx = obj(input.context);
  const hist = arr(ctx.history);
  const parties = arr(c.parties).map(String);
  const stake = arr(ctx.stakeholders).map(String);
  // 强度 = 类型权重 + 历史事件密度
  const typeW = { value: 0.9, goal: 0.7, resource: 0.6, interest: 0.5 }[String(c.type)] ?? 0.5;
  const intensity = round(clamp01(typeW * 0.6 + Math.min(1, hist.length / 10) * 0.4), 4);
  const trend = hist.length >= 2
    ? (/(升级|恶化|激化)/.test(str(hist[hist.length - 1])) ? "escalating"
      : /(缓和|解决|降温)/.test(str(hist[hist.length - 1])) ? "de-escalating" : "stable")
    : "stable";
  const stakeholders = parties.map((p, i) => ({
    party: p,
    position: i === 0 ? "先发方" : "应对方",
    interest: String(c.description ?? "").slice(0, 40),
    power: round(clamp01(1 - i / Math.max(2, parties.length + 1)), 4)
  }));
  return {
    analysis: {
      rootCause: String(c.description ?? "未描述"),
      intensity,
      scope: parties,
      history: hist.length ? `${hist.length} 条历史事件` : "无历史记录",
      trend,
      stakeholders
    },
    conflictMap: {
      nodes: parties.concat(stake),
      intensity,
      type: String(c.type ?? "unknown"),
      trend
    }
  };
}

/* X_003 冲突转化策略 */
function x003(input) {
  const c = obj(input.conflict);
  const positions = arr(c.positions).map(p => ({ party: nm(p, "party"), wants: String(obj(p).wants ?? "") }));
  const goal = input.transformationGoal != null ? String(input.transformationGoal) : "把对立转成共同问题";
  if (positions.length < 2) {
    return { transformed: false, newFraming: "参与方不足，无法转化", winWinSolution: [], innovationOpportunity: "", sustainability: 0 };
  }
  const newFraming = `把「${positions.map(p => p.wants).join(" vs ")}」重构为「${goal}」`;
  const winWinSolution = positions.map((p, i) => ({
    party: p.party,
    gains: i === 0 ? "保住核心诉求" : "获得原本没被考虑的补偿",
    concessions: i === 0 ? "让出非核心条款" : "接受分期或替代方案"
  }));
  const novelty = clamp01(1 - safeDiv(
    positions.reduce((s, p) => s + p.wants.length, 0),
    Math.max(1, positions.length) * 40));
  return {
    transformed: true,
    newFraming,
    winWinSolution,
    innovationOpportunity: `在「${goal}」下可设计原方案之外的第三种选择（新颖度 ${round(novelty, 3)}）`,
    sustainability: round(clamp01(0.5 + novelty * 0.4), 4)
  };
}

/* X_004 冲突调解方法 */
function x004(input) {
  const parties = arr(input.parties).map(p => ({
    id: nm(p), position: String(obj(p).position ?? ""),
    interests: arr(obj(p).interests).map(String), constraints: arr(obj(p).constraints).map(String)
  }));
  const style = String(obj(input.mediator).style || "facilitative");
  if (parties.length < 2) {
    return { agreement: [], satisfaction: {}, durability: 0, implementationPlan: "参与方不足，无法调解" };
  }
  const common = parties[0].interests.filter(i => parties.slice(1).some(p => p.interests.some(x => x === i)));
  const agreement = parties.map(p => ({
    terms: common.length ? `以共同利益「${common.join("、")}」为基座` : "无共同利益，按互惠条款逐条交换",
    party: p.id,
    obligations: p.constraints.length ? p.constraints.map(c => `遵守约束：${c}`) : ["按约定履约"],
    benefits: p.interests.slice(0, 2)
  }));
  const satisfaction = {};
  parties.forEach(p => {
    const cov = p.interests.length ? p.interests.filter(i => common.includes(i)).length / p.interests.length : 0.5;
    satisfaction[p.id] = round(clamp01(0.4 + cov * 0.5 + (style === "transformative" ? 0.1 : 0)), 4);
  });
  const durability = round(clamp01(mean(Object.values(satisfaction)) * (common.length ? 1 : 0.7)), 4);
  const plan = style === "evaluative"
    ? "调解人给出评估意见 → 双方 3 日内确认 → 签署执行"
    : style === "transformative"
      ? "先重建双方关系与信任 → 再谈具体条款 → 分阶段执行并复盘"
      : "梳理共同利益 → 逐条形成条款 → 双方确认 → 设定复核点";
  return { agreement, satisfaction, durability, implementationPlan: plan };
}

/* X_005 冲突仲裁机制 */
function x005(input) {
  const parties = arr(input.parties).map(p => ({
    id: nm(p), claim: String(obj(p).claim ?? ""), evidence: arr(obj(p).evidence).map(String)
  }));
  const arb = obj(input.arbiter);
  const rules = arr(input.rules).map(String);
  const impartiality = clamp01(num(arb.impartiality, 0.5));
  const qual = arr(arb.qualifications).map(String);
  if (parties.length < 2) {
    return {
      ruling: { decision: "不予受理", rationale: "参与方不足", obligations: [], binding: false },
      fairnessScore: 0, appealable: false
    };
  }
  // 证据加权裁决：证据多且可核验的一方胜出
  const score = parties.map(p => ({
    id: p.id,
    s: p.evidence.length + (p.evidence.filter(e => e.length > 8).length * 0.5)
  })).sort((a, b) => b.s - a.s);
  const winner = score[0].id;
  const total = score.reduce((s, x) => s + x.s, 0) || 1;
  const margin = round((score[0].s - (score[1]?.s ?? 0)) / total, 4);
  const fairnessScore = round(clamp01(impartiality * 0.6 + margin * 0.4 * (qual.length ? 1 : 0.6)), 4);
  return {
    ruling: {
      decision: `${winner} 的主张成立`,
      rationale: `依据 ${rules.length} 条规则与双方证据条目（${parties.map(p => `${p.id}:${p.evidence.length}条`).join("，")}），` +
        `证据优势差 ${round(margin * 100, 1)}%`,
      obligations: parties.filter(p => p.id !== winner).map(p => ({
        party: p.id, obligation: "履行裁决并停止争议行为", deadline: 7
      })),
      binding: impartiality >= 0.7 && qual.length > 0
    },
    fairnessScore,
    appealable: fairnessScore < 0.8
  };
}

/* X_006 冲突升级机制 */
const STAGES = ["分歧", "摩擦", "对抗", "僵持", "破裂"];
function x006(input) {
  const c = obj(input.conflict);
  const cur = String(c.currentStage || STAGES[0]);
  const hist = arr(c.history);
  const factors = arr(input.escalationFactors).map(String);
  const idx = Math.max(0, STAGES.indexOf(cur));
  const next = STAGES[Math.min(STAGES.length - 1, idx + 1)];
  const factorLoad = Math.min(1, factors.length / 4);
  const histLoad = Math.min(1, hist.length / 6);
  const escalationRisk = round(clamp01(factorLoad * 0.55 + histLoad * 0.3 + idx * 0.05), 4);
  const warningSignals = [];
  if (escalationRisk > 0.5) warningSignals.push("沟通从议题转向人身");
  if (idx >= 2) warningSignals.push("开始拉第三方站队");
  if (factors.some(f => /资源|利益/.test(f))) warningSignals.push("核心资源开始被单方占用");
  if (!warningSignals.length) warningSignals.push("暂无明显预警信号");
  return {
    escalationRisk,
    currentStage: cur,
    nextStage: next,
    warningSignals,
    interventionWindow: round(Math.max(0, 1 - escalationRisk) * 7, 2),
    deEscalationActions: [
      "把议题重新聚焦到具体事实而非动机",
      "引入中立第三方主持",
      escalationRisk > 0.7 ? "立刻暂停对抗性动作，设冷静期" : "设定沟通规则与时限"
    ]
  };
}

/* X_007 冲突降级策略 */
function x007(input) {
  const c = obj(input.conflict);
  const cur = String(c.currentStage || STAGES[0]);
  const inten = clamp01(num(c.intensity, 0.5));
  const strategy = String(input.strategy || "cooling");
  const idx = Math.max(0, STAGES.indexOf(cur));
  const effect = { cooling: 0.35, communication: 0.25, concession: 0.3, intervention: 0.45 }[strategy] ?? 0.2;
  const newIntensity = round(clamp01(inten * (1 - effect)), 4);
  const newIdx = Math.max(0, idx - (effect >= 0.35 ? 1 : 0));
  const actionsTaken = [{
    action: strategy === "cooling" ? "设冷静期并暂停对抗动作"
      : strategy === "communication" ? "组织一次结构化对话"
        : strategy === "concession" ? "在非核心条款上让步"
          : "引入权威第三方介入",
    effect: `强度下降 ${round(effect * 100, 0)}%`,
    time: 1
  }];
  return {
    deEscalated: newIntensity < inten,
    newStage: STAGES[newIdx],
    newIntensity,
    actionsTaken,
    stability: round(clamp01(1 - newIntensity * 0.8), 4)
  };
}

/* X_008 冲突预防机制 */
function x008(input) {
  const sys = obj(input.system);
  const ents = arr(sys.entities);
  const inter = arr(sys.interactions);
  const hist = arr(sys.history);
  const factors = arr(input.riskFactors).map(String);
  const potentialConflicts = [];
  // 高交互 + 低互惠 → 冲突概率高
  const pairs = new Map();
  inter.forEach(i => {
    const a = String(obj(i).a ?? obj(i).from ?? ""), b = String(obj(i).b ?? obj(i).to ?? "");
    if (!a || !b) return;
    const k = [a, b].sort().join("|");
    pairs.set(k, (pairs.get(k) || 0) + 1);
  });
  pairs.forEach((cnt, k) => {
    const [a, b] = k.split("|");
    const past = hist.filter(h => str(h).includes(a) && str(h).includes(b)).length;
    const prob = round(clamp01(Math.min(1, cnt / 5) * 0.5 + Math.min(1, past / 3) * 0.5), 4);
    if (prob >= 0.3) {
      potentialConflicts.push({
        type: past ? "历史复发" : "高频交互",
        parties: [a, b], probability: prob,
        preventionMeasures: [
          "明确双方职责边界与资源配额",
          past ? "复盘上次冲突的触发点并设预警" : "建立定期同步机制"
        ]
      });
    }
  });
  const preventionRisk = round(clamp01(
    (potentialConflicts.length ? mean(potentialConflicts.map(c => c.probability)) : 0) * 0.7 +
    Math.min(1, factors.length / 5) * 0.3), 4);
  return {
    preventionRisk,
    potentialConflicts,
    recommendedActions: potentialConflicts.length
      ? ["对高风险对建立书面协作约定", "设置资源使用的仲裁规则", "在关键节点前做一次对齐会"]
      : ["当前无显著冲突苗头，保持常规沟通"]
  };
}

/* X_009 冲突溯源方法 */
function x009(input) {
  const c = obj(input.conflict);
  const hist = arr(input.history).map(h => ({
    time: num(obj(h).time), event: String(obj(h).event ?? ""), actor: String(obj(h).actor ?? "")
  })).sort((a, b) => a.time - b.time);
  const parties = arr(c.parties).map(String);
  const immediate = String(c.immediateCause ?? "");
  const trigger = String(c.triggerEvent ?? "");
  const causalChain = [
    { level: 1, cause: trigger || "未记录触发事件", evidence: "触发层" },
    { level: 2, cause: immediate || "未记录直接原因", evidence: "直接层" },
    { level: 3, cause: hist.length ? `历史积怨：${hist.length} 次未解决的交互` : "无历史记录", evidence: "结构层" },
    { level: 4, cause: "制度/规则缺位（无明确边界与仲裁机制）", evidence: "根因层" }
  ];
  const actorCount = new Map();
  hist.forEach(h => { if (h.actor) actorCount.set(h.actor, (actorCount.get(h.actor) || 0) + 1); });
  const totalAct = [...actorCount.values()].reduce((a, b) => a + b, 0) || 1;
  const attribution = parties.map(p => ({
    party: p,
    responsibility: round(safeDiv(actorCount.get(p) || 0, totalAct), 4)
  }));
  return {
    rootCause: causalChain[causalChain.length - 1].cause,
    causalChain, attribution,
    preventionPoints: [
      "在触发层设监测：把触发事件纳入预警清单",
      "在直接层设流程：争议先走书面澄清再升级",
      "在结构层设机制：明确资源与职责边界"
    ]
  };
}

/* X_010 冲突记忆机制 */
function x010(input) {
  const c = obj(input.conflict);
  const lessons = arr(input.lessons).map(String);
  const outcome = String(c.outcome || "success");
  const memoryType = lessons.length ? "pattern" : outcome === "success" ? "success" : "failure";
  const retrievalKeys = [...new Set([
    String(c.type ?? ""), String(c.resolution ?? "").slice(0, 20), ...lessons
  ].filter(Boolean))].slice(0, 8);
  const transferableTo = [];
  if (String(c.type ?? "")) transferableTo.push(`${c.type} 类冲突的同类场景`);
  if (lessons.length) transferableTo.push(...lessons.map(l => `应用「${l}」的场景`));
  return {
    stored: retrievalKeys.length > 0,
    memoryType, retrievalKeys, transferableTo,
    similarPastConflicts: []
  };
}

/* X_011 冲突进化机制 */
function x011(input) {
  const hist = arr(input.history).map(h => ({
    outcome: String(obj(h).outcome ?? ""), lesson: String(obj(h).lesson ?? "")
  }));
  const cap = clamp01(num(input.currentCapability, 0.5));
  const succ = hist.filter(h => /success|成功|解决/.test(h.outcome)).length;
  const accuracy = round(safeDiv(succ, Math.max(1, hist.length)), 4);
  const lessons = new Set(hist.map(h => h.lesson).filter(Boolean)).size;
  const evolvedCapability = round(clamp01(cap + (accuracy - 0.5) * 0.3 + Math.min(0.2, lessons * 0.03)), 4);
  const stage = evolvedCapability >= 0.85 ? "transformative" : evolvedCapability >= 0.6 ? "proactive" : "reactive";
  const preventionRate = round(clamp01(lessons / 8 * (stage === "transformative" ? 1 : 0.6)), 4);
  const nextEvolutionFocus = stage === "reactive" ? "建立冲突台账，先做到可追溯"
    : stage === "proactive" ? "把重复触发点转成预防规则"
      : "把冲突转化为创新机会，而不是只求平息";
  return { evolvedCapability, evolutionStage: stage, accuracy, preventionRate, nextEvolutionFocus };
}

/* X_012 利益冲突管理 */
function x012(input) {
  const parties = arr(input.parties).map(p => ({
    id: nm(p),
    interests: arr(obj(p).interests).map(i => ({
      name: String(obj(i).name ?? "?"), importance: clamp01(num(obj(i).importance, 0.5)),
      flexibility: clamp01(num(obj(i).flexibility, 0.5))
    }))
  }));
  const zeroSum = arr(input.zeroSumResources).map(String);
  const management = [];
  let totalGain = 0;
  if (parties.length >= 2) {
    const a = parties[0], b = parties[1];
    // 高重要低弹性 = 必须保住；低重要高弹性 = 可让
    const aHard = a.interests.filter(i => i.importance >= 0.7 && i.flexibility <= 0.4);
    const aSoft = a.interests.filter(i => i.flexibility >= 0.6);
    const bHard = b.interests.filter(i => i.importance >= 0.7 && i.flexibility <= 0.4);
    const bSoft = b.interests.filter(i => i.flexibility >= 0.6);
    management.push({
      strategy: "prioritize", party: a.id,
      details: `先锁定「${aHard.map(i => i.name).join("、") || "无刚需"}」`,
      gain: aHard.map(i => i.name).join("、") || "无",
      sacrifice: aSoft.map(i => i.name).join("、") || "无"
    });
    management.push({
      strategy: "compensate", party: b.id,
      details: `让出「${bSoft.map(i => i.name).join("、") || "无"}」，换取对「${bHard.map(i => i.name).join("、") || "无"}」的支持`,
      gain: bHard.map(i => i.name).join("、") || "无",
      sacrifice: bSoft.map(i => i.name).join("、") || "无"
    });
    totalGain = round(clamp01((aHard.length + bHard.length) / Math.max(1, a.interests.length + b.interests.length)), 4);
  }
  return {
    management,
    zeroSumResolved: zeroSum.length === 0 || management.some(m => m.strategy === "compensate"),
    totalGain,
    fairness: round(clamp01(management.length ? 0.5 + totalGain * 0.4 : 0), 4)
  };
}

/* X_013 价值冲突处理 */
function x013(input) {
  const parties = arr(input.parties).map(p => ({
    id: nm(p),
    values: arr(obj(p).values).map(v => ({
      name: String(obj(v).name ?? "?"), importance: clamp01(num(obj(v).importance, 0.5)),
      negotiable: !!obj(v).negotiable
    }))
  }));
  const ground = arr(input.commonGround).map(String);
  const all = parties.flatMap(p => p.values);
  const names = new Set(all.map(v => v.name));
  const shared = [...names].filter(n => parties.every(p => p.values.some(v => v.name === n)));
  const commonValues = [...new Set([...shared, ...ground])];
  const irreconcilable = [...names].filter(n => {
    const holders = all.filter(v => v.name === n);
    return holders.length >= 2 && holders.every(v => !v.negotiable) &&
      parties.every(p => p.values.some(v => v.name === n));
  });
  const method = irreconcilable.length === 0 && commonValues.length >= 2 ? "common-ground"
    : irreconcilable.length === 0 ? "respect"
      : commonValues.length >= 1 ? "tiered" : "elevate";
  const details = method === "common-ground" ? `以共同价值「${commonValues.join("、")}」为基座`
    : method === "respect" ? "无不可调和项，但共同点少，按相互尊重处理"
      : method === "tiered" ? `在共同价值上合作，对不可调和的「${irreconcilable.join("、")}」分层搁置`
        : "无共同价值且存在硬项，需上升到更高层目标（如生存/使命）再谈";
  return {
    resolution: { method, details, commonValues, irreconcilable },
    relationshipImpact: round(clamp01(method === "common-ground" ? 0.2 : method === "respect" ? 0.35 : 0.6), 4),
    sustainability: round(clamp01(method === "common-ground" ? 0.85 : method === "tiered" ? 0.6 : 0.4), 4)
  };
}

/* X_014 资源冲突解决 */
function x014(input) {
  const r = obj(input.resource);
  const total = Math.max(0, num(r.total));
  const scarcity = clamp01(num(r.scarcity, total > 0 ? 1 : 0));
  const parties = arr(input.parties).map(p => ({
    id: nm(p), demand: Math.max(0, num(obj(p).demand)),
    urgency: clamp01(num(obj(p).urgency, 0.5)),
    alternative: obj(p).alternative != null ? String(obj(p).alternative) : null
  }));
  const totalDemand = parties.reduce((s, p) => s + p.demand, 0) || 1;
  const enough = total >= totalDemand;
  let method, allocation;
  if (enough) {
    method = "allocate";
    allocation = parties.map(p => ({ party: p.id, amount: p.demand, satisfaction: 1 }));
  } else if (parties.some(p => p.alternative)) {
    method = "substitute";
    // 有替代方案的先走替代
    const w = parties.map(p => (p.alternative ? p.urgency * 0.4 : p.urgency));
    const tw = w.reduce((a, b) => a + b, 0) || 1;
    allocation = parties.map((p, i) => {
      const amount = round(total * w[i] / tw, 4);
      return { party: p.id, amount, satisfaction: round(clamp01(amount / Math.max(1e-9, p.demand)), 4) };
    });
  } else if (scarcity > 0.7) {
    method = "conserve";
    allocation = parties.map(p => {
      const amount = round(total * p.urgency / (parties.reduce((s, q) => s + q.urgency, 0) || 1), 4);
      return { party: p.id, amount, satisfaction: round(clamp01(amount / Math.max(1e-9, p.demand)), 4) };
    });
  } else {
    method = "share";
    allocation = parties.map(p => {
      const amount = round(total * p.demand / totalDemand, 4);
      return { party: p.id, amount, satisfaction: round(clamp01(amount / Math.max(1e-9, p.demand)), 4) };
    });
  }
  const sats = allocation.map(a => a.satisfaction);
  const fairness = round(clamp01(1 - std(sats) / Math.max(1e-9, mean(sats))), 4);
  const efficiency = round(clamp01(totalDemand > 0 ? Math.min(1, total / totalDemand) : 1), 4);
  // Pareto：没人能变好而不让别人变差的简易判据 = 所有人都已满足或资源已用尽
  const paretoOptimal = enough || Math.abs(allocation.reduce((s, a) => s + a.amount, 0) - total) < 1e-6;
  return {
    solution: { method, details: enough ? `资源充足，按需分配 ${total}` : `资源缺口 ${round(totalDemand - total, 3)}，采用 ${method} 策略` },
    allocation, paretoOptimal, efficiency, fairness
  };
}

module.exports = {
  handlers: {
    ALG_T3_X_001: x001, ALG_T3_X_002: x002, ALG_T3_X_003: x003, ALG_T3_X_004: x004,
    ALG_T3_X_005: x005, ALG_T3_X_006: x006, ALG_T3_X_007: x007, ALG_T3_X_008: x008,
    ALG_T3_X_009: x009, ALG_T3_X_010: x010, ALG_T3_X_011: x011, ALG_T3_X_012: x012,
    ALG_T3_X_013: x013, ALG_T3_X_014: x014
  },
  samples: {
    ALG_T3_X_001: () => ({
      entities: [
        { id: "研发", goals: ["快速交付", "技术领先"], values: ["质量"], resources: ["GPU"] },
        { id: "财务", goals: ["控制成本"], values: ["合规"], resources: ["GPU", "预算"] }
      ]
    }),
    ALG_T3_X_002: () => ({
      conflict: { type: "resource", parties: ["研发", "财务"], description: "GPU 预算争用" },
      context: { history: [{ event: "第一次争用" }, { event: "再次升级" }], stakeholders: ["CEO"] }
    }),
    ALG_T3_X_003: () => ({
      conflict: { type: "resource", parties: ["研发", "财务"], positions: [{ party: "研发", wants: "更多 GPU" }, { party: "财务", wants: "压缩预算" }] },
      transformationGoal: "用更少的算力达成同样的交付"
    }),
    ALG_T3_X_004: () => ({
      parties: [
        { id: "研发", position: "要算力", interests: ["交付速度", "技术领先"], constraints: ["预算上限"] },
        { id: "财务", position: "控成本", interests: ["交付速度", "现金流安全"] }
      ],
      mediator: { style: "facilitative" }
    }),
    ALG_T3_X_005: () => ({
      parties: [{ id: "研发", claim: "需要 GPU", evidence: ["历史交付延期记录", "模型训练耗时数据"] },
        { id: "财务", claim: "预算已满", evidence: ["预算表"] }],
      arbiter: { qualifications: ["财务", "技术"], impartiality: 0.8 },
      rules: ["按 ROI 排序", "先保交付"]
    }),
    ALG_T3_X_006: () => ({
      conflict: { currentStage: "对抗", history: [{ stage: "分歧", time: 1, trigger: "预算削减" }, { stage: "摩擦", time: 2, trigger: "抢资源" }] },
      escalationFactors: ["资源紧张", "无中立第三方"]
    }),
    ALG_T3_X_007: () => ({
      conflict: { currentStage: "对抗", intensity: 0.7, parties: ["研发", "财务"] }, strategy: "intervention"
    }),
    ALG_T3_X_008: () => ({
      system: {
        entities: [{ id: "研发" }, { id: "财务" }],
        interactions: [{ a: "研发", b: "财务" }, { a: "研发", b: "财务" }, { a: "研发", b: "财务" }],
        history: [{ conflict: "研发与财务 预算争用" }]
      }, riskFactors: ["资源紧张"]
    }),
    ALG_T3_X_009: () => ({
      conflict: { triggerEvent: "预算削减 20%", immediateCause: "GPU 采购被拒", parties: ["研发", "财务"] },
      history: [{ time: 1, event: "预算下达", actor: "财务" }, { time: 2, event: "提交采购", actor: "研发" },
        { time: 3, event: "驳回", actor: "财务" }]
    }),
    ALG_T3_X_010: () => ({
      conflict: { type: "resource", resolution: "按 ROI 分配", outcome: "success" },
      lessons: ["先算 ROI 再谈资源"]
    }),
    ALG_T3_X_011: () => ({
      history: [{ conflict: "预算争用", method: "调解", outcome: "success", feedback: "有效", lesson: "先算 ROI" },
        { conflict: "排期冲突", method: "仲裁", outcome: "failure", feedback: "不服", lesson: "仲裁前先给替代方案" }],
      currentCapability: 0.5
    }),
    ALG_T3_X_012: () => ({
      parties: [
        { id: "研发", interests: [{ name: "算力", importance: 0.9, flexibility: 0.2 }, { name: "排期自由", importance: 0.4, flexibility: 0.8 }] },
        { id: "财务", interests: [{ name: "成本可控", importance: 0.9, flexibility: 0.3 }, { name: "报表及时", importance: 0.3, flexibility: 0.9 }] }
      ], zeroSumResources: ["GPU"]
    }),
    ALG_T3_X_013: () => ({
      parties: [
        { id: "研发", values: [{ name: "技术领先", importance: 0.8, negotiable: false }, { name: "质量", importance: 0.7, negotiable: false }] },
        { id: "财务", values: [{ name: "合规", importance: 0.9, negotiable: false }, { name: "质量", importance: 0.6, negotiable: false }] }
      ], commonGround: ["交付确定性"]
    }),
    ALG_T3_X_014: () => ({
      resource: { type: "GPU 卡时", total: 100, scarcity: 0.8 },
      parties: [
        { id: "训练", demand: 80, urgency: 0.9, alternative: "租用云卡" },
        { id: "推理", demand: 50, urgency: 0.7 }
      ]
    })
  }
};
