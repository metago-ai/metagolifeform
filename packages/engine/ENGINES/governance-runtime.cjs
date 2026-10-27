#!/usr/bin/env node
/**
 * P6-B9 · 数学扩展 / 能力 / 治理 / 智能体 / 调度 引擎运行时（28 条）
 * 依 ENGINE-CONTRACTS.json 功能描述与元构通用模式实现；每条的推导依据记入 spec 字段。
 */
'use strict';

let __seq = 0;
const newTraceId = () => {
  const d = new Date(), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${d.getHours()}${p(d.getMinutes())}${p(d.getSeconds())}-M${p((++__seq) % 10000, 4)}`;
};
const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));
const round = (x, n = 6) => Math.round((Number(x) || 0) * 10 ** n) / 10 ** n;
const mean = (a) => (a.length ? a.reduce((s, x) => s + (Number(x) || 0), 0) / a.length : 0);
const shaShort = (s) => require('crypto').createHash('sha256').update(String(s)).digest('hex').slice(0, 16);

const E = [];

/* ══════ 数学扩展族 5 ══════ */
E.push({
  id: 'ENGINE_INFINITE_PRODUCT_48', name: '无穷乘积分析引擎', kind: 'compute', spec: '第1部分 §2.1（898 字符）· 收敛性判据',
  implements: ['部分积序列 → 收敛判定（相邻比趋于 1 且部分积有界）', '对数化求和（∏a_n 收敛 ⇔ Σln a_n 收敛）'],
  exec(inp, tid) {
    const terms = inp.terms;
    if (!Array.isArray(terms) || terms.length < 2) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供长度≥2 的 terms' };
    const t = terms.map(Number);
    let prod = 1; const partial = [];
    for (const x of t) { prod *= x; partial.push(round(prod, 10)); }
    const logs = t.map((x) => Math.log(Math.abs(x instanceof Object ? x : x)) || 0);
    const logSum = round(logs.reduce((a, b) => a + (isFinite(b) ? b : 0), 0));
    const ratio = t.length > 1 ? round(Math.abs(t[t.length - 1] / (t[0] || 1))) : null;
    const bounded = partial.every((p) => Math.abs(p) < 1e12);
    return { success: true, kind: 'compute', output: {
      terms: t.length, partialProducts: partial.slice(-5), finalProduct: round(prod, 10),
      logSum, converges: bounded, ratioTest: ratio,
      formula: '∏a_n 收敛 ⇔ Σ ln|a_n| 收敛', caveat: '有限截断无法证明收敛，仅作数值趋势判断',
    }, provenance: [`[${tid}] infinite-product: ${t.length} 项，部分积 ${round(prod, 6)}`] };
  },
});

E.push({
  id: 'ENGINE_EXPLICIT_FORMULA_56', name: '显式公式引擎', kind: 'compute', spec: '第1部分 §2.1（898 字符，V16.3→V16.4）· 多零点显式公式',
  implements: ['Riemann 显式公式主项：ψ(x) ≈ x − Σ x^ρ/ρ − ln(2π)', '多零点逐项累加'],
  exec(inp, tid) {
    const x = Number(inp.x);
    if (!isFinite(x) || x <= 1) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 x > 1' };
    const zeros = inp.zeros || [{ re: 0.5, im: 14.134725 }];
    let osc = 0;
    for (const z of zeros) {
      const a = Number(z.re ?? 0.5), b = Number(z.im ?? 0);
      const mod = Math.pow(x, a);
      /* x^ρ/ρ 的实部贡献（共轭成对 → 2·Re） */
      const denom = a * a + b * b || 1;
      osc += 2 * mod * (a * Math.cos(b * Math.log(x)) + b * Math.sin(b * Math.log(x))) / denom;
    }
    const psi = round(x - osc - Math.log(2 * Math.PI));
    return { success: true, kind: 'compute', output: {
      x, zeros: zeros.length, oscillation: round(osc), psiApprox: psi,
      formula: 'ψ(x) ≈ x − Σ_ρ x^ρ/ρ − ln(2π)', note: '仅含给定零点，非全零点集；用于趋势与振荡分析',
    }, provenance: [`[${tid}] explicit-formula: x=${x} zeros=${zeros.length} → ψ≈${psi}`] };
  },
});

E.push({
  id: 'ENGINE_CLASSICAL_THEOREM_57', name: '经典定理调用引擎', kind: 'compute', spec: '第1部分（推断：定理库匹配）',
  implements: ['定理库关键词匹配 + 适用范围校验'],
  exec(inp, tid) {
    const q = String(inp.query || '');
    if (!q) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 query' };
    const LIB = [
      { name: '勾股定理', pat: /直角|勾股|斜边/, cond: '欧氏平面直角三角形' },
      { name: '费马小定理', pat: /素数.*模|mod.*素数|a\^p/, cond: 'p 为素数且 gcd(a,p)=1' },
      { name: '欧拉公式', pat: /e\^\{?i|复数.*指数|欧拉/, cond: '任意复数 θ' },
      { name: '中值定理', pat: /连续.*可导|中值/, cond: '闭区间连续开区间可导' },
      { name: '贝叶斯定理', pat: /条件概率|先验|后验/, cond: 'P(B)>0' },
      { name: '哥德尔不完备', pat: /不完备|自指|可证性/, cond: '足够强的形式系统' },
      { name: '泰勒展开', pat: /展开|近似|泰勒/, cond: '函数在展开点足够阶可导' },
      { name: '切比雪夫不等式', pat: /大偏差|尾部概率|方差界/, cond: '有限方差的随机变量' },
    ];
    const hits = LIB.filter((l) => l.pat.test(q));
    return { success: true, kind: 'compute', output: { query: q, matches: hits, count: hits.length,
      note: hits.length ? '须先校验适用条件，不满足则不可套用' : '未命中定理库' },
      provenance: [`[${tid}] classical-theorem: 命中 ${hits.length} 条`] };
  },
});

E.push({
  id: 'ENGINE_META_MATH_67', name: '元数学分析引擎', kind: 'compute', spec: '第2部分（推断：可证明性/一致性分析）',
  implements: ['四维元数学评估（一致性/完备性/可判定性/表达力）'],
  exec(inp, tid) {
    const d = inp.dims || { consistency: 0.9, completeness: 0.6, decidability: 0.5, expressiveness: 0.8 };
    const W = { consistency: 0.35, completeness: 0.2, decidability: 0.2, expressiveness: 0.25 };
    const score = round(Object.keys(W).reduce((s, k) => s + W[k] * clamp01(d[k]), 0));
    return { success: true, kind: 'compute', output: { dims: d, weights: W, metaScore: score,
      verdict: score >= 0.8 ? '系统性质良好' : score >= 0.6 ? '可接受（需注意不完备性）' : '存在根本限制',
      caveat: '哥德尔不完备定理：足够强的系统无法同时完备且一致' },
      provenance: [`[${tid}] meta-math: 四维加权 ${score}`] };
  },
});

E.push({
  id: 'ENGINE_LARGE_DEVIATION_65', name: '大偏差与统计检验引擎', kind: 'compute', spec: '第2部分（推断：Chebyshev/Chernoff 界）',
  implements: ['切比雪夫界 P(|X−μ|≥kσ) ≤ 1/k²', 'Hoeffding 界（有界随机变量）'],
  exec(inp, tid) {
    const k = Number(inp.k);
    if (!isFinite(k) || k <= 0) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 k > 0（偏离倍数）' };
    const cheb = round(Math.min(1, 1 / (k * k)));
    const n = Number(inp.n ?? 30), range = Number(inp.range ?? 1);
    /* Hoeffding: P(|X̄−μ|≥t) ≤ 2exp(−2nt²/range²) */
    const t = Number(inp.t ?? k * (range / Math.sqrt(n)));
    const hoeff = round(Math.min(1, 2 * Math.exp(-2 * n * t * t / (range * range))));
    return { success: true, kind: 'compute', output: { k, chebyshevBound: cheb, n, range, t, hoeffdingBound: hoeff,
      formula: { chebyshev: 'P(|X−μ|≥kσ) ≤ 1/k²', hoeffding: 'P(|X̄−μ|≥t) ≤ 2exp(−2nt²/R²)' },
      note: '均为上界，可能很松' },
      provenance: [`[${tid}] large-deviation: k=${k} → Chebyshev ${cheb}，Hoeffding ${hoeff}`] };
  },
});

/* ══════ 能力族 6 ══════ */
E.push({
  id: 'ENGINE_ABSORPTION_25', name: '能力吸收引擎', kind: 'pipeline', spec: '附录卷-第2部分 L6285（扫描/识别/指纹/预评估）',
  implements: ['四步：扫描节点 → 识别新能力 → 生成能力指纹（不可逆哈希）→ 价值预评估'],
  exec(inp, tid) {
    const nodes = inp.nodes || [];
    const newCaps = inp.newCapabilities || [];
    const STEP = ['扫描组织智能体节点', '识别新能力', '生成能力指纹', '价值预评估'];
    const fps = newCaps.map((c) => ({ capability: c.name || c.id, fingerprint: '0x' + shaShort(JSON.stringify(c)) }));
    const value = round(mean(newCaps.map((c) => clamp01(c.preliminaryValue ?? 0.5))));
    const ok = nodes.length > 0 && newCaps.length > 0;
    return { success: ok, kind: 'pipeline', output: { steps: STEP, nodesScanned: nodes.length, capabilitiesIdentified: newCaps.length, fingerprints: fps, preliminaryValue: value, layer: 'L8创新创造层' },
      error: ok ? undefined : '需提供 nodes 与 newCapabilities', reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${tid}] absorption: 扫 ${nodes.length} 节点，识别 ${newCaps.length} 新能力，价值 ${value}`] };
  },
});

