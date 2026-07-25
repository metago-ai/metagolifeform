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
export interface BiasSource {
    name: string;
    bias: number;
    confidence: number;
}
export interface BiasCascade {
    source: string;
    affected: string[];
    path: string[];
    magnitude: number;
}
export declare function multiSourceBiasAggregate(sources: BiasSource[]): {
    aggregated: number;
    dominant: string;
    consensus: number;
    provenance: string[];
};
export declare function biasCascadeDetect(events: {
    source: string;
    target: string;
    bias: number;
    time: number;
}[], threshold?: number): {
    cascades: BiasCascade[];
    maxDepth: number;
    provenance: string[];
};
export declare function biasRootCause(symptoms: {
    name: string;
    severity: number;
}[], causes: {
    name: string;
    probability: number;
}[]): {
    rootCause: string;
    confidence: number;
    attribution: Record<string, number>;
    provenance: string[];
};
export declare function biasCorrectionStrategy(bias: number, tolerance?: number): {
    strategy: string;
    intensity: number;
    expectedReduction: number;
    provenance: string[];
};
export declare function biasCorrelation(biasA: number[], biasB: number[]): {
    correlation: number;
    lag: number;
    significant: boolean;
    provenance: string[];
};
export declare function biasAccumulationMonitor(biases: number[], alertThreshold?: number): {
    cumulative: number;
    rate: number;
    willBreach: boolean;
    provenance: string[];
};
export declare function biasHeatmap(rows: string[], cols: string[], values: number[][]): {
    heatmap: {
        row: string;
        col: string;
        value: number;
        level: string;
    }[];
    hotspot: {
        row: string;
        col: string;
    } | null;
    provenance: string[];
};
export declare function biasPropagationPath(graph: {
    from: string;
    to: string;
    weight: number;
}[], source: string, maxDepth?: number): {
    paths: string[][];
    totalSpread: number;
    provenance: string[];
};
export declare function biasThresholdAdapt(history: number[], baseThreshold: number, adaptationRate?: number): {
    threshold: number;
    trend: string;
    provenance: string[];
};
export declare function biasReportGenerate(biases: {
    name: string;
    value: number;
    threshold: number;
    impact: string;
}[]): {
    report: string;
    criticalCount: number;
    totalImpact: number;
    provenance: string[];
};
export declare function biasSelfHeal(bias: number, healingCapacity: number, maxIterations?: number): {
    healed: number;
    remaining: number;
    iterations: number;
    provenance: string[];
};
export declare function biasTraceChain(biases: {
    source: string;
    bias: number;
    timestamp: number;
}[]): {
    chain: {
        source: string;
        bias: number;
        cumulative: number;
    }[];
    totalTime: number;
    provenance: string[];
};
export declare function biasImpactScope(bias: number, affectedComponents: {
    name: string;
    sensitivity: number;
}[]): {
    affected: {
        name: string;
        impact: number;
    }[];
    totalImpact: number;
    provenance: string[];
};
export declare function biasCompensator(target: number, actual: number, compensationRate?: number): {
    compensation: number;
    compensated: number;
    residual: number;
    provenance: string[];
};
export declare function biasStatisticalTest(sample: number[], hypothesizedMean: number, alpha?: number): {
    t: number;
    reject: boolean;
    provenance: string[];
};
export declare function biasSeasonality(values: number[], period: number): {
    seasonal: boolean;
    strength: number;
    peaks: number[];
    provenance: string[];
};
export declare function biasSpatialDistribution(locations: {
    x: number;
    y: number;
    bias: number;
}[]): {
    centroid: {
        x: number;
        y: number;
    };
    spread: number;
    clusters: number;
    provenance: string[];
};
export declare function biasAlertLevel(bias: number, threshold: number, trend: number): {
    level: 'green' | 'yellow' | 'orange' | 'red';
    action: string;
    provenance: string[];
};
export declare function biasCausalInference(cause: number[], effect: number[], maxLag?: number): {
    bestLag: number;
    grangerScore: number;
    causal: boolean;
    provenance: string[];
};
export declare function biasComprehensiveAssessment(metrics: {
    magnitude: number;
    frequency: number;
    impact: number;
    trend: number;
    detectability: number;
}): {
    score: number;
    severity: 'negligible' | 'minor' | 'moderate' | 'major' | 'critical';
    provenance: string[];
};
