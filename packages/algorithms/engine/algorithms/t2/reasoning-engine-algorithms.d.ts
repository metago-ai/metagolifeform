/**
 * MetaGO Engine - A5 T2 算法 · 推理引擎封装类（ALG_T2_R_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 241~260 项（推理引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 cuv-reasoner / reasoning engine 的私有辅助方法
 *   - 处理 FIPO 四阶段、因果推理、反事实、多步推理
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface ReasoningStep {
    id: string;
    type: 'premise' | 'inference' | 'conclusion';
    content: string;
    confidence: number;
    dependencies: string[];
}
export interface CausalLink {
    cause: string;
    effect: string;
    strength: number;
    delay: number;
}
export declare function fipoReasoning(problem: string, context: string[]): {
    frame: string;
    inspect: string[];
    ponder: string;
    output: string;
    provenance: string[];
};
export declare function causalReasoning(cause: string, effect: string, observations: {
    causePresent: boolean;
    effectPresent: boolean;
}[]): {
    causalStrength: number;
    confidence: number;
    direction: string;
    provenance: string[];
};
export declare function counterfactualReasoning(actual: {
    condition: string;
    outcome: string;
}, hypothetical: {
    condition: string;
    outcome: string;
}): {
    difference: string;
    necessity: number;
    sufficiency: number;
    provenance: string[];
};
export declare function multiStepReasoningChain(start: string, steps: {
    premise: string;
    conclusion: string;
    rule: string;
}[], maxSteps?: number): {
    chain: ReasoningStep[];
    reached: string | null;
    valid: boolean;
    provenance: string[];
};
export declare function abductiveReasoning(observations: string[], hypotheses: {
    name: string;
    explains: string[];
    prior: number;
    complexity: number;
}[]): {
    bestExplanation: string;
    score: number;
    alternatives: {
        name: string;
        score: number;
    }[];
    provenance: string[];
};
export declare function deductiveReasoning(premises: string[], rules: {
    if: string[];
    then: string;
}[]): {
    conclusions: string[];
    valid: boolean;
    provenance: string[];
};
export declare function inductiveReasoning(instances: {
    features: string[];
    label: string;
}[]): {
    rule: string;
    confidence: number;
    coverage: number;
    provenance: string[];
};
export declare function analogicalReasoning(source: {
    domain: string;
    structure: {
        relations: [string, string, string][];
    };
}, target: {
    domain: string;
    structure: {
        relations: [string, string, string][];
    };
}): {
    mapping: {
        source: string;
        target: string;
    }[];
    confidence: number;
    provenance: string[];
};
export declare function modalReasoning(proposition: string, modality: 'necessary' | 'possible' | 'impossible', worlds: {
    name: string;
    truths: Set<string>;
}[]): {
    valid: boolean;
    satisfiedIn: string[];
    provenance: string[];
};
export declare function probabilisticReasoning(prior: number, likelihood: number, evidence: number): {
    posterior: number;
    confidence: number;
    provenance: string[];
};
export declare function fuzzyReasoning(inputs: {
    variable: string;
    value: number;
    membership: {
        low: number;
        medium: number;
        high: number;
    };
}, rules: {
    if: string;
    then: string;
    weight: number;
}[]): {
    output: {
        variable: string;
        value: number;
    };
    defuzzified: number;
    provenance: string[];
};
export declare function temporalReasoning(events: {
    name: string;
    time: number;
    duration: number;
}[], query: {
    type: 'before' | 'after' | 'during';
    eventA: string;
    eventB: string;
}): {
    holds: boolean;
    description: string;
    provenance: string[];
};
export declare function spatialReasoning(objects: {
    name: string;
    x: number;
    y: number;
    z: number;
}[], query: {
    type: 'distance' | 'contains' | 'adjacent';
    a: string;
    b: string;
    threshold?: number;
}): {
    result: number | boolean;
    description: string;
    provenance: string[];
};
export declare function metaReasoning(reasoningResult: {
    confidence: number;
    steps: number;
    contradictions: number;
    assumptions: number;
}): {
    metaConfidence: number;
    quality: string;
    recommendations: string[];
    provenance: string[];
};
export declare function reasoningChainValidate(chain: ReasoningStep[], axioms: Set<string>): {
    valid: boolean;
    invalidSteps: string[];
    coverage: number;
    provenance: string[];
};
export declare function reasoningPathSearch(graph: {
    nodes: string[];
    edges: {
        from: string;
        to: string;
        rule: string;
    }[];
}, start: string, goal: string, maxLength?: number): {
    path: string[];
    rules: string[];
    found: boolean;
    provenance: string[];
};
export declare function reasoningConflictResolve(conflicts: {
    claimA: string;
    claimB: string;
    evidence: {
        supportsA: number;
        supportsB: number;
    };
}): {
    resolution: string;
    winner: string;
    confidence: number;
    provenance: string[];
};
export declare function hypothesisGenerate(observations: string[], knowledgeBase: {
    fact: string;
    related: string[];
}[]): {
    hypotheses: {
        statement: string;
        plausibility: number;
        supportingEvidence: string[];
    }[];
    provenance: string[];
};
export declare function reasoningOptimize(chain: ReasoningStep[]): {
    optimized: ReasoningStep[];
    removed: number;
    provenance: string[];
};
export declare function reasoningComprehensiveAssessment(metrics: {
    validity: number;
    soundness: number;
    completeness: number;
    efficiency: number;
    clarity: number;
}): {
    overall: number;
    grade: string;
    provenance: string[];
};