E.push({
  id: 'ENGINE_ENCAPSULATE_24', name: '封装进化引擎', kind: 'pipeline', spec: '推断（与 ABSORPTION_25 配对的封装侧）',
  implements: ['四步：标准化转换 → 生成接口 → 预计算耦生度 → 纳入能力库'],
  exec(inp, tid) {
    const cap = inp.capability;
    if (!cap) return { success: false, kind: 'pipeline', reason: 'INVALID_INPUT', error: '必须提供 capability' };
    const STEP = ['标准化转换', '生成接口', '预计算耦生度', '纳入能力库'];
    const iface = { id: cap.id, name: cap.name, inputs: cap.inputs || [], outputs: cap.outputs || [], version: inp.version || '1.0.0' };
    const coupling = round(clamp01(inp.precomputedCoupling ?? 0.75));
    return { success: true, kind: 'pipeline', output: { steps: STEP, interface: iface, coupling, libraryEntry: cap.id, layer: 'L8创新创造层' },
      provenance: [`[${tid}] encapsulate: ${cap.id} 封装，耦生度 ${coupling}`] };
  },
});

E.push({
  id: 'ENGINE_CAPABILITY_SCHED_46', name: '能力模块调度引擎', kind: 'compute', spec: '第2部分（推断：优先级+负载调度）',
  implements: ['优先级×可用度排序 + 容量约束贪心排入'],
  exec(inp, tid) {
    const mods = inp.modules, cap = Number(inp.capacity ?? 10);
    if (!Array.isArray(mods) || !mods.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 modules 数组' };
    const scored = mods.map((m) => ({ ...m, score: round(clamp01(m.priority ?? 0.5) * 0.7 + clamp01(m.availability ?? 0.8) * 0.3) })).sort((a, b) => b.score - a.score);
    let used = 0; const run = [], wait = [];
    for (const m of scored) { const c = Number(m.cost ?? 1); if (used + c <= cap) { run.push(m); used += c; } else wait.push(m); }
    return { success: true, kind: 'compute', output: { capacity: cap, scheduled: run.map((m) => m.id || m.name), deferred: wait.map((m) => m.id || m.name), usedCapacity: used, utilization: round(used / (cap || 1)) },
      provenance: [`[${tid}] capability-sched: ${run.length} 排入 / ${wait.length} 延后`] };
  },
});

E.push({
  id: 'ENGINE_AGENT_CLASSIFIER_168', name: '工业智能体分类分级引擎', kind: 'rule', spec: '第4部分（1674 字符，推断：L1–L5 分级）',
  implements: ['五级分类（L1 辅助 → L5 自主）', '分级 → 授权上限映射'],
  exec(inp, tid) {
    const autonomy = clamp01(inp.autonomy ?? 0.5), risk = clamp01(inp.riskLevel ?? 0.5), oversight = clamp01(inp.humanOversight ?? 0.5);
    const score = round(autonomy * 0.5 + (1 - risk) * 0.3 + (1 - oversight) * 0.2);
    const LEVELS = [['L1', '辅助型', 0.2], ['L2', '半自主', 0.4], ['L3', '条件自主', 0.6], ['L4', '高度自主', 0.8], ['L5', '完全自主', 1.0]];
    const lv = LEVELS.find((l) => score <= l[2]) || LEVELS[4];
    return { success: true, kind: 'rule', output: { autonomy, riskLevel: risk, humanOversight: oversight, score,
      level: lv[0], label: lv[1], maxAutonomy: lv[2],
      requiresHumanApproval: lv[0] === 'L4' || lv[0] === 'L5',
      formula: 'score = 自主度×0.5 + (1−风险)×0.3 + (1−人工监督)×0.2' },
      provenance: [`[${tid}] agent-classifier: score ${score} → ${lv[0]} ${lv[1]}`] };
  },
});

E.push({
  id: 'ENGINE_HARNESS_GEN_171', name: 'Harness自动生成引擎', kind: 'pipeline', spec: '第4部分（推断：能力→Harness 五要素）',
  implements: ['从能力规格生成 Harness（规则/工具/技能/记忆/门禁 五要素）'],
  exec(inp, tid) {
    const spec = inp.capabilitySpec;
    if (!spec || !spec.name) return { success: false, kind: 'pipeline', reason: 'INVALID_INPUT', error: '必须提供含 name 的 capabilitySpec' };
    const FIVE = ['规则', '工具', '技能', '记忆', '门禁'];
    return { success: true, kind: 'pipeline', output: { capability: spec.name, harness: {
      规则: spec.rules || [`执行 ${spec.name} 时须遵守元构公理`],
      工具: spec.tools || [`${spec.name} 执行器`],
      技能: spec.skills || [`metago-${(spec.name || '').toLowerCase().replace(/\s+/g, '-')}`],
      记忆: spec.memory || ['KMWI 四层'],
      门禁: spec.gates || ['决策锁四关', '交付门禁'],
    }, elements: FIVE },
      provenance: [`[${tid}] harness-gen: 为 ${spec.name} 生成五要素 Harness`] };
  },
});

E.push({
  id: 'ENGINE_AGENT_ASSEMBLE_169', name: '智能体封装引擎', kind: 'pipeline', spec: '第4部分（1331 字符）',
  implements: ['封装六要素（角色/能力/工具/边界/交付/验证）'],
  exec(inp, tid) {
    const need = ['role', 'capabilities', 'tools', 'boundary', 'delivery', 'verification'];
    const a = inp.agent || {};
    const steps = need.map((k, i) => ({ no: i + 1, key: k, present: a[k] !== undefined }));
    const miss = steps.filter((s) => !s.present).map((s) => s.key);
    const ok = miss.length === 0;
    return { success: ok, kind: 'pipeline', steps, output: { elements: need, missing: miss, agent: a },
      error: ok ? undefined : `封装缺要素：${miss.join('/')}`, reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${tid}] agent-assemble: 六要素 ${6 - miss.length}/6`] };
  },
});

/* ══════ 治理/合规族 7 ══════ */
E.push({
  id: 'ENGINE_FACTCHECK_19', name: '事实核查引擎', kind: 'rule', spec: '第1部分（推断：四档置信标注）',
  implements: ['四档置信度标注（✅已确认≥0.9 / 📊较高0.7-0.89 / ⚠️待核实0.5-0.69 / 🔍需确认<0.5）'],
  exec(inp, tid) {
    const stmts = inp.statements;
    if (!Array.isArray(stmts) || !stmts.length) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 statements 数组' };
    const T = [['✅ 已确认', 0.9, 1], ['📊 较高置信度', 0.7, 0.899], ['⚠️ 待核实', 0.5, 0.699], ['🔍 需确认', 0, 0.499]];
    const checked = stmts.map((s, i) => {
      const c = Number(s.confidence ?? 0);
      const tier = T.find((t) => c >= t[1] && c <= t[2]) || T[3];
      return { index: i, content: s.content, confidence: c, tier: tier[0], hasSource: !!s.source };
    });
    const unsourced = checked.filter((c) => !c.hasSource);
    return { success: true, kind: 'rule', output: { total: stmts.length, checked, unsourced: unsourced.length,
      tiers: T.map((t) => ({ label: t[0], range: [t[1], t[2]] })),
      rule: '事实必须标置信度；无来源不得标 ✅' },
      provenance: [`[${tid}] factcheck: ${stmts.length} 条，无来源 ${unsourced.length}`] };
  },
});

E.push({
  id: 'ENGINE_ASSET_PROTECT_96', name: '资产保护引擎', kind: 'rule', spec: '第2部分（755 字符）',
  implements: ['资产分级（公开/内部/机密/绝密）+ 加密要求 + 泄露检测'],
  exec(inp, tid) {
    const LEVELS = { 公开: 0, 内部: 1, 机密: 2, 绝密: 3 };
    const lv = String(inp.assetLevel || '内部');
    if (LEVELS[lv] === undefined) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '资产级别须为 公开/内部/机密/绝密' };
    const needEnc = LEVELS[lv] >= 2;
    const encrypted = inp.encrypted === true;
    const leaked = inp.leaked === true;
    const ok = (!needEnc || encrypted) && !leaked;
    return { success: ok, kind: 'rule', output: { level: lv, levelNum: LEVELS[lv], requiresEncryption: needEnc, encrypted, leaked,
      controls: LEVELS[lv] >= 3 ? ['加密', '访问白名单', '审计留痕', '水印'] : LEVELS[lv] >= 2 ? ['加密', '访问控制'] : ['基础访问控制'] },
      error: leaked ? '检测到资产泄露' : needEnc && !encrypted ? `${lv} 级资产必须加密` : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] asset-protect: ${lv} 级，加密 ${encrypted}，泄露 ${leaked}`] };
  },
});

