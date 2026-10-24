# -*- coding: utf-8 -*-
"""pkg_portability.py — 安装包可移植性验证

模拟「把包拷到另一台机器/另一个目录后能否正常工作」：
  1. 整包复制到临时目录
  2. 在临时目录下跑核心脚本（用临时副本，不碰原件）
  3. 检查：脚本是否能自解析路径、是否依赖原始位置
"""
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

PY = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"
NODE = "node"
SRC = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")

ENV = {k: v for k, v in os.environ.items()
       if k not in ("METAGO_PYTHON", "METAGO_VERIFY_DIR", "METAGO_MEMORY_HOME")}

print("=" * 92)
print("安装包可移植性验证")
print("=" * 92)
print(f"源包：{SRC}")
try:
    size = sum(f.stat().st_size for f in SRC.rglob("*") if f.is_file())
    files = sum(1 for f in SRC.rglob("*") if f.is_file())
    print(f"体积：{size/1024/1024:.1f} MB ｜ 文件：{files} 个")
except Exception as e:
    print("读取失败:", e)
    sys.exit(1)

# 1) 结构检查
print()
print("① 结构检查")
REQUIRED = ["package.json", "AGENTS.md", "scripts", "skills", "agents",
            "docs", "core", "verify-package.cjs", "README.md", "LICENSE"]
missing = [r for r in REQUIRED if not (SRC / r).exists()]
print("  必需项 " + (f"全部存在（{len(REQUIRED)}/{len(REQUIRED)}）" if not missing else f"缺 {missing}"))

pj = SRC / "package.json"
if pj.exists():
    try:
        data = json.loads(pj.read_bytes().decode("utf-8-sig"))
        print(f"  package.json  name={data.get('name')}  version={data.get('version')}")
        print(f"  bin: {list((data.get('bin') or {}).keys())}")
        print(f"  rules_version: {data.get('rules_version')}")
    except Exception as e:
        print("  package.json 解析失败:", e)

# 2) 复制到临时目录
print()
print("② 复制到临时目录")
tmp = pathlib.Path(tempfile.mkdtemp(prefix="metago-port-"))
dst = tmp / "metagolifeform"
try:
    shutil.copytree(SRC, dst)
    print(f"  已复制到 {dst}")
except Exception as e:
    print("  复制失败:", e)
    sys.exit(1)

# 3) 在临时副本里跑核心脚本
print()
print("③ 在临时副本里运行核心脚本")
TASKS = [
    ("null-nan-scan",   [NODE, str(dst / "scripts/null-nan-scan.cjs")],           "0 条"),
    ("schema-vs-shape", [NODE, str(dst / "scripts/schema-vs-shape.cjs")],         "总判定：PASS"),
    ("element-field",   [NODE, str(dst / "scripts/element-field-scan.cjs")],      "总判定：PASS"),
    ("ops-semantic",    [NODE, str(dst / "scripts/ops-semantic-full.cjs")],       "通过 86"),
    ("algo-invariant",  [NODE, str(dst / "scripts/algo-semantic-invariants.cjs")], "通过 34"),
    ("t12-full-scan",   [NODE, str(dst / "scripts/t12-full-scan.cjs")],           "700 / 700"),
    ("audit_skills",    [PY, str(dst / "scripts/audit_skills.py")],               "问题总数： 0"),
    ("claims3",         [PY, str(dst / "scripts/verify_blueprint_claims3.py")],   "不一致 0"),
]
ok = bad = 0
fails = []
for name, cmd, expect in TASKS:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                           errors="replace", timeout=600, env=ENV, cwd=str(tmp))
        out = (r.stdout or "") + (r.stderr or "")
        if expect in out:
            ok += 1
            print(f"  ✓ {name:<18} {expect}")
        else:
            bad += 1
            frag = next((l.strip()[:60] for l in out.split("\n")
                         if any(k in l for k in ["FAIL", "失败", "Error", "Cannot", "总判定"])), out.strip()[:60])
            fails.append((name, frag))
            print(f"  ✗ {name:<18} {frag}")
    except Exception as e:
        bad += 1
        fails.append((name, str(e)[:50]))
        print(f"  ✗ {name:<18} 异常 {str(e)[:46]}")

print()
print("-" * 92)
print(f"临时副本内：通过 {ok} ｜ 失败 {bad}")
if fails:
    print()
    print("失败项（说明脚本硬编码了原始路径，换目录即失效）：")
    for n, f in fails:
        print(f"  · {n}：{f}")

# 清理
try:
    shutil.rmtree(tmp, ignore_errors=True)
    print()
    print("已清理临时目录")
except Exception:
    pass

sys.exit(0 if bad == 0 else 1)
