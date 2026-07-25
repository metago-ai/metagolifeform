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
export interface ValueDimension {
    name: string;
    weight: number;
    rawValue: number;
    min?: number;
    max?: number;
}
export interface ValueAssessment {
    totalScore: number;
    normalizedScore: number;
    dimensions: {
        name: string;
        weighted: number;
        normalized: number;
    }[];
    provenance: string[];
}
export declare function aggregateSixDimValue(dims: ValueDimension[]): ValueAssessment;
export declare function normalizeValueVector(vector: number[], method?: 'minmax' | 'zscore' | 'l2'): {
    normalized: number[];
    method: string;
    provenance: string[];
};
export declare function calculateDCVWeights(samples: number[][]): {
    weights: number[];
    provenance: string[];
};
export interface BehaviorAccount {
    knowledge: number;
    social: number;
    economic: number;
    cultural: number;
    spiritual: number;
}
export declare function behaviorBankScore(deposits: BehaviorAccount[], withdrawals: BehaviorAccount[]): {
    net: BehaviorAccount;
    total: number;
    provenance: string[];
};
export declare function holographicCreditScore(factors: {
    name: string;
    score: number;
    weight: number;
}[]): {
    score: number;
    grade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C';
    provenance: string[];
};
export declare function valueAlignment(current: number[], target: number[]): {
    alignment: number;
    deviation: number;
    provenance: string[];
};
export declare function detectValueConflicts(values: {
    name: string;
    vector: number[];
}[], threshold?: number): {
    conflicts: [string, string, number][];
    provenance: string[];
};
export declare function prioritizeValues(values: {
    name: string;
    importance: number;
    urgency: number;
}[]): {
    ranked: {
        name: string;
        score: number;
    }[];
    provenance: string[];
};
export declare function valueDecay(initialValue: number, halfLifeDays: number, elapsedDays: number): {
    currentValue: number;
    provenance: string[];
};
export declare function valueGain(baseline: number, actual: number, maxPossible: number): {
    gain: number;
    relativeGain: number;
    provenance: string[];
};
export declare function valueTransfer(from: BehaviorAccount, to: BehaviorAccount, amount: number, fromKey: keyof BehaviorAccount, toKey: keyof BehaviorAccount): {
    from: BehaviorAccount;
    to: BehaviorAccount;
    provenance: string[];
};
export declare function valueBalance(values: number[]): {
    mean: number;
    variance: number;
    balance: number;
    provenance: string[];
};
export declare function compareMultiDimValues(a: number[], b: number[]): {
    dominant: 'A' | 'B' | 'equal';
    margin: number;
    provenance: string[];
};
export declare function buildValueMatrix(rows: string[], cols: string[], valueFn: (r: string, c: string) => number): {
    matrix: number[][];
    rows: string[];
    cols: string[];
    provenance: string[];
};
export declare function valueTrend(timeSeries: {
    time: number;
    value: number;
}[]): {
    slope: number;
    trend: 'up' | 'down' | 'flat';
    provenance: string[];
};
export declare function valueRiskAssessment(values: number[], confidence: number[]): {
    risk: number;
    confidence: number;
    provenance: string[];
};
export declare function valueROI(investment: number, return_: number, period: number): {
    roi: number;
    annualizedRoi: number;
    provenance: string[];
};
export declare function valueDensity(totalValue: number, volume: number): {
    density: number;
    provenance: string[];
};
export declare function valueEntropy(values: number[]): {
    entropy: number;
    provenance: string[];
};
export declare function valueCoverage(covered: number[], total: number[]): {
    coverage: number;
    gaps: number[];
    provenance: string[];
};
export declare function valueDepth(chain: {
    level: number;
    value: number;
}[]): {
    maxDepth: number;
    avgDepth: number;
    provenance: string[];
};
export declare function valueBreadth(domains: string[], coverage: Map<string, number>): {
    breadth: number;
    coveredDomains: number;
    provenance: string[];
};
export declare function valueStability(timeSeries: number[]): {
    stability: number;
    coefficientOfVariation: number;
    provenance: string[];
};
export declare function valueConfidence(samples: number[], reference: number): {
    confidence: number;
    bias: number;
    provenance: string[];
};
export declare function valueTrace(chain: {
    source: string;
    contribution: number;
}[]): {
    sources: string[];
    totalContribution: number;
    provenance: string[];
};
export declare function valueAudit(claimed: number[], actual: number[]): {
    discrepancies: number[];
    auditScore: number;
    provenance: string[];
};
export declare function valueCalibration(measured: number[], standard: number[]): {
    calibrated: number[];
    offsets: number[];
    provenance: string[];
};
export declare function valueMapping(source: number[], mapping: {
    fromMin: number;
    fromMax: number;
    toMin: number;
    toMax: number;
}[]): {
    mapped: number[];
    provenance: string[];
};
export declare function valueProjection(vector: number[], basis: number[][]): {
    projection: number[];
    provenance: string[];
};
export declare function comprehensiveValueAssessment(metrics: {
    alignment: number;
    balance: number;
    stability: number;
    coverage: number;
    confidence: number;
}): {
    score: number;
    grade: string;
    provenance: string[];
};
