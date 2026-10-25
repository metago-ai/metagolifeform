# -*- coding: utf-8 -*-
"""rtm-gate.py — RTM 完整性门（可被回归调用）

CORR-038 的教训：上一版用「子串包含」筛数据行（`'R0' in s or 'R1' in s`），
把 `| R20 |`～`| R99 |` 共 80 行全部漏计，误判「断档」并做了错误重编号。
本脚本用**锚定正则** `^\\|\\s*R\\d{2,3}\\s*\\|` 判定，不会再漏。

检查四项：
  1. 数据行数 > 0
  2. 编号连续（无断档）
  3. 编号唯一（无重复）
  4. 每条需求都有验收证据（证据列非空）
"""
import pathlib
import re
import sys
from collections import Counter

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0\docs\rtm.md")

print("=" * 84)
print("RTM 需求追踪矩阵完整性门")
print("=" * 84)

bad = 0
for label, p in [("HOME", H / "docs" / "rtm.md"), ("PKG", PKG)]:
    if not p.exists():
        print(f"  ✗ {label} rtm.md 不存在")
        bad += 1
        continue
    t = p.read_text(encoding="utf-8")
    # 锚定正则：行首 | R<2-3位> |
    ids = [m.group(1) for m in re.finditer(r"^\|\s*(R\d{2,3})\s*\|", t, re.M)]
    nums = sorted({int(x[1:]) for x in ids})
    c = Counter(ids)
    dup = [k for k, v in c.items() if v > 1]
    missing = [i for i in range(nums[0], nums[-1] + 1) if i not in nums] if nums else []
    rows = [l for l in t.split("\n") if re.match(r"^\|\s*R\d{2,3}\s*\|", l)]
    empty = [r.split("|")[1].strip() for r in rows
             if len(r.split("|")) >= 6 and not r.split("|")[5].strip()]

    ok = len(ids) > 0 and not missing and not dup and not empty
    print(f"\n  【{label}】{p}")
    print(f"    数据行 {len(ids)} ｜ 唯一编号 {len(nums)} ｜ 范围 R{nums[0] if nums else '-'}–R{nums[-1] if nums else '-'}")
    print(f"    断档 {len(missing)}" + (f" → {missing[:6]}" if missing else " ✓"))
    print(f"    重复 {len(dup)}" + (f" → {dup[:6]}" if dup else " ✓"))
    print(f"    证据列为空 {len(empty)}" + (f" → {empty[:6]}" if empty else " ✓"))
    print(f"    判定：{'✓ PASS' if ok else '✗ FAIL'}")
    if not ok:
        bad += 1

print()
print("-" * 84)
print("总判定：" + ("PASS（RTM 连续、唯一、证据齐全）" if bad == 0 else f"FAIL（{bad} 处不满足）"))
sys.exit(0 if bad == 0 else 1)
