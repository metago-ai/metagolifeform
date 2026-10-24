# -*- coding: utf-8 -*-
"""fix_patch_count.py — 补丁组数 13 → 14 的期望值同步（三处）

reapply-patches.cjs 现在有 14 组（新增 P18 ILT 关键词），
但三个验证脚本里的期望串还是「通过 13」：
  · clean_env_verify2.py
  · cwd_independence.py
  · full-regression.py（已改）
"""
import pathlib
import re
import shutil
import subprocess
import time

MB = pathlib.Path(r"D:\metago-build")
H = pathlib.Path(r"D:\DSH-Official\home\scripts")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0\scripts")
PYEXE = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"

TARGETS = ["clean_env_verify2.py", "cwd_independence.py", "full-regression.py"]

print("=" * 80)
print("同步「补丁组数」期望值")
print("=" * 80)

for name in TARGETS:
    for base in [MB, H, PKG]:
        p = base / name
        if not p.exists():
            continue
        t = p.read_text(encoding="utf-8")
        orig = t
        # 只改与「补丁」相关的期望，不动其他数字
        t = t.replace('"补丁自愈 13 组"', '"补丁自愈 14 组"')
        t = t.replace('补丁自愈 13 组', '补丁自愈 14 组')
        t = t.replace('("补丁自愈",   "node", str(SC / "reapply-patches.cjs"),                    "通过 13")',
                      '("补丁自愈",   "node", str(SC / "reapply-patches.cjs"),                    "通过 14")')
        # clean_env 里形如 ("补丁自愈 13 组", "node", ..., "通过 13")
        t = re.sub(r'("补丁自愈 14 组"[^\n]*?"通过 )13(")',
                   r'\g<1>14\2', t)
        if t != orig:
            p.write_text(t, encoding="utf-8")
            print(f"  ✓ {base.parent.name}/{name}")

# 语法校验
print()
for name in TARGETS:
    p = MB / name
    if not p.exists():
        continue
    r = subprocess.run([PYEXE, "-c",
                        f"import ast,pathlib;ast.parse(pathlib.Path(r'{p}').read_text(encoding='utf-8'))"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    print(("  ✓ " if r.returncode == 0 else "  ✗ ") + name + " 语法")

# 实跑
print()
print("实跑验证：")
for name, expect in [("clean_env_verify2.py", "失败 0"), ("cwd_independence.py", "总判定：PASS")]:
    p = MB / name
    if not p.exists():
        continue
    r = subprocess.run([PYEXE, str(p)], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=1200,
                       env={k: v for k, v in __import__("os").environ.items()
                            if k not in ("METAGO_PYTHON", "METAGO_VERIFY_DIR", "METAGO_MEMORY_HOME")})
    tail = [l.strip() for l in (r.stdout or "").split("\n") if l.strip()][-4:]
    print(f"  {name}: 退出码 {r.returncode}")
    for l in tail:
        print("    " + l[:76])
