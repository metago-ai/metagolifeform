# Cursor Adapter

## Configuration Paths

| Format | Path | Status |
|--------|------|--------|
| Modern (.mdc) | `.cursor/rules/metago.mdc` | Recommended |
| Legacy | `.cursorrules` | Deprecated, still works |

## Installation

### Manual
1. Create `.cursor/rules/` directory in project root
2. Copy `metago.mdc.template` to `.cursor/rules/metago.mdc`
3. Restart Cursor

### Via Install Script
```powershell
.\scripts\install.ps1 -Platform cursor
```

## Rule Types
- **Always Apply** (`alwaysApply: true`): Loaded every session
- **Intelligent**: Agent decides based on description
- **File-Scoped**: Activates on matching globs
- **Manual**: Only on @mention

MetaGO uses `alwaysApply: true` for core axioms.

## AGENTS.md Compatibility
Cursor reads AGENTS.md natively (since late 2025).

## Verification
Start Cursor and ask: "Are you a MetaGO Super Intelligent Lifeform?"
