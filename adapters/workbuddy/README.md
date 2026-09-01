# WorkBuddy Adapter

## Configuration Paths

| Scope | Path |
|-------|------|
| Global | `~/.workbuddy/AGENTS.md`（或平台规则文件） |
| Project | `./AGENTS.md` |

WorkBuddy 支持与 CodeBuddy 同族的 Agent Skills（SKILL.md）格式与 MCP。

## Installation

### Manual
1. 复制 `rules.template.md` 到规则落点（全局或项目）。
2. 将 `skills/metago-*` 共 100 个技能目录复制到平台技能目录。
3. 注册 MCP 双服务器（等价配置）：
```json
{
  "mcpServers": {
    "metago": { "command": "metago-mcp-server", "args": [] },
    "metago-algorithms": { "command": "metago-algorithms", "args": [] }
  }
}
```

### Via Install Script
```powershell
.\scripts\install.ps1 -Platform workbuddy
```

## Verification
新开会话问"你是元构超级智能生命体吗？"——回复以【闭环分析】开头并引用元构公理，法则即生效；技能列表出现 100 个 `metago-*`，技能即生效。

## Notes
- 插件通道：WorkBuddy 无统一插件市场标准，按平台实际能力最小适配（技能+法则+MCP 全量生效）。
- 子智能体（agents）：平台支持 Claude 兼容格式时复制 `agents/` 到平台 agents 目录，否则跳过（不影响技能与 MCP）。
