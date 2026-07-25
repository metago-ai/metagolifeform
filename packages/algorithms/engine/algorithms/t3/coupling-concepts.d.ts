/**
 * MetaGO Engine - T3 概念存档 · 耦生度族（C 族）
 *
 * ALG_T3_C_001 ~ ALG_T3_C_015，共 15 个概念。
 * 覆盖耦生度量化、对称性、衰减、矩阵、聚类、趋势、归一化、维度、共振、相变、能级、图谱、熵等核心概念。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
