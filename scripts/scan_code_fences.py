# -*- coding: utf-8 -*-
"""scan_code_fences.py — 扫描各卷 Markdown 代码围栏是否配对"""
import pathlib

BP = pathlib.Path(r"D:\DSH-Official\home\metago\blueprint\元构初始文档")
FENCE = "`" * 3

print("=" * 80)
print("代码围栏配对检查")
print("=" * 80)

bad = []
for p in sorted(BP.glob("*.md")):
    lines = p.read_text(encoding="utf-8", errors="replace").split("\n")
    positions = [i + 1 for i, l in enumerate(lines) if l.strip().startswith(FENCE)]
    if len(positions) % 2 != 0:
        bad.append((p.name, len(positions), positions[-3:]))
        print("  ✗ %-46s 围栏 %d 个（奇数）" % (p.name[:46], len(positions)))
        print("      最后几处: %s" % positions[-3:])
    else:
        print("  ✓ %-46s 围栏 %d 个" % (p.name[:46], len(positions)))

print()
if bad:
    print("有问题的卷:", len(bad))
else:
    print("全部配对")
