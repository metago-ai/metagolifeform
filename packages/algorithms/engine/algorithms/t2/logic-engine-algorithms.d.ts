/**
 * MetaGO Engine - A5 T2 算法 · 逻辑引擎封装类（ALG_T2_L_001~020）
 *
 * 对应增强项：A5 927 算法 T1/T2 真实编码（目标 L3）
 * 对应文档：附录A 算法清单 T2 第 61~80 项（逻辑引擎）
 *
 * 引擎封装算法特征：
 *   - 作为 logic-engine / cuv-reasoner 的私有辅助方法
 *   - 处理证明树构建、推理链验证、公理系统一致性
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export interface ProofNode {
    id: string;
    statement: string;
    rule: string;
    children: ProofNode[];
    verified: boolean;
}
export interface Axiom {
    id: string;
    statement: string;
    predicate: string;
}
export declare function proofTreeDepth(node: ProofNode): {
    depth: number;
    leafCount: number;
    provenance: string[];
};
export declare function proofTreeVerify(node: ProofNode): {
    verified: boolean;
    unverifiedNodes: string[];
    provenance: string[];
};
export declare function axiomConsistencyCheck(axioms: Axiom[]): {
    consistent: boolean;
    conflicts: [string, string][];
    provenance: string[];
};
export declare function inferenceChainBuild(start: string, rules: {
    premise: string;
    conclusion: string;
    rule: string;
}[], target: string, maxDepth?: number): {
    chain: string[];
    rules: string[];
    found: boolean;
    provenance: string[];
};
export declare function propositionSatisfiability(clauses: string[][]): {
    satisfiable: boolean;
    assignment: Record<string, boolean> | null;
    provenance: string[];
};
export declare function modalLogicEval(proposition: string, modality: 'necessary' | 'possible', worlds: {
    name: string;
    truth: Record<string, boolean>;
}[]): {
    valid: boolean;
    satisfiedWorlds: string[];
    provenance: string[];
};
export declare function deductiveVerify(premises: string[], conclusion: string, rules: {
    pattern: string[];
    conclusion: string;
}[]): {
    valid: boolean;
    appliedRules: string[];
    provenance: string[];
};
export declare function inductiveStrength(instances: {
    positive: boolean;
}[], confidenceLevel?: number): {
    strength: number;
    confidence: number;
    sufficient: boolean;
    provenance: string[];
};
export declare function abductiveBestExplanation(observations: string[], hypotheses: {
    name: string;
    explains: string[];
    priorProbability: number;
    simplicity: number;
}[]): {
    best: string | null;
    score: number;
    provenance: string[];
};
export declare function analogicalReasoning(source: {
    attributes: Record<string, number>;
    relations: [string, string, string][];
}, target: {
    attributes: Record<string, number>;
    relations: [string, string, string][];
}): {
    similarity: number;
    mappedAttributes: number;
    provenance: string[];
};
export declare function logicConsistencyMatrix(statements: string[], truthFunction: (s: string) => boolean): {
    matrix: boolean[][];
    consistent: boolean;
    contradictionCount: number;
    provenance: string[];
};
export declare function predicateUnification(p1: {
    predicate: string;
    args: string[];
}, p2: {
    predicate: string;
    args: string[];
}): {
    unified: boolean;
    bindings: Record<string, string>;
    provenance: string[];
};
export declare function counterExampleSearch(claim: (assignment: Record<string, boolean>) => boolean, variables: string[], maxAttempts?: number): {
    found: boolean;
    counterExample: Record<string, boolean> | null;
    attempts: number;
    provenance: string[];
};
export declare function logicCompleteness(axioms: string[], targetTheorems: string[], inferenceRules: {
    premises: string[];
    conclusion: string;
}[]): {
    complete: boolean;
    unprovable: string[];
    provenance: string[];
};
export declare function logicSoundness(proof: {
    step: string;
    rule: string;
    premises: string[];
}[], axioms: Set<string>): {
    sound: boolean;
    unsoundSteps: string[];
    provenance: string[];
};
export declare function inferenceRuleSynthesize(examples: {
    premises: string[];
    conclusion: string;
}[]): {
    rule: {
        premises: string[];
        conclusion: string;
    } | null;
    confidence: number;
    provenance: string[];
};
export declare function truthTableGenerate(variables: string[], expression: (vals: Record<string, boolean>) => boolean): {
    headers: string[];
    rows: {
        values: Record<string, boolean>;
        result: boolean;
    }[];
    provenance: string[];
};
export declare function logicNormalFormConvert(clauses: string[][], toForm: 'CNF' | 'DNF'): {
    normalForm: string[][];
    converted: boolean;
    provenance: string[];
};
export declare function argumentStrength(argument: {
    premises: {
        statement: string;
        confidence: number;
    }[];
    conclusion: string;
    inferenceType: 'deductive' | 'inductive' | 'abductive';
}): {
    strength: number;
    valid: boolean;
    provenance: string[];
};
export declare function logicAuditComprehensive(proof: ProofNode, axioms: Axiom[], targetConclusions: string[]): {
    score: number;
    grade: string;
    issues: string[];
    provenance: string[];
};
