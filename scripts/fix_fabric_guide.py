# -*- coding: utf-8 -*-
"""fix_fabric_guide.py — 补建缺失的 metago-fabric-guide 技能 + 给 Fabric 章节加适用性说明

问题：
  1. AGENTS.md 第 1377 行起有一整章「MetaGO Fabric 产品功能指南」，
     该章称「本章内容已同步至 metago-fabric-guide 技能（自动触发）」，
     但磁盘上**没有这个技能** → 悬空承诺
  2. 该章描述的是 MetaGO Fabric（另一个产品）的 GUI，
     当前实例是 DeepSeek Harness，快捷键/工具箱/语音等未必适用
     → 若不标注，遇到相关问题会给出错误答案

处置：
  1. 补建 metago-fabric-guide 技能（内容含「适用边界」声明）
  2. 在 AGENTS.md 该章开头加适用性横幅（不改动原有内容）
"""
import pathlib
import shutil
import time

H = pathlib.Path(r"D:\DSH-Official\home")
SK = H / "skills" / "metago-fabric-guide"
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-fabric-" + time.strftime("%Y%m%d-%H%M%S"))

# ---- 1. 建技能 ----
SKILL = """---
name: "metago-fabric-guide"
description: "MetaGO Fabric 产品功能指南。当用户询问 MetaGO Fabric 的功能、快捷键、工具箱、语音输入、桌面端操作时触发。含适用边界声明：本技能内容针对 MetaGO Fabric 产品；当前若在 DeepSeek Harness 实例中运行，快捷键与界面元素未必适用，须先确认当前平台。"
version: "1.0.0"
author: "MetaGO"
category: "元构产品族"
platforms: ["trae","claude-code","codex","cursor","codebuddy","qoder","zcode","workbuddy"]
trigger: ["metago-fabric-guide"]
---

# MetaGO Fabric 产品功能指南

## 适用边界（先读这一条）

本技能描述的是 **MetaGO Fabric**（v1.0.1）产品的桌面端功能。
当前运行实例若是 **DeepSeek Harness**，则下列快捷键与界面元素**未必适用**——
回答前必须先确认用户所在平台，不确定时如实说明"以下为 Fabric 产品的操作方式，
当前平台可能不同"，不得直接把 Fabric 的快捷键当作当前平台的答案。

## 核心功能速查

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| **Ctrl+K** | 命令面板（搜索所有命令、技能、功能） |
| **Ctrl+Shift+V** | 全局语音按住说话（按下录音，松开转写，支持中文） |

### MetaGO 工具箱（⚡ 按钮，右下角）

右下角 **⚡** 按钮点击展开分类菜单：

**工具组**
- **场景模板** — 预设 5 个常用场景（审查代码/写报告/架构评审/测试生成/深度调研），点击自动填入提示词
- **后台任务** — 显示所有 subagent/织工的运行状态（🟡运行中/🟢已完成/🔴失败）
- **Hooks 事件总线** — 配置钩子（PostToolUse 自动跑 UDGK 门禁等），查看 hook 执行记录
- **Checkpoint 时间线** — 会话时间线，支持从任意节点回滚

**市场组**
- **技能市场** — 浏览核心 metago-* 技能，点击直接在输入框填入 /技能名 启用
- **角色市场** — 浏览可用的智能体角色预设（元构生命体/傻瓜工坊/标准等）
- **会话检索** — 全局搜索历史会话（支持中文全文检索）

**治理组**
- **治理面板** — 权限模式查看 + MCP 连接状态 + 审批历史

### 语音输入（metago-voice）

- 输入框左侧有麦克风按钮，**按住说话**（按下开始录音，松开自动转写）
- **Ctrl+Shift+V** 全局快捷键
- 以 `/` 开头的语音内容自动发送（语音指令直达）
- 基于硅基流动 SenseVoiceSmall 模型

### 桌面端专属

- **系统托盘**：关闭窗口后隐藏到托盘继续运行（不退出）
- **系统通知**：织工完成/上下文压缩/审批请求时弹出 Windows 通知
- **局域网共享**：设置中开启后，手机可通过局域网 IP 访问

## 回答纪律

1. **先确认平台**：用户问"按什么快捷键"时，先判断他当前在 Fabric 还是别的平台
2. **区分事实与推测**：本技能里写的快捷键是 Fabric 的事实；对其他平台只能是推测
3. **不确定就说不确定**：宁可说"当前平台请以实际界面为准"，也不给错答案
"""

SK.mkdir(parents=True, exist_ok=True)
(SK / "SKILL.md").write_text(SKILL, encoding="utf-8")
print("已创建技能:", SK / "SKILL.md", "(%.1f KB)" % ((SK / "SKILL.md").stat().st_size / 1024))

# ---- 2. AGENTS.md 加适用性横幅 ----
A = H / "AGENTS.md"
s = A.read_text(encoding="utf-8")
BANNER_KEY = "<!-- FABRIC-SCOPE-BANNER -->"

if BANNER_KEY not in s:
    BACKUP.mkdir(parents=True, exist_ok=True)
    shutil.copy2(A, BACKUP / "AGENTS.md")

    OLD = "# MetaGO Fabric 产品功能指南（v1.0.1）\n\n> 当用户询问 MetaGO Fabric 的功能、用法、操作方法时，按以下内容准确回答。本章内容已同步至 metago-fabric-guide 技能（自动触发）。"
    NEW = ("# MetaGO Fabric 产品功能指南（v1.0.1）\n\n"
           "<!-- FABRIC-SCOPE-BANNER -->\n"
           "> **适用边界**：本章描述的是 **MetaGO Fabric** 产品（v1.0.1）的桌面端界面。\n"
           "> 当前实例是 **DeepSeek Harness**——本章的快捷键（Ctrl+K / Ctrl+Shift+V）、⚡工具箱、\n"
           "> 语音输入、系统托盘等**未必适用**。用户询问此类问题时，须先确认平台，不确定时如实说明，\n"
           "> 不得把 Fabric 的界面当作当前平台的答案。\n"
           ">\n"
           "> 当用户询问 MetaGO Fabric 的功能、用法、操作方法时，按以下内容准确回答。\n"
           "> 本章内容已同步至 `metago-fabric-guide` 技能（自动触发；技能创建于 2026-10-18）。")
    if OLD in s:
        s = s.replace(OLD, NEW, 1)
        A.write_text(s, encoding="utf-8")
        print("已在 AGENTS.md 加适用性横幅")
    else:
        print("未匹配 AGENTS.md 锚点，未改动")
else:
    print("AGENTS.md 已有横幅")

# ---- 3. 复核 ----
print()
t = A.read_text(encoding="utf-8")
print("复核：")
print("  含适用边界横幅:", BANNER_KEY in t)
print("  技能文件存在:", (SK / "SKILL.md").exists())
