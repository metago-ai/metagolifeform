/**
 * MetaGO Engine - T3 概念存档 · 记忆族（K 族）
 *
 * ALG_T3_K_001 ~ ALG_T3_K_014，共 14 个概念。
 * 覆盖 KMWI 四层、热记忆、温记忆、冷记忆、冻记忆、自愈、守护、冗余、校验、衰减、强化、溯源、进化、生命体。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
