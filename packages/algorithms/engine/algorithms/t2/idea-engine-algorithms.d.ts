/**
 * MetaGO Engine - A5 T2 算法 · 思想引擎封装类（ALG_T2_H_001~020）
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface Idea {
    id: string;
    content: string;
    novelty: number;
    feasibility: number;
    impact: number;
}
export interface IdeaGraph {
    nodes: Idea[];
    edges: {
        from: string;
        to: string;
        strength: number;
    }[];
}
export declare function evaluateIdeaGeneration(idea: Idea, criteria: {
    novelty: number;
    feasibility: number;
    impact: number;
}): {
    score: number;
    grade: string;
    provenance: string[];
};
export declare function analyzeIdeaAssociations(ideas: Idea[], similarityFn?: (a: string, b: string) => number): {
    graph: IdeaGraph;
    clusters: string[][];
    provenance: string[];
};
export declare function traceIdeaEvolution(timeline: {
    idea: Idea;
    timestamp: number;
    parent?: string;
}[]): {
    lineage: Record<string, string[]>;
    depth: number;
    provenance: string[];
};
export declare function combineIdeas(ideas: Idea[], combinationStrategy?: 'intersection' | 'union' | 'average'): {
    combined: string;
    novelty: number;
    feasibility: number;
    impact: number;
    provenance: string[];
};
export declare function detectIdeaDivergence(ideas: Idea[], threshold?: number): {
    divergent: boolean;
    maxDivergence: number;
    clusters: number;
    provenance: string[];
};
export declare function rankIdeas(ideas: Idea[], weights?: {
    novelty: number;
    feasibility: number;
    impact: number;
}): {
    ranked: Idea[];
    topIdea: string | null;
    provenance: string[];
};
export declare function filterIdeas(ideas: Idea[], filters: {
    minNovelty?: number;
    minFeasibility?: number;
    minImpact?: number;
}): {
    kept: Idea[];
    removed: number;
    provenance: string[];
};
export declare function mutateIdea(idea: Idea, mutationRate?: number): {
    mutated: Idea;
    changes: string[];
    provenance: string[];
};
export declare function crossoverIdeas(parent1: Idea, parent2: Idea): {
    offspring: Idea[];
    provenance: string[];
};
export declare function selectEliteIdeas(ideas: Idea[], eliteRatio?: number): {
    elite: Idea[];
    threshold: number;
    provenance: string[];
};
export declare function assessIdeaDiversity(ideas: Idea[]): {
    diversity: number;
    uniqueNovelty: number;
    uniqueFeasibility: number;
    provenance: string[];
};
export declare function detectIdeaConvergence(history: {
    generation: number;
    avgScore: number;
}[], threshold?: number): {
    converged: boolean;
    rate: number;
    provenance: string[];
};
export declare function identifyInspirationSource(idea: Idea, sources: {
    id: string;
    content: string;
    novelty: number;
}[]): {
    source: string | null;
    similarity: number;
    provenance: string[];
};
export declare function assessIdeaImpactScope(idea: Idea, domains: {
    name: string;
    relevance: number;
}[]): {
    totalImpact: number;
    primaryDomain: string | null;
    provenance: string[];
};
export declare function analyzeIdeaFeasibility(idea: Idea, constraints: {
    resources: number;
    technology: number;
    time: number;
}): {
    feasibility: number;
    bottleneck: string;
    provenance: string[];
};
export declare function assessIdeaNovelty(idea: Idea, existing: Idea[]): {
    noveltyScore: number;
    isNovel: boolean;
    similarCount: number;
    provenance: string[];
};
export declare function planIdeaImplementation(idea: Idea, phases: {
    name: string;
    difficulty: number;
    duration: number;
}[]): {
    plan: string[];
    totalDifficulty: number;
    estimatedDuration: number;
    provenance: string[];
};
export declare function assessIdeaRisk(idea: Idea, riskFactors: {
    name: string;
    severity: number;
    probability: number;
}[]): {
    totalRisk: number;
    highRiskFactors: string[];
    provenance: string[];
};
export declare function integrateIdeaFeedback(idea: Idea, feedback: {
    source: string;
    rating: number;
    comment: string;
}[]): {
    adjustedIdea: Idea;
    confidence: number;
    provenance: string[];
};
export declare function comprehensiveIdeaAssessment(idea: Idea, context: {
    existing: Idea[];
    constraints: {
        resources: number;
        technology: number;
        time: number;
    };
}): {
    overallScore: number;
    novelty: number;
    feasibility: number;
    impact: number;
    recommendation: string;
    provenance: string[];
};