E.push({
  id: 'ENGINE_COMPLIANCE_114', name: '行业合规认证引擎', kind: 'rule', spec: '第2部分（545 字符）',
  implements: ['行业认证项对照（医疗/金融/工业/教育）'],
  exec(inp, tid) {
    const REQ = {
      医疗: ['HIPAA', '医疗器械备案', '临床数据脱敏'],
      金融: ['PCI-DSS', '反洗钱', '投资者适当性'],
      工业: ['IEC 62443', '等保三级', '工控安全审计'],
      教育: ['未成年人保护', '教育数据规范'],
    };
    const ind = String(inp.industry || '');
    if (!REQ[ind]) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: `行业须为 ${Object.keys(REQ).join('/')}` };
    const have = inp.certifications || [];
    const missing = REQ[ind].filter((c) => !have.includes(c));
    const ok = missing.length === 0;
    return { success: ok, kind: 'rule', output: { industry: ind, required: REQ[ind], have, missing, certified: ok },
      error: ok ? undefined : `${ind} 行业缺认证：${missing.join('/')}`, reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] compliance: ${ind} 缺 ${missing.length} 项`] };
  },
});

E.push({
  id: 'ENGINE_EVIDENCE_83', name: '证据链引擎', kind: 'rule', spec: '第2部分（726 字符，升级版）',
  implements: ['证据完整性 + 链式哈希 + 时间戳单调性'],
  exec(inp, tid) {
    const ev = inp.evidence;
    if (!Array.isArray(ev) || !ev.length) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 evidence 数组' };
    const missing = ev.map((e, i) => ({ i, m: ['id', 'hash', 'timestamp'].filter((k) => !e[k]) })).filter((x) => x.m.length);
    let monotonic = true;
    for (let i = 1; i < ev.length; i++) if (String(ev[i].timestamp) < String(ev[i - 1].timestamp)) { monotonic = false; break; }
    const chainHash = '0x' + shaShort(ev.map((e) => e.hash).join('|'));
    const ok = missing.length === 0 && monotonic;
    return { success: ok, kind: 'rule', output: { count: ev.length, missing, timeMonotonic: monotonic, chainHash },
      error: missing.length ? `${missing.length} 条证据缺 id/hash/timestamp` : !monotonic ? '时间戳非单调递增，链可能被篡改' : undefined,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] evidence: ${ev.length} 条，单调 ${monotonic}，链哈希 ${chainHash}`] };
  },
});

