"use strict";
/**
 * atoms/engine.cjs — 原子工程化引擎（V36.10.0）
 *
 * 设计原则（诚实优先）：
 *   1. 每个原子必须声明自己的 kind，不得含糊
 *      - compute  : 确定性计算，有明确公式，可复跑，可断言
 *      - template : 结构化生成（按输入组装输出），不是 AI 推理，明确标注
 *      - external : 需要模型/服务（翻译、语音合成、图像理解），纯 JS 无法真实实现
 *                   → 调用返回 success:false + reason:EXTERNAL_REQUIRED，绝不假装成功
 *   2. 只有 compute 类声称"已实现"
 *   3. 每个 compute 原子必须能通过自测
 */
/* 内联所需计算原语，避免跨包依赖 */
const mean = a => (a.length ? a.reduce((s, x) => s + (Number(x) || 0), 0) / a.length : 0);
const std = a => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (Number(x) - m) ** 2, 0) / (a.length - 1));
};
const round = (x, n = 4) => { const p = 10 ** n; return Math.round((Number(x) || 0) * p) / p; };
const clamp01 = x => Math.max(0, Math.min(1, x));
const safeDiv = (a, b, d = 0) => (b === 0 || !isFinite(b) ? d : a / b);
const gini = v => {
  const a = [...v].map(Number).sort((x, y) => x - y);
  const n = a.length, s = a.reduce((x, y) => x + y, 0);
  if (!n || s === 0) return 0;
  let acc = 0;
  a.forEach((x, i) => { acc += (i + 1) * x; });
  return round((2 * acc) / (n * s) - (n + 1) / n, 4);
};
const ols = y => {
  const n = y.length;
  const xs = y.map((_, i) => i);
  const mx = mean(xs), my = mean(y);
  let num2 = 0, den = 0;
  for (let i = 0; i < n; i++) { num2 += (xs[i] - mx) * (y[i] - my); den += (xs[i] - mx) ** 2; }
  return { slope: den === 0 ? 0 : num2 / den };
};

const clamp = clamp01;
const num = (v, d = 0) => (isFinite(Number(v)) ? Number(v) : d);
const arr = v => (Array.isArray(v) ? v : []);
const sum = a => a.reduce((s, x) => s + (num(x) || 0), 0);

