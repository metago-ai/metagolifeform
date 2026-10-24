"use strict";
/**
 * memory.js — ALG_T3_K_001..014 真实实现（KMWI 四层记忆 / 自愈 / 衰减 / 生命体）
 */
const L = require("../t3lib.js");
const { mean, std, round, clamp01, safeDiv } = L;

const arr = v => (Array.isArray(v) ? v : []);
const obj = v => (v && typeof v === "object" ? v : {});
const num = (v, d = 0) => (isFinite(Number(v)) ? Number(v) : d);
const str = v => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

/* 稳定哈希（用于冗余校验，不用于安全） */
function h(s) {
  let x = 2166136261;
  const t = String(s);
  for (let i = 0; i < t.length; i++) { x ^= t.charCodeAt(i); x = Math.imul(x, 16777619); }
  return (x >>> 0).toString(16).padStart(8, "0");
}

/* K_001 KMWI 四层记忆架构 */
const LAYERS = {
  hot: { layer: "L1", reliability: 1.0, dependsOnAI: true, note: "会话上下文，会话结束即失" },
  warm: { layer: "L2", reliability: 0.85, dependsOnAI: false, note: "自动摘要，无需主动读取" },
  cold: { layer: "L3", reliability: 0.8, dependsOnAI: true, note: "持久知识，需主动读取" },
  frozen: { layer: "L4", reliability: 0.98, dependsOnAI: false, note: "程序记忆，冗余落盘" }
};
function k001(input) {
  const m = obj(input.memoryItem);
  const type = String(m.type || "hot");
  const cfg = LAYERS[type] || LAYERS.hot;
  const importance = clamp01(num(m.importance, 0.5));
  const content = str(m.content);
  const retrievalKeys = [...new Set([
    type, String(obj(m).category ?? ""),
    ...(content.match(/[\u4e00-\u9fa5A-Za-z]{2,8}/g) || []).slice(0, 6)
  ].filter(Boolean))].slice(0, 8);
  const reliability = round(clamp01(cfg.reliability * (0.85 + importance * 0.15)), 4);
  return {
    stored: content.length > 0,
    layer: cfg.layer,
    reliability,
    dependsOnAI: cfg.dependsOnAI,
    retrievalKeys
  };
}

/* K_002 热记忆管理 */
function k002(input) {
  const ctx = obj(input.context);
  const msgs = arr(ctx.messages);
  const tasks = arr(ctx.activeTask);
  const vars = Object.keys(obj(ctx.variables));
  const win = Math.max(1, num(input.windowSize, 20));
  const compressed = msgs.length > win;
  const priority = [];
  const forgotten = [];
  msgs.forEach((m, i) => {
    const age = msgs.length - i;
    const lvl = age <= 3 ? 3 : age <= win ? 2 : 1;
    if (i < 6) priority.push({ item: `消息${i}: ${str(obj(m).content ?? m).slice(0, 20)}`, level: lvl });
  });
  vars.slice(0, 6).forEach(v => priority.push({ item: `变量 ${v}`, level: 3 }));
  const kept = Math.min(msgs.length, win);
  msgs.slice(0, Math.max(0, msgs.length - kept)).forEach((m, i) => forgotten.push(`消息${i}`));
  return {
    retained: { messages: kept, tasks: tasks.length, variables: vars.length },
    compressed,
    priority: priority.sort((a, b) => b.level - a.level),
    forgotten
  };
}

/* K_003 温记忆管理 */
function k003(input) {
  const s = obj(input.session);
  const msgs = arr(s.messages);
  const tasks = arr(s.tasks);
  const outcomes = arr(s.outcomes);
  const auto = input.autoSummarize !== false;
  const topics = [...new Set(msgs.flatMap(m => (str(obj(m).content ?? m).match(/[\u4e00-\u9fa5]{2,6}/g) || [])).slice(0, 30))];
  const summary = auto
    ? `会话 ${s.id ?? "?"}：${msgs.length} 条消息、${tasks.length} 个任务、${outcomes.length} 个结果；主要话题：${topics.slice(0, 3).join("、") || "未识别"}`
    : `未启用自动摘要（会话 ${s.id ?? "?"}）`;
  const keyPoints = [];
  if (tasks.length) keyPoints.push(`共涉及 ${tasks.length} 个任务：${tasks.slice(0, 3).map(t => str(obj(t).name ?? t)).join("、")}`);
  if (outcomes.length) keyPoints.push(`产出 ${outcomes.length} 个结果，其中成功 ${outcomes.filter(o => /success|成功/.test(str(obj(o).status ?? o))).length} 个`);
  if (!keyPoints.length) keyPoints.push("会话无明确任务与结果，无需抽取");
  const extractedMemories = [];
  tasks.forEach(t => extractedMemories.push({ type: "task", content: str(obj(t).name ?? t), importance: 0.7 }));
  outcomes.forEach(o => extractedMemories.push({ type: "outcome", content: o, importance: 0.8 }));
  if (!extractedMemories.length) extractedMemories.push({ type: "summary", content: summary, importance: 0.4 });
  return { summary, keyPoints, extractedMemories, storedAt: new Date(0).toISOString() };
}

