# -*- coding: utf-8 -*-
"""wire_emotion_tool2.py — 用正确锚点接入 metago_emotion（CORR-012）

上一版错在：把 atom-factory.cjs 里的 `_CB` 锚点套用到 index.js。
index.js 里没有该变量，脚本正确地拒绝修改（未造成损坏）。
本版改用 `function handleAxiomCheck` 作为锚点插入加载器 + handler + 分发。
"""
import pathlib
import shutil
import subprocess
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\mcp-server\dist\index.js")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-emotion2-" + time.strftime("%Y%m%d-%H%M%S"))
s = P.read_text(encoding="utf-8")

if "handleEmotion" in s:
    print("已接入，跳过")
    raise SystemExit(0)

ANCHOR = "function handleAxiomCheck(input, method, label) {"
if ANCHOR not in s:
    print("未找到 handleAxiomCheck 锚点")
    raise SystemExit(1)

INSERT = '''/* 情绪分类器懒加载（引擎 atoms 模块，不在包顶层导出） */
let _EMO = null;
function emotionMod() {
    if (_EMO === null) {
        const cands = [
            "@metago-ai/engine/atoms/atoms-crypto-emotion.cjs",
            path.join(process.env.APPDATA || "", "npm/node_modules/@metago-ai/engine/atoms/atoms-crypto-emotion.cjs"),
            "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine/atoms/atoms-crypto-emotion.cjs",
        ];
        for (const c of cands) {
            try { _EMO = require(c); break; } catch (e) { }
        }
        if (_EMO === null) _EMO = false;
    }
    return _EMO || null;
}

/**
 * metago_emotion 的 Engine 硬驱动：真实情绪分类
 * （词汇库 + 否定词翻转 + 程度词加权 + 标点强度）
 */
function handleEmotion(input) {
    try {
        const mod = emotionMod();
        if (!mod || typeof mod.detectEmotion !== "function") {
            return "【情绪检测】引擎未提供 detectEmotion，无法执行";
        }
        const text = typeof input === "string" ? input : String(input);
        const r = mod.detectEmotion(text);
        const lines = [];
        lines.push("【情绪检测 · Engine 真实执行】");
        lines.push("");
        lines.push(`■ 主情绪：${r.emotion_state || r["情绪"] || "-"}`);
        lines.push(`■ 置信度：${typeof r.confidence === "number" ? (r.confidence * 100).toFixed(1) + "%" : "-"}`);
        lines.push(`■ 强度：${r.intensity !== undefined ? r.intensity : "-"}`);
        if (Array.isArray(r.scores) && r.scores.length) {
            lines.push("■ 各情绪得分（降序）：");
            for (const sc of r.scores.slice(0, 6)) {
                if (sc.score > 0) lines.push(`  · ${sc.emotion}: ${sc.score}`);
            }
        }
        if ((r.confidence || 0) < 0.15) {
            lines.push("");
            lines.push("■ 说明：未检出明显情绪词，判定为中性。这是客观结果，不是失败。");
        }
        return lines.join("\\n");
    } catch (err) {
        return `【情绪检测】执行异常：${err instanceof Error ? err.message : String(err)}`;
    }
}

'''
s = s.replace(ANCHOR, INSERT + ANCHOR, 1)
print("已插入 emotionMod + handleEmotion")

# TOOLKIT 分发
OLD2 = '''                else if (tkName === "metago_objectivity") {
                    tkResult = handleAxiomCheck(tkInput, "checkObjectivity", "客观中立度评估");
                }'''
NEW2 = OLD2 + '''
                else if (tkName === "metago_emotion") {
                    tkResult = handleEmotion(args.text || args.input || tkInput);
                }'''
if OLD2 in s:
    s = s.replace(OLD2, NEW2, 1)
    print("已加 TOOLKIT 分发")
else:
    print("未匹配 TOOLKIT objectivity 分支")

# SKILLS 分发
OLD3 = '''            else if (skill.toolName === "metago_critique") {
                engineResult = handleAxiomCheck(args.input, "checkCriticality", "批判性检测");
            }'''
NEW3 = OLD3 + '''
            else if (skill.toolName === "metago_emotion") {
                engineResult = handleEmotion(args.text || args.input);
            }'''
if OLD3 in s:
    s = s.replace(OLD3, NEW3, 1)
    print("已加 SKILLS 分发")

BACKUP.mkdir(parents=True, exist_ok=True)
shutil.copy2(P, BACKUP / P.name)
P.write_text(s, encoding="utf-8")
print("已备份并写回:", BACKUP / P.name)

r = subprocess.run(["node", "--check", str(P)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:250])
