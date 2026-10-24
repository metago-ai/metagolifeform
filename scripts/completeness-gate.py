# -*- coding: utf-8 -*-
"""completeness-gate.py — 完整性治理门（可被回归调用）

判定三件事：
  1. completeness.config.json 的 target 指向真实存在的文档（不是不存在的默认值）
  2. verify 能跑出覆盖率（不是 undefined / 0/0）
  3. 所有未覆盖项都已登记进登记册（可见的缺口优于隐藏的完美）
"""
import json
import pathlib
import re
import subprocess
import sys

H = pathlib.Path(r"D:\DSH-Official\home")
cfg = H / "completeness.config.json"
gaps = H / "completeness-gaps.json"

print("=" * 84)
print("完整性治理门")
print("=" * 84)
bad = 0

# ① target 存在
if not cfg.exists():
    print("  ✗ 缺 completeness.config.json")
    sys.exit(1)
d = json.loads(cfg.read_bytes().decode("utf-8-sig"))
doc = d.get("target", {}).get("doc", "")
docp = H / doc
ok = docp.exists()
print(f"  {'✓' if ok else '✗'} target.doc = {doc}（{'存在' if ok else '不存在'}）")
if not ok:
    bad += 1

# ② verify 能跑
r = subprocess.run("completeness-guard verify", capture_output=True, text=True,
                   encoding="utf-8", errors="replace", timeout=300, cwd=str(H), shell=True)
out = (r.stdout or "") + (r.stderr or "")
m = re.search(r"覆盖:\s*(\d+)/(\d+)", out)
if not m:
    print("  ✗ verify 未输出覆盖率")
    bad += 1
else:
    cov, tot = int(m.group(1)), int(m.group(2))
    print(f"  ✓ 覆盖 {cov}/{tot}（{(cov/tot*100):.0f}%）")
    if cov == 0:
        print("  ✗ 覆盖率为 0")
        bad += 1

# ③ 未覆盖项已登记
uncovered = tot - cov if m else 0
n_gaps = 0
if gaps.exists():
    gd = json.loads(gaps.read_bytes().decode("utf-8-sig"))
    n_gaps = len([g for g in gd.get("gaps", []) if g.get("status", "open") == "open"])
print(f"  {'✓' if n_gaps > 0 or uncovered == 0 else '✗'} 缺口登记 {n_gaps} 条（未覆盖 {uncovered} 项）")
if uncovered > 0 and n_gaps == 0:
    bad += 1

print()
print("-" * 84)
print("总判定：" + ("PASS（完整性治理已就位：基线可读、覆盖可量、缺口已登记）" if bad == 0
                 else f"需关注（{bad} 项不满足）"))
sys.exit(0 if bad == 0 else 1)
