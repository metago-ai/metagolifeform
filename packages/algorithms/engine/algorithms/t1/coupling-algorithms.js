"use strict";
/**
 * MetaGO Engine - A5 T1 算法 · 耦生度计算类（第一批）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：ALG_636 耦生评估 / ATOM_734 / P742
 *
 * 算法清单（30 个，ALG_C_001 ~ ALG_C_030）：
 *   001 余弦相似度  002 Jaccard 系数  003 Dice 系数
 *   004 欧氏距离    005 曼哈顿距离    006 切比雪夫距离
 *   007 皮尔逊相关   008 斯皮尔曼相关  009 肯德尔 tau
 *   010 加权余弦    011 模糊匹配      012 语义相似度
 *   013 共现频率    014 时间衰减共现  015 双向耦生评估
 *   016 超导判定    017 弱对识别      018 强对识别
 *   019 耦生矩阵    020 归一化耦生    021 耦生度排序
 *   022 对称记录    023 非对称检测    024 耦生趋势
 *   025 耦生聚类    026 价值向量构造  027 向量降维
 *   028 主成分提取  029 奇异值分解    030 协方差计算
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cosineSimilarity = cosineSimilarity;
exports.jaccardCoefficient = jaccardCoefficient;
exports.diceCoefficient = diceCoefficient;
exports.euclideanDistance = euclideanDistance;
exports.manhattanDistance = manhattanDistance;
exports.chebyshevDistance = chebyshevDistance;
exports.pearsonCorrelation = pearsonCorrelation;
exports.spearmanCorrelation = spearmanCorrelation;
exports.kendallTau = kendallTau;
exports.weightedCosineSimilarity = weightedCosineSimilarity;
exports.fuzzyStringMatch = fuzzyStringMatch;
exports.semanticSimilarity = semanticSimilarity;
exports.cooccurrenceFrequency = cooccurrenceFrequency;
exports.timeDecayCooccurrence = timeDecayCooccurrence;
exports.evaluateBidirectionalCoupling = evaluateBidirectionalCoupling;
exports.isSuperconductive = isSuperconductive;
exports.identifyWeakPairs = identifyWeakPairs;
exports.identifyStrongPairs = identifyStrongPairs;
exports.buildCouplingMatrix = buildCouplingMatrix;
exports.normalizeCoupling = normalizeCoupling;
exports.sortCouplingScores = sortCouplingScores;
exports.recordSymmetric = recordSymmetric;
exports.detectAsymmetry = detectAsymmetry;
exports.couplingTrend = couplingTrend;
exports.couplingClustering = couplingClustering;
exports.buildValueVector = buildValueVector;
exports.reduceDimension = reduceDimension;
exports.extractPrincipalComponent = extractPrincipalComponent;
exports.simplifiedSVD = simplifiedSVD;
exports.covariance = covariance;
exports.hashVector = hashVector;
const crypto_1 = require("crypto");
// ============================================================================
// T1·ALG_C_001 · 余弦相似度
// ============================================================================
function cosineSimilarity(pair) {
    const { a, b } = pair;
    if (a.length !== b.length || a.length === 0) {
        return { score: 0, normalized: 0, provenance: ['[ALG_C_001] 维度不匹配或为空'] };
    }
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    const score = denom === 0 ? 0 : dot / denom;
    return {
        score,
        normalized: (score + 1) / 2, // [-1,1] → [0,1]
        provenance: [`[ALG_C_001] cos=${score.toFixed(6)} dim=${a.length}`],
    };
}
// ============================================================================
// T1·ALG_C_002 · Jaccard 系数
// ============================================================================
function jaccardCoefficient(pair) {
    const setA = pair.a instanceof Set ? pair.a : new Set(pair.a);
    const setB = pair.b instanceof Set ? pair.b : new Set(pair.b);
    let intersection = 0;
    for (const item of setA)
        if (setB.has(item))
            intersection++;
    const union = setA.size + setB.size - intersection;
    const score = union === 0 ? 0 : intersection / union;
    return {
        score,
        normalized: score,
        provenance: [`[ALG_C_002] J=${score.toFixed(6)} |A∩B|=${intersection} |A∪B|=${union}`],
    };
}
// ============================================================================
// T1·ALG_C_003 · Dice 系数
// ============================================================================
function diceCoefficient(pair) {
    const setA = pair.a instanceof Set ? pair.a : new Set(pair.a);
    const setB = pair.b instanceof Set ? pair.b : new Set(pair.b);
    let intersection = 0;
    for (const item of setA)
        if (setB.has(item))
            intersection++;
    const total = setA.size + setB.size;
    const score = total === 0 ? 0 : (2 * intersection) / total;
    return {
        score,
        normalized: score,
        provenance: [`[ALG_C_003] D=${score.toFixed(6)} |A∩B|=${intersection}`],
    };
}
// ============================================================================
// T1·ALG_C_004 · 欧氏距离
// ============================================================================
function euclideanDistance(pair) {
    const { a, b } = pair;
    if (a.length !== b.length || a.length === 0) {
        return { score: Infinity, normalized: 0, provenance: ['[ALG_C_004] 维度不匹配'] };
    }
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    const dist = Math.sqrt(sum);
    const normalized = 1 / (1 + dist);
    return {
        score: dist,
        normalized,
        provenance: [`[ALG_C_004] d=${dist.toFixed(6)} norm=${normalized.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_C_005 · 曼哈顿距离
// ============================================================================
function manhattanDistance(pair) {
    const { a, b } = pair;
    if (a.length !== b.length || a.length === 0) {
        return { score: Infinity, normalized: 0, provenance: ['[ALG_C_005] 维度不匹配'] };
    }
    let sum = 0;
    for (let i = 0; i < a.length; i++)
        sum += Math.abs(a[i] - b[i]);
    const normalized = 1 / (1 + sum);
    return {
        score: sum,
        normalized,
        provenance: [`[ALG_C_005] d=${sum.toFixed(6)} norm=${normalized.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_C_006 · 切比雪夫距离
// ============================================================================
function chebyshevDistance(pair) {
    const { a, b } = pair;
    if (a.length !== b.length || a.length === 0) {
        return { score: Infinity, normalized: 0, provenance: ['[ALG_C_006] 维度不匹配'] };
    }
    let max = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = Math.abs(a[i] - b[i]);
        if (diff > max)
            max = diff;
    }
    const normalized = 1 / (1 + max);
    return {
        score: max,
        normalized,
        provenance: [`[ALG_C_006] d=${max.toFixed(6)} norm=${normalized.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_C_007 · 皮尔逊相关系数
// ============================================================================
function pearsonCorrelation(pair) {
    const { a, b } = pair;
    const n = a.length;
    if (n !== b.length || n === 0) {
        return { score: 0, normalized: 0, provenance: ['[ALG_C_007] 维度不匹配'] };
    }
    const meanA = a.reduce((s, x) => s + x, 0) / n;
    const meanB = b.reduce((s, x) => s + x, 0) / n;
    let num = 0, denA = 0, denB = 0;
    for (let i = 0; i < n; i++) {
        const da = a[i] - meanA;
        const db = b[i] - meanB;
        num += da * db;
        denA += da * da;
        denB += db * db;
    }
    const denom = Math.sqrt(denA) * Math.sqrt(denB);
    const score = denom === 0 ? 0 : num / denom;
    return {
        score,
        normalized: (score + 1) / 2,
        provenance: [`[ALG_C_007] r=${score.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_C_008 · 斯皮尔曼相关系数
// ============================================================================
function spearmanCorrelation(pair) {
    const rankA = rank(pair.a);
    const rankB = rank(pair.b);
    return pearsonCorrelation({ a: rankA, b: rankB });
}
function rank(arr) {
    const indexed = arr.map((v, i) => ({ v, i }));
    indexed.sort((x, y) => x.v - y.v);
    const ranks = new Array(arr.length).fill(0);
    let i = 0;
    while (i < indexed.length) {
        let j = i;
        while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v)
            j++;
        const avgRank = (i + j) / 2 + 1;
        for (let k = i; k <= j; k++)
            ranks[indexed[k].i] = avgRank;
        i = j + 1;
    }
    return ranks;
}
// ============================================================================
// T1·ALG_C_009 · 肯德尔 tau
// ============================================================================
function kendallTau(pair) {
    const { a, b } = pair;
    const n = a.length;
    if (n !== b.length || n < 2) {
        return { score: 0, normalized: 0, provenance: ['[ALG_C_009] 维度不足'] };
    }
    let concordant = 0, discordant = 0;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const da = a[i] - a[j];
            const db = b[i] - b[j];
            const sign = Math.sign(da) * Math.sign(db);
            if (sign > 0)
                concordant++;
            else if (sign < 0)
                discordant++;
        }
    }
    const total = (n * (n - 1)) / 2;
    const score = total === 0 ? 0 : (concordant - discordant) / total;
    return {
        score,
        normalized: (score + 1) / 2,
        provenance: [`[ALG_C_009] τ=${score.toFixed(6)} C=${concordant} D=${discordant}`],
    };
}
// ============================================================================
// T1·ALG_C_010 · 加权余弦相似度
// ============================================================================
function weightedCosineSimilarity(pair, weights) {
    const { a, b } = pair;
    if (a.length !== b.length || a.length !== weights.length || a.length === 0) {
        return { score: 0, normalized: 0, provenance: ['[ALG_C_010] 维度不匹配'] };
    }
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        const w = weights[i];
        dot += w * a[i] * b[i];
        normA += w * a[i] * a[i];
        normB += w * b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    const score = denom === 0 ? 0 : dot / denom;
    return {
        score,
        normalized: (score + 1) / 2,
        provenance: [`[ALG_C_010] wcos=${score.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_C_011 · 模糊字符串匹配（基于 2-gram Jaccard）
// ============================================================================
function fuzzyStringMatch(s1, s2) {
    const grams1 = new Set();
    const grams2 = new Set();
    const norm1 = s1.toLowerCase().replace(/\s+/g, '');
    const norm2 = s2.toLowerCase().replace(/\s+/g, '');
    for (let i = 0; i < norm1.length - 1; i++)
        grams1.add(norm1.substring(i, i + 2));
    for (let i = 0; i < norm2.length - 1; i++)
        grams2.add(norm2.substring(i, i + 2));
    return jaccardCoefficient({ a: grams1, b: grams2 });
}
// ============================================================================
// T1·ALG_C_012 · 语义相似度（基于关键词重叠的启发式）
// ============================================================================
function semanticSimilarity(tokens1, tokens2, synonyms = new Map()) {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    let match = 0;
    for (const t of set1) {
        if (set2.has(t)) {
            match++;
            continue;
        }
        const syns = synonyms.get(t) || [];
        for (const syn of syns) {
            if (set2.has(syn)) {
                match += 0.7;
                break;
            }
        }
    }
    const total = set1.size + set2.size - match;
    const score = total === 0 ? 0 : match / total;
    return {
        score,
        normalized: score,
        provenance: [`[ALG_C_012] sem=${score.toFixed(6)} match=${match}`],
    };
}
// ============================================================================
// T1·ALG_C_013 · 共现频率
// ============================================================================
function cooccurrenceFrequency(sequences, item1, item2) {
    let both = 0, either = 0;
    for (const seq of sequences) {
        const hasA = seq.includes(item1);
        const hasB = seq.includes(item2);
        if (hasA && hasB)
            both++;
        if (hasA || hasB)
            either++;
    }
    const score = either === 0 ? 0 : both / either;
    return {
        score,
        normalized: score,
        provenance: [`[ALG_C_013] cooc=${score.toFixed(6)} both=${both} either=${either}`],
    };
}
// ============================================================================
// T1·ALG_C_014 · 时间衰减共现
// ============================================================================
function timeDecayCooccurrence(events, item1, item2, halfLifeMs, now) {
    let weighted = 0, total = 0;
    for (const ev of events) {
        const hasA = ev.items.includes(item1);
        const hasB = ev.items.includes(item2);
        if (hasA || hasB) {
            const age = now - ev.time;
            const weight = Math.pow(0.5, age / halfLifeMs);
            total += weight;
            if (hasA && hasB)
                weighted += weight;
        }
    }
    const score = total === 0 ? 0 : weighted / total;
    return {
        score,
        normalized: score,
        provenance: [`[ALG_C_014] tdc=${score.toFixed(6)}`],
    };
}
function evaluateBidirectionalCoupling(forwardSamples, backwardSamples) {
    const forward = forwardSamples.reduce((s, x) => s + x, 0) / (forwardSamples.length || 1);
    const backward = backwardSamples.reduce((s, x) => s + x, 0) / (backwardSamples.length || 1);
    const symmetric = 1 - Math.abs(forward - backward) / (Math.abs(forward) + Math.abs(backward) + 1e-9);
    return {
        forward,
        backward,
        symmetric,
        provenance: [`[ALG_C_015] fwd=${forward.toFixed(4)} bwd=${backward.toFixed(4)} sym=${symmetric.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_C_016 · 超导判定（耦生度 > 1）
// ============================================================================
function isSuperconductive(couplingScore) {
    const margin = couplingScore - 1;
    return {
        superconductive: couplingScore > 1,
        margin,
        provenance: [`[ALG_C_016] score=${couplingScore.toFixed(4)} super=${couplingScore > 1} margin=${margin.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_C_017 · 弱对识别
// ============================================================================
function identifyWeakPairs(matrix, threshold = 0.3) {
    const pairs = [];
    for (let i = 0; i < matrix.size; i++) {
        for (let j = i + 1; j < matrix.size; j++) {
            const score = matrix.matrix[i][j];
            if (score > 0 && score < threshold) {
                pairs.push([matrix.labels[i], matrix.labels[j], score]);
            }
        }
    }
    return {
        pairs,
        provenance: [`[ALG_C_017] weak=${pairs.length} threshold=${threshold}`],
    };
}
// ============================================================================
// T1·ALG_C_018 · 强对识别
// ============================================================================
function identifyStrongPairs(matrix, threshold = 0.9) {
    const pairs = [];
    for (let i = 0; i < matrix.size; i++) {
        for (let j = i + 1; j < matrix.size; j++) {
            const score = matrix.matrix[i][j];
            if (score >= threshold) {
                pairs.push([matrix.labels[i], matrix.labels[j], score]);
            }
        }
    }
    return {
        pairs,
        provenance: [`[ALG_C_018] strong=${pairs.length} threshold=${threshold}`],
    };
}
// ============================================================================
// T1·ALG_C_019 · 耦生矩阵构造
// ============================================================================
function buildCouplingMatrix(labels, scoreFn) {
    const size = labels.length;
    const matrix = Array.from({ length: size }, () => new Array(size).fill(0));
    for (let i = 0; i < size; i++) {
        matrix[i][i] = 1;
        for (let j = i + 1; j < size; j++) {
            const score = scoreFn(labels[i], labels[j]);
            matrix[i][j] = score;
            matrix[j][i] = score;
        }
    }
    return { size, matrix, labels };
}
// ============================================================================
// T1·ALG_C_020 · 归一化耦生
// ============================================================================
function normalizeCoupling(scores) {
    if (scores.length === 0) {
        return { normalized: [], min: 0, max: 0, provenance: ['[ALG_C_020] 空输入'] };
    }
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min;
    const normalized = range === 0 ? scores.map(() => 1) : scores.map(s => (s - min) / range);
    return {
        normalized,
        min,
        max,
        provenance: [`[ALG_C_020] min=${min.toFixed(4)} max=${max.toFixed(4)} range=${range.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_C_021 · 耦生度排序
// ============================================================================
function sortCouplingScores(entries, descending = true) {
    const sorted = [...entries].sort((a, b) => descending ? b.score - a.score : a.score - b.score);
    return {
        sorted,
        provenance: [`[ALG_C_021] n=${sorted.length} desc=${descending}`],
    };
}
// ============================================================================
// T1·ALG_C_022 · 对称记录
// ============================================================================
function recordSymmetric(store, a, b, score) {
    const key = [a, b].sort().join('::');
    store.set(key, score);
    return {
        key,
        provenance: [`[ALG_C_022] key=${key} score=${score.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_C_023 · 非对称检测
// ============================================================================
function detectAsymmetry(matrix, tolerance = 0.01) {
    const asymmetric = [];
    for (let i = 0; i < matrix.size; i++) {
        for (let j = i + 1; j < matrix.size; j++) {
            const diff = Math.abs(matrix.matrix[i][j] - matrix.matrix[j][i]);
            if (diff > tolerance) {
                asymmetric.push([matrix.labels[i], matrix.labels[j], matrix.matrix[i][j], matrix.matrix[j][i]]);
            }
        }
    }
    return {
        asymmetric,
        provenance: [`[ALG_C_023] asym=${asymmetric.length} tol=${tolerance}`],
    };
}
// ============================================================================
// T1·ALG_C_024 · 耦生趋势分析
// ============================================================================
function couplingTrend(timeSeries) {
    const n = timeSeries.length;
    if (n < 2) {
        return { slope: 0, trend: 'stable', provenance: ['[ALG_C_024] 数据不足'] };
    }
    const times = timeSeries.map(d => d.time);
    const scores = timeSeries.map(d => d.score);
    const meanT = times.reduce((s, x) => s + x, 0) / n;
    const meanS = scores.reduce((s, x) => s + x, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (times[i] - meanT) * (scores[i] - meanS);
        den += (times[i] - meanT) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const trend = slope > 0.0001 ? 'increasing' : slope < -0.0001 ? 'decreasing' : 'stable';
    return {
        slope,
        trend,
        provenance: [`[ALG_C_024] slope=${slope.toFixed(6)} trend=${trend}`],
    };
}
// ============================================================================
// T1·ALG_C_025 · 耦生聚类（基于阈值的连通分量）
// ============================================================================
function couplingClustering(matrix, threshold) {
    const visited = new Array(matrix.size).fill(false);
    const clusters = [];
    for (let start = 0; start < matrix.size; start++) {
        if (visited[start])
            continue;
        const cluster = [];
        const queue = [start];
        visited[start] = true;
        while (queue.length > 0) {
            const i = queue.shift();
            cluster.push(matrix.labels[i]);
            for (let j = 0; j < matrix.size; j++) {
                if (!visited[j] && matrix.matrix[i][j] >= threshold) {
                    visited[j] = true;
                    queue.push(j);
                }
            }
        }
        if (cluster.length > 0)
            clusters.push(cluster);
    }
    return {
        clusters,
        provenance: [`[ALG_C_025] clusters=${clusters.length} threshold=${threshold}`],
    };
}
// ============================================================================
// T1·ALG_C_026 · 价值向量构造
// ============================================================================
function buildValueVector(dimensions) {
    const vector = dimensions.map(d => d.value * d.weight);
    const names = dimensions.map(d => d.name);
    const weights = dimensions.map(d => d.weight);
    const norm = Math.sqrt(vector.reduce((s, x) => s + x * x, 0));
    return {
        vector,
        names,
        weights,
        provenance: [`[ALG_C_026] dim=${vector.length} norm=${norm.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_C_027 · 向量降维（简单平均聚合）
// ============================================================================
function reduceDimension(vector, targetDim) {
    if (targetDim <= 0 || targetDim >= vector.length) {
        return { reduced: vector, provenance: [`[ALG_C_027] 无需降维`] };
    }
    const groupSize = Math.ceil(vector.length / targetDim);
    const reduced = [];
    for (let i = 0; i < vector.length; i += groupSize) {
        const group = vector.slice(i, i + groupSize);
        const avg = group.reduce((s, x) => s + x, 0) / group.length;
        reduced.push(avg);
    }
    return {
        reduced,
        provenance: [`[ALG_C_027] ${vector.length}→${reduced.length}`],
    };
}
// ============================================================================
// T1·ALG_C_028 · 主成分提取（简单方差最大维度）
// ============================================================================
function extractPrincipalComponent(vectors) {
    if (vectors.length === 0 || vectors[0].length === 0) {
        return { component: [], index: -1, variance: 0, provenance: ['[ALG_C_028] 空输入'] };
    }
    const dim = vectors[0].length;
    let maxVar = -1, maxIdx = 0;
    for (let d = 0; d < dim; d++) {
        const col = vectors.map(v => v[d]);
        const mean = col.reduce((s, x) => s + x, 0) / col.length;
        const variance = col.reduce((s, x) => s + (x - mean) ** 2, 0) / col.length;
        if (variance > maxVar) {
            maxVar = variance;
            maxIdx = d;
        }
    }
    return {
        component: vectors.map(v => v[maxIdx]),
        index: maxIdx,
        variance: maxVar,
        provenance: [`[ALG_C_028] idx=${maxIdx} var=${maxVar.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_C_029 · 简化奇异值分解（幂迭代法，仅第一主成分）
// ============================================================================
function simplifiedSVD(matrix, iterations = 100) {
    if (matrix.length === 0 || matrix[0].length === 0) {
        return { leftVector: [], singularValue: 0, provenance: ['[ALG_C_029] 空矩阵'] };
    }
    const rows = matrix.length;
    const cols = matrix[0].length;
    let v = new Array(cols).fill(0).map(() => Math.random());
    let vNorm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    if (vNorm === 0)
        vNorm = 1;
    v = v.map(x => x / vNorm);
    for (let iter = 0; iter < iterations; iter++) {
        // u = A·v
        const u = matrix.map(row => row.reduce((s, x, i) => s + x * v[i], 0));
        const uNorm = Math.sqrt(u.reduce((s, x) => s + x * x, 0));
        if (uNorm === 0)
            break;
        const uNormed = u.map(x => x / uNorm);
        // v = A^T·u
        const newV = new Array(cols).fill(0);
        for (let j = 0; j < cols; j++) {
            for (let i = 0; i < rows; i++) {
                newV[j] += matrix[i][j] * uNormed[i];
            }
        }
        const newVNorm = Math.sqrt(newV.reduce((s, x) => s + x * x, 0));
        if (newVNorm === 0)
            break;
        v = newV.map(x => x / newVNorm);
    }
    // 计算 singular value
    const u = matrix.map(row => row.reduce((s, x, i) => s + x * v[i], 0));
    const singularValue = Math.sqrt(u.reduce((s, x) => s + x * x, 0));
    return {
        leftVector: u.map(x => (singularValue === 0 ? 0 : x / singularValue)),
        singularValue,
        provenance: [`[ALG_C_029] σ=${singularValue.toFixed(6)} iter=${iterations}`],
    };
}
// ============================================================================
// T1·ALG_C_030 · 协方差计算
// ============================================================================
function covariance(samples) {
    const n = samples.length;
    if (n < 2) {
        return { cov: 0, provenance: ['[ALG_C_030] 样本不足'] };
    }
    const meanX = samples.reduce((s, d) => s + d.x, 0) / n;
    const meanY = samples.reduce((s, d) => s + d.y, 0) / n;
    let sum = 0;
    for (const s of samples)
        sum += (s.x - meanX) * (s.y - meanY);
    const cov = sum / (n - 1);
    return {
        cov,
        provenance: [`[ALG_C_030] cov=${cov.toFixed(6)} n=${n}`],
    };
}
// ============================================================================
// 工具函数
// ============================================================================
function hashVector(vector) {
    return (0, crypto_1.createHash)('sha256')
        .update(vector.map(v => v.toFixed(6)).join(','), 'utf-8')
        .digest('hex')
        .substring(0, 16);
}
