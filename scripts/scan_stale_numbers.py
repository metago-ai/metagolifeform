# -*- coding: utf-8 -*-
"""scan_stale_numbers.py — 扫描全系统的陈旧数字（原子实现数 587→590、外部 5→2）

本轮把原子实现从 587 提到 590、外部依赖从 5 降到 2，但多处文档可能还写旧值。
先扫出来，再逐个判定是否需要更新。
"""
import pathlib
import re

ROOTS = [
    (pathlib.Path(r"D:\DSH-Official\home"), "law/skills/docs", 3),
    (pathlib.Path(r"D:\DSH-Official\home\metago\blueprint\元构初始文档"), "blueprint", 2),
    (pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0"), "package", 3),
]

# (模式, 说明, 是否应更新)
PATTERNS = [
    (r"587", "原子实现数（旧）", True),
    (r"需模型/外部\)?: ?5", "外部依赖数（旧）", True),
    (r"外部依赖 5", "外部依赖数（旧）", True),
    (r"27 项断言", "包验收断言数（旧）", True),
    (r"28 项断言", "包验收断言数（旧）", True),
    (r"29 项断言", "包验收断言数（旧）", True),
    (r"30 项断言", "包验收断言数（旧）", True),
    (r"31 项断言", "包验收断言数（旧）", True),
    (r"116 项", "技能数（旧，实为文件数）", True),
    (r"116 个", "技能数（旧）", True),
]

hits = []
for root, label, depth in ROOTS:
    if not root.exists():
        continue
    for p in root.rglob("*.md"):
        rel = p.relative_to(root).as_posix()
        if any(x in rel for x in ["node_modules", "backup", ".metago-", "sessions/", "memory/",
                                   "handoff/", ".playwright"]):
            continue
        if rel.count("/") > depth:
            continue
        try:
            t = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        for pat, desc, should in PATTERNS:
            for m in re.finditer(pat, t):
                line_no = t[:m.start()].count("\n") + 1
                line = t.split("\n")[line_no - 1].strip()
                hits.append((label, rel, line_no, desc, line[:100]))

print("=" * 90)
print("陈旧数字扫描")
print("=" * 90)
print("命中 %d 处" % len(hits))
print()

seen = set()
for label, rel, ln, desc, line in hits:
    k = (rel, ln)
    if k in seen:
        continue
    seen.add(k)
    print("  [%s] %s L%d" % (label, rel[:52], ln))
    print("       %s → %s" % (desc, line[:88]))

print()
print("-" * 90)
# 分类：哪些是"历史记录"（不该改），哪些是"当前声明"（该改）
print("判定原则：")
print("  · 历史演进记录（如「587 → 590」的过程叙述）保留")
print("  · 当前口径声明（如「工厂生成 587 条」）必须更新")
