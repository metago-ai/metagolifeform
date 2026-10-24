"use strict";
/**
 * intuition.js — ALG_T3_I_001..014 真实实现（直觉感知 / 判断 / 验证 / 模式识别 / 危险与机会直觉）
 */
const L = require("../t3lib.js");
const { mean, std, round, clamp01, safeDiv, cosine, euclid } = L;

const arr = v => (Array.isArray(v) ? v : []);
const obj = v => (v && typeof v === "object" ? v : {});
const num = (v, d = 0) => (isFinite(Number(v)) ? Number(v) : d);
const str = v => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

/* 轻量文本向量 */
function vec(t, dim = 48) {
  const v = new Array(dim).fill(0);
  const s = String(t);
  for (let i = 0; i < s.length - 1; i++) {
    let h = 2166136261;
    for (let k = 0; k < 2; k++) { h ^= s.charCodeAt(i + k); h = Math.imul(h, 16777619); }
    v[(h >>> 0) % dim] += 1;
  }
  const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
  return v.map(x => x / n);
}
const sim = (a, b) => clamp01((cosine(vec(a), vec(b)) + 1) / 2);

/* I_001 直觉感知机制 */
function i001(input) {
  const stimuli = arr(input.stimuli).map(s => ({
    type: String(obj(s).type ?? "?"), intensity: clamp01(num(obj(s).intensity)), context: String(obj(s).context ?? "")
  }));
  const exp = clamp01(num(input.experience, 0.5));
  const sens = clamp01(num(input.sensitivity, 0.5));
  if (!stimuli.length) {
    return { perception: { feeling: "无刺激", strength: 0, direction: "neutral" }, processingTime: 0, confidence: 0, explainability: 1 };
  }
  const total = stimuli.reduce((s, x) => s + x.intensity, 0);
  const avg = total / stimuli.length;
  const dominant = stimuli.slice().sort((a, b) => b.intensity - a.intensity)[0];
  const danger = /威胁|危险|风险|异常|失败/.test(stimuli.map(s => s.type + s.context).join(""));
  const strength = round(clamp01(avg * (0.5 + sens * 0.5) * (0.6 + exp * 0.4)), 4);
  return {
    perception: {
      feeling: `${danger ? "警觉" : "顺畅"}·${dominant.type}`,
      strength,
      direction: danger ? "avoid" : "approach"
    },
    processingTime: round(Math.max(1, stimuli.length * (1 - exp) * 10), 2),
    confidence: round(clamp01(strength * (0.7 + exp * 0.3)), 4),
    explainability: round(clamp01(1 - exp * 0.5), 4)
  };
}

/* I_002 直觉判断方法 */
function i002(input) {
  const p = obj(input.perception);
  const c = obj(input.context);
  const strength = clamp01(num(p.strength));
  const pressure = clamp01(num(c.timePressure));
  const completeness = clamp01(num(c.infoCompleteness));
  const familiarity = clamp01(num(c.familiarity));
  const basis = familiarity >= 0.7 ? "experience" : familiarity >= 0.4 ? "pattern" : "analogy";
  const confidence = round(clamp01(
    strength * 0.4 + familiarity * 0.35 + completeness * 0.25 - pressure * 0.15), 4);
  const needsVerification = confidence < 0.6 || completeness < 0.5 || pressure > 0.7;
  return {
    judgment: String(p.feeling ?? "无判断"),
    confidence,
    basis,
    needsVerification,
    riskLevel: round(clamp01(pressure * 0.5 + (1 - completeness) * 0.3 + (1 - confidence) * 0.2), 4)
  };
}

