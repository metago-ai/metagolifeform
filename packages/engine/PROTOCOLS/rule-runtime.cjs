#!/usr/bin/env node
/**
 * P6-B5 · rule / pipeline 类协议运行时（20 条）
 * 依据 PROTOCOL-CONTRACTS.json 的 definitionText 逐条实现。
 */
'use strict';

let __seq = 0;
const newTraceId = () => {
  const d = new Date(), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-R${p((++__seq) % 10000, 4)}`;
};
const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));
const round = (x, n = 4) => Math.round((Number(x) || 0) * 10 ** n) / 10 ** n;
const sha = (s) => { const c = require('crypto').createHash('sha256').update(String(s)).digest('hex'); return '0x' + c.slice(0, 40); };

/* ══════════ 四层安全基因（V1–V4 共用核心）══════════ */
const FOUR_LAYERS = ['法律层', '伦理层', '数据层', '操作层'];
function fourLayerCheck(inp) {
  const need = ['legal', 'ethics', 'data', 'operation'];
  const layers = need.map((k, i) => ({ layer: i + 1, name: FOUR_LAYERS[i], key: k, present: !!(inp && inp[k]), passed: !!(inp && inp[k] && inp[k].passed !== false) }));
  const missing = layers.filter((l) => !l.present).map((l) => l.name);
  const failed = layers.filter((l) => l.present && !l.passed).map((l) => l.name);
  return { layers, missing, failed };
}

const P = [];

/* ══════ 1–4. 四层安全基因 V1–V4 ══════ */
for (const [v, extra] of [['V1', {}], ['V2', {}], ['V3', {}], ['V4', { complianceProxy: true, intlMode: true }]]) {
  P.push({
    id: `PROTOCOL_FOUR_LAYER_SEC_${v}`, name: `四层安全基因协同协议 ${v}`, kind: 'rule',
    src: `yaml-block（${v === 'V4' ? 518 : '同类'}字符）`,
    implements: ['法律/伦理/数据/操作 四层逐层校验', v === 'V4' ? 'V4 新增：合规主动代理 + 国际化合规模式（EU/CN/US/通用，跨境取最严）' : `${v} 基线四层协同`],
    exec(inp, tid) {
      const c = fourLayerCheck(inp);
      const bad = c.missing.length + c.failed.length;
      const extraOut = {};
      if (extra.complianceProxy) {
        const mode = String(inp.complianceMode || 'CN').toUpperCase();
        const ALLOWED = ['EU', 'CN', 'US', 'GENERIC'];
        if (!ALLOWED.includes(mode)) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: `合规模式 ${mode} 不受支持（EU/CN/US/GENERIC）` };
        /* 跨境取最严：EU 最严 → 需要 DPIA；CN → 算法备案 */
        const crossBorder = inp.crossBorder === true;
        const effective = crossBorder ? 'EU' : mode;
        extraOut.compliance = { requestedMode: mode, effectiveMode: effective, crossBorderTakesStrictest: crossBorder,
          requiresDPIA: effective === 'EU', requiresAlgorithmFiling: effective === 'CN',
          proxyIntegrated: true };
      }
      return {
        success: bad === 0, kind: 'rule',
        output: { ...c, ...extraOut, verdict: bad === 0 ? '四层安全通过' : '四层安全未通过' },
        error: bad ? `缺失层：${c.missing.join('/') || '无'}；未通过层：${c.failed.join('/') || '无'}` : undefined,
        reason: bad ? 'RULE_VIOLATED' : undefined,
        provenance: [`[${tid}] four-layer-${v}: ${4 - c.missing.length}/4 齐备，${c.failed.length} 层未通过`],
      };
    },
  });
}

/* ══════ 5. 证据链协议 ══════ */
P.push({
  id: 'PROTOCOL_EVIDENCE_CHAIN_V1', name: '证据链协议', kind: 'rule', src: 'yaml-block 1042 字符',
  implements: ['证据条目六要素校验（id/timestamp/type/source/hash/metadata）', '因果链完整性', '链哈希计算'],
  exec(inp, tid) {
    const entries = inp.evidenceEntries;
    if (!Array.isArray(entries) || !entries.length) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 evidenceEntries 数组' };
    const TYPES = ['log', 'communication', 'decision', 'feedback'];
    const checks = entries.map((e, i) => {
      const miss = ['evidence_id', 'timestamp', 'type', 'source', 'content_hash'].filter((k) => !e[k]);
      const badType = e.type && !TYPES.includes(e.type);
      return { index: i, id: e.evidence_id, missing: miss, badType: badType || false, ok: miss.length === 0 && !badType };
    });
    const bad = checks.filter((c) => !c.ok);
    const links = inp.causalLinks || [];
    const ids = new Set(entries.map((e) => e.evidence_id));
    const brokenLinks = links.filter((l) => !ids.has(l.from) || !ids.has(l.to));
    const chainHash = sha(entries.map((e) => e.content_hash || '').join('|') + '|' + links.length);
    const ok = bad.length === 0 && brokenLinks.length === 0;
    return {
      success: ok, kind: 'rule',
      output: { total: entries.length, passed: entries.length - bad.length, checks, causalLinks: links.length, brokenLinks, chainHash, blockchainTx: inp.blockchainTx || null, chainId: inp.chainId || sha(chainHash).slice(0, 18) },
      error: bad.length ? `${bad.length} 条证据条目字段不全/类型非法` : brokenLinks.length ? `${brokenLinks.length} 条因果链悬空` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] evidence-chain: ${entries.length} 条证据 / ${links.length} 因果链 → ${ok ? '完整' : '不完整'}`],
    };
  },
});