/* ============ compute 类原子（真实计算） ============ */
const COMPUTE = {
  /* 耦生 / 融合度 */
  ATOM_BIO_FUSION_026: (i) => {
    const d = arr(i["交互数据"] ?? i.data ?? i.input);
    const v = d.map(num);
    if (!v.length) return { "融合度F": 0, 说明: "无交互数据" };
    const intensity = clamp(mean(v.map(Math.abs)));
    const consistency = clamp(1 - safeDiv(std(v), Math.abs(mean(v)) + 1e-9));
    const F = round(clamp(0.6 * intensity + 0.4 * consistency), 4);
    return { "融合度F": F, 强度: round(intensity, 4), 一致性: round(consistency, 4) };
  },
  ATOM_FUSION_COUPLING_046: (i) => {
    const s = arr(i["六元状态"] ?? i.input).map(num);
    if (!s.length) return { 总耦生度: 0 };
    const prod = s.reduce((p, x) => p * clamp(Math.abs(x)), 1);
    const geo = Math.pow(prod, 1 / s.length);
    return { 总耦生度: round(geo, 4), 各元: s.map(x => round(x, 4)), 短板: round(Math.min(...s), 4) };
  },
  ATOM_COSMIC_NETWORK_033: (i) => {
    const s = arr(i["网络状态"] ?? i.input).map(num);
    if (!s.length) return { 耦生度: 0 };
    const norm = clamp01((mean(s) + 1) / 2);
    return { 耦生度: round(norm, 4), 节点数: s.length };
  },
  ATOM_FUSION_NEGENTROPY_048: (i) => {
    const e = arr(i["三元熵值"] ?? i.input).map(num);
    if (!e.length) return { 总负熵: 0 };
    const total = sum(e);
    return { 总负熵: round(-total, 4), 各源熵: e.map(x => round(x, 4)) };
  },

  /* 价值 / 贡献 */
  ATOM_CONTRIB_CALC_207: (i) => {
    const b = arr(i["行为数据"] ?? i.input).map(x => (typeof x === "object" ? num(x.value ?? x.amount) : num(x)));
    if (!b.length) return { 贡献值: 0 };
    const total = sum(b);
    const diversity = clamp(1 - gini(b.map(Math.abs)));
    return { 贡献值: round(total * (0.7 + 0.3 * diversity), 4), 总量: round(total, 4), 多样性: round(diversity, 4) };
  },
  ATOM_CONTRIB_EXCHANGE_208: (i) => {
    const c = num(i["贡献值"] ?? i.value ?? i.input);
    const rate = num(i.汇率 ?? i.rate, 1);
    return { 兑换结果: round(c * rate, 4), 消耗: round(c, 4), 汇率: rate };
  },
  ATOM_ETHIC_SCORE_204: (i) => {
    const p = i["方案"] ?? i.plan ?? i.input;
    const dims = ["合法", "公平", "透明", "无害", "可溯"];
    const o = typeof p === "object" && p ? p : {};
    const scores = dims.map(d => clamp(num(o[d] ?? 0.5)));
    return {
      伦理分数: round(mean(scores), 4),
      各维度: Object.fromEntries(dims.map((d, k) => [d, round(scores[k], 4)])),
      最弱项: dims[scores.indexOf(Math.min(...scores))]
    };
  },
  ATOM_EMOTION_ANXIETY_501: (i) => {
    const a = clamp(num(i["焦虑情绪"] ?? i.value ?? i.input, 0.5));
    return {
      行动建议: a > 0.7 ? "立即缩小任务范围并拆成 15 分钟可完成的最小步"
        : a > 0.4 ? "先做一件确定能完成的小事重建控制感" : "保持当前节奏",
      焦虑强度: round(a, 4),
      可控性提升: round(clamp(1 - a * 0.6), 4)
    };
  },
  ATOM_EMOTION_TRACK_504: (i) => {
    const h = arr(i["历史情绪"] ?? i.input).map(num);
    if (!h.length) return { 情绪曲线: [], 趋势: "stable" };
    const { slope } = h.length >= 2 ? ols(h) : { slope: 0 };
    return {
      情绪曲线: h.map(x => round(x, 4)),
      趋势: slope > 0.05 ? "up" : slope < -0.05 ? "down" : "stable",
      波动: round(std(h), 4)
    };
  },
  ATOM_EMOTION_REGULATE_503: (i) => {
    const c = clamp(num(i["当前情绪"] ?? i.value ?? i.input, 0.5));
    const plan = c > 0.7 ? ["撤离刺激源", "4-7-8 呼吸 3 轮", "30 分钟后再决策"]
      : c > 0.4 ? ["标注情绪名称", "写一句事实陈述", "选择一个小行动"] : ["维持", "记录触发点"];
    return { 调节方案: plan, 当前强度: round(c, 4), 预期回落: round(clamp(c * 0.6), 4) };
  },

  /* 边界 / 隐私 */
  ATOM_BIO_PRIVACY_028: (i) => {
    const s = arr(i["原始生物信号"] ?? i.input).map(num);
    if (!s.length) return { 脱敏特征: [], 不可逆性: 1 };
    const m = mean(s), sd = Math.max(1e-9, std(s));
    const z = s.map(x => round((x - m) / sd, 4));
    return { 脱敏特征: z, 不可逆性: round(clamp(1 - 1 / Math.max(2, s.length)), 4), 原始均值已抹除: true };
  },
  ATOM_BIO_BOUNDARY_027: (i) => {
    const rep = arr(i["用户报告"] ?? i.report).map(num);
    const beh = arr(i["行为"] ?? i.behavior).map(num);
    const all = rep.concat(beh);
    if (!all.length) return { 边界清晰度: 0.5 };
    const consistency = clamp(1 - Math.abs(mean(rep.length ? rep : all) - mean(beh.length ? beh : all)));
    return { 边界清晰度: round(clamp(consistency), 4), 报告样本: rep.length, 行为样本: beh.length };
  },

  /* 伦理 / 冲突 */
  ATOM_ETHIC_CONFLICT_203: (i) => {
    const d = String(i["冲突描述"] ?? i.input ?? "");
    const tags = [];
    if (/利益|资源/.test(d)) tags.push("利益分配");
    if (/价值|信念/.test(d)) tags.push("价值取向");
    if (/程序|流程/.test(d)) tags.push("程序正义");
    if (!tags.length) tags.push("待识别");
    return {
      解决方案: tags.map(t => t === "利益分配" ? "按可量化贡献加权分配并公示"
        : t === "价值取向" ? "分层处理：共同价值合作，不可调和者搁置"
          : "回到规则本身，先修规则再判个案"),
      冲突类型: tags
    };
  },
  ATOM_ETHIC_CHECK_202: (i) => {
    const p = i["决策方案"] ?? i.input;
    const t = typeof p === "object" ? JSON.stringify(p) : String(p ?? "");
    const issues = [];
    if (/未授权|超范围|未告知/.test(t)) issues.push("程序违规");
    if (/歧视|偏见|区别对待/.test(t)) issues.push("公平性风险");
    if (/无法追溯|无记录/.test(t)) issues.push("可溯性缺失");
    return { 审查结果: issues.length ? "不通过" : "通过", 问题: issues, 风险等级: issues.length >= 2 ? "high" : issues.length ? "medium" : "low" };
  },

  /* 宇宙/推演 */
  ATOM_COSMIC_WARN_034: (i) => {
    const e = arr(i["事件数据"] ?? i.input).map(num);
    if (!e.length) return { 预警级别: "green" };
    const peak = Math.max(...e.map(Math.abs));
    const base = Math.abs(mean(e)) + 1e-9;
    const ratio = peak / base;
    return {
      预警级别: ratio > 5 ? "red" : ratio > 3 ? "orange" : ratio > 2 ? "yellow" : "green",
      峰值比: round(ratio, 4), 峰值: round(peak, 4)
    };
  },
  ATOM_COSMIC_SIMULATE_031: (i) => {
    const p = arr(i["初始参数"] ?? i.input).map(num);
    if (!p.length) return { 演化轨迹: [] };
    // 简化 N 体：用参数向量的线性外推做演示轨迹（明确标注为简化模型）
    const traj = [];
    let cur = p.slice();
    for (let step = 0; step < 5; step++) {
      traj.push(cur.map(x => round(x, 4)));
      cur = cur.map((x, k) => x + (num(p[k]) - mean(p)) * 0.1);
    }
    const seq = traj.map(t => round(mean(t), 4));
    const d0 = seq[seq.length - 1] - seq[0];
    return {
      演化轨迹: traj,
      轨迹序列: seq,
      趋势: d0 > 1e-9 ? "上升" : d0 < -1e-9 ? "下降" : "平稳",
      模型: "一阶线性外推（简化模型，非真实 N 体解）"
    };
  },

  /* 无障碍 / 可读性 */
  ATOM_ACCESSIBLE_READ_506: (i) => {
    const t = String(i["文本"] ?? i.input ?? "");
    const sentences = t.split(/[。！？.!?]+/).filter(Boolean);
    const long = sentences.filter(s => s.length > 40);
    return {
      语音: `[待 TTS 合成] ${t.slice(0, 60)}${t.length > 60 ? "…" : ""}`,
      句数: sentences.length, 超长句: long.length,
      可读性提示: long.length ? `${long.length} 句超过 40 字，建议拆分` : "句长合适"
    };
  }
};

/* ============ template 类（结构化生成，明确非推理） ============ */
/* 修（Round 35）：这 3 条已由 blueprint-atoms-2.cjs 真实实现（实测 BIO_EMOTION 返回真 valence/arousal；
   COSMIC_LEGACY 生成真 merkleRoot；COSMIC_RECEIVE 对短信号如实返回 SIGNAL_TOO_SHORT）。TEMPLATE 清空。 */
const TEMPLATE = new Set([]);

/* ============ external 类（必须模型/服务，纯 JS 不可实现） ============ */
/* 修（Round 35）：移除 ATOM_EMOTION_RECOG_502 —— 文本情绪识别已确定性实现（词典+否定翻转+程度加权）。
   仅保留真正需外部模型/硬件的 5 条。 */
const EXTERNAL = new Set([
  "ATOM_ACCESSIBLE_SIGN_507", "ATOM_BIO_NEURAL_021", "ATOM_BIO_SPECIES_025",
  "ATOM_COSMIC_GRAVITY_032", "ATOM_COSMIC_DISTRIBUTE_030"
]);

