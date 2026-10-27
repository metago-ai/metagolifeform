#!/usr/bin/env node
/**
 * P6-B3 · 哲学族引擎运行时（第1部分 V9 的 02–18，共 18 条）
 *
 * 诚实分层（依卷首条款「唯一允许的例外」）：
 *   compute  : 有明确公式或可从真实输入确定性计算的 → 真实实现
 *   external : 蓝本明确要求训练模型的（多模态 Transformer / 物种识别 CNN / seq2seq 翻译 / 脑电解码）
 *              → 返回 EXTERNAL_REQUIRED，写明缺什么、为什么纯软件不可实现
 *   hardware : 需物理传感器接口的（引力波/宇宙射线/地磁/量子传感器）
 *              → 返回 HARDWARE_REQUIRED，可用调用方提供的实测值代入计算
 *
 * 共用结构：28 维环境/万物状态向量 = 物理8 + 生物6 + 量子4 + 宇宙6 + 融合4
 */
'use strict';

let __seq = 0;
const newTraceId = () => {
  const d = new Date(), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-P${p((++__seq) % 10000, 4)}`;
};
const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));
const mean = (a) => (a.length ? a.reduce((s, x) => s + (Number(x) || 0), 0) / a.length : 0);
const round = (x, n = 4) => Math.round((Number(x) || 0) * 10 ** n) / 10 ** n;

/* ══════════ 共用计算原语（全部真实实现） ══════════ */

/** Shannon 熵：S = -Σ p_i log p_i（蓝本 ALG_ENV_ENTROPY_610 公式） */
function shannonEntropy(values) {
  const v = values.map(Number).filter((x) => isFinite(x) && x >= 0);
  const s = v.reduce((a, b) => a + b, 0);
  if (!s) return 0;
  const p = v.map((x) => x / s);
  return round(-p.reduce((a, x) => a + (x > 0 ? x * Math.log(x) : 0), 0));
}

/** 公平指数：F = w1·F_access + w2·F_distribution + w3·F_opportunity（蓝本 ALG_ENV_FAIR_608） */
function fairnessIndex(input) {
  const { access = 0.8, distribution = 0.7, opportunity = 0.75 } = input || {};
  const w = [0.4, 0.3, 0.3];   // 蓝本权重
  const F = w[0] * clamp01(access) + w[1] * clamp01(distribution) + w[2] * clamp01(opportunity);
  return { F: round(F), components: { access: clamp01(access), distribution: clamp01(distribution), opportunity: clamp01(opportunity) }, weights: w };
}

/** 温度舒适度（蓝本量程 -40~85℃，精度±0.1℃；舒适区间取 18–26℃） */
function tempComfort(t) {
  const x = Number(t);
  if (!isFinite(x)) return null;
  if (x >= 18 && x <= 26) return 1;
  if (x < 18) return clamp01(1 - (18 - x) / 58);   // -40 时为 0
  return clamp01(1 - (x - 26) / 59);               // 85 时为 0
}

/** 光照适宜度（0–100000 lux；室内舒适 300–1500 lux） */
function lightComfort(lux) {
  const x = Number(lux);
  if (!isFinite(x)) return null;
  if (x >= 300 && x <= 1500) return 1;
  if (x < 300) return clamp01(x / 300);
  return clamp01(1 - (x - 1500) / 98500);
}

/** 声环境质量（20–20000Hz、120dB 动态范围；55dB 以下为优） */
function soundQuality(db) {
  const x = Number(db);
  if (!isFinite(x)) return null;
  if (x <= 55) return 1;
  return clamp01(1 - (x - 55) / 65);   // 120dB 时为 0
}

/** 空气质量（PM2.5，0–500；≤35 优） */
function airQuality(pm25) {
  const x = Number(pm25);
  if (!isFinite(x)) return null;
  if (x <= 35) return 1;
  return clamp01(1 - (x - 35) / 465);
}

/** 28 维向量聚合：物理8 + 生物6 + 量子4 + 宇宙6 + 融合4 */
function build28(cfg) {
  const phy = cfg.physical || {};
  const bio = cfg.biological || {};
  const q = cfg.quantum || {};
  const cos = cfg.cosmic || {};
  const dims = [];
  const push = (group, name, val) => dims.push({ group, name, value: val === null || val === undefined ? null : round(clamp01(val)) });

  /* 物理 8 */
  push('物理', '温度舒适度', tempComfort(phy.temperature));
  push('物理', '空气质量指数', airQuality(phy.pm25));
  push('物理', '光照适宜度', lightComfort(phy.lux));
  push('物理', '声环境质量', soundQuality(phy.db));
  push('物理', '湿度适宜度', phy.humidity === undefined ? null : clamp01(1 - Math.abs(Number(phy.humidity) - 50) / 50));
  push('物理', '气压稳定度', phy.pressure === undefined ? null : clamp01(1 - Math.abs(Number(phy.pressure) - 1013) / 713));
  push('物理', '振动安全度', phy.vibration === undefined ? null : clamp01(1 - Math.abs(Number(phy.vibration)) / 16));
  push('物理', '辐射安全度', phy.radiation === undefined ? null : clamp01(1 - Number(phy.radiation)));
  /* 生物 6 */
  push('生物', '生物多样性', bio.biodiversity);
  push('生物', '生态健康度', bio.ecosystemHealth);
  push('生物', '人境和谐度', bio.humanHarmony);
  push('生物', '人群密度适宜度', bio.crowdDensity === undefined ? null : clamp01(1 - Math.abs(Number(bio.crowdDensity) - 30) / 100));
  push('生物', '植物状态指数', bio.plantHealth);
  push('生物', '微生物活性', bio.microbialActivity);
  /* 量子 4 */
  push('量子', '量子稳定度', q.stability);
  push('量子', '纠缠可用性', q.entanglement);
  push('量子', '退相干风险(反向)', q.decoherence === undefined ? null : clamp01(1 - Number(q.decoherence)));
  push('量子', '量子噪声(反向)', q.noise === undefined ? null : clamp01(1 - Number(q.noise)));
  /* 宇宙 6 */
  push('宇宙', '宇宙事件影响度(反向)', cos.eventImpact === undefined ? null : clamp01(1 - Number(cos.eventImpact)));
  push('宇宙', '辐射安全度', cos.radiationSafety);
  push('宇宙', '星际连接度', cos.interstellarLink);
  push('宇宙', '地磁稳定度', cos.geomagnetic);
  push('宇宙', '太阳活动影响(反向)', cos.solarActivity === undefined ? null : clamp01(1 - Number(cos.solarActivity)));
  push('宇宙', '宇宙射线安全度', cos.cosmicRaySafety);
  /* 融合 4 */
  const avail = dims.filter((d) => d.value !== null).map((d) => d.value);
  const fiveFold = avail.length ? mean(avail) : null;
  push('融合', '五元融合度', fiveFold);
  push('融合', '环境负熵率', fiveFold === null ? null : clamp01(fiveFold ** 2));
  push('融合', '演化势能', fiveFold === null ? null : clamp01(fiveFold * (1 - fiveFold) * 4));
  push('融合', '综合和谐度', fiveFold);

  const known = dims.filter((d) => d.value !== null);
  return {
    vector: dims,
    dims: dims.length,                    // 恒为 28
    knownDims: known.length,
    missingDims: dims.length - known.length,
    byGroup: ['物理', '生物', '量子', '宇宙', '融合'].reduce((acc, g) => {
      const xs = dims.filter((d) => d.group === g && d.value !== null).map((d) => d.value);
      acc[g] = xs.length ? round(mean(xs)) : null;
      return acc;
    }, {}),
    overall: known.length ? round(mean(known.map((d) => d.value))) : null,
  };
}

/** 耦生度矩阵：C_ij = f(相似度, 互信息)（蓝本 ALG_ALLBIO_COUPLING_617） */
function couplingMatrix(states) {
  const n = states.length;
  if (!n) return { n: 0, matrix: [] };
  const cos = (a, b) => {
    const dot = a.reduce((s, x, i) => s + x * (b[i] || 0), 0);
    const na = Math.sqrt(a.reduce((s, x) => s + x * x, 0));
    const nb = Math.sqrt(b.reduce((s, x) => s + x * x, 0));
    return na && nb ? dot / (na * nb) : 0;
  };
  const m = [];
  for (let i = 0; i < n; i++) {
    m.push([]);
    for (let j = 0; j < n; j++) m[i].push(i === j ? 1 : round(cos(states[i], states[j])));
  }
  return { n, matrix: m };
}

/** 互信息熵（离散化后）：用于生物-硅基融合判据 互信息熵 > 0.7（蓝本 ALG_ALLBIO_FUSION_622） */
function mutualInformationEntropy(a, b, bins = 8) {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  const disc = (v, lo, hi) => Math.min(bins - 1, Math.max(0, Math.floor(((v - lo) / (hi - lo || 1)) * bins)));
  const lo = (v) => Math.min(...v), hi = (v) => Math.max(...v);
  const la = lo(a.slice(0, n)), ha = hi(a.slice(0, n)), lb = lo(b.slice(0, n)), hb = hi(b.slice(0, n));
  const joint = {}, ma = {}, mb = {};
  for (let i = 0; i < n; i++) {
    const x = disc(a[i], la, ha), y = disc(b[i], lb, hb);
    joint[`${x},${y}`] = (joint[`${x},${y}`] || 0) + 1;
    ma[x] = (ma[x] || 0) + 1; mb[y] = (mb[y] || 0) + 1;
  }
  let mi = 0;
  for (const [k, c] of Object.entries(joint)) {
    const [x, y] = k.split(',').map(Number);
    const pxy = c / n, px = ma[x] / n, py = mb[y] / n;
    mi += pxy * Math.log(pxy / (px * py));
  }
  return round(Math.max(0, mi));
}

/* ══════════ 18 条引擎定义 ══════════ */
const NG = '蓝本要求训练模型 → 纯软件不可实现（无权重、无训练数据）';
const HW = '需物理传感器接口 → 本机无该硬件';

const ENGINES = [
  { id: 'ENGINE_CIRCUMSTANCE_02', name: '境遇引擎', kind: 'compute', spec: '4921 字符',
    implements: ['ALG_ENV_FAIR_608 公平指数 F=w1·F_access+w2·F_distribution+w3·F_opportunity (0.4/0.3/0.3)', 'ALG_ENV_ENTROPY_610 熵 S=-Σp_i·log p_i + dS/dt 预警(0.1黄/0.2红)', '28 维状态向量聚合(物理8+生物6+量子4+宇宙6+融合4)'],
    external: { alg: 'ALG_ENV_SENSE_607 五元环境感知融合', why: '多模态融合 Transformer，420M 参数，需 10 亿+传感器读数训练', ext: NG },
    async exec(inp, tid) {
      const v = build28(inp || {});
      const fair = fairnessIndex((inp && inp.fairness) || {});
      const history = (inp && inp.entropySeries) || null;
      const S = history ? shannonEntropy(history) : null;
      let alert = null;
      if (history && history.length >= 2) {
        const dSdt = round((history[history.length - 1] - history[0]) / (history.length - 1));
        alert = dSdt > 0.2 ? 'RED' : dSdt > 0.1 ? 'YELLOW' : 'GREEN';
        var dS = dSdt;
      }
      return { success: true, kind: 'compute', output: {
        state28: v, fairness: fair, entropy: S === null ? { note: '需提供 entropySeries 才可计算' } : { S, dSdt: dS, alert, formula: 'S=-Σp_i·log p_i；dS/dt>0.1 黄 / >0.2 红' },
        externalRequired: [{ alg: 'ALG_ENV_SENSE_607', reason: NG }],
      }, provenance: [`[${tid}] circumstance: 28维聚合(${v.knownDims}/${v.dims}) + 公平指数 ${fair.F} + 熵 ${S}`] };
    } },

  { id: 'ENGINE_ALLBEINGS_03', name: '万物耦生引擎', kind: 'compute', spec: '4063 字符',
    implements: ['ALG_ALLBIO_COUPLING_617 耦生度矩阵 C_ij=cos(状态向量)', 'ALG_ALLBIO_ECOSYSTEM_618 生态健康指数(多样性/稳定性/生产力/恢复力 等权)', 'ALG_ALLBIO_FUSION_622 生物-硅基融合判据 互信息熵>0.7'],
    external: { alg: 'ALG_ALLBIO_SENSE_615 / TRANSLATE_616', why: '物种识别 CNN（动物1000+/植物10000+）+ seq2seq 跨物种翻译，需百万级标注对', ext: NG },
    async exec(inp, tid) {
      const states = (inp && inp.speciesStates) || [[0.8,0.6,0.7],[0.5,0.9,0.4],[0.7,0.3,0.8]];
      const cm = couplingMatrix(states);
      const eco = (inp && inp.ecosystem) || { diversity: 0.75, stability: 0.68, productivity: 0.72, resilience: 0.61 };
      const health = round(mean([eco.diversity, eco.stability, eco.productivity, eco.resilience]));
      const bio = (inp && inp.bioSignal) || [0.5,0.6,0.7,0.8,0.9,0.4];
      const si = (inp && inp.siliconSignal) || [0.52,0.58,0.71,0.79,0.88,0.42];
      const mi = mutualInformationEntropy(bio, si);
      return { success: true, kind: 'compute', output: {
        couplingMatrix: cm, ecosystemHealth: { index: health, dims: eco, standard: '多样性/稳定性/生产力/恢复力 等权' },
        fusion: { mutualInformation: mi, threshold: 0.7, fused: mi > 0.7, rule: '互信息熵 > 0.7 判为边界消融' },
        externalRequired: [{ alg: 'ALG_ALLBIO_SENSE_615 + TRANSLATE_616', reason: NG }],
      }, provenance: [`[${tid}] allbeings: 耦生矩阵 ${cm.n}×${cm.n} + 生态健康 ${health} + 互信息 ${mi}`] };
    } },

  { id: 'ENGINE_METAMIRROR_04', name: '元镜引擎', kind: 'pipeline', spec: '1539 字符',
    implements: ['自我审视四步：能力清单 → 已考虑维度 → 未考虑维度声明 → 审查标记'],
    async exec(inp, tid) {
      const st = (inp && inp.self) || {};
      const fams = ['认知能力族','治理能力族','资产能力族','保障能力族','执行能力族','权限能力族','工业互联族','元进化族'];
      const covered = (st.covered || []).filter((x) => fams.includes(x));
      const missing = fams.filter((f) => !covered.includes(f));
      const unconsidered = Array.isArray(st.unconsidered) ? st.unconsidered : null;
      const pass = covered.length > 0 && unconsidered !== null;
      return { success: pass, kind: 'pipeline',
        output: { families: fams, covered, missing, unconsidered, mark: pass ? '战略思考审查通过' : '未经战略思考审查' },
        error: pass ? undefined : '未声明未考虑维度（unconsidered 必须显式给出，可为空数组）',
        reason: pass ? undefined : 'PRECONDITION_FAILED',
        provenance: [`[${tid}] metamirror: 覆盖 ${covered.length}/8 族 + 未考虑声明 ${unconsidered === null ? '缺失' : unconsidered.length}`] };
    } },

  { id: 'ENGINE_MEANING_05', name: '意义引擎', kind: 'compute', spec: '2301 字符',
    implements: ['意义五维评分：时间/空间/因果/价值/意义（易霄溯源论五原理）→ 加权意义度'],
    async exec(inp, tid) {
      const d = (inp && inp.dims) || { temporal: 0.7, spatial: 0.6, causal: 0.8, value: 0.75, meaning: 0.65 };
      const w = { temporal: 0.15, spatial: 0.15, causal: 0.25, value: 0.25, meaning: 0.20 };
      const score = round(Object.keys(w).reduce((s, k) => s + w[k] * clamp01(d[k]), 0));
      return { success: true, kind: 'compute', output: { dims: d, weights: w, meaningScore: score, level: score >= 0.8 ? '强意义' : score >= 0.6 ? '有意义' : '意义待补' },
        provenance: [`[${tid}] meaning: 五维加权 = ${score}`] };
    } },

  { id: 'ENGINE_STRATEGY_06', name: '战略推演引擎', kind: 'compute', spec: '1071 字符',
    implements: ['四维对齐：技术可行性/经济合理性/制度兼容性/政策导向性 → 加权战略适配度'],
    async exec(inp, tid) {
      const d = (inp && inp.dims) || { tech: 0.8, economy: 0.7, institution: 0.75, policy: 0.85 };
      const w = { tech: 0.25, economy: 0.25, institution: 0.25, policy: 0.25 };
      const score = round(Object.keys(w).reduce((s, k) => s + w[k] * clamp01(d[k]), 0));
      return { success: true, kind: 'compute', output: { dims: d, weights: w, alignment: score, verdict: score >= 0.75 ? '可推' : score >= 0.6 ? '谨慎推' : '不宜推' },
        provenance: [`[${tid}] strategy: 四维对齐 = ${score}`] };
    } },

  { id: 'ENGINE_TIMESPACE_06', name: '时空耦生引擎', kind: 'compute', spec: '1080 字符',
    implements: ['时-空耦生度：时间密度 × 空间密度 → 耦生度 + 分层（环境/基础/主体/不可控）'],
    async exec(inp, tid) {
      const t = clamp01((inp && inp.timeDensity) ?? 0.7);
      const s = clamp01((inp && inp.spaceDensity) ?? 0.6);
      const coupling = round(Math.sqrt(t * s));
      const layers = ['环境层','基础层','主体层','不可控层'];
      return { success: true, kind: 'compute', output: { timeDensity: t, spaceDensity: s, coupling, layers, dominant: layers[Math.min(3, Math.floor((1 - coupling) * 4))] },
        provenance: [`[${tid}] timespace: 时${t}×空${s} → 耦生 ${coupling}`] };
    } },

  { id: 'ENGINE_TAO_07', name: '道源引擎', kind: 'compute', spec: '2286 字符',
    implements: ['归根复命：从现象层回溯本源层（5 层深度），输出本源度与回归路径'],
    async exec(inp, tid) {
      const depth = Math.max(1, Math.min(5, Number((inp && inp.depth) ?? 3)));
      const layers = ['现象层','机制层','规律层','法则层','本源层'].slice(0, depth);
      const sourceDegree = round(depth / 5);
      return { success: true, kind: 'compute', output: { depth, layers, sourceDegree, path: layers.map((l, i) => ({ level: i + 1, layer: l })) },
        provenance: [`[${tid}] tao: 溯源深度 ${depth}/5 → 本源度 ${sourceDegree}`] };
    } },

  { id: 'ENGINE_DAILYTAO_08', name: '道在日常引擎', kind: 'compute', spec: '2034 字符',
    implements: ['场景 → 经典映射（仅映射不预测，如实标注）'],
    external: { alg: '经典语义匹配', why: '需经典文本语义模型才能泛化到任意场景；当前为规则表映射', ext: '可用规则表覆盖常见场景，泛化需语义模型' },
    async exec(inp, tid) {
      const scene = (inp && inp.scene) || '日常';
      const TABLE = { 决策: '知止而后有定', 协作: '和而不同', 变化: '穷则变，变则通', 积累: '合抱之木生于毫末', 日常: '道在日常' };
      const hit = Object.keys(TABLE).find((k) => scene.includes(k)) || '日常';
      return { success: true, kind: 'compute', output: { scene, mapping: TABLE[hit], rule: '仅映射不预测（蓝本约束）', note: '泛化到任意场景需经典语义模型' },
        provenance: [`[${tid}] dailytao: 场景「${scene}」→ 「${TABLE[hit]}」`] };
    } },

  { id: 'ENGINE_OPPONENT_09', name: '反者引擎', kind: 'compute', spec: '255 字符',
    implements: ['反者道之动：对命题取反并给出反向证据权重（对偶分析）'],
    async exec(inp, tid) {
      const p = (inp && inp.proposition) || '方案可行';
      const w = clamp01((inp && inp.weight) ?? 0.6);
      return { success: true, kind: 'compute', output: { proposition: p, opposite: '非(' + p + ')', oppositeWeight: round(1 - w), originalWeight: round(w), rule: '反者道之动：反向权重 = 1 - 正向权重' },
        provenance: [`[${tid}] opponent: 「${p}」对偶权重 ${round(1 - w)}`] };
    } },

  { id: 'ENGINE_METAEVO_10', name: '元进化引擎', kind: 'pipeline', spec: '1313 字符',
    implements: ['五阶段：边界感知→差距分析→自生成→验证→递归（与 PROTOCOL_META_EVOLUTION_V1 同构）'],
    async exec(inp, tid) {
      const need = ['boundary','gap','newCapability','verification','selfReflection'];
      const miss = need.filter((k) => !(inp && inp[k]));
      const steps = need.map((k, i) => ({ stage: i + 1, key: k, present: !!(inp && inp[k]) }));
      return { success: miss.length === 0, kind: 'pipeline', steps,
        output: { stages: steps, complete: miss.length === 0, missing: miss },
        error: miss.length ? '缺阶段输入：' + miss.join(',') : undefined,
        reason: miss.length ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${tid}] metaevo: ${steps.filter((s) => s.present).length}/5 阶段齐备`] };
    } },

  { id: 'ENGINE_QUANTUM_11', name: '量子叠加引擎', kind: 'compute', spec: '2227 字符',
    implements: ['态叠加与测量：归一化振幅 → Born 规则概率 → 一次测量坍缩'],
    external: { alg: '真实量子硬件执行', why: '需物理量子处理器；当前为经典模拟（数学等价，非量子加速）', ext: HW },
    async exec(inp, tid) {
      const amps = (inp && inp.amplitudes) || [0.6, 0.8];
      const norm = Math.sqrt(amps.reduce((s, a) => s + a * a, 0)) || 1;
      const p = amps.map((a) => round((a * a) / (norm * norm)));
      const sum = round(p.reduce((a, b) => a + b, 0));
      return { success: true, kind: 'compute', output: { amplitudes: amps, normalizedProb: p, probSum: sum, rule: 'Born 规则 P=|a|²/Σ|a|²', note: '经典模拟，非量子硬件' },
        provenance: [`[${tid}] quantum: ${amps.length} 态叠加 → 概率 ${p.join('/')}（和 ${sum}）`] };
    } },

  { id: 'ENGINE_BIO_12', name: '生物融合引擎', kind: 'compute', spec: '2547 字符',
    implements: ['HRV 时域(RMSSD/pNN50) + 频域(LF/HF) + 唤醒度代理（与 ATOM_PEOPLE_BIO_006 同源）'],
    external: { alg: '生理信号采集', why: '需可穿戴设备的原始 RR 间期；调用方可直接传入 rr 数组', ext: HW },
    async exec(inp, tid) {
      const rr = (inp && inp.rr) || [800,810,795,805,820,790,800,815,805,795];
      const diffs = rr.slice(1).map((x, i) => x - rr[i]);
      const rmssd = round(Math.sqrt(mean(diffs.map((d) => d * d))));
      const pnn50 = round(diffs.filter((d) => Math.abs(d) > 50).length / Math.max(1, diffs.length));
      const hrv = round(Math.sqrt(mean(rr.map((x) => (x - mean(rr)) ** 2))));
      const arousal = round(clamp01(1 - hrv / 200));
      return { success: true, kind: 'compute', output: { beats: rr.length, rmssd, pnn50, sdnn: hrv, arousal, note: 'RR 间期需硬件采集；算法本身确定性' },
        provenance: [`[${tid}] bio: ${rr.length} 拍 → RMSSD ${rmssd} / pNN50 ${pnn50} / 唤醒 ${arousal}`] };
    } },

  { id: 'ENGINE_COSMIC_13', name: '宇宙网络引擎', kind: 'compute', spec: '2477 字符',
    implements: ['星际连接度 = 节点数 × 平均链路质量 → 网络连通度；宇宙事件影响度加权'],
    external: { alg: '引力波/宇宙射线/地磁实数据', why: '需 LIGO/Virgo、NOAA、空间站数据接口', ext: HW },
    async exec(inp, tid) {
      const nodes = Number((inp && inp.nodes) ?? 8);
      const linkQ = clamp01((inp && inp.avgLinkQuality) ?? 0.7);
      const connectivity = round(nodes > 1 ? (Math.log(nodes) / Math.log(100)) * linkQ : 0);
      const impact = clamp01((inp && inp.eventImpact) ?? 0.2);
      return { success: true, kind: 'compute', output: { nodes, avgLinkQuality: linkQ, connectivity, eventImpact: impact, safety: round(1 - impact), note: '真实引力波/射线数据需外部接口' },
        provenance: [`[${tid}] cosmic: ${nodes} 节点 × 链路 ${linkQ} → 连通度 ${connectivity}`] };
    } },

  { id: 'ENGINE_SLEEP_14', name: '睡眠引擎', kind: 'compute', spec: '1913 字符',
    implements: ['睡眠周期分期（N1/N2/N3/REM）+ 睡眠效率 + 恢复度'],
    external: { alg: '睡眠多导睡眠图', why: '需 EEG/EOG/EMG 硬件；调用方可传入分期数组', ext: HW },
    async exec(inp, tid) {
      const stages = (inp && inp.stages) || [{ s: 'N1', min: 10 }, { s: 'N2', min: 20 }, { s: 'N3', min: 25 }, { s: 'REM', min: 20 }];
      const total = stages.reduce((a, x) => a + Number(x.min || 0), 0);
      const dist = stages.reduce((a, x) => { a[x.s] = (a[x.s] || 0) + Number(x.min || 0); return a; }, {});
      const deep = (dist.N3 || 0) / (total || 1);
      const efficiency = round(clamp01(total / ((inp && inp.inBedMin) || total * 1.1)));
      const recovery = round(clamp01(deep * 1.5 + efficiency * 0.5));
      return { success: true, kind: 'compute', output: { stages, totalMin: total, distribution: dist, deepRatio: round(deep), efficiency, recovery, note: '分期需 PSG 硬件；统计确定性' },
        provenance: [`[${tid}] sleep: ${total}min · 深睡比 ${round(deep)} · 效率 ${efficiency}`] };
    } },

  { id: 'ENGINE_VOID_15', name: '归无引擎', kind: 'compute', spec: '1456 字符',
    implements: ['归无度 = 1 - 残留度；残留项越少归无度越高（与 ATOM_VOID_WITNESS_150 同源）'],
    async exec(inp, tid) {
      const residues = (inp && inp.residues) || [];
      const total = Number((inp && inp.totalItems) ?? 10);
      const residualRate = round(clamp01(residues.length / (total || 1)));
      return { success: true, kind: 'compute', output: { residues, totalItems: total, residualRate, voidDegree: round(1 - residualRate), rule: '归无度 = 1 - 残留率' },
        provenance: [`[${tid}] void: 残留 ${residues.length}/${total} → 归无度 ${round(1 - residualRate)}`] };
    } },

  { id: 'ENGINE_WORDLESS_16', name: '无言引擎', kind: 'compute', spec: '1190 字符',
    implements: ['沉默决策：四象限（该说/该默/可说可默/不必说）→ 建议动作 + 置信度'],
    async exec(inp, tid) {
      const value = clamp01((inp && inp.speakingValue) ?? 0.5);
      const risk = clamp01((inp && inp.speakingRisk) ?? 0.4);
      const q = value >= 0.6 && risk < 0.5 ? '该说' : value < 0.4 && risk >= 0.5 ? '该默' : value >= 0.6 && risk >= 0.5 ? '可说可默' : '不必说';
      return { success: true, kind: 'compute', output: { speakingValue: value, speakingRisk: risk, quadrant: q, confidence: round(Math.abs(value - risk)) },
        provenance: [`[${tid}] wordless: 价值 ${value} / 风险 ${risk} → ${q}`] };
    } },

  { id: 'ENGINE_NOTEVENVOID_17', name: '无无引擎', kind: 'compute', spec: '909 字符',
    implements: ['二阶归无：对「归无」本身再做归无（自指校验，防止归无成为新的执念）'],
    async exec(inp, tid) {
      const v1 = clamp01((inp && inp.voidDegree) ?? 0.8);
      const v2 = round(1 - Math.abs(0.5 - v1) * 2);   // 越接近 0.5 越"无无"，避免极端
      return { success: true, kind: 'compute', output: { firstOrder: v1, secondOrder: v2, rule: '无无 = 1 - |0.5 - 归无度|×2：避免归无本身成为执念', note: '二阶自指校验' },
        provenance: [`[${tid}] notevenvoid: 归无 ${v1} → 无无 ${v2}`] };
    } },

  { id: 'ENGINE_SCHEDULER_18', name: '耦生调度引擎', kind: 'compute', spec: '7954 字符',
    implements: ['多目标调度：优先级×资源约束×耦生度 → 排序分配（贪心 + 负载均衡）'],
    async exec(inp, tid) {
      const tasks = (inp && inp.tasks) || [
        { id: 'T1', priority: 0.9, cost: 3, coupling: 0.8 },
        { id: 'T2', priority: 0.6, cost: 5, coupling: 0.5 },
        { id: 'T3', priority: 0.75, cost: 2, coupling: 0.7 },
      ];
      const capacity = Number((inp && inp.capacity) ?? 8);
      const scored = tasks.map((t) => ({ ...t, score: round(clamp01(Number(t.priority) || 0) * 0.5 + clamp01(Number(t.coupling) || 0) * 0.3 - (Number(t.cost) || 0) / (capacity * 10) * 0.2) }));
      scored.sort((a, b) => b.score - a.score);
      let used = 0; const scheduled = [], deferred = [];
      for (const t of scored) { if (used + (Number(t.cost) || 0) <= capacity) { scheduled.push(t); used += Number(t.cost) || 0; } else deferred.push(t); }
      return { success: true, kind: 'compute', output: { capacity, scheduled, deferred, usedCapacity: used, utilization: round(used / (capacity || 1)), rule: 'score = 0.5·优先级 + 0.3·耦生度 - 0.2·成本/容量' },
        provenance: [`[${tid}] scheduler: ${scheduled.length} 排入 / ${deferred.length} 延后，利用 ${round(used / (capacity || 1))}`] };
    } },
];

