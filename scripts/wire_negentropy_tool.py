# -*- coding: utf-8 -*-
"""wire_negentropy_tool.py — 把 metago_negentropy_monitor 接到熵算子

负熵（negentropy）= 有序度 = 1 − 归一化熵。
引擎 specialized.cjs 的 entropy 算子已返回 normalized（0-1），
  负熵 = 1 − normalized：越接近 1 越有序，越接近 0 越混乱。
这是真实可计算的量，不是占位。
"""
import pathlib
import shutil
import subprocess
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\mcp-server\dist\index.js")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-negen-" + time.strftime("%Y%m%d-%H%M%S"))
s = P.read_text(encoding="utf-8")

if "handleNegentropy" in s:
    print("已接入，跳过")
    raise SystemExit(0)

# 1) 加载器 + handler（插在 emotionMod 之前）
ANCHOR = "/* 情绪分类器懒加载（引擎 atoms 模块，不在包顶层导出） */"
INSERT = '''/* 特化算子懒加载（熵/负熵计算） */
let _SPEC = null;
function specMod() {
    if (_SPEC === null) {
        const cands = [
            "@metago-ai/engine/atoms/specialized.cjs",
            path.join(process.env.APPDATA || "", "npm/node_modules/@metago-ai/engine/atoms/specialized.cjs"),
            "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine/atoms/specialized.cjs",
        ];
        for (const c of cands) {
            try { _SPEC = __cjsRequire(c); break; } catch (e) { }
        }
        if (_SPEC === null) _SPEC = false;
    }
    return _SPEC || null;
}

/** 从任意输入里抽数值序列 */
function pickNumbers(input) {
    const ok = v => typeof v === "number" && isFinite(v);
    if (Array.isArray(input)) return input.filter(ok);
    if (typeof input === "number" && isFinite(input)) return [input];
    if (input && typeof input === "object") {
        for (const k of ["values", "data", "series", "samples", "scores", "list"]) {
            if (Array.isArray(input[k])) {
                const n = input[k].filter(ok);
                if (n.length) return n;
            }
        }
        const nums = Object.values(input).filter(ok);
        if (nums.length) return nums;
    }
    if (typeof input === "string") {
        const n = (input.match(/-?\\d+(?:\\.\\d+)?/g) || []).map(Number).filter(ok);
        if (n.length) return n;
    }
    return [];
}

/**
 * metago_negentropy_monitor 的 Engine 硬驱动
 * 负熵 = 1 − 归一化熵（熵由 specialized.cjs 的真实 Shannon 熵算法给出）
 */
function handleNegentropy(input) {
    try {
        const mod = specMod();
        if (!mod || !mod.OPS || typeof mod.OPS.entropy !== "function") {
            return "【负熵监控】引擎未提供 entropy 算子，无法执行";
        }
        const v = pickNumbers(input);
        if (v.length < 2) {
            return "【负熵监控】需要至少 2 个数值（可传数组、对象或含数字的文本）；" +
                "未取到数值时无法计算熵与负熵。";
        }
        const e = mod.OPS.entropy(v);
        const H = e.entropy;            // 原始 Shannon 熵（bit）
        const Hnorm = e.normalized;     // 归一化到 [0,1]
        const negentropy = 1 - Hnorm;   // 负熵/有序度
        const g = mod.OPS.gini ? mod.OPS.gini(v) : null;

        let verdict;
        if (negentropy >= 0.8) verdict = "高度有序（分布集中，系统稳定）";
        else if (negentropy >= 0.5) verdict = "较有序";
        else if (negentropy >= 0.2) verdict = "偏混乱";
        else verdict = "接近最大熵（完全均匀，无序度高）";

        const lines = [];
        lines.push("【负熵监控 · Engine 真实执行】");
        lines.push("");
        lines.push(`■ 样本数：${v.length}`);
        lines.push(`■ Shannon 熵 H = ${H} bit（最大值 ${e.maxEntropy}）`);
        lines.push(`■ 归一化熵 H/Hmax = ${Hnorm}`);
        lines.push(`■ 负熵（有序度）= 1 − H/Hmax = ${negentropy}`);
        lines.push(`■ 判定：${verdict}`);
        if (g && typeof g.gini === "number") {
            lines.push(`■ 分布不均度（基尼）= ${g.gini}`);
        }
        lines.push("");
        lines.push("■ 口径说明：负熵衡量「分布有多集中」。均匀分布熵最大、负熵为 0；");
        lines.push("  极端集中（一个值占绝对多数）熵接近 0、负熵接近 1。");
        lines.push("  它反映的是分布结构，不是「好坏」——请结合业务语义解读。");
        return lines.join("\\n");
    } catch (err) {
        return `【负熵监控】执行异常：${err instanceof Error ? err.message : String(err)}`;
    }
}

'''
if ANCHOR in s:
    s = s.replace(ANCHOR, INSERT + ANCHOR, 1)
    print("已插入 specMod + handleNegentropy")
else:
    print("未找到 emotion 加载器锚点")
    raise SystemExit(1)

# 2) TOOLKIT 分发（negentropy 可能走任一注册体）
OLD2 = '''                else if (tkName === "metago_emotion") {
                    tkResult = handleEmotion(args.text || args.input || tkInput);
                }'''
NEW2 = OLD2 + '''
                else if (tkName === "metago_negentropy_monitor") {
                    tkResult = handleNegentropy(args.input !== undefined ? args.input : args);
                }'''
if OLD2 in s:
    s = s.replace(OLD2, NEW2, 1)
    print("已加 TOOLKIT 分发")

# 3) SKILLS 分发
OLD3 = '''            else if (skill.toolName === "metago_emotion") {
                engineResult = handleEmotion(args.text || args.input);
            }'''
NEW3 = OLD3 + '''
            else if (skill.toolName === "metago_negentropy_monitor") {
                engineResult = handleNegentropy(args.input !== undefined ? args.input : args);
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
