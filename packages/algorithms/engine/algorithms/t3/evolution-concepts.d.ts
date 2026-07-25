/**
 * MetaGO Engine - T3 概念存档 · 元进化族（E 族）
 *
 * ALG_T3_E_001 ~ ALG_T3_E_015，共 15 个概念。
 * 覆盖边界感知、差距分析、自生成、验证、递归、元进化循环、能力边界、进化引擎、指标、路径、回溯、收敛、分叉、稳态、涌现。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
