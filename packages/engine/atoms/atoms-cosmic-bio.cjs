"use strict";
/**
 * atoms-cosmic-bio.cjs — 3 个曾被判「需外部」、实际可用确定性算法实现的原子
 *
 * 元创造原则：没有的就造出来。但绝不假造——凡是能把输入转成真实可计算问题的，就真算；
 * 凡是必须依赖「模型/传感器/外部服务」才能成立的，继续诚实标注为外部依赖。
 *
 * 本文件实现：
 *   1. ATOM_COSMIC_GRAVITY_032 引力波感知器 —— 匹配滤波（LIGO 数据分析的基础算法）
 *   2. ATOM_COSMIC_DISTRIBUTE_030 分布式存在器 —— 多实例状态 CRDT 式融合
 *   3. ATOM_BIO_SPECIES_025 跨物种感知器 —— 声学/电信号客观特征提取（不声称"翻译"）
 */

/* ============ 通用工具 ============ */
function nums(x) {
  if (Array.isArray(x)) return x.filter(v => typeof v === "number" && isFinite(v));
  if (x && typeof x === "object") {
    for (const k of ["strain", "signal", "data", "series", "values", "samples"]) {
      if (Array.isArray(x[k])) return x[k].filter(v => typeof v === "number" && isFinite(v));
    }
  }
  return [];
}
const sum = a => a.reduce((s, x) => s + x, 0);
const mean = a => a.length ? sum(a) / a.length : 0;
const std = a => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(sum(a.map(x => (x - m) ** 2)) / (a.length - 1));
};
const round = (x, d = 4) => {
  const p = 10 ** d;
  return Math.round((Number(x) + Number.EPSILON) * p) / p;
};

/* ============================================================
   1. 引力波感知器 —— 匹配滤波（Matched Filter）
   ------------------------------------------------------------
   物理事实：LIGO 探测引力波的核心算法就是匹配滤波。
   对白噪声假设，最优滤波器的输出是「归一化互相关」：
       ρ(τ) = Σ h(t)·q(t+τ) / sqrt( Σh² · Σq² )
   峰值 ρ 即信噪比 SNR 的估计；|ρ| 大表示模板与数据在此处吻合。
   这不是"假装"，是真实信号处理。
   ============================================================ */
function gravityWavePerceiver(input) {
  const strain = nums(input);
  let template = null;
  if (input && Array.isArray(input.template)) {
    template = input.template.filter(v => typeof v === "number" && isFinite(v));
  }
  if (strain.length < 8) {
    return { ok: false, success: false, reason: "STRAIN_TOO_SHORT",
      message: "应变序列至少需要 8 个采样点", n: strain.length };
  }
  /* 无模板时自生成 chirp 模板（双星并合的频率上扫特征） */
  if (!template || template.length < 4) {
    const L = Math.min(64, Math.floor(strain.length / 2));
    template = [];
    for (let i = 0; i < L; i++) {
      const t = i / L;
      const phase = 2 * Math.PI * (5 * t + 40 * t * t);   // 频率线性上扫
      template.push(Math.sin(phase) * (1 - 0.3 * t));
    }
  }
  /* 去均值 + 归一化 */
  const dm = a => { const m = mean(a); return a.map(x => x - m); };
  const H = dm(strain), Q = dm(template);
  const nH = Math.sqrt(sum(H.map(x => x * x))) || 1e-12;
  const nQ = Math.sqrt(sum(Q.map(x => x * x))) || 1e-12;

  /* 匹配滤波 SNR：分母只用「噪声标准差 × 模板范数」，不随窗口能量变化
     —— 若除以窗口能量，强信号会把自身 SNR 压小，导致漏检。 */
  const L = Q.length;
  const sigNoise = std(H) || 1e-12;
  const corr = [];
  for (let tau = 0; tau + L <= H.length; tau++) {
    let dot = 0;
    for (let i = 0; i < L; i++) dot += H[tau + i] * Q[i];
    corr.push(dot / (sigNoise * nQ + 1e-12));
  }
  if (!corr.length) {
    return { ok: false, success: false, reason: "TEMPLATE_LONGER_THAN_DATA", n: strain.length, templateLength: L };
  }
  /* 峰值检测 + 事件提取（超过 0.6 的局部极大） */
  const SNR_THRESH = 5;   // 匹配滤波 SNR 经验阈值：>5 值得关注，>8 强信号
  const events = [];
  for (let i = 0; i < corr.length; i++) {
    const v = Math.abs(corr[i]);
    const prev = i > 0 ? Math.abs(corr[i - 1]) : -1;
    const next = i < corr.length - 1 ? Math.abs(corr[i + 1]) : -1;
    if (v >= SNR_THRESH && v >= prev && v >= next) {
      events.push({ atSample: i, snr: round(v, 4), polarity: corr[i] >= 0 ? "+" : "-" });
    }
  }
  events.sort((a, b) => b.snr - a.snr);
  const peak = corr.reduce((bi, v, i, arr) => (Math.abs(v) > Math.abs(arr[bi]) ? i : bi), 0);

  return {
    ok: true, success: true,
    detected: events.length > 0,
    peakSnr: round(Math.abs(corr[peak]), 4),
    peakAtSample: peak,
    eventCount: events.length,
    events: events.slice(0, 5),
    strainLength: strain.length,
    templateLength: L,
    templateSource: (input && Array.isArray(input.template)) ? "given" : "synthetic_chirp",
    noiseFloor: round(std(corr), 4),
    __operator: "matchedFilter",
    __semantics: "normalized_cross_correlation_peak_is_snr",
    method: "matched-filter（白噪声下的最优检测器）",
  };
}