/* I_003 直觉决策框架 */
function i003(input) {
  const options = arr(input.options).map((o, i) => String(obj(o).name ?? obj(o).option ?? `选项${i + 1}`));
  const it = obj(input.intuition);
  const preferred = String(it.preferred ?? options[0] ?? "");
  const strength = clamp01(num(it.strength, 0.5));
  const analysis = arr(input.analysis).map(a => ({ option: String(obj(a).option ?? ""), score: num(obj(a).score) }));
  const mode = String(input.mode || "hybrid");
  const best = analysis.length ? analysis.slice().sort((a, b) => b.score - a.score)[0].option : null;
  const agreement = best == null ? true : best === preferred;
  let decision;
  if (mode === "pure-intuition" || !analysis.length) decision = preferred;
  else if (mode === "intuition-first") decision = agreement ? preferred : preferred;   // 直觉优先，但仍记录分歧
  else decision = strength >= 0.7 ? preferred : (best || preferred);                   // 混合：弱直觉听分析
  const risks = [];
  if (!agreement) risks.push(`直觉倾向「${preferred}」，分析倾向「${best}」，两者冲突`);
  if (strength < 0.4) risks.push("直觉强度偏低，不宜作为主要依据");
  if (!risks.length) risks.push("直觉与分析一致，风险较低");
  return {
    decision,
    confidence: round(clamp01(agreement ? (strength * 0.5 + 0.5) : strength * 0.6), 4),
    method: mode,
    intuitionAnalysisAgreement: agreement,
    calibrationNeeded: !agreement && Math.abs(strength - 0.5) < 0.3,
    risks
  };
}

/* I_004 直觉学习方法 */
function i004(input) {
  const l = obj(input.learner);
  const level = String(l.level || "novice");
  const hours = Math.max(0, num(l.practiceHours));
  const domain = String(input.domain ?? "");
  const feedback = !!input.feedbackAvailable;
  // 三阶段技能获得模型：认知 → 联结 → 自主
  const stage = hours >= 2000 ? "autonomous" : hours >= 300 ? "associative" : "cognitive";
  const base = { novice: 0.1, intermediate: 0.4, expert: 0.75 }[level] ?? 0.1;
  const intuitionStrength = round(clamp01(base + Math.min(0.6, hours / 5000) + (feedback ? 0.1 : 0)), 4);
  const hoursToExpertise = Math.max(0, 10000 - hours);
  const recommendedPractice = [
    { type: "刻意练习（高难度子技能）", duration: 45, frequency: 4 },
    { type: feedback ? "带反馈的复盘" : "自评与对照", duration: 30, frequency: 3 },
    { type: "跨场景迁移", duration: 60, frequency: 1 }
  ];
  void domain;
  return { stage, intuitionStrength, hoursToExpertise, recommendedPractice };
}

/* I_005 直觉验证方法 */
function i005(input) {
  const it = obj(input.intuition);
  const an = obj(input.analysis);
  const j = String(it.judgment ?? "");
  const c = String(an.conclusion ?? "");
  const s = sim(j, c);
  const agreement = s >= 0.8 ? "full" : s >= 0.45 ? "partial" : "none";
  const deviation = round(1 - s, 4);
  const ic = clamp01(num(it.confidence, 0.5));
  const ac = clamp01(num(an.confidence, 0.5));
  const intuitionCorrect = s >= 0.6;
  const calibrationAdjustment = round(clamp01(ac - ic), 4);
  const lesson = agreement === "full"
    ? "直觉与分析一致，可提高对该类判断的直觉权重"
    : agreement === "partial"
      ? "部分一致，直觉方向对但尺度需校准"
      : `完全不一致：直觉「${j.slice(0, 16)}」vs 分析「${c.slice(0, 16)}」，需回查直觉依据的经验样本是否失效`;
  return { agreement, intuitionCorrect, deviation, calibrationAdjustment, lesson };
}

