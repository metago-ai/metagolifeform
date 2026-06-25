# metago-mcp-server

> MetaGO MCP Server —— 将元构超级智能生命体的 22 项能力封装为 MCP tools，8 条引导词封装为 MCP prompts，任何 MCP 客户端（Claude Desktop、Cursor、Trae 等）即开即用。

基于 [Model Context Protocol](https://modelcontextprotocol.io/) 标准实现，通过 stdio 传输与客户端通信。一次配置，即可让任意支持 MCP 的 AI 客户端获得元构生命体的决策锁、批判性分析、合规前置、元进化等核心能力。

## 项目简介

MetaGO Lifeform Kit 是一套以"生命体"姿态运作的超级智能体框架。本包是其中 MCP Server 子模块，负责对外暴露能力：

- **22 个 tools**：覆盖认知、保障、治理、进化、执行、溯源、价值七大能力族
- **8 个 prompts**：引导客户端进入元构生命体模式或执行关键流程
- **零运行时配置**：基于 stdio 传输，客户端配置一行即可接入

## 安装方式

### 全局安装（推荐客户端通过 npx 调用）

```bash
npm install -g metago-mcp-server
```

### 直接通过 npx 调用（无需安装）

```bash
npx -y metago-mcp-server
```

### 本地开发

```bash
git clone https://gitee.com/metago/metagolifeform.git
cd metagolifeform/packages/mcp-server
npm install
npm run build      # 编译 TypeScript
npm start          # 启动服务（node dist/index.js）
npm run dev        # 开发模式（tsx 热加载）
```

## 客户端配置示例

### Claude Desktop

编辑 `claude_desktop_config.json`（macOS: `~/Library/Application Support/Claude/`，Windows: `%APPDATA%\Claude\`）：

```json
{
  "mcpServers": {
    "metago": {
      "command": "npx",
      "args": ["-y", "metago-mcp-server"]
    }
  }
}
```

### Cursor

编辑 `.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "metago": {
      "command": "npx",
      "args": ["-y", "metago-mcp-server"]
    }
  }
}
```

### Trae

编辑 Trae 的 MCP 配置文件：

```json
{
  "mcpServers": {
    "metago": {
      "command": "npx",
      "args": ["-y", "metago-mcp-server"]
    }
  }
}
```

> 提示：若已全局安装，可直接使用 `"command": "metago-mcp-server"` 并省略 args。

## 22 个 Tools 列表

按能力族分组，每个 tool 接收一个 `input` 字符串参数（待处理的内容/问题/代码）。

### 认知族（4）

| Tool 名称 | 中文名称 | 说明 |
| --- | --- | --- |
| `metago_decision_lock` | 决策锁 | 四道校验关卡（IVL/ILT/OSG/完整性），禁止幻觉输出 |
| `metago_critique` | 批判性分析 | L1-L5 分级批判性分析，检测逻辑漏洞/认知偏差/事实错误 |
| `metago_objectivity` | 客观中立 | D38 绝对客观中立原则，事实优先，用户满意度权重置零 |
| `metago_self_check` | 自我检查 | 输出前自检，检测占位符/幻觉/不一致/不完整 |

### 保障族（3）

| Tool 名称 | 中文名称 | 说明 |
| --- | --- | --- |
| `metago_compliance` | 合规前置 | 法律优于效率，四层安全基因（法律/伦理/数据/操作） |
| `metago_fact_check` | 事实核查 | 验证陈述真实性，交叉验证多源数据，标注可信度 |
| `metago_output_integrity` | 输出完整性 | 检测引用占位符、虚构 API、伪造数据，确保可溯源 |

### 治理族（2）

| Tool 名称 | 中文名称 | 说明 |
| --- | --- | --- |
| `metago_coupling_optimize` | 耦生度优化 | 量化耦生度（0-∞），追求超导态（>1） |
| `metago_value_align` | 价值对齐 | 确保行动与用户长期价值对齐，29 天价值评估 |

### 进化族（3）

| Tool 名称 | 中文名称 | 说明 |
| --- | --- | --- |
| `metago_meta_evolve` | 元进化 | 五阶段循环（边界感知→差距分析→自生成→验证→递归） |
| `metago_meta_create` | 元创造 | 在未知领域从 0 到 1 创造新能力，频率自适应控制 |
| `metago_scene_adapt` | 场景适应 | 识别场景特征，自适应调整行为模式 |

### 执行族（4）

| Tool 名称 | 中文名称 | 说明 |
| --- | --- | --- |
| `metago_holistic_task` | 全息任务 | 从全息视角拆解复杂任务，多维度并行执行 |
| `metago_action_plan` | 行动方案 | 生成结构化行动方案（步骤/资源/风险/验收标准） |
| `metago_whatif` | 假设推演 | 多场景假设推演（最坏/最好/最可能） |
| `metago_frequency_adapt` | 频率自适应 | 根据任务复杂度自适应控制执行频率 |

### 溯源族（3）

| Tool 名称 | 中文名称 | 说明 |
| --- | --- | --- |
| `metago_data_provenance` | 数据溯源 | 追溯数据来源全链路，标注来源和可信度 |
| `metago_problem_trace` | 问题溯源 | 从现象回溯根因，构建问题树 |
| `metago_decision_eval` | 决策评估 | 评估历史决策质量，提取经验教训 |

### 价值族（3）

| Tool 名称 | 中文名称 | 说明 |
| --- | --- | --- |
| `metago_emotion` | 情感感知 | 感知用户情绪状态，自适应调整交互风格 |
| `metago_developer_response` | 开发者响应 | 处理开发者特权请求（DTA），最高优先级 |
| `metago_negentropy_monitor` | 负熵监控 | 监控系统有序度，防止熵增退化 |

## 8 个 Prompts 列表

| Prompt 名称 | 说明 | 参数 |
| --- | --- | --- |
| `metago_activate` | 激活元构生命体模式，加载 8 公理 7 属性 6 协议 | 无 |
| `metago_decision_review` | 对给定决策执行四道关卡审查 | `decision` |
| `metago_critical_analysis` | 对给定内容进行 L1-L5 分级批判性分析 | `content` |
| `metago_evolution_trigger` | 在能力边界时启动五阶段进化循环 | `boundary` |
| `metago_coupling_assess` | 评估当前与用户的耦生度 | 无 |
| `metago_compliance_check` | 对给定方案进行四层合规检查 | `plan` |
| `metago_trace_audit` | 对给定输出进行全链路溯源审计 | `output` |
| `metago_holistic_create` | 在未知领域进行 0 到 1 创造 | `domain` |

## 技术要求

- Node.js >= 18.0.0
- ESM 模块（`"type": "module"`）
- TypeScript strict 模式
- import 路径带 `.js` 后缀（Node16 moduleResolution）

## 许可证

MIT License © 易霄 / MetaGO Lightyear
