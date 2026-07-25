"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.intentVerification = intentVerification;
exports.intentLineageTrace = intentLineageTrace;
exports.semanticOutputGate = semanticOutputGate;
exports.contentIntegrityCheck = contentIntegrityCheck;
exports.decisionLockGate = decisionLockGate;
exports.decisionAudit = decisionAudit;
exports.decisionRollback = decisionRollback;
exports.decisionVeto = decisionVeto;
exports.decisionPriority = decisionPriority;
exports.decisionConflict = decisionConflict;
exports.decisionQuorum = decisionQuorum;
exports.decisionConsensus = decisionConsensus;
exports.decisionThreshold = decisionThreshold;
exports.decisionWeight = decisionWeight;
exports.decisionTraceability = decisionTraceability;
// ============================================================================
// T1·ALG_T1_D_001 · 意图验证 (IVL)
// ============================================================================
function intentVerification(intent, rules) {
    if (!intent.statement || intent.statement.length === 0) {
        return { verified: false, matched: [], unmatched: rules.map(r => r.pattern), provenance: ['[ALG_T1_D_001] 空意图'] };
    }
    const lower = intent.statement.toLowerCase();
    const matched = [];
    const unmatched = [];
    for (const rule of rules) {
        if (lower.includes(rule.pattern.toLowerCase())) {
            matched.push(rule.pattern);
        }
        else if (rule.required) {
            unmatched.push(rule.pattern);
        }
    }
    const verified = unmatched.length === 0 && intent.confidence > 0;
    return {
        verified,
        matched,
        unmatched,
        provenance: [`[ALG_T1_D_001] verified=${verified} matched=${matched.length} unmatched=${unmatched.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_002 · 意图谱系追踪 (ILT)
// ============================================================================
function intentLineageTrace(decisions, targetIntentId) {
    if (decisions.length === 0) {
        return { lineage: [], depth: 0, hasCycle: false, provenance: ['[ALG_T1_D_002] 空决策'] };
    }
    const visited = new Set();
    const lineage = [];
    let current = targetIntentId;
    let depth = 0;
    let hasCycle = false;
    while (current) {
        if (visited.has(current)) {
            hasCycle = true;
            break;
        }
        visited.add(current);
        lineage.push(current);
        depth++;
        // 查找父意图
        const decision = decisions.find(d => d.intent.id === current);
        if (!decision || decision.lineage.length === 0)
            break;
        current = decision.lineage[0]; // 取第一个父节点
    }
    return {
        lineage,
        depth,
        hasCycle,
        provenance: [`[ALG_T1_D_002] depth=${depth} cycle=${hasCycle} chain=${lineage.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_003 · 语义输出门 (OSG)
// ============================================================================
function semanticOutputGate(output, constraints) {
    if (!output) {
        return { passed: false, violations: ['空输出'], provenance: ['[ALG_T1_D_003] 空输出'] };
    }
    const violations = [];
    const lower = output.toLowerCase();
    for (const f of constraints.forbidden) {
        if (lower.includes(f.toLowerCase())) {
            violations.push(`forbidden:${f}`);
        }
    }
    for (const r of constraints.required) {
        if (!lower.includes(r.toLowerCase())) {
            violations.push(`missing:${r}`);
        }
    }
    if (output.length > constraints.maxLength) {
        violations.push(`length:${output.length}>${constraints.maxLength}`);
    }
    return {
        passed: violations.length === 0,
        violations,
        provenance: [`[ALG_T1_D_003] passed=${violations.length === 0} violations=${violations.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_004 · 内容完整性校验
// ============================================================================
function contentIntegrityCheck(content) {
    const missing = [];
    const nullFields = [];
    for (const field of content.requiredFields) {
        if (!(field in content.fields)) {
            missing.push(field);
        }
        else if (content.fields[field] === null || content.fields[field] === undefined) {
            nullFields.push(field);
        }
    }
    return {
        complete: missing.length === 0 && nullFields.length === 0,
        missing,
        nullFields,
        provenance: [`[ALG_T1_D_004] complete=${missing.length === 0 && nullFields.length === 0} missing=${missing.length} null=${nullFields.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_005 · 决策锁四关卡
// ============================================================================
function decisionLockGate(decision, config) {
    // 关卡 1: IVL
    const ivl = intentVerification(decision.intent, config.ivlRules);
    // 关卡 2: ILT (检查谱系无环)
    const ilt = intentLineageTrace([decision], decision.intent.id);
    const iltPassed = !ilt.hasCycle;
    // 关卡 3: OSG
    const osg = semanticOutputGate(decision.action, config.osgConstraints);
    // 关卡 4: 内容完整性
    const fields = { id: decision.id, action: decision.action, intent: decision.intent.id };
    const integrity = contentIntegrityCheck({ fields, requiredFields: config.requiredFields });
    const stageResults = {
        IVL: ivl.verified,
        ILT: iltPassed,
        OSG: osg.passed,
        INTEGRITY: integrity.complete,
    };
    const passed = ivl.verified && iltPassed && osg.passed && integrity.complete;
    return {
        passed,
        stageResults,
        provenance: [`[ALG_T1_D_005] passed=${passed} IVL=${ivl.verified} ILT=${iltPassed} OSG=${osg.passed} INT=${integrity.complete}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_006 · 决策审计
// ============================================================================
function decisionAudit(decisions, criteria) {
    if (decisions.length === 0) {
        return { audited: 0, flagged: [], auditScore: 1, provenance: ['[ALG_T1_D_006] 空决策'] };
    }
    const flagged = [];
    for (const d of decisions) {
        if (d.intent.confidence < criteria.minConfidence) {
            flagged.push(d);
        }
        if (criteria.now - d.timestamp > criteria.maxAge) {
            flagged.push(d);
        }
    }
    const auditScore = 1 - flagged.length / decisions.length;
    return {
        audited: decisions.length,
        flagged,
        auditScore,
        provenance: [`[ALG_T1_D_006] audited=${decisions.length} flagged=${flagged.length} score=${auditScore.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_007 · 决策回滚
// ============================================================================
function decisionRollback(decisions, rollbackToId) {
    const idx = decisions.findIndex(d => d.id === rollbackToId);
    if (idx === -1) {
        return { rolledBack: [], restored: null, provenance: ['[ALG_T1_D_007] 未找到目标决策'] };
    }
    const rolledBack = decisions.slice(idx + 1);
    const restored = decisions[idx];
    return {
        rolledBack,
        restored,
        provenance: [`[ALG_T1_D_007] rolledBack=${rolledBack.length} restored=${restored.id}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_008 · 决策否决
// ============================================================================
function decisionVeto(decision, vetoReason, vetoAuthority) {
    return {
        vetoed: { ...decision, status: 'vetoed' },
        reason: vetoReason,
        authority: vetoAuthority,
        provenance: [`[ALG_T1_D_008] vetoed=${decision.id} reason=${vetoReason} authority=${vetoAuthority}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_009 · 决策优先级
// ============================================================================
function decisionPriority(decisions, urgencyWeight = 0.5, confidenceWeight = 0.5) {
    if (decisions.length === 0) {
        return { ranked: [], provenance: ['[ALG_T1_D_009] 空决策'] };
    }
    const now = Math.max(...decisions.map(d => d.timestamp));
    const ranked = decisions.map(d => {
        const urgency = 1 / (1 + (now - d.timestamp));
        const priority = urgency * urgencyWeight + d.intent.confidence * confidenceWeight;
        return { decision: d, priority };
    });
    ranked.sort((a, b) => b.priority - a.priority);
    return {
        ranked,
        provenance: [`[ALG_T1_D_009] ranked=${ranked.length} top=${ranked[0].priority.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_010 · 决策冲突
// ============================================================================
function decisionConflict(decisions) {
    const conflicts = [];
    for (let i = 0; i < decisions.length; i++) {
        for (let j = i + 1; j < decisions.length; j++) {
            const a = decisions[i];
            const b = decisions[j];
            // 冲突条件：同一意图但不同 action，或相反 status
            if (a.intent.id === b.intent.id && a.action !== b.action) {
                conflicts.push([a, b]);
            }
            else if (a.status === 'approved' && b.status === 'rejected' && a.intent.id === b.intent.id) {
                conflicts.push([a, b]);
            }
        }
    }
    return {
        conflicts,
        conflictCount: conflicts.length,
        provenance: [`[ALG_T1_D_010] conflicts=${conflicts.length} from ${decisions.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_011 · 决策法定人数
// ============================================================================
function decisionQuorum(voters, quorumThreshold = 0.5) {
    if (voters.length === 0) {
        return { passed: false, yesWeight: 0, noWeight: 0, abstainWeight: 0, totalWeight: 0, provenance: ['[ALG_T1_D_011] 空投票'] };
    }
    const totalWeight = voters.reduce((s, v) => s + v.weight, 0);
    const yesWeight = voters.filter(v => v.vote === 'yes').reduce((s, v) => s + v.weight, 0);
    const noWeight = voters.filter(v => v.vote === 'no').reduce((s, v) => s + v.weight, 0);
    const abstainWeight = voters.filter(v => v.vote === 'abstain').reduce((s, v) => s + v.weight, 0);
    const passed = totalWeight > 0 && yesWeight / totalWeight > quorumThreshold;
    return {
        passed,
        yesWeight,
        noWeight,
        abstainWeight,
        totalWeight,
        provenance: [`[ALG_T1_D_011] passed=${passed} yes=${yesWeight.toFixed(2)} no=${noWeight.toFixed(2)} total=${totalWeight.toFixed(2)}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_012 · 决策共识
// ============================================================================
function decisionConsensus(opinions, consensusThreshold = 0.8) {
    if (opinions.length === 0) {
        return { consensus: 0, agreement: 0, reached: false, provenance: ['[ALG_T1_D_012] 空意见'] };
    }
    const totalWeight = opinions.reduce((s, o) => s + o.weight, 0);
    const weightedSum = opinions.reduce((s, o) => s + o.value * o.weight, 0);
    const consensus = totalWeight === 0 ? 0 : weightedSum / totalWeight;
    // agreement = 1 - 加权方差
    const variance = opinions.reduce((s, o) => s + o.weight * (o.value - consensus) ** 2, 0) / totalWeight;
    const agreement = 1 - Math.min(1, variance);
    const reached = agreement >= consensusThreshold;
    return {
        consensus,
        agreement,
        reached,
        provenance: [`[ALG_T1_D_012] consensus=${consensus.toFixed(4)} agreement=${agreement.toFixed(4)} reached=${reached}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_013 · 决策阈值
// ============================================================================
function decisionThreshold(value, thresholds) {
    let level;
    if (value >= thresholds.fatal)
        level = 'fatal';
    else if (value >= thresholds.critical)
        level = 'critical';
    else if (value >= thresholds.warn)
        level = 'warn';
    else
        level = 'normal';
    return {
        level,
        exceeded: level !== 'normal',
        provenance: [`[ALG_T1_D_013] value=${value} level=${level} warn=${thresholds.warn} crit=${thresholds.critical} fatal=${thresholds.fatal}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_014 · 决策权重
// ============================================================================
function decisionWeight(factors) {
    if (factors.length === 0) {
        return { weightedValue: 0, totalWeight: 0, normalizedWeight: 0, provenance: ['[ALG_T1_D_014] 空因子'] };
    }
    const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
    const weightedValue = factors.reduce((s, f) => s + f.value * f.weight, 0);
    const normalizedWeight = totalWeight === 0 ? 0 : weightedValue / totalWeight;
    return {
        weightedValue,
        totalWeight,
        normalizedWeight,
        provenance: [`[ALG_T1_D_014] weighted=${weightedValue.toFixed(4)} total=${totalWeight.toFixed(4)} norm=${normalizedWeight.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_D_015 · 决策可溯源性
// ============================================================================
function decisionTraceability(decision, history) {
    const chain = [decision.id];
    const gaps = [];
    let current = decision.intent.id;
    while (current) {
        const parent = history.find(d => d.intent.id === current);
        if (!parent) {
            gaps.push(current);
            break;
        }
        chain.push(parent.id);
        current = parent.lineage.length > 0 ? parent.lineage[0] : null;
    }
    return {
        traceable: gaps.length === 0,
        chain,
        gaps,
        provenance: [`[ALG_T1_D_015] traceable=${gaps.length === 0} chain=${chain.length} gaps=${gaps.length}`],
    };
}
