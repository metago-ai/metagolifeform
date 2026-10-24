# -*- coding: utf-8 -*-
"""fix_exit_codes_correct.py — 修正两个退出码表达式（CORR-027）

错在哪：
  reference_audit2.py      自动推断选中了 miss_p（只覆盖「packages 路径」一类），
                           漏掉 miss_s / miss_t / miss_k 三类 → 脚本可能漏报却退出 0。
  verify_blueprint_claims3.py 没有形如 `x = []` 的汇总变量，推断失败，未加退出码。
正确做法：退出码必须基于「四类缺失之和」/「bad 计数」这样的完整判定。
"""
import pathlib
import re
import subprocess
import time

H = pathlib.Path(r"D:\DSH-Official\home\scripts")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0\scripts")
PYEXE = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"

# 1) reference_audit2.py：用四类之和
p = H / "reference_audit2.py"
if p.exists():
    t = p.read_text(encoding="utf-8")
    t = re.sub(r"\n*# 退出码（门禁语义）\nsys\.exit\([^\n]*\)\n", "\n", t)
    t = t.rstrip("\n")
    if "TOTAL_MISSING" not in t:
        t += """

# ---- 退出码（门禁语义）：必须基于四类缺失之和，不能只判其中一类（CORR-027）----
TOTAL_MISSING = len(miss_s) + len(miss_t) + len(miss_k) + len(miss_p)
sys.exit(0 if TOTAL_MISSING == 0 else 1)
"""
    for tgt in [H / p.name, PKG / p.name]:
        for _ in range(5):
            try:
                tgt.write_text(t, encoding="utf-8")
                break
            except PermissionError:
                time.sleep(0.8)
    r = subprocess.run([PYEXE, "-c", f"import ast,pathlib;ast.parse(pathlib.Path(r'{p}').read_text(encoding='utf-8'))"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    print(("  ✓ " if r.returncode == 0 else "  ✗ ") + "reference_audit2.py → 四类之和")

# 2) verify_blueprint_claims3.py：用 bad
p2 = H / "verify_blueprint_claims3.py"
if p2.exists():
    t = p2.read_text(encoding="utf-8")
    t = re.sub(r"\n*# 退出码（门禁语义）\nsys\.exit\([^\n]*\)\n", "\n", t)
    t = t.rstrip("\n")
    if "sys.exit" not in t:
        if "import sys" not in t:
            t = t.replace("import pathlib", "import pathlib\nimport sys", 1)
        t += """

# ---- 退出码（门禁语义）：bad 为「声明与实体不一致」的项数 ----
sys.exit(0 if bad == 0 else 1)
"""
    for tgt in [H / p2.name, PKG / p2.name]:
        for _ in range(5):
            try:
                tgt.write_text(t, encoding="utf-8")
                break
            except PermissionError:
                time.sleep(0.8)
    r = subprocess.run([PYEXE, "-c", f"import ast,pathlib;ast.parse(pathlib.Path(r'{p2}').read_text(encoding='utf-8'))"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    print(("  ✓ " if r.returncode == 0 else "  ✗ ") + "verify_blueprint_claims3.py → bad==0")

# 3) 实跑验证退出码真的正确
print()
print("实跑验证（当前应全为 0）：")
for n, args in [("reference_audit2.py", []), ("verify_blueprint_claims3.py", [])]:
    q = H / n
    if not q.exists():
        continue
    r = subprocess.run([PYEXE, str(q)], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=300)
    verdict = [l.strip() for l in (r.stdout or "").split("\n") if "总判定" in l or "一致" in l]
    print(f"  {n}: 退出码 {r.returncode} ｜ {verdict[-1][:64] if verdict else ''}")