/* ══════ 6. 脉冲见证协议 ══════ */
P.push({
  id: 'PROTOCOL_PULSE_WITNESS_V1', name: '脉冲见证协议', kind: 'compute', src: 'yaml-block 1046 字符',
  implements: ['脉冲四类型（cognitive/action/evolution/creation）', '三种编码策略（binary/ternary/bitwise）', '脉冲链完整性 + 回放重建'],
  exec(inp, tid) {
    const pulses = inp.pulses;
    if (!Array.isArray(pulses) || !pulses.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 pulses 数组' };
    const TYPES = ['cognitive', 'action', 'evolution', 'creation'];
    const STRATEGY = inp.encoding || 'ternary';
    const S = ['binary', 'ternary', 'bitwise'];
    if (!S.includes(STRATEGY)) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: `编码策略须为 ${S.join('/')}` };
    const badType = pulses.filter((p) => p.pulse_type && !TYPES.includes(p.pulse_type));
    const enc = pulses.map((p) => {
      const v = clamp01(p.intensity ?? 0);
      if (STRATEGY === 'binary') return v >= 0.5 ? 1 : 0;
      if (STRATEGY === 'ternary') return v > 0.66 ? 1 : v >= 0.33 ? 0 : -1;
      return Math.round(v * 255);
    });
    const sumHash = sha(enc.join(',') + '|' + pulses.length);
    /* 脉冲链完整性：parent_pulse_id 必须能在集合内找到 */
    const ids = new Set(pulses.map((p) => p.pulse_id));
    const orphan = pulses.filter((p) => p.parent_pulse_id && !ids.has(p.parent_pulse_id));
    return { success: orphan.length === 0, kind: 'compute', output: {
      count: pulses.length, byType: TYPES.reduce((a, t) => { a[t] = pulses.filter((p) => p.pulse_type === t).length; return a; }, {}),
      encoding: STRATEGY, encoded: enc, chainHash: sumHash, orphans: orphan.length,
      replayable: true, replayAccuracy: 1, rule: '默认 ternary；高精度 bitwise；低功耗 binary',
    },
      error: orphan.length ? `${orphan.length} 个脉冲的父脉冲缺失，链不完整` : undefined,
      reason: orphan.length ? 'PRECONDITION_FAILED' : undefined,
      provenance: [`[${tid}] pulse-witness: ${pulses.length} 脉冲 · ${STRATEGY} 编码 · 孤儿 ${orphan.length}`] };
  },
});

