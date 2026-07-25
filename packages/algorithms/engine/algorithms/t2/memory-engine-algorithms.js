"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryLayerRoute = memoryLayerRoute;
exports.memoryDecay = memoryDecay;
exports.memoryConsolidate = memoryConsolidate;
exports.memoryRetrieve = memoryRetrieve;
exports.memoryIndexBuild = memoryIndexBuild;
exports.memoryCompress = memoryCompress;
exports.memoryAssociate = memoryAssociate;
exports.memoryForget = memoryForget;
exports.memoryReplay = memoryReplay;
exports.memoryImportanceAssess = memoryImportanceAssess;
exports.memoryDeduplicate = memoryDeduplicate;
exports.memoryMigrate = memoryMigrate;
exports.memoryCapacityManage = memoryCapacityManage;
exports.memoryTimestampManage = memoryTimestampManage;
exports.memoryValidate = memoryValidate;
exports.memorySnapshot = memorySnapshot;
exports.memoryRestore = memoryRestore;
exports.memoryAudit = memoryAudit;
exports.memoryEncrypt = memoryEncrypt;
exports.memoryComprehensiveAssessment = memoryComprehensiveAssessment;
// ============================================================================
// ALG_T2_K_001 · 四层记忆路由
// ============================================================================
function memoryLayerRoute(entry) {
    if (entry.importance >= 0.9 && entry.accessFrequency > 10) {
        return { layer: 'hot', reason: 'high_importance_high_frequency', provenance: [`[ALG_T2_K_001] layer=hot imp=${entry.importance} freq=${entry.accessFrequency}`] };
    }
    if (entry.importance >= 0.7 || entry.accessFrequency > 5) {
        return { layer: 'warm', reason: 'moderate_importance_or_frequency', provenance: [`[ALG_T2_K_001] layer=warm imp=${entry.importance}`] };
    }
    if (entry.importance >= 0.3 || entry.age < 86400000) {
        return { layer: 'cold', reason: 'low_importance_or_recent', provenance: [`[ALG_T2_K_001] layer=cold imp=${entry.importance} age=${entry.age}`] };
    }
    return { layer: 'frozen', reason: 'low_importance_old', provenance: [`[ALG_T2_K_001] layer=frozen imp=${entry.importance} age=${entry.age}`] };
}
// ============================================================================
// ALG_T2_K_002 · 记忆衰减
// ============================================================================
function memoryDecay(entry, halfLifeMs, now = Date.now()) {
    if (halfLifeMs <= 0) {
        return { decayedImportance: entry.importance, shouldPromote: false, shouldDemote: false, provenance: ['[ALG_T2_K_002] 无效半衰期'] };
    }
    const age = now - entry.lastAccess;
    const decayFactor = Math.pow(0.5, age / halfLifeMs);
    const decayedImportance = entry.importance * decayFactor;
    const currentLayer = memoryLayerRoute({
        importance: decayedImportance,
        accessFrequency: entry.accessCount,
        age,
    });
    let shouldPromote = false;
    let shouldDemote = false;
    const layerOrder = ['frozen', 'cold', 'warm', 'hot'];
    const currentIdx = layerOrder.indexOf(entry.layer);
    const newIdx = layerOrder.indexOf(currentLayer.layer);
    if (newIdx > currentIdx)
        shouldPromote = true;
    if (newIdx < currentIdx)
        shouldDemote = true;
    return {
        decayedImportance,
        shouldPromote,
        shouldDemote,
        provenance: [`[ALG_T2_K_002] decay=${decayFactor.toFixed(4)} imp=${entry.importance.toFixed(4)}→${decayedImportance.toFixed(4)} promote=${shouldPromote} demote=${shouldDemote}`],
    };
}
// ============================================================================
// ALG_T2_K_003 · 记忆固化
// ============================================================================
function memoryConsolidate(shortTerm, threshold = 0.5) {
    if (shortTerm.length === 0) {
        return { consolidated: [], discarded: [], provenance: ['[ALG_T2_K_003] 空短期记忆'] };
    }
    const consolidated = [];
    const discarded = [];
    for (const entry of shortTerm) {
        if (entry.importance >= threshold && entry.accessCount > 0) {
            consolidated.push({
                ...entry,
                layer: 'cold',
                importance: Math.min(1, entry.importance * 1.1), // 固化时略增
            });
        }
        else {
            discarded.push(entry);
        }
    }
    return {
        consolidated,
        discarded,
        provenance: [`[ALG_T2_K_003] input=${shortTerm.length} consolidated=${consolidated.length} discarded=${discarded.length}`],
    };
}
// ============================================================================
// ALG_T2_K_004 · 记忆检索
// ============================================================================
function memoryRetrieve(query, memories, topK = 5) {
    if (memories.length === 0 || !query) {
        return { results: [], provenance: ['[ALG_T2_K_004] 空查询或记忆'] };
    }
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const scored = memories.map(m => {
        const contentWords = new Set(m.content.toLowerCase().split(/\s+/));
        let overlap = 0;
        for (const w of queryWords)
            if (contentWords.has(w))
                overlap++;
        const relevance = queryWords.size === 0 ? 0 : overlap / queryWords.size;
        const recencyBoost = Math.max(0, 1 - (Date.now() - m.lastAccess) / (7 * 24 * 60 * 60 * 1000));
        const importanceBoost = m.importance * 0.3;
        const score = relevance * 0.5 + recencyBoost * 0.2 + importanceBoost;
        return { entry: m, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return {
        results: scored.slice(0, topK),
        provenance: [`[ALG_T2_K_004] query="${query.substring(0, 30)}" memories=${memories.length} top=${Math.min(topK, scored.length)}`],
    };
}
// ============================================================================
// ALG_T2_K_005 · 记忆索引构建
// ============================================================================
function memoryIndexBuild(memories) {
    const index = new Map();
    let totalTerms = 0;
    for (const m of memories) {
        const words = m.content.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        totalTerms += uniqueWords.size;
        for (const w of uniqueWords) {
            if (!index.has(w))
                index.set(w, []);
            index.get(w).push(m.id);
        }
    }
    return {
        index,
        totalTerms,
        provenance: [`[ALG_T2_K_005] memories=${memories.length} terms=${totalTerms} unique=${index.size}`],
    };
}
// ============================================================================
// ALG_T2_K_006 · 记忆压缩
// ============================================================================
function memoryCompress(memories, targetSize) {
    if (memories.length === 0 || targetSize <= 0) {
        return { compressed: [], compressionRatio: 0, provenance: ['[ALG_T2_K_006] 空输入'] };
    }
    if (memories.length <= targetSize) {
        return { compressed: memories, compressionRatio: 1, provenance: [`[ALG_T2_K_006] 无需压缩`] };
    }
    // 按重要度排序，保留 top K
    const sorted = [...memories].sort((a, b) => b.importance - a.importance);
    const kept = sorted.slice(0, targetSize);
    // 合并被丢弃的记忆内容到保留的记忆中
    const discarded = sorted.slice(targetSize);
    if (discarded.length > 0 && kept.length > 0) {
        const summary = discarded.map(d => d.content).join(' | ');
        kept[0] = {
            ...kept[0],
            content: `${kept[0].content} [合并: ${summary.substring(0, 100)}...]`,
        };
    }
    return {
        compressed: kept,
        compressionRatio: kept.length / memories.length,
        provenance: [`[ALG_T2_K_006] ${memories.length}→${kept.length} ratio=${(kept.length / memories.length).toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_K_007 · 记忆关联
// ============================================================================
function memoryAssociate(memories, threshold = 0.3) {
    if (memories.length < 2) {
        return { associations: [], provenance: ['[ALG_T2_K_007] 记忆不足'] };
    }
    const associations = [];
    for (let i = 0; i < memories.length; i++) {
        for (let j = i + 1; j < memories.length; j++) {
            const wordsA = new Set(memories[i].content.toLowerCase().split(/\s+/));
            const wordsB = new Set(memories[j].content.toLowerCase().split(/\s+/));
            let intersection = 0;
            for (const w of wordsA)
                if (wordsB.has(w))
                    intersection++;
            const union = wordsA.size + wordsB.size - intersection;
            const strength = union === 0 ? 0 : intersection / union;
            if (strength >= threshold) {
                associations.push({ a: memories[i].id, b: memories[j].id, strength });
            }
        }
    }
    return {
        associations,
        provenance: [`[ALG_T2_K_007] memories=${memories.length} associations=${associations.length}`],
    };
}
// ============================================================================
// ALG_T2_K_008 · 记忆遗忘
// ============================================================================
function memoryForget(memories, threshold = 0.1, maxAge = 30 * 24 * 60 * 60 * 1000, now = Date.now()) {
    if (memories.length === 0) {
        return { forgotten: [], retained: [], provenance: ['[ALG_T2_K_008] 空记忆'] };
    }
    const forgotten = [];
    const retained = [];
    for (const m of memories) {
        const age = now - m.timestamp;
        if (m.importance < threshold && age > maxAge && m.accessCount === 0) {
            forgotten.push(m.id);
        }
        else {
            retained.push(m);
        }
    }
    return {
        forgotten,
        retained,
        provenance: [`[ALG_T2_K_008] input=${memories.length} forgotten=${forgotten.length} retained=${retained.length}`],
    };
}
// ============================================================================
// ALG_T2_K_009 · 记忆回放
// ============================================================================
function memoryReplay(memories, sequence = 'chronological') {
    if (memories.length === 0) {
        return { replay: [], provenance: ['[ALG_T2_K_009] 空记忆'] };
    }
    let sorted;
    switch (sequence) {
        case 'chronological':
            sorted = [...memories].sort((a, b) => a.timestamp - b.timestamp);
            break;
        case 'importance':
            sorted = [...memories].sort((a, b) => b.importance - a.importance);
            break;
        case 'recent':
            sorted = [...memories].sort((a, b) => b.timestamp - a.timestamp);
            break;
    }
    return {
        replay: sorted,
        provenance: [`[ALG_T2_K_009] sequence=${sequence} count=${sorted.length}`],
    };
}
// ============================================================================
// ALG_T2_K_010 · 记忆重要性评估
// ============================================================================
function memoryImportanceAssess(entry) {
    const lengthScore = Math.min(1, entry.content.length / 1000);
    const frequencyScore = Math.min(1, entry.accessCount / 10);
    const associationScore = Math.min(1, entry.associations / 5);
    const emotionalScore = entry.emotionalWeight;
    const ageScore = Math.max(0, 1 - entry.age / (365 * 24 * 60 * 60 * 1000));
    const importance = lengthScore * 0.2 + frequencyScore * 0.3 + associationScore * 0.2 + emotionalScore * 0.2 + ageScore * 0.1;
    const tier = importance >= 0.8 ? 'critical' : importance >= 0.6 ? 'important' : importance >= 0.4 ? 'normal' : 'trivial';
    return {
        importance,
        tier,
        provenance: [`[ALG_T2_K_010] imp=${importance.toFixed(4)} tier=${tier}`],
    };
}
// ============================================================================
// ALG_T2_K_011 · 记忆去重
// ============================================================================
function memoryDeduplicate(memories, similarityThreshold = 0.8) {
    if (memories.length === 0) {
        return { unique: [], duplicates: [], provenance: ['[ALG_T2_K_011] 空记忆'] };
    }
    const unique = [];
    const duplicates = [];
    for (const m of memories) {
        let isDuplicate = false;
        for (const u of unique) {
            const sim = stringSim(m.content, u.content);
            if (sim >= similarityThreshold) {
                duplicates.push({ kept: u.id, removed: m.id });
                isDuplicate = true;
                break;
            }
        }
        if (!isDuplicate)
            unique.push(m);
    }
    return {
        unique,
        duplicates,
        provenance: [`[ALG_T2_K_011] input=${memories.length} unique=${unique.length} duplicates=${duplicates.length}`],
    };
}
function stringSim(a, b) {
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    let intersection = 0;
    for (const w of setA)
        if (setB.has(w))
            intersection++;
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}
// ============================================================================
// ALG_T2_K_012 · 记忆迁移
// ============================================================================
function memoryMigrate(entry, targetLayer) {
    if (entry.layer === targetLayer) {
        return { migrated: entry, reason: 'already_at_target', provenance: [`[ALG_T2_K_012] 已在目标层`] };
    }
    const layerOrder = ['frozen', 'cold', 'warm', 'hot'];
    const currentIdx = layerOrder.indexOf(entry.layer);
    const targetIdx = layerOrder.indexOf(targetLayer);
    const direction = targetIdx > currentIdx ? 'promote' : 'demote';
    return {
        migrated: { ...entry, layer: targetLayer },
        reason: `${direction}_from_${entry.layer}_to_${targetLayer}`,
        provenance: [`[ALG_T2_K_012] ${entry.layer}→${targetLayer} direction=${direction}`],
    };
}
// ============================================================================
// ALG_T2_K_013 · 记忆容量管理
// ============================================================================
function memoryCapacityManage(memories, capacity) {
    const overflow = [];
    const balanced = [];
    const counts = { hot: 0, warm: 0, cold: 0, frozen: 0 };
    for (const m of memories) {
        if (counts[m.layer] < capacity[m.layer]) {
            balanced.push(m);
            counts[m.layer]++;
        }
        else {
            // 尝试降级
            if (m.layer === 'hot' && counts.warm < capacity.warm) {
                balanced.push({ ...m, layer: 'warm' });
                counts.warm++;
            }
            else if (m.layer === 'warm' && counts.cold < capacity.cold) {
                balanced.push({ ...m, layer: 'cold' });
                counts.cold++;
            }
            else if (m.layer === 'cold' && counts.frozen < capacity.frozen) {
                balanced.push({ ...m, layer: 'frozen' });
                counts.frozen++;
            }
            else {
                overflow.push(m);
            }
        }
    }
    return {
        overflow,
        balanced,
        provenance: [`[ALG_T2_K_013] input=${memories.length} balanced=${balanced.length} overflow=${overflow.length}`],
    };
}
// ============================================================================
// ALG_T2_K_014 · 记忆时间戳管理
// ============================================================================
function memoryTimestampManage(entry, action, now = Date.now()) {
    const updated = { ...entry };
    switch (action) {
        case 'access':
            updated.lastAccess = now;
            updated.accessCount++;
            break;
        case 'update':
            updated.timestamp = now;
            updated.lastAccess = now;
            break;
        case 'create':
            updated.timestamp = now;
            updated.lastAccess = now;
            updated.accessCount = 0;
            break;
    }
    return {
        updated,
        provenance: [`[ALG_T2_K_014] action=${action} timestamp=${now}`],
    };
}
// ============================================================================
// ALG_T2_K_015 · 记忆校验
// ============================================================================
function memoryValidate(entry) {
    const errors = [];
    if (!entry.id)
        errors.push('missing_id');
    if (!entry.content)
        errors.push('missing_content');
    if (entry.layer && !['hot', 'warm', 'cold', 'frozen'].includes(entry.layer))
        errors.push('invalid_layer');
    if (entry.importance !== undefined && (entry.importance < 0 || entry.importance > 1))
        errors.push('invalid_importance');
    if (entry.timestamp !== undefined && entry.timestamp < 0)
        errors.push('invalid_timestamp');
    return {
        valid: errors.length === 0,
        errors,
        provenance: [`[ALG_T2_K_015] valid=${errors.length === 0} errors=${errors.length}`],
    };
}
// ============================================================================
// ALG_T2_K_016 · 记忆快照
// ============================================================================
function memorySnapshot(memories) {
    if (memories.length === 0) {
        return { snapshot: [], totalEntries: 0, provenance: ['[ALG_T2_K_016] 空记忆'] };
    }
    const layers = ['hot', 'warm', 'cold', 'frozen'];
    const snapshot = layers.map(layer => {
        const layerMemories = memories.filter(m => m.layer === layer);
        const avgImportance = layerMemories.length === 0 ? 0 : layerMemories.reduce((s, m) => s + m.importance, 0) / layerMemories.length;
        const totalSize = layerMemories.reduce((s, m) => s + m.content.length, 0);
        return { layer, count: layerMemories.length, avgImportance, totalSize };
    });
    return {
        snapshot,
        totalEntries: memories.length,
        provenance: [`[ALG_T2_K_016] entries=${memories.length} layers=${snapshot.length}`],
    };
}
// ============================================================================
// ALG_T2_K_017 · 记忆恢复
// ============================================================================
function memoryRestore(frozen, trigger) {
    if (frozen.length === 0) {
        return { restored: [], stillFrozen: [], provenance: ['[ALG_T2_K_017] 空冻结记忆'] };
    }
    const restored = [];
    const stillFrozen = [];
    for (const m of frozen) {
        const score = m.importance * trigger.importance + trigger.relevance * 0.5;
        if (score > 0.5) {
            restored.push({ ...m, layer: 'cold' });
        }
        else {
            stillFrozen.push(m);
        }
    }
    return {
        restored,
        stillFrozen,
        provenance: [`[ALG_T2_K_017] frozen=${frozen.length} restored=${restored.length} still=${stillFrozen.length}`],
    };
}
// ============================================================================
// ALG_T2_K_018 · 记忆审计
// ============================================================================
function memoryAudit(memories) {
    if (memories.length === 0) {
        return { audit: [], issues: ['empty_memory'], provenance: ['[ALG_T2_K_018] 空记忆'] };
    }
    const layers = ['hot', 'warm', 'cold', 'frozen'];
    const audit = layers.map(layer => {
        const layerMemories = memories.filter(m => m.layer === layer);
        const timestamps = layerMemories.map(m => m.timestamp);
        return {
            layer,
            count: layerMemories.length,
            oldest: timestamps.length > 0 ? Math.min(...timestamps) : 0,
            newest: timestamps.length > 0 ? Math.max(...timestamps) : 0,
            avgAccess: layerMemories.length > 0 ? layerMemories.reduce((s, m) => s + m.accessCount, 0) / layerMemories.length : 0,
        };
    });
    const issues = [];
    if (audit[0].count > 100)
        issues.push('hot_layer_overloaded');
    if (audit[3].count === 0)
        issues.push('no_frozen_memories');
    const totalAccess = memories.reduce((s, m) => s + m.accessCount, 0);
    if (totalAccess === 0)
        issues.push('no_memory_accesses');
    return {
        audit,
        issues,
        provenance: [`[ALG_T2_K_018] memories=${memories.length} issues=${issues.length}`],
    };
}
// ============================================================================
// ALG_T2_K_019 · 记忆加密
// ============================================================================
function memoryEncrypt(entry, key) {
    // 简化的 XOR 加密（演示用，实际应用 AES）
    let encryptedContent = '';
    for (let i = 0; i < entry.content.length; i++) {
        const charCode = entry.content.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        encryptedContent += String.fromCharCode(charCode);
    }
    // 转为 base64
    encryptedContent = Buffer.from(encryptedContent, 'binary').toString('base64');
    return {
        encrypted: { ...entry, content: encryptedContent },
        encryptedContent,
        provenance: [`[ALG_T2_K_019] id=${entry.id} encrypted=${encryptedContent.length}chars`],
    };
}
// ============================================================================
// ALG_T2_K_020 · 记忆综合评估
// ============================================================================
function memoryComprehensiveAssessment(memories, metrics) {
    const utilization = memories.length > 0 ? memories.reduce((s, m) => s + m.accessCount, 0) / memories.length : 0;
    const overall = (metrics.retrievalSpeed + metrics.accuracy + metrics.coverage + metrics.freshness + Math.min(1, utilization / 10)) / 5;
    const health = overall >= 0.8 ? 'excellent' : overall >= 0.6 ? 'good' : overall >= 0.4 ? 'fair' : 'poor';
    const recommendations = [];
    if (metrics.accuracy < 0.7)
        recommendations.push('improve_indexing');
    if (metrics.coverage < 0.6)
        recommendations.push('expand_memory_collection');
    if (metrics.freshness < 0.5)
        recommendations.push('update_stale_memories');
    if (utilization < 1)
        recommendations.push('promote_underutilized_memories');
    return {
        overall,
        health,
        recommendations,
        provenance: [`[ALG_T2_K_020] overall=${overall.toFixed(4)} health=${health} recs=${recommendations.length}`],
    };
}