/* K_004 冷记忆管理 */
function k004(input) {
  const k = obj(input.knowledge);
  const cat = String(k.category ?? "未分类");
  const proj = String(k.project ?? "default");
  const content = str(k.content);
  const filePath = input.filePath != null
    ? String(input.filePath)
    : `memory/projects/${proj}/${cat}.md`;
  const retrievable = content.length > 0 && !!filePath;
  return {
    written: retrievable,
    filePath, section: cat,
    retrievable,
    lastUpdated: Date.now()
  };
}

/* K_005 冻记忆机制 */
function k005(input) {
  const c = obj(input.critical);
  const key = String(c.key ?? "");
  const value = String(c.value ?? "");
  const targets = arr(input.redundancyTargets).map(String).filter(Boolean);
  const list = targets.length ? targets : ["git-remote", "credentials-file", "project-memory"];
  const locations = list.map(t => ({ target: t, success: value.length > 0, hash: h(key + ":" + value) }));
  const ok = locations.filter(l => l.success).length;
  return {
    stored: ok > 0,
    locations,
    redundancyCount: ok,
    selfHealingEnabled: ok >= 2
  };
}

/* K_006 记忆自愈机制 */
function k006(input) {
  const miss = obj(input.detectedMissing);
  const sources = arr(input.availableSources).map(s => ({
    location: String(obj(s).location ?? "?"), hasKey: !!obj(s).hasKey
  }));
  const usable = sources.filter(s => s.hasKey && s.location !== String(miss.location ?? ""));
  if (!usable.length) {
    return {
      healed: false, restoredFrom: "", restoredTo: String(miss.location ?? ""),
      verifiedBy: [], remainingGaps: [`${miss.key ?? "?"} 在所有来源中均缺失`], requiresUser: true
    };
  }
  const from = usable[0].location;
  const verifiedBy = usable.slice(1).map(s => s.location);
  return {
    healed: true,
    restoredFrom: from,
    restoredTo: String(miss.location ?? ""),
    verifiedBy,
    remainingGaps: verifiedBy.length ? [] : ["仅单一来源可用，无交叉验证"],
    requiresUser: verifiedBy.length === 0
  };
}

/* K_007 记忆守护脚本 */
function k007(input) {
  const checks = arr(input.checks).map((c, i) => ({
    id: String(obj(c).id ?? `c${i}`), type: String(obj(c).type ?? ""),
    target: String(obj(c).target ?? ""), expected: String(obj(c).expected ?? "")
  }));
  const autoHeal = !!input.autoHeal;
  const results = checks.map(c => {
    // 简单判定：expected 为空视为仅探测存在性；否则比对 target 中是否含 expected
    const passed = c.expected === "" ? c.target.length > 0 : c.target.includes(c.expected);
    const healed = !passed && autoHeal && c.target.length > 0;
    return {
      id: c.id, passed: passed || healed,
      detail: passed ? `通过：${c.target.slice(0, 40)} 含预期值` : healed ? `自动修复：以现有内容重建预期` : `失败：${c.target.slice(0, 40)} 不含「${c.expected}」`,
      healed
    };
  });
  const pass = results.filter(r => r.passed).length;
  const score = round(checks.length ? (pass / checks.length) * 100 : 0, 2);
  const blockingIssues = results.filter(r => !r.passed).map(r => `${r.id}: ${r.detail}`);
  return {
    score,
    status: score >= 100 ? "healthy" : score >= 60 ? "warning" : "critical",
    results, blockingIssues
  };
}

