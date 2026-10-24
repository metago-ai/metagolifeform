# -*- coding: utf-8 -*-
"""fix_fences.py — 定位并修复未闭合的代码围栏

方法：模拟扫描，找到「开启后到文件结束仍未闭合」的位置，在其内容自然结束处补闭合。
不改变任何文字内容，只补 ``` 围栏。
"""
import pathlib
import shutil
import time

BP = pathlib.Path(r"D:\DSH-Official\home\metago\blueprint\元构初始文档")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-fences-" + time.strftime("%Y%m%d-%H%M%S"))
FENCE = "`" * 3

TARGETS = ["附录卷-第1部分-V9.0原始内容.md", "附录卷-第2部分-V9.1-V16.6升级.md"]

for name in TARGETS:
    p = BP / name
    lines = p.read_text(encoding="utf-8").split("\n")

    # 逐行状态机，记录每个「开」及其配对
    open_at = None
    unclosed = []
    for i, l in enumerate(lines):
        if l.strip().startswith(FENCE):
            if open_at is None:
                open_at = i
            else:
                open_at = None
    if open_at is not None:
        unclosed.append(open_at)

    print(f"● {name}")
    print(f"  行数 {len(lines)} ｜ 未闭合的开启位置: {[x+1 for x in unclosed]}")
    if not unclosed:
        print("  无需修复")
        continue

    # 修复策略：在最末尾补闭合（最小干预，不插入文字）
    BACKUP.mkdir(parents=True, exist_ok=True)
    shutil.copy2(p, BACKUP / name)

    # 若最后一行非空，先补空行再补围栏
    if lines and lines[-1].strip():
        lines.append("")
    lines.append(FENCE)
    lines.append("")
    p.write_text("\n".join(lines), encoding="utf-8")
    print(f"  已在文末补 1 个闭合围栏（备份于 {BACKUP / name}）")

print()
print("=" * 72)
print("复检")
print("=" * 72)
for p in sorted(BP.glob("*.md")):
    lines = p.read_text(encoding="utf-8", errors="replace").split("\n")
    n = sum(1 for l in lines if l.strip().startswith(FENCE))
    print("  %s %-46s %d" % ("✓" if n % 2 == 0 else "✗", p.name[:46], n))
