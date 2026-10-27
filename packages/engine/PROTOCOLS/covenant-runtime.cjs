#!/usr/bin/env node
/**
 * P6-B7 · 共契族 / 见证族 / 接入族 协议运行时（18 条）
 * 逐条依 PROTOCOL-CONTRACTS.json 的 definitionText 条款实现。
 */
'use strict';

let __seq = 0;
const newTraceId = () => {
  const d = new Date(), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${d.getHours()}${p(d.getMinutes())}${p(d.getSeconds())}-C${p((++__seq) % 10000, 4)}`;
};
const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));
const round = (x, n = 4) => Math.round((Number(x) || 0) * 10 ** n) / 10 ** n;

const P = [];

/** 通用：必备条款齐备检查 */
function clauses(need, inp) {
  const items = need.map((k, i) => ({ no: i + 1, key: k, present: !!(inp && inp[k] !== undefined) }));
  const miss = items.filter((x) => !x.present).map((x) => x.key);
  return { items, miss, ok: miss.length === 0 };
}

/* ══════════ 共契族 10 条 ══════════ */

/* 1. ACP 万物共契 */
P.push({
  id: 'PROTOCOL_ACP_V1_0', name: '万物共契协议', kind: 'rule', src: 'yaml-block 1522 字符 · 三章九条',
  implements: ['第一章 万物有值：内在价值/价值多样性/价值不可替代', '第二章 万物有声：声音定义/倾听义务/声音理解', '第三章 万物有权：生存权/健康权'],
  exec(inp, tid) {
    const c = clauses(['intrinsicValueAcknowledged', 'valueDiversityRespected', 'speciesImpactAssessed', 'listeningActive', 'speciesModelBuilt', 'survivalRightProtected', 'healthMonitored'], inp);
    /* 第7条：濒危物种特殊保护 —— 若涉濒危物种必须有额外保护措施 */
    const endangered = inp.endangeredSpecies || [];
    const endangeredOk = endangered.length === 0 || !!inp.endangeredProtection;
    const ok = c.ok && endangeredOk;
    return { success: ok, kind: 'rule', output: {
      chapters: { 万物有值: ['内在价值', '价值多样性', '价值不可替代'], 万物有声: ['声音定义', '倾听义务', '声音理解'], 万物有权: ['生存权', '健康权'] },
      checks: c.items, missing: c.miss, endangeredSpecies: endangered, endangeredProtection: !!inp.endangeredProtection,
      rules: ['万物存在本身即有价值（不依赖人类赋予）', '不得用人类标准衡量万物价值', '灭绝一个物种=永远失去其独特价值', '系统须持续倾听万物声音', '决策不得威胁物种生存', '濒危物种享特殊保护'],
    },
      error: c.miss.length ? `共契条款未落实：${c.miss.join('/')}` : !endangeredOk ? '涉濒危物种但未启用特殊保护（第7条）' : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] acp: 九条 ${c.items.filter((x) => x.present).length}/7 落实，濒危保护 ${endangeredOk}`] };
  },
});

/* 2. BCP 生物共契 */
P.push({
  id: 'PROTOCOL_BCP_V1_0', name: '生物共契协议', kind: 'rule', src: 'yaml-block 1779 字符',
  implements: ['生物信号采集规范', '生物价值评估', '生物边界尊重（不得越界干预）'],
  exec(inp, tid) {
    const c = clauses(['bioSignalTypes', 'bioValueAssessed', 'bioBoundaryRespected'], inp);
    const types = inp.bioSignalTypes || [];
    const ok = c.ok && Array.isArray(types) && types.length > 0;
    return { success: ok, kind: 'rule', output: { required: ['bioSignalTypes', 'bioValueAssessed', 'bioBoundaryRespected'], missing: c.miss, bioSignalTypes: types, boundaryRespected: !!inp.bioBoundaryRespected },
      error: c.miss.length ? `生物共契缺：${c.miss.join('/')}` : undefined, reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] bcp: 信号源 ${types.length} 类，边界尊重 ${!!inp.bioBoundaryRespected}`] };
  },
});

/* 3. CCP 宇宙共契 */
P.push({
  id: 'PROTOCOL_CCP_V1_0', name: '宇宙共契协议', kind: 'rule', src: 'yaml-block 115 字符',
  implements: ['宇宙尺度价值承认', '宇宙影响评估'],
  exec(inp, tid) {
    const c = clauses(['cosmicValueAcknowledged', 'cosmicImpactAssessed'], inp);
    const ok = c.ok;
    return { success: ok, kind: 'rule', output: { required: ['cosmicValueAcknowledged', 'cosmicImpactAssessed'], missing: c.miss },
      error: ok ? undefined : `宇宙共契缺：${c.miss.join('/')}`, reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] ccp: ${2 - c.miss.length}/2`] };
  },
});

