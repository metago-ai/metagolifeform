# -*- coding: utf-8 -*-
"""fix_skill_table_note.py — 给 §18.10 技能清单表加实测口径注

§18.10 的表格由安装脚本生成，标称「100 个技能」；
实测磁盘 SKILL.md 112 个。不手改生成内容，而是在表后加一条口径注。
"""
import pathlib
import re

A = pathlib.Path(r"D:\DSH-Official\home\AGENTS.md")
s = A.read_text(encoding="utf-8")

KEY = "SKILLS-TABLE-ACTUAL"
if KEY in s:
    print("已存在口径注")
    raise SystemExit(0)

SK = pathlib.Path(r"D:\DSH-Official\home\skills")
disk = sorted(p.parent.name for p in SK.rglob("SKILL.md"))
n = len(disk)

ANCHOR = "> 本表格由安装脚本自动生成，请勿手动修改。\n\n### 18.11 与其他章节的协同"
NEW = ("> 本表格由安装脚本自动生成，请勿手动修改。\n"
       f"\n<!-- {KEY} -->\n"
       f"> **实测口径（2026-10-18）**：`$DSH_HOME/skills` 下实有 **{n} 个 SKILL.md**。\n"
       "> 上表为安装时脚本生成的清单（标称 100 个），**少于实测数量**——差额为后续补充的技能\n"
       "> （如 `metago-fabric-guide`、`metago-hetu-luoshu`、`metago-liuyao`、`metago-qimen`、\n"
       "> `metago-shushu`、`metago-shushu-calculus`、`metago-shushu-diagnose`、`metago-shushu-zeri`、\n"
       "> `metago-taiyi`、`metago-yijing`、`metago-ziwei`、`metago-bazi` 等易理族与产品族）。\n"
       "> **以实测数为准**：`python $DSH_HOME/scripts/audit_skills.py` 可随时复核（含 frontmatter 与正文质量检查）。\n"
       f"<!-- /{KEY} -->\n"
       "\n### 18.11 与其他章节的协同")

if ANCHOR in s:
    s = s.replace(ANCHOR, NEW, 1)
    A.write_text(s, encoding="utf-8")
    print("已加实测口径注，磁盘 %d 个技能" % n)
else:
    print("未匹配锚点")
    raise SystemExit(1)

t = A.read_text(encoding="utf-8")
print("复核：含口径注 =", KEY in t)
