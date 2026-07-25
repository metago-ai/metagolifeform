"use strict";
/**
 * MetaGO Engine - A5 T1 算法 · 负熵类（第二批）
 *
 * 对应属性：D43 数据溯源与自证 / 公理 A1 溯源公理
 * 对应文档：附录A·T1·NEGENTROPY（ALG_T1_N_001 ~ ALG_T1_N_015）
 *
 * 算法清单（15 个）：
 *   001 熵计算        002 负熵计算        003 熵变(delta)
 *   004 有序度        005 复杂度度量      006 信息密度
 *   007 互信息        008 条件熵          009 相对熵(KL)
 *   010 交叉熵        011 熵率            012 熵产生
 *   013 熵输出        014 熵平衡          015 熵监控
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeEntropy = computeEntropy;
exports.computeNegentropy = computeNegentropy;
exports.entropyDelta = entropyDelta;
exports.orderDegree = orderDegree;
exports.complexityMeasure = complexityMeasure;
exports.informationDensity = informationDensity;
exports.mutualInformation = mutualInformation;
exports.conditionalEntropy = conditionalEntropy;
exports.relativeEntropy = relativeEntropy;
exports.crossEntropy = crossEntropy;
exports.entropyRate = entropyRate;
exports.entropyProduction = entropyProduction;
exports.entropyExport = entropyExport;
exports.entropyBalance = entropyBalance;
exports.entropyMonitor = entropyMonitor;
// ============================================================================
// T1·ALG_T1_N_001 · 熵计算（香农熵）
// ============================================================================
function computeEntropy(probabilities) {
    if (probabilities.length === 0) {
        return { entropy: 0, maxEntropy: 0, normalized: 0, provenance: ['[ALG_T1_N_001] 空概率'] };
    }
    const sum = probabilities.reduce((s, p) => s + p, 0);
    if (sum === 0) {
        return { entropy: 0, maxEntropy: 0, normalized: 0, provenance: ['[ALG_T1_N_001] 概率和为0'] };
    }
    const normalizedProbs = probabilities.map(p => p / sum);
    const entropy = -normalizedProbs.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0) || 0;
    const maxEntropy = Math.log2(probabilities.length);
    const normalized = maxEntropy === 0 ? 1 : entropy / maxEntropy;
    return {
        entropy,
        maxEntropy,
        normalized,
        provenance: [`[ALG_T1_N_001] H=${entropy.toFixed(6)} max=${maxEntropy.toFixed(6)} norm=${normalized.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_002 · 负熵计算
// ============================================================================
function computeNegentropy(observed, reference) {
    if (observed.length === 0 || reference.length === 0) {
        return { negentropy: 0, relativeToMax: 0, provenance: ['[ALG_T1_N_002] 空输入'] };
    }
    const obsEntropy = computeEntropy(observed).entropy;
    const refEntropy = computeEntropy(reference).entropy;
    // 负熵 = 参考熵 - 观测熵（越大表示越有序）
    const negentropy = refEntropy - obsEntropy;
    const maxEntropy = Math.log2(Math.max(observed.length, reference.length));
    const relativeToMax = maxEntropy === 0 ? 0 : negentropy / maxEntropy;
    return {
        negentropy,
        relativeToMax,
        provenance: [`[ALG_T1_N_002] negent=${negentropy.toFixed(6)} rel=${relativeToMax.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_003 · 熵变(delta S)
// ============================================================================
function entropyDelta(before, after) {
    if (before.length === 0 || after.length === 0) {
        return { deltaS: 0, direction: 'stable', provenance: ['[ALG_T1_N_003] 空输入'] };
    }
    const beforeEnt = computeEntropy(before).entropy;
    const afterEnt = computeEntropy(after).entropy;
    const deltaS = afterEnt - beforeEnt;
    const direction = deltaS > 0.001 ? 'increasing' : deltaS < -0.001 ? 'decreasing' : 'stable';
    return {
        deltaS,
        direction,
        provenance: [`[ALG_T1_N_003] dS=${deltaS.toFixed(6)} dir=${direction} before=${beforeEnt.toFixed(4)} after=${afterEnt.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_004 · 有序度
// ============================================================================
function orderDegree(values) {
    if (values.length === 0) {
        return { order: 0, disorder: 1, provenance: ['[ALG_T1_N_004] 空输入'] };
    }
    // 有序度 = 1 - 归一化熵
    const sum = values.reduce((s, v) => s + Math.abs(v), 0);
    if (sum === 0) {
        return { order: 1, disorder: 0, provenance: ['[ALG_T1_N_004] 全零输入，完全有序'] };
    }
    const probs = values.map(v => Math.abs(v) / sum);
    const entropy = -probs.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
    const maxEntropy = Math.log2(values.length);
    const normalizedEntropy = maxEntropy === 0 ? 0 : entropy / maxEntropy;
    return {
        order: 1 - normalizedEntropy,
        disorder: normalizedEntropy,
        provenance: [`[ALG_T1_N_004] order=${(1 - normalizedEntropy).toFixed(4)} disorder=${normalizedEntropy.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_005 · 复杂度度量（算法复杂度估计）
// ============================================================================
function complexityMeasure(sequence) {
    if (sequence.length === 0) {
        return { complexity: 0, lzComplexity: 0, provenance: ['[ALG_T1_N_005] 空序列'] };
    }
    // Lempel-Ziv 复杂度
    const str = sequence.map(v => String.fromCharCode(65 + Math.floor(Math.abs(v) % 26))).join('');
    let lzComplexity = 0;
    let i = 0;
    const history = new Set();
    while (i < str.length) {
        let j = 1;
        while (i + j <= str.length) {
            const substr = str.substring(i, i + j);
            if (!history.has(substr) && j > 1) {
                history.add(substr);
                lzComplexity++;
                i += j - 1;
                break;
            }
            if (i + j === str.length) {
                lzComplexity++;
                i += j;
                break;
            }
            j++;
        }
        if (j === 1) {
            history.add(str.substring(i, i + 1));
            lzComplexity++;
            i++;
        }
    }
    const normalizedLz = sequence.length > 0 ? lzComplexity / sequence.length : 0;
    return {
        complexity: normalizedLz,
        lzComplexity,
        provenance: [`[ALG_T1_N_005] lz=${lzComplexity} norm=${normalizedLz.toFixed(4)} len=${sequence.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_006 · 信息密度
// ============================================================================
function informationDensity(data, bitsPerElement = 32) {
    if (data.length === 0) {
        return { density: 0, entropy: 0, redundancy: 1, provenance: ['[ALG_T1_N_006] 空数据'] };
    }
    const sum = data.reduce((s, v) => s + Math.abs(v), 0);
    if (sum === 0) {
        return { density: 0, entropy: 0, redundancy: 1, provenance: ['[ALG_T1_N_006] 全零数据'] };
    }
    const probs = data.map(v => Math.abs(v) / sum);
    const entropy = -probs.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
    const maxBits = data.length * bitsPerElement;
    const infoBits = entropy * data.length;
    const density = maxBits === 0 ? 0 : infoBits / maxBits;
    const redundancy = 1 - density;
    return {
        density,
        entropy,
        redundancy,
        provenance: [`[ALG_T1_N_006] density=${density.toFixed(4)} entropy=${entropy.toFixed(4)} redundancy=${redundancy.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_007 · 互信息
// ============================================================================
function mutualInformation(joint) {
    if (joint.length === 0) {
        return { mutualInfo: 0, normalized: 0, provenance: ['[ALG_T1_N_007] 空联合分布'] };
    }
    // 计算 X 和 Y 的边缘分布
    const xCounts = new Map();
    const yCounts = new Map();
    const xyCounts = new Map();
    for (const { x, y } of joint) {
        xCounts.set(x, (xCounts.get(x) || 0) + 1);
        yCounts.set(y, (yCounts.get(y) || 0) + 1);
        const key = `${x},${y}`;
        xyCounts.set(key, (xyCounts.get(key) || 0) + 1);
    }
    const n = joint.length;
    let mi = 0;
    for (const { x, y } of joint) {
        const pxy = (xyCounts.get(`${x},${y}`) || 0) / n;
        const px = (xCounts.get(x) || 0) / n;
        const py = (yCounts.get(y) || 0) / n;
        if (pxy > 0 && px > 0 && py > 0) {
            mi += pxy * Math.log2(pxy / (px * py));
        }
    }
    // 归一化：MI / min(H(X), H(Y))
    const xProbs = Array.from(xCounts.values()).map(c => c / n);
    const yProbs = Array.from(yCounts.values()).map(c => c / n);
    const hx = computeEntropy(xProbs).entropy;
    const hy = computeEntropy(yProbs).entropy;
    const normalized = Math.min(hx, hy) === 0 ? 0 : mi / Math.min(hx, hy);
    return {
        mutualInfo: mi,
        normalized,
        provenance: [`[ALG_T1_N_007] MI=${mi.toFixed(6)} norm=${normalized.toFixed(4)} Hx=${hx.toFixed(4)} Hy=${hy.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_008 · 条件熵
// ============================================================================
function conditionalEntropy(samples) {
    if (samples.length === 0) {
        return { hXY: 0, hXgivenY: 0, provenance: ['[ALG_T1_N_008] 空样本'] };
    }
    const mi = mutualInformation(samples);
    const xProbs = [];
    const xCounts = new Map();
    for (const s of samples)
        xCounts.set(s.x, (xCounts.get(s.x) || 0) + 1);
    for (const [, c] of xCounts)
        xProbs.push(c / samples.length);
    const hX = computeEntropy(xProbs).entropy;
    // H(X|Y) = H(X) - I(X;Y)
    const hXgivenY = hX - mi.mutualInfo;
    return {
        hXY: hX,
        hXgivenY,
        provenance: [`[ALG_T1_N_008] H(X|Y)=${hXgivenY.toFixed(6)} H(X)=${hX.toFixed(6)} MI=${mi.mutualInfo.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_009 · 相对熵 (KL 散度)
// ============================================================================
function relativeEntropy(p, q) {
    if (p.length !== q.length || p.length === 0) {
        return { klDivergence: Infinity, symmetric: Infinity, provenance: ['[ALG_T1_N_009] 维度不匹配'] };
    }
    const pSum = p.reduce((s, x) => s + x, 0);
    const qSum = q.reduce((s, x) => s + x, 0);
    if (pSum === 0 || qSum === 0) {
        return { klDivergence: Infinity, symmetric: Infinity, provenance: ['[ALG_T1_N_009] 概率和为0'] };
    }
    const pNorm = p.map(x => x / pSum);
    const qNorm = q.map(x => x / qSum);
    let kl = 0;
    let klRev = 0;
    for (let i = 0; i < pNorm.length; i++) {
        if (pNorm[i] > 0 && qNorm[i] > 0) {
            kl += pNorm[i] * Math.log2(pNorm[i] / qNorm[i]);
            klRev += qNorm[i] * Math.log2(qNorm[i] / pNorm[i]);
        }
    }
    // 对称 KL = (KL(P||Q) + KL(Q||P)) / 2
    const symmetric = (kl + klRev) / 2;
    return {
        klDivergence: kl,
        symmetric,
        provenance: [`[ALG_T1_N_009] KL=${kl.toFixed(6)} sym=${symmetric.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_010 · 交叉熵
// ============================================================================
function crossEntropy(p, q) {
    if (p.length !== q.length || p.length === 0) {
        return { crossEnt: Infinity, provenance: ['[ALG_T1_N_010] 维度不匹配'] };
    }
    const pSum = p.reduce((s, x) => s + x, 0);
    const qSum = q.reduce((s, x) => s + x, 0);
    if (pSum === 0 || qSum === 0) {
        return { crossEnt: Infinity, provenance: ['[ALG_T1_N_010] 概率和为0'] };
    }
    const pNorm = p.map(x => x / pSum);
    const qNorm = q.map(x => x / qSum);
    let ce = 0;
    for (let i = 0; i < pNorm.length; i++) {
        if (pNorm[i] > 0 && qNorm[i] > 0) {
            ce -= pNorm[i] * Math.log2(qNorm[i]);
        }
    }
    return {
        crossEnt: ce,
        provenance: [`[ALG_T1_N_010] CE=${ce.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_011 · 熵率
// ============================================================================
function entropyRate(timeSeries) {
    if (timeSeries.length < 2) {
        return { rate: 0, trend: 0, provenance: ['[ALG_T1_N_011] 数据不足'] };
    }
    // 熵率 = 熵变化 / 时间变化
    const rates = [];
    for (let i = 1; i < timeSeries.length; i++) {
        const dt = timeSeries[i].time - timeSeries[i - 1].time;
        const dS = timeSeries[i].entropy - timeSeries[i - 1].entropy;
        if (dt !== 0)
            rates.push(dS / dt);
    }
    const rate = rates.reduce((s, r) => s + r, 0) / rates.length;
    // 趋势 = 速率的变化
    let trend = 0;
    if (rates.length >= 2) {
        trend = (rates[rates.length - 1] - rates[0]) / (rates.length - 1);
    }
    return {
        rate,
        trend,
        provenance: [`[ALG_T1_N_011] rate=${rate.toFixed(6)} trend=${trend.toFixed(6)} samples=${timeSeries.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_012 · 熵产生
// ============================================================================
function entropyProduction(internal, external) {
    if (internal.length === 0 || external.length === 0) {
        return { production: 0, internal: 0, external: 0, provenance: ['[ALG_T1_N_012] 空输入'] };
    }
    const internalEnt = computeEntropy(internal).entropy;
    const externalEnt = computeEntropy(external).entropy;
    // 熵产生 = 内部熵变化 + 外部熵变化（热力学第二定律：dS = dS_internal + dS_external）
    const production = internalEnt + externalEnt;
    return {
        production,
        internal: internalEnt,
        external: externalEnt,
        provenance: [`[ALG_T1_N_012] prod=${production.toFixed(6)} internal=${internalEnt.toFixed(6)} external=${externalEnt.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_013 · 熵输出
// ============================================================================
function entropyExport(system, environment) {
    if (system.length === 0 || environment.length === 0) {
        return { exported: 0, netExport: 0, provenance: ['[ALG_T1_N_013] 空输入'] };
    }
    const systemEnt = computeEntropy(system).entropy;
    const envEnt = computeEntropy(environment).entropy;
    // 熵输出 = 系统熵减少 -> 环境熵增加
    const exported = Math.max(0, envEnt - systemEnt);
    const netExport = exported;
    return {
        exported,
        netExport,
        provenance: [`[ALG_T1_N_013] exported=${exported.toFixed(6)} system=${systemEnt.toFixed(4)} env=${envEnt.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_014 · 熵平衡
// ============================================================================
function entropyBalance(inputs, outputs) {
    const inputSum = inputs.reduce((s, i) => s + i.entropy * i.weight, 0);
    const outputSum = outputs.reduce((s, o) => s + o.entropy * o.weight, 0);
    const netEntropy = inputSum - outputSum;
    // 熵平衡要求输出 >= 输入（第二定律）
    const balanced = outputSum >= inputSum;
    return {
        balanced,
        netEntropy,
        provenance: [`[ALG_T1_N_014] balanced=${balanced} net=${netEntropy.toFixed(6)} in=${inputSum.toFixed(4)} out=${outputSum.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_N_015 · 熵监控
// ============================================================================
function entropyMonitor(history, thresholds) {
    if (history.length === 0) {
        return { status: 'normal', current: 0, trend: 0, provenance: ['[ALG_T1_N_015] 空历史'] };
    }
    const current = history[history.length - 1].entropy;
    const rate = entropyRate(history);
    const trend = rate.rate;
    let status;
    if (current >= thresholds.critical)
        status = 'critical';
    else if (current >= thresholds.warn)
        status = 'warn';
    else
        status = 'normal';
    return {
        status,
        current,
        trend,
        provenance: [`[ALG_T1_N_015] status=${status} current=${current.toFixed(4)} trend=${trend.toFixed(6)}`],
    };
}
