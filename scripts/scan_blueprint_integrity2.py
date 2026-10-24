# -*- coding: utf-8 -*-
"""scan_blueprint_integrity2.py — 蓝本完整性扫描（判据修正版）

修正 1：空章节
  旧判据「标题后下一行是标题 → 空」→ 误报 300 处（母标题后接子标题是正常结构）
  新判据：递归判定——标题下到「下一个同级或更高级标题」之间，
          若所有行都是空行或标题，且所有子标题也都为空，才算空章节。

修正 2：占位符
  旧判据「出现 TODO/占位符 字样」→ 误报 25 处（多数是在**描述**占位符检测功能）
  新判据：只认「形似占位符占位」的形态：
    - 行首 TODO:/TBD:/FIXME: 后无内容
    - [待填] [待补充] 此类方括号占位
    - 表格单元格内只有 TODO/...
    - {{}} 空模板变量
"""
import pathlib
import re
from collections import Counter

BP = pathlib.Path(r"D:\DSH-Official\home\metago\blueprint\元构初始文档")
files = sorted(BP.glob("*.md"))

def is_heading(l):
    m = re.match(r"^(#{1,6})\s+(.*)", l)
    return (len(m.group(1)), m.group(2).strip()) if m else None

def section_empty(lines, idx):
    """判断 lines[idx]（标题行）下是否真的没有内容（递归）"""
    lvl = is_heading(lines[idx])[0]
    j = idx + 1
    has_content = False
    has_child_with_content = False
    while j < len(lines):
        h = is_heading(lines[j])
        if h:
            if h[0] <= lvl:
                break
            # 子标题，递归判断
            if not section_empty(lines, j):
                has_child_with_content = True
            # 跳过该子标题的整段
            sub_lvl = h[0]
            j += 1
            while j < len(lines):
                h2 = is_heading(lines[j])
                if h2 and h2[0] <= sub_lvl:
                    break
                j += 1
            continue
        if lines[j].strip() and lines[j].strip() != "---":
            has_content = True
        j += 1
    return not (has_content or has_child_with_content)

# 只认真占位形态
PH_STRICT = [
    re.compile(r"^\s*(TODO|TBD|FIXME)\s*[:：]\s*$", re.I),
    re.compile(r"^\s*(TODO|TBD|FIXME)\s*$", re.I),
    re.compile(r"\[(待填|待补充|未填写|placeholder)\]", re.I),
    re.compile(r"\{\{\s*\}\}"),
    re.compile(r"^\s*\|\s*(TODO|TBD|FIXME|待补充)\s*\|", re.I),
]

total = Counter()
detail = []
print("=" * 86)
print("蓝本完整性扫描（判据修正版）")
print("=" * 86)
print("卷数:", len(files))
print()

for p in files:
    t = p.read_text(encoding="utf-8", errors="replace")
    lines = t.split("\n")
    issues = Counter()

    # 空章节（递归判据）
    for i, l in enumerate(lines):
        h = is_heading(l)
        if not h or h[0] < 2:
            continue
        if section_empty(lines, i):
            issues["空章节"] += 1
            if issues["空章节"] <= 3:
                detail.append((p.name, "空章节", i + 1, h[1][:60]))

    # 严格占位符
    for i, l in enumerate(lines, 1):
        for rx in PH_STRICT:
            if rx.search(l):
                issues["占位符"] += 1
                if issues["占位符"] <= 3:
                    detail.append((p.name, "占位符", i, l.strip()[:80]))
                break

    # 断裂表格
    for i in range(len(lines) - 1):
        if lines[i].strip().startswith("|") and re.match(r"^\s*\|[\s:|-]+\|\s*$", lines[i + 1]):
            if lines[i].count("|") != lines[i + 1].count("|"):
                issues["断裂表格"] += 1
                if issues["断裂表格"] <= 2:
                    detail.append((p.name, "断裂表格", i + 1, "表头与分隔行竖线数不符"))

    # 空代码块
    for i in range(len(lines) - 1):
        if lines[i].strip().startswith("```") and lines[i + 1].strip() == "```":
            issues["空代码块"] += 1
            if issues["空代码块"] <= 2:
                detail.append((p.name, "空代码块", i + 1, lines[i].strip()[:40]))

    for k, v in issues.items():
        total[k] += v
    print("● %-46s %s" % (p.name[:46], dict(issues) if issues else "无问题"))

print()
print("-" * 86)
print("汇总：", dict(total) if total else "无问题")
print()
if detail:
    print("【明细】")
    for name, kind, ln, txt in detail[:30]:
        print("  %-44s %-8s L%-6d %s" % (name[:44], kind, ln, txt))
    print()
bad = sum(total.values())
print("-" * 86)
print("总判定：", "PASS（16 卷内容完整）" if bad == 0 else f"需关注（{bad} 处）")
