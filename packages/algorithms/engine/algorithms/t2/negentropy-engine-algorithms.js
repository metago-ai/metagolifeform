"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 负熵引擎封装类（ALG_T2_N_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 181~200 项（负熵引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 negentropy 模块的私有辅助方法
 *   - 处理熵计算、熵趋势、负熵贡献、系统有序度
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shannonEntropy = shannonEntropy;
exports.negentropyCalculate = negentropyCalculate;
exports.entropyDeltaCalculate = entropyDeltaCalculate;
exports.systemOrderAssess = systemOrderAssess;
exports.negentropyContributionAssess = negentropyContributionAssess;
exports.entropyIncreaseDetect = entropyIncreaseDetect;
exports.thermodynamicEntropyApprox = thermodynamicEntropyApprox;
exports.informationEntropyFlow = informationEntropyFlow;
exports.entropyThresholdAlert = entropyThresholdAlert;
exports.systemComplexityAssess = systemComplexityAssess;
exports.negentropyInjectStrategy = negentropyInjectStrategy;
exports.entropyBalance = entropyBalance;
exports.entropySourceAnalyze = entropySourceAnalyze;
exports.entropySteadyStateDetect = entropySteadyStateDetect;
exports.entropyPredict = entropyPredict;
exports.entropyAudit = entropyAudit;
exports.negentropyLedgerRecord = negentropyLedgerRecord;
exports.entropyOptimizationSuggest = entropyOptimizationSuggest;
exports.entropyReportGenerate = entropyReportGenerate;
exports.negentropyComprehensiveAssessment = negentropyComprehensiveAssessment;
// ============================================================================
// ALG_T2_N_001 · 香农熵计算
// ============================================================================
function shannonEntropy(values) {
    if (values.length === 0) {
        return { entropy: 0, maxEntropy: 0, normalized: 0, provenance: ['[ALG_T2_N_001] 空输入'] };
    }
    const sum = values.reduce((s, x) => s + x, 0);
    if (sum === 0) {
        return { entropy: 0, maxEntropy: 0, normalized: 0, provenance: ['[ALG_T2_N_001] 总和为零'] };
    }
    let entropy = 0;
    for (const v of values) {
        if (v > 0) {
            const p = v / sum;
            entropy -= p * Math.log2(p);
        }
    }
    const maxEntropy = Math.log2(values.length);
    const normalized = maxEntropy === 0 ? 0 : entropy / maxEntropy;
    return {
        entropy,
        maxEntropy,
        normalized,
        provenance: [`[ALG_T2_N_001] H=${entropy.toFixed(4)} max=${maxEntropy.toFixed(4)} norm=${normalized.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_N_002 · 负熵计算
// ============================================================================
function negentropyCalculate(observedEntropy, maxEntropy) {
    if (maxEntropy <= 0) {
        return { negentropy: 0, normalized: 0, interpretation: 'invalid', provenance: ['[ALG_T2_N_002] 最大熵为零'] };
    }
    const negentropy = maxEntropy - observedEntropy;
    const normalized = negentropy / maxEntropy;
    let interpretation;
    if (normalized > 0.7)
        interpretation = 'highly_ordered';
    else if (normalized > 0.4)
        interpretation = 'moderately_ordered';
    else if (normalized > 0.1)
        interpretation = 'slightly_ordered';
    else
        interpretation = 'chaotic';
    return {
        negentropy,
        normalized,
        interpretation,
        provenance: [`[ALG_T2_N_002] neg=${negentropy.toFixed(4)} norm=${normalized.toFixed(4)} interp=${interpretation}`],
    };
}
// ============================================================================
// ALG_T2_N_003 · 熵变计算
// ============================================================================
function entropyDeltaCalculate(before, after) {
    const delta = after.entropy - before.entropy;
    const timeDiff = after.timestamp - before.timestamp;
    const rate = timeDiff === 0 ? 0 : delta / timeDiff;
    const direction = delta > 0.01 ? 'increasing' : delta < -0.01 ? 'decreasing' : 'stable';
    return {
        delta,
        rate,
        direction,
        provenance: [`[ALG_T2_N_003] delta=${delta.toFixed(4)} rate=${rate.toFixed(6)} dir=${direction}`],
    };
}
// ============================================================================
// ALG_T2_N_004 · 系统有序度评估
// ============================================================================
function systemOrderAssess(measurements) {
    if (measurements.length === 0) {
        return { avgOrder: 0, trend: 'unknown', consistency: 0, provenance: ['[ALG_T2_N_004] 空测量'] };
    }
    const orders = measurements.map(m => m.negentropy);
    const avgOrder = orders.reduce((s, x) => s + x, 0) / orders.length;
    const mean = avgOrder;
    const variance = orders.reduce((s, x) => s + (x - mean) ** 2, 0) / orders.length;
    const consistency = 1 - Math.sqrt(variance);
    // 趋势
    const mid = Math.floor(orders.length / 2);
    const firstHalf = orders.slice(0, mid);
    const secondHalf = orders.slice(mid);
    const firstAvg = firstHalf.reduce((s, x) => s + x, 0) / Math.max(firstHalf.length, 1);
    const secondAvg = secondHalf.reduce((s, x) => s + x, 0) / Math.max(secondHalf.length, 1);
    const trend = secondAvg > firstAvg * 1.1 ? 'improving' : secondAvg < firstAvg * 0.9 ? 'declining' : 'stable';
    return {
        avgOrder,
        trend,
        consistency,
        provenance: [`[ALG_T2_N_004] avg=${avgOrder.toFixed(4)} trend=${trend} consistency=${consistency.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_N_005 · 负熵贡献评估
// ============================================================================
function negentropyContributionAssess(action) {
    const contribution = action.entropyBefore - action.entropyAfter;
    const efficiency = action.resourcesUsed === 0 ? 0 : contribution / action.resourcesUsed;
    const worthIt = contribution > 0 && efficiency > 0.01;
    return {
        contribution,
        efficiency,
        worthIt,
        provenance: [`[ALG_T2_N_005] contrib=${contribution.toFixed(4)} eff=${efficiency.toFixed(4)} worth=${worthIt}`],
    };
}
// ============================================================================
// ALG_T2_N_006 · 熵增检测
// ============================================================================
function entropyIncreaseDetect(measurements, threshold = 0.05) {
    if (measurements.length < 2) {
        return { increasing: false, rate: 0, projectedEntropy: 0, provenance: ['[ALG_T2_N_006] 数据不足'] };
    }
    const n = measurements.length;
    const times = measurements.map(m => m.timestamp);
    const entropies = measurements.map(m => m.entropy);
    const meanT = times.reduce((s, x) => s + x, 0) / n;
    const meanE = entropies.reduce((s, x) => s + x, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (times[i] - meanT) * (entropies[i] - meanE);
        den += (times[i] - meanT) ** 2;
    }
    const rate = den === 0 ? 0 : num / den;
    const increasing = rate > threshold;
    const lastTime = times[n - 1];
    const projectedEntropy = entropies[n - 1] + rate * 1000; // 投影 1 秒后
    return {
        increasing,
        rate,
        projectedEntropy,
        provenance: [`[ALG_T2_N_006] rate=${rate.toFixed(6)} increasing=${increasing} projected=${projectedEntropy.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_N_007 · 热力学熵近似
// ============================================================================
function thermodynamicEntropyApprox(states, temperature = 1) {
    if (states.length === 0) {
        return { entropy: 0, freeEnergy: 0, provenance: ['[ALG_T2_N_007] 空状态'] };
    }
    const totalProb = states.reduce((s, x) => s + x.probability, 0);
    if (totalProb === 0) {
        return { entropy: 0, freeEnergy: 0, provenance: ['[ALG_T2_N_007] 概率为零'] };
    }
    let entropy = 0;
    let avgEnergy = 0;
    for (const s of states) {
        const p = s.probability / totalProb;
        if (p > 0) {
            entropy -= p * Math.log(p);
            avgEnergy += p * s.energy;
        }
    }
    const freeEnergy = avgEnergy - temperature * entropy;
    return {
        entropy,
        freeEnergy,
        provenance: [`[ALG_T2_N_007] S=${entropy.toFixed(4)} E=${avgEnergy.toFixed(4)} F=${freeEnergy.toFixed(4)} T=${temperature}`],
    };
}
// ============================================================================
// ALG_T2_N_008 · 信息熵流
// ============================================================================
function informationEntropyFlow(sources, sinks) {
    const sourceTotal = sources.entropyRate;
    const sinkTotal = sinks.entropyRate;
    const netFlow = sourceTotal - sinkTotal;
    const balanced = Math.abs(netFlow) < 0.1 * Math.max(sourceTotal, sinkTotal);
    const bottleneck = sourceTotal > sinkTotal ? 'sink_capacity' : sourceTotal < sinkTotal ? 'source_capacity' : 'none';
    return {
        netFlow,
        balanced,
        bottleneck,
        provenance: [`[ALG_T2_N_008] src=${sourceTotal.toFixed(4)} sink=${sinkTotal.toFixed(4)} net=${netFlow.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_N_009 · 熵阈值告警
// ============================================================================
function entropyThresholdAlert(current, thresholds) {
    let level;
    let action;
    if (current >= thresholds.max) {
        level = 'max_exceeded';
        action = 'emergency_shutdown';
    }
    else if (current >= thresholds.critical) {
        level = 'critical';
        action = 'immediate_intervention';
    }
    else if (current >= thresholds.warning) {
        level = 'warning';
        action = 'increase_negentropy_input';
    }
    else {
        level = 'normal';
        action = 'continue_monitoring';
    }
    return {
        level,
        action,
        provenance: [`[ALG_T2_N_009] entropy=${current.toFixed(4)} level=${level} action=${action}`],
    };
}
// ============================================================================
// ALG_T2_N_010 · 系统复杂度评估
// ============================================================================
function systemComplexityAssess(components) {
    if (components.length === 0) {
        return { complexity: 0, coupling: 0, diversity: 0, provenance: ['[ALG_T2_N_010] 空组件'] };
    }
    const totalConnections = components.reduce((s, c) => s + c.connections, 0);
    const avgCoupling = totalConnections / components.length;
    const totalStates = components.reduce((s, c) => s + c.internalStates, 0);
    const avgStates = totalStates / components.length;
    const uniqueStates = new Set(components.map(c => c.internalStates)).size;
    const diversity = uniqueStates / components.length;
    const complexity = avgCoupling * Math.log2(avgStates + 1);
    return {
        complexity,
        coupling: avgCoupling,
        diversity,
        provenance: [`[ALG_T2_N_010] components=${components.length} complexity=${complexity.toFixed(4)} coupling=${avgCoupling.toFixed(4)} diversity=${diversity.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_N_011 · 负熵注入策略
// ============================================================================
function negentropyInjectStrategy(currentEntropy, targetEntropy, availableStrategies) {
    if (availableStrategies.length === 0) {
        return { recommended: 'none', estimatedTime: 0, estimatedCost: 0, provenance: ['[ALG_T2_N_011] 无策略'] };
    }
    const gap = currentEntropy - targetEntropy;
    if (gap <= 0) {
        return { recommended: 'maintain', estimatedTime: 0, estimatedCost: 0, provenance: [`[ALG_T2_N_011] 已达标`] };
    }
    // 按性价比选择
    const sorted = [...availableStrategies].sort((a, b) => (b.negentropyRate / b.cost) - (a.negentropyRate / a.cost));
    const best = sorted[0];
    const estimatedTime = gap / best.negentropyRate;
    const estimatedCost = estimatedTime * best.cost;
    return {
        recommended: best.name,
        estimatedTime,
        estimatedCost,
        provenance: [`[ALG_T2_N_011] gap=${gap.toFixed(4)} strat=${best.name} time=${estimatedTime.toFixed(2)} cost=${estimatedCost.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_N_012 · 熵平衡
// ============================================================================
function entropyBalance(systems) {
    if (systems.length === 0) {
        return { balanced: true, loadDistribution: [], overloaded: [], provenance: ['[ALG_T2_N_012] 空系统'] };
    }
    const loadDistribution = systems.map(s => ({
        name: s.name,
        load: s.capacity === 0 ? 1 : s.entropy / s.capacity,
    }));
    const overloaded = loadDistribution.filter(l => l.load > 1).map(l => l.name);
    const loads = loadDistribution.map(l => l.load);
    const mean = loads.reduce((s, x) => s + x, 0) / loads.length;
    const variance = loads.reduce((s, x) => s + (x - mean) ** 2, 0) / loads.length;
    const balanced = overloaded.length === 0 && Math.sqrt(variance) < 0.2;
    return {
        balanced,
        loadDistribution,
        overloaded,
        provenance: [`[ALG_T2_N_012] systems=${systems.length} balanced=${balanced} overloaded=${overloaded.length}`],
    };
}
// ============================================================================
// ALG_T2_N_013 · 熵来源分析
// ============================================================================
function entropySourceAnalyze(sources) {
    if (sources.length === 0) {
        return { internal: 0, external: 0, dominant: 'none', provenance: ['[ALG_T2_N_013] 无来源'] };
    }
    const internal = sources.filter(s => s.type === 'internal').reduce((s, x) => s + x.contribution, 0);
    const external = sources.filter(s => s.type === 'external').reduce((s, x) => s + x.contribution, 0);
    const dominant = internal > external ? 'internal' : 'external';
    return {
        internal,
        external,
        dominant,
        provenance: [`[ALG_T2_N_013] internal=${internal.toFixed(4)} external=${external.toFixed(4)} dom=${dominant}`],
    };
}
// ============================================================================
// ALG_T2_N_014 · 熵稳态检测
// ============================================================================
function entropySteadyStateDetect(measurements, tolerance = 0.02) {
    if (measurements.length < 3) {
        return { steady: false, stability: 0, oscillationRange: 0, provenance: ['[ALG_T2_N_014] 数据不足'] };
    }
    const entropies = measurements.map(m => m.entropy);
    const mean = entropies.reduce((s, x) => s + x, 0) / entropies.length;
    const variance = entropies.reduce((s, x) => s + (x - mean) ** 2, 0) / entropies.length;
    const std = Math.sqrt(variance);
    const stability = mean === 0 ? 0 : 1 - std / Math.abs(mean);
    const max = Math.max(...entropies);
    const min = Math.min(...entropies);
    const oscillationRange = max - min;
    const steady = std < tolerance && oscillationRange < tolerance * 2;
    return {
        steady,
        stability,
        oscillationRange,
        provenance: [`[ALG_T2_N_014] steady=${steady} stability=${stability.toFixed(4)} range=${oscillationRange.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_N_015 · 熵预测
// ============================================================================
function entropyPredict(history, horizon = 5) {
    const n = history.length;
    if (n < 3 || horizon <= 0) {
        return { forecast: [], confidence: 0, provenance: ['[ALG_T2_N_015] 数据不足'] };
    }
    const times = history.map(m => m.timestamp);
    const entropies = history.map(m => m.entropy);
    const meanT = times.reduce((s, x) => s + x, 0) / n;
    const meanE = entropies.reduce((s, x) => s + x, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (times[i] - meanT) * (entropies[i] - meanE);
        den += (times[i] - meanT) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanE - slope * meanT;
    const residuals = entropies.map((e, i) => e - (slope * times[i] + intercept));
    const residualVar = residuals.reduce((s, x) => s + x * x, 0) / n;
    const confidence = Math.max(0, 1 - residualVar);
    const lastTime = times[n - 1];
    const step = n > 1 ? times[n - 1] - times[n - 2] : 1;
    const forecast = [];
    for (let i = 1; i <= horizon; i++) {
        forecast.push({ time: lastTime + i * step, entropy: slope * (lastTime + i * step) + intercept });
    }
    return {
        forecast,
        confidence,
        provenance: [`[ALG_T2_N_015] horizon=${horizon} confidence=${confidence.toFixed(4)} slope=${slope.toFixed(6)}`],
    };
}
// ============================================================================
// ALG_T2_N_016 · 熵审计
// ============================================================================
function entropyAudit(events) {
    if (events.length === 0) {
        return { auditLog: [], totalDelta: 0, positiveCount: 0, negativeCount: 0, provenance: ['[ALG_T2_N_016] 空事件'] };
    }
    const auditLog = events.map(e => `[${new Date(e.timestamp).toISOString()}] ${e.source}: ΔS=${e.entropyDelta.toFixed(4)} (${e.reason})`);
    const totalDelta = events.reduce((s, e) => s + e.entropyDelta, 0);
    const positiveCount = events.filter(e => e.entropyDelta > 0).length;
    const negativeCount = events.filter(e => e.entropyDelta < 0).length;
    return {
        auditLog,
        totalDelta,
        positiveCount,
        negativeCount,
        provenance: [`[ALG_T2_N_016] events=${events.length} pos=${positiveCount} neg=${negativeCount} total=${totalDelta.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_N_017 · 负熵 ledger 记录
// ============================================================================
function negentropyLedgerRecord(ledger, newAction, negentropyDelta, now = Date.now()) {
    const cumulative = ledger.length > 0 ? ledger[ledger.length - 1].cumulative + negentropyDelta : negentropyDelta;
    const newEntry = {
        timestamp: now,
        action: newAction,
        negentropyDelta,
        cumulative,
    };
    return {
        updatedLedger: [...ledger, newEntry],
        newEntry,
        provenance: [`[ALG_T2_N_017] action=${newAction} delta=${negentropyDelta.toFixed(4)} cumulative=${cumulative.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_N_018 · 熵优化建议
// ============================================================================
function entropyOptimizationSuggest(current, target) {
    const suggestions = [];
    const entropyGap = current.entropy - target.entropy;
    if (entropyGap > 0) {
        // 按贡献度排序
        const sorted = [...current.sources].sort((a, b) => b.contribution - a.contribution);
        for (const src of sorted.slice(0, 3)) {
            const impact = src.contribution * 0.3;
            const priority = impact > entropyGap * 0.5 ? 'high' : impact > entropyGap * 0.2 ? 'medium' : 'low';
            suggestions.push({
                action: `reduce_${src.name}_contribution`,
                impact,
                priority,
            });
        }
    }
    const negentropyGap = target.negentropy - current.negentropy;
    if (negentropyGap > 0) {
        suggestions.push({
            action: 'inject_negentropy',
            impact: negentropyGap,
            priority: 'high',
        });
    }
    return {
        suggestions,
        provenance: [`[ALG_T2_N_018] suggestions=${suggestions.length} entropyGap=${entropyGap.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_N_019 · 熵报告生成
// ============================================================================
function entropyReportGenerate(measurements, sources) {
    if (measurements.length === 0) {
        return { report: 'no_data', summary: { avgEntropy: 0, avgNegentropy: 0, trend: 'unknown' }, provenance: ['[ALG_T2_N_019] 空数据'] };
    }
    const avgEntropy = measurements.reduce((s, m) => s + m.entropy, 0) / measurements.length;
    const avgNegentropy = measurements.reduce((s, m) => s + m.negentropy, 0) / measurements.length;
    const first = measurements[0];
    const last = measurements[measurements.length - 1];
    const trend = last.entropy > first.entropy ? 'increasing' : last.entropy < first.entropy ? 'decreasing' : 'stable';
    const lines = [
        '=== Entropy Report ===',
        `Measurements: ${measurements.length}`,
        `Average Entropy: ${avgEntropy.toFixed(4)}`,
        `Average Negentropy: ${avgNegentropy.toFixed(4)}`,
        `Trend: ${trend}`,
        `Sources:`,
    ];
    for (const s of sources) {
        lines.push(`  - ${s.name}: ${s.contribution.toFixed(4)}`);
    }
    return {
        report: lines.join('\n'),
        summary: { avgEntropy, avgNegentropy, trend },
        provenance: [`[ALG_T2_N_019] measurements=${measurements.length} avgE=${avgEntropy.toFixed(4)} avgN=${avgNegentropy.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_N_020 · 负熵综合评估
// ============================================================================
function negentropyComprehensiveAssessment(metrics) {
    const overall = metrics.avgNegentropy * 0.3 +
        Math.max(0, metrics.trend) * 0.2 +
        metrics.consistency * 0.2 +
        metrics.efficiency * 0.15 +
        metrics.contribution * 0.15;
    const grade = overall >= 0.85 ? 'A' : overall >= 0.7 ? 'B' : overall >= 0.5 ? 'C' : overall >= 0.3 ? 'D' : 'F';
    let status;
    if (overall >= 0.8)
        status = 'highly_ordered';
    else if (overall >= 0.5)
        status = 'moderately_ordered';
    else if (overall >= 0.3)
        status = 'slightly_chaotic';
    else
        status = 'chaotic';
    return {
        overall,
        grade,
        status,
        provenance: [`[ALG_T2_N_020] overall=${overall.toFixed(4)} grade=${grade} status=${status}`],
    };
}
