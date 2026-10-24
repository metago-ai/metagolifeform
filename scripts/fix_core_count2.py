# -*- coding: utf-8 -*-
"""fix_core_count2.py — 更新 metago-core 里的脚本数（169 → 实测值）

同时把「数字以清单为准」的原则落实到自身：脚本数、技能数都改成实算。
"""
import pathlib
import re
import time

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")
SC = H / "scripts"

n_scripts = len([p for p in SC.iterdir() if p.is_file() and p.suffix in (".cjs", ".js", ".mjs", ".py")])
n_skills = len([d for d in (H / "skills").iterdir() if d.is_dir() and (d / "SKILL.md").exists()])
print(f"实测：脚本 {n_scripts} ｜ 技能 {n_skills}")

targets = [H / "skills" / "metago-core" / "SKILL.md", PKG / "skills" / "metago-core" / "SKILL.md"]
changed = 0
for p in targets:
    if not p.exists():
        continue
    t = p.read_text(encoding="utf-8")
    orig = t
    # 用正则替换「脚本目录」那一行的数字
    t = re.sub(r"(\| 脚本目录 \| `\$DSH_HOME/scripts/`（)\d+( 个[^|]*\|)",
               lambda m: m.group(1) + str(n_scripts) + m.group(2), t)
    # 技能数也同步
    t = re.sub(r"(\| 技能 \| \*\*)\d+(\*\* \|)", lambda m: m.group(1) + str(n_skills) + m.group(2), t)
    t = re.sub(r"(`\$DSH_HOME/skills/`（)\d+( 个）)", lambda m: m.group(1) + str(n_skills) + m.group(2), t)
    if t != orig:
        for _ in range(5):
            try:
                p.write_text(t, encoding="utf-8")
                break
            except PermissionError:
                time.sleep(0.8)
        changed += 1
        print(f"  ✓ {p.parent.parent.name}/{p.parent.name}")

print(f"改动 {changed} 处")
print()
# 复核
p = H / "skills" / "metago-core" / "SKILL.md"
t = p.read_text(encoding="utf-8")
for l in t.split("\n"):
    if "脚本目录" in l or ("| 技能 |" in l):
        print("  " + l.strip()[:110])
