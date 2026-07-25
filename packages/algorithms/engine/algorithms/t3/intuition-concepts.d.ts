/**
 * MetaGO Engine - T3 概念存档 · 直觉族（I 族）
 *
 * ALG_T3_I_001 ~ ALG_T3_I_014，共 14 个概念。
 * 覆盖直觉感知、判断、决策、学习、验证、溯源、进化、模式识别、启发式、经验直觉、专家直觉、创造直觉、危险直觉、机会直觉。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
