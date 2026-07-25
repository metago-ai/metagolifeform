"use strict";
/**
 * MetaGO Engine - T3 概念存档 · 概念检索引擎
 *
 * 汇总 16 个概念族共 227 个概念，提供按关键词、族、复杂度的多条件检索能力。
 *
 * 族分布：
 *   C=COUPLING(15)  V=VALUE(15)  B=BIAS(15)   L=LOGIC(15)
 *   E=EVOLUTION(15) M=CREATION(15) F=FREQUENCY(13) D=DECISION(13)
 *   S=SECURITY(13)  N=NEGENTROPY(14) K=MEMORY(14)  G=LEARNING(14)
 *   R=REASONING(14) I=INTUITION(14) X=CONFLICT(14) T=TIME(14)
 *   合计：15×6 + 13×3 + 14×7 = 90 + 39 + 98 = 227
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAMILY_NAMES = exports.FAMILY_CODES = exports.ALL_CONCEPTS = void 0;
exports.getConceptById = getConceptById;
exports.listByFamily = listByFamily;
exports.listByFamilyCode = listByFamilyCode;
exports.listByComplexity = listByComplexity;
exports.listByCategory = listByCategory;
exports.searchAllConcepts = searchAllConcepts;
exports.searchConcepts = searchConcepts;
exports.listAllConcepts = listAllConcepts;
exports.getConceptStatistics = getConceptStatistics;
const coupling_concepts_1 = require("./coupling-concepts");
const value_concepts_1 = require("./value-concepts");
const bias_concepts_1 = require("./bias-concepts");
const logic_concepts_1 = require("./logic-concepts");
const evolution_concepts_1 = require("./evolution-concepts");
const creation_concepts_1 = require("./creation-concepts");
const frequency_concepts_1 = require("./frequency-concepts");
const decision_concepts_1 = require("./decision-concepts");
const security_concepts_1 = require("./security-concepts");
const negentropy_concepts_1 = require("./negentropy-concepts");
const memory_concepts_1 = require("./memory-concepts");
const learning_concepts_1 = require("./learning-concepts");
const reasoning_concepts_1 = require("./reasoning-concepts");
const intuition_concepts_1 = require("./intuition-concepts");
const conflict_concepts_1 = require("./conflict-concepts");
const time_concepts_1 = require("./time-concepts");
// ============================================================================
// 全量概念池（227 条）
// ============================================================================
/** 全部 227 个 T3 概念（按族顺序合并） */
exports.ALL_CONCEPTS = [
    ...coupling_concepts_1.CONCEPTS,
    ...value_concepts_1.CONCEPTS,
    ...bias_concepts_1.CONCEPTS,
    ...logic_concepts_1.CONCEPTS,
    ...evolution_concepts_1.CONCEPTS,
    ...creation_concepts_1.CONCEPTS,
    ...frequency_concepts_1.CONCEPTS,
    ...decision_concepts_1.CONCEPTS,
    ...security_concepts_1.CONCEPTS,
    ...negentropy_concepts_1.CONCEPTS,
    ...memory_concepts_1.CONCEPTS,
    ...learning_concepts_1.CONCEPTS,
    ...reasoning_concepts_1.CONCEPTS,
    ...intuition_concepts_1.CONCEPTS,
    ...conflict_concepts_1.CONCEPTS,
    ...time_concepts_1.CONCEPTS,
];
/** 族代码 → 族名映射（16 族） */
exports.FAMILY_CODES = {
    C: 'COUPLING',
    V: 'VALUE',
    B: 'BIAS',
    L: 'LOGIC',
    E: 'EVOLUTION',
    M: 'CREATION',
    F: 'FREQUENCY',
    D: 'DECISION',
    S: 'SECURITY',
    N: 'NEGENTROPY',
    K: 'MEMORY',
    G: 'LEARNING',
    R: 'REASONING',
    I: 'INTUITION',
    X: 'CONFLICT',
    T: 'TIME',
};
/** 族名 → 族代码映射（反向） */
exports.FAMILY_NAMES = Object.entries(exports.FAMILY_CODES).reduce((acc, [code, name]) => {
    acc[name] = code;
    return acc;
}, {});
// ============================================================================
// 核心检索函数
// ============================================================================
/**
 * 按 ID 获取概念（全量检索）。
 * @param id 概念 ID（如 ALG_T3_C_001）
 * @returns 概念条目；未找到返回 undefined
 */
function getConceptById(id) {
    return exports.ALL_CONCEPTS.find(c => c.id === id);
}
/**
 * 按族名获取该族全部概念。
 * @param family 族名（如 COUPLING）
 * @returns 该族概念数组
 */
function listByFamily(family) {
    return exports.ALL_CONCEPTS.filter(c => c.family === family);
}
/**
 * 按族代码获取该族全部概念。
 * @param code 族代码（如 C）
 * @returns 该族概念数组
 */
function listByFamilyCode(code) {
    const family = exports.FAMILY_CODES[code.toUpperCase()];
    if (!family)
        return [];
    return listByFamily(family);
}
/**
 * 按复杂度获取概念。
 * @param complexity 复杂度字面量
 * @returns 命中概念数组
 */