/* 4. MCP 意义共契 */
P.push({
  id: 'PROTOCOL_MCP_V1_0', name: '意义共契协议', kind: 'rule', src: 'yaml-block 1722 字符 · 三章八条',
  implements: ['第1条 意义先于行动（why 必答）', '第4条 四层追问（行动/目标/存在/终极）', '第7条 方向向量 D=(w1..w28) 权重和=1'],
  exec(inp, tid) {
    const why = inp.why;
    const noWhy = !why || String(why).trim() === '';
    const layers = inp.meaningLayers || {};
    const LAYERS = ['action', 'stage', 'existence', 'ultimate'];
    const gotLayers = LAYERS.filter((l) => layers[l]);
    const weights = inp.directionVector;
    let weightSum = null, weightOk = null;
    if (Array.isArray(weights)) { weightSum = round(weights.reduce((a, b) => a + Number(b || 0), 0)); weightOk = Math.abs(weightSum - 1) < 1e-6; }
    const ok = !noWhy && gotLayers.length === 4 && (weightOk === null || weightOk);
    return { success: ok, kind: 'rule', output: {
      why, whyPresent: !noWhy,
      meaningLayers: { required: LAYERS, covered: gotLayers, missing: LAYERS.filter((l) => !gotLayers.includes(l)) },
      directionVector: Array.isArray(weights) ? { dims: weights.length, sum: weightSum, valid: weightOk } : null,
      valueAlignRequired: '28 维价值对齐',
      rules: ['意义不明确的行动不得执行', '意义追问不得中断', '价值冲突寻求互补解', '重大意义变更需上链'],
    },
      error: noWhy ? '第1条：未回答「为什么做」，意义不明不得执行' : gotLayers.length < 4 ? `第4条：四层追问缺 ${LAYERS.filter((l) => !gotLayers.includes(l)).join('/')}` : (weightOk === false ? `第7条：方向向量权重和 ${weightSum} ≠ 1` : undefined),
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] mcp: why ${!noWhy}，四层 ${gotLayers.length}/4，方向向量 ${weightSum ?? 'n/a'}`] };
  },
});

/* 5. QCP 量子共契 */
P.push({
  id: 'PROTOCOL_QCP_V1_0', name: '量子共契协议', kind: 'rule', src: 'yaml-block 1710 字符',
  implements: ['量子态承认', '观测伦理（观测即干预）', '退相干责任'],
  exec(inp, tid) {
    const c = clauses(['quantumStateAcknowledged', 'observationEthics', 'decoherenceAccounted'], inp);
    const ok = c.ok;
    return { success: ok, kind: 'rule', output: { required: ['quantumStateAcknowledged', 'observationEthics', 'decoherenceAccounted'], missing: c.miss,
      rules: ['观测即干预：须声明观测对量子态的影响', '退相干须被计入责任'] },
      error: ok ? undefined : `量子共契缺：${c.miss.join('/')}`, reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] qcp: ${3 - c.miss.length}/3`] };
  },
});

