/**
 * MetaGO Engine - T3 概念存档 · 冲突族（X 族）
 *
 * ALG_T3_X_001 ~ ALG_T3_X_014，共 14 个概念。
 * 覆盖冲突识别、分析、转化、调解、仲裁、升级、降级、预防、溯源、记忆、进化、利益冲突、价值冲突、资源冲突。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
