"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 直觉引擎封装类（ALG_T2_I_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 直觉引擎类
 *
 * 引擎封装算法特征：
 *   - 作为 intuition-engine 的私有辅助方法
 *   - 处理启发式判断、模式识别、快速决策
 *   - 比 T1 基础算法更高阶、面向直觉调度场景
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuseIntuitionSignals = fuseIntuitionSignals;
exports.rapidPatternMatch = rapidPatternMatch;
exports.assessIntuitionConfidence = assessIntuitionConfidence;
exports.heuristicDecision = heuristicDecision;
exports.intuitionDecay = intuitionDecay;
exports.calibrateIntuition = calibrateIntuition;
exports.abstractPattern = abstractPattern;
exports.detectIntuitionConflict = detectIntuitionConflict;
exports.rankIntuitions = rankIntuitions;
exports.traceIntuitionSource = traceIntuitionSource;
exports.suppressLowConfidence = suppressLowConfidence;
exports.amplifyHighConfidence = amplifyHighConfidence;
exports.countPatternFrequency = countPatternFrequency;
exports.searchIntuitionPath = searchIntuitionPath;
exports.intuitionStateMachine = intuitionStateMachine;
exports.retrieveIntuitionMemory = retrieveIntuitionMemory;
exports.mergeIntuitions = mergeIntuitions;
exports.evaluateIntuitionTrigger = evaluateIntuitionTrigger;
exports.learnFromFeedback = learnFromFeedback;
exports.comprehensiveIntuitionAssessment = comprehensiveIntuitionAssessment;
// ============================================================================
// ALG_T2_I_001 · 多信号直觉融合
// ============================================================================
function fuseIntuitionSignals(signals) {
    if (signals.length === 0) {
        return { score: 0, dominant: 'none', provenance: ['[ALG_T2_I_001] 无信号'] };
    }
    let weighted = 0;
    let totalWeight = 0;
    let dominant = signals[0].source;
    let maxStrength = 0;
    for (const s of signals) {
        const w = s.confidence;
        weighted += s.strength * w;
        totalWeight += w;
        if (s.strength > maxStrength) {
            maxStrength = s.strength;
            dominant = s.source;
        }
    }
    const score = totalWeight === 0 ? 0 : weighted / totalWeight;
    return {
        score,
        dominant,
        provenance: [`[ALG_T2_I_001] score=${score.toFixed(4)} dom=${dominant} n=${signals.length}`],
    };
}
// ============================================================================
// ALG_T2_I_002 · 模式快速匹配
// ============================================================================
function rapidPatternMatch(input, patterns, threshold = 0.5) {
    const candidates = [];
    let best = null;
    for (const p of patterns) {
        const sim = stringSimilarity(input, p.pattern);
        if (sim >= threshold) {
            const enhanced = { ...p, similarity: sim };
            candidates.push(enhanced);
            if (!best || enhanced.similarity > best.similarity) {
                best = enhanced;
            }
        }
    }
    return {
        matched: best,
        candidates: candidates.sort((a, b) => b.similarity - a.similarity),
        provenance: [`[ALG_T2_I_002] candidates=${candidates.length} threshold=${threshold}`],
    };
}
function stringSimilarity(a, b) {
    if (a === b)
        return 1;
    const setA = new Set(a.toLowerCase().split(''));
    const setB = new Set(b.toLowerCase().split(''));
    let inter = 0;
    for (const c of setA)
        if (setB.has(c))
            inter++;
    const union = setA.size + setB.size - inter;
    return union === 0 ? 0 : inter / union;
}
// ============================================================================
// ALG_T2_I_003 · 直觉置信度评估
// ============================================================================
function assessIntuitionConfidence(samples, reference) {
    if (samples.length === 0) {
        return { confidence: 0, bias: 0, provenance: ['[ALG_T2_I_003] 无样本'] };
    }
    const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
    const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / samples.length;
    const std = Math.sqrt(variance);
    const cv = mean === 0 ? 1 : std / Math.abs(mean);
    const confidence = Math.max(0, 1 - cv);
    const bias = reference !== undefined ? mean - reference : 0;
    return {
        confidence,
        bias,
        provenance: [`[ALG_T2_I_003] conf=${confidence.toFixed(4)} cv=${cv.toFixed(4)} bias=${bias.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_I_004 · 启发式决策
// ============================================================================
function heuristicDecision(options, riskTolerance = 0.5) {
    if (options.length === 0) {
        return { chosen: null, expectedValue: 0, provenance: ['[ALG_T2_I_004] 无选项'] };
    }
    let best = null;
    let bestEV = -Infinity;
    for (const opt of options) {
        if (opt.risk > riskTolerance)
            continue;
        const ev = opt.score * (1 - opt.risk);
        if (ev > bestEV) {
            bestEV = ev;
            best = opt.name;
        }
    }
    return {
        chosen: best,
        expectedValue: bestEV === -Infinity ? 0 : bestEV,
        provenance: [`[ALG_T2_I_004] chosen=${best} ev=${bestEV.toFixed(4)} riskTol=${riskTolerance}`],
    };
}
// ============================================================================
// ALG_T2_I_005 · 直觉衰减
// ============================================================================
function intuitionDecay(initialConfidence, elapsedMs, halfLifeMs) {
    if (halfLifeMs <= 0) {
        return { confidence: initialConfidence, provenance: ['[ALG_T2_I_005] halfLife<=0'] };
    }
    const confidence = initialConfidence * Math.pow(0.5, elapsedMs / halfLifeMs);
    return {
        confidence,
        provenance: [`[ALG_T2_I_005] conf=${confidence.toFixed(4)} elapsed=${elapsedMs}ms half=${halfLifeMs}ms`],
    };
}
// ============================================================================
// ALG_T2_I_006 · 直觉校准
// ============================================================================
function calibrateIntuition(predictions, outcomes) {
    const n = Math.min(predictions.length, outcomes.length);
    if (n === 0) {
        return { calibrationFactor: 1, mae: 0, provenance: ['[ALG_T2_I_006] 无数据'] };
    }
    let predSum = 0;
    let outSum = 0;
    let errorSum = 0;
    for (let i = 0; i < n; i++) {
        predSum += predictions[i];
        outSum += outcomes[i];
        errorSum += Math.abs(predictions[i] - outcomes[i]);
    }
    const predMean = predSum / n;
    const outMean = outSum / n;
    const calibrationFactor = predMean === 0 ? 1 : outMean / predMean;
    const mae = errorSum / n;
    return {
        calibrationFactor,
        mae,
        provenance: [`[ALG_T2_I_006] factor=${calibrationFactor.toFixed(4)} mae=${mae.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_I_007 · 模式抽象
// ============================================================================
function abstractPattern(instances) {
    if (instances.length === 0) {
        return { pattern: {}, coverage: 0, provenance: ['[ALG_T2_I_007] 无实例'] };
    }
    const keyCount = {};
    for (const inst of instances) {
        for (const key of Object.keys(inst)) {
            keyCount[key] = (keyCount[key] || 0) + 1;
        }
    }
    const pattern = {};
    const threshold = instances.length * 0.5;
    for (const [key, count] of Object.entries(keyCount)) {
        if (count >= threshold) {
            pattern[key] = 'common';
        }
    }
    const coverage = Object.keys(pattern).length / Math.max(1, Object.keys(keyCount).length);
    return {
        pattern,
        coverage,
        provenance: [`[ALG_T2_I_007] keys=${Object.keys(pattern).length} coverage=${coverage.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_I_008 · 直觉冲突检测
// ============================================================================
function detectIntuitionConflict(intuitions, threshold = 0.3) {
    if (intuitions.length < 2) {
        return { hasConflict: false, conflictScore: 0, provenance: ['[ALG_T2_I_008] 不足2个信号'] };
    }
    const directions = intuitions.map(i => i.direction);
    const mean = directions.reduce((s, x) => s + x, 0) / directions.length;
    const variance = directions.reduce((s, x) => s + (x - mean) ** 2, 0) / directions.length;
    const std = Math.sqrt(variance);
    const hasConflict = std > threshold;
    return {
        hasConflict,
        conflictScore: std,
        provenance: [`[ALG_T2_I_008] conflict=${hasConflict} std=${std.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_I_009 · 直觉优先级排序
// ============================================================================
function rankIntuitions(intuitions) {
    const ranked = [...intuitions].sort((a, b) => {
        const scoreA = a.strength * 0.6 + a.urgency * 0.4;
        const scoreB = b.strength * 0.6 + b.urgency * 0.4;
        return scoreB - scoreA;
    }).map(i => i.source);
    return {
        ranked,
        provenance: [`[ALG_T2_I_009] ranked=${ranked.length} sources`],
    };
}
// ============================================================================
// ALG_T2_I_010 · 直觉溯源
// ============================================================================
function traceIntuitionSource(intuition, history) {
    const relevant = history.filter(h => h.source === intuition.source);
    if (relevant.length === 0) {
        return { reliability: 0.5, sampleSize: 0, provenance: ['[ALG_T2_I_010] 无历史数据'] };
    }
    const success = relevant.filter(h => h.success).length;
    const reliability = success / relevant.length;
    return {
        reliability,
        sampleSize: relevant.length,
        provenance: [`[ALG_T2_I_010] source=${intuition.source} rel=${reliability.toFixed(4)} n=${relevant.length}`],
    };
}
// ============================================================================
// ALG_T2_I_011 · 直觉抑制（低置信度时抑制）
// ============================================================================
function suppressLowConfidence(intuitions, threshold = 0.3) {
    const suppressed = [];
    const kept = [];
    for (const i of intuitions) {
        if (i.confidence < threshold) {
            suppressed.push(i.source);
        }
        else {
            kept.push(i.source);
        }
    }
    return {
        suppressed,
        kept,
        provenance: [`[ALG_T2_I_011] suppressed=${suppressed.length} kept=${kept.length} threshold=${threshold}`],
    };
}
// ============================================================================
// ALG_T2_I_012 · 直觉放大（高置信度时增强）
// ============================================================================
function amplifyHighConfidence(score, confidence, threshold = 0.8) {
    if (confidence >= threshold) {
        const boost = 1 + (confidence - threshold) * 0.5;
        return {
            amplified: Math.min(1, score * boost),
            boosted: true,
            provenance: [`[ALG_T2_I_012] boosted conf=${confidence.toFixed(4)} boost=${boost.toFixed(4)}`],
        };
    }
    return {
        amplified: score,
        boosted: false,
        provenance: [`[ALG_T2_I_012] not boosted conf=${confidence.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_I_013 · 模式频次统计
// ============================================================================
function countPatternFrequency(sequences) {
    const patterns = new Map();
    for (const seq of sequences) {
        for (const item of seq) {
            patterns.set(item, (patterns.get(item) || 0) + 1);
        }
    }
    let topPattern = null;
    let maxCount = 0;
    for (const [p, c] of patterns) {
        if (c > maxCount) {
            maxCount = c;
            topPattern = p;
        }
    }
    return {
        patterns,
        topPattern,
        provenance: [`[ALG_T2_I_013] unique=${patterns.size} top=${topPattern} count=${maxCount}`],
    };
}
// ============================================================================
// ALG_T2_I_014 · 直觉路径搜索
// ============================================================================
function searchIntuitionPath(graph, start, target, maxDepth = 5) {
    if (start === target) {
        return { path: [start], visited: 1, provenance: ['[ALG_T2_I_014] start=target'] };
    }
    const queue = [{ node: start, path: [start] }];
    const visited = new Set([start]);
    while (queue.length > 0) {
        const { node, path } = queue.shift();
        if (path.length > maxDepth)
            continue;
        const neighbors = graph.get(node) || [];
        for (const next of neighbors) {
            if (next === target) {
                return {
                    path: [...path, next],
                    visited: visited.size,
                    provenance: [`[ALG_T2_I_014] found depth=${path.length + 1} visited=${visited.size}`],
                };
            }
            if (!visited.has(next)) {
                visited.add(next);
                queue.push({ node: next, path: [...path, next] });
            }
        }
    }
    return {
        path: null,
        visited: visited.size,
        provenance: [`[ALG_T2_I_014] not found visited=${visited.size}`],
    };
}
// ============================================================================
// ALG_T2_I_015 · 直觉状态机
// ============================================================================
function intuitionStateMachine(current, signal) {
    let next;
    let action;
    switch (current) {
        case 'idle':
            if (signal > 0.1) {
                next = 'sensing';
                action = 'start-sensing';
            }
            else {
                next = 'idle';
                action = 'stay-idle';
            }
            break;
        case 'sensing':
            if (signal > 0.5) {
                next = 'evaluating';
                action = 'evaluate';
            }
            else if (signal < 0.05) {
                next = 'idle';
                action = 'reset';
            }
            else {
                next = 'sensing';
                action = 'continue-sensing';
            }
            break;
        case 'evaluating':
            if (signal > 0.7) {
                next = 'acting';
                action = 'act';
            }
            else if (signal < 0.3) {
                next = 'idle';
                action = 'abort';
            }
            else {
                next = 'evaluating';
                action = 'keep-evaluating';
            }
            break;
        case 'acting':
            next = 'idle';
            action = 'complete';
            break;
    }
    return {
        next,
        action,
        provenance: [`[ALG_T2_I_015] ${current}->${next} signal=${signal.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_I_016 · 直觉记忆检索
// ============================================================================
function retrieveIntuitionMemory(query, memories, limit = 5) {
    const scored = memories.map(m => ({
        content: m.content,
        score: stringSimilarity(query, m.content) * m.weight,
    }));
    scored.sort((a, b) => b.score - a.score);
    const retrieved = scored.slice(0, limit).filter(s => s.score > 0).map(s => s.content);
    return {
        retrieved,
        provenance: [`[ALG_T2_I_016] retrieved=${retrieved.length} limit=${limit}`],
    };
}
// ============================================================================
// ALG_T2_I_017 · 直觉合并
// ============================================================================
function mergeIntuitions(intuitions) {
    if (intuitions.length === 0) {
        return { merged: 0, dominantSource: 'none', provenance: ['[ALG_T2_I_017] 空'] };
    }
    let weighted = 0;
    let totalW = 0;
    let dominant = intuitions[0].source;
    let maxW = 0;
    for (const i of intuitions) {
        weighted += i.value * i.weight;
        totalW += i.weight;
        if (i.weight > maxW) {
            maxW = i.weight;
            dominant = i.source;
        }
    }
    return {
        merged: totalW === 0 ? 0 : weighted / totalW,
        dominantSource: dominant,
        provenance: [`[ALG_T2_I_017] merged=${(totalW === 0 ? 0 : weighted / totalW).toFixed(4)} dom=${dominant}`],
    };
}
// ============================================================================
// ALG_T2_I_018 · 直觉触发条件评估
// ============================================================================
function evaluateIntuitionTrigger(conditions, threshold = 0.6) {
    if (conditions.length === 0) {
        return { triggered: false, score: 0, provenance: ['[ALG_T2_I_018] 无条件'] };
    }
    let totalW = 0;
    let metW = 0;
    for (const c of conditions) {
        totalW += c.weight;
        if (c.met)
            metW += c.weight;
    }
    const score = totalW === 0 ? 0 : metW / totalW;
    return {
        triggered: score >= threshold,
        score,
        provenance: [`[ALG_T2_I_018] triggered=${score >= threshold} score=${score.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_I_019 · 直觉反馈学习
// ============================================================================
function learnFromFeedback(history) {
    if (history.length === 0) {
        return { adjustment: 0, learningRate: 0, provenance: ['[ALG_T2_I_019] 无历史'] };
    }
    let weightedError = 0;
    let totalW = 0;
    for (const h of history) {
        weightedError += (h.outcome - h.prediction) * h.weight;
        totalW += h.weight;
    }
    const adjustment = totalW === 0 ? 0 : weightedError / totalW;
    const learningRate = Math.min(1, 1 / Math.sqrt(history.length));
    return {
        adjustment: adjustment * learningRate,
        learningRate,
        provenance: [`[ALG_T2_I_019] adj=${(adjustment * learningRate).toFixed(4)} lr=${learningRate.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_I_020 · 综合直觉评估
// ============================================================================
function comprehensiveIntuitionAssessment(signals, context) {
    const fusion = fuseIntuitionSignals(signals);
    const confidence = assessIntuitionConfidence(signals.map(s => s.strength));
    const riskAdjustment = 1 - context.riskTolerance * 0.3;
    const timeBoost = context.timePressure > 0.7 ? 1.1 : 1.0;
    const score = fusion.score * confidence.confidence * riskAdjustment * timeBoost;
    let action;
    if (score > 0.6)
        action = 'act';
    else if (score > 0.3)
        action = 'wait';
    else
        action = 'abort';
    return {
        score,
        action,
        provenance: [`[ALG_T2_I_020] score=${score.toFixed(4)} action=${action} fusion=${fusion.score.toFixed(4)}`],
    };
}