function listByComplexity(complexity) {
    return exports.ALL_CONCEPTS.filter(c => c.complexity === complexity);
}
/**
 * 按分类（族内细分）检索。
 * @param category 分类名称（模糊匹配）
 * @returns 命中概念数组
 */
function listByCategory(category) {
    const lower = category.toLowerCase();
    return exports.ALL_CONCEPTS.filter(c => c.category.toLowerCase().includes(lower));
}
// ============================================================================
// 关键词检索（多字段命中：name / keywords / description / category / useCases）
// ============================================================================
/**
 * 按关键词检索概念（多字段命中，任一命中即纳入候选）。
 *
 * 命中字段：
 *   - name（概念名称）
 *   - keywords（关键词数组）
 *   - description（描述）
 *   - category（分类）
 *   - useCases（应用场景）
 *
 * @param keywords 关键词列表（任一命中即可）
 * @returns 命中概念数组
 */
function searchAllConcepts(keywords) {
    if (!keywords || keywords.length === 0)
        return [];
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    return exports.ALL_CONCEPTS.filter(c => {
        const name = c.name.toLowerCase();
        const desc = c.description.toLowerCase();
        const cat = c.category.toLowerCase();
        const kws = c.keywords.map(k => k.toLowerCase());
        const useCases = c.useCases.map(u => u.toLowerCase());
        return lowerKeywords.some(lk => name.includes(lk) ||
            desc.includes(lk) ||
            cat.includes(lk) ||
            kws.some(k => k.includes(lk)) ||
            useCases.some(u => u.includes(lk)));
    });
}
// ============================================================================
// 多条件检索
// ============================================================================
/**
 * 多条件检索概念（关键词 + 族 + 复杂度 + 分类）。
 *
 * - 关键词：任一命中即可（OR 语义）
 * - 族名/族代码：在传入的族集合内（IN 语义）
 * - 复杂度：在传入的复杂度集合内（IN 语义）
 * - 分类：模糊匹配，任一命中即可（OR 语义）
 * - 各条件之间为 AND 语义（同时满足）
 *
 * @param query 查询条件
 * @returns 命中概念数组
 */
function searchConcepts(query) {
    const { keywords = [], families = [], familyCodes = [], complexities = [], categories = [], limit = 0, } = query;
    // 解析族代码 → 族名，合并到 families
    const familyWhitelist = new Set(families);
    for (const code of familyCodes) {
        const fam = exports.FAMILY_CODES[code.toUpperCase()];
        if (fam)
            familyWhitelist.add(fam);
    }
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    const lowerCategories = categories.map(c => c.toLowerCase());
    let results = exports.ALL_CONCEPTS.filter(c => {
        // 族过滤
        if (familyWhitelist.size > 0 && !familyWhitelist.has(c.family))
            return false;
        // 复杂度过滤
        if (complexities.length > 0 && !complexities.includes(c.complexity))
            return false;
        // 分类过滤（模糊 OR）
        if (lowerCategories.length > 0) {
            const cat = c.category.toLowerCase();
            if (!lowerCategories.some(lc => cat.includes(lc)))
                return false;
        }
        // 关键词过滤（多字段 OR）
        if (lowerKeywords.length > 0) {
            const name = c.name.toLowerCase();
            const desc = c.description.toLowerCase();
            const cat = c.category.toLowerCase();
            const kws = c.keywords.map(k => k.toLowerCase());
            const useCases = c.useCases.map(u => u.toLowerCase());
            const hit = lowerKeywords.some(lk => name.includes(lk) ||
                desc.includes(lk) ||
                cat.includes(lk) ||
                kws.some(k => k.includes(lk)) ||
                useCases.some(u => u.includes(lk)));
            if (!hit)
                return false;
        }
        return true;
    });
    if (limit > 0 && results.length > limit) {
        results = results.slice(0, limit);
    }
    return results;
}
// ============================================================================
// 列举与统计
// ============================================================================
/**
 * 列举全部 227 个概念。
 * @returns 全量概念数组（新引用，避免外部修改内部数据）
 */
function listAllConcepts() {
    return exports.ALL_CONCEPTS.slice();
}
/**
 * 计算概念统计报告。
 * @returns 统计对象
 */
function getConceptStatistics() {
    const byFamily = {};
    const byComplexity = {
        'O(1)': 0,
        'O(log n)': 0,
        'O(n)': 0,
        'O(n log n)': 0,
        'O(n²)': 0,
        'O(n·m)': 0,
        'O(2^n)': 0,
    };
    const byCategory = {};
    for (const c of exports.ALL_CONCEPTS) {
        byFamily[c.family] = (byFamily[c.family] || 0) + 1;
        byComplexity[c.complexity] = (byComplexity[c.complexity] || 0) + 1;
        byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    }
    return {
        total: exports.ALL_CONCEPTS.length,
        byFamily,
        byComplexity,
        byCategory,
        familyCount: Object.keys(byFamily).length,
        categoryCount: Object.keys(byCategory).length,
    };
}
