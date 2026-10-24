# -*- coding: utf-8 -*-
"""atom_never_documented.py — 找出「清单里有、但 16 卷从未提及」的原子"""
import pathlib
import re

H = pathlib.Path(r"D:\DSH-Official\home")
BP = H / "metago" / "blueprint" / "元构初始文档"
NPM = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai")

ATOM_RE = re.compile(r"ATOM_[A-Z0-9_]{2,}")

A = set(ATOM_RE.findall((NPM / "engine" / "CORE" / "ATOMS.md").read_text(encoding="utf-8", errors="replace")))

C = set()
per_vol = {}
for f in sorted(BP.glob("*.md")):
    ids = set(ATOM_RE.findall(f.read_text(encoding="utf-8", errors="replace")))
    per_vol[f.name] = len(ids)
    C |= ids

never = sorted(A - C)
print("=" * 84)
print("原子文档覆盖核对")
print("=" * 84)
print(f"ATOMS.md 清单      {len(A)}")
print(f"16 卷合计提及       {len(C)}")
print(f"从未被提及          {len(never)}")
print()
print("各卷提及数：")
for n, c in sorted(per_vol.items(), key=lambda x: -x[1]):
    print(f"    {c:>4}  {n}")
print()
if never:
    print(f"从未提及的 {len(never)} 个（前 30）：")
    for x in never[:30]:
        print("    " + x)
    if len(never) > 30:
        print(f"    … 其余 {len(never) - 30}")