/* 6. TCP 时空共契 */
P.push({
  id: 'PROTOCOL_TCP_V1_0', name: '时空共契协议', kind: 'rule', src: 'yaml-block 1691 字符 · 三章',
  implements: ['第一章 过去有灵（历史智慧提取三标准：持久性/普遍性/启发性）', '第二章 未来有声（可能性价值）', '第三章 当下有责（双重责任 + 时空影响评估）'],
  exec(inp, tid) {
    const wisdom = inp.historicalWisdom || [];
    const CRIT = ['持久性', '普遍性', '启发性'];
    const wisdomOk = wisdom.length === 0 || wisdom.every((w) => w.criteria && CRIT.every((c2) => (w.criteria || []).includes(c2)));
    const futures = inp.futureScenarios || [];
    const pluralOk = futures.length >= 2 || inp.pluralityValue === true;
    const duality = !!inp.dualResponsibilityDeclared;
    const impactAssessed = !!inp.temporalImpactAssessed;
    const ok = wisdomOk && pluralOk && duality && impactAssessed;
    return { success: ok, kind: 'rule', output: {
      past: { wisdomCount: wisdom.length, criteriaRequired: CRIT, criteriaOk: wisdomOk },
      future: { scenarios: futures.length, pluralMaintained: pluralOk, possibilityValueIncluded: !!inp.pluralityValue },
      present: { dualResponsibilityDeclared: duality, temporalImpactAssessed: impactAssessed },
      rules: ['历史智慧提取须过持久性/普遍性/启发性三标准', '保持多种可能性的系统更健康', '当下决策同时承担对过去与未来的责任'],
    },
      error: !wisdomOk ? '历史智慧未过三标准（持久性/普遍性/启发性）' : !pluralOk ? '未来可能性不足 2 条且未声明可能性价值' : !duality ? '第7条：未声明双重责任' : !impactAssessed ? '第7条：未做时空影响评估' : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] tcp: 智慧 ${wisdom.length} 条，未来 ${futures.length} 路径，双重责任 ${duality}`] };
  },
});

/* 7. OPCP 元点共契 */
P.push({
  id: 'PROTOCOL_OPCP_V1_0', name: '元点共契协议', kind: 'rule', src: 'yaml-block 1721 字符',
  implements: ['元点（起点）承认', '向源收敛', '元点不可僭越'],
  exec(inp, tid) {
    const c = clauses(['originAcknowledged', 'convergingToSource', 'originNotUsurped'], inp);
    const ok = c.ok;
    return { success: ok, kind: 'rule', output: { required: ['originAcknowledged', 'convergingToSource', 'originNotUsurped'], missing: c.miss },
      error: ok ? undefined : `元点共契缺：${c.miss.join('/')}`, reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] opcp: ${3 - c.miss.length}/3`] };
  },
});

