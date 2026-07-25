/**
 * MetaGO Engine - T3 概念存档 · 负熵族（N 族）
 *
 * ALG_T3_N_001 ~ ALG_T3_N_014，共 14 个概念。
 * 覆盖负熵监测、熵增检测、熵减策略、系统有序度、熵变计算、社会责任、熵流分析、熵平衡、熵阈值、稳态监测、熵溯源、熵审计、熵优化、熵进化。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
