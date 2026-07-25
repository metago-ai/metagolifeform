/**
 * MetaGO Engine - T3 概念存档 · 价值族（V 族）
 *
 * ALG_T3_V_001 ~ ALG_T3_V_015，共 15 个概念。
 * 覆盖 DCV 六维价值、价值对齐、冲突、衰减、增益、转移、平衡、审计、溯源、校准、投影、密度、熵、深度、广度。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
