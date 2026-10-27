#!/usr/bin/env node
/**
 * P6-B12 · 最终收口批：20 条缺口协议 + 2 条缺失引擎 = 22 条
 * 完成后 P6 = 协议 150/150 + 引擎 174/174（ENGINES.md 全集）
 */
'use strict';

let __seq = 0;
const tid = () => {
  const d = new Date(), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${d.getHours()}${p(d.getMinutes())}${p(d.getSeconds())}-W${p((++__seq) % 10000, 4)}`;
};
const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));
const round = (x, n = 6) => Math.round((Number(x) || 0) * 10 ** n) / 10 ** n;
const mean = (a) => (a.length ? a.reduce((s, x) => s + (Number(x) || 0), 0) / a.length : 0);
const miss = (o, ks) => ks.filter((k) => !o || o[k] === undefined || o[k] === null);

const P = [];  // 协议
const E = [];  // 引擎
const addP = (o) => P.push(o);
const addE = (o) => E.push(o);

/* ══════════ 一、20 条缺口协议 ══════════ */

/* 缺口协议多来自根文档，仅有名称+功能一句；按名称语义 + 元构通用模式实现，推导依据记入 src */
const GAP_P = [
  ['PROTOCOL_AUTONOMOUS_EXPLORE_V1', '自主探索协议', 'compute',
    ['frontier', 'budget'], (inp, t) => {
      const f = inp.frontier || [], b = Number(inp.budget ?? 10), u = Number(inp.used ?? 0);
      return { success: u <= b && f.length > 0, kind: 'compute', output: { frontier: f.length, budget: b, used: u, remaining: round(b - u), canExplore: u < b && f.length > 0 },
        error: u > b ? '探索预算超支' : f.length === 0 ? '探索前沿为空' : undefined, reason: (u > b || !f.length) ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${t}] autonomous-explore: 前沿 ${f.length}，预算 ${u}/${b}`] };
    }],
  ['PROTOCOL_CAPABILITY_COORD_V1', '能力协同协议', 'compute',
    ['capabilities'], (inp, t) => {
      const caps = inp.capabilities || [];
      if (caps.length < 2) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '至少 2 个能力' };
      const covered = new Set(); let total = 0;
      for (const c of caps) { const ts = c.covers || []; total += ts.length; ts.forEach((x) => covered.add(x)); }
      const overlap = total ? round((total - covered.size) / covered.size) : 0;
      const coord = round(clamp01(1 - clamp01(overlap / 2)));
      return { success: coord >= 0.5, kind: 'compute', output: { capabilities: caps.length, coverage: covered.size, overlap, coordination: coord },
        error: coord < 0.5 ? `能力重叠过高 ${overlap}` : undefined, reason: coord < 0.5 ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${t}] capability-coord: ${caps.length} 能力，协同 ${coord}`] };
    }],
  ['PROTOCOL_CDL_V1', '认知分层协议', 'rule',
    ['perception', 'understanding', 'decision', 'execution'], (inp, t) => {
      const F = ['perception', 'understanding', 'decision', 'execution'];
      const m = miss(inp, F);
      return { success: m.length === 0, kind: 'rule', output: { layers: F, missing: m },
        error: m.length ? `认知层缺：${m.join('/')}` : undefined, reason: m.length ? 'RULE_VIOLATED' : undefined,
        provenance: [`[${t}] cdl: ${4 - m.length}/4`] };
    }],
  ['PROTOCOL_CF_V1', '耦生反馈协议', 'compute',
    ['signal', 'response'], (inp, t) => {
      const s = clamp01(inp.signalStrength ?? 0.5), r = clamp01(inp.responseStrength ?? 0.5);
      const coupling = round(Math.sqrt(s * r));
      return { success: coupling >= 0.5, kind: 'compute', output: { signal: s, response: r, coupling, effective: coupling >= 0.5, formula: '耦生反馈 = √(信号 × 响应)' },
        error: coupling < 0.5 ? `耦生度 ${coupling} 偏低` : undefined, reason: coupling < 0.5 ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${t}] cf: √(${s}×${r}) = ${coupling}`] };
    }],
  ['PROTOCOL_CRITICAL_TRUTH_V2', '真相优先协议 V2', 'rule',
    [], (inp, t) => {
      const text = String(inp.text || '');
      if (!text) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 text' };
      const SY = /您说得(对|太对|完全对)|完全正确|太好了|赞同您/g;
      const AV = /不便(评|评论)|看情况|因人而异|见仁见智/g;
      const sy = text.match(SY) || [], av = text.match(AV) || [];
      const ok = sy.length === 0 && av.length === 0;
      return { success: ok, kind: 'rule', output: { version: 'V2', sycophancy: sy.length, avoidance: av.length, clean: ok },
        error: ok ? undefined : `迎合 ${sy.length} / 回避 ${av.length}`, reason: ok ? undefined : 'RULE_VIOLATED',
        provenance: [`[${t}] critical-truth-v2: 迎合 ${sy.length} 回避 ${av.length}`] };
    }],
  ['PROTOCOL_DIALOG_CREATE_V1', '对话创造协议', 'pipeline',
    ['turns', 'divergence', 'convergence', 'artifact'], (inp, t) => {
      const F = ['turns', 'divergence', 'convergence', 'artifact'];
      const m = miss(inp, F);
      return { success: m.length === 0, kind: 'pipeline', output: { steps: ['对话', '发散', '收敛', '产出'], missing: m },
        error: m.length ? `对话创造缺：${m.join('/')}` : undefined, reason: m.length ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${t}] dialog-create: ${4 - m.length}/4`] };
    }],
  ['PROTOCOL_DPVP_V1_0', '数据价值证明协议', 'rule',
    ['dataSource', 'valueProof', 'chain'], (inp, t) => {
      const F = ['dataSource', 'valueProof', 'chain'];
      const m = miss(inp, F);
      return { success: m.length === 0, kind: 'rule', output: { required: F, missing: m },
        error: m.length ? `数据价值证明缺：${m.join('/')}` : undefined, reason: m.length ? 'RULE_VIOLATED' : undefined,
        provenance: [`[${t}] dpvp: ${3 - m.length}/3`] };
    }],
  ['PROTOCOL_FACTCHECK_V1', '事实核查协议', 'rule',
    ['statements'], (inp, t) => {
      const st = inp.statements;
      if (!Array.isArray(st) || !st.length) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 statements' };
      const T = [['✅ 已确认', 0.9, 1], ['📊 较高', 0.7, 0.899], ['⚠️ 待核实', 0.5, 0.699], ['🔍 需确认', 0, 0.499]];
      const checked = st.map((s, i) => { const c = Number(s.confidence ?? 0); const tt = T.find((x) => c >= x[1] && c <= x[2]) || T[3]; return { i, content: s.content, confidence: c, tier: tt[0], sourced: !!s.source }; });
      const unsourced = checked.filter((c) => !c.sourced && c.confidence >= 0.9);
      return { success: unsourced.length === 0, kind: 'rule', output: { total: st.length, checked, unsourcedHighConf: unsourced.length },
        error: unsourced.length ? `${unsourced.length} 条高置信声明缺来源` : undefined, reason: unsourced.length ? 'RULE_VIOLATED' : undefined,
        provenance: [`[${t}] factcheck: ${st.length} 条，高置信无源 ${unsourced.length}`] };
    }],
  ['PROTOCOL_FEDERATED_V1', '联邦学习协议', 'rule',
    ['participants', 'localOnly'], (inp, t) => {
      const ps = inp.participants || [];
      const localOnly = inp.rawDataLocal === true;
      const agg = inp.aggregatedOnly === true;
      const fails = [];
      if (ps.length < 2) fails.push('参与方少于 2');
      if (!localOnly) fails.push('原始数据未本地保留');
      if (!agg) fails.push('仅上传聚合结果的要求未满足');
      return { success: fails.length === 0, kind: 'rule', output: { participants: ps.length, rawDataLocal: localOnly, aggregatedOnly: agg, fails },
        error: fails.length ? fails.join('；') : undefined, reason: fails.length ? 'RULE_VIOLATED' : undefined,
        provenance: [`[${t}] federated: ${ps.length} 方，隐私合规 ${fails.length === 0}`] };
    }],
  ['PROTOCOL_HUMAN_AI_SYM_V1', '人机共生协议', 'compute',
    ['human', 'ai'], (inp, t) => {
      const h = clamp01(inp.humanCapability ?? 0.7), a = clamp01(inp.aiCapability ?? 0.8);
      const sym = round(Math.sqrt(h * a));
      const complement = round(1 - Math.abs(h - a));
      return { success: sym >= 0.6, kind: 'compute', output: { human: h, ai: a, symbiosis: sym, complementarity: complement, healthy: sym >= 0.6, formula: '共生度 = √(人 × AI)' },
        error: sym < 0.6 ? `共生度 ${sym} 偏低` : undefined, reason: sym < 0.6 ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${t}] human-ai-sym: √(${h}×${a}) = ${sym}`] };
    }],
  ['PROTOCOL_IDEA_ALGO_V1', '思想算法协议', 'compute',
    ['idea'], (inp, t) => {
      const id = inp.idea || {};
      if (!id.name) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: 'idea.name 必填' };
      const novelty = clamp01(id.novelty ?? 0.5), utility = clamp01(id.utility ?? 0.5), feasibility = clamp01(id.feasibility ?? 0.5);
      const score = round(novelty * 0.4 + utility * 0.35 + feasibility * 0.25);
      return { success: score >= 0.5, kind: 'compute', output: { idea: id.name, novelty, utility, feasibility, score, viable: score >= 0.5,
        formula: '思想分 = 新颖×0.4 + 效用×0.35 + 可行×0.25' },
        error: score < 0.5 ? `思想分 ${score} 不足` : undefined, reason: score < 0.5 ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${t}] idea-algo: ${id.name} → ${score}`] };
    }],
  ['PROTOCOL_IDEA_CAPITAL_V1', '思想资本协议', 'compute',
    ['ideaValue', 'liquidity', 'inheritance'], (inp, t) => {
      const v = clamp01(inp.ideaValue ?? 0.5), l = clamp01(inp.liquidity ?? 0.5), i = clamp01(inp.inheritance ?? 0.6);
      const capital = round(v * l * i);
      return { success: true, kind: 'compute', output: { ideaValue: v, liquidity: l, inheritance: i, capital, formula: '资本 = 价值 × 流动性 × 传承' },
        provenance: [`[${t}] idea-capital: ${v}×${l}×${i} = ${capital}`] };
    }],
  ['PROTOCOL_ILC_V6', '层间通信协议（V6 简版）', 'rule',
    ['envelope'], (inp, t) => {
      const m = inp.envelope || {};
      const src = Number(m.srcLayer), dst = Number(m.dstLayer);
      const m2 = miss(m, ['payload', 'traceId']);
      const ok = isFinite(src) && isFinite(dst) && src >= 1 && src <= 11 && dst >= 1 && dst <= 11 && Math.abs(dst - src) <= 2 && m2.length === 0;
      return { success: ok, kind: 'rule', output: { srcLayer: src, dstLayer: dst, jump: Math.abs(dst - src), envelopeMissing: m2 },
        error: ok ? undefined : '层号越界/跨层>2/信封不全', reason: ok ? undefined : 'RULE_VIOLATED',
        provenance: [`[${t}] ilc-v6: L${src}→L${dst}`] };
    }],
  ['PROTOCOL_KCP_V1_0', '知识晶体协议', 'compute',
    ['crystals'], (inp, t) => {
      const cs = inp.crystals || [];
      if (!cs.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 crystals' };
      const TYPES = ['会话晶体', '持久晶体', '技能晶体'];
      const valid = cs.filter((c) => TYPES.includes(c.type));
      const reuse = round(mean(cs.map((c) => Number(c.reuseCount ?? 0))));
      return { success: valid.length === cs.length, kind: 'compute', output: { total: cs.length, validTypes: valid.length, typeWhitelist: TYPES, avgReuse: reuse },
        error: valid.length < cs.length ? `${cs.length - valid.length} 个晶体类型非法` : undefined, reason: valid.length < cs.length ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${t}] kcp: ${cs.length} 晶体，合法 ${valid.length}`] };
    }],
  ['PROTOCOL_MULTI_AGENT_V1', '多智能体协议', 'compute',
    ['agents'], (inp, t) => {
      const as = inp.agents || [];
      if (as.length < 2) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '至少 2 个智能体' };
      const conflicts = as.reduce((s, a) => s + Number(a.conflicts || 0), 0);
      const coord = round(clamp01(1 - conflicts / 10));
      const lead = as.reduce((b, a) => Number(a.capability || 0) > Number(b.capability || 0) ? a : b, as[0]);
      return { success: coord >= 0.5, kind: 'compute', output: { agents: as.length, conflicts, coordination: coord, leadAgent: lead.id || 'A0' },
        error: coord < 0.5 ? `冲突过多 ${conflicts}` : undefined, reason: coord < 0.5 ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${t}] multi-agent-v1: ${as.length} 体，协同 ${coord}`] };
    }],
  ['PROTOCOL_NEGOTIATION_V1', '协商协议', 'compute',
    ['positions'], (inp, t) => {
      const ps = inp.positions || [];
      if (ps.length < 2) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '至少 2 方立场' };
      const vals = ps.map((p) => Number(p.value ?? 0));
      const mid = round(mean(vals));
      const spread = round(Math.max(...vals) - Math.min(...vals));
      const dealZone = spread <= Number(inp.maxSpread ?? 1);
      return { success: dealZone, kind: 'compute', output: { parties: ps.length, positions: vals, midpoint: mid, spread, dealZone, suggestion: dealZone ? `以 ${mid} 为折中点` : '分歧过大，需引入新维度' },
        error: dealZone ? undefined : `立场分歧 ${spread} 过大，无协议区`, reason: dealZone ? undefined : 'PRECONDITION_FAILED',
        provenance: [`[${t}] negotiation: ${ps.length} 方，分歧 ${spread}，协议区 ${dealZone}`] };
    }],
  ['PROTOCOL_OPPONENT_V1', '反者协议', 'compute',
    ['proposition', 'weight'], (inp, t) => {
      const p = String(inp.proposition || '命题'), w = clamp01(inp.weight ?? 0.6);
      return { success: true, kind: 'compute', output: { proposition: p, opposite: `非(${p})`, originalWeight: round(w), oppositeWeight: round(1 - w), rule: '反者道之动：反向权重 = 1 − 正向权重' },
        provenance: [`[${t}] opponent: 「${p}」对偶权重 ${round(1 - w)}`] };
    }],
  ['PROTOCOL_RG_V1', '规则治理协议', 'rule',
    ['rules'], (inp, t) => {
      const rs = inp.rules || [];
      if (!rs.length) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 rules' };
      const F = ['id', 'condition', 'action', 'priority'];
      const bad = rs.map((r, i) => ({ i, m: F.filter((k) => r[k] === undefined) })).filter((x) => x.m.length);
      const dupIds = rs.map((r) => r.id).filter((v, i, a) => a.indexOf(v) !== i);
      const ok = bad.length === 0 && dupIds.length === 0;
      return { success: ok, kind: 'rule', output: { rules: rs.length, incomplete: bad, duplicateIds: [...new Set(dupIds)] },
        error: bad.length ? `${bad.length} 条规则字段不全` : dupIds.length ? `重复规则 ID：${[...new Set(dupIds)].join(',')}` : undefined,
        reason: ok ? undefined : 'RULE_VIOLATED',
        provenance: [`[${t}] rg: ${rs.length} 规则，不合格 ${bad.length}，重复 ${dupIds.length}`] };
    }],
  ['PROTOCOL_STRATEGY_V1', '战略协议', 'compute',
    ['dims'], (inp, t) => {
      const d = inp.dims || {};
      const D = ['tech', 'economy', 'institution', 'policy'];
      const known = D.filter((k) => d[k] !== undefined);
      if (!known.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: `必须提供 ${D.join('/')} 至少一维` };
      const score = round(mean(known.map((k) => clamp01(d[k]))));
      return { success: score >= 0.6, kind: 'compute', output: { dimensions: D, provided: known, alignment: score, verdict: score >= 0.75 ? '可推' : score >= 0.6 ? '谨慎推' : '不宜推' },
        error: score < 0.6 ? `战略适配 ${score} < 0.6` : undefined, reason: score < 0.6 ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${t}] strategy: ${known.length}/4 维，适配 ${score}`] };
    }],
  ['PROTOCOL_TIME_RECON_V1', '时间重构协议', 'compute',
    ['events'], (inp, t) => {
      const ev = inp.events || [];
      if (!ev.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 events' };
      const sorted = [...ev].sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
      const monotonic = ev.every((e, i) => i === 0 || String(e.timestamp) >= String(ev[i - 1].timestamp));
      const overlaps = [];
      for (let i = 1; i < sorted.length; i++) if (sorted[i].start && sorted[i - 1].end && sorted[i].start < sorted[i - 1].end) overlaps.push([i - 1, i]);
      return { success: monotonic && overlaps.length === 0, kind: 'compute', output: { events: ev.length, monotonic, overlaps: overlaps.length, reconstructed: monotonic && overlaps.length === 0 },
        error: !monotonic ? '时间戳非单调' : overlaps.length ? `${overlaps.length} 处时间冲突` : undefined,
        reason: (!monotonic || overlaps.length) ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${t}] time-recon: ${ev.length} 事件，单调 ${monotonic}，冲突 ${overlaps.length}`] };
    }],
];

for (const [id, name, kind, fields, fn] of GAP_P) {
  addP({ id, name, kind, src: '缺口 29（根文档/17 文件）；依名称语义 + 元构通用模式实现', implements: [fields.length ? `判据：${fields.join('/')}` : '语义检测'], exec: fn });
}

/* ══════════ 二、2 条缺失引擎 ══════════ */
addE({
  id: 'ENGINE_GLOBAL_AWARENESS_166', name: '全球态势感知引擎', kind: 'compute',
  src: '第4部分（对应 PROTOCOL_GLOBAL_AWARENESS_V1）', implements: ['六维态势加权 + 风险识别'],
  exec(inp, t) {
    const D = ['地缘', '经济', '技术', '环境', '社会', '安全'];
    const v = inp.dims || {};
    const known = D.filter((k) => v[k] !== undefined);
    if (!known.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: `必须提供 ${D.join('/')} 至少一维` };
    const overall = round(mean(known.map((k) => clamp01(v[k]))));
    const risks = known.filter((k) => clamp01(v[k]) < 0.4).map((k) => ({ dim: k, value: v[k] }));
    return { success: known.length === D.length, kind: 'compute', output: { dimensions: D, provided: known, overall, risks, complete: known.length === D.length },
      error: known.length < D.length ? `缺维度：${D.filter((k) => v[k] === undefined).join('/')}` : undefined,
      reason: known.length < D.length ? 'PRECONDITION_FAILED' : undefined,
      provenance: [`[${t}] global-awareness-engine: ${known.length}/6 维，综合 ${overall}`] };
  },
});
addE({
  id: 'ENGINE_RECURSIVE_ENCAPSULATE_26', name: '递归封装引擎', kind: 'pipeline',
  src: '附录卷-第2部分 L6286', implements: ['四步：标准化转换→生成接口→预计算耦生度→纳入能力库'],
  exec(inp, t) {
    const cap = inp.capability;
    if (!cap || !cap.id) return { success: false, kind: 'pipeline', reason: 'INVALID_INPUT', error: '必须提供含 id 的 capability' };
    const STEPS = ['标准化转换', '生成接口', '预计算耦生度', '纳入能力库'];
    const coupling = round(clamp01(inp.precomputedCoupling ?? 0.75));
    return { success: true, kind: 'pipeline', output: { steps: STEPS, interface: { id: cap.id, name: cap.name, inputs: cap.inputs || [], outputs: cap.outputs || [] }, coupling, libraryEntry: cap.id, layer: 'L8创新创造层' },
      provenance: [`[${t}] recursive-encapsulate: ${cap.id} 封装，耦生 ${coupling}`] };
  },
});

/* ══════════ 运行时 ══════════ */
const mk = (arr, idKey) => {
  const INDEX = new Map(arr.map((x) => [x.id, x]));
  return {
    INDEX,
    kindOf: (id) => { const x = INDEX.get(id); return x ? x.kind : 'declared'; },
    getRegistry: () => arr.map((x) => ({ id: x.id, name: x.name, kind: x.kind, src: x.src, implements: x.implements || [] })),
    executeSync(id, input) {
      const t0 = Date.now(), t = tid();
      const x = INDEX.get(id);
      if (!x) return { success: false, kind: 'declared', reason: 'NOT_FOUND', error: `${id} 未登记`, provenance: [], traceId: t, durationMs: 0 };
      let r;
      try { r = x.exec(input || {}, t); } catch (e) { r = { success: false, kind: x.kind, error: 'THROW: ' + e.message, provenance: [`[${t}] THROW`] }; }
      return { ...r, traceId: t, durationMs: Date.now() - t0 };
    },
  };
};
const RT = mk(P);
const ET = mk(E);

module.exports = {
  PROTOCOLS: P, ENGINES: E,
  executeProtocolSync: RT.executeSync, getProtocolRegistry: RT.getRegistry, kindOfProtocol: RT.kindOf,
  executeEngineSync: ET.executeSync, getEngineRegistry: ET.getRegistry, kindOfEngine: ET.kindOf,
};