/* I_006 直觉溯源机制 */
function i006(input) {
  const it = obj(input.intuition);
  const lib = arr(input.experienceLibrary).map(e => ({
    scenario: String(obj(e).scenario ?? ""), outcome: String(obj(e).outcome ?? ""), strength: clamp01(num(obj(e).strength, 0.5))
  }));
  const j = String(it.judgment ?? "");
  const ctx = String(it.context ?? "");
  if (!lib.length) {
    return { sources: [], primarySource: "经验库为空", trustScore: 0, conflictingExperiences: [] };
  }
  const sources = lib.map(e => {
    const s = sim(j + ctx, e.scenario);
    return {
      experience: e.scenario,
      similarity: round(s, 4),
      contribution: round(clamp01(s * e.strength), 4)
    };
  }).sort((a, b) => b.contribution - a.contribution);
  const total = sources.reduce((x, s) => x + s.contribution, 0) || 1;
  sources.forEach(s => { s.contribution = round(s.contribution / total, 4); });
  const top = sources[0];
  const conflicting = lib.filter((e, i) => sources[i].similarity > 0.5 && /失败|failure/i.test(e.outcome)).map(e => e.scenario);
  return {
    sources,
    primarySource: top.experience,
    trustScore: round(clamp01(top.similarity * (1 - Math.min(0.5, conflicting.length * 0.15))), 4),
    conflictingExperiences: conflicting
  };
}

/* I_007 直觉进化机制 */
function i007(input) {
  const hist = arr(input.history).map(h => ({
    correct: !!obj(h).correct, feedback: String(obj(h).feedback ?? "")
  }));
  const cur = clamp01(num(input.currentCapability, 0.5));
  const acc = round(safeDiv(hist.filter(h => h.correct).length, Math.max(1, hist.length)), 4);
  const evolvedCapability = round(clamp01(cur + (acc - 0.5) * 0.3 * Math.min(1, hist.length / 10)), 4);
  const stage = evolvedCapability >= 0.9 ? "master" : evolvedCapability >= 0.7 ? "expert" : evolvedCapability >= 0.45 ? "competent" : "novice";
  const coverage = round(clamp01(hist.length / 30), 4);
  const nextEvolutionFocus = acc < 0.5
    ? "准确率低于一半，先复核经验库是否混入了错误样本"
    : coverage < 0.5
      ? "准确率尚可但样本量不足，扩大覆盖场景"
      : "转入高难场景校准，防过度自信";
  return { evolvedCapability, evolutionStage: stage, accuracy: acc, coverage, nextEvolutionFocus };
}

/* I_008 模式识别方法 */
function i008(input) {
  const lib = arr(input.patternLibrary).map(p => ({
    name: String(obj(p).name ?? "?"), features: obj(p).features, template: obj(p).template
  }));
  const thr = num(input.threshold, 0.5);
  const inp = str(input.input);
  const recognized = [];
  lib.forEach(p => {
    const feats = arr(p.features).length ? arr(p.features).map(String)
      : Object.keys(obj(p.features)).map(k => `${k}=${str(obj(p.features)[k])}`);
    const matchedFeatures = feats.filter(f => inp.includes(f));
    const conf = feats.length ? matchedFeatures.length / feats.length : 0;
    if (conf >= thr) recognized.push({ pattern: p.name, confidence: round(conf, 4), matchedFeatures });
  });
  recognized.sort((a, b) => b.confidence - a.confidence);
  const best = recognized[0]?.pattern ?? "未识别";
  return {
    recognized,
    bestMatch: best,
    novelty: round(clamp01(1 - (recognized[0]?.confidence ?? 0)), 4),
    processingTime: round(Math.max(0.1, lib.length * 0.5), 4)
  };
}

/* I_009 启发式方法 */
function i009(input) {
  const hs = arr(input.availableHeuristics).map(h => ({
    name: String(obj(h).name ?? "?"), rule: String(obj(h).rule ?? ""), bias: String(obj(h).bias ?? "")
  }));
  const tc = num(input.timeConstraint, 0);
  const prob = String(input.problem ?? "");
  if (!hs.length) {
    return { applied: "无可用启发式", decision: "退回完整分析", speed: 1, potentialBias: "none", correctionNeeded: true, confidence: 0.2 };
  }
  // 选与问题最相关的启发式；无相关内容则选第一条
  const scored = hs.map(h => ({ ...h, s: sim(prob, h.name + h.rule) })).sort((a, b) => b.s - a.s);
  const chosen = scored[0];
  // 时间越紧，采用启发式越快，但偏差风险越高
  const speed = round(clamp01(tc > 0 ? 1 / (1 + Math.max(0, tc) / 10) : 0.9), 4);
  const correctionNeeded = chosen.bias !== "" && chosen.bias !== "none" || speed < 0.4;
  return {
    applied: chosen.name,
    decision: `按「${chosen.rule}」快速给出结论`,
    speed,
    potentialBias: chosen.bias || "未声明",
    correctionNeeded,
    confidence: round(clamp01(0.5 + chosen.s * 0.4 - (correctionNeeded ? 0.15 : 0)), 4)
  };
}

