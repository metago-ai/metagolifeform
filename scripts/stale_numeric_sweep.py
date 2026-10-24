# -*- coding: utf-8 -*-
"""stale_numeric_sweep.py — 全系统残旧数字清扫

起因（DEF-048）：metago-core 里 984 原子 / 125 引擎 / 95 技能 / 43 属性 / 36 公理 / V36.9.1 全部过期。
一个技能就错了 8 个数 —— 别处可能还有。

本脚本对一批「旧值」在全系统扫，逐处判定：
  · 历史叙述（如「由 984 降为 597」）→ 保留
  · 当前声明（如「共 984 原子」）→ 必须改

旧值 → 新值对照：
  984 原子 → 597      125 引擎 → 161
  95 技能 → 112       43 属性 → 47
  36 公理 → 38        108 协议 → 121
  V36.9.1/2/3/4/6 → V36.11.0
"""
import pathlib
import re

H = pathlib.Path(r"D:\DSH-Official\home")

ROOTS = [H / "AGENTS.md"]
# 蓝本原文层（元构全息文档体系-第二卷/第七卷等）属历史记录，不参与本扫描
for d in [H / "skills", H / "docs"]:
    if d.exists():
        ROOTS += [p for p in d.rglob("*.md") if "backup" not in str(p) and ".metago-" not in str(p)]

PAIRS = [
    (r"984\s*原子", "984 原子", "597 原子"),
    (r"984\b", "984", "597"),
    (r"125\s*引擎", "125 引擎", "161 引擎"),
    (r"95\s*个?技能", "95 技能", "112 技能"),
    (r"43\s*条?根本属性", "43 属性", "47 属性"),
    (r"36\s*条?核心公理", "36 公理", "38 公理"),
    (r"108\s*条?协议", "108 协议", "121 协议"),
    (r"V36\.9\.[1-9]", "V36.9.x", "V36.11.0"),
]

# 历史叙述的特征词（出现这些说明是在讲演进，保留）
HISTORY_HINTS = [
    "由", "→", "降为", "升为", "改为", "历史", "此前", "旧版", "原", "曾", "已从",
    # CORR-029 补充：记录「改之前是什么」的常见写法
    "旧值", "升级前", "全清", "之前", "原为", "原来是", "已改为", "修正前", "补前", "修补前",
    "DEF-", "CORR-", "自 V", "从 V",
]

print("=" * 94)
print("全系统残旧数字清扫")
print("=" * 94)

hits = []
for p in ROOTS:
    if not p.is_file():
        continue
    try:
        t = p.read_text(encoding="utf-8", errors="replace")
    except Exception:
        continue
    for pat, olddesc, newdesc in PAIRS:
        for m in re.finditer(pat, t):
            ln = t[:m.start()].count("\n") + 1
            line = t.split("\n")[ln - 1].strip()
            is_history = any(h in line for h in HISTORY_HINTS)
            try:
                rel = p.relative_to(H).as_posix()
            except ValueError:
                rel = str(p)
            hits.append((rel, ln, olddesc, newdesc, line[:88], is_history))

declared = [h for h in hits if not h[5]]
history = [h for h in hits if h[5]]

print(f"\n总命中 {len(hits)} 处 ｜ 疑似当前声明 {len(declared)} ｜ 历史叙述（保留）{len(history)}")

if declared:
    print()
    print("■ 需要修正的（当前声明用了旧值）：")
    for rel, ln, old, new, line, _ in declared[:40]:
        print(f"  [{rel}] L{ln}  {old} → {new}")
        print(f"      {line}")
else:
    print()
    print("  ✓ 未发现「当前声明」使用旧值")

if history:
    print()
    print("■ 历史叙述（保留，前 8 条抽样）：")
    for rel, ln, old, new, line, _ in history[:8]:
        print(f"  [{rel}] L{ln}  {line[:76]}")

print()
print("-" * 94)
print("总判定：" + ("PASS（无当前声明使用旧值）" if not declared else f"需关注（{len(declared)} 处需改）"))
