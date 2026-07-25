/**
 * MetaGO Engine - A5 T1 算法 · 冲突转化类（第二批）
 *
 * 对应属性：D39 直接批判性 / 耦生辩证法 / 矛盾识别
 * 对应文档：附录A·T1·CONFLICT（ALG_T1_X_001 ~ ALG_T1_X_015）
 *
 * 算法清单（15 个）：
 *   001 冲突检测        002 冲突强度计算      003 矛盾识别
 *   004 对立统一分析    005 冲突调解          006 共识寻求
 *   007 妥协方案生成    008 冲突升级预测      009 冲突降级
 *   010 多方博弈均衡    011 帕累托改进        012 纳什均衡
 *   013 零和检测        014 双赢策略          015 冲突溯源
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface ConflictParty {
    id: string;
    position: number[];
    interests: {
        name: string;
        weight: number;
        satisfaction: number;
    }[];
    power: number;
}
export declare function conflictDetection(parties: ConflictParty[], threshold?: number): {
    hasConflict: boolean;
    conflictPairs: [string, string, number][];
    provenance: string[];
};
export declare function conflictIntensity(conflict: {
    partyA: ConflictParty;
    partyB: ConflictParty;
    issueWeight: number;
}): {
    intensity: number;
    powerAsymmetry: number;
    stakeLevel: number;
    provenance: string[];
};
export declare function contradictionIdentification(parties: ConflictParty[]): {
    contradictions: {
        partyA: string;
        partyB: string;
        interest: string;
        conflictScore: number;
    }[];
    provenance: string[];
};
export declare function dialecticalAnalysis(thesis: {
    claim: string;
    strength: number;
}, antithesis: {
    claim: string;
    strength: number;
}): {
    synthesis: string;
    integrationScore: number;
    residualTension: number;
    provenance: string[];
};
export declare function conflictMediation(parties: ConflictParty[], mediatorPower?: number): {
    mediationSuccess: boolean;
    proposedSettlement: number[];
    convergenceScore: number;
    provenance: string[];
};
export declare function consensusSeeking(positions: {
    party: string;
    position: number[];
    flexibility: number;
}[]): {
    consensus: number[];
    agreement: number;
    holdouts: string[];
    provenance: string[];
};
export declare function compromiseGeneration(parties: ConflictParty[], constraints: {
    min: number[];
    max: number[];
}[]): {
    compromises: number[];
    feasibility: number;
    provenance: string[];
};
export declare function conflictEscalationPrediction(state: {
    currentTension: number;
    recentActions: {
        aggressive: boolean;
        magnitude: number;
    }[];
    historyEscalationRate: number;
}): {
    willEscalate: boolean;
    escalationProbability: number;
    predictedLevel: number;
    provenance: string[];
};
export declare function conflictDeescalation(state: {
    currentTension: number;
    deescalationActions: {
        effectiveness: number;
        cost: number;
    }[];
    budget: number;
}): {
    achievable: boolean;
    reducedTension: number;
    actionsTaken: number;
    provenance: string[];
};
export declare function multiPartyGameEquilibrium(players: {
    id: string;
    strategies: {
        name: string;
        payoff: number;
    }[];
}[]): {
    equilibriumStrategy: string | null;
    equilibriumPayoff: number;
    stable: boolean;
    provenance: string[];
};
export declare function paretoImprovement(current: {
    party: string;
    utility: number;
}[], alternatives: {
    party: string;
    utility: number;
}[][]): {
    improvementFound: boolean;
    bestAlternative: number;
    improvements: {
        party: string;
        gain: number;
    }[];
    provenance: string[];
};
export declare function nashEquilibrium(payoffMatrix: {
    rowPlayer: number;
    colPlayer: number;
}[][]): {
    equilibria: [number, number][];
    pureStrategyFound: boolean;
    provenance: string[];
};
export declare function zeroSumDetection(payoffMatrix: {
    rowPlayer: number;
    colPlayer: number;
}[][]): {
    isZeroSum: boolean;
    sumVariance: number;
    skewness: number;
    provenance: string[];
};
export declare function winWinStrategy(parties: ConflictParty[], resourcePool: {
    name: string;
    amount: number;
    divisible: boolean;
}[]): {
    allocations: {
        party: string;
        resources: {
            name: string;
            amount: number;
        }[];
    }[];
    totalUtility: number;
    provenance: string[];
};
export declare function conflictProvenance(conflict: {
    parties: string[];
    trigger: string;
    rootCauses: {
        cause: string;
        depth: number;
        weight: number;
    }[];
}): {
    rootCause: string | null;
    depthDistribution: Record<number, number>;
    traceability: number;
    provenance: string[];
};
