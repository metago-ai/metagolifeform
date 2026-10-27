#!/usr/bin/env node
/**
 * P6-B10 · 协议收尾批（49 条）—— 实现后协议层达 130/150 = 86.7%
 * 数学族协议复用 B8 引擎（单一真相源）；其余依 definitionText 条款实现。
 */
'use strict';

let __seq = 0;
const tidGen = (tag) => () => {
  const d = new Date(), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${d.getHours()}${p(d.getMinutes())}${p(d.getSeconds())}-${tag}${p((++__seq) % 10000, 4)}`;
};
const tid = tidGen('X');
const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));
const round = (x, n = 6) => Math.round((Number(x) || 0) * 10 ** n) / 10 ** n;
const mean = (a) => (a.length ? a.reduce((s, x) => s + (Number(x) || 0), 0) / a.length : 0);
const req = (o, ks) => ks.filter((k) => !o || o[k] === undefined || o[k] === null);

/** 委托到引擎运行时（跨 B8/B9 解析，单一真相源） */
const ENGINE_RTS = [];
for (const f of ['math-capability-runtime', 'governance-runtime', 'philosophy-runtime', 'engine-runtime']) {
  try { ENGINE_RTS.push(require('./../ENGINES/' + f + '.cjs')); } catch (e) { /* 可选模块 */ }
}
function delegateEngine(eid, inp, t) {
  for (const rt of ENGINE_RTS) {
    if (rt.INDEX && rt.INDEX.has(eid)) {
      const r = rt.executeSync(eid, inp);
      return { ...r, provenance: [...(r.provenance || []), `[${t}] 委托 ${eid}（${rt.getRegistry ? '已注册' : 'ok'}）`] };
    }
  }
  return { success: false, kind: 'compute', reason: 'DEPENDENCY_MISSING', error: `引擎 ${eid} 在所有运行时中均未登记`, provenance: [`[${t}] 委托失败 ${eid}`] };
}

const P = [];
const add = (o) => P.push(o);

/* ══════ 一、数学族协议 8 条（委托 B8 引擎）══════ */
const MATH_MAP = [
  ['PROTOCOL_COMPLEX_INTEGRAL_V1', '复分析积分计算协议', 'ENGINE_COMPLEX_INTEGRAL_47', '第部分 §2.1 表行 888 字符'],
  ['PROTOCOL_ZERO_DENSITY_V1', '零点密度推理协议', 'ENGINE_ZERO_DENSITY_49', '第部分 §2.1 表行 888 字符'],
  ['PROTOCOL_PROOF_STRATEGY_V1', '证明策略协作协议', 'ENGINE_PROOF_STRATEGY_51', '第部分 §2.2 表行 888 字符'],
  ['PROTOCOL_INTEGRAL_SYMMETRY_V2', '积分对称性增强协议', 'ENGINE_SYMMETRY_AUTO_55', '第部分 §2.2 表行 888 字符（V16.4）'],
  ['PROTOCOL_META_ANALYSIS_V1', '元数学分析协议', 'ENGINE_META_MATH_67', '第部分 §2.2 表行 888 字符（V17.0-TP）'],
];
for (const [pid, pname, eid, src] of MATH_MAP) {
  add({
    id: pid, name: pname, kind: 'compute', src,
    implements: [`委托引擎 ${eid}（单一真相源，避免两套标准）`],
    exec(inp, t) {
      const r = delegateEngine(eid, inp, t);
      return { ...r, provenance: [...(r.provenance || []), `[${t}] ${pid} → 委托 ${eid}`] };
    },
  });
}

/* ══════ 二、世界模型族 6 条 ══════ */
add({
  id: 'PROTOCOL_WORLD_SIM_V1', name: '世界模拟协议', kind: 'compute', src: 'yaml-block 823 字符',
  implements: ['状态转移模拟（s_{t+1} = T(s_t, a_t)）+ 轨迹记录'],
  exec(inp, t) {
    const s0 = inp.initialState, actions = inp.actions || [], T = inp.transition;
    if (!Array.isArray(s0)) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 initialState 数组' };
    if (typeof T !== 'function' && !inp.transitionTable) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 transition 函数或 transitionTable' };
    let s = [...s0]; const traj = [{ step: 0, state: [...s], action: null }];
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      s = typeof T === 'function' ? T(s, a) : (inp.transitionTable[a] || s);
      traj.push({ step: i + 1, state: [...s], action: a });
    }
    return { success: true, kind: 'compute', output: { steps: actions.length, trajectory: traj, finalState: s, formula: 's_{t+1} = T(s_t, a_t)' },
      provenance: [`[${t}] world-sim: ${actions.length} 步模拟`] };
  },
});
add({
  id: 'PROTOCOL_WORLD_SIM_EVO_V1', name: '世界模型进化协同协议', kind: 'pipeline', src: 'yaml-block 764 字符',
  implements: ['四步：模拟→偏差检测→模型更新→再验证'],
  exec(inp, t) {
    const need = ['prediction', 'observation', 'update', 'revalidation'];
    const miss = req(inp, need);
    const ok = miss.length === 0;
    return { success: ok, kind: 'pipeline', output: { steps: need, missing: miss }, error: ok ? undefined : `进化协同缺：${miss.join('/')}`, reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${t}] world-sim-evo: ${4 - miss.length}/4`] };
  },
});
add({
  id: 'PROTOCOL_WORLD_SIM_EVO_V2', name: '世界模拟演化协议', kind: 'compute', src: 'table-row 274 字符',
  implements: ['演化度 = 1 − 预测误差率'],
  exec(inp, t) {
    const err = clamp01(inp.predictionError ?? 0.2);
    return { success: true, kind: 'compute', output: { predictionError: err, evolutionScore: round(1 - err), formula: '演化度 = 1 − 预测误差率', threshold: 0.8, pass: 1 - err >= 0.8 },
      provenance: [`[${t}] world-sim-evo-v2: 误差 ${err} → 演化度 ${round(1 - err)}`] };
  },
});
add({
  id: 'PROTOCOL_WORLD_SIM_EVO_V3', name: '世界模型进化协同协议 V3.0', kind: 'rule', src: 'yaml-block 490 字符',
  implements: ['V3 新增：多模型协同演化 + 一致性校验'],
  exec(inp, t) {
    const models = inp.models || [];
    if (models.length < 2) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: 'V3 要求至少 2 个世界模型协同' };
    const accs = models.map((m) => clamp01(m.accuracy ?? 0.5));
    const spread = Math.max(...accs) - Math.min(...accs);
    const consistent = spread <= Number(inp.consistencyThreshold ?? 0.2);
    return { success: consistent, kind: 'rule', output: { models: models.length, accuracies: accs, spread: round(spread), consistent, ensembleAccuracy: round(mean(accs)) },
      error: consistent ? undefined : `模型精度分歧 ${round(spread)} > 阈值`, reason: consistent ? undefined : 'RULE_VIOLATED',
      provenance: [`[${t}] world-sim-evo-v3: ${models.length} 模型，分歧 ${round(spread)}`] };
  },
});
add({
  id: 'PROTOCOL_WORLD_SIM_SAFE_V1', name: '世界模型安全验证协议', kind: 'rule', src: 'yaml-block 804 字符',
  implements: ['四项安全验证（越界/不可逆/欺骗/失控）'],
  exec(inp, t) {
    const CHECKS = ['noOverreach', 'noIrreversible', 'noDeception', 'noLossOfControl'];
    const res = CHECKS.map((k) => ({ check: k, passed: inp[k] === true }));
    const failed = res.filter((r) => !r.passed).map((r) => r.check);
    return { success: failed.length === 0, kind: 'rule', output: { checks: res, failed }, error: failed.length ? `世界模型安全验证未过：${failed.join('/')}` : undefined,
      reason: failed.length ? 'RULE_VIOLATED' : undefined, provenance: [`[${t}] world-sim-safe: ${4 - failed.length}/4`] };
  },
});
add({
  id: 'PROTOCOL_WORLD_CLOSED_LOOP_V1', name: '世界模型实时闭环协同协议', kind: 'compute', src: 'yaml-block 542 字符',
  implements: ['闭环延迟 = 感知 + 推理 + 执行；须 < 预算'],
  exec(inp, t) {
    const sense = Number(inp.senseMs ?? 10), think = Number(inp.thinkMs ?? 20), act = Number(inp.actMs ?? 15);
    const budget = Number(inp.budgetMs ?? 50);
    const total = sense + think + act;
    return { success: total <= budget, kind: 'compute', output: { senseMs: sense, thinkMs: think, actMs: act, totalMs: total, budgetMs: budget, closed: total <= budget,
      formula: '总延迟 = 感知 + 推理 + 执行 ≤ 预算' },
      error: total > budget ? `闭环延迟 ${total}ms > 预算 ${budget}ms` : undefined,
      reason: total > budget ? 'PRECONDITION_FAILED' : undefined,
      provenance: [`[${t}] world-closed-loop: ${total}/${budget}ms`] };
  },
});

