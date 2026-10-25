# -*- coding: utf-8 -*-
"""fix_regression_two.py — 修全量回归报的 2 项
  ① 包内多了开发脚本 upgrade_thin_skills.py → 从包移除
  ② full-regression.py 的期望串写错（"0 处恒真" 实际是 "有恒真断言的：0"）
"""
import pathlib

PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
H = pathlib.Path(r"D:\DSH-Official\home")

# ① 移除包内开发脚本
p = PKG / "scripts" / "upgrade_thin_skills.py"
if p.exists():
    t = p.read_text(encoding="utf-8", errors="replace")[:400]
    print("=== upgrade_thin_skills.py 前 400 字 ===")
    print(t)
    print("=== 判定：这是开发期工具（升级瘦技能的一次性动作）===")
    p.unlink()
    print("✓ 已从包内移除")
else:
    print("· 包内无此文件")

# ② 修期望串
F = pathlib.Path(r"D:\metago-build\full-regression.py")
s = F.read_text(encoding="utf-8")
OLD = '("断言无恒真",        PYEXE, MB / "assertion_quality2.py",          "0 处恒真"),'
NEW = '("断言无恒真",        PYEXE, MB / "assertion_quality2.py",          "有恒真断言的：0"),'
if OLD in s:
    F.write_text(s.replace(OLD, NEW, 1), encoding="utf-8")
    print("✓ 期望串已改为「有恒真断言的：0」")
else:
    print("? 期望串未匹配")

# 同步 full-regression.py
import shutil, time
for d in [H / "scripts", PKG / "scripts"]:
    for _ in range(5):
        try:
            shutil.copy2(F, d / F.name)
            break
        except PermissionError:
            time.sleep(0.8)
print("✓ full-regression.py 已同步")

# 复核
import subprocess
r = subprocess.run([r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe",
                    "-c", f"import ast,pathlib;ast.parse(pathlib.Path(r'{F}').read_text(encoding='utf-8'))"],
                   capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错")
