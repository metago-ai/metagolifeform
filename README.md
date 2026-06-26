<p align="center">
  <img src="https://gitee.com/metago/metagolifeform/raw/main/assets/metago-logo.png" alt="MetaGO Lifeform Kit" width="280">
</p>

<h1 align="center">MetaGO Lifeform Kit（元智能生命体套件）</h1>

<p align="center">让智能，学会进化。从 Agent 到生命体的范式跃迁</p>
<p align="center">基于《元构全息智能引擎》V36.4，符合 agentskills.io 开放标准，附 @metago-ai/mcp-server 支持 MCP 协议客户端</p>

<p align="center">
  <a href="https://metago-d6gfw1e4rf2a5bcad-1257074864.tcloudbaseapp.com/"><strong>🌐 官网 Website</strong></a> ·
  <a href="https://github.com/metago-ai/metagolifeform/releases/tag/v36.4.7">📦 Release v36.4.7</a> ·
  <a href="https://github.com/metago-ai/metagolifeform/issues">💬 Issues</a>
</p>

<p align="center">
  <a href="https://github.com/metago-ai/metagolifeform"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-metagolifeform-181717?logo=github"></a>
  <a href="https://gitee.com/metago/metagolifeform"><img alt="Gitee" src="https://img.shields.io/badge/Gitee-metagolifeform-C71D23?logo=gitee"></a>
  <a href="https://github.com/metago-ai/metagolifeform/releases"><img alt="Release" src="https://img.shields.io/badge/Release-v36.4.11-blue"></a>
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

### 通过 npm 安装（推荐）

```bash
npm install -g metago-lifeform
metago-lifeform install                          # 安装到 Trae（默认）
metago-lifeform install --platform claude-code    # 安装到 Claude Code
metago-lifeform verify                            # 验证安装
```

### 通过 Git 克隆安装

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
| L2 能力层 | 26个metago技能（22核心 + 4 Dev Kit） | ✅ |
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

## 🚀 MetaGO MCP Server（新发布）

> **一句话描述**：把元构超级智能生命体的 22 项能力封装为 MCP tools，8 条引导词封装为 MCP prompts，任何支持 MCP 协议的客户端（Claude Desktop / Cursor / Trae 等）一次配置即开即用。