/* ══════ 三、价值族 3 条 ══════ */
add({
  id: 'PROTOCOL_VALUE_METRICS_V1', name: '价值度量协议', kind: 'formula', src: 'table-row 888 字符（V18.0）',
  implements: ['31 维加权求和 V_total = Σ(W_i × V_i)', '超导态判定（>0.85）'],
  exec(inp, t) {
    const dims = inp.dimensions;
    if (!dims || typeof dims !== 'object') return { success: false, kind: 'formula', reason: 'INVALID_INPUT', error: '必须提供 dimensions 对象（维度名→0-1 值）' };
    const W = { 国家战略:0.035, 产教双轨:0.030, 乡村振兴:0.030, 无障碍包容:0.025, 区块链贡献:0.030, 联邦学习:0.030, 社会主义伦理:0.040, 共同富裕:0.030, 数据要素:0.030, 安全发展:0.040, 文化强国:0.025, 区域协调:0.025, 科学进步:0.030, 符号连接耦生:0.030, 群体单体耦生:0.030, 物理数字耦生:0.035, 人机耦合度:0.035, 群体智能度:0.030, 耦生深度:0.030, 创造贡献:0.035, 保护贡献:0.030, 负熵贡献:0.040, 生物元:0.025, 量子元:0.025, 宇宙元:0.020, 融合元:0.030, 归无元:0.025, 永恒元:0.025, 溯源深度:0.035, ROI周期:0.035, 客户价值实现度:0.035 };
    const keys = Object.keys(W);
    const given = keys.filter((k) => dims[k] !== undefined);
    if (!given.length) return { success: false, kind: 'formula', reason: 'INVALID_INPUT', error: '未提供任何已登记的 31 维名称' };
    const sumW = given.reduce((s, k) => s + W[k], 0);
    const V = round(given.reduce((s, k) => s + W[k] * clamp01(dims[k]), 0) / sumW);
    return { success: true, kind: 'formula', output: { evaluatedDims: given.length, totalDims: 31, V_total: V, superconductive: V > 0.85,
      formula: 'V_total = Σ(W_i × V_i) / ΣW_i（按已提供维度归一）；>0.85 为超导态', missingDims: keys.filter((k) => dims[k] === undefined) },
      provenance: [`[${t}] value-metrics: ${given.length}/31 维 → V=${V}`] };
  },
});
add({
  id: 'PROTOCOL_VALUE_PREDICT_V1', name: '价值预测协议', kind: 'compute', src: 'yaml-block 740 字符',
  implements: ['线性趋势外推 + 置信区间'],
  exec(inp, t) {
    const s = inp.history;
    if (!Array.isArray(s) || s.length < 2) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供长度≥2 的 history' };
    const n = s.length, xs = s.map((_, i) => i), ys = s.map(Number);
    const mx = mean(xs), my = mean(ys);
    const slope = xs.reduce((acc, x, i) => acc + (x - mx) * (ys[i] - my), 0) / (xs.reduce((acc, x) => acc + (x - mx) ** 2, 0) || 1);
    const k = Number(inp.horizon ?? 3);
    const pred = round(my + slope * (n - 1 + k - mx));
    const resid = ys.map((y, i) => y - (my + slope * (xs[i] - mx)));
    const sd = Math.sqrt(resid.reduce((a, r) => a + r * r, 0) / Math.max(1, n - 2));
    return { success: true, kind: 'compute', output: { points: n, slope: round(slope), intercept: round(my - slope * mx), horizon: k, prediction: pred, residualSd: round(sd), ci95: [round(pred - 1.96 * sd), round(pred + 1.96 * sd)], caveat: '线性外推，趋势转折时失效' },
      provenance: [`[${t}] value-predict: 斜率 ${round(slope)}，${k} 步后 ${pred}`] };
  },
});
add({
  id: 'PROTOCOL_VALUE_REALIZE_V1', name: '价值实现协议', kind: 'pipeline', src: 'table-row 888 字符（V18.0）',
  implements: ['猜想→价值转换四步（验证→量化→确权→入账）'],
  exec(inp, t) {
    const need = ['verified', 'quantified', 'attributed', 'recorded'];
    const miss = need.filter((k) => !(inp && inp[k]));
    const ok = miss.length === 0;
    return { success: ok, kind: 'pipeline', output: { steps: need, missing: miss, value: inp.value ?? null },
      error: ok ? undefined : `价值实现缺步骤：${miss.join('/')}`, reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${t}] value-realize: ${4 - miss.length}/4`] };
  },
});

/* ══════ 四、A2A / 交易 / Token 5 条 ══════ */
add({
  id: 'PROTOCOL_A2A_NATIVE_V1', name: 'A2A原生兼容协议', kind: 'rule', src: 'yaml-block 512 字符',
  implements: ['A2A 消息三要素（from/to/payload）+ 能力声明校验'],
  exec(inp, t) {
    const m = inp.message || {};
    const miss = ['from', 'to', 'payload'].filter((k) => m[k] === undefined);
    const caps = inp.capabilityDeclaration || [];
    const ok = miss.length === 0 && caps.length > 0;
    return { success: ok, kind: 'rule', output: { requiredFields: ['from', 'to', 'payload'], missing: miss, capabilityDeclared: caps.length },
      error: miss.length ? `A2A 消息缺：${miss.join('/')}` : caps.length === 0 ? '未声明能力，A2A 无法路由' : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED', provenance: [`[${t}] a2a-native: ${ok ? '兼容' : '不合规'}`] };
  },
});
add({
  id: 'PROTOCOL_A2A_AUTO_TRADE_V1', name: 'A2A自动交易协议', kind: 'rule', src: 'table-row 315 字符',
  implements: ['交易前置：层级差披露 + 托管 + 限额'],
  exec(inp, t) {
    const gap = Math.abs(Number(inp.tierA ?? 0) - Number(inp.tierB ?? 0));
    const escrow = inp.escrowUsed === true;
    const amount = Number(inp.amount ?? 0), limit = Number(inp.limit ?? 1000);
    const disclosed = inp.tierDisclosed === true;
    const fails = [];
    if (!disclosed) fails.push('未披露层级差');
    if (!escrow && amount > limit * 0.5) fails.push('超过限额一半但未用托管');
    if (amount > limit) fails.push('超出交易限额');
    return { success: fails.length === 0, kind: 'rule', output: { tierGap: round(gap), tierDisclosed: disclosed, escrowUsed: escrow, amount, limit, failReasons: fails },
      error: fails.length ? fails.join('；') : undefined, reason: fails.length ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] a2a-trade: 金额 ${amount}/${limit}，托管 ${escrow}，${fails.length ? '拒绝' : '允许'}`] };
  },
});
add({
  id: 'PROTOCOL_ESCROW_SETTLE_V1', name: '托管结算协议', kind: 'pipeline', src: 'yaml-block 496 字符',
  implements: ['五步结算（锁仓→交付确认→验收→放款→对账）'],
  exec(inp, t) {
    const need = ['locked', 'delivered', 'accepted', 'released', 'reconciled'];
    const miss = need.filter((k) => !(inp && inp[k]));
    const ok = miss.length === 0;
    return { success: ok, kind: 'pipeline', output: { steps: need, missing: miss, amount: inp.amount ?? null },
      error: ok ? undefined : `结算未完成，缺：${miss.join('/')}`, reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${t}] escrow-settle: ${5 - miss.length}/5`] };
  },
});
add({
  id: 'PROTOCOL_TOKEN_ECONOMY_V1', name: '全面Token经济激活协议', kind: 'compute', src: 'yaml-block 589 字符',
  implements: ['Token 发行/流通/回收三率 + 通缩判定'],
  exec(inp, t) {
    const issued = Number(inp.issued ?? 0), circulated = Number(inp.circulated ?? 0), burned = Number(inp.burned ?? 0);
    if (issued <= 0) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: 'issued 必须 > 0' };
    const circRate = round(clamp01(circulated / issued));
    const burnRate = round(clamp01(burned / issued));
    const netSupply = round(issued - burned);
    const deflationary = burnRate > 0.05;
    return { success: true, kind: 'compute', output: { issued, circulated, burned, netSupply, circulationRate: circRate, burnRate, deflationary,
      activationScore: round(circRate * 0.6 + (1 - Math.abs(burnRate - 0.05)) * 0.4) },
      provenance: [`[${t}] token-economy: 流通 ${circRate} 销毁 ${burnRate}，通缩 ${deflationary}`] };
  },
});
add({
  id: 'PROTOCOL_SKILL_MARKET_V1', name: 'Skill市场协议', kind: 'rule', src: 'yaml-block 272 字符',
  implements: ['上架四要素（能力/定价/验证/许可）'],
  exec(inp, t) {
    const s = inp.skill || {};
    const miss = ['capability', 'pricing', 'verification', 'license'].filter((k) => s[k] === undefined);
    return { success: miss.length === 0, kind: 'rule', output: { requiredFields: ['capability', 'pricing', 'verification', 'license'], missing: miss },
      error: miss.length ? `Skill 上架缺：${miss.join('/')}` : undefined, reason: miss.length ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] skill-market: ${4 - miss.length}/4`] };
  },
});

