# -*- coding: utf-8 -*-
"""cleanup_dev_scripts.py — 把开发期脚本从装机目录归档出去

安全前提（先验证再动手）：
  1. 归档前列出所有「被文档/脚本引用」的脚本名
  2. 只归档「未被任何活文档或产品脚本引用」的开发期脚本
  3. 归档到 D:\\metago-build\\dev-scripts\\（保留，可随时找回）
  4. 同步清理装机包内的同名文件
"""
import pathlib
import re
import shutil
import time

H = pathlib.Path(r"D:\DSH-Official\home")
SC = H / "scripts"
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
ARCH = pathlib.Path(r"D:\metago-build") / ("dev-scripts-" + time.strftime("%Y%m%d-%H%M%S"))

PRODUCT = {
    "verify-package.cjs", "t12-full-scan.cjs", "ops-semantic-full.cjs",
    "algo-semantic-invariants.cjs", "schema-vs-shape.cjs", "element-field-scan.cjs",
    "mutation-test.cjs", "null-nan-scan.cjs", "atom-hollow-scan.cjs",
    "atom-responsive-scan.cjs", "find-hangs.cjs", "nan-scanner.cjs",
    "validator-robustness.cjs", "probe-type-crashes.cjs", "scan-type-assumptions.cjs",
    "mcp-all-health.cjs", "mcp-tools-callable.cjs", "mcp-tool-nature.cjs", "mcp-e2e.cjs",
    "audit_install.py", "audit_global.py", "audit_skills.py", "audit_skill_registration.py",
    "audit_law_references2.py", "compare_plugin_copies.py",
    "reapply-patches.cjs", "patch-inventory.cjs", "build-package.cjs",
    "test-kmwi-persistence.cjs", "memory-guard.cjs",
    "scan_blueprint_integrity2.py", "scan_code_fences.py",
    "guide-quality.cjs", "ops-semantic-correctness.cjs",
    "scan_fragile_invocation.py", "scan_stale_numbers.py",
    "make_delivery.py", "build-adapters.cjs",
}

# 1) 收集所有「被引用」的脚本名
REF_ROOTS = [
    H / "AGENTS.md",
    H / "docs",
    H / "metago" / "blueprint" / "元构初始文档",
    PKG,
]
referenced = set()
name_re = re.compile(r"([A-Za-z0-9_\-\u4e00-\u9fff]+\.(?:cjs|py|mjs|js))")
for root in REF_ROOTS:
    targets = []
    if root.is_file():
        targets = [root]
    elif root.exists():
        targets = [p for p in root.rglob("*") if p.is_file() and p.suffix in (".md", ".yml", ".yaml", ".json")]
    for p in targets:
        try:
            t = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        referenced |= set(name_re.findall(t))
print(f"被活文档/配置引用的脚本名：{len(referenced)} 个")

# 2) 分类
to_archive, to_keep_unsure, kept = [], [], []
for p in sorted(SC.iterdir()):
    if not p.is_file() or p.suffix not in (".cjs", ".py", ".mjs", ".js"):
        continue
    n = p.name
    if n in PRODUCT:
        kept.append(n)
    elif n in referenced:
        to_keep_unsure.append(n)
    else:
        to_archive.append(n)

print(f"产品级保留      {len(kept)} 个")
print(f"非产品级但被引用 {len(to_keep_unsure)} 个 → 暂不归档（避免破坏引用）")
for n in to_keep_unsure:
    print("    " + n)
print(f"可安全归档      {len(to_archive)} 个")

if not to_archive:
    print("\n无需归档")
    raise SystemExit(0)

# 3) 归档
ARCH.mkdir(parents=True, exist_ok=True)
moved = 0
freed = 0
for n in to_archive:
    src = SC / n
    shutil.copy2(src, ARCH / n)
    freed += src.stat().st_size
    src.unlink()
    moved += 1
    dst = PKG / "scripts" / n
    if dst.exists():
        dst.unlink()

print()
print(f"已归档 {moved} 个 → {ARCH}")
print(f"装机目录减重 {freed:,} B（{freed/1024:.1f} KB）")

# 4) 复核
left = sorted(p.name for p in SC.iterdir() if p.is_file() and p.suffix in (".cjs", ".py", ".mjs", ".js"))
print()
print(f"归档后 $DSH_HOME/scripts 剩余 {len(left)} 个脚本：")
for n in left:
    print("    " + n)