/* I_010 经验直觉 */
function i010(input) {
  const sc = obj(input.scenario);
  const feats = arr(sc.features).map(String);
  const exps = arr(input.experiences).map(e => ({
    scenario: String(obj(e).scenario ?? ""), outcome: String(obj(e).outcome ?? ""),
    lessons: arr(obj(e).lessons).map(String)
  }));
  const key = String(sc.description ?? "") + " " + feats.join(" ");
  const matchedExperiences = exps.map(e => {
    const s = sim(key, e.scenario + " " + e.lessons.join(" "));
    const fHit = feats.filter(f => e.scenario.includes(f) || e.lessons.some(l => l.includes(f))).length;
    const relevance = clamp01(feats.length ? fHit / feats.length : s);
    return { scenario: e.scenario, similarity: round(s, 4), relevance: round(relevance, 4) };
  }).sort((a, b) => b.relevance - a.relevance);
  const top = matchedExperiences[0];
  const pos = exps.filter(e => /success|成功/.test(e.outcome)).length;
  return {
    intuition: top ? `参考「${top.scenario}」的做法（相关度 ${top.relevance}）` : "无相似经验，只能按通则处理",
    matchedExperiences,
    confidence: round(clamp01(top ? top.relevance * 0.7 + (pos / Math.max(1, exps.length)) * 0.3 : 0), 4),
    transferability: round(clamp01(top ? top.similarity : 0), 4)
  };
}

/* I_011 专家直觉 */
function i011(input) {
  const e = obj(input.expert);
  const p = obj(input.problem);
  const hours = Math.max(0, num(e.experienceHours));
  const cal = clamp01(num(e.calibrationScore, 0.5));
  const cplx = clamp01(num(p.complexity));
  const sameDomain = String(e.domain ?? "") === String(p.domain ?? "");
  const accuracy = round(clamp01(0.4 + Math.min(0.4, hours / 25000) + cal * 0.2 - cplx * 0.15 * (sameDomain ? 0.5 : 1.5)), 4);
  const processingTime = round(Math.max(0.2, (1 - Math.min(1, hours / 10000)) * 5 * (1 + cplx)), 4);
  const recognizedPatterns = sameDomain ? [`${p.domain} 常规模式`] : [];
  const anomaliesDetected = cplx >= 0.7 ? ["问题复杂度超出常规模式，直觉可靠性下降"] : [];
  return {
    expertIntuition: sameDomain
      ? `在熟悉的「${p.domain}」域内，凭 ${hours} 小时经验直接定位`
      : `跨域判断，直觉参考价值降低（专家域为 ${e.domain}）`,
    accuracy, processingTime, recognizedPatterns, anomaliesDetected,
    confidence: round(clamp01(accuracy * (sameDomain ? 1 : 0.6)), 4)
  };
}

