"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 推理引擎封装类（ALG_T2_R_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 241~260 项（推理引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 cuv-reasoner / reasoning engine 的私有辅助方法
 *   - 处理 FIPO 四阶段、因果推理、反事实、多步推理
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fipoReasoning = fipoReasoning;
exports.causalReasoning = causalReasoning;
exports.counterfactualReasoning = counterfactualReasoning;
exports.multiStepReasoningChain = multiStepReasoningChain;
exports.abductiveReasoning = abductiveReasoning;
exports.deductiveReasoning = deductiveReasoning;
exports.inductiveReasoning = inductiveReasoning;
exports.analogicalReasoning = analogicalReasoning;
exports.modalReasoning = modalReasoning;
exports.probabilisticReasoning = probabilisticReasoning;
exports.fuzzyReasoning = fuzzyReasoning;
exports.temporalReasoning = temporalReasoning;
exports.spatialReasoning = spatialReasoning;
exports.metaReasoning = metaReasoning;
exports.reasoningChainValidate = reasoningChainValidate;
exports.reasoningPathSearch = reasoningPathSearch;
exports.reasoningConflictResolve = reasoningConflictResolve;
exports.hypothesisGenerate = hypothesisGenerate;
exports.reasoningOptimize = reasoningOptimize;
exports.reasoningComprehensiveAssessment = reasoningComprehensiveAssessment;
// ============================================================================
// ALG_T2_R_001 · FIPO 四阶段推理（Frame-Inspect-Ponder-Output）
// ============================================================================
function fipoReasoning(problem, context) {
    if (!problem) {
        return { frame: '', inspect: [], ponder: '', output: '', provenance: ['[ALG_T2_R_001] 空问题'] };
    }
    const frame = `问题框架: ${problem}`;
    const inspect = context.length > 0 ? context.slice(0, 5) : ['无可用上下文'];
    const ponder = `基于 ${inspect.length} 条上下文进行推理`;
    const output = `推理结论: 针对 "${problem}" 的分析`;
    return {
        frame,
        inspect,
        ponder,
        output,
        provenance: [`[ALG_T2_R_001] problem="${problem.substring(0, 30)}" context=${context.length}`],
    };
}
// ============================================================================
// ALG_T2_R_002 · 因果推理
// ============================================================================
function causalReasoning(cause, effect, observations) {
    if (observations.length === 0) {
        return { causalStrength: 0, confidence: 0, direction: 'unknown', provenance: ['[ALG_T2_R_002] 空观察'] };
    }
    let causeAndEffect = 0;
    let causeOnly = 0;
    let effectOnly = 0;
    let neither = 0;
    for (const o of observations) {
        if (o.causePresent && o.effectPresent)
            causeAndEffect++;
        else if (o.causePresent && !o.effectPresent)
            causeOnly++;
        else if (!o.causePresent && o.effectPresent)
            effectOnly++;
        else
            neither++;
    }
    const total = observations.length;
    const causalStrength = total === 0 ? 0 : (causeAndEffect - effectOnly) / total;
    const confidence = Math.min(1, total / 30);
    const direction = causalStrength > 0.3 ? `${cause}→${effect}` : causalStrength < -0.3 ? `${effect}→${cause}` : 'unclear';
    return {
        causalStrength,
        confidence,
        direction,
        provenance: [`[ALG_T2_R_002] strength=${causalStrength.toFixed(4)} conf=${confidence.toFixed(4)} dir=${direction}`],
    };
}
// ============================================================================
// ALG_T2_R_003 · 反事实推理
// ============================================================================
function counterfactualReasoning(actual, hypothetical) {
    const actualOutcome = actual.outcome;
    const hypotheticalOutcome = hypothetical.outcome;
    const difference = actualOutcome !== hypotheticalOutcome
        ? `如果${hypothetical.condition}，则${hypotheticalOutcome}（实际: ${actualOutcome}）`
        : '无差异';
    const necessity = actualOutcome !== hypotheticalOutcome ? 1 : 0;
    const sufficiency = 0.5;
    return {
        difference,
        necessity,
        sufficiency,
        provenance: [`[ALG_T2_R_003] necessity=${necessity} sufficiency=${sufficiency} diff=${difference.substring(0, 30)}`],
    };
}
// ============================================================================
// ALG_T2_R_004 · 多步推理链
// ============================================================================
function multiStepReasoningChain(start, steps, maxSteps = 10) {
    if (steps.length === 0) {
        return { chain: [], reached: null, valid: false, provenance: ['[ALG_T2_R_004] 无步骤'] };
    }
    const chain = [{
            id: 'step_0',
            type: 'premise',
            content: start,
            confidence: 1,
            dependencies: [],
        }];
    const derived = new Set([start]);
    let stepCount = 1;
    for (const step of steps) {
        if (stepCount > maxSteps)
            break;
        if (derived.has(step.premise) && !derived.has(step.conclusion)) {
            chain.push({
                id: `step_${stepCount}`,
                type: 'inference',
                content: step.conclusion,
                confidence: 0.9,
                dependencies: [step.premise],
            });
            derived.add(step.conclusion);
            stepCount++;
        }
    }
    if (chain.length > 1) {
        const last = chain[chain.length - 1];
        last.type = 'conclusion';
        return {
            chain,
            reached: last.content,
            valid: true,
            provenance: [`[ALG_T2_R_004] steps=${chain.length} reached=${last.content.substring(0, 20)}`],
        };
    }
    return {
        chain,
        reached: null,
        valid: false,
        provenance: [`[ALG_T2_R_004] steps=${chain.length} valid=false`],
    };
}
// ============================================================================
// ALG_T2_R_005 · 溯因推理
// ============================================================================
function abductiveReasoning(observations, hypotheses) {
    if (observations.length === 0 || hypotheses.length === 0) {
        return { bestExplanation: '', score: 0, alternatives: [], provenance: ['[ALG_T2_R_005] 空输入'] };
    }
    const scored = hypotheses.map(h => {
        const explained = h.explains.filter(e => observations.includes(e));
        const coverage = explained.length / observations.length;
        const simplicity = 1 - h.complexity;
        const score = coverage * 0.5 + h.prior * 0.3 + simplicity * 0.2;
        return { name: h.name, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return {
        bestExplanation: scored[0].name,
        score: scored[0].score,
        alternatives: scored.slice(1),
        provenance: [`[ALG_T2_R_005] obs=${observations.length} hyp=${hypotheses.length} best=${scored[0].name}`],
    };
}
// ============================================================================
// ALG_T2_R_006 · 演绎推理
// ============================================================================
function deductiveReasoning(premises, rules) {
    if (premises.length === 0 || rules.length === 0) {
        return { conclusions: [], valid: false, provenance: ['[ALG_T2_R_006] 空输入'] };
    }
    const known = new Set(premises);
    const conclusions = [];
    let changed = true;
    while (changed) {
        changed = false;
        for (const rule of rules) {
            if (rule.if.every(p => known.has(p)) && !known.has(rule.then)) {
                known.add(rule.then);
                conclusions.push(rule.then);
                changed = true;
            }
        }
    }
    return {
        conclusions,
        valid: conclusions.length > 0,
        provenance: [`[ALG_T2_R_006] premises=${premises.length} conclusions=${conclusions.length}`],
    };
}
// ============================================================================
// ALG_T2_R_007 · 归纳推理
// ============================================================================
function inductiveReasoning(instances) {
    if (instances.length === 0) {
        return { rule: '', confidence: 0, coverage: 0, provenance: ['[ALG_T2_R_007] 空实例'] };
    }
    const featureLabelCount = new Map();
    for (const inst of instances) {
        for (const f of inst.features) {
            const key = f;
            if (!featureLabelCount.has(key))
                featureLabelCount.set(key, new Map());
            const labelCounts = featureLabelCount.get(key);
            labelCounts.set(inst.label, (labelCounts.get(inst.label) || 0) + 1);
        }
    }
    let bestFeature = '';
    let bestLabel = '';
    let bestCount = 0;
    for (const [feature, labels] of featureLabelCount) {
        for (const [label, count] of labels) {
            if (count > bestCount) {
                bestCount = count;
                bestFeature = feature;
                bestLabel = label;
            }
        }
    }
    const confidence = bestCount / instances.length;
    return {
        rule: `${bestFeature} → ${bestLabel}`,
        confidence,
        coverage: bestCount / instances.length,
        provenance: [`[ALG_T2_R_007] instances=${instances.length} rule="${bestFeature}→${bestLabel}" conf=${confidence.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_R_008 · 类比推理
// ============================================================================
function analogicalReasoning(source, target) {
    if (source.structure.relations.length === 0 || target.structure.relations.length === 0) {
        return { mapping: [], confidence: 0, provenance: ['[ALG_T2_R_008] 空结构'] };
    }
    const mapping = [];
    let matched = 0;
    for (const sRel of source.structure.relations) {
        for (const tRel of target.structure.relations) {
            if (sRel[1] === tRel[1]) {
                mapping.push({ source: sRel[0], target: tRel[0] });
                mapping.push({ source: sRel[2], target: tRel[2] });
                matched++;
                break;
            }
        }
    }
    const confidence = matched / Math.max(source.structure.relations.length, 1);
    return {
        mapping,
        confidence,
        provenance: [`[ALG_T2_R_008] source=${source.structure.relations.length} matched=${matched} conf=${confidence.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_R_009 · 模态推理
// ============================================================================
function modalReasoning(proposition, modality, worlds) {
    if (worlds.length === 0) {
        return { valid: false, satisfiedIn: [], provenance: ['[ALG_T2_R_009] 无可能世界'] };
    }
    const satisfied = worlds.filter(w => w.truths.has(proposition)).map(w => w.name);
    let valid;
    switch (modality) {
        case 'necessary':
            valid = satisfied.length === worlds.length;
            break;
        case 'possible':
            valid = satisfied.length > 0;
            break;
        case 'impossible':
            valid = satisfied.length === 0;
            break;
    }
    return {
        valid,
        satisfiedIn: satisfied,
        provenance: [`[ALG_T2_R_009] prop="${proposition}" mod=${modality} valid=${valid} sat=${satisfied.length}/${worlds.length}`],
    };
}
// ============================================================================
// ALG_T2_R_010 · 概率推理
// ============================================================================
function probabilisticReasoning(prior, likelihood, evidence) {
    if (evidence === 0) {
        return { posterior: prior, confidence: 0, provenance: ['[ALG_T2_R_010] 证据为零'] };
    }
    const posterior = (likelihood * prior) / evidence;
    const confidence = Math.min(1, evidence * 10);
    return {
        posterior: Math.max(0, Math.min(1, posterior)),
        confidence,
        provenance: [`[ALG_T2_R_010] prior=${prior.toFixed(4)} likelihood=${likelihood.toFixed(4)} posterior=${posterior.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_R_011 · 模糊推理
// ============================================================================
function fuzzyReasoning(inputs, rules) {
    if (rules.length === 0) {
        return { output: { variable: '', value: 0 }, defuzzified: 0, provenance: ['[ALG_T2_R_011] 无规则'] };
    }
    let weightedSum = 0;
    let totalWeight = 0;
    for (const rule of rules) {
        let membership = 0;
        if (rule.if.includes('low'))
            membership = inputs.membership.low;
        else if (rule.if.includes('medium'))
            membership = inputs.membership.medium;
        else if (rule.if.includes('high'))
            membership = inputs.membership.high;
        const outputValue = rule.then.includes('low') ? 0.2 : rule.then.includes('medium') ? 0.5 : 0.8;
        weightedSum += outputValue * membership * rule.weight;
        totalWeight += membership * rule.weight;
    }
    const defuzzified = totalWeight === 0 ? 0 : weightedSum / totalWeight;
    return {
        output: { variable: 'output', value: defuzzified },
        defuzzified,
        provenance: [`[ALG_T2_R_011] input=${inputs.variable} rules=${rules.length} output=${defuzzified.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_R_012 · 时序推理
// ============================================================================
function temporalReasoning(events, query) {
    const eventA = events.find(e => e.name === query.eventA);
    const eventB = events.find(e => e.name === query.eventB);
    if (!eventA || !eventB) {
        return { holds: false, description: 'event_not_found', provenance: ['[ALG_T2_R_012] 事件不存在'] };
    }
    let holds;
    let description;
    switch (query.type) {
        case 'before':
            holds = eventA.time + eventA.duration <= eventB.time;
            description = `${eventA.name}(${eventA.time}) 在 ${eventB.name}(${eventB.time}) 之前`;
            break;
        case 'after':
            holds = eventA.time >= eventB.time + eventB.duration;
            description = `${eventA.name}(${eventA.time}) 在 ${eventB.name}(${eventB.time}) 之后`;
            break;
        case 'during':
            holds = eventA.time >= eventB.time && eventA.time + eventA.duration <= eventB.time + eventB.duration;
            description = `${eventA.name} 在 ${eventB.name} 期间`;
            break;
    }
    return {
        holds,
        description,
        provenance: [`[ALG_T2_R_012] type=${query.type} holds=${holds} a=${eventA.time} b=${eventB.time}`],
    };
}
// ============================================================================
// ALG_T2_R_013 · 空间推理
// ============================================================================
function spatialReasoning(objects, query) {
    const a = objects.find(o => o.name === query.a);
    const b = objects.find(o => o.name === query.b);
    if (!a || !b) {
        return { result: false, description: 'object_not_found', provenance: ['[ALG_T2_R_013] 对象不存在'] };
    }
    const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
    switch (query.type) {
        case 'distance':
            return {
                result: dist,
                description: `${query.a} 到 ${query.b} 距离 ${dist.toFixed(2)}`,
                provenance: [`[ALG_T2_R_013] distance=${dist.toFixed(4)}`],
            };
        case 'contains':
            return {
                result: dist < (query.threshold || 1),
                description: `${query.a} ${dist < (query.threshold || 1) ? '包含' : '不包含'} ${query.b}`,
                provenance: [`[ALG_T2_R_013] contains=${dist < (query.threshold || 1)}`],
            };
        case 'adjacent':
            const adjacent = dist < (query.threshold || 5);
            return {
                result: adjacent,
                description: `${query.a} ${adjacent ? '相邻' : '不相邻'} ${query.b}`,
                provenance: [`[ALG_T2_R_013] adjacent=${adjacent}`],
            };
    }
}
// ============================================================================
// ALG_T2_R_014 · 元推理（关于推理的推理）
// ============================================================================
function metaReasoning(reasoningResult) {
    const contradictionPenalty = reasoningResult.contradictions * 0.2;
    const assumptionPenalty = reasoningResult.assumptions * 0.05;
    const stepBonus = Math.min(0.1, reasoningResult.steps * 0.01);
    const metaConfidence = Math.max(0, Math.min(1, reasoningResult.confidence - contradictionPenalty - assumptionPenalty + stepBonus));
    const quality = metaConfidence >= 0.8 ? 'high' : metaConfidence >= 0.5 ? 'medium' : 'low';
    const recommendations = [];
    if (reasoningResult.contradictions > 0)
        recommendations.push('resolve_contradictions');
    if (reasoningResult.assumptions > 3)
        recommendations.push('verify_assumptions');
    if (reasoningResult.steps > 20)
        recommendations.push('simplify_reasoning');
    if (reasoningResult.confidence < 0.5)
        recommendations.push('gather_more_evidence');
    return {
        metaConfidence,
        quality,
        recommendations,
        provenance: [`[ALG_T2_R_014] meta=${metaConfidence.toFixed(4)} quality=${quality} recs=${recommendations.length}`],
    };
}
// ============================================================================
// ALG_T2_R_015 · 推理链验证
// ============================================================================
function reasoningChainValidate(chain, axioms) {
    if (chain.length === 0) {
        return { valid: false, invalidSteps: [], coverage: 0, provenance: ['[ALG_T2_R_015] 空链'] };
    }
    const known = new Set(axioms);
    const invalidSteps = [];
    for (const step of chain) {
        if (step.type === 'premise') {
            known.add(step.content);
        }
        else {
            const depsValid = step.dependencies.every(dep => {
                const depStep = chain.find(s => s.content === dep);
                return known.has(dep) || (depStep && known.has(depStep.content));
            });
            if (depsValid) {
                known.add(step.content);
            }
            else {
                invalidSteps.push(step.id);
            }
        }
    }
    return {
        valid: invalidSteps.length === 0,
        invalidSteps,
        coverage: (chain.length - invalidSteps.length) / chain.length,
        provenance: [`[ALG_T2_R_015] chain=${chain.length} invalid=${invalidSteps.length} coverage=${((chain.length - invalidSteps.length) / chain.length).toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_R_016 · 推理路径搜索
// ============================================================================
function reasoningPathSearch(graph, start, goal, maxLength = 10) {
    if (!graph.nodes.includes(start) || !graph.nodes.includes(goal)) {
        return { path: [], rules: [], found: false, provenance: ['[ALG_T2_R_016] 节点不存在'] };
    }
    if (start === goal) {
        return { path: [start], rules: [], found: true, provenance: ['[ALG_T2_R_016] start=goal'] };
    }
    const visited = new Set([start]);
    function dfs(current, path, rules) {
        if (path.length > maxLength)
            return { path, rules, found: false };
        if (current === goal)
            return { path, rules, found: true };
        for (const edge of graph.edges) {
            if (edge.from === current && !visited.has(edge.to)) {
                visited.add(edge.to);
                const result = dfs(edge.to, [...path, edge.to], [...rules, edge.rule]);
                if (result.found)
                    return result;
            }
        }
        return { path, rules, found: false };
    }
    const result = dfs(start, [start], []);
    return {
        path: result.path,
        rules: result.rules,
        found: result.found,
        provenance: [`[ALG_T2_R_016] path=${result.path.length} found=${result.found}`],
    };
}
// ============================================================================
// ALG_T2_R_017 · 推理冲突解决
// ============================================================================
function reasoningConflictResolve(conflicts) {
    const diff = conflicts.evidence.supportsA - conflicts.evidence.supportsB;
    let winner;
    let confidence;
    if (Math.abs(diff) < 0.1) {
        winner = 'undetermined';
        confidence = 0.5;
    }
    else if (diff > 0) {
        winner = conflicts.claimA;
        confidence = Math.min(1, conflicts.evidence.supportsA);
    }
    else {
        winner = conflicts.claimB;
        confidence = Math.min(1, conflicts.evidence.supportsB);
    }
    const resolution = winner === 'undetermined'
        ? '证据不足，无法裁决'
        : `选择 ${winner}（证据强度: ${confidence.toFixed(2)}）`;
    return {
        resolution,
        winner,
        confidence,
        provenance: [`[ALG_T2_R_017] winner=${winner} conf=${confidence.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_R_018 · 假设生成
// ============================================================================
function hypothesisGenerate(observations, knowledgeBase) {
    if (observations.length === 0) {
        return { hypotheses: [], provenance: ['[ALG_T2_R_018] 空观察'] };
    }
    const hypotheses = [];
    for (const obs of observations) {
        const related = knowledgeBase.filter(k => k.related.includes(obs) || k.fact === obs);
        for (const r of related) {
            const supportingEvidence = r.related.filter(rel => observations.includes(rel));
            const plausibility = supportingEvidence.length / Math.max(r.related.length, 1);
            hypotheses.push({
                statement: r.fact,
                plausibility,
                supportingEvidence,
            });
        }
    }
    hypotheses.sort((a, b) => b.plausibility - a.plausibility);
    return {
        hypotheses,
        provenance: [`[ALG_T2_R_018] obs=${observations.length} hyp=${hypotheses.length}`],
    };
}
// ============================================================================
// ALG_T2_R_019 · 推理优化
// ============================================================================
function reasoningOptimize(chain) {
    if (chain.length === 0) {
        return { optimized: [], removed: 0, provenance: ['[ALG_T2_R_019] 空链'] };
    }
    const seen = new Set();
    const optimized = [];
    let removed = 0;
    for (const step of chain) {
        if (seen.has(step.content)) {
            removed++;
        }
        else {
            seen.add(step.content);
            optimized.push(step);
        }
    }
    const contentToId = new Map(optimized.map(s => [s.content, s.id]));
    for (const step of optimized) {
        step.dependencies = step.dependencies
            .map(dep => contentToId.get(dep) || dep)
            .filter((dep, i, arr) => arr.indexOf(dep) === i);
    }
    return {
        optimized,
        removed,
        provenance: [`[ALG_T2_R_019] original=${chain.length} optimized=${optimized.length} removed=${removed}`],
    };
}
// ============================================================================
// ALG_T2_R_020 · 推理综合评估
// ============================================================================
function reasoningComprehensiveAssessment(metrics) {
    const overall = metrics.validity * 0.3 +
        metrics.soundness * 0.25 +
        metrics.completeness * 0.2 +
        metrics.efficiency * 0.15 +
        metrics.clarity * 0.1;
    const grade = overall >= 0.9 ? 'A' : overall >= 0.8 ? 'B' : overall >= 0.7 ? 'C' : overall >= 0.6 ? 'D' : 'F';
    return {
        overall,
        grade,
        provenance: [`[ALG_T2_R_020] overall=${overall.toFixed(4)} grade=${grade}`],
    };
}