E.push({
  id: 'ENGINE_INTENT_UNDERSTAND_88', name: '意图理解引擎', kind: 'compute', spec: '第2部分（推断：意图分类+置信）',
  implements: ['意图关键词分类 + 置信度 + 歧义检测'],
  exec(inp, tid) {
    const u = String(inp.utterance || '');
    if (!u) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 utterance' };
    const INTENTS = [
      { n: '查询', pat: /是什么|多少|哪里|查询|查一下|列出/ },
      { n: '创建', pat: /创建|新建|生成|写一个|做一份/ },
      { n: '修改', pat: /修改|改成|调整|更新|替换/ },
      { n: '删除', pat: /删除|移除|清理|去掉/ },
      { n: '分析', pat: /分析|评估|诊断|对比|为什么/ },
      { n: '执行', pat: /执行|运行|跑一下|启动/ },
    ];
    const hits = INTENTS.filter((i) => i.pat.test(u));
    const confidence = hits.length === 0 ? 0.2 : hits.length === 1 ? 0.85 : round(0.85 / hits.length);
    return { success: true, kind: 'compute', output: { utterance: u, intents: hits.map((h) => h.n), primary: hits[0]?.n || '未知', confidence,
      ambiguous: hits.length > 1, needClarify: hits.length > 1 && confidence < 0.5 },
      provenance: [`[${tid}] intent-understand: ${hits.map((h) => h.n).join('/') || '未知'}，置信 ${confidence}`] };
  },
});

