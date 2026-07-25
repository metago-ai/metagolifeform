"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.vulnerabilityScan = vulnerabilityScan;
exports.threatAssessment = threatAssessment;
exports.riskScoring = riskScoring;
exports.accessControl = accessControl;
exports.permissionCheck = permissionCheck;
exports.authenticationVerify = authenticationVerify;
exports.authorizationCheck = authorizationCheck;
exports.dataEncrypt = dataEncrypt;
exports.sensitiveDataDetection = sensitiveDataDetection;
exports.injectionPrevention = injectionPrevention;
exports.xssPrevention = xssPrevention;
exports.csrfPrevention = csrfPrevention;
exports.rateLimit = rateLimit;
exports.auditLog = auditLog;
exports.securityPosture = securityPosture;
// ============================================================================
// T1·ALG_T1_S_001 · 漏洞扫描
// ============================================================================
function vulnerabilityScan(components, knownVulns) {
    if (components.length === 0) {
        return { found: [], clean: true, criticalCount: 0, provenance: ['[ALG_T1_S_001] 空组件'] };
    }
    const found = [];
    for (const comp of components) {
        for (const vuln of knownVulns) {
            if (vuln.component.toLowerCase() === comp.name.toLowerCase()) {
                // 简化版本匹配：检查版本是否在受影响范围
                const rangeMatch = vuln.versionRange.includes(comp.version) ||
                    vuln.versionRange === '*' || vuln.versionRange.includes('<=');
                if (rangeMatch) {
                    found.push({
                        id: `VULN-${comp.name}-${vuln.severity}`,
                        severity: vuln.severity,
                        cvss: vuln.cvss,
                        category: vuln.component,
                    });
                }
            }
        }
    }
    const criticalCount = found.filter(v => v.severity === 'critical').length;
    return {
        found,
        clean: found.length === 0,
        criticalCount,
        provenance: [`[ALG_T1_S_001] found=${found.length} critical=${criticalCount} components=${components.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_S_002 · 威胁评估
// ============================================================================
function threatAssessment(threats) {
    if (threats.length === 0) {
        return { assessed: [], totalRisk: 0, provenance: ['[ALG_T1_S_002] 空威胁'] };
    }
    const assessed = threats.map(t => {
        const risk = t.likelihood * t.impact;
        const level = risk >= 0.7 ? 'critical' : risk >= 0.4 ? 'high' : risk >= 0.2 ? 'medium' : 'low';
        return { threat: t, risk, level };
    });
    const totalRisk = assessed.reduce((s, a) => s + a.risk, 0) / assessed.length;
    return {
        assessed,
        totalRisk,
        provenance: [`[ALG_T1_S_002] threats=${assessed.length} totalRisk=${totalRisk.toFixed(4)} avg=${totalRisk.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_S_003 · 风险评分
// ============================================================================
function riskScoring(factors) {
    if (factors.length === 0) {
        return { score: 0, level: 'low', dominantFactor: 'none', provenance: ['[ALG_T1_S_003] 空因子'] };
    }
    let totalScore = 0;
    let totalWeight = 0;
    let maxContribution = 0;
    let dominantFactor = factors[0].name;
    for (const f of factors) {
        const contribution = f.probability * f.impact * f.weight;
        totalScore += contribution;
        totalWeight += f.weight;
        if (contribution > maxContribution) {
            maxContribution = contribution;
            dominantFactor = f.name;
        }
    }
    const score = totalWeight === 0 ? 0 : totalScore / totalWeight;
    const level = score >= 0.7 ? 'critical' : score >= 0.4 ? 'high' : score >= 0.2 ? 'medium' : 'low';
    return {
        score,
        level,
        dominantFactor,
        provenance: [`[ALG_T1_S_003] score=${score.toFixed(4)} level=${level} dominant=${dominantFactor}`],
    };
}
// ============================================================================
// T1·ALG_T1_S_004 · 访问控制
// ============================================================================
function accessControl(request, policy, userRoles) {
    const resourcePolicy = policy.find(p => p.resource === request.resource);
    if (!resourcePolicy) {
        return { allowed: false, reason: 'no policy for resource', provenance: [`[ALG_T1_S_004] denied: no policy for ${request.resource}`] };
    }
    if (!resourcePolicy.actions.includes(request.action)) {
        return { allowed: false, reason: 'action not in policy', provenance: [`[ALG_T1_S_004] denied: action ${request.action} not allowed`] };
    }
    const hasRole = resourcePolicy.allowedRoles.some(r => userRoles.includes(r));
    if (!hasRole) {
        return { allowed: false, reason: 'user lacks required role', provenance: [`[ALG_T1_S_004] denied: missing role`] };
    }
    return { allowed: true, reason: 'all checks passed', provenance: [`[ALG_T1_S_004] allowed: user=${request.userId} resource=${request.resource} action=${request.action}`] };
}
// ============================================================================
// T1·ALG_T1_S_005 · 权限检查
// ============================================================================
function permissionCheck(userPermissions, requiredPermissions) {
    const missing = requiredPermissions.filter(p => !userPermissions.includes(p));
    return {
        granted: missing.length === 0,
        missing,
        provenance: [`[ALG_T1_S_005] granted=${missing.length === 0} required=${requiredPermissions.length} missing=${missing.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_S_006 · 认证验证
// ============================================================================
function authenticationVerify(credentials, now, validTokens) {
    if (!credentials.username || !credentials.token) {
        return { authenticated: false, reason: 'missing credentials', provenance: ['[ALG_T1_S_006] failed: missing credentials'] };
    }
    if (credentials.expiresAt <= now) {
        return { authenticated: false, reason: 'token expired', provenance: ['[ALG_T1_S_006] failed: token expired'] };
    }
    const expectedToken = validTokens.get(credentials.username);
    if (!expectedToken || expectedToken !== credentials.token) {
        return { authenticated: false, reason: 'invalid token', provenance: ['[ALG_T1_S_006] failed: invalid token'] };
    }
    return { authenticated: true, reason: 'token valid', provenance: [`[ALG_T1_S_006] success: user=${credentials.username}`] };
}
// ============================================================================
// T1·ALG_T1_S_007 · 授权检查
// ============================================================================
function authorizationCheck(userId, resource, action, acl) {
    const userAcl = acl.get(userId);
    if (!userAcl) {
        return { authorized: false, reason: 'no ACL entry for user', provenance: [`[ALG_T1_S_007] denied: no ACL for ${userId}`] };
    }
    const resourceActions = userAcl.get(resource);
    if (!resourceActions) {
        return { authorized: false, reason: 'no ACL entry for resource', provenance: [`[ALG_T1_S_007] denied: no ACL for resource ${resource}`] };
    }
    if (!resourceActions.includes(action)) {
        return { authorized: false, reason: 'action not permitted', provenance: [`[ALG_T1_S_007] denied: action ${action} not permitted`] };
    }
    return { authorized: true, reason: 'permitted by ACL', provenance: [`[ALG_T1_S_007] allowed: user=${userId} resource=${resource} action=${action}`] };
}
// ============================================================================
// T1·ALG_T1_S_008 · 数据加密（简化 AES-like XOR 流加密）
// ============================================================================
function dataEncrypt(plaintext, key) {
    if (plaintext.length === 0 || key.length === 0) {
        return { ciphertext: '', keyLength: 0, provenance: ['[ALG_T1_S_008] 空明文或密钥'] };
    }
    // 简化的 XOR 流加密（仅用于演示，非真实安全加密）
    const keyBytes = Buffer.from(key, 'utf-8');
    const plainBytes = Buffer.from(plaintext, 'utf-8');
    const cipherBytes = Buffer.alloc(plainBytes.length);
    for (let i = 0; i < plainBytes.length; i++) {
        cipherBytes[i] = plainBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return {
        ciphertext: cipherBytes.toString('base64'),
        keyLength: keyBytes.length,
        provenance: [`[ALG_T1_S_008] encrypted: len=${plainBytes.length} keyLen=${keyBytes.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_S_009 · 敏感数据检测
// ============================================================================
function sensitiveDataDetection(text, patterns) {
    if (text.length === 0) {
        return { detected: [], totalMatches: 0, provenance: ['[ALG_T1_S_009] 空文本'] };
    }
    const detected = [];
    let totalMatches = 0;
    for (const p of patterns) {
        const matches = text.match(new RegExp(p.regex.source, p.regex.flags.includes('g') ? p.regex.flags : p.regex.flags + 'g'));
        if (matches && matches.length > 0) {
            detected.push({ name: p.name, severity: p.severity, count: matches.length });
            totalMatches += matches.length;
        }
    }
    return {
        detected,
        totalMatches,
        provenance: [`[ALG_T1_S_009] detected=${detected.length} total=${totalMatches}`],
    };
}
// ============================================================================
// T1·ALG_T1_S_010 · 注入防护
// ============================================================================
function injectionPrevention(input, patterns = [
    { name: 'SQL', regex: /('|"|;|--|\/\*|\*\/|OR\s+1=1|UNION\s+SELECT|DROP\s+TABLE)/i },
    { name: 'NoSQL', regex: /(\$where|\$ne|\$gt|\$lt|\$regex|\$in)/i },
    { name: 'Command', regex: /(\|\||&&|;\s|\$\(|`|>>|>\s)/ },
    { name: 'LDAP', regex: /(\*|\(|\)|\\|&\|)/ },
]) {
    if (!input) {
        return { safe: true, blocked: [], provenance: ['[ALG_T1_S_010] 空输入'] };
    }
    const blocked = [];
    for (const p of patterns) {
        if (p.regex.test(input)) {
            blocked.push(p.name);
        }
    }
    return {
        safe: blocked.length === 0,
        blocked,
        provenance: [`[ALG_T1_S_010] safe=${blocked.length === 0} blocked=${blocked.join(',')}`],
    };
}
// ============================================================================
// T1·ALG_T1_S_011 · XSS 防护
// ============================================================================
function xssPrevention(input) {
    if (!input) {
        return { sanitized: '', removedTags: 0, provenance: ['[ALG_T1_S_011] 空输入'] };
    }
    // 统计将被移除的标签
    const tagMatches = input.match(/<[^>]+>/g) || [];
    const scriptMatches = input.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
    // 移除 HTML 标签
    let sanitized = input.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<[^>]+>/g, '');
    // 转义特殊字符
    sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    return {
        sanitized,
        removedTags: tagMatches.length + scriptMatches.length,
        provenance: [`[ALG_T1_S_011] removed=${tagMatches.length + scriptMatches.length} len=${input.length} to ${sanitized.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_S_012 · CSRF 防护
// ============================================================================
function csrfPrevention(request, session) {
    if (request.token !== session.csrfToken) {
        return { valid: false, reason: 'CSRF token mismatch', provenance: ['[ALG_T1_S_012] failed: token mismatch'] };
    }
    if (!session.allowedOrigins.includes(request.origin)) {
        return { valid: false, reason: 'origin not allowed', provenance: [`[ALG_T1_S_012] failed: origin ${request.origin} not allowed`] };
    }
    if (request.referer && !request.referer.startsWith(request.origin)) {
        return { valid: false, reason: 'referer mismatch', provenance: ['[ALG_T1_S_012] failed: referer mismatch'] };
    }
    return { valid: true, reason: 'all checks passed', provenance: [`[ALG_T1_S_012] valid: origin=${request.origin}`] };
}
// ============================================================================
// T1·ALG_T1_S_013 · 速率限制
// ============================================================================
function rateLimit(requests, userId, config) {
    const windowStart = config.now - config.windowMs;
    const userRequests = requests.filter(r => r.userId === userId && r.timestamp > windowStart);
    const count = userRequests.length;
    const allowed = count < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count - 1);
    const resetAt = config.now + config.windowMs;
    return {
        allowed,
        remaining,
        resetAt,
        provenance: [`[ALG_T1_S_013] allowed=${allowed} count=${count} max=${config.maxRequests} remaining=${remaining}`],
    };
}
// ============================================================================
// T1·ALG_T1_S_014 · 审计日志
// ============================================================================
function auditLog(event, log) {
    log.push(event);
    return {
        logged: true,
        logSize: log.length,
        provenance: [`[ALG_T1_S_014] logged: user=${event.userId} action=${event.action} success=${event.success} logSize=${log.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_S_015 · 安全态势
// ============================================================================
function securityPosture(metrics) {
    let score = 100;
    const recommendations = [];
    // 漏洞扣分
    score -= metrics.vulnerabilityCount * 2;
    score -= metrics.criticalVulns * 10;
    if (metrics.criticalVulns > 0)
        recommendations.push(`修复 ${metrics.criticalVulns} 个严重漏洞`);
    // 失败认证扣分
    score -= Math.min(20, metrics.failedAuthAttempts);
    if (metrics.failedAuthAttempts > 10)
        recommendations.push('检查异常认证尝试');
    // 速率限制命中
    score -= Math.min(10, metrics.rateLimitHits * 0.5);
    // 注入拦截（正面加分，但说明有攻击）
    if (metrics.injectionBlocked > 0)
        recommendations.push(`已拦截 ${metrics.injectionBlocked} 次注入尝试`);
    // 自事件以来的天数（正面加分）
    score += Math.min(20, metrics.daysSinceIncident * 0.5);
    score = Math.max(0, Math.min(100, score));
    const level = score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 50 ? 'fair' : score >= 25 ? 'poor' : 'critical';
    return {
        score,
        level,
        recommendations,
        provenance: [`[ALG_T1_S_015] score=${score} level=${level} recs=${recommendations.length}`],
    };
}
