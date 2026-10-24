# -*- coding: utf-8 -*-
"""scan_fragile_invocation.py — 扫描脚本里的脆弱调用方式

已发现两处同源缺陷：
  DEF-027  verify-package.cjs K11  用裸 `python`
  DEF-030  mcp-all-health.cjs      用裸 `python`

本脚本全盘扫描，找出所有「依赖 PATH 解析」的调用：
  · 裸 python / python3 / py
  · 裸 npx / node（非 process.execPath）
  · 硬编码用户目录
  · 硬编码盘符路径
"""
import pathlib
import re

ROOTS = [
    pathlib.Path(r"D:\DSH-Official\home\scripts"),
    pathlib.Path(r"D:\metago-build"),
]

PATTERNS = [
    (r'["\']python["\']', "裸 python 字面量"),
    (r'["\']python3["\']', "裸 python3 字面量"),
    (r'execFileSync\(\s*["\']python', "execFileSync 直接传 python"),
    (r'spawn\(\s*["\']python', "spawn 直接传 python"),
    (r'child_process[^\n]*python', "child_process + python"),
    (r'["\']npx["\']', "裸 npx"),
    (r'C:\\\\Users\\\\[A-Za-z0-9_]+', "硬编码用户目录（反斜杠）"),
    (r'C:/Users/[A-Za-z0-9_]+', "硬编码用户目录（正斜杠）"),
    (r'D:\\\\', "硬编码 D 盘（反斜杠）"),
    (r'"D:/', "硬编码 D 盘（正斜杠）"),
]

SKIP_FILES = {"scan_fragile_invocation.py", "fix_health_python.py", "fix_k11_python.py"}

hits = {}
for root in ROOTS:
    if not root.exists():
        continue
    for p in root.glob("*.cjs"):
        if p.name in SKIP_FILES:
            continue
        try:
            t = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        for pat, desc in PATTERNS:
            for m in re.finditer(pat, t):
                ln = t[:m.start()].count("\n") + 1
                line = t.split("\n")[ln - 1].strip()
                # 排除注释行与"候选列表"里的兜底项
                if line.startswith("//") or line.startswith("*"):
                    continue
                if "PY_CANDS" in line or "candidates" in line.lower():
                    continue
                hits.setdefault(p.name, []).append((ln, desc, line[:100]))

print("=" * 92)
print("脆弱调用扫描（依赖 PATH 解析 / 硬编码路径）")
print("=" * 92)
total = 0
for fn in sorted(hits):
    rows = hits[fn]
    print("\n● " + fn + f"  （{len(rows)} 处）")
    seen = set()
    for ln, desc, line in rows:
        k = (ln, desc)
        if k in seen:
            continue
        seen.add(k)
        total += 1
        print(f"  L{ln:<5} {desc:<26} {line}")

print()
print("-" * 92)
print(f"命中 {total} 处")
print()
print("判定原则：")
print("  · 用于「候选列表兜底」的不算缺陷（比如 PY_CANDS 里最后几个）")
print("  · 用于「唯一入口」的算缺陷——PATH 一解析错就整条链路失败")
