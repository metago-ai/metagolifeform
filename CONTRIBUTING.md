# Contributing to MetaGO Agent Harness

First off, thank you for considering contributing to MetaGO. It's people like you that make the agent ecosystem evolve.

> MetaGO is an **Agent Harness** — a runtime control layer that turns AI agents into self-evolving lifeforms. This guide is for developers who want to extend, fix, or improve it.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Before You Start](#before-you-start)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Skill Contribution Guide](#skill-contribution-guide)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Testing](#testing)
- [Release Process](#release-process)

---

## Code of Conduct

This project follows a simple principle: **be direct, be honest, be constructive.** We inherit MetaGO's axiom D38 (absolute objectivity) — facts over feelings, criticism over flattery. If something is wrong, say so clearly. If you receive criticism, accept it as data, not attack.

---

## Before You Start

MetaGO is not a typical npm package. It has three layers:

1. **Drive layer** (Markdown) — The operating law the agent reads (AGENTS.md, skill SKILL.md files)
2. **Control layer** (JSON + TypeScript) — Config, genome, validators
3. **Execution layer** (TypeScript) — Engine V2: DecisionLock, EvolutionEngine, KMWIMemory, SkillGenerator

Before contributing, please read:
- [README.md](README.md) — What MetaGO is
- [AGENTS.md](AGENTS.md) — The 16-chapter operating law (the constitution)
- [MANIFESTO.md](MANIFESTO.md) — Why this exists

---

## Development Setup

### Prerequisites

- **Node.js** >= 14.0.0
- **npm** >= 7.0.0 (for workspace support)
- **PowerShell** (for install/verify scripts on Windows) or **bash** (on Linux/macOS)

### Clone and Install

```bash
git clone https://github.com/metago-ai/metagolifeform.git
cd metagolifeform
npm install
```

### Verify Your Setup

```bash
# Run the registration uniqueness test
node scripts/test-registration-uniqueness.cjs

# Verify the CLI works
node scripts/cli.js verify

# Run Engine V2 tests
cd packages/engine && npm test
```

### Build MCP Server

```bash
cd packages/mcp-server
npm run build
npm start
```

---

## Project Structure

```
metago-lifeform/
├── core/                   # The operating law (METAGO_CORE.md)
├── adapters/               # Platform adapters (trae, claude-code, codex, ...)
├── skills/                 # 39 built-in skills (metago-* prefix)
│   ├── metago-critique/
│   ├── metago-decision-lock/
│   └── ...
├── packages/
│   ├── engine/             # @metago-ai/engine — Engine V2 (KMWI, Evolution, SkillGen)
│   ├── mcp-server/         # @metago-ai/mcp-server — 53 MCP tools + 8 prompts
│   ├── dev-kit/            # @metago-ai/dev-kit — Code review, architecture, refactor
│   ├── dashboard/          # Capability metrics dashboard
│   └── demo/               # Killer demo
├── scripts/                # CLI, install, verify, test scripts
├── docs/                   # Living document system (MANIFEST.json, MAP.md)
├── assets/                 # Logo and images
├── AGENTS.md               # The 16-chapter operating law
├── README.md
├── LICENSE
└── package.json
```

---

## How to Contribute

### Reporting Bugs

Before creating a bug report, please:
1. Search [existing issues](https://github.com/metago-ai/metagolifeform/issues) to avoid duplicates.
2. Verify the bug exists on the latest `main` branch.

When filing a bug report, include:
- **Platform**: Which AI platform (Trae / Claude Code / Codex / Cursor / CodeBuddy / Qoder / ZCode)
- **MetaGO version**: Output of `metago-lifeform verify`
- **Steps to reproduce**: Exact commands or agent interactions
- **Expected vs actual behavior**
- **Logs**: Any error output or decision-lock failure messages

### Suggesting Enhancements

Enhancement suggestions are welcome. Please:
1. Check the [roadmap](docs/MAP.md) first — it might already be planned.
2. Open a [GitHub Discussion](https://github.com/metago-ai/metagolifeform/discussions) to gauge interest before coding.
3. Clearly describe: **what problem does this solve?** (Not just "it would be cool if...")

### Pull Requests

1. **Fork** the repo and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Write code** following [Coding Standards](#coding-standards).
3. **Write tests** if applicable (see [Testing](#testing)).
4. **Run verification**:
   ```bash
   node scripts/test-registration-uniqueness.cjs
   ```
5. **Commit** using [Commit Convention](#commit-convention).
6. **Push** and open a PR with a clear description.

PR template:
```markdown
## What
[One-sentence summary]

## Why
[The problem this solves]

## How
[Key implementation decisions]

## Verification
- [ ] Registration uniqueness test passes
- [ ] Engine V2 tests pass (if engine code changed)
- [ ] Manually verified on [platform]
```

---

## Skill Contribution Guide

MetaGO skills are the most common contribution. Each skill lives in `skills/metago-<name>/` and must:

1. **Be prefixed with `metago-`** — no exceptions.
2. **Contain a `SKILL.md`** with:
   - Name, description, trigger conditions
   - Input/output specification
   - At least one certification test case
3. **Register in the skill registry** — update `scripts/test-registration-uniqueness.cjs` if needed.
4. **Not duplicate** existing skills — check the [skill map](docs/MAP.md) first.

### Skill Template

```
skills/metago-<name>/
├── SKILL.md          # Skill definition
├── test.cjs          # Certification test (optional but recommended)
└── examples/         # Usage examples (optional)
```

SKILL.md frontmatter:
```markdown
---
name: metago-<name>
family: cognition|safeguard|governance|evolution|execution|traceability|value|consciousness|methodology|architecture|engineering
version: 1.0.0
---
```

---

## Coding Standards

### TypeScript (Engine, MCP Server, Dev Kit)

- **Strict mode**: `strict: true` in tsconfig.json
- **No `any`**: Use `unknown` and type-guard, or define a proper type.
- **Explicit return types** on exported functions.
- **Error handling**: `try/catch` with typed errors. No `catch(e: any)`.
- **No `console.log`** in production code — use the logger utility.

### Markdown (Skills, AGENTS.md, Docs)

- **Chinese is the primary language** for AGENTS.md and skill content (MetaGO is made in China).
- **English is the primary language** for README.md, API docs, and code comments.
- **No emojis** unless the skill explicitly requires them.
- **Tables over walls of text** for structured data.

### JSON (Config, Genome)

- **2-space indentation**.
- **No trailing commas** (JSON spec compliance).
- **Schema-validated** — if you add a new config field, update the schema.

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>
```

**Types**:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `refactor` — Code change that neither fixes a bug nor adds a feature
- `test` — Adding or correcting tests
- `chore` — Build, CI, tooling, version bumps
- `ci` — CI/CD changes

**Examples**:
```
feat(engine): add KMWI memory decay detection
fix(mcp-server): correct tool count in registration test
docs: update README badge for Engine V2
chore: bump to v36.8.4
```

---

## Testing

### Registration Uniqueness Test (Mandatory)

Every PR must pass:
```bash
node scripts/test-registration-uniqueness.cjs
```
This ensures TOTAL_TOOLS=35 and DUPLICATES=0.

### Engine V2 Tests

If you modify `packages/engine/`:
```bash
cd packages/engine
npm test
```

### Manual Verification

For changes affecting agent behavior, verify on at least one platform:
```bash
metago-lifeform install --platform trae
# Ask the agent: "Are you a MetaGO Super Intelligent Lifeform?"
# Expected: reply opens with 【闭环分析】 and cites an axiom
```

---

## Release Process

Releases are automated via GitHub Actions:

1. **Tag push** triggers the publish workflow.
2. The workflow runs tests, builds, and publishes to npm.
3. A GitHub Release is automatically created.

To cut a release:
```bash
npm version <patch|minor|major>
git push --tags
```

Only maintainers can push release tags. Contributors should not version-bump in PRs.

---

## Questions?

- **GitHub Issues** — Bugs and feature requests
- **GitHub Discussions** — Questions and ideas
- **Email** — metago@metago.life

---

*By contributing, you agree that your contributions will be licensed under the MIT License.*
