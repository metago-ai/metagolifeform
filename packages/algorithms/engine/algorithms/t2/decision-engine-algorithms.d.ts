/**
 * MetaGO Engine - A5 T2 算法 · 决策锁引擎封装类（ALG_T2_D_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 141~160 项（决策锁引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 decision-lock-v2 的私有辅助方法
 *   - 处理 IVL/ILT/OSG 四道关卡、决策树、决策审计
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface DecisionContext {
    intent: string;
    action: string;
    expectedOutcome: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
export interface DecisionAuditEntry {
    stage: string;
    passed: boolean;
    reason: string;
    timestamp: number;
}
export declare function intentVerificationLayer(intent: string, action: string, constraints?: string[]): {
    passed: boolean;
    verifiedIntent: string;
    conflicts: string[];
    provenance: string[];
};
export declare function intentLineageTrace(decision: string, ancestors: {
    id: string;
    decision: string;
    parent?: string;
}[]): {
    lineage: string[];
    depth: number;
    hasRoot: boolean;
    provenance: string[];
};
export declare function semanticOutputGate(output: string, rules: {
    pattern: RegExp | string;
    required: boolean;
}[]): {
    passed: boolean;
    violations: string[];
    sanitizations: string[];
    provenance: string[];
};
export declare function contentIntegrityCheck(content: {
    required: string[];
    optional?: string[];
    provided: Record<string, unknown>;
}): {
    complete: boolean;
    missing: string[];
    extraFields: string[];
    provenance: string[];
};
export declare function decisionLockExecute(context: DecisionContext, rules: {
    pattern: RegExp | string;
    required: boolean;
}[], constraints?: string[]): {
    locked: boolean;
    auditEntries: DecisionAuditEntry[];
    provenance: string[];
};
export declare function decisionTreeBuild(root: {
    decision: string;
    children: {
        condition: string;
        decision: string;
    }[];
}): {
    tree: {
        decision: string;
        children: {
            condition: string;
            decision: string;
        }[];
    };
    leafCount: number;
    provenance: string[];
};
export declare function decisionTreeTraverse(tree: {
    decision: string;
    children: {
        condition: string;
        decision: string;
    }[];
}, evaluator: (condition: string) => boolean): {
    path: string[];
    finalDecision: string;
    provenance: string[];
};
export declare function decisionRiskAssess(decision: {
    action: string;
    consequences: {
        outcome: string;
        probability: number;
        impact: number;
    }[];
}): {
    expectedValue: number;
    maxRisk: number;
    recommendations: string[];
    provenance: string[];
};
export declare function decisionRollback(decision: {
    id: string;
    sideEffects: {
        target: string;
        reversible: boolean;
        rollbackAction?: string;
    }[];
}): {
    rolledBack: boolean;
    failedRollbacks: string[];
    provenance: string[];
};
export declare function decisionAuditLog(entries: DecisionAuditEntry[]): {
    log: string[];
    passRate: number;
    failures: string[];
    provenance: string[];
};
export declare function decisionWeightCalculate(factors: {
    name: string;
    value: number;
    importance: number;
}[]): {
    totalWeight: number;
    dominant: string;
    normalizedWeights: Record<string, number>;
    provenance: string[];
};
export declare function decisionConsistencyCheck(newDecision: {
    intent: string;
    action: string;
}, pastDecisions: {
    intent: string;
    action: string;
    timestamp: number;
}[]): {
    consistent: boolean;
    conflicts: string[];
    provenance: string[];
};
export declare function decisionPrioritize(decisions: {
    id: string;
    urgency: number;
    importance: number;
    deadline?: number;
}[], now?: number): {
    ranked: {
        id: string;
        priority: number;
    }[];
    topPriority: string;
    provenance: string[];
};
export declare function decisionSimulate(decision: {
    action: string;
    preconditions: {
        condition: string;
        satisfied: boolean;
    }[];
}, environment: Record<string, number>): {
    executable: boolean;
    blockingConditions: string[];
    estimatedSuccess: number;
    provenance: string[];
};
export declare function decisionAuthorize(decision: {
    actor: string;
    action: string;
    resource: string;
}, permissions: {
    actor: string;
    allowedActions: string[];
    resourceScope: string[];
}[]): {
    authorized: boolean;
    matchedPermissions: string[];
    provenance: string[];
};
export declare function decisionTimeoutHandle(decision: {
    startTime: number;
    timeoutMs: number;
}, now?: number): {
    timedOut: boolean;
    remainingMs: number;
    action: string;
    provenance: string[];
};
export declare function decisionConflictResolve(conflicts: {
    decisionA: string;
    decisionB: string;
    severity: number;
}[]): {
    resolutions: {
        decisions: [string, string];
        resolution: string;
    }[];
    unresolvedCount: number;
    provenance: string[];
};
export declare function decisionReversibility(decision: {
    sideEffects: {
        target: string;
        type: string;
        reversible: boolean;
    }[];
}): {
    reversibility: number;
    irreversibleEffects: string[];
    recommendation: string;
    provenance: string[];
};
export declare function decisionPerformanceImpact(decision: {
    executionCost: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        network: number;
    };
}, limits: {
    cpu: number;
    memory: number;
    network: number;
}): {
    withinLimits: boolean;
    utilization: {
        cpu: number;
        memory: number;
        network: number;
    };
    provenance: string[];
};
export declare function decisionComprehensiveAssessment(decision: DecisionContext, metrics: {
    riskScore: number;
    reversibility: number;
    alignment: number;
    timeliness: number;
}): {
    overall: number;
    verdict: string;
    conditions: string[];
    provenance: string[];
};
