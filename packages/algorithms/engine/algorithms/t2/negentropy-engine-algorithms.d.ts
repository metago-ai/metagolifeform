/**
 * MetaGO Engine - A5 T2 算法 · 负熵引擎封装类（ALG_T2_N_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 181~200 项（负熵引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 negentropy 模块的私有辅助方法
 *   - 处理熵计算、熵趋势、负熵贡献、系统有序度
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface EntropyMeasurement {
    system: string;
    timestamp: number;
    entropy: number;
    negentropy: number;
}
export declare function shannonEntropy(values: number[]): {
    entropy: number;
    maxEntropy: number;
    normalized: number;
    provenance: string[];
};
export declare function negentropyCalculate(observedEntropy: number, maxEntropy: number): {
    negentropy: number;
    normalized: number;
    interpretation: string;
    provenance: string[];
};
export declare function entropyDeltaCalculate(before: EntropyMeasurement, after: EntropyMeasurement): {
    delta: number;
    rate: number;
    direction: string;
    provenance: string[];
};
export declare function systemOrderAssess(measurements: EntropyMeasurement[]): {
    avgOrder: number;
    trend: string;
    consistency: number;
    provenance: string[];
};
export declare function negentropyContributionAssess(action: {
    name: string;
    entropyBefore: number;
    entropyAfter: number;
    resourcesUsed: number;
}): {
    contribution: number;
    efficiency: number;
    worthIt: boolean;
    provenance: string[];
};
export declare function entropyIncreaseDetect(measurements: EntropyMeasurement[], threshold?: number): {
    increasing: boolean;
    rate: number;
    projectedEntropy: number;
    provenance: string[];
};
export declare function thermodynamicEntropyApprox(states: {
    energy: number;
    probability: number;
}[], temperature?: number): {
    entropy: number;
    freeEnergy: number;
    provenance: string[];
};
export declare function informationEntropyFlow(sources: {
    name: string;
    entropyRate: number;
}, sinks: {
    name: string;
    entropyRate: number;
}): {
    netFlow: number;
    balanced: boolean;
    bottleneck: string;
    provenance: string[];
};
export declare function entropyThresholdAlert(current: number, thresholds: {
    warning: number;
    critical: number;
    max: number;
}): {
    level: string;
    action: string;
    provenance: string[];
};
export declare function systemComplexityAssess(components: {
    id: string;
    connections: number;
    internalStates: number;
}[]): {
    complexity: number;
    coupling: number;
    diversity: number;
    provenance: string[];
};
export declare function negentropyInjectStrategy(currentEntropy: number, targetEntropy: number, availableStrategies: {
    name: string;
    negentropyRate: number;
    cost: number;
}[]): {
    recommended: string;
    estimatedTime: number;
    estimatedCost: number;
    provenance: string[];
};
export declare function entropyBalance(systems: {
    name: string;
    entropy: number;
    capacity: number;
}[]): {
    balanced: boolean;
    loadDistribution: {
        name: string;
        load: number;
    }[];
    overloaded: string[];
    provenance: string[];
};
export declare function entropySourceAnalyze(sources: {
    name: string;
    contribution: number;
    type: 'internal' | 'external';
}[]): {
    internal: number;
    external: number;
    dominant: string;
    provenance: string[];
};
export declare function entropySteadyStateDetect(measurements: EntropyMeasurement[], tolerance?: number): {
    steady: boolean;
    stability: number;
    oscillationRange: number;
    provenance: string[];
};
export declare function entropyPredict(history: EntropyMeasurement[], horizon?: number): {
    forecast: {
        time: number;
        entropy: number;
    }[];
    confidence: number;
    provenance: string[];
};
export declare function entropyAudit(events: {
    timestamp: number;
    entropyDelta: number;
    source: string;
    reason: string;
}[]): {
    auditLog: string[];
    totalDelta: number;
    positiveCount: number;
    negativeCount: number;
    provenance: string[];
};
export declare function negentropyLedgerRecord(ledger: {
    timestamp: number;
    action: string;
    negentropyDelta: number;
    cumulative: number;
}[], newAction: string, negentropyDelta: number, now?: number): {
    updatedLedger: typeof ledger;
    newEntry: typeof ledger[0];
    provenance: string[];
};
export declare function entropyOptimizationSuggest(current: {
    entropy: number;
    negentropy: number;
    sources: {
        name: string;
        contribution: number;
    }[];
}, target: {
    entropy: number;
    negentropy: number;
}): {
    suggestions: {
        action: string;
        impact: number;
        priority: string;
    }[];
    provenance: string[];
};
export declare function entropyReportGenerate(measurements: EntropyMeasurement[], sources: {
    name: string;
    contribution: number;
}[]): {
    report: string;
    summary: {
        avgEntropy: number;
        avgNegentropy: number;
        trend: string;
    };
    provenance: string[];
};
export declare function negentropyComprehensiveAssessment(metrics: {
    avgNegentropy: number;
    trend: number;
    consistency: number;
    efficiency: number;
    contribution: number;
}): {
    overall: number;
    grade: string;
    status: string;
    provenance: string[];
};
