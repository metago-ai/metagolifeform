# -*- coding: utf-8 -*-
"""audit_skill_registration.py — 磁盘技能数 vs DSH 实际注册数

「装在磁盘上」不等于「被系统加载」。
本脚本列出磁盘上所有技能，并从中提取 frontmatter 的 name 字段，
供与 DSH 会话技能目录（系统注入的 available_skills）逐一比对。
"""
import pathlib
import re

SK = pathlib.Path(r"D:\DSH-Official\home\skills")
FM = re.compile(r"^---\s*\n(.*?)\n---", re.S)

disk = {}
for p in sorted(SK.rglob("SKILL.md")):
    t = p.read_text(encoding="utf-8", errors="replace")
    m = FM.match(t)
    name = p.parent.name
    if m:
        for line in m.group(1).split("\n"):
            if line.strip().startswith("name:"):
                v = line.split(":", 1)[1].strip().strip('"').strip("'")
                if v:
                    name = v
                break
    disk[name] = p.parent.as_posix()

print("=" * 80)
print("磁盘技能清单")
print("=" * 80)
print("总数:", len(disk))
print()

groups = {"metago-": [], "metago-thought-": [], "metago-expert-": [], "其他": []}
for n in sorted(disk):
    if n.startswith("metago-thought-"):
        groups["metago-thought-"].append(n)
    elif n.startswith("metago-expert-"):
        groups["metago-expert-"].append(n)
    elif n.startswith("metago-"):
        groups["metago-"].append(n)
    else:
        groups["其他"].append(n)

for g, arr in groups.items():
    if arr:
        print(f"【{g}】{len(arr)} 个")

print()
print("全部名称（供与会话技能目录比对）：")
for i, n in enumerate(sorted(disk), 1):
    print("  %3d. %s" % (i, n))
