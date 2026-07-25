"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 元创造引擎封装类（ALG_T2_M_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 101~120 项（元创造引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 meta-create engine 的私有辅助方法
 *   - 处理 0→1 创造原语、约束对齐、完整性校验、创造触发
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.creationTriggerEvaluate = creationTriggerEvaluate;
exports.creationPrimitiveSynthesize = creationPrimitiveSynthesize;
exports.creationConstraintAlign = creationConstraintAlign;
exports.creationIntegrityCheck = creationIntegrityCheck;
exports.creationNoveltyAssess = creationNoveltyAssess;
exports.creationUtilityAssess = creationUtilityAssess;
exports.creationFeasibility = creationFeasibility;
exports.creationIterateOptimize = creationIterateOptimize;
exports.creationPathSelect = creationPathSelect;
exports.creationRiskAssess = creationRiskAssess;
exports.creationProvenance = creationProvenance;
exports.creationImpactAssess = creationImpactAssess;
exports.creationSynergize = creationSynergize;
exports.creationDecayMonitor = creationDecayMonitor;
exports.creationEvolutionTrace = creationEvolutionTrace;
exports.creationValidationTest = creationValidationTest;
exports.creationOptimizationDirection = creationOptimizationDirection;
exports.creationCombinatorialControl = creationCombinatorialControl;
exports.creationQualityGrade = creationQualityGrade;
exports.creationComprehensiveAssessment = creationComprehensiveAssessment;
// ============================================================================
// ALG_T2_M_001 · 创造触发评估
// ============================================================================
function creationTriggerEvaluate(triggers) {
    if (triggers.length === 0) {
        return { shouldTrigger: false, matchedTriggers: [], readiness: 0, provenance: ['[ALG_T2_M_001] 无触发器'] };
    }
    const matched = triggers.filter(t => t.current >= t.threshold);
    const readiness = triggers.reduce((s, t) => s + Math.min(1, t.current / t.threshold), 0) / triggers.length;
    return {
        shouldTrigger: matched.length > 0,
        matchedTriggers: matched.map(t => t.condition),
        readiness,
        provenance: [`[ALG_T2_M_001] triggers=${triggers.length} matched=${matched.length} readiness=${readiness.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_M_002 · 创造原语合成
// ============================================================================
function creationPrimitiveSynthesize(seeds, constraints) {
    if (seeds.length === 0) {
        return { primitives: [], noveltyScore: 0, provenance: ['[ALG_T2_M_002] 无种子'] };
    }
    const primitives = [];
    for (let i = 0; i < seeds.length; i++) {
        for (let j = i + 1; j < seeds.length; j++) {
            const content = `${seeds[i]}×${seeds[j]}`;
            const novelty = 0.5 + Math.random() * 0.5;
            primitives.push({
                type: 'concept',
                content,
                novelty,
            });
        }
    }
    // 应用约束过滤
    const filtered = primitives.filter(p => constraints.every(c => {
        try {
            return c.constraint(p.content);
        }
        catch {
            return true;
        }
    }));
    const noveltyScore = filtered.length > 0 ? filtered.reduce((s, p) => s + p.novelty, 0) / filtered.length : 0;
    return {
        primitives: filtered,
        noveltyScore,
        provenance: [`[ALG_T2_M_002] seeds=${seeds.length} primitives=${filtered.length} novelty=${noveltyScore.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_M_003 · 创造约束对齐
// ============================================================================
function creationConstraintAlign(output, constraints) {
    if (constraints.length === 0) {
        return { aligned: true, violations: [], alignmentScore: 1, provenance: ['[ALG_T2_M_003] 无约束'] };
    }
    const violations = [];
    let totalWeight = 0;
    let satisfiedWeight = 0;
    for (const c of constraints) {
        let satisfied = false;
        try {
            satisfied = c.constraint(output);
        }
        catch {
            satisfied = false;
        }
        totalWeight += c.weight;
        if (satisfied)
            satisfiedWeight += c.weight;
        else
            violations.push(c.name);
    }
    const alignmentScore = totalWeight === 0 ? 0 : satisfiedWeight / totalWeight;
    return {
        aligned: violations.length === 0,
        violations,
        alignmentScore,
        provenance: [`[ALG_T2_M_003] constraints=${constraints.length} violations=${violations.length} score=${alignmentScore.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_M_004 · 创造完整性校验
// ============================================================================
function creationIntegrityCheck(creation) {
    const missingComponents = [];
    const orphanRelations = [];
    const componentSet = new Set(creation.components);
    for (const [a, b] of creation.relations) {
        if (!componentSet.has(a))
            missingComponents.push(a);
        if (!componentSet.has(b))
            missingComponents.push(b);
        if (!componentSet.has(a) || !componentSet.has(b))
            orphanRelations.push([a, b]);
    }
    const complete = missingComponents.length === 0 && orphanRelations.length === 0;
    return {
        complete,
        missingComponents: [...new Set(missingComponents)],
        orphanRelations,
        provenance: [`[ALG_T2_M_004] components=${creation.components.length} missing=${missingComponents.length} orphan=${orphanRelations.length}`],
    };
}
// ============================================================================
// ALG_T2_M_005 · 创造新颖性评估
// ============================================================================
function creationNoveltyAssess(creation, knownCreations) {
    if (knownCreations.length === 0) {
        return { novelty: 1, similarityToKnown: 0, isNovel: true, provenance: ['[ALG_T2_M_005] 无已知创造'] };
    }
    let maxSim = 0;
    for (const known of knownCreations) {
        const sim = stringSimilarity(creation, known);
        if (sim > maxSim)
            maxSim = sim;
    }
    const novelty = 1 - maxSim;
    return {
        novelty,
        similarityToKnown: maxSim,
        isNovel: novelty > 0.7,
        provenance: [`[ALG_T2_M_005] novelty=${novelty.toFixed(4)} sim=${maxSim.toFixed(4)} isNovel=${novelty > 0.7}`],
    };
}
function stringSimilarity(a, b) {
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    let intersection = 0;
    for (const w of setA)
        if (setB.has(w))
            intersection++;
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}
// ============================================================================
// ALG_T2_M_006 · 创造效用评估
// ============================================================================
function creationUtilityAssess(creation, needs) {
    if (needs.length === 0) {
        return { utility: 0, matchedNeeds: [], unmatchedNeeds: [], provenance: ['[ALG_T2_M_006] 无需求'] };
    }
    const matched = needs.filter(n => creation.capabilities.includes(n));
    const unmatched = needs.filter(n => !creation.capabilities.includes(n));
    const utility = matched.length / needs.length;
    return {
        utility,
        matchedNeeds: matched,
        unmatchedNeeds: unmatched,
        provenance: [`[ALG_T2_M_006] needs=${needs.length} matched=${matched.length} utility=${utility.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_M_007 · 创造可实施性
// ============================================================================
function creationFeasibility(creation, available) {
    const bottlenecks = [];
    const resourceFit = available.resources >= creation.resourceReq ? 1 : available.resources / creation.resourceReq;
    const timeFit = available.time >= creation.timeReq ? 1 : available.time / creation.timeReq;
    const expertiseFit = available.expertise >= creation.complexity ? 1 : available.expertise / creation.complexity;
    if (resourceFit < 1)
        bottlenecks.push('resources');
    if (timeFit < 1)
        bottlenecks.push('time');
    if (expertiseFit < 1)
        bottlenecks.push('expertise');
    const feasibilityScore = resourceFit * timeFit * expertiseFit;
    return {
        feasible: feasibilityScore >= 0.7,
        feasibilityScore,
        bottlenecks,
        provenance: [`[ALG_T2_M_007] feasible=${feasibilityScore >= 0.7} score=${feasibilityScore.toFixed(4)} bottlenecks=${bottlenecks.length}`],
    };
}
// ============================================================================
// ALG_T2_M_008 · 创造迭代优化
// ============================================================================
function creationIterateOptimize(current, improvements, maxIterations = 5) {
    if (improvements.length === 0) {
        return { finalQuality: current.quality, iterations: 0, remainingIssues: current.issues, provenance: ['[ALG_T2_M_008] 无改进'] };
    }
    let quality = current.quality;
    let issues = [...current.issues];
    let iterations = 0;
    for (let i = 0; i < maxIterations; i++) {
        if (issues.length === 0 || quality >= 0.95)
            break;
        const improvement = improvements.find(imp => issues.includes(imp.issue));
        if (!improvement)
            break;
        quality = Math.min(1, quality + improvement.effectiveness * 0.2);
        issues = issues.filter(iss => iss !== improvement.issue);
        iterations++;
    }
    return {
        finalQuality: quality,
        iterations,
        remainingIssues: issues,
        provenance: [`[ALG_T2_M_008] quality=${quality.toFixed(4)} iter=${iterations} remaining=${issues.length}`],
    };
}
// ============================================================================
// ALG_T2_M_009 · 创造路径选择
// ============================================================================
function creationPathSelect(paths) {
    if (paths.length === 0) {
        return { selected: '', score: 0, rationale: 'no_paths', provenance: ['[ALG_T2_M_009] 无路径'] };
    }
    let best = paths[0];
    let bestScore = -1;
    for (const p of paths) {
        const score = p.novelty * 0.4 + p.feasibility * 0.3 + p.utility * 0.3;
        if (score > bestScore) {
            bestScore = score;
            best = p;
        }
    }
    return {
        selected: best.name,
        score: bestScore,
        rationale: `novelty=${best.novelty.toFixed(2)} feasibility=${best.feasibility.toFixed(2)} utility=${best.utility.toFixed(2)}`,
        provenance: [`[ALG_T2_M_009] selected=${best.name} score=${bestScore.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_M_010 · 创造风险评估
// ============================================================================
function creationRiskAssess(risks) {
    if (risks.length === 0) {
        return { totalRisk: 0, highRisks: [], mitigations: [], provenance: ['[ALG_T2_M_010] 无风险'] };
    }
    const highRisks = [];
    const mitigations = [];
    let totalRisk = 0;
    for (const r of risks) {
        const score = r.probability * r.impact;
        totalRisk += score;
        if (score > 0.3) {
            highRisks.push(r.name);
            mitigations.push(r.mitigation);
        }
    }
    return {
        totalRisk: totalRisk / risks.length,
        highRisks,
        mitigations,
        provenance: [`[ALG_T2_M_010] risks=${risks.length} high=${highRisks.length} total=${(totalRisk / risks.length).toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_M_011 · 创造溯源
// ============================================================================
function creationProvenance(creation) {
    const chain = [...creation.sources, ...creation.transformations, creation.id];
    const hash = chain.join('→').split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(16);
    return {
        chain,
        hash,
        verified: creation.sources.length > 0 && creation.transformations.length > 0,
        provenance: [`[ALG_T2_M_011] chain=${chain.length} hash=${hash} verified=${creation.sources.length > 0}`],
    };
}
// ============================================================================
// ALG_T2_M_012 · 创造影响评估
// ============================================================================
function creationImpactAssess(creation, context) {
    if (context.totalScope === 0) {
        return { impactScore: 0, relativeImpact: 0, significance: 'none', provenance: ['[ALG_T2_M_012] 无上下文'] };
    }
    const impactScore = creation.scope * creation.magnitude * creation.duration;
    const relativeImpact = creation.scope / context.totalScope;
    const significance = relativeImpact > 0.5 ? 'transformative' : relativeImpact > 0.2 ? 'significant' : relativeImpact > 0.05 ? 'moderate' : 'minor';
    return {
        impactScore,
        relativeImpact,
        significance,
        provenance: [`[ALG_T2_M_012] impact=${impactScore.toFixed(4)} rel=${relativeImpact.toFixed(4)} sig=${significance}`],
    };
}
// ============================================================================
// ALG_T2_M_013 · 创造协同（多创造整合）
// ============================================================================
function creationSynergize(creations) {
    if (creations.length < 2) {
        return { synergized: creations.flatMap(c => c.capabilities), emergentCapabilities: [], synergyScore: 0, provenance: ['[ALG_T2_M_013] 不足'] };
    }
    const allCaps = new Set();
    for (const c of creations)
        for (const cap of c.capabilities)
            allCaps.add(cap);
    const synergized = Array.from(allCaps);
    // 涌现能力：组合产生的新能力
    const emergentCapabilities = [];
    for (let i = 0; i < creations.length; i++) {
        for (let j = i + 1; j < creations.length; j++) {
            emergentCapabilities.push(`${creations[i].id}+${creations[j].id}_emergent`);
        }
    }
    const synergyScore = emergentCapabilities.length / (creations.length * (creations.length - 1) / 2);
    return {
        synergized,
        emergentCapabilities,
        synergyScore,
        provenance: [`[ALG_T2_M_013] creations=${creations.length} caps=${synergized.length} emergent=${emergentCapabilities.length}`],
    };
}
// ============================================================================
// ALG_T2_M_014 · 创造衰减监控
// ============================================================================
function creationDecayMonitor(creation) {
    if (creation.age === 0) {
        return { decayRate: 0, remainingImpact: 1, halfLife: Infinity, provenance: ['[ALG_T2_M_014] 年龄为零'] };
    }
    const remainingImpact = creation.currentImpact / creation.initialImpact;
    const decayRate = 1 - Math.pow(remainingImpact, 1 / creation.age);
    const halfLife = decayRate === 0 ? Infinity : Math.log(0.5) / Math.log(1 - decayRate);
    return {
        decayRate,
        remainingImpact,
        halfLife,
        provenance: [`[ALG_T2_M_014] decay=${decayRate.toFixed(4)} rem=${remainingImpact.toFixed(4)} halfLife=${halfLife === Infinity ? '∞' : halfLife.toFixed(2)}`],
    };
}
// ============================================================================
// ALG_T2_M_015 · 创造演化追踪
// ============================================================================
function creationEvolutionTrace(versions) {
    if (versions.length === 0) {
        return { evolutionPath: [], qualityTrend: 'unknown', improvementRate: 0, provenance: ['[ALG_T2_M_015] 无版本'] };
    }
    const sorted = [...versions].sort((a, b) => a.timestamp - b.timestamp);
    const evolutionPath = sorted.map(v => v.version);
    const qualities = sorted.map(v => v.quality);
    const improvementRate = qualities.length > 1 ? (qualities[qualities.length - 1] - qualities[0]) / (qualities.length - 1) : 0;
    const qualityTrend = improvementRate > 0.05 ? 'improving' : improvementRate < -0.05 ? 'declining' : 'stable';
    return {
        evolutionPath,
        qualityTrend,
        improvementRate,
        provenance: [`[ALG_T2_M_015] versions=${versions.length} trend=${qualityTrend} rate=${improvementRate.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_M_016 · 创造验证测试
// ============================================================================
function creationValidationTest(creation) {
    const specSet = new Set(creation.spec);
    const implSet = new Set(creation.implementation);
    const missingImpl = creation.spec.filter(s => !implSet.has(s));
    const specCoverage = creation.spec.length === 0 ? 0 : (creation.spec.length - missingImpl.length) / creation.spec.length;
    return {
        passed: missingImpl.length === 0,
        specCoverage,
        missingImpl,
        provenance: [`[ALG_T2_M_016] spec=${creation.spec.length} impl=${creation.implementation.length} coverage=${specCoverage.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_M_017 · 创造优化方向
// ============================================================================
function creationOptimizationDirection(current, weights = { novelty: 0.4, utility: 0.4, feasibility: 0.2 }) {
    const scores = [
        { dim: 'novelty', value: current.novelty, weight: weights.novelty },
        { dim: 'utility', value: current.utility, weight: weights.utility },
        { dim: 'feasibility', value: current.feasibility, weight: weights.feasibility },
    ];
    const weakest = scores.reduce((a, b) => (b.value < a.value ? b : a));
    const direction = weakest.dim === 'novelty' ? 'increase_novelty' : weakest.dim === 'utility' ? 'increase_utility' : 'increase_feasibility';
    const expectedGain = (1 - weakest.value) * weakest.weight;
    return {
        direction,
        priority: weakest.dim,
        expectedGain,
        provenance: [`[ALG_T2_M_017] direction=${direction} priority=${weakest.dim} gain=${expectedGain.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_M_018 · 创造组合爆炸控制
// ============================================================================
function creationCombinatorialControl(options, maxCombinations = 1000) {
    let total = 1;
    for (const opt of options) {
        total *= opt.choices.length;
        if (total > maxCombinations)
            break;
    }
    const feasible = total <= maxCombinations;
    const strategies = [];
    if (!feasible) {
        strategies.push('prune_low_value');
        strategies.push('heuristic_search');
        strategies.push('constraint_propagation');
    }
    return {
        feasible,
        totalCombinations: total,
        pruned: !feasible,
        strategies,
        provenance: [`[ALG_T2_M_018] total=${total} max=${maxCombinations} feasible=${feasible}`],
    };
}
// ============================================================================
// ALG_T2_M_019 · 创造质量评级
// ============================================================================
function creationQualityGrade(metrics) {
    const score = metrics.novelty * 0.25 +
        metrics.utility * 0.25 +
        metrics.feasibility * 0.2 +
        metrics.impact * 0.15 +
        metrics.sustainability * 0.15;
    let grade, tier;
    if (score >= 0.95) {
        grade = 'A+';
        tier = 'breakthrough';
    }
    else if (score >= 0.85) {
        grade = 'A';
        tier = 'excellent';
    }
    else if (score >= 0.75) {
        grade = 'B+';
        tier = 'good';
    }
    else if (score >= 0.65) {
        grade = 'B';
        tier = 'acceptable';
    }
    else if (score >= 0.5) {
        grade = 'C';
        tier = 'marginal';
    }
    else {
        grade = 'F';
        tier = 'reject';
    }
    return {
        grade,
        score,
        tier,
        provenance: [`[ALG_T2_M_019] grade=${grade} score=${score.toFixed(4)} tier=${tier}`],
    };
}
// ============================================================================
// ALG_T2_M_020 · 创造综合评估
// ============================================================================
function creationComprehensiveAssessment(creation) {
    const overall = creation.novelty * 0.2 +
        creation.utility * 0.25 +
        creation.feasibility * 0.2 +
        creation.integrity * 0.15 +
        creation.impact * 0.2;
    const recommendations = [];
    let verdict;
    if (overall >= 0.85) {
        verdict = 'proceed';
    }
    else if (overall >= 0.65) {
        verdict = 'proceed_with_caution';
        if (creation.novelty < 0.5)
            recommendations.push('enhance_novelty');
        if (creation.feasibility < 0.6)
            recommendations.push('reduce_complexity');
    }
    else if (overall >= 0.4) {
        verdict = 'revise';
        recommendations.push('major_revision_needed');
    }
    else {
        verdict = 'reject';
        recommendations.push('fundamental_redesign_or_abandon');
    }
    return {
        overall,
        verdict,
        recommendations,
        provenance: [`[ALG_T2_M_020] overall=${overall.toFixed(4)} verdict=${verdict} recs=${recommendations.length}`],
    };
}
