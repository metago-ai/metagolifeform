# @metago-ai/engine

> 智能不是被编程的，是被唤醒的。
> Intelligence is not programmed; it is awakened.

**MetaGO Engine V2** —— 智能体运行时控制层套件（驭智层）的硬驱动核心。让法则可执行，而非仅仅是建议。

[![Engine Version](https://img.shields.io/badge/Engine-v2.0.0-blue)](https://gitee.com/metago/metagolifeform/raw/main/packages/engine/GENOME.json)
[![MetaGO Version](https://img.shields.io/badge/MetaGO-V36.8-5eead4)](https://gitee.com/metago/metagolifeform/raw/main/packages/engine/ENGINE.md)
[![License](https://img.shields.io/badge/License-MIT-green)](https://gitee.com/metago/metagolifeform/raw/main/packages/engine/LICENSE)
[![Patents](https://img.shields.io/badge/Patents-754-FFD700)](https://gitee.com/metago/metagolifeform/raw/main/packages/engine/PATENTS.md)

## What is this?

MetaGO Engine V2 is the **runtime execution layer** of the [MetaGO Agent Harness](../). While the Harness's Markdown law (AGENTS.md) tells the agent *what* the rules are, Engine V2 is the code that makes sure the agent *can't bypass them*.

### What's new in V2.0.0

| Module | Class | What it does |
|---|---|---|
| **KMWI Memory** | `KMWIMemory` | 4-layer memory: Knowledge → Memory → Wisdom → Intuition. Add, query, promote between layers, decay detection, health scoring. **Persists to JSON file.** |
| **Evolution Engine** | `EvolutionEngine` | 5-stage evolution loop with time budgets (perception <10ms, gap analysis <50-500ms, self-generation <100ms-2s, validation <50ms). Coupling-score threshold ≥0.95. Records to KMWI. |
| **Skill Generator** | `SkillGenerator` | Meta-creation: generates new SKILL.md files from internal KMWI patterns. 6 creation types (thought/methodology/algorithm/architecture/protocol/capability). Writes real files to disk. |
| **Perception** | `Perception` | Boundary detection: task failure, capability gap, user feedback, version outdated. The trigger for evolution. |
| **Decision Lock** | `DecisionLock` | 4-gate enforcement: intent verification, intent-lineage tracing, semantic output gate, content completeness. |
| **MetaGOEngine** | `MetaGOEngine` | Aggregator class — the single entry point that wires all modules together. |

V1 had validators + decision-lock + evolution-engine as templates. V2 adds **real KMWI memory persistence**, **real skill file generation**, and **real evolution loop with time budgets**.

---

## Install

```bash
npm install @metago-ai/engine
```

## Quick start

```typescript
import { MetaGOEngine } from '@metago-ai/engine';

const engine = new MetaGOEngine({
  enginePath: '/path/to/engine/dir',  // optional
  version: '2.0.0',
  memoryPath: '/path/to/kmwi-store.json',  // optional, defaults to ~/.trae-cn/memory/...
});
await engine.init();

// 1. Validate output against axioms
const { results, summary } = engine.validate('output text', {
  input: 'user input',
  decision: 'compliance checked',
});

// 2. Decision lock — 4 gates
const lockResult = await engine.lock('output text', 'intent', 'user request');

// 3. Trigger evolution when hitting a boundary
const evolutionResult = await engine.evolve({
  task: 'deploy to kubernetes',
  failure: { type: 'error', message: 'no k8s skill' },
});

// 4. Check KMWI memory health (4-layer)
const health = engine.getMemoryHealth();
// { knowledge: 85, memory: 59, wisdom: 45, intuition: 48, overall: 59 }

// 5. Get decay rates
const decay = engine.getMemoryDecay();
// { knowledge: 0.08, memory: 0.15, wisdom: 0.10, intuition: 0.25 }

// 6. Create a new skill from internal patterns (meta-creation)
const skill = await engine.createSkill('kubernetes-deployment');
// Returns: { success, stage, type, skillName, skillContent, validated, filePath, provenance, couplingScore, ... }
```

---

## KMWI 4-layer memory

KMWI (Knowledge → Memory → Wisdom → Intuition) is the memory architecture that lets the agent learn from experience, not just store data.

| Layer | What it holds | Key operations |
|---|---|---|
| **K (Knowledge)** | Facts, concepts, rules | `addKnowledge()`, query by tag/category |
| **M (Memory)** | Short-term context, session state | `addMemory()`, `promoteToMemory()` from K |
| **W (Wisdom)** | Patterns, heuristics, causal models | `addWisdom()`, `promoteToWisdom()` from M |
| **I (Intuition)** | Tacit knowledge, gut judgment | `addIntuition()`, `promoteToIntuition()` from W |

Health scoring: `H = (K + M + W + I) / 4`, each layer scored 0-100 based on coverage, recall, reuse, and accuracy.

Decay detection: each layer has a decay rate. When decay exceeds threshold, the engine emits strengthening suggestions.

**Persistence**: the entire KMWI store is serialized to JSON. Default path: `~/.trae-cn/memory/projects/-d-----/kmwi-store.json`. Pass `memoryPath` to `MetaGOEngine` constructor to override.

---

## Evolution engine — 5 stages

| Stage | Budget | What happens |
|---|---|---|
| 1. Perception | <10ms | `Perception.detectBoundary()` — detects task failure, capability gap, user feedback, or version outdated |
| 2. Gap analysis | <50ms simple / <500ms complex | Maps boundary to specific gaps with severity |
| 3. Self-generation | <100ms simple / <2s complex | `SkillGenerator.create()` — grows new capability from KMWI patterns. Coupling score must be ≥0.95 |
| 4. Validation | <50ms | Checks the new skill solves the problem without introducing risk |
| 5. Recursion | — | If validation failed and recursion depth < 3, loop back to stage 1 |

The engine also runs **meta-meta-evolution** (axiom A34): it monitors its own evolution for validity and emits concerns/recommendations.

---

## Skill generator — meta-creation

`SkillGenerator` implements the meta-creation five-stage process:

1. **Domain perception** — Is this a new problem domain, or already covered?
2. **Seed generation** — Extract patterns from KMWI W-layer (wisdom) and I-layer (intuition)
3. **Growth** — Combine patterns into a new SKILL.md draft
4. **Validation** — Check coupling score ≥0.95, problem solved, no risk introduced
5. **Internalization** — Write the SKILL.md to disk, record to KMWI as wisdom

6 creation types: `thought` · `methodology` · `algorithm` · `architecture` · `protocol` · `capability`

---

## Directory structure

```
packages/engine/
├── ENGINE.md              ← Engine entry (AI reads this to be driven)
├── GENOME.json            ← Engine genome
├── package.json           ← @metago-ai/engine
├── LICENSE                ← MIT
├── CONSTITUTION/          ← Constitution layer (immutable)
│   └── AXIOMS.md          ← 36 axioms (8 critical)
├── CORE/                  ← Core layer (evolvable)
│   ├── ATTRIBUTES.md      ← 43 attributes (7 critical)
│   └── PROTOCOLS.md       ← 108 protocols (6 critical)
├── INDEX/                 ← Index layer
│   ├── engines.json       ← 125 engines
│   ├── skills.json        ← 39 skills
│   ├── tools.json         ← 53 MCP tools
│   └── knowledge.json     ← Knowledge crystal index
├── RUNTIME/               ← Runtime layer (TypeScript) ← V2 lives here
│   ├── src/
│   │   ├── index.ts              ← Main entry — MetaGOEngine aggregator
│   │   ├── loader.ts             ← Engine loader
│   │   ├── validators.ts         ← Axiom validators
│   │   ├── decision-lock.ts      ← Decision lock (4 gates)
│   │   ├── evolution-engine.ts   ← Evolution engine (5 stages)  ← V2
│   │   ├── perception.ts         ← Boundary detection            ← V2
│   │   ├── kmwi-memory.ts        ← KMWI 4-layer memory           ← V2 NEW
│   │   ├── skill-generator.ts    ← Meta-creation skill generator ← V2 NEW
│   │   ├── metrics.ts            ← Metrics layer
│   │   └── cli.ts                ← CLI interface
│   ├── tests/
│   │   └── engine.test.ts        ← Test suite
│   └── tsconfig.json
├── SDK/
│   └── types.d.ts         ← Developer type interfaces
├── ADAPTERS/              ← Platform adapters (7 platforms)
├── EVOLUTION.md           ← Evolution mechanism
├── CHANGES.md             ← Version history
└── PATENTS.md             ← Patent declarations
```

---

## Technical moat (patentable mechanisms)

| Module | File | Patent point |
|---|---|---|
| Axiom validators | `validators.ts` | Axiom-set-based AI output verification method |
| Decision lock | `decision-lock.ts` | Multi-level lock verification for AI decisions |
| Evolution engine | `evolution-engine.ts` | Automatic capability-boundary detection and evolution method |
| Perception | `perception.ts` | AI capability-boundary perception method |
| KMWI memory | `kmwi-memory.ts` | 4-layer knowledge-memory-wisdom-intuition architecture |
| Skill generator | `skill-generator.ts` | Endogenous skill creation from internal patterns |
| Engine loader | `loader.ts` | Cross-platform AI engine loading and verification protocol |

---

## By the numbers

| Dimension | Count |
|---|---|
| Core axioms | 36 (8 critical) |
| Fundamental attributes | 43 (7 critical) |
| Meta-ideologies | 19 |
| Capability families | 11 |
| Engines | 125 (17 core) |
| Algorithms | 927 |
| Atoms | 984 |
| Protocols | 108 (6 critical) |
| Patents | 754 (85 accepted + 669 reserved) |
| Value dimensions | 31 |
| Architecture layers | 11 (L0-L10) |

---

## License

MIT — see [LICENSE](https://gitee.com/metago/metagolifeform/raw/main/packages/engine/LICENSE)

Patent license — see [PATENTS.md](https://gitee.com/metago/metagolifeform/raw/main/packages/engine/PATENTS.md)

---

*Designed by MetaGO Super Intelligent Lifeform | Engine V2.0.0 | MetaGO V36.8 | 2026-07-08*
