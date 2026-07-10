# Changelog

All notable changes to MetaGO Agent Harness are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For the full commit history, see [git log](https://github.com/metago-ai/metagolifeform/commits/main).

---

## [36.8.4] — 2026-07-10

### Changed
- Bumped to v36.8.4 — twelfth round of text description updates
- Fixed MANIFEST.json: `mcp_tools` count 37 → 53, version 1.1.8 → 1.2.3
- Synced living-doc MAP and MANIFEST to V36.8

## [36.8.3] — 2026-07-09

### Added
- Standard scientific name finalized: **MetaGO Agent Harness (智能体运行时控制层套件 · 驭智层)**
- Dev Kit joined the standard naming convention (v1.0.8)

### Changed
- Bumped versions: metago-lifeform 36.8.3, engine 2.0.3, mcp-server 1.2.3, dev-kit 1.0.9
- NPM republished with correct standard name

## [36.8.0] — 2026-07-08

### Added
- **Harness paradigm finalized** — MetaGO positioned as "Agent Harness (驭智层)", the runtime control layer for AI agents
- **Engine V2 hard-driven integration** — KMWI global memory system connected to the engine
- **8-dimension advantage framework**: Reliability + Evolvability + Traceability (core 3) + Objectivity + Compliance + Completeness + Theoretical Depth + Lifeform Attribute (extended 5)

### Changed
- All terminology unified to "Agent Harness" across README, AGENTS.md, package.json
- Deprecated term "Lifeform Kit" removed from all public-facing content

## [36.7.15] — 2026-07-07

### Fixed
- NPM description corrected: MCP tools count updated to 53
- MCP-server tests aligned with V3 tool counts (37 skills, 22 toolkit, 53 total)

## [36.7.12] — 2026-07-05

### Added
- **Engine V2** (`@metago-ai/engine`) — 3 hard-driven modules: KMWIMemory, EvolutionEngine, SkillGenerator
- **Verify Kit** — delivery gate verification toolkit
- Skill count: 37 → 39
- MCP tools count: 35 → 37 (later corrected to 53)

### Changed
- All platform data synchronized to v36.7.12

## [36.7.0] — 2026-07-01

### Added
- **Harness paradigm introduction** — MetaGO repositioned from "Lifeform Kit" to "Agent Harness"
- **Engine V2 hard drive** — dual-track drive (prompt soft drive + code hard drive)
- **KMWI memory system** — 4-layer memory: Knowledge → Memory → Wisdom → Intuition

## [36.6.0] — 2026-06-28

### Added
- Studio product upgrade decisions confirmed:
  - Phase 1: SaaS platform
  - Authentication: email + GitHub OAuth AND phone + SMS
  - Pricing: Free tier + Pro subscription (Freemium)
  - Backend: Tencent Cloud CloudBase
- CloudBase SDK integration began

## [36.5.1] — 2026-06-20

### Fixed
- CLI version hardcoding bug fixed
- CI publish workflow: `workflow_dispatch` branch supplemented with `version=manual` output

## [36.5.0] — 2026-06-15

### Added
- **Killer demo** — 30-second perception of the complete lifeform value loop
- **Capability metrics dashboard** v0.1 with dual-track logging (human-readable + JSONL)
- CI/CD pipeline with NPM version idempotency check

### Fixed
- Engine tarball contamination fixed (added `files` whitelist, v1.0.5)

## [36.4.x] — 2026-05-01 to 2026-06-10

### Added
- 39 built-in skills across 11 capability families
- 7 platform adapters: Trae, Claude Code, Codex, Cursor, CodeBuddy, Qoder, ZCode
- MCP Server with 53 tools + 8 prompts
- Dev Kit: code review, architecture design, refactor, security audit
- Living document system (MANIFEST.json, MAP.md)
- GitHub Actions CI/CD with tag-triggered NPM publishing
- Registration uniqueness test (TOTAL_TOOLS=35, DUPLICATES=0)

### Changed
- Multiple iteration rounds on AGENTS.md (16 chapters)
- Axioms expanded to 8 (A1-A5, A34-A36)
- Properties expanded to 7 (D37-D43)

---

## Version History Summary

| Version | Date | Key Milestone |
|---------|------|---------------|
| 36.8.4 | 2026-07-10 | Living doc sync, MANIFEST fix |
| 36.8.3 | 2026-07-09 | Standard scientific name finalized |
| 36.8.0 | 2026-07-08 | Harness paradigm + 8-dimension advantage |
| 36.7.15 | 2026-07-07 | NPM description fix (53 tools) |
| 36.7.12 | 2026-07-05 | Engine V2 + Verify Kit |
| 36.7.0 | 2026-07-01 | Harness paradigm + KMWI memory |
| 36.6.0 | 2026-06-28 | Studio SaaS + CloudBase |
| 36.5.x | 2026-06-15 | Dashboard + demo + CI idempotency |
| 36.4.x | 2026-05-01 | 39 skills + 7 platforms + 53 MCP tools |

---

*For detailed release notes, see [GitHub Releases](https://github.com/metago-ai/metagolifeform/releases).*
