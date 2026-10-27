#!/usr/bin/env node
/**
 * P6-B6 · 主动族 / 前瞻族 / 全息族 / 事实族 协议运行时（17 条）
 */
'use strict';

let __seq = 0;
const newTraceId = () => {
  const d = new Date(), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-S${p((++__seq) % 10000, 4)}`;
};
const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));
const round = (x, n = 4) => Math.round((Number(x) || 0) * 10 ** n) / 10 ** n;
const has = (o, ks) => ks.filter((k) => o && o[k] !== undefined && o[k] !== null);

const P = [];

/* ══════ 主动族（7 条，依据 §五 协议清单的功能定义）══════ */

P.push({
  id: 'PROTOCOL_ACTIVE_SENSE_V1', name: '主动感知协议', kind: 'rule', src: 'table-row 488 字符（§五 新增协议清单）',
  implements: ['感知信号三要素（时间戳/类型/置信度）', '触发阈值判定', '感知频率动态调整'],
  exec(inp, tid) {
    const s = inp.signal || {};
    const miss = has(s, ['timestamp', 'type', 'confidence']).length < 3 ? ['timestamp', 'type', 'confidence'].filter((k) => s[k] === undefined) : [];
    const conf = Number(s.confidence ?? 0);
    const thr = Number(inp.threshold ?? 0.7);
    const freq = inp.stable ? 'LOW' : inp.anomaly ? 'HIGH' : 'NORMAL';
    const ok = miss.length === 0 && conf >= thr;
    return { success: ok, kind: 'rule', output: {
      requiredFields: ['timestamp', 'type', 'confidence'], missing: miss,
      confidence: conf, threshold: thr, triggered: conf >= thr,
      senseFrequency: freq, rule: '稳定降频 / 异常提频',
    },
      error: miss.length ? `感知信号缺字段：${miss.join('/')}` : conf < thr ? `置信度 ${conf} < 阈值 ${thr}，不触发` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] active-sense: 置信 ${conf}/${thr} → ${conf >= thr ? '触发' : '不触发'}，频率 ${freq}`] };
  },
});

P.push({
  id: 'PROTOCOL_ACTIVE_PUSH_V1', name: '主动推送协议', kind: 'rule', src: 'table-row 488 字符',
  implements: ['推送三要素（消息体/优先级/重试策略）', '三级优先级', '指数退避重试'],
  exec(inp, tid) {
    const m = inp.message || {};
    const miss = ['body', 'priority'].filter((k) => m[k] === undefined);
    const PRIORITY = { urgent: 3, important: 2, normal: 1 };
    const pri = String(m.priority || 'normal');
    if (!PRIORITY[pri]) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: `优先级须为 urgent/important/normal` };
    const maxRetry = Number(inp.maxRetry ?? 3);
    const backoff = Array.from({ length: maxRetry }, (_, i) => Math.round(1000 * 2 ** i));
    const ok = miss.length === 0;
    return { success: ok, kind: 'rule', output: {
      requiredFields: ['body', 'priority', 'retryPolicy'], missing: miss,
      priority: pri, priorityLevel: PRIORITY[pri],
      retryPolicy: { maxRetry, backoffMs: backoff, strategy: '指数退避' },
    },
      error: miss.length ? `推送消息缺字段：${miss.join('/')}` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] active-push: ${pri}(L${PRIORITY[pri]}) · 重试 ${maxRetry} 次`] };
  },
});

P.push({
  id: 'PROTOCOL_ACTIVE_FEEDBACK_V1', name: '主动反馈协议', kind: 'rule', src: 'table-row 488 字符',
  implements: ['反馈采集四要素（用户/时间/类型/内容）', '传输规范校验'],
  exec(inp, tid) {
    const f = inp.feedback || {};
    const need = ['userId', 'timestamp', 'type', 'content'];
    const miss = need.filter((k) => f[k] === undefined);
    const ok = miss.length === 0;
    return { success: ok, kind: 'rule', output: { requiredFields: need, missing: miss, feedbackType: f.type || null, collected: ok },
      error: ok ? undefined : `反馈缺字段：${miss.join('/')}`,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] active-feedback: ${ok ? '采集完整' : '缺 ' + miss.join('/')}`] };
  },
});