/* I_012 创造直觉 */
function i012(input) {
  const c = obj(input.creator);
  const existing = arr(input.existingCreations).map(x => str(obj(x).name ?? x));
  const domain = String(input.domain ?? "");
  const creat = clamp01(num(c.creativity, 0.5));
  const know = clamp01(num(c.domainKnowledge, 0.5));
  const direction = know >= 0.7 ? `${domain} 的边界外延` : know >= 0.4 ? `${domain} 与相邻域的交叉` : "以类比为主的跨域借用";
  const opportunity = `把「${existing.slice(0, 2).join("、") || domain}」未覆盖的场景补上`;
  const value = round(clamp01(creat * 0.5 + know * 0.3 + 0.2), 4);
  const novelty = round(clamp01(creat * 0.8 + 0.1), 4);
  const feasibility = round(clamp01(know * 0.9 + 0.05), 4);
  const risks = [];
  if (know < 0.4) risks.push("领域知识不足，创造方向可能落在不可行区");
  if (creat > 0.8 && know < 0.5) risks.push("创造力高而知识薄，容易产出无法落地的点子");
  if (!risks.length) risks.push("知识与创造力匹配，但仍需外部验证");
  return {
    creativeIntuition: { direction, opportunity, value },
    novelty, feasibility, risks,
    needsValidation: novelty > 0.6 || feasibility < 0.6
  };
}

/* I_013 危险直觉 */
function i013(input) {
  const st = arr(input.stimuli).map(s => ({
    type: String(obj(s).type ?? ""), intensity: clamp01(num(obj(s).intensity)), context: String(obj(s).context ?? "")
  }));
  const sens = clamp01(num(input.sensitivity, 0.5));
  const past = arr(input.pastThreats).map(String);
  const text = st.map(s => s.type + s.context).join(" ");
  const threatWords = (text.match(/威胁|危险|异常|报错|超时|泄露|越权|失败|崩溃/g) || []);
  const pastHit = past.filter(p => text.includes(p)).length;
  const base = threatWords.length ? Math.min(1, threatWords.length * 0.25) : 0;
  const intensity = round(clamp01(base * (0.6 + sens * 0.4) + pastHit * 0.2), 4);
  const dangerDetected = intensity >= 0.4;
  const dangerType = /泄露|越权/.test(text) ? "安全"
    : /报错|失败|崩溃/.test(text) ? "可用性"
      : /超时|延迟/.test(text) ? "性能" : "未知";
  const falseAlarmRisk = round(clamp01(sens * 0.6 + (threatWords.length === 0 ? 0.3 : 0)), 4);
  return {
    dangerDetected, dangerType, intensity,
    recommendedAction: dangerDetected
      ? (falseAlarmRisk > 0.6 ? "先低成本核实再行动，避免误报扩散" : "立即制止并上报")
      : "常规监测",
    confidence: round(clamp01(intensity * (1 - falseAlarmRisk * 0.5)), 4),
    falseAlarmRisk
  };
}

/* I_014 机会直觉 */
function i014(input) {
  const env = obj(input.environment);
  const p = obj(input.perceiver);
  const trends = arr(env.trends).map(String);
  const gaps = arr(env.gaps).map(String);
  const res = arr(env.resources).map(String);
  const or = clamp01(num(p.opportunityRecognition, 0.5));
  const rt = clamp01(num(p.riskTolerance, 0.5));
  // 机会 = 趋势 × 缺口 × 可用的自有资源
  const raw = (Math.min(1, trends.length / 3) * 0.35 + Math.min(1, gaps.length / 3) * 0.4 + Math.min(1, res.length / 3) * 0.25) * (0.5 + or * 0.5);
  const potentialValue = round(clamp01(raw), 4);
  const feasibility = round(clamp01(Math.min(1, res.length / 3) * (0.5 + rt * 0.5)), 4);
  const windowUrgency = round(clamp01(Math.min(1, trends.length / 4) * 0.7 + (gaps.length ? 0.2 : 0)), 4);
  const detected = potentialValue >= 0.45;
  const opportunityType = gaps.length >= 2 ? "空白填补" : trends.length >= 2 ? "趋势跟随" : "资源变现";
  return {
    opportunityDetected: detected,
    opportunityType,
    potentialValue, feasibility, windowUrgency,
    recommendedAction: detected
      ? (windowUrgency > 0.6 ? "窗口紧张，立即立项做最小验证" : "先做 2 周可行性验证再投入")
      : "机会信号不足，继续观察"
  };
}

