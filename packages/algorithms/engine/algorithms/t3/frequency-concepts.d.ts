/**
 * MetaGO Engine - T3 概念存档 · 频率族（F 族）
 *
 * ALG_T3_F_001 ~ ALG_T3_F_013，共 13 个概念。
 * 覆盖频率自适应、高频激活、低频深潜、切换、监测、校准、共振、衰减、阈值、稳态、涌现、耦合、谱。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