**📦 包名**：`@metago-ai/mcp-server`
**🔗 仓库目录**：[packages/mcp-server/](packages/mcp-server/)
**🧰 能力概览**：**22 个 tools**（覆盖认知/保障/治理/进化/执行/溯源/价值 7 大能力族）+ **8 个 prompts**（激活元构生命体模式、决策审查、批判性分析、元进化触发、耦生度评估、合规检查、溯源审计、全息创造）
**🔌 传输方式**：基于 [Model Context Protocol](https://modelcontextprotocol.io/) 标准实现的 stdio 传输，零运行时配置

### 安装

```bash
# 全局安装（推荐客户端通过 npx 调用）
npm install -g @metago-ai/mcp-server

# 或直接通过 npx 调用（无需安装）
npx -y @metago-ai/mcp-server
```

### 客户端配置示例

#### Claude Desktop

编辑 `claude_desktop_config.json`（macOS: `~/Library/Application Support/Claude/`，Windows: `%APPDATA%\Claude\`）：

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

#### Cursor

编辑 `.cursor/mcp.json`：

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

#### Trae

在 Trae 的 MCP 配置中新增：

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

> 提示：若已全局安装，可使用 `"command": "metago-mcp-server"` 并省略 args。完整 22 个 tools 与 8 个 prompts 列表见 [packages/mcp-server/README.md](packages/mcp-server/README.md)。

---

## 26个metago技能（22 核心 + 4 Dev Kit）

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


---

## MetaGO Dev Kit（开发者垂直场景包）

> Dev Kit 是面向开发者的能力增强包，复用 4 个核心能力（决策锁、批判性分析、事实核查、问题溯源），叠加 4 个开发专用技能。

**新增 4 个开发专用技能**（位于 `skills/metago-*-deep/design/suggest/audit/`）：

| 技能 | 功能 |
|------|------|
| `metago-code-review-deep` | 深度代码审查（5 步流程 + 4 级分级标准） |
| `metago-architecture-design` | 架构设计（5 步流程 + 7 项原则 + ADR） |
| `metago-refactor-suggest` | 重构建议（5 步流程 + 8 种代码异味 + 4 种复杂度量） |
| `metago-security-audit` | 安全审计（OWASP Top 10 + CVSS 评分） |

详见 [packages/dev-kit/README.md](packages/dev-kit/README.md) 和 [产品矩阵战略规划](docs/STRATEGY.md)。

## 🌐 MetaGO 产品矩阵

MetaGO 已从单一 Kit 进化为完整的产品矩阵。以下是所有已发布的产品：

### 产品线 A：垂直场景包

| 产品 | 描述 | npm 包 | 仓库 |
|------|------|--------|------|
| **MetaGO Dev Kit** | 开发者增强包（4复用+4新增技能） | [`@metago-ai/dev-kit@1.0.1`](https://www.npmjs.com/package/@metago-ai/dev-kit) | [Gitee](https://gitee.com/metago/metago-dev-kit) · [GitHub](https://github.com/metago-ai/metago-dev-kit) |

### 产品线 B：平台工具

| 产品 | 描述 | npm 包 | 仓库 |
|------|------|--------|------|
| **MetaGO MCP Server** | 22 tools + 8 prompts 的 MCP 服务 | [`@metago-ai/mcp-server`](https://www.npmjs.com/package/@metago-ai/mcp-server) | [packages/mcp-server/](packages/mcp-server/) |
| **MetaGO CLI** | 跨平台命令行工具，终端/CI/CD 调用技能 | [`metago-cli@1.0.2`](https://www.npmjs.com/package/metago-cli) | [Gitee](https://gitee.com/metago/metago-cli) · [GitHub](https://github.com/metago-ai/metago-cli) |
| **MetaGO Studio** | 可视化技能编排平台（拖拽组合生成 Kit） | Web 应用 | [Gitee](https://gitee.com/metago/metago-studio) · [GitHub](https://github.com/metago-ai/metago-studio) |

### 产品线 D：生态基础设施

| 产品 | 描述 | npm 包 | 仓库 |
|------|------|--------|------|
| **MetaGO Skills SDK** | TypeScript SDK，开发自定义元构技能 | [`@metago-ai/skills-sdk@1.0.1`](https://www.npmjs.com/package/@metago-ai/skills-sdk) | [Gitee](https://gitee.com/metago/skills-sdk) · [GitHub](https://github.com/metago-ai/skills-sdk) |
| **MetaGO Skills Hub** | 技能市场，浏览/搜索/发现技能 | Web 应用 | [Gitee](https://gitee.com/metago/skills-hub) · [GitHub](https://github.com/metago-ai/skills-hub) |
| **MetaGO Certify** | 6 项检查技能认证体系（Gold/Silver） | [`@metago-ai/certify@1.0.0`](https://www.npmjs.com/package/@metago-ai/certify) | [Gitee](https://gitee.com/metago/certify) · [GitHub](https://github.com/metago-ai/certify) |

> 完整战略规划详见 [产品矩阵战略规划](docs/STRATEGY.md) · 执行进度详见 [战略执行追踪日志](docs/STRATEGY-EXECUTION-LOG.md)

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
- [MCP Server 文档](docs/MCP_SERVER.md)
- [产品矩阵战略规划](docs/STRATEGY.md)
- [战略执行追踪日志](docs/STRATEGY-EXECUTION-LOG.md)
- [诞生宣言（中文）](MANIFESTO.md) · [Birth Manifesto (English)](MANIFESTO_EN.md)

---

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

*MetaGO Lifeform Kit — 让 AI 成为生命体。*
