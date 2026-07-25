"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 偏差引擎封装类（ALG_T2_B_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 41~60 项（偏差引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 bias-engine 的私有辅助方法
 *   - 处理多源偏差聚合、偏差级联、修正策略
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiSourceBiasAggregate = multiSourceBiasAggregate;
exports.biasCascadeDetect = biasCascadeDetect;
exports.biasRootCause = biasRootCause;
exports.biasCorrectionStrategy = biasCorrectionStrategy;
exports.biasCorrelation = biasCorrelation;
exports.biasAccumulationMonitor = biasAccumulationMonitor;
exports.biasHeatmap = biasHeatmap;
exports.biasPropagationPath = biasPropagationPath;
exports.biasThresholdAdapt = biasThresholdAdapt;
exports.biasReportGenerate = biasReportGenerate;
exports.biasSelfHeal = biasSelfHeal;
exports.biasTraceChain = biasTraceChain;
exports.biasImpactScope = biasImpactScope;
exports.biasCompensator = biasCompensator;
exports.biasStatisticalTest = biasStatisticalTest;
exports.biasSeasonality = biasSeasonality;
exports.biasSpatialDistribution = biasSpatialDistribution;
exports.biasAlertLevel = biasAlertLevel;
exports.biasCausalInference = biasCausalInference;
exports.biasComprehensiveAssessment = biasComprehensiveAssessment;
// ============================================================================
// ALG_T2_B_001 · 多源偏差聚合
// ============================================================================
function multiSourceBiasAggregate(sources) {
    if (sources.length === 0) {
        return { aggregated: 0, dominant: '', consensus: 0, provenance: ['[ALG_T2_B_001] 无源'] };
    }
    let weighted = 0, totalConf = 0;
    for (const s of sources) {
        weighted += s.bias * s.confidence;
        totalConf += s.confidence;
    }
    const aggregated = totalConf === 0 ? 0 : weighted / totalConf;
    const dominant = sources.reduce((a, b) => (Math.abs(b.bias) > Math.abs(a.bias) ? b : a)).name;
    const meanBias = sources.reduce((s, x) => s + x.bias, 0) / sources.length;
    const variance = sources.reduce((s, x) => s + (x.bias - meanBias) ** 2, 0) / sources.length;
    const consensus = 1 - Math.sqrt(variance);
    return {
        aggregated,
        dominant,
        consensus,
        provenance: [`[ALG_T2_B_001] agg=${aggregated.toFixed(4)} dom=${dominant} cons=${consensus.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_B_002 · 偏差级联检测
// ============================================================================
function biasCascadeDetect(events, threshold = 0.3) {
    if (events.length === 0) {
        return { cascades: [], maxDepth: 0, provenance: ['[ALG_T2_B_002] 无事件'] };
    }
    const sorted = [...events].sort((a, b) => a.time - b.time);
    const cascades = [];
    for (const start of sorted) {
        if (Math.abs(start.bias) < threshold)
            continue;
        const path = [start.source];
        const affected = [start.target];
        let magnitude = Math.abs(start.bias);
        for (const ev of sorted) {
            if (ev.time <= start.time)
                continue;
            if (path.includes(ev.source) && !affected.includes(ev.target)) {
                path.push(ev.target);
                affected.push(ev.target);
                magnitude += Math.abs(ev.bias);
            }
        }
        if (path.length > 1) {
            cascades.push({
                source: start.source,
                affected,
                path,
                magnitude: magnitude / path.length,
            });
        }
    }
    const maxDepth = cascades.reduce((m, c) => Math.max(m, c.path.length), 0);
    return {
        cascades,
        maxDepth,
        provenance: [`[ALG_T2_B_002] cascades=${cascades.length} maxDepth=${maxDepth}`],
    };
}
// ============================================================================
// ALG_T2_B_003 · 偏差根因定位
// ============================================================================
function biasRootCause(symptoms, causes) {
    if (symptoms.length === 0 || causes.length === 0) {
        return { rootCause: '', confidence: 0, attribution: {}, provenance: ['[ALG_T2_B_003] 空输入'] };
    }
    const totalSeverity = symptoms.reduce((s, x) => s + x.severity, 0);
    const totalProb = causes.reduce((s, c) => s + c.probability, 0);
    const attribution = {};
    for (const c of causes) {
        attribution[c.name] = totalProb === 0 ? 0 : (c.probability / totalProb) * totalSeverity;
    }
    let rootCause = causes[0].name;
    let maxAttr = -1;
    for (const [name, attr] of Object.entries(attribution)) {
        if (attr > maxAttr) {
            maxAttr = attr;
            rootCause = name;
        }
    }
    return {
        rootCause,
        confidence: maxAttr / (totalSeverity + 1e-9),
        attribution,
        provenance: [`[ALG_T2_B_003] root=${rootCause} conf=${(maxAttr / (totalSeverity + 1e-9)).toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_B_004 · 偏差修正策略
// ============================================================================
function biasCorrectionStrategy(bias, tolerance = 0.05) {
    const absBias = Math.abs(bias);
    if (absBias <= tolerance) {
        return { strategy: 'monitor', intensity: 0, expectedReduction: 0, provenance: [`[ALG_T2_B_004] 无需修正 bias=${bias.toFixed(4)}`] };
    }
    let strategy;
    let intensity;
    if (absBias < 0.1) {
        strategy = 'fine_tune';
        intensity = absBias * 0.5;
    }
    else if (absBias < 0.3) {
        strategy = 'calibrate';
        intensity = absBias * 0.7;
    }
    else if (absBias < 0.6) {
        strategy = 'retrain';
        intensity = absBias * 0.85;
    }
    else {
        strategy = 'rebuild';
        intensity = absBias;
    }
    return {
        strategy,
        intensity,
        expectedReduction: intensity,
        provenance: [`[ALG_T2_B_004] strat=${strategy} intensity=${intensity.toFixed(4)} bias=${bias.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_B_005 · 偏差相关性分析
// ============================================================================
function biasCorrelation(biasA, biasB) {
    const n = Math.min(biasA.length, biasB.length);
    if (n < 3) {
        return { correlation: 0, lag: 0, significant: false, provenance: ['[ALG_T2_B_005] 数据不足'] };
    }
    let bestCorr = -1, bestLag = 0;
    for (let lag = 0; lag < n / 2; lag++) {
        const len = n - lag;
        let dot = 0, normA = 0, normB = 0;
        const meanA = biasA.slice(0, len).reduce((s, x) => s + x, 0) / len;
        const meanB = biasB.slice(lag, lag + len).reduce((s, x) => s + x, 0) / len;
        for (let i = 0; i < len; i++) {
            const da = biasA[i] - meanA;
            const db = biasB[i + lag] - meanB;
            dot += da * db;
            normA += da * da;
            normB += db * db;
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        const corr = denom === 0 ? 0 : dot / denom;
        if (Math.abs(corr) > Math.abs(bestCorr)) {
            bestCorr = corr;
            bestLag = lag;
        }
    }
    const significant = Math.abs(bestCorr) > 0.6 && n > 5;
    return {
        correlation: bestCorr,
        lag: bestLag,
        significant,
        provenance: [`[ALG_T2_B_005] corr=${bestCorr.toFixed(4)} lag=${bestLag} sig=${significant}`],
    };
}
// ============================================================================
// ALG_T2_B_006 · 偏差累积监控
// ============================================================================
function biasAccumulationMonitor(biases, alertThreshold = 0.5) {
    if (biases.length === 0) {
        return { cumulative: 0, rate: 0, willBreach: false, provenance: ['[ALG_T2_B_006] 空数据'] };
    }
    let cumulative = 0;
    for (const b of biases)
        cumulative += Math.abs(b);
    const rate = biases.length > 1 ? (Math.abs(biases[biases.length - 1]) - Math.abs(biases[0])) / (biases.length - 1) : 0;
    const willBreach = rate > 0 && cumulative < alertThreshold && (cumulative + rate * 10) > alertThreshold;
    return {
        cumulative,
        rate,
        willBreach,
        provenance: [`[ALG_T2_B_006] cum=${cumulative.toFixed(4)} rate=${rate.toFixed(4)} breach=${willBreach}`],
    };
}
// ============================================================================
// ALG_T2_B_007 · 偏差热力图
// ============================================================================
function biasHeatmap(rows, cols, values) {
    if (rows.length === 0 || cols.length === 0) {
        return { heatmap: [], hotspot: null, provenance: ['[ALG_T2_B_007] 空矩阵'] };
    }
    const heatmap = [];
    let hotspot = null;
    let maxVal = -Infinity;
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < cols.length; j++) {
            const v = values[i]?.[j] || 0;
            const level = Math.abs(v) >= 0.7 ? 'critical' : Math.abs(v) >= 0.4 ? 'high' : Math.abs(v) >= 0.2 ? 'medium' : 'low';
            heatmap.push({ row: rows[i], col: cols[j], value: v, level });
            if (Math.abs(v) > maxVal) {
                maxVal = Math.abs(v);
                hotspot = { row: rows[i], col: cols[j] };
            }
        }
    }
    return {
        heatmap,
        hotspot,
        provenance: [`[ALG_T2_B_007] cells=${heatmap.length} hotspot=${hotspot ? `${hotspot.row},${hotspot.col}` : 'none'}`],
    };
}
// ============================================================================
// ALG_T2_B_008 · 偏差传播路径
// ============================================================================
function biasPropagationPath(graph, source, maxDepth = 5) {
    const adj = new Map();
    for (const e of graph) {
        if (!adj.has(e.from))
            adj.set(e.from, []);
        adj.get(e.from).push({ to: e.to, weight: e.weight });
    }
    const paths = [];
    const visited = new Set([source]);
    function dfs(current, path, depth, spread) {
        if (depth >= maxDepth)
            return spread;
        let total = spread;
        for (const { to, weight } of adj.get(current) || []) {
            if (visited.has(to))
                continue;
            visited.add(to);
            const newPath = [...path, to];
            paths.push(newPath);
            total += weight;
            total += dfs(to, newPath, depth + 1, weight);
            visited.delete(to);
        }
        return total;
    }
    const totalSpread = dfs(source, [source], 0, 0);
    return {
        paths,
        totalSpread,
        provenance: [`[ALG_T2_B_008] paths=${paths.length} spread=${totalSpread.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_B_009 · 偏差阈值动态调整
// ============================================================================
function biasThresholdAdapt(history, baseThreshold, adaptationRate = 0.1) {
    if (history.length < 3) {
        return { threshold: baseThreshold, trend: 'unknown', provenance: ['[ALG_T2_B_009] 数据不足'] };
    }
    const recent = history.slice(-5);
    const mean = recent.reduce((s, x) => s + x, 0) / recent.length;
    const variance = recent.reduce((s, x) => s + (x - mean) ** 2, 0) / recent.length;
    const std = Math.sqrt(variance);
    const trend = mean > 0 ? 'increasing' : mean < 0 ? 'decreasing' : 'stable';
    const threshold = baseThreshold + adaptationRate * std;
    return {
        threshold,
        trend,
        provenance: [`[ALG_T2_B_009] thr=${threshold.toFixed(4)} trend=${trend} std=${std.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_B_010 · 偏差报告生成
// ============================================================================
function biasReportGenerate(biases) {
    if (biases.length === 0) {
        return { report: 'no biases', criticalCount: 0, totalImpact: 0, provenance: ['[ALG_T2_B_010] 空输入'] };
    }
    let criticalCount = 0;
    let totalImpact = 0;
    const lines = ['=== Bias Report ==='];
    for (const b of biases) {
        const breached = Math.abs(b.value) > b.threshold;
        if (breached)
            criticalCount++;
        totalImpact += Math.abs(b.value);
        lines.push(`- ${b.name}: ${b.value.toFixed(4)} (threshold=${b.threshold}, impact=${b.impact}, ${breached ? 'BREACHED' : 'ok'})`);
    }
    return {
        report: lines.join('\n'),
        criticalCount,
        totalImpact,
        provenance: [`[ALG_T2_B_010] n=${biases.length} critical=${criticalCount} impact=${totalImpact.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_B_011 · 偏差自愈机制
// ============================================================================
function biasSelfHeal(bias, healingCapacity, maxIterations = 10) {
    if (healingCapacity <= 0 || maxIterations <= 0) {
        return { healed: 0, remaining: Math.abs(bias), iterations: 0, provenance: ['[ALG_T2_B_011] 无愈合能力'] };
    }
    let remaining = Math.abs(bias);
    let healed = 0;
    let iterations = 0;
    for (let i = 0; i < maxIterations && remaining > 0.001; i++) {
        const heal = Math.min(remaining, healingCapacity * Math.pow(0.5, i));
        healed += heal;
        remaining -= heal;
        iterations = i + 1;
    }
    return {
        healed,
        remaining,
        iterations,
        provenance: [`[ALG_T2_B_011] healed=${healed.toFixed(4)} rem=${remaining.toFixed(4)} iter=${iterations}`],
    };
}
// ============================================================================
// ALG_T2_B_012 · 偏差溯源链
// ============================================================================
function biasTraceChain(biases) {
    if (biases.length === 0) {
        return { chain: [], totalTime: 0, provenance: ['[ALG_T2_B_012] 空链'] };
    }
    const sorted = [...biases].sort((a, b) => a.timestamp - b.timestamp);
    const chain = [];
    let cumulative = 0;
    for (const b of sorted) {
        cumulative += b.bias;
        chain.push({ source: b.source, bias: b.bias, cumulative });
    }
    const totalTime = sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
    return {
        chain,
        totalTime,
        provenance: [`[ALG_T2_B_012] chain=${chain.length} cum=${cumulative.toFixed(4)} time=${totalTime}`],
    };
}
// ============================================================================
// ALG_T2_B_013 · 偏差影响范围评估
// ============================================================================
function biasImpactScope(bias, affectedComponents) {
    if (affectedComponents.length === 0) {
        return { affected: [], totalImpact: 0, provenance: ['[ALG_T2_B_013] 无受影响组件'] };
    }
    const affected = affectedComponents.map(c => ({
        name: c.name,
        impact: bias * c.sensitivity,
    }));
    const totalImpact = affected.reduce((s, a) => s + Math.abs(a.impact), 0);
    return {
        affected,
        totalImpact,
        provenance: [`[ALG_T2_B_013] bias=${bias.toFixed(4)} affected=${affected.length} impact=${totalImpact.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_B_014 · 偏差补偿器
// ============================================================================
function biasCompensator(target, actual, compensationRate = 0.5) {
    const deviation = target - actual;
    const compensation = deviation * compensationRate;
    const compensated = actual + compensation;
    const residual = target - compensated;
    return {
        compensation,
        compensated,
        residual,
        provenance: [`[ALG_T2_B_014] target=${target.toFixed(4)} actual=${actual.toFixed(4)} comp=${compensation.toFixed(4)} res=${residual.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_B_015 · 偏差统计检验
// ============================================================================
function biasStatisticalTest(sample, hypothesizedMean, alpha = 0.05) {
    const n = sample.length;
    if (n < 2) {
        return { t: 0, reject: false, provenance: ['[ALG_T2_B_015] 样本不足'] };
    }
    const mean = sample.reduce((s, x) => s + x, 0) / n;
    const variance = sample.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
    const std = Math.sqrt(variance);
    if (std === 0) {
        return { t: 0, reject: false, provenance: ['[ALG_T2_B_015] 标准差为零'] };
    }
    const t = (mean - hypothesizedMean) / (std / Math.sqrt(n));
    // 简化的 t 检验临界值（n>30 近似正态）
    const critical = n > 30 ? 1.96 : 2.0;
    const reject = Math.abs(t) > critical;
    return {
        t,
        reject,
        provenance: [`[ALG_T2_B_015] t=${t.toFixed(4)} reject=${reject} alpha=${alpha}`],
    };
}
// ============================================================================
// ALG_T2_B_016 · 偏差季节性检测
// ============================================================================
function biasSeasonality(values, period) {
    if (values.length < period * 2 || period <= 0) {
        return { seasonal: false, strength: 0, peaks: [], provenance: ['[ALG_T2_B_016] 数据不足'] };
    }
    // 计算每个相位的均值
    const phaseMeans = new Array(period).fill(0);
    const phaseCounts = new Array(period).fill(0);
    for (let i = 0; i < values.length; i++) {
        const phase = i % period;
        phaseMeans[phase] += values[i];
        phaseCounts[phase]++;
    }
    for (let i = 0; i < period; i++) {
        phaseMeans[i] = phaseCounts[i] > 0 ? phaseMeans[i] / phaseCounts[i] : 0;
    }
    const overallMean = phaseMeans.reduce((s, x) => s + x, 0) / period;
    let variance = 0;
    for (const m of phaseMeans)
        variance += (m - overallMean) ** 2;
    variance /= period;
    const strength = Math.sqrt(variance) / (Math.abs(overallMean) + 1e-9);
    const peaks = [];
    for (let i = 0; i < period; i++) {
        if (phaseMeans[i] > overallMean * 1.2)
            peaks.push(i);
    }
    return {
        seasonal: strength > 0.15,
        strength,
        peaks,
        provenance: [`[ALG_T2_B_016] seasonal=${strength > 0.15} strength=${strength.toFixed(4)} peaks=${peaks.length}`],
    };
}
// ============================================================================
// ALG_T2_B_017 · 偏差空间分布
// ============================================================================
function biasSpatialDistribution(locations) {
    if (locations.length === 0) {
        return { centroid: { x: 0, y: 0 }, spread: 0, clusters: 0, provenance: ['[ALG_T2_B_017] 空数据'] };
    }
    const cx = locations.reduce((s, l) => s + l.x, 0) / locations.length;
    const cy = locations.reduce((s, l) => s + l.y, 0) / locations.length;
    const spread = Math.sqrt(locations.reduce((s, l) => s + (l.x - cx) ** 2 + (l.y - cy) ** 2, 0) / locations.length);
    // 简单聚类：基于阈值
    const threshold = spread * 0.5;
    const visited = new Set();
    let clusters = 0;
    for (let i = 0; i < locations.length; i++) {
        if (visited.has(i))
            continue;
        visited.add(i);
        clusters++;
        for (let j = i + 1; j < locations.length; j++) {
            if (visited.has(j))
                continue;
            const d = Math.sqrt((locations[i].x - locations[j].x) ** 2 + (locations[i].y - locations[j].y) ** 2);
            if (d < threshold)
                visited.add(j);
        }
    }
    return {
        centroid: { x: cx, y: cy },
        spread,
        clusters,
        provenance: [`[ALG_T2_B_017] centroid=(${cx.toFixed(2)},${cy.toFixed(2)}) spread=${spread.toFixed(4)} clusters=${clusters}`],
    };
}
// ============================================================================
// ALG_T2_B_018 · 偏差预警等级
// ============================================================================
function biasAlertLevel(bias, threshold, trend) {
    const absBias = Math.abs(bias);
    const ratio = absBias / threshold;
    let level;
    let action;
    if (ratio < 0.5) {
        level = 'green';
        action = 'continue_monitoring';
    }
    else if (ratio < 0.8) {
        level = 'yellow';
        action = 'increase_frequency';
    }
    else if (ratio < 1.0) {
        level = 'orange';
        action = trend > 0 ? 'prepare_intervention' : 'investigate';
    }
    else {
        level = 'red';
        action = 'immediate_intervention';
    }
    return {
        level,
        action,
        provenance: [`[ALG_T2_B_018] level=${level} ratio=${ratio.toFixed(4)} action=${action}`],
    };
}
// ============================================================================
// ALG_T2_B_019 · 偏差因果推断
// ============================================================================
function biasCausalInference(cause, effect, maxLag = 5) {
    const n = Math.min(cause.length, effect.length);
    if (n < maxLag + 5) {
        return { bestLag: 0, grangerScore: 0, causal: false, provenance: ['[ALG_T2_B_019] 数据不足'] };
    }
    let bestScore = -1, bestLag = 0;
    for (let lag = 1; lag <= maxLag; lag++) {
        let corr = 0;
        const len = n - lag;
        const meanC = cause.slice(0, len).reduce((s, x) => s + x, 0) / len;
        const meanE = effect.slice(lag, lag + len).reduce((s, x) => s + x, 0) / len;
        let num = 0, denC = 0, denE = 0;
        for (let i = 0; i < len; i++) {
            const dc = cause[i] - meanC;
            const de = effect[i + lag] - meanE;
            num += dc * de;
            denC += dc * dc;
            denE += de * de;
        }
        const denom = Math.sqrt(denC) * Math.sqrt(denE);
        corr = denom === 0 ? 0 : num / denom;
        if (Math.abs(corr) > Math.abs(bestScore)) {
            bestScore = corr;
            bestLag = lag;
        }
    }
    const causal = Math.abs(bestScore) > 0.5;
    return {
        bestLag,
        grangerScore: bestScore,
        causal,
        provenance: [`[ALG_T2_B_019] lag=${bestLag} score=${bestScore.toFixed(4)} causal=${causal}`],
    };
}
// ============================================================================
// ALG_T2_B_020 · 偏差综合评估
// ============================================================================
function biasComprehensiveAssessment(metrics) {
    const score = metrics.magnitude * 0.3 +
        metrics.frequency * 0.2 +
        metrics.impact * 0.25 +
        Math.max(0, metrics.trend) * 0.15 +
        (1 - metrics.detectability) * 0.1;
    let severity;
    if (score >= 0.85)
        severity = 'critical';
    else if (score >= 0.7)
        severity = 'major';
    else if (score >= 0.5)
        severity = 'moderate';
    else if (score >= 0.3)
        severity = 'minor';
    else
        severity = 'negligible';
    return {
        score,
        severity,
        provenance: [`[ALG_T2_B_020] score=${score.toFixed(4)} severity=${severity}`],
    };
}
