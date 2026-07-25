"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 冲突转化引擎封装类（ALG_T2_X_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 冲突转化引擎类
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateConflictIntensity = calculateConflictIntensity;
exports.analyzeConflictRootCause = analyzeConflictRootCause;
exports.assessPartyInfluence = assessPartyInfluence;
exports.findCompromisePoint = findCompromisePoint;
exports.predictConflictEscalation = predictConflictEscalation;
exports.deescalateConflict = deescalateConflict;
exports.calculatePositionDistance = calculatePositionDistance;
exports.detectConflictCoalitions = detectConflictCoalitions;
exports.selectMediator = selectMediator;
exports.evaluateResolution = evaluateResolution;
exports.recognizeConflictPattern = recognizeConflictPattern;
exports.assessConflictImpact = assessConflictImpact;
exports.prioritizeConflicts = prioritizeConflicts;
exports.planConflictResolution = planConflictResolution;
exports.modelPartyEmotion = modelPartyEmotion;
exports.calculateCoolingPeriod = calculateCoolingPeriod;
exports.reviewConflict = reviewConflict;
exports.preventionMeasures = preventionMeasures;
exports.detectConflictSignals = detectConflictSignals;
exports.comprehensiveConflictAssessment = comprehensiveConflictAssessment;
// ALG_T2_X_001 · 冲突强度计算
function calculateConflictIntensity(parties) {
    if (parties.length < 2) {
        return { intensity: 0, maxGap: 0, provenance: ['[ALG_T2_X_001] 不足2方'] };
    }
    const positions = parties.map(p => p.position);
    const max = Math.max(...positions);
    const min = Math.min(...positions);
    const maxGap = max - min;
    const variance = positions.reduce((s, x) => s + (x - (max + min) / 2) ** 2, 0) / positions.length;
    const intensity = Math.min(1, Math.sqrt(variance) / 0.5);
    return {
        intensity,
        maxGap,
        provenance: [`[ALG_T2_X_001] intensity=${intensity.toFixed(4)} gap=${maxGap.toFixed(4)}`],
    };
}
// ALG_T2_X_002 · 冲突根因分析
function analyzeConflictRootCause(symptoms, causes) {
    if (causes.length === 0) {
        return { rootCause: 'unknown', confidence: 0, provenance: ['[ALG_T2_X_002] 无候选原因'] };
    }
    const sorted = [...causes].sort((a, b) => b.weight - a.weight);
    const top = sorted[0];
    const totalW = sorted.reduce((s, c) => s + c.weight, 0);
    const confidence = totalW === 0 ? 0 : top.weight / totalW;
    return {
        rootCause: top.name,
        confidence,
        provenance: [`[ALG_T2_X_002] root=${top.name} conf=${confidence.toFixed(4)} symptoms=${symptoms.length}`],
    };
}
// ALG_T2_X_003 · 冲突方影响力评估
function assessPartyInfluence(party, allParties) {
    const totalInfluence = allParties.reduce((s, p) => s + p.influence, 0);
    const relativeStrength = totalInfluence === 0 ? 0 : party.influence / totalInfluence;
    return {
        influence: party.influence,
        relativeStrength,
        provenance: [`[ALG_T2_X_003] party=${party.id} rel=${relativeStrength.toFixed(4)}`],
    };
}
// ALG_T2_X_004 · 妥协点搜索
function findCompromisePoint(parties, weights) {
    if (parties.length === 0) {
        return { point: 0, satisfaction: 0, provenance: ['[ALG_T2_X_004] 无方'] };
    }
    const w = weights || parties.map(() => 1);
    let weighted = 0;
    let totalW = 0;
    for (let i = 0; i < parties.length; i++) {
        weighted += parties[i].position * w[i];
        totalW += w[i];
    }
    const point = totalW === 0 ? 0 : weighted / totalW;
    let totalSat = 0;
    for (let i = 0; i < parties.length; i++) {
        const dist = Math.abs(parties[i].position - point);
        totalSat += Math.max(0, 1 - dist) * w[i];
    }
    const satisfaction = totalW === 0 ? 0 : totalSat / totalW;
    return {
        point,
        satisfaction,
        provenance: [`[ALG_T2_X_004] point=${point.toFixed(4)} sat=${satisfaction.toFixed(4)}`],
    };
}
// ALG_T2_X_005 · 冲突升级预测
function predictConflictEscalation(history, threshold = 0.7) {
    if (history.length < 2) {
        return { willEscalate: false, rate: 0, provenance: ['[ALG_T2_X_005] 数据不足'] };
    }
    const n = history.length;
    const sumX = history.reduce((s, h) => s + h.time, 0);
    const sumY = history.reduce((s, h) => s + h.intensity, 0);
    const sumXY = history.reduce((s, h) => s + h.time * h.intensity, 0);
    const sumX2 = history.reduce((s, h) => s + h.time * h.time, 0);
    const denom = n * sumX2 - sumX * sumX;
    const rate = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    const lastY = history[n - 1].intensity;
    const projected = lastY + rate * (history[n - 1].time - history[0].time) * 0.5;
    return {
        willEscalate: projected > threshold && rate > 0,
        rate,
        provenance: [`[ALG_T2_X_005] rate=${rate.toFixed(6)} proj=${projected.toFixed(4)}`],
    };
}
// ALG_T2_X_006 · 冲突降级策略
function deescalateConflict(state, strategies) {
    if (strategies.length === 0) {
        return { chosen: null, netGain: 0, provenance: ['[ALG_T2_X_006] 无策略'] };
    }
    let best = null;
    let bestGain = -Infinity;
    for (const s of strategies) {
        const gain = s.effectiveness * state.intensity - s.cost;
        if (gain > bestGain) {
            bestGain = gain;
            best = s.name;
        }
    }
    return {
        chosen: best,
        netGain: bestGain === -Infinity ? 0 : bestGain,
        provenance: [`[ALG_T2_X_006] chosen=${best} gain=${bestGain.toFixed(4)}`],
    };
}
// ALG_T2_X_007 · 冲突方立场距离
function calculatePositionDistance(parties) {
    const n = parties.length;
    const distances = Array.from({ length: n }, () => new Array(n).fill(0));
    let sum = 0;
    let count = 0;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const d = Math.abs(parties[i].position - parties[j].position);
            distances[i][j] = d;
            distances[j][i] = d;
            sum += d;
            count++;
        }
    }
    return {
        distances,
        avgDistance: count === 0 ? 0 : sum / count,
        provenance: [`[ALG_T2_X_007] avg=${count === 0 ? 0 : sum / count} pairs=${count}`],
    };
}
// ALG_T2_X_008 · 冲突联盟检测
function detectConflictCoalitions(parties, threshold = 0.2) {
    if (parties.length === 0) {
        return { coalitions: [], provenance: ['[ALG_T2_X_008] 无方'] };
    }
    const visited = new Set();
    const coalitions = [];
    for (const p of parties) {
        if (visited.has(p.id))
            continue;
        const coalition = [p.id];
        visited.add(p.id);
        for (const q of parties) {
            if (visited.has(q.id))
                continue;
            if (Math.abs(p.position - q.position) <= threshold) {
                coalition.push(q.id);
                visited.add(q.id);
            }
        }
        if (coalition.length > 1) {
            coalitions.push(coalition);
        }
    }
    return {
        coalitions,
        provenance: [`[ALG_T2_X_008] coalitions=${coalitions.length} threshold=${threshold}`],
    };
}
// ALG_T2_X_009 · 冲突调解者选择
function selectMediator(candidates) {
    if (candidates.length === 0) {
        return { mediator: null, score: 0, provenance: ['[ALG_T2_X_009] 无候选'] };
    }
    let best = null;
    let bestScore = -Infinity;
    for (const c of candidates) {
        const score = c.neutrality * 0.6 + c.influence * 0.4;
        if (score > bestScore) {
            bestScore = score;
            best = c.id;
        }
    }
    return {
        mediator: best,
        score: bestScore === -Infinity ? 0 : bestScore,
        provenance: [`[ALG_T2_X_009] mediator=${best} score=${bestScore.toFixed(4)}`],
    };
}
// ALG_T2_X_010 · 冲突解决方案评估
function evaluateResolution(solution) {
    if (solution.satisfaction.length === 0) {
        return { overallScore: 0, minSatisfaction: 0, provenance: ['[ALG_T2_X_010] 无数据'] };
    }
    const avg = solution.satisfaction.reduce((s, x) => s + x, 0) / solution.satisfaction.length;
    const min = Math.min(...solution.satisfaction);
    const overallScore = avg * 0.5 + min * 0.3 + solution.feasibility * 0.2;
    return {
        overallScore,
        minSatisfaction: min,
        provenance: [`[ALG_T2_X_010] sol=${solution.name} overall=${overallScore.toFixed(4)} min=${min.toFixed(4)}`],
    };
}
// ALG_T2_X_011 · 冲突历史模式识别
function recognizeConflictPattern(current, history) {
    if (history.length === 0) {
        return { matchedPattern: null, similarity: 0, provenance: ['[ALG_T2_X_011] 无历史'] };
    }
    let best = null;
    let bestSim = -Infinity;
    for (const h of history) {
        const intensityDiff = 1 - Math.abs(h.intensity - current.intensity);
        const partiesDiff = 1 - Math.abs(h.parties - current.parties.length) / Math.max(1, current.parties.length);
        const sim = intensityDiff * 0.6 + partiesDiff * 0.4;
        if (sim > bestSim) {
            bestSim = sim;
            best = h.pattern;
        }
    }
    return {
        matchedPattern: best,
        similarity: bestSim === -Infinity ? 0 : bestSim,
        provenance: [`[ALG_T2_X_011] pattern=${best} sim=${bestSim.toFixed(4)}`],
    };
}
// ALG_T2_X_012 · 冲突影响范围评估
function assessConflictImpact(state, affectedSystems) {
    let totalImpact = 0;
    const criticalSystems = [];
    for (const sys of affectedSystems) {
        const impact = state.intensity * sys.sensitivity;
        totalImpact += impact;
        if (impact > 0.5)
            criticalSystems.push(sys.name);
    }
    return {
        totalImpact: affectedSystems.length === 0 ? 0 : totalImpact / affectedSystems.length,
        criticalSystems,
        provenance: [`[ALG_T2_X_012] impact=${totalImpact.toFixed(4)} critical=${criticalSystems.length}`],
    };
}
// ALG_T2_X_013 · 冲突优先级排序
function prioritizeConflicts(conflicts) {
    const indexed = conflicts.map((c, i) => ({ idx: i, score: c.intensity * c.parties.length }));
    indexed.sort((a, b) => b.score - a.score);
    return {
        ranked: indexed.map(x => x.idx),
        provenance: [`[ALG_T2_X_013] ranked=${indexed.length}`],
    };
}
// ALG_T2_X_014 · 冲突转化路径规划
function planConflictResolution(state, targetIntensity = 0.2) {
    const gap = state.intensity - targetIntensity;
    if (gap <= 0) {
        return { steps: ['monitor'], estimatedTime: 0, provenance: ['[ALG_T2_X_014] 已达标'] };
    }
    const steps = [];
    if (state.intensity > 0.7)
        steps.push('immediate-ceasefire');
    if (state.intensity > 0.5)
        steps.push('mediation');
    if (state.intensity > 0.3)
        steps.push('negotiation');
    steps.push('reconciliation');
    steps.push('monitoring');
    return {
        steps,
        estimatedTime: gap * 100,
        provenance: [`[ALG_T2_X_014] steps=${steps.length} time=${(gap * 100).toFixed(0)}`],
    };
}
// ALG_T2_X_015 · 冲突方情绪建模
function modelPartyEmotion(party) {
    const combined = party.frustration * 0.6 + (1 - party.influence) * 0.4;
    let state;
    if (combined > 0.8)
        state = 'hostile';
    else if (combined > 0.6)
        state = 'agitated';
    else if (combined > 0.4)
        state = 'concerned';
    else if (combined > 0.2)
        state = 'neutral';
    else
        state = 'cooperative';
    return {
        emotionState: state,
        volatility: combined,
        provenance: [`[ALG_T2_X_015] party=${party.id} state=${state} vol=${combined.toFixed(4)}`],
    };
}
// ALG_T2_X_016 · 冲突冷却期计算
function calculateCoolingPeriod(intensity, parties) {
    const baseMs = 60000;
    const period = baseMs * intensity * Math.sqrt(parties);
    return {
        periodMs: period,
        provenance: [`[ALG_T2_X_016] period=${period.toFixed(0)}ms intensity=${intensity.toFixed(4)}`],
    };
}
// ALG_T2_X_017 · 冲突复盘
function reviewConflict(timeline) {
    if (timeline.length === 0) {
        return { keyEvents: [], totalImpact: 0, lessons: 0, provenance: ['[ALG_T2_X_017] 无时间线'] };
    }
    const sorted = [...timeline].sort((a, b) => b.impact - a.impact);
    const keyEvents = sorted.slice(0, Math.max(1, Math.floor(timeline.length * 0.2))).map(e => e.event);
    const totalImpact = timeline.reduce((s, e) => s + e.impact, 0);
    return {
        keyEvents,
        totalImpact,
        lessons: keyEvents.length,
        provenance: [`[ALG_T2_X_017] events=${timeline.length} key=${keyEvents.length} impact=${totalImpact.toFixed(4)}`],
    };
}
// ALG_T2_X_018 · 冲突预防措施
function preventionMeasures(riskFactors) {
    if (riskFactors.length === 0) {
        return { measures: ['monitoring'], priority: 0.1, provenance: ['[ALG_T2_X_018] 无风险因素'] };
    }
    const measures = [];
    let maxSeverity = 0;
    for (const f of riskFactors) {
        if (f.severity > 0.7)
            measures.push(`urgent-${f.name}-mitigation`);
        else if (f.severity > 0.4)
            measures.push(`${f.name}-monitoring`);
        else
            measures.push(`${f.name}-awareness`);
        if (f.severity > maxSeverity)
            maxSeverity = f.severity;
    }
    return {
        measures,
        priority: maxSeverity,
        provenance: [`[ALG_T2_X_018] measures=${measures.length} priority=${maxSeverity.toFixed(4)}`],
    };
}
// ALG_T2_X_019 · 冲突信号检测
function detectConflictSignals(signals, threshold = 0.3) {
    let count = 0;
    for (const s of signals) {
        if (Math.abs(s.value - s.baseline) > threshold)
            count++;
    }
    return {
        detected: count > 0,
        signals_count: count,
        provenance: [`[ALG_T2_X_019] detected=${count > 0} count=${count} threshold=${threshold}`],
    };
}
// ALG_T2_X_020 · 综合冲突评估
function comprehensiveConflictAssessment(state, context) {
    const intensity = state.intensity;
    const impact = assessConflictImpact(state, context.systems);
    const escalation = predictConflictEscalation(context.history.map((h, i) => ({ time: i, intensity: h.intensity })));
    const severity = intensity > 0.7 ? 'critical' : intensity > 0.4 ? 'moderate' : 'low';
    const recommendedAction = severity === 'critical' ? 'immediate-intervention'
        : severity === 'moderate' ? 'mediation'
            : 'monitoring';
    const confidence = (1 - Math.abs(impact.totalImpact - intensity)) * 0.5 + (escalation.willEscalate ? 0.5 : 0.3);
    return {
        severity,
        recommendedAction,
        confidence: Math.min(1, Math.max(0, confidence)),
        provenance: [`[ALG_T2_X_020] severity=${severity} action=${recommendedAction} conf=${confidence.toFixed(4)}`],
    };
}
