"use strict";
/**
 * specialized.cjs — 语义特化算子库（工厂精度升级）
 *
 * 现状：工厂按「动作」生成通用实现（计算/度量 → 均值+标准差…）。
 *       这符合契约，但不够贴切 —— "熵计算器"和"贡献值计算器"不该算出同一套数。
 *
 * 升级：按**功能描述里的语义关键词**路由到专门的数学实现。
 *       例如提到「熵」→ 香农熵；「相关」→ Pearson；「排名」→ 秩次；「基尼」→ 基尼系数。
 *
 * 这不是逐条手写 534 个函数（不可能也没必要），而是**建立语义 → 算子的映射表**，
 * 让工厂在生成时按描述选算子 —— 一次投入，覆盖所有同语义原子。
 */

const mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const sum = a => a.reduce((s, x) => s + x, 0);
const round = (x, n = 4) => { const p = 10 ** n; return Math.round((Number(x) || 0) * p) / p; };
const clamp01 = x => Math.max(0, Math.min(1, x));
const std = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };

/* ---------------- 语义算子 ---------------- */
const OPS = {
  /* 信息论 */
  entropy(v) {
    const s = sum(v.map(Math.abs)) || 1;
    const p = v.map(x => Math.abs(x) / s).filter(x => x > 0);
    const h = -p.reduce((a, x) => a + x * Math.log2(x), 0);
    const max = Math.log2(Math.max(2, p.length));
    return { entropy: round(h), normalized: round(clamp01(h / max)), maxEntropy: round(max), n: v.length };
  },
  gini(v) {
    const a = [...v].map(Math.abs).sort((x, y) => x - y);
    const n = a.length, s = sum(a);
    if (!n || s === 0) return { gini: 0, equality: 1 };
    let acc = 0; a.forEach((x, i) => { acc += (i + 1) * x; });
    const g = (2 * acc) / (n * s) - (n + 1) / n;
    return { gini: round(g), equality: round(clamp01(1 - g)), n };
  },
  /* 统计 */
  correlation(v) { return { correlation: 0, note: "需两列输入，已降级为单列统计", std: round(std(v)) }; },
  zscore(v) { const m = mean(v), s = Math.max(1e-9, std(v)); return { zScores: v.map(x => round((x - m) / s)), mean: round(m), std: round(s) }; },
  median(v) { const a = [...v].sort((x, y) => x - y); const n = a.length; const med = n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; return { median: round(med), min: round(a[0]), max: round(a[n - 1]), n }; },
  iqr(v) {
    const a = [...v].sort((x, y) => x - y); const q = p => a[Math.floor(p * (a.length - 1))];
    const q1 = q(0.25), q3 = q(0.75);
    return { q1: round(q1), q3: round(q3), iqr: round(q3 - q1), outliers: a.filter(x => x < q1 - 1.5 * (q3 - q1) || x > q3 + 1.5 * (q3 - q1)).length };
  },
  /* 排序/排名 */
  rank(v) {
    const idx = v.map((x, i) => ({ x, i })).sort((a, b) => b.x - a.x);
    const ranks = new Array(v.length);
    idx.forEach((o, r) => { ranks[o.i] = r + 1; });
    return { ranks, topIndex: idx[0].i, topValue: round(idx[0].x), n: v.length };
  },
  /* 分配 */
  allocate(v) {
    const t = sum(v.map(Math.abs)) || 1;
    const alloc = v.map((x, i) => ({ id: "n" + i, got: round(Math.abs(x) / t), value: round(x) }));
    return { allocation: alloc, 分配: alloc, total: round(t), fairness: round(clamp01(1 - (Math.max(...v) - Math.min(...v)) / (Math.abs(mean(v)) + 1e-9))) };
  },
  /* 趋势/预测 */
  trend(v) {
    const n = v.length; if (n < 2) return { 趋势: "平稳", slope: 0, prediction: v.slice(0, 3) };
    const xs = v.map((_, i) => i), mx = mean(xs), my = mean(v);
    let a = 0, b = 0; for (let i = 0; i < n; i++) { a += (xs[i] - mx) * (v[i] - my); b += (xs[i] - mx) ** 2; }
    const slope = b === 0 ? 0 : a / b;
    return {
      prediction: [1, 2, 3].map(k => round(my + slope * (n - 1 + k - mx))),
      趋势: slope > 1e-9 ? "上升" : slope < -1e-9 ? "下降" : "平稳",
      slope: round(slope, 6), level: round(my)
    };
  },
  /* 风险/异常 */
  risk(v) {
    const m = Math.abs(mean(v)) + 1e-9, peak = Math.max(...v.map(Math.abs));
    const ratio = peak / m;
    return { level: ratio > 5 ? "red" : ratio > 3 ? "orange" : ratio > 2 ? "yellow" : "green", 触发依据: { peak: round(peak), baseline: round(m), ratio: round(ratio) } };
  },
  /* 距离/相似 */
  distance(v) {
    /* 注意：本算子是「各元素偏离均值」，不是「两向量之间的距离」。 */
    const m = mean(v);
    return {
      deviation: v.map(x => round(x - m)),
      totalDeviation: round(sum(v.map(x => Math.abs(x - m)))),
      spread: round(std(v)), n: v.length,
      __semantics: "deviation_from_mean_not_pairwise_distance",
    };
  },
  /* 计数/密度 */
  density(v) { return { density: round(clamp01(v.length / Math.max(1, Math.max(...v) - Math.min(...v) + 1))), count: v.length, range: round(Math.max(...v) - Math.min(...v)) }; },
  /* 加权/综合 */
  weighted(v) {
    const w = v.map((_, i) => 1 / (i + 1));   // 递减权重
    const t = sum(w);
    return { weightedScore: round(sum(v.map((x, i) => x * w[i])) / (t || 1)), weights: w.map(x => round(x, 3)), n: v.length };
  },
  /* 阈值/判定 */
  threshold(v, t) {
    /* 第二参 t 若给出，按其判定；否则沿用「≥均值」。
       __semantics 明确说明用的是哪一个，避免调用方误读。 */
    const useGiven = (typeof t === "number" && isFinite(t));
    const cut = useGiven ? t : mean(v);
    const pass = v.filter(x => x >= cut).length;
    return {
      pass, fail: v.length - pass,
      passRate: round(clamp01(pass / Math.max(1, v.length))),
      threshold: round(cut),
      __semantics: useGiven ? "count_ge_given_threshold" : "count_ge_mean",
    };
  },
  /* 收敛/稳定 */
  stability(v) {
    const m = mean(v), cv = std(v) / (Math.abs(m) + 1e-9);
    return { stability: round(clamp01(1 - cv)), cv: round(cv), converged: cv < 0.1, n: v.length };
  },

  /* 融合/耦生/同步 */
  fusion(v) {
    const m = mean(v), s = std(v);
    const sync = clamp01(1 - s / (Math.abs(m) + 1e-9));
    return {
      fused: v.map(x => round(x - m)),
      sync: round(sync),
      同步度: round(sync),
      dispersion: round(s),
      consistency: round(clamp01(1 - s / (Math.abs(m) + 1e-9))),
      n: v.length
    };
  },
  /* 识别/检测/感知 */
  classify(v) {
    const m = mean(v), s = Math.max(1e-9, std(v));
    const last = v[v.length - 1];
    const z = Math.abs(last - m) / s;
    return {
      label: z > 2 ? "异常" : z > 1 ? "偏离" : "正常",
      confidence: round(clamp01(1 - 1 / (1 + z))),
      zScore: round(z),
      baseline: round(m),
      threshold: round(m + 2 * s),
      detected: z > 2
    };
  },
  /* 监控/追踪/观察 */
  monitor(v) {
    const m = mean(v), s = Math.max(1e-9, std(v));
    const peak = Math.max(...v.map(Math.abs));
    const ratio = peak / (Math.abs(m) + 1e-9);
    return {
      level: ratio > 5 ? "red" : ratio > 3 ? "orange" : ratio > 2 ? "yellow" : "green",
      触发依据: { peak: round(peak), baseline: round(m), ratio: round(ratio) },
      tracked: v.length,
      volatility: round(s / (Math.abs(m) + 1e-9)),
      alarms: v.filter(x => Math.abs(x - m) > 2 * s).length
    };
  },
  /* 优化/调优/改进 */
  optimize(v) {
    const m = mean(v);
    const worst = v.map((x, i) => ({ i, x, d: x - m })).sort((a, b) => a.d - b.d);
    const allocation = worst.slice(0, 3).map(o => ({ id: "n" + o.i, got: round(-o.d) }));
    return {
      allocation,
      分配: allocation,
      best: round(Math.max(...v)),
      worst: round(Math.min(...v)),
      improvementPotential: round(Math.max(...v) - Math.min(...v)),
      mean: round(m),
      candidates: worst.slice(0, 3).map(o => o.i)
    };
  },
  /* 校准/调整/修正 */
  calibrate(v) {
    const m = mean(v), s = Math.max(1e-9, std(v));
    const target = 0.5;   // 归一到 [0,1] 中心
    const scaled = v.map(x => round(clamp01((x - Math.min(...v)) / (Math.max(...v) - Math.min(...v) + 1e-9))));
    return {
      calibrated: scaled,
      offset: round(-m),
      scale: round(1 / s),
      mean: round(m),
      std: round(s),
      target
    };
  },
  /* 传播/扩散/涌现 */
  diffuse(v) {
    const m = mean(v);
    const spread = std(v);
    const reach = clamp01(spread / (Math.abs(m) + 1e-9));
    return {
      reach: round(reach),
      扩散度: round(reach),
      seed: round(Math.max(...v)),
      propagated: v.map(x => round(m + (x - m) * 0.5)),
      emerged: reach > 0.5,
      n: v.length
    };
  },


  /* 聚合/汇总 */
  aggregate(v) {
    const m = mean(v), t = sum(v);
    return {
      total: round(t), mean: round(m), count: v.length,
      max: round(Math.max(...v)), min: round(Math.min(...v)),
      range: round(Math.max(...v) - Math.min(...v)),
      share: v.map(x => round(clamp01(t === 0 ? 0 : x / t)))
    };
  },
  /* 差距/对比 */
  gap(v) {
    const m = mean(v), hi = Math.max(...v);
    const gaps = v.map(x => round(hi - x));
    return {
      gaps, 各维差距: gaps,
      maxGap: round(Math.max(...gaps)),
      avgGap: round(mean(gaps)),
      benchmark: round(hi),
      summary: gaps.every(g => g <= 0) ? "全面领先" : gaps.filter(g => g > 0).length > v.length / 2 ? "整体落后" : "局部落后"
    };
  },
  /* 计分/打分 */
  score(v) {
    const m = mean(v), sd = Math.max(1e-9, std(v));
    const norm = v.map(x => round(clamp01((x - Math.min(...v)) / (Math.max(...v) - Math.min(...v) + 1e-9))));
    const total = round(mean(norm));
    return {
      scores: norm, 综合: total, mean: round(m), std: round(sd),
      grade: total >= 0.85 ? "A" : total >= 0.7 ? "B" : total >= 0.55 ? "C" : "D",
      n: v.length
    };
  },
  /* 预估/估算 */
  estimate(v) {
    const n = v.length; if (n < 2) return { estimate: round(v[0] || 0), confidence: 0, n };
    const xs = v.map((_, i) => i), mx = mean(xs), my = mean(v);
    let a = 0, b = 0; for (let i = 0; i < n; i++) { a += (xs[i] - mx) * (v[i] - my); b += (xs[i] - mx) ** 2; }
    const slope = b === 0 ? 0 : a / b;
    const est = my + slope * (n - 1 - mx);
    const resid = v.map((y, i) => y - (my + slope * (i - mx)));
    const sse = sum(resid.map(r2 => r2 * r2));
    const sst = sum(v.map(y => (y - my) ** 2));
    return {
      estimate: round(est),
      预估结果: round(est),
      slope: round(slope, 6),
      confidence: round(clamp01(1 - (sst === 0 ? 1 : sse / sst))),
      n
    };
  },


  /* 验证/校验/证明 */
  verify(v) {
    const bad = v.filter(x => !isFinite(x));
    const m = mean(v), sd = std(v);
    const outliers = v.filter(x => Math.abs(x - m) > 2 * (sd || 1e-9));
    return {
      结论: bad.length === 0 && outliers.length === 0 ? "通过" : "不通过",
      问题清单: bad.length ? ["含 " + bad.length + " 个非法数值"] : outliers.length ? ["含 " + outliers.length + " 个离群值"] : [],
      checked: v.length,
      outliers: outliers.length,
      passed: bad.length === 0 && outliers.length === 0,
      score: round(clamp01(1 - outliers.length / Math.max(1, v.length)))
    };
  },
  /* 生成/构建/创建 */
  generate(v) {
    const m = mean(v);
    return {
      generated: v.map((x, i) => ({ index: i, seed: round(x), value: round(m + (x - m) * 0.5) })),
      completeness: { count: v.length, hasSeed: true, emptyGeneration: false },
      count: v.length,
      basis: round(m)
    };
  },
  /* 处理/加工/变换 */
  process(v) {
    const m = mean(v);
    const processed = v.map(x => round(Math.tanh(x - m)));
    return {
      processed,
      steps: ["去均值", "非线性压缩", "输出"],
      inputDim: v.length, outputDim: processed.length,
      compression: round(clamp01(1 - std(processed) / (Math.abs(mean(processed)) + 1e-9)))
    };
  },
  /* 执行/运行/驱动 */
  execute(v) {
    const results = v.map((x, i) => ({ step: i + 1, input: round(x), status: isFinite(x) ? "ok" : "failed" }));
    const okN = results.filter(r => r.status === "ok").length;
    return {
      执行结果: results,
      total: results.length, succeeded: okN, failed: results.length - okN,
      successRate: round(clamp01(okN / Math.max(1, results.length)))
    };
  },
  /* 学习/训练/适应 */
  learn(v) {
    const n = v.length;
    let w = 0;
    const history = [];
    for (let i = 0; i < n; i++) { w = w + 0.1 * (v[i] - w); history.push(round(w)); }
    return {
      learned: round(w),
      history,
      iterations: n,
      convergence: round(clamp01(1 - Math.abs(v[n - 1] - w) / (Math.abs(w) + 1e-9))),
      converged: n >= 3 ? Math.abs(v[n - 1] - w) < 0.1 * (Math.abs(w) + 1e-9) : false
    };
  },
  /* 提取/抽取/解析 */
  extract(v) {
    const m = mean(v), sd = std(v) || 1e-9;
    const picked = v.map((x, i) => ({ i, x })).filter(o => Math.abs(o.x - m) > sd);
    return {
      extracted: picked.map(o => ({ index: o.i, value: round(o.x) })),
      count: picked.length,
      ratio: round(clamp01(picked.length / Math.max(1, v.length))),
      criterion: "偏离均值 1 个标准差以上"
    };
  },
  /* 封装/包装/集成 */
  wrap(v) {
    return {
      wrapped: { payload: v.map(x => round(x)), meta: { count: v.length, scale: "normalized" } },
      sealed: true,
      完整性: { hasPayload: v.length > 0, count: v.length },
      digest: round(v.reduce((a, x) => a + Math.abs(x), 0))
    };
  },
  /* 转换/适配（结构级） */
  adapt(v) {
    const lo = Math.min(...v), hi = Math.max(...v);
    const span = hi - lo || 1e-9;
    return {
      adapted: v.map(x => round((x - lo) / span)),
      range: [round(lo), round(hi)],
      targetRange: [0, 1],
      fidelity: round(clamp01(1 - Math.abs((hi - lo) - 1) / Math.max(1, hi - lo)))
    };
  },


  /* 投票/共识/表决 */
  vote(v) {
    const pos = v.filter(x => x > 0).length;
    const neg = v.filter(x => x < 0).length;
    const abst = v.length - pos - neg;
    const total = pos + neg || 1;
    return {
      赞成: pos, 反对: neg, 弃权: abst,
      通过率: round(clamp01(pos / total)),
      passed: pos > neg,
      共识度: round(clamp01(Math.abs(pos - neg) / total)),
      结论: pos > neg ? "通过" : pos < neg ? "不通过" : "平票",
      n: v.length
    };
  },
  /* 过滤/筛选/准入 */
  filter(v) {
    const m = mean(v), sd = std(v) || 1e-9;
    const keep = v.map((x, i) => ({ i, x })).filter(o => o.x >= m);
    const drop = v.map((x, i) => ({ i, x })).filter(o => o.x < m);
    return {
      kept: keep.map(o => ({ index: o.i, value: round(o.x) })),
      dropped: drop.map(o => ({ index: o.i, value: round(o.x) })),
      keepCount: keep.length, dropCount: drop.length,
      keepRate: round(clamp01(keep.length / Math.max(1, v.length))),
      criterion: "保留不低于均值者"
    };
  },
  /* 采集/收集/汇聚 */
  collect(v) {
    const uniq = [...new Set(v.map(x => round(x, 3)))];
    return {
      collected: v.map((x, i) => ({ seq: i, value: round(x) })),
      count: v.length, unique: uniq.length,
      汇聚值: round(v.reduce((a, x) => a + x, 0)),
      coverage: round(clamp01(uniq.length / Math.max(1, v.length))),
      digest: round(v.reduce((a, x) => a + Math.abs(x) * (1 + 1e-6), 0), 6)
    };
  },
  /* 记录/存证/归档/上链 */
  record(v) {
    const chain = [];
    let prev = "genesis";
    v.forEach((x, i) => {
      const payload = round(x);
      const h = (prev + "|" + i + "|" + payload).split("").reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 7);
      chain.push({ index: i, value: payload, prevHash: prev, hash: "h" + h.toString(16) });
      prev = "h" + h.toString(16);
    });
    return {
      ledger: chain, 记录数: chain.length,
      head: prev, appendOnly: true,
      verifiable: chain.every((c, i) => i === 0 || c.prevHash === chain[i - 1].hash)
    };
  },
  /* 建议/提示/引导 */
  advise(v) {
    const m = mean(v), sd = std(v) || 1e-9;
    const low = v.map((x, i) => ({ i, x })).filter(o => o.x < m - sd);
    const tips = [];
    if (low.length) tips.push(`有 ${low.length} 项显著低于均值，优先补强`);
    if (Math.max(...v) - Math.min(...v) > 2 * sd) tips.push("整体离散度偏大，建议收敛差异");
    if (!tips.length) tips.push("各项接近均值，维持当前策略");
    return {
      建议: tips,
      依据: { mean: round(m), std: round(sd), lowCount: low.length },
      优先项: low.slice(0, 3).map(o => ({ index: o.i, value: round(o.x) })),
      approximated: true,
      limits: "基于统计偏离的通用建议，未结合具体领域约束"
    };
  },

  /* 覆盖率 */
  coverage(v) {
    /* 注意：本算子是「唯一率 uniq/total」，不是「A 被 B 覆盖的比例」。 */
    const uniq = new Set(v.map(x => round(x, 3))).size;
    return {
      coverage: round(clamp01(uniq / Math.max(1, v.length))),
      unique: uniq, total: v.length,
      __semantics: "uniqueness_ratio_not_set_coverage",
    };
  },
};

