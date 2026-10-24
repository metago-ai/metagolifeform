# -*- coding: utf-8 -*-
"""sync_missing_skills.py — 把装机有、包内缺的技能补进交付包（DEF-038）

发现：$DSH_HOME/skills 有 112 个 SKILL.md，交付包 skills/ 只有 101 个。
     缺的 11 个是易理族（八字/六爻/奇门/紫微/太乙/周易/河图洛书/术数×4）。
     后果：从包安装到新机器，这 11 项能力缺失。
"""
import pathlib
import shutil
import time

PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")
H = pathlib.Path(r"D:\DSH-Official\home")


def safe_cp(a, b):
    b.parent.mkdir(parents=True, exist_ok=True)
    for _ in range(5):
        try:
            shutil.copy2(a, b)
            return True
        except PermissionError:
            time.sleep(0.8)
    return False


pkg_sk = {d.name for d in (PKG / "skills").iterdir() if d.is_dir()}
sys_sk = {d.name for d in (H / "skills").iterdir() if d.is_dir() and (d / "SKILL.md").exists()}
missing = sorted(sys_sk - pkg_sk)

print("=" * 84)
print(f"补齐交付包缺失的技能（{len(missing)} 个）")
print("=" * 84)

copied_files = 0
for s in missing:
    src = H / "skills" / s
    dst = PKG / "skills" / s
    n = 0
    for f in src.rglob("*"):
        if f.is_file():
            rel = f.relative_to(src)
            if safe_cp(f, dst / rel):
                n += 1
    copied_files += n
    print(f"  ✓ {s:<28} {n} 个文件")

print()
print(f"共复制 {copied_files} 个文件")

# 复核
pkg_sk2 = {d.name for d in (PKG / "skills").iterdir() if d.is_dir() and (d / "SKILL.md").exists()}
sys_sk2 = {d.name for d in (H / "skills").iterdir() if d.is_dir() and (d / "SKILL.md").exists()}
print()
print(f"复核：包内 {len(pkg_sk2)} ｜ 装机 {len(sys_sk2)}")
only_sys = sorted(sys_sk2 - pkg_sk2)
print("包内仍缺：" + ("无 ✓" if not only_sys else ", ".join(only_sys)))

# 每个缺失技能的内容完整性（frontmatter + 正文）
print()
print("内容抽查（前 3 个）：")
import re
for s in missing[:3]:
    p = PKG / "skills" / s / "SKILL.md"
    if p.exists():
        t = p.read_text(encoding="utf-8", errors="replace")
        has_fm = t.startswith("---")
        body = len(t) - (t.find("---", 3) + 3 if has_fm else 0)
        print(f"  {s:<26} frontmatter={'有' if has_fm else '无'} 体积={len(t)}B 正文≈{body}B")
