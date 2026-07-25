/**
 * MetaGO Engine - T3 概念存档 · 偏差族（B 族）
 *
 * ALG_T3_B_001 ~ ALG_T3_B_015，共 15 个概念。
 * 覆盖漂移、偏差向量、异常、离群、分布偏移、概念/数据/模型/行为/价值漂移、性能退化、归因、根因、修正、预警。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
