﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿# MetaGO 产品矩阵战略规划

> **文档地位**：本规划是 MetaGO 全部产品演进的最高指导纲领，所有 PRD、版本计划、产品决策必须以本规划为准。
>
> **文档版本**：v1.1
> **最后更新**：2026-07-05
> **文档所有者**：易霄 / MetaGO Lightyear
> **保存要求**：本规划必须落盘保存，对话压缩不可丢失；后续生成的任何文档必须同样落盘保存，不能遗漏一个字。

---

## 0. 战略定位

把"元构能力引擎"从 **Kit（套件）** → **产品矩阵（多个独立产品）** → **生态（开放市场）**。

| 阶段 | 形态 | 时间 | 状态 |
|------|------|------|------|
| **Kit 阶段** | 单一 npm 包 `metago-lifeform`，覆盖 39 项元构能力 + 7 大平台适配器 | 已完成 v36.3.0 → v36.7.13 | ✅ |
| **产品矩阵阶段** | 按用户场景拆分多条产品线，每个产品独立版本、独立发布、独立演进 | 2026 Q3 进行中 | 🚧 |
| **生态阶段** | 第三方技能接入 + 认证体系 + 社区生态 | 2027 Q1+ | 📋 |

---

## 1. 四层产品思考

产品矩阵不是"功能的简单堆叠"，而是基于"元构生命体"的哲学分层。

| 层次 | 名称 | 核心命题 | 对应产品 |
|------|------|----------|----------|
| **L1** | **本体论** | "MetaGO 是什么"——定义元构生命体的本质与边界 | Agent Harness 根包、MCP Server |
| **L2** | **进化论** | "MetaGO 如何生长"——定义能力进化的路径与机制 | CLI、Skills SDK |
| **L3** | **能力论** | "MetaGO 能做什么"——按场景拆分能力，覆盖角色工作流 | Dev Kit、Research Kit、PM Kit、Writer Kit |
| **L4** | **工业论** | "MetaGO 如何被生产与流通"——工业化、市场化、生态化 | Studio、Certify |

**演化逻辑**：L1（确立本质）→ L2（建立通道）→ L3（场景渗透）→ L4（生态闭环）。每一层都是前一层的"元能力"。

---

## 2. 产品矩阵全景图（4 产品线 × 13 产品）

### A 线：垂直场景包（Vertical Kits）

面向特定角色/场景的能力增强包，复用核心能力（39 项 metago-* 技能）并叠加行业专属技能。

| 产品 | 目标用户 | 定位 | 状态 |
|------|----------|------|------|
| **MetaGO Dev Kit** | 开发者 | 开发场景能力增强（深度代码审查、架构设计、重构建议、安全审计） | 🚧 进行中（第 2 阶段） |
| MetaGO Research Kit | 研究者 | 学术研究能力增强（文献综述、假设检验、实验设计、论文审稿） | 📋 规划中 |
| MetaGO PM Kit | 产品经理 | 产品工作能力增强（需求拆解、PRD 评审、用户调研、竞品分析） | 📋 规划中 |
| MetaGO Writer Kit | 内容创作者 | 写作场景能力增强（深度报道、技术文档、创意写作、内容审核） | 📋 规划中 |

### B 线：平台工具（Platform Tools）

平台能力暴露与可视化编排，让元构能力可以被"工程化调用"。

| 产品 | 形态 | 定位 | 状态 |
|------|------|------|------|
| **MetaGO MCP Server** | npm 包（MCP 协议） | 把 39 项元构能力封装为 MCP 工具，任意 MCP 客户端即开即用 | ✅ 已发布 v1.1.8 |
| MetaGO CLI | 命令行工具 | 跨平台命令行调用元构能力，CI/CD 集成 | 📋 规划中（第 3 阶段） |
| MetaGO Studio | 桌面/Web 应用 | 可视化技能编排、调试、性能分析、流程可视化 | 📋 规划中（第 3 阶段 MVP） |
| **MetaGO Verify Kit** | npm 包（交付质量验证） | 交付前原子验证门控工具包，tsc/build/HTTP/AI对话三层验证 | ✅ 已发布 v1.0.0 |

### C 线：终端用户产品（End-user Products）

面向非技术用户的端到端产品，把元构能力封装为"开箱即用的应用"。

| 产品 | 形态 | 定位 | 状态 |
|------|------|------|------|
| MetaGO Copilot | 桌面助手 | 内置元构能力的桌面智能体，覆盖日常任务 | 📋 规划中 |
| MetaGO Chat | Web 对话产品 | 基于元构生命体的对话产品，含决策锁与溯源 | 📋 规划中 |
| MetaGO Agent Cloud | 云端智能体 | 托管式元构智能体云服务，按量付费 | 📋 规划中 |