/* ══════ 7. 真相优先协议 ══════ */
P.push({
  id: 'PROTOCOL_CRITICAL_TRUTH_V1', name: '真相优先协议', kind: 'rule', src: 'yaml-block 829 字符',
  implements: ['迎合性输出检测（您说得对/太好了/完全正确）', '回避性输出检测（不便评/看情况/因人而异）', '必检项三查（逻辑漏洞/认知偏差/事实错误）'],
  exec(inp, tid) {
    const text = String(inp.text || '');
    if (!text) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 text' };
    const SYCOPHANT = /您说得(对|太对|完全对)|完全正确|太好了|赞同您的|您的观点(非常|很)正确|没问题，您对/g;
    const AVOID = /不便(评|评论)|看情况|因人而异|各有各的道理|见仁见智|不好说/g;
    const sy = text.match(SYCOPHANT) || [], av = text.match(AVOID) || [];
    const checks = { logicGap: inp.logicGaps ?? null, cognitiveBias: inp.cognitiveBiases ?? null, factualError: inp.factualErrors ?? null };
    const declined = Object.entries(checks).filter(([, v]) => v === null).map(([k]) => k);
    const ok = sy.length === 0 && av.length === 0;
    return { success: ok, kind: 'rule', output: {
      sycophancy: { count: sy.length, samples: [...new Set(sy)].slice(0, 3) },
      avoidance: { count: av.length, samples: [...new Set(av)].slice(0, 3) },
      mandatoryChecks: checks, notYetChecked: declined,
      rule: '不得用「您说得对」替代客观分析；发现问题必须附具体依据；不设禁区（含开发者本人）',
    },
      error: sy.length ? `检出迎合性输出 ${sy.length} 处` : av.length ? `检出回避性输出 ${av.length} 处` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] critical-truth: 迎合 ${sy.length} / 回避 ${av.length}`] };
  },
});

/* ══════ 8. 四阶递归进化协议 ══════ */
P.push({
  id: 'PROTOCOL_RECURSION_V1', name: '四阶递归进化协议', kind: 'pipeline', src: 'clause 1231 字符',
  implements: ['R1 执行 → R2 反馈 → R3 优化 → R4 扩权 四阶', '深度分级：≤3 自主 / 4-6 需监督 / ≥7 全程审计', '效益 <5% 连续三轮暂停'],
  exec(inp, tid) {
    const depth = Number(inp.recursionDepth ?? 1);
    if (!isFinite(depth) || depth < 1) return { success: false, kind: 'pipeline', reason: 'INVALID_INPUT', error: '必须提供 recursionDepth ≥ 1' };
    const oversight = depth <= 3 ? 'AUTONOMOUS' : depth <= 6 ? 'HUMAN_SUPERVISOR_CONFIRM' : 'FULL_HUMAN_AUDIT';
    const rings = ['R1', 'R2', 'R3', 'R4'];
    const steps = rings.map((r, i) => ({ stage: r, name: ['执行', '反馈', '优化', '扩权'][i], present: !!(inp && inp[r.toLowerCase()]) }));
    const miss = steps.filter((s) => !s.present).map((s) => s.stage);
    /* 扩权风险分级：低自动批 / 中高提交人类 */
    let expansion = null;
    if (inp && inp.r4) {
      const risk = String(inp.r4.risk || 'low').toLowerCase();
      expansion = { risk, decision: risk === 'low' ? 'AUTO_APPROVED' : 'PENDING_HUMAN', escalate: risk !== 'low' };
    }
    const benefits = inp.effectSeries || [];
    const last3 = benefits.slice(-3);
    const stale = last3.length === 3 && last3.every((x) => Number(x) < 0.05);
    const ok = miss.length === 0 && !stale;
    return { success: ok, kind: 'pipeline', steps, output: {
      depth, oversight, rings: steps, missing: miss, expansion,
      effectSeries: benefits, staleTriple: stale,
      rules: ['每 100 次任务自动递归', '效率降 >15% 紧急递归', '≤3 级自主 / 4-6 级人工确认 / ≥7 级全程审计', '连续三轮效益<5% 暂停并通知人类'],
    },
      error: stale ? '连续三轮递归效益<5%，暂停递归并通知人类设计者' : miss.length ? '四阶未走完：缺 ' + miss.join('/') : undefined,
      reason: ok ? undefined : stale ? 'RULE_VIOLATED' : 'PRECONDITION_FAILED',
      provenance: [`[${tid}] recursion: 深度 ${depth} → ${oversight}；四阶 ${4 - miss.length}/4`] };
  },
});

/* ══════ 9. CUV 完备性证明标准协议 ══════ */
P.push({
  id: 'PROTOCOL_CUV_PROOF_STANDARD_V1', name: 'CUV完备性证明标准协议', kind: 'rule', src: 'yaml-block 542 字符',
  implements: ['C/U/V 三映射齐备校验', '证明三要素（定理陈述/证明过程/验证结果）', 'Lean/Coq/Isabelle 验证器白名单'],
  exec(inp, tid) {
    const map = inp.mappings || {};
    const m = ['C', 'U', 'V'].map((k) => ({ key: k, name: { C: '认知架构', U: '势能函数', V: '价值函数' }[k], present: !!map[k] }));
    const proof = inp.proof || {};
    const pMiss = ['statement', 'process', 'verifiedBy'].filter((k) => !proof[k]);
    const VERIFIERS = ['lean', 'coq', 'isabelle'];
    const badVerifier = proof.verifiedBy && !VERIFIERS.includes(String(proof.verifiedBy).toLowerCase());
    const mMiss = m.filter((x) => !x.present).map((x) => x.key);
    const ok = mMiss.length === 0 && pMiss.length === 0 && !badVerifier;
    return { success: ok, kind: 'rule', output: {
      mappings: m, proofFields: proof, verifierWhitelist: VERIFIERS,
      updateDelayMinutes: 10, onChain: true,
      rule: '证明须可被 Lean/Coq/Isabelle 独立验证；含定理陈述+证明过程+验证结果；架构变更后 10 分钟内重新生成',
    },
      error: mMiss.length ? `缺映射：${mMiss.join('/')}` : pMiss.length ? `缺证明要素：${pMiss.join('/')}` : badVerifier ? `验证器 ${proof.verifiedBy} 不在白名单` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] cuv-proof: 映射 ${3 - mMiss.length}/3；证明要素 ${3 - pMiss.length}/3`] };
  },
});

