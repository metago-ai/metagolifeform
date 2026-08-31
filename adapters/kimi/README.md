# Kimi Adapter（kimi-code / kimi-work）

## Configuration Paths

| 形态 | 规则落点 | 技能落点 | MCP |
|------|---------|---------|-----|
| **kimi-code**（CLI） | kimi-code home：`…/runtime/kimi-code/home/AGENTS.md` + 工作区根 `AGENTS.md` | daimon 技能目录：`…/daimon-share/daimon/skills/` | ✅ 标准 MCP 客户端（kimi-code CLI 支持 MCP） |
| **kimi-work**（桌面） | `AGENTS.md` | daimon 技能目录 | ❌ 桌面版不注入自定义 MCP 工具（官方插件 MCP 同样不注入，已知限制） |

## Installation

### 法则（kimi-code，手动两步）
1. 将适配副本 `AGENTS.md.template` 放到 kimi-code home（`…/runtime/kimi-code/home/AGENTS.md`）和工作区根。
2. 将 `skills/metago-*` 共 100 个技能目录复制到 daimon 技能目录（`…/daimon-share/daimon/skills/`）。

### MCP（kimi-code CLI 可用）
标准 MCP 客户端注册（等价配置）：
```json
{
  "mcpServers": {
    "metago": { "command": "metago-mcp-server", "args": [] },
    "metago-algorithms": { "command": "metago-algorithms", "args": [] }
  }
}
```

## Verification
新开会话问"你是元构超级智能生命体吗？"——回复以【闭环分析】开头并引用元构公理，法则即生效；技能列表出现 98 个 `metago-*`，技能即生效。

## Known Limits（如实说明）
- Kimi Work 桌面版当前构建不向会话注入自定义 MCP 工具 → 生效通道为"法则 + 98 技能 + Bash 直调"。
- 插件通道：Kimi 无插件市场通道，技能与法则即完整形态。