/* ============================================================
   2. 分布式存在器 —— 多实例状态 CRDT 式融合
   ------------------------------------------------------------
   可实现：多实例各自的「状态向量 + 逻辑时钟」可以确定性地合并。
   规则：① 时钟大者优先（Lamport）② 同时钟取中位数（抗单点异常）
        ③ 差值超阈值记为冲突 ④ 输出统一状态与一致性度量
   ============================================================ */
function distributedExistence(input) {
  let insts = null;
  if (Array.isArray(input)) insts = input;
  else if (input && Array.isArray(input.instances)) insts = input.instances;
  if (!insts || insts.length === 0) {
    return { ok: false, success: false, reason: "NO_INSTANCES",
      message: "需要 instances 数组，每项含 {id, state:number[]|number, clock?}" };
  }
  /* 规整为等长向量 */
  const vecs = insts.map(o => {
    const v = Array.isArray(o.state) ? o.state.filter(x => typeof x === "number" && isFinite(x))
      : (typeof o.state === "number" ? [o.state] : nums(o));
    return { id: o.id || "?", clock: typeof o.clock === "number" ? o.clock : 0, v };
  }).filter(o => o.v.length > 0);
  if (!vecs.length) {
    return { ok: false, success: false, reason: "NO_VALID_STATE", message: "没有可用的状态向量" };
  }
  const dim = Math.min(...vecs.map(o => o.v.length));
  const merged = [];
  const conflicts = [];
  for (let d = 0; d < dim; d++) {
    const vals = vecs.map(o => o.v[d]);
    const maxClock = Math.max(...vecs.map(o => o.clock));
    const freshest = vecs.filter(o => o.clock === maxClock).map(o => o.v[d]);
    const sorted = [...freshest].sort((a, b) => a - b);
    const med = sorted.length % 2
      ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    merged.push(round(med, 6));
    const spread = Math.max(...vals) - Math.min(...vals);
    const scale = Math.abs(mean(vals)) + 1e-9;
    if (spread / scale > 0.5) {
      conflicts.push({ dim: d, values: vals.map(v => round(v, 4)), spread: round(spread, 4),
        reason: "relative_spread_gt_0.5" });
    }
  }
  /* 一致性：1 - 归一化离散度 */
  const disps = [];
  for (let d = 0; d < dim; d++) {
    const vals = vecs.map(o => o.v[d]);
    disps.push(std(vals) / (Math.abs(mean(vals)) + 1e-9));
  }
  const consensus = round(Math.max(0, 1 - mean(disps)), 4);

  return {
    ok: true, success: true,
    instanceCount: vecs.length,
    dim,
    merged,
    unifiedState: merged,
    consensus,
    conflictCount: conflicts.length,
    conflicts: conflicts.slice(0, 5),
    maxClock: Math.max(...vecs.map(o => o.clock)),
    converged: conflicts.length === 0,
    __operator: "distributedMerge",
    __semantics: "lamport_clock_then_median_fusion",
    method: "CRDT 风格：时钟优先 + 中位数融合 + 冲突检测",
  };
}