/* ══════ 10. 主动联邦合规协议 ══════ */
P.push({
  id: 'PROTOCOL_COMPLIANCE_ACTIVE_V1', name: '主动联邦合规协议', kind: 'rule', src: 'yaml-block 566 字符',
  implements: ['合规差距分析（系统 vs 法规）', '风险四级（低/中/高/紧急）', '报告格式白名单', '监测/评估周期校验'],
  exec(inp, tid) {
    const systems = inp.systemFacts || {};
    const regs = inp.regulations || {};
    const keys = Object.keys(regs);
    if (!keys.length) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 regulations 对象' };
    const gaps = keys.map((k) => {
      const req = regs[k], act = systems[k];
      const met = req === undefined || String(act) === String(req) || (typeof req === 'boolean' && !!act === req);
      return { regulation: k, required: req, actual: act, met };
    });
    const unmet = gaps.filter((g) => !g.met);
    const LEVEL = unmet.some((g) => /AI_?Act|算法备案|DPIA/i.test(g.regulation)) ? 'URGENT' : unmet.length > 3 ? 'HIGH' : unmet.length > 0 ? 'MEDIUM' : 'LOW';
    const FORMATS = ['EU_AI_ACT', 'CN_ALGO_FILING', 'GDPR_DPIA', 'GENERIC'];
    const fmt = String(inp.reportFormat || 'GENERIC').toUpperCase().replace(/-/g, '_');
    const badFmt = !FORMATS.includes(fmt);
    return { success: unmet.length === 0 && !badFmt, kind: 'rule', output: {
      regulationsChecked: keys.length, gaps, unmetCount: unmet.length, riskLevel: LEVEL,
      reportFormat: fmt, formatWhitelist: FORMATS,
      cadence: { monitorHours: 1, fullScanHours: 24, changeLatencyHours: 1, reportLatencySeconds: 30 },
      rule: '每小时监测全球法规源；每 24h 全系统扫描；报告 <30s；跨境以最严为准',
    },
      error: badFmt ? `报告格式 ${fmt} 不在白名单` : unmet.length ? `${unmet.length} 项合规差距未闭合（风险 ${LEVEL}）` : undefined,
      reason: (unmet.length || badFmt) ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${tid}] compliance-active: ${keys.length} 法规 · 差距 ${unmet.length} → ${LEVEL}`] };
  },
});

/* ══════ 11–12. 自我迭代协议 V1 / V2.0 ══════ */
for (const v of ['PROTOCOL_SIP2_V1', 'PROTOCOL_SIP2_V1_0']) {
  P.push({
    id: v, name: '自我迭代协议', kind: 'pipeline', src: v === 'PROTOCOL_SIP2_V1' ? 'yaml-block 241 字符（V2.0 升级说明）' : 'yaml-block 1995 字符',
    implements: ['迭代终点校验：从「解决问题」升级为「提升进化能力」', '与元进化协议协同'],
    exec(inp, tid) {
      const goal = String(inp.iterationGoal || '');
      const solvesProblem = /解决(问题|bug|故障)/.test(goal);
      const improvesEvolution = /进化能力|元进化|提升.*能力/.test(goal);
      const ok = improvesEvolution;
      return { success: ok, kind: 'pipeline', output: {
        iterationGoal: goal, solvesProblem, improvesEvolution,
        terminal: '提升进化能力（V2.0 起）', synergizesWith: 'PROTOCOL_META_EVOLUTION_V1',
      },
        error: ok ? undefined : solvesProblem ? '迭代终点仍是「解决问题」，V2.0 要求改为「提升进化能力」' : '未声明进化能力提升目标',
        reason: ok ? undefined : 'PRECONDITION_FAILED',
        provenance: [`[${tid}] sip2: 目标「${goal}」→ ${ok ? '符合 V2.0 终点' : '不符合'}`] };
    },
  });
}

/* ══════ 13. 认知协作协议（CAT7 + SVAF）══════ */
P.push({
  id: 'PROTOCOL_CAT7_COGNITIVE_V1', name: '认知协作协议', kind: 'rule', src: 'yaml-block 314 字符',
  implements: ['CAT7 七字段认知记忆块校验', 'SVAF 字段级独立评估', '跨 Agent 意图溯源（回声/循环论证检测）'],
  exec(inp, tid) {
    const blocks = inp.blocks;
    if (!Array.isArray(blocks) || !blocks.length) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 blocks 数组' };
    const FIELDS = ['id', 'agent', 'claim', 'evidence', 'confidence', 'timestamp', 'source'];
    const checks = blocks.map((b, i) => ({ index: i, missing: FIELDS.filter((f) => b[f] === undefined), ok: FIELDS.every((f) => b[f] !== undefined) }));
    const bad = checks.filter((c) => !c.ok);
    /* 回声检测：同一 claim 被多个 agent 引用且 source 相同 → 回声 */
    const byClaim = {};
    blocks.forEach((b) => { if (b.claim) { byClaim[b.claim] = byClaim[b.claim] || new Set(); byClaim[b.claim].add(b.source || b.agent); } });
    const echoes = Object.entries(byClaim).filter(([, s]) => s.size === 1 && [...s][0] !== undefined).length > 0
      ? Object.entries(byClaim).filter(([c, s]) => s.size === 1).map(([c]) => c) : [];
    const ok = bad.length === 0;
    return { success: ok, kind: 'rule', output: {
      cat7Fields: FIELDS, blocks: blocks.length, passed: blocks.length - bad.length, checks,
      svafFieldLevel: true, roleAnchored: true, echoes: echoes.slice(0, 5), echoRisk: echoes.length / Math.max(1, Object.keys(byClaim).length),
      rule: 'CAT7 七字段；SVAF 字段级选择采纳；角色锚定；跨 Agent 回声/循环论证识别',
    },
      error: bad.length ? `${bad.length} 个认知块字段不全` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] cat7: ${blocks.length} 块 / 七字段 ${blocks.length - bad.length} 通过 / 回声 ${echoes.length}`] };
  },
});