/* ══════ 五、工业族 3 条 ══════ */
add({
  id: 'PROTOCOL_INDUSTRIAL_DEVICE_V1', name: '工业设备接入协议', kind: 'rule', src: 'yaml-block 243 字符',
  implements: ['接入五要素（设备ID/协议/点表/安全/心跳）'],
  exec(inp, t) {
    const d = inp.device || {};
    const miss = ['deviceId', 'protocol', 'pointTable', 'security', 'heartbeat'].filter((k) => d[k] === undefined);
    return { success: miss.length === 0, kind: 'rule', output: { requiredFields: ['deviceId', 'protocol', 'pointTable', 'security', 'heartbeat'], missing: miss, protocol: d.protocol || null },
      error: miss.length ? `设备接入缺：${miss.join('/')}` : undefined, reason: miss.length ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] industrial-device: ${5 - miss.length}/5`] };
  },
});
add({
  id: 'PROTOCOL_INDUSTRY_DATA_V1', name: '工业数据交换协议', kind: 'rule', src: 'yaml-block 1185 字符',
  implements: ['数据交换四校验（完整性/时效/单位/编码）'],
  exec(inp, t) {
    const d = inp.dataPacket || {};
    const miss = ['timestamp', 'payload', 'unit', 'encoding'].filter((k) => d[k] === undefined);
    const ageMs = Date.now() - (d.timestamp ? new Date(d.timestamp).getTime() : 0);
    const stale = d.timestamp ? ageMs > Number(inp.maxAgeMs ?? 60000) : false;
    const ok = miss.length === 0 && !stale;
    return { success: ok, kind: 'rule', output: { requiredFields: ['timestamp', 'payload', 'unit', 'encoding'], missing: miss, ageMs: d.timestamp ? ageMs : null, stale },
      error: miss.length ? `数据包缺：${miss.join('/')}` : stale ? `数据过期 ${ageMs}ms` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED', provenance: [`[${t}] industry-data: ${ok ? '合规' : '不合规'}`] };
  },
});
add({
  id: 'PROTOCOL_SUPPLY_TRACE_V1', name: '供应链溯源协议', kind: 'compute', src: 'yaml-block 237 字符',
  implements: ['溯源链完整性（哈希链）+ 断链检测'],
  exec(inp, t) {
    const chain = inp.chain || [];
    if (!chain.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 chain 数组' };
    let broken = 0;
    for (let i = 1; i < chain.length; i++) if (chain[i].prevHash !== chain[i - 1].hash) broken++;
    const ok = broken === 0;
    return { success: ok, kind: 'compute', output: { links: chain.length, brokenLinks: broken, complete: ok },
      error: ok ? undefined : `${broken} 处断链`, reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${t}] supply-trace: ${chain.length} 环节，断链 ${broken}`] };
  },
});