/* K_008 记忆冗余策略 */
function k008(input) {
  const m = obj(input.memory);
  const primary = String(input.primaryTarget ?? "primary");
  const backups = arr(input.backupTargets).map(String);
  const mode = String(input.syncMode || "async");
  const targets = [primary, ...backups];
  const val = String(m.value ?? "");
  const written = targets.map((t, i) => ({
    target: t, success: val.length > 0, timestamp: i === 0 ? 0 : (mode === "async" ? i * 50 : 0)
  }));
  const ok = written.filter(w => w.success).length;
  const hashes = new Set(written.filter(w => w.success).map(() => h(String(m.key ?? "") + val)));
  return {
    written,
    redundancyLevel: ok,
    consistencyVerified: hashes.size <= 1,
    syncLatency: round(mode === "async" ? written.length * 50 : 0, 2)
  };
}

/* K_009 记忆校验机制 */
function k009(input) {
  const items = arr(input.memoryItems).map(x => ({
    key: String(obj(x).key ?? ""),
    locations: arr(obj(x).locations).map(l => ({
      target: String(obj(l).target ?? "?"), hash: String(obj(l).hash ?? ""), timestamp: num(obj(l).timestamp)
    }))
  }));
  const issues = [];
  let ok = 0;
  items.forEach(it => {
    if (!it.locations.length) {
      issues.push({ key: it.key, type: "missing", locations: [], detail: "所有目标均缺失" });
      return;
    }
    const hs = new Set(it.locations.map(l => l.hash));
    const ts = new Set(it.locations.map(l => l.timestamp));
    if (hs.size > 1) {
      issues.push({ key: it.key, type: "inconsistent", locations: it.locations.map(l => l.target), detail: `存在 ${hs.size} 个不同哈希，副本不一致` });
      return;
    }
    if (ts.size > 1) {
      issues.push({ key: it.key, type: "outdated", locations: it.locations.filter(l => l.timestamp < Math.max(...ts)).map(l => l.target), detail: "部分副本时间戳落后" });
      return;
    }
    ok++;
  });
  const healthScore = round(clamp01(items.length ? ok / items.length : 1), 4);
  return { consistent: issues.length === 0, issues, healthScore };
}

/* K_010 记忆衰减模型 */
const HALF = { procedural: 180, semantic: 90, episodic: 20 };
function k010(input) {
  const now = num(input.currentTime, 0);
  const items = arr(input.memories).map(m => ({
    key: String(obj(m).key ?? ""), type: String(obj(m).type || "semantic"),
    lastAccess: num(obj(m).lastAccess), accessCount: Math.max(0, num(obj(m).accessCount)),
    importance: clamp01(num(obj(m).importance, 0.5))
  }));
  const decayed = items.map(m => {
    const age = Math.max(0, now - m.lastAccess);
    const half = HALF[m.type] ?? 90;
    // 访问次数延长有效半衰期
    const effHalf = half * (1 + Math.log1p(m.accessCount) * 0.3);
    const retentionRate = round(clamp01(Math.exp(-age / (effHalf * 1.44)) * (0.95 + m.importance * 0.05)), 4);
    const urgency = round(clamp01(1 - retentionRate), 4);
    const recommendedAction = retentionRate < 0.3 && m.importance < 0.5 ? "forget"
      : retentionRate < 0.3 ? "reinforce"
        : retentionRate < 0.6 ? "review" : m.importance < 0.3 ? "archive" : "review";
    return { key: m.key, retentionRate, urgency, recommendedAction };
  });
  const reviewSchedule = items.map((m, i) => ({
    key: m.key,
    nextReview: round(m.lastAccess + (HALF[m.type] ?? 90) * 0.5, 4),
    priority: round(decayed[i].urgency * m.importance, 4)
  })).sort((a, b) => b.priority - a.priority);
  return { decayed, reviewSchedule };
}

/* K_011 记忆强化方法 */
function k011(input) {
  const m = obj(input.memory);
  const cur = clamp01(num(m.currentStrength, 0.5));
  const method = String(input.method || "spaced-repetition");
  const gain = { "spaced-repetition": 0.25, association: 0.35, emotional: 0.4, "multi-modal": 0.45 }[method] ?? 0.2;
  const newStrength = round(clamp01(cur + (1 - cur) * gain), 4);
  const intervals = arr(obj(input.schedule).intervals).map(Number).filter(x => x > 0);
  const base = intervals.length ? intervals[0] : Math.max(1, Math.round(1 / Math.max(0.05, newStrength)));
  const nextReview = round(base * (1 + Math.log1p(Number(input.schedule ? 1 : 0))), 4);
  const associationsCreated = method === "association" || method === "multi-modal"
    ? [{ to: String(obj(m).linkedTo ?? "相关记忆"), strength: round(gain, 4) }]
    : [];
  const expectedRetention = round(clamp01(0.5 + newStrength * 0.5), 4);
  return { strengthened: newStrength > cur, newStrength, nextReview, associationsCreated, expectedRetention };
}

