/**
 * MetaGO Engine - A5 T1 算法 · 记忆管理类（第二批）
 *
 * 对应属性：KMWI 四层记忆架构 / 第十六章 记忆生命体协议
 * 对应文档：附录A·T1·MEMORY（ALG_T1_K_001 ~ ALG_T1_K_015）
 *
 * 算法清单（15 个）：
 *   001 记忆编码      002 记忆存储        003 记忆检索
 *   004 记忆巩固      005 记忆衰减        006 记忆遗忘
 *   007 记忆复述      008 记忆干扰        009 记忆联想
 *   010 记忆图式      011 情景记忆        012 语义记忆
 *   013 程序记忆      014 工作记忆        015 长期记忆
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface MemoryItem {
    id: string;
    content: string;
    embedding: number[];
    strength: number;
    timestamp: number;
    accessCount: number;
    type: 'episodic' | 'semantic' | 'procedural' | 'working';
}
export declare function memoryEncode(content: string, encoder?: (text: string) => number[]): {
    encoding: number[];
    contentHash: string;
    provenance: string[];
};
export declare function memoryStore(store: Map<string, MemoryItem>, item: Omit<MemoryItem, 'id' | 'timestamp' | 'accessCount'>): {
    stored: MemoryItem;
    storeSize: number;
    provenance: string[];
};
export declare function memoryRetrieve(store: Map<string, MemoryItem>, query: number[], topK?: number, minSimilarity?: number): {
    retrieved: MemoryItem[];
    maxSimilarity: number;
    provenance: string[];
};
export declare function memoryConsolidate(store: Map<string, MemoryItem>, shortTermIds: string[], consolidationThreshold?: number): {
    consolidated: string[];
    promoted: number;
    provenance: string[];
};
export declare function memoryDecay(items: MemoryItem[], now: number, halfLife?: number): {
    decayed: MemoryItem[];
    removed: string[];
    provenance: string[];
};
export declare function memoryForgetting(store: Map<string, MemoryItem>, threshold?: number): {
    forgotten: string[];
    remaining: number;
    provenance: string[];
};
export declare function memoryRehearsal(item: MemoryItem, rehearsalCount?: number, boostPerRehearsal?: number): {
    rehearsed: MemoryItem;
    totalBoost: number;
    provenance: string[];
};
export declare function memoryInterference(target: MemoryItem, competitors: MemoryItem[]): {
    interference: number;
    dominantCompetitor: string | null;
    provenance: string[];
};
export declare function memoryAssociation(store: Map<string, MemoryItem>, seed: MemoryItem, maxDepth?: number, minSimilarity?: number): {
    associations: string[];
    depth: number;
    provenance: string[];
};
export declare function memorySchema(memories: MemoryItem[]): {
    schema: number[];
    coverage: number;
    provenance: string[];
};
export declare function memoryEpisodic(events: {
    id: string;
    timestamp: number;
    location: string;
    participants: string[];
    details: string;
}[], query: {
    after?: number;
    before?: number;
    location?: string;
    participant?: string;
}): {
    matched: typeof events;
    provenance: string[];
};
export declare function memorySemantic(knowledge: {
    concept: string;
    properties: Record<string, unknown>;
    category: string;
}[], query: {
    concept?: string;
    category?: string;
    property?: string;
}): {
    matched: typeof knowledge;
    provenance: string[];
};
export declare function memoryProcedural(procedures: {
    id: string;
    name: string;
    steps: string[];
    difficulty: number;
    masteryLevel: number;
}[], query: {
    name?: string;
    maxDifficulty?: number;
}): {
    matched: typeof procedures;
    provenance: string[];
};
export declare function memoryWorking(items: MemoryItem[], capacity?: number): {
    active: MemoryItem[];
    overflow: MemoryItem[];
    provenance: string[];
};
export declare function memoryLongTerm(store: Map<string, MemoryItem>, query: number[], topK?: number): {
    retrieved: MemoryItem[];
    reinforced: number;
    provenance: string[];
};
