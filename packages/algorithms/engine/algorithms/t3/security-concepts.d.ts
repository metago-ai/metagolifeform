/**
 * MetaGO Engine - T3 概念存档 · 安全族（S 族）
 *
 * ALG_T3_S_001 ~ ALG_T3_S_013，共 13 个概念。
 * 覆盖合规主动、法律优先、安全审计、漏洞扫描、渗透测试、权限边界、注入防护、XSS 防御、越权检测、敏感信息、依赖审计、供应链安全、事件响应。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { ConceptEntry } from './concept-entry';
export declare const CONCEPTS: ConceptEntry[];
export declare function getConceptById(id: string): ConceptEntry | undefined;
export declare function searchConcepts(keywords: string[]): ConceptEntry[];
