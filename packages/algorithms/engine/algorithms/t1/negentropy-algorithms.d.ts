/**
 * MetaGO Engine - A5 T1 算法 · 负熵类（第二批）
 *
 * 对应属性：D43 数据溯源与自证 / 公理 A1 溯源公理
 * 对应文档：附录A·T1·NEGENTROPY（ALG_T1_N_001 ~ ALG_T1_N_015）
 *
 * 算法清单（15 个）：
 *   001 熵计算        002 负熵计算        003 熵变(delta)
 *   004 有序度        005 复杂度度量      006 信息密度
 *   007 互信息        008 条件熵          009 相对熵(KL)
 *   010 交叉熵        011 熵率            012 熵产生
 *   013 熵输出        014 熵平衡          015 熵监控
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface EntropySample {
    time: number;
    entropy: number;
}
export declare function computeEntropy(probabilities: number[]): {
    entropy: number;
    maxEntropy: number;
    normalized: number;
    provenance: string[];
};
export declare function computeNegentropy(observed: number[], reference: number[]): {
    negentropy: number;
    relativeToMax: number;
    provenance: string[];
};
export declare function entropyDelta(before: number[], after: number[]): {
    deltaS: number;
    direction: 'increasing' | 'decreasing' | 'stable';
    provenance: string[];
};
export declare function orderDegree(values: number[]): {
    order: number;
    disorder: number;
    provenance: string[];
};
export declare function complexityMeasure(sequence: number[]): {
    complexity: number;
    lzComplexity: number;
    provenance: string[];
};
export declare function informationDensity(data: number[], bitsPerElement?: number): {
    density: number;
    entropy: number;
    redundancy: number;
    provenance: string[];
};
export declare function mutualInformation(joint: {
    x: number;
    y: number;
}[]): {
    mutualInfo: number;
    normalized: number;
    provenance: string[];
};
export declare function conditionalEntropy(samples: {
    x: number;
    y: number;
}[]): {
    hXY: number;
    hXgivenY: number;
    provenance: string[];
};
export declare function relativeEntropy(p: number[], q: number[]): {
    klDivergence: number;
    symmetric: number;
    provenance: string[];
};
export declare function crossEntropy(p: number[], q: number[]): {
    crossEnt: number;
    provenance: string[];
};
export declare function entropyRate(timeSeries: EntropySample[]): {
    rate: number;
    trend: number;
    provenance: string[];
};
export declare function entropyProduction(internal: number[], external: number[]): {
    production: number;
    internal: number;
    external: number;
    provenance: string[];
};
export declare function entropyExport(system: number[], environment: number[]): {
    exported: number;
    netExport: number;
    provenance: string[];
};
export declare function entropyBalance(inputs: {
    source: string;
    entropy: number;
    weight: number;
}[], outputs: {
    sink: string;
    entropy: number;
    weight: number;
}[]): {
    balanced: boolean;
    netEntropy: number;
    provenance: string[];
};
export declare function entropyMonitor(history: EntropySample[], thresholds: {
    warn: number;
    critical: number;
}): {
    status: 'normal' | 'warn' | 'critical';
    current: number;
    trend: number;
    provenance: string[];
};