P.push({
  id: 'PROTOCOL_ASYNC_DIALOG_V1', name: '异步对话协议', kind: 'pipeline', src: 'table-row 488 字符',
  implements: ['异步消息状态机（pending→sent→acked→failed）', '合法状态转移校验'],
  exec(inp, tid) {
    const STATES = ['pending', 'sent', 'acked', 'failed'];
    const TRANS = { pending: ['sent', 'failed'], sent: ['acked', 'failed'], acked: [], failed: ['pending'] };
    const from = String(inp.from || 'pending'), to = String(inp.to || 'sent');
    if (!STATES.includes(from) || !STATES.includes(to)) return { success: false, kind: 'pipeline', reason: 'INVALID_INPUT', error: `状态须为 ${STATES.join('/')}` };
    const ok = (TRANS[from] || []).includes(to);
    return { success: ok, kind: 'pipeline', output: { states: STATES, transitions: TRANS, from, to, allowed: ok, allowedNext: TRANS[from] },
      error: ok ? undefined : `非法状态转移 ${from} → ${to}`,
      reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${tid}] async-dialog: ${from} → ${to} ${ok ? '合法' : '非法'}`] };
  },
});

P.push({
  id: 'PROTOCOL_ACTIVE_GOLDEN_V1', name: '黄金窗口协议', kind: 'compute', src: 'table-row 488 字符',
  implements: ['黄金窗口判定（活跃度 × 意愿度 ≥ 阈值）', '窗口时长与置信度'],
  exec(inp, tid) {
    const act = clamp01(inp.activity ?? 0.7), will = clamp01(inp.willingness ?? 0.7);
    const thr = Number(inp.threshold ?? 0.5);
    const score = round(act * will);
    const isGolden = score >= thr;
    return { success: true, kind: 'compute', output: { activity: act, willingness: will, score, threshold: thr, isGoldenWindow: isGolden,
      suggestedWindowMinutes: isGolden ? Math.round(10 + (1 - score) * 20) : 0, rule: '黄金窗口 = 活跃度 × 意愿度 ≥ 阈值' },
      provenance: [`[${tid}] active-golden: ${act}×${will}=${score} → ${isGolden ? '黄金窗口' : '非窗口'}`] };
  },
});

P.push({
  id: 'PROTOCOL_ACTIVE_EMOTION_V1', name: '情感曲线协议', kind: 'compute', src: 'table-row 488 字符',
  implements: ['情感曲线指标（均值/波动/趋势）', '适配强度计算'],
  exec(inp, tid) {
    const curve = inp.emotionCurve;
    if (!Array.isArray(curve) || !curve.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 emotionCurve 数组' };
    const v = curve.map(Number);
    const mean = round(v.reduce((a, b) => a + b, 0) / v.length);
    const volatility = round(Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length));
    const trend = v.length > 1 ? round(v[v.length - 1] - v[0]) : 0;
    const adaptStrength = round(clamp01(Math.abs(trend) * 0.6 + volatility * 0.4));
    return { success: true, kind: 'compute', output: { points: v.length, mean, volatility, trend, adaptStrength,
      adaptation: trend > 0.1 ? '提升互动强度' : trend < -0.1 ? '降低互动强度并安抚' : '维持当前强度' },
      provenance: [`[${tid}] active-emotion: mean ${mean} vol ${volatility} trend ${trend} → 适配 ${adaptStrength}`] };
  },
});

P.push({
  id: 'PROTOCOL_ACTIVE_ENTANGLE_V1', name: '量子纠缠协议', kind: 'compute', src: 'table-row 488 字符',
  implements: ['纠缠对匹配度（余弦相似）', '建立/维护判定'],
  exec(inp, tid) {
    const a = inp.stateA, b = inp.stateB;
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: 'stateA/stateB 须为同维数组' };
    const dot = a.reduce((s, x, i) => s + x * b[i], 0);
    const na = Math.sqrt(a.reduce((s, x) => s + x * x, 0)), nb = Math.sqrt(b.reduce((s, x) => s + x * x, 0));
    const match = round(na && nb ? dot / (na * nb) : 0);
    const thr = Number(inp.threshold ?? 0.8);
    return { success: true, kind: 'compute', output: { dims: a.length, match, threshold: thr, entangled: match >= thr,
      maintenance: match >= thr ? '维持纠缠：定期重同步' : '不建立：匹配度不足',
      rule: '纠缠建立判据 = 状态向量余弦相似度 ≥ 阈值' },
      provenance: [`[${tid}] active-entangle: 匹配 ${match}/${thr} → ${match >= thr ? '已纠缠' : '未纠缠'}`] };
  },
});

/* ══════ 前瞻族（4 条，核心条款完整）══════ */

P.push({
  id: 'PROTOCOL_PROACTIVE_SENSE_V1', name: '主动感知协议（前瞻）', kind: 'rule', src: 'yaml-block 274 字符',
  implements: ['信号三要素 + 三级优先级（紧急/重要/常规）', '隐私保护（原始数据本地、仅传脱敏事件）', '频率动态调整'],
  exec(inp, tid) {
    const s = inp.signal || {};
    const miss = ['timestamp', 'type', 'confidence'].filter((k) => s[k] === undefined);
    const LV = { 紧急: 'IMMEDIATE', 重要: 'NEXT_CYCLE', 常规: 'ASYNC' };
    const lv = String(s.priority || '常规');
    if (!LV[lv]) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '优先级须为 紧急/重要/常规' };
    const privacy = inp.rawLocalOnly !== false;
    const ok = miss.length === 0 && privacy;
    return { success: ok, kind: 'rule', output: {
      requiredFields: ['timestamp', 'type', 'confidence'], missing: miss,
      priority: lv, handling: LV[lv], level3: Object.keys(LV),
      privacy: { rawLocalOnly: privacy, uploads: '仅脱敏状态事件' },
      frequency: inp.stable ? 'LOW' : inp.anomaly ? 'HIGH' : 'NORMAL',
      valueAlignFilterRequired: true,
    },
      error: miss.length ? `信号缺字段：${miss.join('/')}` : !privacy ? '违反隐私保护：原始感知数据不得上传' : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] proactive-sense: ${lv}→${LV[lv]}，隐私 ${privacy ? '合规' : '违规'}`] };
  },
});

