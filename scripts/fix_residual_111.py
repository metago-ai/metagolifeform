# -*- coding: utf-8 -*-
"""fix_residual_111.py — 清掉两处副本里残留的「111 个 SKILL.md」

根因：R111 只改了 $DSH_HOME/scripts/verify-package.cjs，
      D:\\metago-build\\verify-package.cjs 与包内副本没改；之后双向同步时旧版又覆盖回去。
正确做法：三处一起改，改完比对 SHA256 确认一致。
"""
import hashlib
import pathlib
import subprocess

TARGETS = [
    pathlib.Path(r"D:\metago-build\verify-package.cjs"),
    pathlib.Path(r"D:\DSH-Official\home\scripts\verify-package.cjs"),
    pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0\verify-package.cjs"),
]

OLD = "/* K11. 技能层可加载性（111 个 SKILL.md 的 frontmatter 与正文） */"
NEW = "/* K11. 技能层可加载性（扫描全部 SKILL.md 的 frontmatter 与正文；数量以实测为准，不写死） */"

for p in TARGETS:
    if not p.exists():
        print(f"  - {p} 不存在")
        continue
    s = p.read_text(encoding="utf-8")
    if OLD in s:
        p.write_text(s.replace(OLD, NEW, 1), encoding="utf-8")
        print(f"  ✓ 已改 {p.parent.name}/{p.name}")
    elif NEW in s:
        print(f"  · 已是最新 {p.parent.name}/{p.name}")
    else:
        # 兼容其它写法
        import re
        m = re.search(r"/\*\s*K11\.[^\n]*111[^\n]*\*/", s)
        if m:
            p.write_text(s.replace(m.group(0), NEW, 1), encoding="utf-8")
            print(f"  ✓ 已改（正则匹配）{p.parent.name}/{p.name}")
        else:
            print(f"  ? 未找到该注释 {p.parent.name}/{p.name}")

print()
print("三处 SHA256 比对：")
hashes = {}
for p in TARGETS:
    if p.exists():
        h = hashlib.sha256(p.read_bytes()).hexdigest()[:16]
        hashes[p] = h
        print(f"  {h}  {p}")
if len(set(hashes.values())) == 1:
    print("  → 三处内容一致 ✓")
else:
    print("  → 内容不一致，需统一")

print()
r = subprocess.run(["node", "--check", str(TARGETS[0])], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:150])
