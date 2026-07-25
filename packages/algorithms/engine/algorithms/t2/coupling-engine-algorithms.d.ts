/**
 * MetaGO Engine - A5 T2 算法 · 耦生度引擎封装类（ALG_T2_C_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 1~20 项（耦生度引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 coupling-engine.ts 的私有辅助方法
 *   - 处理多源耦生数据、动态耦生状态、跨层耦生（碳基/硅基/比特）
 *   - 比 T1 基础算法更高阶、面向引擎调度场景
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface CouplingNode {
    id: string;
    layer: 'carbon' | 'silicon' | 'bit';
    weight: number;
}
export interface CouplingEdge {
    from: string;
    to: string;
    score: number;
    bidirectional: boolean;
}
export interface CouplingGraph {
    nodes: CouplingNode[];
    edges: CouplingEdge[];
}
export interface CouplingState {
    current: number;
    previous: number;
    velocity: number;
    trend: 'rising' | 'falling' | 'stable';
    provenance?: string[];
}
export declare function trilayerCoupling(carbon: number, silicon: number, bit: number): {
    score: number;
    layer: string;
    provenance: string[];
};
export declare function buildCouplingGraph(nodes: CouplingNode[], scoreFn: (a: CouplingNode, b: CouplingNode) => number, threshold?: number): CouplingGraph & {
    provenance: string[];
};
export declare function couplingCentrality(graph: CouplingGraph): {
    centrality: Map<string, number>;
    hub: string;
    provenance: string[];
};
export declare function couplingShortestPath(graph: CouplingGraph, source: string, target: string): {
    path: string[];
    distance: number;
    provenance: string[];
};
export declare function couplingStateTransition(current: number, history: number[], thresholds: {
    low: number;
    mid: number;
    high: number;
}): CouplingState & {
    nextState: 'decoupled' | 'weak' | 'moderate' | 'strong' | 'superconductive';
};
export declare function couplingStability(samples: number[]): {
    cv: number;
    stable: boolean;
    provenance: string[];
};
export declare function couplingResonance(signalA: number[], signalB: number[]): {
    resonance: number;
    phaseLag: number;
    provenance: string[];
};
export declare function couplingEntropy(graph: CouplingGraph): {
    entropy: number;
    diversity: number;
    provenance: string[];
};
export declare function couplingDecay(initial: number, halfLifeMs: number, elapsedMs: number): {
    current: number;
    remaining: number;
    provenance: string[];
};
export declare function couplingEnhance(current: number, target: number, strategies: {
    name: string;
    effectiveness: number;
}[]): {
    recommended: string;
    projectedGain: number;
    provenance: string[];
};
export declare function couplingRiskAlert(current: number, velocity: number, threshold: number): {
    risk: 'low' | 'medium' | 'high' | 'critical';
    projectedBreach: number;
    provenance: string[];
};
export declare function couplingCommunity(graph: CouplingGraph, maxIterations?: number): {
    communities: Map<string, number>;
    count: number;
    provenance: string[];
};
export declare function couplingSymmetrize(matrix: number[][]): {
    symmetrized: number[][];
    corrections: number;
    provenance: string[];
};
export declare function couplingDistribution(scores: number[], bins?: number): {
    histogram: number[];
    mean: number;
    std: number;
    provenance: string[];
};
export declare function couplingHierarchicalAggregate(leafScores: number[], groupSize: number): {
    levels: number[][];
    aggregated: number;
    provenance: string[];
};
export declare function couplingGini(scores: number[]): {
    gini: number;
    balanced: boolean;
    provenance: string[];
};
export declare function couplingForecast(history: {
    time: number;
    score: number;
}[], horizon: number): {
    forecast: {
        time: number;
        score: number;
    }[];
    slope: number;
    provenance: string[];
};
export declare function couplingAnomalyInjection(baseline: number[], observed: number[], sensitivity?: number): {
    anomalies: number[];
    injected: boolean;
    provenance: string[];
};
export declare function couplingPropagation(graph: CouplingGraph, seeds: string[], threshold?: number, maxSteps?: number): {
    activated: Set<string>;
    steps: number;
    provenance: string[];
};
export declare function couplingComprehensiveAssessment(metrics: {
    score: number;
    stability: number;
    symmetry: number;
    coverage: number;
    trend: number;
}): {
    overall: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    provenance: string[];
};
