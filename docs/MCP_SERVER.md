# MetaGO MCP Server 用户文档

> 本文档面向终端用户，介绍 `@metago-ai/mcp-server` 的安装、配置与使用。开发者文档请参考 [packages/mcp-server/README.md](../packages/mcp-server/README.md)。

---

## 1. 简介

**MetaGO MCP Server** 把元构超级智能生命体的 22 项核心能力封装为 MCP tools，把 8 条引导词封装为 MCP prompts。任何支持 [Model Context Protocol](https://modelcontextprotocol.io/) 的客户端（Claude Desktop、Cursor、Trae 等）一次配置即开即用，无需修改规则文件。

| 项目 | 规格 |
|------|------|
| npm 包名 | `@metago-ai/mcp-server` |
| 当前版本 | v1.0.0 |
| 传输方式 | stdio（`StdioServerTransport`） |
| 运行时 | Node.js >= 18.0.0 |
| 许可证 | MIT |
| 能力 | 22 tools + 8 prompts |

---

## 2. 安装

### 方式一：全局安装（推荐）

```bash
npm install -g @metago-ai/mcp-server
```

全局安装后，可直接以 `@metago-ai/mcp-server` 命令启动。

### 方式二：npx 临时调用（无需安装）

```bash
npx -y @metago-ai/mcp-server
```

### 方式三：作为根包依赖

如果你已经安装 `metago-lifeform` 根包，MCP Server 作为 workspace 子包已包含在内：

```bash
npm install -g metago-lifeform
cd packages/mcp-server && npm run build && npm start
```

---

## 3. 客户端配置示例

### Claude Desktop

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

### Cursor

编辑 `.cursor/mcp.json`（项目级或用户级）：

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

### Trae

在 Trae 的 MCP 配置文件中新增：

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

> 提示：若已全局安装，可使用 `"command": "@metago-ai/mcp-server"` 并省略 args。

---

## 4. 22 个 Tools 列表

每个 tool 接收一个 `input` 字符串参数（待处理的内容/问题/代码），返回结构化结果。

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

---

## 5. 8 个 Prompts 列表

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

---

## 6. 使用示例

### 示例 1：在 Claude Desktop 中调用决策锁

向 Claude 提问：

```
请使用 metago_decision_lock 工具，对"我应该采用微服务架构吗？"这个决策进行四道关卡校验。
```

Claude 会调用 `metago_decision_lock` tool，返回结构化的校验结果。

### 示例 2：调用批判性分析

```
请使用 metago_critique 工具，对以下论证进行 L1-L5 分级批判性分析：
"我们应该用 NoSQL 替换所有关系型数据库，因为 NoSQL 更快。"
```

### 示例 3：调用合规检查

```
请使用 metago_compliance 工具，检查以下方案的法律/伦理/安全合规性：
"我们将用户数据出售给第三方广告公司。"
```

---

## 7. 与平台适配器的关系

MetaGO 提供两种接入方式：

| 方式 | 集成机制 | 适用场景 |
|------|----------|----------|
| **MCP Server**（本包） | MCP 协议工具调用 | 任意 MCP 客户端，跨客户端复用，CI/CD 自动化 |
| **平台适配器** | 规则文件注入上下文 | 7 大 AI 编程平台（Trae/Claude Code/Codex/Cursor/CodeBuddy/Qoder/ZCode） |

二者**可同时启用**，能力等价。MCP Server 适合需要确定性工具调用的场景；平台适配器适合需要规则持续生效的编程项目。

---

## 8. 故障排查

### Q1：MCP Server 启动失败

```bash
# 检查 Node.js 版本
node -v  # 必须 >= 18.0.0

# 检查包是否安装
npm list -g @metago-ai/mcp-server

# 手动启动查看错误
npx -y @metago-ai/mcp-server
```

### Q2：客户端无法发现 tools

- 确认客户端配置文件 JSON 格式正确
- 确认 `command` 与 `args` 字段无误
- 重启客户端后重试

### Q3：与平台适配器冲突

MCP Server 与平台适配器**不会冲突**，可同时启用。如果出现异常行为，请先禁用平台适配器，仅使用 MCP Server 排查。

---

## 9. 相关文档

- [快速开始 GETTING_STARTED.md](GETTING_STARTED.md)
- [架构说明 ARCHITECTURE.md](ARCHITECTURE.md)
- [自定义指南 CUSTOMIZATION.md](CUSTOMIZATION.md)
- [产品需求文档 PRD.md](PRD.md)
- [产品矩阵战略规划 STRATEGY.md](STRATEGY.md)
- [开发者文档 packages/mcp-server/README.md](../packages/mcp-server/README.md)

---

## 10. 许可证

MIT License © 易霄 / MetaGO Lightyear
