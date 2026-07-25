/**
 * MetaGO Engine - A5 T1 算法 · 决策锁类（第二批）
 *
 * 对应协议：4.2 决策锁强制校验（IVL/ILT/OSG/内容完整性）
 * 对应文档：附录A·T1·DECISION（ALG_T1_D_001 ~ ALG_T1_D_015）
 *
 * 算法清单（15 个）：
 *   001 意图验证      002 意图谱系追踪    003 语义输出门
 *   004 内容完整性    005 决策锁四关卡    006 决策审计
 *   007 决策回滚      008 决策否决        009 决策优先级
 *   010 决策冲突      011 决策法定人数    012 决策共识
 *   013 决策阈值      014 决策权重        015 决策可溯源性
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface Intent {
    id: string;
    statement: string;
    confidence: number;
    timestamp: number;
}
export interface Decision {
    id: string;
    intent: Intent;
    action: string;
    status: 'pending' | 'approved' | 'rejected' | 'vetoed';
    timestamp: number;
    lineage: string[];
}
export declare function intentVerification(intent: Intent, rules: {
    pattern: string;
    required: boolean;
}[]): {
    verified: boolean;
    matched: string[];
    unmatched: string[];
    provenance: string[];
};
export declare function intentLineageTrace(decisions: Decision[], targetIntentId: string): {
    lineage: string[];
    depth: number;
    hasCycle: boolean;
    provenance: string[];
};
export declare function semanticOutputGate(output: string, constraints: {
    forbidden: string[];
    required: string[];
    maxLength: number;
}): {
    passed: boolean;
    violations: string[];
    provenance: string[];
};
export declare function contentIntegrityCheck(content: {
    fields: Record<string, unknown>;
    requiredFields: string[];
}): {
    complete: boolean;
    missing: string[];
    nullFields: string[];
    provenance: string[];
};
export declare function decisionLockGate(decision: Decision, config: {
    ivlRules: {
        pattern: string;
        required: boolean;
    }[];
    osgConstraints: {
        forbidden: string[];
        required: string[];
        maxLength: number;
    };
    requiredFields: string[];
}): {
    passed: boolean;
    stageResults: Record<string, boolean>;
    provenance: string[];
};
export declare function decisionAudit(decisions: Decision[], criteria: {
    minConfidence: number;
    maxAge: number;
    now: number;
}): {
    audited: number;
    flagged: Decision[];
    auditScore: number;
    provenance: string[];
};
export declare function decisionRollback(decisions: Decision[], rollbackToId: string): {
    rolledBack: Decision[];
    restored: Decision | null;
    provenance: string[];
};
export declare function decisionVeto(decision: Decision, vetoReason: string, vetoAuthority: string): {
    vetoed: Decision;
    reason: string;
    authority: string;
    provenance: string[];
};
export declare function decisionPriority(decisions: Decision[], urgencyWeight?: number, confidenceWeight?: number): {
    ranked: {
        decision: Decision;
        priority: number;
    }[];
    provenance: string[];
};
export declare function decisionConflict(decisions: Decision[]): {
    conflicts: [Decision, Decision][];
    conflictCount: number;
    provenance: string[];
};
export declare function decisionQuorum(voters: {
    id: string;
    weight: number;
    vote: 'yes' | 'no' | 'abstain';
}[], quorumThreshold?: number): {
    passed: boolean;
    yesWeight: number;
    noWeight: number;
    abstainWeight: number;
    totalWeight: number;
    provenance: string[];
};
export declare function decisionConsensus(opinions: {
    id: string;
    value: number;
    weight: number;
}[], consensusThreshold?: number): {
    consensus: number;
    agreement: number;
    reached: boolean;
    provenance: string[];
};
export declare function decisionThreshold(value: number, thresholds: {
    warn: number;
    critical: number;
    fatal: number;
}): {
    level: 'normal' | 'warn' | 'critical' | 'fatal';
    exceeded: boolean;
    provenance: string[];
};
export declare function decisionWeight(factors: {
    name: string;
    value: number;
    weight: number;
}[]): {
    weightedValue: number;
    totalWeight: number;
    normalizedWeight: number;
    provenance: string[];
};
export declare function decisionTraceability(decision: Decision, history: Decision[]): {
    traceable: boolean;
    chain: string[];
    gaps: string[];
    provenance: string[];
};
