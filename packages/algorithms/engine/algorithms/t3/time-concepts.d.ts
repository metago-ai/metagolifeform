/**
 * MetaGO Engine - T3 概念存档 · 时空族（T 族）
 *
 * ALG_T3_T_001 ~ ALG_T3_T_014，共 14 个概念。
 * 覆盖时间衰减、序列、窗口、戳、同步、漂移、预算、优化、感知、记忆、推理、冲突、平衡、进化。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
