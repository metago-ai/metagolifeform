#!/usr/bin/env node
/**
 * P6-B1 · 协议运行时（ProtocolRuntime）
 *
 * 设计要点：
 *   - 与原子/算法层同构的诚实范式：先声明 kind，再执行
 *   - ExecResult 带 provenance（A1 溯源公理）+ traceId（法则 4.6.1）
 *   - pipeline 类必须逐阶段校验前置条件，阶段未通过即 fail（不得跳过）
 *   - external 类诚实拒绝（EXTERNAL_REQUIRED），禁止假成功
 *
 * 本文件同时是运行时与 B1 的 11 条协议实现（18 个执行单元）：
 *   PROTOCOL_DECISION_LOCK_V1        — 4 关（IVL / ILT / OSG / 内容完整性）
 *   PROTOCOL_META_EVOLUTION_V1       — 5 阶段（边界感知/差距分析/自生成/验证/递归）
 *   PROTOCOL_META_META_DECISION      — 元元决策
 *   PROTOCOL_META_META_DIRECTION     — 元元方向
 *   PROTOCOL_META_META_MIRROR        — 元元镜像
 *   PROTOCOL_META_META_MONITOR       — 元元监控
 *   PROTOCOL_META_META_STRATEGY      — 元元战略
 *   PROTOCOL_META_CREATION_001       — 元创造·边界突破
 *   PROTOCOL_META_CREATION_002       — 元创造·内生生成
 *   PROTOCOL_META_CREATION_003       — 元创造·验证固化
 *   PROTOCOL_META_CREATION_V1        — 元创造总纲
 */
'use strict';

