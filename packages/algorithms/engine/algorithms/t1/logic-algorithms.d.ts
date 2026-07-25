/**
 * MetaGO Engine - A5 T1 算法 · 逻辑审计类（第一批）
 *
 * 对应文档：C4 CUV 形式化推理引擎 / prover.ts / checker.ts
 *
 * 算法清单（30 个，ALG_L_001 ~ ALG_L_030）：
 *   001 命题解析        002 命题归一化      003 命题否定
 *   004 命题合取        005 命题析取        006 命题蕴含
 *   007 命题等价        008 命题可满足性    009 命题有效性
 *   010 命题一致性      011 推理规则匹配    012 推理步骤验证
 *   013 证明树构造      014 证明树遍历      015 证明树验证
 *   016 反例搜索        017 反驳检测        018 矛盾检测
 *   019 漏洞检测        020 假设验证        021 公理应用
 *   022 定理引用        023 推理链构造      024 推理链验证
 *   025 逻辑一致性      026 逻辑完备性      027 逻辑可靠性
 *   028 逻辑健全性      029 逻辑审计报告    030 逻辑综合评估
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */
export type Proposition = {
    type: 'atom';
    name: string;
} | {
    type: 'not';
    operand: Proposition;
} | {
    type: 'and';
    left: Proposition;
    right: Proposition;
} | {
    type: 'or';
    left: Proposition;
    right: Proposition;
} | {
    type: 'implies';
    antecedent: Proposition;
    consequent: Proposition;
} | {
    type: 'equiv';
    left: Proposition;
    right: Proposition;
};
export interface ProofStep {
    rule: string;
    premises: number[];
    conclusion: Proposition;
}
export interface ProofTree {
    steps: ProofStep[];
    conclusion: Proposition;
}
export declare function parseProposition(formula: string): Proposition;
export declare function normalizeProposition(prop: Proposition): string;
export declare function negateProposition(prop: Proposition): Proposition;
export declare function conjoinPropositions(left: Proposition, right: Proposition): Proposition;
export declare function disjoinPropositions(left: Proposition, right: Proposition): Proposition;
export declare function implyPropositions(antecedent: Proposition, consequent: Proposition): Proposition;
export declare function equivPropositions(left: Proposition, right: Proposition): Proposition;
export declare function isSatisfiable(prop: Proposition): {
    satisfiable: boolean;
    model: Record<string, boolean> | null;
    provenance: string[];
};
export declare function isValid(prop: Proposition): {
    valid: boolean;
    provenance: string[];
};
export declare function isConsistent(props: Proposition[]): {
    consistent: boolean;
    provenance: string[];
};
export declare function matchInferenceRule(premises: Proposition[], conclusion: Proposition): {
    rule: string | null;
    provenance: string[];
};
export declare function verifyProofStep(step: ProofStep, previousSteps: ProofStep[]): {
    valid: boolean;
    provenance: string[];
};
export declare function buildProofTree(steps: ProofStep[]): ProofTree;
export declare function traverseProofTree(tree: ProofTree): {
    visited: number[];
    edges: [number, number][];
    provenance: string[];
};
export declare function verifyProofTree(tree: ProofTree): {
    valid: boolean;
    invalidSteps: number[];
    provenance: string[];
};
export declare function searchCounterExample(prop: Proposition, maxAttempts?: number): {
    found: boolean;
    counterExample: Record<string, boolean> | null;
    provenance: string[];
};
export declare function detectRefutation(claim: Proposition, evidence: Proposition[]): {
    refuted: boolean;
    refutation: Proposition | null;
    provenance: string[];
};
export declare function detectContradiction(props: Proposition[]): {
    hasContradiction: boolean;
    provenance: string[];
};
export declare function detectVulnerability(proof: ProofTree, requiredPremises: string[]): {
    vulnerabilities: string[];
    provenance: string[];
};
export declare function verifyAssumption(assumption: Proposition, facts: Proposition[]): {
    holds: boolean;
    provenance: string[];
};
export declare function applyAxiom(axiom: Proposition, target: Proposition): {
    result: Proposition;
    rule: string;
    provenance: string[];
};
export declare function referenceTheorem(theorem: {
    name: string;
    statement: Proposition;
    conditions: Proposition[];
}, context: Proposition[]): {
    applicable: boolean;
    instantiated: Proposition | null;
    provenance: string[];
};
export declare function buildInferenceChain(start: Proposition, steps: {
    rule: string;
    application: Proposition;
}[]): {
    chain: Proposition[];
    provenance: string[];
};
export declare function verifyInferenceChain(chain: Proposition[]): {
    valid: boolean;
    brokenAt: number | null;
    provenance: string[];
};
export declare function checkLogicalConsistency(props: Proposition[]): {
    consistent: boolean;
    conflicts: [number, number][];
    provenance: string[];
};
export declare function checkLogicalCompleteness(axioms: Proposition[], targetTheorems: Proposition[]): {
    complete: boolean;
    unprovable: Proposition[];
    provenance: string[];
};
export declare function checkLogicalSoundness(proof: ProofTree, axioms: Proposition[]): {
    sound: boolean;
    unsoundSteps: number[];
    provenance: string[];
};
export declare function checkLogicalRobustness(proof: ProofTree, perturbations: Proposition[]): {
    robust: boolean;
    brokenBy: Proposition[];
    provenance: string[];
};
export declare function generateLogicAuditReport(props: Proposition[], proof: ProofTree, axioms: Proposition[]): {
    report: string;
    score: number;
    provenance: string[];
};
export declare function comprehensiveLogicAssessment(props: Proposition[], proof: ProofTree, axioms: Proposition[]): {
    overallScore: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    issues: string[];
    provenance: string[];
};
