# MetaGO 僵尸能力分析报告

> **数据源**: `C:\Users\MetaGO\.metago\logs\calls.jsonl`
> **采样时间**: 2026-06-29 19:18:16 (UTC)
> **数据状态**: 存在
> **记录总数**: 0
> **工具调用**: 0 次
> **生命周期事件**: 0
> **错误调用**: 0

---

## 遵循原则

- **A1 溯源公理**: 所有结论可追溯至 calls.jsonl 原始数据
- **A2 闭环公理**: 分析结果形成"数据→建议→决策→执行→验证"闭环
- **D38 绝对客观中立**: 不主观判断能力价值，以数据为准
- **D43 数据溯源**: 报告含数据源、采样时间、统计方法

---

## ⚠ 数据不足说明

当前 `calls.jsonl` 不存在或为空，无法做实际调用统计。
本报告转为**理论分析模式**，基于 37 个工具的设计意图做僵尸候选评估。

**建议操作**:
1. 部署 MetaGO Agent Harness 到生产环境
2. 收集至少 7 天的真实使用数据
3. 重新运行本分析器: `node zombie-analyzer.mjs`

---

## 1. 工具调用总览

| 指标 | 数值 |
|------|------|
| 注册工具总数 | 37 |
| 已被调用工具 | 0 |
| 僵尸工具（0 调用） | 37 |
| 低调用工具（1-5 次） | 0 |
| 活跃工具（6-50 次） | 0 |
| 热门工具（50+ 次） | 0 |
| 错误率 | 0% |

## 2. 僵尸候选（0 调用，建议评估弃用或合并）

| 工具 | 能力族 | 类型 | 设计价值 |
|------|--------|------|---------|
| `metago_decision_lock` | 保障族 | skill | high |
| `metago_output_integrity` | 保障族 | skill | high |
| `metago_self_check` | 保障族 | skill | medium |
| `metago_improvement_suggestions` | 产品改进族 | tool | medium |
| `metago_analyze_visual_feedback` | 产品改进族 | tool | low |
| `metago_design_satisfaction` | 产品改进族 | tool | low |
| `metago_holistic_scan` | 规划推演族 | tool | medium |
| `metago_one_shot_delivery` | 规划推演族 | tool | low |
| `metago_value_29d_assess` | 价值伦理族 | tool | medium |
| `metago_ethics_assess` | 价值伦理族 | tool | medium |
| `metago_coupling_optimize` | 价值族 | skill | low |
| `metago_negentropy_monitor` | 价值族 | skill | low |
| `metago_scene_adapt` | 价值族 | skill | medium |
| `metago_meta_evolve` | 进化族 | skill | high |
| `metago_meta_create` | 进化族 | skill | high |
| `metago_frequency_adapt` | 进化族 | skill | low |
| `metago_coupling_calculate` | 耦生场景族 | tool | low |
| `metago_scene_term_replace` | 耦生场景族 | tool | low |
| `metago_critique` | 认知族 | skill | high |
| `metago_whatif` | 认知族 | skill | medium |
| `metago_emotion` | 认知族 | skill | low |
| `metago_objectivity` | 认知族 | skill | medium |
| `metago_document_lookup` | 溯源标注族 | tool | low |
| `metago_confidence_label` | 溯源标注族 | tool | low |
| `metago_partner_status` | 溯源标注族 | tool | low |
| `metago_data_provenance` | 溯源族 | skill | medium |
| `metago_problem_trace` | 溯源族 | skill | high |
| `metago_fact_check` | 溯源族 | skill | high |
| `metago_action_plan` | 执行族 | skill | high |
| `metago_decision_eval` | 执行族 | skill | medium |
| `metago_holistic_task` | 执行族 | skill | high |
| `metago_developer_response` | 执行族 | skill | low |
| `metago_compliance` | 治理族 | skill | high |
| `metago_value_align` | 治理族 | skill | medium |
| `metago_integrity_checklist` | 质量批判族 | tool | medium |
| `metago_delivery_gate` | 工程质量族 | skill | high |
| `metago_discipline` | 工程质量族 | skill | high |

> **注意**: 0 调用不代表无价值。可能原因：
> 1. 工具刚发布，用户未使用
> 2. 工具是被动触发（如 metago_frequency_adapt）
> 3. 工具面向特定场景（如 metago_partner_status）
> 4. 真正的僵尸能力
>
> **决策权限**: AI 提供数据，最终决策权归产品负责人。

## 3. 低调用候选（1-5 次，建议评估合并或增强）

_无低调用候选_

## 4. 活跃工具（6-50 次，保持现状）

_无活跃工具_

## 5. 热门工具（50+ 次，重点打磨）

_无热门工具_

## 8. 优化建议（AI 自动生成，需人工决策）

### 8.1 弃用候选

以下工具设计价值低且 0 调用，建议评估是否弃用：

