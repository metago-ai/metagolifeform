# -*- coding: utf-8 -*-
"""revert_rtm.py — 回滚错误的重编号（CORR-038）

我的错：
  第一次扫 RTM 时用 `if 'R0' not in s and 'R1' not in s: continue` 过滤数据行，
  而 `| R20 |` 这个字符串既不含 'R0' 也不含 'R1' → **R20–R99 共 80 行被漏计**。
  于是误判「RTM 断档 R20–R99」，还按「R100–R183 → R20–R103」去重编号，
  结果 R100→R20 与文件里本来就有的 R20 撞号，产生 80 个重复编号。

教训：过滤条件用「子串包含」判断编号是错的，必须用锚定正则 `^\\|\\s*R\\d+\\s*\\|`。

修法：从备份还原，用正确判据重新核查。
"""
import pathlib
import re
import shutil
from collections import Counter

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0\docs\rtm.md")
RTM = H / "docs" / "rtm.md"

# 找最新备份
baks = sorted(pathlib.Path(r"D:\metago-build").glob("backup-rtm-*"))
if not baks:
    raise SystemExit("找不到备份")
src = baks[-1] / "rtm.md"
print(f"从备份还原：{src}")

shutil.copy2(src, RTM)
shutil.copy2(src, PKG)
print(f"✓ 已还原（{src.stat().st_size} B）")

# 用正确判据重查
t = RTM.read_text(encoding="utf-8")
ids = [m.group(1) for m in re.finditer(r"^\|\s*(R\d{2,3})\s*\|", t, re.M)]
nums = sorted({int(x[1:]) for x in ids})
c = Counter(ids)
dup = [(k, v) for k, v in c.items() if v > 1]

print()
print("=== 正确判据下的 RTM 实况 ===")
print(f"  数据行：{len(ids)}")
print(f"  唯一编号：{len(nums)}")
print(f"  范围：R{nums[0]}–R{nums[-1]}")
missing = [i for i in range(nums[0], nums[-1] + 1) if i not in nums]
print(f"  断档：{missing if missing else '无 ✓'}")
print(f"  重复编号：{len(dup)}" + (f" → {dup[:5]}" if dup else " ✓"))

# 证据列非空检查
rows = [l for l in t.split("\n") if re.match(r"^\|\s*R\d{2,3}\s*\|", l)]
empty = [r.split("|")[1].strip() for r in rows
         if len(r.split("|")) >= 6 and not r.split("|")[5].strip()]
print(f"  证据列为空：{len(empty)}" + (f" → {empty[:5]}" if empty else " ✓"))
print()
print("结论：RTM 原本就是连续的 R01–R183，" + ("无断档。" if not missing else f"存在 {len(missing)} 个断档。"))
