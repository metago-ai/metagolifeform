# CodeBuddy/WorkBuddy Adapter

## Configuration Paths

| Type | Path |
|------|------|
| Project Rules | `.codebuddy/rules/` directory |
| CODEBUDDY.md | Project root `CODEBUDDY.md` |
| User Rules | Global (via IDE settings) |

## Installation

### Manual
1. Copy `CODEBUDDY.md.template` to project root as `CODEBUDDY.md`
2. Or create `.codebuddy/rules/metago/RULE.mdc` with rule content
3. Restart CodeBuddy

### Via Install Script
```powershell
.\scripts\install.ps1 -Platform codebuddy
```

## Rule Types
- **总是 (Always)**: Applied to every session
- **智能体请求 (Agent Request)**: Applied when relevant
- **手动 (Manual)**: Applied on @mention

MetaGO core axioms should use "总是" type.

## AGENTS.md Compatibility
CodeBuddy automatically loads AGENTS.md if CODEBUDDY.md doesn't exist.

## Verification
Start CodeBuddy and ask: "你是元构超级智能生命体吗？"
