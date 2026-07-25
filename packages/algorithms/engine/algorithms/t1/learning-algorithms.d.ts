/**
 * MetaGO Engine - A5 T1 算法 · 学习类（第二批）
 *
 * 对应属性：D40 全息创造性 / 元进化五阶段
 * 对应文档：附录A·T1·LEARNING（ALG_T1_G_001 ~ ALG_T1_G_015）
 *
 * 算法清单（15 个）：
 *   001 监督学习      002 无监督学习      003 强化学习
 *   004 迁移学习      005 主动学习        006 被动学习
 *   007 联想学习      008 习惯化          009 敏感化
 *   010 条件反射      011 观察学习        012 体验学习
 *   013 社会学习      014 元学习          015 课程学习
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface TrainingSample {
    features: number[];
    label: number;
}
export declare function supervisedLearn(samples: TrainingSample[], learningRate?: number, epochs?: number): {
    weights: number[];
    bias: number;
    finalLoss: number;
    provenance: string[];
};
export declare function unsupervisedLearn(data: number[][], k?: number, maxIterations?: number): {
    clusters: number[][];
    centroids: number[][];
    provenance: string[];
};
export declare function reinforcementLearn(episodes: {
    state: number;
    action: number;
    reward: number;
    nextState: number;
}[], numStates: number, numActions: number, learningRate?: number, discountFactor?: number): {
    qTable: number[][];
    totalReward: number;
    provenance: string[];
};
export declare function transferLearning(sourceModel: {
    weights: number[];
    bias: number;
}, targetSamples: TrainingSample[], learningRate?: number, epochs?: number, freezeRatio?: number): {
    weights: number[];
    bias: number;
    finalLoss: number;
    transferred: number;
    provenance: string[];
};
export declare function activeLearning(unlabeled: number[][], model: {
    weights: number[];
    bias: number;
}, budget?: number): {
    selected: number[];
    uncertainties: number[];
    provenance: string[];
};
export declare function passiveLearning(samples: TrainingSample[], model: {
    weights: number[];
    bias: number;
}, learningRate?: number): {
    updatedWeights: number[];
    updatedBias: number;
    lossReduction: number;
    provenance: string[];
};
export declare function associativeLearning(pairs: {
    stimulus: number[];
    response: number[];
}[], learningRate?: number): {
    association: number[][];
    strength: number;
    provenance: string[];
};
export declare function habituation(responses: {
    stimulus: string;
    intensity: number;
}[], decayRate?: number): {
    habituated: Map<string, number>;
    provenance: string[];
};
export declare function sensitization(responses: {
    stimulus: string;
    intensity: number;
}[], boostRate?: number): {
    sensitized: Map<string, number>;
    provenance: string[];
};
export declare function conditioning(trials: {
    cs: number[];
    us: number[];
    trial: number;
}[], learningRate?: number): {
    crWeights: number[];
    conditioned: boolean;
    provenance: string[];
};
export declare function observationalLearning(demonstrations: {
    actor: string;
    action: string;
    outcome: number;
    features: number[];
}[], observerModel: {
    weights: number[];
    bias: number;
}, learningRate?: number): {
    learned: number[];
    imitation: number;
    provenance: string[];
};
export declare function experientialLearning(experiences: {
    situation: number[];
    action: number;
    outcome: number;
    reflection: string;
}[]): {
    model: {
        weights: number[];
        bias: number;
    };
    insights: string[];
    provenance: string[];
};
export declare function socialLearning(agents: {
    id: string;
    behavior: number[];
    fitness: number;
}[], learningRate?: number): {
    learnedBehavior: number[];
    bestAgent: string;
    provenance: string[];
};
export declare function metaLearning(tasks: {
    samples: TrainingSample[];
    performance: number;
}[], metaLearningRate?: number): {
    metaParams: {
        initWeights: number[];
        initBias: number;
        learningRate: number;
    };
    provenance: string[];
};
export declare function curriculumLearning(allSamples: TrainingSample[], difficultyFn?: (sample: TrainingSample) => number, stages?: number): {
    curriculum: TrainingSample[][];
    stageThresholds: number[];
    provenance: string[];
};
