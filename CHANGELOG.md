# Changelog

All notable changes to MetaGO Agent Harness are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For the full commit history, see [git log](https://github.com/metago-ai/metagolifeform/commits/main).

---

## [36.8.7] — 2026-07-26

### Fixed（仓库问题全面修复轮，对应问题清单 P0–P3 共 15 项）
- **P0** `@metago-ai/algorithms` 引擎解析重构：四级确定性解析（ENV → 包内置 `engine/` → `@metago-ai/engine` → monorepo 旧路径），927 算法注册表 vendored 进 npm 包（`engine/algorithms/`，112 文件），离开作者机器即可用；版本 1.0.0 → 1.0.1
- **P0** 34 个技能 SKILL.md frontmatter 修复：29 个专家团 `displayName/profession` 的 `en/zh` 缩进补齐，5 个 `metago-expert-*` 补全完整 frontmatter
- **P0** `@metago-ai/engine`：`files` 补 `EVOLUTION.md`（loader.js requiredFiles），`src/cli.ts` 补 shebang，新增 `scripts/verify-dist.cjs` 发布前门禁并挂接 `prepublishOnly`；版本 2.1.0 → 2.1.1
- **P1** `install.sh` / `install.ps1`：技能清单与版本号改为动态扫描（skills/ 目录 + 根 package.json），彻底消除"脚本清单滞后于发布"类缺陷
- **P1** 补齐法则引用但缺失的 3 个脚本：`scripts/pre-delivery-verify.cjs`（第十四章七层验证硬门）、`scripts/test-v41-terminology.cjs`（13.2 术语统一校验）、`scripts/memory-guard.cjs`（第十六章 L4 冻记忆守护）
- **P1** `scripts/cli.js`：`setup-mcp` / `uninstall` / `verify` 新增 macOS/Linux 原生实现，不再无条件调用 PowerShell
- **P1** 修复 `install.ps1` / `verify.ps1` / `uninstall.ps1` / `setup-mcp-server.ps1` 文件头连续 BOM 损坏（12–28 个 U+FEFF 导致 PowerShell 解析报错）
- **P2** 元数据一致性：`INDEX/skills.json` 37 → 95（新增元思想/元能力/专家团/专家扩展/交付质量 5 族，共 16 族）、`INDEX/tools.json` 35/1.1.0 → 53/1.3.0、`engines.json` / `knowledge.json` / `GENOME.json` / `ENGINE.md` / `AXIOMS.md` 版本对齐 V36.8.7
- **P2** 文档数字同步：`GETTING_STARTED.md` / `PRD.md` 39 → 95 技能，`MCP_SERVER.md` v1.1.8/37 tools → v1.3.0/53 tools
- **P2** 根 `package.json` `verify:delivery` 路径 `../scripts/` → `scripts/` 修正，新增 `verify:terminology` / `verify:memory`
- **P3** `scripts/init-kmwi-store.cjs` 去私有化：移除作者个人种子数据与 `~/.trae-cn` 硬编码，改为参数化 + 通用示例数据
- **P3** AGENTS.md 私有路径（`c:\Users\MetaGO` / `d:\元构能力`）参数化说明；`metago-verify` bin 从空桩升级为真实验证实现

## [36.8.6] — 2026-07-26

### Fixed
- 95 技能完整性补丁（npm tarball 校验确认 95 个 SKILL.md 全部入包）

## [36.8.5] — 2026-07-26

### Added
- **skills/ 39 → 95**：新增 19 个元思想技能（metago-thought-01~19）+ 30 个专家团技能 + 5 个专家扩展技能 + 2 个元能力技能
- **@metago-ai/algorithms@1.0.0**：新包，927 算法 MCP 服务器（57 tools / 14 触发大类 / 4 层架构）
- **packages/engine V2.1.0**：927 算法硬驱动
- **packages/mcp-server V1.3.0**：Engine V2.1.0 依赖
- **packages/dev-kit V1.1.0**：恢复 4 个 Dev Kit SKILL.md
- **packages/verify-kit V1.1.0**：七层验证 + L8 缺陷猎杀
- **AGENTS.md 第十七章**：算法触发条件

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
