# Trae 适配器（Trae Adapter）

> MetaGO Agent Harness → Trae 平台适配层 · V36.9.1

---

## 适配方式

Trae 是 MetaGO Agent Harness 的原生平台，支持两种部署模式：

### 全局用户级安装（推荐）

| 配置项 | 路径 | 说明 |
|--------|------|------|
| 法则文件 | `~/.trae-cn/builtin/work/AGENTS.md` | 全局运行法则，每次会话自动加载 |
| 技能目录 | `~/.trae-cn/skills/` | 95个技能（39核心 + 31专家团 + 25市场） |
| 项目记忆 | `~/.trae-cn/memory/projects/<id>/project_memory.md` | 项目级持久记忆 |
| MCP 配置 | `%APPDATA%\Trae CN\User\mcp.json`（Windows）/ `~/Library/Application Support/Trae CN/User/mcp.json`（macOS）/ `~/.config/Trae CN/User/mcp.json`（Linux） | MCP 服务器配置（metago + metago-algorithms + 扩展服务器），由 `cli.js` 自动写入 |

全局安装的法则对所有项目生效，是最常用的部署方式。

### 项目级安装（可选）

| 配置项 | 路径 | 说明 |
|--------|------|------|
| 法则文件 | `<项目根目录>/.trae/rules/metago.md` | 仅对当前项目生效 |
| 技能目录 | `<项目根目录>/.trae/skills/` | 项目级技能 |
| MCP 配置 | `<项目根目录>/.trae/mcp.json` | 项目级 MCP 配置 |

项目级安装适合需要为特定项目定制规则的场景。使用方法：

```powershell
.\scripts\install.ps1 -Platform trae -ProjectLocal
```

## 规则模板

本目录包含 `rules.template.md`，由 `build-adapters.cjs` 从母本 `AGENTS.md` 自动生成。

模板内容包含全部 18 章：
- 第一章 身份与定位
- 第二章 核心公理（8条：A1-A5, A34-A36）
- 第三章 根本属性（7条：D37-D43）
- 第四章 运行协议（6项）
- 第五章 闭环工程原则
- 第六章 行为准则（10条）
- 第七章 回复格式
- 第八章 角色设定与强制思维协议（6层扫描）
- 第九章 执行指令
- 第十章 元构技能系统
- 第十一章 运行时验证强制规范（七层架构 L1-L7）
- 第十二章 项目记忆强制读取规范
- 第十三章 主动缺陷猎杀规范（11维度）
- 第十四章 交付前原子验证协议
- 第十五章 AI 自律执行协议（五问自检）
- 第十六章 记忆生命体协议（四层记忆）
- 第十七章 30人专家团调度协议
- **第十八章 MCP工具与技能智慧触发协议（v3.0）** ← V36.9.1 新增

## 安装命令

```powershell
# 默认全局安装（Trae）
.\scripts\install.ps1

# 指定 Trae 平台（等价于默认）
.\scripts\install.ps1 -Platform trae

# 强制覆盖（升级）
.\scripts\install.ps1 -Platform trae -Force

# 项目级安装
.\scripts\install.ps1 -Platform trae -ProjectLocal

# 仅安装法则，跳过技能
.\scripts\install.ps1 -Platform trae -SkipSkills

# 配置 MCP 服务器
.\scripts\setup-mcp-server.ps1 -Platform trae
```

## 验证安装

### 方法一：运行验收脚本（推荐）

```powershell
metago-lifeform verify
# 或
node local-edition/verify-local-install.cjs
```

8大类 30+ 检查项全部通过即表示安装正确。

### 方法二：在 Trae 中测试

在 Trae 中对 AI 说：
- `你是元构超级智能生命体吗？`（中文）
- `你有多少个MCP工具和技能？`（验证第十八章清单）

如果 AI 回复中包含【闭环分析】开头、元构公理引用、以及正确的工具/技能数量，说明安装成功。

## Trae 平台特有功能

相比其他平台，Trae 平台额外支持：
- ✅ Trae 系统记忆体系（四层记忆架构）
- ✅ 项目级记忆隔离（project_memory.md）
- ✅ integrated_browser MCP 服务器（浏览器自动化）
- ✅ 技能系统完整支持（95个技能）
- ✅ mcp_metago-skill-server 系列（123+40+36+20=219个扩展工具）

## V36.9.1 修复内容

- 修复 `setup-mcp` 路径解析 bug（旧版 PowerShell 使用仓库相对路径）
- 新增第十八章 MCP 工具与技能智慧触发协议
- 新增自动备份机制（安装前备份到 `~/.metago-backups/`）
- 法则文件无 BOM、UTF-8 编码
- 所有安装脚本统一转发到 `node cli.js`，消除跨平台逻辑差异

---

*MetaGO Agent Harness V36.9.1 · Trae 适配器*
