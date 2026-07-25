"use strict";
/**
 * MetaGO Engine - A5 T1 算法 · 价值评估类（第一批）
 *
 * 对应文档：DCV 六维价值 / 28 维价值共振 / 31 维价值向量
 *
 * 算法清单（30 个，ALG_V_001 ~ ALG_V_030）：
 *   001 六维价值聚合    002 价值向量归一化    003 DCV 权重计算
 *   004 行为银行积分    005 全息信用评分      006 价值对齐度
 *   007 价值冲突检测    008 价值优先级排序    009 价值衰减
 *   010 价值增益        011 价值转移          012 价值平衡
 *   013 多维价值对比    014 价值矩阵          015 价值趋势
 *   016 价值风险        017 价值回报率        018 价值密度
 *   019 价值熵          020 价值覆盖度        021 价值深度
 *   022 价值广度        023 价值稳定度        024 价值可信度
 *   025 价值溯源        026 价值审计          027 价值校准
 *   028 价值映射        029 价值投影          030 价值综合评估
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateSixDimValue = aggregateSixDimValue;
exports.normalizeValueVector = normalizeValueVector;
exports.calculateDCVWeights = calculateDCVWeights;
exports.behaviorBankScore = behaviorBankScore;
exports.holographicCreditScore = holographicCreditScore;
exports.valueAlignment = valueAlignment;
exports.detectValueConflicts = detectValueConflicts;
exports.prioritizeValues = prioritizeValues;
exports.valueDecay = valueDecay;
exports.valueGain = valueGain;
exports.valueTransfer = valueTransfer;
exports.valueBalance = valueBalance;
exports.compareMultiDimValues = compareMultiDimValues;
exports.buildValueMatrix = buildValueMatrix;
exports.valueTrend = valueTrend;
exports.valueRiskAssessment = valueRiskAssessment;
exports.valueROI = valueROI;
exports.valueDensity = valueDensity;
exports.valueEntropy = valueEntropy;
exports.valueCoverage = valueCoverage;
exports.valueDepth = valueDepth;
exports.valueBreadth = valueBreadth;
exports.valueStability = valueStability;
exports.valueConfidence = valueConfidence;
exports.valueTrace = valueTrace;
exports.valueAudit = valueAudit;
exports.valueCalibration = valueCalibration;
exports.valueMapping = valueMapping;
exports.valueProjection = valueProjection;
exports.comprehensiveValueAssessment = comprehensiveValueAssessment;
// ============================================================================
// T1·ALG_V_001 · 六维价值聚合
// ============================================================================
function aggregateSixDimValue(dims) {
    const dimensions = dims.map(d => {
        const range = (d.max ?? 100) - (d.min ?? 0);
        const normalized = range === 0 ? 1 : (d.rawValue - (d.min ?? 0)) / range;
        return {
            name: d.name,
            weighted: d.rawValue * d.weight,
            normalized: normalized * d.weight,
        };
    });
    const totalScore = dimensions.reduce((s, d) => s + d.weighted, 0);
    const totalWeight = dims.reduce((s, d) => s + d.weight, 0);
    const normalizedScore = totalWeight === 0 ? 0 : totalScore / totalWeight;
    return {
        totalScore,
        normalizedScore,
        dimensions,
        provenance: [`[ALG_V_001] total=${totalScore.toFixed(4)} norm=${normalizedScore.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_V_002 · 价值向量归一化
// ============================================================================
function normalizeValueVector(vector, method = 'minmax') {
    if (vector.length === 0) {
        return { normalized: [], method, provenance: ['[ALG_V_002] 空向量'] };
    }
    let normalized;
    if (method === 'minmax') {
        const min = Math.min(...vector);
        const max = Math.max(...vector);
        const range = max - min;
        normalized = range === 0 ? vector.map(() => 1) : vector.map(v => (v - min) / range);
    }
    else if (method === 'zscore') {
        const mean = vector.reduce((s, x) => s + x, 0) / vector.length;
        const variance = vector.reduce((s, x) => s + (x - mean) ** 2, 0) / vector.length;
        const std = Math.sqrt(variance);
        normalized = std === 0 ? vector.map(() => 0) : vector.map(v => (v - mean) / std);
    }
    else {
        const norm = Math.sqrt(vector.reduce((s, x) => s + x * x, 0));
        normalized = norm === 0 ? vector : vector.map(v => v / norm);
    }
    return {
        normalized,
        method,
        provenance: [`[ALG_V_002] method=${method} dim=${vector.length}`],
    };
}
// ============================================================================
// T1·ALG_V_003 · DCV 权重计算（基于方差倒数法）
// ============================================================================
function calculateDCVWeights(samples) {
    if (samples.length === 0 || samples[0].length === 0) {
        return { weights: [], provenance: ['[ALG_V_003] 空样本'] };
    }
    const dim = samples[0].length;
    const variances = [];
    for (let d = 0; d < dim; d++) {
        const col = samples.map(s => s[d]);
        const mean = col.reduce((s, x) => s + x, 0) / col.length;
        const variance = col.reduce((s, x) => s + (x - mean) ** 2, 0) / col.length;
        variances.push(variance);
    }
    const reciprocalSum = variances.reduce((s, v) => s + (v === 0 ? 0 : 1 / v), 0);
    const weights = variances.map(v => (v === 0 ? 0 : 1 / v / reciprocalSum));
    return {
        weights,
        provenance: [`[ALG_V_003] dim=${dim} samples=${samples.length}`],
    };
}
function behaviorBankScore(deposits, withdrawals) {
    const sum = (arr) => arr.reduce((acc, b) => ({
        knowledge: acc.knowledge + b.knowledge,
        social: acc.social + b.social,
        economic: acc.economic + b.economic,
        cultural: acc.cultural + b.cultural,
        spiritual: acc.spiritual + b.spiritual,
    }), { knowledge: 0, social: 0, economic: 0, cultural: 0, spiritual: 0 });
    const totalDep = sum(deposits);
    const totalWd = sum(withdrawals);
    const net = {
        knowledge: totalDep.knowledge - totalWd.knowledge,
        social: totalDep.social - totalWd.social,
        economic: totalDep.economic - totalWd.economic,
        cultural: totalDep.cultural - totalWd.cultural,
        spiritual: totalDep.spiritual - totalWd.spiritual,
    };
    const total = net.knowledge + net.social + net.economic + net.cultural + net.spiritual;
    return {
        net,
        total,
        provenance: [`[ALG_V_004] total=${total.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_V_005 · 全息信用评分
// ============================================================================
function holographicCreditScore(factors) {
    const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
    const weightedSum = factors.reduce((s, f) => s + f.score * f.weight, 0);
    const score = totalWeight === 0 ? 0 : weightedSum / totalWeight;
    const grade = score >= 90 ? 'AAA' : score >= 80 ? 'AA' : score >= 70 ? 'A' : score >= 60 ? 'BBB' : score >= 50 ? 'BB' : score >= 30 ? 'B' : 'C';
    return {
        score,
        grade,
        provenance: [`[ALG_V_005] score=${score.toFixed(2)} grade=${grade}`],
    };
}
// ============================================================================
// T1·ALG_V_006 · 价值对齐度（与目标向量的余弦相似度）
// ============================================================================
function valueAlignment(current, target) {
    if (current.length !== target.length || current.length === 0) {
        return { alignment: 0, deviation: 1, provenance: ['[ALG_V_006] 维度不匹配'] };
    }
    let dot = 0, normC = 0, normT = 0;
    for (let i = 0; i < current.length; i++) {
        dot += current[i] * target[i];
        normC += current[i] ** 2;
        normT += target[i] ** 2;
    }
    const denom = Math.sqrt(normC) * Math.sqrt(normT);
    const alignment = denom === 0 ? 0 : dot / denom;
    return {
        alignment,
        deviation: 1 - alignment,
        provenance: [`[ALG_V_006] align=${alignment.toFixed(6)} dev=${(1 - alignment).toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_V_007 · 价值冲突检测
// ============================================================================
function detectValueConflicts(values, threshold = 0.3) {
    const conflicts = [];
    for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
            let dot = 0, normI = 0, normJ = 0;
            const v1 = values[i].vector;
            const v2 = values[j].vector;
            const len = Math.min(v1.length, v2.length);
            for (let k = 0; k < len; k++) {
                dot += v1[k] * v2[k];
                normI += v1[k] ** 2;
                normJ += v2[k] ** 2;
            }
            const denom = Math.sqrt(normI) * Math.sqrt(normJ);
            const sim = denom === 0 ? 0 : dot / denom;
            if (sim < -threshold) {
                conflicts.push([values[i].name, values[j].name, sim]);
            }
        }
    }
    return {
        conflicts,
        provenance: [`[ALG_V_007] conflicts=${conflicts.length} threshold=${threshold}`],
    };
}
// ============================================================================
// T1·ALG_V_008 · 价值优先级排序
// ============================================================================
function prioritizeValues(values) {
    const ranked = values
        .map(v => ({ name: v.name, score: v.importance * v.urgency }))
        .sort((a, b) => b.score - a.score);
    return {
        ranked,
        provenance: [`[ALG_V_008] n=${ranked.length}`],
    };
}
// ============================================================================
// T1·ALG_V_009 · 价值衰减（时间衰减）
// ============================================================================
function valueDecay(initialValue, halfLifeDays, elapsedDays) {
    const currentValue = initialValue * Math.pow(0.5, elapsedDays / halfLifeDays);
    return {
        currentValue,
        provenance: [`[ALG_V_009] init=${initialValue} halfLife=${halfLifeDays}d elapsed=${elapsedDays}d → ${currentValue.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_V_010 · 价值增益
// ============================================================================
function valueGain(baseline, actual, maxPossible) {
    const gain = actual - baseline;
    const relativeGain = maxPossible === baseline ? 0 : gain / (maxPossible - baseline);
    return {
        gain,
        relativeGain,
        provenance: [`[ALG_V_010] gain=${gain.toFixed(4)} rel=${relativeGain.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_V_011 · 价值转移（账户间流转）
// ============================================================================
function valueTransfer(from, to, amount, fromKey, toKey) {
    if (from[fromKey] < amount) {
        return {
            from,
            to,
            provenance: [`[ALG_V_011] 余额不足: ${fromKey}=${from[fromKey]} < ${amount}`],
        };
    }
    const newFrom = { ...from, [fromKey]: from[fromKey] - amount };
    const newTo = { ...to, [toKey]: to[toKey] + amount };
    return {
        from: newFrom,
        to: newTo,
        provenance: [`[ALG_V_011] ${fromKey}→${toKey} amount=${amount}`],
    };
}
// ============================================================================
// T1·ALG_V_012 · 价值平衡（多维方差最小化）
// ============================================================================
function valueBalance(values) {
    if (values.length === 0) {
        return { mean: 0, variance: 0, balance: 1, provenance: ['[ALG_V_012] 空'] };
    }
    const mean = values.reduce((s, x) => s + x, 0) / values.length;
    const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length;
    const balance = 1 / (1 + Math.sqrt(variance));
    return {
        mean,
        variance,
        balance,
        provenance: [`[ALG_V_012] mean=${mean.toFixed(4)} var=${variance.toFixed(4)} balance=${balance.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_V_013 · 多维价值对比
// ============================================================================
function compareMultiDimValues(a, b) {
    if (a.length !== b.length) {
        return { dominant: 'equal', margin: 0, provenance: ['[ALG_V_013] 维度不匹配'] };
    }
    let sumA = 0, sumB = 0;
    for (let i = 0; i < a.length; i++) {
        sumA += a[i];
        sumB += b[i];
    }
    const margin = Math.abs(sumA - sumB);
    return {
        dominant: margin < 1e-9 ? 'equal' : sumA > sumB ? 'A' : 'B',
        margin,
        provenance: [`[ALG_V_013] A=${sumA.toFixed(4)} B=${sumB.toFixed(4)} dom=${sumA > sumB ? 'A' : sumA < sumB ? 'B' : 'equal'}`],
    };
}
// ============================================================================
// T1·ALG_V_014 · 价值矩阵构造
// ============================================================================
function buildValueMatrix(rows, cols, valueFn) {
    const matrix = rows.map(r => cols.map(c => valueFn(r, c)));
    return {
        matrix,
        rows,
        cols,
        provenance: [`[ALG_V_014] ${rows.length}×${cols.length}`],
    };
}
// ============================================================================
// T1·ALG_V_015 · 价值趋势分析
// ============================================================================
function valueTrend(timeSeries) {
    const n = timeSeries.length;
    if (n < 2)
        return { slope: 0, trend: 'flat', provenance: ['[ALG_V_015] 数据不足'] };
    const meanT = timeSeries.reduce((s, d) => s + d.time, 0) / n;
    const meanV = timeSeries.reduce((s, d) => s + d.value, 0) / n;
    let num = 0, den = 0;
    for (const d of timeSeries) {
        num += (d.time - meanT) * (d.value - meanV);
        den += (d.time - meanT) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    return {
        slope,
        trend: slope > 0.001 ? 'up' : slope < -0.001 ? 'down' : 'flat',
        provenance: [`[ALG_V_015] slope=${slope.toFixed(6)} trend=${slope > 0.001 ? 'up' : slope < -0.001 ? 'down' : 'flat'}`],
    };
}
// ============================================================================
// T1·ALG_V_016 · 价值风险评估
// ============================================================================
function valueRiskAssessment(values, confidence) {
    if (values.length === 0 || values.length !== confidence.length) {
        return { risk: 1, confidence: 0, provenance: ['[ALG_V_016] 输入无效'] };
    }
    const mean = values.reduce((s, x) => s + x, 0) / values.length;
    const variance = values.reduce((s, x, i) => s + confidence[i] * (x - mean) ** 2, 0) / values.length;
    const risk = Math.sqrt(variance) / (Math.abs(mean) + 1e-9);
    const avgConf = confidence.reduce((s, x) => s + x, 0) / confidence.length;
    return {
        risk,
        confidence: avgConf,
        provenance: [`[ALG_V_016] risk=${risk.toFixed(4)} conf=${avgConf.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_V_017 · 价值回报率
// ============================================================================
function valueROI(investment, return_, period) {
    if (investment <= 0) {
        return { roi: 0, annualizedRoi: 0, provenance: ['[ALG_V_017] 投资为 0'] };
    }
    const roi = (return_ - investment) / investment;
    const annualizedRoi = period <= 0 ? roi : Math.pow(1 + roi, 365 / period) - 1;
    return {
        roi,
        annualizedRoi,
        provenance: [`[ALG_V_017] roi=${(roi * 100).toFixed(2)}% annualized=${(annualizedRoi * 100).toFixed(2)}%`],
    };
}
// ============================================================================
// T1·ALG_V_018 · 价值密度
// ============================================================================
function valueDensity(totalValue, volume) {
    const density = volume === 0 ? 0 : totalValue / volume;
    return {
        density,
        provenance: [`[ALG_V_018] density=${density.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_V_019 · 价值熵（信息熵）
// ============================================================================
function valueEntropy(values) {
    if (values.length === 0)
        return { entropy: 0, provenance: ['[ALG_V_019] 空'] };
    const sum = values.reduce((s, x) => s + Math.abs(x), 0);
    if (sum === 0)
        return { entropy: 0, provenance: ['[ALG_V_019] 全零'] };
    let entropy = 0;
    for (const v of values) {
        const p = Math.abs(v) / sum;
        if (p > 0)
            entropy -= p * Math.log2(p);
    }
    const maxEntropy = Math.log2(values.length);
    return {
        entropy: maxEntropy === 0 ? 0 : entropy / maxEntropy, // 归一化到 [0,1]
        provenance: [`[ALG_V_019] H=${entropy.toFixed(6)} maxH=${maxEntropy.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_V_020 · 价值覆盖度
// ============================================================================
function valueCoverage(covered, total) {
    if (total.length === 0)
        return { coverage: 0, gaps: [], provenance: ['[ALG_V_020] 空'] };
    const totalSet = new Set(total);
    const coveredSet = new Set(covered);
    const gaps = [];
    for (const t of totalSet)
        if (!coveredSet.has(t))
            gaps.push(t);
    const coverage = (totalSet.size - gaps.length) / totalSet.size;
    return {
        coverage,
        gaps,
        provenance: [`[ALG_V_020] coverage=${(coverage * 100).toFixed(2)}% gaps=${gaps.length}`],
    };
}
// ============================================================================
// T1·ALG_V_021 · 价值深度
// ============================================================================
function valueDepth(chain) {
    if (chain.length === 0)
        return { maxDepth: 0, avgDepth: 0, provenance: ['[ALG_V_021] 空'] };
    const maxDepth = Math.max(...chain.map(c => c.level));
    const avgDepth = chain.reduce((s, c) => s + c.level, 0) / chain.length;
    return {
        maxDepth,
        avgDepth,
        provenance: [`[ALG_V_021] max=${maxDepth} avg=${avgDepth.toFixed(2)}`],
    };
}
// ============================================================================
// T1·ALG_V_022 · 价值广度
// ============================================================================
function valueBreadth(domains, coverage) {
    const coveredDomains = domains.filter(d => (coverage.get(d) ?? 0) > 0).length;
    const breadth = domains.length === 0 ? 0 : coveredDomains / domains.length;
    return {
        breadth,
        coveredDomains,
        provenance: [`[ALG_V_022] breadth=${(breadth * 100).toFixed(2)}% (${coveredDomains}/${domains.length})`],
    };
}
// ============================================================================
// T1·ALG_V_023 · 价值稳定度
// ============================================================================
function valueStability(timeSeries) {
    if (timeSeries.length < 2) {
        return { stability: 1, coefficientOfVariation: 0, provenance: ['[ALG_V_023] 数据不足'] };
    }
    const mean = timeSeries.reduce((s, x) => s + x, 0) / timeSeries.length;
    if (Math.abs(mean) < 1e-9) {
        return { stability: 0, coefficientOfVariation: Infinity, provenance: ['[ALG_V_023] 均值近零'] };
    }
    const variance = timeSeries.reduce((s, x) => s + (x - mean) ** 2, 0) / timeSeries.length;
    const std = Math.sqrt(variance);
    const cv = std / Math.abs(mean);
    const stability = 1 / (1 + cv);
    return {
        stability,
        coefficientOfVariation: cv,
        provenance: [`[ALG_V_023] stability=${stability.toFixed(4)} cv=${cv.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_V_024 · 价值可信度
// ============================================================================
function valueConfidence(samples, reference) {
    if (samples.length === 0) {
        return { confidence: 0, bias: 0, provenance: ['[ALG_V_024] 空样本'] };
    }
    const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
    const bias = mean - reference;
    const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / samples.length;
    const std = Math.sqrt(variance);
    const confidence = 1 / (1 + std / (Math.abs(mean) + 1e-9));
    return {
        confidence,
        bias,
        provenance: [`[ALG_V_024] conf=${confidence.toFixed(4)} bias=${bias.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_V_025 · 价值溯源
// ============================================================================
function valueTrace(chain) {
    const sources = chain.map(c => c.source);
    const totalContribution = chain.reduce((s, c) => s + c.contribution, 0);
    return {
        sources,
        totalContribution,
        provenance: [`[ALG_V_025] sources=${sources.length} total=${totalContribution.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_V_026 · 价值审计
// ============================================================================
function valueAudit(claimed, actual) {
    if (claimed.length !== actual.length) {
        return { discrepancies: [], auditScore: 0, provenance: ['[ALG_V_026] 维度不匹配'] };
    }
    const discrepancies = claimed.map((c, i) => Math.abs(c - actual[i]));
    const avgDisc = discrepancies.reduce((s, x) => s + x, 0) / discrepancies.length;
    const auditScore = 1 / (1 + avgDisc);
    return {
        discrepancies,
        auditScore,
        provenance: [`[ALG_V_026] auditScore=${auditScore.toFixed(4)} avgDisc=${avgDisc.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_V_027 · 价值校准
// ============================================================================
function valueCalibration(measured, standard) {
    if (measured.length !== standard.length) {
        return { calibrated: measured, offsets: [], provenance: ['[ALG_V_027] 维度不匹配'] };
    }
    const offsets = measured.map((m, i) => standard[i] - m);
    const calibrated = measured.map((m, i) => m + offsets[i]);
    return {
        calibrated,
        offsets,
        provenance: [`[ALG_V_027] offsets=${offsets.map(o => o.toFixed(4)).join(',')}`],
    };
}
// ============================================================================
// T1·ALG_V_028 · 价值映射
// ============================================================================
function valueMapping(source, mapping) {
    const mapped = source.map((v, i) => {
        const m = mapping[i] ?? { fromMin: 0, fromMax: 1, toMin: 0, toMax: 1 };
        const ratio = m.fromMax === m.fromMin ? 0 : (v - m.fromMin) / (m.fromMax - m.fromMin);
        return m.toMin + ratio * (m.toMax - m.toMin);
    });
    return {
        mapped,
        provenance: [`[ALG_V_028] n=${mapped.length}`],
    };
}
// ============================================================================
// T1·ALG_V_029 · 价值投影
// ============================================================================
function valueProjection(vector, basis) {
    if (basis.length === 0 || vector.length === 0) {
        return { projection: [], provenance: ['[ALG_V_029] 空'] };
    }
    const projection = basis.map(b => {
        let dot = 0, norm = 0;
        const len = Math.min(vector.length, b.length);
        for (let i = 0; i < len; i++) {
            dot += vector[i] * b[i];
            norm += b[i] * b[i];
        }
        return norm === 0 ? 0 : dot / norm;
    });
    return {
        projection,
        provenance: [`[ALG_V_029] dim=${projection.length}`],
    };
}
// ============================================================================
// T1·ALG_V_030 · 价值综合评估
// ============================================================================
function comprehensiveValueAssessment(metrics) {
    const score = (metrics.alignment * 0.3 +
        metrics.balance * 0.2 +
        metrics.stability * 0.2 +
        metrics.coverage * 0.15 +
        metrics.confidence * 0.15) *
        100;
    const grade = score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';
    return {
        score,
        grade,
        provenance: [`[ALG_V_030] score=${score.toFixed(2)} grade=${grade}`],
    };
}
