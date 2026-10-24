# -*- coding: utf-8 -*-
"""cwd_independence.py — 从不同工作目录跑核心验证，验证不依赖 CWD

在本地开发时，很多脚本会「碰巧」因为 cwd 而在 D:\\ 或 D:\\metago-build 找到依赖。
换个人从 C:\\ 或从用户目录调用时就会挂。本脚本逐个 cwd 试。
"""
import os
import pathlib
import subprocess
import sys

PY = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"
NODE = "node"
H = pathlib.Path(r"D:\DSH-Official\home")
SC = H / "scripts"
MB = pathlib.Path(r"D:\metago-build")

CWDS = [r"C:\\", r"C:\Users\MetaGO", r"D:\Documents\deepseek-harness\default-workspace", r"D:\metago-build"]

TASKS = [
    ("包验收",     "node", str(MB / "verify-package.cjs"),                    "通过 34"),
    ("输出洁净",   "node", str(SC / "null-nan-scan.cjs"),                     "0 条"),
    ("K6",        "node", str(SC / "schema-vs-shape.cjs"),                    "总判定：PASS"),
    ("K7",        "node", str(SC / "element-field-scan.cjs"),                 "总判定：PASS"),
    ("算子语义",   "node", str(SC / "ops-semantic-full.cjs"),                  "通过 86"),
    ("不变量",     "node", str(SC / "algo-semantic-invariants.cjs"),           "通过 34"),
    ("MCP 健康",   "node", str(SC / "mcp-all-health.cjs"),                     "失败 0"),
    ("工具可调用", "node", str(SC / "mcp-tools-callable.cjs"),                 "可调用 112"),
    ("补丁自愈",   "node", str(SC / "reapply-patches.cjs"),                    "需处理 0"),
    ("原子工厂",   "node", r"C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine/atoms/atom-factory.cjs", "总判定：PASS"),
    ("技能审计",   "py",   str(SC / "audit_skills.py"),                       "问题总数： 0"),
    ("安装一致",   "py",   str(SC / "audit_install.py"),                      "一致 33"),
    ("全局安装",   "py",   str(SC / "audit_global.py"),                       "非 scoped 4 / 4"),
    ("蓝本声明",   "py",   str(SC / "verify_blueprint_claims3.py"),            "不一致 0"),
]

ENV = {k: v for k, v in os.environ.items()
       if k not in ("METAGO_PYTHON", "METAGO_VERIFY_DIR", "METAGO_MEMORY_HOME")}

print("=" * 96)
print("CWD 无关性验证：从 4 个不同目录调用同一批脚本")
print("=" * 96)

matrix = {}
for cwd in CWDS:
    if not pathlib.Path(cwd).exists():
        continue
    row = {}
    for name, kind, script, expect in TASKS:
        exe = NODE if kind == "node" else PY
        try:
            r = subprocess.run([exe, script], capture_output=True, text=True,
                               encoding="utf-8", errors="replace", timeout=600,
                               env=ENV, cwd=cwd)
            out = (r.stdout or "") + (r.stderr or "")
            row[name] = expect in out
        except Exception:
            row[name] = False
    matrix[cwd] = row
    bad = [k for k, v in row.items() if not v]
    print(f"\n● cwd = {cwd}")
    print(f"  通过 {sum(row.values())}/{len(row)}" + (f" ｜ 失败: {', '.join(bad)}" if bad else "  ✓"))

print()
print("-" * 96)
allok = all(all(v.values()) for v in matrix.values())
print("总判定：" + ("PASS（所有目录下结果一致，不依赖 CWD）" if allok else "需关注（存在 CWD 依赖）"))
sys.exit(0 if allok else 1)
