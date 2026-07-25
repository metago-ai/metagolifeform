/**
 * MetaGO Engine - A5 T2 算法 · 元创造引擎封装类（ALG_T2_M_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 101~120 项（元创造引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 meta-create engine 的私有辅助方法
 *   - 处理 0→1 创造原语、约束对齐、完整性校验、创造触发
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface CreationPrimitive {
    type: 'concept' | 'structure' | 'process' | 'relation';
    content: string;
    novelty: number;
}
export interface CreationConstraint {
    name: string;
    constraint: (output: unknown) => boolean;
    weight: number;
}
export interface CreationTrigger {
    condition: string;
    threshold: number;
    current: number;
}
export declare function creationTriggerEvaluate(triggers: CreationTrigger[]): {
    shouldTrigger: boolean;
    matchedTriggers: string[];
    readiness: number;
    provenance: string[];
};
export declare function creationPrimitiveSynthesize(seeds: string[], constraints: CreationConstraint[]): {
    primitives: CreationPrimitive[];
    noveltyScore: number;
    provenance: string[];
};
export declare function creationConstraintAlign(output: unknown, constraints: CreationConstraint[]): {
    aligned: boolean;
    violations: string[];
    alignmentScore: number;
    provenance: string[];
};
export declare function creationIntegrityCheck(creation: {
    components: string[];
    relations: [string, string][];
    metadata: Record<string, unknown>;
}): {
    complete: boolean;
    missingComponents: string[];
    orphanRelations: [string, string][];
    provenance: string[];
};
export declare function creationNoveltyAssess(creation: string, knownCreations: string[]): {
    novelty: number;
    similarityToKnown: number;
    isNovel: boolean;
    provenance: string[];
};
export declare function creationUtilityAssess(creation: {
    name: string;
    capabilities: string[];
}, needs: string[]): {
    utility: number;
    matchedNeeds: string[];
    unmatchedNeeds: string[];
    provenance: string[];
};
export declare function creationFeasibility(creation: {
    complexity: number;
    resourceReq: number;
    timeReq: number;
}, available: {
    resources: number;
    time: number;
    expertise: number;
}): {
    feasible: boolean;
    feasibilityScore: number;
    bottlenecks: string[];
    provenance: string[];
};
export declare function creationIterateOptimize(current: {
    quality: number;
    issues: string[];
}, improvements: {
    issue: string;
    effectiveness: number;
}[], maxIterations?: number): {
    finalQuality: number;
    iterations: number;
    remainingIssues: string[];
    provenance: string[];
};
export declare function creationPathSelect(paths: {
    name: string;
    novelty: number;
    feasibility: number;
    utility: number;
}[]): {
    selected: string;
    score: number;
    rationale: string;
    provenance: string[];
};
export declare function creationRiskAssess(risks: {
    name: string;
    probability: number;
    impact: number;
    mitigation: string;
}[]): {
    totalRisk: number;
    highRisks: string[];
    mitigations: string[];
    provenance: string[];
};
export declare function creationProvenance(creation: {
    id: string;
    sources: string[];
    transformations: string[];
}): {
    chain: string[];
    hash: string;
    verified: boolean;
    provenance: string[];
};
export declare function creationImpactAssess(creation: {
    scope: number;
    magnitude: number;
    duration: number;
}, context: {
    totalScope: number;
    baseline: number;
}): {
    impactScore: number;
    relativeImpact: number;
    significance: string;
    provenance: string[];
};
export declare function creationSynergize(creations: {
    id: string;
    capabilities: string[];
    weight: number;
}[]): {
    synergized: string[];
    emergentCapabilities: string[];
    synergyScore: number;
    provenance: string[];
};
export declare function creationDecayMonitor(creation: {
    initialImpact: number;
    currentImpact: number;
    age: number;
}): {
    decayRate: number;
    remainingImpact: number;
    halfLife: number;
    provenance: string[];
};
export declare function creationEvolutionTrace(versions: {
    version: string;
    quality: number;
    timestamp: number;
}[]): {
    evolutionPath: string[];
    qualityTrend: string;
    improvementRate: number;
    provenance: string[];
};
export declare function creationValidationTest(creation: {
    spec: string[];
    implementation: string[];
}): {
    passed: boolean;
    specCoverage: number;
    missingImpl: string[];
    provenance: string[];
};
export declare function creationOptimizationDirection(current: {
    novelty: number;
    utility: number;
    feasibility: number;
}, weights?: {
    novelty: number;
    utility: number;
    feasibility: number;
}): {
    direction: string;
    priority: string;
    expectedGain: number;
    provenance: string[];
};
export declare function creationCombinatorialControl(options: {
    category: string;
    choices: string[];
}[], maxCombinations?: number): {
    feasible: boolean;
    totalCombinations: number;
    pruned: boolean;
    strategies: string[];
    provenance: string[];
};
export declare function creationQualityGrade(metrics: {
    novelty: number;
    utility: number;
    feasibility: number;
    impact: number;
    sustainability: number;
}): {
    grade: string;
    score: number;
    tier: string;
    provenance: string[];
};
export declare function creationComprehensiveAssessment(creation: {
    novelty: number;
    utility: number;
    feasibility: number;
    integrity: number;
    impact: number;
}): {
    overall: number;
    verdict: string;
    recommendations: string[];
    provenance: string[];
};
