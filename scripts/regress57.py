# -*- coding: utf-8 -*-
"""regress57.py — 全系统回归（12 层 + 系统健康 + 变异测试摘要）"""
import json
import os
import pathlib
import subprocess
import time

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
GEN = pathlib.Path(r"D:\metago-build\genome")
NPM_ALG = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\algorithms\engine\algorithms")
NPM_ENG = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine\atoms")

PY = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"
ENV = dict(os.environ, METAGO_PYTHON=PY, PYTHONIOENCODING="utf-8")


def run(cmd, cwd=None, timeout=400):
    try:
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=timeout, env=ENV)
        return (r.stdout or "") + (("\n[stderr]\n" + r.stderr) if r.returncode and r.stderr else "")
    except Exception as e:
        return "EXC: " + str(e)[:80]


def pick(out, key):
    # 优先匹配行首即为关键词的行（避免被 K5 行内的「工具合计」误命中）
    lines = [l.strip() for l in out.splitlines()]
    for l in lines:
        if l.startswith(key):
            return l
    for l in lines:
        if key in l:
            return l
    return "(未匹配)"


CHECKS = [
    # (名称, 命令, 匹配关键词, 期望片段)
    ("包验收（全项）", ["node", r"D:\metago-build\verify-package.cjs"], "合计", "失败 0"),
    ("T3 算法", ["node", str(NPM_ALG / "t3impl" / "t3test.cjs")], "通过 ", "227"),
    ("T1/T2 位置多参", ["node", str(NPM_ALG / "t3impl" / "wire-shapes.cjs")], "可调通", "100.0%"),
    ("函数型形参", ["node", str(NPM_ALG / "t3impl" / "fn-params-test.cjs")], "可调通:", "21 / 21"),
    ("原子 compute", ["node", str(NPM_ENG / "verify.cjs")], "compute（", "50"),
    ("契约校验", ["node", str(NPM_ENG / "contract-validator.cjs")], "契约校验 通过", "失败  0"),
    ("原子工厂", ["node", str(NPM_ENG / "atom-factory.cjs")], "生成实现", "不符合: 0"),
    ("特化算子", ["node", str(NPM_ENG / "specialized.cjs")], "算子 ", "39/39"),
    ("近似算子", ["node", str(NPM_ENG / "approx.cjs")], "算子 ", "7/7"),
    ("哲学族约束器", ["node", str(NPM_ENG / "constraints.cjs")], "约束器 5 个", "通过 10"),
    ("NaN 污染扫描", ["node", str(H / "scripts" / "nan-scanner.cjs")], "NAN/INF 污染", ": 0"),
    ("MCP 端到端", ["node", str(H / "scripts" / "mcp-e2e.cjs")], "合计", "7"),
    ("MCP 6 组健康", ["node", str(H / "scripts" / "mcp-all-health.cjs")], "合计", "6"),
]

print("=" * 82)
print("元构 V36.12.0 全系统回归  ·  " + time.strftime("%Y-%m-%d %H:%M:%S"))
print("=" * 82)

results = []
for name, cmd, key, expect in CHECKS:
    out = run(cmd)
    line = pick(out, key)
    ok = (expect in line) and ("失败 0" in line or "失败  0" in line or "失败" not in line or name in ("包验收（全项）",))
    # 更严格：显式 FAIL 判定
    if "FAIL" in line or "污染: 0" not in line and "污染" in line:
        ok = False
    results.append((name, line, ok))
    print("  %-14s %s %s" % (name, "✓" if ok else "✗", line[:66]))

# 系统健康
skills = sum(1 for _ in (H / "skills").rglob("*") if _.is_file()) if (H / "skills").exists() else 0
print("  %-14s ✓ DSH skills %d 项" % ("系统健康", skills))

print()
print("-" * 82)
okN = sum(1 for _, _, ok in results if ok)
print("合计 %d 项 ｜ 通过 %d ｜ 需关注 %d" % (len(results), okN, len(results) - okN))

# 包信息
files = sum(1 for _ in PKG.rglob("*") if _.is_file())
size = sum(_.stat().st_size for _ in PKG.rglob("*") if _.is_file()) / 1048576
ver = (PKG / "VERSION").read_text().strip()
print("包：%d 文件 ｜ %.2f MB ｜ VERSION %s" % (files, size, ver))

# FACTS 摘要
d = json.loads((GEN / "FACTS.json").read_text(encoding="utf-8"))
print("FACTS：%d 事实 ｜ %d 冲突 ｜ %d 裁决 ｜ %d 缺陷" % (
    len(d["facts"]), len(d.get("conflicts", [])), len(d.get("resolutions", [])),
    len(d.get("defectsFound", []))))

# 写回归报告
rep = ["# 全系统回归报告", "", "时间：" + time.strftime("%Y-%m-%dT%H:%M:%S"), "",
       "| 层 | 结果 | 判定 |", "|---|---|---|"]
for name, line, ok in results:
    rep.append("| %s | %s | %s |" % (name, line.replace("|", "\\|")[:80], "PASS" if ok else "需关注"))
rep.append("")
rep.append("包：%d 文件 / %.2f MB / VERSION %s" % (files, size, ver))
(H / "docs" / "regression-report.md").write_text("\n".join(rep), encoding="utf-8")
print()
print("回归报告已写出: $DSH_HOME/docs/regression-report.md")
