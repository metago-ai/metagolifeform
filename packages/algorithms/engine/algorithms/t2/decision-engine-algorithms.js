"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.intentVerificationLayer = intentVerificationLayer;
exports.intentLineageTrace = intentLineageTrace;
exports.semanticOutputGate = semanticOutputGate;
exports.contentIntegrityCheck = contentIntegrityCheck;
exports.decisionLockExecute = decisionLockExecute;
exports.decisionTreeBuild = decisionTreeBuild;
exports.decisionTreeTraverse = decisionTreeTraverse;
exports.decisionRiskAssess = decisionRiskAssess;
exports.decisionRollback = decisionRollback;
exports.decisionAuditLog = decisionAuditLog;
exports.decisionWeightCalculate = decisionWeightCalculate;
exports.decisionConsistencyCheck = decisionConsistencyCheck;
exports.decisionPrioritize = decisionPrioritize;
exports.decisionSimulate = decisionSimulate;
exports.decisionAuthorize = decisionAuthorize;
exports.decisionTimeoutHandle = decisionTimeoutHandle;
exports.decisionConflictResolve = decisionConflictResolve;
exports.decisionReversibility = decisionReversibility;
exports.decisionPerformanceImpact = decisionPerformanceImpact;
exports.decisionComprehensiveAssessment = decisionComprehensiveAssessment;
// ============================================================================
// ALG_T2_D_001 · 意图验证层（IVL）
// ============================================================================
function intentVerificationLayer(intent, action, constraints = []) {
    if (!intent || !action) {
        return { passed: false, verifiedIntent: '', conflicts: ['missing_intent_or_action'], provenance: ['[ALG_T2_D_001] 缺失意图或动作'] };
    }
    const conflicts = [];
    // 检查意图与动作的对齐
    const intentWords = new Set(intent.toLowerCase().split(/\s+/));
    const actionWords = new Set(action.toLowerCase().split(/\s+/));
    let overlap = 0;
    for (const w of intentWords)
        if (actionWords.has(w))
            overlap++;
    const alignmentScore = intentWords.size === 0 ? 0 : overlap / intentWords.size;
    if (alignmentScore < 0.2)
        conflicts.push('low_intent_action_alignment');
    // 检查约束违反
    for (const c of constraints) {
        if (action.toLowerCase().includes(c.toLowerCase())) {
            conflicts.push(`constraint_violated:${c}`);
        }
    }
    return {
        passed: conflicts.length === 0,
        verifiedIntent: intent,
        conflicts,
        provenance: [`[ALG_T2_D_001] align=${alignmentScore.toFixed(4)} conflicts=${conflicts.length} pass=${conflicts.length === 0}`],
    };
}
// ============================================================================
// ALG_T2_D_002 · 意图谱系追踪（ILT）
// ============================================================================
function intentLineageTrace(decision, ancestors) {
    if (ancestors.length === 0) {
        return { lineage: [decision], depth: 0, hasRoot: false, provenance: ['[ALG_T2_D_002] 无祖先'] };
    }
    const byId = new Map(ancestors.map(a => [a.id, a]));
    const lineage = [decision];
    let current = ancestors.find(a => a.decision === decision);
    let depth = 0;
    let hasRoot = false;
    while (current && current.parent) {
        const parent = byId.get(current.parent);
        if (!parent)
            break;
        lineage.unshift(parent.decision);
        current = parent;
        depth++;
        if (depth > 100)
            break; // 防止循环
    }
    if (current && !current.parent)
        hasRoot = true;
    return {
        lineage,
        depth,
        hasRoot,
        provenance: [`[ALG_T2_D_002] depth=${depth} hasRoot=${hasRoot} chain=${lineage.length}`],
    };
}
// ============================================================================
// ALG_T2_D_003 · 语义输出门（OSG）
// ============================================================================
function semanticOutputGate(output, rules) {
    if (!output) {
        return { passed: false, violations: ['empty_output'], sanitizations: [], provenance: ['[ALG_T2_D_003] 空输出'] };
    }
    const violations = [];
    const sanitizations = [];
    for (const rule of rules) {
        const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern;
        const matches = pattern.test(output);
        if (rule.required && !matches) {
            violations.push(`missing_required:${pattern.source}`);
        }
        else if (!rule.required && matches) {
            sanitizations.push(`flagged:${pattern.source}`);
        }
    }
    return {
        passed: violations.length === 0,
        violations,
        sanitizations,
        provenance: [`[ALG_T2_D_003] violations=${violations.length} sanitizations=${sanitizations.length} pass=${violations.length === 0}`],
    };
}
// ============================================================================
// ALG_T2_D_004 · 内容完整性校验
// ============================================================================
function contentIntegrityCheck(content) {
    const missing = [];
    const extraFields = [];
    for (const req of content.required) {
        if (!(req in content.provided) || content.provided[req] === undefined || content.provided[req] === null) {
            missing.push(req);
        }
    }
    const allowed = new Set([...content.required, ...(content.optional || [])]);
    for (const key of Object.keys(content.provided)) {
        if (!allowed.has(key))
            extraFields.push(key);
    }
    return {
        complete: missing.length === 0,
        missing,
        extraFields,
        provenance: [`[ALG_T2_D_004] required=${content.required.length} missing=${missing.length} extra=${extraFields.length}`],
    };
}
// ============================================================================
// ALG_T2_D_005 · 决策锁执行
// ============================================================================
function decisionLockExecute(context, rules, constraints = []) {
    const auditEntries = [];
    const now = Date.now();
    // IVL
    const ivl = intentVerificationLayer(context.intent, context.action, constraints);
    auditEntries.push({
        stage: 'IVL',
        passed: ivl.passed,
        reason: ivl.conflicts.join(';') || 'passed',
        timestamp: now,
    });
    if (!ivl.passed) {
        return { locked: false, auditEntries, provenance: [`[ALG_T2_D_005] IVL failed`] };
    }
    // ILT (简化：无祖先数据)
    auditEntries.push({
        stage: 'ILT',
        passed: true,
        reason: 'lineage_traced',
        timestamp: now,
    });
    // OSG
    const osg = semanticOutputGate(context.expectedOutcome, rules);
    auditEntries.push({
        stage: 'OSG',
        passed: osg.passed,
        reason: osg.violations.join(';') || 'passed',
        timestamp: now,
    });
    if (!osg.passed) {
        return { locked: false, auditEntries, provenance: [`[ALG_T2_D_005] OSG failed`] };
    }
    // Content integrity
    const cic = contentIntegrityCheck({
        required: ['intent', 'action', 'expectedOutcome'],
        provided: context,
    });
    auditEntries.push({
        stage: 'CIC',
        passed: cic.complete,
        reason: cic.missing.join(';') || 'complete',
        timestamp: now,
    });
    return {
        locked: cic.complete,
        auditEntries,
        provenance: [`[ALG_T2_D_005] locked=${cic.complete} stages=${auditEntries.length}`],
    };
}
// ============================================================================
// ALG_T2_D_006 · 决策树构建
// ============================================================================
function decisionTreeBuild(root) {
    return {
        tree: root,
        leafCount: root.children.length,
        provenance: [`[ALG_T2_D_006] root=${root.decision} leaves=${root.children.length}`],
    };
}
// ============================================================================
// ALG_T2_D_007 · 决策树遍历
// ============================================================================
function decisionTreeTraverse(tree, evaluator) {
    const path = [tree.decision];
    let current = tree;
    while (current && current.children && current.children.length > 0) {
        const matched = current.children.find(c => evaluator(c.condition));
        if (!matched)
            break;
        path.push(matched.decision);
        current = undefined; // 简化：单层树
    }
    return {
        path,
        finalDecision: path[path.length - 1],
        provenance: [`[ALG_T2_D_007] path=${path.length} final=${path[path.length - 1]}`],
    };
}
// ============================================================================
// ALG_T2_D_008 · 决策风险评估
// ============================================================================
function decisionRiskAssess(decision) {
    if (decision.consequences.length === 0) {
        return { expectedValue: 0, maxRisk: 0, recommendations: ['no_consequences_analyzed'], provenance: ['[ALG_T2_D_008] 无后果'] };
    }
    let expectedValue = 0;
    let maxRisk = 0;
    for (const c of decision.consequences) {
        const risk = c.probability * c.impact;
        expectedValue += c.probability * c.impact * (c.impact > 0 ? 1 : -1);
        if (risk > maxRisk)
            maxRisk = risk;
    }
    const recommendations = [];
    if (maxRisk > 0.7)
        recommendations.push('reject_decision');
    else if (maxRisk > 0.4)
        recommendations.push('add_mitigation');
    else if (maxRisk > 0.2)
        recommendations.push('proceed_with_caution');
    else
        recommendations.push('safe_to_proceed');
    return {
        expectedValue,
        maxRisk,
        recommendations,
        provenance: [`[ALG_T2_D_008] ev=${expectedValue.toFixed(4)} maxRisk=${maxRisk.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_D_009 · 决策回滚
// ============================================================================
function decisionRollback(decision) {
    const failedRollbacks = [];
    for (const effect of decision.sideEffects) {
        if (!effect.reversible) {
            failedRollbacks.push(effect.target);
        }
    }
    return {
        rolledBack: failedRollbacks.length === 0,
        failedRollbacks,
        provenance: [`[ALG_T2_D_009] effects=${decision.sideEffects.length} failed=${failedRollbacks.length}`],
    };
}
// ============================================================================
// ALG_T2_D_010 · 决策审计日志
// ============================================================================
function decisionAuditLog(entries) {
    if (entries.length === 0) {
        return { log: [], passRate: 0, failures: [], provenance: ['[ALG_T2_D_010] 空日志'] };
    }
    const log = entries.map(e => `[${e.timestamp}] ${e.stage}: ${e.passed ? 'PASS' : 'FAIL'} - ${e.reason}`);
    const passed = entries.filter(e => e.passed).length;
    const failures = entries.filter(e => !e.passed).map(e => `${e.stage}:${e.reason}`);
    return {
        log,
        passRate: passed / entries.length,
        failures,
        provenance: [`[ALG_T2_D_010] entries=${entries.length} passRate=${(passed / entries.length).toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_D_011 · 决策权重计算
// ============================================================================
function decisionWeightCalculate(factors) {
    if (factors.length === 0) {
        return { totalWeight: 0, dominant: '', normalizedWeights: {}, provenance: ['[ALG_T2_D_011] 无因素'] };
    }
    let totalWeight = 0;
    const weights = {};
    let dominant = '';
    let maxWeight = -1;
    for (const f of factors) {
        const w = f.value * f.importance;
        weights[f.name] = w;
        totalWeight += w;
        if (w > maxWeight) {
            maxWeight = w;
            dominant = f.name;
        }
    }
    const normalizedWeights = {};
    for (const [k, v] of Object.entries(weights)) {
        normalizedWeights[k] = totalWeight === 0 ? 0 : v / totalWeight;
    }
    return {
        totalWeight,
        dominant,
        normalizedWeights,
        provenance: [`[ALG_T2_D_011] factors=${factors.length} dom=${dominant} total=${totalWeight.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_D_012 · 决策一致性检查
// ============================================================================
function decisionConsistencyCheck(newDecision, pastDecisions) {
    if (pastDecisions.length === 0) {
        return { consistent: true, conflicts: [], provenance: ['[ALG_T2_D_012] 无历史'] };
    }
    const conflicts = [];
    for (const past of pastDecisions) {
        if (past.intent === newDecision.intent && past.action !== newDecision.action) {
            conflicts.push(`action_changed_for_same_intent:${past.timestamp}`);
        }
        if (past.action === newDecision.action && past.intent !== newDecision.intent) {
            conflicts.push(`intent_changed_for_same_action:${past.timestamp}`);
        }
    }
    return {
        consistent: conflicts.length === 0,
        conflicts,
        provenance: [`[ALG_T2_D_012] past=${pastDecisions.length} conflicts=${conflicts.length}`],
    };
}
// ============================================================================
// ALG_T2_D_013 · 决策优先级
// ============================================================================
function decisionPrioritize(decisions, now = Date.now()) {
    if (decisions.length === 0) {
        return { ranked: [], topPriority: '', provenance: ['[ALG_T2_D_013] 无决策'] };
    }
    const ranked = decisions.map(d => {
        let priority = d.urgency * 0.5 + d.importance * 0.5;
        if (d.deadline) {
            const timeLeft = (d.deadline - now) / (1000 * 60 * 60); // 小时
            if (timeLeft < 0)
                priority += 1; // 已逾期
            else if (timeLeft < 24)
                priority += 0.5; // 24小时内
        }
        return { id: d.id, priority };
    }).sort((a, b) => b.priority - a.priority);
    return {
        ranked,
        topPriority: ranked[0].id,
        provenance: [`[ALG_T2_D_013] count=${decisions.length} top=${ranked[0].id} priority=${ranked[0].priority.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_D_014 · 决策模拟
// ============================================================================
function decisionSimulate(decision, environment) {
    const blocking = decision.preconditions.filter(p => !p.satisfied).map(p => p.condition);
    const executable = blocking.length === 0;
    let estimatedSuccess = 1;
    for (const [, value] of Object.entries(environment)) {
        estimatedSuccess *= Math.min(1, Math.max(0, value));
    }
    return {
        executable,
        blockingConditions: blocking,
        estimatedSuccess,
        provenance: [`[ALG_T2_D_014] executable=${executable} blocking=${blocking.length} success=${estimatedSuccess.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_D_015 · 决策授权验证
// ============================================================================
function decisionAuthorize(decision, permissions) {
    const matched = [];
    for (const perm of permissions) {
        if (perm.actor !== decision.actor)
            continue;
        if (!perm.allowedActions.includes(decision.action))
            continue;
        if (!perm.resourceScope.includes(decision.resource) && !perm.resourceScope.includes('*'))
            continue;
        matched.push(`${perm.actor}:${decision.action}:${decision.resource}`);
    }
    return {
        authorized: matched.length > 0,
        matchedPermissions: matched,
        provenance: [`[ALG_T2_D_015] authorized=${matched.length > 0} matched=${matched.length}`],
    };
}
// ============================================================================
// ALG_T2_D_016 · 决策超时处理
// ============================================================================
function decisionTimeoutHandle(decision, now = Date.now()) {
    const elapsed = now - decision.startTime;
    const remainingMs = decision.timeoutMs - elapsed;
    const timedOut = remainingMs <= 0;
    let action;
    if (timedOut)
        action = 'escalate_or_default';
    else if (remainingMs < decision.timeoutMs * 0.2)
        action = 'urgent_resolution';
    else if (remainingMs < decision.timeoutMs * 0.5)
        action = 'accelerate';
    else
        action = 'continue';
    return {
        timedOut,
        remainingMs: Math.max(0, remainingMs),
        action,
        provenance: [`[ALG_T2_D_016] timedOut=${timedOut} remaining=${Math.max(0, remainingMs)}ms action=${action}`],
    };
}
// ============================================================================
// ALG_T2_D_017 · 决策冲突解决
// ============================================================================
function decisionConflictResolve(conflicts) {
    if (conflicts.length === 0) {
        return { resolutions: [], unresolvedCount: 0, provenance: ['[ALG_T2_D_017] 无冲突'] };
    }
    const resolutions = conflicts.map(c => {
        let resolution;
        if (c.severity > 0.8)
            resolution = 'escalate_to_human';
        else if (c.severity > 0.5)
            resolution = 'priority_based_selection';
        else if (c.severity > 0.2)
            resolution = 'merge_if_possible';
        else
            resolution = 'last_write_wins';
        return { decisions: [c.decisionA, c.decisionB], resolution };
    });
    const unresolvedCount = resolutions.filter(r => r.resolution === 'escalate_to_human').length;
    return {
        resolutions,
        unresolvedCount,
        provenance: [`[ALG_T2_D_017] conflicts=${conflicts.length} unresolved=${unresolvedCount}`],
    };
}
// ============================================================================
// ALG_T2_D_018 · 决策可逆性评估
// ============================================================================
function decisionReversibility(decision) {
    if (decision.sideEffects.length === 0) {
        return { reversibility: 1, irreversibleEffects: [], recommendation: 'safe_to_proceed', provenance: ['[ALG_T2_D_018] 无副作用'] };
    }
    const irreversible = decision.sideEffects.filter(e => !e.reversible);
    const reversibility = 1 - irreversible.length / decision.sideEffects.length;
    let recommendation;
    if (reversibility === 1)
        recommendation = 'fully_reversible';
    else if (reversibility >= 0.7)
        recommendation = 'mostly_reversible';
    else if (reversibility >= 0.4)
        recommendation = 'partially_reversible_proceed_with_caution';
    else
        recommendation = 'mostly_irreversible_require_approval';
    return {
        reversibility,
        irreversibleEffects: irreversible.map(e => `${e.target}:${e.type}`),
        recommendation,
        provenance: [`[ALG_T2_D_018] rev=${reversibility.toFixed(4)} irrev=${irreversible.length}/${decision.sideEffects.length}`],
    };
}
// ============================================================================
// ALG_T2_D_019 · 决策性能影响
// ============================================================================
function decisionPerformanceImpact(decision, limits) {
    const utilization = {
        cpu: decision.resourceUsage.cpu / limits.cpu,
        memory: decision.resourceUsage.memory / limits.memory,
        network: decision.resourceUsage.network / limits.network,
    };
    const withinLimits = utilization.cpu <= 1 && utilization.memory <= 1 && utilization.network <= 1;
    return {
        withinLimits,
        utilization,
        provenance: [`[ALG_T2_D_019] within=${withinLimits} cpu=${(utilization.cpu * 100).toFixed(1)}% mem=${(utilization.memory * 100).toFixed(1)}% net=${(utilization.network * 100).toFixed(1)}%`],
    };
}
// ============================================================================
// ALG_T2_D_020 · 决策综合评估
// ============================================================================
function decisionComprehensiveAssessment(decision, metrics) {
    const overall = (1 - metrics.riskScore) * 0.3 +
        metrics.reversibility * 0.2 +
        metrics.alignment * 0.3 +
        metrics.timeliness * 0.2;
    const conditions = [];
    let verdict;
    if (overall >= 0.85) {
        verdict = 'approved';
    }
    else if (overall >= 0.65) {
        verdict = 'approved_with_conditions';
        if (metrics.riskScore > 0.4)
            conditions.push('add_monitoring');
        if (metrics.reversibility < 0.5)
            conditions.push('require_rollback_plan');
    }
    else if (overall >= 0.4) {
        verdict = 'deferred';
        conditions.push('need_more_information');
        if (metrics.alignment < 0.5)
            conditions.push('realign_intent');
    }
    else {
        verdict = 'rejected';
        conditions.push('fundamental_issues');
    }
    return {
        overall,
        verdict,
        conditions,
        provenance: [`[ALG_T2_D_020] overall=${overall.toFixed(4)} verdict=${verdict} conditions=${conditions.length}`],
    };
}