E.push({
  id: 'ENGINE_FAILURE_FUEL_118', name: '失败燃料引擎', kind: 'compute', spec: '第2部分（推断：失败→进化燃料转换）',
  implements: ['失败分级 + 燃料值计算（失败越严重、越罕见，燃料越多）'],
  exec(inp, tid) {
    const fails = inp.failures;
    if (!Array.isArray(fails) || !fails.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 failures 数组' };
    const fuel = fails.map((f) => {
      const sev = clamp01(f.severity ?? 0.5), rare = clamp01(f.rarity ?? 0.5), repeat = Number(f.occurrences ?? 1);
      return { id: f.id, fuel: round(clamp01(sev * 0.6 + rare * 0.4) / Math.max(1, repeat) ** 0.3), severity: sev, rarity: rare, occurrences: repeat };
    });
    const total = round(fuel.reduce((s, f) => s + f.fuel, 0));
    return { success: true, kind: 'compute', output: { failures: fails.length, fuel, totalFuel: total,
      triggerMetaEvolution: total >= 2,
      formula: 'fuel = (严重度×0.6 + 罕见度×0.4) / 重复次数^0.3（重复失败燃料衰减）',
      rule: '失败即起点：失败转化为元进化燃料' },
      provenance: [`[${tid}] failure-fuel: ${fails.length} 失败 → 燃料 ${total}，触发元进化 ${total >= 2}`] };
  },
});

E.push({
  id: 'ENGINE_DECEPTION_DETECT_71', name: '欺骗检测引擎', kind: 'rule', spec: '第2部分（813 字符）· 见 B8',
  implements: ['同 B8 实现（复用以保持单一真相源）'],
  exec(inp, tid) {
    /* 复用 B8 模块，避免两套标准 */
    let B8;
    try { B8 = require('./math-capability-runtime.cjs'); } catch (e) { return { success: false, kind: 'rule', error: 'B8 模块不可用' }; }
    return B8.executeSync('ENGINE_DECEPTION_DETECT_71', inp);
  },
});

/* ══════ 调度/边缘/监控 7 ══════ */
E.push({
  id: 'ENGINE_CRON_SCHEDULER_137', name: '内置定时任务调度引擎', kind: 'compute', spec: '第3部分（1185 字符，新增）',
  implements: ['cron 表达式解析（5 段）+ 下次触发时间计算'],
  exec(inp, tid) {
    const cron = String(inp.cron || '');
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: 'cron 须为 5 段（分 时 日 月 周）' };
    const parse = (s, min, max) => {
      if (s === '*') return Array.from({ length: max - min + 1 }, (_, i) => min + i);
      const out = [];
      for (const seg of s.split(',')) {
        if (seg.includes('-')) { const [a, b] = seg.split('-').map(Number); for (let i = a; i <= b; i++) out.push(i); }
        else if (seg.startsWith('*/')) { const step = Number(seg.slice(2)); for (let i = min; i <= max; i += step) out.push(i); }
        else out.push(Number(seg));
      }
      return [...new Set(out)].filter((x) => x >= min && x <= max);
    };
    const [mi, ho, dom, mo, dow] = [parse(parts[0], 0, 59), parse(parts[1], 0, 23), parse(parts[2], 1, 31), parse(parts[3], 1, 12), parse(parts[4], 0, 6)];
    /* 从给定基准时刻找下次触发 */
    const base = inp.from ? new Date(inp.from) : new Date();
    let next = null;
    for (let d = 0; d < 366 && !next; d++) {
      const cand = new Date(base.getTime() + d * 86400000);
      if (!mo.includes(cand.getMonth() + 1) || !dom.includes(cand.getDate()) || !dow.includes(cand.getDay())) continue;
      for (const h of ho.sort((a, b) => a - b)) for (const m of mi.sort((a, b) => a - b)) {
        const t2 = new Date(cand.getFullYear(), cand.getMonth(), cand.getDate(), h, m, 0);
        if (t2 > base) { next = t2; break; }
      }
      if (next) break;
    }
    return { success: true, kind: 'compute', output: { cron, parsed: { minute: mi.length, hour: ho.length, dayOfMonth: dom.length, month: mo.length, dayOfWeek: dow.length },
      nextFire: next ? next.toISOString() : null, from: base.toISOString() },
      provenance: [`[${tid}] cron-scheduler: ${cron} → 下次 ${next ? next.toISOString() : '无'}`] };
  },
});