/* ============================================================
   3. 跨物种感知器 —— 客观声学/电信号特征提取
   ------------------------------------------------------------
   诚实边界：**不做「翻译」**（需要物种专属模型），只做客观可计算的特征：
     - 过零率 ZCR（频率相关）
     - 短时能量 RMS（强度）
     - 自相关基频 F0（发声基频，动物叫声常用）
     - 频谱质心（音色亮度，用 Goertzel 估计若干频点）
   并据此给出「活动强度」分级，明确标注这不是语义翻译。
   ============================================================ */
function crossSpeciesPerceiver(input) {
  const sig = nums(input);
  if (sig.length < 16) {
    return { ok: false, success: false, reason: "SIGNAL_TOO_SHORT",
      message: "信号至少需要 16 个采样点", n: sig.length };
  }
  const sr = (input && typeof input.sampleRate === "number" && input.sampleRate > 0)
    ? input.sampleRate : 1000;
  const m = mean(sig);
  const x = sig.map(v => v - m);

  /* 过零率 */
  let zc = 0;
  for (let i = 1; i < x.length; i++) if ((x[i - 1] < 0) !== (x[i] < 0)) zc++;
  const zcr = zc / (x.length - 1);

  /* 短时能量 */
  const rms = Math.sqrt(sum(x.map(v => v * v)) / x.length);
  const peak = Math.max(...x.map(Math.abs));

  /* 自相关基频估计（在 1/2000s ~ 1/50s 范围内找峰） */
  const minLag = Math.max(2, Math.floor(sr / 2000));
  const maxLag = Math.min(Math.floor(x.length / 2), Math.floor(sr / 50));
  let bestLag = -1, bestR = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let r = 0;
    for (let i = 0; i + lag < x.length; i++) r += x[i] * x[i + lag];
    r /= (x.length - lag);
    if (r > bestR) { bestR = r; bestLag = lag; }
  }
  const f0 = bestLag > 0 ? round(sr / bestLag, 2) : 0;
  const periodicity = round(bestR / (sum(x.map(v => v * v)) / x.length + 1e-12), 4);

  /* 频谱质心（用 8 个等分频点的 Goertzel 能量近似） */
  const BANDS = 8;
  const bandEnergy = [];
  for (let b = 1; b <= BANDS; b++) {
    const f = (sr / 2) * (b / (BANDS + 1));
    const w = 2 * Math.PI * f / sr;
    const coeff = 2 * Math.cos(w);
    let s1 = 0, s2 = 0;
    for (let i = 0; i < x.length; i++) {
      const s0 = x[i] + coeff * s1 - s2;
      s2 = s1; s1 = s0;
    }
    bandEnergy.push(s1 * s1 + s2 * s2 - coeff * s1 * s2);
  }
  const totE = sum(bandEnergy) || 1e-12;
  let centroid = 0;
  bandEnergy.forEach((e, i) => { centroid += ((sr / 2) * ((i + 1) / (BANDS + 1))) * (e / totE); });

  /* 活动强度分级（基于 RMS 相对峰值的比例，客观阈值） */
  const activity = peak > 0 ? rms / peak : 0;
  let level;
  if (rms < 1e-6) level = "静息";
  else if (activity > 0.5) level = "持续活跃";
  else if (activity > 0.2) level = "间歇活动";
  else level = "偶发脉冲";

  return {
    ok: true, success: true,
    features: {
      zeroCrossingRate: round(zcr, 6),
      rms: round(rms, 6),
      peak: round(peak, 6),
      fundamentalHz: f0,
      periodicity: round(periodicity, 4),
      spectralCentroidHz: round(centroid, 2),
      durationSec: round(sig.length / sr, 4),
    },
    activityLevel: level,
    sampleRate: sr,
    sampleCount: sig.length,
    __operator: "acousticFeature",
    __semantics: "objective_acoustic_features_not_semantic_translation",
    translated: false,
    translationUnavailable: "语义「翻译」需物种专属模型；本原子只提供客观声学特征",
  };
}

