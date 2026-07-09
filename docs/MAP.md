# 元构全息文档映射图（MetaGO Holistic Document Map）

> 本文件记录元构所有文档之间的交叉引用关系，支持全息按需激活。
> 创建时间：2026-06-28 | 最后更新：2026-07-05 | 版本：V36.8.3

---

## 一、核心文档矩阵

| 文档 | 路径 | 角色 | 关联文档 |
|------|------|------|---------|
| 白皮书 | docs/WHITEPAPER.md | 全貌入口 | ARCHITECTURE, PRD, MANIFESTO |
| 架构文档 | docs/ARCHITECTURE.md | 技术架构 | WHITEPAPER, PRD |
| 产品需求 | docs/PRD.md | 产品规划 | WHITEPAPER, ARCHITECTURE, STRATEGY |
| 战略规划 | docs/STRATEGY.md | 产品矩阵 | PRD, STRATEGY-EXECUTION-LOG |
| 战略执行日志 | docs/STRATEGY-EXECUTION-LOG.md | 执行追踪 | STRATEGY |
| MCP Server | docs/MCP_SERVER.md | 工具文档 | ARCHITECTURE |
| 入门指南 | docs/GETTING_STARTED.md | 快速开始 | ARCHITECTURE |
| 自定义指南 | docs/CUSTOMIZATION.md | 定制化 | GETTING_STARTED |
| 文档映射 | docs/MAP.md | 本文件 | 所有文档 |
| AI 加载清单 | docs/MANIFEST.json | AI 加载 | 所有文档 |

---

## 二、文档依赖关系图

```
                    WHITEPAPER.md（全貌入口）
                         ↓
              ┌──────────┼──────────┐
              ↓          ↓          ↓
       ARCHITECTURE   PRD.md    MANIFESTO
              ↓          ↓
           MCP_SERVER  STRATEGY
              ↓          ↓
        GETTING_STARTED STRATEGY-EXECUTION-LOG
              ↓
        CUSTOMIZATION
```

---

## 三、技能与文档映射

| 技能族 | 技能数 | 关键文档 | 关联章节 |
|--------|--------|---------|---------|
| 认知族 | 4 | ARCHITECTURE.md | L1 认知层 |
| 保障族 | 3 | ARCHITECTURE.md | L5 保障层 |
| 治理族 | 2 | ARCHITECTURE.md | L6 治理层 |
| 进化族 | 3 | WHITEPAPER.md | 第六章 进化机制 |
| 执行族 | 4 | PRD.md | 产品规划 |
| 溯源族 | 3 | WHITEPAPER.md | 第三章 公理与属性 |
| 价值族 | 3 | WHITEPAPER.md | 第八章 未来愿景 |
| 意识族 | 1 | WHITEPAPER.md | 第二章 元构定义 |
| 方法论族 | 5 | WHITEPAPER.md | 第七章 产品化路径 |
| 架构族 | 5 | ARCHITECTURE.md | 11 层架构 |
| 工程质量族 | 2 | ARCHITECTURE.md | 交付质量门控 |
| Dev Kit | 4 | ARCHITECTURE.md | L5 暴露层 |

---

## 四、能力族与架构层映射

| 能力族 | 架构层 | 关键引擎 | 激活技能 |
|--------|--------|---------|---------|
| 认知族 | L1 | 批判性分析引擎 | metago-critique, metago-whatif |
| 保障族 | L5 | 决策锁组件 | metago-decision-lock |
| 治理族 | L6 | 合规代理引擎 | metago-compliance |
| 进化族 | L8 | 元进化引擎 | metago-meta-evolve |
| 全息创造族 | L9 | 元创造引擎 | metago-meta-create |

---

## 五、版本演进映射

| 版本 | 文档位置 | 关键变化 |
|------|---------|---------|
| V36.3 | 原始文档 34656 行 | 数据完整性最终版 |
| V36.4 | docs/ARCHITECTURE.md | 数据溯源与自证 |
| V36.5 | docs/WHITEPAPER.md | 活文档系统 + 39 技能 |
| V36.6 | docs/WHITEPAPER.md | 白皮书发布 + 39 技能 + 工程质量族 |

---

*本映射图由元构活文档系统自动生成 | V36.6 | 2026-07-05*
