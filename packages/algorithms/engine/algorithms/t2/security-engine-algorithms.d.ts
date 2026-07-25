/**
 * MetaGO Engine - A5 T2 算法 · 安全引擎封装类（ALG_T2_S_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 161~180 项（安全引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 security 模块的私有辅助方法
 *   - 处理威胁建模、权限验证、审计流、异常响应
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface Threat {
    id: string;
    type: 'injection' | 'xss' | 'csrf' | 'auth_bypass' | 'privilege_escalation' | 'data_leak' | 'dos';
    severity: 'low' | 'medium' | 'high' | 'critical';
    probability: number;
    impact: number;
}
export interface Permission {
    actor: string;
    resource: string;
    action: 'read' | 'write' | 'execute' | 'admin';
    allowed: boolean;
}
export declare function threatModeling(assets: {
    name: string;
    value: number;
    exposure: number;
}[], threatTypes: string[]): {
    threats: Threat[];
    riskMatrix: {
        asset: string;
        threat: string;
        risk: number;
    }[];
    provenance: string[];
};
export declare function permissionVerify(request: {
    actor: string;
    resource: string;
    action: string;
}, permissions: Permission[]): {
    allowed: boolean;
    matchedRules: Permission[];
    reason: string;
    provenance: string[];
};
export declare function sqlInjectionDetect(input: string): {
    detected: boolean;
    patterns: string[];
    riskLevel: string;
    provenance: string[];
};
export declare function xssDetect(input: string): {
    detected: boolean;
    patterns: string[];
    sanitized: string;
    provenance: string[];
};
export declare function csrfTokenVerify(request: {
    token: string;
    session: string;
    origin: string;
}, expected: {
    token: string;
    session: string;
    allowedOrigins: string[];
}): {
    valid: boolean;
    reasons: string[];
    provenance: string[];
};
export declare function authStrengthAssess(credentials: {
    password: string;
    mfa: boolean;
    biometric: boolean;
    sessionTimeout: number;
}): {
    strength: number;
    level: string;
    recommendations: string[];
    provenance: string[];
};
export declare function privilegeEscalationDetect(user: {
    id: string;
    roles: string[];
    permissions: string[];
}, session: {
    startTime: number;
    permissionChanges: {
        timestamp: number;
        added: string[];
        removed: string[];
    }[];
}): {
    escalated: boolean;
    suspiciousChanges: {
        timestamp: number;
        added: string[];
    }[];
    provenance: string[];
};
export declare function anomalyAccessDetect(accessLogs: {
    userId: string;
    timestamp: number;
    ip: string;
    resource: string;
}[], baseline: {
    userId: string;
    usualIps: string[];
    usualHours: [number, number];
    usualResources: string[];
}[]): {
    anomalies: {
        userId: string;
        type: string;
        detail: string;
    }[];
    provenance: string[];
};
export declare function rateLimitCheck(requests: {
    userId: string;
    timestamp: number;
}[], limit: number, windowMs: number, now?: number): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    provenance: string[];
};
export declare function encryptionStrengthVerify(config: {
    algorithm: string;
    keyLength: number;
    mode: string;
    iv?: string;
}): {
    strong: boolean;
    score: number;
    issues: string[];
    provenance: string[];
};
export declare function auditLogGenerate(events: {
    actor: string;
    action: string;
    resource: string;
    timestamp: number;
    success: boolean;
    metadata?: Record<string, unknown>;
}[]): {
    log: string[];
    summary: {
        total: number;
        success: number;
        failed: number;
    };
    provenance: string[];
};
export declare function securityPolicyAssess(policies: {
    name: string;
    enabled: boolean;
    effectiveness: number;
}[]): {
    coverage: number;
    enabledCount: number;
    gaps: string[];
    provenance: string[];
};
export declare function vulnerabilityAssess(vulnerabilities: {
    id: string;
    cvss: number;
    exploitAvailable: boolean;
    patchAvailable: boolean;
}[]): {
    totalRisk: number;
    criticalCount: number;
    patchedCount: number;
    unpatchedRisk: number;
    provenance: string[];
};
export declare function intrusionDetect(events: {
    type: string;
    source: string;
    destination: string;
    payload: string;
    timestamp: number;
}[], signatures: {
    name: string;
    pattern: RegExp | string;
    severity: number;
}[]): {
    detected: {
        event: typeof events[0];
        signature: string;
        severity: number;
    }[];
    provenance: string[];
};
export declare function dataLeakDetect(output: string, sensitivePatterns: {
    name: string;
    pattern: RegExp | string;
}[]): {
    leaked: {
        type: string;
        match: string;
    }[];
    riskLevel: string;
    provenance: string[];
};
export declare function ddosDetect(requests: {
    ip: string;
    timestamp: number;
}[], threshold?: number, windowMs?: number): {
    underAttack: boolean;
    topIps: {
        ip: string;
        count: number;
    }[];
    provenance: string[];
};
export declare function securityIncidentResponse(incident: {
    type: string;
    severity: string;
    affectedSystems: string[];
}, playbooks: {
    type: string;
    severity: string;
    actions: string[];
}[]): {
    actions: string[];
    playbook: string;
    estimatedTime: number;
    provenance: string[];
};
export declare function complianceCheck(controls: {
    id: string;
    implemented: boolean;
    required: boolean;
    evidence?: string;
}[]): {
    compliant: boolean;
    score: number;
    violations: string[];
    missing: string[];
    provenance: string[];
};
export declare function passwordHashVerify(password: string, hash: string, salt: string, algorithm?: 'sha256' | 'sha512' | 'bcrypt'): {
    valid: boolean;
    hashStrength: number;
    provenance: string[];
};
export declare function securityComprehensiveAssessment(metrics: {
    threatLevel: number;
    vulnerabilityScore: number;
    complianceScore: number;
    incidentRate: number;
    responseTime: number;
}): {
    overall: number;
    grade: string;
    recommendations: string[];
    provenance: string[];
};