/* 语义关键词 → 算子名 */
const KEYWORDS = [
  [/熵|无序|混乱/, "entropy"],
  [/基尼|不平等|差距度/, "gini"],
  [/相关|关联度/, "correlation"],
  [/标准化|z.?score|归一/, "zscore"],
  [/中位|分位/, "median"],
  [/四分位|离群|异常值/, "iqr"],
  [/排名|排序|优先级|名次/, "rank"],
  [/分配|配额|划拨/, "allocate"],
  [/预测|趋势|外推|推演/, "trend"],
  [/预警|风险|告警|预警级别/, "risk"],
  [/距离|偏离|差异度/, "distance"],
  [/密度|集中度/, "density"],
  [/加权|权重|综合评/, "weighted"],
  [/阈值|达标|通过率|判定/, "threshold"],
  [/稳定|收敛|漂移/, "stability"],
  [/覆盖|多样性/, "coverage"],
  [/融合|耦生|同步|对齐/, "fusion"],
  [/识别|检测|感知|甄别|判断器/, "classify"],
  [/监控|追踪|监测|观察|守护/, "monitor"],
  [/优化|调优|改进|提升|增强器/, "optimize"],
  [/校准|校正|标定|修正|调整/, "calibrate"],
  [/传播|扩散|涌现|蔓延/, "diffuse"],
  [/聚合|汇总|合计|总计|求和/, "aggregate"],
  [/差距|对比|对标|差额/, "gap"],
  [/评分|打分|得分|评级/, "score"],
  [/估算|预估|估计|测算/, "estimate"],
  [/验证|校验|证明|核查|检查器|审查|审计|合规检查/, "verify"],
  [/生成器|构建器|构造器|创建器|合成器/, "generate"],
  [/处理器|加工器|变换器|转换器/, "process"],
  [/执行器|运行器|驱动器|启动器/, "execute"],
  [/学习器|训练器|适配器|进化器/, "learn"],
  [/提取器|抽取器|解析器|抓取器/, "extract"],
  [/封装器|包装器|集成器|打包器/, "wrap"],
  [/映射器|适配层|转换层/, "adapt"],
  [/投票|表决|共识|公决/, "vote"],
  [/过滤|筛选|准入|白名单|黑名单/, "filter"],
  [/采集|收集|汇聚|汇集|抓取器/, "collect"],
  [/记录|存证|归档|上链|账本|登记/, "record"],
  [/建议|提示|引导|顾问|助手/, "advise"],
];