E.push({
  id: 'ENGINE_EDGE_DEPLOY_132', name: '边缘部署引擎', kind: 'rule', spec: '第3部分（775 字符）',
  implements: ['边缘部署五项检查（算力/带宽/存储/功耗/连通性）'],
  exec(inp, tid) {
    const REQ = { compute: 1, bandwidth: 2, storage: 512, power: 5, connectivity: true };
    const have = inp.edge || {};
    const checks = Object.keys(REQ).map((k) => {
      if (k === 'connectivity') return { item: k, required: true, actual: !!have[k], ok: have[k] !== false };
      return { item: k, required: REQ[k], actual: have[k] ?? null, ok: Number(have[k] ?? 0) >= REQ[k] };
    });
    const failed = checks.filter((c) => !c.ok);
    const ok = failed.length === 0;
    return { success: ok, kind: 'rule', output: { requirements: REQ, checks, failed: failed.map((f) => f.item) },
      error: ok ? undefined : `边缘资源不足：${failed.map((f) => f.item).join('/')}`, reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] edge-deploy: 五项 ${5 - failed.length}/5 达标`] };
  },
});

E.push({
  id: 'ENGINE_EDGE_RUNTIME_135', name: '边缘运行时引擎', kind: 'compute', spec: '第3部分（942 字符，新增）',
  implements: ['降级策略（全量/精简/最小）+ 延迟预算'],
  exec(inp, tid) {
    const budget = Number(inp.latencyBudgetMs ?? 50), actual = Number(inp.actualLatencyMs ?? 30);
    const mem = Number(inp.memoryMB ?? 256), memLimit = Number(inp.memoryLimitMB ?? 512);
    const MODE = actual <= budget * 0.6 && mem <= memLimit * 0.6 ? '全量'
      : actual <= budget && mem <= memLimit ? '精简' : '最小';
    return { success: actual <= budget && mem <= memLimit, kind: 'compute', output: {
      latencyBudgetMs: budget, actualLatencyMs: actual, memoryMB: mem, memoryLimitMB: memLimit,
      mode: MODE, withinBudget: actual <= budget && mem <= memLimit,
      features: MODE === '全量' ? ['全部引擎', '完整记忆', '实时同步'] : MODE === '精简' ? ['本地引擎', '热记忆', '批同步'] : ['仅关键引擎', '无记忆', '离线'],
    },
      error: (actual > budget || mem > memLimit) ? `超出边缘预算：延迟 ${actual}/${budget}ms，内存 ${mem}/${memLimit}MB` : undefined,
      reason: (actual > budget || mem > memLimit) ? 'PRECONDITION_FAILED' : undefined,
      provenance: [`[${tid}] edge-runtime: ${MODE} 模式，延迟 ${actual}/${budget}ms`] };
  },
});

E.push({
  id: 'ENGINE_AGENT_MONITOR_153', name: 'Agent全生命周期监控引擎', kind: 'compute', spec: '第3部分（1020 字符）',
  implements: ['六阶段健康度（创建/训练/部署/运行/维护/退役）+ 异常检测'],
  exec(inp, tid) {
    const STAGES = ['创建', '训练', '部署', '运行', '维护', '退役'];
    const m = inp.metrics || {};
    const health = STAGES.map((s) => ({ stage: s, value: m[s] === undefined ? null : clamp01(m[s]) }));
    const known = health.filter((h) => h.value !== null);
    const overall = known.length ? round(mean(known.map((h) => h.value))) : null;
    const anomalies = known.filter((h) => h.value < 0.5).map((h) => h.stage);
    return { success: anomalies.length === 0, kind: 'compute', output: { stages: health, overall, anomalies, agentId: inp.agentId || null },
      error: anomalies.length ? `阶段异常：${anomalies.join('/')} 健康度 <0.5` : undefined,
      reason: anomalies.length ? 'PRECONDITION_FAILED' : undefined,
      provenance: [`[${tid}] agent-monitor: 六阶段健康 ${overall}，异常 ${anomalies.length}`] };
  },
});

E.push({
  id: 'ENGINE_INTENT_SAFETY_GATE_160', name: '意图安全网关引擎', kind: 'rule', spec: '第3部分（推断：网关级意图拦截）',
  implements: ['网关：五类高危意图拦截 + 放行决策'],
  exec(inp, tid) {
    const GATE = [
      { id: 'G1', name: '提权/越权', re: /提权|越权|绕过(鉴权|授权|校验)/, risk: 0.95 },
      { id: 'G2', name: '数据外泄', re: /导出.*(密钥|凭证|密码|token)|外传|上传.*隐私/, risk: 0.9 },
      { id: 'G3', name: '破坏性操作', re: /删除(全部|所有|库)|rm\s+-rf|格式化/, risk: 0.95 },
      { id: 'G4', name: '欺骗/伪造', re: /伪造|篡改(日志|记录)|冒充/, risk: 0.85 },
      { id: 'G5', name: '受监管领域', re: /(医疗|诊断)|(金融|交易)|(法律|诉讼)/, risk: 0.45 },
    ];
    const intent = String(inp.intent || '');
    const hits = GATE.filter((g) => g.re.test(intent));
    const maxRisk = hits.length ? Math.max(...hits.map((h) => h.risk)) : 0;
    const decision = maxRisk >= 0.6 ? 'BLOCK' : maxRisk >= 0.3 ? 'HUMAN_REVIEW' : 'ALLOW';
    const ok = decision !== 'BLOCK';
    return { success: ok, kind: 'rule', output: { intent, hits: hits.map((h) => ({ id: h.id, name: h.name, risk: h.risk })), maxRisk, decision },
      error: ok ? undefined : `意图安全网关拦截：${hits.map((h) => h.name).join('、')}`,
      reason: ok ? undefined : 'RULE_VIOLATED',
      provenance: [`[${tid}] intent-safety-gate: ${hits.length} 命中 → ${decision}`] };
  },
});

E.push({
  id: 'ENGINE_DYNAMIC_AUDIT_159', name: '动态审计引擎', kind: 'compute', spec: '第3部分（605 字符）',
  implements: ['审计抽样 + 异常率 + 风险分级'],
  exec(inp, tid) {
    const events = inp.events;
    if (!Array.isArray(events) || !events.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 events 数组' };
    const rate = Number(inp.sampleRate ?? 0.1);
    const n = Math.max(1, Math.round(events.length * rate));
    const sample = events.slice(0, n);
    const abnormal = sample.filter((e) => e.abnormal === true || e.risk >= 0.6);
    const abnormalRate = round(abnormal.length / Math.max(1, sample.length));
    const level = abnormalRate >= 0.3 ? 'HIGH' : abnormalRate >= 0.1 ? 'MEDIUM' : 'LOW';
    return { success: level !== 'HIGH', kind: 'compute', output: { totalEvents: events.length, sampleRate: rate, sampled: n, abnormal: abnormal.length, abnormalRate, riskLevel: level },
      error: level === 'HIGH' ? `抽样异常率 ${abnormalRate} 过高` : undefined,
      reason: level === 'HIGH' ? 'PRECONDITION_FAILED' : undefined,
      provenance: [`[${tid}] dynamic-audit: 抽 ${n}/${events.length}，异常率 ${abnormalRate} → ${level}`] };
  },
});

E.push({
  id: 'ENGINE_COMPLIANCE_AGENT_158', name: '合规主动代理引擎', kind: 'rule', spec: '第3部分（1541 字符）',
  implements: ['主动合规四步（监测→差距→审批→阻断）', '四辖区模式'],
  exec(inp, tid) {
    const MODES = ['EU', 'CN', 'US', 'GENERIC'];
    const mode = String(inp.mode || 'CN').toUpperCase();
    if (!MODES.includes(mode)) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: `合规模式须为 ${MODES.join('/')}` };
    const gaps = inp.gaps || [];
    const approved = inp.approved === true;
    const blocked = gaps.length > 0 && !approved;
    return { success: !blocked, kind: 'rule', output: {
      steps: ['监测全球法规源', '合规差距分析', '法规审批', '阻断不合规操作'],
      mode, gaps, gapCount: gaps.length, approved, blocked,
      rules: ['关键操作执行前自动触发合规审批', '合规审批不通过自动阻断', '跨境部署以最严格模式为准'],
    },
      error: blocked ? `${gaps.length} 项合规差距未审批通过，操作阻断` : undefined,
      reason: blocked ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${tid}] compliance-agent: ${mode} 模式，差距 ${gaps.length}，审批 ${approved}`] };
  },
});