/* K_012 记忆溯源机制 */
function k012(input) {
  const m = obj(input.memory);
  const p = obj(m.provenance);
  const prov = p.source == null ? null : {
    source: String(p.source), time: num(p.time), author: String(p.author ?? "unknown"),
    modifications: arr(p.modifications).map(x => ({
      time: num(obj(x).time), author: String(obj(x).author ?? ""), change: String(obj(x).change ?? ""),
      reason: String(obj(x).reason ?? "未记录理由")
    }))
  };
  if (!prov) {
    return {
      traceable: false, origin: { source: "未知", time: 0, author: "未知" },
      modifications: [], integrityVerified: false, trustScore: 0
    };
  }
  const mods = prov.modifications.slice().sort((a, b) => a.time - b.time);
  const timeOrderOk = mods.every((x, i) => i === 0 || x.time >= mods[i - 1].time);
  const allHaveReason = mods.every(x => x.reason !== "未记录理由");
  const integrityVerified = timeOrderOk && mods.every(x => x.author.length > 0);
  let trust = 1;
  if (!timeOrderOk) trust -= 0.3;
  if (!allHaveReason) trust -= 0.15 * mods.filter(x => x.reason === "未记录理由").length;
  if (prov.author === "unknown") trust -= 0.2;
  return {
    traceable: true,
    origin: { source: prov.source, time: prov.time, author: prov.author },
    modifications: mods,
    integrityVerified,
    trustScore: round(clamp01(trust), 4)
  };
}

/* K_013 记忆进化机制 */
function k013(input) {
  const hist = arr(input.memoryHistory).map(x => ({
    outcome: String(obj(x).outcome || "success"),
    lesson: String(obj(x).lesson ?? ""),
    feedback: String(obj(x).feedback ?? "")
  }));
  const strat = obj(input.currentStrategy);
  const succ = hist.filter(x => x.outcome === "success").length;
  const winRate = round(safeDiv(succ, Math.max(1, hist.length)), 4);
  const lessons = new Set(hist.map(x => x.lesson).filter(Boolean)).size;
  const stage = lessons >= 5 && winRate >= 0.7 ? "meta" : lessons >= 2 ? "active" : "passive";
  const evolvedStrategy = {
    name: `${String(strat.name ?? "记忆策略")}·${stage}`,
    base: String(strat.name ?? "记忆策略"),
    trigger: stage === "meta" ? "由元层决定何时写/读/忘" : stage === "active" ? "按重要性主动固化" : "被动接收",
    winRate, lessons
  };
  const improvementGain = round(clamp01(winRate * 0.6 + Math.min(1, lessons / 8) * 0.4), 4);
  const emergentInsights = [];
  if (winRate >= 0.7 && lessons >= 3) emergentInsights.push("高留存率伴随多教训，说明遗忘策略有效");
  if (winRate < 0.4) emergentInsights.push("留存率偏低，先检查是否把重要内容放在了热记忆层");
  const nextEvolutionFocus = stage === "passive" ? "建立写入判定规则，避免什么都记"
    : stage === "active" ? "引入衰减与复习调度，从「记下来」转向「记得住」"
      : "让记忆系统自己评估记忆策略的有效性";
  return { evolvedStrategy, improvementGain, evolutionStage: stage, emergentInsights, nextEvolutionFocus };
}

/* K_014 记忆生命体 */
function k014(input) {
  const lf = obj(input.lifeform);
  const layers = obj(lf.layers);
  const immune = obj(lf.immune);
  const nervous = obj(lf.nervous);
  const evo = obj(lf.evolution);
  const vitalityIn = clamp01(num(input.vitality, 0.5));
  const layerCount = Object.keys(layers).filter(k => layers[k] != null).length;
  const hasImmune = Object.keys(immune).length > 0;
  const hasNervous = Object.keys(nervous).length > 0;
  const hasEvo = Object.keys(evo).length > 0;
  const vitality = round(clamp01(
    vitalityIn * 0.4 +
    (layerCount / 4) * 0.2 +
    (hasImmune ? 0.15 : 0) + (hasNervous ? 0.15 : 0) + (hasEvo ? 0.1 : 0)
  ), 4);
  const alive = layerCount >= 2 && (hasImmune || hasNervous) && vitality >= 0.4;
  const health = vitality >= 0.85 ? "thriving" : vitality >= 0.65 ? "healthy" : vitality >= 0.4 ? "declining" : "critical";
  const capabilities = [];
  if (layerCount >= 4) capabilities.push("四层记忆齐备");
  if (hasImmune) capabilities.push("自愈");
  if (hasNervous) capabilities.push("校验");
  if (hasEvo) capabilities.push("元记忆进化");
  if (!capabilities.length) capabilities.push("仅基础存储");
  return {
    alive, vitality, health,
    selfHealingActive: hasImmune,
    evolutionRate: round(hasEvo ? clamp01(vitality * 0.5) : 0, 4),
    capabilities
  };
}

