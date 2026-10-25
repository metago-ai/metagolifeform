# -*- coding: utf-8 -*-
"""fix_stale_ver_docs.py — 修正交付包里「当前声明」的过期版本号（DEF-063）

实测：README.md / core/METAGO_CORE.md / docs/{MAP,PLATFORMS,PLUGINS,MANIFEST}
      里写的是 V36.9.6，属「当前声明」，必须改为 V36.12.0。

不改：CHANGELOG.md（历史版本记录）、RELEASE-NOTES.md（发布记录）、
      以及任何带「历史 / 此前 / 曾 / 升级前」语境的句子。
"""
import json
import pathlib
import re
import shutil
import time

PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
INST = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\metago-lifeform")
OLD, NEW = "V36.9.6", "V36.12.0"

# 明确要改的文件（当前声明）
TARGETS = ["README.md", "core/METAGO_CORE.md", "docs/MAP.md", "docs/PLATFORMS.md",
           "docs/PLUGINS.md", "docs/MANIFEST.json", "docs/STRATEGY.md", "docs/PRD.md"]
# 明确不改
SKIP = {"CHANGELOG.md", "RELEASE-NOTES.md", "SECURITY.md", "CONTRIBUTING.md"}

HIST = re.compile(r"历史|此前|曾|升级前|旧版|原为|V36\.9\.6 之前|from V36\.9\.6")


def fix_file(p, dry=False):
    t = p.read_text(encoding="utf-8")
    if OLD not in t:
        return 0
    changed = 0
    out = []
    for line in t.split("\n"):
        if OLD in line and not HIST.search(line):
            out.append(line.replace(OLD, NEW))
            changed += 1
        else:
            out.append(line)
    if changed and not dry:
        for _ in range(5):
            try:
                p.write_text("\n".join(out), encoding="utf-8")
                break
            except PermissionError:
                time.sleep(0.8)
    return changed


print("=" * 84)
print(f"修正当前声明里的 {OLD} → {NEW}")
print("=" * 84)

total = 0
for rel in TARGETS:
    for root in [PKG, INST]:
        p = root / rel
        if not p.exists():
            continue
        n = fix_file(p)
        if n:
            print(f"  ✓ {root.name}/{rel}  改 {n} 行")
            total += n

# 顺带扫一遍其余当前声明文件（排除 SKIP）
print()
print("补充扫描（其余 .md / .json，排除历史类）：")
for root in [PKG, INST]:
    for p in sorted(root.rglob("*")):
        if not p.is_file() or p.suffix not in (".md", ".json"):
            continue
        if p.name in SKIP or "node_modules" in str(p) or "local-edition" in str(p):
            continue
        if "backup" in str(p).lower():
            continue
        try:
            t = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        if OLD not in t:
            continue
        n = fix_file(p)
        if n:
            print(f"  ✓ {root.name}/{p.relative_to(root).as_posix()}  改 {n} 行")
            total += n

print()
print(f"合计修改 {total} 行")

# 复核
print()
print("复核：仍含 V36.9.6 的当前声明文件")
left = 0
for root in [PKG, INST]:
    for p in sorted(root.rglob("*")):
        if not p.is_file() or p.suffix not in (".md", ".json"):
            continue
        if p.name in SKIP or "node_modules" in str(p) or "local-edition" in str(p):
            continue
        if "backup" in str(p).lower():
            continue
        try:
            t = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        for line in t.split("\n"):
            if OLD in line and not HIST.search(line):
                print(f"  ✗ {root.name}/{p.relative_to(root).as_posix()}: {line.strip()[:80]}")
                left += 1
                break
if left == 0:
    print("  ✓ 无（历史类文件除外）")
print()
print("说明：CHANGELOG.md / RELEASE-NOTES.md 保留 V36.9.6 属历史记录，正确。")