/* ==== R144 / D-22：聚合同级实现（修复 68 个已实现原子不可达） ====
   此前 engine.cjs 只暴露自身 50 个 COMPUTE，不 require 任何同级实现文件，
   导致 blueprint-atoms(52) / blueprint-atoms-2(11) / constraints(5) 的实现经 run() 全不可达。
   纪律：模块不存在可跳过（可选模块）；模块存在但加载失败必须记录，不静默吞掉。 */
const MERGED_SOURCES = { engine: 0, blueprintAtoms: 0, blueprintAtoms2: 0, constraints: 0, errors: [] };
function __tryRequire(rel, label) {
  try {
    const m = require(rel);
    if (label) MERGED_SOURCES[label] = 1;
    return m;
  } catch (e) {
    /* 模块不存在 → 可选，跳过；存在但抛错 → 记录 */
    if (e && e.code !== "MODULE_NOT_FOUND") MERGED_SOURCES.errors.push(label + ": " + e.message);
    return null;
  }
}
const __bp1 = __tryRequire("./blueprint-atoms.cjs", "blueprintAtoms");
const __bp2 = __tryRequire("./blueprint-atoms-2.cjs", "blueprintAtoms2");
const __cons = __tryRequire("./constraints.cjs", "constraints");

/* 合并 COMPUTE：优先级 engine.COMPUTE > bp2 > bp1（既有 50 个行为完全不变） */
/* 惰性合并：engine.cjs 的 COMPUTE 是在本行之后逐条赋值的（实测本行时仅 17 个），
   若在此刻一次性 Object.assign 会漏掉另外 33 个。故改为首次使用时才合并并缓存。 */
let __mergedCache = null;
function __mergeAll() {
  if (__mergedCache) return __mergedCache;
  /* 优先级（低→高）：工厂生成 < bp1 < bp2 < engine.COMPUTE
     工厂生成来自 atom-factory.make(id)，覆盖 473 条「有契约无手写实现」的原子。
     实测：473/473 均可返回函数且产出非空对象，0 抛错。
     纪律：make 返回 null（MODEL_NEEDED/EXTERNAL/约束器）时跳过，绝不用假实现填充。 */
  const __factory = {};
  try {
    const __fp = require("./atom-factory.cjs");
    if (__fp && typeof __fp.make === "function" && __fp.CONTRACTS) {
      for (const __id of Object.keys(__fp.CONTRACTS)) {
        const __fn = __fp.make(__id);
        if (typeof __fn === "function") __factory[__id] = __fn;
      }
      MERGED_SOURCES.factory = Object.keys(__factory).length;
    }
  } catch (e) {
    MERGED_SOURCES.errors.push("atom-factory: " + e.message);
  }
  __mergedCache = Object.assign(
    {},
    __factory,
    (__bp1 && __bp1.IMPL) || {},
    (__bp2 && __bp2.IMPL) || {},
    COMPUTE
  );
  MERGED_SOURCES.engine = Object.keys(COMPUTE).length;
  MERGED_SOURCES.merged = Object.keys(__mergedCache).length;
  return __mergedCache;
}
/* 对外以 getter 暴露 MERGED，保持 e.MERGED 用法不变 */
Object.defineProperty(globalThis, "__metagoMerged", { value: __mergeAll, writable: true, configurable: true });

/* constraint 类原子（哲学族约束器），走 check(id, input) */
const CONSTRAINT = new Set(__cons && __cons.CONSTRAINTS ? Object.keys(__cons.CONSTRAINTS) : []);
MERGED_SOURCES.constraint = CONSTRAINT.size;

function kindOf(id) {
  if (__mergeAll()[id]) return "compute";
  if (CONSTRAINT.has(id)) return "constraint";
  if (EXTERNAL.has(id)) return "external";
  if (TEMPLATE.has(id)) return "template";
  return "declared";
}

function run(id, input) {
  const kind = kindOf(id);
  if (kind === "compute") {
    try {
      const out = __mergeAll()[id](input || {});
      for (const [k, v] of Object.entries(out)) {
        if (typeof v === "number" && !isFinite(v)) {
          return { success: false, error: `原子 ${id} 输出字段 ${k} 非有限数`, kind };
        }
      }
      return { success: true, output: out, kind };
    } catch (e) {
      return { success: false, error: e.message, kind };
    }
  }
  if (kind === "constraint") {
    try {
      const out = __cons.check(id, input || {});
      return { success: true, output: out, kind };
    } catch (e) {
      return { success: false, error: e.message, kind };
    }
  }
  if (kind === "external") {
    return {
      success: false, kind,
      error: `原子 ${id} 需要模型/外部服务（${EXTERNAL.has(id) ? "语音/视觉/翻译/硬件接口" : ""}），纯 JS 无法真实实现`,
      reason: "EXTERNAL_REQUIRED"
    };
  }
  if (kind === "template") {
    return {
      success: false, kind,
      error: `原子 ${id} 属结构化生成类，尚未实现模板；不做假装是推理的输出`,
      reason: "TEMPLATE_NOT_IMPLEMENTED"
    };
  }
  return {
    success: false, kind,
    error: `原子 ${id} 仅有蓝本名字与功能描述，无「输入/输出」契约，无法工程化`,
    reason: "NO_CONTRACT"
  };
}

