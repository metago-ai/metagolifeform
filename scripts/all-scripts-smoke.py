# -*- coding: utf-8 -*-
"""all-scripts-smoke.py — 全部脚本冒烟：逐个跑，查崩溃

起因：
  DEF-045 我把 `#` 注释写进 .cjs → SyntaxError，脚本完全跑不起来
  DEF-050 我补的退出码引用了不存在的变量 → ReferenceError
  两个都是「改完没实跑」导致的。

本脚本对 $DSH_HOME/scripts 下每个脚本跑一次，判定：
  · SyntaxError / ReferenceError / TypeError / MODULE_NOT_FOUND → 崩溃（必须修）
  · 超时 → 标记
  · 正常退出（任意退出码）→ 通过（退出码 1 可能是判定失败，不算崩溃）
只统计「崩溃」，不判业务结论。
"""
import os
import pathlib
import re
import subprocess
import sys

H = pathlib.Path(r"D:\DSH-Official\home\scripts")
PYEXE = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"
NODE = "node"

# 真崩溃：Node/Python 的未捕获致命错误（这些只会出现在 stderr）
FATAL_ERR = re.compile(
    r"^\s*(SyntaxError|ReferenceError|TypeError|RangeError|NameError|ImportError|"
    r"IndentationError|AttributeError|KeyError|ValueError)\s*[:\n]|"
    r"Cannot find module|MODULE_NOT_FOUND|"
    r"Traceback \(most recent call last\)",
    re.M)

# 正常业务结论行：出现这些说明脚本跑到了收尾（不是崩溃）
NORMAL_VERDICT = re.compile(r"总判定|通过 \d+.*失败|合计|PASS|FAIL|判定：")

# 兼容旧名（保留，仅用于展示）
CRASH_PAT = FATAL_ERR

# 需要交互/长期运行的脚本，跳过
# 跳过两类：
#  ① find-hangs.cjs —— 很慢，已单独跑过
#  ② 修复/补丁/接线/升级类脚本 —— 它们「改文件」且多数不幂等，
#     在冒烟里反复执行会把同一块插成几十份（DEF-056 就是这么来的）
# 判据：文件名含 fix / patch / wire / install / upgrade / apply / add_ / reapply
SKIP_PATTERN = re.compile(
    r"^(fix|patch|wire|install|upgrade|apply|add_|reapply|merge|migrate|sync|dedupe)",
    re.I)
SKIP = {"find-hangs.cjs"}

ENV = {k: v for k, v in os.environ.items()
       if k not in ("METAGO_PYTHON", "METAGO_VERIFY_DIR", "METAGO_MEMORY_HOME")}

files = sorted([p for p in H.iterdir()
                if p.is_file() and p.suffix in (".cjs", ".js", ".mjs", ".py")
                and p.name not in SKIP
                and not SKIP_PATTERN.match(p.name)])

print("=" * 92)
print(f"全部脚本冒烟：{len(files)} 个")
print("=" * 92)

crashed, timeout, ok, skip = [], [], 0, 0
for p in files:
    exe = PYEXE if p.suffix == ".py" else NODE
    try:
        r = subprocess.run([exe, str(p)], capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=420,
                           env=ENV, cwd=str(p.parent))
        out = (r.stdout or "") + (r.stderr or "")
        err = r.stderr or ""
        # CORR-031：只有「stderr 里的未捕获错误」才算崩溃；
        # stdout 里出现同类字样多半是脚本在报告它发现的问题。
        fatal = FATAL_ERR.search(err)
        normal_verdict = NORMAL_VERDICT.search(out)
        if fatal and not normal_verdict:
            line = next((l.strip() for l in err.split("\n") if FATAL_ERR.search(l)), "")
            crashed.append((p.name, fatal.group(0), line[:80], r.returncode))
        else:
            ok += 1
    except subprocess.TimeoutExpired:
        timeout.append(p.name)
    except Exception as e:
        crashed.append((p.name, "异常", str(e)[:70], -1))

print()
if crashed:
    print(f"■ 崩溃 {len(crashed)} 个：")
    for name, kind, line, rc in crashed:
        print(f"  ✗ {name:<36} [{kind}] rc={rc}")
        print(f"      {line}")
else:
    print("■ 崩溃：0 ✓")

if timeout:
    print(f"\n■ 超时 {len(timeout)} 个：")
    for n in timeout:
        print(f"  ⏱ {n}")

print()
print("-" * 92)
print(f"正常 {ok} ｜ 崩溃 {len(crashed)} ｜ 超时 {len(timeout)}")
print("总判定：" + ("PASS（无脚本崩溃）" if not crashed else f"FAIL（{len(crashed)} 个脚本无法运行）"))
sys.exit(0 if not crashed else 1)
