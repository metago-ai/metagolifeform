/**
 * MetaGO Engine - A5 927 算法真实化 · 算法注册表
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单（T1=300 / T2=400 / T3=227）
 *
 * 算法 ID 规范：
 *   T1: ALG_T1_<族代码>_<序号>（如 ALG_T1_C_001 = 耦生度类第 1 个）
 *   T2: ALG_T2_<族代码>_<序号>
 *   T3: ALG_T3_<族代码>_<序号>
 *
 * 族代码：
 *   C=COUPLING  V=VALUE  B=BIAS  L=LOGIC
 *   E=EVOLUTION  M=CREATION  F=FREQUENCY  D=DECISION
 *   S=SECURITY  N=NEGENTROPY  K=MEMORY  G=LEARNING
 *   R=REASONING  I=INTUITION  X=CONFLICT  T=TIME
 *   A=DIALOG  P=PROACTIVE  H=IDEA  U=AUDIT
 *   O=ORCHESTRATION  W=ENVELOPE  EM=EMBODIED  ED=EDGE
 *   IN=INDUSTRIAL  MR=MODE_RESONANCE  Z=GENERAL
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
import { AlgorithmRegistryEntry, AlgorithmFamily, AlgorithmTier } from './types';
export declare function getRegistry(): AlgorithmRegistryEntry[];
export declare function getAlgorithmById(id: string): AlgorithmRegistryEntry | undefined;
export declare function getAlgorithmsByTier(tier: AlgorithmTier): AlgorithmRegistryEntry[];
export declare function getAlgorithmsByFamily(family: AlgorithmFamily): AlgorithmRegistryEntry[];
export declare function searchAlgorithms(keywords: string[]): AlgorithmRegistryEntry[];
export declare function getImplementedCount(): {
    t1: number;
    t2: number;
    t3: number;
    total: number;
};
export declare function getTotalCount(): {
    t1: number;
    t2: number;
    t3: number;
    total: number;
};
/** 执行算法（异步版本，支持 async handler） */
export declare function executeAlgorithm<I, O>(id: string, input: I): Promise<{
    success: boolean;
    output?: O;
    error?: string;
    provenance: string[];
    durationMs: number;
}>;
/**
 * 执行算法（同步版本，仅适用于同步 handler，如 T1 算法）
 *
 * 当 handler 返回 Promise 时，会返回错误提示用户改用 executeAlgorithm（async 版本）。
 * 适用于 T1 直接函数型算法（300 个），不适用于 T2/T3 可能的 async handler。
 *
 * @example
 * ```typescript
 * const result = executeAlgorithmSync('ALG_T1_C_001', { a: [1,2,3], b: [2,4,6] });
 * console.log(result.output.score); // 1
 * ```
 */
export declare function executeAlgorithmSync<I, O>(id: string, input: I): {
    success: boolean;
    output?: O;
    error?: string;
    provenance: string[];
    durationMs: number;
};