### D 线：生态基础设施（Ecosystem Infrastructure）

支撑生态繁荣的底层基础设施。

| 产品 | 形态 | 定位 | 状态 |
|------|------|------|------|
| MetaGO Skills SDK | npm/Python 包 | 技能开发框架，让第三方编写自己的 SKILL.md | 📋 规划中（第 4 阶段） |
| MetaGO Certify | 认证服务 | 元构工程师认证、企业能力认证 | 📋 规划中（第 4 阶段） |

---

## 3. 第一阶段优先级（Top 3）

按"价值密度 × 实施成本 × 受众规模"三维评估，第一阶段聚焦 3 个产品：

| 优先级 | 产品 | 理由 | 状态 |
|--------|------|------|------|
| 🥇 | **MetaGO MCP Server** | 零侵入、标准协议、覆盖最广、复用现有 39 技能 | ✅ 已完成（v1.1.8） |
| 🥈 | **MetaGO Dev Kit** | 复用核心能力、面向开发者（高密度用户群）、技术易实现 | 🚧 进行中 |
| 🥉 | **MetaGO CLI** | 与 Dev Kit 协同，覆盖 CI/CD 与自动化场景，跨平台基础 | 📋 规划中 |

---

## 4. 执行路线图

### 第 1 阶段（0-2 周）：MCP Server 上线 ✅

**目标**：把元构能力以标准协议暴露给任意 MCP 客户端。

- [x] `@metago-ai/mcp-server` v1.1.8 发布到 npm
- [x] 37 个 MCP tools（映射 39 项元构技能：22 核心技能 + 20 独有思维工具 - 7 同名合并 + 2 工程质量族）
- [x] 8 个 MCP prompts（激活/决策审查/批判分析/元进化触发/耦生度评估/合规检查/溯源审计/全息创造）
- [x] stdio 传输，零配置接入
- [x] Claude Desktop / Cursor / Trae 三种客户端配置示例
- [x] TypeScript strict 模式构建产物 `dist/index.js`

### 第 2 阶段（2-4 周）：Dev Kit 发布 🚧

**目标**：发布开发者垂直场景包，验证"垂直 Kit"产品形态。

#### Week 3：开发 4 个开发专用技能

- [x] `metago-code-review-deep`（深度代码审查：5 步流程 + 4 级分级标准）
- [x] `metago-architecture-design`（架构设计：5 步流程 + 7 项架构原则 + ADR）
- [x] `metago-refactor-suggest`（重构建议：5 步流程 + 8 种代码异味 + 4 种复杂度量）
- [x] `metago-security-audit`（安全审计：OWASP Top 10 + CVSS 评分）
- [x] 复用 4 个通用技能：`metago-decision-lock`、`metago-critique`、`metago-fact-check`、`metago-problem-trace`

#### Week 4：Dev Kit 发布 + 独立仓库

- [ ] 创建 `packages/dev-kit/` 包结构（README.md + package.json）
- [ ] 更新根包 `package.json`（metago.skills 22 → 26）
- [ ] 更新 `scripts/cli.js` VERSION 常量
- [ ] 更新 README.md（技能表 22 → 26、新增 Dev Kit 章节）
- [ ] 发布 `metago-lifeform@36.4.14`（含 Dev Kit）
- [ ] 同步 Gitee + GitHub
- [ ] 建立独立 Gitee/GitHub 仓库 `metago-dev-kit`（作为独立 npm 包 `@metago-ai/dev-kit` 发布）

### 第 3 阶段（4-8 周）：CLI + Studio MVP

#### MetaGO CLI

- 独立的命令行工具，不依赖 PowerShell
- 支持子命令：`metago critique "<content>"`、`metago fact-check "<claim>"`、`metago review <file>`、`metago audit <dir>` 等
- 输出格式：JSON / 文本 / SARIF（安全审计专用）
- CI/CD 集成：GitHub Action / GitLab CI 模板
- 跨平台：Windows / macOS / Linux
- 包名：`@metago-ai/cli`

#### MetaGO Studio MVP

- 形态：Electron 桌面应用 或 Web 应用（MVP 阶段优先选 Web，部署成本低）
- 核心功能（MVP 聚焦"可视化编排"单点）：
  - 可视化技能编排（拖拽组合技能形成工作流）
  - 调试工具（输入/输出可视化、中间状态查看）
  - 性能分析（技能激活率、执行耗时、决策锁通过率）
- 商业模式：免费个人版 + 付费团队版