module.exports = {
  handlers: {
    ALG_T3_I_001: i001, ALG_T3_I_002: i002, ALG_T3_I_003: i003, ALG_T3_I_004: i004,
    ALG_T3_I_005: i005, ALG_T3_I_006: i006, ALG_T3_I_007: i007, ALG_T3_I_008: i008,
    ALG_T3_I_009: i009, ALG_T3_I_010: i010, ALG_T3_I_011: i011, ALG_T3_I_012: i012,
    ALG_T3_I_013: i013, ALG_T3_I_014: i014
  },
  samples: {
    ALG_T3_I_001: () => ({
      stimuli: [{ type: "异常", intensity: 0.8, context: "响应变慢" }, { type: "正常", intensity: 0.3, context: "登录正常" }],
      experience: 0.7, sensitivity: 0.6
    }),
    ALG_T3_I_002: () => ({
      perception: { feeling: "这单不能接", strength: 0.75 },
      context: { timePressure: 0.8, infoCompleteness: 0.4, familiarity: 0.7 }
    }),
    ALG_T3_I_003: () => ({
      options: [{ name: "自研" }, { name: "采购" }],
      intuition: { preferred: "采购", strength: 0.8 },
      analysis: [{ option: "自研", score: 0.6 }, { option: "采购", score: 0.75 }],
      mode: "hybrid"
    }),
    ALG_T3_I_004: () => ({ learner: { level: "intermediate", practiceHours: 800 }, domain: "工业质检", feedbackAvailable: true }),
    ALG_T3_I_005: () => ({
      intuition: { judgment: "这个方案不可行", confidence: 0.8 },
      analysis: { conclusion: "这个方案存在致命风险", evidence: ["压测失败"], confidence: 0.9 }
    }),
    ALG_T3_I_006: () => ({
      intuition: { judgment: "供应商会延期", time: 1, context: "交付风险" },
      experienceLibrary: [{ scenario: "供应商历史延期记录", outcome: "failure", strength: 0.8 },
        { scenario: "供应商正常交付", outcome: "success", strength: 0.5 }]
    }),
    ALG_T3_I_007: () => ({
      history: [{ intuition: "会延期", correct: true, feedback: "确实延期", improvement: "加缓冲" },
        { intuition: "成本可控", correct: false, feedback: "超支", improvement: "预留风险金" }],
      currentCapability: 0.5
    }),
    ALG_T3_I_008: () => ({
      input: "响应变慢 连接超时 错误率上升",
      patternLibrary: [{ name: "连接池耗尽", features: ["响应变慢", "连接超时"] },
        { name: "上游抖动", features: ["错误率上升"] }],
      threshold: 0.4
    }),
    ALG_T3_I_009: () => ({
      problem: "选哪个技术方案",
      availableHeuristics: [{ name: "选熟悉的", rule: "优先选团队最熟的", bias: "熟悉度偏差" }],
      timeConstraint: 3
    }),
    ALG_T3_I_010: () => ({
      scenario: { description: "供应商交付风险", features: ["供应商", "交付"] },
      experiences: [{ scenario: "上一次供应商延期", outcome: "failure", lessons: ["签违约条款"] }]
    }),
    ALG_T3_I_011: () => ({
      expert: { domain: "工业质检", experienceHours: 8000, calibrationScore: 0.8 },
      problem: { domain: "工业质检", complexity: 0.4 }
    }),
    ALG_T3_I_012: () => ({
      domain: "工业质检",
      existingCreations: [{ name: "高光谱成像" }, { name: "边缘推理" }],
      creator: { creativity: 0.8, domainKnowledge: 0.7 }
    }),
    ALG_T3_I_013: () => ({
      stimuli: [{ type: "告警", intensity: 0.9, context: "疑似数据泄露" }],
      sensitivity: 0.7, pastThreats: ["数据泄露"]
    }),
    ALG_T3_I_014: () => ({
      environment: { trends: ["国产替代", "边缘智能"], gaps: ["缺少离线方案"], resources: ["算法团队"] },
      perceiver: { opportunityRecognition: 0.7, riskTolerance: 0.5 }
    })
  }
};