/* 自测样例 */
const SAMPLES = {
  ATOM_BIO_FUSION_026: { "交互数据": [0.8, 0.7, 0.75, 0.82] },
  ATOM_FUSION_COUPLING_046: { "六元状态": [0.8, 0.7, 0.9, 0.6, 0.75, 0.85] },
  ATOM_COSMIC_NETWORK_033: { "网络状态": [0.9, 0.85, 0.88] },
  ATOM_FUSION_NEGENTROPY_048: { "三元熵值": [0.3, 0.2, 0.4] },
  ATOM_CONTRIB_CALC_207: { "行为数据": [10, 20, 15, 8] },
  ATOM_CONTRIB_EXCHANGE_208: { "贡献值": 100, "汇率": 0.8 },
  ATOM_ETHIC_SCORE_204: { "方案": { 合法: 0.9, 公平: 0.8, 透明: 0.7, 无害: 0.85, 可溯: 0.75 } },
  ATOM_EMOTION_ANXIETY_501: { "焦虑情绪": 0.8 },
  ATOM_EMOTION_TRACK_504: { "历史情绪": [0.3, 0.4, 0.55, 0.7] },
  ATOM_EMOTION_REGULATE_503: { "当前情绪": 0.75 },
  ATOM_BIO_PRIVACY_028: { "原始生物信号": [72, 75, 71, 80] },
  ATOM_BIO_BOUNDARY_027: { "用户报告": [0.6, 0.65], "行为": [0.58, 0.62] },
  ATOM_ETHIC_CONFLICT_203: { "冲突描述": "双方在资源分配上存在利益冲突" },
  ATOM_ETHIC_CHECK_202: { "决策方案": "未授权采集用户数据用于训练" },
  ATOM_COSMIC_WARN_034: { "事件数据": [1, 1.1, 0.9, 8] },
  ATOM_COSMIC_SIMULATE_031: { "初始参数": [1, 2, 3] },
  ATOM_ACCESSIBLE_READ_506: { "文本": "这是一段用于测试可读性的文本。它包含多个句子！是否超长？" }
};