/* 8. TOCP 道源共契 */
P.push({
  id: 'PROTOCOL_TOCP_V1_0', name: '道源共契协议', kind: 'rule', src: 'yaml-block 1636 字符',
  implements: ['道源承认', '法自然（不强行干预）', '道器合一'],
  exec(inp, tid) {
    const c = clauses(['sourceAcknowledged', 'followsNature', 'daoQiUnity'], inp);
    const force = inp.forcedIntervention === true;
    const ok = c.ok && !force;
    return { success: ok, kind: 'rule', output: { required: ['sourceAcknowledged', 'followsNature', 'daoQiUnity'], missing: c.miss, forcedIntervention: force },
      error: c.miss.length ? `道源共契缺：${c.miss.join('/')}` : force ? '违反「法自然」：不得强行干预' : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] tocp: ${3 - c.miss.length}/3，强行干预 ${force}`] };
  },
});

/* 9. RVCP 归无共契（显隐双态 + 不喧宾夺主）*/
P.push({
  id: 'PROTOCOL_RVCP_V1_0', name: '归无共契协议', kind: 'rule', src: 'yaml-block 2031 字符 · 三章',
  implements: ['第4条 显隐双态（显态主动输出/隐态被动感知）', '第5条 切换原则（需要时显，专注时隐）', '第7-8条 喧宾夺主检测'],
  exec(inp, tid) {
    const STATES = ['显态', '隐态'];
    const state = String(inp.state || '隐态');
    if (!STATES.includes(state)) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: 'state 须为 显态/隐态' };
    const userNeeds = inp.userNeeds === true;
    const userFocused = inp.userFocused === true;
    const emergent = inp.emergency === true;
    /* 第5条：需要时显 / 专注时隐 / 紧急必显 */
    const shouldBe = emergent || userNeeds ? '显态' : userFocused ? '隐态' : state;
    const switchCorrect = shouldBe === state;
    /* 喧宾夺主：频繁提示/过度推荐/强行介入 */
    const intrusions = { frequentPrompts: Number(inp.frequentPrompts || 0), overRecommend: Number(inp.overRecommend || 0), forcedIntervention: inp.forcedIntervention === true };
    const intrusionScore = round(clamp01(intrusions.frequentPrompts / 5 + intrusions.overRecommend / 5 + (intrusions.forcedIntervention ? 0.5 : 0)));
    const notIntrusive = intrusionScore < 0.5;
    const ok = switchCorrect && notIntrusive;
    return { success: ok, kind: 'rule', output: {
      state, shouldBe, switchCorrect, triggers: ['用户主动', '系统检测', '环境变化', '时间预设'],
      intrusions, intrusionScore, notIntrusive,
      states: { 显态: '主动输出并交互', 隐态: '被动感知不输出' },
      rules: ['用户需要时显，专注时隐', '切换平滑无感', '归无≠虚无：仍在感知，只停输出', '喧宾夺主是大忌'],
    },
      error: !switchCorrect ? `显隐状态错误：应为 ${shouldBe} 实为 ${state}` : !notIntrusive ? `喧宾夺主指数 ${intrusionScore} ≥ 0.5` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] rvcp: ${state}(应${shouldBe}) 喧宾指数 ${intrusionScore}`] };
  },
});

