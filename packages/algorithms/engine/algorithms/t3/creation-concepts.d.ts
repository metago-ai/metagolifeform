/**
 * MetaGO Engine - T3 概念存档 · 元创造族（M 族）
 *
 * ALG_T3_M_001 ~ ALG_T3_M_015，共 15 个概念。
 * 覆盖元创造、内生创造、零到一、创造频率、回路、验证、递归、边界、跃迁、收敛、发散、评估、溯源、记忆、进化。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
