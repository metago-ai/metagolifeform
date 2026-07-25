/**
 * MetaGO Engine - A5 T2 算法 · 直觉引擎封装类（ALG_T2_I_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 直觉引擎类
 *
 * 引擎封装算法特征：
 *   - 作为 intuition-engine 的私有辅助方法
 *   - 处理启发式判断、模式识别、快速决策
 *   - 比 T1 基础算法更高阶、面向直觉调度场景
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface IntuitionSignal {
    source: string;
    strength: number;
    confidence: number;
}
export interface PatternMatch {
    pattern: string;
    similarity: number;
    occurrences: number;
}
export declare function fuseIntuitionSignals(signals: IntuitionSignal[]): {
    score: number;
    dominant: string;
    provenance: string[];
};
export declare function rapidPatternMatch(input: string, patterns: PatternMatch[], threshold?: number): {
    matched: PatternMatch | null;
    candidates: PatternMatch[];
    provenance: string[];
};
export declare function assessIntuitionConfidence(samples: number[], reference?: number): {
    confidence: number;
    bias: number;
    provenance: string[];
};
export declare function heuristicDecision(options: {
    name: string;
    score: number;
    risk: number;
}[], riskTolerance?: number): {
    chosen: string | null;
    expectedValue: number;
    provenance: string[];
};
export declare function intuitionDecay(initialConfidence: number, elapsedMs: number, halfLifeMs: number): {
    confidence: number;
    provenance: string[];
};
export declare function calibrateIntuition(predictions: number[], outcomes: number[]): {
    calibrationFactor: number;
    mae: number;
    provenance: string[];
};
export declare function abstractPattern(instances: Record<string, unknown>[]): {
    pattern: Record<string, unknown>;
    coverage: number;
    provenance: string[];
};
export declare function detectIntuitionConflict(intuitions: {
    source: string;
    direction: number;
}[], threshold?: number): {
    hasConflict: boolean;
    conflictScore: number;
    provenance: string[];
};
export declare function rankIntuitions(intuitions: {
    source: string;
    strength: number;
    urgency: number;
}[]): {
    ranked: string[];
    provenance: string[];
};
export declare function traceIntuitionSource(intuition: {
    source: string;
    triggers: string[];
}, history: {
    source: string;
    trigger: string;
    success: boolean;
}[]): {
    reliability: number;
    sampleSize: number;
    provenance: string[];
};
export declare function suppressLowConfidence(intuitions: {
    source: string;
    confidence: number;
}[], threshold?: number): {
    suppressed: string[];
    kept: string[];
    provenance: string[];
};
export declare function amplifyHighConfidence(score: number, confidence: number, threshold?: number): {
    amplified: number;
    boosted: boolean;
    provenance: string[];
};
export declare function countPatternFrequency(sequences: string[][]): {
    patterns: Map<string, number>;
    topPattern: string | null;
    provenance: string[];
};
export declare function searchIntuitionPath(graph: Map<string, string[]>, start: string, target: string, maxDepth?: number): {
    path: string[] | null;
    visited: number;
    provenance: string[];
};
export declare function intuitionStateMachine(current: 'idle' | 'sensing' | 'evaluating' | 'acting', signal: number): {
    next: string;
    action: string;
    provenance: string[];
};
export declare function retrieveIntuitionMemory(query: string, memories: {
    content: string;
    weight: number;
}[], limit?: number): {
    retrieved: string[];
    provenance: string[];
};
export declare function mergeIntuitions(intuitions: {
    source: string;
    value: number;
    weight: number;
}[]): {
    merged: number;
    dominantSource: string;
    provenance: string[];
};
export declare function evaluateIntuitionTrigger(conditions: {
    name: string;
    met: boolean;
    weight: number;
}[], threshold?: number): {
    triggered: boolean;
    score: number;
    provenance: string[];
};
export declare function learnFromFeedback(history: {
    prediction: number;
    outcome: number;
    weight: number;
}[]): {
    adjustment: number;
    learningRate: number;
    provenance: string[];
};
export declare function comprehensiveIntuitionAssessment(signals: IntuitionSignal[], context: {
    riskTolerance: number;
    timePressure: number;
}): {
    score: number;
    action: 'act' | 'wait' | 'abort';
    provenance: string[];
};
