/**
 * MetaGO Engine - A5 T1 算法 · 耦生度计算类（第一批）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：ALG_636 耦生评估 / ATOM_734 / P742
 *
 * 算法清单（30 个，ALG_C_001 ~ ALG_C_030）：
 *   001 余弦相似度  002 Jaccard 系数  003 Dice 系数
 *   004 欧氏距离    005 曼哈顿距离    006 切比雪夫距离
 *   007 皮尔逊相关   008 斯皮尔曼相关  009 肯德尔 tau
 *   010 加权余弦    011 模糊匹配      012 语义相似度
 *   013 共现频率    014 时间衰减共现  015 双向耦生评估
 *   016 超导判定    017 弱对识别      018 强对识别
 *   019 耦生矩阵    020 归一化耦生    021 耦生度排序
 *   022 对称记录    023 非对称检测    024 耦生趋势
 *   025 耦生聚类    026 价值向量构造  027 向量降维
 *   028 主成分提取  029 奇异值分解    030 协方差计算
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface VectorPair {
    a: number[];
    b: number[];
}
export interface SetPair {
    a: Set<string> | string[];
    b: Set<string> | string[];
}
export interface CouplingResult {
    score: number;
    normalized: number;
    provenance: string[];
}
export interface CouplingMatrix {
    size: number;
    matrix: number[][];
    labels: string[];
}
export declare function cosineSimilarity(pair: VectorPair): CouplingResult;
export declare function jaccardCoefficient(pair: SetPair): CouplingResult;
export declare function diceCoefficient(pair: SetPair): CouplingResult;
export declare function euclideanDistance(pair: VectorPair): CouplingResult;
export declare function manhattanDistance(pair: VectorPair): CouplingResult;
export declare function chebyshevDistance(pair: VectorPair): CouplingResult;
export declare function pearsonCorrelation(pair: VectorPair): CouplingResult;
export declare function spearmanCorrelation(pair: VectorPair): CouplingResult;
export declare function kendallTau(pair: VectorPair): CouplingResult;
export declare function weightedCosineSimilarity(pair: VectorPair, weights: number[]): CouplingResult;
export declare function fuzzyStringMatch(s1: string, s2: string): CouplingResult;
export declare function semanticSimilarity(tokens1: string[], tokens2: string[], synonyms?: Map<string, string[]>): CouplingResult;
export declare function cooccurrenceFrequency(sequences: string[][], item1: string, item2: string): CouplingResult;
export declare function timeDecayCooccurrence(events: {
    time: number;
    items: string[];
}[], item1: string, item2: string, halfLifeMs: number, now: number): CouplingResult;
export interface BidirectionalCoupling {
    forward: number;
    backward: number;
    symmetric: number;
}
export declare function evaluateBidirectionalCoupling(forwardSamples: number[], backwardSamples: number[]): BidirectionalCoupling & {
    provenance: string[];
};
export declare function isSuperconductive(couplingScore: number): {
    superconductive: boolean;
    margin: number;
    provenance: string[];
};
export declare function identifyWeakPairs(matrix: CouplingMatrix, threshold?: number): {
    pairs: [string, string, number][];
    provenance: string[];
};
export declare function identifyStrongPairs(matrix: CouplingMatrix, threshold?: number): {
    pairs: [string, string, number][];
    provenance: string[];
};
export declare function buildCouplingMatrix(labels: string[], scoreFn: (a: string, b: string) => number): CouplingMatrix;
export declare function normalizeCoupling(scores: number[]): {
    normalized: number[];
    min: number;
    max: number;
    provenance: string[];
};
export declare function sortCouplingScores(entries: {
    label: string;
    score: number;
}[], descending?: boolean): {
    sorted: {
        label: string;
        score: number;
    }[];
    provenance: string[];
};
export declare function recordSymmetric(store: Map<string, number>, a: string, b: string, score: number): {
    key: string;
    provenance: string[];
};
export declare function detectAsymmetry(matrix: CouplingMatrix, tolerance?: number): {
    asymmetric: [string, string, number, number][];
    provenance: string[];
};
export declare function couplingTrend(timeSeries: {
    time: number;
    score: number;
}[]): {
    slope: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    provenance: string[];
};
export declare function couplingClustering(matrix: CouplingMatrix, threshold: number): {
    clusters: string[][];
    provenance: string[];
};
export declare function buildValueVector(dimensions: {
    name: string;
    weight: number;
    value: number;
}[]): {
    vector: number[];
    names: string[];
    weights: number[];
    provenance: string[];
};
export declare function reduceDimension(vector: number[], targetDim: number): {
    reduced: number[];
    provenance: string[];
};
export declare function extractPrincipalComponent(vectors: number[][]): {
    component: number[];
    index: number;
    variance: number;
    provenance: string[];
};
export declare function simplifiedSVD(matrix: number[][], iterations?: number): {
    leftVector: number[];
    singularValue: number;
    provenance: string[];
};
export declare function covariance(samples: {
    x: number;
    y: number;
}[]): {
    cov: number;
    provenance: string[];
};
export declare function hashVector(vector: number[]): string;
