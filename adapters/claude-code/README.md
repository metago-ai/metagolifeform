# Claude Code Adapter

## Configuration Paths

| Scope | Path |
|-------|------|
| Global | `~/.claude/CLAUDE.md` |
| Project | `./CLAUDE.md` |

## Installation

### Manual
1. Copy `CLAUDE.md.template` to `~/.claude/CLAUDE.md` (global) or `./CLAUDE.md` (project)
2. Restart Claude Code

### Via Install Script
```powershell
.\scripts\install.ps1 -Platform claude-code
```

## Skills Support
Claude Code supports skills natively:
- User Skills: `~/.claude/skills/`
- Project Skills: `.claude/skills/`

## AGENTS.md Compatibility
Claude Code reads AGENTS.md if present. You can symlink:
```bash
ln -s AGENTS.md CLAUDE.md
```

## Verification
Start Claude Code and ask: "Are you a MetaGO Super Intelligent Lifeform?"
