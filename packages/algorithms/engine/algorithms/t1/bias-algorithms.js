"use strict";
/**
 * MetaGO Engine - A5 T1 算法 · 偏差检测类（第一批）
 *
 * 对应文档：A2 元元进化监控引擎 / alignment.ts / decay-arima.ts
 *
 * 算法清单（30 个，ALG_B_001 ~ ALG_B_030）：
 *   001 漂移分数        002 偏差向量        003 偏差方向
 *   004 偏差幅度        005 偏差趋势        006 偏差累积
 *   007 阈值告警        008 异常检测        009 离群点识别
 *   010 分布偏移        011 概念漂移        012 数据漂移
 *   013 模型漂移        014 行为漂移        015 价值漂移
 *   016 性能退化        017 准确度下降      018 召回率下降
 *   019 精度下降        020 F1 下降         021 偏差归因
 *   022 偏差根因        023 偏差影响        024 偏差风险
 *   025 偏差修正        026 偏差补偿        027 偏差校准
 *   028 偏差监控        029 偏差报告        030 偏差预警
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.driftScore = driftScore;
exports.deviationVector = deviationVector;
exports.deviationDirection = deviationDirection;
exports.deviationMagnitude = deviationMagnitude;
exports.deviationTrend = deviationTrend;
exports.deviationAccumulation = deviationAccumulation;
exports.thresholdAlert = thresholdAlert;
exports.anomalyDetection = anomalyDetection;
exports.outlierDetection = outlierDetection;
exports.distributionShift = distributionShift;
exports.conceptDrift = conceptDrift;
exports.dataDrift = dataDrift;
exports.modelDrift = modelDrift;
exports.behaviorDrift = behaviorDrift;
exports.valueDrift = valueDrift;
exports.performanceDegradation = performanceDegradation;
exports.accuracyDrop = accuracyDrop;
exports.recallDrop = recallDrop;
exports.precisionDrop = precisionDrop;
exports.f1ScoreDrop = f1ScoreDrop;
exports.deviationAttribution = deviationAttribution;
exports.deviationRootCause = deviationRootCause;
exports.deviationImpact = deviationImpact;
exports.deviationRisk = deviationRisk;
exports.deviationCorrection = deviationCorrection;
exports.deviationCompensation = deviationCompensation;
exports.deviationCalibration = deviationCalibration;
exports.deviationMonitor = deviationMonitor;
exports.deviationReport = deviationReport;
exports.deviationEarlyWarning = deviationEarlyWarning;
// ============================================================================
// T1·ALG_B_001 · 漂移分数（向量余弦偏离）
// ============================================================================
function driftScore(expected, actual) {
    if (expected.length !== actual.length || expected.length === 0) {
        return { score: 1, provenance: ['[ALG_B_001] 维度不匹配'] };
    }
    let dot = 0, normE = 0, normA = 0;
    for (let i = 0; i < expected.length; i++) {
        dot += expected[i] * actual[i];
        normE += expected[i] ** 2;
        normA += actual[i] ** 2;
    }
    const cosine = Math.sqrt(normE) * Math.sqrt(normA) === 0 ? 0 : dot / (Math.sqrt(normE) * Math.sqrt(normA));
    return {
        score: 1 - cosine,
        provenance: [`[ALG_B_001] drift=${(1 - cosine).toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_B_002 · 偏差向量
// ============================================================================
function deviationVector(expected, actual) {
    if (expected.length !== actual.length) {
        return { vector: [], provenance: ['[ALG_B_002] 维度不匹配'] };
    }
    const vector = expected.map((e, i) => actual[i] - e);
    return {
        vector,
        provenance: [`[ALG_B_002] dim=${vector.length}`],
    };
}
// ============================================================================
// T1·ALG_B_003 · 偏差方向
// ============================================================================
function deviationDirection(deviation) {
    const directions = deviation.map(d => (d > 1e-9 ? 'positive' : d < -1e-9 ? 'negative' : 'zero'));
    const pos = deviation.filter(d => d > 1e-9).length;
    const neg = deviation.filter(d => d < -1e-9).length;
    const dominant = pos > neg ? 'positive' : neg > pos ? 'negative' : 'zero';
    return {
        directions,
        dominant,
        provenance: [`[ALG_B_003] pos=${pos} neg=${neg} dom=${dominant}`],
    };
}
// ============================================================================
// T1·ALG_B_004 · 偏差幅度
// ============================================================================
function deviationMagnitude(deviation) {
    if (deviation.length === 0) {
        return { magnitude: 0, maxAbs: 0, provenance: ['[ALG_B_004] 空'] };
    }
    const sumSq = deviation.reduce((s, x) => s + x * x, 0);
    const magnitude = Math.sqrt(sumSq);
    const maxAbs = Math.max(...deviation.map(Math.abs));
    return {
        magnitude,
        maxAbs,
        provenance: [`[ALG_B_004] mag=${magnitude.toFixed(6)} max=${maxAbs.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_B_005 · 偏差趋势
// ============================================================================
function deviationTrend(samples) {
    if (samples.length < 2) {
        return { slope: 0, trend: 'stable', provenance: ['[ALG_B_005] 数据不足'] };
    }
    const magnitudes = samples.map(s => {
        const dev = s.actual.map((a, i) => a - s.expected[i]);
        return Math.sqrt(dev.reduce((sum, x) => sum + x * x, 0));
    });
    const n = samples.length;
    const times = samples.map(s => s.timestamp);
    const meanT = times.reduce((s, x) => s + x, 0) / n;
    const meanM = magnitudes.reduce((s, x) => s + x, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (times[i] - meanT) * (magnitudes[i] - meanM);
        den += (times[i] - meanT) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    return {
        slope,
        trend: slope > 0.0001 ? 'increasing' : slope < -0.0001 ? 'decreasing' : 'stable',
        provenance: [`[ALG_B_005] slope=${slope.toFixed(6)} trend=${slope > 0.0001 ? 'increasing' : slope < -0.0001 ? 'decreasing' : 'stable'}`],
    };
}
// ============================================================================
// T1·ALG_B_006 · 偏差累积
// ============================================================================
function deviationAccumulation(samples) {
    let cumulative = 0;
    let maxCumulative = 0;
    for (const s of samples) {
        const dev = s.actual.map((a, i) => a - s.expected[i]);
        const mag = Math.sqrt(dev.reduce((sum, x) => sum + x * x, 0));
        cumulative += mag;
        if (cumulative > maxCumulative)
            maxCumulative = cumulative;
    }
    return {
        cumulative,
        maxCumulative,
        provenance: [`[ALG_B_006] cum=${cumulative.toFixed(6)} max=${maxCumulative.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_B_007 · 阈值告警
// ============================================================================
function thresholdAlert(values, thresholds) {
    const alerts = [];
    for (let i = 0; i < values.length; i++) {
        const t = thresholds[i];
        if (!t)
            continue;
        if (t.max !== undefined && values[i] > t.max) {
            alerts.push({ index: i, value: values[i], type: 'high' });
        }
        if (t.min !== undefined && values[i] < t.min) {
            alerts.push({ index: i, value: values[i], type: 'low' });
        }
    }
    return {
        alerts,
        provenance: [`[ALG_B_007] alerts=${alerts.length}`],
    };
}
// ============================================================================
// T1·ALG_B_008 · 异常检测（基于 Z-score）
// ============================================================================
function anomalyDetection(values, zThreshold = 3) {
    if (values.length < 2) {
        return { anomalies: [], zScores: [], provenance: ['[ALG_B_008] 数据不足'] };
    }
    const mean = values.reduce((s, x) => s + x, 0) / values.length;
    const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);
    if (std === 0) {
        return { anomalies: [], zScores: values.map(() => 0), provenance: ['[ALG_B_008] 标准差为 0'] };
    }
    const zScores = values.map(v => Math.abs((v - mean) / std));
    const anomalies = values.filter((_, i) => zScores[i] > zThreshold);
    return {
        anomalies,
        zScores,
        provenance: [`[ALG_B_008] anomalies=${anomalies.length} zThr=${zThreshold}`],
    };
}
// ============================================================================
// T1·ALG_B_009 · 离群点识别（IQR 法）
// ============================================================================
function outlierDetection(values, multiplier = 1.5) {
    if (values.length < 4) {
        return { outliers: [], q1: 0, q3: 0, iqr: 0, provenance: ['[ALG_B_009] 数据不足'] };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const q1Idx = Math.floor(sorted.length * 0.25);
    const q3Idx = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Idx];
    const q3 = sorted[q3Idx];
    const iqr = q3 - q1;
    const lower = q1 - multiplier * iqr;
    const upper = q3 + multiplier * iqr;
    const outliers = values.filter(v => v < lower || v > upper);
    return {
        outliers,
        q1,
        q3,
        iqr,
        provenance: [`[ALG_B_009] outliers=${outliers.length} Q1=${q1.toFixed(4)} Q3=${q3.toFixed(4)} IQR=${iqr.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_B_010 · 分布偏移检测（KS 检验简化版）
// ============================================================================
function distributionShift(reference, current) {
    if (reference.length === 0 || current.length === 0) {
        return { ksStatistic: 1, shifted: true, provenance: ['[ALG_B_010] 空数据'] };
    }
    const sortedRef = [...reference].sort((a, b) => a - b);
    const sortedCur = [...current].sort((a, b) => a - b);
    const allValues = [...new Set([...sortedRef, ...sortedCur])].sort((a, b) => a - b);
    let maxDiff = 0;
    for (const v of allValues) {
        const cdfRef = sortedRef.filter(x => x <= v).length / sortedRef.length;
        const cdfCur = sortedCur.filter(x => x <= v).length / sortedCur.length;
        const diff = Math.abs(cdfRef - cdfCur);
        if (diff > maxDiff)
            maxDiff = diff;
    }
    return {
        ksStatistic: maxDiff,
        shifted: maxDiff > 0.1,
        provenance: [`[ALG_B_010] KS=${maxDiff.toFixed(6)} shifted=${maxDiff > 0.1}`],
    };
}
// ============================================================================
// T1·ALG_B_011 · 概念漂移检测
// ============================================================================
function conceptDrift(errorRates, threshold = 0.05) {
    if (errorRates.length < 2) {
        return { driftDetected: false, driftPoint: null, provenance: ['[ALG_B_011] 数据不足'] };
    }
    let driftPoint = null;
    let maxIncrease = 0;
    for (let i = 1; i < errorRates.length; i++) {
        const increase = errorRates[i].errorRate - errorRates[i - 1].errorRate;
        if (increase > threshold && increase > maxIncrease) {
            maxIncrease = increase;
            driftPoint = errorRates[i].window;
        }
    }
    return {
        driftDetected: driftPoint !== null,
        driftPoint,
        provenance: [`[ALG_B_011] drift=${driftPoint !== null} point=${driftPoint ?? 'N/A'}`],
    };
}
// ============================================================================
// T1·ALG_B_012 · 数据漂移检测
// ============================================================================
function dataDrift(refStats, curStats, threshold = 0.1) {
    const meanShift = Math.abs(curStats.mean - refStats.mean) / (refStats.std + 1e-9);
    const stdShift = Math.abs(curStats.std - refStats.std) / (refStats.std + 1e-9);
    return {
        drifted: meanShift > threshold || stdShift > threshold,
        meanShift,
        stdShift,
        provenance: [`[ALG_B_012] meanShift=${meanShift.toFixed(4)} stdShift=${stdShift.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_B_013 · 模型漂移检测
// ============================================================================
function modelDrift(performanceHistory, degradationThreshold = 0.05) {
    if (performanceHistory.length < 2) {
        return { drifting: false, rate: 0, provenance: ['[ALG_B_013] 数据不足'] };
    }
    const first = performanceHistory[0].metric;
    const last = performanceHistory[performanceHistory.length - 1].metric;
    const rate = (first - last) / first;
    return {
        drifting: rate > degradationThreshold,
        rate,
        provenance: [`[ALG_B_013] rate=${rate.toFixed(4)} drifting=${rate > degradationThreshold}`],
    };
}
// ============================================================================
// T1·ALG_B_014 · 行为漂移检测
// ============================================================================
function behaviorDrift(expectedActions, actualActions) {
    const expSet = new Set(expectedActions);
    const actSet = new Set(actualActions);
    const newActions = [...actSet].filter(a => !expSet.has(a));
    const missingActions = [...expSet].filter(a => !actSet.has(a));
    const totalUnique = new Set([...expectedActions, ...actualActions]).size;
    const drift = totalUnique === 0 ? 0 : (newActions.length + missingActions.length) / totalUnique;
    return {
        driftScore: drift,
        newActions,
        missingActions,
        provenance: [`[ALG_B_014] drift=${drift.toFixed(4)} new=${newActions.length} missing=${missingActions.length}`],
    };
}
// ============================================================================
// T1·ALG_B_015 · 价值漂移检测
// ============================================================================
function valueDrift(historicalValues, currentValue, sensitivity = 2) {
    if (historicalValues.length < 2) {
        return { drifted: false, zScore: 0, provenance: ['[ALG_B_015] 数据不足'] };
    }
    const mean = historicalValues.reduce((s, x) => s + x, 0) / historicalValues.length;
    const variance = historicalValues.reduce((s, x) => s + (x - mean) ** 2, 0) / historicalValues.length;
    const std = Math.sqrt(variance);
    if (std === 0) {
        return { drifted: false, zScore: 0, provenance: ['[ALG_B_015] 标准差为 0'] };
    }
    const zScore = (currentValue - mean) / std;
    return {
        drifted: Math.abs(zScore) > sensitivity,
        zScore,
        provenance: [`[ALG_B_015] z=${zScore.toFixed(4)} drifted=${Math.abs(zScore) > sensitivity}`],
    };
}
// ============================================================================
// T1·ALG_B_016 · 性能退化检测
// ============================================================================
function performanceDegradation(baseline, current, threshold = 0.1) {
    const degradation = (baseline - current) / baseline;
    return {
        degraded: degradation > threshold,
        degradation,
        provenance: [`[ALG_B_016] deg=${(degradation * 100).toFixed(2)}% thr=${(threshold * 100).toFixed(2)}%`],
    };
}
// ============================================================================
// T1·ALG_B_017 · 准确度下降检测
// ============================================================================
function accuracyDrop(historicalAccuracy, currentAccuracy, threshold = 0.05) {
    if (historicalAccuracy.length === 0) {
        return { dropped: false, drop: 0, provenance: ['[ALG_B_017] 无历史数据'] };
    }
    const avg = historicalAccuracy.reduce((s, x) => s + x, 0) / historicalAccuracy.length;
    const drop = avg - currentAccuracy;
    return {
        dropped: drop > threshold,
        drop,
        provenance: [`[ALG_B_017] drop=${drop.toFixed(4)} thr=${threshold}`],
    };
}
// ============================================================================
// T1·ALG_B_018 · 召回率下降检测
// ============================================================================
function recallDrop(historicalRecall, currentRecall, threshold = 0.05) {
    if (historicalRecall.length === 0) {
        return { dropped: false, drop: 0, provenance: ['[ALG_B_018] 无历史数据'] };
    }
    const avg = historicalRecall.reduce((s, x) => s + x, 0) / historicalRecall.length;
    const drop = avg - currentRecall;
    return {
        dropped: drop > threshold,
        drop,
        provenance: [`[ALG_B_018] drop=${drop.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_B_019 · 精度下降检测
// ============================================================================
function precisionDrop(historicalPrecision, currentPrecision, threshold = 0.05) {
    if (historicalPrecision.length === 0) {
        return { dropped: false, drop: 0, provenance: ['[ALG_B_019] 无历史数据'] };
    }
    const avg = historicalPrecision.reduce((s, x) => s + x, 0) / historicalPrecision.length;
    const drop = avg - currentPrecision;
    return {
        dropped: drop > threshold,
        drop,
        provenance: [`[ALG_B_019] drop=${drop.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_B_020 · F1 分数下降检测
// ============================================================================
function f1ScoreDrop(historicalF1, currentF1, threshold = 0.05) {
    if (historicalF1.length === 0) {
        return { dropped: false, drop: 0, provenance: ['[ALG_B_020] 无历史数据'] };
    }
    const avg = historicalF1.reduce((s, x) => s + x, 0) / historicalF1.length;
    const drop = avg - currentF1;
    return {
        dropped: drop > threshold,
        drop,
        provenance: [`[ALG_B_020] drop=${drop.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_B_021 · 偏差归因
// ============================================================================
function deviationAttribution(deviation, factors) {
    const totalContribution = factors.reduce((s, f) => s + Math.abs(f.contribution), 0);
    const totalDeviation = deviation.reduce((s, x) => s + Math.abs(x), 0);
    if (totalContribution === 0 || totalDeviation === 0) {
        return { attributed: [], provenance: ['[ALG_B_021] 无可归因'] };
    }
    const attributed = factors
        .map(f => ({ name: f.name, share: Math.abs(f.contribution) / totalContribution }))
        .sort((a, b) => b.share - a.share);
    return {
        attributed,
        provenance: [`[ALG_B_021] factors=${attributed.length} top=${attributed[0]?.name ?? 'N/A'}`],
    };
}
// ============================================================================
// T1·ALG_B_022 · 偏差根因分析
// ============================================================================
function deviationRootCause(symptoms, causes) {
    if (causes.length === 0) {
        return { rootCause: null, confidence: 0, provenance: ['[ALG_B_022] 无候选原因'] };
    }
    const symptomSeverity = symptoms.reduce((s, x) => s + x.severity, 0) / symptoms.length;
    const bestCause = causes.reduce((best, c) => (c.likelihood > best.likelihood ? c : best));
    const confidence = bestCause.likelihood * symptomSeverity;
    return {
        rootCause: bestCause.name,
        confidence,
        provenance: [`[ALG_B_022] root=${bestCause.name} conf=${confidence.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_B_023 · 偏差影响评估
// ============================================================================
function deviationImpact(deviation, impactWeights) {
    if (deviation.length !== impactWeights.length) {
        return { totalImpact: 0, maxImpact: 0, provenance: ['[ALG_B_023] 维度不匹配'] };
    }
    const impacts = deviation.map((d, i) => Math.abs(d) * impactWeights[i]);
    const totalImpact = impacts.reduce((s, x) => s + x, 0);
    const maxImpact = Math.max(...impacts);
    return {
        totalImpact,
        maxImpact,
        provenance: [`[ALG_B_023] total=${totalImpact.toFixed(4)} max=${maxImpact.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_B_024 · 偏差风险评估
// ============================================================================
function deviationRisk(magnitude, frequency, impact) {
    const risk = magnitude * frequency * impact;
    const level = risk < 0.1 ? 'low' : risk < 0.3 ? 'medium' : risk < 0.7 ? 'high' : 'critical';
    return {
        risk,
        level,
        provenance: [`[ALG_B_024] risk=${risk.toFixed(4)} level=${level}`],
    };
}
// ============================================================================
// T1·ALG_B_025 · 偏差修正
// ============================================================================
function deviationCorrection(values, deviations) {
    if (values.length !== deviations.length) {
        return { corrected: values, provenance: ['[ALG_B_025] 维度不匹配'] };
    }
    const corrected = values.map((v, i) => v - deviations[i]);
    return {
        corrected,
        provenance: [`[ALG_B_025] n=${corrected.length}`],
    };
}
// ============================================================================
// T1·ALG_B_026 · 偏差补偿
// ============================================================================
function deviationCompensation(target, current, compensationRate = 0.5) {
    const deviation = target - current;
    const compensation = deviation * compensationRate;
    const compensated = current + compensation;
    return {
        compensated,
        remainingDeviation: target - compensated,
        provenance: [`[ALG_B_026] comp=${compensation.toFixed(4)} remain=${(target - compensated).toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_B_027 · 偏差校准
// ============================================================================
function deviationCalibration(measurements, standards) {
    if (measurements.length !== standards.length) {
        return { calibrationFactors: [], calibrated: measurements, provenance: ['[ALG_B_027] 维度不匹配'] };
    }
    const calibrationFactors = measurements.map((m, i) => (m === 0 ? 1 : standards[i] / m));
    const calibrated = measurements.map((m, i) => m * calibrationFactors[i]);
    return {
        calibrationFactors,
        calibrated,
        provenance: [`[ALG_B_027] n=${calibrated.length}`],
    };
}
// ============================================================================
// T1·ALG_B_028 · 偏差监控
// ============================================================================
function deviationMonitor(history, alertThreshold = 0.1) {
    if (history.length === 0) {
        return { status: 'normal', latestDeviation: 0, provenance: ['[ALG_B_028] 无数据'] };
    }
    const latest = history[history.length - 1].deviation;
    const status = latest < alertThreshold ? 'normal' : latest < alertThreshold * 2 ? 'warning' : 'critical';
    return {
        status,
        latestDeviation: latest,
        provenance: [`[ALG_B_028] latest=${latest.toFixed(4)} status=${status}`],
    };
}
// ============================================================================
// T1·ALG_B_029 · 偏差报告生成
// ============================================================================
function deviationReport(deviations) {
    const critical = deviations.filter(d => Math.abs(d.value) > d.threshold);
    const lines = critical.map(d => `[CRITICAL] ${d.name}: ${d.value.toFixed(4)} (阈值 ${d.threshold}) → ${d.impact}`);
    const report = lines.length === 0
        ? '[OK] 所有偏差在阈值内'
        : `[REPORT] 发现 ${critical.length} 个超阈值偏差:\n${lines.join('\n')}`;
    return {
        report,
        criticalCount: critical.length,
        provenance: [`[ALG_B_029] critical=${critical.length} total=${deviations.length}`],
    };
}
// ============================================================================
// T1·ALG_B_030 · 偏差预警
// ============================================================================
function deviationEarlyWarning(trend, currentValue, threshold, timeToThreshold) {
    if (trend.slope <= 0) {
        return { willBreach: false, estimatedBreachTime: Infinity, provenance: ['[ALG_B_030] 趋势稳定或下降'] };
    }
    const remaining = threshold - currentValue;
    if (remaining <= 0) {
        return { willBreach: true, estimatedBreachTime: 0, provenance: ['[ALG_B_030] 已超阈值'] };
    }
    const estimatedBreachTime = remaining / trend.slope;
    return {
        willBreach: estimatedBreachTime < timeToThreshold,
        estimatedBreachTime,
        provenance: [`[ALG_B_030] breachIn=${estimatedBreachTime.toFixed(2)} willBreach=${estimatedBreachTime < timeToThreshold}`],
    };
}