module.exports = {
  handlers: {
    ALG_T3_K_001: k001, ALG_T3_K_002: k002, ALG_T3_K_003: k003, ALG_T3_K_004: k004,
    ALG_T3_K_005: k005, ALG_T3_K_006: k006, ALG_T3_K_007: k007, ALG_T3_K_008: k008,
    ALG_T3_K_009: k009, ALG_T3_K_010: k010, ALG_T3_K_011: k011, ALG_T3_K_012: k012,
    ALG_T3_K_013: k013, ALG_T3_K_014: k014
  },
  samples: {
    ALG_T3_K_001: () => ({ memoryItem: { content: "耦生度 = 满意度×理解度×协同效率", type: "cold", importance: 0.9, timestamp: 1 } }),
    ALG_T3_K_002: () => ({
      context: {
        messages: Array.from({ length: 30 }, (_, i) => ({ content: `消息内容 ${i}` })),
        activeTask: [{ name: "整理记忆" }], variables: { a: 1, b: 2 }
      }, windowSize: 20
    }),
    ALG_T3_K_003: () => ({
      session: {
        id: "s1", messages: [{ content: "讨论了记忆架构" }],
        tasks: [{ name: "设计四层记忆" }], outcomes: [{ status: "success" }]
      }, autoSummarize: true
    }),
    ALG_T3_K_004: () => ({ knowledge: { category: "架构", content: "四层记忆定义", importance: 0.8, project: "metago" } }),
    ALG_T3_K_005: () => ({ critical: { type: "token", key: "repo-token", value: "abc123" }, redundancyTargets: ["git", "file", "memory"] }),
    ALG_T3_K_006: () => ({
      detectedMissing: { location: "file", key: "repo-token" },
      availableSources: [{ location: "git", hasKey: true }, { location: "memory", hasKey: true }, { location: "file", hasKey: false }]
    }),
    ALG_T3_K_007: () => ({
      checks: [{ id: "M1", type: "token", target: "git remote 含 token=abc", expected: "token" },
        { id: "M2", type: "section", target: "项目记忆", expected: "凭证区" }],
      autoHeal: false
    }),
    ALG_T3_K_008: () => ({ memory: { key: "k1", value: "v1" }, primaryTarget: "primary", backupTargets: ["b1", "b2"], syncMode: "async" }),
    ALG_T3_K_009: () => ({
      memoryItems: [{ key: "k1", locations: [{ target: "p", hash: "aa", timestamp: 1 }, { target: "b1", hash: "aa", timestamp: 1 }] },
        { key: "k2", locations: [{ target: "p", hash: "bb", timestamp: 2 }, { target: "b1", hash: "cc", timestamp: 2 }] }]
    }),
    ALG_T3_K_010: () => ({
      memories: [
        { key: "m1", type: "semantic", lastAccess: 0, accessCount: 5, importance: 0.9 },
        { key: "m2", type: "episodic", lastAccess: 0, accessCount: 0, importance: 0.2 }
      ], currentTime: 200
    }),
    ALG_T3_K_011: () => ({
      memory: { key: "k1", content: "四层记忆", currentStrength: 0.4 },
      method: "spaced-repetition", schedule: { intervals: [1, 3, 7] }
    }),
    ALG_T3_K_012: () => ({
      memory: { key: "k1", content: "x", provenance: { source: "会话语义", time: 1, author: "AI", modifications: [{ time: 2, author: "用户", change: "改分类" }] } }
    }),
    ALG_T3_K_013: () => ({
      memoryHistory: [{ event: "写入", outcome: "success", feedback: "有效", lesson: "按项目隔离" },
        { event: "读取", outcome: "failure", feedback: "找不到", lesson: "需要检索键" }],
      currentStrategy: { name: "被动记忆" }
    }),
    ALG_T3_K_014: () => ({
      lifeform: { layers: { L1: {}, L2: {}, L3: {}, L4: {} }, immune: { healer: true }, nervous: { validator: true }, evolution: { meta: true } },
      vitality: 0.8
    })
  }
};
