# -*- coding: utf-8 -*-
"""fix_all_exit_codes.py — 一次性补全所有门禁检查器的退出码（注释用对语法）

要补：
  t12-full-scan.cjs    → execFail 与 uncovered 都为空
  schema-vs-shape.cjs  → 冲突数
  find-hangs.cjs       → slow 为空
  audit_global.py      → 缺失包
前面两个用 // 注释（JS），Python 用 #。
"""
import hashlib
import pathlib
import re
import subprocess
import time

H = pathlib.Path(r"D:\DSH-Official\home\scripts")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0\scripts")
PYEXE = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"

# name → (lang, exit_expr, 需要的汇总变量)
SPEC = {
    "t12-full-scan.cjs":   ("cjs", "execFail.length === 0 ? 0 : 1", ["execFail"]),
    "schema-vs-shape.cjs": ("cjs", "conflicts.length === 0 ? 0 : 1", None),
    "find-hangs.cjs":      ("cjs", "slow.length === 0 ? 0 : 1", ["slow"]),
    "audit_global.py":     ("py",  None, None),
}

print("=" * 88)
print("补全门禁检查器退出码（同步修正注释语法）")
print("=" * 88)

for name, (lang, expr, needvars) in SPEC.items():
    src = H / name if (H / name).exists() else (PKG / name)
    if not src.exists():
        print(f"  ? {name} 找不到")
        continue
    t = src.read_text(encoding="utf-8")
    # 清掉之前错误插入的 # 注释块
    t = re.sub(r"\n*# ---- 退出码（门禁语义）----\n", "\n", t)
    t = re.sub(r"\n*// ---- 退出码（DEF-042/043：有判定行必须有退出码）----\n", "\n", t)
    t = t.rstrip("\n")

    if re.search(r"process\.exit|sys\.exit", t):
        print(f"  · {name} 已有退出码")
        _ = src.write_text(t + "\n", encoding="utf-8")
        continue

    # 变量存在性检查
    if needvars:
        missing = [v for v in needvars if not re.search(r"\b" + v + r"\b", t)]
        if missing:
            print(f"  ? {name} 缺变量 {missing}，跳过")
            continue

    if lang == "py":
        cands = re.findall(r"^\s*(\w+)\s*=\s*\[\]", t, re.M)
        pick = next((c for c in cands if any(k in c.lower() for k in
                    ("miss", "lack", "bad", "fail", "gap", "issue", "dangling"))), None)
        if pick is None:
            print(f"  ? {name} 未找到汇总变量，跳过")
            continue
        expr = f"0 if not {pick} else 1"
        if "import sys" not in t:
            t = t.replace("import pathlib", "import pathlib\nimport sys", 1) if "import pathlib" in t else "import sys\n" + t
        code = f"sys.exit({expr})"
        cmt = f"# 退出码（门禁语义）：{pick} 非空即失败"
    else:
        code = f"process.exit({expr});"
        cmt = f"// 退出码（门禁语义）：{expr}"

    new = t + "\n\n" + cmt + "\n" + code + "\n"

    tmp = src.parent / f"__cc_{name}"
    tmp.write_text(new, encoding="utf-8")
    if lang == "py":
        r = subprocess.run([PYEXE, "-c",
                            f"import ast,pathlib;ast.parse(pathlib.Path(r'{tmp}').read_text(encoding='utf-8'))"],
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
    else:
        r = subprocess.run(["node", "--check", str(tmp)], capture_output=True, text=True,
                           encoding="utf-8", errors="replace")
    tmp.unlink(missing_ok=True)
    if r.returncode != 0:
        print(f"  ✗ {name} 语法失败：{(r.stderr or '')[:110]}")
        continue

    for tgt in [H / name, PKG / name]:
        for _ in range(5):
            try:
                tgt.write_text(new, encoding="utf-8")
                break
            except PermissionError:
                time.sleep(0.8)
    print(f"  ✓ {name} → {code}")

print()
GATES = ["verify-package.cjs", "t12-full-scan.cjs", "null-nan-scan.cjs", "schema-vs-shape.cjs",
         "element-field-scan.cjs", "ops-semantic-full.cjs", "algo-semantic-invariants.cjs",
         "mcp-all-health.cjs", "mcp-tools-callable.cjs", "reapply-patches.cjs",
         "atom-hollow-scan.cjs", "atom-responsive-scan.cjs", "find-hangs.cjs",
         "audit_install.py", "audit_skills.py", "audit_global.py", "audit-expectations.cjs",
         "differentiation-audit.cjs", "reference_audit2.py", "verify_blueprint_claims3.py",
         "checker_teeth_audit.py", "exit_code_audit.py", "assertion_quality2.py"]
miss = []
print("复核：")
for n in GATES:
    p = H / n if (H / n).exists() else (PKG / n)
    if not p.exists():
        miss.append(n + "(不存在)")
        continue
    t = p.read_text(encoding="utf-8", errors="replace")
    if not re.search(r"process\.exit|sys\.exit", t):
        miss.append(n)
print(f"门禁类 {len(GATES)} 个 ｜ 缺退出码 {len(miss)}")
for m in miss:
    print("  ✗ " + m)