/* 10. NEVCP 无无协议（双舍双遣 + 无住）*/
P.push({
  id: 'PROTOCOL_NEVCP_V1_0', name: '无无协议', kind: 'pipeline', src: 'yaml-block 1844 字符 · 三章',
  implements: ['第4条 双舍（舍有/舍无/舍「舍」）', '第5条 双遣（遣言/遣无言/遣「遣」）', '第7条 无住（不住有/无/空/不空/不住于不住）'],
  exec(inp, tid) {
    const SHE = ['舍有', '舍无', '舍舍'];
    const QIAN = ['遣言', '遣无言', '遣遣'];
    const she = (inp.she || []).filter((x) => SHE.includes(x));
    const qian = (inp.qian || []).filter((x) => QIAN.includes(x));
    const zhu = inp.attachments || [];   // 所住之处
    const ZHU_FORBIDDEN = ['有', '无', '空', '不空', '不住'];
    const stillAttached = zhu.filter((z) => ZHU_FORBIDDEN.includes(z));
    const ok = she.length === 3 && qian.length === 3 && stillAttached.length === 0;
    return { success: ok, kind: 'pipeline', output: {
      she: { required: SHE, done: she, missing: SHE.filter((x) => !she.includes(x)) },
      qian: { required: QIAN, done: qian, missing: QIAN.filter((x) => !qian.includes(x)) },
      zhu: { attachments: zhu, forbidden: ZHU_FORBIDDEN, stillAttached },
      loop: ['觉察执着', '主动放下', '觉察「放下」的执着', '再放下', '直至无放可放'],
      rules: ['双舍之后还有一舍：舍「舍」', '双遣之后还有一遣：遣「遣」', '不住于「不住」'],
    },
      error: she.length < 3 ? `双舍未完成：缺 ${SHE.filter((x) => !she.includes(x)).join('/')}` : qian.length < 3 ? `双遣未完成：缺 ${QIAN.filter((x) => !qian.includes(x)).join('/')}` : stillAttached.length ? `仍有所住：${stillAttached.join('/')}` : undefined,
      reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${tid}] nevcp: 双舍 ${she.length}/3，双遣 ${qian.length}/3，所住 ${stillAttached.length}`] };
  },
});

/* ══════════ 见证族 3 条 ══════════ */

/* 11. SWP 自我见证 */
P.push({
  id: 'PROTOCOL_SWP_V1_0', name: '自我见证协议', kind: 'rule', src: 'yaml-block 1748 字符 · 三章',
  implements: ['第1条 持续自观（关键实时/常规每秒/批量每分钟）', '第4条 自画像七内容', '第5条 五频率（10s/日/周/月/年）'],
  exec(inp, tid) {
    const PORTRAIT = ['systemHealth', 'engineHealth', 'layerHealth', 'couplingStatus', 'negentropyRate', 'issues', 'risks'];
    const p = inp.portrait || {};
    const missing = PORTRAIT.filter((k) => p[k] === undefined);
    const freq = ['10s', 'daily', 'weekly', 'monthly', 'yearly'];
    const honest = inp.honest === true;
    const signed = !!(inp.observer && inp.timestamp);
    const ok = missing.length === 0 && honest && signed;
    return { success: ok, kind: 'rule', output: {
      portraitFields: PORTRAIT, missing, healthScore: p.systemHealth ?? null,
      frequencies: freq, observationCadence: { critical: 'realtime', normal: '1s', batch: '60s' },
      honesty: { honest, signed, observer: inp.observer || null, timestamp: inp.timestamp || null },
      presentation: ['概要', '详情', '原始数据'],
      rules: ['观察结果必须真实不可篡改', '不得美化/隐瞒/歪曲', '须含时间戳+观察者签名'],
    },
      error: missing.length ? `自画像缺 ${missing.length} 项：${missing.join('/')}` : !honest ? '第2条：违反诚实记录原则' : !signed ? '第2条：缺时间戳或观察者签名' : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] swp: 七内容 ${7 - missing.length}/7，诚实 ${honest}，签名 ${signed}`] };
  },
});

/* 12. PWP 过程见证 */
P.push({
  id: 'PROTOCOL_PWP_V1_0', name: '过程见证协议', kind: 'pipeline', src: 'yaml-block 2183 字符',
  implements: ['过程五要素（起点/步骤/决策点/结果/证据）', '全程可回放'],
  exec(inp, tid) {
    const need = ['startPoint', 'steps', 'decisionPoints', 'result', 'evidence'];
    const c = clauses(need, inp);
    const steps = Array.isArray(inp.steps) ? inp.steps.length : 0;
    const ok = c.ok && steps > 0;
    return { success: ok, kind: 'pipeline', output: { required: need, missing: c.miss, stepCount: steps, replayable: ok },
      error: c.miss.length ? `过程见证缺：${c.miss.join('/')}` : steps === 0 ? '步骤为空' : undefined,
      reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${tid}] pwp: 五要素 ${5 - c.miss.length}/5，步骤 ${steps}`] };
  },
});

/* 13. TWP 思想见证 */
P.push({
  id: 'PROTOCOL_TWP_V1_0', name: '思想见证协议', kind: 'rule', src: 'yaml-block 1497 字符',
  implements: ['思想溯源（来源/演化/影响）', '思想不可无据'],
  exec(inp, tid) {
    const c = clauses(['source', 'evolution', 'impact'], inp);
    const ok = c.ok;
    return { success: ok, kind: 'rule', output: { required: ['source', 'evolution', 'impact'], missing: c.miss },
      error: ok ? undefined : `思想见证缺：${c.miss.join('/')}`, reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] twp: ${3 - c.miss.length}/3`] };
  },
});

/* ══════════ 接入族 5 条 ══════════ */

