"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 时空引擎封装类（ALG_T2_T_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateTimeWindow = aggregateTimeWindow;
exports.timeSeriesTrend = timeSeriesTrend;
exports.detectSeasonality = detectSeasonality;
exports.detectTimeAnomaly = detectTimeAnomaly;
exports.analyzeTimeInterval = analyzeTimeInterval;
exports.forecastTimeSeries = forecastTimeSeries;
exports.smoothTimeSeries = smoothTimeSeries;
exports.diffTimeSeries = diffTimeSeries;
exports.autocorrelation = autocorrelation;
exports.slidingWindow = slidingWindow;
exports.decomposeTimeSeries = decomposeTimeSeries;
exports.resampleTimeSeries = resampleTimeSeries;
exports.alignTimestamps = alignTimestamps;
exports.normalizeTimeSeries = normalizeTimeSeries;
exports.crossCorrelation = crossCorrelation;
exports.detectPeriod = detectPeriod;
exports.fillMissingTime = fillMissingTime;
exports.truncateTimeSeries = truncateTimeSeries;
exports.timeSeriesStatistics = timeSeriesStatistics;
exports.comprehensiveTimeAssessment = comprehensiveTimeAssessment;
// ALG_T2_T_001 · 时间窗口聚合
function aggregateTimeWindow(series, windowMs, aggFn = (v) => v.reduce((s, x) => s + x, 0) / v.length) {
    if (series.timestamps.length === 0) {
        return { windows: [], counts: [], provenance: ['[ALG_T2_T_001] 空序列'] };
    }
    const start = series.timestamps[0];
    const end = series.timestamps[series.timestamps.length - 1];
    const windows = [];
    const counts = [];
    for (let wStart = start; wStart <= end; wStart += windowMs) {
        const wEnd = wStart + windowMs;
        const vals = [];
        for (let i = 0; i < series.timestamps.length; i++) {
            if (series.timestamps[i] >= wStart && series.timestamps[i] < wEnd) {
                vals.push(series.values[i]);
            }
        }
        windows.push(vals.length === 0 ? 0 : aggFn(vals));
        counts.push(vals.length);
    }
    return {
        windows,
        counts,
        provenance: [`[ALG_T2_T_001] windows=${windows.length} windowMs=${windowMs}`],
    };
}
// ALG_T2_T_002 · 时间序列趋势
function timeSeriesTrend(series) {
    const n = series.timestamps.length;
    if (n < 2) {
        return { slope: 0, trend: 'stable', provenance: ['[ALG_T2_T_002] 数据不足'] };
    }
    const sumX = series.timestamps.reduce((s, x) => s + x, 0);
    const sumY = series.values.reduce((s, x) => s + x, 0);
    const sumXY = series.timestamps.reduce((s, x, i) => s + x * series.values[i], 0);
    const sumX2 = series.timestamps.reduce((s, x) => s + x * x, 0);
    const denom = n * sumX2 - sumX * sumX;
    const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    const trend = slope > 0.001 ? 'rising' : slope < -0.001 ? 'falling' : 'stable';
    return {
        slope,
        trend,
        provenance: [`[ALG_T2_T_002] slope=${slope.toFixed(6)} trend=${trend}`],
    };
}
// ALG_T2_T_003 · 时间序列季节性
function detectSeasonality(series, minPeriod = 2) {
    const n = series.values.length;
    if (n < minPeriod * 2) {
        return { period: 0, strength: 0, provenance: ['[ALG_T2_T_003] 数据不足'] };
    }
    let bestPeriod = 0;
    let bestStrength = 0;
    for (let p = minPeriod; p <= Math.floor(n / 2); p++) {
        let sum = 0;
        let count = 0;
        for (let i = 0; i < n - p; i++) {
            sum += series.values[i] * series.values[i + p];
            count++;
        }
        const strength = count === 0 ? 0 : Math.abs(sum / count);
        if (strength > bestStrength) {
            bestStrength = strength;
            bestPeriod = p;
        }
    }
    return {
        period: bestPeriod,
        strength: bestStrength,
        provenance: [`[ALG_T2_T_003] period=${bestPeriod} strength=${bestStrength.toFixed(4)}`],
    };
}
// ALG_T2_T_004 · 时间序列异常
function detectTimeAnomaly(series, zThreshold = 2.5) {
    const n = series.values.length;
    if (n === 0) {
        return { anomalies: [], zScores: [], provenance: ['[ALG_T2_T_004] 空序列'] };
    }
    const mean = series.values.reduce((s, x) => s + x, 0) / n;
    const variance = series.values.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    const anomalies = [];
    const zScores = [];
    for (let i = 0; i < n; i++) {
        const z = std === 0 ? 0 : (series.values[i] - mean) / std;
        zScores.push(z);
        if (Math.abs(z) > zThreshold)
            anomalies.push(i);
    }
    return {
        anomalies,
        zScores,
        provenance: [`[ALG_T2_T_004] anomalies=${anomalies.length} zThresh=${zThreshold}`],
    };
}
// ALG_T2_T_005 · 时间间隔分析
function analyzeTimeInterval(timestamps) {
    if (timestamps.length < 2) {
        return { mean: 0, std: 0, cv: 0, provenance: ['[ALG_T2_T_005] 不足2点'] };
    }
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    const mean = intervals.reduce((s, x) => s + x, 0) / intervals.length;
    const variance = intervals.reduce((s, x) => s + (x - mean) ** 2, 0) / intervals.length;
    const std = Math.sqrt(variance);
    const cv = mean === 0 ? 0 : std / Math.abs(mean);
    return {
        mean,
        std,
        cv,
        provenance: [`[ALG_T2_T_005] mean=${mean.toFixed(2)} std=${std.toFixed(2)} cv=${cv.toFixed(4)}`],
    };
}
// ALG_T2_T_006 · 时间序列预测
function forecastTimeSeries(series, steps) {
    const n = series.values.length;
    if (n < 2 || steps <= 0) {
        return { forecast: [], confidence: 0, provenance: ['[ALG_T2_T_006] 数据/步数不足'] };
    }
    const trend = timeSeriesTrend(series);
    const lastX = series.timestamps[n - 1];
    const lastY = series.values[n - 1];
    const interval = (series.timestamps[n - 1] - series.timestamps[0]) / (n - 1);
    const forecast = [];
    for (let i = 1; i <= steps; i++) {
        const nextX = lastX + interval * i;
        const nextY = lastY + trend.slope * (nextX - lastX);
        forecast.push(nextY);
    }
    const residuals = series.values.map((y, i) => y - (trend.slope * series.timestamps[i] + (lastY - trend.slope * lastX)));
    const residualVar = residuals.reduce((s, r) => s + r * r, 0) / n;
    const confidence = Math.max(0, 1 - Math.sqrt(residualVar));
    return {
        forecast,
        confidence,
        provenance: [`[ALG_T2_T_006] steps=${steps} conf=${confidence.toFixed(4)}`],
    };
}
// ALG_T2_T_007 · 时间序列平滑
function smoothTimeSeries(values, windowSize = 3) {
    if (values.length === 0 || windowSize <= 0) {
        return { smoothed: [], provenance: ['[ALG_T2_T_007] 空数据或窗口<=0'] };
    }
    const smoothed = [];
    const half = Math.floor(windowSize / 2);
    for (let i = 0; i < values.length; i++) {
        let sum = 0;
        let count = 0;
        for (let j = Math.max(0, i - half); j <= Math.min(values.length - 1, i + half); j++) {
            sum += values[j];
            count++;
        }
        smoothed.push(sum / count);
    }
    return {
        smoothed,
        provenance: [`[ALG_T2_T_007] n=${values.length} window=${windowSize}`],
    };
}
// ALG_T2_T_008 · 时间序列差分
function diffTimeSeries(values, lag = 1) {
    if (values.length <= lag) {
        return { diff: [], provenance: ['[ALG_T2_T_008] 数据不足'] };
    }
    const diff = [];
    for (let i = lag; i < values.length; i++) {
        diff.push(values[i] - values[i - lag]);
    }
    return {
        diff,
        provenance: [`[ALG_T2_T_008] n=${values.length} lag=${lag} diff=${diff.length}`],
    };
}
// ALG_T2_T_009 · 时间序列自相关
function autocorrelation(values, maxLag = 10) {
    const n = values.length;
    if (n < 2) {
        return { acf: [], peakLag: 0, provenance: ['[ALG_T2_T_009] 数据不足'] };
    }
    const mean = values.reduce((s, x) => s + x, 0) / n;
    const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
    const acf = [];
    let peakLag = 0;
    let peakVal = -1;
    const maxL = Math.min(maxLag, n - 1);
    for (let lag = 0; lag <= maxL; lag++) {
        let sum = 0;
        for (let i = 0; i < n - lag; i++) {
            sum += (values[i] - mean) * (values[i + lag] - mean);
        }
        const ac = variance === 0 ? 0 : sum / (variance * n);
        acf.push(ac);
        if (lag > 0 && Math.abs(ac) > peakVal) {
            peakVal = Math.abs(ac);
            peakLag = lag;
        }
    }
    return {
        acf,
        peakLag,
        provenance: [`[ALG_T2_T_009] maxLag=${maxLag} peak=${peakLag}`],
    };
}
// ALG_T2_T_010 · 时间窗口滑移
function slidingWindow(values, windowSize, step = 1) {
    if (values.length < windowSize || windowSize <= 0 || step <= 0) {
        return { windows: [], provenance: ['[ALG_T2_T_010] 参数无效'] };
    }
    const windows = [];
    for (let i = 0; i + windowSize <= values.length; i += step) {
        windows.push(values.slice(i, i + windowSize));
    }
    return {
        windows,
        provenance: [`[ALG_T2_T_010] windows=${windows.length} size=${windowSize} step=${step}`],
    };
}
// ALG_T2_T_011 · 时间序列分解
function decomposeTimeSeries(values, period) {
    const n = values.length;
    if (n < period * 2 || period <= 0) {
        return {
            trend: new Array(n).fill(0),
            seasonal: new Array(n).fill(0),
            residual: [...values],
            provenance: ['[ALG_T2_T_011] 数据不足或周期无效'],
        };
    }
    const trend = new Array(n).fill(0);
    const half = Math.floor(period / 2);
    for (let i = 0; i < n; i++) {
        let sum = 0;
        let count = 0;
        for (let j = Math.max(0, i - half); j <= Math.min(n - 1, i + half); j++) {
            sum += values[j];
            count++;
        }
        trend[i] = sum / count;
    }
    const detrended = values.map((v, i) => v - trend[i]);
    const seasonal = new Array(n).fill(0);
    for (let phase = 0; phase < period; phase++) {
        let sum = 0;
        let count = 0;
        for (let i = phase; i < n; i += period) {
            sum += detrended[i];
            count++;
        }
        const avg = count === 0 ? 0 : sum / count;
        for (let i = phase; i < n; i += period) {
            seasonal[i] = avg;
        }
    }
    const residual = values.map((v, i) => v - trend[i] - seasonal[i]);
    return {
        trend,
        seasonal,
        residual,
        provenance: [`[ALG_T2_T_011] n=${n} period=${period}`],
    };
}
// ALG_T2_T_012 · 时间序列重采样
function resampleTimeSeries(series, newInterval) {
    if (series.timestamps.length === 0 || newInterval <= 0) {
        return { resampled: { timestamps: [], values: [] }, provenance: ['[ALG_T2_T_012] 参数无效'] };
    }
    const start = series.timestamps[0];
    const end = series.timestamps[series.timestamps.length - 1];
    const newTimestamps = [];
    const newValues = [];
    for (let t = start; t <= end; t += newInterval) {
        let sum = 0;
        let count = 0;
        for (let i = 0; i < series.timestamps.length; i++) {
            if (Math.abs(series.timestamps[i] - t) < newInterval / 2) {
                sum += series.values[i];
                count++;
            }
        }
        if (count > 0) {
            newTimestamps.push(t);
            newValues.push(sum / count);
        }
    }
    return {
        resampled: { timestamps: newTimestamps, values: newValues },
        provenance: [`[ALG_T2_T_012] orig=${series.timestamps.length} new=${newTimestamps.length} interval=${newInterval}`],
    };
}
// ALG_T2_T_013 · 时间戳对齐
function alignTimestamps(series1, series2, tolerance = 0) {
    const aligned1 = [];
    const aligned2 = [];
    const timestamps = [];
    const map2 = new Map();
    for (let i = 0; i < series2.timestamps.length; i++) {
        map2.set(series2.timestamps[i], series2.values[i]);
    }
    for (let i = 0; i < series1.timestamps.length; i++) {
        const t = series1.timestamps[i];
        if (tolerance === 0) {
            if (map2.has(t)) {
                aligned1.push(series1.values[i]);
                aligned2.push(map2.get(t));
                timestamps.push(t);
            }
        }
        else {
            for (const [t2, v2] of map2) {
                if (Math.abs(t - t2) <= tolerance) {
                    aligned1.push(series1.values[i]);
                    aligned2.push(v2);
                    timestamps.push(t);
                    break;
                }
            }
        }
    }
    return {
        aligned1,
        aligned2,
        timestamps,
        provenance: [`[ALG_T2_T_013] aligned=${timestamps.length} tol=${tolerance}`],
    };
}
// ALG_T2_T_014 · 时间序列归一化
function normalizeTimeSeries(values, method = 'minmax') {
    if (values.length === 0) {
        return { normalized: [], params: {}, provenance: ['[ALG_T2_T_014] 空'] };
    }
    if (method === 'minmax') {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        return {
            normalized: values.map(v => range === 0 ? 0.5 : (v - min) / range),
            params: { min, max, range },
            provenance: [`[ALG_T2_T_014] method=minmax min=${min} max=${max}`],
        };
    }
    const mean = values.reduce((s, x) => s + x, 0) / values.length;
    const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);
    return {
        normalized: values.map(v => std === 0 ? 0 : (v - mean) / std),
        params: { mean, std },
        provenance: [`[ALG_T2_T_014] method=zscore mean=${mean.toFixed(4)} std=${std.toFixed(4)}`],
    };
}
// ALG_T2_T_015 · 时间序列交叉相关
function crossCorrelation(values1, values2, maxLag = 5) {
    const n = Math.min(values1.length, values2.length);
    if (n < 2) {
        return { ccf: [], peakLag: 0, provenance: ['[ALG_T2_T_015] 数据不足'] };
    }
    const mean1 = values1.slice(0, n).reduce((s, x) => s + x, 0) / n;
    const mean2 = values2.slice(0, n).reduce((s, x) => s + x, 0) / n;
    const std1 = Math.sqrt(values1.slice(0, n).reduce((s, x) => s + (x - mean1) ** 2, 0) / n);
    const std2 = Math.sqrt(values2.slice(0, n).reduce((s, x) => s + (x - mean2) ** 2, 0) / n);
    const ccf = [];
    let peakLag = 0;
    let peakVal = -1;
    for (let lag = -maxLag; lag <= maxLag; lag++) {
        let sum = 0;
        let count = 0;
        for (let i = Math.max(0, lag); i < Math.min(n, n - lag); i++) {
            const j = i + lag;
            if (j >= 0 && j < n) {
                sum += (values1[i] - mean1) * (values2[j] - mean2);
                count++;
            }
        }
        const cc = count === 0 || std1 === 0 || std2 === 0 ? 0 : sum / (count * std1 * std2);
        ccf.push(cc);
        if (Math.abs(cc) > peakVal) {
            peakVal = Math.abs(cc);
            peakLag = lag;
        }
    }
    return {
        ccf,
        peakLag,
        provenance: [`[ALG_T2_T_015] maxLag=${maxLag} peak=${peakLag}`],
    };
}
// ALG_T2_T_016 · 时间序列周期检测
function detectPeriod(values, minPeriod = 2, maxPeriod = 100) {
    const acfResult = autocorrelation(values, maxPeriod);
    let bestPeriod = 0;
    let bestConf = 0;
    for (let i = minPeriod; i < acfResult.acf.length; i++) {
        if (Math.abs(acfResult.acf[i]) > bestConf) {
            bestConf = Math.abs(acfResult.acf[i]);
            bestPeriod = i;
        }
    }
    return {
        period: bestPeriod,
        confidence: bestConf,
        provenance: [`[ALG_T2_T_016] period=${bestPeriod} conf=${bestConf.toFixed(4)}`],
    };
}
// ALG_T2_T_017 · 时间序列填充
function fillMissingTime(series, interval) {
    if (series.timestamps.length === 0 || interval <= 0) {
        return { filled: series, filledCount: 0, provenance: ['[ALG_T2_T_017] 参数无效'] };
    }
    const newTimestamps = [series.timestamps[0]];
    const newValues = [series.values[0]];
    let filledCount = 0;
    for (let i = 1; i < series.timestamps.length; i++) {
        const gap = series.timestamps[i] - series.timestamps[i - 1];
        const steps = Math.round(gap / interval) - 1;
        for (let s = 1; s <= steps; s++) {
            const t = series.timestamps[i - 1] + s * interval;
            const ratio = s / (steps + 1);
            const v = series.values[i - 1] + (series.values[i] - series.values[i - 1]) * ratio;
            newTimestamps.push(t);
            newValues.push(v);
            filledCount++;
        }
        newTimestamps.push(series.timestamps[i]);
        newValues.push(series.values[i]);
    }
    return {
        filled: { timestamps: newTimestamps, values: newValues },
        filledCount,
        provenance: [`[ALG_T2_T_017] orig=${series.timestamps.length} filled=${filledCount}`],
    };
}
// ALG_T2_T_018 · 时间序列截断
function truncateTimeSeries(series, startTime, endTime) {
    const truncated = { timestamps: [], values: [] };
    let removed = 0;
    for (let i = 0; i < series.timestamps.length; i++) {
        if (series.timestamps[i] >= startTime && series.timestamps[i] <= endTime) {
            truncated.timestamps.push(series.timestamps[i]);
            truncated.values.push(series.values[i]);
        }
        else {
            removed++;
        }
    }
    return {
        truncated,
        removed,
        provenance: [`[ALG_T2_T_018] kept=${truncated.timestamps.length} removed=${removed}`],
    };
}
// ALG_T2_T_019 · 时间序列统计
function timeSeriesStatistics(values) {
    if (values.length === 0) {
        return { mean: 0, std: 0, min: 0, max: 0, median: 0, provenance: ['[ALG_T2_T_019] 空'] };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((s, x) => s + x, 0) / values.length;
    const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    return {
        mean,
        std,
        min,
        max,
        median,
        provenance: [`[ALG_T2_T_019] n=${values.length} mean=${mean.toFixed(4)} std=${std.toFixed(4)}`],
    };
}
// ALG_T2_T_020 · 综合时空评估
function comprehensiveTimeAssessment(series) {
    const trend = timeSeriesTrend(series);
    const season = detectSeasonality(series);
    const anomaly = detectTimeAnomaly(series);
    const fc = forecastTimeSeries(series, 3);
    return {
        trend: trend.trend,
        seasonality: season.strength,
        anomalies: anomaly.anomalies.length,
        forecast: fc.forecast,
        provenance: [`[ALG_T2_T_020] trend=${trend.trend} season=${season.strength.toFixed(4)} anomalies=${anomaly.anomalies.length}`],
    };
}
