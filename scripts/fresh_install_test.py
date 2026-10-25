# -*- coding: utf-8 -*-
"""fresh_install_test.py — 模拟全新安装：npm pack → 解包 → 验证

验证三件事：
  1. tarball 能否正常生成（package.json 的 files 字段是否能被 npm 接受）
  2. tarball 里是否包含运行必需的全部文件（files 字段是否漏项）
  3. 解包后的目录能否跑通核心脚本
"""
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tarfile
import tempfile

PY = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"
NODE = "node"
SRC = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")

ENV = {k: v for k, v in os.environ.items()
       if k not in ("METAGO_PYTHON", "METAGO_VERIFY_DIR", "METAGO_MEMORY_HOME")}

print("=" * 92)
print("全新安装模拟")
print("=" * 92)

tmp = pathlib.Path(tempfile.mkdtemp(prefix="metago-fresh-"))
work = tmp / "pack"
work.mkdir()

# 1) npm pack
print("\n① npm pack")
try:
    r = subprocess.run(["npm", "pack", "--pack-destination", str(work), str(SRC)],
                       capture_output=True, text=True, encoding="utf-8",
                       errors="replace", timeout=600, env=ENV, cwd=str(work),
                       shell=True)
    out = (r.stdout or "") + (r.stderr or "")
    tgz = list(work.glob("*.tgz"))
    if tgz:
        print(f"  ✓ 生成 {tgz[0].name}（{tgz[0].stat().st_size/1024/1024:.1f} MB）")
    else:
        print(f"  ✗ 未生成 tarball")
        for line in out.split("\n")[:12]:
            if line.strip():
                print("    " + line.strip()[:90])
except Exception as e:
    print("  ✗ 异常:", e)
    tgz = []

if not tgz:
    print("\n结论：npm pack 失败——package.json 的 files 字段或结构有问题")
    shutil.rmtree(tmp, ignore_errors=True)
    sys.exit(1)

# 2) 解包
print("\n② 解包到隔离目录")
inst = tmp / "installed"
inst.mkdir()
try:
    with tarfile.open(tgz[0], "r:gz") as tf:
        members = tf.getnames()
        tf.extractall(inst)
    root = inst / "package"
    nfiles = sum(1 for f in root.rglob("*") if f.is_file())
    size = sum(f.stat().st_size for f in root.rglob("*") if f.is_file())
    print(f"  ✓ 解包 {len(members)} 项 → {nfiles} 个文件 / {size/1024/1024:.1f} MB")
except Exception as e:
    print("  ✗ 解包失败:", e)
    shutil.rmtree(tmp, ignore_errors=True)
    sys.exit(1)

# 3) files 字段覆盖检查
print("\n③ 运行必需项是否被 files 字段包含")
src_files = {f.relative_to(SRC).as_posix() for f in SRC.rglob("*") if f.is_file()}
pkg_files = {f.relative_to(root).as_posix() for f in root.rglob("*") if f.is_file()}
REQUIRED = [
    "package.json", "AGENTS.md", "README.md", "LICENSE",
    "verify-package.cjs",
    "scripts/verify-package.cjs",
    "scripts/null-nan-scan.cjs",
    "scripts/audit_skills.py",
    "scripts/mcp-all-health.cjs",
    "core/METAGO_CORE.md",
    "docs/rtm.md",
]
miss = [r for r in REQUIRED if r not in pkg_files]
print("  " + ("✓ 必需项全部包含" if not miss else f"✗ 缺 {miss}"))

# 源包有多少没进 tarball
omitted = sorted(src_files - pkg_files)
print(f"  源包 {len(src_files)} 文件 → tarball {len(pkg_files)} 文件（省略 {len(omitted)}）")
if omitted:
    print("  省略的前 10 项（应为非发布内容，如临时/备份）：")
    for o in omitted[:10]:
        print("    " + o)

# 4) 在解包目录跑脚本
print("\n④ 解包目录内运行核心脚本")
TASKS = [
    ("结构自检", [PY, "-c", "import json,pathlib,sys;d=json.loads(pathlib.Path('package.json').read_bytes().decode('utf-8-sig'));print(d.get('name'),d.get('version'),d.get('rules_version'))"], "V36.12.0"),
    ("null-nan", [NODE, "scripts/null-nan-scan.cjs"], "0 条"),
    ("schema", [NODE, "scripts/schema-vs-shape.cjs"], "总判定：PASS"),
    ("claims3", [PY, "scripts/verify_blueprint_claims3.py"], "不一致 0"),
    ("audit_skills", [PY, "scripts/audit_skills.py"], "问题总数： 0"),
]
ok = bad = 0
for name, cmd, expect in TASKS:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                           errors="replace", timeout=600, env=ENV, cwd=str(root))
        out = (r.stdout or "") + (r.stderr or "")
        if expect in out:
            ok += 1
            print(f"  ✓ {name:<14} {expect}")
        else:
            bad += 1
            frag = next((l.strip()[:56] for l in out.split("\n")
                         if any(k in l for k in ["Error", "Cannot", "失败", "Traceback"])), out.strip()[:56])
            print(f"  ✗ {name:<14} {frag}")
    except Exception as e:
        bad += 1
        print(f"  ✗ {name:<14} 异常 {str(e)[:46]}")

print()
print("-" * 92)
print(f"tarball 解包内：通过 {ok} ｜ 失败 {bad}")
if miss:
    print(f"结论：files 字段缺项 {len(miss)} 个 —— 这些文件装不上")
    code = 1
elif bad:
    print("结论：解包后脚本运行失败")
    code = 1
else:
    print("结论：PASS（tarball 可生成、内容完整、解包后可运行）")
    code = 0

shutil.rmtree(tmp, ignore_errors=True)
print("（已清理临时目录）")
sys.exit(code)
