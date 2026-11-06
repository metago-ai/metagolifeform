# Qoder Adapter

## Configuration Paths

| Type | Path |
|------|------|
| Project Rules | `.qoder/rules/` directory |
| AGENTS.md | Project root `AGENTS.md` (compatible) |

## Installation

### Manual
1. Create `.qoder/rules/` directory in project root
2. Copy `metago-rules.md.template` to `.qoder/rules/metago.md`
3. Set rule type to "始终生效" (Always Active) in Qoder settings
4. Restart Qoder

### Via Install Script
```bash
# Linux / macOS / Git Bash
./scripts/install.sh --platform qoder
```
```powershell
# Windows
.\scripts\install.ps1 -Platform qoder
```

安装器会写入 `~/.qoder-cn/AGENTS.md`、`~/.qoder-cn/skills/`，并把两个 MCP 服务器合并进
`~/.qoder-cn/settings.json` 的 `mcpServers`，不会覆盖其他配置。生成的法则为 5.3 万字符级，
低于 Qoder 规则 100,000 字符上限。

## Rule Types
- **手动引入 (Manual)**: Applied on @rule mention
- **模型决策 (Model Decision)**: Agent decides based on description
- **始终生效 (Always)**: Applied to all sessions
- **指定文件生效 (File-Scoped)**: Applied on matching globs

MetaGO core axioms should use "始终生效" type.

## AGENTS.md Compatibility
Qoder automatically recognizes AGENTS.md files. Copy AGENTS.md to project root for seamless integration.

## Size Limit
All active rule files combined: max 100,000 characters.

## Verification
Start Qoder and ask: "你是元构超级智能生命体吗？"
