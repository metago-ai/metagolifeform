# -*- coding: utf-8 -*-
"""fix_stale_declared.py — 只改「当前声明」层，不动「原文/历史」层

判定：
  蓝本 元构全息文档体系-第二卷/第七卷 → **原文层**（V9.0–V36.3 架构与演进记录），
    984 原子 / 125 引擎是当时的事实，改写会让历史失真 → 保留（且已有口径校正注记）
  skills/metago-architecture-guild-team-lead → 当前运行用，43属性/36公理 需改
  skills/metago-meta-thoughts               → 当前运行用，V36.9.4 需改
  docs/rtm.md L178「版本口径尚未统一」      → 该缺口已关闭，需更新
"""
import pathlib
import re
import shutil
import time

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
BAK = pathlib.Path(r"D:\metago-build") / ("backup-stale-" + time.strftime("%Y%m%d-%H%M%S"))

print("=" * 84)
print("修正「当前声明」层的残旧数字")
print("=" * 84)

def fix_file(rel, pairs, note=""):
    """pairs: [(old, new), ...]"""
    done = 0
    for base in [H, PKG]:
        p = base / rel
        if not p.exists():
            continue
        t = p.read_text(encoding="utf-8")
        orig = t
        for old, new in pairs:
            if old in t:
                t = t.replace(old, new)
                done += 1
        if t != orig:
            b = BAK / rel
            b.parent.mkdir(parents=True, exist_ok=True)
            if not b.exists():
                shutil.copy2(p, b)
            for _ in range(5):
                try:
                    p.write_text(t, encoding="utf-8")
                    break
                except PermissionError:
                    time.sleep(0.8)
            print(f"  ✓ {base.parent.name}/{rel}  {note}")
    return done

n1 = fix_file("skills/metago-architecture-guild-team-lead/SKILL.md", [
    ("融合19大元思想体系、43条根本属性、36条核心公理与31维价值体系",
     "融合19大元思想体系、47条根本属性、38条核心公理与29维价值体系"),
    ("### 43条根本属性（摘要）", "### 47条根本属性（摘要）"),
    ("### 36条核心公理（摘要）", "### 38条核心公理（摘要）"),
], "43属性→47 / 36公理→38 / 31维→29维")

n2 = fix_file("skills/metago-meta-thoughts/SKILL.md", [
    ("与 `AGENTS.md` V36.9.4", "与 `AGENTS.md` V36.12.0"),
], "V36.9.4 → V36.12.0")

n3 = fix_file("docs/rtm.md", [
    ("| 版本口径 | AGENTS V36.9.4 / npm rules V36.9.6 / 包 V36.10.0 / 蓝本 V36.11 尚未统一 |",
     "| ~~版本口径~~ | ~~AGENTS V36.9.4 / npm rules V36.9.6 / 包 V36.10.0 / 蓝本 V36.11 尚未统一~~ → **已关闭（R10x）：9 包 rules_version 全部 V36.12.0，11 平台法则全部 V36.12.0** |"),
], "版本口径缺口 → 标注已关闭")

print()
print(f"合计替换 {n1 + n2 + n3} 处")
print(f"备份：{BAK}")

# 复核
print()
print("复核：")
for rel, pats in [
    ("skills/metago-architecture-guild-team-lead/SKILL.md", ["43条根本属性", "36条核心公理"]),
    ("skills/metago-meta-thoughts/SKILL.md", ["V36.9.4"]),
    ("docs/rtm.md", ["尚未统一 |"]),
]:
    p = H / rel
    if not p.exists():
        print(f"  ? {rel} 不存在")
        continue
    t = p.read_text(encoding="utf-8")
    left = [x for x in pats if x in t and "~~" not in t.split(x)[0][-6:]]
    print(f"  {'✓' if not left else '✗'} {rel}" + (f"  残留 {left}" if left else ""))

print()
print("说明：蓝本「元构全息文档体系-第二卷/第七卷」属原文层（V9.0–V36.3 架构与演进记录），")
print("      其中的 984 原子 / 125 引擎是当时事实，**不改写**（改了历史即失真），")
print("      且第七卷已自带「口径校正」注记说明推算值与权威终值的差异。")