### 第 4 阶段（8-12 周）：Skills SDK + Certify

#### MetaGO Skills SDK

- TypeScript SDK：`@metago-ai/skills-sdk`
- Python SDK：`metago-skills`
- 核心 API：`defineSkill()`、`registerSkill()`、`runSkill()`、`validateSkill()`
- 内置元构公理校验（开发时自动校验 SKILL.md 格式与合规性）
- CLI 工具：`metago-skills init`、`metago-skills build`、`metago-skills publish`

#### MetaGO Certify

- 元构工程师认证（个人）：
  - Level 1：MetaGO Practitioner（了解公理、能使用技能）
  - Level 2：MetaGO Engineer（能开发技能、能定制行业包）
  - Level 3：MetaGO Architect（能设计产品矩阵、能架构生态）
- 企业能力认证（团队）：MetaGO Ready / MetaGO Pro / MetaGO Enterprise

---

## 5. 商业模式

| 产品线 | 开源/付费 | 商业模式 | 关键付费点 |
|--------|-----------|----------|------------|
| **A 线**（垂直场景包） | 核心开源 + 行业付费 | 免费 + 行业包收费 | 金融/医疗/法律行业规则 |
| **B 线**（平台工具） | MCP/CLI 开源，Studio 付费 | 工具免费 + 高级功能订阅 | Studio 团队协作、性能分析 |
| **C 线**（终端产品） | 免费增值 | 个人免费 + 企业付费 | Agent Cloud 按量付费 |
| **D 线**（生态基础设施） | SDK 开源，Certify 付费 | 认证收费 | 认证费 |

**收入预测**：

| 阶段 | 时间 | 月收入预估 | 主要来源 |
|------|------|-----------|----------|
| 第 1-2 阶段完成 | 2026 Q3 | ¥10K | 认证费 + 早期 Studio 订阅 |
| 第 3 阶段完成 | 2026 Q4 | ¥100K | Enterprise + Studio |
| 第 4 阶段完成 | 2027 Q2 | ¥1M | Enterprise + Cloud + Industry |
| 生态化 | 2027 Q4 | ¥10M+ | Agent Cloud + 企业认证 + 生态合作 |

---

## 6. 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|------|------|------|------|
| Dev Kit 技能与现有技能边界模糊 | 中 | 中 | 严格命名 `metago-*-deep/design` 区分通用与垂直；在 SKILL.md 中明确"复用"与"新增"标注 |
| CLI 与 PowerShell 脚本功能重叠 | 高 | 低 | CLI 走跨平台 Node.js 路线，PowerShell 仅做平台规则注入；CLI 是"调用能力"，PowerShell 是"安装能力" |
| Studio 开发周期长 | 高 | 高 | MVP 聚焦"可视化编排"单点，避免大而全；先 Web 后桌面 |
| 用户混淆 Agent Harness 与 Dev Kit | 中 | 中 | 文档明确：Kit 是根包（含全部技能），Dev Kit 是子包（仅含开发技能）；可独立安装 Dev Kit |
| 跨产品线技术栈碎片化 | 中 | 中 | 统一 TypeScript 主语言；MCP 协议作为产品间通信标准 |

---

## 7. 验收指标

| 阶段 | 关键指标 | 目标值 |
|------|----------|--------|
| 第 1 阶段完成 | MCP Server npm 周下载量 | ≥ 100 |
| 第 2 阶段完成 | Dev Kit 独立仓库 Star + npm 周下载 | ≥ 50 Star / ≥ 200 下载 |
| 第 3 阶段完成 | CLI 周下载量 + Studio 注册用户 | ≥ 500 下载 / ≥ 100 用户 |
| 第 4 阶段完成 | 认证人数 + SDK 集成项目数 | ≥ 50 认证 / ≥ 20 集成 |

---

## 8. 文档治理

本规划是 MetaGO 全部产品演进的**最高指导纲领**：

- 所有 PRD、版本计划、产品决策必须以本规划为准
- 本规划变更需走"战略评审"流程（所有者 + 核心团队）
- 本规划必须落盘保存，对话压缩不可丢失
- 后续生成的任何文档必须同样落盘保存，不能遗漏一个字
- 执行进度通过 [docs/STRATEGY-EXECUTION-LOG.md](STRATEGY-EXECUTION-LOG.md) 追踪

---

*文档结束。本规划自 2026-06-26 起生效，2026-07-05 更新（技能数 22 → 39，MCP tools 22 → 37，新增 Verify Kit，MCP Server v1.1.8，根包 v36.7.13），作为 MetaGO 产品矩阵演进的指导纲领。*
