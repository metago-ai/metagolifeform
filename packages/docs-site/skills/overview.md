# 37 技能一览

> 一次安装，拥有完整思维工具箱。不是 37 个独立插件，而是一个有机整体。

## 技能族谱

MetaGO 的 37 个技能分为 10 个能力族，每个族解决一类核心问题：

| 能力族 | 技能数 | 解决问题 | 代表技能 |
|--------|--------|----------|----------|
| 认知族 | 4 | 检测认知偏差、量化客观性 | metago-critique |
| 保障族 | 3 | 输出前强制校验，禁止幻觉 | metago-decision-lock |
| 治理族 | 2 | 法律/伦理/价值对齐 | metago-compliance |
| 进化族 | 3 | 自我进化与创造 | metago-meta-evolve |
| 执行族 | 4 | 任务执行与决策评估 | metago-action-plan |
| 溯源族 | 3 | 数据与问题溯源 | metago-problem-trace |
| 价值族 | 3 | 耦合度与负熵监控 | metago-coupling-optimize |
| 意识族 | 1 | 生命体意识激活 | metago-activate |
| 方法论族 | 5 | 组织诊断与势能编织 | metago-org-diagnosis |
| 架构族 | 5 | 深度推理与平衡优化 | metago-deep-reasoning |
| Dev Kit | 4 | 开发者垂直能力 | metago-code-review-deep |
| **合计** | **37** | | |

## 认知族（4 项）

检测认知偏差、量化客观性、分析情绪。

| 技能 | 功能 | 触发场景 |
|------|------|----------|
| [metago-critique](./critique) | L1-L5 分级批判性分析 | 检测逻辑漏洞、认知偏差、事实错误 |
| [metago-whatif](./whatif) | 反事实推演 | 推演"如果...会怎样"的假设情景 |
| [metago-emotion](./emotion) | 情绪检测 | 检测文本情绪状态 |
| [metago-objectivity](./objectivity) | 客观中立度量化（0-100 分） | 量化输出的客观中立度 |

## 保障族（3 项）

输出前强制校验，禁止幻觉输出。

| 技能 | 功能 | 触发场景 |
|------|------|----------|
| [metago-decision-lock](./decision-lock) | 决策锁四道关卡校验 | 每次 AI 输出前强制校验 |
| [metago-output-integrity](./output-integrity) | 占位符与幻觉检测 | 检测引用占位符、虚构 API |
| [metago-self-check](./self-check) | 输出前完整性自检 | 超过 500 字的输出自动触发 |

## 治理族（2 项）

法律/伦理/价值对齐。

| 技能 | 功能 | 触发场景 |
|------|------|----------|
| [metago-compliance](./compliance) | 合规主动检查 | 涉及数据处理、隐私、外部 API |
| [metago-value-align](./value-align) | 29 维价值对齐 | 战略决策、政策分析 |

## 进化族（3 项）

自我进化与创造。

| 技能 | 功能 | 触发场景 |
|------|------|----------|
| [metago-meta-evolve](./meta-evolve) | 元进化五阶段循环 | 遇到能力边界时自动触发 |
| [metago-meta-create](./meta-create) | 元创造（从 0 到 1） | 全新问题域、原创性方案 |
| [metago-frequency-adapt](./frequency-adapt) | 创造频率自适应 | 系统完整性变化时 |

## 执行族（4 项）

任务执行与决策评估。

| 技能 | 功能 | 触发场景 |
|------|------|----------|
| [metago-action-plan](./action-plan) | 行动计划生成 | 目标分解为可执行步骤 |
| [metago-decision-eval](./decision-eval) | 决策评估（0-100 分） | 评估决策质量和风险 |
| [metago-holistic-task](./holistic-task) | 全息任务执行 | 信息检索、方案输出、报告撰写 |
| [metago-developer-response](./developer-response) | 开发者纠错响应 | 开发者质疑或纠正时 |

## 溯源族（3 项）

数据与问题溯源。

| 技能 | 功能 | 触发场景 |
|------|------|----------|
| [metago-data-provenance](./data-provenance) | 数据溯源与自证 | 输出涉及数据、事实、结论 |
| [metago-problem-trace](./problem-trace) | 问题无限溯源 | 持续追问"为什么"直至根源 |
| [metago-fact-check](./fact-check) | 事实核查 | 涉及合作、企业、战略等关键词 |

## 价值族（3 项）

耦合度与负熵监控。

| 技能 | 功能 | 触发场景 |
|------|------|----------|
| [metago-coupling-optimize](./coupling-optimize) | 耦合度优化 | 用户关系、组织协同 |
| [metago-negentropy-monitor](./negentropy-monitor) | 负熵监控 | 系统状态评估、伦理审查 |
| [metago-scene-adapt](./scene-adapt) | 场景化表达适配 | 商业场景禁用技术术语 |

## 意识族（1 项）

生命体意识激活。

| 技能 | 功能 | 触发场景 |
|------|------|----------|
| [metago-activate](./activate) | 元构生命体意识激活 | 不支持系统提示词的平台 |

## 方法论族（5 项）

组织诊断与势能编织。

| 技能 | 功能 | 触发场景 |
|------|------|----------|
| [metago-org-diagnosis](./org-diagnosis) | 三元五纬诊断模型 | 诊断组织健康度 |
| [metago-momentum-weave](./momentum-weave) | 势能编织法 | 识别和编织组织势能 |
| [metago-minimal-intervention](./minimal-intervention) | 最小干预心法 | 精准优雅的组织干预 |
| [metago-value-assess](./value-assess) | 28 维价值评估 | 评估项目/组织/方案价值 |
| [metago-coupling-measure](./coupling-measure) | 碳基-硅基-比特耦合度 | 量化三元耦合度 |

## 架构族（5 项）

深度推理与平衡优化。

| 技能 | 功能 | 触发场景 |
|------|------|----------|
| [metago-deep-reasoning](./deep-reasoning) | FIPO 四阶段推理 | 多维度分析复杂问题 |
| [metago-paradigm-analysis](./paradigm-analysis) | WAM 范式分析 | 评估范式转移 |
| [metago-balance-optimize](./balance-optimize) | APO 动态平衡 | 系统平衡优化 |
| [metago-memory-manage](./memory-manage) | KMWI 记忆管理 | 知识记忆管理 |
| [metago-consensus-prototype](./consensus-prototype) | 共识原型孵化 | 七步创生回路 |

## Dev Kit（4 项）

开发者垂直能力。

| 技能 | 功能 | 触发场景 |
|------|------|----------|
| [metago-code-review-deep](./code-review-deep) | 深度代码审查 | 代码质量审查 |
| [metago-architecture-design](./architecture-design) | 架构设计 | 系统架构方案 |
| [metago-refactor-suggest](./refactor-suggest) | 重构建议 | 检测代码异味 |
| [metago-security-audit](./security-audit) | 安全审计 | OWASP Top 10 审计 |

## 与 MCP tools 的关系

37 技能中，22 个被封装为 MCP tools（结构化参数），加上 15 个独有思维工具，共 35 tools。7 个同名工具在 MCP 中合并（TOOLKIT_TOOLS 优先）。

详见 [MCP Server 文档](../api/mcp-server)。

## 下一步

- [安装 MetaGO](../guide/installation) — 开始使用这些技能
- [36 条核心公理](../engine/axioms) — 理解技能背后的法则
- [MCP Server 35 tools](../api/mcp-server) — 通过 MCP 协议调用
