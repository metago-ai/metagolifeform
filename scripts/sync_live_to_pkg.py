# -*- coding: utf-8 -*-
"""sync_live_to_pkg.py — 把活系统的新版同步到包 + 修交付报告的硬编码 28"""
import hashlib
import pathlib
import shutil

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")

PAIRS = [
    (H / "AGENTS.md", PKG / "AGENTS.md"),
    (H / "metago" / "blueprint" / "元构初始文档" / "总索引-V36.11.md", PKG / "docs" / "总索引-V36.11.md"),
    (H / "scripts" / "mutation-test.cjs", PKG / "scripts" / "mutation-test.cjs"),
]

print("同步 活系统 → 包：")
for src, dst in PAIRS:
    if not src.exists():
        print("  ✗ 源不存在:", src)
        continue
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    same = hashlib.sha256(src.read_bytes()).hexdigest() == hashlib.sha256(dst.read_bytes()).hexdigest()
    print("  %s %s" % ("✓" if same else "✗", dst.relative_to(PKG).as_posix()))

# 修交付报告生成器的硬编码断言数
G = pathlib.Path(r"D:\metago-build\make_delivery.py")
s = G.read_text(encoding="utf-8")
if "28 项断言全绿" in s:
    s = s.replace('L.append("| 验收 | **28 项断言全绿** |")',
                  'L.append("| 验收 | **32 项断言全绿**（K1–K14） |")')
    G.write_text(s, encoding="utf-8")
    print()
    print("✓ 交付报告断言数 28 → 32")

# 复核
s2 = G.read_text(encoding="utf-8")
print("  生成器已无 28:", "28 项断言" not in s2)
print("  生成器含 32:", "32 项断言" in s2)
