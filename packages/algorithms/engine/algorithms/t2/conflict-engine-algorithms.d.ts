/**
 * MetaGO Engine - A5 T2 算法 · 冲突转化引擎封装类（ALG_T2_X_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 冲突转化引擎类
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface ConflictParty {
    id: string;
    position: number;
    influence: number;
}
export interface ConflictState {
    intensity: number;
    parties: ConflictParty[];
    rootCause?: string;
}
export declare function calculateConflictIntensity(parties: ConflictParty[]): {
    intensity: number;
    maxGap: number;
    provenance: string[];
};
export declare function analyzeConflictRootCause(symptoms: string[], causes: {
    name: string;
    weight: number;
}[]): {
    rootCause: string;
    confidence: number;
    provenance: string[];
};
export declare function assessPartyInfluence(party: ConflictParty, allParties: ConflictParty[]): {
    influence: number;
    relativeStrength: number;
    provenance: string[];
};
export declare function findCompromisePoint(parties: ConflictParty[], weights?: number[]): {
    point: number;
    satisfaction: number;
    provenance: string[];
};
export declare function predictConflictEscalation(history: {
    time: number;
    intensity: number;
}[], threshold?: number): {
    willEscalate: boolean;
    rate: number;
    provenance: string[];
};
export declare function deescalateConflict(state: ConflictState, strategies: {
    name: string;
    effectiveness: number;
    cost: number;
}[]): {
    chosen: string | null;
    netGain: number;
    provenance: string[];
};
export declare function calculatePositionDistance(parties: ConflictParty[]): {
    distances: number[][];
    avgDistance: number;
    provenance: string[];
};
export declare function detectConflictCoalitions(parties: ConflictParty[], threshold?: number): {
    coalitions: string[][];
    provenance: string[];
};
export declare function selectMediator(candidates: {
    id: string;
    neutrality: number;
    influence: number;
}[]): {
    mediator: string | null;
    score: number;
    provenance: string[];
};
export declare function evaluateResolution(solution: {
    name: string;
    satisfaction: number[];
    feasibility: number;
}): {
    overallScore: number;
    minSatisfaction: number;
    provenance: string[];
};
export declare function recognizeConflictPattern(current: ConflictState, history: {
    pattern: string;
    intensity: number;
    parties: number;
}[]): {
    matchedPattern: string | null;
    similarity: number;
    provenance: string[];
};
export declare function assessConflictImpact(state: ConflictState, affectedSystems: {
    name: string;
    sensitivity: number;
}[]): {
    totalImpact: number;
    criticalSystems: string[];
    provenance: string[];
};
export declare function prioritizeConflicts(conflicts: ConflictState[]): {
    ranked: number[];
    provenance: string[];
};
export declare function planConflictResolution(state: ConflictState, targetIntensity?: number): {
    steps: string[];
    estimatedTime: number;
    provenance: string[];
};
export declare function modelPartyEmotion(party: ConflictParty & {
    frustration: number;
}): {
    emotionState: string;
    volatility: number;
    provenance: string[];
};
export declare function calculateCoolingPeriod(intensity: number, parties: number): {
    periodMs: number;
    provenance: string[];
};
export declare function reviewConflict(timeline: {
    time: number;
    event: string;
    impact: number;
}[]): {
    keyEvents: string[];
    totalImpact: number;
    lessons: number;
    provenance: string[];
};
export declare function preventionMeasures(riskFactors: {
    name: string;
    severity: number;
}[]): {
    measures: string[];
    priority: number;
    provenance: string[];
};
export declare function detectConflictSignals(signals: {
    source: string;
    value: number;
    baseline: number;
}[], threshold?: number): {
    detected: boolean;
    signals_count: number;
    provenance: string[];
};
export declare function comprehensiveConflictAssessment(state: ConflictState, context: {
    history: {
        intensity: number;
    }[];
    systems: {
        name: string;
        sensitivity: number;
    }[];
}): {
    severity: string;
    recommendedAction: string;
    confidence: number;
    provenance: string[];
};
