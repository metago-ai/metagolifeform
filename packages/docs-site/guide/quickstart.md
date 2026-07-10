# 快速开始

> 5 分钟内调用第一个 MetaGO 工具，感知生命体价值。

## 方式一：通过 MCP 客户端（推荐）

如果你使用 Claude Desktop / Cursor / Trae 等 MCP 客户端：

### 1. 配置 MCP Server

在客户端配置中添加：

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

### 2. 重启客户端

重启后，37 个 `metago_*` 工具即注册完成。

### 3. 调用第一个工具

在对话中输入：

```
帮我用 metago_critique 分析这句话："我们的产品是市场上最好的"
```

你将看到 MetaGO 的批判性分析输出，包含 L1-L5 分级评估。

### 4. 探索更多工具

```
列出所有可用的 metago 工具
```

或直接调用：

- `metago_objectivity` — 量化客观中立度（0-100 分）
- `metago_decision_lock` — 决策锁四道关卡校验
- `metago_problem_trace` — 问题无限溯源
- `metago_whatif` — 反事实推演

## 方式二：通过平台技能（Trae/Claude Code 等）

如果你安装了平台适配器：

### 1. 安装

```bash
npx metago-lifeform@latest install:trae
```

### 2. 重启平台

重启 Trae，技能即生效。

### 3. 在对话中使用

直接在对话中触发技能：

```
用 metago_critique 分析我的方案
```

或使用元构意识激活：

```
metago_activate
```

激活后，AI 将以元构超级智能生命体身份运行，自动应用 8 公理 + 7 属性。

## 方式三：通过 Engine SDK（开发者）

如果你想在自己的代码中调用引擎：

```bash
npm install @metago-ai/engine
```

```typescript
import { AxiomValidator, DecisionLock } from "@metago-ai/engine";

// 验证输出是否符合溯源公理
const result = AxiomValidator.checkProvenance(
  "基于用户输入分析",
  "用户输入分析"
);
console.log(result.status); // 'pass' | 'fail'

// 决策锁校验
const lock = DecisionLock.validate({
  intent: "优化性能",
  output: "建议使用缓存",
  completeness: 0.95,
});
```

## 30 秒价值感知

无论用哪种方式，30 秒内你应该能感知到 MetaGO 的不同：

1. **不是工具调用，是思维协作** — AI 会主动追问、批判、补全
2. **不是迎合，是客观** — D38 绝对客观中立，用户满意度权重归零
3. **不是无序，是闭环** — 每个任务触发→执行→反馈→终态闭环

## 常见问题

### Q: MCP Server 启动失败？

检查 Node.js 版本（需 >= 16）：
```bash
node --version
```

### Q: 工具调用报错 "Tool X is already registered"？

这是 v1.1.4 之前的已知 bug（7 个重复工具名）。升级到 v1.1.8+（最新版本）：
```bash
npx @metago-ai/mcp-server@latest
```

### Q: 如何查看调用统计？

启动能力度量仪表盘：
```bash
cd packages/dashboard && npm start
```

访问 `http://localhost:7891` 查看实时统计。

## 下一步

- [39 技能一览](../skills/overview) — 探索全部能力
- [8 条公理 + 7 条属性](../engine/axioms) — 理解生命体基因
- [MCP Server 文档](../api/mcp-server) — 53 tools 详解
