# -*- coding: utf-8 -*-
"""tarball_content_audit.py — 审计 tarball 内容构成

问题：源包 6,116 文件，npm pack 后只有 970 个。要确认省略的是「非运行必需」而非「真正的资产」。
方法：按顶层目录统计源包与 tarball 的文件数，找出差异。
"""
import collections
import os
import pathlib
import shutil
import subprocess
import sys
import tarfile
import tempfile

SRC = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
ENV = {k: v for k, v in os.environ.items()
       if k not in ("METAGO_PYTHON", "METAGO_VERIFY_DIR", "METAGO_MEMORY_HOME")}

tmp = pathlib.Path(tempfile.mkdtemp(prefix="metago-tgz-"))
r = subprocess.run(["npm", "pack", "--pack-destination", str(tmp), str(SRC)],
                   capture_output=True, text=True, encoding="utf-8",
                   errors="replace", timeout=600, env=ENV, cwd=str(tmp), shell=True)
tgz = list(tmp.glob("*.tgz"))
if not tgz:
    print("npm pack 失败")
    print((r.stdout or "") + (r.stderr or ""))
    sys.exit(1)

inst = tmp / "x"
inst.mkdir()
with tarfile.open(tgz[0], "r:gz") as tf:
    tf.extractall(inst)
root = inst / "package"

def top_counts(base):
    c = collections.Counter()
    for f in base.rglob("*"):
        if f.is_file():
            rel = f.relative_to(base)
            c[rel.parts[0] if len(rel.parts) > 1 else "(根文件)"] += 1
    return c

src = top_counts(SRC)
pkg = top_counts(root)

print("=" * 88)
print("tarball 内容构成审计")
print("=" * 88)
print(f"{'顶层目录':<24}{'源包':>8}{'tarball':>10}{'省略':>8}  判定")
print("-" * 88)

issues = []
for k in sorted(set(src) | set(pkg), key=lambda x: -src.get(x, 0)):
    s, p = src.get(k, 0), pkg.get(k, 0)
    diff = s - p
    if p == 0 and s > 0:
        verdict = "✗ 整个目录未打包"
        issues.append((k, s, "整目录缺失"))
    elif diff > 0:
        verdict = f"部分省略 {diff}"
    else:
        verdict = "✓ 完整"
    print(f"  {k:<22}{s:>8}{p:>10}{diff:>8}  {verdict}")

print()
print("-" * 88)
print(f"合计：源包 {sum(src.values())} ｜ tarball {sum(pkg.values())}")

# 关键资产是否在
print()
print("关键资产检查：")
KEY = ["skills", "agents", "core", "docs", "adapters", "plugins", "templates", "scripts"]
for k in KEY:
    n_src = src.get(k, 0)
    n_pkg = pkg.get(k, 0)
    ok = n_pkg > 0 or n_src == 0
    print(f"  {'✓' if ok else '✗'} {k:<12} 源 {n_src:<5} → tarball {n_pkg}")

shutil.rmtree(tmp, ignore_errors=True)
print()
print("（已清理临时目录）")
sys.exit(1 if issues else 0)