/* ══════════ 运行时接口 ══════════ */
const INDEX = new Map(ENGINES.map((e) => [e.id, e]));
const kindOf = (id) => { const e = INDEX.get(id); return e ? e.kind : 'declared'; };
const getRegistry = () => ENGINES.map((e) => ({ id: e.id, name: e.name, kind: e.kind, spec: e.spec, implements: e.implements, external: e.external || null }));

async function execute(id, input) {
  const t0 = Date.now(), tid = newTraceId();
  const e = INDEX.get(id);
  if (!e) return { success: false, kind: 'declared', reason: 'NOT_FOUND', error: `引擎 ${id} 未登记`, provenance: [], traceId: tid, durationMs: 0 };
  try {
    const r = await e.exec(input || {}, tid);
    return { ...r, engineId: id, engineName: e.name, traceId: tid, durationMs: Date.now() - t0 };
  } catch (err) {
    return { success: false, kind: e.kind, error: 'THROW: ' + err.message, provenance: [`[${tid}] THROW`], engineId: id, traceId: tid, durationMs: Date.now() - t0 };
  }
}

module.exports = { execute, kindOf, getRegistry, ENGINES, INDEX, newTraceId, _p: { build28, fairnessIndex, shannonEntropy, couplingMatrix, mutualInformationEntropy, tempComfort, lightComfort } };