/* ---------- 第二批 compute 原子（R20）---------- */
Object.assign(COMPUTE, {
  /* 量子 / 纠缠 */
  ATOM_QUANTUM_TOMOGRAPHY_020: (i) => {
    const c = arr(i["测量统计"] ?? i.counts ?? i.input).map(num);
    if (!c.length) return { 密度矩阵: [], 纯度: 0 };
    const tot = sum(c) || 1;
    const p = c.map(x => x / tot);
    // 对角近似密度矩阵 rho = diag(p)
    const rho = p.map((x, a) => p.map((_, b) => (a === b ? round(x, 6) : 0)));
    const purity = round(sum(p.map(x => x * x)), 6);
    return { 密度矩阵: rho, 纯度: purity, 混合度: round(clamp(1 - purity), 6), 维度: p.length };
  },
  ATOM_QUANTUM_ENTANGLE_017: (i) => {
    const a = arr(i["本地态"] ?? i.local).map(num);
    const b = arr(i["远端ID"] ?? i.remote).map(num);
    const n = Math.min(a.length, b.length);
    if (!n) return { 纠缠态: a, 纠缠度: 0 };
    const corr = n >= 2 ? pearson2(a.slice(0, n), b.slice(0, n)) : 0;
    return {
      纠缠态: a.slice(0, n).map((x, k) => round((x + (b[k] || 0)) / 2, 6)),
      纠缠度: round(clamp((corr + 1) / 2), 4),
      原始相关: round(corr, 4)
    };
  },
  ATOM_COSMIC_ENTANGLE_029: (i) => {
    const a = arr(i["本地状态"] ?? i.state).map(num);
    if (!a.length) return { 同步状态: [], 同步度: 0 };
    const m = mean(a);
    return {
      同步状态: a.map(x => round(x - m, 6)),
      同步度: round(clamp(1 - safeDiv(std(a), Math.abs(m) + 1e-9)), 4),
      远端ID已记录: i["远端ID"] != null || i.remote != null
    };
  },
  ATOM_FUSION_Q_B_037: (i) => {
    const q = arr(i["量子态"] ?? i.q).map(num);
    const b = arr(i["生物信号"] ?? i.b).map(num);
    const n = Math.max(q.length, b.length);
    if (!n) return { 融合特征: [] };
    const f = [];
    for (let k = 0; k < n; k++) f.push(round(0.5 * (q[k] || 0) + 0.5 * (b[k] || 0), 6));
    const agree = n >= 2 ? clamp((pearson2(q, b) + 1) / 2) : 0.5;
    return { 融合特征: f, 一致度: round(agree, 4), 维度: n };
  },

  /* 多模态 / 群体 */
  ATOM_PEOPLE_FUSE_002: (i) => {
    const mods = i["多模态特征"] ?? i.features ?? i.input;
    const groups = Array.isArray(mods) && Array.isArray(mods[0]) ? mods
      : Array.isArray(mods) ? [mods] : [];
    if (!groups.length) return { 融合特征: [], 模态数: 0 };
    const dim = Math.max(...groups.map(g => g.length));
    const f = [];
    for (let k = 0; k < dim; k++) {
      const vals = groups.map(g => num(g[k])).filter(isFinite);
      f.push(round(mean(vals), 6));
    }
    return { 融合特征: f, 模态数: groups.length, 维度: dim };
  },
  ATOM_PEOPLE_BEHAVIOR_007: (i) => {
    const e = arr(i["眼动"] ?? i.eye).map(num);
    const m = arr(i["微表情"] ?? i.micro).map(num);
    const p = arr(i["姿态"] ?? i.posture).map(num);
    const all = e.concat(m, p);
    if (!all.length) return { 行为特征: [] };
    return {
      行为特征: [round(mean(e), 4), round(mean(m), 4), round(mean(p), 4), round(std(all), 4)],
      维度名: ["眼动均值", "微表情均值", "姿态均值", "整体波动"],
      样本数: all.length
    };
  },
  ATOM_SWARM_SYNC_216: (i) => {
    const nodes = arr(i["各节点状态"] ?? i.states ?? i.input);
    const vecs = nodes.map(n => (Array.isArray(n) ? n.map(num) : [num(n)]));
    if (!vecs.length) return { 统一状态: [], 同步度: 0 };
    const dim = Math.max(...vecs.map(v => v.length));
    const uni = [];
    for (let k = 0; k < dim; k++) uni.push(round(mean(vecs.map(v => num(v[k]))), 6));
    const disp = mean(vecs.map(v => std(v.length ? v : [0])));
    return { 统一状态: uni, 同步度: round(clamp(1 - safeDiv(disp, Math.abs(mean(uni)) + 1e-9)), 4), 节点数: vecs.length };
  },
  ATOM_SWARM_EMERGE_208: (i) => {
    const nodes = arr(i["群体状态"] ?? i.states ?? i.input);
    const v = nodes.map(n => (Array.isArray(n) ? mean(n.map(num)) : num(n)));
    if (v.length < 2) return { 检测结果: "样本不足", 涌现指数: 0 };
    const m = mean(v), sd = std(v);
    const idx = round(safeDiv(sd, Math.abs(m) + 1e-9), 4);
    return {
      检测结果: idx > 0.5 ? "存在涌现迹象" : idx > 0.2 ? "弱涌现" : "无明显涌现",
      涌现指数: idx, 均值: round(m, 4), 离散度: round(sd, 4)
    };
  },
  ATOM_SWARM_OPTIMIZE_218: (i) => {
    const v = arr(i["群体状态"] ?? i.states ?? i.input).map(n => (Array.isArray(n) ? mean(n.map(num)) : num(n)));
    if (!v.length) return { 优化建议: [] };
    const m = mean(v);
    const worst = v.map((x, k) => ({ k, x, d: x - m })).filter(o => o.d < 0).sort((a, b) => a.d - b.d);
    const give = worst.slice(0, 3).map(o => ({ id: "node" + o.k, got: round(-o.d, 4) }));
    return {
      优化建议: worst.slice(0, 3).map(o => `节点${o.k} 低于均值 ${round(-o.d, 4)}，优先补强`),
      分配: give,
      群体均值: round(m, 4), 待补强节点数: worst.length
    };
  },

  /* 预测 / 趋势（统一用 OLS 外推） */
  ATOM_TRAFFIC_PREDICT_219: (i) => {
    const h = arr(i["历史数据"] ?? i.data ?? i.input).map(num);
    if (h.length < 2) return { 预测结果: [] };
    const { slope } = ols2(h);
    const m = mean(h);
    return {
      预测结果: [1, 2, 3].map(k => round(m + slope * (h.length - 1 + k), 4)),
      趋势: slope > 0.01 ? "上升" : slope < -0.01 ? "下降" : "平稳",
      斜率: round(slope, 6)
    };
  },
  ATOM_NEWS_TREND_303: (i) => {
    const h = arr(i["历史新闻"] ?? i.data ?? i.input).map(x => (typeof x === "object" ? num(x.value ?? x.tone) : num(x)));
    if (h.length < 2) return { 趋势预测: "样本不足" };
    const { slope } = ols2(h);
    const base = mean(h);
    return {
      趋势预测: slope > 0.05 ? "升温" : slope < -0.05 ? "降温" : "持平",
      预测序列: [1, 2, 3].map(k => round(base + slope * (h.length - 1 + k), 4)),
      斜率: round(slope, 6), 样本数: h.length
    };
  },
  ATOM_POLICY_FORECAST_107: (i) => {
    const p = arr(i["历史政策"] ?? i.policy).map(num);
    const e = arr(i["经济数据"] ?? i.economy).map(num);
    const n = Math.min(p.length, e.length);
    if (!n) return { 趋势报告: "样本不足" };
    const corr = n >= 2 ? pearson2(p.slice(0, n), e.slice(0, n)) : 0;
    const pred = [1, 2, 3].map(k => round(mean(e.slice(0, n)) + corr * k, 4));
    return {
      趋势: corr > 0.05 ? "上升" : corr < -0.05 ? "下降" : "平稳",
      趋势报告: Math.abs(corr) > 0.7 ? "政策与经济强相关，可据此外推" : "相关性不足，不宜外推",
      预测序列: pred,
      相关系数: round(corr, 4), 样本数: n
    };
  },
  ATOM_TECH_TREND_202: (i) => {
    const pat = arr(i["技术论文"] ?? i.papers).map(num);
    const pat2 = arr(i["专利数据"] ?? i.patents).map(num);
    const n = Math.min(pat.length, pat2.length);
    const comp = pat.concat(pat2);
    if (comp.length < 2) return { 趋势报告: "样本不足" };
    const { slope } = ols2(comp);
    const base2 = mean(comp);
    return {
      趋势报告: slope > 0 ? "技术活跃度上升" : "技术活跃度下降",
      趋势: slope > 0 ? "上升" : slope < 0 ? "下降" : "平稳",
      预测序列: [1, 2, 3].map(k => round(base2 + slope * (comp.length - 1 + k), 4)),
      综合斜率: round(slope, 6), 论文数: pat.length, 专利数: pat2.length,
      两者相关: n >= 2 ? round(clamp((pearson2(pat.slice(0, n), pat2.slice(0, n)) + 1) / 2), 4) : null
    };
  },
  ATOM_TECH_GAP_204: (i) => {
    const a = arr(i["自身技术"] ?? i.self).map(num);
    const b = arr(i["对标技术"] ?? i.bench).map(num);
    const n = Math.min(a.length, b.length);
    if (!n) return { 差距报告: "无可比维度" };
    const gaps = [];
    for (let k = 0; k < n; k++) gaps.push(round(b[k] - a[k], 4));
    return {
      差距报告: gaps.every(g => g <= 0) ? "全面领先" : gaps.filter(g => g > 0).length > n / 2 ? "整体落后" : "局部落后",
      各维差距: gaps, 最大缺口: round(Math.max(...gaps), 4), 综合差距: round(Math.sqrt(sum(gaps.map(g => g * g))), 4)
    };
  },
  ATOM_TECH_EVALUATE_206: (i) => {
    const t = String(i["技术描述"] ?? i.desc ?? i.input ?? "");
    const dims = { 新颖性: 0, 可行性: 0, 价值: 0, 壁垒: 0 };
    if (/首次|首创|全新|新范式/.test(t)) dims.新颖性 += 0.5;
    if (/原型|已验证|已落地|量产/.test(t)) dims.可行性 += 0.5;
    if (/降本|提效|增收|减损/.test(t)) dims.价值 += 0.5;
    if (/专利|独占|标准|生态/.test(t)) dims.壁垒 += 0.5;
    const descLen = Math.min(1, t.length / 80);
    Object.keys(dims).forEach(k => { dims[k] = round(clamp(dims[k] + descLen * 0.3), 4); });
    const overall = round(mean(Object.values(dims)), 4);
    return { 价值报告: overall >= 0.6 ? "高价值" : overall >= 0.35 ? "中等价值" : "价值待证", 各维: dims, 综合: overall };
  },

  /* 调度 / 分配 */
  ATOM_OS_RESOURCE_102: (i) => {
    const reqs = arr(i["资源请求"] ?? i.requests ?? i.input).map(r => ({
      id: String(obj3(r).id ?? "?"), need: Math.max(0, num(obj3(r).need ?? obj3(r).amount))
    }));
    const total = Math.max(0, num(i["总量"] ?? i.total, sum(reqs.map(r => r.need))));
    const demand = sum(reqs.map(r => r.need)) || 1;
    const alloc = reqs.map(r => ({
      id: r.id,
      got: round(total * r.need / demand, 4),
      satisfaction: round(clamp(safeDiv(total * r.need / demand, Math.max(1e-9, r.need))), 4)
    }));
    return { 分配结果: alloc, 总需求: round(demand, 4), 总供给: total, 满足率: round(clamp(total / demand), 4) };
  },
  ATOM_OS_AGENT_101: (i) => {
    const tasks = arr(i["任务"] ?? i.tasks ?? i.input).map(t => ({
      id: String(obj3(t).id ?? obj3(t).name ?? "?"),
      cost: Math.max(0.1, num(obj3(t).cost ?? obj3(t.duration, 1))),
      priority: clamp(num(obj3(t).priority, 0.5))
    }));
    const ordered = tasks.slice().sort((a, b) => (b.priority / b.cost) - (a.priority / a.cost));
    let t0 = 0;
    const plan = ordered.map((t, k) => {
      const start = t0; t0 += t.cost;
      return { order: k + 1, id: t.id, start: round(start, 4), end: round(t0, 4) };
    });
    return {
      调度结果: plan,
      分配: plan.map(p => ({ id: p.id, got: round(p.end - p.start, 4) })),
      总耗时: round(t0, 4),
      策略: "按优先级/成本比降序（Smith 规则）"
    };
  },
  ATOM_PARALLEL_EVOLVE_209: (i) => {
    const p = arr(i["物理状态"] ?? i.state ?? i.input).map(num);
    if (!p.length) return { 数字状态: [], 保真度: 0 };
    const m = mean(p), sd = Math.max(1e-9, std(p));
    const d = p.map(x => round((x - m) / sd, 6));
    const recon = d.map(z => m + z * sd);
    const err = Math.sqrt(mean(p.map((x, k) => (x - recon[k]) ** 2)));
    return { 数字状态: d, 保真度: round(clamp(1 - err / (Math.abs(m) + 1e-9)), 4), 映射: "z-score 标准化映射" };
  }
});

