/**
 * MetaGO Engine - T3 概念存档 · 推理族（R 族）
 *
 * ALG_T3_R_001 ~ ALG_T3_R_014，共 14 个概念。
 * 覆盖 FIPO 推理、演绎、归纳、类比、因果、反事实、溯因、模糊、概率、多步、链式、树状、图谱、量子推理。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
