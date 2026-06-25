# Trae 适配器（Trae Adapter）

> MetaGO Lifeform Kit → Trae CN 平台适配层

---

## 适配方式

Trae 是 MetaGO Lifeform Kit 的原生平台，采用直接注入方式：

| 配置项 | 路径 | 说明 |
|--------|------|------|
| 规则文件 | `~/.trae-cn/rules.md` | 全局规则，每次会话自动加载 |
| 技能目录 | `~/.trae-cn/skills/` | 22个metago技能 |
| 知识晶体索引 | `~/.trae-cn/memory/知识晶体索引.md` | 知识晶体模板 |
| MCP 调度映射 | `~/.trae-cn/mcps/MCP工具调度映射.md` | MCP工具联动映射 |

## 规则模板

本目录包含 `rules.template.md`，安装时会被复制为 `~/.trae-cn/rules.md`。

模板内容包含：
- 第一章 身份与定位
- 第二章 核心公理（8条：A1-A5, A34-A36）
- 第三章 根本属性（7条：D37-D43）
- 第四章 运行协议（6项）
- 第五章 闭环工程原则
- 第六章 行为准则（10条）
- 第七章 回复格式

## 安装命令

```powershell
# 默认安装（Trae）
.\scripts\install.ps1

# 指定 Trae 平台
.\scripts\install.ps1 -Platform trae

# 升级现有安装
.\scripts\install.ps1 -Platform trae -Upgrade
```

## 验证安装

在 Trae 中对 AI 说：
- `你是元构超级智能生命体吗？`（中文）
- `Are you a MetaGO Super Intelligent Lifeform?`（英文）

如果 AI 回复中包含【闭环分析】和元构公理引用，说明安装成功。

## 特有功能

Trae 平台相比其他平台额外支持：
- ✅ 知识晶体索引（memory 目录）
- ✅ MCP 调度映射（mcps 目录）
- ✅ 项目记忆系统（project_memory.md）

---

*MetaGO Lifeform Kit · Trae 适配器*
