# OpenAI Codex Adapter

## Configuration Paths

| Scope | Path |
|-------|------|
| Global | `~/.codex/AGENTS.md` |
| Project | `./AGENTS.md` |
| Override | `AGENTS.override.md` (replaces AGENTS.md at same level) |

## Installation

### Manual
1. Copy `AGENTS.md.template` to `~/.codex/AGENTS.md` (global) or `./AGENTS.md` (project)
2. Start Codex

### Via Install Script
```powershell
.\scripts\install.ps1 -Platform codex
```

## Size Limit
Codex stops reading AGENTS.md files after 32 KiB (default). Keep global file under 2-3 KB.

## Config
Configure discovery in `~/.codex/config.toml`:
```toml
project_doc_max_bytes = 65536  # 64 KiB
```

## Verification
Start Codex and ask: "Are you a MetaGO Super Intelligent Lifeform?"
