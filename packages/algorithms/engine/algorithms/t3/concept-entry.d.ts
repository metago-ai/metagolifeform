/**
 * MetaGO Engine - T3 概念存档 · 概念条目类型定义
 *
 * 定义所有 T3 概念共享的 ConceptEntry 接口。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
/** T3 概念复杂度（字符串字面量联合，与 AlgorithmComplexity 兼容） */
export type ConceptComplexity = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(n·m)' | 'O(2^n)';
/** T3 概念条目 */
export interface ConceptEntry {
    /** 概念 ID（如 ALG_T3_C_001） */
    id: string;
    /** 概念名称 */
    name: string;
    /** 族（COUPLING/VALUE/...，对应 AlgorithmFamily 名称） */
    family: string;
    /** 分类（族内细分） */
    category: string;
    /** 复杂度 */
    complexity: ConceptComplexity;
    /** 概念描述（详细，至少 50 字） */
    description: string;
    /** 输入模式描述 */
    inputSchema: string;
    /** 输出模式描述 */
    outputSchema: string;
    /** 关键词（用于检索） */
    keywords: string[];
    /** 相关算法 ID */
    relatedAlgorithms: string[];
    /** 文档溯源 */
    documentationRef: string;
    /** 应用场景 */
    useCases: string[];
    /** 局限性 */
    limitations: string[];
    /** 溯源标记 */
    provenance: string[];
}
