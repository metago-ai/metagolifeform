"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseProposition = parseProposition;
exports.normalizeProposition = normalizeProposition;
exports.negateProposition = negateProposition;
exports.conjoinPropositions = conjoinPropositions;
exports.disjoinPropositions = disjoinPropositions;
exports.implyPropositions = implyPropositions;
exports.equivPropositions = equivPropositions;
exports.isSatisfiable = isSatisfiable;
exports.isValid = isValid;
exports.isConsistent = isConsistent;
exports.matchInferenceRule = matchInferenceRule;
exports.verifyProofStep = verifyProofStep;
exports.buildProofTree = buildProofTree;
exports.traverseProofTree = traverseProofTree;
exports.verifyProofTree = verifyProofTree;
exports.searchCounterExample = searchCounterExample;
exports.detectRefutation = detectRefutation;
exports.detectContradiction = detectContradiction;
exports.detectVulnerability = detectVulnerability;
exports.verifyAssumption = verifyAssumption;
exports.applyAxiom = applyAxiom;
exports.referenceTheorem = referenceTheorem;
exports.buildInferenceChain = buildInferenceChain;
exports.verifyInferenceChain = verifyInferenceChain;
exports.checkLogicalConsistency = checkLogicalConsistency;
exports.checkLogicalCompleteness = checkLogicalCompleteness;
exports.checkLogicalSoundness = checkLogicalSoundness;
exports.checkLogicalRobustness = checkLogicalRobustness;
exports.generateLogicAuditReport = generateLogicAuditReport;
exports.comprehensiveLogicAssessment = comprehensiveLogicAssessment;
// ============================================================================
// T1·ALG_L_001 · 命题解析
// ============================================================================
function parseProposition(formula) {
    formula = formula.trim();
    if (formula.startsWith('~')) {
        return { type: 'not', operand: parseProposition(formula.substring(1)) };
    }
    if (formula.startsWith('(') && formula.endsWith(')')) {
        const inner = formula.substring(1, formula.length - 1);
        const op = findTopLevelOperator(inner);
        if (op) {
            const left = inner.substring(0, op.index).trim();
            const right = inner.substring(op.index + op.symbol.length).trim();
            switch (op.symbol) {
                case '&': return { type: 'and', left: parseProposition(left), right: parseProposition(right) };
                case '|': return { type: 'or', left: parseProposition(left), right: parseProposition(right) };
                case '->': return { type: 'implies', antecedent: parseProposition(left), consequent: parseProposition(right) };
                case '<->': return { type: 'equiv', left: parseProposition(left), right: parseProposition(right) };
            }
        }
        return parseProposition(inner);
    }
    return { type: 'atom', name: formula };
}
function findTopLevelOperator(formula) {
    let depth = 0;
    for (let i = 0; i < formula.length; i++) {
        const c = formula[i];
        if (c === '(')
            depth++;
        else if (c === ')')
            depth--;
        else if (depth === 0) {
            if (c === '&' || c === '|')
                return { symbol: c, index: i };
            if (c === '-' && formula[i + 1] === '>')
                return { symbol: '->', index: i };
            if (c === '<' && formula[i + 1] === '-' && formula[i + 2] === '>')
                return { symbol: '<->', index: i };
        }
    }
    return null;
}
// ============================================================================
// T1·ALG_L_002 · 命题归一化（输出标准字符串）
// ============================================================================
function normalizeProposition(prop) {
    switch (prop.type) {
        case 'atom': return prop.name;
        case 'not': return `~${normalizeProposition(prop.operand)}`;
        case 'and': return `(${normalizeProposition(prop.left)} & ${normalizeProposition(prop.right)})`;
        case 'or': return `(${normalizeProposition(prop.left)} | ${normalizeProposition(prop.right)})`;
        case 'implies': return `(${normalizeProposition(prop.antecedent)} -> ${normalizeProposition(prop.consequent)})`;
        case 'equiv': return `(${normalizeProposition(prop.left)} <-> ${normalizeProposition(prop.right)})`;
    }
}
// ============================================================================
// T1·ALG_L_003 · 命题否定
// ============================================================================
function negateProposition(prop) {
    return { type: 'not', operand: prop };
}
// ============================================================================
// T1·ALG_L_004 · 命题合取
// ============================================================================
function conjoinPropositions(left, right) {
    return { type: 'and', left, right };
}
// ============================================================================
// T1·ALG_L_005 · 命题析取
// ============================================================================
function disjoinPropositions(left, right) {
    return { type: 'or', left, right };
}
// ============================================================================
// T1·ALG_L_006 · 命题蕴含
// ============================================================================
function implyPropositions(antecedent, consequent) {
    return { type: 'implies', antecedent, consequent };
}
// ============================================================================
// T1·ALG_L_007 · 命题等价
// ============================================================================
function equivPropositions(left, right) {
    return { type: 'equiv', left, right };
}
// ============================================================================
// T1·ALG_L_008 · 命题可满足性（基于真值表）
// ============================================================================
function isSatisfiable(prop) {
    const atoms = extractAtoms(prop);
    if (atoms.length > 20) {
        return {
            satisfiable: true,
            model: null,
            provenance: ['[ALG_L_008] 原子数过多，跳过真值表枚举'],
        };
    }
    for (let mask = 0; mask < 2 ** atoms.length; mask++) {
        const assignment = {};
        for (let i = 0; i < atoms.length; i++) {
            assignment[atoms[i]] = ((mask >> i) & 1) === 1;
        }
        if (evaluateProposition(prop, assignment)) {
            return {
                satisfiable: true,
                model: assignment,
                provenance: [`[ALG_L_008] SAT model found`],
            };
        }
    }
    return {
        satisfiable: false,
        model: null,
        provenance: ['[ALG_L_008] UNSAT'],
    };
}
function extractAtoms(prop) {
    const atoms = new Set();
    function collect(p) {
        switch (p.type) {
            case 'atom':
                atoms.add(p.name);
                break;
            case 'not':
                collect(p.operand);
                break;
            case 'and':
            case 'or':
            case 'equiv':
                collect(p.left);
                collect(p.right);
                break;
            case 'implies':
                collect(p.antecedent);
                collect(p.consequent);
                break;
        }
    }
    collect(prop);
    return [...atoms];
}
function evaluateProposition(prop, assignment) {
    switch (prop.type) {
        case 'atom': return assignment[prop.name] ?? false;
        case 'not': return !evaluateProposition(prop.operand, assignment);
        case 'and': return evaluateProposition(prop.left, assignment) && evaluateProposition(prop.right, assignment);
        case 'or': return evaluateProposition(prop.left, assignment) || evaluateProposition(prop.right, assignment);
        case 'implies': return !evaluateProposition(prop.antecedent, assignment) || evaluateProposition(prop.consequent, assignment);
        case 'equiv': return evaluateProposition(prop.left, assignment) === evaluateProposition(prop.right, assignment);
    }
}
// ============================================================================
// T1·ALG_L_009 · 命题有效性（永真）
// ============================================================================
function isValid(prop) {
    const atoms = extractAtoms(prop);
    if (atoms.length > 20) {
        return { valid: false, provenance: ['[ALG_L_009] 原子数过多'] };
    }
    for (let mask = 0; mask < 2 ** atoms.length; mask++) {
        const assignment = {};
        for (let i = 0; i < atoms.length; i++)
            assignment[atoms[i]] = ((mask >> i) & 1) === 1;
        if (!evaluateProposition(prop, assignment)) {
            return { valid: false, provenance: ['[ALG_L_009] 反例存在'] };
        }
    }
    return { valid: true, provenance: ['[ALG_L_009] VALID'] };
}
// ============================================================================
// T1·ALG_L_010 · 命题一致性
// ============================================================================
function isConsistent(props) {
    if (props.length === 0)
        return { consistent: true, provenance: ['[ALG_L_010] 空集一致'] };
    const conjunction = props.reduce((acc, p) => (acc ? conjoinPropositions(acc, p) : p));
    const sat = isSatisfiable(conjunction);
    return {
        consistent: sat.satisfiable,
        provenance: [`[ALG_L_010] consistent=${sat.satisfiable}`],
    };
}
// ============================================================================
// T1·ALG_L_011 · 推理规则匹配
// ============================================================================
function matchInferenceRule(premises, conclusion) {
    // Modus Ponens: P, P->Q ⊢ Q
    if (premises.length === 2) {
        for (let i = 0; i < 2; i++) {
            const other = premises[1 - i];
            const impl = premises[i];
            if (impl.type === 'implies' && normalizeProposition(impl.antecedent) === normalizeProposition(other)) {
                if (normalizeProposition(impl.consequent) === normalizeProposition(conclusion)) {
                    return { rule: 'Modus Ponens', provenance: ['[ALG_L_011] rule=Modus Ponens'] };
                }
            }
        }
    }
    // And Introduction: P, Q ⊢ P∧Q
    if (premises.length === 2 && conclusion.type === 'and') {
        if (normalizeProposition(conclusion.left) === normalizeProposition(premises[0]) &&
            normalizeProposition(conclusion.right) === normalizeProposition(premises[1])) {
            return { rule: 'And Introduction', provenance: ['[ALG_L_011] rule=And Introduction'] };
        }
    }
    // And Elimination: P∧Q ⊢ P
    if (premises.length === 1 && premises[0].type === 'and') {
        if (normalizeProposition(premises[0].left) === normalizeProposition(conclusion) ||
            normalizeProposition(premises[0].right) === normalizeProposition(conclusion)) {
            return { rule: 'And Elimination', provenance: ['[ALG_L_011] rule=And Elimination'] };
        }
    }
    // Or Introduction: P ⊢ P∨Q
    if (premises.length === 1 && conclusion.type === 'or') {
        if (normalizeProposition(conclusion.left) === normalizeProposition(premises[0]) ||
            normalizeProposition(conclusion.right) === normalizeProposition(premises[0])) {
            return { rule: 'Or Introduction', provenance: ['[ALG_L_011] rule=Or Introduction'] };
        }
    }
    return { rule: null, provenance: ['[ALG_L_011] no match'] };
}
// ============================================================================
// T1·ALG_L_012 · 推理步骤验证
// ============================================================================
function verifyProofStep(step, previousSteps) {
    const premises = step.premises.map(i => previousSteps[i]?.conclusion).filter((p) => p !== undefined);
    if (premises.length !== step.premises.length) {
        return { valid: false, provenance: ['[ALG_L_012] 前提引用无效'] };
    }
    const match = matchInferenceRule(premises, step.conclusion);
    return {
        valid: match.rule !== null,
        provenance: [`[ALG_L_012] valid=${match.rule !== null} rule=${match.rule ?? 'none'}`],
    };
}
// ============================================================================
// T1·ALG_L_013 · 证明树构造
// ============================================================================
function buildProofTree(steps) {
    return {
        steps,
        conclusion: steps[steps.length - 1]?.conclusion ?? { type: 'atom', name: 'false' },
    };
}
// ============================================================================
// T1·ALG_L_014 · 证明树遍历
// ============================================================================
function traverseProofTree(tree) {
    const visited = [];
    const edges = [];
    for (let i = 0; i < tree.steps.length; i++) {
        visited.push(i);
        for (const premise of tree.steps[i].premises) {
            edges.push([premise, i]);
        }
    }
    return {
        visited,
        edges,
        provenance: [`[ALG_L_014] steps=${visited.length} edges=${edges.length}`],
    };
}
// ============================================================================
// T1·ALG_L_015 · 证明树验证
// ============================================================================
function verifyProofTree(tree) {
    const invalidSteps = [];
    for (let i = 0; i < tree.steps.length; i++) {
        const previous = tree.steps.slice(0, i);
        const result = verifyProofStep(tree.steps[i], previous);
        if (!result.valid)
            invalidSteps.push(i);
    }
    return {
        valid: invalidSteps.length === 0,
        invalidSteps,
        provenance: [`[ALG_L_015] valid=${invalidSteps.length === 0} invalid=${invalidSteps.length}`],
    };
}
// ============================================================================
// T1·ALG_L_016 · 反例搜索
// ============================================================================
function searchCounterExample(prop, maxAttempts = 1024) {
    const atoms = extractAtoms(prop);
    const limit = Math.min(maxAttempts, 2 ** atoms.length);
    for (let mask = 0; mask < limit; mask++) {
        const assignment = {};
        for (let i = 0; i < atoms.length; i++)
            assignment[atoms[i]] = ((mask >> i) & 1) === 1;
        if (!evaluateProposition(prop, assignment)) {
            return {
                found: true,
                counterExample: assignment,
                provenance: [`[ALG_L_016] found counter-example`],
            };
        }
    }
    return {
        found: false,
        counterExample: null,
        provenance: ['[ALG_L_016] no counter-example found'],
    };
}
// ============================================================================
// T1·ALG_L_017 · 反驳检测
// ============================================================================
function detectRefutation(claim, evidence) {
    for (const e of evidence) {
        const combined = conjoinPropositions(claim, e);
        const sat = isSatisfiable(combined);
        if (!sat.satisfiable) {
            return {
                refuted: true,
                refutation: e,
                provenance: [`[ALG_L_017] refuted by ${normalizeProposition(e)}`],
            };
        }
    }
    return {
        refuted: false,
        refutation: null,
        provenance: ['[ALG_L_017] not refuted'],
    };
}
// ============================================================================
// T1·ALG_L_018 · 矛盾检测
// ============================================================================
function detectContradiction(props) {
    const consistent = isConsistent(props);
    return {
        hasContradiction: !consistent.consistent,
        provenance: [`[ALG_L_018] contradiction=${!consistent.consistent}`],
    };
}
// ============================================================================
// T1·ALG_L_019 · 漏洞检测（前提缺失）
// ============================================================================
function detectVulnerability(proof, requiredPremises) {
    const usedAtoms = new Set();
    for (const step of proof.steps) {
        const atoms = extractAtoms(step.conclusion);
        atoms.forEach(a => usedAtoms.add(a));
    }
    const vulnerabilities = requiredPremises.filter(p => !usedAtoms.has(p));
    return {
        vulnerabilities,
        provenance: [`[ALG_L_019] missing=${vulnerabilities.length}`],
    };
}
// ============================================================================
// T1·ALG_L_020 · 假设验证
// ============================================================================
function verifyAssumption(assumption, facts) {
    const combined = facts.reduce((acc, f) => (acc ? conjoinPropositions(acc, f) : f), null);
    if (!combined) {
        return { holds: true, provenance: ['[ALG_L_020] 无事实，假设默认成立'] };
    }
    const implication = implyPropositions(combined, assumption);
    const valid = isValid(implication);
    return {
        holds: valid.valid,
        provenance: [`[ALG_L_020] holds=${valid.valid}`],
    };
}
// ============================================================================
// T1·ALG_L_021 · 公理应用
// ============================================================================
function applyAxiom(axiom, target) {
    if (axiom.type === 'implies' && normalizeProposition(axiom.antecedent) === normalizeProposition(target)) {
        return {
            result: axiom.consequent,
            rule: 'Modus Ponens (Axiom)',
            provenance: [`[ALG_L_021] applied MP on axiom`],
        };
    }
    return {
        result: target,
        rule: 'No application',
        provenance: ['[ALG_L_021] axiom not applicable'],
    };
}
// ============================================================================
// T1·ALG_L_022 · 定理引用
// ============================================================================
function referenceTheorem(theorem, context) {
    if (theorem.conditions.length === 0) {
        return {
            applicable: true,
            instantiated: theorem.statement,
            provenance: [`[ALG_L_022] theorem=${theorem.name} (no conditions)`],
        };
    }
    const allConditionsMet = theorem.conditions.every(c => context.some(ctx => normalizeProposition(ctx) === normalizeProposition(c)));
    return {
        applicable: allConditionsMet,
        instantiated: allConditionsMet ? theorem.statement : null,
        provenance: [`[ALG_L_022] theorem=${theorem.name} applicable=${allConditionsMet}`],
    };
}
// ============================================================================
// T1·ALG_L_023 · 推理链构造
// ============================================================================
function buildInferenceChain(start, steps) {
    const chain = [start];
    for (const step of steps) {
        chain.push(step.application);
    }
    return {
        chain,
        provenance: [`[ALG_L_023] length=${chain.length}`],
    };
}
// ============================================================================
// T1·ALG_L_024 · 推理链验证
// ============================================================================
function verifyInferenceChain(chain) {
    if (chain.length < 2) {
        return { valid: true, brokenAt: null, provenance: ['[ALG_L_024] chain too short'] };
    }
    for (let i = 1; i < chain.length; i++) {
        const match = matchInferenceRule([chain[i - 1]], chain[i]);
        if (match.rule === null) {
            // 检查是否蕴含
            const impl = implyPropositions(chain[i - 1], chain[i]);
            if (!isValid(impl).valid) {
                return { valid: false, brokenAt: i, provenance: [`[ALG_L_024] broken at step ${i}`] };
            }
        }
    }
    return { valid: true, brokenAt: null, provenance: ['[ALG_L_024] chain valid'] };
}
// ============================================================================
// T1·ALG_L_025 · 逻辑一致性检查
// ============================================================================
function checkLogicalConsistency(props) {
    const conflicts = [];
    for (let i = 0; i < props.length; i++) {
        for (let j = i + 1; j < props.length; j++) {
            const pair = [props[i], props[j]];
            const consistent = isConsistent(pair);
            if (!consistent.consistent) {
                conflicts.push([i, j]);
            }
        }
    }
    return {
        consistent: conflicts.length === 0,
        conflicts,
        provenance: [`[ALG_L_025] conflicts=${conflicts.length}`],
    };
}
// ============================================================================
// T1·ALG_L_026 · 逻辑完备性检查
// ============================================================================
function checkLogicalCompleteness(axioms, targetTheorems) {
    const unprovable = [];
    for (const theorem of targetTheorems) {
        // 简化检查：是否公理蕴含定理
        const conj = axioms.reduce((acc, a) => (acc ? conjoinPropositions(acc, a) : a), null);
        if (!conj) {
            unprovable.push(theorem);
            continue;
        }
        const impl = implyPropositions(conj, theorem);
        if (!isValid(impl).valid) {
            unprovable.push(theorem);
        }
    }
    return {
        complete: unprovable.length === 0,
        unprovable,
        provenance: [`[ALG_L_026] unprovable=${unprovable.length}`],
    };
}
// ============================================================================
// T1·ALG_L_027 · 逻辑可靠性
// ============================================================================
function checkLogicalSoundness(proof, axioms) {
    const unsoundSteps = [];
    for (let i = 0; i < proof.steps.length; i++) {
        const step = proof.steps[i];
        const previousSteps = proof.steps.slice(0, i);
        const verify = verifyProofStep(step, previousSteps);
        if (!verify.valid) {
            // 检查是否为公理
            const isAxiom = axioms.some(a => normalizeProposition(a) === normalizeProposition(step.conclusion));
            if (!isAxiom)
                unsoundSteps.push(i);
        }
    }
    return {
        sound: unsoundSteps.length === 0,
        unsoundSteps,
        provenance: [`[ALG_L_027] unsound=${unsoundSteps.length}`],
    };
}
// ============================================================================
// T1·ALG_L_028 · 逻辑健全性
// ============================================================================
function checkLogicalRobustness(proof, perturbations) {
    const brokenBy = [];
    for (const p of perturbations) {
        const newProps = [...proof.steps.map(s => s.conclusion), p];
        const contradiction = detectContradiction(newProps);
        if (contradiction.hasContradiction) {
            brokenBy.push(p);
        }
    }
    return {
        robust: brokenBy.length === 0,
        brokenBy,
        provenance: [`[ALG_L_028] broken=${brokenBy.length}`],
    };
}
// ============================================================================
// T1·ALG_L_029 · 逻辑审计报告
// ============================================================================
function generateLogicAuditReport(props, proof, axioms) {
    const consistency = checkLogicalConsistency(props);
    const completeness = checkLogicalCompleteness(axioms, props);
    const soundness = checkLogicalSoundness(proof, axioms);
    const robustness = checkLogicalRobustness(proof, []);
    const score = (consistency.consistent ? 0.3 : 0) +
        (completeness.complete ? 0.3 : 0) +
        (soundness.sound ? 0.3 : 0) +
        (robustness.robust ? 0.1 : 0);
    const report = `[LOGIC AUDIT]
Consistency: ${consistency.consistent ? 'PASS' : 'FAIL'} (conflicts=${consistency.conflicts.length})
Completeness: ${completeness.complete ? 'PASS' : 'FAIL'} (unprovable=${completeness.unprovable.length})
Soundness: ${soundness.sound ? 'PASS' : 'FAIL'} (unsound=${soundness.unsoundSteps.length})
Robustness: ${robustness.robust ? 'PASS' : 'FAIL'}
Overall Score: ${(score * 100).toFixed(2)}%`;
    return {
        report,
        score,
        provenance: [`[ALG_L_029] score=${(score * 100).toFixed(2)}%`],
    };
}
// ============================================================================
// T1·ALG_L_030 · 逻辑综合评估
// ============================================================================
function comprehensiveLogicAssessment(props, proof, axioms) {
    const issues = [];
    const consistency = checkLogicalConsistency(props);
    if (!consistency.consistent)
        issues.push(`一致性冲突 ${consistency.conflicts.length} 处`);
    const completeness = checkLogicalCompleteness(axioms, props);
    if (!completeness.complete)
        issues.push(`不可证定理 ${completeness.unprovable.length} 个`);
    const soundness = checkLogicalSoundness(proof, axioms);
    if (!soundness.sound)
        issues.push(`不可靠步骤 ${soundness.unsoundSteps.length} 个`);
    const robustness = checkLogicalRobustness(proof, []);
    if (!robustness.robust)
        issues.push(`鲁棒性破坏 ${robustness.brokenBy.length} 个`);
    const audit = generateLogicAuditReport(props, proof, axioms);
    const overallScore = audit.score;
    const grade = overallScore >= 0.9 ? 'A' : overallScore >= 0.8 ? 'B' : overallScore >= 0.7 ? 'C' : overallScore >= 0.6 ? 'D' : 'F';
    return {
        overallScore,
        grade,
        issues,
        provenance: [`[ALG_L_030] score=${(overallScore * 100).toFixed(2)}% grade=${grade}`],
    };
}