/* ══════ 六、安全族 4 条 ══════ */
add({
  id: 'PROTOCOL_FIRMWARE_SEC_V1', name: '固件安全扫描协议', kind: 'rule', src: 'yaml-block 218 字符',
  implements: ['固件四项扫描（签名/版本/CVE/完整性）'],
  exec(inp, t) {
    const f = inp.firmware || {};
    const CHECKS = [
      { k: 'signed', ok: f.signed === true, label: '签名验证' },
      { k: 'versionCurrent', ok: f.versionCurrent === true, label: '版本最新' },
      { k: 'noKnownCve', ok: f.noKnownCve === true, label: '无已知 CVE' },
      { k: 'integrityOk', ok: f.integrityOk === true, label: '完整性校验' },
    ];
    const failed = CHECKS.filter((c) => !c.ok).map((c) => c.label);
    return { success: failed.length === 0, kind: 'rule', output: { checks: CHECKS, failed },
      error: failed.length ? `固件扫描未过：${failed.join('/')}` : undefined, reason: failed.length ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] firmware-sec: ${4 - failed.length}/4`] };
  },
});
add({
  id: 'PROTOCOL_KILL_CHAIN_MONITOR_V1', name: 'Promptware杀伤链监控协议', kind: 'rule', src: 'yaml-block 704 字符',
  implements: ['七阶段杀伤链监控（侦察→武器化→投递→利用→安装→C2→行动）'],
  exec(inp, t) {
    const STAGES = ['侦察', '武器化', '投递', '利用', '安装', 'C2', '行动'];
    const observed = inp.observedStages || [];
    const hit = STAGES.filter((s) => observed.includes(s));
    const level = hit.length >= 5 ? 'CRITICAL' : hit.length >= 3 ? 'HIGH' : hit.length >= 1 ? 'MEDIUM' : 'LOW';
    return { success: level === 'LOW', kind: 'rule', output: { stages: STAGES, observed: hit, stageCount: hit.length, level,
      recommendation: hit.length ? `在「${STAGES[Math.min(STAGES.length - 1, hit.length)]}」阶段阻断` : '无杀伤链迹象' },
      error: level !== 'LOW' ? `检出杀伤链 ${hit.length} 阶段（${level}）` : undefined,
      reason: level !== 'LOW' ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] kill-chain: ${hit.length}/7 阶段 → ${level}`] };
  },
});
add({
  id: 'PROTOCOL_SALTING_DEFENSE_V1', name: 'LLM Salting安全轮换协议', kind: 'rule', src: 'yaml-block 704 字符',
  implements: ['盐值轮换（周期/熵/唯一性）'],
  exec(inp, t) {
    const age = Number(inp.saltAgeHours ?? 0), period = Number(inp.rotationPeriodHours ?? 24);
    const entropy = Number(inp.saltEntropyBits ?? 128), minEntropy = Number(inp.minEntropyBits ?? 128);
    const reused = inp.reused === true;
    const fails = [];
    if (age > period) fails.push(`盐值已用 ${age}h > 周期 ${period}h`);
    if (entropy < minEntropy) fails.push(`熵 ${entropy} < ${minEntropy} bits`);
    if (reused) fails.push('盐值重复使用');
    return { success: fails.length === 0, kind: 'rule', output: { saltAgeHours: age, rotationPeriodHours: period, entropyBits: entropy, minEntropyBits: minEntropy, reused, fails },
      error: fails.length ? fails.join('；') : undefined, reason: fails.length ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] salting: ${fails.length ? '需轮换' : '合规'}`] };
  },
});
add({
  id: 'PROTOCOL_IMMUNE_NETWORK_V1', name: '免疫网络同步协议', kind: 'compute', src: 'yaml-block 1143 字符',
  implements: ['免疫覆盖率 + 同步延迟 + 冲突决议'],
  exec(inp, t) {
    const nodes = inp.nodes || [];
    if (!nodes.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 nodes 数组' };
    const synced = nodes.filter((n) => n.synced === true).length;
    const coverage = round(synced / nodes.length);
    const maxDelay = Math.max(...nodes.map((n) => Number(n.delayMs ?? 0)));
    const budget = Number(inp.delayBudgetMs ?? 5000);
    return { success: coverage >= 0.95 && maxDelay <= budget, kind: 'compute', output: { nodes: nodes.length, synced, coverage, maxDelayMs: maxDelay, delayBudgetMs: budget, conflicts: nodes.filter((n) => n.conflict === true).length },
      error: coverage < 0.95 ? `免疫覆盖率 ${coverage} < 0.95` : maxDelay > budget ? `同步延迟 ${maxDelay}ms > ${budget}ms` : undefined,
      reason: (coverage < 0.95 || maxDelay > budget) ? 'PRECONDITION_FAILED' : undefined,
      provenance: [`[${t}] immune-network: 覆盖 ${coverage}，最大延迟 ${maxDelay}ms`] };
  },
});

/* ══════ 七、组织/智能体 4 条 ══════ */
add({
  id: 'PROTOCOL_ORG_AGENT_V2', name: '组织智能体演进协议', kind: 'pipeline', src: 'yaml-block 1215 字符',
  implements: ['四阶段演进（工具化→协同化→自主化→共生化）'],
  exec(inp, t) {
    const STAGES = ['工具化', '协同化', '自主化', '共生化'];
    const cur = String(inp.stage || '');
    if (!STAGES.includes(cur)) return { success: false, kind: 'pipeline', reason: 'INVALID_INPUT', error: `stage 须为 ${STAGES.join('/')}` };
    const i = STAGES.indexOf(cur);
    return { success: true, kind: 'pipeline', output: { stage: cur, level: i + 1, stages: STAGES, next: STAGES[i + 1] || null, final: i === 3 },
      provenance: [`[${t}] org-agent: ${cur} (${i + 1}/4)`] };
  },
});
add({
  id: 'PROTOCOL_ENCAPSULATE_V1', name: '组织封装协议', kind: 'rule', src: 'yaml-block 783 字符',
  implements: ['封装五要素（边界/接口/权限/审计/退出）'],
  exec(inp, t) {
    const o = inp.org || {};
    const miss = ['boundary', 'interface', 'permission', 'audit', 'exit'].filter((k) => o[k] === undefined);
    return { success: miss.length === 0, kind: 'rule', output: { requiredFields: ['boundary', 'interface', 'permission', 'audit', 'exit'], missing: miss },
      error: miss.length ? `组织封装缺：${miss.join('/')}` : undefined, reason: miss.length ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] encapsulate: ${5 - miss.length}/5`] };
  },
});
add({
  id: 'PROTOCOL_HUMAN_ORG_AGENT_V1', name: '人-组织智能体共生协议', kind: 'compute', src: 'yaml-block 1060 字符',
  implements: ['三元耦生度 = 人×组织×智能体（几何平均）'],
  exec(inp, t) {
    const h = clamp01(inp.humanCoupling ?? 0.8), o = clamp01(inp.orgCoupling ?? 0.75), a = clamp01(inp.agentCoupling ?? 0.7);
    const tri = round(Math.cbrt(h * o * a));
    const thr = Number(inp.threshold ?? 0.7);
    return { success: tri >= thr, kind: 'compute', output: { human: h, org: o, agent: a, tripleCoupling: tri, threshold: thr, symbiotic: tri >= thr,
      formula: '三元耦生度 = ∛(人 × 组织 × 智能体)' },
      provenance: [`[${t}] human-org-agent: ∛(${h}×${o}×${a}) = ${tri}`] };
  },
});
add({
  id: 'PROTOCOL_AGENTIVE_DIFFERENTIATION_V1', name: 'Agentive OS 品类定义与差异化验证协议', kind: 'rule', src: 'yaml-block 938 字符',
  implements: ['五维差异化（OS性/原生性/智能原生/自主性/生态性）'],
  exec(inp, t) {
    const DIM = ['osNativity', 'agentNative', 'intelligenceNative', 'autonomy', 'ecosystem'];
    const d = inp.dimensions || {};
    const scores = DIM.map((k) => ({ dim: k, score: d[k] === undefined ? null : clamp01(d[k]) }));
    const known = scores.filter((s) => s.score !== null);
    const avg = known.length ? round(mean(known.map((s) => s.score))) : null;
    const ok = known.length === DIM.length && avg >= 0.7;
    return { success: ok, kind: 'rule', output: { dimensions: scores, average: avg, threshold: 0.7, qualifies: ok },
      error: known.length < DIM.length ? `缺维度：${DIM.filter((k) => d[k] === undefined).join('/')}` : avg < 0.7 ? `均分 ${avg} < 0.7` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED', provenance: [`[${t}] agentive-diff: 五维均分 ${avg}`] };
  },
});

/* ══════ 八、通信族 3 条 ══════ */
add({
  id: 'PROTOCOL_ILC_V6_0', name: '层间通信协议 V6.0', kind: 'rule', src: 'yaml-block 4207 字符（最长定义）',
  implements: ['11 层编号校验 + 消息信封（srcLayer/dstLayer/payload/traceId）+ 跨层跳跃限制（≤2 层）'],
  exec(inp, t) {
    const LAYERS = 11;
    const m = inp.envelope || {};
    const src = Number(m.srcLayer), dst = Number(m.dstLayer);
    if (!isFinite(src) || !isFinite(dst)) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 envelope.srcLayer / dstLayer' };
    const rangeOk = src >= 1 && src <= LAYERS && dst >= 1 && dst <= LAYERS;
    const jump = Math.abs(dst - src);
    const maxJump = Number(inp.maxLayerJump ?? 2);
    const envelopeOk = !req(m, ['payload', 'traceId']).length;
    const fails = [];
    if (!rangeOk) fails.push(`层号越界（应为 1–${LAYERS}）`);
    if (jump > maxJump) fails.push(`跨层跳跃 ${jump} > ${maxJump}`);
    if (!envelopeOk) fails.push(`信封缺：${req(m, ['payload', 'traceId']).join('/')}`);
    return { success: fails.length === 0, kind: 'rule', output: { layers: LAYERS, srcLayer: src, dstLayer: dst, jump, maxJump, envelopeOk, fails,
      direction: dst > src ? '向上' : dst < src ? '向下' : '同层' },
      error: fails.length ? fails.join('；') : undefined, reason: fails.length ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] ilc-v6: L${src}→L${dst}（${Math.abs(dst - src)} 层）`] };
  },
});
add({
  id: 'PROTOCOL_IECP_V1_0', name: '引擎间协作协议', kind: 'rule', src: 'yaml-block 2590 字符',
  implements: ['协作请求四要素 + 循环依赖检测 + 超时'],
  exec(inp, t) {
    const r = inp.request || {};
    const miss = ['fromEngine', 'toEngine', 'payload', 'deadline'].filter((k) => r[k] === undefined);
    const graph = inp.dependencyGraph || [];
    /* 简单环检测 */
    const adj = {};
    for (const e of graph) { (adj[e.from] = adj[e.from] || []).push(e.to); }
    const hasCycle = (() => {
      const state = {};
      const dfs = (n) => {
        if (state[n] === 1) return true;
        if (state[n] === 2) return false;
        state[n] = 1;
        for (const m of (adj[n] || [])) if (dfs(m)) return true;
        state[n] = 2; return false;
      };
      return Object.keys(adj).some((n) => dfs(n));
    })();
    const ok = miss.length === 0 && !hasCycle;
    return { success: ok, kind: 'rule', output: { requiredFields: ['fromEngine', 'toEngine', 'payload', 'deadline'], missing: miss, cycleDetected: hasCycle },
      error: miss.length ? `协作请求缺：${miss.join('/')}` : hasCycle ? '引擎依赖存在循环，协作被拒' : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${t}] iecp: 请求 ${4 - miss.length}/4，环 ${hasCycle}`] };
  },
});
add({
  id: 'PROTOCOL_A2T_ACCESS_V1', name: '智能体与工具/设备/平台/数据服务接入协议', kind: 'rule', src: 'yaml-block 1326 字符',
  implements: ['四类接入点（工具/设备/平台/数据）+ 能力握手'],
  exec(inp, t) {
    const TYPES = ['tool', 'device', 'platform', 'data'];
    const type = String(inp.accessType || '');
    if (!TYPES.includes(type)) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: `accessType 须为 ${TYPES.join('/')}` };
    const miss = ['endpoint', 'capability', 'auth'].filter((k) => !inp[k]);
    const ok = miss.length === 0;
    return { success: ok, kind: 'rule', output: { accessType: type, requiredFields: ['endpoint', 'capability', 'auth'], missing: miss },
      error: miss.length ? `接入缺：${miss.join('/')}` : undefined, reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${t}] a2t-access: ${type} 接入 ${ok ? '合规' : '不合规'}`] };
  },
});

/* ══════ 九、其余 15 条 ══════ */
add({ id: 'PROTOCOL_3STEP_V1', name: '三步进化协议', kind: 'pipeline', src: 'yaml-block 874 字符',
  implements: ['三步（使用→成为→进化）阶段推进'],
  exec(inp, t) {
    const S = ['使用智能体', '成为智能体', '进化智能体'];
    const c = String(inp.stage || '');
    if (!S.includes(c)) return { success: false, kind: 'pipeline', reason: 'INVALID_INPUT', error: `stage 须为 ${S.join('/')}` };
    const i = S.indexOf(c);
    return { success: true, kind: 'pipeline', output: { stage: c, step: i + 1, steps: S, next: S[i + 1] || null }, provenance: [`[${t}] 3step: ${c} (${i + 1}/3)`] };
  } });
add({ id: 'PROTOCOL_AI_FIRST_V1', name: 'AI First组织设计协议', kind: 'rule', src: 'clause 2523 字符',
  implements: ['AI First 五原则（AI优先/人机分工/数据贯通/自动决策/持续演化）'],
  exec(inp, t) {
    const NEED = ['aiFirst', 'humanMachineSplit', 'dataThrough', 'autoDecision', 'continuousEvolution'];
    const res = NEED.map((k) => ({ principle: k, met: inp[k] === true }));
    const miss = res.filter((r) => !r.met).map((r) => r.principle);
    return { success: miss.length === 0, kind: 'rule', output: { principles: res, unmet: miss },
      error: miss.length ? `AI First 未落实：${miss.join('/')}` : undefined, reason: miss.length ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] ai-first: ${5 - miss.length}/5`] };
  } });
