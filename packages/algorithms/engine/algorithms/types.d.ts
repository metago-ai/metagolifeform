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
/** 算法深度等级 */
export declare enum AlgorithmTier {
    T1 = "T1",// 直接编码可执行函数
    T2 = "T2",// 封装进引擎内部
    T3 = "T3"
}
/** 算法族分类 */
export declare enum AlgorithmFamily {
    COUPLING = "COUPLING",// 耦生度计算类
    VALUE = "VALUE",// 价值评估类
    BIAS = "BIAS",// 偏差检测类
    LOGIC = "LOGIC",// 逻辑审计类
    EVOLUTION = "EVOLUTION",// 元进化类
    CREATION = "CREATION",// 元创造类
    FREQUENCY = "FREQUENCY",// 创造频率类
    DECISION = "DECISION",// 决策锁类
    SECURITY = "SECURITY",// 安全治理类
    NEGENTROPY = "NEGENTROPY",// 负熵类
    MEMORY = "MEMORY",// 记忆管理类
    LEARNING = "LEARNING",// 学习类
    REASONING = "REASONING",// 推理类
    INTUITION = "INTUITION",// 直觉类
    CONFLICT = "CONFLICT",// 冲突转化类
    TIME = "TIME",// 时空类
    DIALOG = "DIALOG",// 对话创造类
    PROACTIVE = "PROACTIVE",// 主动引擎类
    IDEA = "IDEA",// 思想引擎类
    AUDIT = "AUDIT",// 审计类
    ORCHESTRATION = "ORCHESTRATION",// 编排类
    ENVELOPE = "ENVELOPE",// 包络线类
    EMBODIED = "EMBODIED",// 具身类
    EDGE = "EDGE",// 边缘部署类
    INDUSTRIAL = "INDUSTRIAL",// 工业分类类
    MODE_RESONANCE = "MODE_RESONANCE",// 模数共振类
    GENERAL = "GENERAL"
}
/** 算法复杂度 */
export declare enum AlgorithmComplexity {
    O1 = "O(1)",
    O_LOG_N = "O(log n)",
    O_N = "O(n)",
    O_N_LOG_N = "O(n log n)",
    O_N2 = "O(n\u00B2)",
    O_N_M = "O(n\u00B7m)",
    O_2_N = "O(2^n)"
}
/** 算法注册条目 */
export interface AlgorithmRegistryEntry {
    /** 算法 ID（如 ALG_001） */
    id: string;
    /** 算法名称 */
    name: string;
    /** 算法族 */
    family: AlgorithmFamily;
    /** 深度等级 */
    tier: AlgorithmTier;
    /** 函数引用（T1 必填，T2 可选，T3 为 null） */
    handler?: AlgorithmHandler<unknown, unknown>;
    /** 测试文件路径 */
    testPath?: string;
    /** 所属引擎模块路径（T2 必填） */
    enginePath?: string;
    /** 文档溯源行号/路径 */
    documentationRef: string;
    /** 复杂度 */
    complexity: AlgorithmComplexity;
    /** 输入 schema 描述 */
    inputSchema: string;
    /** 输出 schema 描述 */
    outputSchema: string;
    /** 算法描述 */
    description: string;
    /** 关键词（用于检索） */
    keywords: string[];
    /** 是否已实现 */
    implemented: boolean;
}
/** 算法处理函数类型 */
export type AlgorithmHandler<I, O> = (input: I) => O | Promise<O>;
/** 算法执行结果 */
export interface AlgorithmResult<O = unknown> {
    success: boolean;
    output?: O;
    error?: string;
    provenance: string[];
    durationMs: number;
}
/** 算法审计报告条目 */
export interface AlgorithmAuditEntry {
    id: string;
    name: string;
    tier: AlgorithmTier;
    family: AlgorithmFamily;
    implemented: boolean;
    hasTest: boolean;
    hasDocRef: boolean;
    complexity: AlgorithmComplexity;
    depthLevel: 0 | 1 | 2 | 3 | 4;
}
/** 算法审计报告 */
export interface AlgorithmAuditReport {
    total: number;
    t1Total: number;
    t1Implemented: number;
    t1Tested: number;
    t2Total: number;
    t2Implemented: number;
    t3Total: number;
    t3Documented: number;
    byFamily: Record<AlgorithmFamily, {
        total: number;
        implemented: number;
    }>;
    byComplexity: Record<AlgorithmComplexity, number>;
    entries: AlgorithmAuditEntry[];
    generatedAt: string;
}
