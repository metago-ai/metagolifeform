"use strict";
/**
 * MetaGO Engine - A5 T1 算法 · 元进化类（第二批）
 *
 * 对应公理：A3 元进化公理 / A34 元进化需元进化 / A4 边界公理 / A35 创造进化律
 * 对应文档：附录A·T1·EVOLUTION（ALG_T1_E_001 ~ ALG_T1_E_015）
 *
 * 算法清单（15 个）：
 *   001 边界感知      002 差距分析        003 自生成
 *   004 进化验证      005 递归进化        006 五阶段循环
 *   007 进化速率      008 进化深度        009 进化广度
 *   010 进化适应度    011 进化压力        012 进化变异
 *   013 进化选择      014 进化交叉        015 进化谱系
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBoundary = detectBoundary;
exports.analyzeGap = analyzeGap;
exports.selfGenerate = selfGenerate;
exports.verifyEvolution = verifyEvolution;
exports.recursiveEvolve = recursiveEvolve;
exports.evolutionCycle = evolutionCycle;
exports.evolutionRate = evolutionRate;
exports.evolutionDepth = evolutionDepth;
exports.evolutionBreadth = evolutionBreadth;
exports.evolutionFitness = evolutionFitness;
exports.evolutionPressure = evolutionPressure;
exports.evolutionMutation = evolutionMutation;
exports.evolutionSelection = evolutionSelection;
exports.evolutionCrossover = evolutionCrossover;
exports.evolutionLineage = evolutionLineage;
// ============================================================================
// T1·ALG_T1_E_001 · 边界感知（A4 边界公理）
// ============================================================================
function detectBoundary(points) {
    if (points.length === 0) {
        return { detected: false, boundaries: [], severity: 0, provenance: ['[ALG_T1_E_001] 空输入'] };
    }
    const boundaries = points.filter(p => Math.abs(p.currentValue - p.limitValue) / (Math.abs(p.limitValue) + 1e-9) < 0.1);
    const severity = boundaries.length / points.length;
    return {
        detected: boundaries.length > 0,
        boundaries,
        severity,
        provenance: [`[ALG_T1_E_001] boundaries=${boundaries.length}/${points.length} severity=${severity.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_002 · 差距分析
// ============================================================================
function analyzeGap(current, target) {
    if (current.length !== target.length || current.length === 0) {
        return { gaps: [], totalGap: 0, relativeGap: 0, provenance: ['[ALG_T1_E_002] 维度不匹配或为空'] };
    }
    const gaps = current.map((c, i) => target[i] - c);
    const totalGap = gaps.reduce((s, g) => s + Math.abs(g), 0);
    const targetNorm = Math.sqrt(target.reduce((s, x) => s + x * x, 0));
    const relativeGap = targetNorm === 0 ? 0 : totalGap / targetNorm;
    return {
        gaps,
        totalGap,
        relativeGap,
        provenance: [`[ALG_T1_E_002] total=${totalGap.toFixed(4)} rel=${relativeGap.toFixed(4)} dim=${gaps.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_003 · 自生成（A5 内生公理）
// ============================================================================
function selfGenerate(template, mutationRate = 0.1, rng = Math.random) {
    if (template.length === 0) {
        return { generated: [], mutations: 0, provenance: ['[ALG_T1_E_003] 空模板'] };
    }
    let mutations = 0;
    const generated = template.map(v => {
        if (rng() < mutationRate) {
            mutations++;
            return v + (rng() - 0.5) * 2 * Math.abs(v || 1);
        }
        return v;
    });
    return {
        generated,
        mutations,
        provenance: [`[ALG_T1_E_003] mut=${mutations}/${template.length} rate=${mutationRate}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_004 · 进化验证
// ============================================================================
function verifyEvolution(before, after, threshold = 0.01) {
    if (before.length !== after.length || before.length === 0) {
        return { verified: false, improvement: 0, provenance: ['[ALG_T1_E_004] 维度不匹配'] };
    }
    const beforeSum = before.reduce((s, x) => s + x, 0);
    const afterSum = after.reduce((s, x) => s + x, 0);
    const improvement = afterSum - beforeSum;
    return {
        verified: improvement > threshold,
        improvement,
        provenance: [`[ALG_T1_E_004] Δ=${improvement.toFixed(6)} threshold=${threshold} verified=${improvement > threshold}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_005 · 递归进化（A34 元进化需元进化）
// ============================================================================
function recursiveEvolve(initial, evolveFn, maxIterations = 100, convergenceThreshold = 1e-6) {
    if (maxIterations <= 0) {
        return { final: initial, iterations: 0, converged: false, history: [initial], provenance: ['[ALG_T1_E_005] 无迭代'] };
    }
    let current = [...initial];
    const history = [[...current]];
    let converged = false;
    let i = 0;
    for (; i < maxIterations; i++) {
        const next = evolveFn(current);
        const delta = next.reduce((s, x, j) => s + Math.abs(x - current[j]), 0) / (next.length || 1);
        current = next;
        history.push([...current]);
        if (delta < convergenceThreshold) {
            converged = true;
            break;
        }
    }
    return {
        final: current,
        iterations: i + 1,
        converged,
        history,
        provenance: [`[ALG_T1_E_005] iter=${i + 1}/${maxIterations} converged=${converged}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_006 · 五阶段循环
// ============================================================================
function evolutionCycle(input, evolveFn, maxCycles = 10) {
    const stageLog = [];
    let current = [...input.state];
    let cycles = 0;
    for (let c = 0; c < maxCycles; c++) {
        // 1. 边界感知
        const boundary = detectBoundary(input.boundaries);
        stageLog.push(`cycle${c}:boundary=${boundary.detected}`);
        // 2. 差距分析
        const gap = analyzeGap(current, input.target);
        stageLog.push(`cycle${c}:gap=${gap.totalGap.toFixed(4)}`);
        if (gap.totalGap < 1e-6) {
            cycles = c + 1;
            break;
        }
        // 3. 自生成
        const generated = selfGenerate(current, 0.2);
        stageLog.push(`cycle${c}:mut=${generated.mutations}`);
        // 4. 验证
        const verified = verifyEvolution(current, generated.generated);
        stageLog.push(`cycle${c}:verified=${verified.verified}`);
        // 5. 递归
        if (verified.verified) {
            current = generated.generated;
        }
        cycles = c + 1;
    }
    return {
        finalState: current,
        cycles,
        stageLog,
        provenance: [`[ALG_T1_E_006] cycles=${cycles}/${maxCycles} stages=${stageLog.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_007 · 进化速率
// ============================================================================
function evolutionRate(history) {
    const n = history.length;
    if (n < 2) {
        return { rate: 0, acceleration: 0, provenance: ['[ALG_T1_E_007] 数据不足'] };
    }
    // 线性回归斜率 = 速率
    const times = history.map(h => h.time);
    const fits = history.map(h => h.fitness);
    const meanT = times.reduce((s, x) => s + x, 0) / n;
    const meanF = fits.reduce((s, x) => s + x, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (times[i] - meanT) * (fits[i] - meanF);
        den += (times[i] - meanT) ** 2;
    }
    const rate = den === 0 ? 0 : num / den;
    // 加速度 = 速率的变化率
    let acceleration = 0;
    if (n >= 3) {
        const rates = [];
        for (let i = 1; i < n; i++) {
            const dt = times[i] - times[i - 1];
            if (dt !== 0)
                rates.push((fits[i] - fits[i - 1]) / dt);
        }
        if (rates.length >= 2) {
            acceleration = (rates[rates.length - 1] - rates[0]) / (rates.length - 1);
        }
    }
    return {
        rate,
        acceleration,
        provenance: [`[ALG_T1_E_007] rate=${rate.toFixed(6)} accel=${acceleration.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_008 · 进化深度
// ============================================================================
function evolutionDepth(lineage) {
    if (lineage.length === 0) {
        return { maxDepth: 0, avgDepth: 0, branchingFactor: 0, provenance: ['[ALG_T1_E_008] 空谱系'] };
    }
    const maxDepth = lineage.length;
    const avgDepth = lineage.reduce((s, gen, i) => s + gen.length * (i + 1), 0) /
        (lineage.reduce((s, gen) => s + gen.length, 0) || 1);
    const branchingFactor = maxDepth > 1
        ? lineage.slice(1).reduce((s, gen) => s + gen.length, 0) / (maxDepth - 1) /
            (lineage[0].length || 1)
        : 0;
    return {
        maxDepth,
        avgDepth,
        branchingFactor,
        provenance: [`[ALG_T1_E_008] maxDepth=${maxDepth} avg=${avgDepth.toFixed(2)} bf=${branchingFactor.toFixed(2)}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_009 · 进化广度
// ============================================================================
function evolutionBreadth(specimens) {
    if (specimens.length === 0) {
        return { uniqueGenomes: 0, diversity: 0, spread: 0, provenance: ['[ALG_T1_E_009] 空样本'] };
    }
    const genomeSet = new Set(specimens.map(s => s.genome.map(v => v.toFixed(4)).join(',')));
    const uniqueGenomes = genomeSet.size;
    const diversity = uniqueGenomes / specimens.length;
    // spread = 基因组各维度的标准差均值
    const dim = specimens[0].genome.length;
    let spread = 0;
    for (let d = 0; d < dim; d++) {
        const col = specimens.map(s => s.genome[d]);
        const mean = col.reduce((s, x) => s + x, 0) / col.length;
        const variance = col.reduce((s, x) => s + (x - mean) ** 2, 0) / col.length;
        spread += Math.sqrt(variance);
    }
    spread = dim > 0 ? spread / dim : 0;
    return {
        uniqueGenomes,
        diversity,
        spread,
        provenance: [`[ALG_T1_E_009] unique=${uniqueGenomes} diversity=${diversity.toFixed(4)} spread=${spread.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_010 · 进化适应度
// ============================================================================
function evolutionFitness(specimen, objective, weights) {
    if (specimen.genome.length !== objective.length || specimen.genome.length === 0) {
        return { fitness: 0, normalized: 0, provenance: ['[ALG_T1_E_010] 维度不匹配'] };
    }
    const w = weights ?? specimen.genome.map(() => 1);
    let sum = 0, wsum = 0;
    for (let i = 0; i < specimen.genome.length; i++) {
        const dist = Math.abs(specimen.genome[i] - objective[i]);
        sum += w[i] * (1 / (1 + dist));
        wsum += w[i];
    }
    const fitness = wsum === 0 ? 0 : sum / wsum;
    return {
        fitness,
        normalized: fitness,
        provenance: [`[ALG_T1_E_010] fitness=${fitness.toFixed(6)} dim=${specimen.genome.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_011 · 进化压力
// ============================================================================
function evolutionPressure(population, capacity) {
    if (capacity <= 0) {
        return { pressure: 0, survivorship: 0, provenance: ['[ALG_T1_E_011] 容量无效'] };
    }
    const pressure = population.length > capacity ? 1 - capacity / population.length : 0;
    const survivorship = population.length === 0 ? 0 : Math.min(1, capacity / population.length);
    return {
        pressure,
        survivorship,
        provenance: [`[ALG_T1_E_011] pop=${population.length} cap=${capacity} pressure=${pressure.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_012 · 进化变异
// ============================================================================
function evolutionMutation(genome, rate = 0.05, magnitude = 0.1, rng = Math.random) {
    if (genome.length === 0) {
        return { mutated: [], mutationCount: 0, provenance: ['[ALG_T1_E_012] 空基因组'] };
    }
    let mutationCount = 0;
    const mutated = genome.map(v => {
        if (rng() < rate) {
            mutationCount++;
            return v + (rng() - 0.5) * 2 * magnitude * (Math.abs(v) + 1);
        }
        return v;
    });
    return {
        mutated,
        mutationCount,
        provenance: [`[ALG_T1_E_012] mut=${mutationCount}/${genome.length} rate=${rate} mag=${magnitude}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_013 · 进化选择（锦标赛选择）
// ============================================================================
function evolutionSelection(population, tournamentSize = 3, rng = Math.random) {
    if (population.length === 0) {
        return { selected: { id: 'null', genome: [], fitness: 0, age: 0 }, provenance: ['[ALG_T1_E_013] 空种群'] };
    }
    const k = Math.min(tournamentSize, population.length);
    let best = null;
    for (let i = 0; i < k; i++) {
        const idx = Math.floor(rng() * population.length);
        const candidate = population[idx];
        if (best === null || candidate.fitness > best.fitness) {
            best = candidate;
        }
    }
    return {
        selected: best,
        provenance: [`[ALG_T1_E_013] k=${k} selectedFitness=${best.fitness.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_014 · 进化交叉（均匀交叉）
// ============================================================================
function evolutionCrossover(parentA, parentB, crossoverRate = 0.5, rng = Math.random) {
    if (parentA.length !== parentB.length || parentA.length === 0) {
        return { offspring: [], crossoverPoints: [], provenance: ['[ALG_T1_E_014] 维度不匹配'] };
    }
    const offspring = [];
    const crossoverPoints = [];
    for (let i = 0; i < parentA.length; i++) {
        if (rng() < crossoverRate) {
            offspring.push(parentB[i]);
            crossoverPoints.push(i);
        }
        else {
            offspring.push(parentA[i]);
        }
    }
    return {
        offspring,
        crossoverPoints,
        provenance: [`[ALG_T1_E_014] dim=${parentA.length} xover=${crossoverPoints.length} rate=${crossoverRate}`],
    };
}
// ============================================================================
// T1·ALG_T1_E_015 · 进化谱系追踪
// ============================================================================
function evolutionLineage(generations) {
    if (generations.length === 0) {
        return { lineage: [], totalSpecimens: 0, bestLineage: [], provenance: ['[ALG_T1_E_015] 空世代'] };
    }
    const lineage = generations.map(gen => gen.map(s => s.id));
    const totalSpecimens = generations.reduce((s, gen) => s + gen.length, 0);
    // 追踪每代最优个体
    const bestLineage = generations.map(gen => {
        let best = gen[0];
        for (const s of gen)
            if (s.fitness > best.fitness)
                best = s;
        return best.id;
    });
    return {
        lineage,
        totalSpecimens,
        bestLineage,
        provenance: [`[ALG_T1_E_015] gens=${generations.length} total=${totalSpecimens} bestChain=${bestLineage.length}`],
    };
}