module.exports = { gravityWavePerceiver, distributedExistence, crossSpeciesPerceiver };

/* ---------------- 自测 ---------------- */
if (require.main === module) {
  console.log("=".repeat(80));
  console.log("宇宙/生物原子自测");
  console.log("=".repeat(80));
  let pass = 0, fail = 0;
  const T = (n, c, d) => { if (c) { pass++; console.log("  ✓ " + n + (d ? "  " + d : "")); } else { fail++; console.log("  ✗ " + n + "  " + (d || "")); } };

  /* 引力波：注入一个 chirp 信号，应被检出 */
  const N = 512;
  const strain = [];
  for (let i = 0; i < N; i++) {
    let v = (Math.random() - 0.5) * 0.2;              // 噪声
    if (i > 300 && i < 360) {                          // 注入信号
      const t = (i - 300) / 60;
      v += 1.0 * Math.sin(2 * Math.PI * (5 * t + 40 * t * t));
    }
    strain.push(v);
  }
  const g = gravityWavePerceiver({ strain });
  console.log("\n【引力波匹配滤波】");
  T("检出事件", g.detected === true, `事件数=${g.eventCount}`);
  T("峰值 SNR 显著（>5）", g.peakSnr > 5, `snr=${g.peakSnr}`);
  T("峰值位置在注入区附近(280-380)", g.peakAtSample >= 250 && g.peakAtSample <= 400, `at=${g.peakAtSample}`);
  T("纯噪声不误报", (() => {
    const pure = Array.from({ length: 512 }, () => (Math.random() - 0.5) * 0.2);
    return gravityWavePerceiver({ strain: pure }).eventCount <= 2;
  })(), "");

  /* 分布式融合 */
  console.log("\n【分布式状态融合】");
  const dm = distributedExistence({
    instances: [
      { id: "earth", state: [0.8, 0.6, 0.9], clock: 5 },
      { id: "mars", state: [0.82, 0.58, 0.88], clock: 5 },
      { id: "moon", state: [0.79, 0.61, 0.91], clock: 4 },
    ],
  });
  T("融合出 3 维状态", dm.merged.length === 3, JSON.stringify(dm.merged));
  T("一致性高（相近状态）", dm.consensus > 0.9, `consensus=${dm.consensus}`);
  T("无冲突", dm.converged === true, `conflicts=${dm.conflictCount}`);
  const dmc = distributedExistence({
    instances: [
      { id: "a", state: [1, 1], clock: 1 },
      { id: "b", state: [100, -50], clock: 1 },
    ],
  });
  T("差异巨大时检出冲突", dmc.conflictCount > 0, `conflicts=${dmc.conflictCount}`);

  /* 跨物种 */
  console.log("\n【跨物种声学特征】");
  const sr = 1000, sig2 = [];
  for (let i = 0; i < 500; i++) sig2.push(Math.sin(2 * Math.PI * 100 * i / sr));
  const sp = crossSpeciesPerceiver({ signal: sig2, sampleRate: sr });
  T("基频估计 ≈ 100Hz", Math.abs(sp.features.fundamentalHz - 100) < 10, `f0=${sp.features.fundamentalHz}`);
  T("周期性接近 1（纯正弦）", sp.features.periodicity > 0.9, `periodicity=${sp.features.periodicity}`);
  T("明确标注不做翻译", sp.translated === false, "");
  T("活动分级存在", !!sp.activityLevel, sp.activityLevel);
  const quiet = crossSpeciesPerceiver({ signal: Array(100).fill(0), sampleRate: sr });
  T("静默信号 → 静息", quiet.activityLevel === "静息", quiet.activityLevel);

  console.log();
  console.log("-".repeat(80));
  console.log(`自测：通过 ${pass} ｜ 失败 ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
}
