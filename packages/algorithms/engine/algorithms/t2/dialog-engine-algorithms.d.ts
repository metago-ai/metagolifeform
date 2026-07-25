/**
 * MetaGO Engine - A5 T2 算法 · 对话创造引擎封装类（ALG_T2_A_001~020）
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface DialogTurn {
    speaker: string;
    content: string;
    timestamp: number;
    intent?: string;
}
export interface DialogContext {
    history: DialogTurn[];
    topic: string;
    participants: string[];
}
export declare function recognizeDialogIntent(utterance: string, intents: {
    name: string;
    keywords: string[];
    weight: number;
}[]): {
    intent: string | null;
    confidence: number;
    provenance: string[];
};
export declare function manageDialogContext(current: DialogContext, newTurn: DialogTurn, maxHistory?: number): {
    updated: DialogContext;
    provenance: string[];
};
export declare function analyzeDialogSentiment(text: string, positiveWords?: string[], negativeWords?: string[]): {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    provenance: string[];
};
export declare function detectDialogTopic(text: string, topics: {
    name: string;
    keywords: string[];
}[]): {
    topic: string | null;
    confidence: number;
    provenance: string[];
};
export declare function generateDialogSummary(history: DialogTurn[], maxSentences?: number): {
    summary: string;
    keyPoints: string[];
    provenance: string[];
};
export declare function checkDialogConsistency(statements: string[]): {
    consistent: boolean;
    conflicts: string[][];
    provenance: string[];
};
export declare function controlDialogFlow(current: 'greeting' | 'information' | 'negotiation' | 'closing', intent: string): {
    next: string;
    action: string;
    provenance: string[];
};
export declare function analyzeParticipants(history: DialogTurn[]): {
    dominant: string | null;
    participation: Record<string, number>;
    provenance: string[];
};
export declare function extractKeyInformation(text: string, patterns: {
    name: string;
    regex: string;
}[]): {
    extracted: Record<string, string[]>;
    provenance: string[];
};
export declare function generateResponse(intent: string, templates: Record<string, string[]>, context?: Record<string, string>): {
    response: string;
    provenance: string[];
};
export declare function assessDialogQuality(history: DialogTurn[]): {
    coherence: number;
    engagement: number;
    completeness: number;
    provenance: string[];
};
export declare function detectInterruption(turns: DialogTurn[]): {
    interruptions: number[];
    provenance: string[];
};
export declare function trackDialogFocus(history: DialogTurn[], topics: {
    name: string;
    keywords: string[];
}[]): {
    focusTimeline: {
        turn: number;
        topic: string | null;
    }[];
    dominantTopic: string | null;
    provenance: string[];
};
export declare function trackDialogEmotion(history: DialogTurn[]): {
    emotionTimeline: {
        turn: number;
        sentiment: string;
        score: number;
    }[];
    overallSentiment: string;
    provenance: string[];
};
export declare function selectDialogStrategy(context: DialogContext, strategies: {
    name: string;
    appropriateness: number;
}[]): {
    strategy: string | null;
    provenance: string[];
};
export declare function compressDialogHistory(history: DialogTurn[], maxTurns?: number): {
    compressed: DialogTurn[];
    removedCount: number;
    provenance: string[];
};
export declare function recognizeEntities(text: string, entityTypes: {
    type: string;
    patterns: string[];
}[]): {
    entities: {
        type: string;
        value: string;
    }[];
    provenance: string[];
};
export declare function predictNextTurn(history: DialogTurn[], possibleIntents: string[]): {
    likelyIntent: string;
    confidence: number;
    provenance: string[];
};
export declare function fallbackStrategy(confidence: number, threshold?: number): {
    action: string;
    reason: string;
    provenance: string[];
};
export declare function comprehensiveDialogAssessment(context: DialogContext): {
    quality: number;
    coherence: number;
    engagement: number;
    recommendedAction: string;
    provenance: string[];
};
