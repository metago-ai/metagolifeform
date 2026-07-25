/**
 * MetaGO Engine - A5 T2 算法 · 记忆引擎封装类（ALG_T2_K_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 201~220 项（记忆引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 KMWIMemory 的私有辅助方法
 *   - 处理四层记忆（热/温/冷/冻）、记忆衰减、记忆固化、记忆检索
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export type MemoryLayer = 'hot' | 'warm' | 'cold' | 'frozen';
export interface MemoryEntry {
    id: string;
    content: string;
    layer: MemoryLayer;
    timestamp: number;
    accessCount: number;
    importance: number;
    lastAccess: number;
}
export declare function memoryLayerRoute(entry: {
    importance: number;
    accessFrequency: number;
    age: number;
}): {
    layer: MemoryLayer;
    reason: string;
    provenance: string[];
};
export declare function memoryDecay(entry: MemoryEntry, halfLifeMs: number, now?: number): {
    decayedImportance: number;
    shouldPromote: boolean;
    shouldDemote: boolean;
    provenance: string[];
};
export declare function memoryConsolidate(shortTerm: MemoryEntry[], threshold?: number): {
    consolidated: MemoryEntry[];
    discarded: MemoryEntry[];
    provenance: string[];
};
export declare function memoryRetrieve(query: string, memories: MemoryEntry[], topK?: number): {
    results: {
        entry: MemoryEntry;
        score: number;
    }[];
    provenance: string[];
};
export declare function memoryIndexBuild(memories: MemoryEntry[]): {
    index: Map<string, string[]>;
    totalTerms: number;
    provenance: string[];
};
export declare function memoryCompress(memories: MemoryEntry[], targetSize: number): {
    compressed: MemoryEntry[];
    compressionRatio: number;
    provenance: string[];
};
export declare function memoryAssociate(memories: MemoryEntry[], threshold?: number): {
    associations: {
        a: string;
        b: string;
        strength: number;
    }[];
    provenance: string[];
};
export declare function memoryForget(memories: MemoryEntry[], threshold?: number, maxAge?: number, now?: number): {
    forgotten: string[];
    retained: MemoryEntry[];
    provenance: string[];
};
export declare function memoryReplay(memories: MemoryEntry[], sequence?: 'chronological' | 'importance' | 'recent'): {
    replay: MemoryEntry[];
    provenance: string[];
};
export declare function memoryImportanceAssess(entry: {
    content: string;
    accessCount: number;
    age: number;
    associations: number;
    emotionalWeight: number;
}): {
    importance: number;
    tier: string;
    provenance: string[];
};
export declare function memoryDeduplicate(memories: MemoryEntry[], similarityThreshold?: number): {
    unique: MemoryEntry[];
    duplicates: {
        kept: string;
        removed: string;
    }[];
    provenance: string[];
};
export declare function memoryMigrate(entry: MemoryEntry, targetLayer: MemoryLayer): {
    migrated: MemoryEntry;
    reason: string;
    provenance: string[];
};
export declare function memoryCapacityManage(memories: MemoryEntry[], capacity: {
    hot: number;
    warm: number;
    cold: number;
    frozen: number;
}): {
    overflow: MemoryEntry[];
    balanced: MemoryEntry[];
    provenance: string[];
};
export declare function memoryTimestampManage(entry: MemoryEntry, action: 'access' | 'update' | 'create', now?: number): {
    updated: MemoryEntry;
    provenance: string[];
};
export declare function memoryValidate(entry: Partial<MemoryEntry>): {
    valid: boolean;
    errors: string[];
    provenance: string[];
};
export declare function memorySnapshot(memories: MemoryEntry[]): {
    snapshot: {
        layer: MemoryLayer;
        count: number;
        avgImportance: number;
        totalSize: number;
    }[];
    totalEntries: number;
    provenance: string[];
};
export declare function memoryRestore(frozen: MemoryEntry[], trigger: {
    importance: number;
    relevance: number;
}): {
    restored: MemoryEntry[];
    stillFrozen: MemoryEntry[];
    provenance: string[];
};
export declare function memoryAudit(memories: MemoryEntry[]): {
    audit: {
        layer: MemoryLayer;
        count: number;
        oldest: number;
        newest: number;
        avgAccess: number;
    }[];
    issues: string[];
    provenance: string[];
};
export declare function memoryEncrypt(entry: MemoryEntry, key: string): {
    encrypted: MemoryEntry;
    encryptedContent: string;
    provenance: string[];
};
export declare function memoryComprehensiveAssessment(memories: MemoryEntry[], metrics: {
    retrievalSpeed: number;
    accuracy: number;
    coverage: number;
    freshness: number;
}): {
    overall: number;
    health: string;
    recommendations: string[];
    provenance: string[];
};
