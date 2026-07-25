/**
 * MetaGO Engine - A5 T2 算法 · 时空引擎封装类（ALG_T2_T_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface TimeInterval {
    start: number;
    end: number;
}
export interface TimeSeries {
    timestamps: number[];
    values: number[];
}
export declare function aggregateTimeWindow(series: TimeSeries, windowMs: number, aggFn?: (vals: number[]) => number): {
    windows: number[];
    counts: number[];
    provenance: string[];
};
export declare function timeSeriesTrend(series: TimeSeries): {
    slope: number;
    trend: 'rising' | 'falling' | 'stable';
    provenance: string[];
};
export declare function detectSeasonality(series: TimeSeries, minPeriod?: number): {
    period: number;
    strength: number;
    provenance: string[];
};
export declare function detectTimeAnomaly(series: TimeSeries, zThreshold?: number): {
    anomalies: number[];
    zScores: number[];
    provenance: string[];
};
export declare function analyzeTimeInterval(timestamps: number[]): {
    mean: number;
    std: number;
    cv: number;
    provenance: string[];
};
export declare function forecastTimeSeries(series: TimeSeries, steps: number): {
    forecast: number[];
    confidence: number;
    provenance: string[];
};
export declare function smoothTimeSeries(values: number[], windowSize?: number): {
    smoothed: number[];
    provenance: string[];
};
export declare function diffTimeSeries(values: number[], lag?: number): {
    diff: number[];
    provenance: string[];
};
export declare function autocorrelation(values: number[], maxLag?: number): {
    acf: number[];
    peakLag: number;
    provenance: string[];
};
export declare function slidingWindow(values: number[], windowSize: number, step?: number): {
    windows: number[][];
    provenance: string[];
};
export declare function decomposeTimeSeries(values: number[], period: number): {
    trend: number[];
    seasonal: number[];
    residual: number[];
    provenance: string[];
};
export declare function resampleTimeSeries(series: TimeSeries, newInterval: number): {
    resampled: TimeSeries;
    provenance: string[];
};
export declare function alignTimestamps(series1: TimeSeries, series2: TimeSeries, tolerance?: number): {
    aligned1: number[];
    aligned2: number[];
    timestamps: number[];
    provenance: string[];
};
export declare function normalizeTimeSeries(values: number[], method?: 'minmax' | 'zscore'): {
    normalized: number[];
    params: Record<string, number>;
    provenance: string[];
};
export declare function crossCorrelation(values1: number[], values2: number[], maxLag?: number): {
    ccf: number[];
    peakLag: number;
    provenance: string[];
};
export declare function detectPeriod(values: number[], minPeriod?: number, maxPeriod?: number): {
    period: number;
    confidence: number;
    provenance: string[];
};
export declare function fillMissingTime(series: TimeSeries, interval: number): {
    filled: TimeSeries;
    filledCount: number;
    provenance: string[];
};
export declare function truncateTimeSeries(series: TimeSeries, startTime: number, endTime: number): {
    truncated: TimeSeries;
    removed: number;
    provenance: string[];
};
export declare function timeSeriesStatistics(values: number[]): {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
    provenance: string[];
};
export declare function comprehensiveTimeAssessment(series: TimeSeries): {
    trend: string;
    seasonality: number;
    anomalies: number;
    forecast: number[];
    provenance: string[];
};
