# -*- coding: utf-8 -*-
"""scripts-syntax-gate.py — 全部脚本语法门（快、安全）

设计理由（DEF-053 / CORR-032 的教训）：
  「执行式冒烟」有两个问题：① 会触发写副作用脚本，把系统改坏 ② 慢
  「语法门」只做静态解析：node --check / ast.parse
  它能抓住**真正的风险**——我把文件改坏了（SyntaxError / 未闭合括号 / 重复声明）
  而不会执行任何副作用。

覆盖：
  · $DSH_HOME/scripts 全部 .cjs/.js/.mjs/.py
  · 交付包 scripts
  · @metago-ai 下全部 .js
"""
import concurrent.futures
import os
import pathlib
import subprocess
import sys

H = pathlib.Path(r"D:\DSH-Official\home\scripts")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0\scripts")
NPM = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai")
PYEXE = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"


def collect(root, exts):
    if not root.exists():
        return []
    return [p for p in root.rglob("*")
            if p.is_file() and p.suffix in exts and "node_modules" not in str(p)]


groups = [
    ("HOME scripts", collect(H, {".cjs", ".js", ".mjs", ".py"})),
    ("PKG scripts", collect(PKG, {".cjs", ".js", ".mjs", ".py"})),
    ("vendor @metago-ai", [p for p in NPM.rglob("*.js")
                           if "node_modules" not in str(p).replace(str(NPM), "")]),
]

all_files = []
for _, fs in groups:
    all_files += fs
all_files = sorted(set(all_files))

print("=" * 88)
print("全部脚本语法门（只解析，不执行）")
print("=" * 88)
for name, fs in groups:
    print(f"  {name:<22}{len(fs):>5} 个")
print(f"  {'合计去重':<22}{len(all_files):>5} 个")
print()


def chk(p):
    try:
        if p.suffix == ".py":
            r = subprocess.run([PYEXE, "-c",
                                f"import ast,pathlib;ast.parse(pathlib.Path(r'{p}').read_text(encoding='utf-8'))"],
                               capture_output=True, text=True, encoding="utf-8",
                               errors="replace", timeout=90)
        else:
            r = subprocess.run(["node", "--check", str(p)], capture_output=True, text=True,
                               encoding="utf-8", errors="replace", timeout=90)
        return (p, r.returncode, (r.stderr or "")[:220])
    except Exception as e:
        return (p, -1, str(e)[:150])


bad = []
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
    for p, rc, err in ex.map(chk, all_files):
        if rc != 0:
            bad.append((p, err))

print("-" * 88)
if bad:
    print(f"■ 语法失败 {len(bad)} 个：")
    for p, err in bad[:15]:
        try:
            rel = p.relative_to(H).as_posix()
        except ValueError:
            try:
                rel = p.relative_to(PKG).as_posix()
            except ValueError:
                rel = str(p)
        print("  ✗ " + rel)
        for l in err.strip().split("\n")[:3]:
            print("      " + l.strip()[:110])
else:
    print("■ 语法失败：0 ✓")

print()
print("-" * 88)
print(f"检查 {len(all_files)} 个文件 ｜ 失败 {len(bad)}")
print("总判定：" + ("PASS（全部脚本语法正确）" if not bad else f"FAIL（{len(bad)} 个无法解析）"))
sys.exit(0 if not bad else 1)