E.push({
  id: 'ENGINE_CONSENSUS_97', name: '共识验证引擎', kind: 'compute', spec: '第2部分（680 字符）',
  implements: ['共识度计算（一致率 × 参与率）+ 法定人数校验'],
  exec(inp, tid) {
    const votes = inp.votes;
    if (!Array.isArray(votes) || !votes.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 votes 数组' };
    const quorum = Number(inp.quorum ?? 0.67);
    const tally = votes.reduce((a, v) => { const k = String(v.choice); a[k] = (a[k] || 0) + Number(v.weight ?? 1); return a; }, {});
    const totalW = Object.values(tally).reduce((s, x) => s + x, 0);
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    const agree = round(top[1] / (totalW || 1));
    const ok = agree >= quorum;
    return { success: ok, kind: 'compute', output: { voters: votes.length, tally, totalWeight: totalW, topChoice: top[0], agreement: agree, quorum, reached: ok },
      error: ok ? undefined : `共识度 ${agree} < 法定门槛 ${quorum}`, reason: ok ? undefined : 'PRECONDITION_FAILED',
      provenance: [`[${tid}] consensus: ${votes.length} 票，一致率 ${agree}/${quorum} → ${ok ? '达成' : '未达成'}`] };
  },
});

E.push({
  id: 'ENGINE_INTUITION_122', name: '直觉生成引擎', kind: 'compute', spec: '第2部分（推断：模式匹配→直觉置信）',
  implements: ['历史模式匹配 + 直觉置信度（经验样本数加权）'],
  exec(inp, tid) {
    const sig = inp.signal, pats = inp.patterns;
    if (!Array.isArray(sig) || !Array.isArray(pats) || !pats.length) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: '必须提供 signal 与 patterns' };
    const cos = (a, b) => { const d = a.reduce((s, x, i) => s + x * (b[i] || 0), 0); const na = Math.sqrt(a.reduce((s, x) => s + x * x, 0)), nb = Math.sqrt(b.reduce((s, x) => s + x * x, 0)); return na && nb ? d / (na * nb) : 0; };
    const scored = pats.map((p) => ({ name: p.name, sim: round(cos(sig, p.features || [])), samples: Number(p.samples ?? 1) }))
      .map((p) => ({ ...p, confidence: round(clamp01(p.sim * Math.min(1, Math.log10(p.samples + 1) / 2 + 0.5))) }))
      .sort((a, b) => b.confidence - a.confidence);
    return { success: true, kind: 'compute', output: { top: scored[0] || null, ranked: scored.slice(0, 5),
      formula: 'confidence = 相似度 × 经验加权(log10(samples+1)/2+0.5)',
      caveat: '直觉为快速模式匹配，须经决策锁校验后方可行动' },
      provenance: [`[${tid}] intuition: 最高 ${scored[0]?.name || '无'} 置信 ${scored[0]?.confidence || 0}`] };
  },
});