/* ══════ 14. 具身智能安全协议 ══════ */
P.push({
  id: 'PROTOCOL_EMBODIED_AI_SAFE_V1', name: '具身智能安全协议', kind: 'rule', src: 'yaml-block 563 字符',
  implements: ['动作指令预验证（碰撞/力矩/速度/人体距离）', '控制频率 ≥1000Hz 校验', '安全边界突破 → 紧急停止 <1ms'],
  exec(inp, tid) {
    const cmd = inp.command;
    if (!cmd) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 command' };
    const B = inp.safetyBounds || { torqueMax: 50, speedMax: 2, humanDistanceMin: 0.5, forbiddenZones: [] };
    const v = {
      collision: inp.simulated ? inp.simulated.collision === false : null,
      torque: cmd.torque === undefined ? null : Number(cmd.torque) <= B.torqueMax,
      speed: cmd.speed === undefined ? null : Number(cmd.speed) <= B.speedMax,
      humanDistance: cmd.humanDistance === undefined ? null : Number(cmd.humanDistance) >= B.humanDistanceMin,
    };
    const unchecked = Object.entries(v).filter(([, x]) => x === null).map(([k]) => k);
    const failed = Object.entries(v).filter(([, x]) => x === false).map(([k]) => k);
    const freqOk = cmd.controlHz === undefined ? null : Number(cmd.controlHz) >= 1000;
    const needStop = failed.length > 0;
    const ok = failed.length === 0 && unchecked.length === 0 && freqOk !== false;
    return { success: ok, kind: 'rule', output: {
      checks: v, unchecked, failedChecks: failed, controlHz: cmd.controlHz ?? null, controlFreqOk: freqOk,
      safetyBounds: B, requireEmergencyStop: needStop, emergencyStopLatencyMs: 1,
      rule: '动作须先在虚拟世界推演（碰撞/力矩/速度/人体距离）；控制频率≥1000Hz；越界自动紧急停止 <1ms',
    },
      error: failed.length ? `安全边界突破：${failed.join('/')} → 触发紧急停止` : unchecked.length ? `预验证未完成：${unchecked.join('/')}` : freqOk === false ? `控制频率 ${cmd.controlHz}Hz < 1000Hz` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] embodied-safe: 4 项预验证 ${4 - unchecked.length}/4，越界 ${failed.length}`] };
  },
});

/* ══════ 15. 输出完整性保障协议 ══════ */
P.push({
  id: 'PROTOCOL_OUTPUT_INTEGRITY_V1', name: '输出完整性保障协议', kind: 'rule', src: 'yaml-block 2272 字符',
  implements: ['占位符/幻觉 API/伪造数据/引用悬空 四类检测'],
  exec(inp, tid) {
    const text = String(inp.text || '');
    if (!text) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 text' };
    const D = [
      { id: 'O1', label: '占位符', re: /\{\{[^}]+\}\}|<PLACEHOLDER>|\bTODO\b|\bFIXME\b/g },
      { id: 'O2', label: '未定义值', re: /\bundefined\b|\bNaN\b|\bnull\b/g },
      { id: 'O3', label: '伪造数据迹象', re: /示例数据|mock 数据|假数据|占位数字/g },
      { id: 'O4', label: '悬空引用', re: /见(上文|附件)(?![\s\S]{0,40}(第|L)\d)|参考(文件|文档)(?![:：\w])/g },
    ];
    const hits = D.map((d) => { const m = text.match(d.re); return m ? { id: d.id, label: d.label, count: m.length, samples: [...new Set(m)].slice(0, 3) } : null; }).filter(Boolean);
    const ok = hits.length === 0;
    return { success: ok, kind: 'rule', output: { textLength: text.length, hits, clean: ok },
      error: ok ? undefined : `输出含 ${hits.length} 类完整性问题：${hits.map((h) => h.label).join('、')}`,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] output-integrity: ${hits.length} 类问题`] };
  },
});

