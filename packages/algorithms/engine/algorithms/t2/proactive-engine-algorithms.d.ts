/**
 * MetaGO Engine - A5 T2 算法 · 主动引擎封装类（ALG_T2_P_001~020）
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface ProactiveSignal {
    source: string;
    urgency: number;
    importance: number;
    timestamp: number;
}
export interface ProactiveAction {
    name: string;
    priority: number;
    estimatedImpact: number;
    cost: number;
}
export declare function detectProactiveSignal(signals: ProactiveSignal[], threshold?: number): {
    detected: ProactiveSignal[];
    maxUrgency: number;
    provenance: string[];
};
export declare function prioritizeProactiveActions(actions: ProactiveAction[]): {
    ranked: ProactiveAction[];
    topAction: string | null;
    provenance: string[];
};
export declare function assessProactiveTiming(signal: ProactiveSignal, context: {
    load: number;
    availability: number;
}): {
    shouldAct: boolean;
    optimalDelay: number;
    provenance: string[];
};
export declare function evaluateProactiveTrigger(conditions: {
    name: string;
    met: boolean;
    weight: number;
}[], threshold?: number): {
    triggered: boolean;
    score: number;
    unmet: string[];
    provenance: string[];
};
export declare function predictProactiveImpact(action: ProactiveAction, context: {
    receptivity: number;
    stability: number;
}): {
    expectedImpact: number;
    riskLevel: number;
    provenance: string[];
};
export declare function assessProactiveSuppression(signals: ProactiveSignal[], suppressionThreshold?: number): {
    suppressed: number;
    active: number;
    provenance: string[];
};
export declare function learnProactiveFeedback(history: {
    action: string;
    success: boolean;
    impact: number;
}[]): {
    learningRate: number;
    adjustment: Record<string, number>;
    provenance: string[];
};
export declare function proactiveCooldown(lastTriggerTime: number, currentTime: number, cooldownMs: number): {
    ready: boolean;
    remainingMs: number;
    provenance: string[];
};
export declare function controlProactiveFrequency(triggers: {
    time: number;
}[], windowMs: number, maxTriggers: number): {
    allowed: boolean;
    count: number;
    provenance: string[];
};
export declare function assessProactiveScope(action: ProactiveAction, affectedAreas: {
    name: string;
    sensitivity: number;
}[]): {
    totalScope: number;
    criticalAreas: string[];
    provenance: string[];
};
export declare function assessProactiveResources(required: {
    cpu: number;
    memory: number;
    time: number;
}, available: {
    cpu: number;
    memory: number;
    time: number;
}): {
    sufficient: boolean;
    deficit: Record<string, number>;
    provenance: string[];
};
export declare function modelProactiveContext(signals: ProactiveSignal[], history: {
    action: string;
    timestamp: number;
}[]): {
    contextScore: number;
    patterns: string[];
    provenance: string[];
};
export declare function proactiveDecisionTree(signal: ProactiveSignal, context: {
    availability: number;
    load: number;
}): {
    decision: string;
    path: string[];
    provenance: string[];
};
export declare function assessProactiveRisk(action: ProactiveAction, context: {
    stability: number;
    reversibility: number;
}): {
    riskScore: number;
    acceptable: boolean;
    provenance: string[];
};
export declare function evaluateProactiveEffect(before: number, after: number, expected: number): {
    actualChange: number;
    expectedChange: number;
    effectiveness: number;
    provenance: string[];
};
export declare function selectProactiveStrategy(strategies: {
    name: string;
    effectiveness: number;
    cost: number;
    risk: number;
}[], context: {
    riskTolerance: number;
    budgetConstraint: number;
}): {
    strategy: string | null;
    netScore: number;
    provenance: string[];
};
export declare function analyzeProactiveHistory(history: {
    action: string;
    timestamp: number;
    success: boolean;
}[], windowMs?: number): {
    totalActions: number;
    successRate: number;
    recentActivity: number;
    provenance: string[];
};
export declare function adaptProactiveThreshold(currentThreshold: number, falsePositives: number, falseNegatives: number, learningRate?: number): {
    newThreshold: number;
    adjustment: number;
    provenance: string[];
};
export declare function scheduleProactiveAction(action: ProactiveAction, scheduledTime: number, constraints: {
    earliest: number;
    latest: number;
    conflicts: number[];
}): {
    scheduled: number | null;
    conflictResolved: boolean;
    provenance: string[];
};
export declare function comprehensiveProactiveAssessment(signals: ProactiveSignal[], context: {
    availability: number;
    load: number;
    stability: number;
}, actions: ProactiveAction[]): {
    shouldProact: boolean;
    recommendedAction: string | null;
    confidence: number;
    provenance: string[];
};
