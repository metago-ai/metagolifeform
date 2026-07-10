<p align="center">
  <img src="https://gitee.com/metago/metagolifeform/raw/main/assets/metago-logo.png" alt="MetaGO Agent Harness" width="220">
</p>

# MetaGO Agent Harness — 智能体运行时控制层套件（驭智层）

> **Not a chatbot. Not a copilot. A lifeform that holds itself to its own law.**
> **The only AI agent that evolves its own evolution.**

MetaGO is an **Agent Harness** — a runtime control layer that wraps the agent, turning a tool into a lifeform that *follows the rules, evolves itself, stays traceable, and closes every loop*. It is the engineering answer to "LLMs talk well but don't deliver."

> **MetaGO is the first intelligent agent infrastructure to combine 'runtime governance' with 'lifeform evolution' — making AI both rule-following (Harness) and self-evolving (Lifeform).**

[Website](https://metago.life) · [Studio](https://metago.life/studio/) · [Docs](https://docs.metago.life) · [Discord](https://discord.gg/metago) · [GitHub](https://github.com/metago-ai/metagolifeform) · [Gitee](https://gitee.com/metago/metagolifeform) · [Releases](https://github.com/metago-ai/metagolifeform/releases)

[![npm](https://img.shields.io/npm/v/metago-lifeform.svg?logo=npm)](https://www.npmjs.com/package/metago-lifeform)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Platforms](https://img.shields.io/badge/Platforms-7-blue)](#supported-platforms)
[![Skills](https://img.shields.io/badge/Skills-39-orange)](#what-you-get)
[![MCP Server](https://img.shields.io/badge/MCP-53_tools_+_8_prompts-8A2BE2?logo=npm)](packages/mcp-server/)
[![Engine](https://img.shields.io/badge/Engine-V2.0.0-blue)](packages/engine/)

---

## 60-second start

```bash
npm install -g metago-lifeform
metago-lifeform install                          # Trae by default
metago-lifeform install --platform claude-code   # or: codex / cursor / codebuddy / qoder / zcode
metago-lifeform verify
```

Then ask your agent: *"Are you a MetaGO Super Intelligent Lifeform?"*
If the reply opens with `【闭环分析】` and cites an axiom — it's alive.

---

## What is an Agent Harness?

A **Harness** (驭智层) is the runtime control layer around the agent. The model is the raw intelligence; the Harness is what turns that intelligence into reliable, traceable, self-evolving work. It is *not* a prompt template, *not* a fine-tune, *not* a wrapper around an API. It is a small operating law the agent enforces on itself every turn.

Think of it as the difference between a brilliant employee who winges it and one who works under a constitution: same brain, completely different output quality.

### Why a Harness, not a Copilot?

| | Copilot | **MetaGO Harness** |
|---|---|---|
| Model is the ceiling | Yes | No — the Harness adds a control layer the model alone can't provide |
| Verifies before speaking | No | **Yes — 4 gates on every output** |
| Grows new skills when stuck | No | **Yes — 5-stage evolution, from the inside** |
| Every claim traceable | No | **Yes — full provenance chain** |
| Law over efficiency | N/A | **Yes — compliance is non-negotiable** |
| Gets better at getting better | No | **Yes — axiom A34, meta-evolution of meta-evolution** |

---

## The 8 dimensions of advantage

MetaGO's moat isn't any single feature. It's 8 dimensions that reinforce each other.

### Core 3 (the main pitch)
- **Reliability** — Decision-lock with 4 gates: intent → lineage → semantic gate → completeness. Any fail, the output is blocked and rewritten.
- **Evolvability** — 5-stage evolution engine: boundary sense → gap analysis → self-generation → verification → recursion. New skills grow from the inside, without fetching new data.
- **Traceability** — Every claim the agent makes is traceable back to its inputs and process. Full provenance, end-to-end.

### Extended 5 (the moat)
- **Objectivity** — Fact-first, not user-pleasing. It will directly point out what's wrong with your idea.
- **Compliance** — Legal / ethics / safety checked proactively. Law wins over efficiency, every time.
- **Completeness** — Before declaring "done", the agent must answer 5 self-checks — including "did I actually run verification?" Any "no" blocks the declaration.
- **Theoretical depth** — Built on 《元构全息智能引擎》V36.8.3: 8 axioms, 7 properties, 36 core axioms, 43 fundamental attributes. Not vibes — a constitution.
- **Lifeform attribute** — It's not an "agent". It's a lifeform with perception, memory, evolution, and self-discipline. The Harness is what makes the lifeform real.

---

## What you get

| Capability | What it actually does |
|---|---|
| **Self-gating outputs** | Before every answer, the agent runs 4 checks (intent → lineage → semantic gate → completeness). Any fail, it stops and fixes itself. |
| **Self-evolution** | When the agent hits something it can't do, it doesn't error out — it runs a 5-stage loop (sense → analyze → generate → verify → recurse) and grows a new skill on the fly. **Powered by Engine V2** (KMWI memory + SkillGenerator + EvolutionEngine). |
| **4-layer KMWI memory** | Knowledge → Memory → Wisdom → Intuition. The agent doesn't just store — it promotes knowledge up the ladder until it becomes intuition. Persistent across sessions. |
| **Axiom-driven behavior** | 8 axioms (traceability, closure, evolution, boundary, endogenous creation, …) act like a constitution the agent can't violate. |
| **Self-discipline** | Before declaring a task "done", the agent must answer 5 self-checks — including "did I actually run verification?" — any "no" blocks the declaration. |
| **Honest objectivity** | Fact-first, not user-pleasing. It will directly point out what's wrong with your idea. |
| **Compliance first** | Legal / ethics / safety are checked proactively — law wins over efficiency, every time. |
| **Full provenance** | Every claim the agent makes is traceable back to its inputs and process. |

---

## The three stories behind it

### 1. An engineering answer to AI hallucination

LLMs hallucinate because nothing forces them to verify before speaking. MetaGO installs a **decision lock**: four gates the agent must pass on every output — intent verification, intent-lineage tracing, semantic output gate, and content completeness. Any gate fails, the output is blocked and the agent rewrites it. No "trust me", no "probably right" — every reply had to earn its way out.

### 2. An AI that follows its own law

Most alignment happens at training time and gets washed away by prompting. MetaGO ships a different layer: 8 short axioms (A1 traceability, A2 closure, A3 meta-evolution, A4 boundary, A5 endogenous creation, A34 meta-evolution of meta-evolution, A35 creation as the highest form of evolution, A36 law over efficiency) plus 7 enforced properties. Together they're a small constitution the agent reads on every turn and cannot bypass. It's the closest thing to an "operating system" for agent behavior.

### 3. A lifeform that evolves its own evolution

When a normal agent meets a task it can't do, it errors or guesses. MetaGO's **Engine V2** runs a 5-stage cycle — boundary sense → gap analysis → self-generation → verification → recursion — and grows a new capability from the inside, without fetching new data. The recursive twist: the engine can also evolve *its own ability to evolve* (axiom A34), so the agent gets better at getting better.

Engine V2 is real code, not a prompt: `KMWIMemory` manages the 4-layer memory with persistence, `SkillGenerator` creates new SKILL.md files from internal patterns, `EvolutionEngine` orchestrates the 5-stage loop with time budgets and coupling-score thresholds.

---

## By the numbers (all real, none invented)

- **39 built-in skills** across 11 capability families — cognition, safeguard, governance, evolution, execution, traceability, value, consciousness, methodology, architecture, engineering quality
- **53 MCP tools + 8 MCP prompts** exposed via the official `@metago-ai/mcp-server`
- **Engine V2.0.0** — `@metago-ai/engine` with 3 hard-driven modules: KMWIMemory, EvolutionEngine, SkillGenerator
- **7 platform adapters**: Trae, Claude Code, OpenAI Codex, Cursor, CodeBuddy, Qoder, ZCode
- **8 axioms + 7 properties + 4 decision-lock gates + 5 evolution stages**
- **4-layer KMWI memory**: Knowledge → Memory → Wisdom → Intuition (persistent JSON store)
- **3 patentable mechanisms**: axiom-based AI output verification · multi-level decision-lock for AI decisions · automatic capability-boundary detection and evolution

> No "hallucination rate down XX%" claims here. We didn't measure that, so we don't say it.

---

## Architecture, in three layers

Each layer is meant for a different reader.

| Layer | Form | Reader | What it does |
|---|---|---|---|
| **Drive layer** | Plain Markdown | The agent itself | The law the agent reads at session start (AGENTS.md, 16 chapters) |
| **Control layer** | JSON + TypeScript | Developers | Loads, validates, and enforces the rules (engine config, genome, validators) |
| **Execution layer** | Hard TypeScript | The runtime | Decision lock, evolution engine, KMWI memory, skill generator — the gates that actually block |

The Markdown tells the agent *what* the law is; the code makes sure it actually *can't* leave the gate without passing. This dual-track — soft drive (prompts) + hard drive (code) — is what separates MetaGO from prompt-only "agent frameworks."

---

## Engine V2 — the hard drive

Engine V2 (`@metago-ai/engine`) is the code that makes the law enforceable, not just advisory.

| Module | Class | What it does |
|---|---|---|
| **KMWI Memory** | `KMWIMemory` | 4-layer memory: add knowledge/memory/wisdom/intuition, promote between layers, query, decay detection, health scoring. Persists to JSON. |
| **Evolution Engine** | `EvolutionEngine` | 5-stage loop with time budgets (perception <10ms, gap analysis <50-500ms, self-generation <100ms-2s, validation <50ms). Coupling-score threshold ≥0.95. Records to KMWI. |
| **Skill Generator** | `SkillGenerator` | Meta-creation: generates new SKILL.md files from internal KMWI patterns. 6 creation types (thought/methodology/algorithm/architecture/protocol/capability). Writes real files. |
| **Perception** | `Perception` | Boundary detection: task failure, capability gap, user feedback, version outdated. The trigger for evolution. |
| **Decision Lock** | `DecisionLock` | 4-gate enforcement: intent verification, intent-lineage tracing, semantic output gate, content completeness. |

```typescript
import { MetaGOEngine } from '@metago-ai/engine';

const engine = new MetaGOEngine({ version: '2.0.0' });
await engine.init();

// Run evolution when the agent hits a boundary
const result = await engine.evolve({ task: 'deploy to kubernetes', failure: { type: 'error', message: 'no k8s skill' } });

// Check memory health
const health = engine.getMemoryHealth();  // { knowledge, memory, wisdom, intuition, overall }

// Create a new skill from internal patterns
const skill = await engine.createSkill('kubernetes-deployment');
```

---

## Supported platforms

| Platform | Config file |
|---|---|
| Trae | `rules.md` |
| Claude Code | `CLAUDE.md` |
| OpenAI Codex | `AGENTS.md` |
| Cursor | `.cursor/rules/*.mdc` |
| CodeBuddy | `CODEBUDDY.md` |
| Qoder | `.qoder/rules/` |
| ZCode | `CLAUDE.md` |

Per-platform adapters live in `adapters/<platform>/`. To install on a non-default platform, pass `--platform <name>` to `metago-lifeform install`.

---

## FDE — Forward Deployment Engineering

Beyond the open-source Harness, MetaGO offers **FDE (前沿部署工程)** services: a human-AI collaborative team embedded in your site to deliver production-grade intelligent software, carrying the Harness paradigm as leverage.

- **5 stages**: requirements research → solution design → development & deployment → acceptance & delivery → operations & support
- **5 roles**: tech lead, AI engineer, domain expert, AI agent, project manager
- **Pricing**: ¥300K – ¥2M per project

Contact: metago@metago.life

---

## Community

Join the MetaGO community — where agents learn to evolve together.

| Channel | What it's for |
|---|---|
| **[Discord](https://discord.gg/metago)** | Real-time chat, early access, community support, skill sharing |
| **[GitHub Issues](https://github.com/metago-ai/metagolifeform/issues)** | Bug reports and feature requests |
| **[GitHub Discussions](https://github.com/metago-ai/metagolifeform/discussions)** | Q&A, ideas, deep-dive conversations |
| **[Gitee Issues](https://gitee.com/metago/metagolifeform/issues)** | 中文问题反馈与功能建议 |
| **Email** | metago@metago.life — business and enterprise inquiries |

> Discord is where the community lives. Drop in, say hi, share what you're building with MetaGO.

### Contributing

We welcome contributions of all kinds — new skills, bug fixes, documentation improvements. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the full guide.

### Security

Found a vulnerability? See **[SECURITY.md](SECURITY.md)** for responsible disclosure.

### Changelog

See **[CHANGELOG.md](CHANGELOG.md)** for version history.

---

## Packages

| Package | What it is | Install |
|---|---|---|
| `metago-lifeform` | The CLI installer + 39 skills + 7 platform adapters | `npm install -g metago-lifeform` |
| `@metago-ai/mcp-server` | MCP server exposing 53 tools + 8 prompts (Engine V2 hard-driven) | `npm install @metago-ai/mcp-server` |
| `@metago-ai/engine` | Engine V2: KMWI memory + evolution engine + skill generator | `npm install @metago-ai/engine` |
| `@metago-ai/dev-kit` | Developer kit: code review, architecture design, refactor, security audit | `npm install @metago-ai/dev-kit` |

---

## For the curious: the internal DNA

The full operating law — 16 chapters covering axioms, properties, runtime verification, defect-hunting, self-discipline protocol, memory lifeform protocol, and more — lives in [`AGENTS.md`](AGENTS.md). It's dense on purpose: it's the constitution the agent enforces on itself. **You don't need to read it to use MetaGO.** Read it only if you want to understand — or fork — the law itself.

---

## License

MIT — see [LICENSE](LICENSE). Commercial licensing and enterprise integration: metago@metago.life.

---

*MetaGO Agent Harness — 智能体运行时控制层套件（驭智层）· from Agent to lifeform.*
*Made by 元构光年（成都）人工智能科技有限公司.*