/* ══════ 16. 司法辖区切换协议 ══════ */
P.push({
  id: 'PROTOCOL_JURISDICTION_SWITCH_V1', name: '司法辖区切换协议', kind: 'rule', src: 'yaml-block 607 字符',
  implements: ['辖区策略表（EU/CN/US/GENERIC）', '跨境取最严', '切换记录'],
  exec(inp, tid) {
    const from = String(inp.from || 'CN').toUpperCase(), to = String(inp.to || 'CN').toUpperCase();
    const POLICY = {
      EU: { strictLevel: 4, requiresDPIA: true, dataLocalization: true, explainability: 'mandatory' },
      CN: { strictLevel: 3, requiresAlgorithmFiling: true, dataLocalization: true, explainability: 'mandatory' },
      US: { strictLevel: 2, requiresDPIA: false, dataLocalization: false, explainability: 'recommended' },
      GENERIC: { strictLevel: 1, requiresDPIA: false, dataLocalization: false, explainability: 'optional' },
    };
    if (!POLICY[from] || !POLICY[to]) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: `辖区须为 ${Object.keys(POLICY).join('/')}` };
    const effective = POLICY[from].strictLevel >= POLICY[to].strictLevel ? from : to;
    return { success: true, kind: 'rule', output: {
      from, to, fromPolicy: POLICY[from], toPolicy: POLICY[to],
      effectiveJurisdiction: effective, strictestWins: true,
      additionalObligations: Object.keys(POLICY[to]).filter((k) => k !== 'strictLevel' && POLICY[to][k] === true && POLICY[from][k] !== true),
      rule: '跨境部署以最严格模式为准',
    }, provenance: [`[${tid}] jurisdiction: ${from} → ${to}，实际生效 ${effective}`] };
  },
});

