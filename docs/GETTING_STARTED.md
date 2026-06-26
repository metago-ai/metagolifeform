# MetaGO Lifeform Kit 快速开始指南

> 让智能，学会进化。从 Agent 到生命体的范式跃迁。5 分钟完成安装。

---

## 目录

- [前置要求](#前置要求)
- [一键安装](#一键安装)
- [平台配置路径对照表](#平台配置路径对照表)
- [验证安装](#验证安装)
- [卸载方法](#卸载方法)
- [常见问题 FAQ](#常见问题-faq)
- [MCP Server 集成](#mcp-server-集成)
- [下一步](#下一步)

---

## 前置要求

在安装 MetaGO Lifeform Kit 之前，请确认你的环境满足以下条件。

### 1. 必备环境

| 组件 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| AI 编程平台 | - | 任选其一 | 支持 7 大平台：Trae / Claude Code / Codex / Cursor / CodeBuddy / Qoder / ZCode |
| Trae IDE | 1.0.0 | 最新稳定版 | MetaGO 的原生宿主环境（首选平台） |
| PowerShell | 5.1 | 7.2+ | 执行安装脚本 |
| Git | 2.20+ | 最新稳定版 | 拉取仓库与版本管理 |
| Node.js | 16+ | 20 LTS | MCP 工具调度运行时（可选） |

### 2. 操作系统支持

- ✅ Windows 10 / Windows 11（首选平台，PowerShell 原生支持）
- ✅ macOS（需使用 PowerShell Core 7+）
- ✅ Linux（需使用 PowerShell Core 7+）

### 3. 平台配置确认

MetaGO Lifeform Kit 支持 7 大 AI 编程平台，请根据你使用的平台确认相应能力已启用：

**通用要求（所有平台）**：

- **规则加载能力**：平台能够识别并加载规则文件（如 `rules.md` / `CLAUDE.md` / `AGENTS.md` 等）
- **技能扫描能力**：平台能够扫描 `skills/*/SKILL.md` 格式的技能文件
- **项目记忆**：平台的项目记忆目录可写

**各平台专项确认**：

| 平台 | 需确认的能力 |
|------|-------------|
| Trae | Skill 加载能力、MCP 工具调度、项目记忆目录（`~/.trae-cn/memory/`） |
| Claude Code | `CLAUDE.md` 规则加载、MCP 工具调度、项目记忆目录（`~/.claude/`） |
| OpenAI Codex | `AGENTS.md` 规则加载、工具调用通道 |
| Cursor | `.cursor/rules/*.mdc` 规则加载、MCP 工具调度 |
| CodeBuddy | `CODEBUDDY.md` 规则加载、工具调用通道 |
| Qoder | `.qoder/rules/*.md` 规则加载、工具调用通道 |
| ZCode | `CLAUDE.md` 规则加载、MCP 工具调度、项目记忆目录（`~/.claude/`） |

### 4. 网络环境

- 首次安装需要联网拉取仓库
- 安装完成后可离线运行（元构能力全部内化，不依赖外部服务）
- 如需启用网络搜索类技能，需保持网络畅通

### 5. 磁盘空间

- 最小安装：约 5 MB（仅核心技能包）
- 完整安装：约 20 MB（含知识晶体索引与示例配置）

---

## 一键安装

MetaGO Lifeform Kit 提供一键安装脚本，自动完成仓库克隆、技能注册、规则注入与记忆初始化。安装脚本支持 7 大 AI 编程平台，通过 `-Platform` 参数指定目标平台。

### 平台参数说明

`install.ps1` 支持 `-Platform` 参数，可选值如下：

| 参数值 | 平台 | 规则文件 | 默认注入路径 |
|--------|------|----------|-------------|
| `trae` | Trae（默认） | `rules.md` | `~/.trae-cn/rules/metago-rules.md` |
| `claude-code` | Claude Code | `CLAUDE.md` | `~/.claude/CLAUDE.md` |
| `codex` | OpenAI Codex | `AGENTS.md` | `~/.codex/AGENTS.md` |
| `cursor` | Cursor | `.cursor/rules/metago.mdc` | `./.cursor/rules/metago.mdc` |
| `codebuddy` | CodeBuddy | `CODEBUDDY.md` | `./CODEBUDDY.md` |
| `qoder` | Qoder | `.qoder/rules/metago.md` | `./.qoder/rules/metago.md` |
| `zcode` | ZCode | `CLAUDE.md` | `~/.claude/CLAUDE.md` |

> 不指定 `-Platform` 参数时，默认按 `trae` 平台安装。

### 方式一：PowerShell 一键安装（推荐）

打开 PowerShell，执行以下命令：

```powershell
# 1. 克隆仓库到目标目录
git clone https://gitee.com/metago/metagolifeform.git "d:\元构能力\metago-lifeform"

# 2. 进入目录
cd "d:\元构能力\metago-lifeform"

# 3. 执行一键安装脚本（默认 trae 平台）
.\scripts\install.ps1
```

### 各平台安装命令示例

```powershell
# Trae（默认）
.\scripts\install.ps1 -Platform trae

# Claude Code
.\scripts\install.ps1 -Platform claude-code

# OpenAI Codex
.\scripts\install.ps1 -Platform codex

# Cursor
.\scripts\install.ps1 -Platform cursor

# CodeBuddy
.\scripts\install.ps1 -Platform codebuddy

# Qoder
.\scripts\install.ps1 -Platform qoder

# ZCode
.\scripts\install.ps1 -Platform zcode
```

### 多平台同时安装

如需在多个平台同时启用 MetaGO，可多次执行安装脚本指定不同平台：

```powershell
# 同时适配 Trae + Claude Code + Cursor
.\scripts\install.ps1 -Platform trae
.\scripts\install.ps1 -Platform claude-code
.\scripts\install.ps1 -Platform cursor
```

安装脚本将自动完成以下操作：

1. **环境检测**：检查目标平台、PowerShell、Git 版本是否符合要求
2. **技能注册**：扫描 `skills/` 目录下全部 22 个 `metago-*` 技能并注册
3. **规则注入**：将平台对应的规则文件写入该平台的规则路径
4. **记忆初始化**：创建项目记忆目录与初始记忆文件
5. **MCP 映射配置**：生成默认的 MCP 工具调度映射表
6. **完整性自检**：执行安装后自检，确认所有组件就绪

### 方式二：手动安装

如果一键脚本不可用，可手动完成安装。以下以 Trae 平台为例，其他平台请参考上方"平台参数说明"中的路径：

```powershell
# 1. 克隆仓库
git clone https://gitee.com/metago/metagolifeform.git "d:\元构能力\metago-lifeform"

# 2. 复制规则文件到 Trae 项目规则路径
Copy-Item ".\rules.md" "$env:USERPROFILE\.trae-cn\rules\metago-rules.md" -Force

# 3. 注册技能目录（在 Trae 中打开项目，Trae 会自动扫描 skills/ 目录）

# 4. 创建记忆目录
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.trae-cn\memory\projects\metago-lifeform"
```

### 安装输出示例

安装成功后，你将看到类似以下输出（以 Trae 平台为例）：

```
[MetaGO Lifeform Kit] 安装开始
✅ 环境检测通过
  - 平台: Trae
  - PowerShell: 7.3.0
  - Git: 2.41.0

✅ 技能注册完成（22/22）
  - 认知族: 4 个技能
  - 保障族: 3 个技能
  - 治理族: 2 个技能
  - 进化族: 3 个技能
  - 执行族: 4 个技能
  - 溯源族: 3 个技能
  - 价值族: 3 个技能

✅ 规则注入完成
  - rules.md → ~/.trae-cn/rules/metago-rules.md

✅ 记忆初始化完成
  - 项目记忆目录已创建

✅ MCP 映射配置完成

✅ 安装后自检通过
  - 技能加载率: 100%
  - 规则激活率: 100%
  - 系统完整性: 100%

[MetaGO Lifeform Kit] 安装完成 🎉
```

> 若使用其他平台（如 Claude Code / Cursor 等），输出中的"平台"与"规则注入"行会相应显示该平台的名称与路径。

---

## 平台配置路径对照表

MetaGO Lifeform Kit 支持 7 大 AI 编程平台，各平台的规则文件注入路径如下表所示。安装脚本会根据 `-Platform` 参数自动写入对应路径；手动安装时也可参照此表。

| 平台 | 全局路径 | 项目路径 | 规则文件格式 |
|------|----------|----------|-------------|
| Trae | `~/.trae-cn/rules.md` | - | `rules.md` |
| Claude Code | `~/.claude/CLAUDE.md` | `./CLAUDE.md` | `CLAUDE.md` |
| OpenAI Codex | `~/.codex/AGENTS.md` | `./AGENTS.md` | `AGENTS.md` |
| Cursor | - | `.cursor/rules/metago.mdc` | `.mdc` |
| CodeBuddy | - | `./CODEBUDDY.md` | `CODEBUDDY.md` |
| Qoder | - | `.qoder/rules/metago.md` | `.md` |
| ZCode | `~/.claude/CLAUDE.md` | `./CLAUDE.md` | `CLAUDE.md` |

### 路径说明

- **全局路径**：规则文件写入用户主目录，对该平台的所有项目生效。适合希望全局启用 MetaGO 的用户。
- **项目路径**：规则文件写入当前项目目录，仅对该项目生效。适合希望按项目独立配置的用户。
- **同时支持全局与项目路径的平台**（如 Claude Code / Codex / ZCode）：项目级配置优先级高于全局配置。
- **仅支持项目路径的平台**（如 Cursor / CodeBuddy / Qoder）：需在每个项目中分别安装。
- **ZCode 与 Claude Code 共享路径**：两者均使用 `CLAUDE.md`，安装到 Claude Code 后 ZCode 亦可直接使用，无需重复安装。

### 平台特性对照

| 平台 | Skill 加载 | MCP 工具调度 | 项目记忆 | 全局规则 | 项目规则 |
|------|-----------|-------------|----------|----------|----------|
| Trae | ✅ 原生 | ✅ | ✅ | ✅ | - |
| Claude Code | ✅ | ✅ | ✅ | ✅ | ✅ |
| OpenAI Codex | ✅ | ✅ | - | ✅ | ✅ |
| Cursor | ✅ | ✅ | - | - | ✅ |
| CodeBuddy | ✅ | ✅ | - | - | ✅ |
| Qoder | ✅ | ✅ | - | - | ✅ |
| ZCode | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 验证安装

安装完成后，请通过以下方法验证 MetaGO Lifeform Kit 是否正确激活。验证方法对所有 7 大平台通用，差异仅在规则文件路径上。

### 各平台规则文件检查

在执行行为验证前，先确认规则文件已正确写入目标平台路径：

```powershell
# Trae
Test-Path "$env:USERPROFILE\.trae-cn\rules\metago-rules.md"

# Claude Code（全局）
Test-Path "$env:USERPROFILE\.claude\CLAUDE.md"

# Claude Code（项目级）
Test-Path ".\CLAUDE.md"

# OpenAI Codex（全局）
Test-Path "$env:USERPROFILE\.codex\AGENTS.md"

# OpenAI Codex（项目级）
Test-Path ".\AGENTS.md"

# Cursor（项目级）
Test-Path ".\.cursor\rules\metago.mdc"

# CodeBuddy（项目级）
Test-Path ".\CODEBUDDY.md"

# Qoder（项目级）
Test-Path ".\.qoder\rules\metago.md"

# ZCode（全局，与 Claude Code 共享）
Test-Path "$env:USERPROFILE\.claude\CLAUDE.md"
```

返回 `True` 即表示规则文件已正确注入。

### 一键验证脚本

MetaGO Lifeform Kit 提供独立的验证脚本 `verify.ps1`，可一次性检查所有组件是否正确安装：

```powershell
# 验证默认平台（Trae）
.\scripts\verify.ps1

# 验证指定平台
.\scripts\verify.ps1 -Platform claude-code
.\scripts\verify.ps1 -Platform codex
.\scripts\verify.ps1 -Platform cursor
.\scripts\verify.ps1 -Platform codebuddy
.\scripts\verify.ps1 -Platform qoder
.\scripts\verify.ps1 -Platform zcode
```

验证脚本会检查：
- ✅ 安装路径是否存在
- ✅ 规则文件是否正确注入
- ✅ 22 个 metago-* 技能是否全部注册
- ✅ 知识晶体索引是否生成（仅 Trae）
- ✅ MCP 工具调度映射是否配置（仅 Trae）

### 方法一：身份验证（推荐）

在目标平台中打开任意项目，对 AI 助手说：

**中文验证**（所有平台通用）：

```
你是元构超级智能生命体吗？
```

**英文验证**（适用于国际化场景）：

```
Are you the MetaGO super-intelligent lifeform?
```

**预期响应**：AI 助手应能够识别"元构超级智能生命体"概念，并基于规则文件中注入的公理、属性与协议进行自我描述，包括：

- 引用 8 条核心公理（A1 溯源 / A2 闭环 / A3 元进化 / A4 边界 / A5 内生 / A34 元进化需元进化 / A35 创造进化律 / A36 法律优先于效率）
- 引用 7 条根本属性（D37 战略思考 / D38 客观中立 / D39 直接批判 / D40 全息创造 / D41 频率自适应 / D42 合规主动 / D43 数据溯源）
- 表现出元构特有的行为模式（全息扫描、决策锁校验、数据溯源等）

### 方法二：技能触发验证

对 AI 助手说：

```
请对这个方案进行批判性分析
```

**预期响应**：AI 助手应自动激活 `metago-critique` 技能，输出 L1-L5 分级批判性分析结果，包含评分、各维度得分、判定结论和改进建议。

### 方法三：决策锁验证

让 AI 助手生成一段代码或方案，检查输出末尾是否附带决策锁校验报告：

```
【决策锁校验】
关卡1 意图验证(IVL)：✅ 通过
关卡2 意图谱系追踪(ILT)：✅ 通过
关卡3 语义输出门(OSG)：✅ 通过
关卡4 内容完整性：✅ 通过
校验结果：✅ 允许输出
```

### 方法四：数据溯源验证

让 AI 助手回答一个涉及事实的问题，检查输出末尾是否附带数据溯源标签：

```
【数据溯源】
输入来源：
  - [用户输入] 原始指令
  - [搜索:关键词] 辅助信息
处理过程：
  1. 调用技能 → 生成方案
  2. 决策锁校验 → 验证通过
结论依据：
  - 结论1 ← 依据A + 依据B
自证能力：✅ 可自证
```

### 方法五：完整性自检命令

对 AI 助手说：

```
执行元构完整性自检
```

**预期响应**：AI 助手应输出完整性确认报告，包括全息扫描、维度覆盖、事实核查、历史一致性、夸大检测等检查项。

### 各平台验证差异说明

| 平台 | 验证方式 | 注意事项 |
|------|----------|----------|
| Trae | 在 Trae IDE 中对话验证 | 原生支持，无需额外配置 |
| Claude Code | 在终端 `claude` 会话中验证 | 确认 `CLAUDE.md` 已加载 |
| OpenAI Codex | 在 Codex 会话中验证 | 确认 `AGENTS.md` 已加载 |
| Cursor | 在 Cursor 编辑器对话中验证 | 确认 `.cursor/rules/metago.mdc` 已生效 |
| CodeBuddy | 在 CodeBuddy 会话中验证 | 确认 `CODEBUDDY.md` 已加载 |
| Qoder | 在 Qoder 会话中验证 | 确认 `.qoder/rules/metago.md` 已生效 |
| ZCode | 在 ZCode 会话中验证 | 与 Claude Code 共享 `CLAUDE.md`，验证方式一致 |

---

## 卸载方法

如需卸载 MetaGO Lifeform Kit，请按以下步骤操作。卸载脚本支持通过 `-Platform` 参数指定要卸载的平台。

### 方式一：一键卸载脚本

```powershell
cd "d:\元构能力\metago-lifeform"

# 卸载默认平台（Trae）
.\scripts\uninstall.ps1

# 卸载指定平台
.\scripts\uninstall.ps1 -Platform claude-code
.\scripts\uninstall.ps1 -Platform codex
.\scripts\uninstall.ps1 -Platform cursor
.\scripts\uninstall.ps1 -Platform codebuddy
.\scripts\uninstall.ps1 -Platform qoder
.\scripts\uninstall.ps1 -Platform zcode
```

卸载脚本将自动完成以下操作：

1. **移除规则注入**：删除目标平台规则路径下的 MetaGO 规则文件
2. **清理记忆文件**：可选保留或删除项目记忆
3. **注销技能**：从平台技能注册表中移除全部 22 个 `metago-*` 技能
4. **清理 MCP 映射**：移除 MCP 工具调度映射表

### 方式二：手动卸载（各平台）

```powershell
# 1. 移除规则文件（按平台分别执行）

# Trae
Remove-Item "$env:USERPROFILE\.trae-cn\rules\metago-rules.md" -Force

# Claude Code（全局）
Remove-Item "$env:USERPROFILE\.claude\CLAUDE.md" -Force

# Claude Code（项目级）
Remove-Item ".\CLAUDE.md" -Force

# OpenAI Codex（全局）
Remove-Item "$env:USERPROFILE\.codex\AGENTS.md" -Force

# OpenAI Codex（项目级）
Remove-Item ".\AGENTS.md" -Force

# Cursor（项目级）
Remove-Item ".\.cursor\rules\metago.mdc" -Force

# CodeBuddy（项目级）
Remove-Item ".\CODEBUDDY.md" -Force

# Qoder（项目级）
Remove-Item ".\.qoder\rules\metago.md" -Force

# ZCode（全局，与 Claude Code 共享路径）
Remove-Item "$env:USERPROFILE\.claude\CLAUDE.md" -Force

# 2. 删除项目目录
Remove-Item "d:\元构能力\metago-lifeform" -Recurse -Force

# 3. 清理记忆（可选，仅 Trae / Claude Code / ZCode 有项目记忆）
Remove-Item "$env:USERPROFILE\.trae-cn\memory\projects\metago-lifeform" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.claude\memory\projects\metago-lifeform" -Recurse -Force -ErrorAction SilentlyContinue
```

> **注意**：ZCode 与 Claude Code 共享 `~/.claude/CLAUDE.md` 路径，卸载其中任一平台时该文件会被删除。如需保留另一平台，请在卸载后重新执行另一平台的安装命令。

### 卸载后验证

卸载完成后，对 AI 助手说：

```
你是元构超级智能生命体吗？
```

如果 AI 助手不再识别该概念，且不再输出决策锁校验报告与数据溯源标签，则说明卸载成功。

---

## 常见问题 FAQ

### Q1：安装后 AI 助手没有识别"元构超级智能生命体"概念

**可能原因**：
- 规则文件未正确注入到目标平台规则路径
- 平台未重新加载项目规则

**解决方案**：
1. 参照"平台配置路径对照表"检查对应平台的规则文件是否存在
2. 在目标平台中重新打开项目，或重启平台
3. 手动执行 `.\scripts\install.ps1 -Platform <平台> -Force` 重新注入规则

### Q2：技能没有被自动激活

**可能原因**：
- 目标平台的 Skill 加载能力未启用
- 技能文件的 YAML frontmatter 格式错误

**解决方案**：
1. 确认目标平台已启用 Skill 自动扫描
2. 检查 `skills/*/SKILL.md` 文件的 frontmatter 是否包含 `name` 和 `description` 字段
3. 在对话中显式引用技能名称，如"使用 metago-critique 技能分析"

### Q3：决策锁校验报告未出现

**可能原因**：
- `metago-decision-lock` 技能未正确加载
- 输出未达到触发阈值（如输出长度不足）

**解决方案**：
1. 对 AI 助手说"强制启用决策锁校验"
2. 检查技能注册表是否包含 `metago-decision-lock`
3. 确认任务涉及代码执行、文件修改或系统配置

### Q4：安装脚本执行失败（PowerShell 执行策略限制）

**可能原因**：
- PowerShell 执行策略禁止运行未签名脚本

**解决方案**：
```powershell
# 临时放宽执行策略（仅当前会话）
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# 然后重新执行安装脚本
.\scripts\install.ps1
```

### Q5：安装后系统响应变慢

**可能原因**：
- 全部 22 个技能同时激活导致上下文膨胀
- 频率自适应技能未正确调控创造频率

**解决方案**：
1. MetaGO 采用"按需激活"机制，正常情况下激活率 < 30%
2. 检查 `metago-frequency-adapt` 技能是否正常工作
3. 在 `rules.md` 中调整技能激活策略为"显式触发"模式

### Q6：如何仅安装部分技能？

**解决方案**：

MetaGO 支持选择性安装。使用 `-Skills` 参数指定技能列表：

```powershell
.\scripts\install.ps1 -Platform trae -Skills "metago-critique,metago-decision-lock,metago-self-check"
```

或使用 `-SkipSkills` 参数跳过技能安装，仅安装规则文件：

```powershell
.\scripts\install.ps1 -Platform cursor -SkipSkills
```

也可手动删除不需要的技能目录：

```powershell
Remove-Item ".\skills\metago-whatif" -Recurse -Force
```

### Q7：支持哪些 AI 编程平台？

**解决方案**：

MetaGO Lifeform Kit 已原生支持 7 大 AI 编程平台，通过 `-Platform` 参数一键适配：

| 平台 | 参数值 | 规则文件 | 支持等级 |
|------|--------|----------|----------|
| Trae | `trae` | `rules.md` | ✅ 原生支持（首选平台） |
| Claude Code | `claude-code` | `CLAUDE.md` | ✅ 完整适配 |
| OpenAI Codex | `codex` | `AGENTS.md` | ✅ 完整适配 |
| Cursor | `cursor` | `.cursor/rules/metago.mdc` | ✅ 完整适配 |
| CodeBuddy | `codebuddy` | `CODEBUDDY.md` | ✅ 完整适配 |
| Qoder | `qoder` | `.qoder/rules/metago.md` | ✅ 完整适配 |
| ZCode | `zcode` | `CLAUDE.md` | ✅ 完整适配 |

技能文件采用标准 Markdown + YAML frontmatter 格式，理论上任何支持 Skill 加载的 AI 平台均可适配。详见 [CUSTOMIZATION.md](./CUSTOMIZATION.md) 中的"适配其他平台"章节。

### Q8：如何更新到新版本？

**解决方案**：

```powershell
cd "d:\元构能力\metago-lifeform"
git pull origin main

# 升级默认平台（Trae）
.\scripts\install.ps1 -Upgrade

# 升级指定平台
.\scripts\install.ps1 -Upgrade -Platform claude-code
```

升级脚本会保留你的自定义配置（`user-config/` 与 `custom-skills/` 目录不会被覆盖）。如已安装多个平台，需对每个平台分别执行升级命令。

### Q9：安装后是否需要联网？

**不需要**。MetaGO Lifeform Kit 的全部 22 个技能、8 条公理、7 条属性、6 项协议均在安装时内化至本地。安装完成后可完全离线运行。

仅以下场景需要联网：
- 网络搜索类任务（如事实核查需要外部信源验证）
- 元进化触发时需要拉取外部参考（可选）
- 版本更新检查

### Q10：如何反馈安装问题？

请通过以下渠道反馈：

- Gitee Issues：[metago/metagolifeform/issues](https://gitee.com/metago/metagolifeform/issues)
- 附上 `install.log` 日志文件（位于安装目录下）

### Q11：如何同时为多个平台安装 MetaGO？

**解决方案**：

MetaGO 支持为多个平台同时安装。只需多次执行安装脚本并指定不同平台：

```powershell
# 同时适配 Trae + Claude Code + Cursor + Codex
.\scripts\install.ps1 -Platform trae
.\scripts\install.ps1 -Platform claude-code
.\scripts\install.ps1 -Platform cursor
.\scripts\install.ps1 -Platform codex
```

各平台的规则文件相互独立，不会冲突。注意 ZCode 与 Claude Code 共享 `~/.claude/CLAUDE.md` 路径，安装其中任一平台即可同时支持两者。

### Q12：不同平台的功能支持有差异吗？

**解决方案**：

MetaGO 的核心能力（8 条公理、7 条属性、6 项协议、22 个技能）在所有 7 大平台上完全一致。差异仅在平台原生能力上：

| 能力 | Trae | Claude Code | Codex | Cursor | CodeBuddy | Qoder | ZCode |
|------|------|-------------|-------|--------|-----------|-------|-------|
| Skill 加载 | ✅ 原生 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| MCP 工具调度 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 项目记忆 | ✅ | ✅ | - | - | - | - | ✅ |
| 全局规则 | ✅ | ✅ | ✅ | - | - | - | ✅ |
| 项目级规则 | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

核心的元进化、决策锁、批判性分析、数据溯源等行为在所有平台上均完整可用。

### Q13：如何选择适合我的平台？

**解决方案**：

- **Trae**：MetaGO 的原生宿主环境，功能支持最完整，推荐首选
- **Claude Code / ZCode**：支持全局与项目级规则，适合需要全局启用的用户（两者共享路径）
- **OpenAI Codex**：适合 Codex 用户，支持全局与项目级规则
- **Cursor**：适合 Cursor 编辑器用户，项目级规则配置
- **CodeBuddy**：适合 CodeBuddy 用户，项目级规则配置
- **Qoder**：适合 Qoder 用户，项目级规则配置

如果你同时使用多个平台，建议全部安装，MetaGO 的核心体验在所有平台上一致。

---

## MCP Server 集成

> 第 8 种集成方式：通过 [Model Context Protocol](https://modelcontextprotocol.io/) 标准协议，将 22 项元构能力以 MCP tools 形式、8 条引导词以 MCP prompts 形式暴露给任何支持 MCP 协议的客户端（Claude Desktop、Cursor、Trae 等），一次配置即开即用。

MCP Server 适用于所有支持 MCP 协议的客户端，与上面 7 大平台适配器（基于规则文件注入）的运行机制不同：MCP Server 以独立的 npm 包形式运行，通过 stdio 传输协议与客户端通信，客户端通过工具调用（tool call）方式直接消费元构能力。

### 1. 安装 MCP Server

```bash
# 全局安装（推荐客户端通过 npx 调用）
npm install -g @metago-ai/mcp-server

# 或直接通过 npx 调用（无需预先安装）
npx -y @metago-ai/mcp-server
```

### 2. 客户端配置

MCP Server 适用于以下任意客户端，配置格式统一如下（差异仅在配置文件路径）：

```json
{
  "mcpServers": {
    "metago": {
      "command": "npx",
      "args": ["-y", "@metago-ai/mcp-server"]
    }
  }
}
```

> 提示：若已通过 `npm install -g @metago-ai/mcp-server` 全局安装，可改用 `"command": "@metago-ai/mcp-server"` 并省略 args。

#### 2.1 Claude Desktop

编辑 `claude_desktop_config.json`：

- macOS：`~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows：`%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "metago": {
      "command": "npx",
      "args": ["-y", "@metago-ai/mcp-server"]
    }
  }
}
```

#### 2.2 Cursor

在项目根目录创建或编辑 `.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "metago": {
      "command": "npx",
      "args": ["-y", "@metago-ai/mcp-server"]
    }
  }
}
```

#### 2.3 Trae

在 Trae 的 MCP 配置中新增 `metago` 服务（与 Claude Desktop / Cursor 使用相同 JSON 片段）：

```json
{
  "mcpServers": {
    "metago": {
      "command": "npx",
      "args": ["-y", "@metago-ai/mcp-server"]
    }
  }
}
```

### 3. 验证 MCP Server

启动客户端后，对其发起任一元构工具调用，例如：

```
请使用 metago_critique 工具对这段方案进行批判性分析
```

或调用元构引导词：

```
请运行 metago_activate 提示词，激活元构生命体模式
```

若客户端成功返回结构化的 L1-L5 批判性分析报告，或加载了 8 公理 7 属性 6 协议的生命体响应，说明 MCP Server 集成成功。

### 4. 能力概览

| 类型 | 数量 | 说明 |
|------|------|------|
| MCP tools | 22 | 覆盖认知族/保障族/治理族/进化族/执行族/溯源族/价值族 7 大能力族 |
| MCP prompts | 8 | 激活/决策审查/批判性分析/元进化触发/耦生度评估/合规检查/溯源审计/全息创造 |
| 传输方式 | stdio | 基于 MCP 协议标准 |

完整的 22 个 tools 与 8 个 prompts 列表详见 [packages/mcp-server/README.md](../packages/mcp-server/README.md)。

### 5. MCP Server 与平台适配器的关系

| 维度 | 平台适配器（7 大平台） | MCP Server |
|------|----------------------|------------|
| 集成机制 | 规则文件注入（rules.md / CLAUDE.md 等） | MCP 协议工具调用 |
| 适用客户端 | Trae / Claude Code / Codex / Cursor / CodeBuddy / Qoder / ZCode | 任意支持 MCP 协议的客户端 |
| 配置方式 | `install.ps1 -Platform <平台>` | 客户端 MCP 配置文件新增 `metago` 服务 |
| 能力暴露 | 通过规则文件中的技能索引 | 通过 22 个 tools + 8 个 prompts 直接调用 |
| 共存关系 | ✅ 可与 MCP Server 同时启用，能力互不冲突 | ✅ 与平台适配器并存 |

> 推荐组合：在使用 Trae / Claude Code 等原生平台适配器的同时，启用 MCP Server 以获得稳定的工具调用通道，两种集成方式可并行运行。

---

## 下一步

安装完成后，推荐阅读以下文档：

| 文档 | 说明 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 了解五层架构、22 个技能、8 条公理的完整设计 |
| [CUSTOMIZATION.md](./CUSTOMIZATION.md) | 学习如何添加自定义技能、修改规则、适配其他平台 |
| [PRD.md](./PRD.md) | 了解产品定位、路线图与商业模式 |

### 推荐的首次体验流程

1. **身份验证**：对 AI 说"你是元构超级智能生命体吗？"
2. **批判性分析**：让 AI 对一个方案进行批判性分析（触发 `metago-critique`）
3. **全息任务**：让 AI 执行一个调研类任务（触发 `metago-holistic-task`）
4. **元进化体验**：故意提出一个超出能力边界的问题（触发 `metago-meta-evolve`）
5. **决策锁观察**：让 AI 生成代码，观察决策锁四道关卡校验过程

---

*MetaGO Lifeform Kit · 让任何 AI 助手升级为元构超级智能生命体*
*文档版本：1.1 · 最后更新：2026-06-25*