P.push({
  id: 'PROTOCOL_PROACTIVE_THINK_V1', name: '主动思考协议', kind: 'pipeline', src: 'yaml-block 232 字符',
  implements: ['推理链必录', '新想法置信度+创新度双标注', '价值对齐前置'],
  exec(inp, tid) {
    const need = ['trigger', 'reasoningChain', 'output'];
    const miss = need.filter((k) => inp && inp[k] === undefined);
    const ideas = inp.ideas || [];
    const badIdeas = ideas.filter((i) => i.confidence === undefined || i.novelty === undefined);
    const alignPassed = inp.valueAligned === true;
    const ok = miss.length === 0 && badIdeas.length === 0 && alignPassed;
    return { success: ok, kind: 'pipeline', output: {
      requiredFields: need, missing: miss,
      reasoningChainLinks: Array.isArray(inp.reasoningChain) ? inp.reasoningChain.length : 0,
      ideas: ideas.length, ideasMissingMeta: badIdeas.length,
      valueAligned: alignPassed, rule: '新想法须标注置信度+创新度；输出前经价值对齐',
    },
      error: miss.length ? `思考缺字段：${miss.join('/')}` : badIdeas.length ? `${badIdeas.length} 个想法缺置信度/创新度标注` : !alignPassed ? '未经价值对齐引擎评估，不得输出' : undefined,
      reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${tid}] proactive-think: 推理链 ${Array.isArray(inp.reasoningChain) ? inp.reasoningChain.length : 0} 环，想法 ${ideas.length} 个`] };
  },
});

P.push({
  id: 'PROTOCOL_PROACTIVE_LEARN_V1', name: '主动学习协议', kind: 'rule', src: 'yaml-block 235 字符',
  implements: ['学习目标三要素（优先级/预期价值/时间窗口）', '可证伪实验设计', '过度打扰防护'],
  exec(inp, tid) {
    const g = inp.goal || {};
    const miss = ['priority', 'expectedValue', 'timeWindow'].filter((k) => g[k] === undefined);
    const falsifiable = inp.hypothesis && inp.hypothesis.falsifiable === true;
    const accept = clamp01(inp.userAcceptance ?? 0.7);
    const thr = Number(inp.acceptanceThreshold ?? 0.5);
    const ok = miss.length === 0 && falsifiable && accept >= thr;
    return { success: ok, kind: 'rule', output: {
      requiredFields: ['priority', 'expectedValue', 'timeWindow'], missing: miss,
      hypothesisFalsifiable: !!falsifiable, userAcceptance: accept, acceptanceThreshold: thr,
      askAllowed: accept >= thr, rule: '主动提问须评估接受度；假设须可证伪；成果入知识库并通知相关引擎',
    },
      error: miss.length ? `学习目标缺：${miss.join('/')}` : !falsifiable ? '假设未设计为可证伪实验' : accept < thr ? `用户接受度 ${accept} < ${thr}，暂不主动提问` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] proactive-learn: 目标 ${3 - miss.length}/3，可证伪 ${falsifiable}，接受度 ${accept}`] };
  },
});

