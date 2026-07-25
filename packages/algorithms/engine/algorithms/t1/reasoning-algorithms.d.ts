/**
 * MetaGO Engine - A5 T1 算法 · 推理类（第二批）
 *
 * 对应属性：D37 战略思考强制触发 / FIPO 四阶段推理
 * 对应文档：附录A·T1·REASONING（ALG_T1_R_001 ~ ALG_T1_R_015）
 *
 * 算法清单（15 个）：
 *   001 演绎推理      002 归纳推理        003 溯因推理
 *   004 类比推理      005 因果推理        006 反事实推理
 *   007 模态推理      008 时序推理        009 空间推理
 *   010 数量推理      011 定性推理        012 模糊推理
 *   013 概率推理      014 启发式推理      015 前向链推理
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface Rule {
    premises: string[];
    conclusion: string;
    confidence: number;
}
export interface Fact {
    statement: string;
    truth: boolean;
    confidence: number;
}
export declare function deductiveReasoning(premises: Fact[], rules: Rule[]): {
    conclusions: {
        statement: string;
        confidence: number;
        rule: string;
    }[];
    provenance: string[];
};
export declare function inductiveReasoning(observations: {
    instance: string;
    features: Record<string, boolean>;
    category: string;
}[]): {
    generalizations: {
        feature: string;
        category: string;
        support: number;
        confidence: number;
    }[];
    provenance: string[];
};
export declare function abductiveReasoning(observation: string, hypotheses: {
    explanation: string;
    priorProbability: number;
    explanatoryPower: number;
}[]): {
    bestExplanation: string | null;
    ranked: {
        explanation: string;
        score: number;
    }[];
    provenance: string[];
};
export declare function analogicalReasoning(source: {
    domain: string;
    attributes: Record<string, number>;
    relations: [string, string, string][];
}, target: {
    domain: string;
    attributes: Record<string, number>;
    relations: [string, string, string][];
}): {
    mappedAttributes: {
        source: string;
        target: string;
        similarity: number;
    }[];
    inferredRelations: [string, string, string][];
    provenance: string[];
};
export declare function causalReasoning(events: {
    cause: string;
    effect: string;
    timestamp: number;
    strength: number;
}[]): {
    causalGraph: Map<string, Map<string, number>>;
    strongCauses: {
        cause: string;
        effect: string;
        strength: number;
    }[];
    provenance: string[];
};
export declare function counterfactualReasoning(actual: {
    condition: boolean[];
    outcome: number;
}, counterfactual: {
    condition: boolean[];
    outcome?: number;
}, model: {
    weights: number[];
    bias: number;
}): {
    estimatedOutcome: number;
    difference: number;
    provenance: string[];
};
export declare function modalReasoning(propositions: {
    statement: string;
    modality: 'necessary' | 'possible' | 'impossible';
    truth: boolean;
}[]): {
    necessary: string[];
    possible: string[];
    impossible: string[];
    contradictions: string[];
    provenance: string[];
};
export declare function temporalReasoning(events: {
    id: string;
    time: number;
    before?: string;
    after?: string;
}[]): {
    ordered: string[];
    violations: string[];
    provenance: string[];
};
export declare function spatialReasoning(objects: {
    id: string;
    x: number;
    y: number;
    z?: number;
}[], query: {
    type: 'distance' | 'contains' | 'adjacent';
    a: string;
    b: string;
    threshold?: number;
}): {
    result: number | boolean;
    provenance: string[];
};
export declare function quantitativeReasoning(values: number[], query: {
    type: 'sum' | 'average' | 'median' | 'mode' | 'stddev' | 'range' | 'percentile';
    percentile?: number;
}): {
    result: number;
    provenance: string[];
};
export declare function qualitativeReasoning(variables: {
    name: string;
    value: number;
    derivative: 'increasing' | 'decreasing' | 'stable';
}[], relations: {
    cause: string;
    effect: string;
    influence: 'positive' | 'negative';
}[]): {
    predictions: {
        variable: string;
        trend: 'increasing' | 'decreasing' | 'stable' | 'ambiguous';
    }[];
    provenance: string[];
};
export declare function fuzzyReasoning(inputs: {
    name: string;
    value: number;
    membership: {
        low: [number, number];
        medium: [number, number];
        high: [number, number];
    };
}, rules: {
    if: {
        name: string;
        set: 'low' | 'medium' | 'high';
    }[];
    then: {
        name: string;
        set: 'low' | 'medium' | 'high';
    };
}[]): {
    output: {
        name: string;
        set: string;
        membership: number;
    }[];
    provenance: string[];
};
export declare function probabilisticReasoning(prior: number, evidence: {
    likelihood: number;
    observed: boolean;
}[]): {
    posterior: number;
    confidence: number;
    provenance: string[];
};
export declare function heuristicReasoning(problem: {
    description: string;
    features: Record<string, number>;
}, heuristics: {
    name: string;
    condition: (features: Record<string, number>) => boolean;
    action: string;
    priority: number;
}[]): {
    selectedHeuristic: string | null;
    action: string | null;
    provenance: string[];
};
export declare function forwardChaining(facts: Fact[], rules: Rule[], maxIterations?: number): {
    derived: Fact[];
    iterations: number;
    provenance: string[];
};