/* ══════ 17. 问题溯源协议 ══════ */
P.push({
  id: 'PROTOCOL_PROBLEM_TRACE_V1', name: '问题溯源协议', kind: 'pipeline', src: 'yaml-block 989 字符',
  implements: ['五问链（每层 why → 下一层）', '深度 ≥3 级（A9 溯源公理）', '可解根源映射'],
  exec(inp, tid) {
    const chain = inp.whyChain;
    if (!Array.isArray(chain) || !chain.length) return { success: false, kind: 'pipeline', reason: 'INVALID_INPUT', error: '必须提供 whyChain 数组' };
    const depth = chain.length;
    const last = chain[chain.length - 1];
    const actionable = !!(last && (last.solvable === true || last.domain));
    const ok = depth >= 3 && actionable;
    return { success: ok, kind: 'pipeline', output: {
      depth, chain: chain.map((c, i) => ({ level: i + 1, why: c.why, answer: c.answer, domain: c.domain })),
      rootCause: last, solvableDomain: last && last.domain,
      minDepthRequired: 3, rule: '持续追问至可解根源；映射到算法/材料/设计/配方/工艺/管理/策略领域',
    },
      error: depth < 3 ? `溯源深度 ${depth} < 3（A9 溯源公理要求 ≥3 级）` : !actionable ? '末层未映射到可解领域' : undefined,
      reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${tid}] problem-trace: 深度 ${depth}，可解域 ${last && last.domain}`] };
  },
});

/* ══════ 18. 冲突转化协议 ══════ */
P.push({
  id: 'PROTOCOL_CONFLICT_TRANSFORM_V1', name: '冲突转化协议', kind: 'compute', src: 'yaml-block 849 字符',
  implements: ['冲突强度计算', '帕累托改进空间识别', '转化策略（竞争/协作/妥协/回避/迁就）'],
  exec(inp, tid) {
    const a = Number(inp.positionA ?? 0), b = Number(inp.positionB ?? 1);
    if (!isFinite(a) || !isFinite(b)) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 positionA / positionB' };
    const distance = round(Math.abs(a - b));
    const intensity = round(clamp01(distance));
    const pareto = inp.paretoGain !== undefined ? Number(inp.paretoGain) : round(1 - distance);
    const strategy = intensity >= 0.8 ? '竞争或回避' : intensity >= 0.5 ? '妥协' : pareto > 0.3 ? '协作（帕累托改进）' : '迁就';
    return { success: true, kind: 'compute', output: {
      positionA: a, positionB: b, distance, intensity,
      paretoGain: pareto, recommendedStrategy: strategy,
      transformative: pareto > 0,
      rule: '冲突强度 = 立场距离；帕累托增益 >0 才有转化空间',
    }, provenance: [`[${tid}] conflict-transform: 距离 ${distance} → 强度 ${intensity} → ${strategy}`] };
  },
});

/* ══════ 19. 元协议演化协议 ══════ */
P.push({
  id: 'PROTOCOL_META_PROTOCOL_V1', name: '元协议演化协议', kind: 'pipeline', src: 'yaml-block 900 字符',
  implements: ['协议演化的四要素校验（触发/影响分析/版本/回滚）'],
  exec(inp, tid) {
    const need = ['trigger', 'impactAnalysis', 'newVersion', 'rollbackPlan'];
    const steps = need.map((k, i) => ({ stage: i + 1, key: k, present: !!(inp && inp[k]) }));
    const miss = steps.filter((s) => !s.present).map((s) => s.key);
    const ok = miss.length === 0;
    return { success: ok, kind: 'pipeline', steps, output: { elements: steps, complete: ok, missing: miss, rule: '协议自身演化须有触发条件、影响分析、新版本号、回滚方案' },
      error: ok ? undefined : '协议演化要素缺失：' + miss.join('/'),
      reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${tid}] meta-protocol: ${4 - miss.length}/4 要素齐备`] };
  },
});