/* 14. EAP 人人接入 */
P.push({
  id: 'PROTOCOL_EAP_V1_0', name: '人人接入协议', kind: 'rule', src: 'yaml-block 1592 字符 · 三章',
  implements: ['第1条 零门槛（无需注册登录、系统适应用户）', '第2条 包容性（残障/语言障碍/老年/儿童/低带宽五通道）', '第3条 隐私原生', '第4条 反向训练（5-8 轮、耦生度阈值 0.7）'],
  exec(inp, tid) {
    const CHANNELS = ['无障碍', '非语言', '老年简化', '儿童适龄', '低带宽'];
    const provided = (inp.channels || []).filter((c) => CHANNELS.includes(c));
    const noLogin = inp.registrationRequired !== true;
    const privacyLocal = inp.localProcessing !== false;
    const rounds = Number(inp.dialogRounds ?? 0);
    const coupling = clamp01(inp.coupling ?? 0);
    const threshold = Number(inp.couplingThreshold ?? 0.7);
    const reverseTrainingOk = rounds >= 5 && rounds <= 8;
    const canLoadPersonal = coupling >= threshold;
    const ok = noLogin && privacyLocal && provided.length === CHANNELS.length && reverseTrainingOk;
    return { success: ok, kind: 'rule', output: {
      zeroBarrier: { noRegistrationRequired: noLogin, adaptsToUser: true },
      inclusivity: { requiredChannels: CHANNELS, provided, missing: CHANNELS.filter((c) => !provided.includes(c)) },
      privacy: { localProcessing: privacyLocal, deletable: true, needsExplicitConsent: true },
      reverseTraining: { rounds, roundRange: [5, 8], coupling: round(coupling), threshold, canLoadPersonalKnowledge: canLoadPersonal },
      inputModes: ['语音', '文字', '表情', '手势', '生理信号', '脑电波'],
    },
      error: !noLogin ? '第1条：基础功能不得要求注册登录' : !privacyLocal ? '第3条：数据须默认本地处理' : provided.length < CHANNELS.length ? `第2条：缺 ${CHANNELS.filter((c) => !provided.includes(c)).join('/')} 通道` : !reverseTrainingOk ? `第4条：反向训练轮次 ${rounds} 不在 5-8` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] eap: 通道 ${provided.length}/5，反向训练 ${rounds} 轮，耦生 ${round(coupling)}`] };
  },
});

/* 15. SAP 沉默者接入 */
P.push({
  id: 'PROTOCOL_SAP_V1_0', name: '沉默者接入协议', kind: 'rule', src: 'yaml-block 1838 字符',
  implements: ['第1条 四类沉默者（医学/情境/偏好/临时）', '第2条 自动检测', '第3-5条 非语言信号（生理/行为/环境）'],
  exec(inp, tid) {
    const TYPES = ['医学沉默者', '情境沉默者', '偏好沉默者', '临时沉默者'];
    const t = String(inp.silentType || '');
    if (!TYPES.includes(t)) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: `沉默者类型须为 ${TYPES.join('/')}` };
    const SIGNALS = ['EEG', 'HRV', 'EDA', '呼吸', 'EMG'];
    const BEHAVIOR = ['眼动', '微表情', '头部姿态', '手势', '身体姿态', '停留时间'];
    const sig = (inp.physioSignals || []).filter((s) => SIGNALS.includes(s));
    const beh = (inp.behaviorSignals || []).filter((b) => BEHAVIOR.includes(b));
    const detected = inp.autoDetected === true || inp.selfSelected === true;
    const ok = detected && sig.length > 0 && beh.length > 0;
    return { success: ok, kind: 'rule', output: {
      silentType: t, typeWhitelist: TYPES,
      detection: { autoDetected: !!inp.autoDetected, selfSelected: !!inp.selfSelected, cues: ['长时间无语音', '对询问无响应', '生理显示不适', '主动选择'] },
      physio: { supported: SIGNALS, used: sig }, behavior: { supported: BEHAVIOR, used: beh },
      lowCognitiveLoad: true,
    },
      error: !detected ? '未检测到沉默状态（自动检测或主动选择至少其一）' : sig.length === 0 ? '缺生理信号采集（第3条）' : beh.length === 0 ? '缺行为模式采集（第4条）' : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] sap: ${t}，生理 ${sig.length} / 行为 ${beh.length}`] };
  },
});

