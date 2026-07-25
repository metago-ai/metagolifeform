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
export interface TimePoint {
    timestamp: number;
    value: number;
}
export interface SpatialPoint {
    x: number;
    y: number;
    z?: number;
}
export declare function timeSeriesForecast(series: TimePoint[], horizon?: number): {
    forecast: TimePoint[];
    slope: number;
    rSquared: number;
    provenance: string[];
};
export declare function temporalPatternRecognition(series: number[], maxLag?: number): {
    autocorrelations: number[];
    dominantLag: number;
    periodic: boolean;
    provenance: string[];
};
export declare function timeArrowDetermination(states: {
    entropy: number;
}[]): {
    arrow: 'forward' | 'backward' | 'static';
    entropyDelta: number;
    confidence: number;
    provenance: string[];
};
export declare function spatialDistance(a: SpatialPoint, b: SpatialPoint, metric?: 'euclidean' | 'manhattan' | 'chebyshev' | 'haversine'): {
    distance: number;
    metric: string;
    provenance: string[];
};
export declare function spatiotemporalInterpolation(known: {
    point: SpatialPoint;
    time: number;
    value: number;
}[], target: {
    point: SpatialPoint;
    time: number;
}, power?: number): {
    value: number;
    weights: number[];
    provenance: string[];
};
export declare function periodicityDetection(series: number[]): {
    period: number;
    strength: number;
    spectrum: {
        freq: number;
        mag: number;
    }[];
    provenance: string[];
};
export declare function trendAnalysis(series: number[]): {
    trend: 'increasing' | 'decreasing' | 'no-trend';
    slope: number;
    significance: number;
    provenance: string[];
};
export declare function seasonalDecomposition(series: number[], period: number): {
    trend: number[];
    seasonal: number[];
    residual: number[];
    provenance: string[];
};
export declare function timeWindowAggregation(series: TimePoint[], windowSize: number, aggregation?: 'sum' | 'mean' | 'min' | 'max' | 'count'): {
    windows: {
        start: number;
        end: number;
        value: number;
        count: number;
    }[];
    provenance: string[];
};
export declare function spatiotemporalClustering(points: {
    id: string;
    point: SpatialPoint;
    time: number;
}[], eps?: number, minPts?: number): {
    clusters: string[][];
    noise: string[];
    clusterCount: number;
    provenance: string[];
};
export declare function temporalAnomalyDetection(series: number[], method?: 'zscore' | 'iqr', threshold?: number): {
    anomalies: number[];
    anomalyIndices: number[];
    threshold: number;
    provenance: string[];
};
export declare function timeDecayMemory(memories: {
    id: string;
    timestamp: number;
    importance: number;
    accessCount: number;
}[], currentTime: number, halfLife?: number): {
    retained: {
        id: string;
        strength: number;
        rank: number;
    }[];
    provenance: string[];
};
export declare function causalTemporalInference(cause: number[], effect: number[], maxLag?: number): {
    bestLag: number;
    causalityScore: number;
    significant: boolean;
    provenance: string[];
};
export declare function temporalConsistencyCheck(events: {
    id: string;
    timestamp: number;
    dependencies: {
        eventId: string;
        type: 'before' | 'after' | 'simultaneous';
    }[];
}[]): {
    consistent: boolean;
    violations: {
        eventId: string;
        dependencyId: string;
        type: string;
    }[];
    provenance: string[];
};
export declare function spatiotemporalPathOptimization(start: {
    point: SpatialPoint;
    time: number;
}, destinations: {
    id: string;
    point: SpatialPoint;
    time: number;
    priority: number;
}[]): {
    path: string[];
    totalDistance: number;
    totalTime: number;
    provenance: string[];
};
