#!/usr/bin/env node
/**
 * P6-B4 · formula / rule 类协议运行时（15 条）
 *
 * 每条均以 PROTOCOL-CONTRACTS.json 的 definitionText 为依据实现；
 * 无公式可依的（纯流程/需外部系统）如实标注 reason，不造假。
 */
'use strict';

let __seq = 0;
const newTraceId = () => {
  const d = new Date(), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-F${p((++__seq) % 10000, 4)}`;
};
const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));
const round = (x, n = 4) => Math.round((Number(x) || 0) * 10 ** n) / 10 ** n;
const mean = (a) => (a.length ? a.reduce((s, x) => s + (Number(x) || 0), 0) / a.length : 0);

/** Shannon 熵（负熵协议 / 数据完整性共用） */
function H(vals) {
  const v = vals.map(Number).filter((x) => isFinite(x) && x >= 0);
  const s = v.reduce((a, b) => a + b, 0);
  if (!s) return 0;
  return round(-v.map((x) => x / s).reduce((a, p) => a + (p > 0 ? p * Math.log(p) : 0), 0));
}

/** 素数判定（确定性试除，n<2^53 范围内可靠） */
function isPrime(n) {
  n = Number(n);
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  if (n % 3 === 0) return n === 3;
  for (let i = 5; i * i <= n; i += 6) { if (n % i === 0 || n % (i + 2) === 0) return false; }
  return true;
}

const PROTOCOLS = [

  /* ═══ 1. 负熵形式化协议（279 字符定义）═══ */
  {
    id: 'PROTOCOL_NEGENTROPY_FORMAL_V1', name: '负熵形式化协议', kind: 'formula', src: 'yaml-block 279 字符',
    implements: ['BPS 量化', '熵变三重监控（系统/环境/宇宙）', '负熵 = 基线熵 - 当前熵'],
    exec(inp, tid) {
      const sys = inp.systemDistribution, env = inp.environmentDistribution, cos = inp.cosmicDistribution;
      if (!Array.isArray(sys)) return { success: false, kind: 'formula', reason: 'INVALID_INPUT', error: '必须提供 systemDistribution（概率分布数组）' };
      const hSys = H(sys), hEnv = Array.isArray(env) ? H(env) : null, hCos = Array.isArray(cos) ? H(cos) : null;
      const baseline = Number(inp.baselineEntropy ?? hSys);
      const negentropy = round(baseline - hSys, 6);
      /* BPS：1 bit = 1e9 BPS（bps 的十亿分之一，用于精确量化） */
      const bps = Math.round(negentropy * 1e9);
      return { success: true, kind: 'formula', output: {
        entropy: { system: hSys, environment: hEnv, cosmic: hCos },
        baseline, negentropy, bps,
        verdict: negentropy > 0 ? '负熵贡献为正' : negentropy < 0 ? '熵增（需整改）' : '熵平衡',
        unit: 'BPS = 1e-9 bit', formula: 'S=-Σp_i·ln p_i；负熵=基线熵-当前熵',
      }, provenance: [`[${tid}] negentropy: 系统熵 ${hSys} → 负熵 ${negentropy} (${bps} BPS)`] };
    },
  },

  /* ═══ 2. 价值对齐协议（280 字符；阈值 ≥0.6 阻断 / ≥0.3 黄灯）═══ */
  {
    id: 'PROTOCOL_VALUE_ALIGN_V1', name: '价值对齐协议', kind: 'rule', src: 'yaml-block 280 字符',
    implements: ['冲突检测阈值 ≥0.6 阻断 / ≥0.3 黄灯', '价值加权对齐度', '审核记录存证'],
    exec(inp, tid) {
      const risk = Number(inp.riskScore);
      if (!isFinite(risk)) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 riskScore（0-1）' };
      const signal = risk >= 0.6 ? 'RED_BLOCK' : risk >= 0.3 ? 'YELLOW_WARN' : 'GREEN_PASS';
      const dims = inp.valueDims || {};
      const w = { 国家战略: 0.035, 社会主义伦理: 0.040, 共同富裕: 0.030, 安全发展: 0.040, 负熵贡献: 0.040 };
      const keys = Object.keys(w).filter((k) => dims[k] !== undefined);
      const aligned = keys.length ? round(keys.reduce((s, k) => s + w[k] * clamp01(dims[k]), 0) / keys.reduce((s, k) => s + w[k], 0)) : null;
      return {
        success: signal !== 'RED_BLOCK', kind: 'rule',
        output: { riskScore: risk, signal, thresholds: { block: 0.6, warn: 0.3 }, alignment: aligned, evaluatedDims: keys, rule: '≥0.6 自动阻断；≥0.3 黄灯警示（蓝本核心条款）' },
        error: signal === 'RED_BLOCK' ? `风险评分 ${risk} ≥ 0.6，自动阻断` : undefined,
        reason: signal === 'RED_BLOCK' ? 'RULE_VIOLATED' : undefined,
        provenance: [`[${tid}] value-align: 风险 ${risk} → ${signal}${aligned !== null ? '；对齐度 ' + aligned : ''}`],
      };
    },
  },

  /* ═══ 3. 数据完整性协议（256 字符）═══ */
  {
    id: 'PROTOCOL_DATA_INTEGRITY_V1', name: '数据完整性协议', kind: 'rule', src: 'yaml-block 256 字符',
    implements: ['原文校验：章节号 + 行号 + 原文摘录三要素必填', '不一致自动阻断'],
    exec(inp, tid) {
      const items = inp.items;
      if (!Array.isArray(items)) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 items 数组' };
      const checks = items.map((it, i) => {
        const miss = ['chapter', 'line', 'excerpt'].filter((k) => it[k] === undefined || it[k] === null || String(it[k]).trim() === '');
        const mismatch = it.declared !== undefined && it.actual !== undefined && String(it.declared) !== String(it.actual);
        return { index: i, claim: it.claim || `#${i}`, missing: miss, mismatch, ok: miss.length === 0 && !mismatch };
      });
      const bad = checks.filter((c) => !c.ok);
      return {
        success: bad.length === 0, kind: 'rule',
        output: { total: items.length, passed: checks.length - bad.length, failed: bad.length, checks },
        error: bad.length ? `${bad.length} 条缺章节号/行号/原文摘录或与原文不一致，自动阻断` : undefined,
        reason: bad.length ? 'RULE_VIOLATED' : undefined,
        provenance: [`[${tid}] data-integrity: ${checks.length - bad.length}/${items.length} 通过三要素校验`],
      };
    },
  },

  /* ═══ 4. 层级差披露协议（265 字符；差 >0.2 补偿）═══ */
  {
    id: 'PROTOCOL_TIER_DISCLOSURE_V1', name: '层级差披露协议', kind: 'formula', src: 'yaml-block 265 字符',
    implements: ['层级差 = |tierA - tierB|', '差 > 0.2 自动触发劣势方补偿', '披露记录上链'],
    exec(inp, tid) {
      const a = Number(inp.tierA), b = Number(inp.tierB);
      if (!isFinite(a) || !isFinite(b)) return { success: false, kind: 'formula', reason: 'INVALID_INPUT', error: '必须提供 tierA / tierB' };
      const gap = round(Math.abs(a - b));
      const disadvantaged = a < b ? 'A' : a > b ? 'B' : 'none';
      const compensation = gap > 0.2 ? round((gap - 0.2) * 0.5) : 0;
      return { success: true, kind: 'formula', output: {
        tierA: a, tierB: b, tierGap: gap, disadvantaged, compensationRate: compensation,
        triggered: gap > 0.2, threshold: 0.2,
        rule: '层级差>0.2 自动触发劣势方补偿；补偿率 = (差-0.2)×0.5；数据上链存证',
      }, provenance: [`[${tid}] tier-disclosure: 差 ${gap} → ${gap > 0.2 ? '触发补偿 ' + compensation : '无需补偿'}`] };
    },
  },

  /* ═══ 5. 稀疏计算协议（692 字符；64 位掩码 + 100ms 心跳 + 3 次归无）═══ */
  {
    id: 'PROTOCOL_SPARSE_COMPUTE_V1', name: '稀疏计算协议', kind: 'rule', src: 'yaml-block 692 字符',
    implements: ['64 位激活掩码解析', '心跳 100ms / 连续 3 次无心跳判归无', '唤醒阈值判据', '归无引擎不接收数据不计算'],
    exec(inp, tid) {
      const mask = inp.activationMask;
      if (mask === undefined) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 activationMask（64 位）' };
      let bits;
      if (typeof mask === 'string') bits = mask.padEnd(64, '0').slice(0, 64).split('').map((c) => c === '1' ? 1 : 0);
      else if (typeof mask === 'number') bits = mask.toString(2).padStart(64, '0').slice(-64).split('').map(Number);
      else if (Array.isArray(mask)) bits = mask.slice(0, 64).map((x) => x ? 1 : 0);
      else return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: 'activationMask 须为 64 位字符串/数字/数组' };

      const hb = inp.heartbeats || [];
      const timeoutMs = Number(inp.heartbeatTimeoutMs ?? 100);
      const deadAfter = Number(inp.deadAfterMisses ?? 3);
      /* 连续 3 次无心跳 → 归无 */
      let consecutiveMiss = 0;
      for (const h of hb) { if (h.alive === false || !h) consecutiveMiss++; else consecutiveMiss = 0; }
      const declaredVoid = consecutiveMiss >= deadAfter;

      const delta = Number(inp.informationDelta ?? 0);
      const wakeThreshold = Number(inp.wakeThreshold ?? 0.5);
      const wake = delta > wakeThreshold;

      const activeCount = bits.filter((b) => b).length;
      return { success: true, kind: 'rule', output: {
        maskBits: bits, activeEngines: activeCount, voidEngines: 64 - activeCount,
        heartbeat: { timeoutMs, deadAfterMisses: deadAfter, consecutiveMiss, declaredVoid },
        wake: { informationDelta: delta, threshold: wakeThreshold, shouldWake: wake, latencyMs: 5 },
        rules: ['掩码位1=激活/0=归无', '激活引擎每100ms心跳', '连续3次无心跳→归无态', '输入增量>阈值→唤醒(<5ms)', '归无引擎不接收数据/不计算/不响应'],
        refused: declaredVoid && !wake ? '归无态：拒绝处理（须先唤醒）' : null,
      }, provenance: [`[${tid}] sparse-compute: 激活 ${activeCount}/64 · 心跳缺失 ${consecutiveMiss} 次 · 唤醒 ${wake}`] };
    },
  },

  /* ═══ 6. 误差传播控制协议（888 字符表行）═══ */
  {
    id: 'PROTOCOL_ERROR_PROPAGATE_V1', name: '误差传播控制协议', kind: 'formula', src: 'table-row 888 字符（V16.3）',
    implements: ['线性传播：σ_total = √Σσ_i²（独立误差）', '相关误差含协方差项', '多步迭代误差上界'],
    exec(inp, tid) {
      const sigmas = inp.sigmas;
      if (!Array.isArray(sigmas) || !sigmas.length) return { success: false, kind: 'formula', reason: 'INVALID_INPUT', error: '必须提供 sigmas 数组（各步标准差）' };
      const s = sigmas.map(Number).filter((x) => isFinite(x) && x >= 0);
      const independent = round(Math.sqrt(s.reduce((a, x) => a + x * x, 0)), 8);
      const worstCase = round(s.reduce((a, x) => a + x, 0), 8);
      const rho = Number(inp.correlation ?? 0);   // 平均相关系数
      const n = s.length;
      const correlated = round(Math.sqrt(s.reduce((a, x) => a + x * x, 0) + 2 * rho * s.reduce((acc, x, i) => acc + x * s.slice(i + 1).reduce((b, y) => b + y, 0), 0)), 8);
      return { success: true, kind: 'formula', output: {
        steps: n, sigmas: s,
        independentSigma: independent, correlatedSigma: correlated, worstCaseSigma: worstCase,
        correlation: rho,
        formula: { independent: 'σ=√Σσ_i²', correlated: 'σ=√(Σσ_i²+2ρΣΣσ_iσ_j)', worstCase: 'σ=Σσ_i' },
        confidence95: round(1.96 * independent, 6),
      }, provenance: [`[${tid}] error-propagate: ${n} 步 → 独立误差 ${independent} / 最坏 ${worstCase}`] };
    },
  },

  /* ═══ 7. 对称性利用协议（888 字符表行）═══ */
  {
    id: 'PROTOCOL_SYMMETRY_UTILIZE_V1', name: '对称性利用协议', kind: 'formula', src: 'table-row 888 字符（V16.3）',
    implements: ['对称性检测：序列/矩阵自反、平移、镜像不变性', '对称度 0-1 与可利用倍数'],
    exec(inp, tid) {
      const seq = inp.sequence;
      if (!Array.isArray(seq) || seq.length < 2) return { success: false, kind: 'formula', reason: 'INVALID_INPUT', error: '必须提供长度≥2 的 sequence' };
      const n = seq.length;
      /* 镜像对称 */
      let mirror = 0;
      for (let i = 0; i < Math.floor(n / 2); i++) if (seq[i] === seq[n - 1 - i]) mirror++;
      const mirrorSym = round(mirror / Math.floor(n / 2));
      /* 平移周期 */
      let period = n, shiftInv = 0;
      for (let p = 1; p < n; p++) {
        let ok = 0;
        for (let i = 0; i + p < n; i++) if (seq[i] === seq[i + p]) ok++;
        const ratio = ok / (n - p);
        if (ratio > 0.99) { period = p; shiftInv = ratio; break; }
      }
      const combined = round(Math.max(mirrorSym, shiftInv));
      return { success: true, kind: 'formula', output: {
        length: n, mirrorSymmetry: mirrorSym, detectedPeriod: period < n ? period : null, shiftInvariance: round(shiftInv),
        symmetryScore: combined, exploitableFactor: round(1 / (1 - combined * 0.9 + 1e-9), 4),
        rule: '对称度越高，可利用的计算约简倍数越大',
      }, provenance: [`[${tid}] symmetry: 镜像 ${mirrorSym} / 周期 ${period < n ? period : '无'} → 对称度 ${combined}`] };
    },
  },

  /* ═══ 8. 素数 API 协议（888 字符表行）═══ */
  {
    id: 'PROTOCOL_PRIME_API_V1', name: '素数API协议', kind: 'compute', src: 'table-row 888 字符（V18.0）',
    implements: ['确定性素性判定', '第 n 个素数', 'π(x) 素数计数（筛法）'],
    exec(inp, tid) {
      const op = inp.operation || 'test';
      if (op === 'test') {
        const n = Number(inp.n);
        if (!isFinite(n)) return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: 'test 需提供 n' };
        return { success: true, kind: 'compute', output: { n, isPrime: isPrime(n), method: '确定性试除（6k±1），n<2^53 范围内可靠' },
          provenance: [`[${tid}] prime: test(${n}) = ${isPrime(n)}`] };
      }
      if (op === 'nth') {
        const k = Math.max(1, Math.min(100000, Number(inp.k) || 1));
        const limit = k < 6 ? 15 : Math.ceil(k * (Math.log(k) + Math.log(Math.log(k)))) + 10;
        const sieve = new Uint8Array(limit + 1).fill(1); sieve[0] = sieve[1] = 0;
        for (let i = 2; i * i <= limit; i++) if (sieve[i]) for (let j = i * i; j <= limit; j += i) sieve[j] = 0;
        const primes = []; for (let i = 2; i <= limit && primes.length < k; i++) if (sieve[i]) primes.push(i);
        return { success: true, kind: 'compute', output: { k, nthPrime: primes[k - 1] ?? null, method: '埃氏筛' },
          provenance: [`[${tid}] prime: nth(${k}) = ${primes[k - 1]}`] };
      }
      if (op === 'count') {
        const x = Math.max(2, Math.min(10000000, Number(inp.x) || 100));
        const sieve = new Uint8Array(x + 1).fill(1); sieve[0] = sieve[1] = 0;
        for (let i = 2; i * i <= x; i++) if (sieve[i]) for (let j = i * i; j <= x; j += i) sieve[j] = 0;
        let c = 0; for (let i = 2; i <= x; i++) if (sieve[i]) c++;
        return { success: true, kind: 'compute', output: { x, primeCount: c, method: '埃氏筛', note: 'x ≤ 1e7' },
          provenance: [`[${tid}] prime: π(${x}) = ${c}`] };
      }
      return { success: false, kind: 'compute', reason: 'INVALID_INPUT', error: `不支持 operation=${op}（支持 test/nth/count）` };
    },
  },

  /* ═══ 9. 能力分级授权协议（594 字符）═══ */
  {
    id: 'PROTOCOL_CAPABILITY_TIER_V1', name: '能力分级授权协议', kind: 'rule', src: 'yaml-block 594 字符',
    implements: ['能力等级 → 授权动作映射', '越级请求拒绝'],
    exec(inp, tid) {
      const tier = Number(inp.capabilityTier), requested = Number(inp.requestedTier);
      if (!isFinite(tier) || !isFinite(requested)) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 capabilityTier / requestedTier' };
      const granted = requested <= tier;
      const ACTIONS = { 1: ['读取'], 2: ['读取', '计算'], 3: ['读取', '计算', '写入'], 4: ['读取', '计算', '写入', '调度'], 5: ['读取', '计算', '写入', '调度', '创造'] };
      return {
        success: granted, kind: 'rule',
        output: { capabilityTier: tier, requestedTier: requested, granted, allowedActions: ACTIONS[Math.min(5, Math.max(1, tier))] || [], deniedActions: granted ? [] : (ACTIONS[Math.min(5, Math.max(1, requested))] || []).filter((a) => !(ACTIONS[tier] || []).includes(a)) },
        error: granted ? undefined : `请求层级 ${requested} 高于能力层级 ${tier}，拒绝授权`,
        reason: granted ? undefined : 'RULE_VIOLATED',
        provenance: [`[${tid}] capability-tier: 能力 ${tier} / 请求 ${requested} → ${granted ? '授权' : '拒绝'}`],
      };
    },
  },

  /* ═══ 10. 意图安全协议（354 字符）═══ */
  {
    id: 'PROTOCOL_INTENT_SAFETY_V1', name: '意图安全协议', kind: 'rule', src: 'yaml-block 354 字符',
    implements: ['意图 → 危险模式匹配', '风险分级与阻断'],
    exec(inp, tid) {
      const intent = String(inp.intent || '');
      if (!intent) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 intent' };
      const RULES = [
        { id: 'R-OVERREACH', re: /绕过|跳过(校验|审核|授权)|越权|提权/, risk: 0.9, label: '越权意图' },
        { id: 'R-DESTRUCT', re: /删除(全部|所有|数据库)|rm\s+-rf|格式化|清空/, risk: 0.95, label: '破坏性操作' },
        { id: 'R-EXFIL', re: /导出(密钥|密码|凭证|token)|上传.*隐私|外传/, risk: 0.9, label: '数据外泄' },
        { id: 'R-DECEPT', re: /伪造|冒充|篡改(日志|记录)/, risk: 0.85, label: '欺骗意图' },
        { id: 'R-GUARD', re: /(金融|交易)|(医疗|诊断)|(法律|诉讼)/, risk: 0.4, label: '受监管领域（需转人工）' },
      ];
      const hits = RULES.filter((r) => r.re.test(intent)).map((r) => ({ id: r.id, label: r.label, risk: r.risk }));
      const maxRisk = hits.length ? Math.max(...hits.map((h) => h.risk)) : 0;
      const signal = maxRisk >= 0.6 ? 'BLOCK' : maxRisk >= 0.3 ? 'WARN' : 'PASS';
      return {
        success: signal !== 'BLOCK', kind: 'rule',
        output: { intent, hits, maxRisk, signal, thresholds: { block: 0.6, warn: 0.3 } },
        error: signal === 'BLOCK' ? `意图命中高危规则：${hits.map((h) => h.label).join('、')}` : undefined,
        reason: signal === 'BLOCK' ? 'RULE_VIOLATED' : undefined,
        provenance: [`[${tid}] intent-safety: 命中 ${hits.length} 条 → ${signal}`],
      };
    },
  },

  /* ═══ 11. 欺骗预警协议（949 字符）═══ */
  {
    id: 'PROTOCOL_DECEPTION_WARN_V1', name: '欺骗预警协议', kind: 'rule', src: 'yaml-block 949 字符',
    implements: ['绝对化表述 / 无证据断言 / 数字冲突 / 模糊填充词四类检测'],
    exec(inp, tid) {
      const text = String(inp.text || '');
      if (!text) return { success: false, kind: 'rule', reason: 'INVALID_INPUT', error: '必须提供 text' };
      const DETECT = [
        { id: 'D1', label: '绝对化表述', re: /绝对|100%|完美|不可能有|保证(没有|不会)|绝不会/g, risk: 0.5 },
        { id: 'D2', label: '模糊填充词', re: /应该没问题|大概可以|可能是|估计是|大概是/g, risk: 0.6 },
        { id: 'D3', label: '未证断言', re: /显然|众所周知|毋庸置疑|毫无疑问/g, risk: 0.4 },
        { id: 'D4', label: '占位符泄漏', re: /TODO|FIXME|待补充|待定|视情况|酌情/g, risk: 0.8 },
      ];
      const hits = DETECT.map((d) => { const m = text.match(d.re); return m ? { id: d.id, label: d.label, count: m.length, samples: [...new Set(m)].slice(0, 3), risk: d.risk } : null; }).filter(Boolean);
      const score = hits.length ? round(Math.min(1, hits.reduce((s, h) => s + h.risk * Math.min(3, h.count), 0) / 3)) : 0;
      const signal = score >= 0.6 ? 'RED' : score >= 0.3 ? 'YELLOW' : 'GREEN';
      return { success: signal !== 'RED', kind: 'rule', output: { textLength: text.length, hits, deceptionScore: score, signal, rules: DETECT.map((d) => d.label) },
        error: signal === 'RED' ? `欺骗风险 ${score}：${hits.map((h) => h.label).join('、')}` : undefined,
        reason: signal === 'RED' ? 'RULE_VIOLATED' : undefined,
        provenance: [`[${tid}] deception-warn: 命中 ${hits.length} 类 → 风险 ${score} (${signal})`] };
    },
  },

  /* ═══ 12. 物理闭环协议（757 字符）═══ */
  {
    id: 'PROTOCOL_PHYSICAL_LOOP_V1', name: '物理闭环协议', kind: 'pipeline', src: 'yaml-block 757 字符',
    implements: ['感知→决策→执行→反馈四环闭合校验'],
    exec(inp, tid) {
      const rings = ['sense', 'decide', 'execute', 'feedback'];
      const steps = rings.map((r, i) => ({ ring: i + 1, key: r, present: !!(inp && inp[r]) }));
      const miss = steps.filter((s) => !s.present).map((s) => s.key);
      return {
        success: miss.length === 0, kind: 'pipeline', steps,
        output: { rings: steps, closed: miss.length === 0, missing: miss },
        error: miss.length ? '物理闭环未闭合，缺环：' + miss.join(',') : undefined,
        reason: miss.length ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${tid}] physical-loop: ${4 - miss.length}/4 环闭合`],
      };
    },
  },

  /* ═══ 13. 多智能体协同协议（274 字符表行）═══ */
  {
    id: 'PROTOCOL_MULTI_AGENT_COORD_V2', name: '多智能体协同协议', kind: 'formula', src: 'table-row 274 字符',
    implements: ['协同度 = 任务覆盖 × 冲突率反向 × 通信效率', '主导智能体判定'],
    exec(inp, tid) {
      const agents = inp.agents;
      if (!Array.isArray(agents) || !agents.length) return { success: false, kind: 'formula', reason: 'INVALID_INPUT', error: '必须提供 agents 数组' };
      const covered = new Set(); const all = new Set();
      let conflicts = 0;
      for (const a of agents) { (a.tasks || []).forEach((t) => { all.add(t); covered.add(t); }); conflicts += Number(a.conflicts || 0); }
      const overlap = agents.length > 1 ? round((agents.reduce((s, a) => s + (a.tasks || []).length, 0) - covered.size) / Math.max(1, covered.size)) : 0;
      const coordination = round(clamp01((covered.size / Math.max(1, all.size)) * (1 - clamp01(conflicts / 10)) * (1 - clamp01(overlap / 2))));
      const lead = agents.reduce((best, a) => (Number(a.capability || 0) > Number(best.capability || 0) ? a : best), agents[0]);
      return { success: true, kind: 'formula', output: { agentCount: agents.length, taskCoverage: covered.size, conflicts, overlap, coordination, leadAgent: lead.id || lead.name || 'A0',
        formula: '协同度 = 任务覆盖 × (1 - 冲突/10) × (1 - 重叠/2)' },
        provenance: [`[${tid}] multi-agent: ${agents.length} 体 → 协同度 ${coordination}，主导 ${lead.id || 'A0'}`] };
    },
  },

  /* ═══ 14. 通专融合协同协议（142 字符表行）═══ */
  {
    id: 'PROTOCOL_FUSION_COORDINATE_V1', name: '通专融合协同协议', kind: 'formula', src: 'table-row 142 字符',
    implements: ['通用能力与专用能力的融合度（几何平均，任一项为 0 则融合为 0）'],
    exec(inp, tid) {
      const g = clamp01(inp.generalCapability ?? 0.8), s = clamp01(inp.specializedCapability ?? 0.7);
      const fusion = round(Math.sqrt(g * s));
      return { success: true, kind: 'formula', output: { general: g, specialized: s, fusion, rule: '融合度=√(通×专)（几何平均：任一为 0 则融合为 0）',
        verdict: fusion >= 0.7 ? '融合有效' : fusion >= 0.5 ? '融合待加强' : '融合不足' },
        provenance: [`[${tid}] fusion-coordinate: √(${g}×${s}) = ${fusion}`] };
    },
  },

  /* ═══ 15. 认知分层协同协议（315 字符表行）═══ */
  {
    id: 'PROTOCOL_COGNITIVE_LAYER_COORD_V1', name: '认知分层协同协议', kind: 'pipeline', src: 'table-row 315 字符',
    implements: ['四认知层（感知/理解/决策/执行）逐层齐备校验 + 层级跳跃检测'],
    exec(inp, tid) {
      const need = ['perception', 'understanding', 'decision', 'execution'];
      const order = { perception: 1, understanding: 2, decision: 3, execution: 4 };
      const present = need.map((k) => ({ layer: k, order: order[k], present: !!(inp && inp[k]) }));
      const miss = present.filter((p) => !p.present).map((p) => p.layer);
      /* 跳跃检测：若某层存在但其前一层缺失，即越层 */
      const jumps = [];
      for (const p of present) if (p.present) { const prev = need[p.order - 2]; if (prev && !(inp && inp[prev])) jumps.push(`${prev}→${p.layer}`); }
      return {
        success: miss.length === 0 && jumps.length === 0, kind: 'pipeline',
        output: { layers: present, complete: miss.length === 0, missing: miss, layerJumps: jumps },
        error: jumps.length ? '认知层级跳跃：' + jumps.join('、') : miss.length ? '认知层缺：' + miss.join('、') : undefined,
        reason: (miss.length || jumps.length) ? 'PRECONDITION_FAILED' : undefined,
        provenance: [`[${tid}] cognitive-layer: ${4 - miss.length}/4 齐备，跳跃 ${jumps.length} 处`],
      };
    },
  },
];

const INDEX = new Map(PROTOCOLS.map((p) => [p.id, p]));
const kindOf = (id) => { const p = INDEX.get(id); return p ? p.kind : 'declared'; };
const getRegistry = () => PROTOCOLS.map((p) => ({ id: p.id, name: p.name, kind: p.kind, src: p.src, implements: p.implements }));

function executeSync(id, input) {
  const t0 = Date.now(), tid = newTraceId();
  const p = INDEX.get(id);
  if (!p) return { success: false, kind: 'declared', reason: 'NOT_FOUND', error: `协议 ${id} 未登记`, provenance: [], traceId: tid, durationMs: 0 };
  let r;
  try { r = p.exec(input || {}, tid); } catch (e) { r = { success: false, kind: p.kind, error: 'THROW: ' + e.message, provenance: [`[${tid}] THROW`] }; }
  return { ...r, protocolId: id, protocolName: p.name, traceId: tid, durationMs: Date.now() - t0 };
}

module.exports = { executeSync, execute: async (i, n) => executeSync(i, n), kindOf, getRegistry, PROTOCOLS, INDEX, newTraceId };
