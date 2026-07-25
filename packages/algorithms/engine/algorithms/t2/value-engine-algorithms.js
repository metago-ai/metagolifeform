"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 价值引擎封装类（ALG_T2_V_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 21~40 项（价值引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 value-engine 相关引擎的私有辅助方法
 *   - 处理 DCV 六维价值、行为银行、价值流、多利益相关者平衡
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dcvWeightedAggregate = dcvWeightedAggregate;
exports.valueFlowTrace = valueFlowTrace;
exports.stakeholderBalance = stakeholderBalance;
exports.valueBankReconcile = valueBankReconcile;
exports.valueDecayModel = valueDecayModel;
exports.valueRiskMatrix = valueRiskMatrix;
exports.valueAttribution = valueAttribution;
exports.valueExponentialSmoothing = valueExponentialSmoothing;
exports.valueBenchmark = valueBenchmark;
exports.valueHealthIndex = valueHealthIndex;
exports.valueArbitration = valueArbitration;
exports.valueLock = valueLock;
exports.valueAuditChain = valueAuditChain;
exports.valueDensityAnalysis = valueDensityAnalysis;
exports.valueOptimizationSuggest = valueOptimizationSuggest;
exports.valueEquity = valueEquity;
exports.valueLifecycle = valueLifecycle;
exports.valueCoupling = valueCoupling;
exports.valueNPV = valueNPV;
exports.valueComprehensiveRating = valueComprehensiveRating;
// ============================================================================
// ALG_T2_V_001 · DCV 六维加权聚合（引擎级）
// ============================================================================
function dcvWeightedAggregate(dimensions, confidence = 1) {
    if (dimensions.length === 0) {
        return { total: 0, grade: 'F', perDim: {}, provenance: ['[ALG_T2_V_001] 空维度'] };
    }
    const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
    if (totalWeight === 0) {
        return { total: 0, grade: 'F', perDim: {}, provenance: ['[ALG_T2_V_001] 权重为零'] };
    }
    const perDim = {};
    let weighted = 0;
    for (const d of dimensions) {
        const contribution = (d.score * d.weight) / totalWeight;
        perDim[d.name] = contribution;
        weighted += contribution;
    }
    const total = weighted * confidence;
    const grade = total >= 0.9 ? 'A' : total >= 0.8 ? 'B' : total >= 0.7 ? 'C' : total >= 0.6 ? 'D' : 'F';
    return {
        total,
        grade,
        perDim,
        provenance: [`[ALG_T2_V_001] total=${total.toFixed(4)} conf=${confidence.toFixed(2)} grade=${grade}`],
    };
}
// ============================================================================
// ALG_T2_V_002 · 价值流追踪
// ============================================================================
function valueFlowTrace(flows, entity) {
    let inflow = 0, outflow = 0;
    const byDim = {};
    for (const f of flows) {
        if (f.to === entity) {
            inflow += f.amount;
            byDim[f.dimension] = (byDim[f.dimension] || 0) + f.amount;
        }
        else if (f.from === entity) {
            outflow += f.amount;
            byDim[f.dimension] = (byDim[f.dimension] || 0) - f.amount;
        }
    }
    return {
        inflow,
        outflow,
        net: inflow - outflow,
        byDim,
        provenance: [`[ALG_T2_V_002] in=${inflow.toFixed(4)} out=${outflow.toFixed(4)} net=${(inflow - outflow).toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_V_003 · 多利益相关者价值平衡
// ============================================================================
function stakeholderBalance(stakeholders) {
    if (stakeholders.length === 0) {
        return { balance: 0, dominant: '', conflicts: [], provenance: ['[ALG_T2_V_003] 无利益方'] };
    }
    const totals = stakeholders.map(s => ({
        name: s.stakeholder,
        total: Object.values(s.dimensions).reduce((a, b) => a + b, 0),
    }));
    const sum = totals.reduce((s, t) => s + t.total, 0);
    const mean = sum / totals.length;
    const variance = totals.reduce((s, t) => s + (t.total - mean) ** 2, 0) / totals.length;
    const balance = 1 - Math.sqrt(variance) / (mean + 1e-9);
    const dominant = totals.reduce((a, b) => (a.total > b.total ? a : b)).name;
    const conflicts = [];
    for (let i = 0; i < stakeholders.length; i++) {
        for (let j = i + 1; j < stakeholders.length; j++) {
            for (const dim of Object.keys(stakeholders[i].dimensions)) {
                const a = stakeholders[i].dimensions[dim];
                const b = stakeholders[j].dimensions[dim];
                if (Math.abs(a - b) > 0.5) {
                    conflicts.push(`${stakeholders[i].stakeholder}↔${stakeholders[j].stakeholder}:${dim}`);
                }
            }
        }
    }
    return {
        balance,
        dominant,
        conflicts,
        provenance: [`[ALG_T2_V_003] bal=${balance.toFixed(4)} dom=${dominant} conflicts=${conflicts.length}`],
    };
}
// ============================================================================
// ALG_T2_V_004 · 价值银行对账
// ============================================================================
function valueBankReconcile(deposits, withdrawals) {
    const depositIds = new Set(deposits.map(d => d.id));
    const withdrawalIds = new Set(withdrawals.map(w => w.id));
    const discrepancies = [];
    for (const d of deposits) {
        if (!withdrawalIds.has(d.id) && d.amount > 0) {
            discrepancies.push(`unmatched_deposit:${d.id}`);
        }
    }
    for (const w of withdrawals) {
        if (!depositIds.has(w.id) && w.amount > 0) {
            discrepancies.push(`unmatched_withdrawal:${w.id}`);
        }
    }
    const totalDep = deposits.reduce((s, d) => s + d.amount, 0);
    const totalWd = withdrawals.reduce((s, w) => s + w.amount, 0);
    const net = totalDep - totalWd;
    return {
        net,
        balanced: discrepancies.length === 0 && Math.abs(net) < 1e-6,
        discrepancies,
        provenance: [`[ALG_T2_V_004] dep=${totalDep.toFixed(4)} wd=${totalWd.toFixed(4)} disc=${discrepancies.length}`],
    };
}
// ============================================================================
// ALG_T2_V_005 · 价值衰减建模
// ============================================================================
function valueDecayModel(initialValue, decayRate, timeSteps) {
    if (decayRate <= 0 || decayRate >= 1 || timeSteps <= 0) {
        return { values: [], halfLife: 0, provenance: ['[ALG_T2_V_005] 参数无效'] };
    }
    const values = [];
    let current = initialValue;
    for (let t = 0; t < timeSteps; t++) {
        values.push(current);
        current *= (1 - decayRate);
    }
    const halfLife = Math.log(0.5) / Math.log(1 - decayRate);
    return {
        values,
        halfLife,
        provenance: [`[ALG_T2_V_005] init=${initialValue} rate=${decayRate} halfLife=${halfLife.toFixed(2)}`],
    };
}
// ============================================================================
// ALG_T2_V_006 · 价值风险评估
// ============================================================================
function valueRiskMatrix(items) {
    if (items.length === 0) {
        return { risks: [], total: 0, provenance: ['[ALG_T2_V_006] 空风险项'] };
    }
    const risks = items.map(it => {
        const score = it.probability * it.impact;
        const level = score >= 0.7 ? 'critical' : score >= 0.4 ? 'high' : score >= 0.2 ? 'medium' : 'low';
        return { name: it.name, score, level };
    });
    const total = risks.reduce((s, r) => s + r.score, 0);
    return {
        risks,
        total,
        provenance: [`[ALG_T2_V_006] n=${risks.length} total=${total.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_V_007 · 价值贡献归因
// ============================================================================
function valueAttribution(finalValue, contributors) {
    if (contributors.length === 0) {
        return { attributed: [], residual: finalValue, provenance: ['[ALG_T2_V_007] 无贡献者'] };
    }
    const totalContribution = contributors.reduce((s, c) => s + c.contribution, 0);
    if (totalContribution === 0) {
        return { attributed: [], residual: finalValue, provenance: ['[ALG_T2_V_007] 贡献为零'] };
    }
    const attributed = contributors.map(c => {
        const share = (c.contribution / totalContribution) * finalValue;
        return { name: c.name, share, percentage: c.contribution / totalContribution };
    });
    const attributedTotal = attributed.reduce((s, a) => s + a.share, 0);
    const residual = finalValue - attributedTotal;
    return {
        attributed,
        residual,
        provenance: [`[ALG_T2_V_007] final=${finalValue.toFixed(4)} attr=${attributedTotal.toFixed(4)} res=${residual.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_V_008 · 价值趋势预测（指数平滑）
// ============================================================================
function valueExponentialSmoothing(history, alpha = 0.3, horizon = 3) {
    if (history.length === 0 || alpha <= 0 || alpha > 1) {
        return { smoothed: [], forecast: [], provenance: ['[ALG_T2_V_008] 参数无效'] };
    }
    const smoothed = [history[0]];
    for (let i = 1; i < history.length; i++) {
        const s = alpha * history[i] + (1 - alpha) * smoothed[i - 1];
        smoothed.push(s);
    }
    const forecast = [];
    const lastSmoothed = smoothed[smoothed.length - 1];
    for (let i = 0; i < horizon; i++) {
        forecast.push(lastSmoothed);
    }
    return {
        smoothed,
        forecast,
        provenance: [`[ALG_T2_V_008] n=${history.length} α=${alpha} horizon=${horizon}`],
    };
}
// ============================================================================
// ALG_T2_V_009 · 价值基准对比
// ============================================================================
function valueBenchmark(actual, benchmark, tolerance = 0.05) {
    if (benchmark === 0) {
        return { deviation: 0, ratio: 0, status: 'on-par', provenance: ['[ALG_T2_V_009] 基准为零'] };
    }
    const deviation = actual - benchmark;
    const ratio = actual / benchmark;
    let status;
    if (deviation > tolerance * benchmark)
        status = 'above';
    else if (deviation < -tolerance * benchmark)
        status = 'below';
    else
        status = 'on-par';
    return {
        deviation,
        ratio,
        status,
        provenance: [`[ALG_T2_V_009] actual=${actual.toFixed(4)} bench=${benchmark.toFixed(4)} status=${status}`],
    };
}
// ============================================================================
// ALG_T2_V_010 · 价值健康度指数
// ============================================================================
function valueHealthIndex(metrics) {
    const index = (metrics.growth * 0.3 + metrics.stability * 0.3 + metrics.coverage * 0.2 + metrics.efficiency * 0.2);
    const status = index >= 0.8 ? 'excellent' : index >= 0.6 ? 'good' : index >= 0.4 ? 'fair' : 'poor';
    return {
        index,
        status,
        provenance: [`[ALG_T2_V_010] idx=${index.toFixed(4)} status=${status}`],
    };
}
// ============================================================================
// ALG_T2_V_011 · 价值冲突仲裁
// ============================================================================
function valueArbitration(claimants, totalAvailable) {
    if (claimants.length === 0) {
        return { allocation: [], satisfied: true, provenance: ['[ALG_T2_V_011] 无申请人'] };
    }
    const totalClaim = claimants.reduce((s, c) => s + c.claim, 0);
    if (totalClaim <= totalAvailable) {
        return {
            allocation: claimants.map(c => ({ name: c.name, amount: c.claim })),
            satisfied: true,
            provenance: [`[ALG_T2_V_011] 全额满足 claim=${totalClaim.toFixed(4)} avail=${totalAvailable.toFixed(4)}`],
        };
    }
    const totalPriority = claimants.reduce((s, c) => s + c.priority, 0);
    const allocation = claimants.map(c => ({
        name: c.name,
        amount: (c.priority / totalPriority) * totalAvailable,
    }));
    return {
        allocation,
        satisfied: false,
        provenance: [`[ALG_T2_V_011] 按优先级分配 claim=${totalClaim.toFixed(4)} avail=${totalAvailable.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_V_012 · 价值锁定（防篡改）
// ============================================================================
function valueLock(value, signature, timestamp) {
    const hash = simpleHash(`${value}|${signature}|${timestamp}`);
    return {
        locked: true,
        hash,
        provenance: [`[ALG_T2_V_012] hash=${hash} ts=${timestamp}`],
    };
}
function simpleHash(input) {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
        h = ((h << 5) - h + input.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(16).padStart(8, '0');
}
// ============================================================================
// ALG_T2_V_013 · 价值审计追溯
// ============================================================================
function valueAuditChain(events) {
    if (events.length === 0) {
        return { chain: [], totalDelta: 0, integrity: true, provenance: ['[ALG_T2_V_013] 空事件'] };
    }
    const chain = [];
    let prevHash = 'genesis';
    let totalDelta = 0;
    for (const ev of events) {
        const block = `${prevHash}|${ev.action}|${ev.valueDelta}|${ev.timestamp}|${ev.actor}`;
        const hash = simpleHash(block);
        chain.push(hash);
        prevHash = hash;
        totalDelta += ev.valueDelta;
    }
    // 完整性检查：每个 hash 都基于前一个 hash
    let integrity = true;
    let check = 'genesis';
    for (let i = 0; i < events.length; i++) {
        const block = `${check}|${events[i].action}|${events[i].valueDelta}|${events[i].timestamp}|${events[i].actor}`;
        const expected = simpleHash(block);
        if (expected !== chain[i]) {
            integrity = false;
            break;
        }
        check = chain[i];
    }
    return {
        chain,
        totalDelta,
        integrity,
        provenance: [`[ALG_T2_V_013] blocks=${chain.length} delta=${totalDelta.toFixed(4)} integrity=${integrity}`],
    };
}
// ============================================================================
// ALG_T2_V_014 · 价值密度分析
// ============================================================================
function valueDensityAnalysis(values, windowSize) {
    if (windowSize <= 0 || values.length < windowSize) {
        return { densities: [], peak: 0, peakIndex: -1, provenance: ['[ALG_T2_V_014] 参数无效'] };
    }
    const densities = [];
    for (let i = 0; i + windowSize <= values.length; i++) {
        const window = values.slice(i, i + windowSize);
        const sum = window.reduce((s, x) => s + x, 0);
        densities.push(sum / windowSize);
    }
    let peak = -Infinity, peakIndex = -1;
    for (let i = 0; i < densities.length; i++) {
        if (densities[i] > peak) {
            peak = densities[i];
            peakIndex = i;
        }
    }
    return {
        densities,
        peak,
        peakIndex,
        provenance: [`[ALG_T2_V_014] windows=${densities.length} peak=${peak.toFixed(4)}@${peakIndex}`],
    };
}
// ============================================================================
// ALG_T2_V_015 · 价值优化建议
// ============================================================================
function valueOptimizationSuggest(current, targets) {
    const suggestions = [];
    for (const dim of Object.keys(targets)) {
        const cur = current[dim] || 0;
        const tgt = targets[dim];
        const gap = tgt - cur;
        if (gap > 0) {
            const action = gap > 0.3 ? 'major_boost' : gap > 0.1 ? 'moderate_boost' : 'fine_tune';
            suggestions.push({ dim, gap, action });
        }
    }
    suggestions.sort((a, b) => b.gap - a.gap);
    const priority = suggestions.length > 0 ? suggestions[0].dim : 'none';
    return {
        suggestions,
        priority,
        provenance: [`[ALG_T2_V_015] suggestions=${suggestions.length} priority=${priority}`],
    };
}
// ============================================================================
// ALG_T2_V_016 · 价值权益计算
// ============================================================================
function valueEquity(totalValue, shares) {
    const totalPct = shares.reduce((s, x) => s + x.percentage, 0);
    if (totalPct === 0) {
        return { equity: [], total: 0, provenance: ['[ALG_T2_V_016] 百分比为零'] };
    }
    const equity = shares.map(s => ({
        holder: s.holder,
        amount: totalValue * (s.percentage / totalPct),
    }));
    const total = equity.reduce((s, e) => s + e.amount, 0);
    return {
        equity,
        total,
        provenance: [`[ALG_T2_V_016] total=${total.toFixed(4)} holders=${equity.length}`],
    };
}
// ============================================================================
// ALG_T2_V_017 · 价值生命周期
// ============================================================================
function valueLifecycle(stages) {
    if (stages.length === 0) {
        return { totalValue: 0, totalDuration: 0, peakStage: '', provenance: ['[ALG_T2_V_017] 空阶段'] };
    }
    let totalValue = 0, totalDuration = 0;
    let peakValue = -Infinity, peakStage = '';
    for (const s of stages) {
        const stageValue = s.duration * s.valueRate;
        totalValue += stageValue;
        totalDuration += s.duration;
        if (stageValue > peakValue) {
            peakValue = stageValue;
            peakStage = s.name;
        }
    }
    return {
        totalValue,
        totalDuration,
        peakStage,
        provenance: [`[ALG_T2_V_017] value=${totalValue.toFixed(4)} dur=${totalDuration} peak=${peakStage}`],
    };
}
// ============================================================================
// ALG_T2_V_018 · 价值耦合度（价值与价值的耦合）
// ============================================================================
function valueCoupling(valueA, valueB) {
    const keysA = Object.keys(valueA);
    const keysB = Object.keys(valueB);
    const shared = keysA.filter(k => keysB.includes(k));
    if (shared.length === 0) {
        return { coupling: 0, sharedDimensions: [], provenance: ['[ALG_T2_V_018] 无共享维度'] };
    }
    let dot = 0, normA = 0, normB = 0;
    for (const k of shared) {
        dot += valueA[k] * valueB[k];
        normA += valueA[k] ** 2;
        normB += valueB[k] ** 2;
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    const coupling = denom === 0 ? 0 : dot / denom;
    return {
        coupling,
        sharedDimensions: shared,
        provenance: [`[ALG_T2_V_018] coupling=${coupling.toFixed(4)} shared=${shared.length}`],
    };
}
// ============================================================================
// ALG_T2_V_019 · 价值净现值
// ============================================================================
function valueNPV(cashflows, discountRate) {
    if (discountRate <= -1) {
        return { npv: 0, profitable: false, provenance: ['[ALG_T2_V_019] 折现率无效'] };
    }
    let npv = 0;
    for (const cf of cashflows) {
        npv += cf.amount / Math.pow(1 + discountRate, cf.time);
    }
    return {
        npv,
        profitable: npv > 0,
        provenance: [`[ALG_T2_V_019] npv=${npv.toFixed(4)} rate=${discountRate} profitable=${npv > 0}`],
    };
}
// ============================================================================
// ALG_T2_V_020 · 价值综合评级
// ============================================================================
function valueComprehensiveRating(metrics) {
    const rating = metrics.absolute * 0.25 +
        metrics.relative * 0.25 +
        metrics.trend * 0.2 +
        (1 - metrics.risk) * 0.15 +
        metrics.sustainability * 0.15;
    let tier;
    if (rating >= 0.95)
        tier = 'platinum';
    else if (rating >= 0.85)
        tier = 'gold';
    else if (rating >= 0.7)
        tier = 'silver';
    else if (rating >= 0.5)
        tier = 'bronze';
    else
        tier = 'iron';
    return {
        rating,
        tier,
        provenance: [`[ALG_T2_V_020] rating=${rating.toFixed(4)} tier=${tier}`],
    };
}
