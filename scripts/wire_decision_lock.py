# -*- coding: utf-8 -*-
"""wire_decision_lock.py — 把 metago_decision_lock 从「返回指南」升级为「真执行四道关卡」

背景：metago MCP 55 个工具里只有 3 个走 Engine V2 硬驱动，
      metago_decision_lock 只返回指南文本。
      但 @metago-ai/engine 已导出 DecisionLock 类，其 validate() 真能跑 IVL/ILT/OSG/完整性四道关卡。
修法：在 index.js 的工具分发里为 metago_decision_lock 增加硬驱动分支。
"""
import pathlib
import re
import shutil
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\mcp-server\dist\index.js")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-mcpindex-" + time.strftime("%Y%m%d-%H%M%S"))
s = P.read_text(encoding="utf-8")

if "handleDecisionLock" in s:
    print("已接入，跳过")
    raise SystemExit(0)

# 1) 在分发处加分支
OLD_DISPATCH = '''            else if (skill.toolName === "metago_meta_create") {
                engineResult = await handleMetaCreate(args.input);
            }'''
NEW_DISPATCH = '''            else if (skill.toolName === "metago_meta_create") {
                engineResult = await handleMetaCreate(args.input);
            }
            else if (skill.toolName === "metago_decision_lock") {
                engineResult = await handleDecisionLock(args.input);
            }'''
if OLD_DISPATCH in s:
    s = s.replace(OLD_DISPATCH, NEW_DISPATCH, 1)
    print("已在分发处加 metago_decision_lock 分支")
else:
    print("未匹配分发锚点")
    raise SystemExit(1)

# 2) 加 handler 函数（放在 handleMemoryManage 之前）
ANCHOR = "async function handleMemoryManage(input) {"
HANDLER = '''/**
 * metago_decision_lock 的 Engine V2 硬驱动
 * 调用 DecisionLock 真实代码执行 IVL / ILT / OSG / 完整性 四道关卡
 */
async function handleDecisionLock(input) {
    try {
        const text = typeof input === 'string' ? input : String(input);
        const result = await DecisionLock.validate(text, { goal: '输出前决策锁校验' }, text);
        const lines = [];
        lines.push('【决策锁四道关卡 · Engine V2 真实执行】');
        lines.push('');
        for (const g of result.gates || []) {
            const mark = g.status === 'pass' ? '✅' : g.status === 'warning' ? '⚠️' : '❌';
            lines.push(`${mark} ${g.gateId} ${g.gateName}：${g.status.toUpperCase()}`);
            lines.push(`    ${g.message}`);
            for (const d of (g.details || []).slice(0, 3)) lines.push(`    · ${d}`);
        }
        lines.push('');
        lines.push(`■ 总判定：${result.passed ? 'PASS（四道关卡全部通过）' : 'FAIL（未通过：' + (result.failedGates || []).join(', ') + '）'}`);
        if (result.failedGates && result.failedGates.length) {
            lines.push('■ 修复建议：');
            for (const f of result.failedGates) {
                if (f === 'IVL') lines.push('  - 意图验证失败：输出未覆盖用户请求的关键点，需对齐意图');
                if (f === 'ILT') lines.push('  - 谱系追踪：输出缺少推理链（因为/所以/依据），需补上推导过程');
                if (f === 'OSG') lines.push('  - 语义输出门：输出过短或含模糊表述，需扩写并明确');
                if (f === 'INTEGRITY') lines.push('  - 内容完整性：存在占位符或未完成项，需补全');
            }
        }
        return lines.join('\\n');
    } catch (err) {
        return `【决策锁】执行异常：${err instanceof Error ? err.message : String(err)}`;
    }
}

async function handleMemoryManage(input) {'''
if ANCHOR in s:
    s = s.replace(ANCHOR, HANDLER, 1)
    print("已插入 handleDecisionLock")
else:
    print("未匹配 handler 锚点")
    raise SystemExit(1)

# 3) 确保 import 了 DecisionLock
if "DecisionLock" not in s.split("\n")[16]:
    s = s.replace(
        'import { KMWIMemory, EvolutionEngine, SkillGenerator } from "@metago-ai/engine";',
        'import { KMWIMemory, EvolutionEngine, SkillGenerator, DecisionLock } from "@metago-ai/engine";', 1)
    print("已在 import 中加入 DecisionLock")

BACKUP.mkdir(parents=True, exist_ok=True)
shutil.copy2(P, BACKUP / P.name)
P.write_text(s, encoding="utf-8")
print("已备份并写回:", BACKUP / P.name)
