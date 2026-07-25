/**
 * MetaGO Engine - A5 T2 算法 · 元进化引擎封装类（ALG_T2_E_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 81~100 项（元进化引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 evolution-engine 的私有辅助方法
 *   - 处理五阶段循环、进化追踪、进化适应度、进化加速
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface EvolutionStage {
    name: 'boundary_sense' | 'gap_analysis' | 'self_generate' | 'verify' | 'recurse';
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    output: string;
    duration: number;
}
export interface EvolutionTrace {
    cycleId: string;
    stages: EvolutionStage[];
    fitnessBefore: number;
    fitnessAfter: number;
    timestamp: number;
}
export declare function evolutionFiveStageCycle(initialFitness: number, boundaryDescription: string): {
    trace: EvolutionStage[];
    finalFitness: number;
    improved: boolean;
    provenance: string[];
};
export declare function evolutionBoundarySense(capabilities: {
    name: string;
    proficiency: number;
}[], challenges: {
    name: string;
    requiredProficiency: number;
}[]): {
    boundaries: {
        challenge: string;
        gap: number;
        severity: string;
    }[];
    criticalCount: number;
    provenance: string[];
};
export declare function evolutionGapAnalysis(current: Record<string, number>, target: Record<string, number>): {
    gaps: {
        dimension: string;
        current: number;
        target: number;
        gap: number;
    }[];
    totalGap: number;
    priority: string;
    provenance: string[];
};
export declare function evolutionSelfGenerate(gap: {
    dimension: string;
    magnitude: number;
}, availablePrimitives: string[]): {
    synthesized: string;
    complexity: number;
    estimatedEffectiveness: number;
    provenance: string[];
};
export declare function evolutionVerify(before: number, after: number, target: number, regression?: number): {
    passed: boolean;
    improvement: number;
    regressionDetected: boolean;
    provenance: string[];
};
export declare function evolutionRecurseTrigger(currentFitness: number, threshold?: number, maxDepth?: number, currentDepth?: number): {
    shouldRecurse: boolean;
    nextDepth: number;
    reason: string;
    provenance: string[];
};
export declare function evolutionFitness(metrics: {
    capability: number;
    adaptability: number;
    robustness: number;
    efficiency: number;
}): {
    fitness: number;
    dominant: string;
    provenance: string[];
};
export declare function evolutionHistoryTrace(traces: EvolutionTrace[]): {
    totalCycles: number;
    avgImprovement: number;
    convergenceTrend: string;
    provenance: string[];
};
export declare function evolutionAccelerate(currentRate: number, accelerators: {
    name: string;
    factor: number;
}[]): {
    acceleratedRate: number;
    bestAccelerator: string;
    provenance: string[];
};
export declare function evolutionStagnationDetect(fitnessHistory: number[], windowSize?: number, threshold?: number): {
    stagnant: boolean;
    duration: number;
    avgDelta: number;
    provenance: string[];
};
export declare function evolutionPathPlanning(current: number, target: number, availableSteps: {
    name: string;
    expectedGain: number;
    cost: number;
}[], maxSteps?: number): {
    path: string[];
    totalGain: number;
    totalCost: number;
    provenance: string[];
};
export declare function evolutionDiversityMaintain(population: {
    id: string;
    traits: number[];
}[]): {
    diversity: number;
    uniqueCount: number;
    shouldMutate: boolean;
    provenance: string[];
};
export declare function evolutionAssessmentReport(trace: EvolutionTrace, axioms: string[]): {
    score: number;
    grade: string;
    findings: string[];
    provenance: string[];
};
export declare function evolutionThresholdAdapt(history: number[], baseThreshold: number, adaptRate?: number): {
    threshold: number;
    converged: boolean;
    provenance: string[];
};
export declare function evolutionRollback(currentFitness: number, previousFitness: number, regressionThreshold?: number): {
    shouldRollback: boolean;
    reason: string;
    provenance: string[];
};
export declare function evolutionEfficiency(input: {
    cycles: number;
    totalTime: number;
    totalGain: number;
    resourcesUsed: number;
}): {
    efficiency: number;
    gainPerCycle: number;
    gainPerResource: number;
    provenance: string[];
};
export declare function evolutionStressTest(system: {
    fitness: number;
    robustness: number;
}, stressors: {
    name: string;
    intensity: number;
}[]): {
    survived: boolean;
    minFitness: number;
    failedStressors: string[];
    provenance: string[];
};
export declare function evolutionCoEvolve(agents: {
    id: string;
    fitness: number;
    specialization: number;
}[]): {
    synergy: number;
    complementaryPairs: [string, string][];
    provenance: string[];
};
export declare function evolutionGoalAlign(current: {
    fitness: number;
    direction: number;
}, target: {
    fitness: number;
    direction: number;
}): {
    alignment: number;
    deviation: number;
    action: string;
    provenance: string[];
};
export declare function evolutionComprehensiveAssessment(metrics: {
    fitness: number;
    improvement: number;
    stability: number;
    diversity: number;
    efficiency: number;
}): {
    overall: number;
    stage: 'infant' | 'growing' | 'mature' | 'declining';
    provenance: string[];
};