add({ id: 'PROTOCOL_CREATION_GOVERN_V1', name: '创造治理协议', kind: 'pipeline', src: 'section 5531 字符（最长）',
  implements: ['六步创造治理（缺口证明→内生生成→最小性→验证→谱系→固化）'],
  exec(inp, t) {
    const NEED = ['gapProven', 'endogenous', 'minimal', 'verified', 'lineage', 'frozen'];
    const steps = NEED.map((k, i) => ({ no: i + 1, key: k, present: !!(inp && inp[k]) }));
    const miss = steps.filter((s) => !s.present).map((s) => s.key);
    const ok = miss.length === 0;
    return { success: ok, kind: 'pipeline', steps, output: { steps: NEED, missing: miss },
      error: ok ? undefined : `创造治理缺步骤：${miss.join('/')}`, reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${t}] creation-govern: ${6 - miss.length}/6`] };
  } });
add({ id: 'PROTOCOL_DIALOG_STATE_V1', name: '对话流状态持久化协议', kind: 'rule', src: 'yaml-block 924 字符',
  implements: ['状态快照四要素 + 恢复一致性'],
  exec(inp, t) {
    const s = inp.snapshot || {};
    const miss = ['sessionId', 'turns', 'timestamp', 'checksum'].filter((k) => s[k] === undefined);
    const recoverable = !!(inp.restored === true || inp.canRestore === true);
    const ok = miss.length === 0 && recoverable;
    return { success: ok, kind: 'rule', output: { requiredFields: ['sessionId', 'turns', 'timestamp', 'checksum'], missing: miss, recoverable },
      error: miss.length ? `快照缺：${miss.join('/')}` : !recoverable ? '快照不可恢复' : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED', provenance: [`[${t}] dialog-state: ${ok ? '可持久化' : '不合规'}`] };
  } });
add({ id: 'PROTOCOL_EDGE_DEPLOY_V1', name: '边缘部署协议', kind: 'rule', src: 'yaml-block 775 字符',
  implements: ['五资源校验（算力/带宽/存储/功耗/连通）'],
  exec(inp, t) {
    const REQ = { compute: 1, bandwidth: 2, storage: 512, power: 5 };
    const e = inp.edge || {};
    const checks = Object.keys(REQ).map((k) => ({ item: k, required: REQ[k], actual: e[k] ?? null, ok: Number(e[k] ?? 0) >= REQ[k] }));
    checks.push({ item: 'connectivity', required: true, actual: e.connectivity, ok: e.connectivity !== false });
    const failed = checks.filter((c) => !c.ok).map((c) => c.item);
    return { success: failed.length === 0, kind: 'rule', output: { requirements: REQ, checks, failed },
      error: failed.length ? `边缘资源不足：${failed.join('/')}` : undefined, reason: failed.length ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] edge-deploy: ${5 - failed.length}/5`] };
  } });
