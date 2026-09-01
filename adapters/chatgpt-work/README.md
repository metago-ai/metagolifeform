# ChatGPT Work Adapter

## Configuration Paths

| Scope | Path |
|-------|------|
| Global | `~/.chatgpt/AGENTS.md`（或平台规则文件） |
| Project | `./AGENTS.md` |

ChatGPT Work 为 Agent Plugins 1.0.0 兼容客户端（OpenAI 系），原生支持 Agent Skills（SKILL.md）与 MCP。

## Installation

### Manual
1. 复制 `AGENTS.md.template` 到规则落点。
2. 将 `skills/metago-*` 共 100 个技能目录复制到平台技能目录。
3. 安装插件包：将 `plugins/agent-plugins-1.0.0/`（根 `plugin.json` + `skills/` + `mcp.json`）作为 Agent Plugin 安装到客户端。
4. 或注册 MCP 双服务器（等价配置）：
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
.\scripts\install.ps1 -Platform chatgpt-work
```

## Verification
新开会话问"你是元构超级智能生命体吗？"——回复以【闭环分析】开头并引用元构公理，法则即生效；技能列表出现 100 个 `metago-*`，技能即生效。

## Notes
- 插件通道：Agent Plugins 1.0.0（根 plugin.json + skills/ + mcp.json + com.metago.life/ 扩展目录）。
- 子智能体（agents）：Agent Plugins 1.0.0 v1 规范不含 agents 组件 → 平台支持时从 `com.metago.life/agents/` 加载，否则跳过。
