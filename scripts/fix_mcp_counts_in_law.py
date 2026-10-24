# -*- coding: utf-8 -*-
"""fix_mcp_counts_in_law.py — 修正 AGENTS.md 里 MCP 服务器/工具数的三处过期表述

实测（mcp-all-health.cjs 6/6 PASS）：
  metago             55 工具
  metago-algorithms  57 工具
  playwright         24 工具
  web-session-api     7 工具
  yili               14 工具
  scrapling           5 工具
  合计 6 个服务器 / 162 个工具

AGENTS.md 里的过期处：
  L1233  §18.9 自动生成表   「112 | 2 个 MCP 服务器」（生成时的旧状态）
  L1373  §19.6 能力清单校准  「3 个 MCP 服务器 / 136 个工具」
  L1257  §18.10 技能表       「100 个技能」（已有实测注记，但表内数字仍为 100）

处置：把「实测权威值」写进去，并明确「以此为准」。
"""
import pathlib

P = pathlib.Path(r"D:\DSH-Official\home\AGENTS.md")
s = P.read_text(encoding="utf-8")
n = 0

# 1) §18.9 自动生成表
OLD1 = "| **总计** | **112** | **2 个 MCP 服务器** |"
NEW1 = ("| **总计（生成时快照）** | **112** | **2 个 MCP 服务器** |\n"
        "\n"
        "> ⚠️ **上表是安装时的快照，已过期。当前实测为 6 个服务器 / 162 个工具**，"
        "以本表下方的「实测权威值」为准。")
if OLD1 in s:
    s = s.replace(OLD1, NEW1, 1)
    n += 1
    print("✓ §18.9 表已加过期警示")

# 2) §19.6 能力清单校准
OLD2 = ("本章注入后，本环境 MCP 能力现状为 **3 个 MCP 服务器 / 136 个工具**：\n"
        "`metago`（55 工具） + `metago-algorithms`（57 工具） + `playwright`（24 个 browser_* 工具）。\n"
        "第十八章 §18.9 的自动生成表（2 服务器 / 112 工具）未含 playwright，凡出现矛盾处以本章为准。")
NEW2 = ("**实测权威值（2026-10-18，`node $DSH_HOME/scripts/mcp-all-health.cjs` 6/6 PASS）：**\n"
        "\n"
        "| MCP 服务器 | 工具数 | 用途 |\n"
        "|---|---|---|\n"
        "| `metago` | 55 | 核心工具（记忆/进化/决策锁/价值评估/校验门） |\n"
        "| `metago-algorithms` | 57 | 927 算法（相似度/相关性/耦合度/负熵/价值） |\n"
        "| `playwright` | 24 | 浏览器自动化 |\n"
        "| `web-session-api` | 7 | 带会话的站点 API 调用 |\n"
        "| `yili` | 14 | 易理工程学（八字/六爻/奇门/紫微/太乙/择日等） |\n"
        "| `scrapling` | 5 | 反爬采集 |\n"
        "| **合计** | **162** | **6 个 MCP 服务器** |\n"
        "\n"
        "> 第十八章 §18.9 的自动生成表是安装时快照（2 服务器 / 112 工具），**已过期**；"
        "凡出现矛盾，一律以本表为准（本表由 `mcp-all-health.cjs` 实测得出，可随时复核）。")
if OLD2 in s:
    s = s.replace(OLD2, NEW2, 1)
    n += 1
    print("✓ §19.6 已改为实测权威表（6 服务器 / 162 工具）")
else:
    print("未匹配 §19.6 段落，尝试宽松匹配")
    import re
    m = re.search(r"本章注入后，本环境 MCP 能力现状为[^\n]*\n[^\n]*\n[^\n]*\n", s)
    if m:
        s = s[:m.start()] + NEW2 + "\n" + s[m.end():]
        n += 1
        print("✓ §19.6 已替换（宽松匹配）")

# 3) §18.10 技能总数
OLD3 = "| **总计** | **100 个技能** |"
NEW3 = "| **总计（生成时快照）** | **100 个技能** —— 见下方实测注记 |"
if OLD3 in s:
    s = s.replace(OLD3, NEW3, 1)
    n += 1
    print("✓ §18.10 技能总数已标注为快照")

P.write_text(s, encoding="utf-8")
print()
print("共更新 %d 处" % n)
print()
t = P.read_text(encoding="utf-8")
print("复核：")
print("  含 6 个 MCP 服务器:", "6 个 MCP 服务器" in t)
print("  含 162:", "162" in t)
print("  §18.9 有过期警示:", "上表是安装时的快照，已过期" in t)
print("  无 '3 个 MCP 服务器 / 136':", "3 个 MCP 服务器 / 136" not in t)
