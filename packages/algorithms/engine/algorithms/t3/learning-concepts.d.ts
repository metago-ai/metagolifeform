/**
 * MetaGO Engine - T3 概念存档 · 学习族（G 族）
 *
 * ALG_T3_G_001 ~ ALG_T3_G_014，共 14 个概念。
 * 覆盖经验学习、反馈学习、强化学习、监督学习、无监督学习、迁移学习、元学习、在线学习、增量学习、联邦学习、主动学习、课程学习、多任务学习、持续学习。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