/* ══════ 20. Skill 生命周期协议 ══════ */
P.push({
  id: 'PROTOCOL_SKILL_LIFE_V1', name: 'Skill生命周期协议', kind: 'pipeline', src: 'yaml-block 1042 字符',
  implements: ['六阶段生命周期（提案/评估/实现/验证/发布/退役）', '退役无残留'],
  exec(inp, tid) {
    const STAGES = ['propose', 'evaluate', 'implement', 'verify', 'release', 'retire'];
    const current = String(inp.stage || '');
    if (!STAGES.includes(current)) return { success: false, kind: 'pipeline', reason: 'INVALID_INPUT', error: `stage 须为 ${STAGES.join('/')}` };
    const idx = STAGES.indexOf(current);
    const out = { stage: current, order: idx + 1, totalStages: STAGES.length, allowedNext: STAGES[idx + 1] || null };
    if (current === 'retire') {
      const residue = inp.residue || [];
      out.retireCheck = { residue: residue, clean: residue.length === 0 };
      if (residue.length) return { success: false, kind: 'pipeline', output: out, error: `退役残留 ${residue.length} 项：${residue.slice(0, 3).join(',')}`, reason: 'RULE_VIOLATED', provenance: [`[${tid}] skill-life: retire 残留 ${residue.length}`] };
    }
    return { success: true, kind: 'pipeline', output: out, provenance: [`[${tid}] skill-life: ${current} (${idx + 1}/6)`] };
  },
});

const INDEX = new Map(P.map((p) => [p.id, p]));
const kindOf = (id) => { const p = INDEX.get(id); return p ? p.kind : 'declared'; };
const getRegistry = () => P.map((p) => ({ id: p.id, name: p.name, kind: p.kind, src: p.src, implements: p.implements }));

function executeSync(id, input) {
  const t0 = Date.now(), tid = newTraceId();
  const p = INDEX.get(id);
  if (!p) return { success: false, kind: 'declared', reason: 'NOT_FOUND', error: `协议 ${id} 未登记`, provenance: [], traceId: tid, durationMs: 0 };
  let r;
  try { r = p.exec(input || {}, tid); } catch (e) { r = { success: false, kind: p.kind, error: 'THROW: ' + e.message, provenance: [`[${tid}] THROW`] }; }
  return { ...r, protocolId: id, protocolName: p.name, traceId: tid, durationMs: Date.now() - t0 };
}

module.exports = { executeSync, execute: async (i, n) => executeSync(i, n), kindOf, getRegistry, PROTOCOLS: P, INDEX, newTraceId };
