"use strict";
/**
 * MetaGO Engine - A5 T1 算法 · 元创造类（第二批）
 *
 * 对应公理：A5 内生公理 / A35 创造进化律 / D40 全息创造性
 * 对应文档：附录A·T1·CREATION（ALG_T1_M_001 ~ ALG_T1_M_015）
 *
 * 算法清单（15 个）：
 *   001 新颖思想生成    002 约束对齐        003 新颖度评分
 *   004 创造触发        005 创造原语        006 创造完整性检查
 *   007 历史负熵        008 创造治理        009 发散生成
 *   010 收敛精炼        011 创造变异        012 创造重组
 *   013 创造选择        014 创造适应度      015 创造谱系
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNovelIdea = generateNovelIdea;
exports.constraintAlignment = constraintAlignment;
exports.noveltyScore = noveltyScore;
exports.creationTrigger = creationTrigger;
exports.creationPrimitive = creationPrimitive;
exports.creationIntegrityCheck = creationIntegrityCheck;
exports.historyNegentropy = historyNegentropy;
exports.creationGovernor = creationGovernor;
exports.divergentGeneration = divergentGeneration;
exports.convergentRefinement = convergentRefinement;
exports.creationMutation = creationMutation;
exports.creationRecombination = creationRecombination;
exports.creationSelection = creationSelection;
exports.creationFitness = creationFitness;
exports.creationLineage = creationLineage;
// ============================================================================
// T1·ALG_T1_M_001 · 新颖思想生成（A5 内生公理）
// ============================================================================
function generateNovelIdea(seedFeatures, corpus, mutationScale = 1.0, rng = Math.random) {
    if (seedFeatures.length === 0) {
        return { idea: [], distance: 0, provenance: ['[ALG_T1_M_001] 空种子'] };
    }
    // 在种子基础上施加随机扰动，并尽量远离已有语料
    let bestIdea = seedFeatures.map(v => v + (rng() - 0.5) * 2 * mutationScale);
    let maxDist = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = seedFeatures.map(v => v + (rng() - 0.5) * 2 * mutationScale);
        // 计算到语料的最小距离（越远越新颖）
        let minDist = Infinity;
        for (const existing of corpus) {
            if (existing.length !== candidate.length)
                continue;
            let d = 0;
            for (let i = 0; i < candidate.length; i++)
                d += (candidate[i] - existing[i]) ** 2;
            d = Math.sqrt(d);
            if (d < minDist)
                minDist = d;
        }
        if (minDist === Infinity)
            minDist = 0;
        if (minDist > maxDist) {
            maxDist = minDist;
            bestIdea = candidate;
        }
    }
    return {
        idea: bestIdea,
        distance: maxDist,
        provenance: [`[ALG_T1_M_001] dim=${bestIdea.length} dist=${maxDist.toFixed(4)} scale=${mutationScale}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_002 · 约束对齐
// ============================================================================
function constraintAlignment(idea, constraints) {
    if (idea.length === 0) {
        return { aligned: [], violations: 0, satisfied: 0, provenance: ['[ALG_T1_M_002] 空想法'] };
    }
    let violations = 0;
    let satisfied = 0;
    const aligned = idea.map((v, i) => {
        let newVal = v;
        for (const c of constraints) {
            if (i < c.min.length && v < c.min[i]) {
                newVal = c.min[i];
                violations++;
            }
            else if (i < c.max.length && v > c.max[i]) {
                newVal = c.max[i];
                violations++;
            }
            else {
                satisfied++;
            }
        }
        return newVal;
    });
    return {
        aligned,
        violations,
        satisfied,
        provenance: [`[ALG_T1_M_002] dim=${idea.length} violations=${violations} satisfied=${satisfied}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_003 · 新颖度评分
// ============================================================================
function noveltyScore(idea, corpus) {
    if (idea.length === 0 || corpus.length === 0) {
        return { score: 1, nearestDistance: Infinity, provenance: ['[ALG_T1_M_003] 空输入'] };
    }
    let minDist = Infinity;
    for (const existing of corpus) {
        if (existing.length !== idea.length)
            continue;
        let d = 0;
        for (let i = 0; i < idea.length; i++)
            d += (idea[i] - existing[i]) ** 2;
        d = Math.sqrt(d);
        if (d < minDist)
            minDist = d;
    }
    // 新颖度 = 1 / (1 + nearestDistance)
    const score = 1 / (1 + (minDist === Infinity ? 0 : minDist));
    return {
        score,
        nearestDistance: minDist,
        provenance: [`[ALG_T1_M_003] score=${score.toFixed(4)} nearest=${minDist === Infinity ? 'N/A' : minDist.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_004 · 创造触发
// ============================================================================
function creationTrigger(context, thresholds) {
    const reasons = [];
    const cooldownOk = (context.now - context.lastCreation) >= thresholds.cooldownMs;
    if (!cooldownOk)
        reasons.push('cooldown 未满');
    // 完整性 >= 98% 转入低频深潜（不触发主动创造）；< 98% 高频激活
    if (context.integrity >= thresholds.integrityHigh) {
        reasons.push(`integrity=${context.integrity.toFixed(2)} >= ${thresholds.integrityHigh} 低频深潜`);
    }
    if (context.gap >= thresholds.gapMin)
        reasons.push(`gap=${context.gap.toFixed(4)} 触发`);
    if (context.pressure >= thresholds.pressureMin)
        reasons.push(`pressure=${context.pressure.toFixed(4)} 触发`);
    const triggered = cooldownOk && (context.integrity < thresholds.integrityHigh) &&
        (context.gap >= thresholds.gapMin || context.pressure >= thresholds.pressureMin);
    return {
        triggered,
        reasons,
        provenance: [`[ALG_T1_M_004] triggered=${triggered} reasons=${reasons.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_005 · 创造原语
// ============================================================================
function creationPrimitive(type, inputs) {
    if (inputs.length === 0 || inputs[0].length === 0) {
        return { result: [], primitiveType: type, provenance: ['[ALG_T1_M_005] 空输入'] };
    }
    const dim = inputs[0].length;
    let result;
    switch (type) {
        case 'combine':
            result = new Array(dim).fill(0);
            for (const inp of inputs)
                for (let i = 0; i < dim && i < inp.length; i++)
                    result[i] += inp[i];
            result = result.map(v => v / inputs.length);
            break;
        case 'invert':
            result = inputs[0].map(v => -v);
            break;
        case 'extrapolate':
            if (inputs.length < 2) {
                result = [...inputs[0]];
            }
            else {
                result = inputs[0].map((v, i) => v + (inputs[inputs.length - 1][i] - v));
            }
            break;
        case 'abstract':
            const mean = inputs[0].map((_, i) => inputs.reduce((s, inp) => s + (inp[i] ?? 0), 0) / inputs.length);
            result = inputs[0].map((v, i) => v - mean[i]);
            break;
        default:
            result = [...inputs[0]];
    }
    return {
        result,
        primitiveType: type,
        provenance: [`[ALG_T1_M_005] type=${type} dim=${result.length} inputs=${inputs.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_006 · 创造完整性检查
// ============================================================================
function creationIntegrityCheck(idea, requiredDimensions, constraints) {
    const missing = Math.max(0, requiredDimensions - idea.length);
    let outOfRange = 0;
    if (constraints) {
        for (const v of idea) {
            if (v < constraints.min || v > constraints.max)
                outOfRange++;
        }
    }
    const total = requiredDimensions + idea.length;
    const issues = missing + outOfRange;
    const integrity = total === 0 ? 1 : 1 - issues / total;
    return {
        complete: missing === 0 && outOfRange === 0,
        missing,
        outOfRange,
        integrity,
        provenance: [`[ALG_T1_M_006] missing=${missing} oor=${outOfRange} integrity=${integrity.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_007 · 历史负熵
// ============================================================================
function historyNegentropy(history) {
    if (history.length === 0) {
        return { negentropy: 0, trend: 0, provenance: ['[ALG_T1_M_007] 空历史'] };
    }
    // 计算每代的熵，负熵 = -熵，趋势 = 熵的变化
    const entropies = history.map(gen => {
        if (gen.length === 0)
            return 0;
        const sum = gen.reduce((s, x) => s + Math.abs(x), 0);
        if (sum === 0)
            return 0;
        const probs = gen.map(x => Math.abs(x) / sum);
        return -probs.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
    });
    const avgEntropy = entropies.reduce((s, e) => s + e, 0) / entropies.length;
    const negentropy = -avgEntropy;
    // 趋势：线性回归
    const n = entropies.length;
    let num = 0, den = 0;
    const meanX = (n - 1) / 2;
    const meanY = avgEntropy;
    for (let i = 0; i < n; i++) {
        num += (i - meanX) * (entropies[i] - meanY);
        den += (i - meanX) ** 2;
    }
    const trend = den === 0 ? 0 : num / den;
    return {
        negentropy,
        trend,
        provenance: [`[ALG_T1_M_007] negent=${negentropy.toFixed(4)} trend=${trend.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_008 · 创造治理
// ============================================================================
function creationGovernor(proposal, policy) {
    const reasons = [];
    if (proposal.risk > policy.maxRisk)
        reasons.push(`risk=${proposal.risk.toFixed(4)} > ${policy.maxRisk}`);
    if (proposal.value < policy.minValue)
        reasons.push(`value=${proposal.value.toFixed(4)} < ${policy.minValue}`);
    if (proposal.novelty < policy.minNovelty)
        reasons.push(`novelty=${proposal.novelty.toFixed(4)} < ${policy.minNovelty}`);
    const approved = reasons.length === 0;
    return {
        approved,
        reasons,
        provenance: [`[ALG_T1_M_008] approved=${approved} reasons=${reasons.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_009 · 发散生成
// ============================================================================
function divergentGeneration(seed, count, spread = 1.0, rng = Math.random) {
    if (seed.length === 0 || count <= 0) {
        return { ideas: [], spread: 0, provenance: ['[ALG_T1_M_009] 空种子或数量'] };
    }
    const ideas = [];
    for (let i = 0; i < count; i++) {
        ideas.push(seed.map(v => v + (rng() - 0.5) * 2 * spread));
    }
    // 实际 spread = 平均标准差
    let avgStd = 0;
    for (let d = 0; d < seed.length; d++) {
        const col = ideas.map(idea => idea[d]);
        const mean = col.reduce((s, x) => s + x, 0) / col.length;
        const variance = col.reduce((s, x) => s + (x - mean) ** 2, 0) / col.length;
        avgStd += Math.sqrt(variance);
    }
    avgStd = seed.length > 0 ? avgStd / seed.length : 0;
    return {
        ideas,
        spread: avgStd,
        provenance: [`[ALG_T1_M_009] count=${ideas.length} dim=${seed.length} spread=${avgStd.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_010 · 收敛精炼
// ============================================================================
function convergentRefinement(ideas, objective, iterations = 5) {
    if (ideas.length === 0 || objective.length === 0) {
        return { refined: [], convergence: 0, provenance: ['[ALG_T1_M_010] 空输入'] };
    }
    let centroid = ideas[0].map((_, i) => ideas.reduce((s, idea) => s + (idea[i] ?? 0), 0) / ideas.length);
    let prevDist = Infinity;
    for (let iter = 0; iter < iterations; iter++) {
        // 朝目标移动
        centroid = centroid.map((v, i) => v + (objective[i] - v) * 0.5);
        const dist = Math.sqrt(centroid.reduce((s, v, i) => s + (v - objective[i]) ** 2, 0));
        if (Math.abs(prevDist - dist) < 1e-9)
            break;
        prevDist = dist;
    }
    const convergence = 1 / (1 + prevDist);
    return {
        refined: centroid,
        convergence,
        provenance: [`[ALG_T1_M_010] iter=${iterations} conv=${convergence.toFixed(4)} dist=${prevDist.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_011 · 创造变异
// ============================================================================
function creationMutation(idea, mutationType, rate = 0.1, magnitude = 0.5, rng = Math.random) {
    if (idea.length === 0) {
        return { mutated: [], mutationCount: 0, provenance: ['[ALG_T1_M_011] 空想法'] };
    }
    let mutationCount = 0;
    const mutated = idea.map(v => {
        if (rng() < rate) {
            mutationCount++;
            switch (mutationType) {
                case 'gaussian':
                    // Box-Muller 近似
                    const u1 = rng() || 1e-10;
                    const u2 = rng();
                    return v + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * magnitude;
                case 'uniform':
                    return v + (rng() - 0.5) * 2 * magnitude;
                case 'boundary':
                    return rng() < 0.5 ? v - magnitude : v + magnitude;
                default:
                    return v;
            }
        }
        return v;
    });
    return {
        mutated,
        mutationCount,
        provenance: [`[ALG_T1_M_011] type=${mutationType} mut=${mutationCount}/${idea.length} mag=${magnitude}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_012 · 创造重组
// ============================================================================
function creationRecombination(parentA, parentB, strategy = 'single-point', rng = Math.random) {
    if (parentA.length !== parentB.length || parentA.length === 0) {
        return { offspring: [], points: [], provenance: ['[ALG_T1_M_012] 维度不匹配'] };
    }
    const n = parentA.length;
    const offspring = new Array(n);
    const points = [];
    switch (strategy) {
        case 'single-point':
            const p1 = Math.floor(rng() * n);
            points.push(p1);
            for (let i = 0; i < n; i++)
                offspring[i] = i < p1 ? parentA[i] : parentB[i];
            break;
        case 'two-point':
            const a = Math.floor(rng() * n);
            const b = Math.floor(rng() * n);
            const p2 = Math.min(a, b);
            const p3 = Math.max(a, b);
            points.push(p2, p3);
            for (let i = 0; i < n; i++)
                offspring[i] = (i >= p2 && i < p3) ? parentB[i] : parentA[i];
            break;
        case 'uniform':
            for (let i = 0; i < n; i++) {
                offspring[i] = rng() < 0.5 ? parentA[i] : parentB[i];
                if (offspring[i] === parentB[i])
                    points.push(i);
            }
            break;
    }
    return {
        offspring,
        points,
        provenance: [`[ALG_T1_M_012] strategy=${strategy} dim=${n} points=${points.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_013 · 创造选择
// ============================================================================
function creationSelection(candidates, criteria, feasibilityFn = () => 0.5, impactFn = () => 0.5) {
    if (candidates.length === 0) {
        return { selected: null, scores: [], provenance: ['[ALG_T1_M_013] 空候选'] };
    }
    const scores = candidates.map(idea => {
        const score = idea.novelty * criteria.noveltyWeight +
            feasibilityFn(idea) * criteria.feasibilityWeight +
            impactFn(idea) * criteria.impactWeight;
        return { id: idea.id, score };
    });
    scores.sort((a, b) => b.score - a.score);
    const selected = candidates.find(c => c.id === scores[0].id) ?? null;
    return {
        selected,
        scores,
        provenance: [`[ALG_T1_M_013] candidates=${candidates.length} topScore=${scores[0]?.score.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_014 · 创造适应度
// ============================================================================
function creationFitness(idea, objectives) {
    const noveltyScore = 1 - Math.abs(idea.novelty - objectives.novelty);
    const feasibilityScore = objectives.feasibility;
    const impactScore = objectives.impact;
    const coherenceScore = objectives.coherence;
    const fitness = (noveltyScore + feasibilityScore + impactScore + coherenceScore) / 4;
    return {
        fitness,
        breakdown: { novelty: noveltyScore, feasibility: feasibilityScore, impact: impactScore, coherence: coherenceScore },
        provenance: [`[ALG_T1_M_014] fitness=${fitness.toFixed(4)} nov=${noveltyScore.toFixed(2)}`],
    };
}
// ============================================================================
// T1·ALG_T1_M_015 · 创造谱系
// ============================================================================
function creationLineage(creations) {
    if (creations.length === 0) {
        return { tree: new Map(), generations: 0, bestChain: [], provenance: ['[ALG_T1_M_015] 空创造'] };
    }
    const tree = new Map();
    for (const c of creations) {
        const children = tree.get(c.parentId) ?? [];
        children.push(c.id);
        tree.set(c.parentId, children);
    }
    const generations = Math.max(...creations.map(c => c.generation)) + 1;
    // 找到 fitness 最高的叶节点，回溯到根
    let best = creations[0];
    for (const c of creations)
        if (c.fitness > best.fitness)
            best = c;
    const bestChain = [best.id];
    let current = best;
    while (current.parentId !== null) {
        bestChain.unshift(current.parentId);
        const parent = creations.find(c => c.id === current.parentId);
        if (!parent)
            break;
        current = parent;
    }
    return {
        tree,
        generations,
        bestChain,
        provenance: [`[ALG_T1_M_015] total=${creations.length} gens=${generations} chainLen=${bestChain.length}`],
    };
}