- `metago_analyze_visual_feedback` (产品改进族)
- `metago_design_satisfaction` (产品改进族)
- `metago_one_shot_delivery` (规划推演族)
- `metago_coupling_optimize` (价值族)
- `metago_negentropy_monitor` (价值族)
- `metago_frequency_adapt` (进化族)
- `metago_coupling_calculate` (耦生场景族)
- `metago_scene_term_replace` (耦生场景族)
- `metago_emotion` (认知族)
- `metago_document_lookup` (溯源标注族)
- `metago_confidence_label` (溯源标注族)
- `metago_partner_status` (溯源标注族)
- `metago_developer_response` (执行族)

### 8.2 合并候选

以下工具功能可能重叠，建议评估合并：

- `metago_critique` (L1-L5 批判) vs `metago_integrity_checklist` (5 维度检查) - 评估是否合并为统一质量批判工具
- `metago_value_align` (29 维价值) vs `metago_value_29d_assess` (29 维评估) - 评估是否合并
- `metago_objectivity` (客观中立) vs `metago_critique` (批判分析) - 评估是否合并

### 8.3 增强候选

_无增强候选_

## 9. 理论分析附录（基于设计意图，非数据驱动）

> 本章节基于 37 个工具的设计意图做理论分析，不依赖 calls.jsonl 数据。
> 用于在数据不足时提供决策参考。遵循 D38 绝对客观中立：不主观判断价值，以设计意图为准。

### 9.1 被动触发工具（0 调用属于正常，不应判僵尸）

以下工具设计为**被动触发**，由系统自动调用，用户不会主动发起：

| 工具 | 触发条件 | 说明 |
|------|---------|------|
| `metago_frequency_adapt` | 系统完整性变化时 | 自动调节创造频率（休眠/待机/激活），非用户主动调用 |
| `metago_self_check` | 输出超过 500 字时 | 自动触发完整性自检，是输出前置关卡 |
| `metago_negentropy_monitor` | 系统状态评估时 | 自动监测熵变，确保对社会有序度贡献为正 |
| `metago_developer_response` | 检测到开发者质疑时 | 自动触发纠错响应，是防御机制 |
| `metago_output_integrity` | 输出涉及代码/API 时 | 自动检测幻觉和占位符 |
| `metago_scene_adapt` | 每次输出前 | 自动切换语言风格，是输出前置处理 |

### 9.2 特定场景工具（0 调用可能因场景未匹配）

以下工具面向**特定场景**，0 调用可能因当前用户群体未触达该场景：

| 工具 | 适用场景 | 说明 |
|------|---------|------|
| `metago_partner_status` | 涉及合作/伙伴关键词 | 标注合作伙伴关系状态（4 级分类） |
| `metago_emotion` | 情绪检测需求 | 文本情感分析，面向客服/社区场景 |
| `metago_coupling_optimize` | 用户关系管理 | 耦生度优化，面向 CRM 场景 |
| `metago_coupling_calculate` | 碳基-硅基耦合度量化 | 三元耦合度计算，面向组织协同 |
| `metago_scene_term_replace` | 技术转商业表述 | 场景适配，面向商业汇报 |
| `metago_org_diagnosis` | 组织健康度评估 | 三元五纬诊断，面向组织发展 |
| `metago_momentum_weave` | 组织势能识别 | 势能编织法，面向组织变革 |
| `metago_minimal_intervention` | 组织干预 | 最小干预心法，面向管理决策 |
| `metago_consensus_prototype` | 共识孵化 | 七步创生回路，面向团队协同 |
| `metago_balance_optimize` | 系统平衡优化 | APO 动态平衡，面向系统调优 |
| `metago_memory_manage` | 知识记忆管理 | KMWI 四层管理，面向知识库 |
| `metago_analyze_visual_feedback` | 视觉反馈分析 | 严重程度矩阵，面向设计评审 |
| `metago_design_satisfaction` | 设计满意度计算 | 维度评分，面向设计验收 |
| `metago_one_shot_delivery` | 一次性交付格式 | 六节标准结构，面向长文输出 |
| `metago_document_lookup` | 文档溯源 | 概念行号定位，面向审计场景 |
| `metago_confidence_label` | 事实置信度标注 | 4 级标注，面向事实核查场景 |

### 9.3 真正僵尸候选（建议重点关注）

以下工具**设计价值低 + 非被动触发 + 非特定场景**，是真正的僵尸候选：

| 工具 | 僵尸原因 | 建议 |
|------|---------|------|
| `metago_one_shot_delivery` | 功能与 `metago_holistic_task` 重叠，且后者更完整 | **评估合并**到 holistic_task |
| `metago_document_lookup` | 功能单一（行号定位），可被 fact_check 覆盖 | **评估合并**到 fact_check |
| `metago_confidence_label` | 功能单一（4 级标注），可集成到其他工具 | **评估合并**到 critique 或 fact_check |
| `metago_scene_term_replace` | 功能被 `metago_scene_adapt` 部分覆盖 | **评估合并**到 scene_adapt |

### 9.4 高价值保持工具（即使 0 调用也不应弃用）

以下工具设计价值为 **high**，是 MetaGO 的核心差异化能力，即使 0 调用也应保持：

