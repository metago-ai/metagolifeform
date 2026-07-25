/**
 * MetaGO Engine - T3 概念存档 · 决策族（D 族）
 *
 * ALG_T3_D_001 ~ ALG_T3_D_013，共 13 个概念。
 * 覆盖决策锁、意图验证、意图谱系、语义输出门、内容完整性、回溯、评估、风险、权衡、收敛、分叉、记忆、进化。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
