# -*- coding: utf-8 -*-
"""pkg_vs_installed.py — 全类别核对「交付包」与「已安装系统」的资产数量

起因（DEF-038）：检查说「SKILL.md 101 个，全部差异化 ✓」，但我记得该是 112 —— 一核对就发现缺 11 个。
教训：不只看「通过/失败」，还要看「数字是否符合预期」。
本脚本对每个资产类别查：包内 vs 装机，差集必须为空。
"""
import pathlib

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")

# 类别 → (包内路径, 装机路径, 识别规则)
CATS = [
    ("技能 SKILL.md",      "skills",            H / "skills",            lambda d: (d / "SKILL.md").exists()),
    ("专家团 agents",       "agents",            H / "agents",            lambda d: (d / "AGENTS.md").exists() or (d / "agent.yaml").exists()),
    ("平台适配模板",         "adapters",          None,                    lambda d: True),
    ("补丁工具包",           "patches",           H / "patches",           lambda d: True),
    ("插件包",              "plugins",           None,                    lambda d: True),
    ("文档",                "docs",              H / "docs",              lambda d: True),
    ("套件 completeness",   "completeness-kit",  H / "completeness-kit",  lambda d: True),
    ("套件 veracity",       "metago-veracity-kit", H / "metago-veracity-kit", lambda d: True),
    ("模板",                "templates",         H / "templates",         lambda d: True),
    ("资产",                "assets",            H / "assets",            lambda d: True),
]

print("=" * 94)
print("交付包 vs 已安装系统：资产数量核对")
print("=" * 94)
print(f"{'类别':<20}{'包内':>8}{'装机':>8}{'差集':>8}  判定")
print("-" * 94)

issues = []
for name, pkgrel, hpath, isunit in CATS:
    pdir = PKG / pkgrel
    if not pdir.exists():
        print(f"  {name:<18}{'—':>8}{'—':>8}{'—':>8}  （包内无此目录）")
        continue
    pkg_units = {d.name for d in pdir.iterdir() if d.is_dir() and isunit(d)}
    pkg_files = sum(1 for f in pdir.rglob("*") if f.is_file())
    if hpath is None or not pathlib.Path(hpath).exists():
        print(f"  {name:<18}{len(pkg_units) if pkg_units else pkg_files:>8}{'—':>8}{'—':>8}  （装机无对应目录）")
        continue
    sys_units = {d.name for d in pathlib.Path(hpath).iterdir() if d.is_dir() and isunit(d)}
    only_pkg = sorted(pkg_units - sys_units)
    only_sys = sorted(sys_units - pkg_units)
    diff = len(only_pkg) + len(only_sys)
    ok = diff == 0
    if not ok:
        issues.append((name, only_pkg, only_sys))
    print(f"  {name:<18}{len(pkg_units):>8}{len(sys_units):>8}{diff:>8}  "
          + ("✓" if ok else "✗ " + (f"包多{len(only_pkg)}/装机多{len(only_sys)}")))
    if only_sys[:3]:
        print(f"      装机有包里没有: {only_sys[:3]}")
    if only_pkg[:3]:
        print(f"      包里有装机没有: {only_pkg[:3]}")

print()
print("-" * 94)

# scripts 是文件级不是目录级
SCRIPT_EXT = {".cjs", ".js", ".mjs", ".py"}   # 只比脚本，排除 delivery.config.json 等运行产物
pkg_scripts = {p.name for p in (PKG / "scripts").iterdir() if p.is_file() and p.suffix in SCRIPT_EXT}
sys_scripts = {p.name for p in (H / "scripts").iterdir() if p.is_file() and p.suffix in SCRIPT_EXT}
print(f"  {'脚本（文件级）':<18}{len(pkg_scripts):>8}{len(sys_scripts):>8}"
      f"{len(pkg_scripts ^ sys_scripts):>8}  "
      + ("✓" if pkg_scripts == sys_scripts else "✗"))
if pkg_scripts != sys_scripts:
    op = sorted(pkg_scripts - sys_scripts)
    os_ = sorted(sys_scripts - pkg_scripts)
    if os_:
        print(f"      装机有包里没有（{len(os_)}）: {os_[:8]}")
    if op:
        print(f"      包里有装机没有（{len(op)}）: {op[:8]}")
    issues.append(("脚本", op, os_))

print()
print("=" * 94)
if not issues:
    print("总判定：PASS（所有类别包内与装机完全一致）")
else:
    print(f"总判定：需关注（{len(issues)} 个类别不一致）")
    for n, op, os_ in issues:
        print(f"  · {n}：包多 {len(op)} ｜ 装机多 {len(os_)}")