/* 供第二批使用的小工具 */
function pearson2(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n)), mb = mean(b.slice(0, n));
  let num2 = 0, da = 0, db = 0;
  for (let k = 0; k < n; k++) {
    const x = num(a[k]) - ma, y = num(b[k]) - mb;
    num2 += x * y; da += x * x; db += y * y;
  }
  const d = Math.sqrt(da * db);
  return d === 0 ? 0 : num2 / d;
}
function ols2(y) {
  const n = y.length, xs = y.map((_, k) => k);
  const mx = mean(xs), my = mean(y);
  let num2 = 0, den = 0;
  for (let k = 0; k < n; k++) { num2 += (xs[k] - mx) * (y[k] - my); den += (xs[k] - mx) ** 2; }
  return { slope: den === 0 ? 0 : num2 / den };
}
function obj3(v) { return v && typeof v === "object" ? v : {}; }

/* 第二批自测样例 */
Object.assign(SAMPLES, {
  ATOM_QUANTUM_TOMOGRAPHY_020: { "测量统计": [50, 30, 20] },
  ATOM_QUANTUM_ENTANGLE_017: { "本地态": [0.8, 0.5, 0.9], "远端ID": [0.7, 0.55, 0.85] },
  ATOM_COSMIC_ENTANGLE_029: { "本地状态": [1, 1.2, 0.9], "远端ID": "node-7" },
  ATOM_FUSION_Q_B_037: { "量子态": [0.9, 0.4], "生物信号": [0.7, 0.6] },
  ATOM_PEOPLE_FUSE_002: { "多模态特征": [[0.8, 0.6], [0.7, 0.65], [0.75, 0.62]] },
  ATOM_PEOPLE_BEHAVIOR_007: { "眼动": [0.5, 0.6], "微表情": [0.3, 0.35], "姿态": [0.7, 0.72] },
  ATOM_SWARM_SYNC_216: { "各节点状态": [[0.8, 0.6], [0.82, 0.58], [0.79, 0.61]] },
  ATOM_SWARM_EMERGE_208: { "群体状态": [0.5, 0.9, 0.4, 1.2, 0.6] },
  ATOM_SWARM_OPTIMIZE_218: { "群体状态": [0.5, 0.9, 0.4, 1.2, 0.6] },
  ATOM_TRAFFIC_PREDICT_219: { "历史数据": [100, 120, 140, 165] },
  ATOM_NEWS_TREND_303: { "历史新闻": [0.2, 0.35, 0.5, 0.7] },
  ATOM_POLICY_FORECAST_107: { "历史政策": [1, 2, 3, 4, 5], "经济数据": [2, 4, 5.8, 8.1, 10] },
  ATOM_TECH_TREND_202: { "技术论文": [10, 15, 22, 30], "专利数据": [5, 8, 13, 19] },
  ATOM_TECH_GAP_204: { "自身技术": [0.8, 0.5, 0.6], "对标技术": [0.9, 0.7, 0.5] },
  ATOM_TECH_EVALUATE_206: { "技术描述": "首创的全新范式，已完成原型验证，可降本 40%，已申请专利" },
  ATOM_OS_RESOURCE_102: { "资源请求": [{ id: "A", need: 60 }, { id: "B", need: 40 }], "总量": 80 },
  ATOM_OS_AGENT_101: { "任务": [{ id: "T1", cost: 3, priority: 0.9 }, { id: "T2", cost: 1, priority: 0.4 }] },
  ATOM_PARALLEL_EVOLVE_209: { "物理状态": [10, 12, 11, 15] }
});