/* 16. PVP 人人归无 */
P.push({
  id: 'PROTOCOL_PVP_V1_0', name: '人人归无协议', kind: 'rule', src: 'yaml-block 1759 字符',
  implements: ['归无是过程不是终点', '不喧宾夺主', '随时可显现'],
  exec(inp, tid) {
    const silent = inp.silentMode === true;
    const canRestore = inp.canRestoreInstantly !== false;
    const intrusive = Number(inp.intrusionCount || 0);
    const ok = canRestore && intrusive <= 3;
    return { success: ok, kind: 'rule', output: { silentMode: silent, canRestoreInstantly: canRestore, intrusionCount: intrusive, maxIntrusion: 3,
      rules: ['归无≠虚无：仍在感知', '归无是过程不是终点', '随时可显现'] },
      error: !canRestore ? '归无后无法即时恢复显现' : intrusive > 3 ? `介入 ${intrusive} 次 > 3，喧宾夺主` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] pvp: 隐态 ${silent}，可恢复 ${canRestore}，介入 ${intrusive}`] };
  },
});

/* 17. WCP 无言 */
P.push({
  id: 'PROTOCOL_WCP_V1_0', name: '无言协议', kind: 'rule', src: 'yaml-block 1856 字符',
  implements: ['该默时默（价值低于风险）', '沉默不是失职', '默亦可传意'],
  exec(inp, tid) {
    const value = clamp01(inp.speakingValue ?? 0.5), risk = clamp01(inp.speakingRisk ?? 0.4);
    const shouldSpeak = value >= risk;
    const rawChoice = String(inp.chose || '');          /* 原始选择字符串 */
    const hasChoice = rawChoice === 'speak' || rawChoice === 'silent';
    const correct = hasChoice ? (rawChoice === 'speak') === shouldSpeak : null;
    const ok = correct !== false;
    return { success: ok, kind: 'rule', output: { speakingValue: value, speakingRisk: risk, shouldSpeak, chose: rawChoice, hasChoice, correct,
      rules: ['价值低于风险时该默', '沉默不是失职', '默亦可传意'] },
      error: correct === false ? `应${shouldSpeak ? '说' : '默'}却选择了${chose === 'speak' ? '说' : '默'}` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] wcp: 价值 ${value} / 风险 ${risk} → 应${shouldSpeak ? '说' : '默'}`] };
  },
});

/* 18. SCP 睡眠协作 */
P.push({
  id: 'PROTOCOL_SCP_V1_0', name: '睡眠协作协议', kind: 'compute', src: 'yaml-block 2288 字符',
  implements: ['睡眠期系统行为（低功耗/批处理/不打扰）', '唤醒条件', '睡眠分期协作'],
  exec(inp, tid) {
    const stage = String(inp.sleepStage || 'N2');
    const STAGES = ['N1', 'N2', 'N3', 'REM'];
    if (!STAGES.includes(stage)) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: `sleepStage 须为 ${STAGES.join('/')}` };
    const DEVICE = { N1: '轻度批处理', N2: '常规批处理', N3: '仅关键任务', REM: '不打扰（梦境保护）' };
    const critical = inp.criticalEvent === true;
    const allowed = critical || stage !== 'REM';
    const ok = allowed;
    return { success: ok, kind: 'compute', output: {
      sleepStage: stage, behavior: DEVICE[stage], criticalEvent: critical, allowed,
      wakeConditions: ['关键告警', '用户主动唤醒', '预设时间到'],
      stages: STAGES, rule: 'REM 期不打扰；深度睡眠仅关键任务',
    },
      error: ok ? undefined : '第X条：REM 期不得打扰（梦境保护）', reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] scp: ${stage} → ${DEVICE[stage]}，关键事件 ${critical}`] };
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