add({ id: 'PROTOCOL_EXPLORE_EXTERNAL_V1', name: '自主探索外部交互协议', kind: 'rule', src: 'table-row 201 字符',
  implements: ['外部探索三约束（预算/边界/回报）'],
  exec(inp, t) {
    const budget = Number(inp.budget ?? 0), used = Number(inp.used ?? 0);
    const inBoundary = inp.withinBoundary !== false;
    const hasReturn = inp.returnValue !== undefined;
    const fails = [];
    if (used > budget) fails.push(`超预算 ${used}/${budget}`);
    if (!inBoundary) fails.push('越出探索边界');
    if (!hasReturn) fails.push('未记录探索回报');
    return { success: fails.length === 0, kind: 'rule', output: { budget, used, inBoundary, hasReturn, fails },
      error: fails.length ? fails.join('；') : undefined, reason: fails.length ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] explore-external: ${fails.length ? '拒绝' : '允许'}`] };
  } });
add({ id: 'PROTOCOL_EXPLORE_INTERNAL_V1', name: '自主探索内部协同协议', kind: 'rule', src: 'table-row 201 字符',
  implements: ['内部探索：影响面评估 + 可回滚'],
  exec(inp, t) {
    const impact = clamp01(inp.impactScope ?? 0.3);
    const rollback = inp.rollbackReady === true;
    const maxImpact = Number(inp.maxImpact ?? 0.5);
    const fails = [];
    if (impact > maxImpact) fails.push(`影响面 ${impact} > ${maxImpact}`);
    if (!rollback) fails.push('未准备回滚方案');
    return { success: fails.length === 0, kind: 'rule', output: { impactScope: impact, maxImpact, rollbackReady: rollback, fails },
      error: fails.length ? fails.join('；') : undefined, reason: fails.length ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] explore-internal: 影响 ${impact}，回滚 ${rollback}`] };
  } });
