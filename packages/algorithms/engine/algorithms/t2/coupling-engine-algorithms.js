"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 耦生度引擎封装类（ALG_T2_C_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 1~20 项（耦生度引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 coupling-engine.ts 的私有辅助方法
 *   - 处理多源耦生数据、动态耦生状态、跨层耦生（碳基/硅基/比特）
 *   - 比 T1 基础算法更高阶、面向引擎调度场景
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.trilayerCoupling = trilayerCoupling;
exports.buildCouplingGraph = buildCouplingGraph;
exports.couplingCentrality = couplingCentrality;
exports.couplingShortestPath = couplingShortestPath;
exports.couplingStateTransition = couplingStateTransition;
exports.couplingStability = couplingStability;
exports.couplingResonance = couplingResonance;
exports.couplingEntropy = couplingEntropy;
exports.couplingDecay = couplingDecay;
exports.couplingEnhance = couplingEnhance;
exports.couplingRiskAlert = couplingRiskAlert;
exports.couplingCommunity = couplingCommunity;
exports.couplingSymmetrize = couplingSymmetrize;
exports.couplingDistribution = couplingDistribution;
exports.couplingHierarchicalAggregate = couplingHierarchicalAggregate;
exports.couplingGini = couplingGini;
exports.couplingForecast = couplingForecast;
exports.couplingAnomalyInjection = couplingAnomalyInjection;
exports.couplingPropagation = couplingPropagation;
exports.couplingComprehensiveAssessment = couplingComprehensiveAssessment;
// ============================================================================
// ALG_T2_C_001 · 三元耦生度计算（碳基 × 硅基 × 比特）
// ============================================================================
function trilayerCoupling(carbon, silicon, bit) {
    if (carbon < 0 || silicon < 0 || bit < 0) {
        return { score: 0, layer: 'invalid', provenance: ['[ALG_T2_C_001] 负值输入'] };
    }
    const geomean = Math.cbrt(carbon * silicon * bit);
    const arithmetic = (carbon + silicon + bit) / 3;
    const score = geomean * 0.6 + arithmetic * 0.4;
    const dominant = Math.max(carbon, silicon, bit);
    const layer = dominant === carbon ? 'carbon-led' : dominant === silicon ? 'silicon-led' : 'bit-led';
    return {
        score,
        layer,
        provenance: [`[ALG_T2_C_001] geo=${geomean.toFixed(4)} arith=${arithmetic.toFixed(4)} dom=${layer}`],
    };
}
// ============================================================================
// ALG_T2_C_002 · 耦生图构建
// ============================================================================
function buildCouplingGraph(nodes, scoreFn, threshold = 0.1) {
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const score = scoreFn(nodes[i], nodes[j]);
            if (score >= threshold) {
                edges.push({ from: nodes[i].id, to: nodes[j].id, score, bidirectional: true });
            }
        }
    }
    return {
        nodes,
        edges,
        provenance: [`[ALG_T2_C_002] nodes=${nodes.length} edges=${edges.length} threshold=${threshold}`],
    };
}
// ============================================================================
// ALG_T2_C_003 · 耦生图中心性（度中心性）
// ============================================================================
function couplingCentrality(graph) {
    const centrality = new Map();
    for (const node of graph.nodes)
        centrality.set(node.id, 0);
    for (const edge of graph.edges) {
        centrality.set(edge.from, (centrality.get(edge.from) || 0) + edge.score);
        centrality.set(edge.to, (centrality.get(edge.to) || 0) + edge.score);
    }
    let hub = '';
    let max = -Infinity;
    for (const [id, c] of centrality) {
        if (c > max) {
            max = c;
            hub = id;
        }
    }
    return {
        centrality,
        hub,
        provenance: [`[ALG_T2_C_003] hub=${hub} score=${max.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_C_004 · 耦生路径搜索（Dijkstra）
// ============================================================================
function couplingShortestPath(graph, source, target) {
    if (!graph.nodes.find(n => n.id === source) || !graph.nodes.find(n => n.id === target)) {
        return { path: [], distance: Infinity, provenance: ['[ALG_T2_C_004] 节点不存在'] };
    }
    const dist = new Map();
    const prev = new Map();
    const visited = new Set();
    for (const node of graph.nodes) {
        dist.set(node.id, Infinity);
        prev.set(node.id, null);
    }
    dist.set(source, 0);
    const adj = new Map();
    for (const node of graph.nodes)
        adj.set(node.id, []);
    for (const edge of graph.edges) {
        const w = 1 - edge.score; // 高耦生 = 低距离
        adj.get(edge.from).push({ to: edge.to, w });
        if (edge.bidirectional)
            adj.get(edge.to).push({ to: edge.from, w });
    }
    while (visited.size < graph.nodes.length) {
        let cur = '';
        let min = Infinity;
        for (const [id, d] of dist) {
            if (!visited.has(id) && d < min) {
                min = d;
                cur = id;
            }
        }
        if (!cur || cur === target)
            break;
        visited.add(cur);
        for (const { to, w } of adj.get(cur) || []) {
            if (visited.has(to))
                continue;
            const alt = dist.get(cur) + w;
            if (alt < dist.get(to)) {
                dist.set(to, alt);
                prev.set(to, cur);
            }
        }
    }
    if (dist.get(target) === Infinity) {
        return { path: [], distance: Infinity, provenance: [`[ALG_T2_C_004] 无路径 ${source}→${target}`] };
    }
    const path = [];
    let cur = target;
    while (cur) {
        path.unshift(cur);
        cur = prev.get(cur) || null;
    }
    return {
        path,
        distance: dist.get(target),
        provenance: [`[ALG_T2_C_004] ${source}→${target} hops=${path.length} d=${dist.get(target).toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_C_005 · 耦生状态机转移
// ============================================================================
function couplingStateTransition(current, history, thresholds) {
    const prev = history.length > 0 ? history[history.length - 1] : current;
    const velocity = current - prev;
    const trend = velocity > 0.01 ? 'rising' : velocity < -0.01 ? 'falling' : 'stable';
    let nextState;
    if (current <= 0)
        nextState = 'decoupled';
    else if (current < thresholds.low)
        nextState = 'weak';
    else if (current < thresholds.mid)
        nextState = 'moderate';
    else if (current < thresholds.high)
        nextState = 'strong';
    else
        nextState = 'superconductive';
    return {
        current,
        previous: prev,
        velocity,
        trend,
        nextState,
        provenance: [`[ALG_T2_C_005] cur=${current.toFixed(4)} vel=${velocity.toFixed(4)} state=${nextState}`],
    };
}
// ============================================================================
// ALG_T2_C_006 · 耦生稳定性评估（变异系数）
// ============================================================================
function couplingStability(samples) {
    if (samples.length < 2) {
        return { cv: 0, stable: false, provenance: ['[ALG_T2_C_006] 样本不足'] };
    }
    const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
    if (mean === 0) {
        return { cv: 0, stable: true, provenance: [`[ALG_T2_C_006] mean=0 stable=true`] };
    }
    const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / samples.length;
    const cv = Math.sqrt(variance) / Math.abs(mean);
    return {
        cv,
        stable: cv < 0.15,
        provenance: [`[ALG_T2_C_006] mean=${mean.toFixed(4)} cv=${cv.toFixed(4)} stable=${cv < 0.15}`],
    };
}
// ============================================================================
// ALG_T2_C_007 · 耦生共振检测
// ============================================================================
function couplingResonance(signalA, signalB) {
    const n = Math.min(signalA.length, signalB.length);
    if (n < 2) {
        return { resonance: 0, phaseLag: 0, provenance: ['[ALG_T2_C_007] 信号过短'] };
    }
    let bestRes = -1;
    let bestLag = 0;
    for (let lag = 0; lag < n; lag++) {
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i + lag < n; i++) {
            dot += signalA[i] * signalB[i + lag];
            normA += signalA[i] ** 2;
            normB += signalB[i + lag] ** 2;
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        const res = denom === 0 ? 0 : dot / denom;
        if (res > bestRes) {
            bestRes = res;
            bestLag = lag;
        }
    }
    return {
        resonance: bestRes,
        phaseLag: bestLag,
        provenance: [`[ALG_T2_C_007] res=${bestRes.toFixed(4)} lag=${bestLag}`],
    };
}
// ============================================================================
// ALG_T2_C_008 · 耦生熵（图熵）
// ============================================================================
function couplingEntropy(graph) {
    if (graph.edges.length === 0) {
        return { entropy: 0, diversity: 0, provenance: ['[ALG_T2_C_008] 空图'] };
    }
    const total = graph.edges.reduce((s, e) => s + e.score, 0);
    if (total === 0) {
        return { entropy: 0, diversity: 0, provenance: ['[ALG_T2_C_008] 总权重为零'] };
    }
    let entropy = 0;
    for (const edge of graph.edges) {
        const p = edge.score / total;
        if (p > 0)
            entropy -= p * Math.log2(p);
    }
    const maxEntropy = Math.log2(graph.edges.length);
    const diversity = maxEntropy === 0 ? 0 : entropy / maxEntropy;
    return {
        entropy,
        diversity,
        provenance: [`[ALG_T2_C_008] H=${entropy.toFixed(4)} D=${diversity.toFixed(4)} max=${maxEntropy.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_C_009 · 耦生衰减模型
// ============================================================================
function couplingDecay(initial, halfLifeMs, elapsedMs) {
    if (halfLifeMs <= 0) {
        return { current: initial, remaining: 1, provenance: ['[ALG_T2_C_009] 半衰期无效'] };
    }
    const remaining = Math.pow(0.5, elapsedMs / halfLifeMs);
    const current = initial * remaining;
    return {
        current,
        remaining,
        provenance: [`[ALG_T2_C_009] init=${initial.toFixed(4)} cur=${current.toFixed(4)} rem=${(remaining * 100).toFixed(2)}%`],
    };
}
// ============================================================================
// ALG_T2_C_010 · 耦生增强策略
// ============================================================================
function couplingEnhance(current, target, strategies) {
    if (strategies.length === 0) {
        return { recommended: 'none', projectedGain: 0, provenance: ['[ALG_T2_C_010] 无策略'] };
    }
    const gap = target - current;
    if (gap <= 0) {
        return { recommended: 'maintain', projectedGain: 0, provenance: [`[ALG_T2_C_010] 已达标 gap=${gap.toFixed(4)}`] };
    }
    let best = strategies[0];
    for (const s of strategies) {
        if (s.effectiveness > best.effectiveness)
            best = s;
    }
    const projectedGain = best.effectiveness * gap;
    return {
        recommended: best.name,
        projectedGain,
        provenance: [`[ALG_T2_C_010] gap=${gap.toFixed(4)} strat=${best.name} gain=${projectedGain.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_C_011 · 耦生风险预警
// ============================================================================
function couplingRiskAlert(current, velocity, threshold) {
    let risk;
    if (current < threshold * 0.5)
        risk = 'critical';
    else if (current < threshold * 0.7)
        risk = 'high';
    else if (current < threshold * 0.9)
        risk = 'medium';
    else
        risk = 'low';
    const projectedBreach = velocity < 0 ? (current - threshold) / Math.abs(velocity) : Infinity;
    return {
        risk,
        projectedBreach,
        provenance: [`[ALG_T2_C_011] cur=${current.toFixed(4)} risk=${risk} breach=${projectedBreach === Infinity ? 'never' : projectedBreach.toFixed(2) + 's'}`],
    };
}
// ============================================================================
// ALG_T2_C_012 · 耦生图社区检测（标签传播）
// ============================================================================
function couplingCommunity(graph, maxIterations = 10) {
    const labels = new Map();
    graph.nodes.forEach((n, i) => labels.set(n.id, i));
    const adj = new Map();
    for (const node of graph.nodes)
        adj.set(node.id, []);
    for (const edge of graph.edges) {
        adj.get(edge.from).push(edge.to);
        if (edge.bidirectional)
            adj.get(edge.to).push(edge.from);
    }
    for (let iter = 0; iter < maxIterations; iter++) {
        let changed = false;
        for (const node of graph.nodes) {
            const neighbors = adj.get(node.id) || [];
            if (neighbors.length === 0)
                continue;
            const counts = new Map();
            for (const nb of neighbors) {
                const l = labels.get(nb);
                counts.set(l, (counts.get(l) || 0) + 1);
            }
            let bestLabel = labels.get(node.id);
            let bestCount = 0;
            for (const [l, c] of counts) {
                if (c > bestCount) {
                    bestCount = c;
                    bestLabel = l;
                }
            }
            if (bestLabel !== labels.get(node.id)) {
                labels.set(node.id, bestLabel);
                changed = true;
            }
        }
        if (!changed)
            break;
    }
    const unique = new Set(labels.values());
    return {
        communities: labels,
        count: unique.size,
        provenance: [`[ALG_T2_C_012] communities=${unique.size} iter=${maxIterations}`],
    };
}
// ============================================================================
// ALG_T2_C_013 · 耦生对称性修复
// ============================================================================
function couplingSymmetrize(matrix) {
    const n = matrix.length;
    const symmetrized = Array.from({ length: n }, () => new Array(n).fill(0));
    let corrections = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) {
                symmetrized[i][j] = matrix[i][j];
            }
            else if (i < j) {
                const avg = (matrix[i][j] + matrix[j][i]) / 2;
                symmetrized[i][j] = avg;
                symmetrized[j][i] = avg;
                if (Math.abs(matrix[i][j] - matrix[j][i]) > 0.001)
                    corrections++;
            }
        }
    }
    return {
        symmetrized,
        corrections,
        provenance: [`[ALG_T2_C_013] n=${n} corrections=${corrections}`],
    };
}
// ============================================================================
// ALG_T2_C_014 · 耦生强度分布
// ============================================================================
function couplingDistribution(scores, bins = 5) {
    if (scores.length === 0 || bins <= 0) {
        return { histogram: [], mean: 0, std: 0, provenance: ['[ALG_T2_C_014] 空输入'] };
    }
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min;
    const histogram = new Array(bins).fill(0);
    for (const s of scores) {
        const idx = range === 0 ? 0 : Math.min(bins - 1, Math.floor(((s - min) / range) * bins));
        histogram[idx]++;
    }
    const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
    const variance = scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length;
    const std = Math.sqrt(variance);
    return {
        histogram,
        mean,
        std,
        provenance: [`[ALG_T2_C_014] n=${scores.length} mean=${mean.toFixed(4)} std=${std.toFixed(4)} bins=${bins}`],
    };
}
// ============================================================================
// ALG_T2_C_015 · 耦生层次聚合（自底向上）
// ============================================================================
function couplingHierarchicalAggregate(leafScores, groupSize) {
    if (leafScores.length === 0 || groupSize <= 0) {
        return { levels: [], aggregated: 0, provenance: ['[ALG_T2_C_015] 空输入'] };
    }
    const levels = [leafScores];
    let current = leafScores;
    while (current.length > 1) {
        const next = [];
        for (let i = 0; i < current.length; i += groupSize) {
            const group = current.slice(i, i + groupSize);
            const avg = group.reduce((s, x) => s + x, 0) / group.length;
            next.push(avg);
        }
        levels.push(next);
        if (next.length === current.length)
            break;
        current = next;
    }
    return {
        levels,
        aggregated: current[0] || 0,
        provenance: [`[ALG_T2_C_015] levels=${levels.length} final=${(current[0] || 0).toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_C_016 · 耦生均衡度（基尼系数）
// ============================================================================
function couplingGini(scores) {
    if (scores.length === 0) {
        return { gini: 0, balanced: false, provenance: ['[ALG_T2_C_016] 空输入'] };
    }
    const sorted = [...scores].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((s, x) => s + x, 0);
    if (sum === 0) {
        return { gini: 0, balanced: true, provenance: [`[ALG_T2_C_016] sum=0 balanced=true`] };
    }
    let cumWeighted = 0;
    for (let i = 0; i < n; i++) {
        cumWeighted += (i + 1) * sorted[i];
    }
    const gini = (2 * cumWeighted) / (n * sum) - (n + 1) / n;
    return {
        gini,
        balanced: gini < 0.3,
        provenance: [`[ALG_T2_C_016] gini=${gini.toFixed(4)} balanced=${gini < 0.3}`],
    };
}
// ============================================================================
// ALG_T2_C_017 · 耦生时序预测（线性外推）
// ============================================================================
function couplingForecast(history, horizon) {
    const n = history.length;
    if (n < 2 || horizon <= 0) {
        return { forecast: [], slope: 0, provenance: ['[ALG_T2_C_017] 数据不足'] };
    }
    const times = history.map(d => d.time);
    const scores = history.map(d => d.score);
    const meanT = times.reduce((s, x) => s + x, 0) / n;
    const meanS = scores.reduce((s, x) => s + x, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (times[i] - meanT) * (scores[i] - meanS);
        den += (times[i] - meanT) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanS - slope * meanT;
    const lastTime = times[n - 1];
    const step = n > 1 ? times[n - 1] - times[n - 2] : 1;
    const forecast = [];
    for (let i = 1; i <= horizon; i++) {
        const t = lastTime + i * step;
        forecast.push({ time: t, score: slope * t + intercept });
    }
    return {
        forecast,
        slope,
        provenance: [`[ALG_T2_C_017] slope=${slope.toFixed(6)} horizon=${horizon}`],
    };
}
// ============================================================================
// ALG_T2_C_018 · 耦生异常注入检测
// ============================================================================
function couplingAnomalyInjection(baseline, observed, sensitivity = 3) {
    const n = Math.min(baseline.length, observed.length);
    if (n === 0) {
        return { anomalies: [], injected: false, provenance: ['[ALG_T2_C_018] 空输入'] };
    }
    const mean = baseline.reduce((s, x) => s + x, 0) / baseline.length;
    const variance = baseline.reduce((s, x) => s + (x - mean) ** 2, 0) / baseline.length;
    const std = Math.sqrt(variance);
    if (std === 0) {
        return { anomalies: [], injected: false, provenance: ['[ALG_T2_C_018] 基线无方差'] };
    }
    const anomalies = [];
    for (let i = 0; i < n; i++) {
        const z = Math.abs(observed[i] - mean) / std;
        if (z > sensitivity)
            anomalies.push(i);
    }
    return {
        anomalies,
        injected: anomalies.length > n * 0.1,
        provenance: [`[ALG_T2_C_018] anomalies=${anomalies.length} injected=${anomalies.length > n * 0.1}`],
    };
}
// ============================================================================
// ALG_T2_C_019 · 耦生传播模拟（线性阈值模型）
// ============================================================================
function couplingPropagation(graph, seeds, threshold = 0.3, maxSteps = 10) {
    const activated = new Set(seeds);
    const adj = new Map();
    for (const node of graph.nodes)
        adj.set(node.id, []);
    for (const edge of graph.edges) {
        adj.get(edge.from).push({ node: edge.to, weight: edge.score });
        if (edge.bidirectional)
            adj.get(edge.to).push({ node: edge.from, weight: edge.score });
    }
    let steps = 0;
    for (let step = 0; step < maxSteps; step++) {
        const newlyActivated = [];
        for (const node of graph.nodes) {
            if (activated.has(node.id))
                continue;
            const neighbors = adj.get(node.id) || [];
            let sum = 0;
            for (const { node: nb, weight } of neighbors) {
                if (activated.has(nb))
                    sum += weight;
            }
            if (sum >= threshold)
                newlyActivated.push(node.id);
        }
        if (newlyActivated.length === 0)
            break;
        for (const id of newlyActivated)
            activated.add(id);
        steps = step + 1;
    }
    return {
        activated,
        steps,
        provenance: [`[ALG_T2_C_019] activated=${activated.size}/${graph.nodes.length} steps=${steps}`],
    };
}
// ============================================================================
// ALG_T2_C_020 · 耦生综合评估
// ============================================================================
function couplingComprehensiveAssessment(metrics) {
    const weights = { score: 0.35, stability: 0.2, symmetry: 0.15, coverage: 0.15, trend: 0.15 };
    const overall = metrics.score * weights.score +
        metrics.stability * weights.stability +
        metrics.symmetry * weights.symmetry +
        metrics.coverage * weights.coverage +
        metrics.trend * weights.trend;
    let grade;
    if (overall >= 0.9)
        grade = 'A';
    else if (overall >= 0.8)
        grade = 'B';
    else if (overall >= 0.7)
        grade = 'C';
    else if (overall >= 0.6)
        grade = 'D';
    else
        grade = 'F';
    return {
        overall,
        grade,
        provenance: [`[ALG_T2_C_020] overall=${overall.toFixed(4)} grade=${grade}`],
    };
}
