/**
 * MetaGO Engine - A5 T1 算法 · 元创造类（第二批）
 *
 * 对应公理：A5 内生公理 / A35 创造进化律 / D40 全息创造性
 * 对应文档：附录A·T1·CREATION（ALG_T1_M_001 ~ ALG_T1_M_015）
 *
 * 算法清单（15 个）：
 *   001 新颖思想生成    002 约束对齐        003 新颖度评分
 *   004 创造触发        005 创造原语        006 创造完整性检查
 *   007 历史负熵        008 创造治理        009 发散生成
 *   010 收敛精炼        011 创造变异        012 创造重组
 *   013 创造选择        014 创造适应度      015 创造谱系
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface CreationIdea {
    id: string;
    content: string;
    features: number[];
    novelty: number;
}
export interface CreationConstraint {
    name: string;
    hard: boolean;
    weight: number;
    satisfied: boolean;
}
export declare function generateNovelIdea(seedFeatures: number[], corpus: number[][], mutationScale?: number, rng?: () => number): {
    idea: number[];
    distance: number;
    provenance: string[];
};
export declare function constraintAlignment(idea: number[], constraints: {
    min: number[];
    max: number[];
}[]): {
    aligned: number[];
    violations: number;
    satisfied: number;
    provenance: string[];
};
export declare function noveltyScore(idea: number[], corpus: number[][]): {
    score: number;
    nearestDistance: number;
    provenance: string[];
};
export declare function creationTrigger(context: {
    integrity: number;
    gap: number;
    pressure: number;
    lastCreation: number;
    now: number;
}, thresholds: {
    integrityHigh: number;
    gapMin: number;
    pressureMin: number;
    cooldownMs: number;
}): {
    triggered: boolean;
    reasons: string[];
    provenance: string[];
};
export declare function creationPrimitive(type: 'combine' | 'invert' | 'extrapolate' | 'abstract', inputs: number[][]): {
    result: number[];
    primitiveType: string;
    provenance: string[];
};
export declare function creationIntegrityCheck(idea: number[], requiredDimensions: number, constraints?: {
    min: number;
    max: number;
}): {
    complete: boolean;
    missing: number;
    outOfRange: number;
    integrity: number;
    provenance: string[];
};
export declare function historyNegentropy(history: number[][]): {
    negentropy: number;
    trend: number;
    provenance: string[];
};
export declare function creationGovernor(proposal: {
    content: string;
    risk: number;
    value: number;
    novelty: number;
}, policy: {
    maxRisk: number;
    minValue: number;
    minNovelty: number;
}): {
    approved: boolean;
    reasons: string[];
    provenance: string[];
};
export declare function divergentGeneration(seed: number[], count: number, spread?: number, rng?: () => number): {
    ideas: number[][];
    spread: number;
    provenance: string[];
};
export declare function convergentRefinement(ideas: number[][], objective: number[], iterations?: number): {
    refined: number[];
    convergence: number;
    provenance: string[];
};
export declare function creationMutation(idea: number[], mutationType: 'gaussian' | 'uniform' | 'boundary', rate?: number, magnitude?: number, rng?: () => number): {
    mutated: number[];
    mutationCount: number;
    provenance: string[];
};
export declare function creationRecombination(parentA: number[], parentB: number[], strategy?: 'single-point' | 'two-point' | 'uniform', rng?: () => number): {
    offspring: number[];
    points: number[];
    provenance: string[];
};
export declare function creationSelection(candidates: CreationIdea[], criteria: {
    noveltyWeight: number;
    feasibilityWeight: number;
    impactWeight: number;
}, feasibilityFn?: (idea: CreationIdea) => number, impactFn?: (idea: CreationIdea) => number): {
    selected: CreationIdea | null;
    scores: {
        id: string;
        score: number;
    }[];
    provenance: string[];
};
export declare function creationFitness(idea: CreationIdea, objectives: {
    novelty: number;
    feasibility: number;
    impact: number;
    coherence: number;
}): {
    fitness: number;
    breakdown: Record<string, number>;
    provenance: string[];
};
export declare function creationLineage(creations: {
    id: string;
    parentId: string | null;
    generation: number;
    fitness: number;
}[]): {
    tree: Map<string | null, string[]>;
    generations: number;
    bestChain: string[];
    provenance: string[];
};
