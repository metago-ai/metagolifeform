"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.proofTreeDepth = proofTreeDepth;
exports.proofTreeVerify = proofTreeVerify;
exports.axiomConsistencyCheck = axiomConsistencyCheck;
exports.inferenceChainBuild = inferenceChainBuild;
exports.propositionSatisfiability = propositionSatisfiability;
exports.modalLogicEval = modalLogicEval;
exports.deductiveVerify = deductiveVerify;
exports.inductiveStrength = inductiveStrength;
exports.abductiveBestExplanation = abductiveBestExplanation;
exports.analogicalReasoning = analogicalReasoning;
exports.logicConsistencyMatrix = logicConsistencyMatrix;
exports.predicateUnification = predicateUnification;
exports.counterExampleSearch = counterExampleSearch;
exports.logicCompleteness = logicCompleteness;
exports.logicSoundness = logicSoundness;
exports.inferenceRuleSynthesize = inferenceRuleSynthesize;
exports.truthTableGenerate = truthTableGenerate;
exports.logicNormalFormConvert = logicNormalFormConvert;
exports.argumentStrength = argumentStrength;
exports.logicAuditComprehensive = logicAuditComprehensive;
// ============================================================================
// ALG_T2_L_001 · 证明树深度计算
// ============================================================================
function proofTreeDepth(node) {
    if (!node) {
        return { depth: 0, leafCount: 0, provenance: ['[ALG_T2_L_001] 空节点'] };
    }
    function calc(n) {
        if (n.children.length === 0)
            return { depth: 1, leaf: 1 };
        let maxDepth = 0, leaf = 0;
        for (const c of n.children) {
            const r = calc(c);
            maxDepth = Math.max(maxDepth, r.depth);
            leaf += r.leaf;
        }
        return { depth: maxDepth + 1, leaf };
    }
    const r = calc(node);
    return {
        depth: r.depth,
        leafCount: r.leaf,
        provenance: [`[ALG_T2_L_001] depth=${r.depth} leaves=${r.leaf}`],
    };
}
// ============================================================================
// ALG_T2_L_002 · 证明树验证遍历
// ============================================================================
function proofTreeVerify(node) {
    if (!node) {
        return { verified: false, unverifiedNodes: [], provenance: ['[ALG_T2_L_002] 空树'] };
    }
    const unverified = [];
    function traverse(n) {
        let ok = n.verified;
        if (!n.verified)
            unverified.push(n.id);
        for (const c of n.children) {
            if (!traverse(c))
                ok = false;
        }
        return ok;
    }
    const verified = traverse(node);
    return {
        verified,
        unverifiedNodes: unverified,
        provenance: [`[ALG_T2_L_002] verified=${verified} unverified=${unverified.length}`],
    };
}
// ============================================================================
// ALG_T2_L_003 · 公理系统一致性检查
// ============================================================================
function axiomConsistencyCheck(axioms) {
    const conflicts = [];
    for (let i = 0; i < axioms.length; i++) {
        for (let j = i + 1; j < axioms.length; j++) {
            const a = axioms[i];
            const b = axioms[j];
            // 简化的冲突检测：相反谓词
            if (a.predicate === `!${b.predicate}` || b.predicate === `!${a.predicate}`) {
                conflicts.push([a.id, b.id]);
            }
            if (a.statement === b.statement && a.predicate !== b.predicate) {
                conflicts.push([a.id, b.id]);
            }
        }
    }
    return {
        consistent: conflicts.length === 0,
        conflicts,
        provenance: [`[ALG_T2_L_003] axioms=${axioms.length} conflicts=${conflicts.length}`],
    };
}
// ============================================================================
// ALG_T2_L_004 · 推理链构建
// ============================================================================
function inferenceChainBuild(start, rules, target, maxDepth = 10) {
    if (maxDepth <= 0) {
        return { chain: [], rules: [], found: false, provenance: ['[ALG_T2_L_004] 深度限制'] };
    }
    const visited = new Set([start]);
    function dfs(current, path, rulePath) {
        if (current === target) {
            return { chain: path, rules: rulePath, found: true };
        }
        if (path.length >= maxDepth) {
            return { chain: path, rules: rulePath, found: false };
        }
        for (const r of rules) {
            if (r.premise === current && !visited.has(r.conclusion)) {
                visited.add(r.conclusion);
                const result = dfs(r.conclusion, [...path, r.conclusion], [...rulePath, r.rule]);
                if (result.found)
                    return result;
            }
        }
        return { chain: path, rules: rulePath, found: false };
    }
    const result = dfs(start, [start], []);
    return {
        chain: result.chain,
        rules: result.rules,
        found: result.found,
        provenance: [`[ALG_T2_L_004] chain=${result.chain.length} found=${result.found}`],
    };
}
// ============================================================================
// ALG_T2_L_005 · 命题可满足性（SAT 简化版）
// ============================================================================
function propositionSatisfiability(clauses) {
    if (clauses.length === 0) {
        return { satisfiable: true, assignment: {}, provenance: ['[ALG_T2_L_005] 空子句集'] };
    }
    const vars = new Set();
    for (const c of clauses) {
        for (const lit of c) {
            vars.add(lit.startsWith('!') ? lit.substring(1) : lit);
        }
    }
    const varList = Array.from(vars);
    const n = varList.length;
    // 限制变量数避免组合爆炸
    if (n > 20) {
        return { satisfiable: false, assignment: null, provenance: [`[ALG_T2_L_005] 变量过多 (${n} > 20)`] };
    }
    for (let mask = 0; mask < (1 << n); mask++) {
        const assignment = {};
        for (let i = 0; i < n; i++) {
            assignment[varList[i]] = (mask & (1 << i)) !== 0;
        }
        let allSatisfied = true;
        for (const clause of clauses) {
            let satisfied = false;
            for (const lit of clause) {
                const negated = lit.startsWith('!');
                const v = negated ? lit.substring(1) : lit;
                if (assignment[v] === !negated) {
                    satisfied = true;
                    break;
                }
            }
            if (!satisfied) {
                allSatisfied = false;
                break;
            }
        }
        if (allSatisfied) {
            return { satisfiable: true, assignment, provenance: [`[ALG_T2_L_005] SAT vars=${n}`] };
        }
    }
    return { satisfiable: false, assignment: null, provenance: [`[ALG_T2_L_005] UNSAT vars=${n}`] };
}
// ============================================================================
// ALG_T2_L_006 · 模态逻辑评估
// ============================================================================
function modalLogicEval(proposition, modality, worlds) {
    if (worlds.length === 0) {
        return { valid: false, satisfiedWorlds: [], provenance: ['[ALG_T2_L_006] 无可能世界'] };
    }
    const satisfied = [];
    for (const w of worlds) {
        if (w.truth[proposition])
            satisfied.push(w.name);
    }
    const valid = modality === 'necessary' ? satisfied.length === worlds.length : satisfied.length > 0;
    return {
        valid,
        satisfiedWorlds: satisfied,
        provenance: [`[ALG_T2_L_006] prop=${proposition} mod=${modality} valid=${valid} sat=${satisfied.length}/${worlds.length}`],
    };
}
// ============================================================================
// ALG_T2_L_007 · 演绎推理验证
// ============================================================================
function deductiveVerify(premises, conclusion, rules) {
    const derived = new Set(premises);
    const appliedRules = [];
    let changed = true;
    while (changed) {
        changed = false;
        for (const rule of rules) {
            if (rule.pattern.every(p => derived.has(p)) && !derived.has(rule.conclusion)) {
                derived.add(rule.conclusion);
                appliedRules.push(rule.conclusion);
                changed = true;
            }
        }
    }
    const valid = derived.has(conclusion);
    return {
        valid,
        appliedRules,
        provenance: [`[ALG_T2_L_007] premises=${premises.length} derived=${derived.size} valid=${valid}`],
    };
}
// ============================================================================
// ALG_T2_L_008 · 归纳推理强度
// ============================================================================
function inductiveStrength(instances, confidenceLevel = 0.95) {
    const n = instances.length;
    if (n === 0) {
        return { strength: 0, confidence: 0, sufficient: false, provenance: ['[ALG_T2_L_008] 无实例'] };
    }
    const positive = instances.filter(i => i.positive).length;
    const strength = positive / n;
    // 简化的置信度（基于样本大小）
    const confidence = 1 - 1 / Math.sqrt(n);
    const sufficient = confidence >= confidenceLevel && n >= 30;
    return {
        strength,
        confidence,
        sufficient,
        provenance: [`[ALG_T2_L_008] n=${n} pos=${positive} strength=${strength.toFixed(4)} conf=${confidence.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_L_009 · 溯因推理（最佳解释）
// ============================================================================
function abductiveBestExplanation(observations, hypotheses) {
    if (observations.length === 0 || hypotheses.length === 0) {
        return { best: null, score: 0, provenance: ['[ALG_T2_L_009] 空输入'] };
    }
    let bestHyp = null;
    let bestScore = -1;
    for (const h of hypotheses) {
        const explained = h.explains.filter(e => observations.includes(e)).length;
        const coverage = explained / observations.length;
        const score = coverage * 0.5 + h.priorProbability * 0.3 + h.simplicity * 0.2;
        if (score > bestScore) {
            bestScore = score;
            bestHyp = h.name;
        }
    }
    return {
        best: bestHyp,
        score: bestScore,
        provenance: [`[ALG_T2_L_009] obs=${observations.length} hyp=${hypotheses.length} best=${bestHyp}`],
    };
}
// ============================================================================
// ALG_T2_L_010 · 类比推理
// ============================================================================
function analogicalReasoning(source, target) {
    const sourceKeys = Object.keys(source.attributes);
    const targetKeys = Object.keys(target.attributes);
    const commonKeys = sourceKeys.filter(k => targetKeys.includes(k));
    if (commonKeys.length === 0) {
        return { similarity: 0, mappedAttributes: 0, provenance: ['[ALG_T2_L_010] 无共同属性'] };
    }
    let dot = 0, normS = 0, normT = 0;
    for (const k of commonKeys) {
        dot += source.attributes[k] * target.attributes[k];
        normS += source.attributes[k] ** 2;
        normT += target.attributes[k] ** 2;
    }
    const denom = Math.sqrt(normS) * Math.sqrt(normT);
    const similarity = denom === 0 ? 0 : dot / denom;
    const commonRelations = source.relations.filter(r => target.relations.some(tr => tr[0] === r[0] && tr[2] === r[2])).length;
    return {
        similarity: similarity * 0.7 + (commonRelations / Math.max(source.relations.length, 1)) * 0.3,
        mappedAttributes: commonKeys.length,
        provenance: [`[ALG_T2_L_010] attr=${commonKeys.length} rel=${commonRelations} sim=${similarity.toFixed(4)}`],
    };
}
// ============================================================================
// ALG_T2_L_011 · 逻辑一致性矩阵
// ============================================================================
function logicConsistencyMatrix(statements, truthFunction) {
    const n = statements.length;
    if (n === 0) {
        return { matrix: [], consistent: true, contradictionCount: 0, provenance: ['[ALG_T2_L_011] 空语句'] };
    }
    const matrix = Array.from({ length: n }, () => new Array(n).fill(true));
    let contradictionCount = 0;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const ti = truthFunction(statements[i]);
            const tj = truthFunction(statements[j]);
            // 反语句：i 否定 j
            const contradiction = ti === !tj;
            matrix[i][j] = !contradiction;
            matrix[j][i] = !contradiction;
            if (contradiction)
                contradictionCount++;
        }
    }
    return {
        matrix,
        consistent: contradictionCount === 0,
        contradictionCount,
        provenance: [`[ALG_T2_L_011] n=${n} contradictions=${contradictionCount}`],
    };
}
// ============================================================================
// ALG_T2_L_012 · 谓词逻辑统一化
// ============================================================================
function predicateUnification(p1, p2) {
    if (p1.predicate !== p2.predicate || p1.args.length !== p2.args.length) {
        return { unified: false, bindings: {}, provenance: ['[ALG_T2_L_012] 谓词不匹配'] };
    }
    const bindings = {};
    for (let i = 0; i < p1.args.length; i++) {
        const a1 = p1.args[i];
        const a2 = p2.args[i];
        const isVar1 = a1.startsWith('?');
        const isVar2 = a2.startsWith('?');
        if (isVar1 && !isVar2) {
            bindings[a1] = a2;
        }
        else if (!isVar1 && isVar2) {
            bindings[a2] = a1;
        }
        else if (isVar1 && isVar2) {
            if (a1 !== a2) {
                bindings[a1] = a2;
            }
        }
        else if (a1 !== a2) {
            return { unified: false, bindings: {}, provenance: [`[ALG_T2_L_012] 参数冲突 ${a1}≠${a2}`] };
        }
    }
    return {
        unified: true,
        bindings,
        provenance: [`[ALG_T2_L_012] unified=true bindings=${Object.keys(bindings).length}`],
    };
}
// ============================================================================
// ALG_T2_L_013 · 反例搜索
// ============================================================================
function counterExampleSearch(claim, variables, maxAttempts = 1000) {
    if (variables.length === 0) {
        return { found: false, counterExample: null, attempts: 0, provenance: ['[ALG_T2_L_013] 无变量'] };
    }
    const n = variables.length;
    const total = Math.min(2 ** n, maxAttempts);
    for (let mask = 0; mask < total; mask++) {
        const assignment = {};
        for (let i = 0; i < n; i++) {
            assignment[variables[i]] = (mask & (1 << i)) !== 0;
        }
        if (!claim(assignment)) {
            return {
                found: true,
                counterExample: assignment,
                attempts: mask + 1,
                provenance: [`[ALG_T2_L_013] found at attempt=${mask + 1}`],
            };
        }
    }
    return {
        found: false,
        counterExample: null,
        attempts: total,
        provenance: [`[ALG_T2_L_013] not found attempts=${total}`],
    };
}
// ============================================================================
// ALG_T2_L_014 · 逻辑完备性检查
// ============================================================================
function logicCompleteness(axioms, targetTheorems, inferenceRules) {
    const derived = new Set(axioms);
    let changed = true;
    while (changed) {
        changed = false;
        for (const rule of inferenceRules) {
            if (rule.premises.every(p => derived.has(p)) && !derived.has(rule.conclusion)) {
                derived.add(rule.conclusion);
                changed = true;
            }
        }
    }
    const unprovable = targetTheorems.filter(t => !derived.has(t));
    return {
        complete: unprovable.length === 0,
        unprovable,
        provenance: [`[ALG_T2_L_014] axioms=${axioms.length} targets=${targetTheorems.length} unprovable=${unprovable.length}`],
    };
}
// ============================================================================
// ALG_T2_L_015 · 逻辑可靠性检查
// ============================================================================
function logicSoundness(proof, axioms) {
    const derived = new Set(axioms);
    const unsoundSteps = [];
    for (const p of proof) {
        if (p.premises.every(prem => derived.has(prem))) {
            derived.add(p.step);
        }
        else {
            unsoundSteps.push(p.step);
        }
    }
    return {
        sound: unsoundSteps.length === 0,
        unsoundSteps,
        provenance: [`[ALG_T2_L_015] steps=${proof.length} unsound=${unsoundSteps.length}`],
    };
}
// ============================================================================
// ALG_T2_L_016 · 推理规则合成
// ============================================================================
function inferenceRuleSynthesize(examples) {
    if (examples.length === 0) {
        return { rule: null, confidence: 0, provenance: ['[ALG_T2_L_016] 无示例'] };
    }
    // 寻找共同模式
    const first = examples[0];
    let consistent = true;
    for (const ex of examples) {
        if (ex.premises.length !== first.premises.length || ex.conclusion !== first.conclusion) {
            consistent = false;
            break;
        }
    }
    return {
        rule: consistent ? first : null,
        confidence: consistent ? 1 : examples.length > 0 ? 0.5 : 0,
        provenance: [`[ALG_T2_L_016] examples=${examples.length} consistent=${consistent}`],
    };
}
// ============================================================================
// ALG_T2_L_017 · 真值表生成
// ============================================================================
function truthTableGenerate(variables, expression) {
    if (variables.length === 0) {
        return { headers: [], rows: [], provenance: ['[ALG_T2_L_017] 无变量'] };
    }
    const n = variables.length;
    if (n > 20) {
        return { headers: variables, rows: [], provenance: [`[ALG_T2_L_017] 变量过多 (${n})`] };
    }
    const rows = [];
    for (let mask = 0; mask < (1 << n); mask++) {
        const values = {};
        for (let i = 0; i < n; i++) {
            values[variables[i]] = (mask & (1 << i)) !== 0;
        }
        rows.push({ values, result: expression(values) });
    }
    return {
        headers: [...variables, 'result'],
        rows,
        provenance: [`[ALG_T2_L_017] vars=${n} rows=${rows.length}`],
    };
}
// ============================================================================
// ALG_T2_L_018 · 逻辑范式转换（CNF/DNF）
// ============================================================================
function logicNormalFormConvert(clauses, toForm) {
    if (clauses.length === 0) {
        return { normalForm: [], converted: false, provenance: ['[ALG_T2_L_018] 空子句'] };
    }
    // CNF: AND of ORs; DNF: OR of ANDs
    // 转换：CNF↔DNF 通过分配律（简化版）
    if (toForm === 'CNF') {
        // 假设输入是 DNF（OR of ANDs），转 CNF
        if (clauses.length === 1) {
            return { normalForm: clauses.map(c => [...c]), converted: true, provenance: [`[ALG_T2_L_018] DNF→CNF trivial`] };
        }
        // 笛卡尔积
        const result = [[]];
        for (const clause of clauses) {
            const newResult = [];
            for (const existing of result) {
                for (const lit of clause) {
                    newResult.push([...existing, lit]);
                }
            }
            result.length = 0;
            result.push(...newResult);
        }
        return {
            normalForm: result,
            converted: true,
            provenance: [`[ALG_T2_L_018] DNF→CNF clauses=${result.length}`],
        };
    }
    else {
        // DNF
        if (clauses.length === 1) {
            return { normalForm: clauses, converted: true, provenance: [`[ALG_T2_L_018] CNF→DNF trivial`] };
        }
        const result = [[]];
        for (const clause of clauses) {
            const newResult = [];
            for (const existing of result) {
                for (const lit of clause) {
                    newResult.push([...existing, lit]);
                }
            }
            result.length = 0;
            result.push(...newResult);
        }
        return {
            normalForm: result,
            converted: true,
            provenance: [`[ALG_T2_L_018] CNF→DNF clauses=${result.length}`],
        };
    }
}
// ============================================================================
// ALG_T2_L_019 · 论证强度评估
// ============================================================================
function argumentStrength(argument) {
    if (argument.premises.length === 0) {
        return { strength: 0, valid: false, provenance: ['[ALG_T2_L_019] 无前提'] };
    }
    const avgConfidence = argument.premises.reduce((s, p) => s + p.confidence, 0) / argument.premises.length;
    const minConfidence = Math.min(...argument.premises.map(p => p.confidence));
    let strength;
    switch (argument.inferenceType) {
        case 'deductive':
            strength = avgConfidence;
            break;
        case 'inductive':
            strength = avgConfidence * 0.8;
            break;
        case 'abductive':
            strength = avgConfidence * 0.6;
            break;
        default:
            strength = 0;
    }
    const valid = minConfidence > 0.5 && strength > 0.5;
    return {
        strength,
        valid,
        provenance: [`[ALG_T2_L_019] type=${argument.inferenceType} strength=${strength.toFixed(4)} valid=${valid}`],
    };
}
// ============================================================================
// ALG_T2_L_020 · 逻辑审计综合报告
// ============================================================================
function logicAuditComprehensive(proof, axioms, targetConclusions) {
    const issues = [];
    const depthCheck = proofTreeDepth(proof);
    const verifyCheck = proofTreeVerify(proof);
    const axiomCheck = axiomConsistencyCheck(axioms);
    if (!verifyCheck.verified) {
        issues.push(`unverified_nodes: ${verifyCheck.unverifiedNodes.length}`);
    }
    if (!axiomCheck.consistent) {
        issues.push(`axiom_conflicts: ${axiomCheck.conflicts.length}`);
    }
    if (depthCheck.depth > 20) {
        issues.push(`excessive_depth: ${depthCheck.depth}`);
    }
    // 检查目标结论是否在证明树中
    function findInTree(n, target) {
        if (n.statement === target)
            return true;
        return n.children.some(c => findInTree(c, target));
    }
    const provenCount = targetConclusions.filter(t => findInTree(proof, t)).length;
    if (provenCount < targetConclusions.length) {
        issues.push(`unproven_targets: ${targetConclusions.length - provenCount}`);
    }
    const score = Math.max(0, 1 - issues.length * 0.2);
    const grade = score >= 0.9 ? 'A' : score >= 0.8 ? 'B' : score >= 0.7 ? 'C' : score >= 0.6 ? 'D' : 'F';
    return {
        score,
        grade,
        issues,
        provenance: [`[ALG_T2_L_020] score=${score.toFixed(4)} grade=${grade} issues=${issues.length}`],
    };
}