P.push({
  id: 'PROTOCOL_PROACTIVE_LEAD_V1', name: '主动引领协议', kind: 'rule', src: 'yaml-block 252 字符',
  implements: ['接受度门槛', '四策略库（提问/建议/挑战/启发）', '同话题连续 ≤3 次', '价值对齐合规'],
  exec(inp, tid) {
    const STRATS = ['提问式', '建议式', '挑战式', '启发式'];
    const st = String(inp.strategy || '建议式');
    if (!STRATS.includes(st)) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: `策略须为 ${STRATS.join('/')}` };
    const accept = clamp01(inp.userAcceptance ?? 0.7), thr = Number(inp.acceptanceThreshold ?? 0.5);
    const consecutive = Number(inp.sameTopicConsecutive ?? 1);
    const alignOk = inp.valueAligned !== false;
    const ok = accept >= thr && consecutive <= 3 && alignOk;
    return { success: ok, kind: 'rule', output: {
      strategy: st, strategyLibrary: STRATS, userAcceptance: accept, threshold: thr,
      sameTopicConsecutive: consecutive, maxConsecutive: 3, valueAligned: alignOk,
      action: ok ? 'LEAD' : 'DELAY', rule: '接受度低于阈值则延迟；同话题≤3次；须过价值对齐',
    },
      error: !alignOk ? '引领内容未通过价值对齐合规评估' : accept < thr ? `接受度 ${accept} < ${thr}，延迟引领` : consecutive > 3 ? `同话题连续 ${consecutive} 次 > 3，需给用户消化时间` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] proactive-lead: ${st} 接受度 ${accept} 连续 ${consecutive} → ${ok ? '引领' : '延迟'}`] };
  },
});

/* ══════ 事实陈述协议 ══════ */
P.push({
  id: 'PROTOCOL_FSP_V1_0', name: '事实陈述协议', kind: 'rule', src: 'yaml-block 1368 字符',
  implements: ['五级事实分级（✅已确认/🔄意向中/👀待接触/📊调研发现/待核实）', '置信度区间校验', '低置信不得写入正式方案'],
  exec(inp, tid) {
    const claims = inp.claims;
    if (!Array.isArray(claims) || !claims.length) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 claims 数组' };
    const TIERS = [
      { label: '✅ 已确认', min: 0.9, max: 1.0 },
      { label: '🔄 意向中', min: 0.7, max: 0.89 },
      { label: '👀 待接触', min: 0.5, max: 0.69 },
      { label: '📊 调研发现', min: 0, max: 0.49 },
      { label: '待核实', min: 0, max: 0.49, forbiddenInFormal: true },
    ];
    const checked = claims.map((c, i) => {
      const conf = Number(c.confidence ?? 0);
      const match = c.label ? TIERS.find((t) => t.label === c.label) : TIERS.find((t) => conf >= t.min && conf <= t.max);
      const labelOk = !!match;
      const formalBlocked = !!(c.formal && match && match.forbiddenInFormal);
      return { index: i, claim: c.claim, confidence: conf, declaredLabel: c.label, expectedLabel: match ? match.label : null, labelOk, formalBlocked, ok: labelOk && !formalBlocked };
    });
    const bad = checked.filter((c) => !c.ok);
    const ok = bad.length === 0;
    return { success: ok, kind: 'rule', output: { tierTable: TIERS.map(({ label, min, max }) => ({ label, range: [min, max] })), total: claims.length, checked, failed: bad.length },
      error: ok ? undefined : `${bad.length} 条事实分级不符或低置信写入正式方案`,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] fsp: ${claims.length} 条声明，${bad.length} 条不符分级`] };
  },
});