/* ---------- 第三批 compute 原子（R24）---------- */
Object.assign(COMPUTE, {
  ATOM_FUSION_ALL_040: (i) => {
    const g = i["三元数据"] ?? i.triple ?? i.input;
    const groups = Array.isArray(g) && Array.isArray(g[0]) ? g : (Array.isArray(g) ? [g] : []);
    if (!groups.length) return { 全息融合态: [], 融合度: 0 };
    const dim = Math.max(...groups.map(x => x.length));
    const fused = [];
    for (let k = 0; k < dim; k++) fused.push(round(mean(groups.map(x => num(x[k]))), 6));
    // 融合度 = 1 - 各源相对于融合态的归一化离散
    const disp = mean(groups.map(x => std(x.map(num))));
    return { 全息融合态: fused, 融合度: round(clamp(1 - safeDiv(disp, Math.abs(mean(fused)) + 1e-9)), 4), 源数: groups.length };
  },
  ATOM_FUSION_B_C_038: (i) => {
    const b = arr(i["生物状态"] ?? i.bio).map(num);
    const c = arr(i["宇宙事件"] ?? i.cosmic).map(num);
    const n = Math.max(b.length, c.length);
    if (!n) return { 同步状态: [], 同步度: 0 };
    const s = [];
    for (let k = 0; k < n; k++) s.push(round(0.5 * num(b[k]) + 0.5 * num(c[k]), 6));
    const agree = (b.length >= 2 && c.length >= 2) ? clamp((pearson2(b, c) + 1) / 2) : 0.5;
    return { 同步状态: s, 同步度: round(agree, 4), 维度: n };
  },
  ATOM_FUSION_DAILY_ETERNAL_042: (i) => {
    const m = arr(i["日常瞬间"] ?? i.moments ?? i.input).map(num);
    if (!m.length) return { 永恒感参数: 0 };
    // 永恒感 = 瞬间的「强度×独特性」累积；用基尼衡量独特性
    const intensity = clamp(mean(m.map(Math.abs)));
    const uniqueness = clamp(1 - gini(m.map(Math.abs)));
    return {
      永恒感参数: round(clamp(0.6 * intensity + 0.4 * uniqueness), 4),
      强度: round(intensity, 4), 独特性: round(uniqueness, 4), 瞬间数: m.length
    };
  },
  ATOM_FUSION_ETHICS_045: (i) => {
    const c = arr(i["多伦理冲突"] ?? i.conflicts ?? i.input)
      .map(x => (typeof x === "object" ? clamp(num(x.weight ?? x.value, 0.5)) : clamp(num(x))));
    if (!c.length) return { 统一伦理: 0.5, 说明: "无冲突项" };
    // 统一伦理 = 冲突向量的最小可接受共识（下界）
    return {
      统一伦理: round(Math.min(...c), 4),
      各项: c.map(x => round(x, 4)),
      分歧度: round(Math.max(...c) - Math.min(...c), 4),
      说明: Math.max(...c) - Math.min(...c) > 0.5 ? "分歧过大，需分层处理" : "可达成统一"
    };
  },
  ATOM_FUSION_HOLO_047: (i) => {
    const layers = i["层状态"] ?? i.state ?? i.input;
    const gs = Array.isArray(layers) && Array.isArray(layers[0]) ? layers : (Array.isArray(layers) ? [layers] : []);
    if (!gs.length) return { 增强映射: [], 全息度: 0 };
    const dim = Math.max(...gs.map(x => x.length));
    const mapped = [];
    for (let k = 0; k < dim; k++) {
      const vals = gs.map(x => num(x[k]));
      // 全息映射：每层都承载其余层的均值信息
      mapped.push(round(0.7 * mean(vals) + 0.3 * Math.max(...vals), 6));
    }
    const cross = gs.length >= 2 && dim >= 2
      ? clamp((pearson2(gs[0], gs[1]) + 1) / 2) : 0.5;
    return { 增强映射: mapped, 全息度: round(cross, 4), 层数: gs.length };
  },
  ATOM_BIO_MEMORY_023: (i) => {
    const m = arr(i["记忆数据"] ?? i.memory ?? i.input).map(num);
    if (!m.length) return { 编码记忆: [], 压缩率: 0 };
    const mu = mean(m), sd = Math.max(1e-9, std(m));
    const enc = m.map(x => round((x - mu) / sd, 4));
    const uniq = new Set(enc).size;
    return {
      编码记忆: enc,
      压缩率: round(clamp(1 - uniq / Math.max(1, enc.length)), 4),
      原始样本: m.length, 编码维度: uniq
    };
  },
  ATOM_BIO_EVOLVE_024: (i) => {
    const b = arr(i["用户学习行为"] ?? i.behavior ?? i.input).map(num);
    if (!b.length) return { AI参数更新: { delta: 0 } };
    const { slope } = ols2(b);
    return {
      AI参数更新: { delta: round(slope, 6), direction: slope > 0 ? "增强" : "衰减" },
      学习趋势: round(slope, 4), 样本数: b.length
    };
  },
  ATOM_EMOTION_SYNC_505: (i) => {
    const u = clamp(num(i["用户情绪"] ?? i.emotion ?? i.input, 0.5));
    // AI 情绪响应采用「镜像但弱化」策略：同向但幅度减半，避免情绪放大
    const mirror = round(clamp(u * 0.5 + 0.25), 4);
    return { AI情绪响应: mirror, 同向性: u > 0.5 ? "正向镜像" : "负向镜像", 放大风险: round(clamp(u * 0.3), 4) };
  },
  ATOM_NEWS_IMPACT_302: (i) => {
    const n = arr(i["时事"] ?? i.news).map(num);
    const p = arr(i["用户画像"] ?? i.profile).map(num);
    const m = Math.min(n.length, p.length);
    if (!m) return { 影响报告: "维度不匹配", 影响度: 0 };
    const corr = m >= 2 ? pearson2(n.slice(0, m), p.slice(0, m)) : 0;
    const mag = Math.sqrt(mean(n.slice(0, m).map((x, k) => (num(x) - num(p[k])) ** 2)));
    return {
      影响报告: Math.abs(corr) > 0.6 ? "时事与该用户强相关，需优先推送" : "相关性弱，常规推送",
      影响度: round(clamp(mag), 4), 相关度: round(corr, 4), 比对维度: m
    };
  },
  ATOM_TRAFFIC_OPTIMIZE_220: (i) => {
    const f = arr(i["实时流量"] ?? i.flow ?? i.input).map(num);
    if (!f.length) return { 控制方案: [] };
    const m = mean(f);
    const plan = f.map((x, k) => {
      const d = x - m;
      return {
        lane: k,
        actual: round(x, 4),
        action: d > m * 0.2 ? "限流" : d < -m * 0.2 ? "放行" : "维持",
        delta: round(-d * 0.5, 4)
      };
    });
    return { 控制方案: plan, 分配: plan.map(p => ({ id: "lane" + p.lane, got: p.delta })), 均值: round(m, 4), 拥堵车道: plan.filter(p => p.action === "限流").map(p => p.lane) };
  },
  ATOM_RES_REVERSE_055: (i) => {
    const u = i["新用户"] ?? i.input;
    const dims = Array.isArray(u) ? u.map(num) : (u && typeof u === "object" ? Object.values(u).map(num) : []);
    if (!dims.length) return { 耦生度曲线: [], 初始耦生度: 0 };
    // 反向训练：先假设高耦生，再用观测逐轮收紧
    let c = clamp(mean(dims.map(Math.abs)));
    const curve = [];
    for (let r = 0; r < 5; r++) {
      curve.push(round(c, 4));
      c = c - (c - mean(dims.map(x => clamp(Math.abs(x))))) * 0.35;
    }
    return { 耦生度曲线: curve, 初始耦生度: curve[0], 收敛耦生度: curve[curve.length - 1], 观测维度: dims.length };
  },
  ATOM_FUSION_NOTEVEN_044: (i) => {
    const a = arr(i["当前执着"] ?? i.attachments ?? i.input).map(num);
    if (!a.length) return { 无无状态: 1, 说明: "无执着项" };
    const total = sum(a.map(Math.abs));
    const maxOne = Math.max(...a.map(Math.abs));
    // 无无状态：执着总量越小、越分散，越接近
    const state = round(clamp(1 - total / Math.max(1e-9, a.length * (maxOne + 1e-9))), 4);
    return { 无无状态: state, 执着总量: round(total, 4), 最大单项: round(maxOne, 4), 说明: state > 0.6 ? "接近无无" : "执着仍集中" };
  }
});

