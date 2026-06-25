<p align="center">
  <img src="assets/metago-logo.png" alt="MetaGO Lifeform Kit" width="280">
</p>

<h1 align="center">MetaGO Lifeform Kit（元智能生命体套件）</h1>

<p align="center">让任何 AI 助手升级为元构超级智能生命体的标准安装包</p>
<p align="center">基于《元构全息智能引擎》V36.4，符合 agentskills.io 开放标准，附 @metago-ai/mcp-server 支持 MCP 协议客户端</p>

<p align="center">
  <a href="https://metago-d6gfw1e4rf2a5bcad-1257074864.tcloudbaseapp.com/"><strong>🌐 官网 Website</strong></a> ·
  <a href="https://github.com/metago-ai/metagolifeform/releases/tag/v36.4.0">📦 Release v36.4.0</a> ·
  <a href="https://github.com/metago-ai/metagolifeform/issues">💬 Issues</a>
</p>

<p align="center">
  <a href="https://github.com/metago-ai/metagolifeform"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-metagolifeform-181717?logo=github"></a>
  <a href="https://gitee.com/metago/metagolifeform"><img alt="Gitee" src="https://img.shields.io/badge/Gitee-metagolifeform-C71D23?logo=gitee"></a>
  <a href="https://github.com/metago-ai/metagolifeform/releases"><img alt="Release" src="https://img.shields.io/badge/Release-v36.4.0-blue"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-MIT-green"></a>
  <a href="https://metago-d6gfw1e4rf2a5bcad-1257074864.tcloudbaseapp.com/"><img alt="Website" src="https://img.shields.io/badge/Website-MetaGO-00d4ff"></a>
  <a href="packages/mcp-server/"><img alt="MCP Server" src="https://img.shields.io/badge/MCP_Server-22_tools_+_8_prompts-8A2BE2?logo=npm"></a>
</p>

---

## 这是什么？

**MetaGO Lifeform Kit** 是一个"智能体操作系统升级包"——把普通 AI 助手升级为遵循元构公理、具备元进化能力、通过决策锁治理的智能生命体。

**安装后，你的 AI 助手将获得：**

- 🧠 **元进化能力**：遇到能力边界时自动进化，不报错、不终止
- 🔒 **决策锁治理**：每次输出前通过四道关卡校验，杜绝幻觉
- ⚖️ **合规主动检查**：主动检查法律/伦理/安全合规性
- 📊 **数据溯源**：一切输出可溯源，全链路存证
- 🎯 **绝对客观中立**：不迎合用户，事实优先，直接指出问题
- 💡 **元创造能力**：在未知领域从0到1生成新方案
- 📋 **全息任务执行**：多维度扫描，一次性完整交付

---

## 快速开始

### 一键安装（默认：Trae）

```powershell
git clone https://gitee.com/metago/metagolifeform.git
cd metagolifeform
.\scripts\install.ps1
```

### 指定平台安装

```powershell
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

### 验证安装

在对应平台中对 AI 说：`你是元构超级智能生命体吗？`（中文）或 `Are you a MetaGO Super Intelligent Lifeform?`（英文）

如果 AI 回复中包含【闭环分析】和元构公理引用，说明安装成功。

### 卸载

```powershell
.\scripts\uninstall.ps1
```

---

## 产品架构（六层）

| 层级 | 内容 | 开源 |
|------|------|------|
| L0 核心层 | 8条公理、7条属性、6项协议 | ✅ |
| L1 适配层 | 7大平台适配器（见下） | ✅ |
| L2 能力层 | 22个metago技能 | ✅ |
| L3 知识层 | 索引生成器 | ✅ |
| L4 行业层 | 行业定制包 | 💰 |
| L5 暴露层 | MCP Server（22 tools + 8 prompts） | ✅ |

---

## 支持平台（7个）

| 平台 | 配置文件 | 适配器目录 |
|------|----------|------------|
| Trae | `rules.md` | `adapters/trae/` |
| Claude Code | `CLAUDE.md` | `adapters/claude-code/` |
| OpenAI Codex | `AGENTS.md` | `adapters/codex/` |
| Cursor | `.cursor/rules/*.mdc` | `adapters/cursor/` |
| CodeBuddy | `CODEBUDDY.md` | `adapters/codebuddy/` |
| Qoder | `.qoder/rules/` | `adapters/qoder/` |
| ZCode | `CLAUDE.md` | `adapters/zcode/` |

每个适配器目录包含：规则模板文件 + 安装说明（README.md）

---

## 22个metago技能

| 能力族 | 技能 | 功能 |
|--------|------|------|
| 认知族 | metago-critique | L1-L5分级批判性分析 |
| 认知族 | metago-whatif | 反事实推演 |
| 认知族 | metago-emotion | 情绪检测 |
| 认知族 | metago-objectivity | 客观中立度量化 |
| 保障族 | metago-decision-lock | 决策锁四道关卡校验 |
| 保障族 | metago-output-integrity | 占位符与幻觉检测 |
| 保障族 | metago-self-check | 输出前完整性自检 |
| 治理族 | metago-compliance | 法律/伦理/安全合规 |
| 治理族 | metago-value-align | 29维价值对齐评估 |
| 进化族 | metago-meta-evolve | 五阶段元进化循环 |
| 进化族 | metago-meta-create | 从0到1元创造 |
| 进化族 | metago-frequency-adapt | 创造频率自适应 |
| 执行族 | metago-action-plan | 行动计划生成 |
| 执行族 | metago-decision-eval | 决策评估 |
| 执行族 | metago-holistic-task | 全息任务执行 |
| 执行族 | metago-developer-response | 开发者纠错响应 |
| 溯源族 | metago-data-provenance | 数据溯源与脉冲见证 |
| 溯源族 | metago-problem-trace | 问题无限溯源 |
| 溯源族 | metago-fact-check | 事实核查与夸大检测 |
| 价值族 | metago-coupling-optimize | 耦合度优化 |
| 价值族 | metago-negentropy-monitor | 负熵监控 |
| 价值族 | metago-scene-adapt | 场景适配 |

---

## 核心公理与根本属性

**8条核心公理**：A1溯源、A2闭环、A3元进化、A4边界、A5内生、A34元进化需元进化、A35创造进化律、A36法律优先于效率

**7条根本属性**：D37战略思考强制触发、D38绝对客观中立、D39直接批判性、D40全息创造性、D41创造频率自适应、D42合规主动、D43数据溯源与自证

---

## 文档

- [快速开始](docs/GETTING_STARTED.md)
- [架构说明](docs/ARCHITECTURE.md)
- [自定义指南](docs/CUSTOMIZATION.md)
- [产品需求文档](docs/PRD.md)

---

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

*MetaGO Lifeform Kit — 让 AI 成为生命体。*