/* ══════ 全息族 3 条 ══════ */
P.push({
  id: 'PROTOCOL_HWP_V1_0', name: '全息工作协议', kind: 'pipeline', src: 'yaml-block 1463 字符',
  implements: ['任务理解 + 历史关联 + 全息扫描 + 缺口处理 四章必备项', '一次性交付完整价值'],
  exec(inp, tid) {
    const need = ['taskUnderstanding', 'historyLinked', 'holoScan', 'gapHandled'];
    const steps = need.map((k, i) => ({ chapter: i + 1, key: k, present: !!(inp && inp[k] !== undefined) }));
    const miss = steps.filter((s) => !s.present).map((s) => s.key);
    const ok = miss.length === 0;
    return { success: ok, kind: 'pipeline', steps, output: {
      chapters: ['任务理解', '历史关联', '全息扫描', '缺口处理'], steps, missing: miss,
      rule: '一次性交付完整价值；杜绝碎片化输出/被动应答/信息遗漏',
    },
      error: ok ? undefined : '全息工作必备项缺失：' + miss.join('/'),
      reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${tid}] hwp: ${4 - miss.length}/4 章齐备`] };
  },
});

P.push({
  id: 'PROTOCOL_HKS_V1_0', name: '全息知识扫描协议', kind: 'pipeline', src: 'yaml-block 1262 字符',
  implements: ['扫描维度覆盖校验', '三源扫描（联网/历史/内部知识库）', '缺口标注'],
  exec(inp, tid) {
    const dims = inp.dimensions || [], covered = inp.covered || [];
    const SOURCES = ['web', 'history', 'internal'];
    const srcHit = SOURCES.filter((s) => (inp.sources || []).includes(s));
    const gaps = dims.filter((d) => !covered.includes(d));
    const ok = dims.length > 0 && gaps.length === 0;
    return { success: ok, kind: 'pipeline', output: {
      dimensions: dims.length, covered: covered.length, gaps,
      sourcesRequired: SOURCES, sourcesUsed: srcHit, sourceCoverage: round(srcHit.length / 3),
      rule: '必须覆盖所有生成维度；三源扫描；缺口须标注',
    },
      error: !dims.length ? '未生成扫描维度' : gaps.length ? `${gaps.length} 个维度未覆盖：${gaps.slice(0, 3).join(',')}` : undefined,
      reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${tid}] hks: 维度 ${covered.length}/${dims.length}，源 ${srcHit.length}/3`] };
  },
});

