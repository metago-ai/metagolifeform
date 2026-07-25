/**
 * MetaGO Engine - T3 概念存档 · 逻辑族（L 族）
 *
 * ALG_T3_L_001 ~ ALG_T3_L_015，共 15 个概念。
 * 覆盖命题解析、合取、析取、蕴含、可满足性、有效性、一致性、推理规则、证明树、反例、矛盾、漏洞、公理、推理链、完备性。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
