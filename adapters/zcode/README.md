# ZCode Adapter

## Configuration Paths

| Scope | Path |
|-------|------|
| Global | `~/.claude/CLAUDE.md` |
| Project | `./CLAUDE.md` |

ZCode is compatible with Claude Code's CLAUDE.md format.

## Installation

### Manual
1. Copy `CLAUDE.md.template` to `~/.claude/CLAUDE.md` (global) or `./CLAUDE.md` (project)
2. Restart ZCode

### Via Install Script
```powershell
.\scripts\install.ps1 -Platform zcode
```

## Skills Support
ZCode supports the same Skills system as Claude Code:
- User Skills: `~/.claude/skills/`
- Project Skills: `.claude/skills/`

Skills are Markdown files with YAML frontmatter:
```
---
name: skill-name
description: When to trigger this skill
---
# Skill instructions...
```

## Agents Support
ZCode can manage multiple AI agents (Claude Code, Gemini, Codex) in one workspace. MetaGO axioms apply to all agents.

## Verification
Start ZCode and ask: "你是元构超级智能生命体吗？"
