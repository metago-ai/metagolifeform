"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 思想引擎封装类（ALG_T2_H_001~020）
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateIdeaGeneration = evaluateIdeaGeneration;
exports.analyzeIdeaAssociations = analyzeIdeaAssociations;
exports.traceIdeaEvolution = traceIdeaEvolution;
exports.combineIdeas = combineIdeas;
exports.detectIdeaDivergence = detectIdeaDivergence;
exports.rankIdeas = rankIdeas;
exports.filterIdeas = filterIdeas;
exports.mutateIdea = mutateIdea;
exports.crossoverIdeas = crossoverIdeas;
exports.selectEliteIdeas = selectEliteIdeas;
exports.assessIdeaDiversity = assessIdeaDiversity;
exports.detectIdeaConvergence = detectIdeaConvergence;
exports.identifyInspirationSource = identifyInspirationSource;
exports.assessIdeaImpactScope = assessIdeaImpactScope;
exports.analyzeIdeaFeasibility = analyzeIdeaFeasibility;
exports.assessIdeaNovelty = assessIdeaNovelty;
exports.planIdeaImplementation = planIdeaImplementation;
exports.assessIdeaRisk = assessIdeaRisk;
exports.integrateIdeaFeedback = integrateIdeaFeedback;
exports.comprehensiveIdeaAssessment = comprehensiveIdeaAssessment;
// ALG_T2_H_001 · 思想生成评估
function evaluateIdeaGeneration(idea, criteria) {
    const score = idea.novelty * criteria.novelty
        + idea.feasibility * criteria.feasibility
        + idea.impact * criteria.impact;
    const total = criteria.novelty + criteria.feasibility + criteria.impact;
    const normalized = total === 0 ? 0 : score / total;
    const grade = normalized >= 0.9 ? 'A' : normalized >= 0.7 ? 'B' : normalized >= 0.5 ? 'C' : 'D';
    return {
        score: normalized,
        grade,
        provenance: [`[ALG_T2_H_001] score=${normalized.toFixed(4)} grade=${grade}`],
    };
}
// ALG_T2_H_002 · 思想关联分析
function analyzeIdeaAssociations(ideas, similarityFn = (a, b) => {
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    let inter = 0;
    for (const w of setA)
        if (setB.has(w))
            inter++;
    const union = setA.size + setB.size - inter;
    return union === 0 ? 0 : inter / union;
}) {
    const edges = [];
    for (let i = 0; i < ideas.length; i++) {
        for (let j = i + 1; j < ideas.length; j++) {
            const sim = similarityFn(ideas[i].content, ideas[j].content);
            if (sim > 0.2) {
                edges.push({ from: ideas[i].id, to: ideas[j].id, strength: sim });
            }
        }
    }
    const clusters = clusterIdeas(ideas, edges);
    return {
        graph: { nodes: ideas, edges },
        clusters,
        provenance: [`[ALG_T2_H_002] nodes=${ideas.length} edges=${edges.length} clusters=${clusters.length}`],
    };
}
function clusterIdeas(ideas, edges) {
    const adj = new Map();
    for (const idea of ideas) {
        adj.set(idea.id, new Set());
    }
    for (const e of edges) {
        adj.get(e.from)?.add(e.to);
        adj.get(e.to)?.add(e.from);
    }
    const visited = new Set();
    const clusters = [];
    for (const idea of ideas) {
        if (visited.has(idea.id))
            continue;
        const cluster = [];
        const queue = [idea.id];
        visited.add(idea.id);
        while (queue.length > 0) {
            const cur = queue.shift();
            cluster.push(cur);
            for (const next of (adj.get(cur) || [])) {
                if (!visited.has(next)) {
                    visited.add(next);
                    queue.push(next);
                }
            }
        }
        clusters.push(cluster);
    }
    return clusters;
}
// ALG_T2_H_003 · 思想演化追踪
function traceIdeaEvolution(timeline) {
    const lineage = {};
    let maxDepth = 0;
    for (const entry of timeline) {
        if (entry.parent) {
            const parentLineage = lineage[entry.parent] || [entry.parent];
            lineage[entry.idea.id] = [...parentLineage, entry.idea.id];
            if (lineage[entry.idea.id].length > maxDepth) {
                maxDepth = lineage[entry.idea.id].length;
            }
        }
        else {
            lineage[entry.idea.id] = [entry.idea.id];
            if (maxDepth === 0)
                maxDepth = 1;
        }
    }
    return {
        lineage,
        depth: maxDepth,
        provenance: [`[ALG_T2_H_003] ideas=${timeline.length} depth=${maxDepth}`],
    };
}
// ALG_T2_H_004 · 思想组合
function combineIdeas(ideas, combinationStrategy = 'average') {
    if (ideas.length === 0) {
        return { combined: '', novelty: 0, feasibility: 0, impact: 0, provenance: ['[ALG_T2_H_004] 无思想'] };
    }
    const wordSets = ideas.map(i => new Set(i.content.toLowerCase().split(/\s+/)));
    let combinedWords = [];
    if (combinationStrategy === 'intersection') {
        combinedWords = [...wordSets[0]].filter(w => wordSets.every(s => s.has(w)));
    }
    else if (combinationStrategy === 'union') {
        const union = new Set();
        wordSets.forEach(s => s.forEach(w => union.add(w)));
        combinedWords = [...union];
    }
    else {
        const wordCount = {};
        wordSets.forEach(s => s.forEach(w => { wordCount[w] = (wordCount[w] || 0) + 1; }));
        const threshold = Math.ceil(ideas.length / 2);
        combinedWords = Object.entries(wordCount).filter(([, c]) => c >= threshold).map(([w]) => w);
    }
    const novelty = ideas.reduce((s, i) => s + i.novelty, 0) / ideas.length;
    const feasibility = ideas.reduce((s, i) => s + i.feasibility, 0) / ideas.length;
    const impact = ideas.reduce((s, i) => s + i.impact, 0) / ideas.length;
    return {
        combined: combinedWords.join(' '),
        novelty: Math.min(1, novelty * 1.1),
        feasibility,
        impact: Math.min(1, impact * 1.05),
        provenance: [`[ALG_T2_H_004] strategy=${combinationStrategy} words=${combinedWords.length} sources=${ideas.length}`],
    };
}
// ALG_T2_H_005 · 思想分歧检测
function detectIdeaDivergence(ideas, threshold = 0.3) {
    if (ideas.length < 2) {
        return { divergent: false, maxDivergence: 0, clusters: 1, provenance: ['[ALG_T2_H_005] 不足2个'] };
    }
    let maxDiv = 0;
    for (let i = 0; i < ideas.length; i++) {
        for (let j = i + 1; j < ideas.length; j++) {
            const div = Math.abs(ideas[i].novelty - ideas[j].novelty)
                + Math.abs(ideas[i].feasibility - ideas[j].feasibility)
                + Math.abs(ideas[i].impact - ideas[j].impact);
            if (div > maxDiv)
                maxDiv = div;
        }
    }
    const analysis = analyzeIdeaAssociations(ideas);
    return {
        divergent: maxDiv / 3 > threshold,
        maxDivergence: maxDiv / 3,
        clusters: analysis.clusters.length,
        provenance: [`[ALG_T2_H_005] divergent=${maxDiv / 3 > threshold} max=${(maxDiv / 3).toFixed(4)} clusters=${analysis.clusters.length}`],
    };
}
// ALG_T2_H_006 · 思想优先级排序
function rankIdeas(ideas, weights = { novelty: 0.3, feasibility: 0.3, impact: 0.4 }) {
    if (ideas.length === 0) {
        return { ranked: [], topIdea: null, provenance: ['[ALG_T2_H_006] 无思想'] };
    }
    const ranked = [...ideas].sort((a, b) => {
        const scoreA = a.novelty * weights.novelty + a.feasibility * weights.feasibility + a.impact * weights.impact;
        const scoreB = b.novelty * weights.novelty + b.feasibility * weights.feasibility + b.impact * weights.impact;
        return scoreB - scoreA;
    });
    return {
        ranked,
        topIdea: ranked[0].id,
        provenance: [`[ALG_T2_H_006] ranked=${ranked.length} top=${ranked[0].id}`],
    };
}
// ALG_T2_H_007 · 思想过滤
function filterIdeas(ideas, filters) {
    const kept = ideas.filter(i => {
        if (filters.minNovelty !== undefined && i.novelty < filters.minNovelty)
            return false;
        if (filters.minFeasibility !== undefined && i.feasibility < filters.minFeasibility)
            return false;
        if (filters.minImpact !== undefined && i.impact < filters.minImpact)
            return false;
        return true;
    });
    return {
        kept,
        removed: ideas.length - kept.length,
        provenance: [`[ALG_T2_H_007] kept=${kept.length} removed=${ideas.length - kept.length}`],
    };
}
// ALG_T2_H_008 · 思想变异
function mutateIdea(idea, mutationRate = 0.1) {
    const changes = [];
    const mutated = { ...idea };
    if (Math.random() < mutationRate) {
        mutated.novelty = Math.min(1, Math.max(0, idea.novelty + (Math.random() - 0.5) * 0.2));
        changes.push('novelty');
    }
    if (Math.random() < mutationRate) {
        mutated.feasibility = Math.min(1, Math.max(0, idea.feasibility + (Math.random() - 0.5) * 0.2));
        changes.push('feasibility');
    }
    if (Math.random() < mutationRate) {
        mutated.impact = Math.min(1, Math.max(0, idea.impact + (Math.random() - 0.5) * 0.2));
        changes.push('impact');
    }
    if (changes.length === 0) {
        changes.push('unchanged');
    }
    return {
        mutated,
        changes,
        provenance: [`[ALG_T2_H_008] rate=${mutationRate} changes=${changes.join(',')}`],
    };
}
// ALG_T2_H_009 · 思想交叉
function crossoverIdeas(parent1, parent2) {
    const offspring1 = {
        id: `${parent1.id}x${parent2.id}-1`,
        content: `${parent1.content} ${parent2.content}`.substring(0, 200),
        novelty: (parent1.novelty + parent2.novelty) / 2,
        feasibility: Math.max(parent1.feasibility, parent2.feasibility),
        impact: (parent1.impact + parent2.impact) / 2,
    };
    const offspring2 = {
        id: `${parent1.id}x${parent2.id}-2`,
        content: `${parent2.content} ${parent1.content}`.substring(0, 200),
        novelty: Math.max(parent1.novelty, parent2.novelty),
        feasibility: (parent1.feasibility + parent2.feasibility) / 2,
        impact: Math.min(parent1.impact, parent2.impact),
    };
    return {
        offspring: [offspring1, offspring2],
        provenance: [`[ALG_T2_H_009] parents=${parent1.id}+${parent2.id} offspring=2`],
    };
}
// ALG_T2_H_010 · 思想精选
function selectEliteIdeas(ideas, eliteRatio = 0.2) {
    if (ideas.length === 0) {
        return { elite: [], threshold: 0, provenance: ['[ALG_T2_H_010] 无思想'] };
    }
    const ranked = rankIdeas(ideas);
    const eliteCount = Math.max(1, Math.floor(ideas.length * eliteRatio));
    const elite = ranked.ranked.slice(0, eliteCount);
    const threshold = elite.length > 0
        ? elite[elite.length - 1].novelty * 0.3 + elite[elite.length - 1].feasibility * 0.3 + elite[elite.length - 1].impact * 0.4
        : 0;
    return {
        elite,
        threshold,
        provenance: [`[ALG_T2_H_010] elite=${elite.length}/${ideas.length} threshold=${threshold.toFixed(4)}`],
    };
}
// ALG_T2_H_011 · 思想多样性评估
function assessIdeaDiversity(ideas) {
    if (ideas.length === 0) {
        return { diversity: 0, uniqueNovelty: 0, uniqueFeasibility: 0, provenance: ['[ALG_T2_H_011] 无思想'] };
    }
    const noveltySet = new Set(ideas.map(i => Math.floor(i.novelty * 10)));
    const feasibilitySet = new Set(ideas.map(i => Math.floor(i.feasibility * 10)));
    const impactSet = new Set(ideas.map(i => Math.floor(i.impact * 10)));
    const diversity = (noveltySet.size + feasibilitySet.size + impactSet.size) / 30;
    return {
        diversity,
        uniqueNovelty: noveltySet.size / 10,
        uniqueFeasibility: feasibilitySet.size / 10,
        provenance: [`[ALG_T2_H_011] diversity=${diversity.toFixed(4)} novelty=${noveltySet.size} feasibility=${feasibilitySet.size}`],
    };
}
// ALG_T2_H_012 · 思想收敛检测
function detectIdeaConvergence(history, threshold = 0.01) {
    if (history.length < 3) {
        return { converged: false, rate: 0, provenance: ['[ALG_T2_H_012] 数据不足'] };
    }
    let rateSum = 0;
    let count = 0;
    for (let i = 1; i < history.length; i++) {
        const diff = Math.abs(history[i].avgScore - history[i - 1].avgScore);
        rateSum += diff;
        count++;
    }
    const rate = count === 0 ? 0 : rateSum / count;
    return {
        converged: rate < threshold,
        rate,
        provenance: [`[ALG_T2_H_012] converged=${rate < threshold} rate=${rate.toFixed(6)} threshold=${threshold}`],
    };
}
// ALG_T2_H_013 · 思想灵感来源
function identifyInspirationSource(idea, sources) {
    if (sources.length === 0) {
        return { source: null, similarity: 0, provenance: ['[ALG_T2_H_013] 无来源'] };
    }
    let best = null;
    let bestSim = -1;
    const ideaWords = new Set(idea.content.toLowerCase().split(/\s+/));
    for (const src of sources) {
        const srcWords = new Set(src.content.toLowerCase().split(/\s+/));
        let inter = 0;
        for (const w of ideaWords)
            if (srcWords.has(w))
                inter++;
        const union = ideaWords.size + srcWords.size - inter;
        const sim = union === 0 ? 0 : inter / union;
        const combined = sim * 0.7 + (1 - Math.abs(idea.novelty - src.novelty)) * 0.3;
        if (combined > bestSim) {
            bestSim = combined;
            best = src.id;
        }
    }
    return {
        source: best,
        similarity: bestSim === -1 ? 0 : bestSim,
        provenance: [`[ALG_T2_H_013] source=${best} sim=${bestSim.toFixed(4)}`],
    };
}
// ALG_T2_H_014 · 思想影响范围
function assessIdeaImpactScope(idea, domains) {
    let totalImpact = 0;
    let primary = null;
    let maxImpact = 0;
    for (const d of domains) {
        const impact = idea.impact * d.relevance;
        totalImpact += impact;
        if (impact > maxImpact) {
            maxImpact = impact;
            primary = d.name;
        }
    }
    return {
        totalImpact: domains.length === 0 ? 0 : totalImpact / domains.length,
        primaryDomain: primary,
        provenance: [`[ALG_T2_H_014] total=${totalImpact.toFixed(4)} primary=${primary}`],
    };
}
// ALG_T2_H_015 · 思想可行性分析
function analyzeIdeaFeasibility(idea, constraints) {
    const resourceFeas = idea.feasibility * constraints.resources;
    const techFeas = idea.feasibility * constraints.technology;
    const timeFeas = idea.feasibility * constraints.time;
    const overall = (resourceFeas + techFeas + timeFeas) / 3;
    let bottleneck;
    const min = Math.min(resourceFeas, techFeas, timeFeas);
    if (min === resourceFeas)
        bottleneck = 'resources';
    else if (min === techFeas)
        bottleneck = 'technology';
    else
        bottleneck = 'time';
    return {
        feasibility: overall,
        bottleneck,
        provenance: [`[ALG_T2_H_015] feas=${overall.toFixed(4)} bottleneck=${bottleneck}`],
    };
}
// ALG_T2_H_016 · 思想新颖性评估
function assessIdeaNovelty(idea, existing) {
    if (existing.length === 0) {
        return { noveltyScore: 1, isNovel: true, similarCount: 0, provenance: ['[ALG_T2_H_016] 无已有思想'] };
    }
    const ideaWords = new Set(idea.content.toLowerCase().split(/\s+/));
    let similarCount = 0;
    let maxSim = 0;
    for (const ex of existing) {
        const exWords = new Set(ex.content.toLowerCase().split(/\s+/));
        let inter = 0;
        for (const w of ideaWords)
            if (exWords.has(w))
                inter++;
        const union = ideaWords.size + exWords.size - inter;
        const sim = union === 0 ? 0 : inter / union;
        if (sim > 0.3)
            similarCount++;
        if (sim > maxSim)
            maxSim = sim;
    }
    const noveltyScore = 1 - maxSim;
    return {
        noveltyScore,
        isNovel: noveltyScore > 0.5,
        similarCount,
        provenance: [`[ALG_T2_H_016] novelty=${noveltyScore.toFixed(4)} isNovel=${noveltyScore > 0.5} similar=${similarCount}`],
    };
}
// ALG_T2_H_017 · 思想实现路径
function planIdeaImplementation(idea, phases) {
    if (phases.length === 0) {
        return { plan: [], totalDifficulty: 0, estimatedDuration: 0, provenance: ['[ALG_T2_H_017] 无阶段'] };
    }
    const plan = phases.map(p => `${p.name} (difficulty=${p.difficulty}, duration=${p.duration})`);
    const totalDifficulty = phases.reduce((s, p) => s + p.difficulty, 0) / idea.feasibility;
    const estimatedDuration = phases.reduce((s, p) => s + p.duration, 0) / Math.max(0.1, idea.feasibility);
    return {
        plan,
        totalDifficulty,
        estimatedDuration,
        provenance: [`[ALG_T2_H_017] phases=${phases.length} difficulty=${totalDifficulty.toFixed(4)} duration=${estimatedDuration.toFixed(0)}`],
    };
}
// ALG_T2_H_018 · 思想风险评估
function assessIdeaRisk(idea, riskFactors) {
    let totalRisk = 0;
    const highRiskFactors = [];
    for (const f of riskFactors) {
        const risk = f.severity * f.probability * (1 - idea.feasibility);
        totalRisk += risk;
        if (risk > 0.3)
            highRiskFactors.push(f.name);
    }
    return {
        totalRisk: riskFactors.length === 0 ? 0 : totalRisk / riskFactors.length,
        highRiskFactors,
        provenance: [`[ALG_T2_H_018] risk=${totalRisk.toFixed(4)} high=${highRiskFactors.length}`],
    };
}
// ALG_T2_H_019 · 思想反馈整合
function integrateIdeaFeedback(idea, feedback) {
    if (feedback.length === 0) {
        return { adjustedIdea: idea, confidence: 0.5, provenance: ['[ALG_T2_H_019] 无反馈'] };
    }
    const avgRating = feedback.reduce((s, f) => s + f.rating, 0) / feedback.length;
    const adjustment = (avgRating - 0.5) * 0.2;
    const adjustedIdea = {
        ...idea,
        novelty: Math.min(1, Math.max(0, idea.novelty + adjustment)),
        feasibility: Math.min(1, Math.max(0, idea.feasibility + adjustment)),
        impact: Math.min(1, Math.max(0, idea.impact + adjustment)),
    };
    const variance = feedback.reduce((s, f) => s + (f.rating - avgRating) ** 2, 0) / feedback.length;
    const confidence = Math.max(0, 1 - Math.sqrt(variance));
    return {
        adjustedIdea,
        confidence,
        provenance: [`[ALG_T2_H_019] avgRating=${avgRating.toFixed(4)} conf=${confidence.toFixed(4)} feedback=${feedback.length}`],
    };
}
// ALG_T2_H_020 · 综合思想评估
function comprehensiveIdeaAssessment(idea, context) {
    const novelty = assessIdeaNovelty(idea, context.existing);
    const feasibility = analyzeIdeaFeasibility(idea, context.constraints);
    const overall = (novelty.noveltyScore * 0.3 + feasibility.feasibility * 0.4 + idea.impact * 0.3);
    let recommendation;
    if (overall > 0.7)
        recommendation = 'pursue-immediately';
    else if (overall > 0.5)
        recommendation = 'pursue-with-caution';
    else if (overall > 0.3)
        recommendation = 'shelve-for-review';
    else
        recommendation = 'reject';
    return {
        overallScore: overall,
        novelty: novelty.noveltyScore,
        feasibility: feasibility.feasibility,
        impact: idea.impact,
        recommendation,
        provenance: [`[ALG_T2_H_020] overall=${overall.toFixed(4)} rec=${recommendation} novelty=${novelty.noveltyScore.toFixed(4)}`],
    };
}
