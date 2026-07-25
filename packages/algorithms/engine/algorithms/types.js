"use strict";
/**
 * MetaGO Engine - A5 927 算法真实化 · 类型定义
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单（T1=300 / T2=400 / T3=227）
 *
 * 算法深度分级：
 *   T1（300）：直接编码为可执行函数，每函数附单元测试 + 文档溯源
 *   T2（400）：封装进对应引擎内部，作为引擎私有方法
 *   T3（227）：概念存档检索，按族/关键词/复杂度索引
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlgorithmComplexity = exports.AlgorithmFamily = exports.AlgorithmTier = void 0;
/** 算法深度等级 */
var AlgorithmTier;
(function (AlgorithmTier) {
    AlgorithmTier["T1"] = "T1";
    AlgorithmTier["T2"] = "T2";
    AlgorithmTier["T3"] = "T3";
})(AlgorithmTier || (exports.AlgorithmTier = AlgorithmTier = {}));
/** 算法族分类 */
var AlgorithmFamily;
(function (AlgorithmFamily) {
    AlgorithmFamily["COUPLING"] = "COUPLING";
    AlgorithmFamily["VALUE"] = "VALUE";
    AlgorithmFamily["BIAS"] = "BIAS";
    AlgorithmFamily["LOGIC"] = "LOGIC";
    AlgorithmFamily["EVOLUTION"] = "EVOLUTION";
    AlgorithmFamily["CREATION"] = "CREATION";
    AlgorithmFamily["FREQUENCY"] = "FREQUENCY";
    AlgorithmFamily["DECISION"] = "DECISION";
    AlgorithmFamily["SECURITY"] = "SECURITY";
    AlgorithmFamily["NEGENTROPY"] = "NEGENTROPY";
    AlgorithmFamily["MEMORY"] = "MEMORY";
    AlgorithmFamily["LEARNING"] = "LEARNING";
    AlgorithmFamily["REASONING"] = "REASONING";
    AlgorithmFamily["INTUITION"] = "INTUITION";
    AlgorithmFamily["CONFLICT"] = "CONFLICT";
    AlgorithmFamily["TIME"] = "TIME";
    AlgorithmFamily["DIALOG"] = "DIALOG";
    AlgorithmFamily["PROACTIVE"] = "PROACTIVE";
    AlgorithmFamily["IDEA"] = "IDEA";
    AlgorithmFamily["AUDIT"] = "AUDIT";
    AlgorithmFamily["ORCHESTRATION"] = "ORCHESTRATION";
    AlgorithmFamily["ENVELOPE"] = "ENVELOPE";
    AlgorithmFamily["EMBODIED"] = "EMBODIED";
    AlgorithmFamily["EDGE"] = "EDGE";
    AlgorithmFamily["INDUSTRIAL"] = "INDUSTRIAL";
    AlgorithmFamily["MODE_RESONANCE"] = "MODE_RESONANCE";
    AlgorithmFamily["GENERAL"] = "GENERAL";
})(AlgorithmFamily || (exports.AlgorithmFamily = AlgorithmFamily = {}));
/** 算法复杂度 */
var AlgorithmComplexity;
(function (AlgorithmComplexity) {
    AlgorithmComplexity["O1"] = "O(1)";
    AlgorithmComplexity["O_LOG_N"] = "O(log n)";
    AlgorithmComplexity["O_N"] = "O(n)";
    AlgorithmComplexity["O_N_LOG_N"] = "O(n log n)";
    AlgorithmComplexity["O_N2"] = "O(n\u00B2)";
    AlgorithmComplexity["O_N_M"] = "O(n\u00B7m)";
    AlgorithmComplexity["O_2_N"] = "O(2^n)";
})(AlgorithmComplexity || (exports.AlgorithmComplexity = AlgorithmComplexity = {}));
