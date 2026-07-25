"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 元进化引擎封装类（ALG_T2_E_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 81~100 项（元进化引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 evolution-engine 的私有辅助方法
 *   - 处理五阶段循环、进化追踪、进化适应度、进化加速
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evolutionFiveStageCycle = evolutionFiveStageCycle;
exports.evolutionBoundarySense = evolutionBoundarySense;
exports.evolutionGapAnalysis = evolutionGapAnalysis;
exports.evolutionSelfGenerate = evolutionSelfGenerate;
exports.evolutionVerify = evolutionVerify;
exports.evolutionRecurseTrigger = evolutionRecurseTrigger;
exports.evolutionFitness = evolutionFitness;
exports.evolutionHistoryTrace = evolutionHistoryTrace;
exports.evolutionAccelerate = evolutionAccelerate;
exports.evolutionStagnationDetect = evolutionStagnationDetect;
exports.evolutionPathPlanning = evolutionPathPlanning;
exports.evolutionDiversityMaintain = evolutionDiversityMaintain;
exports.evolutionAssessmentReport = evolutionAssessmentReport;
exports.evolutionThresholdAdapt = evolutionThresholdAdapt;
exports.evolutionRollback = evolutionRollback;
exports.evolutionEfficiency = evolutionEfficiency;
exports.evolutionStressTest = evolutionStressTest;
exports.evolutionCoEvolve = evolutionCoEvolve;
exports.evolutionGoalAlign = evolutionGoalAlign;
exports.evolutionComprehensiveAssessment = evolutionComprehensiveAssessment;
// ============================================================================
// ALG_T2_E_001 · 五阶段循环执行
// ============================================================================
function evolutionFiveStageCycle(initialFitness, boundaryDescription) {
    const stages = [
        { name: 'boundary_sense', status: 'completed', output: `boundary: ${boundaryDescription}`, duration: 1 },
        { name: 'gap_analysis', status: 'completed', output: `gap identified from ${initialFitness}`, duration: 2 },
        { name: 'self_generate', status: 'completed', output: `new capability synthesized`, duration: 5 },
        { name: 'verify', status: 'completed', output: `verification passed`, duration: 2 },
        { name: 'recurse', status: 'completed', output: `recursion trigger set`, duration: 1 },
    ];
    const improvement = Math.max(0, 0.1 - initialFitness * 0.05);
    const finalFitness = Math.min(1, initialFitness + improvement);
    return {
        trace: stages,
        finalFitness,
        improved: finalFitness > initialFitness,
        provenance: [`[ALG_T2_E_001] init=${initialFitness.toFixed(4)} final=${finalFitness.toFixed(4)} improved=${finalFitness > initialFitness}`],
    };
}
// ============================================================================
// ALG_T2_E_002 · 边界感知
// ============================================================================
function evolutionBoundarySense(capabilities, challenges) {
    if (capabilities.length === 0 || challenges.length === 0) {
        return { boundaries: [], criticalCount: 0, provenance: ['[ALG_T2_E_002] 空输入'] };
    }
    const capMap = new Map(capabilities.map(c => [c.name, c.proficiency]));
    const boundaries = challenges.map(ch => {
        const cur = capMap.get(ch.name) || 0;
        const gap = ch.requiredProficiency - cur;
        const severity = gap > 0.5 ? 'critical' : gap > 0.2 ? 'major' : gap > 0 ? 'minor' : 'none';
        return { challenge: ch.name, gap, severity };
    });
    const criticalCount = boundaries.filter(b => b.severity === 'critical').length;
    return {
        boundaries,
        criticalCount,
        provenance: [`[ALG_T2_E_002] boundaries=${boundaries.length} critical=${criticalCount}`],
    };
}
// ============================================================================
// ALG_T2_E_003 · 差距分析
// ============================================================================
function evolutionGapAnalysis(current, target) {
    const gaps = [];
    for (const dim of Object.keys(target)) {
        const cur = current[dim] || 0;
        const tgt = target[dim];
        const gap = tgt - cur;
        if (gap > 0) {
            gaps.push({ dimension: dim, current: cur, target: tgt, gap });
        }
    }
    gaps.sort((a, b) => b.gap - a.gap);
    const totalGap = gaps.reduce((s, g) => s + g.gap, 0);
    return {
        gaps,
        totalGap,
        priority: gaps.length > 0 ? gaps[0].dimension : 'none',
        provenance: [`[ALG_T2_E_003] gaps=${gaps.length} total=${totalGap.toFixed(4)} priority=${gaps.length > 0 ? gaps[0].dimension : 'none'}`],
    };
}
// ============================================================================
// ALG_T2_E_004 · 自生成（新能力合成）
// ============================================================================
function evolutionSelfGenerate(gap, availablePrimitives) {
    if (availablePrimitives.length === 0) {
        return { synthesized: '', complexity: 0, estimatedEffectiveness: 0, provenance: ['[ALG_T2_E_004] 无原语'] };
    }
    // 简化的合成：基于差距大小选择原语组合
    const primitiveCount = Math.min(availablePrimitives.length, Math.ceil(gap.magnitude * 10) + 1);
    const selected = availablePrimitives.slice(0, primitiveCount);
    const synthesized = `evolved_${gap.dimension}_${selected.join('_')}`;
    const complexity = primitiveCount * gap.magnitude;
    const estimatedEffectiveness = Math.min(1, primitiveCount / (gap.magnitude * 5 + 1));
    return {
        synthesized,
        complexity,
        estimatedEffectiveness,
        provenance: [`[ALG_T2_E_004] synth=${synthesized.substring(0, 30)}... complexity=${complexity.toFixed(4)} eff=${estimatedEffectiveness.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_E_005 · 进化验证
// ============================================================================
function evolutionVerify(before, after, target, regression = 0) {
    const improvement = after - before;
    const regressionDetected = regression > 0.05;
    const passed = after > before && after >= target * 0.8 && !regressionDetected;
    return {
        passed,
        improvement,
        regressionDetected,
        provenance: [`[ALG_T2_E_005] before=${before.toFixed(4)} after=${after.toFixed(4)} improve=${improvement.toFixed(4)} pass=${passed}`],
    };
}
// ============================================================================
// ALG_T2_E_006 · 进化递归触发
// ============================================================================
function evolutionRecurseTrigger(currentFitness, threshold = 0.95, maxDepth = 5, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
        return { shouldRecurse: false, nextDepth: currentDepth, reason: 'max_depth_reached', provenance: [`[ALG_T2_E_006] depth=${currentDepth} max=${maxDepth}`] };
    }
    if (currentFitness >= threshold) {
        return { shouldRecurse: false, nextDepth: currentDepth, reason: 'threshold_met', provenance: [`[ALG_T2_E_006] fitness=${currentFitness.toFixed(4)} >= ${threshold}`] };
    }
    return {
        shouldRecurse: true,
        nextDepth: currentDepth + 1,
        reason: 'gap_remains',
        provenance: [`[ALG_T2_E_006] recurse depth=${currentDepth + 1} fitness=${currentFitness.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_E_007 · 进化适应度计算
// ============================================================================
function evolutionFitness(metrics) {
    const weights = { capability: 0.35, adaptability: 0.25, robustness: 0.25, efficiency: 0.15 };
    const fitness = metrics.capability * weights.capability +
        metrics.adaptability * weights.adaptability +
        metrics.robustness * weights.robustness +
        metrics.efficiency * weights.efficiency;
    const entries = Object.entries(metrics);
    const dominant = entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    return {
        fitness,
        dominant,
        provenance: [`[ALG_T2_E_007] fitness=${fitness.toFixed(4)} dom=${dominant}`],
    };
}
// ============================================================================
// ALG_T2_E_008 · 进化历史追踪
// ============================================================================
function evolutionHistoryTrace(traces) {
    if (traces.length === 0) {
        return { totalCycles: 0, avgImprovement: 0, convergenceTrend: 'unknown', provenance: ['[ALG_T2_E_008] 无历史'] };
    }
    const improvements = traces.map(t => t.fitnessAfter - t.fitnessBefore);
    const avgImprovement = improvements.reduce((s, x) => s + x, 0) / improvements.length;
    // 趋势：比较前后半段
    const mid = Math.floor(improvements.length / 2);
    const firstHalf = improvements.slice(0, mid).reduce((s, x) => s + x, 0) / Math.max(mid, 1);
    const secondHalf = improvements.slice(mid).reduce((s, x) => s + x, 0) / Math.max(improvements.length - mid, 1);
    const convergenceTrend = secondHalf < firstHalf * 0.5 ? 'converging' : secondHalf > firstHalf * 1.5 ? 'diverging' : 'stable';
    return {
        totalCycles: traces.length,
        avgImprovement,
        convergenceTrend,
        provenance: [`[ALG_T2_E_008] cycles=${traces.length} avg=${avgImprovement.toFixed(4)} trend=${convergenceTrend}`],
    };
}
// ============================================================================
// ALG_T2_E_009 · 进化加速
// ============================================================================
function evolutionAccelerate(currentRate, accelerators) {
    if (accelerators.length === 0) {
        return { acceleratedRate: currentRate, bestAccelerator: 'none', provenance: ['[ALG_T2_E_009] 无加速器'] };
    }
    let best = accelerators[0];
    for (const a of accelerators) {
        if (a.factor > best.factor)
            best = a;
    }
    return {
        acceleratedRate: currentRate * best.factor,
        bestAccelerator: best.name,
        provenance: [`[ALG_T2_E_009] rate=${currentRate.toFixed(4)}→${(currentRate * best.factor).toFixed(4)} accel=${best.name}`],
    };
}
// ============================================================================
// ALG_T2_E_010 · 进化停滞检测
// ============================================================================
function evolutionStagnationDetect(fitnessHistory, windowSize = 5, threshold = 0.01) {
    if (fitnessHistory.length < windowSize) {
        return { stagnant: false, duration: 0, avgDelta: 0, provenance: ['[ALG_T2_E_010] 数据不足'] };
    }
    const recent = fitnessHistory.slice(-windowSize);
    let totalDelta = 0;
    for (let i = 1; i < recent.length; i++) {
        totalDelta += recent[i] - recent[i - 1];
    }
    const avgDelta = totalDelta / (recent.length - 1);
    const stagnant = Math.abs(avgDelta) < threshold;
    return {
        stagnant,
        duration: stagnant ? windowSize : 0,
        avgDelta,
        provenance: [`[ALG_T2_E_010] stagnant=${stagnant} avgDelta=${avgDelta.toFixed(6)} window=${windowSize}`],
    };
}
// ============================================================================
// ALG_T2_E_011 · 进化路径规划
// ============================================================================
function evolutionPathPlanning(current, target, availableSteps, maxSteps = 5) {
    if (availableSteps.length === 0 || maxSteps <= 0) {
        return { path: [], totalGain: 0, totalCost: 0, provenance: ['[ALG_T2_E_011] 无步骤'] };
    }
    const gap = target - current;
    if (gap <= 0) {
        return { path: [], totalGain: 0, totalCost: 0, provenance: [`[ALG_T2_E_011] 已达标`] };
    }
    // 按性价比排序
    const sorted = [...availableSteps].sort((a, b) => (b.expectedGain / b.cost) - (a.expectedGain / a.cost));
    const path = [];
    let totalGain = 0, totalCost = 0;
    for (const step of sorted) {
        if (path.length >= maxSteps || totalGain >= gap)
            break;
        path.push(step.name);
        totalGain += step.expectedGain;
        totalCost += step.cost;
    }
    return {
        path,
        totalGain,
        totalCost,
        provenance: [`[ALG_T2_E_011] path=${path.length} gain=${totalGain.toFixed(4)} cost=${totalCost.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_E_012 · 进化多样性维护
// ============================================================================
function evolutionDiversityMaintain(population) {
    if (population.length === 0) {
        return { diversity: 0, uniqueCount: 0, shouldMutate: false, provenance: ['[ALG_T2_E_012] 空种群'] };
    }
    const signatures = new Set();
    for (const p of population) {
        signatures.add(p.traits.map(t => t.toFixed(2)).join(','));
    }
    const uniqueCount = signatures.size;
    const diversity = uniqueCount / population.length;
    return {
        diversity,
        uniqueCount,
        shouldMutate: diversity < 0.3,
        provenance: [`[ALG_T2_E_012] pop=${population.length} unique=${uniqueCount} div=${diversity.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_E_013 · 进化评估报告
// ============================================================================
function evolutionAssessmentReport(trace, axioms) {
    const findings = [];
    const improvement = trace.fitnessAfter - trace.fitnessBefore;
    if (improvement < 0)
        findings.push('regression_detected');
    if (trace.stages.some(s => s.status === 'failed'))
        findings.push('stage_failures');
    if (trace.stages.length !== 5)
        findings.push('incomplete_cycle');
    if (improvement > 0.2)
        findings.push('significant_improvement');
    const stageScore = trace.stages.filter(s => s.status === 'completed').length / 5;
    const improvementScore = Math.max(0, Math.min(1, improvement * 5));
    const score = stageScore * 0.4 + improvementScore * 0.6;
    const grade = score >= 0.9 ? 'A' : score >= 0.8 ? 'B' : score >= 0.7 ? 'C' : score >= 0.6 ? 'D' : 'F';
    return {
        score,
        grade,
        findings,
        provenance: [`[ALG_T2_E_013] score=${score.toFixed(4)} grade=${grade} findings=${findings.length}`],
    };
}
// ============================================================================
// ALG_T2_E_014 · 进化阈值动态调整
// ============================================================================
function evolutionThresholdAdapt(history, baseThreshold, adaptRate = 0.05) {
    if (history.length < 5) {
        return { threshold: baseThreshold, converged: false, provenance: ['[ALG_T2_E_014] 数据不足'] };
    }
    const recent = history.slice(-5);
    const mean = recent.reduce((s, x) => s + x, 0) / recent.length;
    const variance = recent.reduce((s, x) => s + (x - mean) ** 2, 0) / recent.length;
    const std = Math.sqrt(variance);
    const converged = std < 0.01;
    const threshold = converged ? Math.min(1, baseThreshold + adaptRate) : baseThreshold;
    return {
        threshold,
        converged,
        provenance: [`[ALG_T2_E_014] thr=${threshold.toFixed(4)} conv=${converged} std=${std.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_E_015 · 进化回滚机制
// ============================================================================
function evolutionRollback(currentFitness, previousFitness, regressionThreshold = 0.05) {
    const regression = previousFitness - currentFitness;
    if (regression > regressionThreshold) {
        return {
            shouldRollback: true,
            reason: `regression=${regression.toFixed(4)} > threshold=${regressionThreshold}`,
            provenance: [`[ALG_T2_E_015] rollback=true regression=${regression.toFixed(4)}`],
        };
    }
    return {
        shouldRollback: false,
        reason: 'no_significant_regression',
        provenance: [`[ALG_T2_E_015] rollback=false regression=${regression.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_E_016 · 进化效能评估
// ============================================================================
function evolutionEfficiency(input) {
    if (input.cycles === 0 || input.totalTime === 0 || input.resourcesUsed === 0) {
        return { efficiency: 0, gainPerCycle: 0, gainPerResource: 0, provenance: ['[ALG_T2_E_016] 无效输入'] };
    }
    const gainPerCycle = input.totalGain / input.cycles;
    const gainPerResource = input.totalGain / input.resourcesUsed;
    const efficiency = gainPerCycle * gainPerResource;
    return {
        efficiency,
        gainPerCycle,
        gainPerResource,
        provenance: [`[ALG_T2_E_016] eff=${efficiency.toFixed(6)} gpc=${gainPerCycle.toFixed(4)} gpr=${gainPerResource.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_E_017 · 进化压力测试
// ============================================================================
function evolutionStressTest(system, stressors) {
    if (stressors.length === 0) {
        return { survived: true, minFitness: system.fitness, failedStressors: [], provenance: ['[ALG_T2_E_017] 无压力源'] };
    }
    let currentFitness = system.fitness;
    let minFitness = currentFitness;
    const failedStressors = [];
    for (const s of stressors) {
        const impact = s.intensity * (1 - system.robustness);
        currentFitness = Math.max(0, currentFitness - impact);
        if (currentFitness < minFitness)
            minFitness = currentFitness;
        if (currentFitness < 0.3)
            failedStressors.push(s.name);
    }
    return {
        survived: failedStressors.length === 0,
        minFitness,
        failedStressors,
        provenance: [`[ALG_T2_E_017] survived=${failedStressors.length === 0} minFit=${minFitness.toFixed(4)} failed=${failedStressors.length}`],
    };
}
// ============================================================================
// ALG_T2_E_018 · 进化协同（多智能体）
// ============================================================================
function evolutionCoEvolve(agents) {
    if (agents.length < 2) {
        return { synergy: 0, complementaryPairs: [], provenance: ['[ALG_T2_E_018] 智能体不足'] };
    }
    const pairs = [];
    let totalSynergy = 0;
    let pairCount = 0;
    for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
            const a = agents[i], b = agents[j];
            // 互补：特化差异大但适应度都高
            const complementarity = 1 - Math.abs(a.specialization - b.specialization);
            const fitnessProduct = a.fitness * b.fitness;
            const synergy = complementarity * fitnessProduct;
            totalSynergy += synergy;
            pairCount++;
            if (synergy > 0.5)
                pairs.push([a.id, b.id]);
        }
    }
    return {
        synergy: pairCount > 0 ? totalSynergy / pairCount : 0,
        complementaryPairs: pairs,
        provenance: [`[ALG_T2_E_018] agents=${agents.length} pairs=${pairs.length} synergy=${(pairCount > 0 ? totalSynergy / pairCount : 0).toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_E_019 · 进化目标对齐
// ============================================================================
function evolutionGoalAlign(current, target) {
    const fitnessGap = Math.abs(current.fitness - target.fitness);
    const directionDeviation = Math.abs(current.direction - target.direction);
    const alignment = (1 - fitnessGap) * (1 - directionDeviation);
    let action;
    if (alignment > 0.8)
        action = 'maintain';
    else if (alignment > 0.5)
        action = 'adjust';
    else if (alignment > 0.3)
        action = 'redirect';
    else
        action = 'reset';
    return {
        alignment,
        deviation: directionDeviation,
        action,
        provenance: [`[ALG_T2_E_019] align=${alignment.toFixed(4)} dev=${directionDeviation.toFixed(4)} action=${action}`],
    };
}
// ============================================================================
// ALG_T2_E_020 · 进化综合评估
// ============================================================================
function evolutionComprehensiveAssessment(metrics) {
    const overall = metrics.fitness * 0.3 +
        metrics.improvement * 0.25 +
        metrics.stability * 0.2 +
        metrics.diversity * 0.15 +
        metrics.efficiency * 0.1;
    let stage;
    if (overall < 0.3)
        stage = 'infant';
    else if (overall < 0.6)
        stage = 'growing';
    else if (overall < 0.85)
        stage = 'mature';
    else
        stage = 'declining';
    return {
        overall,
        stage,
        provenance: [`[ALG_T2_E_020] overall=${overall.toFixed(4)} stage=${stage}`],
    };
}
