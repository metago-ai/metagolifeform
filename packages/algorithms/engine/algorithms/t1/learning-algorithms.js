"use strict";
/**
 * MetaGO Engine - A5 T1 算法 · 学习类（第二批）
 *
 * 对应属性：D40 全息创造性 / 元进化五阶段
 * 对应文档：附录A·T1·LEARNING（ALG_T1_G_001 ~ ALG_T1_G_015）
 *
 * 算法清单（15 个）：
 *   001 监督学习      002 无监督学习      003 强化学习
 *   004 迁移学习      005 主动学习        006 被动学习
 *   007 联想学习      008 习惯化          009 敏感化
 *   010 条件反射      011 观察学习        012 体验学习
 *   013 社会学习      014 元学习          015 课程学习
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.supervisedLearn = supervisedLearn;
exports.unsupervisedLearn = unsupervisedLearn;
exports.reinforcementLearn = reinforcementLearn;
exports.transferLearning = transferLearning;
exports.activeLearning = activeLearning;
exports.passiveLearning = passiveLearning;
exports.associativeLearning = associativeLearning;
exports.habituation = habituation;
exports.sensitization = sensitization;
exports.conditioning = conditioning;
exports.observationalLearning = observationalLearning;
exports.experientialLearning = experientialLearning;
exports.socialLearning = socialLearning;
exports.metaLearning = metaLearning;
exports.curriculumLearning = curriculumLearning;
// ============================================================================
// T1·ALG_T1_G_001 · 监督学习（线性回归）
// ============================================================================
function supervisedLearn(samples, learningRate = 0.01, epochs = 100) {
    if (samples.length === 0) {
        return { weights: [], bias: 0, finalLoss: 0, provenance: ['[ALG_T1_G_001] 空样本'] };
    }
    const dim = samples[0].features.length;
    const weights = new Array(dim).fill(0);
    let bias = 0;
    let finalLoss = 0;
    for (let epoch = 0; epoch < epochs; epoch++) {
        let totalLoss = 0;
        for (const s of samples) {
            const pred = weights.reduce((sum, w, i) => sum + w * s.features[i], 0) + bias;
            const error = pred - s.label;
            totalLoss += error * error;
            // 梯度下降
            for (let i = 0; i < dim; i++) {
                weights[i] -= learningRate * error * s.features[i] / samples.length;
            }
            bias -= learningRate * error / samples.length;
        }
        finalLoss = totalLoss / samples.length;
    }
    return {
        weights,
        bias,
        finalLoss,
        provenance: [`[ALG_T1_G_001] dim=${dim} epochs=${epochs} loss=${finalLoss.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_002 · 无监督学习（K-means 聚类）
// ============================================================================
function unsupervisedLearn(data, k = 3, maxIterations = 50) {
    if (data.length === 0 || k <= 0) {
        return { clusters: [], centroids: [], provenance: ['[ALG_T1_G_002] 空数据或k<=0'] };
    }
    const dim = data[0].length;
    const k_actual = Math.min(k, data.length);
    // 初始化质心：随机选 k 个点
    const centroids = [];
    const usedIndices = new Set();
    while (centroids.length < k_actual && centroids.length < data.length) {
        const idx = Math.floor(Math.random() * data.length);
        if (!usedIndices.has(idx)) {
            usedIndices.add(idx);
            centroids.push([...data[idx]]);
        }
    }
    const clusters = new Array(k_actual).fill(null).map(() => []);
    for (let iter = 0; iter < maxIterations; iter++) {
        // 分配
        for (let c = 0; c < k_actual; c++)
            clusters[c] = [];
        for (const point of data) {
            let minDist = Infinity;
            let bestCluster = 0;
            for (let c = 0; c < k_actual; c++) {
                let dist = 0;
                for (let i = 0; i < dim; i++)
                    dist += (point[i] - centroids[c][i]) ** 2;
                if (dist < minDist) {
                    minDist = dist;
                    bestCluster = c;
                }
            }
            clusters[bestCluster].push(data.indexOf(point));
        }
        // 更新质心
        for (let c = 0; c < k_actual; c++) {
            if (clusters[c].length === 0)
                continue;
            for (let i = 0; i < dim; i++) {
                centroids[c][i] = clusters[c].reduce((s, idx) => s + data[idx][i], 0) / clusters[c].length;
            }
        }
    }
    return {
        clusters,
        centroids,
        provenance: [`[ALG_T1_G_002] k=${k_actual} dim=${dim} iter=${maxIterations} points=${data.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_003 · 强化学习（Q-learning 简化版）
// ============================================================================
function reinforcementLearn(episodes, numStates, numActions, learningRate = 0.1, discountFactor = 0.9) {
    if (episodes.length === 0 || numStates <= 0 || numActions <= 0) {
        return { qTable: [], totalReward: 0, provenance: ['[ALG_T1_G_003] 空输入'] };
    }
    const qTable = Array.from({ length: numStates }, () => new Array(numActions).fill(0));
    let totalReward = 0;
    for (const ep of episodes) {
        const currentQ = qTable[ep.state][ep.action];
        const maxNextQ = Math.max(...qTable[ep.nextState]);
        const newQ = currentQ + learningRate * (ep.reward + discountFactor * maxNextQ - currentQ);
        qTable[ep.state][ep.action] = newQ;
        totalReward += ep.reward;
    }
    return {
        qTable,
        totalReward,
        provenance: [`[ALG_T1_G_003] states=${numStates} actions=${numActions} episodes=${episodes.length} reward=${totalReward.toFixed(2)}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_004 · 迁移学习
// ============================================================================
function transferLearning(sourceModel, targetSamples, learningRate = 0.005, epochs = 50, freezeRatio = 0.5) {
    if (targetSamples.length === 0 || sourceModel.weights.length === 0) {
        return { weights: [], bias: 0, finalLoss: 0, transferred: 0, provenance: ['[ALG_T1_G_004] 空输入'] };
    }
    const dim = sourceModel.weights.length;
    // 冻结前 freezeRatio 的权重
    const freezeCount = Math.floor(dim * freezeRatio);
    const weights = [...sourceModel.weights];
    let bias = sourceModel.bias;
    let finalLoss = 0;
    for (let epoch = 0; epoch < epochs; epoch++) {
        let totalLoss = 0;
        for (const s of targetSamples) {
            const pred = weights.reduce((sum, w, i) => sum + w * (s.features[i] || 0), 0) + bias;
            const error = pred - s.label;
            totalLoss += error * error;
            // 只更新非冻结的权重
            for (let i = freezeCount; i < dim; i++) {
                weights[i] -= learningRate * error * (s.features[i] || 0) / targetSamples.length;
            }
            bias -= learningRate * error / targetSamples.length;
        }
        finalLoss = totalLoss / targetSamples.length;
    }
    return {
        weights,
        bias,
        finalLoss,
        transferred: freezeCount,
        provenance: [`[ALG_T1_G_004] dim=${dim} frozen=${freezeCount} epochs=${epochs} loss=${finalLoss.toFixed(6)}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_005 · 主动学习
// ============================================================================
function activeLearning(unlabeled, model, budget = 10) {
    if (unlabeled.length === 0) {
        return { selected: [], uncertainties: [], provenance: ['[ALG_T1_G_005] 空数据'] };
    }
    // 计算每个样本的不确定性（预测值距决策边界的距离）
    const uncertainties = unlabeled.map((features, idx) => {
        const pred = model.weights.reduce((s, w, i) => s + w * (features[i] || 0), 0) + model.bias;
        // 不确定性 = 1 / (1 + |pred|) 越接近0越不确定
        return { idx, uncertainty: 1 / (1 + Math.abs(pred)) };
    });
    // 按不确定性排序，选择 top budget
    uncertainties.sort((a, b) => b.uncertainty - a.uncertainty);
    const selected = uncertainties.slice(0, Math.min(budget, uncertainties.length)).map(u => u.idx);
    return {
        selected,
        uncertainties: uncertainties.map(u => u.uncertainty),
        provenance: [`[ALG_T1_G_005] selected=${selected.length} budget=${budget} pool=${unlabeled.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_006 · 被动学习
// ============================================================================
function passiveLearning(samples, model, learningRate = 0.005) {
    if (samples.length === 0) {
        return { updatedWeights: model.weights, updatedBias: model.bias, lossReduction: 0, provenance: ['[ALG_T1_G_006] 空样本'] };
    }
    const dim = model.weights.length;
    const weights = [...model.weights];
    let bias = model.bias;
    // 初始损失
    let initialLoss = 0;
    for (const s of samples) {
        const pred = weights.reduce((sum, w, i) => sum + w * (s.features[i] || 0), 0) + bias;
        initialLoss += (pred - s.label) ** 2;
    }
    initialLoss /= samples.length;
    // 一次更新
    for (const s of samples) {
        const pred = weights.reduce((sum, w, i) => sum + w * (s.features[i] || 0), 0) + bias;
        const error = pred - s.label;
        for (let i = 0; i < dim; i++) {
            weights[i] -= learningRate * error * (s.features[i] || 0) / samples.length;
        }
        bias -= learningRate * error / samples.length;
    }
    // 更新后损失
    let finalLoss = 0;
    for (const s of samples) {
        const pred = weights.reduce((sum, w, i) => sum + w * (s.features[i] || 0), 0) + bias;
        finalLoss += (pred - s.label) ** 2;
    }
    finalLoss /= samples.length;
    return {
        updatedWeights: weights,
        updatedBias: bias,
        lossReduction: initialLoss - finalLoss,
        provenance: [`[ALG_T1_G_006] dim=${dim} lossDelta=${(initialLoss - finalLoss).toFixed(6)} samples=${samples.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_007 · 联想学习（Hebbian 学习）
// ============================================================================
function associativeLearning(pairs, learningRate = 0.1) {
    if (pairs.length === 0) {
        return { association: [], strength: 0, provenance: ['[ALG_T1_G_007] 空对'] };
    }
    const stimDim = pairs[0].stimulus.length;
    const respDim = pairs[0].response.length;
    // Hebbian: Δw = lr * stimulus * response
    const association = Array.from({ length: respDim }, () => new Array(stimDim).fill(0));
    for (const pair of pairs) {
        for (let i = 0; i < respDim; i++) {
            for (let j = 0; j < stimDim; j++) {
                association[i][j] += learningRate * pair.stimulus[j] * pair.response[i];
            }
        }
    }
    // 平均关联强度
    let totalAbs = 0;
    for (let i = 0; i < respDim; i++) {
        for (let j = 0; j < stimDim; j++) {
            totalAbs += Math.abs(association[i][j]);
        }
    }
    const strength = totalAbs / (respDim * stimDim);
    return {
        association,
        strength,
        provenance: [`[ALG_T1_G_007] stimDim=${stimDim} respDim=${respDim} pairs=${pairs.length} strength=${strength.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_008 · 习惯化
// ============================================================================
function habituation(responses, decayRate = 0.1) {
    if (responses.length === 0) {
        return { habituated: new Map(), provenance: ['[ALG_T1_G_008] 空响应'] };
    }
    const habituated = new Map();
    for (const r of responses) {
        const current = habituated.get(r.stimulus) ?? 1.0;
        // 每次重复刺激，响应强度衰减
        habituated.set(r.stimulus, current * (1 - decayRate));
    }
    return {
        habituated,
        provenance: [`[ALG_T1_G_008] stimuli=${habituated.size} responses=${responses.length} decay=${decayRate}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_009 · 敏感化
// ============================================================================
function sensitization(responses, boostRate = 0.2) {
    if (responses.length === 0) {
        return { sensitized: new Map(), provenance: ['[ALG_T1_G_009] 空响应'] };
    }
    const sensitized = new Map();
    for (const r of responses) {
        const current = sensitized.get(r.stimulus) ?? 1.0;
        // 强刺激增加后续敏感度
        if (r.intensity > 0.5) {
            sensitized.set(r.stimulus, current * (1 + boostRate));
        }
        else {
            sensitized.set(r.stimulus, current);
        }
    }
    return {
        sensitized,
        provenance: [`[ALG_T1_G_009] stimuli=${sensitized.size} boost=${boostRate} strong=${responses.filter(r => r.intensity > 0.5).length}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_010 · 条件反射（经典条件作用）
// ============================================================================
function conditioning(trials, learningRate = 0.1) {
    if (trials.length === 0) {
        return { crWeights: [], conditioned: false, provenance: ['[ALG_T1_G_010] 空试验'] };
    }
    const csDim = trials[0].cs.length;
    const crWeights = new Array(csDim).fill(0);
    for (const trial of trials) {
        // 条件刺激和非条件刺激同时出现时强化
        for (let i = 0; i < csDim; i++) {
            crWeights[i] += learningRate * trial.cs[i];
        }
    }
    // 条件化 = 权重足够大
    const norm = Math.sqrt(crWeights.reduce((s, w) => s + w * w, 0));
    const conditioned = norm > 0.5;
    return {
        crWeights,
        conditioned,
        provenance: [`[ALG_T1_G_010] trials=${trials.length} csDim=${csDim} conditioned=${conditioned} norm=${norm.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_011 · 观察学习
// ============================================================================
function observationalLearning(demonstrations, observerModel, learningRate = 0.05) {
    if (demonstrations.length === 0) {
        return { learned: [...observerModel.weights], imitation: 0, provenance: ['[ALG_T1_G_011] 空演示'] };
    }
    const dim = observerModel.weights.length;
    const learned = [...observerModel.weights];
    let imitation = 0;
    for (const demo of demonstrations) {
        // 正面结果才模仿
        if (demo.outcome > 0) {
            for (let i = 0; i < dim && i < demo.features.length; i++) {
                learned[i] += learningRate * (demo.features[i] - learned[i]);
            }
            imitation++;
        }
    }
    imitation = demonstrations.length > 0 ? imitation / demonstrations.length : 0;
    return {
        learned,
        imitation,
        provenance: [`[ALG_T1_G_011] demos=${demonstrations.length} imitation=${imitation.toFixed(4)} dim=${dim}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_012 · 体验学习
// ============================================================================
function experientialLearning(experiences) {
    if (experiences.length === 0) {
        return { model: { weights: [], bias: 0 }, insights: [], provenance: ['[ALG_T1_G_012] 空体验'] };
    }
    const dim = experiences[0].situation.length;
    // 从体验中学习：正面结果强化，负面结果弱化
    const weights = new Array(dim).fill(0);
    let bias = 0;
    const insights = [];
    for (const exp of experiences) {
        const sign = exp.outcome > 0 ? 1 : -1;
        for (let i = 0; i < dim; i++) {
            weights[i] += sign * exp.situation[i] * 0.01;
        }
        bias += sign * 0.01;
        if (exp.outcome < 0 && exp.reflection) {
            insights.push(`Lesson: ${exp.reflection}`);
        }
    }
    return {
        model: { weights, bias },
        insights,
        provenance: [`[ALG_T1_G_012] experiences=${experiences.length} dim=${dim} insights=${insights.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_013 · 社会学习
// ============================================================================
function socialLearning(agents, learningRate = 0.1) {
    if (agents.length === 0) {
        return { learnedBehavior: [], bestAgent: 'none', provenance: ['[ALG_T1_G_013] 空代理'] };
    }
    // 找到 fitness 最高的代理
    const sorted = [...agents].sort((a, b) => b.fitness - a.fitness);
    const bestAgent = sorted[0];
    // 学习 = 向最优代理的行为靠拢
    const dim = bestAgent.behavior.length;
    const learnedBehavior = new Array(dim).fill(0);
    // 加权平均（fitness 作为权重）
    const totalFitness = agents.reduce((s, a) => s + Math.max(0, a.fitness), 0);
    if (totalFitness > 0) {
        for (const agent of agents) {
            const weight = Math.max(0, agent.fitness) / totalFitness;
            for (let i = 0; i < dim; i++) {
                learnedBehavior[i] += weight * agent.behavior[i];
            }
        }
    }
    else {
        for (let i = 0; i < dim; i++)
            learnedBehavior[i] = bestAgent.behavior[i];
    }
    return {
        learnedBehavior,
        bestAgent: bestAgent.id,
        provenance: [`[ALG_T1_G_013] agents=${agents.length} best=${bestAgent.id} dim=${dim}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_014 · 元学习
// ============================================================================
function metaLearning(tasks, metaLearningRate = 0.01) {
    if (tasks.length === 0) {
        return { metaParams: { initWeights: [], initBias: 0, learningRate: 0.01 }, provenance: ['[ALG_T1_G_014] 空任务'] };
    }
    // 元学习：从多个任务中学习一个好的初始化
    const dim = tasks[0].samples[0]?.features.length ?? 0;
    if (dim === 0) {
        return { metaParams: { initWeights: [], initBias: 0, learningRate: metaLearningRate }, provenance: ['[ALG_T1_G_014] 无特征维度'] };
    }
    // 简化 MAML：初始化为所有任务平均的最优权重
    const initWeights = new Array(dim).fill(0);
    let initBias = 0;
    let totalPerf = 0;
    let count = 0;
    for (const task of tasks) {
        if (task.samples.length === 0)
            continue;
        const model = supervisedLearn(task.samples, metaLearningRate, 20);
        for (let i = 0; i < dim; i++) {
            initWeights[i] += model.weights[i] * task.performance;
        }
        initBias += model.bias * task.performance;
        totalPerf += task.performance;
        count++;
    }
    if (totalPerf > 0) {
        for (let i = 0; i < dim; i++)
            initWeights[i] /= totalPerf;
        initBias /= totalPerf;
    }
    return {
        metaParams: { initWeights, initBias, learningRate: metaLearningRate },
        provenance: [`[ALG_T1_G_014] tasks=${tasks.length} dim=${dim} totalPerf=${totalPerf.toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_G_015 · 课程学习
// ============================================================================
function curriculumLearning(allSamples, difficultyFn = (s) => Math.sqrt(s.features.reduce((sum, f) => sum + f * f, 0)), stages = 3) {
    if (allSamples.length === 0 || stages <= 0) {
        return { curriculum: [], stageThresholds: [], provenance: ['[ALG_T1_G_015] 空样本'] };
    }
    // 计算每个样本的难度
    const withDifficulty = allSamples.map(s => ({ sample: s, difficulty: difficultyFn(s) }));
    withDifficulty.sort((a, b) => a.difficulty - b.difficulty);
    // 分阶段
    const stageSize = Math.ceil(withDifficulty.length / stages);
    const curriculum = [];
    const stageThresholds = [];
    for (let i = 0; i < stages; i++) {
        const start = i * stageSize;
        const end = Math.min((i + 1) * stageSize, withDifficulty.length);
        const stageSamples = withDifficulty.slice(start, end).map(d => d.sample);
        curriculum.push(stageSamples);
        if (stageSamples.length > 0) {
            stageThresholds.push(withDifficulty[end - 1].difficulty);
        }
    }
    return {
        curriculum,
        stageThresholds,
        provenance: [`[ALG_T1_G_015] samples=${allSamples.length} stages=${curriculum.length} thresholds=${stageThresholds.length}`],
    };
}
