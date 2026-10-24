# -*- coding: utf-8 -*-
"""fix_index_dup.py — 去重 + 技能数改成 112"""
import pathlib
import re

IDX = pathlib.Path(r"D:\DSH-Official\home\metago\blueprint\元构初始文档\总索引-V36.11.md")
t = IDX.read_text(encoding="utf-8")

# 1. 去重「其中已实现」行
lines = t.split("\n")
out = []
seen_impl = 0
seen_ext = 0
for l in lines:
    if "其中已实现" in l and "590" in l:
        seen_impl += 1
        if seen_impl > 1:
            continue
    if "仍为外部依赖" in l:
        seen_ext += 1
        if seen_ext > 1:
            continue
    out.append(l)
t = "\n".join(out)
print("去重后：其中已实现 %d 次 → 1 ｜ 仍为外部 %d 次 → 1" % (seen_impl, seen_ext))

# 2. 技能数 116 → 112（注明这是 skills 目录下的 SKILL.md 数）
t = t.replace("| 技能 | **116** | `$DSH_HOME/skills/` 实文件数 |",
              "| 技能 | **112** | `$DSH_HOME/skills/` 下 SKILL.md 数量（另有 5 个附属文件不计数） |")

IDX.write_text(t, encoding="utf-8")

# 复核
t2 = IDX.read_text(encoding="utf-8")
print()
print("复核：")
print("  「其中已实现」唯一:", t2.count("其中已实现") == 1)
print("  「仍为外部依赖」唯一:", t2.count("仍为外部依赖") == 1)
print("  技能数 112:", "| 技能 | **112**" in t2)
print("  无 116 旧值:", "| 技能 | **116**" not in t2)

# 3. 顺便扫全文档还有哪些 116
m = re.findall(r"116", t2)
print("  总索引剩余 '116' 出现 %d 次" % len(m))
for i, l in enumerate(t2.split("\n"), 1):
    if "116" in l:
        print("    L%d: %s" % (i, l.strip()[:90]))
