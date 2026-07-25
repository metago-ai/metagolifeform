/**
 * MetaGO Engine - A5 T1 算法 · 安全治理类（第二批）
 *
 * 对应公理：A36 法律优先于效率 / D42 合规主动
 * 对应文档：附录A·T1·SECURITY（ALG_T1_S_001 ~ ALG_T1_S_015）
 *
 * 算法清单（15 个）：
 *   001 漏洞扫描      002 威胁评估        003 风险评分
 *   004 访问控制      005 权限检查        006 认证验证
 *   007 授权检查      008 数据加密        009 敏感数据检测
 *   010 注入防护      011 XSS 防护        012 CSRF 防护
 *   013 速率限制      014 审计日志        015 安全态势
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface Vulnerability {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    cvss: number;
    category: string;
}
export interface Threat {
    id: string;
    type: string;
    likelihood: number;
    impact: number;
}
export declare function vulnerabilityScan(components: {
    name: string;
    version: string;
    dependencies: string[];
}[], knownVulns: {
    component: string;
    versionRange: string;
    severity: Vulnerability['severity'];
    cvss: number;
}[]): {
    found: Vulnerability[];
    clean: boolean;
    criticalCount: number;
    provenance: string[];
};
export declare function threatAssessment(threats: Threat[]): {
    assessed: {
        threat: Threat;
        risk: number;
        level: string;
    }[];
    totalRisk: number;
    provenance: string[];
};
export declare function riskScoring(factors: {
    name: string;
    probability: number;
    impact: number;
    weight: number;
}[]): {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    dominantFactor: string;
    provenance: string[];
};
export declare function accessControl(request: {
    userId: string;
    resource: string;
    action: string;
}, policy: {
    resource: string;
    actions: string[];
    allowedRoles: string[];
}[], userRoles: string[]): {
    allowed: boolean;
    reason: string;
    provenance: string[];
};
export declare function permissionCheck(userPermissions: string[], requiredPermissions: string[]): {
    granted: boolean;
    missing: string[];
    provenance: string[];
};
export declare function authenticationVerify(credentials: {
    username: string;
    token: string;
    expiresAt: number;
}, now: number, validTokens: Map<string, string>): {
    authenticated: boolean;
    reason: string;
    provenance: string[];
};
export declare function authorizationCheck(userId: string, resource: string, action: string, acl: Map<string, Map<string, string[]>>): {
    authorized: boolean;
    reason: string;
    provenance: string[];
};
export declare function dataEncrypt(plaintext: string, key: string): {
    ciphertext: string;
    keyLength: number;
    provenance: string[];
};
export declare function sensitiveDataDetection(text: string, patterns: {
    name: string;
    regex: RegExp;
    severity: 'low' | 'medium' | 'high';
}[]): {
    detected: {
        name: string;
        severity: string;
        count: number;
    }[];
    totalMatches: number;
    provenance: string[];
};
export declare function injectionPrevention(input: string, patterns?: {
    name: string;
    regex: RegExp;
}[]): {
    safe: boolean;
    blocked: string[];
    provenance: string[];
};
export declare function xssPrevention(input: string): {
    sanitized: string;
    removedTags: number;
    provenance: string[];
};
export declare function csrfPrevention(request: {
    token: string;
    origin: string;
    referer: string;
}, session: {
    csrfToken: string;
    allowedOrigins: string[];
}): {
    valid: boolean;
    reason: string;
    provenance: string[];
};
export declare function rateLimit(requests: {
    userId: string;
    timestamp: number;
}[], userId: string, config: {
    windowMs: number;
    maxRequests: number;
    now: number;
}): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    provenance: string[];
};
export declare function auditLog(event: {
    userId: string;
    action: string;
    resource: string;
    timestamp: number;
    success: boolean;
}, log: {
    userId: string;
    action: string;
    resource: string;
    timestamp: number;
    success: boolean;
}[]): {
    logged: boolean;
    logSize: number;
    provenance: string[];
};
export declare function securityPosture(metrics: {
    vulnerabilityCount: number;
    criticalVulns: number;
    failedAuthAttempts: number;
    rateLimitHits: number;
    injectionBlocked: number;
    daysSinceIncident: number;
}): {
    score: number;
    level: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
    recommendations: string[];
    provenance: string[];
};
