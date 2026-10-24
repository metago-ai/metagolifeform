# -*- coding: utf-8 -*-
"""wire_more_axiom_tools.py — 再接 4 个工具到 AxiomValidator 的真实现

metago_compliance      → checkCompliance（法律/伦理四层）
metago_objectivity     → checkObjectivity（客观中立）
metago_data_provenance → checkDataTraceability（溯源与自证）
metago_critique        → checkCriticality（批判性）
"""
import pathlib
import shutil
import subprocess
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\mcp-server\dist\index.js")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-mcpindex4-" + time.strftime("%Y%m%d-%H%M%S"))
s = P.read_text(encoding="utf-8")

if "handleCompliance" in s:
    print("已接入，跳过")
    raise SystemExit(0)

# 1) 分发分支
OLD = '''            else if (skill.toolName === "metago_self_check") {
                engineResult = handleSelfCheck(args.input);
            }'''
NEW = '''            else if (skill.toolName === "metago_self_check") {
                engineResult = handleSelfCheck(args.input);
            }
            else if (skill.toolName === "metago_compliance") {
                engineResult = handleAxiomCheck(args.input, "checkCompliance", "合规前置检查");
            }
            else if (skill.toolName === "metago_objectivity") {
                engineResult = handleAxiomCheck(args.input, "checkObjectivity", "客观中立度评估");
            }
            else if (skill.toolName === "metago_data_provenance") {
                engineResult = handleAxiomCheck(args.input, "checkDataTraceability", "数据溯源与自证");
            }
            else if (skill.toolName === "metago_critique") {
                engineResult = handleAxiomCheck(args.input, "checkCriticality", "批判性检测");
            }'''
if OLD in s:
    s = s.replace(OLD, NEW, 1)
    print("已加 4 个分发分支")
else:
    print("未匹配分发锚点")
    raise SystemExit(1)

# 2) 通用 handler
ANCHOR = "function handleOutputIntegrity(input) {"
HANDLER = '''/**
 * 通用公理校验 handler：把 metago 工具路由到 AxiomValidator 的对应静态方法
 * 走真实现，不是返回指南。
 */
function handleAxiomCheck(input, method, label) {
    try {
        const text = typeof input === 'string' ? input : String(input);
        if (typeof AxiomValidator[method] !== 'function') {
            return `【${label}】引擎未提供 ${method}，无法执行`;
        }
        const r = AxiomValidator[method](text, text);
        const mark = r.status === 'pass' ? '✅' : r.status === 'warning' ? '⚠️' : '❌';
        const lines = [];
        lines.push(`【${label} · Engine 真实执行】`);
        lines.push('');
        lines.push(`■ 公理：${r.axiomId || '-'} ${r.axiomName || ''}`);
        lines.push(`■ 结论：${mark} ${String(r.status || '').toUpperCase()}`);
        lines.push(`■ 说明：${r.message || '-'}`);
        if (r.severity) lines.push(`■ 严重度：${r.severity}`);
        if (Array.isArray(r.details) && r.details.length) {
            lines.push('■ 详情：');
            for (const d of r.details.slice(0, 8)) lines.push('  · ' + d);
        }
        if (r.status === 'fail') {
            const HINTS = {
                checkCompliance: '补充适用法规依据、伦理影响评估、数据处理合规性、操作安全性四层说明',
                checkObjectivity: '去除讨好性表述与主观断言，补足证据与来源',
                checkDataTraceability: '补上数据来源、采集方式、可复核路径',
                checkCriticality: '加入反面论证、局限说明与风险提示',
            };
            if (HINTS[method]) { lines.push(''); lines.push('■ 改进建议：' + HINTS[method]); }
        }
        return lines.join('\\n');
    } catch (err) {
        return `【${label}】执行异常：${err instanceof Error ? err.message : String(err)}`;
    }
}

function handleOutputIntegrity(input) {'''
if ANCHOR in s:
    s = s.replace(ANCHOR, HANDLER, 1)
    print("已插入通用 handler")
else:
    print("未匹配 handler 锚点")
    raise SystemExit(1)

BACKUP.mkdir(parents=True, exist_ok=True)
shutil.copy2(P, BACKUP / P.name)
P.write_text(s, encoding="utf-8")
print("已备份并写回:", BACKUP / P.name)

r = subprocess.run(["node", "--check", str(P)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:250])
