"use strict";
/**
 * MetaGO Engine - A5 T1 算法 · 推理类（第二批）
 *
 * 对应属性：D37 战略思考强制触发 / FIPO 四阶段推理
 * 对应文档：附录A·T1·REASONING（ALG_T1_R_001 ~ ALG_T1_R_015）
 *
 * 算法清单（15 个）：
 *   001 演绎推理      002 归纳推理        003 溯因推理
 *   004 类比推理      005 因果推理        006 反事实推理
 *   007 模态推理      008 时序推理        009 空间推理
 *   010 数量推理      011 定性推理        012 模糊推理
 *   013 概率推理      014 启发式推理      015 前向链推理
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deductiveReasoning = deductiveReasoning;
exports.inductiveReasoning = inductiveReasoning;
exports.abductiveReasoning = abductiveReasoning;
exports.analogicalReasoning = analogicalReasoning;
exports.causalReasoning = causalReasoning;
exports.counterfactualReasoning = counterfactualReasoning;
exports.modalReasoning = modalReasoning;
exports.temporalReasoning = temporalReasoning;
exports.spatialReasoning = spatialReasoning;
exports.quantitativeReasoning = quantitativeReasoning;
exports.qualitativeReasoning = qualitativeReasoning;
exports.fuzzyReasoning = fuzzyReasoning;
exports.probabilisticReasoning = probabilisticReasoning;
exports.heuristicReasoning = heuristicReasoning;
exports.forwardChaining = forwardChaining;
// ============================================================================
// T1·ALG_T1_R_001 · 演绎推理（Modus Ponens）
// ============================================================================
function deductiveReasoning(premises, rules) {
    if (premises.length === 0 || rules.length === 0) {
        return { conclusions: [], provenance: ['[ALG_T1_R_001] 空前提或规则'] };
    }
    const factMap = new Map();
    for (const p of premises) {
        if (p.truth)
            factMap.set(p.statement, p);
    }
    const conclusions = [];
    for (const rule of rules) {
        // 检查所有前提是否为真
        const allPremisesMet = rule.premises.every(p => factMap.has(p));
        if (allPremisesMet) {
            // 置信度 = min(前提置信度) * 规则置信度
            const minConfidence = Math.min(...rule.premises.map(p => factMap.get(p).confidence));
            conclusions.push({
                statement: rule.conclusion,
                confidence: minConfidence * rule.confidence,
                rule: `${rule.premises.join(', ')} => ${rule.conclusion}`,
            });
        }
    }
    return {
        conclusions,
        provenance: [`[ALG_T1_R_001] rules=${rules.length} conclusions=${conclusions.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_002 · 归纳推理
// ============================================================================
function inductiveReasoning(observations) {
    if (observations.length === 0) {
        return { generalizations: [], provenance: ['[ALG_T1_R_002] 空观察'] };
    }
    const generalizations = [];
    // 统计每个特征在每个类别中的出现频率
    const featureCategoryCount = new Map();
    for (const obs of observations) {
        for (const [feature, present] of Object.entries(obs.features)) {
            if (!featureCategoryCount.has(feature))
                featureCategoryCount.set(feature, new Map());
            const catMap = featureCategoryCount.get(feature);
            if (!catMap.has(obs.category))
                catMap.set(obs.category, { count: 0, total: 0 });
            const stats = catMap.get(obs.category);
            stats.total++;
            if (present)
                stats.count++;
        }
    }
    for (const [feature, catMap] of featureCategoryCount) {
        for (const [category, stats] of catMap) {
            const support = stats.total / observations.length;
            const confidence = stats.count / stats.total;
            if (confidence > 0.5 && support > 0.1) {
                generalizations.push({ feature, category, support, confidence });
            }
        }
    }
    return {
        generalizations,
        provenance: [`[ALG_T1_R_002] observations=${observations.length} generalizations=${generalizations.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_003 · 溯因推理
// ============================================================================
function abductiveReasoning(observation, hypotheses) {
    if (hypotheses.length === 0) {
        return { bestExplanation: null, ranked: [], provenance: ['[ALG_T1_R_003] 空假设'] };
    }
    const ranked = hypotheses.map(h => ({
        explanation: h.explanation,
        score: h.priorProbability * h.explanatoryPower,
    }));
    ranked.sort((a, b) => b.score - a.score);
    return {
        bestExplanation: ranked[0].explanation,
        ranked,
        provenance: [`[ALG_T1_R_003] obs="${observation}" hypotheses=${hypotheses.length} best="${ranked[0].explanation}" score=${ranked[0].score.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_004 · 类比推理
// ============================================================================
function analogicalReasoning(source, target) {
    const sourceKeys = Object.keys(source.attributes);
    const targetKeys = Object.keys(target.attributes);
    if (sourceKeys.length === 0 || targetKeys.length === 0) {
        return { mappedAttributes: [], inferredRelations: [], provenance: ['[ALG_T1_R_004] 空属性'] };
    }
    // 映射属性（按值相似度）
    const mappedAttributes = [];
    for (const sk of sourceKeys) {
        let bestMatch = null;
        for (const tk of targetKeys) {
            const sv = source.attributes[sk];
            const tv = target.attributes[tk];
            const sim = 1 - Math.min(1, Math.abs(sv - tv));
            if (!bestMatch || sim > bestMatch.similarity) {
                bestMatch = { target: tk, similarity: sim };
            }
        }
        if (bestMatch) {
            mappedAttributes.push({ source: sk, target: bestMatch.target, similarity: bestMatch.similarity });
        }
    }
    // 推断关系：源域有的关系模式，目标域也可能有
    const inferredRelations = [];
    for (const rel of source.relations) {
        // 简化：直接映射关系
        const mapped = mappedAttributes.find(m => m.source === rel[0]);
        const mapped2 = mappedAttributes.find(m => m.source === rel[2]);
        if (mapped && mapped2) {
            inferredRelations.push([mapped.target, rel[1], mapped2.target]);
        }
    }
    return {
        mappedAttributes,
        inferredRelations,
        provenance: [`[ALG_T1_R_004] mapped=${mappedAttributes.length} inferred=${inferredRelations.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_005 · 因果推理
// ============================================================================
function causalReasoning(events) {
    if (events.length === 0) {
        return { causalGraph: new Map(), strongCauses: [], provenance: ['[ALG_T1_R_005] 空事件'] };
    }
    const causalGraph = new Map();
    for (const e of events) {
        if (!causalGraph.has(e.cause))
            causalGraph.set(e.cause, new Map());
        const effects = causalGraph.get(e.cause);
        effects.set(e.effect, (effects.get(e.effect) || 0) + e.strength);
    }
    // 找出强因果关系
    const strongCauses = [];
    for (const [cause, effects] of causalGraph) {
        for (const [effect, strength] of effects) {
            if (strength > 0.5) {
                strongCauses.push({ cause, effect, strength });
            }
        }
    }
    strongCauses.sort((a, b) => b.strength - a.strength);
    return {
        causalGraph,
        strongCauses,
        provenance: [`[ALG_T1_R_005] events=${events.length} causes=${causalGraph.size} strong=${strongCauses.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_006 · 反事实推理
// ============================================================================
function counterfactualReasoning(actual, counterfactual, model) {
    if (actual.condition.length === 0 || actual.condition.length !== counterfactual.condition.length) {
        return { estimatedOutcome: 0, difference: 0, provenance: ['[ALG_T1_R_006] 条件不匹配'] };
    }
    // 使用线性模型估计反事实结果
    const counterfactualOutcome = counterfactual.condition.reduce((s, c, i) => s + (c ? 1 : 0) * (model.weights[i] || 0), 0) + model.bias;
    const difference = counterfactualOutcome - actual.outcome;
    return {
        estimatedOutcome: counterfactualOutcome,
        difference,
        provenance: [`[ALG_T1_R_006] actual=${actual.outcome} counterfactual=${counterfactualOutcome.toFixed(4)} diff=${difference.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_007 · 模态推理
// ============================================================================
function modalReasoning(propositions) {
    if (propositions.length === 0) {
        return { necessary: [], possible: [], impossible: [], contradictions: [], provenance: ['[ALG_T1_R_007] 空命题'] };
    }
    const necessary = [];
    const possible = [];
    const impossible = [];
    const contradictions = [];
    for (const p of propositions) {
        if (!p.truth)
            continue;
        switch (p.modality) {
            case 'necessary':
                necessary.push(p.statement);
                break;
            case 'possible':
                possible.push(p.statement);
                break;
            case 'impossible':
                impossible.push(p.statement);
                break;
        }
    }
    // 检查矛盾：必然的不能是不可能的
    for (const n of necessary) {
        if (impossible.includes(n))
            contradictions.push(`${n}: necessary AND impossible`);
    }
    return {
        necessary,
        possible,
        impossible,
        contradictions,
        provenance: [`[ALG_T1_R_007] nec=${necessary.length} poss=${possible.length} imposs=${impossible.length} contra=${contradictions.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_008 · 时序推理
// ============================================================================
function temporalReasoning(events) {
    if (events.length === 0) {
        return { ordered: [], violations: [], provenance: ['[ALG_T1_R_008] 空事件'] };
    }
    // 按时间排序
    const sorted = [...events].sort((a, b) => a.time - b.time);
    const ordered = sorted.map(e => e.id);
    // 检查 before/after 约束
    const violations = [];
    const timeMap = new Map(events.map(e => [e.id, e.time]));
    for (const e of events) {
        if (e.before && timeMap.has(e.before)) {
            if (e.time >= timeMap.get(e.before)) {
                violations.push(`${e.id} should be before ${e.before}`);
            }
        }
        if (e.after && timeMap.has(e.after)) {
            if (e.time <= timeMap.get(e.after)) {
                violations.push(`${e.id} should be after ${e.after}`);
            }
        }
    }
    return {
        ordered,
        violations,
        provenance: [`[ALG_T1_R_008] events=${events.length} violations=${violations.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_009 · 空间推理
// ============================================================================
function spatialReasoning(objects, query) {
    if (objects.length < 2) {
        return { result: false, provenance: ['[ALG_T1_R_009] 对象不足'] };
    }
    const a = objects.find(o => o.id === query.a);
    const b = objects.find(o => o.id === query.b);
    if (!a || !b) {
        return { result: false, provenance: ['[ALG_T1_R_009] 未找到对象'] };
    }
    const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z ?? 0) - (b.z ?? 0)) ** 2);
    switch (query.type) {
        case 'distance':
            return { result: dist, provenance: [`[ALG_T1_R_009] dist(${query.a},${query.b})=${dist.toFixed(4)}`] };
        case 'adjacent':
            const threshold = query.threshold ?? 10;
            return { result: dist <= threshold, provenance: [`[ALG_T1_R_009] adjacent=${dist <= threshold} dist=${dist.toFixed(4)}`] };
        case 'contains':
            // 简化：a 包含 b 如果距离为0
            return { result: dist === 0, provenance: [`[ALG_T1_R_009] contains=${dist === 0}`] };
        default:
            return { result: false, provenance: ['[ALG_T1_R_009] 未知查询类型'] };
    }
}
// ============================================================================
// T1·ALG_T1_R_010 · 数量推理
// ============================================================================
function quantitativeReasoning(values, query) {
    if (values.length === 0) {
        return { result: 0, provenance: ['[ALG_T1_R_010] 空值'] };
    }
    let result;
    switch (query.type) {
        case 'sum':
            result = values.reduce((s, v) => s + v, 0);
            break;
        case 'average':
            result = values.reduce((s, v) => s + v, 0) / values.length;
            break;
        case 'median':
            const sorted = [...values].sort((a, b) => a - b);
            result = sorted.length % 2 === 0
                ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                : sorted[Math.floor(sorted.length / 2)];
            break;
        case 'mode':
            const counts = new Map();
            for (const v of values)
                counts.set(v, (counts.get(v) || 0) + 1);
            let maxCount = 0;
            result = values[0];
            for (const [v, c] of counts) {
                if (c > maxCount) {
                    maxCount = c;
                    result = v;
                }
            }
            break;
        case 'stddev':
            const mean = values.reduce((s, v) => s + v, 0) / values.length;
            const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
            result = Math.sqrt(variance);
            break;
        case 'range':
            result = Math.max(...values) - Math.min(...values);
            break;
        case 'percentile':
            const p = query.percentile ?? 50;
            const sortedP = [...values].sort((a, b) => a - b);
            const idx = Math.ceil((p / 100) * sortedP.length) - 1;
            result = sortedP[Math.max(0, Math.min(sortedP.length - 1, idx))];
            break;
        default:
            result = 0;
    }
    return {
        result,
        provenance: [`[ALG_T1_R_010] type=${query.type} n=${values.length} result=${result.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_011 · 定性推理
// ============================================================================
function qualitativeReasoning(variables, relations) {
    if (variables.length === 0) {
        return { predictions: [], provenance: ['[ALG_T1_R_011] 空变量'] };
    }
    const varMap = new Map(variables.map(v => [v.name, v]));
    const predictions = [];
    for (const v of variables) {
        let positiveInfluences = 0;
        let negativeInfluences = 0;
        for (const r of relations) {
            if (r.effect === v.name) {
                const causeVar = varMap.get(r.cause);
                if (!causeVar)
                    continue;
                if (r.influence === 'positive') {
                    if (causeVar.derivative === 'increasing')
                        positiveInfluences++;
                    else if (causeVar.derivative === 'decreasing')
                        negativeInfluences++;
                }
                else {
                    if (causeVar.derivative === 'increasing')
                        negativeInfluences++;
                    else if (causeVar.derivative === 'decreasing')
                        positiveInfluences++;
                }
            }
        }
        let trend;
        if (positiveInfluences > 0 && negativeInfluences === 0)
            trend = 'increasing';
        else if (negativeInfluences > 0 && positiveInfluences === 0)
            trend = 'decreasing';
        else if (positiveInfluences === 0 && negativeInfluences === 0)
            trend = v.derivative;
        else
            trend = 'ambiguous';
        predictions.push({ variable: v.name, trend });
    }
    return {
        predictions,
        provenance: [`[ALG_T1_R_011] variables=${variables.length} relations=${relations.length} predictions=${predictions.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_012 · 模糊推理
// ============================================================================
function fuzzyReasoning(inputs, rules) {
    if (rules.length === 0) {
        return { output: [], provenance: ['[ALG_T1_R_012] 空规则'] };
    }
    // 计算模糊隶属度（三角形隶属函数）
    function triangleMembership(x, a, b, c) {
        if (x <= a || x >= c)
            return 0;
        if (x === b)
            return 1;
        if (x < b)
            return (x - a) / (b - a);
        return (c - x) / (c - b);
    }
    const inputMemberships = new Map();
    // 简化：对所有输入使用相同的隶属函数参数
    // 实际实现需要对每个输入定义不同的隶属函数
    const output = [];
    for (const rule of rules) {
        // 计算规则激活强度 = min(所有前提的隶属度)
        let activation = 1;
        for (const cond of rule.if) {
            const inputDef = inputs;
            const params = inputDef.membership[cond.set];
            const membership = triangleMembership(inputs.value, params[0], params[1], params[0] + params[1]);
            activation = Math.min(activation, membership);
        }
        if (activation > 0) {
            output.push({ name: rule.then.name, set: rule.then.set, membership: activation });
        }
    }
    return {
        output,
        provenance: [`[ALG_T1_R_012] rules=${rules.length} activated=${output.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_013 · 概率推理（贝叶斯）
// ============================================================================
function probabilisticReasoning(prior, evidence) {
    if (evidence.length === 0) {
        return { posterior: prior, confidence: 0, provenance: ['[ALG_T1_R_013] 无证据'] };
    }
    // 贝叶斯更新
    let posterior = prior;
    for (const e of evidence) {
        // P(H|E) = P(E|H) * P(H) / P(E)
        // 简化：posterior = prior * likelihood (observed) or * (1-likelihood) (not observed)
        const likelihood = e.observed ? e.likelihood : 1 - e.likelihood;
        const complementLikelihood = e.observed ? 1 - e.likelihood : e.likelihood;
        const evidence_prob = posterior * likelihood + (1 - posterior) * complementLikelihood;
        if (evidence_prob > 0) {
            posterior = (posterior * likelihood) / evidence_prob;
        }
    }
    const confidence = Math.min(posterior, 1 - posterior) === 0 ? 1 : 1 - 2 * Math.min(posterior, 1 - posterior);
    return {
        posterior,
        confidence,
        provenance: [`[ALG_T1_R_013] prior=${prior.toFixed(4)} posterior=${posterior.toFixed(4)} evidence=${evidence.length} confidence=${confidence.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_014 · 启发式推理
// ============================================================================
function heuristicReasoning(problem, heuristics) {
    if (heuristics.length === 0) {
        return { selectedHeuristic: null, action: null, provenance: ['[ALG_T1_R_014] 空启发式'] };
    }
    // 找到所有满足条件的启发式
    const applicable = heuristics.filter(h => h.condition(problem.features));
    if (applicable.length === 0) {
        return { selectedHeuristic: null, action: null, provenance: ['[ALG_T1_R_014] 无适用启发式'] };
    }
    // 按优先级排序
    applicable.sort((a, b) => b.priority - a.priority);
    return {
        selectedHeuristic: applicable[0].name,
        action: applicable[0].action,
        provenance: [`[ALG_T1_R_014] heuristics=${heuristics.length} applicable=${applicable.length} selected=${applicable[0].name}`],
    };
}
// ============================================================================
// T1·ALG_T1_R_015 · 前向链推理
// ============================================================================
function forwardChaining(facts, rules, maxIterations = 100) {
    if (facts.length === 0 || rules.length === 0) {
        return { derived: [], iterations: 0, provenance: ['[ALG_T1_R_015] 空事实或规则'] };
    }
    const knownFacts = new Map();
    for (const f of facts)
        knownFacts.set(f.statement, f);
    const derived = [];
    let iterations = 0;
    let newFactsDerived = true;
    while (newFactsDerived && iterations < maxIterations) {
        newFactsDerived = false;
        iterations++;
        for (const rule of rules) {
            // 检查结论是否已知
            if (knownFacts.has(rule.conclusion))
                continue;
            // 检查前提是否全部满足
            const allMet = rule.premises.every(p => knownFacts.has(p) && knownFacts.get(p).truth);
            if (allMet) {
                const minConfidence = Math.min(...rule.premises.map(p => knownFacts.get(p).confidence)) * rule.confidence;
                const newFact = { statement: rule.conclusion, truth: true, confidence: minConfidence };
                knownFacts.set(rule.conclusion, newFact);
                derived.push(newFact);
                newFactsDerived = true;
            }
        }
    }
    return {
        derived,
        iterations,
        provenance: [`[ALG_T1_R_015] initialFacts=${facts.length} derived=${derived.length} iterations=${iterations}`],
    };
}