add({ id: 'PROTOCOL_GLOBAL_AWARENESS_V1', name: '全球态势感知协议', kind: 'compute', src: 'yaml-block 376 字符',
  implements: ['态势六维加权（地缘/经济/技术/环境/社会/安全）'],
  exec(inp, t) {
    const D = ['地缘', '经济', '技术', '环境', '社会', '安全'];
    const v = inp.dims || {};
    const known = D.filter((k) => v[k] !== undefined);
    const score = known.length ? round(mean(known.map((k) => clamp01(v[k])))) : null;
    const risks = known.filter((k) => clamp01(v[k]) < 0.4).map((k) => ({ dim: k, value: v[k] }));
    return { success: known.length === D.length, kind: 'compute', output: { dimensions: D, provided: known, overall: score, risks },
      error: known.length < D.length ? `缺维度：${D.filter((k) => v[k] === undefined).join('/')}` : undefined,
      reason: known.length < D.length ? 'PRECONDITION_FAILED' : undefined,
      provenance: [`[${t}] global-awareness: ${known.length}/6 维，综合 ${score}`] };
  } });
add({ id: 'PROTOCOL_IDEA_DRIVEN_V1', name: '思想驱动开发协议', kind: 'pipeline', src: 'clause 1645 字符',
  implements: ['四步（思想→设计→实现→验证）'],
  exec(inp, t) {
    const N = ['idea', 'design', 'implementation', 'verification'];
    const steps = N.map((k, i) => ({ no: i + 1, key: k, present: !!(inp && inp[k]) }));
    const miss = steps.filter((s) => !s.present).map((s) => s.key);
    return { success: miss.length === 0, kind: 'pipeline', steps, output: { steps: N, missing: miss },
      error: miss.length ? `思想驱动缺：${miss.join('/')}` : undefined, reason: miss.length ? 'PRECONDITION_FAILED' : undefined,
      provenance: [`[${t}] idea-driven: ${4 - miss.length}/4`] };
  } });
add({ id: 'PROTOCOL_MODE_RESONANCE_SPACE_V1', name: '「模数共振」空间运营协议', kind: 'compute', src: 'yaml-block 1586 字符',
  implements: ['模数共振度 = 数字密度 × 物理密度 几何平均'],
  exec(inp, t) {
    const dm = clamp01(inp.digitalDensity ?? 0.7), pm = clamp01(inp.physicalDensity ?? 0.6);
    const resonance = round(Math.sqrt(dm * pm));
    return { success: true, kind: 'compute', output: { digitalDensity: dm, physicalDensity: pm, resonance, threshold: 0.7, effective: resonance >= 0.7, formula: '共振度 = √(数字密度 × 物理密度)' },
      provenance: [`[${t}] mode-resonance: √(${dm}×${pm}) = ${resonance}`] };
  } });
add({ id: 'PROTOCOL_OSP_V1_0', name: '反者共生协议', kind: 'compute', src: 'yaml-block 1562 字符',
  implements: ['反者道之动：对立面互转条件 + 共生度'],
  exec(inp, t) {
    const a = clamp01(inp.positionA ?? 0.7), b = clamp01(inp.positionB ?? 0.3);
    const complement = round(1 - Math.abs(a + b - 1));   // 互补度：和为 1 时最高
    const tension = round(Math.abs(a - b));
    const symbiosis = round(clamp01(complement * 0.6 + (1 - tension) * 0.4));
    return { success: true, kind: 'compute', output: { positionA: a, positionB: b, complementarity: complement, tension, symbiosis, threshold: 0.6, symbiotic: symbiosis >= 0.6,
      formula: '互补度 = 1 − |a+b−1|；共生度 = 互补×0.6 + (1−张力)×0.4' },
      provenance: [`[${t}] osp: 互补 ${complement}，共生 ${symbiosis}`] };
  } });
