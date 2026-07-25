"use strict";
/**
 * MetaGO Engine - A5 T2 算法 · 对话创造引擎封装类（ALG_T2_A_001~020）
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.recognizeDialogIntent = recognizeDialogIntent;
exports.manageDialogContext = manageDialogContext;
exports.analyzeDialogSentiment = analyzeDialogSentiment;
exports.detectDialogTopic = detectDialogTopic;
exports.generateDialogSummary = generateDialogSummary;
exports.checkDialogConsistency = checkDialogConsistency;
exports.controlDialogFlow = controlDialogFlow;
exports.analyzeParticipants = analyzeParticipants;
exports.extractKeyInformation = extractKeyInformation;
exports.generateResponse = generateResponse;
exports.assessDialogQuality = assessDialogQuality;
exports.detectInterruption = detectInterruption;
exports.trackDialogFocus = trackDialogFocus;
exports.trackDialogEmotion = trackDialogEmotion;
exports.selectDialogStrategy = selectDialogStrategy;
exports.compressDialogHistory = compressDialogHistory;
exports.recognizeEntities = recognizeEntities;
exports.predictNextTurn = predictNextTurn;
exports.fallbackStrategy = fallbackStrategy;
exports.comprehensiveDialogAssessment = comprehensiveDialogAssessment;
// ALG_T2_A_001 · 对话意图识别
function recognizeDialogIntent(utterance, intents) {
    if (intents.length === 0) {
        return { intent: null, confidence: 0, provenance: ['[ALG_T2_A_001] 无意图库'] };
    }
    const lower = utterance.toLowerCase();
    let best = null;
    let bestScore = 0;
    for (const intent of intents) {
        let score = 0;
        for (const kw of intent.keywords) {
            if (lower.includes(kw.toLowerCase())) {
                score += intent.weight / intent.keywords.length;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            best = intent.name;
        }
    }
    return {
        intent: best,
        confidence: Math.min(1, bestScore),
        provenance: [`[ALG_T2_A_001] intent=${best} conf=${Math.min(1, bestScore).toFixed(4)}`],
    };
}
// ALG_T2_A_002 · 对话上下文管理
function manageDialogContext(current, newTurn, maxHistory = 10) {
    const history = [...current.history, newTurn];
    if (history.length > maxHistory) {
        history.splice(0, history.length - maxHistory);
    }
    const participants = current.participants.includes(newTurn.speaker)
        ? current.participants
        : [...current.participants, newTurn.speaker];
    return {
        updated: {
            history,
            topic: current.topic,
            participants,
        },
        provenance: [`[ALG_T2_A_002] history=${history.length} participants=${participants.length}`],
    };
}
// ALG_T2_A_003 · 对话情感分析
function analyzeDialogSentiment(text, positiveWords = ['好', '优秀', '棒', '喜欢', '满意', 'good', 'great'], negativeWords = ['差', '糟糕', '讨厌', '不满', 'bad', 'terrible']) {
    const lower = text.toLowerCase();
    let pos = 0;
    let neg = 0;
    for (const w of positiveWords) {
        if (lower.includes(w.toLowerCase()))
            pos++;
    }
    for (const w of negativeWords) {
        if (lower.includes(w.toLowerCase()))
            neg++;
    }
    const score = pos - neg;
    const sentiment = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
    return {
        sentiment,
        score,
        provenance: [`[ALG_T2_A_003] sentiment=${sentiment} pos=${pos} neg=${neg}`],
    };
}
// ALG_T2_A_004 · 对话话题检测
function detectDialogTopic(text, topics) {
    if (topics.length === 0) {
        return { topic: null, confidence: 0, provenance: ['[ALG_T2_A_004] 无话题库'] };
    }
    const lower = text.toLowerCase();
    let best = null;
    let bestCount = 0;
    for (const t of topics) {
        let count = 0;
        for (const kw of t.keywords) {
            if (lower.includes(kw.toLowerCase()))
                count++;
        }
        if (count > bestCount) {
            bestCount = count;
            best = t.name;
        }
    }
    const maxKw = Math.max(...topics.map(t => t.keywords.length));
    return {
        topic: best,
        confidence: maxKw === 0 ? 0 : bestCount / maxKw,
        provenance: [`[ALG_T2_A_004] topic=${best} count=${bestCount}`],
    };
}
// ALG_T2_A_005 · 对话摘要生成
function generateDialogSummary(history, maxSentences = 3) {
    if (history.length === 0) {
        return { summary: '', keyPoints: [], provenance: ['[ALG_T2_A_005] 无历史'] };
    }
    const sorted = [...history].sort((a, b) => b.content.length - a.content.length);
    const keyPoints = sorted.slice(0, maxSentences).map(t => `${t.speaker}: ${t.content.substring(0, 50)}`);
    const summary = keyPoints.join(' | ');
    return {
        summary,
        keyPoints,
        provenance: [`[ALG_T2_A_005] turns=${history.length} points=${keyPoints.length}`],
    };
}
// ALG_T2_A_006 · 对话一致性检查
function checkDialogConsistency(statements) {
    const conflicts = [];
    for (let i = 0; i < statements.length; i++) {
        for (let j = i + 1; j < statements.length; j++) {
            const sim = stringSimilaritySimple(statements[i], statements[j]);
            if (sim > 0.3 && sim < 0.7) {
                conflicts.push([statements[i], statements[j]]);
            }
        }
    }
    return {
        consistent: conflicts.length === 0,
        conflicts,
        provenance: [`[ALG_T2_A_006] statements=${statements.length} conflicts=${conflicts.length}`],
    };
}
function stringSimilaritySimple(a, b) {
    if (a === b)
        return 1;
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    let inter = 0;
    for (const w of setA)
        if (setB.has(w))
            inter++;
    const union = setA.size + setB.size - inter;
    return union === 0 ? 0 : inter / union;
}
// ALG_T2_A_007 · 对话流程控制
function controlDialogFlow(current, intent) {
    const transitions = {
        greeting: [
            { intent: 'ask', next: 'information', action: 'provide-info' },
            { intent: 'greet', next: 'greeting', action: 'respond-greeting' },
        ],
        information: [
            { intent: 'negotiate', next: 'negotiation', action: 'start-negotiation' },
            { intent: 'ask', next: 'information', action: 'provide-more-info' },
            { intent: 'close', next: 'closing', action: 'prepare-closing' },
        ],
        negotiation: [
            { intent: 'agree', next: 'closing', action: 'finalize' },
            { intent: 'reject', next: 'negotiation', action: 'adjust-offer' },
            { intent: 'ask', next: 'information', action: 'provide-info' },
        ],
        closing: [
            { intent: 'greet', next: 'greeting', action: 'restart' },
            { intent: 'close', next: 'closing', action: 'finalize' },
        ],
    };
    const rules = transitions[current] || [];
    const match = rules.find(r => r.intent === intent) || rules[0];
    if (!match) {
        return { next: current, action: 'stay', provenance: [`[ALG_T2_A_007] no transition from ${current}`] };
    }
    return {
        next: match.next,
        action: match.action,
        provenance: [`[ALG_T2_A_007] ${current}->${match.next} intent=${intent}`],
    };
}
// ALG_T2_A_008 · 对话参与者分析
function analyzeParticipants(history) {
    if (history.length === 0) {
        return { dominant: null, participation: {}, provenance: ['[ALG_T2_A_008] 无历史'] };
    }
    const counts = {};
    for (const turn of history) {
        counts[turn.speaker] = (counts[turn.speaker] || 0) + 1;
    }
    let dominant = null;
    let max = 0;
    for (const [speaker, count] of Object.entries(counts)) {
        if (count > max) {
            max = count;
            dominant = speaker;
        }
    }
    const participation = {};
    for (const [speaker, count] of Object.entries(counts)) {
        participation[speaker] = count / history.length;
    }
    return {
        dominant,
        participation,
        provenance: [`[ALG_T2_A_008] dominant=${dominant} participants=${Object.keys(counts).length}`],
    };
}
// ALG_T2_A_009 · 对话关键信息提取
function extractKeyInformation(text, patterns) {
    const extracted = {};
    for (const p of patterns) {
        try {
            const regex = new RegExp(p.regex, 'g');
            const matches = text.match(regex);
            if (matches) {
                extracted[p.name] = matches;
            }
        }
        catch {
            // 跳过无效正则
        }
    }
    return {
        extracted,
        provenance: [`[ALG_T2_A_009] patterns=${patterns.length} found=${Object.keys(extracted).length}`],
    };
}
// ALG_T2_A_010 · 对话响应生成
function generateResponse(intent, templates, context) {
    const candidates = templates[intent];
    if (!candidates || candidates.length === 0) {
        return { response: '抱歉，我不太理解。', provenance: ['[ALG_T2_A_010] 无模板'] };
    }
    let response = candidates[Math.floor(Math.random() * candidates.length)];
    if (context) {
        for (const [key, value] of Object.entries(context)) {
            response = response.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
    }
    return {
        response,
        provenance: [`[ALG_T2_A_010] intent=${intent} template=${candidates.length}`],
    };
}
// ALG_T2_A_011 · 对话质量评估
function assessDialogQuality(history) {
    if (history.length === 0) {
        return { coherence: 0, engagement: 0, completeness: 0, provenance: ['[ALG_T2_A_011] 无历史'] };
    }
    let coherenceSum = 0;
    for (let i = 1; i < history.length; i++) {
        coherenceSum += stringSimilaritySimple(history[i - 1].content, history[i].content);
    }
    const coherence = coherenceSum / Math.max(1, history.length - 1);
    const speakers = new Set(history.map(t => t.speaker));
    const engagement = Math.min(1, speakers.size / 3);
    const avgLength = history.reduce((s, t) => s + t.content.length, 0) / history.length;
    const completeness = Math.min(1, avgLength / 100);
    return {
        coherence,
        engagement,
        completeness,
        provenance: [`[ALG_T2_A_011] coh=${coherence.toFixed(4)} eng=${engagement.toFixed(4)} comp=${completeness.toFixed(4)}`],
    };
}
// ALG_T2_A_012 · 对话打断检测
function detectInterruption(turns) {
    const interruptions = [];
    for (let i = 1; i < turns.length; i++) {
        const gap = turns[i].timestamp - turns[i - 1].timestamp;
        const prevLen = turns[i - 1].content.length;
        if (gap < prevLen * 10 && gap < 1000) {
            interruptions.push(i);
        }
    }
    return {
        interruptions,
        provenance: [`[ALG_T2_A_012] interruptions=${interruptions.length} turns=${turns.length}`],
    };
}
// ALG_T2_A_013 · 对话焦点追踪
function trackDialogFocus(history, topics) {
    const focusTimeline = [];
    const topicCounts = {};
    for (let i = 0; i < history.length; i++) {
        const detected = detectDialogTopic(history[i].content, topics);
        focusTimeline.push({ turn: i, topic: detected.topic });
        if (detected.topic) {
            topicCounts[detected.topic] = (topicCounts[detected.topic] || 0) + 1;
        }
    }
    let dominantTopic = null;
    let maxCount = 0;
    for (const [topic, count] of Object.entries(topicCounts)) {
        if (count > maxCount) {
            maxCount = count;
            dominantTopic = topic;
        }
    }
    return {
        focusTimeline,
        dominantTopic,
        provenance: [`[ALG_T2_A_013] turns=${history.length} dominant=${dominantTopic}`],
    };
}
// ALG_T2_A_014 · 对话情绪追踪
function trackDialogEmotion(history) {
    const emotionTimeline = [];
    let totalScore = 0;
    for (let i = 0; i < history.length; i++) {
        const result = analyzeDialogSentiment(history[i].content);
        emotionTimeline.push({ turn: i, sentiment: result.sentiment, score: result.score });
        totalScore += result.score;
    }
    const avg = history.length === 0 ? 0 : totalScore / history.length;
    const overall = avg > 0.5 ? 'positive' : avg < -0.5 ? 'negative' : 'neutral';
    return {
        emotionTimeline,
        overallSentiment: overall,
        provenance: [`[ALG_T2_A_014] turns=${history.length} overall=${overall}`],
    };
}
// ALG_T2_A_015 · 对话策略选择
function selectDialogStrategy(context, strategies) {
    if (strategies.length === 0) {
        return { strategy: null, provenance: ['[ALG_T2_A_015] 无策略'] };
    }
    const sorted = [...strategies].sort((a, b) => b.appropriateness - a.appropriateness);
    return {
        strategy: sorted[0].name,
        provenance: [`[ALG_T2_A_015] strategy=${sorted[0].name} app=${sorted[0].appropriateness.toFixed(4)}`],
    };
}
// ALG_T2_A_016 · 对话历史压缩
function compressDialogHistory(history, maxTurns = 5) {
    if (history.length <= maxTurns) {
        return { compressed: history, removedCount: 0, provenance: ['[ALG_T2_A_016] 无需压缩'] };
    }
    const recent = history.slice(-maxTurns);
    const summary = generateDialogSummary(history.slice(0, -maxTurns));
    const summaryTurn = {
        speaker: 'system',
        content: `[摘要] ${summary.summary}`,
        timestamp: recent[0].timestamp - 1,
    };
    return {
        compressed: [summaryTurn, ...recent],
        removedCount: history.length - maxTurns,
        provenance: [`[ALG_T2_A_016] orig=${history.length} compressed=${maxTurns + 1}`],
    };
}
// ALG_T2_A_017 · 对话实体识别
function recognizeEntities(text, entityTypes) {
    const entities = [];
    for (const et of entityTypes) {
        for (const pattern of et.patterns) {
            try {
                const regex = new RegExp(pattern, 'g');
                const matches = text.match(regex);
                if (matches) {
                    for (const m of matches) {
                        entities.push({ type: et.type, value: m });
                    }
                }
            }
            catch {
                // 跳过无效正则
            }
        }
    }
    return {
        entities,
        provenance: [`[ALG_T2_A_017] types=${entityTypes.length} found=${entities.length}`],
    };
}
// ALG_T2_A_018 · 对话轮次预测
function predictNextTurn(history, possibleIntents) {
    if (history.length === 0 || possibleIntents.length === 0) {
        return { likelyIntent: 'unknown', confidence: 0, provenance: ['[ALG_T2_A_018] 数据不足'] };
    }
    const lastSpeaker = history[history.length - 1].speaker;
    const expectedSpeaker = history.length >= 2
        ? history.filter(t => t.speaker !== lastSpeaker).slice(-1)[0]?.speaker || lastSpeaker
        : lastSpeaker;
    const intentCounts = {};
    for (const intent of possibleIntents) {
        intentCounts[intent] = 0;
    }
    for (const turn of history) {
        if (turn.intent && intentCounts[turn.intent] !== undefined) {
            intentCounts[turn.intent]++;
        }
    }
    let likely = possibleIntents[0];
    let max = -1;
    for (const [intent, count] of Object.entries(intentCounts)) {
        if (count > max) {
            max = count;
            likely = intent;
        }
    }
    const total = Object.values(intentCounts).reduce((s, c) => s + c, 0);
    return {
        likelyIntent: likely,
        confidence: total === 0 ? 0.5 : max / total,
        provenance: [`[ALG_T2_A_018] likely=${likely} conf=${(total === 0 ? 0.5 : max / total).toFixed(4)} expected=${expectedSpeaker}`],
    };
}
// ALG_T2_A_019 · 对话回退策略
function fallbackStrategy(confidence, threshold = 0.5) {
    if (confidence >= threshold) {
        return {
            action: 'proceed',
            reason: 'confidence-sufficient',
            provenance: [`[ALG_T2_A_019] proceed conf=${confidence.toFixed(4)}`],
        };
    }
    if (confidence >= threshold * 0.5) {
        return {
            action: 'clarify',
            reason: 'low-confidence-need-clarification',
            provenance: [`[ALG_T2_A_019] clarify conf=${confidence.toFixed(4)}`],
        };
    }
    return {
        action: 'escalate',
        reason: 'very-low-confidence-escalate',
        provenance: [`[ALG_T2_A_019] escalate conf=${confidence.toFixed(4)}`],
    };
}
// ALG_T2_A_020 · 综合对话评估
function comprehensiveDialogAssessment(context) {
    const quality = assessDialogQuality(context.history);
    const participants = analyzeParticipants(context.history);
    const overall = (quality.coherence + quality.engagement + quality.completeness) / 3;
    let action;
    if (overall > 0.7)
        action = 'continue';
    else if (overall > 0.4)
        action = 'improve-engagement';
    else
        action = 'redirect';
    return {
        quality: overall,
        coherence: quality.coherence,
        engagement: quality.engagement,
        recommendedAction: action,
        provenance: [`[ALG_T2_A_020] quality=${overall.toFixed(4)} action=${action} turns=${context.history.length}`],
    };
}
