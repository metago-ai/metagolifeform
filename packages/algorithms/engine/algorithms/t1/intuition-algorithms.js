"use strict";
/**
 * MetaGO Engine - A5 T1 算法 · 直觉类（第二批）
 *
 * 对应属性：D40 全息创造性 / 直觉认知模型
 * 对应文档：附录A·T1·INTUITION（ALG_T1_I_001 ~ ALG_T1_I_015）
 *
 * 算法清单（15 个）：
 *   001 模式识别直觉    002 启发式直觉      003 联想直觉
 *   004 第六感计算      005 直觉置信度      006 直觉校准
 *   007 专家直觉        008 模式匹配        009 直觉触发
 *   010 直觉聚合        011 直觉衰减        012 直觉冲突
 *   013 直觉学习        014 直觉溯源        015 直觉验证
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.patternRecognitionIntuition = patternRecognitionIntuition;
exports.heuristicIntuition = heuristicIntuition;
exports.associativeIntuition = associativeIntuition;
exports.sixthSense = sixthSense;
exports.intuitionConfidence = intuitionConfidence;
exports.intuitionCalibration = intuitionCalibration;
exports.expertIntuition = expertIntuition;
exports.patternMatching = patternMatching;
exports.intuitionTrigger = intuitionTrigger;
exports.intuitionAggregation = intuitionAggregation;
exports.intuitionDecay = intuitionDecay;
exports.intuitionConflict = intuitionConflict;
exports.intuitionLearning = intuitionLearning;
exports.intuitionProvenance = intuitionProvenance;
exports.intuitionValidation = intuitionValidation;
// ============================================================================
// T1·ALG_T1_I_001 · 模式识别直觉
// ============================================================================
function patternRecognitionIntuition(input, patterns) {
    if (patterns.length === 0 || Object.keys(input).length === 0) {
        return { matchedPattern: null, confidence: 0, provenance: ['[ALG_T1_I_001] 空输入或模式'] };
    }
    let bestPattern = null;
    let bestScore = -Infinity;
    for (const p of patterns) {
        let dot = 0, normInput = 0, normPattern = 0;
        for (const key of Object.keys(input)) {
            const pv = p.features[key] ?? 0;
            dot += input[key] * pv;
            normInput += input[key] ** 2;
            normPattern += pv ** 2;
        }
        const denom = Math.sqrt(normInput) * Math.sqrt(normPattern);
        const sim = denom === 0 ? 0 : dot / denom;
        const score = sim * p.weight;
        if (score > bestScore) {
            bestScore = score;
            bestPattern = p;
        }
    }
    const confidence = Math.max(0, Math.min(1, bestScore));
    return {
        matchedPattern: bestPattern,
        confidence,
        provenance: [`[ALG_T1_I_001] patterns=${patterns.length} bestLabel=${bestPattern?.label ?? 'none'} conf=${confidence.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_002 · 启发式直觉
// ============================================================================
function heuristicIntuition(situation, heuristics) {
    if (heuristics.length === 0) {
        return { selected: null, weight: 0, provenance: ['[ALG_T1_I_002] 空启发式'] };
    }
    const applicable = heuristics.filter(h => h.applies(situation));
    if (applicable.length === 0) {
        return { selected: null, weight: 0, provenance: ['[ALG_T1_I_002] 无适用'] };
    }
    applicable.sort((a, b) => b.weight - a.weight);
    const top = applicable[0];
    return {
        selected: top.name,
        weight: top.weight,
        provenance: [`[ALG_T1_I_002] applicable=${applicable.length} selected=${top.name} weight=${top.weight.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_003 · 联想直觉
// ============================================================================
function associativeIntuition(cue, memory) {
    if (cue.length === 0 || memory.length === 0) {
        return { associations: [], topAssociation: null, provenance: ['[ALG_T1_I_003] 空线索或记忆'] };
    }
    const entry = memory.find(m => m.key === cue);
    if (!entry || entry.associations.length === 0) {
        return { associations: [], topAssociation: null, provenance: ['[ALG_T1_I_003] 无联想'] };
    }
    const sorted = [...entry.associations].sort((a, b) => b.strength - a.strength);
    return {
        associations: sorted,
        topAssociation: sorted[0].target,
        provenance: [`[ALG_T1_I_003] cue="${cue}" associations=${sorted.length} top="${sorted[0].target}"`],
    };
}
// ============================================================================
// T1·ALG_T1_I_004 · 第六感计算（多信号融合）
// ============================================================================
function sixthSense(signals, threshold = 0.5) {
    if (signals.length === 0) {
        return { triggered: false, aggregateStrength: 0, dominantSource: null, provenance: ['[ALG_T1_I_004] 无信号'] };
    }
    // 加权融合：使用噪声鲁棒的平方和开方
    const sumSquares = signals.reduce((s, sig) => s + sig.strength ** 2, 0);
    const aggregateStrength = Math.sqrt(sumSquares / signals.length);
    let dominantSource = null;
    let maxStrength = -Infinity;
    for (const sig of signals) {
        if (sig.strength > maxStrength) {
            maxStrength = sig.strength;
            dominantSource = sig.source;
        }
    }
    return {
        triggered: aggregateStrength >= threshold,
        aggregateStrength,
        dominantSource,
        provenance: [`[ALG_T1_I_004] signals=${signals.length} agg=${aggregateStrength.toFixed(4)} triggered=${aggregateStrength >= threshold} dominant=${dominantSource}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_005 · 直觉置信度
// ============================================================================
function intuitionConfidence(intuition) {
    const { strength, evidenceCount, consistency, expertiseLevel } = intuition;
    if (strength < 0 || strength > 1 || consistency < 0 || consistency > 1 || expertiseLevel < 0 || expertiseLevel > 1) {
        return { confidence: 0, calibrated: 0, provenance: ['[ALG_T1_I_005] 参数越界'] };
    }
    // 置信度 = 强度 * 一致性 * (1 - 1/(1+证据数)) * 专家水平
    const evidenceFactor = 1 - 1 / (1 + evidenceCount);
    const confidence = strength * consistency * evidenceFactor * expertiseLevel;
    // 校准：对极端值做温和回归到 0.5
    const calibrated = confidence * 0.7 + 0.5 * 0.3;
    return {
        confidence,
        calibrated: Math.max(0, Math.min(1, calibrated)),
        provenance: [`[ALG_T1_I_005] strength=${strength.toFixed(4)} evidence=${evidenceCount} consistency=${consistency.toFixed(4)} expertise=${expertiseLevel.toFixed(4)} conf=${confidence.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_006 · 直觉校准
// ============================================================================
function intuitionCalibration(historicalIntuitions) {
    if (historicalIntuitions.length === 0) {
        return { calibrationScore: 0, bias: 0, resolution: 0, provenance: ['[ALG_T1_I_006] 空历史'] };
    }
    // Brier 分解：可靠性、分辨率、不确定性
    let reliability = 0;
    const bins = new Map();
    for (const h of historicalIntuitions) {
        const bin = Math.round(h.confidence * 10) / 10;
        if (!bins.has(bin))
            bins.set(bin, { forecast: [], outcomes: [] });
        bins.get(bin).forecast.push(h.confidence);
        bins.get(bin).outcomes.push(h.actual);
    }
    for (const [bin, data] of bins) {
        const meanForecast = data.forecast.reduce((s, x) => s + x, 0) / data.forecast.length;
        const meanOutcome = data.outcomes.reduce((s, x) => s + x, 0) / data.outcomes.length;
        reliability += data.forecast.length * (meanForecast - meanOutcome) ** 2;
    }
    reliability /= historicalIntuitions.length;
    const calibrationScore = Math.max(0, 1 - Math.sqrt(reliability));
    const bias = historicalIntuitions.reduce((s, h) => s + (h.predicted - h.actual), 0) / historicalIntuitions.length;
    const overallMean = historicalIntuitions.reduce((s, h) => s + h.actual, 0) / historicalIntuitions.length;
    let resolutionSum = 0;
    for (const [, data] of bins) {
        const meanOutcome = data.outcomes.reduce((s, x) => s + x, 0) / data.outcomes.length;
        resolutionSum += data.outcomes.length * (meanOutcome - overallMean) ** 2;
    }
    const resolution = resolutionSum / historicalIntuitions.length;
    return {
        calibrationScore,
        bias,
        resolution,
        provenance: [`[ALG_T1_I_006] n=${historicalIntuitions.length} calibration=${calibrationScore.toFixed(4)} bias=${bias.toFixed(4)} resolution=${resolution.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_007 · 专家直觉（Klein 识别启动决策模型）
// ============================================================================
function expertIntuition(situation, experience) {
    if (experience.patterns.length === 0) {
        return { action: null, recognizedPattern: null, expectanciesViolated: false, provenance: ['[ALG_T1_I_007] 无经验'] };
    }
    let bestPattern = null;
    let bestOverlap = 0;
    for (const p of experience.patterns) {
        const overlap = p.match.filter(c => situation.cues.includes(c)).length;
        const score = overlap / Math.max(p.match.length, 1) * p.typicality;
        if (score > bestOverlap) {
            bestOverlap = score;
            bestPattern = p;
        }
    }
    if (!bestPattern) {
        return { action: null, recognizedPattern: null, expectanciesViolated: false, provenance: ['[ALG_T1_I_007] 无匹配模式'] };
    }
    let violated = false;
    for (const [exp, met] of Object.entries(situation.expectations)) {
        if (!met) {
            violated = true;
            break;
        }
    }
    return {
        action: bestPattern.action,
        recognizedPattern: bestPattern.match.join('+'),
        expectanciesViolated: violated,
        provenance: [`[ALG_T1_I_007] cues=${situation.cues.length} pattern="${bestPattern.match.join('+')}" action="${bestPattern.action}" violated=${violated}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_008 · 模式匹配（k-最近邻）
// ============================================================================
function patternMatching(query, dataset, k = 3) {
    if (dataset.length === 0 || query.length === 0 || k <= 0) {
        return { label: null, neighbors: [], provenance: ['[ALG_T1_I_008] 空数据集或查询'] };
    }
    const distances = dataset.map(d => {
        let sum = 0;
        const len = Math.min(query.length, d.vector.length);
        for (let i = 0; i < len; i++)
            sum += (query[i] - d.vector[i]) ** 2;
        return { label: d.label, distance: Math.sqrt(sum) };
    });
    distances.sort((a, b) => a.distance - b.distance);
    const neighbors = distances.slice(0, Math.min(k, distances.length));
    const labelCounts = new Map();
    for (const n of neighbors)
        labelCounts.set(n.label, (labelCounts.get(n.label) || 0) + 1);
    let label = null;
    let maxCount = 0;
    for (const [l, c] of labelCounts) {
        if (c > maxCount) {
            maxCount = c;
            label = l;
        }
    }
    return {
        label,
        neighbors,
        provenance: [`[ALG_T1_I_008] dataset=${dataset.length} k=${k} label="${label}" neighbors=${neighbors.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_009 · 直觉触发（阈值门控）
// ============================================================================
function intuitionTrigger(signals, triggerThreshold = 0.6, noveltyBonus = 0.2) {
    if (signals.length === 0) {
        return { triggered: false, triggerScore: 0, sources: [], provenance: ['[ALG_T1_I_009] 无信号'] };
    }
    let triggerScore = 0;
    const sources = [];
    for (const s of signals) {
        const adjusted = s.intensity + s.novelty * noveltyBonus;
        if (adjusted >= triggerThreshold) {
            triggerScore = Math.max(triggerScore, adjusted);
            sources.push(s.source);
        }
    }
    triggerScore = Math.min(1, triggerScore);
    return {
        triggered: sources.length > 0,
        triggerScore,
        sources,
        provenance: [`[ALG_T1_I_009] signals=${signals.length} triggered=${sources.length > 0} score=${triggerScore.toFixed(4)} sources=${sources.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_010 · 直觉聚合（DS 证据理论简化版）
// ============================================================================
function intuitionAggregation(intuitions) {
    if (intuitions.length === 0) {
        return { aggregated: [], conflict: 0, provenance: ['[ALG_T1_I_010] 空直觉'] };
    }
    // Dempster 组合规则简化版
    const hypBelief = new Map();
    let totalMass = 0;
    let conflict = 0;
    for (const i of intuitions) {
        if (i.belief < 0 || i.uncertainty < 0 || i.belief + i.uncertainty > 1.0001) {
            conflict += 0.1;
            continue;
        }
        const current = hypBelief.get(i.hypothesis) ?? 0;
        const combined = current + i.belief * (1 - current);
        hypBelief.set(i.hypothesis, combined);
        totalMass += i.belief;
        conflict += i.uncertainty * 0.5;
    }
    const aggregated = [];
    for (const [h, b] of hypBelief) {
        aggregated.push({ hypothesis: h, belief: totalMass > 0 ? Math.min(1, b / totalMass * (hypBelief.size)) : b });
    }
    aggregated.sort((a, b) => b.belief - a.belief);
    conflict = Math.min(1, conflict / intuitions.length);
    return {
        aggregated,
        conflict,
        provenance: [`[ALG_T1_I_010] intuitions=${intuitions.length} hypotheses=${aggregated.length} conflict=${conflict.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_011 · 直觉衰减
// ============================================================================
function intuitionDecay(initialStrength, elapsed, halfLife = 3600, reinforcementCount = 0) {
    if (halfLife <= 0) {
        return { currentStrength: initialStrength, decayFactor: 1, provenance: ['[ALG_T1_I_011] halfLife<=0'] };
    }
    const baseDecay = Math.pow(0.5, elapsed / halfLife);
    // 每次强化减缓衰减
    const reinforcementFactor = Math.pow(0.9, reinforcementCount);
    const decayFactor = Math.max(0, Math.min(1, baseDecay * reinforcementFactor + (1 - reinforcementFactor)));
    const currentStrength = initialStrength * decayFactor;
    return {
        currentStrength,
        decayFactor,
        provenance: [`[ALG_T1_I_011] init=${initialStrength.toFixed(4)} elapsed=${elapsed} halfLife=${halfLife} rein=${reinforcementCount} curr=${currentStrength.toFixed(4)} decay=${decayFactor.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_012 · 直觉冲突
// ============================================================================
function intuitionConflict(intuitions) {
    if (intuitions.length === 0) {
        return { conflictLevel: 0, dominantDirection: 'neutral', resolution: '无直觉', provenance: ['[ALG_T1_I_012] 空直觉'] };
    }
    let posSum = 0, negSum = 0;
    for (const i of intuitions) {
        if (i.direction === 'positive')
            posSum += i.strength;
        else
            negSum += i.strength;
    }
    const total = posSum + negSum;
    const conflictLevel = total === 0 ? 0 : 1 - Math.abs(posSum - negSum) / total;
    let dominantDirection;
    let resolution;
    if (posSum > negSum * 1.2) {
        dominantDirection = 'positive';
        resolution = '采纳正向直觉';
    }
    else if (negSum > posSum * 1.2) {
        dominantDirection = 'negative';
        resolution = '采纳负向直觉';
    }
    else {
        dominantDirection = 'neutral';
        resolution = '冲突过大，需显式推理';
    }
    return {
        conflictLevel,
        dominantDirection,
        resolution,
        provenance: [`[ALG_T1_I_012] pos=${posSum.toFixed(4)} neg=${negSum.toFixed(4)} conflict=${conflictLevel.toFixed(4)} dom=${dominantDirection}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_013 · 直觉学习（强化）
// ============================================================================
function intuitionLearning(currentWeights, experiences) {
    if (experiences.length === 0) {
        return { updatedWeights: { ...currentWeights }, totalAdjustment: 0, provenance: ['[ALG_T1_I_013] 无经验'] };
    }
    const updatedWeights = { ...currentWeights };
    let totalAdjustment = 0;
    for (const exp of experiences) {
        const current = updatedWeights[exp.pattern] ?? 0.5;
        const target = exp.outcome === 'success' ? 1 : 0;
        const adjustment = exp.learningRate * (target - current);
        updatedWeights[exp.pattern] = Math.max(0, Math.min(1, current + adjustment));
        totalAdjustment += Math.abs(adjustment);
    }
    return {
        updatedWeights,
        totalAdjustment,
        provenance: [`[ALG_T1_I_013] patterns=${Object.keys(currentWeights).length} experiences=${experiences.length} adjustment=${totalAdjustment.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_014 · 直觉溯源
// ============================================================================
function intuitionProvenance(intuition, sources) {
    if (sources.length === 0) {
        return { traceability: 0, dominantSource: null, sourceBreakdown: {}, provenance: ['[ALG_T1_I_014] 无来源'] };
    }
    const totalContribution = sources.reduce((s, src) => s + Math.abs(src.contributes), 0);
    if (totalContribution === 0) {
        return { traceability: 0, dominantSource: null, sourceBreakdown: {}, provenance: ['[ALG_T1_I_014] 总贡献为0'] };
    }
    const sourceBreakdown = {};
    let dominantSource = null;
    let maxContribution = -Infinity;
    for (const src of sources) {
        const normalized = Math.abs(src.contributes) / totalContribution;
        sourceBreakdown[src.type] = (sourceBreakdown[src.type] ?? 0) + normalized;
        if (Math.abs(src.contributes) > maxContribution) {
            maxContribution = Math.abs(src.contributes);
            dominantSource = src.id;
        }
    }
    // 可溯源度 = 来源多样性 * 贡献集中度的反数
    const diversity = Object.keys(sourceBreakdown).length / 4;
    const concentration = Math.max(...Object.values(sourceBreakdown));
    const traceability = diversity * (1 - concentration * 0.5);
    return {
        traceability: Math.max(0, Math.min(1, traceability)),
        dominantSource,
        sourceBreakdown,
        provenance: [`[ALG_T1_I_014] sources=${sources.length} dominant=${dominantSource} traceability=${traceability.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_I_015 · 直觉验证
// ============================================================================
function intuitionValidation(intuition, evidence, tolerance = 0.1) {
    if (evidence.length === 0) {
        return { validated: false, deviation: 0, adjustedConfidence: intuition.confidence, provenance: ['[ALG_T1_I_015] 无证据'] };
    }
    const weightedSum = evidence.reduce((s, e) => s + e.observation * e.reliability, 0);
    const totalReliability = evidence.reduce((s, e) => s + e.reliability, 0);
    const observedValue = totalReliability === 0 ? 0 : weightedSum / totalReliability;
    const deviation = Math.abs(intuition.prediction - observedValue);
    const validated = deviation <= tolerance;
    // 根据偏差调整置信度
    const accuracyFactor = Math.max(0, 1 - deviation / (tolerance * 5));
    const adjustedConfidence = intuition.confidence * accuracyFactor;
    return {
        validated,
        deviation,
        adjustedConfidence: Math.max(0, Math.min(1, adjustedConfidence)),
        provenance: [`[ALG_T1_I_015] predicted=${intuition.prediction.toFixed(4)} observed=${observedValue.toFixed(4)} dev=${deviation.toFixed(4)} validated=${validated} adjConf=${adjustedConfidence.toFixed(4)}`],
    };
}
