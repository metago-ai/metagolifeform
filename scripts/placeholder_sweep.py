# -*- coding: utf-8 -*-
"""placeholder_sweep.py — 全域占位符与未完成标记扫描

占位符是"不完整"最直接的证据。扫这些标记：
  TODO / FIXME / XXX / TBD / 待补 / 待定 / 待实现 / 未实现 / 占位 / placeholder
  {{...}} 未替换 / __XXX__ 未替换 / <待填> / 【待

排除：node_modules、备份目录、sessions、以及「历史/已修复」语境的行。
"""
import pathlib
import re

ROOTS = [
    (pathlib.Path(r"D:\DSH-Official\home\AGENTS.md"), "AGENTS.md"),
    (pathlib.Path(r"D:\DSH-Official\home\project_memory.md"), "project_memory"),
    (pathlib.Path(r"D:\DSH-Official\home\skills"), "skills"),
    (pathlib.Path(r"D:\DSH-Official\home\scripts"), "scripts"),
    (pathlib.Path(r"D:\DSH-Official\home\docs"), "docs"),
    (pathlib.Path(r"D:\DSH-Official\home\agents"), "agents"),
    (pathlib.Path(r"D:\DSH-Official\home\metago"), "blueprint"),
]

PAT = re.compile(
    r"\bTODO\b|\bFIXME\b|\bXXX\b|\bTBD\b|待补|待定|待实现|待填|占位符|placeholder|"
    r"\{\{[a-zA-Z_][\w.]*\}\}|__[A-Z][A-Z0-9_]{3,}__|【待")
HIST = re.compile(r"历史|已修复|已补|此前|曾经|旧版|V36\.9|DEF-0|CORR-0|不适用|已废弃|已删除")

SKIP_DIR = re.compile(r"node_modules|backup|sessions|\.git|site-packages|dsh-runtimes|"
                      r"local-edition|portable|\.metago-")

hits = []
scanned = 0
for root, label in ROOTS:
    if not root.exists():
        print(f"  - {label} 不存在，跳过")
        continue
    files = [root] if root.is_file() else [
        p for p in root.rglob("*")
        if p.is_file() and p.suffix in (".md", ".json", ".py", ".cjs", ".js", ".mjs", ".yaml", ".yml", ".txt")
        and not SKIP_DIR.search(str(p))]
    for p in files:
        scanned += 1
        try:
            t = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        for i, line in enumerate(t.split("\n"), 1):
            if PAT.search(line) and not HIST.search(line):
                hits.append((label, p.name, i, line.strip()[:120]))

print("=" * 96)
print(f"占位符扫描：{scanned} 个文件")
print("=" * 96)

if not hits:
    print("\n  ✓ 未发现未完成标记")
else:
    by_label = {}
    for lab, name, ln, line in hits:
        by_label.setdefault(lab, []).append((name, ln, line))
    for lab, items in sorted(by_label.items(), key=lambda x: -len(x[1])):
        print(f"\n■ {lab}：{len(items)} 处")
        for name, ln, line in items[:8]:
            print(f"  {name}:{ln}  {line[:96]}")
        if len(items) > 8:
            print(f"  … 其余 {len(items) - 8}")

print()
print("-" * 96)
print(f"合计 {len(hits)} 处")
print("总判定：" + ("PASS（无未完成标记）" if not hits else "需关注（见上）"))