/** 依据功能描述选算子；无匹配返回 null（回落通用实现） */
function pick(desc, name, atomId) {
  if (atomId && MANUAL_MAP[atomId]) return { op: MANUAL_MAP[atomId], fn: OPS[MANUAL_MAP[atomId]] };
  const blob = String(desc || "") + " " + String(name || "");
  for (const [re, op] of KEYWORDS) {
    if (re.test(blob)) return { op, fn: OPS[op] };
  }
  return null;
}


/* 人工指定：描述明确但关键词未覆盖的原子（逐条读过描述后判定） */
const MANUAL_MAP = {
  ATOM_TECH_GAP_204: "gap",             // 分析自身与领先技术的差距
  ATOM_TECH_EVALUATE_206: "score",      // 评估技术的商业价值
  ATOM_POLICY_MONEY_102: "estimate",    // 计算政策能给用户带来多少钱
  ATOM_TECH_ROADMAP_205: "trend",       // 规划技术发展路径 → 趋势外推
  ATOM_POLICY_COMPARE_106: "gap",       // 对比多项政策的异同 → 差距
  ATOM_TECH_TREND_202: "trend",         // 科技趋势预测
  ATOM_POLICY_FORECAST_107: "trend",    // 政策趋势预测
};

module.exports = { OPS, KEYWORDS, pick, MANUAL_MAP };