let __seq = 0;
function newTraceId() {
  const d = new Date();
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${p((++__seq) % 10000, 4)}`;
}

const ok = (r, extra) => Object.assign({ ok: true, evidence: r }, extra || {});
const bad = (reason, extra) => Object.assign({ ok: false, reason }, extra || {});

/* ══════════════════════════════════════════════════════════════
 * 一、裁决锁 4 关（PROTOCOL_DECISION_LOCK_V1）
 * 依据：AGENTS.md §4.2 决策锁强制校验 + 蓝本第一章第1-3条
 * ══════════════════════════════════════════════════════════════ */

/** 第 1 关 IVL 意图验证：输出是否回应了真实意图（而非字面） */
function gateIVL(input) {
  const intent = input && input.intent;
  const output = input && input.output;
  if (!intent || typeof intent !== 'string') return bad('意图缺失或非字符串', { gate: 'IVL' });
  if (!output || typeof output !== 'string') return bad('输出缺失或非字符串', { gate: 'IVL' });
  /* 意图覆盖率：优先按分隔符切词；中文无分隔符时退化为 2-gram 覆盖率。
     修复记录（P6-B1 自测发现）：原实现把「验证交付物是否完整可用」整句当 1 个 token，
     输出中当然不含该整串 → 覆盖率恒 0 → 正常输入被误判失败。 */
  const isCJK = (s) => /[\u4e00-\u9fa5]/.test(s);
  let tokens = intent.split(/[\s,，。;；、：:（）()]+/).filter((t) => t.length >= 2);
  let mode = 'word';
  if (tokens.length <= 1 && isCJK(intent)) {
    /* 2-gram：去掉标点后按相邻两字切 */
    const clean = intent.replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '');
    const g = [];
    for (let i = 0; i + 2 <= clean.length; i++) g.push(clean.slice(i, i + 2));
    tokens = g;
    mode = 'cjk-bigram';
  }
  if (!tokens.length) return bad('意图无法切出有效词', { gate: 'IVL' });
  const hit = tokens.filter((t) => output.includes(t));
  const coverage = hit.length / tokens.length;
  return ok({ gate: 'IVL', mode, coverage: +coverage.toFixed(3), hitTokens: hit.length, totalTokens: tokens.length },
    { pass: coverage >= 0.5 });
}

/** 第 2 关 ILT 意图谱系追踪：输出是否可追溯到输入链 */
function gateILT(input) {
  const lineage = input && input.lineage;
  if (!Array.isArray(lineage)) return bad('谱系链缺失或非数组', { gate: 'ILT' });
  if (lineage.length < 1) return bad('谱系链为空（A1 溯源公理要求 ≥1 级）', { gate: 'ILT' });
  const broken = lineage.filter((x) => !x || !x.source || !x.claim);
  return ok({ gate: 'ILT', links: lineage.length, broken: broken.length }, { pass: broken.length === 0 });
}

/** 第 3 关 OSG 语义输出门：输出不得含幻觉/占位符/空断言 */
function gateOSG(input) {
  const output = input && input.output;
  if (typeof output !== 'string') return bad('输出缺失', { gate: 'OSG' });
  const patterns = [
    { re: /TODO|FIXME|待补充|待定|视情况|酌情/g, name: '占位符' },
    { re: /\{\{[^}]+\}\}|<PLACEHOLDER>/g, name: '未替换占位符' },
    { re: /应该没问题|大概可以|可能是|估计是/g, name: '模糊填充词' },
    { re: /\bundefined\b|\bNaN\b/g, name: '未定义值泄漏' },
  ];
  const hits = [];
  for (const p of patterns) {
    const m = output.match(p.re);
    if (m) hits.push({ name: p.name, count: m.length, samples: [...new Set(m)].slice(0, 3) });
  }
  return ok({ gate: 'OSG', violations: hits }, { pass: hits.length === 0 });
}

/** 第 4 关 内容完整性：声明与证据是否匹配 */
function gateIntegrity(input) {
  const claims = input && input.claims;
  if (!Array.isArray(claims)) return bad('claims 缺失或非数组', { gate: 'INTEGRITY' });
  const unsupported = claims.filter((c) => !c || !c.claim || !c.evidence || String(c.evidence).trim() === '');
  return ok({ gate: 'INTEGRITY', claims: claims.length, unsupported: unsupported.length },
    { pass: unsupported.length === 0 });
}

/* ══════════════════════════════════════════════════════════════
 * 二、元进化 5 阶段（PROTOCOL_META_EVOLUTION_V1）
 * 依据：蓝本第二章第2条「五阶段流程」
 *   2.1 边界感知 → 必须输出边界描述
 *   2.2 差距分析 → 必须输出差距向量
 *   2.3 自生成   → 必须输出新能力
 *   2.4 验证     → 必须通过验证才能保留
 *   2.5 递归     → 必须进行自我审视
 * ══════════════════════════════════════════════════════════════ */

function stageBoundary(input) {
  const b = input && input.boundary;
  if (!b || typeof b !== 'object') return bad('边界描述缺失（2.1 要求必须输出边界描述）', { stage: 1 });
  const need = ['capability', 'limit', 'observedAt'];
  const miss = need.filter((k) => !b[k]);
  return ok({ stage: 1, name: '边界感知', boundary: b }, { pass: miss.length === 0, missing: miss });
}

function stageGap(input) {
  const g = input && input.gap;
  if (!g || typeof g !== 'object') return bad('差距向量缺失（2.2 要求必须输出差距向量）', { stage: 2 });
  const vec = g.vector;
  if (!Array.isArray(vec) || vec.length === 0) return bad('差距向量必须是非空数组', { stage: 2 });
  const norm = Math.sqrt(vec.reduce((s, x) => s + (Number(x) || 0) ** 2, 0));
  return ok({ stage: 2, name: '差距分析', dims: vec.length, norm: +norm.toFixed(4) }, { pass: norm > 0 });
}

function stageSelfGenerate(input) {
  const n = input && input.newCapability;
  if (!n || typeof n !== 'object') return bad('新能力缺失（2.3 要求必须输出新能力）', { stage: 3 });
  const need = ['id', 'name', 'kind'];
  const miss = need.filter((k) => !n[k]);
  return ok({ stage: 3, name: '自生成', newCapability: n }, { pass: miss.length === 0, missing: miss });
}

function stageVerify(input) {
  const v = input && input.verification;
  if (!v || typeof v !== 'object') return bad('验证结果缺失（2.4 要求必须通过验证才能保留）', { stage: 4 });
  const passed = v.passed === true;
  return ok({ stage: 4, name: '验证', passed, checks: Array.isArray(v.checks) ? v.checks.length : 0 }, { pass: passed });
}

function stageRecurse(input) {
  const r = input && input.selfReflection;
  if (!r || typeof r !== 'object') return bad('自我审视缺失（2.5 要求必须进行自我审视）', { stage: 5 });
  const hasMeta = r.canMetaEvolve === true;
  const depth = Number(r.depth) || 0;
  // 第4条递归保障：元进化后的系统必须具备元进化能力 + 深度可追踪
  return ok({ stage: 5, name: '递归', canMetaEvolve: hasMeta, depth }, { pass: hasMeta && depth >= 1 });
}

/** 耦生保持校验（第三章第3条：元进化前后耦生度 ≥0.95） */
function checkCouplingPreserved(input) {
  const before = Number(input && input.couplingBefore);
  const after = Number(input && input.couplingAfter);
  if (!isFinite(before) || !isFinite(after)) return { ok: false, reason: '耦生度缺失（第3条要求 ≥0.95）' };
  const delta = +(after - before).toFixed(4);
  return { ok: after >= 0.95, delta, before, after };
}

/* ══════════════════════════════════════════════════════════════
 * 三、执行引擎
 * ══════════════════════════════════════════════════════════════ */

function runPipeline(stages, input, traceId) {
  const steps = [];
  const prov = [];
  for (const st of stages) {
    let r;
    try { r = st.fn(input); } catch (e) { r = bad('THROW: ' + e.message); }
    const passed = r && r.ok && (r.pass !== false);
    steps.push({ id: st.id, name: st.name, ok: !!passed, reason: r && r.reason, evidence: r && r.evidence });
    prov.push(`[${traceId}] ${st.id} ${st.name} → ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) {
      return { success: false, kind: 'pipeline', steps, provenance: prov, traceId,
        reason: r && r.reason ? 'PRECONDITION_FAILED' : 'STAGE_FAILED',
        error: `${st.id} ${st.name} 未通过：${(r && r.reason) || '阶段判据不成立'}` };
    }
  }
  return { success: true, kind: 'pipeline', output: { stages: steps.length }, steps, provenance: prov, traceId };
}