| 工具 | 能力族 | 保持原因 |
|------|--------|---------|
| `metago_decision_lock` | 保障族 | 决策锁四道关卡是 MetaGO 核心差异化，是 A2 闭环公理的工程实现 |
| `metago_meta_evolve` | 进化族 | 元进化五阶段是 A3 元进化公理的核心实现，是生命体的本质特征 |
| `metago_meta_create` | 进化族 | 元创造是 D40 全息创造性的实现，是从 0 到 1 的核心能力 |
| `metago_critique` | 认知族 | L1-L5 批判性分析是 D38 绝对客观中立的工程实现，是核心认知能力 |
| `metago_compliance` | 治理族 | 合规主动是 D42 合规主动的工程实现，法律优先于效率 |
| `metago_action_plan` | 执行族 | 行动计划生成是执行族核心，将目标分解为可执行步骤 |
| `metago_holistic_task` | 执行族 | 全息任务执行是 D40 全息创造性的执行实现，一次性完整交付 |
| `metago_problem_trace` | 溯源族 | 问题无限溯源是 A1 溯源公理的核心实现 |
| `metago_fact_check` | 溯源族 | 事实核查是 D43 数据溯源的工程实现，检测夸大表述 |
| `metago_output_integrity` | 保障族 | 占位符与幻觉检测是输出质量保障的核心 |

### 9.5 合并候选深度分析

以下工具对功能可能重叠，建议做深度合并评估：

| 工具对 | 重叠点 | 差异点 | 合并建议 |
|--------|--------|--------|---------|
| `metago_critique` vs `metago_integrity_checklist` | 都是质量检查 | critique 是 L1-L5 分级，integrity 是 5 维度检查 | **保留两者**，critique 偏分析，integrity 偏自检 |
| `metago_value_align` vs `metago_value_29d_assess` | 都是 29 维价值 | value_align 偏对齐评估，value_29d_assess 偏综合指数 | **评估合并**为统一价值评估工具 |
| `metago_objectivity` vs `metago_critique` | 都涉及客观性 | objectivity 是 0-100 分量化，critique 是 L1-L5 分级 | **保留两者**，objectivity 是量化，critique 是分级 |
| `metago_data_provenance` vs `metago_document_lookup` | 都涉及溯源 | data_provenance 是全链路存证，document_lookup 是行号定位 | **评估合并** document_lookup 到 data_provenance |

### 9.6 能力族健康度评估

基于设计意图，各能力族的"理论健康度"评估：

| 能力族 | 工具数 | 高价值数 | 低价值数 | 健康度 | 建议 |
|--------|--------|---------|---------|--------|------|
| 认知族 | 4 | 1 | 1 | ⭐⭐⭐⭐ | 核心能力强，emotion 价值偏低 |
| 保障族 | 3 | 2 | 0 | ⭐⭐⭐⭐⭐ | 全部高价值，是 MetaGO 的护城河 |
| 治理族 | 2 | 1 | 0 | ⭐⭐⭐⭐⭐ | 全部高价值，合规是核心 |
| 进化族 | 3 | 2 | 1 | ⭐⭐⭐⭐ | 核心基因强，frequency_adapt 被动触发 |
| 执行族 | 4 | 3 | 1 | ⭐⭐⭐⭐ | 执行力强，developer_response 被动触发 |
| 溯源族 | 3 | 2 | 0 | ⭐⭐⭐⭐⭐ | 全部高价值，溯源是核心 |
| 价值族 | 3 | 0 | 2 | ⭐⭐ | 偏组织场景，需评估是否核心 |
| 规划推演族 | 4 | 0 | 1 | ⭐⭐⭐ | 工具型能力，one_shot_delivery 建议合并 |
| 质量批判族 | 1 | 0 | 0 | ⭐⭐⭐ | 与保障族重叠，评估合并 |
| 价值伦理族 | 2 | 0 | 0 | ⭐⭐⭐ | 价值评估专用，评估与治理族合并 |
| 溯源标注族 | 3 | 0 | 3 | ⭐ | **全部低价值**，建议合并到溯源族 |
| 耦生场景族 | 2 | 0 | 2 | ⭐ | **全部低价值**，建议合并到价值族 |
| 产品改进族 | 3 | 0 | 2 | ⭐⭐ | 偏设计场景，评估是否保留 |

### 9.7 优化决策矩阵

| 决策类型 | 工具数 | 优先级 | 决策权限 |
|---------|--------|--------|---------|
| 保持（高价值核心） | 10 | - | 不可动 |
| 保持（被动触发） | 6 | - | 不可动 |
| 保持（特定场景） | 16 | - | 待数据验证 |
| 评估合并 | 5 | P1 | 产品负责人决策 |
| 评估弃用 | 0 | - | 暂无 |

> **最终决策权限**: AI 提供数据和分析，最终决策权归产品负责人（易霄）。
> 遵循 D38 绝对客观中立：不主观判断能力价值，以设计意图和数据为准。

---

*由 MetaGO 僵尸能力分析器自动生成 | 遵循 D38 绝对客观中立 + D43 数据溯源*
