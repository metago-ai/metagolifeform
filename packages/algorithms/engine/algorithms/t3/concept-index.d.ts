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
import { ConceptEntry, ConceptComplexity } from './concept-entry';
/** 全部 227 个 T3 概念（按族顺序合并） */
export declare const ALL_CONCEPTS: ConceptEntry[];
/** 族代码 → 族名映射（16 族） */
export declare const FAMILY_CODES: Record<string, string>;
/** 族名 → 族代码映射（反向） */
export declare const FAMILY_NAMES: Record<string, string>;
/** 概念检索查询条件 */
export interface ConceptSearchQuery {
    /** 关键词列表（任一命中即可，不区分大小写） */
    keywords?: string[];
    /** 族名过滤（如 ['COUPLING', 'VALUE']，为空则不限） */
    families?: string[];
    /** 族代码过滤（如 ['C', 'V']，为空则不限） */
    familyCodes?: string[];
    /** 复杂度过滤（如 ['O(n)', 'O(1)']，为空则不限） */
    complexities?: ConceptComplexity[];
    /** 分类过滤（族内细分，如 ['耦生度量']，为空则不限） */
    categories?: string[];
    /** 限制返回数量（默认 0 = 不限） */
    limit?: number;
}
/**
 * 按 ID 获取概念（全量检索）。
 * @param id 概念 ID（如 ALG_T3_C_001）
 * @returns 概念条目；未找到返回 undefined
 */
export declare function getConceptById(id: string): ConceptEntry | undefined;
/**
 * 按族名获取该族全部概念。
 * @param family 族名（如 COUPLING）
 * @returns 该族概念数组
 */
export declare function listByFamily(family: string): ConceptEntry[];
/**
 * 按族代码获取该族全部概念。
 * @param code 族代码（如 C）
 * @returns 该族概念数组
 */
export declare function listByFamilyCode(code: string): ConceptEntry[];
/**
 * 按复杂度获取概念。
 * @param complexity 复杂度字面量
 * @returns 命中概念数组
 */
export declare function listByComplexity(complexity: ConceptComplexity): ConceptEntry[];
/**
 * 按分类（族内细分）检索。
 * @param category 分类名称（模糊匹配）
 * @returns 命中概念数组
 */
export declare function listByCategory(category: string): ConceptEntry[];
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
export declare function searchAllConcepts(keywords: string[]): ConceptEntry[];
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
export declare function searchConcepts(query: ConceptSearchQuery): ConceptEntry[];
/**
 * 列举全部 227 个概念。
 * @returns 全量概念数组（新引用，避免外部修改内部数据）
 */
export declare function listAllConcepts(): ConceptEntry[];
/** 概念统计报告 */
export interface ConceptStatistics {
    /** 概念总数 */
    total: number;
    /** 按族统计：{ COUPLING: 15, VALUE: 15, ... } */
    byFamily: Record<string, number>;
    /** 按复杂度统计：{ 'O(n)': 80, 'O(1)': 30, ... } */
    byComplexity: Record<ConceptComplexity, number>;
    /** 按分类统计（族内细分） */
    byCategory: Record<string, number>;
    /** 涉及的族数量 */
    familyCount: number;
    /** 涉及的分类数量 */
    categoryCount: number;
}
/**
 * 计算概念统计报告。
 * @returns 统计对象
 */
export declare function getConceptStatistics(): ConceptStatistics;