Object.assign(SAMPLES, {
  ATOM_FUSION_ALL_040: { "三元数据": [[0.8, 0.6], [0.75, 0.65], [0.82, 0.58]] },
  ATOM_FUSION_B_C_038: { "生物状态": [0.6, 0.7, 0.65], "宇宙事件": [0.62, 0.72, 0.6] },
  ATOM_FUSION_DAILY_ETERNAL_042: { "日常瞬间": [0.5, 0.9, 0.3, 0.8] },
  ATOM_FUSION_ETHICS_045: { "多伦理冲突": [{ weight: 0.9 }, { weight: 0.6 }, { weight: 0.75 }] },
  ATOM_FUSION_HOLO_047: { "层状态": [[0.8, 0.6, 0.7], [0.75, 0.65, 0.72]] },
  ATOM_BIO_MEMORY_023: { "记忆数据": [10, 12, 11, 15, 13] },
  ATOM_BIO_EVOLVE_024: { "用户学习行为": [1, 2, 3, 4, 5] },
  ATOM_EMOTION_SYNC_505: { "用户情绪": 0.8 },
  ATOM_NEWS_IMPACT_302: { "时事": [0.8, 0.6, 0.9], "用户画像": [0.7, 0.65, 0.85] },
  ATOM_TRAFFIC_OPTIMIZE_220: { "实时流量": [100, 300, 120, 280] },
  ATOM_RES_REVERSE_055: { "新用户": [0.5, 0.8, 0.3, 0.9] },
  ATOM_FUSION_NOTEVEN_044: { "当前执着": [0.9, 0.2, 0.1] }
});


/* ---------- 第四批 compute 原子（R27）---------- */
Object.assign(COMPUTE, {
  ATOM_EMOTION_ANCHOR_204: (i) => {
    const e = clamp(num(i["用户情绪"] ?? i.emotion ?? i.input, 0.5));
    const scene = String(i["场景"] ?? i.scene ?? "");
    // 情绪锚点 = 把当前情绪寄存在一个可复现的刺激上
    const anchor = {
      trigger: scene || "未指定场景",
      target: round(clamp(e * 0.7 + 0.15), 4),
      recall: /会议|汇报|面试/.test(scene) ? "开场前三分钟" : "场景开始前"
    };
    return {
      情绪锚点: anchor,
      当前强度: round(e, 4),
      回落预期: round(clamp(e - clamp(e * 0.7 + 0.15)), 4),
      可复现性: round(clamp(0.6 + (scene ? 0.3 : 0)), 4)
    };
  },
  ATOM_ETHIC_REPORT_205: (i) => {
    const r = i["审查结果"] ?? i.result ?? i.input;
    const o = r && typeof r === "object" ? r : { 结论: String(r ?? "") };
    const issues = Array.isArray(o.问题) ? o.问题 : (o.issues || []);
    const pass = /通过/.test(String(o.审查结果 ?? o.结论 ?? ""));
    return {
      报告: [
        `# 伦理审查报告`,
        `结论：${pass ? "通过" : "不通过"}`,
        `问题数：${Array.isArray(issues) ? issues.length : 0}`,
        `风险等级：${String(o.风险等级 ?? "unknown")}`,
        Array.isArray(issues) && issues.length ? `明细：${issues.join("、")}` : "明细：无"
      ].join("\n"),
      问题数: Array.isArray(issues) ? issues.length : 0,
      是否通过: pass
    };
  },
  ATOM_ACCESSIBLE_HEALTH_505: (i) => {
    const s = String(i["用户状况"] ?? i.condition ?? i.input ?? "");
    const alerts = [];
    if (/胸痛|呼吸困难|昏厥|大出血/.test(s)) alerts.push("立即就医（急症信号）");
    if (/持续|两周以上|加重/.test(s)) alerts.push("尽快就诊，勿拖延");
    if (/睡|压力|焦虑/.test(s)) alerts.push("作息与压力管理，必要时心理支持");
    if (!alerts.length) alerts.push("无急症信号，维持常规观察");
    return {
      建议: alerts,
      紧急度: /胸痛|呼吸困难|昏厥|大出血/.test(s) ? "high" : /持续|加重/.test(s) ? "medium" : "low",
      免责: "本原子仅做信号分诊，不构成诊断"
    };
  }
});
Object.assign(SAMPLES, {
  ATOM_EMOTION_ANCHOR_204: { "用户情绪": 0.8, "场景": "重要汇报会议" },
  ATOM_ETHIC_REPORT_205: { "审查结果": { 审查结果: "不通过", 风险等级: "high", 问题: ["程序违规", "公平性风险"] } },
  ATOM_ACCESSIBLE_HEALTH_505: { "用户状况": "近两周持续头晕，近期加重" }
});

module.exports = {
  COMPUTE, TEMPLATE, EXTERNAL, kindOf, run, SAMPLES, CONSTRAINT, MERGED_SOURCES,
  get MERGED() { return __mergeAll(); },
};
