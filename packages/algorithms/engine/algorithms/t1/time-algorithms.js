"use strict";
/**
 * MetaGO Engine - A5 T1 算法 · 时空类（第二批）
 *
 * 对应属性：时序推理 / 空间智能 / 时间箭头
 * 对应文档：附录A·T1·TIME（ALG_T1_T_001 ~ ALG_T1_T_015）
 *
 * 算法清单（15 个）：
 *   001 时间序列预测    002 时序模式识别    003 时间箭头判定
 *   004 空间距离计算    005 时空插值        006 周期检测
 *   007 趋势分析        008 季节性分解      009 时间窗口聚合
 *   010 时空聚类        011 时序异常检测    012 时间衰减记忆
 *   013 因果时序推断    014 时间一致性校验  015 时空路径优化
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeSeriesForecast = timeSeriesForecast;
exports.temporalPatternRecognition = temporalPatternRecognition;
exports.timeArrowDetermination = timeArrowDetermination;
exports.spatialDistance = spatialDistance;
exports.spatiotemporalInterpolation = spatiotemporalInterpolation;
exports.periodicityDetection = periodicityDetection;
exports.trendAnalysis = trendAnalysis;
exports.seasonalDecomposition = seasonalDecomposition;
exports.timeWindowAggregation = timeWindowAggregation;
exports.spatiotemporalClustering = spatiotemporalClustering;
exports.temporalAnomalyDetection = temporalAnomalyDetection;
exports.timeDecayMemory = timeDecayMemory;
exports.causalTemporalInference = causalTemporalInference;
exports.temporalConsistencyCheck = temporalConsistencyCheck;
exports.spatiotemporalPathOptimization = spatiotemporalPathOptimization;
// ============================================================================
// T1·ALG_T1_T_001 · 时间序列预测（线性回归外推）
// ============================================================================
function timeSeriesForecast(series, horizon = 1) {
    if (series.length < 2 || horizon <= 0) {
        return { forecast: [], slope: 0, rSquared: 0, provenance: ['[ALG_T1_T_001] 数据点不足或步长无效'] };
    }
    const n = series.length;
    const sumT = series.reduce((s, p) => s + p.timestamp, 0);
    const sumV = series.reduce((s, p) => s + p.value, 0);
    const sumTV = series.reduce((s, p) => s + p.timestamp * p.value, 0);
    const sumTT = series.reduce((s, p) => s + p.timestamp * p.timestamp, 0);
    const meanT = sumT / n;
    const meanV = sumV / n;
    const denom = sumTT - n * meanT * meanT;
    const slope = denom === 0 ? 0 : (sumTV - n * meanT * meanV) / denom;
    const intercept = meanV - slope * meanT;
    // R²
    let ssRes = 0, ssTot = 0;
    for (const p of series) {
        const pred = intercept + slope * p.timestamp;
        ssRes += (p.value - pred) ** 2;
        ssTot += (p.value - meanV) ** 2;
    }
    const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
    const lastTs = series[n - 1].timestamp;
    const step = series.length > 1 ? series[n - 1].timestamp - series[n - 2].timestamp : 1;
    const forecast = [];
    for (let i = 1; i <= horizon; i++) {
        forecast.push({ timestamp: lastTs + i * step, value: intercept + slope * (lastTs + i * step) });
    }
    return {
        forecast,
        slope,
        rSquared,
        provenance: [`[ALG_T1_T_001] n=${n} horizon=${horizon} slope=${slope.toFixed(4)} r²=${rSquared.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_002 · 时序模式识别（自相关）
// ============================================================================
function temporalPatternRecognition(series, maxLag = 10) {
    if (series.length < 2 || maxLag <= 0) {
        return { autocorrelations: [], dominantLag: 0, periodic: false, provenance: ['[ALG_T1_T_002] 数据不足'] };
    }
    const n = series.length;
    const mean = series.reduce((s, x) => s + x, 0) / n;
    const variance = series.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
    if (variance === 0) {
        return { autocorrelations: new Array(maxLag).fill(0), dominantLag: 0, periodic: false, provenance: ['[ALG_T1_T_002] 方差为0'] };
    }
    const autocorrelations = [];
    const lagLimit = Math.min(maxLag, n - 1);
    for (let lag = 1; lag <= lagLimit; lag++) {
        let cov = 0;
        for (let i = 0; i < n - lag; i++)
            cov += (series[i] - mean) * (series[i + lag] - mean);
        autocorrelations.push(cov / ((n - lag) * variance));
    }
    let dominantLag = 0;
    let maxACF = 0;
    for (let i = 0; i < autocorrelations.length; i++) {
        if (Math.abs(autocorrelations[i]) > Math.abs(maxACF)) {
            maxACF = autocorrelations[i];
            dominantLag = i + 1;
        }
    }
    const periodic = maxACF > 0.5 && dominantLag > 0;
    return {
        autocorrelations,
        dominantLag,
        periodic,
        provenance: [`[ALG_T1_T_002] n=${n} maxLag=${lagLimit} dominant=${dominantLag} acf=${maxACF.toFixed(4)} periodic=${periodic}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_003 · 时间箭头判定（熵增方向）
// ============================================================================
function timeArrowDetermination(states) {
    if (states.length < 2) {
        return { arrow: 'static', entropyDelta: 0, confidence: 0, provenance: ['[ALG_T1_T_003] 状态不足'] };
    }
    let totalDelta = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    for (let i = 1; i < states.length; i++) {
        const delta = states[i].entropy - states[i - 1].entropy;
        totalDelta += delta;
        if (delta > 0)
            positiveCount++;
        else if (delta < 0)
            negativeCount++;
    }
    const avgDelta = totalDelta / (states.length - 1);
    const total = positiveCount + negativeCount;
    const confidence = total === 0 ? 0 : Math.abs(positiveCount - negativeCount) / total;
    let arrow;
    if (Math.abs(avgDelta) < 1e-9)
        arrow = 'static';
    else if (avgDelta > 0)
        arrow = 'forward';
    else
        arrow = 'backward';
    return {
        arrow,
        entropyDelta: avgDelta,
        confidence,
        provenance: [`[ALG_T1_T_003] states=${states.length} arrow=${arrow} delta=${avgDelta.toFixed(6)} conf=${confidence.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_004 · 空间距离计算
// ============================================================================
function spatialDistance(a, b, metric = 'euclidean') {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = (a.z ?? 0) - (b.z ?? 0);
    let distance;
    switch (metric) {
        case 'euclidean':
            distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            break;
        case 'manhattan':
            distance = Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
            break;
        case 'chebyshev':
            distance = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
            break;
        case 'haversine':
            // x=lat, y=lon（度），假设球面
            const R = 6371;
            const lat1 = a.x * Math.PI / 180, lat2 = b.x * Math.PI / 180;
            const dLat = lat2 - lat1;
            const dLon = (b.y - a.y) * Math.PI / 180;
            const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
            distance = 2 * R * Math.asin(Math.sqrt(h));
            break;
        default:
            distance = 0;
    }
    return {
        distance,
        metric,
        provenance: [`[ALG_T1_T_004] metric=${metric} dist=${distance.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_005 · 时空插值（IDW 反距离加权）
// ============================================================================
function spatiotemporalInterpolation(known, target, power = 2) {
    if (known.length === 0) {
        return { value: 0, weights: [], provenance: ['[ALG_T1_T_005] 无已知点'] };
    }
    const weights = [];
    let weightSum = 0;
    let weightedValue = 0;
    for (const k of known) {
        const dist = spatialDistance(k.point, target.point, 'euclidean').distance;
        const timeDist = Math.abs(k.time - target.time);
        // 时空距离的幂
        const totalDist = Math.sqrt(dist * dist + timeDist * timeDist);
        const weight = totalDist === 0 ? Infinity : 1 / Math.pow(totalDist, power);
        weights.push(weight);
        weightSum += weight;
        weightedValue += weight * k.value;
    }
    // 如果有无穷大权重（目标点与已知点重合），取该点值
    if (!isFinite(weightSum)) {
        for (let i = 0; i < known.length; i++) {
            if (!isFinite(weights[i])) {
                return { value: known[i].value, weights, provenance: [`[ALG_T1_T_005] exactMatch idx=${i} value=${known[i].value.toFixed(4)}`] };
            }
        }
    }
    const value = weightSum === 0 ? 0 : weightedValue / weightSum;
    return {
        value,
        weights,
        provenance: [`[ALG_T1_T_005] known=${known.length} power=${power} value=${value.toFixed(4)} weightSum=${weightSum.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_006 · 周期检测（FFT 简化版）
// ============================================================================
function periodicityDetection(series) {
    const n = series.length;
    if (n < 4) {
        return { period: 0, strength: 0, spectrum: [], provenance: ['[ALG_T1_T_006] 数据不足'] };
    }
    // 离散傅里叶变换（仅计算前半频谱）
    const halfN = Math.floor(n / 2);
    const spectrum = [];
    for (let k = 1; k <= halfN; k++) {
        let real = 0, imag = 0;
        for (let t = 0; t < n; t++) {
            const angle = -2 * Math.PI * k * t / n;
            real += series[t] * Math.cos(angle);
            imag += series[t] * Math.sin(angle);
        }
        const mag = Math.sqrt(real * real + imag * imag) / n;
        spectrum.push({ freq: k, mag });
    }
    // 找到最大幅值对应的频率
    let maxMag = 0;
    let maxFreq = 0;
    for (const s of spectrum) {
        if (s.mag > maxMag) {
            maxMag = s.mag;
            maxFreq = s.freq;
        }
    }
    const period = maxFreq === 0 ? 0 : n / maxFreq;
    // 强度 = 最大幅值 / 平均幅值
    const avgMag = spectrum.reduce((s, x) => s + x.mag, 0) / spectrum.length;
    const strength = avgMag === 0 ? 0 : maxMag / avgMag;
    return {
        period,
        strength,
        spectrum,
        provenance: [`[ALG_T1_T_006] n=${n} period=${period.toFixed(4)} strength=${strength.toFixed(4)} freq=${maxFreq}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_007 · 趋势分析（Mann-Kendall 简化）
// ============================================================================
function trendAnalysis(series) {
    const n = series.length;
    if (n < 3) {
        return { trend: 'no-trend', slope: 0, significance: 0, provenance: ['[ALG_T1_T_007] 数据不足'] };
    }
    // Mann-Kendall S 统计量
    let s = 0;
    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
            s += series[j] > series[i] ? 1 : (series[j] < series[i] ? -1 : 0);
        }
    }
    // Sen 斜率
    const slopes = [];
    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
            slopes.push((series[j] - series[i]) / (j - i));
        }
    }
    slopes.sort((a, b) => a - b);
    const slope = slopes.length % 2 === 0
        ? (slopes[slopes.length / 2 - 1] + slopes[slopes.length / 2]) / 2
        : slopes[Math.floor(slopes.length / 2)];
    // 方差与显著性
    const variance = n * (n - 1) * (2 * n + 5) / 18;
    const z = variance === 0 ? 0 : s / Math.sqrt(variance);
    const significance = Math.abs(z);
    let trend;
    if (z > 1.96)
        trend = 'increasing';
    else if (z < -1.96)
        trend = 'decreasing';
    else
        trend = 'no-trend';
    return {
        trend,
        slope,
        significance,
        provenance: [`[ALG_T1_T_007] n=${n} s=${s} z=${z.toFixed(4)} slope=${slope.toFixed(4)} trend=${trend}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_008 · 季节性分解（移动平均）
// ============================================================================
function seasonalDecomposition(series, period) {
    const n = series.length;
    if (n < period * 2 || period <= 0) {
        return { trend: [], seasonal: [], residual: [], provenance: ['[ALG_T1_T_008] 数据不足或周期无效'] };
    }
    // 趋势：中心化移动平均
    const halfP = Math.floor(period / 2);
    const trend = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        let sum = 0, count = 0;
        for (let j = i - halfP; j <= i + halfP; j++) {
            if (j >= 0 && j < n) {
                sum += series[j];
                count++;
            }
        }
        trend[i] = count === 0 ? series[i] : sum / count;
    }
    // 去趋势
    const detrended = series.map((v, i) => v - trend[i]);
    // 季节分量：每个季节位置的平均
    const seasonal = new Array(n).fill(0);
    const seasonalAvg = new Array(period).fill(0);
    const seasonalCount = new Array(period).fill(0);
    for (let i = 0; i < n; i++) {
        const seasonIdx = i % period;
        seasonalAvg[seasonIdx] += detrended[i];
        seasonalCount[seasonIdx]++;
    }
    for (let p = 0; p < period; p++) {
        seasonalAvg[p] = seasonalCount[p] === 0 ? 0 : seasonalAvg[p] / seasonalCount[p];
    }
    // 归一化季节分量（使均值为0）
    const seasonalMean = seasonalAvg.reduce((s, x) => s + x, 0) / period;
    for (let p = 0; p < period; p++)
        seasonalAvg[p] -= seasonalMean;
    for (let i = 0; i < n; i++)
        seasonal[i] = seasonalAvg[i % period];
    // 残差
    const residual = series.map((v, i) => v - trend[i] - seasonal[i]);
    return {
        trend,
        seasonal,
        residual,
        provenance: [`[ALG_T1_T_008] n=${n} period=${period} residualVariance=${(residual.reduce((s, x) => s + x * x, 0) / n).toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_009 · 时间窗口聚合
// ============================================================================
function timeWindowAggregation(series, windowSize, aggregation = 'mean') {
    if (series.length === 0 || windowSize <= 0) {
        return { windows: [], provenance: ['[ALG_T1_T_009] 空数据或窗口无效'] };
    }
    const sorted = [...series].sort((a, b) => a.timestamp - b.timestamp);
    const minTs = sorted[0].timestamp;
    const maxTs = sorted[sorted.length - 1].timestamp;
    const windows = [];
    for (let wStart = minTs; wStart <= maxTs; wStart += windowSize) {
        const wEnd = wStart + windowSize;
        const inWindow = sorted.filter(p => p.timestamp >= wStart && p.timestamp < wEnd);
        if (inWindow.length === 0)
            continue;
        let value;
        switch (aggregation) {
            case 'sum':
                value = inWindow.reduce((s, p) => s + p.value, 0);
                break;
            case 'mean':
                value = inWindow.reduce((s, p) => s + p.value, 0) / inWindow.length;
                break;
            case 'min':
                value = Math.min(...inWindow.map(p => p.value));
                break;
            case 'max':
                value = Math.max(...inWindow.map(p => p.value));
                break;
            case 'count':
                value = inWindow.length;
                break;
            default: value = 0;
        }
        windows.push({ start: wStart, end: wEnd, value, count: inWindow.length });
    }
    return {
        windows,
        provenance: [`[ALG_T1_T_009] series=${series.length} windowSize=${windowSize} agg=${aggregation} windows=${windows.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_010 · 时空聚类（DBSCAN 简化）
// ============================================================================
function spatiotemporalClustering(points, eps = 1.0, minPts = 3) {
    if (points.length === 0 || eps <= 0 || minPts <= 0) {
        return { clusters: [], noise: [], clusterCount: 0, provenance: ['[ALG_T1_T_010] 空输入或参数无效'] };
    }
    const n = points.length;
    const visited = new Array(n).fill(false);
    const clusterLabel = new Array(n).fill(-1); // -1 = unclassified, -2 = noise
    let clusterId = 0;
    // 预计算距离
    const dist = (i, j) => {
        const dx = points[i].point.x - points[j].point.x;
        const dy = points[i].point.y - points[j].point.y;
        const dz = (points[i].point.z ?? 0) - (points[j].point.z ?? 0);
        const dt = points[i].time - points[j].time;
        return Math.sqrt(dx * dx + dy * dy + dz * dz + dt * dt);
    };
    const regionQuery = (idx) => {
        const neighbors = [];
        for (let i = 0; i < n; i++) {
            if (dist(idx, i) <= eps)
                neighbors.push(i);
        }
        return neighbors;
    };
    for (let i = 0; i < n; i++) {
        if (visited[i])
            continue;
        visited[i] = true;
        const neighbors = regionQuery(i);
        if (neighbors.length < minPts) {
            clusterLabel[i] = -2;
            continue;
        }
        clusterLabel[i] = clusterId;
        const queue = [...neighbors].filter(x => x !== i);
        while (queue.length > 0) {
            const q = queue.shift();
            if (!visited[q]) {
                visited[q] = true;
                const qNeighbors = regionQuery(q);
                if (qNeighbors.length >= minPts) {
                    for (const qn of qNeighbors) {
                        if (!queue.includes(qn) && clusterLabel[qn] === -1)
                            queue.push(qn);
                    }
                }
            }
            if (clusterLabel[q] === -1 || clusterLabel[q] === -2)
                clusterLabel[q] = clusterId;
        }
        clusterId++;
    }
    const clusters = [];
    const noise = [];
    for (let c = 0; c < clusterId; c++) {
        clusters.push(points.filter((_, i) => clusterLabel[i] === c).map(p => p.id));
    }
    for (let i = 0; i < n; i++) {
        if (clusterLabel[i] === -2)
            noise.push(points[i].id);
    }
    return {
        clusters,
        noise,
        clusterCount: clusterId,
        provenance: [`[ALG_T1_T_010] points=${n} eps=${eps} minPts=${minPts} clusters=${clusterId} noise=${noise.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_011 · 时序异常检测（Z-score + IQR）
// ============================================================================
function temporalAnomalyDetection(series, method = 'zscore', threshold = 3) {
    const n = series.length;
    if (n < 4) {
        return { anomalies: [], anomalyIndices: [], threshold, provenance: ['[ALG_T1_T_011] 数据不足'] };
    }
    const anomalies = [];
    const anomalyIndices = [];
    if (method === 'zscore') {
        const mean = series.reduce((s, x) => s + x, 0) / n;
        const variance = series.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
        const std = Math.sqrt(variance);
        if (std === 0) {
            return { anomalies: [], anomalyIndices: [], threshold, provenance: ['[ALG_T1_T_011] 标准差为0'] };
        }
        for (let i = 0; i < n; i++) {
            const z = Math.abs((series[i] - mean) / std);
            if (z > threshold) {
                anomalies.push(series[i]);
                anomalyIndices.push(i);
            }
        }
    }
    else {
        const sorted = [...series].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(n * 0.25)];
        const q3 = sorted[Math.floor(n * 0.75)];
        const iqr = q3 - q1;
        const lower = q1 - threshold * iqr;
        const upper = q3 + threshold * iqr;
        for (let i = 0; i < n; i++) {
            if (series[i] < lower || series[i] > upper) {
                anomalies.push(series[i]);
                anomalyIndices.push(i);
            }
        }
    }
    return {
        anomalies,
        anomalyIndices,
        threshold,
        provenance: [`[ALG_T1_T_011] n=${n} method=${method} threshold=${threshold} anomalies=${anomalyIndices.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_012 · 时间衰减记忆（指数衰减）
// ============================================================================
function timeDecayMemory(memories, currentTime, halfLife = 86400) {
    if (memories.length === 0 || halfLife <= 0) {
        return { retained: [], provenance: ['[ALG_T1_T_012] 空记忆或半衰期无效'] };
    }
    const retained = memories.map(m => {
        const age = Math.max(0, currentTime - m.timestamp);
        const decayFactor = Math.pow(0.5, age / halfLife);
        // 访问次数增强记忆
        const accessBoost = 1 + Math.log10(1 + m.accessCount) * 0.1;
        const strength = m.importance * decayFactor * accessBoost;
        return { id: m.id, strength, rank: 0 };
    });
    retained.sort((a, b) => b.strength - a.strength);
    retained.forEach((r, i) => r.rank = i + 1);
    return {
        retained,
        provenance: [`[ALG_T1_T_012] memories=${memories.length} halfLife=${halfLife} top="${retained[0]?.id ?? 'none'}" strength=${retained[0]?.strength.toFixed(4) ?? 0}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_013 · 因果时序推断（Granger 简化）
// ============================================================================
function causalTemporalInference(cause, effect, maxLag = 5) {
    const n = Math.min(cause.length, effect.length);
    if (n < maxLag + 3 || maxLag <= 0) {
        return { bestLag: 0, causalityScore: 0, significant: false, provenance: ['[ALG_T1_T_013] 数据不足'] };
    }
    let bestLag = 0;
    let bestScore = 0;
    for (let lag = 1; lag <= maxLag; lag++) {
        // 计算 cause[t-lag] 与 effect[t] 的互相关
        let covCE = 0, covCC = 0, covEE = 0;
        const meanC = cause.slice(0, n - lag).reduce((s, x) => s + x, 0) / (n - lag);
        const meanE = effect.slice(lag).reduce((s, x) => s + x, 0) / (n - lag);
        for (let t = lag; t < n; t++) {
            covCE += (cause[t - lag] - meanC) * (effect[t] - meanE);
            covCC += (cause[t - lag] - meanC) ** 2;
            covEE += (effect[t] - meanE) ** 2;
        }
        covCE /= (n - lag);
        covCC /= (n - lag);
        covEE /= (n - lag);
        const denom = Math.sqrt(covCC * covEE);
        const corr = denom === 0 ? 0 : covCE / denom;
        if (Math.abs(corr) > Math.abs(bestScore)) {
            bestScore = corr;
            bestLag = lag;
        }
    }
    return {
        bestLag,
        causalityScore: bestScore,
        significant: Math.abs(bestScore) > 0.5,
        provenance: [`[ALG_T1_T_013] n=${n} maxLag=${maxLag} bestLag=${bestLag} score=${bestScore.toFixed(4)} significant=${Math.abs(bestScore) > 0.5}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_014 · 时间一致性校验
// ============================================================================
function temporalConsistencyCheck(events) {
    if (events.length === 0) {
        return { consistent: true, violations: [], provenance: ['[ALG_T1_T_014] 空事件'] };
    }
    const eventMap = new Map(events.map(e => [e.id, e]));
    const violations = [];
    for (const e of events) {
        for (const dep of e.dependencies) {
            const depEvent = eventMap.get(dep.eventId);
            if (!depEvent) {
                violations.push({ eventId: e.id, dependencyId: dep.eventId, type: 'missing' });
                continue;
            }
            switch (dep.type) {
                case 'before':
                    if (e.timestamp >= depEvent.timestamp) {
                        violations.push({ eventId: e.id, dependencyId: dep.eventId, type: 'before-violated' });
                    }
                    break;
                case 'after':
                    if (e.timestamp <= depEvent.timestamp) {
                        violations.push({ eventId: e.id, dependencyId: dep.eventId, type: 'after-violated' });
                    }
                    break;
                case 'simultaneous':
                    if (Math.abs(e.timestamp - depEvent.timestamp) > 1) {
                        violations.push({ eventId: e.id, dependencyId: dep.eventId, type: 'simultaneous-violated' });
                    }
                    break;
            }
        }
    }
    return {
        consistent: violations.length === 0,
        violations,
        provenance: [`[ALG_T1_T_014] events=${events.length} violations=${violations.length} consistent=${violations.length === 0}`],
    };
}
// ============================================================================
// T1·ALG_T1_T_015 · 时空路径优化（最近邻 TSP 启发式）
// ============================================================================
function spatiotemporalPathOptimization(start, destinations) {
    if (destinations.length === 0) {
        return { path: [], totalDistance: 0, totalTime: 0, provenance: ['[ALG_T1_T_015] 无目的地'] };
    }
    // 贪心最近邻：每步选择时间窗口内可达的最近点
    const remaining = [...destinations];
    const path = [];
    let current = start;
    let totalDistance = 0;
    let totalTime = 0;
    while (remaining.length > 0) {
        let bestIdx = -1;
        let bestScore = Infinity;
        for (let i = 0; i < remaining.length; i++) {
            const d = remaining[i];
            const dist = spatialDistance(current.point, d.point, 'euclidean').distance;
            const timeDiff = Math.abs(d.time - current.time);
            // 分数 = 距离 + 时间差 - 优先级奖励
            const score = dist + timeDiff * 0.1 - d.priority * 10;
            if (score < bestScore) {
                bestScore = score;
                bestIdx = i;
            }
        }
        if (bestIdx < 0)
            break;
        const next = remaining[bestIdx];
        const dist = spatialDistance(current.point, next.point, 'euclidean').distance;
        totalDistance += dist;
        totalTime += Math.abs(next.time - current.time);
        path.push(next.id);
        current = { point: next.point, time: next.time };
        remaining.splice(bestIdx, 1);
    }
    return {
        path,
        totalDistance,
        totalTime,
        provenance: [`[ALG_T1_T_015] destinations=${destinations.length} path=${path.length} dist=${totalDistance.toFixed(4)} time=${totalTime}`],
    };
}
