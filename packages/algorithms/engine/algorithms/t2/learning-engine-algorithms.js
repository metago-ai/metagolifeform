"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 学习引擎封装类（ALG_T2_G_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 221~240 项（学习引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 learning engine 的私有辅助方法
 *   - 处理模式提取、技能生成、反馈循环、自适应学习
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.patternExtract = patternExtract;
exports.skillGenerate = skillGenerate;
exports.feedbackLoop = feedbackLoop;
exports.adaptiveLearningRate = adaptiveLearningRate;
exports.knowledgeTransfer = knowledgeTransfer;
exports.learningCurve = learningCurve;
exports.experienceReplay = experienceReplay;
exports.reinforcementSignal = reinforcementSignal;
exports.curriculumLearning = curriculumLearning;
exports.knowledgeGraphBuild = knowledgeGraphBuild;
exports.learningStrategySelect = learningStrategySelect;
exports.overfittingDetect = overfittingDetect;
exports.modelDistill = modelDistill;
exports.activeLearningSelect = activeLearningSelect;
exports.onlineLearningUpdate = onlineLearningUpdate;
exports.ensembleLearning = ensembleLearning;
exports.gradientCalculate = gradientCalculate;
exports.learningAssess = learningAssess;
exports.knowledgeConsolidate = knowledgeConsolidate;
exports.learningComprehensiveAssessment = learningComprehensiveAssessment;
// ============================================================================
// ALG_T2_G_001 · 模式提取
// ============================================================================
function patternExtract(samples, minFrequency = 2) {
    if (samples.length === 0) {
        return { patterns: [], coverage: 0, provenance: ['[ALG_T2_G_001] 空样本'] };
    }
    const patternMap = new Map();
    for (const s of samples) {
        const key = JSON.stringify({ input: s.input, output: s.output });
        if (!patternMap.has(key)) {
            patternMap.set(key, { count: 0, examples: [], correct: 0 });
        }
        const p = patternMap.get(key);
        p.count++;
        if (p.examples.length < 3)
            p.examples.push(s);
        if (s.correct)
            p.correct++;
    }
    const patterns = [];
    let covered = 0;
    for (const [key, p] of patternMap) {
        if (p.count >= minFrequency) {
            patterns.push({
                id: `pattern_${patterns.length + 1}`,
                pattern: key,
                frequency: p.count,
                confidence: p.correct / p.count,
                examples: p.examples,
            });
            covered += p.count;
        }
    }
    return {
        patterns,
        coverage: covered / samples.length,
        provenance: [`[ALG_T2_G_001] samples=${samples.length} patterns=${patterns.length} coverage=${(covered / samples.length).toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_G_002 · 技能生成
// ============================================================================
function skillGenerate(patterns, threshold = 0.7) {
    if (patterns.length === 0) {
        return { skills: [], provenance: ['[ALG_T2_G_002] 无模式'] };
    }
    const skills = patterns
        .filter(p => p.confidence >= threshold)
        .map(p => ({
        name: `skill_${p.id}`,
        pattern: p.pattern,
        proficiency: p.confidence * Math.min(1, p.frequency / 10),
    }));
    return {
        skills,
        provenance: [`[ALG_T2_G_002] patterns=${patterns.length} skills=${skills.length} threshold=${threshold}`],
    };
}
// ============================================================================
// ALG_T2_G_003 · 反馈循环
// ============================================================================
function feedbackLoop(predictions) {
    if (predictions.length === 0) {
        return { accuracy: 0, errorRate: 0, improvement: 0, provenance: ['[ALG_T2_G_003] 空预测'] };
    }
    const correct = predictions.filter(p => p.correct).length;
    const accuracy = correct / predictions.length;
    const errorRate = 1 - accuracy;
    // 改进：后半段比前半段准确率高
    const mid = Math.floor(predictions.length / 2);
    const firstHalf = predictions.slice(0, mid).filter(p => p.correct).length / Math.max(mid, 1);
    const secondHalf = predictions.slice(mid).filter(p => p.correct).length / Math.max(predictions.length - mid, 1);
    const improvement = secondHalf - firstHalf;
    return {
        accuracy,
        errorRate,
        improvement,
        provenance: [`[ALG_T2_G_003] n=${predictions.length} acc=${accuracy.toFixed(4)} err=${errorRate.toFixed(4)} improve=${improvement.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_G_004 · 自适应学习率
// ============================================================================
function adaptiveLearningRate(errorHistory, initialRate = 0.1, decay = 0.95, minRate = 0.001) {
    if (errorHistory.length === 0) {
        return { rate: initialRate, converged: false, provenance: ['[ALG_T2_G_004] 空历史'] };
    }
    let rate = initialRate;
    for (let i = 0; i < errorHistory.length; i++) {
        rate = Math.max(minRate, rate * decay);
    }
    const recentErrors = errorHistory.slice(-5);
    const avgError = recentErrors.reduce((s, x) => s + x, 0) / recentErrors.length;
    const converged = avgError < 0.01;
    return {
        rate,
        converged,
        provenance: [`[ALG_T2_G_004] rate=${rate.toFixed(6)} converged=${converged} avgErr=${avgError.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_G_005 · 知识迁移
// ============================================================================
function knowledgeTransfer(source, target, similarity) {
    if (source.skills.length === 0 || similarity <= 0) {
        return { transferred: [], transferRate: 0, provenance: ['[ALG_T2_G_005] 无可迁移技能'] };
    }
    const transferred = source.skills
        .filter(s => !target.existingSkills.includes(s.name))
        .map(s => ({
        name: s.name,
        adjustedProficiency: s.proficiency * similarity,
    }));
    const transferRate = transferred.length / source.skills.length;
    return {
        transferred,
        transferRate,
        provenance: [`[ALG_T2_G_005] source=${source.skills.length} transferred=${transferred.length} sim=${similarity.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_G_006 · 学习曲线
// ============================================================================
function learningCurve(performances) {
    if (performances.length < 3) {
        return { asymptote: 0, rate: 0, plateaued: false, provenance: ['[ALG_T2_G_006] 数据不足'] };
    }
    // 拟合 y = a - b * e^(-c*x)
    const last = performances[performances.length - 1].performance;
    const first = performances[0].performance;
    const asymptote = Math.min(1, last * 1.1);
    const rate = (last - first) / performances.length;
    const recent = performances.slice(-3);
    const recentImprovement = Math.max(...recent.map(p => p.performance)) - Math.min(...recent.map(p => p.performance));
    const plateaued = recentImprovement < 0.01;
    return {
        asymptote,
        rate,
        plateaued,
        provenance: [`[ALG_T2_G_006] asymptote=${asymptote.toFixed(4)} rate=${rate.toFixed(4)} plateaued=${plateaued}`],
    };
}
// ============================================================================
// ALG_T2_G_007 · 经验回放
// ============================================================================
function experienceReplay(experiences, batchSize = 10, prioritizeCorrect = true) {
    if (experiences.length === 0 || batchSize <= 0) {
        return { batch: [], provenance: ['[ALG_T2_G_007] 空经验'] };
    }
    const sorted = prioritizeCorrect
        ? [...experiences].sort((a, b) => (b.correct ? 1 : 0) - (a.correct ? 1 : 0))
        : [...experiences];
    const batch = sorted.slice(0, Math.min(batchSize, sorted.length));
    return {
        batch,
        provenance: [`[ALG_T2_G_007} experiences=${experiences.length} batch=${batch.length} prioritized=${prioritizeCorrect}`],
    };
}
// ============================================================================
// ALG_T2_G_008 · 强化学习信号
// ============================================================================
function reinforcementSignal(actions, discountFactor = 0.9) {
    if (actions.length === 0) {
        return { qValues: [], bestAction: '', provenance: ['[ALG_T2_G_008] 空动作'] };
    }
    const actionMap = new Map();
    for (const a of actions) {
        const current = actionMap.get(a.action) || 0;
        actionMap.set(a.action, current * discountFactor + a.reward);
    }
    const qValues = Array.from(actionMap.entries()).map(([action, qValue]) => ({ action, qValue }));
    qValues.sort((a, b) => b.qValue - a.qValue);
    return {
        qValues,
        bestAction: qValues[0].action,
        provenance: [`[ALG_T2_G_008] actions=${actions.length} unique=${qValues.length} best=${qValues[0].action}`],
    };
}
// ============================================================================
// ALG_T2_G_009 · 课程学习
// ============================================================================
function curriculumLearning(tasks, currentLevel) {
    if (tasks.length === 0) {
        return { sequence: [], nextTask: null, provenance: ['[ALG_T2_G_009] 无任务'] };
    }
    // 拓扑排序 + 难度排序
    const sorted = [...tasks].sort((a, b) => a.difficulty - b.difficulty);
    const sequence = [];
    const completed = new Set();
    for (let i = 0; i < sorted.length; i++) {
        for (const task of sorted) {
            if (completed.has(task.id))
                continue;
            if (task.difficulty > currentLevel + 0.2)
                continue;
            if (task.prerequisite && !completed.has(task.prerequisite))
                continue;
            sequence.push(task.id);
            completed.add(task.id);
        }
        if (sequence.length === sorted.length)
            break;
    }
    const nextTask = sequence.find(id => !completed.has(id + '_done')) || sequence[0] || null;
    return {
        sequence,
        nextTask,
        provenance: [`[ALG_T2_G_009] tasks=${tasks.length} sequence=${sequence.length} level=${currentLevel}`],
    };
}
// ============================================================================
// ALG_T2_G_010 · 知识图谱构建
// ============================================================================
function knowledgeGraphBuild(facts) {
    if (facts.length === 0) {
        return { nodes: new Set(), edges: [], provenance: ['[ALG_T2_G_010] 无事实'] };
    }
    const nodes = new Set();
    const edges = [];
    for (const f of facts) {
        nodes.add(f.subject);
        nodes.add(f.object);
        edges.push({ from: f.subject, to: f.object, predicate: f.predicate, weight: f.confidence });
    }
    return {
        nodes,
        edges,
        provenance: [`[ALG_T2_G_010] facts=${facts.length} nodes=${nodes.size} edges=${edges.length}`],
    };
}
// ============================================================================
// ALG_T2_G_011 · 学习策略选择
// ============================================================================
function learningStrategySelect(task, strategies) {
    if (strategies.length === 0) {
        return { selected: 'none', alternatives: [], provenance: ['[ALG_T2_G_011] 无策略'] };
    }
    const suitable = strategies.filter(s => s.suitableTypes.includes(task.type) &&
        task.difficulty >= s.difficultyRange[0] &&
        task.difficulty <= s.difficultyRange[1] &&
        task.dataVolume >= s.dataReq);
    if (suitable.length === 0) {
        return { selected: 'none', alternatives: [], provenance: [`[ALG_T2_G_011] 无匹配策略`] };
    }
    return {
        selected: suitable[0].name,
        alternatives: suitable.slice(1).map(s => s.name),
        provenance: [`[ALG_T2_G_011] type=${task.type} selected=${suitable[0].name} alternatives=${suitable.length - 1}`],
    };
}
// ============================================================================
// ALG_T2_G_012 · 过拟合检测
// ============================================================================
function overfittingDetect(trainingError, validationError, patience = 5) {
    const n = Math.min(trainingError.length, validationError.length);
    if (n < patience) {
        return { overfitted: false, divergencePoint: -1, provenance: ['[ALG_T2_G_012] 数据不足'] };
    }
    let overfitted = false;
    let divergencePoint = -1;
    for (let i = patience; i < n; i++) {
        const trainRecent = trainingError.slice(i - patience, i);
        const valRecent = validationError.slice(i - patience, i);
        const trainTrend = trainRecent[trainRecent.length - 1] - trainRecent[0];
        const valTrend = valRecent[valRecent.length - 1] - valRecent[0];
        // 训练误差下降但验证误差上升 = 过拟合
        if (trainTrend < 0 && valTrend > 0) {
            overfitted = true;
            divergencePoint = i - patience;
            break;
        }
    }
    return {
        overfitted,
        divergencePoint,
        provenance: [`[ALG_T2_G_012] overfitted=${overfitted} point=${divergencePoint}`],
    };
}
// ============================================================================
// ALG_T2_G_013 · 模型蒸馏
// ============================================================================
function modelDistill(teacher, student) {
    const n = Math.min(teacher.predictions.length, student.predictions.length);
    if (n === 0) {
        return { distillationLoss: 0, alignment: 0, provenance: ['[ALG_T2_G_013] 空预测'] };
    }
    let matches = 0;
    let totalLoss = 0;
    for (let i = 0; i < n; i++) {
        const tOut = JSON.stringify(teacher.predictions[i].output);
        const sOut = JSON.stringify(student.predictions[i].output);
        if (tOut === sOut)
            matches++;
        // 简化的损失：基于输出差异
        totalLoss += tOut === sOut ? 0 : 1;
    }
    return {
        distillationLoss: totalLoss / n,
        alignment: matches / n,
        provenance: [`[ALG_T2_G_013] n=${n} align=${(matches / n).toFixed(4)} loss=${(totalLoss / n).toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_G_014 · 主动学习
// ============================================================================
function activeLearningSelect(unlabeled, budget) {
    if (unlabeled.length === 0 || budget <= 0) {
        return { selected: [], expectedInformationGain: 0, provenance: ['[ALG_T2_G_014] 空数据'] };
    }
    const sorted = [...unlabeled].sort((a, b) => b.uncertainty - a.uncertainty);
    const selected = sorted.slice(0, Math.min(budget, sorted.length)).map(x => x.id);
    const gain = selected.reduce((s, id) => {
        const item = unlabeled.find(u => u.id === id);
        return s + (item?.uncertainty || 0);
    }, 0);
    return {
        selected,
        expectedInformationGain: gain,
        provenance: [`[ALG_T2_G_014] pool=${unlabeled.length} budget=${budget} selected=${selected.length} gain=${gain.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_G_015 · 在线学习
// ============================================================================
function onlineLearningUpdate(model, sample, learningRate = 0.01) {
    if (model.weights.length !== sample.features.length) {
        return { updatedModel: model, loss: 0, provenance: ['[ALG_T2_G_015] 维度不匹配'] };
    }
    // 简单的线性模型 + SGD
    const prediction = model.weights.reduce((s, w, i) => s + w * sample.features[i], 0) + model.bias;
    const error = prediction - sample.label;
    const loss = error * error;
    const updatedWeights = model.weights.map((w, i) => w - learningRate * error * sample.features[i]);
    const updatedBias = model.bias - learningRate * error;
    return {
        updatedModel: { weights: updatedWeights, bias: updatedBias },
        loss,
        provenance: [`[ALG_T2_G_015] pred=${prediction.toFixed(4)} label=${sample.label} loss=${loss.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_G_016 · 集成学习
// ============================================================================
function ensembleLearning(models, method = 'average', weights) {
    if (models.length === 0) {
        return { ensemble: [], provenance: ['[ALG_T2_G_016] 无模型'] };
    }
    const allIds = new Set();
    for (const m of models)
        for (const p of m.predictions)
            allIds.add(p.id);
    const ensemble = [];
    for (const id of allIds) {
        const preds = models.map(m => m.predictions.find(p => p.id === id)?.value).filter(v => v !== undefined);
        let value;
        if (method === 'average') {
            value = preds.reduce((s, x) => s + x, 0) / preds.length;
        }
        else if (method === 'majority') {
            const counts = new Map();
            for (const p of preds)
                counts.set(p, (counts.get(p) || 0) + 1);
            value = Array.from(counts.entries()).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
        }
        else {
            const w = weights || models.map(() => 1 / models.length);
            value = preds.reduce((s, x, i) => s + x * (w[i] || 0), 0);
        }
        ensemble.push({ id, value });
    }
    return {
        ensemble,
        provenance: [`[ALG_T2_G_016] models=${models.length} method=${method} predictions=${ensemble.length}`],
    };
}
// ============================================================================
// ALG_T2_G_017 · 梯度计算
// ============================================================================
function gradientCalculate(lossFn, params, epsilon = 1e-6) {
    if (params.length === 0) {
        return { gradient: [], provenance: ['[ALG_T2_G_017] 空参数'] };
    }
    const gradient = params.map((_, i) => {
        const paramsPlus = [...params];
        paramsPlus[i] += epsilon;
        const paramsMinus = [...params];
        paramsMinus[i] -= epsilon;
        return (lossFn(paramsPlus) - lossFn(paramsMinus)) / (2 * epsilon);
    });
    return {
        gradient,
        provenance: [`[ALG_T2_G_017] params=${params.length} epsilon=${epsilon} maxGrad=${Math.max(...gradient.map(Math.abs)).toFixed(6)}`],
    };
}
// ============================================================================
// ALG_T2_G_018 · 学习评估
// ============================================================================
function learningAssess(results) {
    const overall = (results.accuracy + results.precision + results.recall + results.f1) / 4;
    const grade = overall >= 0.9 ? 'A' : overall >= 0.8 ? 'B' : overall >= 0.7 ? 'C' : overall >= 0.6 ? 'D' : 'F';
    const recommendations = [];
    if (results.accuracy < 0.7)
        recommendations.push('increase_training_data');
    if (results.precision < 0.7)
        recommendations.push('reduce_false_positives');
    if (results.recall < 0.7)
        recommendations.push('reduce_false_negatives');
    if (results.f1 < 0.7)
        recommendations.push('balance_precision_recall');
    if (results.samples < 100)
        recommendations.push('collect_more_samples');
    return {
        overall,
        grade,
        recommendations,
        provenance: [`[ALG_T2_G_018] overall=${overall.toFixed(4)} grade=${grade} samples=${results.samples}`],
    };
}
// ============================================================================
// ALG_T2_G_019 · 知识巩固
// ============================================================================
function knowledgeConsolidate(shortTerm, longTerm, threshold = 0.5) {
    if (shortTerm.length === 0) {
        return { consolidated: longTerm, newKnowledge: [], provenance: ['[ALG_T2_G_019] 空短期'] };
    }
    const consolidated = [...longTerm];
    const newKnowledge = [];
    for (const s of shortTerm) {
        if (s.strength >= threshold) {
            const existing = consolidated.find(l => l.content === s.content);
            if (existing) {
                existing.strength = Math.min(1, existing.strength + s.strength * 0.1);
            }
            else {
                newKnowledge.push(s);
                consolidated.push(s);
            }
        }
    }
    return {
        consolidated,
        newKnowledge,
        provenance: [`[ALG_T2_G_019] short=${shortTerm.length} new=${newKnowledge.length} total=${consolidated.length}`],
    };
}
// ============================================================================
// ALG_T2_G_020 · 学习综合评估
// ============================================================================
function learningComprehensiveAssessment(metrics) {
    const overall = metrics.accuracy * 0.3 +
        metrics.convergence * 0.2 +
        metrics.generalization * 0.25 +
        metrics.efficiency * 0.1 +
        metrics.robustness * 0.15;
    let stage;
    if (overall >= 0.9)
        stage = 'mastered';
    else if (overall >= 0.7)
        stage = 'proficient';
    else if (overall >= 0.5)
        stage = 'developing';
    else if (overall >= 0.3)
        stage = 'novice';
    else
        stage = 'beginner';
    return {
        overall,
        stage,
        provenance: [`[ALG_T2_G_020] overall=${overall.toFixed(4)} stage=${stage}`],
    };
}
