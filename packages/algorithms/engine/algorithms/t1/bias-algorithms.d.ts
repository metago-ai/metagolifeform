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
export interface DriftSample {
    timestamp: number;
    expected: number[];
    actual: number[];
}
export declare function driftScore(expected: number[], actual: number[]): {
    score: number;
    provenance: string[];
};
export declare function deviationVector(expected: number[], actual: number[]): {
    vector: number[];
    provenance: string[];
};
export declare function deviationDirection(deviation: number[]): {
    directions: ('positive' | 'negative' | 'zero')[];
    dominant: 'positive' | 'negative' | 'zero';
    provenance: string[];
};
export declare function deviationMagnitude(deviation: number[]): {
    magnitude: number;
    maxAbs: number;
    provenance: string[];
};
export declare function deviationTrend(samples: DriftSample[]): {
    slope: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    provenance: string[];
};
export declare function deviationAccumulation(samples: DriftSample[]): {
    cumulative: number;
    maxCumulative: number;
    provenance: string[];
};
export declare function thresholdAlert(values: number[], thresholds: {
    min?: number;
    max?: number;
}[]): {
    alerts: {
        index: number;
        value: number;
        type: 'high' | 'low';
    }[];
    provenance: string[];
};
export declare function anomalyDetection(values: number[], zThreshold?: number): {
    anomalies: number[];
    zScores: number[];
    provenance: string[];
};
export declare function outlierDetection(values: number[], multiplier?: number): {
    outliers: number[];
    q1: number;
    q3: number;
    iqr: number;
    provenance: string[];
};
export declare function distributionShift(reference: number[], current: number[]): {
    ksStatistic: number;
    shifted: boolean;
    provenance: string[];
};
export declare function conceptDrift(errorRates: {
    window: number;
    errorRate: number;
}[], threshold?: number): {
    driftDetected: boolean;
    driftPoint: number | null;
    provenance: string[];
};
export declare function dataDrift(refStats: {
    mean: number;
    std: number;
}, curStats: {
    mean: number;
    std: number;
}, threshold?: number): {
    drifted: boolean;
    meanShift: number;
    stdShift: number;
    provenance: string[];
};
export declare function modelDrift(performanceHistory: {
    time: number;
    metric: number;
}[], degradationThreshold?: number): {
    drifting: boolean;
    rate: number;
    provenance: string[];
};
export declare function behaviorDrift(expectedActions: string[], actualActions: string[]): {
    driftScore: number;
    newActions: string[];
    missingActions: string[];
    provenance: string[];
};
export declare function valueDrift(historicalValues: number[], currentValue: number, sensitivity?: number): {
    drifted: boolean;
    zScore: number;
    provenance: string[];
};
export declare function performanceDegradation(baseline: number, current: number, threshold?: number): {
    degraded: boolean;
    degradation: number;
    provenance: string[];
};
export declare function accuracyDrop(historicalAccuracy: number[], currentAccuracy: number, threshold?: number): {
    dropped: boolean;
    drop: number;
    provenance: string[];
};
export declare function recallDrop(historicalRecall: number[], currentRecall: number, threshold?: number): {
    dropped: boolean;
    drop: number;
    provenance: string[];
};
export declare function precisionDrop(historicalPrecision: number[], currentPrecision: number, threshold?: number): {
    dropped: boolean;
    drop: number;
    provenance: string[];
};
export declare function f1ScoreDrop(historicalF1: number[], currentF1: number, threshold?: number): {
    dropped: boolean;
    drop: number;
    provenance: string[];
};
export declare function deviationAttribution(deviation: number[], factors: {
    name: string;
    contribution: number;
}[]): {
    attributed: {
        name: string;
        share: number;
    }[];
    provenance: string[];
};
export declare function deviationRootCause(symptoms: {
    name: string;
    severity: number;
}[], causes: {
    name: string;
    likelihood: number;
}[]): {
    rootCause: string | null;
    confidence: number;
    provenance: string[];
};
export declare function deviationImpact(deviation: number[], impactWeights: number[]): {
    totalImpact: number;
    maxImpact: number;
    provenance: string[];
};
export declare function deviationRisk(magnitude: number, frequency: number, impact: number): {
    risk: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    provenance: string[];
};
export declare function deviationCorrection(values: number[], deviations: number[]): {
    corrected: number[];
    provenance: string[];
};
export declare function deviationCompensation(target: number, current: number, compensationRate?: number): {
    compensated: number;
    remainingDeviation: number;
    provenance: string[];
};
export declare function deviationCalibration(measurements: number[], standards: number[]): {
    calibrationFactors: number[];
    calibrated: number[];
    provenance: string[];
};
export declare function deviationMonitor(history: {
    time: number;
    deviation: number;
}[], alertThreshold?: number): {
    status: 'normal' | 'warning' | 'critical';
    latestDeviation: number;
    provenance: string[];
};
export declare function deviationReport(deviations: {
    name: string;
    value: number;
    threshold: number;
    impact: string;
}[]): {
    report: string;
    criticalCount: number;
    provenance: string[];
};
export declare function deviationEarlyWarning(trend: {
    slope: number;
}, currentValue: number, threshold: number, timeToThreshold: number): {
    willBreach: boolean;
    estimatedBreachTime: number;
    provenance: string[];
};
