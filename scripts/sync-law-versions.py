# -*- coding: utf-8 -*-
"""sync-law-versions.py — AGENTS.md §17.10 版本对齐表的自动核对与回填

为什么需要它：
  §17.10 表里的三个包版本原先手写在法则里，随 npm 升级而漂移
  （实测抓到过 engine 2.1.1→2.1.3、algorithms 1.0.1→1.0.3、mcp 1.0.1→1.3.4 三处同时过期）。
  硬编码数字必然过期——这类缺陷在 FACTS 里已累计 16 条。

用法：
  python sync-law-versions.py --check    只核对（回归用这个），不一致即非零退出
  python sync-law-versions.py --fix      按 npm 实测回填 AGENTS.md
  python sync-law-versions.py --dry-run  打印将要写入的内容，不落盘

判据：§17.10 表内三行版本 == npm 全局安装的 package.json version
"""
import argparse
import json
import pathlib
import re
import shutil
import sys
import time

H = pathlib.Path(r"D:\DSH-Official\home")
NPM = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
BAKROOT = pathlib.Path(r"D:\metago-build")

# 表内标签 → npm 包目录
ROWS = [
    ("@metago-ai/engine", "engine"),
    ("mcp_metago-algorithms", "mcp-server"),
    ("@metago-ai/algorithms", "algorithms"),
]


def real_version(sub):
    p = NPM / sub / "package.json"
    if not p.exists():
        return None
    try:
        return json.loads(p.read_bytes().decode("utf-8-sig")).get("version")
    except Exception:
        return None


def table_version(text, label):
    """从 §17.10 表格里取某一行的版本"""
    seg = text
    i = text.find("### 17.10")
    if i >= 0:
        seg = text[i:i + 1200]
    m = re.search(r"^\|\s*" + re.escape(label) + r"\s*\|\s*([0-9][0-9A-Za-z\.\-]*)\s*\|", seg, re.M)
    return m.group(1) if m else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--fix", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if not a.check and not a.fix:
        a.check = True

    AG = H / "AGENTS.md"
    if not AG.exists():
        print(f"✗ AGENTS.md 不存在：{AG}")
        return 1
    t = AG.read_text(encoding="utf-8")

    print("=" * 84)
    print("§17.10 版本对齐表核对")
    print("=" * 84)

    bad = 0
    pending = []
    for label, sub in ROWS:
        rv = real_version(sub)
        tv = table_version(t, label)
        if rv is None:
            print(f"  ✗ {label:<24} npm 包不存在（{sub}）")
            bad += 1
            continue
        ok = (rv == tv)
        print(f"  {'✓' if ok else '✗'} {label:<24} 表内 {tv or '（未找到）':<10} 实测 {rv}")
        if not ok:
            bad += 1
            if tv:
                pending.append((label, tv, rv))

    if a.check:
        print()
        print("-" * 84)
        print("总判定：" + ("PASS（版本表与实测一致）" if bad == 0 else f"FAIL（{bad} 处不一致，运行 --fix 回填）"))
        return 0 if bad == 0 else 1

    if not pending:
        print("\n无需改动")
        return 0

    if a.dry_run:
        print("\n[dry-run] 将替换：")
        for label, tv, rv in pending:
            print(f"  | {label} | {tv} |  →  | {label} | {rv} |")
        return 0

    BAKROOT.mkdir(parents=True, exist_ok=True)
    bk = BAKROOT / ("backup-lawver-" + time.strftime("%Y%m%d-%H%M%S"))
    bk.mkdir(exist_ok=True)
    shutil.copy2(AG, bk / "AGENTS.md")

    n = 0
    for label, tv, rv in pending:
        old = f"| {label} | {tv} |"
        new = f"| {label} | {rv} |"
        if old in t:
            t = t.replace(old, new, 1)
            n += 1
    AG.write_text(t, encoding="utf-8")
    if (PKG / "AGENTS.md").parent.exists():
        shutil.copy2(AG, PKG / "AGENTS.md")
    print(f"\n✓ 回填 {n} 处 ｜ 备份 {bk.name} ｜ 已同步包内")

    # 回填后复核
    t2 = AG.read_text(encoding="utf-8")
    still = 0
    for label, sub in ROWS:
        rv = real_version(sub)
        tv = table_version(t2, label)
        if rv != tv:
            still += 1
            print(f"  ✗ 仍不一致：{label} 表内 {tv} 实测 {rv}")
    print("总判定：" + ("PASS（回填后一致）" if still == 0 else f"FAIL（仍有 {still} 处）"))
    return 0 if still == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