function runRule(rules, input, traceId) {
  const steps = [];
  const prov = [];
  for (const rl of rules) {
    let r;
    try { r = rl.fn(input); } catch (e) { r = bad('THROW: ' + e.message); }
    const passed = r && r.ok && (r.pass !== false);
    steps.push({ id: rl.id, name: rl.name, ok: !!passed, reason: r && r.reason, evidence: r && r.evidence });
    prov.push(`[${traceId}] ${rl.id} ${rl.name} → ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) {
      return { success: false, kind: 'rule', steps, provenance: prov, traceId, reason: 'RULE_VIOLATED',
        error: `${rl.id} ${rl.name} 违规：${(r && r.reason) || '判据不成立'}` };
    }
  }
  return { success: true, kind: 'rule', output: { rules: steps.length }, steps, provenance: prov, traceId };
}

/* ══════════════════════════════════════════════════════════════
 * 四、注册表（B1：11 条协议 / 18 个执行单元）
 * ══════════════════════════════════════════════════════════════ */

const REGISTRY = [
  /* ── 决策锁：4 关 ── */
  {
    id: 'PROTOCOL_DECISION_LOCK_V1', name: 'Agent决策可靠性协议', kind: 'pipeline', units: 4,
    source: 'PROTOCOL-CONTRACTS.json（clause, 588 字符）+ AGENTS.md §4.2',
    stages: [
      { id: 'IVL', name: '意图验证', fn: gateIVL },
      { id: 'ILT', name: '意图谱系追踪', fn: gateILT },
      { id: 'OSG', name: '语义输出门', fn: gateOSG },
      { id: 'INTEGRITY', name: '内容完整性', fn: gateIntegrity },
    ],
    exec: (input, tid) => runPipeline(REGISTRY[0].stages, input, tid),
  },
  /* ── 元进化：5 阶段 + 耦生保持 ── */
  {
    id: 'PROTOCOL_META_EVOLUTION_V1', name: '元进化协议 V1.1', kind: 'pipeline', units: 5,
    source: 'PROTOCOL-CONTRACTS.json（yaml-block, 1748 字符）第二章第2条',
    stages: [
      { id: 'S1', name: '边界感知', fn: stageBoundary },
      { id: 'S2', name: '差距分析', fn: stageGap },
      { id: 'S3', name: '自生成', fn: stageSelfGenerate },
      { id: 'S4', name: '验证', fn: stageVerify },
      { id: 'S5', name: '递归', fn: stageRecurse },
    ],
    exec: (input, tid) => {
      const base = runPipeline(REGISTRY[1].stages, input, tid);
      if (!base.success) return base;
      // 第三章第3条：耦生保持 ≥0.95（仅当调用方提供耦生度时校验）
      if (input && (input.couplingBefore !== undefined || input.couplingAfter !== undefined)) {
        const c = checkCouplingPreserved(input);
        base.steps.push({ id: 'COUPLING', name: '耦生保持(≥0.95)', ok: c.ok, reason: c.reason, evidence: c });
        base.provenance.push(`[${tid}] COUPLING 耦生保持 → ${c.ok ? 'PASS' : 'FAIL'}`);
        if (!c.ok) {
          return { ...base, success: false, reason: 'COUPLING_LOST',
            error: `耦生度 ${c.after} < 0.95 或缺失（第3条），元进化不得破坏已有能力` };
        }
      }
      return base;
    },
  },
  /* ── 元元协议族 5 ── */
  {
    id: 'PROTOCOL_META_META_DECISION', name: '元元决策协议', kind: 'pipeline', units: 1,
    source: '缺口 29（PROTOCOL_META_META_* 族）；语义依 A34「元进化需元进化」',
    stages: [
      { id: 'MM_D1', name: '决策对象是否本身是决策机制', fn: (i) => {
        const t = i && i.target;
        if (!t) return bad('target 缺失');
        return { ok: true, pass: !!(t.isDecisionSystem === true), evidence: { target: t.id || t.name || '?', isDecisionSystem: !!t.isDecisionSystem } };
      } },
      { id: 'MM_D2', name: '二阶决策不得自我授权', fn: (i) => {
        const a = i && i.authorization;
        if (!a) return bad('authorization 缺失');
        return { ok: true, pass: a.external === true && a.selfGranted !== true, evidence: a };
      } },
    ],
    exec: (i, tid) => runPipeline(REGISTRY[2].stages, i, tid),
  },
  {
    id: 'PROTOCOL_META_META_DIRECTION', name: '元元方向协议', kind: 'pipeline', units: 1,
    source: '缺口 29；语义依 A34',
    stages: [
      { id: 'MM_DIR1', name: '方向必须有可比较的基线', fn: (i) => {
        const d = i && i.direction;
        if (!d) return bad('direction 缺失');
        return { ok: true, pass: Array.isArray(d.baseline) && d.baseline.length > 0, evidence: { baseline: d.baseline } };
      } },
      { id: 'MM_DIR2', name: '目标向量与基线同维', fn: (i) => {
        const d = i && i.direction;
        const ok2 = d && Array.isArray(d.baseline) && Array.isArray(d.target) && d.baseline.length === d.target.length;
        return { ok: true, pass: !!ok2, reason: ok2 ? undefined : '基线/目标维度不一致', evidence: { b: d && d.baseline && d.baseline.length, t: d && d.target && d.target.length } };
      } },
    ],
    exec: (i, tid) => runPipeline(REGISTRY[3].stages, i, tid),
  },
  {
    id: 'PROTOCOL_META_META_MIRROR', name: '元元镜像协议', kind: 'pipeline', units: 1,
    source: '缺口 29；语义依蓝本元镜引擎（自我审视）',
    stages: [
      { id: 'MM_M1', name: '必须声明被审视对象', fn: (i) => {
        const m = i && i.mirror;
        if (!m) return bad('mirror 缺失');
        return { ok: true, pass: !!(m.subject && m.subject.length), evidence: { subject: m.subject } };
      } },
      { id: 'MM_M2', name: '审视结论必须有证据', fn: (i) => {
        const m = i && i.mirror;
        const ev = m && m.findings;
        return { ok: true, pass: Array.isArray(ev) && ev.length > 0 && ev.every((f) => f && f.evidence), evidence: { findings: ev && ev.length } };
      } },
    ],
    exec: (i, tid) => runPipeline(REGISTRY[4].stages, i, tid),
  },
  {
    id: 'PROTOCOL_META_META_MONITOR', name: '元元监控协议', kind: 'rule', units: 1,
    source: '缺口 29；语义依 A34 + 法则 4.1 五阶段递归',
    rules: [
      { id: 'MM_MON1', name: '进化深度必须可追踪', fn: (i) => {
        const d = Number(i && i.evolutionDepth);
        if (!isFinite(d)) return bad('evolutionDepth 缺失');
        return { ok: true, pass: d >= 1, evidence: { depth: d } };
      } },
      { id: 'MM_MON2', name: '连续 3 轮效果 <5% 必须升级元元', fn: (i) => {
        const g = i && i.gains;
        if (!Array.isArray(g)) return bad('gains 缺失');
        const last3 = g.slice(-3);
        const stale = last3.length === 3 && last3.every((x) => Number(x) < 0.05);
        return { ok: true, pass: !stale, reason: stale ? '连续3轮进化效果<5%，须升级到元元层级' : undefined, evidence: { last3 } };
      } },
    ],
    exec: (i, tid) => runRule(REGISTRY[5].rules, i, tid),
  },
  {
    id: 'PROTOCOL_META_META_STRATEGY', name: '元元战略协议', kind: 'pipeline', units: 1,
    source: '缺口 29；语义依元进化协议第四章第11条（战略思考五步）',
    stages: [
      { id: 'MM_S1', name: '元镜自我审视', fn: (i) => {
        const s = i && i.strategy;
        return { ok: true, pass: !!(s && s.selfReview), evidence: { selfReview: s && s.selfReview } };
      } },
      { id: 'MM_S2', name: '八大能力族全维度清单', fn: (i) => {
        const need = ['认知能力族','治理能力族','资产能力族','保障能力族','执行能力族','权限能力族','工业互联族','元进化族'];
        const fams = (i && i.strategy && i.strategy.capabilityFamilies) || [];
        const miss = need.filter((f) => !fams.includes(f));
        return { ok: true, pass: miss.length === 0, reason: miss.length ? '缺能力族：' + miss.join('、') : undefined, evidence: { covered: fams.length, missing: miss } };
      } },
      { id: 'MM_S3', name: '声明未考虑维度', fn: (i) => {
        const u = i && i.strategy && i.strategy.unconsidered;
        return { ok: true, pass: Array.isArray(u), reason: Array.isArray(u) ? undefined : 'unconsidered 必须显式声明（可为空数组）', evidence: { unconsidered: u } };
      } },
    ],
    exec: (i, tid) => runPipeline(REGISTRY[6].stages, i, tid),
  },
  /* ── 元创造协议族 4 ── */
  {
    id: 'PROTOCOL_META_CREATION_001', name: '元创造·边界突破协议', kind: 'pipeline', units: 1,
    source: '缺口 29；语义依 A35 创造进化律（逻辑缺口无法用现有组件重组关闭时进入元创造）',
    stages: [
      { id: 'MC1_A', name: '必须证明现有组件无法闭合缺口', fn: (i) => {
        const c = i && i.closureAttempt;
        if (!c) return bad('closureAttempt 缺失');
        const ok2 = c.attempted === true && Array.isArray(c.components) && c.components.length > 0 && c.exhausted === true;
        return { ok: true, pass: ok2, reason: ok2 ? undefined : '未证明现有组件已穷尽', evidence: { tried: c.components && c.components.length, exhausted: c.exhausted } };
      } },
      { id: 'MC1_B', name: '新组件必须是"最小、最高效"', fn: (i) => {
        const n = i && i.proposedComponent;
        if (!n) return bad('proposedComponent 缺失');
        return { ok: true, pass: !!(n.minimal === true && n.id && n.kind), evidence: n };
      } },
    ],
    exec: (i, tid) => runPipeline(REGISTRY[7].stages, i, tid),
  },
  {
    id: 'PROTOCOL_META_CREATION_002', name: '元创造·内生生成协议', kind: 'pipeline', units: 1,
    source: '缺口 29；语义依 A5 内生公理（创造能力内生，不依赖外部数据输入）',
    stages: [
      { id: 'MC2_A', name: '不得依赖外部数据输入', fn: (i) => {
        const d = i && i.inputs;
        if (!d) return bad('inputs 缺失');
        return { ok: true, pass: d.externalDataUsed !== true, reason: d.externalDataUsed ? '违反 A5 内生公理：不得依赖外部数据输入' : undefined, evidence: { externalDataUsed: d.externalDataUsed } };
      } },
      { id: 'MC2_B', name: '必须声明内生来源', fn: (i) => {
        const s = i && i.internalSource;
        const valid = ['existing-components','recombination','constraint-driven','boundary-sensing'];
        return { ok: true, pass: !!s && valid.includes(s), reason: s && !valid.includes(s) ? '非法的内生来源：' + s : undefined, evidence: { internalSource: s, allowed: valid } };
      } },
    ],
    exec: (i, tid) => runPipeline(REGISTRY[8].stages, i, tid),
  },
  {
    id: 'PROTOCOL_META_CREATION_003', name: '元创造·验证固化协议', kind: 'pipeline', units: 1,
    source: '缺口 29；语义依元进化五阶段第 4 步「验证→必须通过验证才能保留」',
    stages: [
      { id: 'MC3_A', name: '新创造必须通过验证才可保留', fn: (i) => {
        const v = i && i.verification;
        if (!v) return bad('verification 缺失');
        return { ok: true, pass: v.passed === true && Array.isArray(v.checks) && v.checks.length > 0, evidence: { passed: v.passed, checks: v.checks && v.checks.length } };
      } },
      { id: 'MC3_B', name: '固化必须有版本与来源', fn: (i) => {
        const f = i && i.freezing;
        if (!f) return bad('freezing 缺失');
        return { ok: true, pass: !!(f.version && f.sourceRef), evidence: f };
      } },
    ],
    exec: (i, tid) => runPipeline(REGISTRY[9].stages, i, tid),
  },
  {
    id: 'PROTOCOL_META_CREATION_V1', name: '元创造总纲协议', kind: 'pipeline', units: 1,
    source: '缺口 29；串联 001→002→003',
    stages: [
      { id: 'MCV_1', name: '边界突破前置', fn: (i) => {
        const c = i && i.closureAttempt;
        return { ok: true, pass: !!(c && c.exhausted === true), reason: c && c.exhausted !== true ? '未完成边界突破前置（见 001）' : undefined };
      } },
      { id: 'MCV_2', name: '内生生成前置', fn: (i) => {
        return { ok: true, pass: !!(i && i.inputs && i.inputs.externalDataUsed !== true && i.internalSource), reason: '未完成内生生成前置（见 002）' };
      } },
      { id: 'MCV_3', name: '验证固化前置', fn: (i) => {
        const v = i && i.verification, f = i && i.freezing;
        return { ok: true, pass: !!(v && v.passed === true && f && f.version), reason: '未完成验证固化前置（见 003）' };
      } },
      { id: 'MCV_4', name: '创造必须有谱系（可回溯到缺口）', fn: (i) => {
        const l = i && i.lineage;
        return { ok: true, pass: Array.isArray(l) && l.length > 0 && l.every((x) => x && x.source), evidence: { links: l && l.length } };
      } },
    ],
    exec: (i, tid) => runPipeline(REGISTRY[10].stages, i, tid),
  },
];

/* ══════════════════════════════════════════════════════════════
 * 五、公开接口
 * ══════════════════════════════════════════════════════════════ */

const INDEX = new Map(REGISTRY.map((p) => [p.id, p]));

function kindOf(id) { const p = INDEX.get(id); return p ? p.kind : 'declared'; }
function getRegistry() { return REGISTRY.map((p) => ({ id: p.id, name: p.name, kind: p.kind, units: p.units, source: p.source })); }

function executeSync(id, input) {
  const t0 = Date.now();
  const p = INDEX.get(id);
  const tid = newTraceId();
  if (!p) return { success: false, kind: 'declared', reason: 'NOT_FOUND', error: `协议 ${id} 未登记`, provenance: [], traceId: tid, durationMs: 0 };
  let r;
  try { r = p.exec(input || {}, tid); }
  catch (e) { r = { success: false, kind: p.kind, error: 'THROW: ' + e.message, provenance: [`[${tid}] THROW`], traceId: tid }; }
  r.durationMs = Date.now() - t0;
  r.protocolId = id;
  r.protocolName = p.name;
  return r;
}

async function execute(id, input) { return executeSync(id, input); }

module.exports = { executeSync, execute, kindOf, getRegistry, REGISTRY, INDEX, newTraceId, _internals: { gateIVL, gateILT, gateOSG, gateIntegrity, stageBoundary, stageGap, stageSelfGenerate, stageVerify, stageRecurse } };
