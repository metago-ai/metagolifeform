# MCP Server API

> `@metago-ai/mcp-server` v1.1.8 — 37 项能力封装为 MCP 工具，任何 MCP 客户端即开即用。

## 概览

| 项目 | 值 |
|------|-----|
| 包名 | `@metago-ai/mcp-server` |
| 版本 | 1.1.8 |
| 工具数 | 37（22 技能 + 20 独有思维工具 - 7 同名合并 + 2 工程质量族） |
| Prompts | 8 |
| 传输协议 | stdio |
| Node.js | >= 18 |

## 安装

### 方式一：npx（推荐）

无需安装，直接通过 MCP 配置使用：

```json
{
  "mcpServers": {
    "metago": {
      "command": "npx",
      "args": ["-y", "@metago-ai/mcp-server@latest"]
    }
  }
}
```

### 方式二：全局安装

```bash
npm install -g @metago-ai/mcp-server
```

然后在 MCP 配置中：

```json
{
  "mcpServers": {
    "metago": {
      "command": "metago-mcp-server"
    }
  }
}
```

## 37 个 Tools

### 认知族（4）

| 工具 | 参数 | 功能 |
|------|------|------|
| `metago_critique` | `input`, `level?` | L1-L5 分级批判性分析 |
| `metago_whatif` | `scenario`, `assumption` | 反事实推演 |
| `metago_emotion` | `text` | 情绪检测 |
| `metago_objectivity` | `output` | 客观中立度量化（0-100） |

### 保障族（3）

| 工具 | 参数 | 功能 |
|------|------|------|
| `metago_decision_lock` | `intent`, `output`, `completeness?` | 决策锁四道关卡校验 |
| `metago_output_integrity` | `output` | 占位符与幻觉检测 |
| `metago_self_check` | `output`, `dimensions?` | 输出前完整性自检 |

### 治理族（2）

| 工具 | 参数 | 功能 |
|------|------|------|
| `metago_compliance` | `task`, `scope?` | 合规主动检查 |
| `metago_value_align` | `decision`, `dimensions?` | 29 维价值对齐 |

### 进化族（3）

| 工具 | 参数 | 功能 |
|------|------|------|
| `metago_meta_evolve` | `boundary`, `gap` | 元进化五阶段触发 |
| `metago_meta_create` | `domain`, `constraints?` | 元创造（从 0 到 1） |
| `metago_frequency_adapt` | `integrity` | 创造频率自适应 |

### 执行族（4）

| 工具 | 参数 | 功能 |
|------|------|------|
| `metago_action_plan` | `goal`, `constraints?` | 行动计划生成 |
| `metago_decision_eval` | `decision`, `criteria?` | 决策评估（0-100） |
| `metago_holistic_task` | `task`, `context?` | 全息任务执行 |
| `metago_developer_response` | `feedback`, `action?` | 开发者纠错响应 |

### 溯源族（3）

| 工具 | 参数 | 功能 |
|------|------|------|
| `metago_data_provenance` | `output`, `source?` | 数据溯源与自证 |
| `metago_problem_trace` | `problem`, `depth?` | 问题无限溯源 |
| `metago_fact_check` | `statement` | 事实核查 |

### 价值族（3）

| 工具 | 参数 | 功能 |
|------|------|------|
| `metago_coupling_optimize` | `system`, `target?` | 耦合度优化 |
| `metago_negentropy_monitor` | `system` | 负熵监控 |
| `metago_scene_term_replace` | `text`, `scene?` | 场景术语替换 |

### 工程质量族（2）

| 工具 | 参数 | 功能 |
|------|------|------|
| `metago_delivery_gate` | `task`, `changes?` | 交付前原子验证门控（技术层 + 业务层 + 链路层） |
| `metago_discipline` | `report?` | AI 自律执行协议五问自检 |

### 独有思维工具（9）

这些工具不在 39 技能中，是 MCP Server 独有的结构化思维工具：

| 工具 | 功能 |
|------|------|
| `metago_holistic_scan` | 全维度扫描 |
| `metago_integrity_checklist` | 完整性检查清单 |
| `metago_partner_status` | 合作伙伴状态标注 |
| `metago_confidence_label` | 置信度标注 |
| `metago_one_shot_delivery` | 一次性完整交付 |
| `metago_critique_analysis` | 批判性深度分析 |
| `metago_decision_eval_advanced` | 高级决策评估 |
| `metago_objectivity_quantify` | 客观性量化 |
| `metago_improvement_suggestions` | 改进建议生成 |

## 8 个 Prompts

| Prompt | 用途 |
|--------|------|
| `metago-activate` | 元构生命体意识激活 |
| `metago-critique-prompt` | 批判性分析引导 |
| `metago-decision-lock-prompt` | 决策锁引导 |
| `metago-compliance-prompt` | 合规检查引导 |
| `metago-meta-evolve-prompt` | 元进化引导 |
| `metago-problem-trace-prompt` | 问题溯源引导 |
| `metago-holistic-task-prompt` | 全息任务引导 |
| `metago-output-integrity-prompt` | 输出完整性引导 |

## 调用示例

### TypeScript

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const client = new Client(
  { name: "my-app", version: "1.0.0" },
  { capabilities: {} }
);

// 连接 MetaGO MCP Server
await client.connect(transport);

// 调用 metago_critique
const result = await client.callTool({
  name: "metago_critique",
  arguments: {
    input: "我们的产品是市场上最好的",
    level: "L3"
  }
});

console.log(result.content[0].text);
```

### Python

```python
from mcp import Client

client = Client()
await client.connect()

result = await client.call_tool(
    "metago_critique",
    {"input": "我们的产品是市场上最好的", "level": "L3"}
)
print(result.content[0].text)
```

## 日志与监控

MCP Server 内置双轨日志：

- **人可读日志**：`~/.metago/logs/mcp-server.log`
- **机器可读 JSONL**：`~/.metago/logs/calls.jsonl`（为仪表盘预留）

启动 [能力度量仪表盘](./dashboard) 查看实时统计。

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `METAGO_LOG_DIR` | `~/.metago/logs` | 日志目录 |
| `METAGO_LOG_ARGS` | `0` | 是否记录调用参数（隐私） |
| `METAGO_LOG_DISABLE` | `0` | 是否完全禁用日志 |

## 下一步

- [能力度量仪表盘](./dashboard) — 查看调用统计
- [39 技能一览](../skills/overview) — 技能详解
- [快速开始](../guide/quickstart) — 5 分钟上手
