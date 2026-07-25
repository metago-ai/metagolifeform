"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryEncode = memoryEncode;
exports.memoryStore = memoryStore;
exports.memoryRetrieve = memoryRetrieve;
exports.memoryConsolidate = memoryConsolidate;
exports.memoryDecay = memoryDecay;
exports.memoryForgetting = memoryForgetting;
exports.memoryRehearsal = memoryRehearsal;
exports.memoryInterference = memoryInterference;
exports.memoryAssociation = memoryAssociation;
exports.memorySchema = memorySchema;
exports.memoryEpisodic = memoryEpisodic;
exports.memorySemantic = memorySemantic;
exports.memoryProcedural = memoryProcedural;
exports.memoryWorking = memoryWorking;
exports.memoryLongTerm = memoryLongTerm;
// ============================================================================
// T1·ALG_T1_K_001 · 记忆编码
// ============================================================================
function memoryEncode(content, encoder = (text) => {
    // 简单的词袋编码
    const words = text.toLowerCase().split(/\s+/);
    const hash = new Array(64).fill(0);
    for (const word of words) {
        for (let i = 0; i < word.length; i++) {
            hash[i % 64] += word.charCodeAt(i);
        }
    }
    const norm = Math.sqrt(hash.reduce((s, x) => s + x * x, 0));
    return norm === 0 ? hash : hash.map(x => x / norm);
}) {
    if (!content || content.length === 0) {
        return { encoding: [], contentHash: '', provenance: ['[ALG_T1_K_001] 空内容'] };
    }
    const encoding = encoder(content);
    // 简单 hash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
    }
    return {
        encoding,
        contentHash: `h${Math.abs(hash).toString(16)}`,
        provenance: [`[ALG_T1_K_001] dim=${encoding.length} hash=${Math.abs(hash).toString(16)} len=${content.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_002 · 记忆存储
// ============================================================================
function memoryStore(store, item) {
    const id = `mem_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const stored = {
        ...item,
        id,
        timestamp: Date.now(),
        accessCount: 0,
    };
    store.set(id, stored);
    return {
        stored,
        storeSize: store.size,
        provenance: [`[ALG_T1_K_002] id=${id} storeSize=${store.size} type=${item.type}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_003 · 记忆检索（余弦相似度）
// ============================================================================
function memoryRetrieve(store, query, topK = 5, minSimilarity = 0.1) {
    if (store.size === 0 || query.length === 0) {
        return { retrieved: [], maxSimilarity: 0, provenance: ['[ALG_T1_K_003] 空存储或空查询'] };
    }
    const scored = [];
    for (const [, item] of store) {
        if (item.embedding.length !== query.length)
            continue;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < query.length; i++) {
            dot += query[i] * item.embedding[i];
            normA += query[i] * query[i];
            normB += item.embedding[i] * item.embedding[i];
        }
        const sim = Math.sqrt(normA) * Math.sqrt(normB) === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
        // 强度加权
        const weightedSim = sim * item.strength;
        if (weightedSim >= minSimilarity) {
            scored.push({ item, similarity: weightedSim });
        }
    }
    scored.sort((a, b) => b.similarity - a.similarity);
    const retrieved = scored.slice(0, topK).map(s => {
        s.item.accessCount++;
        return s.item;
    });
    return {
        retrieved,
        maxSimilarity: scored.length > 0 ? scored[0].similarity : 0,
        provenance: [`[ALG_T1_K_003] retrieved=${retrieved.length} topK=${topK} maxSim=${scored.length > 0 ? scored[0].similarity.toFixed(4) : 'N/A'}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_004 · 记忆巩固
// ============================================================================
function memoryConsolidate(store, shortTermIds, consolidationThreshold = 0.5) {
    if (store.size === 0 || shortTermIds.length === 0) {
        return { consolidated: [], promoted: 0, provenance: ['[ALG_T1_K_004] 空输入'] };
    }
    const consolidated = [];
    let promoted = 0;
    for (const id of shortTermIds) {
        const item = store.get(id);
        if (!item)
            continue;
        // 巩固条件：强度超过阈值 或 被访问过
        if (item.strength >= consolidationThreshold || item.accessCount > 0) {
            const consolidatedItem = {
                ...item,
                type: item.type === 'working' ? 'semantic' : item.type,
                strength: Math.min(1, item.strength + 0.1),
            };
            store.set(id, consolidatedItem);
            consolidated.push(id);
            promoted++;
        }
    }
    return {
        consolidated,
        promoted,
        provenance: [`[ALG_T1_K_004] consolidated=${promoted} from ${shortTermIds.length} threshold=${consolidationThreshold}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_005 · 记忆衰减（指数衰减）
// ============================================================================
function memoryDecay(items, now, halfLife = 86400000) {
    if (items.length === 0) {
        return { decayed: [], removed: [], provenance: ['[ALG_T1_K_005] 空记忆'] };
    }
    const decayed = [];
    const removed = [];
    for (const item of items) {
        const age = now - item.timestamp;
        const decayFactor = Math.pow(0.5, age / halfLife);
        const newStrength = item.strength * decayFactor;
        if (newStrength < 0.01) {
            removed.push(item.id);
        }
        else {
            decayed.push({ ...item, strength: newStrength });
        }
    }
    return {
        decayed,
        removed,
        provenance: [`[ALG_T1_K_005] kept=${decayed.length} removed=${removed.length} halfLife=${halfLife}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_006 · 记忆遗忘
// ============================================================================
function memoryForgetting(store, threshold = 0.05) {
    if (store.size === 0) {
        return { forgotten: [], remaining: 0, provenance: ['[ALG_T1_K_006] 空存储'] };
    }
    const forgotten = [];
    for (const [id, item] of store) {
        if (item.strength < threshold) {
            forgotten.push(id);
            store.delete(id);
        }
    }
    return {
        forgotten,
        remaining: store.size,
        provenance: [`[ALG_T1_K_006] forgotten=${forgotten.length} remaining=${store.size} threshold=${threshold}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_007 · 记忆复述（强化）
// ============================================================================
function memoryRehearsal(item, rehearsalCount = 1, boostPerRehearsal = 0.1) {
    if (rehearsalCount <= 0) {
        return { rehearsed: item, totalBoost: 0, provenance: ['[ALG_T1_K_007] 无复述'] };
    }
    const totalBoost = rehearsalCount * boostPerRehearsal;
    return {
        rehearsed: {
            ...item,
            strength: Math.min(1, item.strength + totalBoost),
            accessCount: item.accessCount + rehearsalCount,
        },
        totalBoost,
        provenance: [`[ALG_T1_K_007] boost=+${totalBoost.toFixed(2)} rehearsals=${rehearsalCount} strength=${Math.min(1, item.strength + totalBoost).toFixed(4)}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_008 · 记忆干扰
// ============================================================================
function memoryInterference(target, competitors) {
    if (competitors.length === 0) {
        return { interference: 0, dominantCompetitor: null, provenance: ['[ALG_T1_K_008] 无竞争记忆'] };
    }
    let totalInterference = 0;
    let maxSim = 0;
    let dominantCompetitor = null;
    for (const comp of competitors) {
        if (comp.embedding.length !== target.embedding.length)
            continue;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < target.embedding.length; i++) {
            dot += target.embedding[i] * comp.embedding[i];
            normA += target.embedding[i] ** 2;
            normB += comp.embedding[i] ** 2;
        }
        const sim = Math.sqrt(normA) * Math.sqrt(normB) === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
        const interference = sim * comp.strength;
        totalInterference += interference;
        if (interference > maxSim) {
            maxSim = interference;
            dominantCompetitor = comp.id;
        }
    }
    return {
        interference: totalInterference,
        dominantCompetitor,
        provenance: [`[ALG_T1_K_008] interference=${totalInterference.toFixed(4)} dominant=${dominantCompetitor} competitors=${competitors.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_009 · 记忆联想
// ============================================================================
function memoryAssociation(store, seed, maxDepth = 2, minSimilarity = 0.3) {
    if (store.size === 0) {
        return { associations: [], depth: 0, provenance: ['[ALG_T1_K_009] 空存储'] };
    }
    const visited = new Set([seed.id]);
    const associations = [];
    let current = [seed];
    for (let depth = 1; depth <= maxDepth; depth++) {
        const next = [];
        for (const item of current) {
            const retrieved = memoryRetrieve(store, item.embedding, 5, minSimilarity);
            for (const r of retrieved.retrieved) {
                if (!visited.has(r.id)) {
                    visited.add(r.id);
                    associations.push(r.id);
                    next.push(r);
                }
            }
        }
        if (next.length === 0)
            break;
        current = next;
    }
    return {
        associations,
        depth: maxDepth,
        provenance: [`[ALG_T1_K_009] associations=${associations.length} maxDepth=${maxDepth} seed=${seed.id}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_010 · 记忆图式
// ============================================================================
function memorySchema(memories) {
    if (memories.length === 0) {
        return { schema: [], coverage: 0, provenance: ['[ALG_T1_K_010] 空记忆'] };
    }
    const dim = memories[0].embedding.length;
    const schema = new Array(dim).fill(0);
    let totalWeight = 0;
    for (const m of memories) {
        if (m.embedding.length !== dim)
            continue;
        for (let i = 0; i < dim; i++) {
            schema[i] += m.embedding[i] * m.strength;
        }
        totalWeight += m.strength;
    }
    if (totalWeight > 0) {
        for (let i = 0; i < dim; i++)
            schema[i] /= totalWeight;
    }
    // 覆盖度 = 图式能解释多少记忆（余弦相似度均值）
    let coverage = 0;
    let count = 0;
    for (const m of memories) {
        if (m.embedding.length !== dim)
            continue;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < dim; i++) {
            dot += schema[i] * m.embedding[i];
            normA += schema[i] ** 2;
            normB += m.embedding[i] ** 2;
        }
        const sim = Math.sqrt(normA) * Math.sqrt(normB) === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
        coverage += sim;
        count++;
    }
    coverage = count > 0 ? coverage / count : 0;
    return {
        schema,
        coverage,
        provenance: [`[ALG_T1_K_010] dim=${dim} coverage=${coverage.toFixed(4)} memories=${memories.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_011 · 情景记忆
// ============================================================================
function memoryEpisodic(events, query) {
    if (events.length === 0) {
        return { matched: [], provenance: ['[ALG_T1_K_011] 空事件'] };
    }
    const matched = events.filter(e => {
        if (query.after !== undefined && e.timestamp < query.after)
            return false;
        if (query.before !== undefined && e.timestamp > query.before)
            return false;
        if (query.location !== undefined && e.location !== query.location)
            return false;
        if (query.participant !== undefined && !e.participants.includes(query.participant))
            return false;
        return true;
    });
    return {
        matched,
        provenance: [`[ALG_T1_K_011] matched=${matched.length} from ${events.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_012 · 语义记忆
// ============================================================================
function memorySemantic(knowledge, query) {
    if (knowledge.length === 0) {
        return { matched: [], provenance: ['[ALG_T1_K_012] 空知识'] };
    }
    const matched = knowledge.filter(k => {
        if (query.concept !== undefined && k.concept !== query.concept)
            return false;
        if (query.category !== undefined && k.category !== query.category)
            return false;
        if (query.property !== undefined && !(query.property in k.properties))
            return false;
        return true;
    });
    return {
        matched,
        provenance: [`[ALG_T1_K_012] matched=${matched.length} from ${knowledge.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_013 · 程序记忆
// ============================================================================
function memoryProcedural(procedures, query) {
    if (procedures.length === 0) {
        return { matched: [], provenance: ['[ALG_T1_K_013] 空程序'] };
    }
    const matched = procedures.filter(p => {
        if (query.name !== undefined && !p.name.includes(query.name))
            return false;
        if (query.maxDifficulty !== undefined && p.difficulty > query.maxDifficulty)
            return false;
        return true;
    });
    return {
        matched,
        provenance: [`[ALG_T1_K_013] matched=${matched.length} from ${procedures.length}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_014 · 工作记忆（容量限制）
// ============================================================================
function memoryWorking(items, capacity = 7) {
    if (items.length === 0) {
        return { active: [], overflow: [], provenance: ['[ALG_T1_K_014] 空记忆'] };
    }
    // 按强度排序，保留 top capacity
    const sorted = [...items].sort((a, b) => b.strength - a.strength);
    const active = sorted.slice(0, capacity);
    const overflow = sorted.slice(capacity);
    return {
        active,
        overflow,
        provenance: [`[ALG_T1_K_014] active=${active.length} overflow=${overflow.length} capacity=${capacity}`],
    };
}
// ============================================================================
// T1·ALG_T1_K_015 · 长期记忆（检索+强化）
// ============================================================================
function memoryLongTerm(store, query, topK = 10) {
    if (store.size === 0 || query.length === 0) {
        return { retrieved: [], reinforced: 0, provenance: ['[ALG_T1_K_015] 空存储'] };
    }
    // 只检索长期记忆
    const longTermItems = [];
    for (const [, item] of store) {
        if (item.type === 'semantic' || item.type === 'episodic' || item.type === 'procedural') {
            longTermItems.push(item);
        }
    }
    if (longTermItems.length === 0) {
        return { retrieved: [], reinforced: 0, provenance: ['[ALG_T1_K_015] 无长期记忆'] };
    }
    // 计算相似度
    const scored = [];
    for (const item of longTermItems) {
        if (item.embedding.length !== query.length)
            continue;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < query.length; i++) {
            dot += query[i] * item.embedding[i];
            normA += query[i] ** 2;
            normB += item.embedding[i] ** 2;
        }
        const sim = Math.sqrt(normA) * Math.sqrt(normB) === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
        scored.push({ item, similarity: sim });
    }
    scored.sort((a, b) => b.similarity - a.similarity);
    const topItems = scored.slice(0, topK);
    // 强化：每次检索都增强记忆
    let reinforced = 0;
    for (const { item } of topItems) {
        const strengthened = {
            ...item,
            strength: Math.min(1, item.strength + 0.05),
            accessCount: item.accessCount + 1,
        };
        store.set(item.id, strengthened);
        reinforced++;
    }
    return {
        retrieved: topItems.map(s => s.item),
        reinforced,
        provenance: [`[ALG_T1_K_015] retrieved=${topItems.length} reinforced=${reinforced} pool=${longTermItems.length}`],
    };
}