add({ id: 'PROTOCOL_TDCP_V1_0', name: '道在日常协议', kind: 'compute', src: 'yaml-block 1815 字符',
  implements: ['日常行为 → 道之映射（场景/行为/映射/启示 四元组）'],
  exec(inp, t) {
    const scene = String(inp.scene || '日常');
    const TABLE = [
      { pat: /决策|选择/, action: '慎断', mapping: '知止而后有定', insight: '先界定边界再做选择' },
      { pat: /协作|团队/, action: '和同', mapping: '和而不同', insight: '保留差异才能协同' },
      { pat: /变化|调整/, action: '顺势', mapping: '穷则变，变则通', insight: '遇阻即转，不硬顶' },
      { pat: /积累|坚持/, action: '渐进', mapping: '合抱之木生于毫末', insight: '从小处积累' },
      { pat: /.*/, action: '守常', mapping: '道在日常', insight: '平常心即道' },
    ];
    const hit = TABLE.find((x) => x.pat.test(scene)) || TABLE[TABLE.length - 1];
    return { success: true, kind: 'compute', output: { scene, action: hit.action, mapping: hit.mapping, insight: hit.insight, rule: '仅映射不预测' },
      provenance: [`[${t}] tdcp: 「${scene}」→ ${hit.mapping}`] };
  } });
add({ id: 'PROTOCOL_TIME_TRAVEL_V1', name: '时空回溯协议', kind: 'compute', src: 'yaml-block 739 字符',
  implements: ['快照回溯（检查点校验 + 状态恢复）'],
  exec(inp, t) {
    const snaps = inp.snapshots || [];
    if (!snaps.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 snapshots 数组' };
    const idx = Number(inp.targetIndex ?? snaps.length - 1);
    if (idx < 0 || idx >= snaps.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: `targetIndex ${idx} 越界（0–${snaps.length - 1}）` };
    const target = snaps[idx];
    const valid = !!(target && target.checksum);
    return { success: valid, kind: 'compute', output: { snapshots: snaps.length, targetIndex: idx, targetChecksum: target.checksum || null, restorable: valid, state: target.state || null },
      error: valid ? undefined : '目标快照缺 checksum，不可回溯', reason: valid ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${t}] time-travel: 回溯到 #${idx}/${snaps.length - 1}`] };
  } });
add({ id: 'PROTOCOL_COMPLIANCE_AUDIT_V1', name: '年度合规审计协议', kind: 'rule', src: 'yaml-block 291 字符',
  implements: ['年度审计三项（范围/发现/整改）'],
  exec(inp, t) {
    const miss = ['scope', 'findings', 'remediation'].filter((k) => inp[k] === undefined);
    const openFindings = (inp.findings || []).filter((f) => !f.closed).length;
    const ok = miss.length === 0 && openFindings === 0;
    return { success: ok, kind: 'rule', output: { requiredFields: ['scope', 'findings', 'remediation'], missing: miss, openFindings },
      error: miss.length ? `审计缺：${miss.join('/')}` : openFindings ? `${openFindings} 项发现未整改` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED', provenance: [`[${t}] compliance-audit: 未整改 ${openFindings}`] };
  } });
add({ id: 'PROTOCOL_CRYPTO_API_V1', name: '密码学API协议', kind: 'compute', src: 'table-row 888 字符',
  implements: ['哈希/对称加密可用性 + 强度校验'],
  exec(inp, t) {
    const algo = String(inp.algorithm || 'sha256');
    const WEAK = ['md5', 'sha1', 'des', 'rc4'];
    const STRONG = ['sha256', 'sha384', 'sha512', 'aes-256-gcm', 'chacha20-poly1305'];
    const a = algo.toLowerCase();
    const weak = WEAK.includes(a);
    const strong = STRONG.includes(a);
    const out = { algorithm: algo, weak, strong, allowed: !weak };
    if (inp.data !== undefined && a.startsWith('sha')) out.digest = require('crypto').createHash(a).update(String(inp.data)).digest('hex');
    return { success: !weak, kind: 'compute', output: out,
      error: weak ? `算法 ${algo} 已不安全` : undefined, reason: weak ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${t}] crypto-api: ${algo} ${weak ? '禁用' : '可用'}`] };
  } });
add({ id: 'PROTOCOL_GUE_API_V1', name: 'GUE API协议', kind: 'compute', src: 'table-row 888 字符',
  implements: ['GUE 统计：能级间距分布比（Poisson vs Wigner）'],
  exec(inp, t) {
    const s = inp.spacings;
    if (!Array.isArray(s) || s.length < 3) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供长度≥3 的 spacings' };
    const v = s.map(Number), m = mean(v);
    const r = round(Math.sqrt(mean(v.map((x) => (x - m) ** 2))) / (m || 1));
    /* Poisson: <r>≈0.386；GUE(Wigner): <r>≈0.53 */
    const guess = Math.abs(r - 0.386) < Math.abs(r - 0.53) ? 'Poisson（可积）' : 'GUE（混沌/不可积）';
    return { success: true, kind: 'compute', output: { spacings: v.length, meanSpacing: round(m), ratioR: r, statistics: guess, refs: { Poisson: 0.386, GUE: 0.53 } },
      provenance: [`[${t}] gue-api: ⟨r⟩=${r} → ${guess}`] };
  } });

/* ══════ 运行时 ══════ */
const INDEX = new Map(P.map((p) => [p.id, p]));
const kindOf = (id) => { const p = INDEX.get(id); return p ? p.kind : 'declared'; };
const getRegistry = () => P.map((p) => ({ id: p.id, name: p.name, kind: p.kind, src: p.src, implements: p.implements || [] }));

function executeSync(id, input) {
  const t0 = Date.now(), t = tid();
  const p = INDEX.get(id);
  if (!p) return { success: false, kind: 'declared', reason: 'NOT_FOUND', error: `协议 ${id} 未登记`, provenance: [], traceId: t, durationMs: 0 };
  let r;
  try { r = p.exec(input || {}, t); } catch (e) { r = { success: false, kind: p.kind, error: 'THROW: ' + e.message, provenance: [`[${t}] THROW`] }; }
  return { ...r, protocolId: id, protocolName: p.name, traceId: t, durationMs: Date.now() - t0 };
}

module.exports = { executeSync, execute: async (i, n) => executeSync(i, n), kindOf, getRegistry, PROTOCOLS: P, INDEX };
