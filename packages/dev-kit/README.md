# @metago-ai/dev-kit

> **MetaGO Dev Kit** — 开发者垂直场景包，复用 4 个核心能力 + 叠加 4 个开发专用技能。

[![License: MIT](https://img.shields.io/badge/License-MIT-green)](https://unpkg.com/@metago-ai/dev-kit/LICENSE)
[![Parent: metago-lifeform](https://img.shields.io/badge/Parent-metago--lifeform-36.7.5-blue)](https://www.npmjs.com/package/metago-lifeform)
[![Skills: 8](https://img.shields.io/badge/Skills-8_(4_reused_+_4_added)-success)](#技能清单)

---

## 这是什么？

**MetaGO Dev Kit** 是 [MetaGO Lifeform Kit](https://www.npmjs.com/package/metago-lifeform) 的垂直场景包之一，专门面向开发者。它复用 4 个核心元构能力（决策锁、批判性分析、事实核查、问题溯源），并叠加 4 个开发专用技能（深度代码审查、架构设计、重构建议、安全审计），让 智能体在开发场景中具备工程级能力。

| 维度 | 说明 |
|------|------|
| 包名 | `@metago-ai/dev-kit` |
| 版本 | v1.0.5 |
| 父包 | `metago-lifeform@>=36.7.5` |
| 包含技能 | 8 个（4 复用 + 4 新增） |
| 适用场景 | 代码审查、架构设计、技术债治理、安全审计 |
| 安装方式 | 通过父包 `metago-lifeform` 自动包含，无需独立安装 |

---

## 技能清单

### 复用的核心能力（4 个）

| 技能 | 来源 | 在 Dev Kit 中的作用 |
|------|------|---------------------|
| `metago-decision-lock` | Lifeform Kit | 强制校验代码审查/架构决策的输出 |
| `metago-critique` | Lifeform Kit | L1-L5 分级批判代码方案 |
| `metago-fact-check` | Lifeform Kit | 验证技术声明与依赖版本真实性 |
| `metago-problem-trace` | Lifeform Kit | 溯源 bug 根因，构建问题树 |

### 新增的开发专用技能（4 个）

| 技能 | 功能 | 关键能力 |
|------|------|----------|
| `metago-code-review-deep` | 深度代码审查 | 5 步流程（静态结构→逻辑正确性→安全漏洞→性能→可维护性）+ 4 级分级标准（Critical/Major/Minor/Info） |
| `metago-architecture-design` | 架构设计 | 5 步流程（需求分解→架构模式→模块分解→数据流→技术选型）+ 7 项架构原则 + ADR |
| `metago-refactor-suggest` | 重构建议 | 5 步流程（代码异味→复杂度量→依赖分析→重构机会→方案生成）+ 8 种代码异味 + 4 种复杂度量 |
| `metago-security-audit` | 安全审计 | OWASP Top 10 完整检查 + CVSS 评分 + 4 级漏洞等级 + A36 法律优先原则 |

---

## 使用方法

### 方式一：通过父包使用（推荐）

Dev Kit 是 `metago-lifeform` 的子包，安装父包即包含 Dev Kit 全部能力：

```bash
npm install -g metago-lifeform
metago-lifeform install --platform trae
```

安装后，在 Trae 中对 AI 说：

```
请使用 metago-code-review-deep 技能审查这段代码：
function add(a, b) { return a + b; }
```

```
请使用 metago-security-audit 技能审计这个项目，按 OWASP Top 10 检查。
```

### 方式二：单独查看技能列表

```bash
cd packages/dev-kit
npm run list
```

---

## 与其他产品的关系

Dev Kit 是 MetaGO 产品矩阵 A 线（垂直场景包）的第一个产品：

| 产品线 | 产品 | 状态 |
|--------|------|------|
| A 线 | **MetaGO Dev Kit**（本包） | ✅ v1.0.5 |
| A 线 | MetaGO Research Kit | 📋 规划中 |
| A 线 | MetaGO PM Kit | 📋 规划中 |
| A 线 | MetaGO Writer Kit | 📋 规划中 |
| B 线 | MetaGO MCP Server | ✅ v1.1.1 |
| B 线 | MetaGO CLI | 📋 规划中 |
| B 线 | MetaGO Studio | 📋 规划中 |

详见 [产品矩阵战略规划](https://gitee.com/metago/metagolifeform/raw/main/docs/STRATEGY.md)。

---

## 许可证

MIT License © 易霄 / MetaGO Lightyear — 详见 [LICENSE](https://unpkg.com/@metago-ai/dev-kit/LICENSE)

---

*Dev Kit — 让 智能体成为工程级开发伙伴。*