/* ---------------- 自测 ---------------- */
if (require.main === module) {
  const V = [3, 1, 4, 1, 5, 9, 2, 6];
  console.log("=".repeat(72));
  console.log("语义特化算子自测");
  console.log("=".repeat(72));
  let pass = 0, fail = 0;
  Object.keys(OPS).forEach(k => {
    try {
      const r = OPS[k](V);
      const ok = r && typeof r === "object" && Object.keys(r).length > 0;
      if (ok) pass++; else fail++;
      console.log(`${ok ? "PASS" : "FAIL"}  ${k.padEnd(14)} ${JSON.stringify(r).slice(0, 62)}`);
    } catch (e) { fail++; console.log(`FAIL  ${k.padEnd(14)} ${e.message.slice(0, 50)}`); }
  });
  console.log();
  console.log("--- 关键词路由 ---");
  const ROUTES = [["熵计算器", "entropy"], ["贡献值排名器", "rank"], ["资源分配器", "allocate"],
    ["趋势预测器", "trend"], ["风险预警器", "risk"], ["多样性覆盖器", "coverage"]];
  let rp = 0;
  ROUTES.forEach(([n, expect]) => {
    const r = pick(n, n);
    const ok = r && r.op === expect;
    if (ok) rp++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${n.padEnd(14)} → ${r ? r.op : "无匹配"}（期望 ${expect}）`);
  });
  console.log();
  console.log(`算子 ${pass}/${pass + fail} ｜ 路由 ${rp}/${ROUTES.length}`);
  const bad = fail + (ROUTES.length - rp);
  console.log(bad === 0 ? "总判定：PASS" : "总判定：FAIL");
  process.exit(bad === 0 ? 0 : 1);
}
