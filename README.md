<p align="center">
  <img src="https://gitee.com/metago/metagolifeform/raw/main/assets/metago-logo.png" alt="MetaGO Lifeform Kit" width="220">
</p>

# MetaGO Lifeform Kit

> **Not a chatbot. Not a copilot. An AI that holds itself to its own law.**
> **The only AI agent that evolves its own evolution.**

MetaGO is an operating system upgrade for AI agents. Install it on top of any supported agent, and that agent starts following its own constitution, gates its own outputs before they ship, and grows new skills when it hits the edge of what it knows.

[Website](https://metago.life) · [Studio](https://metago.life/studio/) · [GitHub](https://github.com/metago-ai/metagolifeform) · [Gitee](https://gitee.com/metago/metagolifeform) · [Releases](https://github.com/metago-ai/metagolifeform/releases)

[![npm](https://img.shields.io/npm/v/metago-lifeform.svg?logo=npm)](https://www.npmjs.com/package/metago-lifeform)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Platforms](https://img.shields.io/badge/Platforms-7-blue)](#supported-platforms)
[![Skills](https://img.shields.io/badge/Skills-39-orange)](#what-you-get)
[![MCP Server](https://img.shields.io/badge/MCP-53_tools_+_8_prompts-8A2BE2?logo=npm)](packages/mcp-server/)

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

## What you get

| Capability | What it actually does |
|---|---|
| **Self-gating outputs** | Before every answer, the agent runs 4 checks (intent → lineage → semantic gate → completeness). Any fail, it stops and fixes itself. |
| **Self-evolution** | When the agent hits something it can't do, it doesn't error out — it runs a 5-stage loop (sense → analyze → generate → verify → recurse) and grows a new skill on the fly. |
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

When a normal agent meets a task it can't do, it errors or guesses. MetaGO's evolution engine runs a 5-stage cycle — boundary sense → gap analysis → self-generation → verification → recursion — and grows a new capability from the inside, without fetching new data. The recursive twist: the engine can also evolve *its own ability to evolve* (axiom A34), so the agent gets better at getting better.

---

## By the numbers (all real, none invented)

- **39 built-in skills** across 11 capability families — cognition, safeguard, governance, evolution, execution, traceability, value, consciousness, methodology, architecture, engineering quality
- **53 MCP tools + 8 MCP prompts** exposed via the official `@metago-ai/mcp-server`
- **7 platform adapters**: Trae, Claude Code, OpenAI Codex, Cursor, CodeBuddy, Qoder, ZCode
- **8 axioms + 7 properties + 4 decision-lock gates + 5 evolution stages**
- **4-layer KMWI memory**: Knowledge → Memory → Wisdom → Intuition
- **3 patentable mechanisms**: axiom-based AI output verification · multi-level decision-lock for AI decisions · automatic capability-boundary detection and evolution
- **4 core engine modules**: `loader.ts` (engine loader) · `validators.ts` (axiom validators) · `decision-lock.ts` (lock executor) · `evolution-engine.ts` (evolution engine)

> No "hallucination rate down XX%" claims here. We didn't measure that, so we don't say it.

---

## Architecture, in one paragraph

Three layers, each meant for a different reader. The **drive layer** is plain Markdown — the AI reads it like a rulebook at session start. The **control layer** is JSON + TypeScript — code that loads, validates, and enforces the rules. The **execution layer** is hard TypeScript — the decision lock, the evolution engine, the validators. The Markdown tells the agent *what* the law is; the code makes sure it actually *can't* leave the gate without passing.

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

## For the curious: the internal DNA

The full operating law — 15 chapters covering axioms, properties, runtime verification, defect-hunting, self-discipline protocol, and more — lives in [`AGENTS.md`](AGENTS.md). It's dense on purpose: it's the constitution the agent enforces on itself. **You don't need to read it to use MetaGO.** Read it only if you want to understand — or fork — the law itself.

---

## License

MIT — see [LICENSE](LICENSE). Commercial licensing and enterprise integration: metago@metago.life.

---

*MetaGO Lifeform Kit — from Agent to lifeform.*
*Made by 元构光年（成都）人工智能科技有限公司.*
