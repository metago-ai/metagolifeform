"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 主动引擎封装类（ALG_T2_P_001~020）
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectProactiveSignal = detectProactiveSignal;
exports.prioritizeProactiveActions = prioritizeProactiveActions;
exports.assessProactiveTiming = assessProactiveTiming;
exports.evaluateProactiveTrigger = evaluateProactiveTrigger;
exports.predictProactiveImpact = predictProactiveImpact;
exports.assessProactiveSuppression = assessProactiveSuppression;
exports.learnProactiveFeedback = learnProactiveFeedback;
exports.proactiveCooldown = proactiveCooldown;
exports.controlProactiveFrequency = controlProactiveFrequency;
exports.assessProactiveScope = assessProactiveScope;
exports.assessProactiveResources = assessProactiveResources;
exports.modelProactiveContext = modelProactiveContext;
exports.proactiveDecisionTree = proactiveDecisionTree;
exports.assessProactiveRisk = assessProactiveRisk;
exports.evaluateProactiveEffect = evaluateProactiveEffect;
exports.selectProactiveStrategy = selectProactiveStrategy;
exports.analyzeProactiveHistory = analyzeProactiveHistory;
exports.adaptProactiveThreshold = adaptProactiveThreshold;
exports.scheduleProactiveAction = scheduleProactiveAction;
exports.comprehensiveProactiveAssessment = comprehensiveProactiveAssessment;
// ALG_T2_P_001 · 主动信号检测
function detectProactiveSignal(signals, threshold = 0.5) {
    const detected = signals.filter(s => (s.urgency + s.importance) / 2 >= threshold);
    const maxUrgency = detected.length === 0 ? 0 : Math.max(...detected.map(s => s.urgency));
    return {
        detected,
        maxUrgency,
        provenance: [`[ALG_T2_P_001] detected=${detected.length} maxUrgency=${maxUrgency.toFixed(4)}`],
    };
}
// ALG_T2_P_002 · 主动优先级排序
function prioritizeProactiveActions(actions) {
    if (actions.length === 0) {
        return { ranked: [], topAction: null, provenance: ['[ALG_T2_P_002] 无动作'] };
    }
    const ranked = [...actions].sort((a, b) => {
        const scoreA = a.priority * 0.4 + a.estimatedImpact * 0.4 - a.cost * 0.2;
        const scoreB = b.priority * 0.4 + b.estimatedImpact * 0.4 - b.cost * 0.2;
        return scoreB - scoreA;
    });
    return {
        ranked,
        topAction: ranked[0].name,
        provenance: [`[ALG_T2_P_002] ranked=${ranked.length} top=${ranked[0].name}`],
    };
}
// ALG_T2_P_003 · 主动时机评估
function assessProactiveTiming(signal, context) {
    const combinedUrgency = (signal.urgency + signal.importance) / 2;
    const shouldAct = combinedUrgency > 0.5 && context.availability > 0.3;
    const optimalDelay = shouldAct
        ? Math.max(0, (1 - combinedUrgency) * 10000 * (1 - context.availability))
        : -1;
    return {
        shouldAct,
        optimalDelay,
        provenance: [`[ALG_T2_P_003] act=${shouldAct} delay=${optimalDelay.toFixed(0)} load=${context.load}`],
    };
}
// ALG_T2_P_004 · 主动触发条件
function evaluateProactiveTrigger(conditions, threshold = 0.6) {
    if (conditions.length === 0) {
        return { triggered: false, score: 0, unmet: [], provenance: ['[ALG_T2_P_004] 无条件'] };
    }
    let totalW = 0;
    let metW = 0;
    const unmet = [];
    for (const c of conditions) {
        totalW += c.weight;
        if (c.met)
            metW += c.weight;
        else
            unmet.push(c.name);
    }
    const score = totalW === 0 ? 0 : metW / totalW;
    return {
        triggered: score >= threshold,
        score,
        unmet,
        provenance: [`[ALG_T2_P_004] triggered=${score >= threshold} score=${score.toFixed(4)} unmet=${unmet.length}`],
    };
}
// ALG_T2_P_005 · 主动影响预测
function predictProactiveImpact(action, context) {
    const baseImpact = action.estimatedImpact * context.receptivity;
    const risk = (1 - context.stability) * action.cost;
    const expectedImpact = baseImpact - risk * 0.3;
    return {
        expectedImpact: Math.max(0, expectedImpact),
        riskLevel: risk,
        provenance: [`[ALG_T2_P_005] impact=${expectedImpact.toFixed(4)} risk=${risk.toFixed(4)}`],
    };
}
// ALG_T2_P_006 · 主动抑制评估
function assessProactiveSuppression(signals, suppressionThreshold = 0.3) {
    let suppressed = 0;
    let active = 0;
    for (const s of signals) {
        const score = (s.urgency + s.importance) / 2;
        if (score < suppressionThreshold)
            suppressed++;
        else
            active++;
    }
    return {
        suppressed,
        active,
        provenance: [`[ALG_T2_P_006] suppressed=${suppressed} active=${active} threshold=${suppressionThreshold}`],
    };
}
// ALG_T2_P_007 · 主动反馈学习
function learnProactiveFeedback(history) {
    if (history.length === 0) {
        return { learningRate: 0, adjustment: {}, provenance: ['[ALG_T2_P_007] 无历史'] };
    }
    const byAction = {};
    for (const h of history) {
        if (!byAction[h.action]) {
            byAction[h.action] = { success: 0, total: 0, impact: 0 };
        }
        byAction[h.action].total++;
        if (h.success)
            byAction[h.action].success++;
        byAction[h.action].impact += h.impact;
    }
    const adjustment = {};
    for (const [action, stats] of Object.entries(byAction)) {
        const successRate = stats.success / stats.total;
        const avgImpact = stats.impact / stats.total;
        adjustment[action] = (successRate - 0.5) * avgImpact;
    }
    const learningRate = Math.min(1, 1 / Math.sqrt(history.length));
    return {
        learningRate,
        adjustment,
        provenance: [`[ALG_T2_P_007] lr=${learningRate.toFixed(4)} actions=${Object.keys(byAction).length}`],
    };
}
// ALG_T2_P_008 · 主动冷却
function proactiveCooldown(lastTriggerTime, currentTime, cooldownMs) {
    const elapsed = currentTime - lastTriggerTime;
    const remaining = Math.max(0, cooldownMs - elapsed);
    return {
        ready: elapsed >= cooldownMs,
        remainingMs: remaining,
        provenance: [`[ALG_T2_P_008] ready=${elapsed >= cooldownMs} remaining=${remaining.toFixed(0)}ms`],
    };
}
// ALG_T2_P_009 · 主动频率控制
function controlProactiveFrequency(triggers, windowMs, maxTriggers) {
    const now = triggers.length > 0 ? Math.max(...triggers.map(t => t.time)) : Date.now();
    const recent = triggers.filter(t => now - t.time <= windowMs);
    const allowed = recent.length < maxTriggers;
    return {
        allowed,
        count: recent.length,
        provenance: [`[ALG_T2_P_009] allowed=${allowed} count=${recent.length} max=${maxTriggers}`],
    };
}
// ALG_T2_P_010 · 主动范围评估
function assessProactiveScope(action, affectedAreas) {
    let totalScope = 0;
    const criticalAreas = [];
    for (const area of affectedAreas) {
        const impact = action.estimatedImpact * area.sensitivity;
        totalScope += impact;
        if (impact > 0.5)
            criticalAreas.push(area.name);
    }
    return {
        totalScope: affectedAreas.length === 0 ? 0 : totalScope / affectedAreas.length,
        criticalAreas,
        provenance: [`[ALG_T2_P_010] scope=${totalScope.toFixed(4)} critical=${criticalAreas.length}`],
    };
}
// ALG_T2_P_011 · 主动资源评估
function assessProactiveResources(required, available) {
    const deficit = {};
    let sufficient = true;
    for (const key of ['cpu', 'memory', 'time']) {
        const d = required[key] - available[key];
        if (d > 0) {
            deficit[key] = d;
            sufficient = false;
        }
    }
    return {
        sufficient,
        deficit,
        provenance: [`[ALG_T2_P_011] sufficient=${sufficient} deficits=${Object.keys(deficit).length}`],
    };
}
// ALG_T2_P_012 · 主动上下文建模
function modelProactiveContext(signals, history) {
    if (signals.length === 0) {
        return { contextScore: 0, patterns: [], provenance: ['[ALG_T2_P_012] 无信号'] };
    }
    const avgUrgency = signals.reduce((s, x) => s + x.urgency, 0) / signals.length;
    const avgImportance = signals.reduce((s, x) => s + x.importance, 0) / signals.length;
    const contextScore = (avgUrgency + avgImportance) / 2;
    const patterns = [];
    if (avgUrgency > 0.7)
        patterns.push('high-urgency');
    if (avgImportance > 0.7)
        patterns.push('high-importance');
    if (history.length > 10)
        patterns.push('frequent-activity');
    if (signals.length > 5)
        patterns.push('multi-source');
    return {
        contextScore,
        patterns,
        provenance: [`[ALG_T2_P_012] score=${contextScore.toFixed(4)} patterns=${patterns.length}`],
    };
}
// ALG_T2_P_013 · 主动决策树
function proactiveDecisionTree(signal, context) {
    const path = [];
    let decision;
    const urgency = (signal.urgency + signal.importance) / 2;
    if (urgency < 0.3) {
        path.push('urgency<0.3');
        decision = 'ignore';
    }
    else if (context.availability < 0.3) {
        path.push('availability<0.3');
        decision = 'defer';
    }
    else if (context.load > 0.8) {
        path.push('load>0.8');
        decision = 'queue';
    }
    else if (urgency > 0.7) {
        path.push('urgency>0.7');
        decision = 'act-immediately';
    }
    else {
        path.push('default');
        decision = 'schedule';
    }
    return {
        decision,
        path,
        provenance: [`[ALG_T2_P_013] decision=${decision} path=${path.join('->')}`],
    };
}
// ALG_T2_P_014 · 主动风险评估
function assessProactiveRisk(action, context) {
    const irreversibilityRisk = (1 - context.reversibility) * 0.4;
    const instabilityRisk = (1 - context.stability) * 0.3;
    const costRisk = action.cost * 0.3;
    const riskScore = irreversibilityRisk + instabilityRisk + costRisk;
    return {
        riskScore,
        acceptable: riskScore < 0.5,
        provenance: [`[ALG_T2_P_014] risk=${riskScore.toFixed(4)} acceptable=${riskScore < 0.5}`],
    };
}
// ALG_T2_P_015 · 主动效果评估
function evaluateProactiveEffect(before, after, expected) {
    const actualChange = after - before;
    const expectedChange = expected - before;
    const effectiveness = expectedChange === 0 ? (actualChange === 0 ? 1 : 0) : actualChange / expectedChange;
    return {
        actualChange,
        expectedChange,
        effectiveness: Math.max(0, Math.min(1, effectiveness)),
        provenance: [`[ALG_T2_P_015] actual=${actualChange.toFixed(4)} expected=${expectedChange.toFixed(4)} eff=${Math.max(0, Math.min(1, effectiveness)).toFixed(4)}`],
    };
}
// ALG_T2_P_016 · 主动策略选择
function selectProactiveStrategy(strategies, context) {
    if (strategies.length === 0) {
        return { strategy: null, netScore: 0, provenance: ['[ALG_T2_P_016] 无策略'] };
    }
    let best = null;
    let bestScore = -Infinity;
    for (const s of strategies) {
        if (s.risk > context.riskTolerance)
            continue;
        if (s.cost > context.budgetConstraint)
            continue;
        const netScore = s.effectiveness - s.cost * 0.3 - s.risk * 0.4;
        if (netScore > bestScore) {
            bestScore = netScore;
            best = s.name;
        }
    }
    return {
        strategy: best,
        netScore: bestScore === -Infinity ? 0 : bestScore,
        provenance: [`[ALG_T2_P_016] strategy=${best} net=${bestScore.toFixed(4)}`],
    };
}
// ALG_T2_P_017 · 主动历史分析
function analyzeProactiveHistory(history, windowMs = 86400000) {
    if (history.length === 0) {
        return { totalActions: 0, successRate: 0, recentActivity: 0, provenance: ['[ALG_T2_P_017] 无历史'] };
    }
    const now = Math.max(...history.map(h => h.timestamp));
    const recent = history.filter(h => now - h.timestamp <= windowMs);
    const successCount = history.filter(h => h.success).length;
    return {
        totalActions: history.length,
        successRate: successCount / history.length,
        recentActivity: recent.length,
        provenance: [`[ALG_T2_P_017] total=${history.length} success=${(successCount / history.length).toFixed(4)} recent=${recent.length}`],
    };
}
// ALG_T2_P_018 · 主动阈值自适应
function adaptProactiveThreshold(currentThreshold, falsePositives, falseNegatives, learningRate = 0.1) {
    const totalErrors = falsePositives + falseNegatives;
    if (totalErrors === 0) {
        return { newThreshold: currentThreshold, adjustment: 0, provenance: ['[ALG_T2_P_018] 无错误'] };
    }
    const fpRate = falsePositives / totalErrors;
    const fnRate = falseNegatives / totalErrors;
    const adjustment = (fnRate - fpRate) * learningRate;
    const newThreshold = Math.max(0, Math.min(1, currentThreshold + adjustment));
    return {
        newThreshold,
        adjustment,
        provenance: [`[ALG_T2_P_018] old=${currentThreshold.toFixed(4)} new=${newThreshold.toFixed(4)} adj=${adjustment.toFixed(4)}`],
    };
}
// ALG_T2_P_019 · 主动调度
function scheduleProactiveAction(action, scheduledTime, constraints) {
    if (scheduledTime < constraints.earliest || scheduledTime > constraints.latest) {
        return { scheduled: null, conflictResolved: false, provenance: ['[ALG_T2_P_019] 时间超出约束'] };
    }
    const conflictTolerance = 1000;
    let finalTime = scheduledTime;
    let conflictResolved = true;
    for (const conflict of constraints.conflicts) {
        if (Math.abs(finalTime - conflict) < conflictTolerance) {
            finalTime = conflict + conflictTolerance;
            if (finalTime > constraints.latest) {
                conflictResolved = false;
                break;
            }
        }
    }
    return {
        scheduled: conflictResolved ? finalTime : null,
        conflictResolved,
        provenance: [`[ALG_T2_P_019] scheduled=${finalTime} resolved=${conflictResolved}`],
    };
}
// ALG_T2_P_020 · 综合主动评估
function comprehensiveProactiveAssessment(signals, context, actions) {
    const detection = detectProactiveSignal(signals);
    if (detection.detected.length === 0) {
        return { shouldProact: false, recommendedAction: null, confidence: 0, provenance: ['[ALG_T2_P_020] 无信号'] };
    }
    const ranked = prioritizeProactiveActions(actions);
    const topAction = ranked.ranked[0];
    if (!topAction) {
        return { shouldProact: false, recommendedAction: null, confidence: 0, provenance: ['[ALG_T2_P_020] 无动作'] };
    }
    const timing = assessProactiveTiming(detection.detected[0], context);
    const risk = assessProactiveRisk(topAction, { stability: context.stability, reversibility: 0.7 });
    const shouldProact = timing.shouldAct && risk.acceptable && context.availability > 0.4;
    const confidence = (detection.maxUrgency + (1 - risk.riskScore) + context.availability) / 3;
    return {
        shouldProact,
        recommendedAction: shouldProact ? topAction.name : null,
        confidence: Math.max(0, Math.min(1, confidence)),
        provenance: [`[ALG_T2_P_020] proact=${shouldProact} action=${topAction.name} conf=${Math.max(0, Math.min(1, confidence)).toFixed(4)}`],
    };
}
