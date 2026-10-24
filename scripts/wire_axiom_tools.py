# -*- coding: utf-8 -*-
"""wire_axiom_tools.py — 把 AxiomValidator 接到两个工具上

metago_output_integrity → AxiomValidator.checkOutputIntegrity
metago_self_check       → AxiomValidator.validateAll（14 项公理校验）
两者此前都是软驱动（只返回指南）。
"""
import pathlib
import shutil
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\mcp-server\dist\index.js")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-mcpindex2-" + time.strftime("%Y%m%d-%H%M%S"))
s = P.read_text(encoding="utf-8")

if "handleOutputIntegrity" in s:
    print("已接入，跳过")
    raise SystemExit(0)

# 1) 分发分支
OLD = '''            else if (skill.toolName === "metago_decision_lock") {
                engineResult = await handleDecisionLock(args.input);
            }'''
NEW = '''            else if (skill.toolName === "metago_decision_lock") {
                engineResult = await handleDecisionLock(args.input);
            }
            else if (skill.toolName === "metago_output_integrity") {
                engineResult = handleOutputIntegrity(args.input);
            }
            else if (skill.toolName === "metago_self_check") {
                engineResult = handleSelfCheck(args.input);
            }'''
if OLD in s:
    s = s.replace(OLD, NEW, 1)
    print("已加 output_integrity / self_check 分支")
else:
    print("未匹配分发锚点")
    raise SystemExit(1)

# 2) handler
ANCHOR = "async function handleDecisionLock(input) {"
HANDLERS = '''/**
 * metago_output_integrity 的 Engine 硬驱动
 * 调用 AxiomValidator.checkOutputIntegrity 检测占位符、幻觉、未完成项
 */
function handleOutputIntegrity(input) {
    try {
        const text = typeof input === 'string' ? input : String(input);
        const r = AxiomValidator.checkOutputIntegrity(text);
        const lines = [];
        lines.push('【输出完整性检查 · Engine 真实执行】');
        lines.push('');
        lines.push(`■ 结论：${r.passed ? '✅ 通过' : '❌ 未通过'}`);
        if (r.message) lines.push(`■ 说明：${r.message}`);
        if (Array.isArray(r.details) && r.details.length) {
            lines.push('■ 详情：');
            for (const d of r.details.slice(0, 10)) lines.push('  · ' + d);
        }
        if (Array.isArray(r.violations) && r.violations.length) {
            lines.push('■ 违规项：');
            for (const v of r.violations.slice(0, 10)) lines.push('  · ' + JSON.stringify(v).slice(0, 100));
        }
        return lines.join('\\n');
    } catch (err) {
        return `【输出完整性】执行异常：${err instanceof Error ? err.message : String(err)}`;
    }
}

/**
 * metago_self_check 的 Engine 硬驱动
 * 调用 AxiomValidator.validateAll 执行 14 项公理校验
 */
function handleSelfCheck(input) {
    try {
        const text = typeof input === 'string' ? input : String(input);
        const results = AxiomValidator.validateAll(text, { input: text });
        const summary = AxiomValidator.getSummary(results);
        const lines = [];
        lines.push('【公理自检 · Engine 真实执行 14 项】');
        lines.push('');
        lines.push(`■ 总计 ${summary.total} 项 ｜ 通过 ${summary.pass} ｜ 警告 ${summary.warning} ｜ 失败 ${summary.fail} ｜ 严重失败 ${summary.criticalFail}`);
        lines.push('');
        for (const r of results) {
            const mark = r.passed === true ? '✅' : r.status === 'warning' ? '⚠️' : '❌';
            lines.push(`${mark} ${r.axiom || r.id || '-'}  ${r.name || ''}：${r.passed === true ? 'PASS' : (r.status || 'FAIL')}`);
            if (r.message && r.passed !== true) lines.push(`    ${r.message}`);
        }
        const failed = results.filter(r => r.passed !== true && r.status !== 'warning');
        if (failed.length) {
            lines.push('');
            lines.push('■ 需修正项：');
            for (const f of failed.slice(0, 8)) lines.push(`  - ${f.axiom || f.id}：${f.message || '未通过'}`);
        }
        return lines.join('\\n');
    } catch (err) {
        return `【公理自检】执行异常：${err instanceof Error ? err.message : String(err)}`;
    }
}

async function handleDecisionLock(input) {'''
if ANCHOR in s:
    s = s.replace(ANCHOR, HANDLERS, 1)
    print("已插入两个 handler")
else:
    print("未匹配 handler 锚点")
    raise SystemExit(1)

# 3) import AxiomValidator
if "AxiomValidator" not in s.split("\n")[16]:
    s = s.replace(
        'import { KMWIMemory, EvolutionEngine, SkillGenerator, DecisionLock } from "@metago-ai/engine";',
        'import { KMWIMemory, EvolutionEngine, SkillGenerator, DecisionLock, AxiomValidator } from "@metago-ai/engine";', 1)
    print("已在 import 中加入 AxiomValidator")

BACKUP.mkdir(parents=True, exist_ok=True)
shutil.copy2(P, BACKUP / P.name)
P.write_text(s, encoding="utf-8")
print("已备份并写回:", BACKUP / P.name)