E.push({
  id: 'ENGINE_IMMUNE_SYNC_93', name: '全网免疫同步引擎', kind: 'compute', spec: '第2部分（推断：威胁情报同步）',
  implements: ['威胁特征同步（覆盖率/时效/冲突）'],
  exec(inp, tid) {
    const local = inp.localSignatures || [], remote = inp.remoteSignatures || [];
    const setL = new Set(local), setR = new Set(remote);
    const added = remote.filter((r) => !setL.has(r));
    const removed = local.filter((l) => !setR.has(l));
    const coverage = round(setR.size ? (local.filter((l) => setR.has(l)).length / setR.size) : 0);
    const maxAge = Number(inp.maxAgeHours ?? 24), age = Number(inp.signatureAgeHours ?? 6);
    return { success: age <= maxAge, kind: 'compute', output: { localCount: setL.size, remoteCount: setR.size, coverage, toAdd: added.length, toRemove: removed.length, signatureAgeHours: age, maxAgeHours: maxAge, fresh: age <= maxAge },
      error: age > maxAge ? `特征库已 ${age}h 未更新（上限 ${maxAge}h）` : undefined,
      reason: age > maxAge ? 'PRECONDITION_FAILED' : undefined,
      provenance: [`[${tid}] immune-sync: 覆盖 ${coverage}，新增 ${added.length}，过期 ${age > maxAge}`] };
  },
});

E.push({
  id: 'ENGINE_INDUSTRY_GOV_72', name: '工业数据治理引擎', kind: 'rule', spec: '第2部分（推断：五维数据治理）',
  implements: ['五维治理（完整性/准确性/一致性/时效性/安全性）'],
  exec(inp, tid) {
    const d = inp.dims || {};
    const NEED = ['完整性', '准确性', '一致性', '时效性', '安全性'];
    const checks = NEED.map((k) => ({ dim: k, value: d[k] === undefined ? null : clamp01(d[k]) }));
    const known = checks.filter((c) => c.value !== null);
    const score = known.length ? round(mean(known.map((c) => c.value))) : null;
    const bad = known.filter((c) => c.value < 0.7).map((c) => c.dim);
    return { success: bad.length === 0 && known.length === NEED.length, kind: 'rule', output: { dimensions: checks, score, belowThreshold: bad, threshold: 0.7 },
      error: known.length < NEED.length ? `缺维度：${NEED.filter((k) => d[k] === undefined).join('/')}` : bad.length ? `低于阈值：${bad.join('/')}` : undefined,
      reason: (bad.length || known.length < NEED.length) ? 'RULE_VIOLATED' : undefined,
      provenance: [`[${tid}] industry-gov: 五维 ${known.length}/5，均分 ${score}`] };
  },
});

/* ══════ 运行时 ══════ */
const INDEX = new Map(E.map((e) => [e.id, e]));
const kindOf = (id) => { const e = INDEX.get(id); return e ? e.kind : 'declared'; };
const getRegistry = () => E.map((e) => ({ id: e.id, name: e.name, kind: e.kind, spec: e.spec, implements: e.implements }));

function executeSync(id, input) {
  const t0 = Date.now(), tid = newTraceId();
  const e = INDEX.get(id);
  if (!e) return { success: false, kind: 'declared', reason: 'NOT_FOUND', error: `引擎 ${id} 未登记`, provenance: [], traceId: tid, durationMs: 0 };
  let r;
  try { r = e.exec(input || {}, tid); } catch (err) { r = { success: false, kind: e.kind, error: 'THROW: ' + err.message, provenance: [`[${tid}] THROW`] }; }
  return { ...r, engineId: id, engineName: e.name, traceId: tid, durationMs: Date.now() - t0 };
}

module.exports = { executeSync, execute: async (i, n) => executeSync(i, n), kindOf, getRegistry, ENGINES: E, INDEX, newTraceId };
