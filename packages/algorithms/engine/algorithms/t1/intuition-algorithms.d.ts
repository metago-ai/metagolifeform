/**
 * MetaGO Engine - A5 T1 算法 · 直觉类（第二批）
 *
 * 对应属性：D40 全息创造性 / 直觉认知模型
 * 对应文档：附录A·T1·INTUITION（ALG_T1_I_001 ~ ALG_T1_I_015）
 *
 * 算法清单（15 个）：
 *   001 模式识别直觉    002 启发式直觉      003 联想直觉
 *   004 第六感计算      005 直觉置信度      006 直觉校准
 *   007 专家直觉        008 模式匹配        009 直觉触发
 *   010 直觉聚合        011 直觉衰减        012 直觉冲突
 *   013 直觉学习        014 直觉溯源        015 直觉验证
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface IntuitionSignal {
    source: string;
    strength: number;
    feature: string;
}
export interface Pattern {
    id: string;
    features: Record<string, number>;
    label: string;
    weight: number;
}
export declare function patternRecognitionIntuition(input: Record<string, number>, patterns: Pattern[]): {
    matchedPattern: Pattern | null;
    confidence: number;
    provenance: string[];
};
export declare function heuristicIntuition(situation: {
    context: string;
    urgency: number;
    familiarity: number;
}, heuristics: {
    name: string;
    applies: (s: typeof situation) => boolean;
    weight: number;
}[]): {
    selected: string | null;
    weight: number;
    provenance: string[];
};
export declare function associativeIntuition(cue: string, memory: {
    key: string;
    associations: {
        target: string;
        strength: number;
    }[];
}[]): {
    associations: {
        target: string;
        strength: number;
    }[];
    topAssociation: string | null;
    provenance: string[];
};
export declare function sixthSense(signals: IntuitionSignal[], threshold?: number): {
    triggered: boolean;
    aggregateStrength: number;
    dominantSource: string | null;
    provenance: string[];
};
export declare function intuitionConfidence(intuition: {
    strength: number;
    evidenceCount: number;
    consistency: number;
    expertiseLevel: number;
}): {
    confidence: number;
    calibrated: number;
    provenance: string[];
};
export declare function intuitionCalibration(historicalIntuitions: {
    predicted: number;
    actual: number;
    confidence: number;
}[]): {
    calibrationScore: number;
    bias: number;
    resolution: number;
    provenance: string[];
};
export declare function expertIntuition(situation: {
    cues: string[];
    goals: string[];
    expectations: Record<string, boolean>;
}, experience: {
    patterns: {
        match: string[];
        action: string;
        typicality: number;
    }[];
}): {
    action: string | null;
    recognizedPattern: string | null;
    expectanciesViolated: boolean;
    provenance: string[];
};
export declare function patternMatching(query: number[], dataset: {
    vector: number[];
    label: string;
}[], k?: number): {
    label: string | null;
    neighbors: {
        label: string;
        distance: number;
    }[];
    provenance: string[];
};
export declare function intuitionTrigger(signals: {
    source: string;
    intensity: number;
    novelty: number;
}[], triggerThreshold?: number, noveltyBonus?: number): {
    triggered: boolean;
    triggerScore: number;
    sources: string[];
    provenance: string[];
};
export declare function intuitionAggregation(intuitions: {
    hypothesis: string;
    belief: number;
    uncertainty: number;
}[]): {
    aggregated: {
        hypothesis: string;
        belief: number;
    }[];
    conflict: number;
    provenance: string[];
};
export declare function intuitionDecay(initialStrength: number, elapsed: number, halfLife?: number, reinforcementCount?: number): {
    currentStrength: number;
    decayFactor: number;
    provenance: string[];
};
export declare function intuitionConflict(intuitions: {
    source: string;
    direction: 'positive' | 'negative';
    strength: number;
}[]): {
    conflictLevel: number;
    dominantDirection: 'positive' | 'negative' | 'neutral';
    resolution: string;
    provenance: string[];
};
export declare function intuitionLearning(currentWeights: Record<string, number>, experiences: {
    pattern: string;
    outcome: 'success' | 'failure';
    learningRate: number;
}[]): {
    updatedWeights: Record<string, number>;
    totalAdjustment: number;
    provenance: string[];
};
export declare function intuitionProvenance(intuition: {
    id: string;
    strength: number;
}, sources: {
    id: string;
    contributes: number;
    type: 'experience' | 'pattern' | 'emotion' | 'knowledge';
}[]): {
    traceability: number;
    dominantSource: string | null;
    sourceBreakdown: Record<string, number>;
    provenance: string[];
};
export declare function intuitionValidation(intuition: {
    prediction: number;
    confidence: number;
}, evidence: {
    observation: number;
    reliability: number;
}[], tolerance?: number): {
    validated: boolean;
    deviation: number;
    adjustedConfidence: number;
    provenance: string[];
};