P.push({
  id: 'PROTOCOL_HMFP_V1_0', name: '全息模式强制协议', kind: 'rule', src: 'yaml-block 1002 字符',
  implements: ['全息模式必检项（维度覆盖/事实核查/内容展开/增值交付/场景适配）', '任一缺失即非全息'],
  exec(inp, tid) {
    const need = ['dimensionCoverage', 'factCheck', 'contentDepth', 'valueAdd', 'sceneFit'];
    const checks = need.map((k) => ({ key: k, present: inp && inp[k] !== undefined, ok: inp && inp[k] === true }));
    const miss = checks.filter((c) => !c.present).map((c) => c.key);
    const failed = checks.filter((c) => c.present && !c.ok).map((c) => c.key);
    const ok = miss.length === 0 && failed.length === 0;
    return { success: ok, kind: 'rule', output: { requiredChecks: need, checks, missing: miss, failed, holoMode: ok },
      error: ok ? undefined : `非全息：缺 ${miss.join('/') || '无'}；未过 ${failed.join('/') || '无'}`,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] hmfp: ${checks.filter((c) => c.ok).length}/5 全息必检项通过`] };
  },
});

/* ══════ 场景表达适配协议 ══════ */
P.push({
  id: 'PROTOCOL_SEP_V1_0', name: '场景表达适配协议', kind: 'rule', src: 'yaml-block 1042 字符',
  implements: ['五场景识别', '商业场景禁用技术术语检查', '术语替换映射'],
  exec(inp, tid) {
    const SCENES = ['business', 'technical', 'strategic', 'daily', 'internal'];
    const scene = String(inp.scene || 'technical');
    if (!SCENES.includes(scene)) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: `场景须为 ${SCENES.join('/')}` };
    const text = String(inp.text || '');
    const TECH_TERMS = ['耦生度', '负熵', '公理', '原子', '元进化', '全息重构', '熵增', '范式'];
    const hits = scene === 'business' ? TECH_TERMS.filter((t) => text.includes(t)) : [];
    const ok = hits.length === 0;
    return { success: ok, kind: 'rule', output: { scene, sceneWhitelist: SCENES, forbiddenTerms: scene === 'business' ? TECH_TERMS : [], hits, termReplaced: 0 },
      error: ok ? undefined : `商业场景禁用技术术语 ${hits.length} 处：${hits.join('、')}`,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] sep: 场景 ${scene}，术语命中 ${hits.length}`] };
  },
});

/* ══════ 开发者纠错协议 ══════ */
P.push({
  id: 'PROTOCOL_DCP_V1_0', name: '开发者纠错协议', kind: 'pipeline', src: 'yaml-block 723 字符',
  implements: ['纠错五步（打断→承认→定向扫描→根因→固化）', '不辩解'],
  exec(inp, tid) {
    const need = ['interrupted', 'admitted', 'targetedScan', 'rootCause', 'hardened'];
    const steps = need.map((k, i) => ({ step: i + 1, key: k, present: !!(inp && inp[k]) }));
    const miss = steps.filter((s) => !s.present).map((s) => s.key);
    const excuse = /但是|不过|其实我|您可能误会|这不是我的问题/.test(String(inp.response || ''));
    const ok = miss.length === 0 && !excuse;
    return { success: ok, kind: 'pipeline', steps, output: { fiveSteps: ['打断当前流程', '承认可能遗漏', '定向追踪扫描', '分析根因', '改正并固化'], steps, missing: miss, defensiveLanguage: excuse },
      error: ok ? undefined : excuse ? '检出辩解性表述（但是/可能误会/不是我的问题）' : '纠错五步缺失：' + miss.join('/'),
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] dcp: ${5 - miss.length}/5 步，辩解 ${excuse}`] };
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
