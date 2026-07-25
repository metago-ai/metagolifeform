"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 审计引擎封装类（ALG_T2_U_001~020）
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateAuditLogs = aggregateAuditLogs;
exports.generateAuditReport = generateAuditReport;
exports.detectAuditAnomaly = detectAuditAnomaly;
exports.checkAuditCompliance = checkAuditCompliance;
exports.analyzeAuditTimeline = analyzeAuditTimeline;
exports.identifyAuditPatterns = identifyAuditPatterns;
exports.verifyAuditPermissions = verifyAuditPermissions;
exports.verifyAuditIntegrity = verifyAuditIntegrity;
exports.buildAuditTraceChain = buildAuditTraceChain;
exports.assessAuditRisk = assessAuditRisk;
exports.analyzeAuditFrequency = analyzeAuditFrequency;
exports.analyzeAuditVariance = analyzeAuditVariance;
exports.extractKeyAuditEvents = extractKeyAuditEvents;
exports.summarizeAuditStatistics = summarizeAuditStatistics;
exports.analyzeAuditCorrelation = analyzeAuditCorrelation;
exports.evaluateAuditPerformance = evaluateAuditPerformance;
exports.forecastAuditTrend = forecastAuditTrend;
exports.cleanupAuditLogs = cleanupAuditLogs;
exports.verifyAuditEncryption = verifyAuditEncryption;
exports.comprehensiveAuditAssessment = comprehensiveAuditAssessment;
// ALG_T2_U_001 · 审计日志聚合
function aggregateAuditLogs(entries, groupBy = 'actor') {
    const groups = {};
    const counts = {};
    for (const entry of entries) {
        const key = entry[groupBy];
        if (!groups[key]) {
            groups[key] = [];
            counts[key] = 0;
        }
        groups[key].push(entry);
        counts[key]++;
    }
    return {
        groups,
        counts,
        provenance: [`[ALG_T2_U_001] entries=${entries.length} groups=${Object.keys(groups).length}`],
    };
}
// ALG_T2_U_002 · 审计报告生成
function generateAuditReport(entries) {
    if (entries.length === 0) {
        return {
            report: { totalEntries: 0, successCount: 0, failureCount: 0, warningCount: 0, score: 0 },
            provenance: ['[ALG_T2_U_002] 无审计条目'],
        };
    }
    const success = entries.filter(e => e.result === 'success').length;
    const failure = entries.filter(e => e.result === 'failure').length;
    const warning = entries.filter(e => e.result === 'warning').length;
    const score = (success * 1 + warning * 0.5) / entries.length;
    return {
        report: {
            totalEntries: entries.length,
            successCount: success,
            failureCount: failure,
            warningCount: warning,
            score,
        },
        provenance: [`[ALG_T2_U_002] total=${entries.length} success=${success} failure=${failure} warning=${warning} score=${score.toFixed(4)}`],
    };
}
// ALG_T2_U_003 · 审计异常检测
function detectAuditAnomaly(entries, baseline) {
    if (entries.length === 0) {
        return { anomalies: [], deviationScore: 0, provenance: ['[ALG_T2_U_003] 无条目'] };
    }
    const failureRate = entries.filter(e => e.result === 'failure').length / entries.length;
    const warningRate = entries.filter(e => e.result === 'warning').length / entries.length;
    const deviation = Math.abs(failureRate - baseline.failureRate) + Math.abs(warningRate - baseline.warningRate);
    const anomalies = entries.filter(e => e.result === 'failure' || e.result === 'warning');
    return {
        anomalies,
        deviationScore: deviation,
        provenance: [`[ALG_T2_U_003] anomalies=${anomalies.length} deviation=${deviation.toFixed(4)}`],
    };
}
// ALG_T2_U_004 · 审计合规检查
function checkAuditCompliance(entries, rules) {
    const violations = [];
    for (const rule of rules) {
        if (!rule.check(entries)) {
            violations.push({ rule: rule.name, severity: rule.severity });
        }
    }
    const highViolations = violations.filter(v => v.severity === 'high');
    return {
        compliant: highViolations.length === 0,
        violations,
        provenance: [`[ALG_T2_U_004] compliant=${highViolations.length === 0} violations=${violations.length} high=${highViolations.length}`],
    };
}
// ALG_T2_U_005 · 审计时间线分析
function analyzeAuditTimeline(entries, windowMs = 3600000) {
    if (entries.length === 0) {
        return { windows: [], provenance: ['[ALG_T2_U_005] 无条目'] };
    }
    const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
    const start = sorted[0].timestamp;
    const end = sorted[sorted.length - 1].timestamp;
    const windows = [];
    for (let wStart = start; wStart <= end; wStart += windowMs) {
        const wEnd = wStart + windowMs;
        const windowEntries = sorted.filter(e => e.timestamp >= wStart && e.timestamp < wEnd);
        if (windowEntries.length > 0) {
            const failureCount = windowEntries.filter(e => e.result === 'failure').length;
            windows.push({
                time: wStart,
                count: windowEntries.length,
                failureRate: failureCount / windowEntries.length,
            });
        }
    }
    return {
        windows,
        provenance: [`[ALG_T2_U_005] windows=${windows.length} windowMs=${windowMs}`],
    };
}
// ALG_T2_U_006 · 审计行为模式
function identifyAuditPatterns(entries) {
    const actionGroups = {};
    for (const e of entries) {
        if (!actionGroups[e.action])
            actionGroups[e.action] = [];
        actionGroups[e.action].push(e);
    }
    const patterns = Object.entries(actionGroups).map(([action, group]) => ({
        action,
        frequency: group.length,
        successRate: group.filter(e => e.result === 'success').length / group.length,
    }));
    patterns.sort((a, b) => b.frequency - a.frequency);
    return {
        patterns,
        provenance: [`[ALG_T2_U_006] patterns=${patterns.length} actions=${entries.length}`],
    };
}
// ALG_T2_U_007 · 审计权限验证
function verifyAuditPermissions(entries, permissions) {
    const permMap = new Map(permissions.map(p => [p.actor, p.allowedActions]));
    const violations = entries.filter(e => {
        const allowed = permMap.get(e.actor);
        return !allowed || !allowed.includes(e.action);
    });
    return {
        violations,
        violationRate: entries.length === 0 ? 0 : violations.length / entries.length,
        provenance: [`[ALG_T2_U_007] violations=${violations.length} rate=${(entries.length === 0 ? 0 : violations.length / entries.length).toFixed(4)}`],
    };
}
// ALG_T2_U_008 · 审计数据完整性
function verifyAuditIntegrity(entries) {
    let missingFields = 0;
    for (const e of entries) {
        if (!e.id)
            missingFields++;
        if (!e.actor)
            missingFields++;
        if (!e.action)
            missingFields++;
        if (!e.timestamp)
            missingFields++;
    }
    const ids = entries.map(e => e.id);
    const uniqueIds = new Set(ids);
    const duplicates = ids.length - uniqueIds.size;
    const integrity = entries.length === 0 ? 1 : 1 - (missingFields + duplicates) / (entries.length * 4);
    return {
        integrity: Math.max(0, integrity),
        missingFields,
        duplicates,
        provenance: [`[ALG_T2_U_008] integrity=${Math.max(0, integrity).toFixed(4)} missing=${missingFields} dup=${duplicates}`],
    };
}
// ALG_T2_U_009 · 审计溯源链
function buildAuditTraceChain(entries, targetId) {
    const byTarget = entries.filter(e => e.target === targetId);
    if (byTarget.length === 0) {
        return { chain: [], depth: 0, provenance: ['[ALG_T2_U_009] 无相关条目'] };
    }
    const sorted = [...byTarget].sort((a, b) => a.timestamp - b.timestamp);
    return {
        chain: sorted,
        depth: sorted.length,
        provenance: [`[ALG_T2_U_009] target=${targetId} depth=${sorted.length}`],
    };
}
// ALG_T2_U_010 · 审计风险评估
function assessAuditRisk(entries, riskWeights = { failure: 1, warning: 0.5 }) {
    if (entries.length === 0) {
        return { riskScore: 0, riskLevel: 'unknown', provenance: ['[ALG_T2_U_010] 无条目'] };
    }
    const failureCount = entries.filter(e => e.result === 'failure').length;
    const warningCount = entries.filter(e => e.result === 'warning').length;
    const riskScore = (failureCount * riskWeights.failure + warningCount * riskWeights.warning) / entries.length;
    const riskLevel = riskScore > 0.5 ? 'high' : riskScore > 0.2 ? 'medium' : 'low';
    return {
        riskScore,
        riskLevel,
        provenance: [`[ALG_T2_U_010] risk=${riskScore.toFixed(4)} level=${riskLevel}`],
    };
}
// ALG_T2_U_011 · 审计频率分析
function analyzeAuditFrequency(entries, actor) {
    const filtered = actor ? entries.filter(e => e.actor === actor) : entries;
    if (filtered.length < 2) {
        return { frequency: 0, avgInterval: 0, peakHour: 0, provenance: ['[ALG_T2_U_011] 数据不足'] };
    }
    const sorted = [...filtered].sort((a, b) => a.timestamp - b.timestamp);
    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
        intervals.push(sorted[i].timestamp - sorted[i - 1].timestamp);
    }
    const avgInterval = intervals.reduce((s, x) => s + x, 0) / intervals.length;
    const hourCounts = {};
    for (const e of sorted) {
        const hour = new Date(e.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    let peakHour = 0;
    let maxCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
        if (count > maxCount) {
            maxCount = count;
            peakHour = parseInt(hour);
        }
    }
    return {
        frequency: filtered.length,
        avgInterval,
        peakHour,
        provenance: [`[ALG_T2_U_011] freq=${filtered.length} avgInterval=${avgInterval.toFixed(0)} peak=${peakHour}`],
    };
}
// ALG_T2_U_012 · 审计差异分析
function analyzeAuditVariance(baseline, current) {
    const baselineActions = new Set(baseline.map(e => e.action));
    const currentActions = new Set(current.map(e => e.action));
    const newActions = [...currentActions].filter(a => !baselineActions.has(a));
    const baselineFailureRate = baseline.filter(e => e.result === 'failure').length / Math.max(1, baseline.length);
    const currentFailureRate = current.filter(e => e.result === 'failure').length / Math.max(1, current.length);
    const actionVariance = Math.abs(baselineActions.size - currentActions.size) / Math.max(1, baselineActions.size);
    const resultVariance = Math.abs(baselineFailureRate - currentFailureRate);
    return {
        actionVariance,
        resultVariance,
        newActions,
        provenance: [`[ALG_T2_U_012] actionVar=${actionVariance.toFixed(4)} resultVar=${resultVariance.toFixed(4)} new=${newActions.length}`],
    };
}
// ALG_T2_U_013 · 审计关键事件提取
function extractKeyAuditEvents(entries, topN = 10) {
    const sorted = [...entries].sort((a, b) => {
        const scoreA = (a.result === 'failure' ? 3 : a.result === 'warning' ? 2 : 1);
        const scoreB = (b.result === 'failure' ? 3 : b.result === 'warning' ? 2 : 1);
        return scoreB - scoreA;
    });
    return {
        keyEvents: sorted.slice(0, topN),
        criteria: 'severity-ranked',
        provenance: [`[ALG_T2_U_013] total=${entries.length} top=${Math.min(topN, entries.length)}`],
    };
}
// ALG_T2_U_014 · 审计统计摘要
function summarizeAuditStatistics(entries) {
    const byResult = {};
    const byActor = {};
    const byAction = {};
    for (const e of entries) {
        byResult[e.result] = (byResult[e.result] || 0) + 1;
        byActor[e.actor] = (byActor[e.actor] || 0) + 1;
        byAction[e.action] = (byAction[e.action] || 0) + 1;
    }
    const timestamps = entries.map(e => e.timestamp);
    return {
        byResult,
        byActor,
        byAction,
        timeRange: {
            start: timestamps.length > 0 ? Math.min(...timestamps) : 0,
            end: timestamps.length > 0 ? Math.max(...timestamps) : 0,
        },
        provenance: [`[ALG_T2_U_014] entries=${entries.length} actors=${Object.keys(byActor).length} actions=${Object.keys(byAction).length}`],
    };
}
// ALG_T2_U_015 · 审计相关性分析
function analyzeAuditCorrelation(entries) {
    const actionResultCount = {};
    for (const e of entries) {
        if (!actionResultCount[e.action])
            actionResultCount[e.action] = {};
        actionResultCount[e.action][e.result] = (actionResultCount[e.action][e.result] || 0) + 1;
    }
    const correlations = [];
    for (const [action, results] of Object.entries(actionResultCount)) {
        const total = Object.values(results).reduce((s, c) => s + c, 0);
        for (const [result, count] of Object.entries(results)) {
            correlations.push({
                action,
                result,
                correlation: total === 0 ? 0 : count / total,
            });
        }
    }
    correlations.sort((a, b) => b.correlation - a.correlation);
    return {
        correlations,
        provenance: [`[ALG_T2_U_015] correlations=${correlations.length}`],
    };
}
// ALG_T2_U_016 · 审计性能评估
function evaluateAuditPerformance(entries, targetResponseTime = 1000) {
    if (entries.length === 0) {
        return { avgResponseTime: 0, withinTarget: 0, performanceScore: 0, provenance: ['[ALG_T2_U_016] 无条目'] };
    }
    const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
    const responseTimes = [];
    for (let i = 1; i < sorted.length; i++) {
        responseTimes.push(sorted[i].timestamp - sorted[i - 1].timestamp);
    }
    const avgResponseTime = responseTimes.length === 0 ? 0 : responseTimes.reduce((s, x) => s + x, 0) / responseTimes.length;
    const withinTarget = responseTimes.filter(t => t <= targetResponseTime).length;
    const performanceScore = responseTimes.length === 0 ? 1 : withinTarget / responseTimes.length;
    return {
        avgResponseTime,
        withinTarget,
        performanceScore,
        provenance: [`[ALG_T2_U_016] avg=${avgResponseTime.toFixed(0)} within=${withinTarget}/${responseTimes.length} score=${performanceScore.toFixed(4)}`],
    };
}
// ALG_T2_U_017 · 审计趋势预测
function forecastAuditTrend(history, steps = 3) {
    const n = history.length;
    if (n < 2) {
        return { forecast: [], trend: 'unknown', confidence: 0, provenance: ['[ALG_T2_U_017] 数据不足'] };
    }
    const sumX = history.reduce((s, h, i) => s + i, 0);
    const sumY = history.reduce((s, h) => s + h.failureRate, 0);
    const sumXY = history.reduce((s, h, i) => s + i * h.failureRate, 0);
    const sumX2 = history.reduce((s, _, i) => s + i * i, 0);
    const denom = n * sumX2 - sumX * sumX;
    const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    const forecast = [];
    for (let i = 0; i < steps; i++) {
        forecast.push(Math.max(0, Math.min(1, slope * (n + i) + intercept)));
    }
    const trend = slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable';
    const residuals = history.map((h, i) => h.failureRate - (slope * i + intercept));
    const residualVar = residuals.reduce((s, r) => s + r * r, 0) / n;
    const confidence = Math.max(0, 1 - Math.sqrt(residualVar));
    return {
        forecast,
        trend,
        confidence,
        provenance: [`[ALG_T2_U_017] trend=${trend} conf=${confidence.toFixed(4)} steps=${steps}`],
    };
}
// ALG_T2_U_018 · 审计清理
function cleanupAuditLogs(entries, maxAge, currentTime) {
    const kept = entries.filter(e => currentTime - e.timestamp <= maxAge);
    return {
        kept,
        removed: entries.length - kept.length,
        provenance: [`[ALG_T2_U_018] orig=${entries.length} kept=${kept.length} removed=${entries.length - kept.length}`],
    };
}
// ALG_T2_U_019 · 审计加密验证
function verifyAuditEncryption(entries, hashFn, storedHashes) {
    let verified = 0;
    const tampered = [];
    for (const entry of entries) {
        const computedHash = hashFn(entry);
        const storedHash = storedHashes.get(entry.id);
        if (storedHash === undefined) {
            tampered.push(entry.id);
        }
        else if (storedHash === computedHash) {
            verified++;
        }
        else {
            tampered.push(entry.id);
        }
    }
    return {
        verified,
        tampered,
        provenance: [`[ALG_T2_U_019] verified=${verified} tampered=${tampered.length}`],
    };
}
// ALG_T2_U_020 · 综合审计评估
function comprehensiveAuditAssessment(entries, context) {
    const report = generateAuditReport(entries);
    const anomaly = detectAuditAnomaly(entries, context.baseline);
    const integrity = verifyAuditIntegrity(entries);
    const risk = assessAuditRisk(entries);
    const perms = verifyAuditPermissions(entries, context.permissions);
    const overall = (report.report.score + integrity.integrity + (1 - perms.violationRate) + (1 - risk.riskScore)) / 4;
    const recommendations = [];
    if (risk.riskScore > 0.3)
        recommendations.push('investigate-failures');
    if (perms.violationRate > 0.1)
        recommendations.push('review-permissions');
    if (integrity.integrity < 0.9)
        recommendations.push('fix-data-integrity');
    if (anomaly.deviationScore > 0.2)
        recommendations.push('analyze-anomalies');
    if (recommendations.length === 0)
        recommendations.push('maintain-current-controls');
    return {
        overallScore: overall,
        riskLevel: risk.riskLevel,
        complianceRate: 1 - perms.violationRate,
        recommendations,
        provenance: [`[ALG_T2_U_020] overall=${overall.toFixed(4)} risk=${risk.riskLevel} compliance=${(1 - perms.violationRate).toFixed(4)} recs=${recommendations.length}`],
    };
}
