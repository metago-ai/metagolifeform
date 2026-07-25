/**
 * MetaGO Engine - A5 T2 算法 · 审计引擎封装类（ALG_T2_U_001~020）
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface AuditEntry {
    id: string;
    timestamp: number;
    action: string;
    actor: string;
    target: string;
    result: 'success' | 'failure' | 'warning';
    details?: string;
}
export interface AuditReport {
    totalEntries: number;
    successCount: number;
    failureCount: number;
    warningCount: number;
    score: number;
}
export declare function aggregateAuditLogs(entries: AuditEntry[], groupBy?: 'actor' | 'action' | 'target'): {
    groups: Record<string, AuditEntry[]>;
    counts: Record<string, number>;
    provenance: string[];
};
export declare function generateAuditReport(entries: AuditEntry[]): {
    report: AuditReport;
    provenance: string[];
};
export declare function detectAuditAnomaly(entries: AuditEntry[], baseline: {
    failureRate: number;
    warningRate: number;
}): {
    anomalies: AuditEntry[];
    deviationScore: number;
    provenance: string[];
};
export declare function checkAuditCompliance(entries: AuditEntry[], rules: {
    name: string;
    check: (entries: AuditEntry[]) => boolean;
    severity: 'low' | 'medium' | 'high';
}[]): {
    compliant: boolean;
    violations: {
        rule: string;
        severity: string;
    }[];
    provenance: string[];
};
export declare function analyzeAuditTimeline(entries: AuditEntry[], windowMs?: number): {
    windows: {
        time: number;
        count: number;
        failureRate: number;
    }[];
    provenance: string[];
};
export declare function identifyAuditPatterns(entries: AuditEntry[]): {
    patterns: {
        action: string;
        frequency: number;
        successRate: number;
    }[];
    provenance: string[];
};
export declare function verifyAuditPermissions(entries: AuditEntry[], permissions: {
    actor: string;
    allowedActions: string[];
}[]): {
    violations: AuditEntry[];
    violationRate: number;
    provenance: string[];
};
export declare function verifyAuditIntegrity(entries: AuditEntry[]): {
    integrity: number;
    missingFields: number;
    duplicates: number;
    provenance: string[];
};
export declare function buildAuditTraceChain(entries: AuditEntry[], targetId: string): {
    chain: AuditEntry[];
    depth: number;
    provenance: string[];
};
export declare function assessAuditRisk(entries: AuditEntry[], riskWeights?: {
    failure: number;
    warning: number;
}): {
    riskScore: number;
    riskLevel: string;
    provenance: string[];
};
export declare function analyzeAuditFrequency(entries: AuditEntry[], actor?: string): {
    frequency: number;
    avgInterval: number;
    peakHour: number;
    provenance: string[];
};
export declare function analyzeAuditVariance(baseline: AuditEntry[], current: AuditEntry[]): {
    actionVariance: number;
    resultVariance: number;
    newActions: string[];
    provenance: string[];
};
export declare function extractKeyAuditEvents(entries: AuditEntry[], topN?: number): {
    keyEvents: AuditEntry[];
    criteria: string;
    provenance: string[];
};
export declare function summarizeAuditStatistics(entries: AuditEntry[]): {
    byResult: Record<string, number>;
    byActor: Record<string, number>;
    byAction: Record<string, number>;
    timeRange: {
        start: number;
        end: number;
    };
    provenance: string[];
};
export declare function analyzeAuditCorrelation(entries: AuditEntry[]): {
    correlations: {
        action: string;
        result: string;
        correlation: number;
    }[];
    provenance: string[];
};
export declare function evaluateAuditPerformance(entries: AuditEntry[], targetResponseTime?: number): {
    avgResponseTime: number;
    withinTarget: number;
    performanceScore: number;
    provenance: string[];
};
export declare function forecastAuditTrend(history: {
    timestamp: number;
    failureRate: number;
}[], steps?: number): {
    forecast: number[];
    trend: string;
    confidence: number;
    provenance: string[];
};
export declare function cleanupAuditLogs(entries: AuditEntry[], maxAge: number, currentTime: number): {
    kept: AuditEntry[];
    removed: number;
    provenance: string[];
};
export declare function verifyAuditEncryption(entries: AuditEntry[], hashFn: (entry: AuditEntry) => string, storedHashes: Map<string, string>): {
    verified: number;
    tampered: string[];
    provenance: string[];
};
export declare function comprehensiveAuditAssessment(entries: AuditEntry[], context: {
    baseline: {
        failureRate: number;
        warningRate: number;
    };
    permissions: {
        actor: string;
        allowedActions: string[];
    }[];
}): {
    overallScore: number;
    riskLevel: string;
    complianceRate: number;
    recommendations: string[];
    provenance: string[];
};
