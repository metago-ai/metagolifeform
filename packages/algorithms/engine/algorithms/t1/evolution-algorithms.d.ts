/**
 * MetaGO Engine - A5 T1 算法 · 元进化类（第二批）
 *
 * 对应公理：A3 元进化公理 / A34 元进化需元进化 / A4 边界公理 / A35 创造进化律
 * 对应文档：附录A·T1·EVOLUTION（ALG_T1_E_001 ~ ALG_T1_E_015）
 *
 * 算法清单（15 个）：
 *   001 边界感知      002 差距分析        003 自生成
 *   004 进化验证      005 递归进化        006 五阶段循环
 *   007 进化速率      008 进化深度        009 进化广度
 *   010 进化适应度    011 进化压力        012 进化变异
 *   013 进化选择      014 进化交叉        015 进化谱系
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface BoundaryPoint {
    dimension: string;
    currentValue: number;
    limitValue: number;
}
export interface EvolutionState {
    stage: 'boundary-sense' | 'gap-analysis' | 'self-generate' | 'verify' | 'recurse';
    iteration: number;
    fitness: number;
}
export interface EvolutionSpecimen {
    id: string;
    genome: number[];
    fitness: number;
    age: number;
}
export declare function detectBoundary(points: BoundaryPoint[]): {
    detected: boolean;
    boundaries: BoundaryPoint[];
    severity: number;
    provenance: string[];
};
export declare function analyzeGap(current: number[], target: number[]): {
    gaps: number[];
    totalGap: number;
    relativeGap: number;
    provenance: string[];
};
export declare function selfGenerate(template: number[], mutationRate?: number, rng?: () => number): {
    generated: number[];
    mutations: number;
    provenance: string[];
};
export declare function verifyEvolution(before: number[], after: number[], threshold?: number): {
    verified: boolean;
    improvement: number;
    provenance: string[];
};
export declare function recursiveEvolve(initial: number[], evolveFn: (state: number[]) => number[], maxIterations?: number, convergenceThreshold?: number): {
    final: number[];
    iterations: number;
    converged: boolean;
    history: number[][];
    provenance: string[];
};
export declare function evolutionCycle(input: {
    state: number[];
    target: number[];
    boundaries: BoundaryPoint[];
}, evolveFn: (state: number[]) => number[], maxCycles?: number): {
    finalState: number[];
    cycles: number;
    stageLog: string[];
    provenance: string[];
};
export declare function evolutionRate(history: {
    time: number;
    fitness: number;
}[]): {
    rate: number;
    acceleration: number;
    provenance: string[];
};
export declare function evolutionDepth(lineage: EvolutionSpecimen[][]): {
    maxDepth: number;
    avgDepth: number;
    branchingFactor: number;
    provenance: string[];
};
export declare function evolutionBreadth(specimens: EvolutionSpecimen[]): {
    uniqueGenomes: number;
    diversity: number;
    spread: number;
    provenance: string[];
};
export declare function evolutionFitness(specimen: EvolutionSpecimen, objective: number[], weights?: number[]): {
    fitness: number;
    normalized: number;
    provenance: string[];
};
export declare function evolutionPressure(population: EvolutionSpecimen[], capacity: number): {
    pressure: number;
    survivorship: number;
    provenance: string[];
};
export declare function evolutionMutation(genome: number[], rate?: number, magnitude?: number, rng?: () => number): {
    mutated: number[];
    mutationCount: number;
    provenance: string[];
};
export declare function evolutionSelection(population: EvolutionSpecimen[], tournamentSize?: number, rng?: () => number): {
    selected: EvolutionSpecimen;
    provenance: string[];
};
export declare function evolutionCrossover(parentA: number[], parentB: number[], crossoverRate?: number, rng?: () => number): {
    offspring: number[];
    crossoverPoints: number[];
    provenance: string[];
};
export declare function evolutionLineage(generations: EvolutionSpecimen[][]): {
    lineage: string[][];
    totalSpecimens: number;
    bestLineage: string[];
    provenance: string[];
};
