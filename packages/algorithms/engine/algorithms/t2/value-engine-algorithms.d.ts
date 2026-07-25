/**
 * MetaGO Engine - A5 T2 算法 · 价值引擎封装类（ALG_T2_V_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 21~40 项（价值引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 value-engine 相关引擎的私有辅助方法
 *   - 处理 DCV 六维价值、行为银行、价值流、多利益相关者平衡
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface ValueDimension {
    name: string;
    score: number;
    weight: number;
}
export interface ValueFlow {
    from: string;
    to: string;
    amount: number;
    dimension: string;
    timestamp: number;
}
export interface StakeholderValue {
    stakeholder: string;
    dimensions: Record<string, number>;
}
export declare function dcvWeightedAggregate(dimensions: ValueDimension[], confidence?: number): {
    total: number;
    grade: string;
    perDim: Record<string, number>;
    provenance: string[];
};
export declare function valueFlowTrace(flows: ValueFlow[], entity: string): {
    inflow: number;
    outflow: number;
    net: number;
    byDim: Record<string, number>;
    provenance: string[];
};
export declare function stakeholderBalance(stakeholders: StakeholderValue[]): {
    balance: number;
    dominant: string;
    conflicts: string[];
    provenance: string[];
};
export declare function valueBankReconcile(deposits: {
    id: string;
    amount: number;
}[], withdrawals: {
    id: string;
    amount: number;
}[]): {
    net: number;
    balanced: boolean;
    discrepancies: string[];
    provenance: string[];
};
export declare function valueDecayModel(initialValue: number, decayRate: number, timeSteps: number): {
    values: number[];
    halfLife: number;
    provenance: string[];
};
export declare function valueRiskMatrix(items: {
    name: string;
    probability: number;
    impact: number;
}[]): {
    risks: {
        name: string;
        score: number;
        level: string;
    }[];
    total: number;
    provenance: string[];
};
export declare function valueAttribution(finalValue: number, contributors: {
    name: string;
    contribution: number;
}[]): {
    attributed: {
        name: string;
        share: number;
        percentage: number;
    }[];
    residual: number;
    provenance: string[];
};
export declare function valueExponentialSmoothing(history: number[], alpha?: number, horizon?: number): {
    smoothed: number[];
    forecast: number[];
    provenance: string[];
};
export declare function valueBenchmark(actual: number, benchmark: number, tolerance?: number): {
    deviation: number;
    ratio: number;
    status: 'above' | 'below' | 'on-par';
    provenance: string[];
};
export declare function valueHealthIndex(metrics: {
    growth: number;
    stability: number;
    coverage: number;
    efficiency: number;
}): {
    index: number;
    status: string;
    provenance: string[];
};
export declare function valueArbitration(claimants: {
    name: string;
    claim: number;
    priority: number;
}[], totalAvailable: number): {
    allocation: {
        name: string;
        amount: number;
    }[];
    satisfied: boolean;
    provenance: string[];
};
export declare function valueLock(value: number, signature: string, timestamp: number): {
    locked: boolean;
    hash: string;
    provenance: string[];
};
export declare function valueAuditChain(events: {
    action: string;
    valueDelta: number;
    timestamp: number;
    actor: string;
}[]): {
    chain: string[];
    totalDelta: number;
    integrity: boolean;
    provenance: string[];
};
export declare function valueDensityAnalysis(values: number[], windowSize: number): {
    densities: number[];
    peak: number;
    peakIndex: number;
    provenance: string[];
};
export declare function valueOptimizationSuggest(current: Record<string, number>, targets: Record<string, number>): {
    suggestions: {
        dim: string;
        gap: number;
        action: string;
    }[];
    priority: string;
    provenance: string[];
};
export declare function valueEquity(totalValue: number, shares: {
    holder: string;
    percentage: number;
}[]): {
    equity: {
        holder: string;
        amount: number;
    }[];
    total: number;
    provenance: string[];
};
export declare function valueLifecycle(stages: {
    name: string;
    duration: number;
    valueRate: number;
}[]): {
    totalValue: number;
    totalDuration: number;
    peakStage: string;
    provenance: string[];
};
export declare function valueCoupling(valueA: Record<string, number>, valueB: Record<string, number>): {
    coupling: number;
    sharedDimensions: string[];
    provenance: string[];
};
export declare function valueNPV(cashflows: {
    time: number;
    amount: number;
}[], discountRate: number): {
    npv: number;
    profitable: boolean;
    provenance: string[];
};
export declare function valueComprehensiveRating(metrics: {
    absolute: number;
    relative: number;
    trend: number;
    risk: number;
    sustainability: number;
}): {
    rating: number;
    tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'iron';
    provenance: string[];
};
