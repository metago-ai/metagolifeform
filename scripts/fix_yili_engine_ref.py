# -*- coding: utf-8 -*-
"""fix_yili_engine_ref.py — 把易理族技能里的硬编码引擎路径改为本环境真实引擎（DEF-039）

现状：11 个易理技能都写「引擎：D:\\DH工作区\\易理工程学（metago-shushu CLI / MCP）」
问题：
  ① 硬编码绝对路径，换机器即失效（D:\\DH工作区 是旧 3080 主机的工作区）
  ② 本环境真正的引擎是 `yili` MCP 服务器（14 个工具），不是那个路径下的东西
修法：改为指向 yili MCP 的真实工具清单。
"""
import pathlib

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")

OLD = "4. 引擎：D:\\DH工作区\\易理工程学（metago-shushu CLI / MCP）"
NEW = ("4. 引擎：本环境的 `yili` MCP 服务器（14 个工具）——"
       "`shushu_almanac` 历法 / `bazi_calc` 四柱 / `liuyao_divine` 六爻 / `qimen_calc` 奇门 / "
       "`ziwei_calc` 紫微 / `taiyi_calc` 太乙 / `yijing_divine` 周易 / `hetu_luoshu` 河图洛书 / "
       "`wuxing_analyze` 五行 / `shushu_diagnose` 象数诊断 / `shushu_calculus` 文言微积分 / "
       "`shushu_zeri` 择日 / `ganzhi_convert` 干支 / `shushu_info` 引擎元数据")

targets = []
for root in [H / "skills", PKG / "skills"]:
    if root.exists():
        targets += [p for p in root.rglob("SKILL.md")
                    if p.parent.name.startswith("metago-") and
                    p.parent.name in {"metago-bazi", "metago-hetu-luoshu", "metago-liuyao",
                                      "metago-qimen", "metago-shushu", "metago-shushu-calculus",
                                      "metago-shushu-diagnose", "metago-shushu-zeri",
                                      "metago-taiyi", "metago-yijing", "metago-ziwei"}]

print("=" * 84)
print("修正易理族技能的引擎引用")
print("=" * 84)

changed = 0
for p in targets:
    t = p.read_text(encoding="utf-8")
    if OLD in t:
        p.write_text(t.replace(OLD, NEW), encoding="utf-8")
        changed += 1
        print(f"  ✓ {p.parent.name:<26} ({p.relative_to(H if H in p.parents else PKG).as_posix()})")
    elif "yili` MCP" in t:
        print(f"  · {p.parent.name:<26} 已是新引用")
    else:
        print(f"  ? {p.parent.name:<26} 未找到旧引用")

print()
print(f"共修改 {changed} 处")

# 复核
print()
print("复核：仍含硬编码 DH工作区 的技能")
left = []
for root in [H / "skills", PKG / "skills"]:
    if root.exists():
        for p in root.rglob("SKILL.md"):
            if "DH工作区" in p.read_text(encoding="utf-8", errors="replace"):
                left.append((root.name, p.parent.name))
if left:
    for r, n in left:
        print(f"  ✗ {r}/{n}")
else:
    print("  无 ✓")
