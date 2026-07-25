/**
 * MetaGO Engine - A5 T2 算法 · 学习引擎封装类（ALG_T2_G_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 221~240 项（学习引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 learning engine 的私有辅助方法
 *   - 处理模式提取、技能生成、反馈循环、自适应学习
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface LearningSample {
    input: unknown;
    output: unknown;
    correct: boolean;
    timestamp: number;
}
export interface LearningPattern {
    id: string;
    pattern: string;
    frequency: number;
    confidence: number;
    examples: unknown[];
}
export declare function patternExtract(samples: LearningSample[], minFrequency?: number): {
    patterns: LearningPattern[];
    coverage: number;
    provenance: string[];
};
export declare function skillGenerate(patterns: LearningPattern[], threshold?: number): {
    skills: {
        name: string;
        pattern: string;
        proficiency: number;
    }[];
    provenance: string[];
};
export declare function feedbackLoop(predictions: {
    predicted: unknown;
    actual: unknown;
    correct: boolean;
}[]): {
    accuracy: number;
    errorRate: number;
    improvement: number;
    provenance: string[];
};
export declare function adaptiveLearningRate(errorHistory: number[], initialRate?: number, decay?: number, minRate?: number): {
    rate: number;
    converged: boolean;
    provenance: string[];
};
export declare function knowledgeTransfer(source: {
    domain: string;
    skills: {
        name: string;
        proficiency: number;
    }[];
}, target: {
    domain: string;
    existingSkills: string[];
}, similarity: number): {
    transferred: {
        name: string;
        adjustedProficiency: number;
    }[];
    transferRate: number;
    provenance: string[];
};
export declare function learningCurve(performances: {
    trial: number;
    performance: number;
}[]): {
    asymptote: number;
    rate: number;
    plateaued: boolean;
    provenance: string[];
};
export declare function experienceReplay(experiences: LearningSample[], batchSize?: number, prioritizeCorrect?: boolean): {
    batch: LearningSample[];
    provenance: string[];
};
export declare function reinforcementSignal(actions: {
    action: string;
    reward: number;
    timestamp: number;
}[], discountFactor?: number): {
    qValues: {
        action: string;
        qValue: number;
    }[];
    bestAction: string;
    provenance: string[];
};
export declare function curriculumLearning(tasks: {
    id: string;
    difficulty: number;
    prerequisite?: string;
}[], currentLevel: number): {
    sequence: string[];
    nextTask: string | null;
    provenance: string[];
};
export declare function knowledgeGraphBuild(facts: {
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
}[]): {
    nodes: Set<string>;
    edges: {
        from: string;
        to: string;
        predicate: string;
        weight: number;
    }[];
    provenance: string[];
};
export declare function learningStrategySelect(task: {
    type: string;
    difficulty: number;
    dataVolume: number;
}, strategies: {
    name: string;
    suitableTypes: string[];
    difficultyRange: [number, number];
    dataReq: number;
}[]): {
    selected: string;
    alternatives: string[];
    provenance: string[];
};
export declare function overfittingDetect(trainingError: number[], validationError: number[], patience?: number): {
    overfitted: boolean;
    divergencePoint: number;
    provenance: string[];
};
export declare function modelDistill(teacher: {
    predictions: {
        input: unknown;
        output: unknown;
    }[];
}, student: {
    predictions: {
        input: unknown;
        output: unknown;
    }[];
}): {
    distillationLoss: number;
    alignment: number;
    provenance: string[];
};
export declare function activeLearningSelect(unlabeled: {
    id: string;
    features: number[];
    uncertainty: number;
}[], budget: number): {
    selected: string[];
    expectedInformationGain: number;
    provenance: string[];
};
export declare function onlineLearningUpdate(model: {
    weights: number[];
    bias: number;
}, sample: {
    features: number[];
    label: number;
}, learningRate?: number): {
    updatedModel: {
        weights: number[];
        bias: number;
    };
    loss: number;
    provenance: string[];
};
export declare function ensembleLearning(models: {
    name: string;
    predictions: {
        id: string;
        value: number;
    }[];
}[], method?: 'average' | 'majority' | 'weighted', weights?: number[]): {
    ensemble: {
        id: string;
        value: number;
    }[];
    provenance: string[];
};
export declare function gradientCalculate(lossFn: (params: number[]) => number, params: number[], epsilon?: number): {
    gradient: number[];
    provenance: string[];
};
export declare function learningAssess(results: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    samples: number;
}): {
    overall: number;
    grade: string;
    recommendations: string[];
    provenance: string[];
};
export declare function knowledgeConsolidate(shortTerm: {
    id: string;
    content: string;
    strength: number;
}[], longTerm: {
    id: string;
    content: string;
    strength: number;
}[], threshold?: number): {
    consolidated: {
        id: string;
        content: string;
        strength: number;
    }[];
    newKnowledge: {
        id: string;
        content: string;
        strength: number;
    }[];
    provenance: string[];
};
export declare function learningComprehensiveAssessment(metrics: {
    accuracy: number;
    convergence: number;
    generalization: number;
    efficiency: number;
    robustness: number;
}): {
    overall: number;
    stage: string;
    provenance: string[];
};
