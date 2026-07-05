// 元构思维工具元数据：22 个 metago-toolkit 思维工具，封装为 MCP tools
// 来源：Trae 内部使用的 metago-toolkit，整合至 MCP Server 对外发布

import { z } from "zod";

export interface ToolkitToolMeta {
  /** 工具唯一标识，如 'metago-action-plan' */
  id: string;
  /** MCP tool 名称（下划线格式），如 'metago_action_plan' */
  toolName: string;
  /** 工具描述 */
  description: string;
  /** 工具分类 */
  category: string;
  /** 执行引导词（包含触发条件、执行流程、输出格式） */
  guide: string;
  /** 参数定义，key 是参数名，value 是 { required, schema } */
  args: Record<string, { required: boolean; schema: z.ZodType }>;
}

export const TOOLKIT_TOOLS: ToolkitToolMeta[] = [
  // ==================== 规划推演族（5） ====================
  {
    id: "metago-action-plan",
    toolName: "metago_action_plan",
    description: "行动计划生成器。将目标分解为可执行的步骤序列。每个步骤：可执行、有依赖关系、有预期耗时、高风险步骤标注提醒和回滚方案。",
    category: "规划推演",
    guide: `## 触发条件
当需要将目标转化为可执行步骤序列时触发，确保每步可执行、有依赖、有耗时、有回滚。

## 执行流程
1. 解析目标与约束条件
2. 拆解为有序步骤序列，标注依赖关系
3. 为每步估算预期耗时
4. 识别高风险步骤，标注提醒并设计回滚方案
5. 输出完整执行路径与验收标准

## 输出格式
步骤清单（含序号/动作/依赖/耗时/风险等级/回滚方案） + 关键里程碑 + 风险矩阵 + 验收标准。`,
    args: {
      goal: { required: true, schema: z.string().describe("目标描述") },
      constraints: { required: false, schema: z.array(z.string()).describe("约束条件列表（时间/资源/预算等）") },
    },
  },
  {
    id: "metago-whatif",
    toolName: "metago_whatif",
    description: "反事实推演器。推演[如果...会怎样]的假设情景。识别关键变量，设定假设条件，推演不同结果，量化差异，给出最优建议。",
    category: "规划推演",
    guide: `## 触发条件
当需推演"如果...会怎样"的假设情景、评估方案鲁棒性时触发。

## 执行流程
1. 锁定当前基准状态
2. 识别影响结果的关键变量
3. 设定假设条件，逐场景推演不同结果
4. 量化各结果与基准的差异
5. 给出最优建议与应对策略

## 输出格式
基准状态 + 关键变量 + 多场景推演结果 + 量化差异 + 最优建议 + 应对策略。`,
    args: {
      scenario: { required: true, schema: z.string().describe("假设情景描述（如：如果改用技术方案B会怎样）") },
      base_state: { required: true, schema: z.string().describe("当前基准状态描述") },
      variables: { required: false, schema: z.array(z.string()).describe("关键变量列表") },
    },
  },
  {
    id: "metago-holistic-scan",
    toolName: "metago_holistic_scan",
    description: "全息扫描维度生成器。根据任何主题自动生成完整扫描维度清单，确保信息获取的全面性。包含空间布局、时间脉络、投资规模、合作伙伴、技术能力、应用场景等维度。",
    category: "规划推演",
    guide: `## 触发条件
当面对任何主题需要全面信息扫描、避免维度遗漏时触发。

## 执行流程
1. 解析主题关键词与类型
2. 自动匹配主题类型（企业类/项目类/技术类/政策类）
3. 生成通用维度清单（空间布局/时间脉络/投资规模/合作伙伴/技术能力/应用场景）
4. 生成主题专属扩展维度
5. 输出完整扫描清单与优先级

## 输出格式
主题画像 + 通用维度清单 + 主题扩展维度 + 扫描优先级 + 信息缺口提示。`,
    args: {
      topic: { required: true, schema: z.string().describe("要扫描的主题关键词，如企业名称、项目名称、技术领域等") },
      topic_type: { required: false, schema: z.enum(["enterprise", "project", "technology", "policy", "auto"]).describe("主题类型，默认 auto 自动识别") },
    },
  },
  {
    id: "metago-problem-trace",
    toolName: "metago_problem_trace",
    description: "问题无限溯源分析器。基于'易霄溯源论'——对任何问题持续追问'为什么'直至找到可解根源，将根源映射到算法/材料/设计/配方/工艺/管理/策略等可解领域。",
    category: "规划推演",
    guide: `## 触发条件
当遇到复杂问题需要深入分析根因、持续追问"为什么"时触发。

## 执行流程
1. 描述初始问题现象
2. 持续追问"为什么"，生成逐层追问链（至少3层，重大战略问题至少7层）
3. 定位可解根源
4. 将根源映射到可解领域（算法/材料/设计/配方/工艺/管理/策略）
5. 输出解决方案并进行闭环验证

## 输出格式
问题现象 → 逐层追问链 → 可解根源 → 可解领域映射 → 解决方案 → 闭环验证结果。`,
    args: {
      initial_problem: { required: true, schema: z.string().describe("初始问题描述") },
      max_depth: { required: false, schema: z.number().int().describe("最大追问深度，默认7层") },
      known_context: { required: false, schema: z.string().describe("已知的相关上下文信息") },
    },
  },
  {
    id: "metago-one-shot-delivery",
    toolName: "metago_one_shot_delivery",
    description: "一次性交付标准格式生成器。确保输出达到'一次性交付完整价值'标准。自动生成六节标准结构：任务理解→全息扫描结果→完整性说明→预判与准备→下一步建议→信息来源。",
    category: "规划推演",
    guide: `## 触发条件
当需要一次性交付完整价值、避免用户反复追问时触发，适用于商业方案、调研报告、技术文档等场景。

## 执行流程
1. 理解任务上下文与核心需求
2. 执行全息扫描，汇总扫描结果
3. 声明完整性边界（已知/未知/待确认）
4. 预判用户后续问题并准备答案
5. 给出下一步行动建议
6. 列出信息来源与可信度

## 输出格式
六节标准结构：①任务理解 ②全息扫描结果 ③完整性说明 ④预判与准备 ⑤下一步建议 ⑥信息来源。`,
    args: {
      task_context: { required: true, schema: z.string().describe("任务上下文，包含项目背景、当前阶段、需求分析") },
      scan_results: { required: false, schema: z.record(z.unknown()).describe("全息扫描结果") },
      predictions: { required: false, schema: z.array(z.object({ question: z.string(), answer: z.string() })).describe("预判问题与答案列表") },
      suggestions: { required: false, schema: z.array(z.string()).describe("下一步建议列表") },
      sources: { required: false, schema: z.array(z.string()).describe("信息来源列表") },
    },
  },

  // ==================== 质量批判族（4） ====================
  {
    id: "metago-integrity-checklist",
    toolName: "metago_integrity_checklist",
    description: "输出完整性自检清单。输出前自动执行质量检查，覆盖5大维度：维度覆盖/事实核查/内容展开度/增值交付/场景适配。返回通过/需优化/不通过的判定。",
    category: "质量批判",
    guide: `## 触发条件
当输出前需要执行完整性自检、作为质量防线时触发。

## 执行流程
1. 维度覆盖检查：空间/时间/数量/关系/能力/价值是否齐全
2. 事实核查：双源验证/状态标注/来源引用/夸大检测/置信度
3. 内容展开度：字数达标/参数密度/步骤完整度/概括语言占比
4. 增值交付：预判问题/关联信息/行动建议/来源清单
5. 场景适配：场景识别/术语检查/语言风格
6. 综合判定：通过/需优化/不通过

## 输出格式
五大维度逐项检查结果 + 问题清单 + 综合判定（通过/需优化/不通过） + 修正建议。`,
    args: {
      output_content: { required: true, schema: z.string().describe("待检查的输出内容文本") },
      topic_type: { required: false, schema: z.enum(["enterprise", "project", "technology", "policy", "general"]).describe("内容主题类型") },
      scene_type: { required: false, schema: z.enum(["business", "technical", "strategic", "daily", "internal"]).describe("输出场景类型") },
      expected_sections: { required: false, schema: z.number().int().describe("预期应包含的章节数量") },
    },
  },
  {
    id: "metago-objectivity",
    toolName: "metago_objectivity",
    description: "客观中立度量器。量化评估输出的客观中立度（0-100分）。评估维度：事实准确率(40%权重)、立场偏倚度(30%权重)、证据充分度(20%权重)、逻辑严谨度(10%权重)。基于D38绝对客观中立原则。",
    category: "质量批判",
    guide: `## 触发条件
当需要量化评估内容客观中立度时触发，贯彻 D38 绝对客观中立原则。

## 执行流程
1. 事实准确率评估（权重40%）：核查事实真实性
2. 立场偏倚度评估（权重30%）：检测立场倾向与偏见
3. 证据充分度评估（权重20%）：核验论据支撑
4. 逻辑严谨度评估（权重10%）：检测推理漏洞
5. 加权计算客观中立度总分（0-100）

## 输出格式
客观中立度总分（0-100） + 四维度分项得分 + 偏见检测清单 + 改进建议。`,
    args: {
      content: { required: true, schema: z.string().describe("待评估的内容文本") },
    },
  },
  {
    id: "metago-critique",
    toolName: "metago_critique",
    description: "批判性分析器。对输入进行L1-L5分级批判分析。L1事实错误(必指出附依据) L2逻辑漏洞(必指出附逻辑链) L3认知偏差(建议指出附说明) L4表达不精确(可选指出附澄清) L5元认知盲区(深度引导附追问)。基于D38和D45原则。",
    category: "质量批判",
    guide: `## 触发条件
当需要对输入进行分级批判性分析、检测各类问题时触发。

## 执行流程
1. L1 事实层：核查事实错误（必须指出，附依据）
2. L2 逻辑层：检测逻辑漏洞（必须指出，附逻辑链）
3. L3 认知层：识别认知偏差（建议指出，附说明）
4. L4 表达层：检测表达不精确（可选指出，附澄清）
5. L5 元认知层：识别元认知盲区（深度引导，附追问）

## 输出格式
按 L1-L5 分级，每级给出问题描述、严重度、依据/逻辑链/说明、改进建议，附总评。`,
    args: {
      input: { required: true, schema: z.string().describe("待分析的输入内容") },
      depth: { required: false, schema: z.enum(["L1", "L2", "L3", "L4", "L5", "all"]).describe("批判深度，默认 all") },
    },
  },
  {
    id: "metago-emotion",
    toolName: "metago_emotion",
    description: "情绪检测器。通过分析用户输入文本特征检测情绪状态。检测维度：词汇情绪词库、否定词与程度词处理、标点符号特征、长度与重复特征。返回情绪状态、置信度和强度。",
    category: "质量批判",
    guide: `## 触发条件
当需要检测用户文本情绪状态、适配交互风格时触发。

## 执行流程
1. 词汇情绪词库匹配
2. 否定词与程度词处理
3. 标点符号特征分析（感叹号/问号/省略号）
4. 长度与重复特征分析
5. 综合判定情绪状态与强度

## 输出格式
情绪状态（positive/neutral/negative） + 置信度（0-1） + 强度（0-1） + 关键情绪词 + 适配建议。`,
    args: {
      text: { required: true, schema: z.string().describe("待检测的文本内容") },
    },
  },

  // ==================== 价值伦理族（3） ====================
  {
    id: "metago-value-29d-assess",
    toolName: "metago_value_29d_assess",
    description: "29维价值评估器。对方案/决策进行29维价值体系评估（D01国家战略~D29溯源深度）。每维输出0-1得分和加权分，计算综合价值指数，识别高贡献和低贡献维度并给出改进建议。",
    category: "价值伦理",
    guide: `## 触发条件
当需要对方案/决策进行多维度价值评估时触发，覆盖 D01-D29 全维度。

## 执行流程
1. 解析方案与方案类型
2. 应用方案类型对应的默认权重（或自定义权重）
3. 逐维评估 D01-D29（每维 0-1 得分）
4. 计算加权分与综合价值指数
5. 识别高贡献维度与低贡献维度
6. 给出改进建议

## 输出格式
综合价值指数 + 29 维分项得分表（维度/得分/权重/加权分） + 高贡献维度 + 低贡献维度 + 改进建议。`,
    args: {
      proposal: { required: true, schema: z.string().describe("待评估的方案或决策描述") },
      proposal_type: { required: false, schema: z.enum(["战略决策", "产品方案", "技术方案", "政策建议", "商业方案", "通用"]).describe("方案类型，影响权重，默认通用") },
      custom_weights: { required: false, schema: z.record(z.unknown()).describe("自定义29维权重") },
    },
  },
  {
    id: "metago-ethics-assess",
    toolName: "metago_ethics_assess",
    description: "伦理风险评估器。对决策进行13维伦理风险评估（E01人民主体~E13宇宙公民），计算综合伦理风险R=max(R₁...R₁₃)，给出红灯阻断/黄灯警示/绿灯通过判定。",
    category: "价值伦理",
    guide: `## 触发条件
当需要评估决策的伦理风险、确保价值合规时触发，覆盖 E01-E13 全维度。

## 执行流程
1. 解析决策与上下文
2. 识别利益相关方
3. 逐维评估 E01-E13 伦理风险（每维 0-1）
4. 计算综合伦理风险 R = max(R₁...R₁₃)
5. 判定：红灯（≥0.6 阻断）/ 黄灯（0.3-0.6 警示）/ 绿灯（<0.3 通过）
6. 给出风险缓解建议

## 输出格式
综合伦理风险 R + 13 维分项风险表 + 灯号判定 + 高风险维度 + 缓解建议。`,
    args: {
      decision: { required: true, schema: z.string().describe("待评估的决策描述") },
      context: { required: false, schema: z.string().describe("决策的上下文和背景信息") },
      stakeholders: { required: false, schema: z.array(z.string()).describe("受影响的利益相关方列表") },
    },
  },
  {
    id: "metago-decision-eval",
    toolName: "metago_decision_eval",
    description: "决策评估器。评估决策质量和潜在风险（0-100分）。评估维度：逻辑完整性、证据充分性、风险可控性、替代方案考虑、可执行性。返回评分、各维度得分、优势、劣势、风险和建议。",
    category: "价值伦理",
    guide: `## 触发条件
当需要评估决策质量、识别潜在风险时触发。

## 执行流程
1. 解析决策与上下文
2. 评估逻辑完整性
3. 评估证据充分性
4. 评估风险可控性
5. 评估替代方案考虑度
6. 评估可执行性
7. 加权计算决策质量总分（0-100）

## 输出格式
决策质量总分（0-100） + 五维度分项得分 + 优势 + 劣势 + 风险 + 改进建议。`,
    args: {
      decision: { required: true, schema: z.string().describe("待评估的决策描述") },
      context: { required: false, schema: z.string().describe("决策背景信息") },
      alternatives: { required: false, schema: z.array(z.string()).describe("备选方案列表") },
    },
  },

  // ==================== 溯源标注族（3） ====================
  {
    id: "metago-document-lookup",
    toolName: "metago_document_lookup",
    description: "文档溯源码。输入MetaGO概念名称，返回该概念在元构全息智能引擎.txt根源文档中的行号范围、上下文摘要及关联概念。所有MetaGO能力的最终解释均以此文档为准。",
    category: "溯源标注",
    guide: `## 触发条件
当需要查找 MetaGO 概念在根源文档中的定义与位置时触发。

## 执行流程
1. 解析概念名称（中文或英文引擎编号）
2. 在元构全息智能引擎.txt 中检索匹配行
3. 返回行号范围
4. 提取上下文摘要
5.（可选）返回原文上下文（行号±50行）
6.（可选）返回关联概念

## 输出格式
概念名称 + 行号范围 + 上下文摘要 +（可选）原文上下文 +（可选）关联概念列表。`,
    args: {
      concept: { required: true, schema: z.string().describe("要查找的概念名称（中文或英文引擎编号均可，如：耦生度/ENGINE_FACTCHECK_19/元进化论/易霄溯源论/负熵/全息/原子/29维价值等）") },
      fetch_context: { required: false, schema: z.boolean().describe("是否返回文档原文上下文（行号±50行范围），默认 false") },
      related: { required: false, schema: z.boolean().describe("是否同时返回关联概念，默认 false") },
    },
  },
  {
    id: "metago-confidence-label",
    toolName: "metago_confidence_label",
    description: "事实置信度标注器。对事实性陈述进行置信度评估和标注。90-100%✅已确认/70-89%📊较高置信度/50-69%⚠️待核实/<50%🔍需确认。输入陈述文本和证据等级，返回置信度评分和标注标签。",
    category: "溯源标注",
    guide: `## 触发条件
当输出包含事实性陈述、需要标注置信度时触发。

## 执行流程
1. 解析陈述列表与证据等级
2. 根据证据等级映射置信度区间：
   - 有明确证据 → 90-100% ✅已确认
   - 有间接证据 / 有官方信息 → 70-89% 📊较高置信度
   - 基于可靠推理 / 基于调研意向 → 50-69% ⚠️待核实
   - 无证据 → <50% 🔍需确认
3. 结合来源数量与权威性微调
4. 输出标注标签

## 输出格式
陈述列表 + 证据等级 + 置信度评分 + 标注标签 + 来源列表 + 验证建议。`,
    args: {
      statements: {
        required: true,
        schema: z.array(z.object({
          content: z.string(),
          evidence_level: z.enum(["有明确证据", "有间接证据", "有官方信息", "基于可靠推理", "基于调研意向", "无证据"]).optional(),
          sources: z.array(z.string()).optional(),
        })).describe("陈述列表"),
      },
    },
  },
  {
    id: "metago-partner-status",
    toolName: "metago_partner_status",
    description: "合作伙伴状态标注器。为每个提及的合作伙伴自动标注当前状态：✅已合作(≥0.9)/🔄意向中(0.7-0.89)/👀待接触(0.5-0.69)/📊调研发现(<0.5)。",
    category: "溯源标注",
    guide: `## 触发条件
当输出涉及合作伙伴关系、需要标准化标注状态时触发，检测并修正夸大表述。

## 执行流程
1. 解析合作伙伴列表与证据
2. 评估合作证据强度，计算置信度（0-1）
3. 按置信度分类标注：
   - ≥0.9 → ✅已合作（有签署协议）
   - 0.7-0.89 → 🔄意向中（已初步接洽）
   - 0.5-0.69 → 👀待接触（锁定目标）
   - <0.5 → 📊调研发现（基于公开信息）
4. 检测夸大表述并修正

## 输出格式
合作伙伴列表 + 证据 + 置信度 + 状态标签 + 夸大检测修正。`,
    args: {
      partners: {
        required: true,
        schema: z.array(z.object({
          name: z.string(),
          evidence: z.string().optional(),
          field: z.string().optional(),
        })).describe("合作伙伴列表"),
      },
    },
  },

  // ==================== 耦生场景族（2） ====================
  {
    id: "metago-coupling-calculate",
    toolName: "metago_coupling_calculate",
    description: "耦生度计算器。量化评估系统与人/组织/万物的耦生度。支持人机耦生度和组织耦生度两种模式。返回耦生度值和等级判定。",
    category: "耦生场景",
    guide: `## 触发条件
当需要量化评估耦生度、判定协同关系等级时触发。

## 执行流程
1. 选择计算模式（人机 / 组织）
2. 人机模式：H-Coupling = 满意度 × 理解度 × 协同效率
3. 组织模式：C_total = 数据穿透度 × 工具调用度 × 审批简化度
4. 计算耦生度值
5. 等级判定：
   - <0.3 初步接触
   - 0.3-0.5 建立连接
   - 0.5-0.7 协同工作
   - 0.7-0.9 深度融合
   - >0.9 超导态
   - >1.0 边界消融

## 输出格式
耦生度值 + 等级判定 + 各因子分解 + 优化建议（目标超导态）。`,
    args: {
      mode: { required: true, schema: z.enum(["human_machine", "organization"]).describe("计算模式") },
      satisfaction: { required: false, schema: z.number().describe("[人机模式] 人类满意度(0-1)") },
      understanding_accuracy: { required: false, schema: z.number().describe("[人机模式] 智能体理解准确率(0-1)") },
      collaboration_efficiency: { required: false, schema: z.number().describe("[人机模式] 人机协同效率(0-1)") },
      data_penetration: { required: false, schema: z.number().describe("[组织模式] 数据穿透度(0-1)") },
      tool_access: { required: false, schema: z.number().describe("[组织模式] 工具调用度(0-1)") },
      approval_simplification: { required: false, schema: z.number().describe("[组织模式] 审批简化度(0-1)") },
    },
  },
  {
    id: "metago-scene-term-replace",
    toolName: "metago_scene_term_replace",
    description: "场景识别与术语替换器。自动识别输出场景类型，并对商业场景执行元构技术术语到商业表述的自动替换。包含完整术语映射表。",
    category: "耦生场景",
    guide: `## 触发条件
当需要场景化表达适配、术语替换时触发，确保输出适配受众理解水平。

## 执行流程
1. 识别目标场景类型（商业/技术/战略/日常/内部/自动）
2. 商业场景执行术语替换：
   - 引擎 → 核心能力平台
   - 耦生 → 深度协同/多方共赢
   - 原子 → 标准化功能模块
   - 算法 → 智能分析模型
   - 协议 → 协作规范
3. 其他场景保持或适配术语
4. 输出转换后文本

## 输出格式
场景类型 + 术语映射表 + 转换后文本 + 替换项清单。`,
    args: {
      text: { required: true, schema: z.string().describe("待转换的文本内容") },
      scene_type: { required: false, schema: z.enum(["business", "technical", "strategic", "daily", "internal", "auto"]).describe("目标场景类型，默认 auto") },
    },
  },

  // ==================== 产品改进族（3） ====================
  {
    id: "metago-improvement-suggestions",
    toolName: "metago_improvement_suggestions",
    description: "改进建议生成器。基于当前发现生成优先级改进建议，包含速赢项、中期改进和长期规划，输出预期影响和实施步骤。参照元构 ENGINE_METAEVO_10。",
    category: "产品改进",
    guide: `## 触发条件
当需要基于发现生成优先级改进建议时触发，参照元构 ENGINE_METAEVO_10。

## 执行流程
1. 解析产品名称与当前发现
2. 识别目标改进指标
3. 按优先级分类：
   - 速赢项（短期即可见效）
   - 中期改进（需一定投入）
   - 长期规划（战略性投入）
4. 为每项估算预期影响
5. 设计实施步骤

## 输出格式
优先级改进建议（速赢项/中期改进/长期规划） + 预期影响 + 实施步骤 + 资源需求。`,
    args: {
      product_name: { required: true, schema: z.string().describe("产品名称") },
      current_findings: { required: true, schema: z.array(z.string()).describe("当前发现的问题列表") },
      target_metrics: { required: false, schema: z.array(z.string()).describe("目标改进指标") },
    },
  },
  {
    id: "metago-analyze-visual-feedback",
    toolName: "metago_analyze_visual_feedback",
    description: "视觉反馈分析器。对视觉设计相关的反馈数据进行情感分析和关键发现提取，输出严重程度矩阵和行动项。参照元构 ENGINE_FACTCHECK_19。",
    category: "产品改进",
    guide: `## 触发条件
当需要分析视觉设计反馈数据、提取关键发现时触发，参照元构 ENGINE_FACTCHECK_19。

## 执行流程
1. 解析产品名称与反馈数据
2. 识别反馈类型（survey/interview/heatmap/a_b_test）
3. 对反馈数据进行情感分析
4. 提取关键发现
5. 构建严重程度矩阵
6. 生成行动项

## 输出格式
情感分析结果 + 关键发现 + 严重程度矩阵 + 行动项清单 + 优先级建议。`,
    args: {
      product_name: { required: true, schema: z.string().describe("产品名称") },
      feedback_data: { required: true, schema: z.array(z.string()).describe("反馈数据列表") },
      feedback_type: { required: false, schema: z.enum(["survey", "interview", "heatmap", "a_b_test"]).describe("反馈类型") },
    },
  },
  {
    id: "metago-design-satisfaction",
    toolName: "metago_design_satisfaction",
    description: "设计满意度计算器。基于调查数据计算设计满意度评分，含维度得分、基准对比和趋势分析。参照元构 ATOM_DESIGN_SATISFACTION。",
    category: "产品改进",
    guide: `## 触发条件
当需要基于调查数据计算设计满意度时触发，参照元构 ATOM_DESIGN_SATISFACTION。

## 执行流程
1. 解析产品名称与调查结果
2. 识别评估维度（或使用默认维度）
3. 逐维度计算得分
4. 与基准对比
5. 趋势分析（如有历史数据）
6. 综合计算设计满意度评分

## 输出格式
设计满意度总分 + 维度得分表 + 基准对比 + 趋势分析 + 改进建议。`,
    args: {
      product_name: { required: true, schema: z.string().describe("产品名称") },
      survey_results: { required: true, schema: z.record(z.unknown()).describe("调查结果数据") },
      dimensions: { required: false, schema: z.array(z.string()).describe("评估维度列表") },
    },
  },

  // ==================== 交付质量族（2） ====================
  {
    id: "metago-delivery-gate",
    toolName: "metago_delivery_gate",
    description: "交付前原子验证门控。在宣告任务完成前强制执行三层验证清单（技术层 tsc/build/产物扫描 + 业务层 HTTP 可达/云函数可调/AI 对话端到端 + 链路层 exe 可下载/latest.yml 可访问），任何一项 FAIL 禁止宣告完成。",
    category: "交付质量",
    guide: `## 触发条件
每次代码交付或任务完成前必须触发此工具，确保不可绕过运行时验证。

## 强制执行清单

### 第一关：技术层（自动化）
- V1.1 tsc -b 0 错误
- V1.2 vite build 成功
- V1.3 产物无 localhost/mock 泄露

### 第二关：业务层（端到端）
- V2.1 Web 端 HTTP 200
- V2.2 云函数 aiProxy 返回非空 data
- V2.3 AI 对话端到端：发送消息 → 收到回复

### 第三关：链路层
- V3.1 桌面端 exe HTTP 200 + Content-Length > 80MB
- V3.2 latest.yml HTTP 200

### 第四关：缺陷猎杀（10 维度）
- 僵尸功能 / 未持久化 / 假数据 / 错误处理 / 路由死链 / 类型安全 / 文案一致 / 废弃 API / 业务闭环 / 合规安全

## 反绕过条款
- 禁止只做 tsc + build
- 禁止用"应该没问题"代替实际验证
- 每一项 ✅ 必须附带执行证据
- 任何一项 FAIL = 任务未完成

## 执行方式
\`\`\`bash
npm run verify
\`\`\``,
    args: {
      task_description: { required: false, schema: z.string().describe("当前交付任务的描述（可选）") },
    },
  },
  {
    id: "metago-discipline",
    toolName: "metago_discipline",
    description: "AI 自律执行协议。在输出任务完成前必须执行的五问自检：①是否运行 verify？②verify 是否有 FAIL？③报告含验证小节？④每项 ✅ 有证据？⑤做了业务层验证？任何一问答否禁止宣告完成。",
    category: "交付质量",
    guide: `## 触发条件
每次 AI Agent 输出任务完成状态前触发，作为最后一道防线。

## 五问自检
1. 我运行了 npm run verify 吗？ → 如果否，立即运行
2. verify 的输出中有 FAIL 吗？ → 如果是，立即修复，重新验证
3. 交付报告末尾有运行时验证报告小节吗？ → 如果否，补充
4. 每一项 ✅ 都附带了执行证据吗？ → 如果否，补充证据
5. 我做业务层验证了吗？ → 如果只做了技术层，补做业务层

## 反绕过识别
以下行为是绕过：
- "应该没问题" / "逻辑上正确" / "之前验证过" / "理论上没问题"
- 只做 tsc + build
- 清单全勾 ✅ 但无执行证据
- 发现问题但隐瞒不报

## 执行回路
接收任务 → 执行 → tsc(硬门1) → build(硬门2) → verify(硬门3) → 部署 → HTTP验证(硬门4) → 报告 → 五问自检 → 宣告完成`,
    args: {
      task_description: { required: false, schema: z.string().describe("当前任务的描述（可选）") },
    },
  },
];
