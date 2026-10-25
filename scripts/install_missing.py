# -*- coding: utf-8 -*-
"""install_missing.py — 把包内所有 scripts/ 装进活系统 $DSH_HOME/scripts/
（对应目标 3：确保系统全局用户级生效，全部能力真实可用）
"""
import hashlib
import pathlib
import shutil

PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
H = pathlib.Path(r"D:\DSH-Official\home")
DST = H / "scripts"
DST.mkdir(parents=True, exist_ok=True)

src_dir = PKG / "scripts"
if not src_dir.exists():
    print("包内无 scripts/ 目录")
    raise SystemExit(0)

installed, updated, same = [], [], []
for f in sorted(src_dir.glob("*.cjs")) + sorted(src_dir.glob("*.mjs")) + sorted(src_dir.glob("*.py")):
    dst = DST / f.name
    if not dst.exists():
        shutil.copy2(f, dst)
        installed.append(f.name)
    else:
        hs = hashlib.sha256(f.read_bytes()).hexdigest()
        hd = hashlib.sha256(dst.read_bytes()).hexdigest()
        if hs != hd:
            shutil.copy2(f, dst)
            updated.append(f.name)
        else:
            same.append(f.name)

print("=" * 70)
print("scripts/ 安装结果")
print("=" * 70)
print("新装 %d 个: %s" % (len(installed), ", ".join(installed) if installed else "-"))
print("更新 %d 个: %s" % (len(updated), ", ".join(updated) if updated else "-"))
print("已一致 %d 个" % len(same))

# 复核
print()
print("复核（包 → 活系统）：")
bad = 0
for f in sorted(src_dir.glob("*.cjs")):
    dst = DST / f.name
    if not dst.exists():
        print("  缺失:", f.name); bad += 1
    elif hashlib.sha256(f.read_bytes()).hexdigest() != hashlib.sha256(dst.read_bytes()).hexdigest():
        print("  不同:", f.name); bad += 1
print("  全部一致" if bad == 0 else "  %d 个不一致" % bad)
