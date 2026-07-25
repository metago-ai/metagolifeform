"use strict";
/**
 * MetaGO Engine - A5 T1 算法 · 冲突转化类（第二批）
 *
 * 对应属性：D39 直接批判性 / 耦生辩证法 / 矛盾识别
 * 对应文档：附录A·T1·CONFLICT（ALG_T1_X_001 ~ ALG_T1_X_015）
 *
 * 算法清单（15 个）：
 *   001 冲突检测        002 冲突强度计算      003 矛盾识别
 *   004 对立统一分析    005 冲突调解          006 共识寻求
 *   007 妥协方案生成    008 冲突升级预测      009 冲突降级
 *   010 多方博弈均衡    011 帕累托改进        012 纳什均衡
 *   013 零和检测        014 双赢策略          015 冲突溯源
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.conflictDetection = conflictDetection;
exports.conflictIntensity = conflictIntensity;
exports.contradictionIdentification = contradictionIdentification;
exports.dialecticalAnalysis = dialecticalAnalysis;
exports.conflictMediation = conflictMediation;
exports.consensusSeeking = consensusSeeking;
exports.compromiseGeneration = compromiseGeneration;
exports.conflictEscalationPrediction = conflictEscalationPrediction;
exports.conflictDeescalation = conflictDeescalation;
exports.multiPartyGameEquilibrium = multiPartyGameEquilibrium;
exports.paretoImprovement = paretoImprovement;
exports.nashEquilibrium = nashEquilibrium;
exports.zeroSumDetection = zeroSumDetection;
exports.winWinStrategy = winWinStrategy;
exports.conflictProvenance = conflictProvenance;
// ============================================================================
// T1·ALG_T1_X_001 · 冲突检测
// ============================================================================
function conflictDetection(parties, threshold = 0.3) {
    if (parties.length < 2) {
        return { hasConflict: false, conflictPairs: [], provenance: ['[ALG_T1_X_001] 当事方不足'] };
    }
    const conflictPairs = [];
    for (let i = 0; i < parties.length; i++) {
        for (let j = i + 1; j < parties.length; j++) {
            const a = parties[i].position;
            const b = parties[j].position;
            const len = Math.min(a.length, b.length);
            if (len === 0)
                continue;
            let dot = 0, normA = 0, normB = 0;
            for (let k = 0; k < len; k++) {
                dot += a[k] * b[k];
                normA += a[k] ** 2;
                normB += b[k] ** 2;
            }
            const denom = Math.sqrt(normA) * Math.sqrt(normB);
            const cosSim = denom === 0 ? 0 : dot / denom;
            // 余弦距离 = 1 - 余弦相似度，归一化到 [0,2]
            const distance = 1 - cosSim;
            if (distance > threshold) {
                conflictPairs.push([parties[i].id, parties[j].id, distance]);
            }
        }
    }
    return {
        hasConflict: conflictPairs.length > 0,
        conflictPairs,
        provenance: [`[ALG_T1_X_001] parties=${parties.length} conflicts=${conflictPairs.length} threshold=${threshold}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_002 · 冲突强度计算
// ============================================================================
function conflictIntensity(conflict) {
    const { partyA, partyB, issueWeight } = conflict;
    const posA = partyA.position;
    const posB = partyB.position;
    const len = Math.min(posA.length, posB.length);
    if (len === 0) {
        return { intensity: 0, powerAsymmetry: 0, stakeLevel: 0, provenance: ['[ALG_T1_X_002] 空立场'] };
    }
    let sqSum = 0;
    for (let k = 0; k < len; k++)
        sqSum += (posA[k] - posB[k]) ** 2;
    const positionDistance = Math.sqrt(sqSum);
    const totalPower = partyA.power + partyB.power;
    const powerAsymmetry = totalPower === 0 ? 0 : Math.abs(partyA.power - partyB.power) / totalPower;
    const stakeLevel = issueWeight * (partyA.power + partyB.power) / 2;
    const intensity = positionDistance * issueWeight * (1 + powerAsymmetry);
    return {
        intensity,
        powerAsymmetry,
        stakeLevel,
        provenance: [`[ALG_T1_X_002] dist=${positionDistance.toFixed(4)} asymmetry=${powerAsymmetry.toFixed(4)} stake=${stakeLevel.toFixed(4)} intensity=${intensity.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_003 · 矛盾识别（利益冲突矩阵）
// ============================================================================
function contradictionIdentification(parties) {
    if (parties.length < 2) {
        return { contradictions: [], provenance: ['[ALG_T1_X_003] 当事方不足'] };
    }
    const contradictions = [];
    for (let i = 0; i < parties.length; i++) {
        for (let j = i + 1; j < parties.length; j++) {
            const interestsA = new Map(parties[i].interests.map(x => [x.name, x]));
            for (const intB of parties[j].interests) {
                const intA = interestsA.get(intB.name);
                if (!intA)
                    continue;
                // 冲突分 = 权重乘积 * 满足度差异
                const satDiff = Math.abs(intA.satisfaction - intB.satisfaction);
                const weightProduct = intA.weight * intB.weight;
                const conflictScore = satDiff * weightProduct;
                if (conflictScore > 0) {
                    contradictions.push({
                        partyA: parties[i].id,
                        partyB: parties[j].id,
                        interest: intB.name,
                        conflictScore,
                    });
                }
            }
        }
    }
    contradictions.sort((a, b) => b.conflictScore - a.conflictScore);
    return {
        contradictions,
        provenance: [`[ALG_T1_X_003] parties=${parties.length} contradictions=${contradictions.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_004 · 对立统一分析（黑格尔辩证法）
// ============================================================================
function dialecticalAnalysis(thesis, antithesis) {
    if (thesis.strength < 0 || antithesis.strength < 0) {
        return { synthesis: '', integrationScore: 0, residualTension: 0, provenance: ['[ALG_T1_X_004] 强度负值'] };
    }
    // 合成强度 = 双方共同基础 - 差异
    const commonGround = Math.min(thesis.strength, antithesis.strength);
    const difference = Math.abs(thesis.strength - antithesis.strength);
    const integrationScore = commonGround / (commonGround + difference + 0.001);
    const residualTension = difference / (thesis.strength + antithesis.strength + 0.001);
    const synthesis = `合成：保留"${thesis.claim}"与"${antithesis.claim}"的合理内核，扬弃对立`;
    return {
        synthesis,
        integrationScore,
        residualTension,
        provenance: [`[ALG_T1_X_004] thesis=${thesis.strength.toFixed(4)} antithesis=${antithesis.strength.toFixed(4)} integration=${integrationScore.toFixed(4)} tension=${residualTension.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_005 · 冲突调解
// ============================================================================
function conflictMediation(parties, mediatorPower = 0.5) {
    if (parties.length < 2) {
        return { mediationSuccess: false, proposedSettlement: [], convergenceScore: 0, provenance: ['[ALG_T1_X_005] 当事方不足'] };
    }
    const dim = parties[0].position.length;
    if (dim === 0) {
        return { mediationSuccess: false, proposedSettlement: [], convergenceScore: 0, provenance: ['[ALG_T1_X_005] 空立场维度'] };
    }
    // 加权平均立场作为调解方案
    const totalPower = parties.reduce((s, p) => s + p.power, 0);
    const proposedSettlement = new Array(dim).fill(0);
    for (const p of parties) {
        for (let k = 0; k < dim; k++) {
            proposedSettlement[k] += p.position[k] * p.power / totalPower;
        }
    }
    // 计算收敛度：各方到调解方案的平均距离的反数
    let totalDist = 0;
    for (const p of parties) {
        let sqSum = 0;
        for (let k = 0; k < dim; k++)
            sqSum += (p.position[k] - proposedSettlement[k]) ** 2;
        totalDist += Math.sqrt(sqSum);
    }
    const avgDist = totalDist / parties.length;
    const convergenceScore = 1 / (1 + avgDist);
    const mediationSuccess = convergenceScore * mediatorPower > 0.3;
    return {
        mediationSuccess,
        proposedSettlement,
        convergenceScore,
        provenance: [`[ALG_T1_X_005] parties=${parties.length} dim=${dim} convergence=${convergenceScore.toFixed(4)} success=${mediationSuccess}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_006 · 共识寻求
// ============================================================================
function consensusSeeking(positions) {
    if (positions.length === 0) {
        return { consensus: [], agreement: 0, holdouts: [], provenance: ['[ALG_T1_X_006] 空立场'] };
    }
    const dim = positions[0].position.length;
    if (dim === 0) {
        return { consensus: [], agreement: 0, holdouts: [], provenance: ['[ALG_T1_X_006] 空维度'] };
    }
    // 迭代收敛：每轮按灵活性向中心移动
    let current = new Array(dim).fill(0);
    for (let k = 0; k < dim; k++) {
        current[k] = positions.reduce((s, p) => s + p.position[k], 0) / positions.length;
    }
    for (let iter = 0; iter < 10; iter++) {
        const next = new Array(dim).fill(0);
        for (let k = 0; k < dim; k++) {
            let weightedSum = 0;
            let totalWeight = 0;
            for (const p of positions) {
                const weight = 1 / (1 + Math.abs(p.position[k] - current[k]) * p.flexibility);
                weightedSum += p.position[k] * weight;
                totalWeight += weight;
            }
            next[k] = totalWeight === 0 ? current[k] : weightedSum / totalWeight;
        }
        current = next;
    }
    const consensus = current;
    const holdouts = [];
    let totalAgreement = 0;
    for (const p of positions) {
        let sqSum = 0;
        for (let k = 0; k < dim; k++)
            sqSum += (p.position[k] - consensus[k]) ** 2;
        const dist = Math.sqrt(sqSum);
        const agree = 1 / (1 + dist * p.flexibility);
        totalAgreement += agree;
        if (agree < 0.5)
            holdouts.push(p.party);
    }
    const agreement = totalAgreement / positions.length;
    return {
        consensus,
        agreement,
        holdouts,
        provenance: [`[ALG_T1_X_006] parties=${positions.length} dim=${dim} agreement=${agreement.toFixed(4)} holdouts=${holdouts.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_007 · 妥协方案生成
// ============================================================================
function compromiseGeneration(parties, constraints) {
    if (parties.length === 0 || constraints.length === 0) {
        return { compromises: [], feasibility: 0, provenance: ['[ALG_T1_X_007] 空输入'] };
    }
    const dim = Math.min(parties[0].position.length, constraints[0].min.length, constraints[0].max.length);
    if (dim === 0) {
        return { compromises: [], feasibility: 0, provenance: ['[ALG_T1_X_007] 空维度'] };
    }
    const compromises = new Array(dim).fill(0);
    let feasibleCount = 0;
    for (let k = 0; k < dim; k++) {
        // 取各方立场的加权中位数作为妥协
        const weightedPositions = parties
            .map(p => ({ pos: p.position[k] ?? 0, weight: p.power }))
            .sort((a, b) => a.pos - b.pos);
        const totalWeight = weightedPositions.reduce((s, x) => s + x.weight, 0);
        let cumWeight = 0;
        let median = weightedPositions[0].pos;
        for (const wp of weightedPositions) {
            cumWeight += wp.weight;
            if (cumWeight >= totalWeight / 2) {
                median = wp.pos;
                break;
            }
        }
        // 约束到可行域
        const min = constraints[0].min[k];
        const max = constraints[0].max[k];
        const clamped = Math.max(min, Math.min(max, median));
        compromises[k] = clamped;
        if (clamped >= min && clamped <= max)
            feasibleCount++;
    }
    const feasibility = feasibleCount / dim;
    return {
        compromises,
        feasibility,
        provenance: [`[ALG_T1_X_007] parties=${parties.length} dim=${dim} feasibility=${feasibility.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_008 · 冲突升级预测
// ============================================================================
function conflictEscalationPrediction(state) {
    const { currentTension, recentActions, historyEscalationRate } = state;
    if (recentActions.length === 0) {
        return { willEscalate: false, escalationProbability: currentTension, predictedLevel: currentTension, provenance: ['[ALG_T1_X_008] 无近期行为'] };
    }
    const aggressiveActions = recentActions.filter(a => a.aggressive);
    const aggressionRate = aggressiveActions.length / recentActions.length;
    const avgMagnitude = aggressiveActions.length === 0
        ? 0
        : aggressiveActions.reduce((s, a) => s + a.magnitude, 0) / aggressiveActions.length;
    const escalationProbability = Math.min(1, currentTension * 0.4 + aggressionRate * 0.3 + avgMagnitude * 0.2 + historyEscalationRate * 0.1);
    const predictedLevel = Math.min(1, currentTension + escalationProbability * 0.5);
    return {
        willEscalate: escalationProbability > 0.5,
        escalationProbability,
        predictedLevel,
        provenance: [`[ALG_T1_X_008] tension=${currentTension.toFixed(4)} aggression=${aggressionRate.toFixed(4)} magnitude=${avgMagnitude.toFixed(4)} prob=${escalationProbability.toFixed(4)} level=${predictedLevel.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_009 · 冲突降级
// ============================================================================
function conflictDeescalation(state) {
    if (state.deescalationActions.length === 0) {
        return { achievable: false, reducedTension: state.currentTension, actionsTaken: 0, provenance: ['[ALG_T1_X_009] 无降级行动'] };
    }
    // 按效益/成本比排序
    const sorted = [...state.deescalationActions]
        .map(a => ({ ...a, ratio: a.cost === 0 ? a.effectiveness : a.effectiveness / a.cost }))
        .sort((a, b) => b.ratio - a.ratio);
    let remainingBudget = state.budget;
    let reducedTension = state.currentTension;
    let actionsTaken = 0;
    for (const a of sorted) {
        if (a.cost > remainingBudget)
            continue;
        remainingBudget -= a.cost;
        reducedTension = Math.max(0, reducedTension * (1 - a.effectiveness));
        actionsTaken++;
        if (reducedTension < 0.1)
            break;
    }
    return {
        achievable: reducedTension < state.currentTension * 0.5,
        reducedTension,
        actionsTaken,
        provenance: [`[ALG_T1_X_009] init=${state.currentTension.toFixed(4)} reduced=${reducedTension.toFixed(4)} actions=${actionsTaken} budget=${state.budget}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_010 · 多方博弈均衡
// ============================================================================
function multiPartyGameEquilibrium(players) {
    if (players.length === 0) {
        return { equilibriumStrategy: null, equilibriumPayoff: 0, stable: false, provenance: ['[ALG_T1_X_010] 无玩家'] };
    }
    // 简化：寻找最大化最小收益的策略（最大最小原则）
    let bestStrategy = null;
    let bestPayoff = -Infinity;
    const allStrategies = new Set();
    for (const p of players)
        for (const s of p.strategies)
            allStrategies.add(s.name);
    for (const stratName of allStrategies) {
        let minPayoff = Infinity;
        let totalPayoff = 0;
        let count = 0;
        for (const p of players) {
            const strat = p.strategies.find(s => s.name === stratName);
            if (strat) {
                minPayoff = Math.min(minPayoff, strat.payoff);
                totalPayoff += strat.payoff;
                count++;
            }
        }
        if (count > 0 && minPayoff > bestPayoff) {
            bestPayoff = minPayoff;
            bestStrategy = stratName;
        }
    }
    const avgPayoff = bestStrategy ? bestPayoff : 0;
    const stable = avgPayoff > 0;
    return {
        equilibriumStrategy: bestStrategy,
        equilibriumPayoff: avgPayoff,
        stable,
        provenance: [`[ALG_T1_X_010] players=${players.length} strategy="${bestStrategy}" payoff=${avgPayoff.toFixed(4)} stable=${stable}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_011 · 帕累托改进
// ============================================================================
function paretoImprovement(current, alternatives) {
    if (alternatives.length === 0 || current.length === 0) {
        return { improvementFound: false, bestAlternative: -1, improvements: [], provenance: ['[ALG_T1_X_011] 空输入'] };
    }
    const currentMap = new Map(current.map(c => [c.party, c.utility]));
    let bestAlt = -1;
    let bestTotalGain = -Infinity;
    let bestImprovements = [];
    for (let i = 0; i < alternatives.length; i++) {
        const alt = alternatives[i];
        const altMap = new Map(alt.map(a => [a.party, a.utility]));
        let allBetterOrEqual = true;
        let totalGain = 0;
        const improvements = [];
        for (const [party, currUtil] of currentMap) {
            const altUtil = altMap.get(party);
            if (altUtil === undefined) {
                allBetterOrEqual = false;
                break;
            }
            const gain = altUtil - currUtil;
            if (gain < 0) {
                allBetterOrEqual = false;
                break;
            }
            totalGain += gain;
            if (gain > 0)
                improvements.push({ party, gain });
        }
        if (allBetterOrEqual && improvements.length > 0 && totalGain > bestTotalGain) {
            bestTotalGain = totalGain;
            bestAlt = i;
            bestImprovements = improvements;
        }
    }
    return {
        improvementFound: bestAlt >= 0,
        bestAlternative: bestAlt,
        improvements: bestImprovements,
        provenance: [`[ALG_T1_X_011] alternatives=${alternatives.length} found=${bestAlt >= 0} totalGain=${bestTotalGain.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_012 · 纳什均衡检测
// ============================================================================
function nashEquilibrium(payoffMatrix) {
    if (payoffMatrix.length === 0 || payoffMatrix[0].length === 0) {
        return { equilibria: [], pureStrategyFound: false, provenance: ['[ALG_T1_X_012] 空收益矩阵'] };
    }
    const rows = payoffMatrix.length;
    const cols = payoffMatrix[0].length;
    const equilibria = [];
    // 对每个单元格，检查是否为行玩家和列玩家的最佳响应
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = payoffMatrix[r][c];
            // 行玩家是否最佳响应（在列 c 下，行玩家收益最大）
            let rowBest = true;
            for (let r2 = 0; r2 < rows; r2++) {
                if (payoffMatrix[r2][c].rowPlayer > cell.rowPlayer) {
                    rowBest = false;
                    break;
                }
            }
            // 列玩家是否最佳响应（在行 r 下，列玩家收益最大）
            let colBest = true;
            for (let c2 = 0; c2 < cols; c2++) {
                if (payoffMatrix[r][c2].colPlayer > cell.colPlayer) {
                    colBest = false;
                    break;
                }
            }
            if (rowBest && colBest)
                equilibria.push([r, c]);
        }
    }
    return {
        equilibria,
        pureStrategyFound: equilibria.length > 0,
        provenance: [`[ALG_T1_X_012] rows=${rows} cols=${cols} equilibria=${equilibria.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_013 · 零和检测
// ============================================================================
function zeroSumDetection(payoffMatrix) {
    if (payoffMatrix.length === 0 || payoffMatrix[0].length === 0) {
        return { isZeroSum: false, sumVariance: 0, skewness: 0, provenance: ['[ALG_T1_X_013] 空收益矩阵'] };
    }
    const sums = [];
    let totalSum = 0;
    for (const row of payoffMatrix) {
        for (const cell of row) {
            const s = cell.rowPlayer + cell.colPlayer;
            sums.push(s);
            totalSum += s;
        }
    }
    const mean = totalSum / sums.length;
    let variance = 0;
    for (const s of sums)
        variance += (s - mean) ** 2;
    variance /= sums.length;
    const std = Math.sqrt(variance);
    let skewSum = 0;
    for (const s of sums)
        skewSum += std === 0 ? 0 : ((s - mean) / std) ** 3;
    const skewness = sums.length === 0 ? 0 : skewSum / sums.length;
    return {
        isZeroSum: Math.abs(mean) < 1e-6 && variance < 1e-6,
        sumVariance: variance,
        skewness,
        provenance: [`[ALG_T1_X_013] cells=${sums.length} mean=${mean.toFixed(4)} var=${variance.toFixed(4)} zeroSum=${Math.abs(mean) < 1e-6 && variance < 1e-6}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_014 · 双赢策略
// ============================================================================
function winWinStrategy(parties, resourcePool) {
    if (parties.length === 0 || resourcePool.length === 0) {
        return { allocations: [], totalUtility: 0, provenance: ['[ALG_T1_X_014] 空输入'] };
    }
    // 按各方权力比例分配可分资源，不可分资源分给权力最大方
    const totalPower = parties.reduce((s, p) => s + p.power, 0);
    const sortedParties = [...parties].sort((a, b) => b.power - a.power);
    const allocations = parties.map(p => ({ party: p.id, resources: [] }));
    const partyMap = new Map(allocations.map(a => [a.party, a]));
    let totalUtility = 0;
    for (const res of resourcePool) {
        if (res.divisible && totalPower > 0) {
            for (const p of parties) {
                const share = res.amount * p.power / totalPower;
                partyMap.get(p.id).resources.push({ name: res.name, amount: share });
                totalUtility += share * p.power;
            }
        }
        else {
            partyMap.get(sortedParties[0].id).resources.push({ name: res.name, amount: res.amount });
            totalUtility += res.amount * sortedParties[0].power;
        }
    }
    return {
        allocations,
        totalUtility,
        provenance: [`[ALG_T1_X_014] parties=${parties.length} resources=${resourcePool.length} totalUtility=${totalUtility.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_X_015 · 冲突溯源
// ============================================================================
function conflictProvenance(conflict) {
    if (conflict.rootCauses.length === 0) {
        return { rootCause: null, depthDistribution: {}, traceability: 0, provenance: ['[ALG_T1_X_015] 无根因'] };
    }
    const depthDistribution = {};
    let weightedTop = null;
    let totalWeight = 0;
    for (const rc of conflict.rootCauses) {
        depthDistribution[rc.depth] = (depthDistribution[rc.depth] ?? 0) + 1;
        const score = rc.weight / (rc.depth + 1);
        totalWeight += rc.weight;
        if (!weightedTop || score > weightedTop.score) {
            weightedTop = { cause: rc.cause, score };
        }
    }
    const maxDepth = Math.max(...Object.keys(depthDistribution).map(Number));
    const traceability = totalWeight === 0 ? 0 : Math.min(1, conflict.rootCauses.length / (maxDepth + 1) * (totalWeight / (conflict.rootCauses.length * 10)));
    return {
        rootCause: weightedTop?.cause ?? null,
        depthDistribution,
        traceability: Math.max(0, Math.min(1, traceability)),
        provenance: [`[ALG_T1_X_015] parties=${conflict.parties.length} causes=${conflict.rootCauses.length} root="${weightedTop?.cause ?? 'none'}" traceability=${traceability.toFixed(4)}`],
    };
}
