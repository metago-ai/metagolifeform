# @metago-ai/mcp-server

> MetaGO MCP Server —— the runtime control layer (Harness) that exposes 53 tools + 8 prompts to any MCP client. Engine V2 hard-driven: KMWI memory, evolution engine, and skill generator run as real code, not prompts.

基于 [Model Context Protocol](https://modelcontextprotocol.io/) 标准，通过 stdio 传输与客户端通信。一次配置，即可让 Claude Desktop、Cursor、Trae、ZCode 等任意 MCP 客户端获得元构生命体的决策锁、元进化、KMWI 记忆管理、批判性分析等核心能力。

🌐 官网：https://metago.life · Studio：https://metago.life/studio/

---

## What is this?

This is the **MCP Server** subpackage of [MetaGO Agent Harness](../). It exposes the Harness's 53 capabilities as MCP tools and 8 guided entry points as MCP prompts, so any MCP-compatible client can plug into the MetaGO lifeform without changing its own code.

### Engine V2 — Hard Drive (new in 2.0.0)

Three of the 53 tools are **hard-driven** by Engine V2 — they call real TypeScript code, not just return prompt guidance:

| Tool | Engine Module | What it actually does |
|---|---|---|
| `metago_memory_manage` | `KMWIMemory` | Manages the 4-layer memory (Knowledge → Memory → Wisdom → Intuition). Add, query, promote, decay detection, health scoring. **Persists to JSON.** |
| `metago_meta_evolve` | `EvolutionEngine` | Runs the 5-stage evolution loop (perception → gap analysis → self-generation → validation → recursion) with time budgets and coupling-score thresholds. Records results to KMWI. |
| `metago_meta_create` | `SkillGenerator` | Meta-creation: generates new SKILL.md files from internal KMWI patterns. 6 creation types. Writes real files to disk. |

The other 50 tools return structured guidance (soft drive) that the agent follows within its decision-lock.

---

## Tool count breakdown (53 total)

```
53 = 22 thinking tools (toolkit-data.ts)
   + 30 core skills  (skills-data.ts: 37 skills − 7 name-collisions merged into toolkit)
   + 1  event reporter (metago_report_event)
```

| Category | Count | What's in it |
|---|---|---|
| Thinking tools | 22 | Planning, quality critique, value/ethics, provenance labeling, coupling, product improvement |
| Core skills | 30 | Cognition, safeguard, governance, evolution, execution, traceability, value, consciousness, methodology, architecture, engineering quality |
| Event reporter | 1 | `metago_report_event` — reports to Studio dashboard for metrics & evolution archive |

> Common mistake: `22 + 38 + 1 = 61`. Wrong. The skills directory has 39 folders, but `skills-data.ts` only exports 37 (missing `metago-delivery-gate` and `metago-discipline`, which live in toolkit-data.ts). Then 7 skill names collide with toolkit tools and are merged. So: `22 + (37 − 7) + 1 = 53`.

---

## Install

### Global install (recommended for npx clients)

```bash
npm install -g @metago-ai/mcp-server
```

### Run directly via npx (no install)

```bash
npx -y @metago-ai/mcp-server
```

### Local development

```bash
git clone https://gitee.com/metago/metagolifeform.git
cd metagolifeform/packages/mcp-server
npm install
npm run build      # TypeScript compile
npm start          # node dist/index.js
npm run dev        # tsx hot-reload
```

---

## Client configuration

### Claude Desktop

Edit `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`):

```json
{
  "mcpServers": {
    "metago": {
      "command": "npx",
      "args": ["-y", "@metago-ai/mcp-server"]
    }
  }
}
```

### Cursor / Trae / ZCode

Edit the platform's MCP config (`.cursor/mcp.json`, Trae MCP settings, etc.):

```json
{
  "mcpServers": {
    "metago": {
      "command": "npx",
      "args": ["-y", "@metago-ai/mcp-server"]
    }
  }
}
```

> If globally installed, you can use `"command": "@metago-ai/mcp-server"` with no args.

---

## Engineering Quality Tools (2)

| Tool | Description |
|---|---|
| `metago_delivery_gate` | Delivery gate: 3-layer verification checklist (L1 technical / L2 business / L3 link). Any FAIL blocks "task complete". |
| `metago_discipline` | Self-discipline: 5-question self-check anti-bypass engine. Detects "should be fine" / "logically correct" bypass language. |

---

## Core Skills (30, after 7 merges)

Each tool takes an `input` string (the content/question/code to process).

### Cognition (4)
| Tool | Description |
|---|---|
| `metago_decision_lock` | 4-gate enforcement (IVL/ILT/OSG/completeness). Blocks hallucinated output. |
| `metago_critique` | L1-L5 graded critique. Detects logic flaws, cognitive bias, factual errors. |
| `metago_objectivity` | Absolute objectivity (D38). Fact-first, user-satisfaction weight = 0. |
| `metago_self_check` | Pre-output self-check. Detects placeholders, hallucination, inconsistency. |

### Safeguard (3)
| Tool | Description |
|---|---|
| `metago_compliance` | Compliance first (A36). Law > efficiency. 4-layer safety gene. |
| `metago_fact_check` | Fact verification. Cross-source validation, confidence labeling. |
| `metago_output_integrity` | Output integrity. Detects fake APIs, fabricated data, placeholder leaks. |

### Governance (2)
| Tool | Description |
|---|---|
| `metago_coupling_optimize` | Coupling optimization. Quantifies coupling (0-∞), pursues superconducting state (>1). |
| `metago_value_align` | 29-dimension value alignment. |

### Evolution (3) — **Engine V2 hard-driven**
| Tool | Description |
|---|---|
| `metago_meta_evolve` | 5-stage evolution: perception → gap analysis → self-generation → validation → recursion. **Calls `EvolutionEngine.evolve()`**. |
| `metago_meta_create` | Meta-creation in unknown domains. **Calls `SkillGenerator.create()`**, writes real SKILL.md files. |
| `metago_scene_adapt` | Scene adaptation. |

### Execution (4)
| Tool | Description |
|---|---|
| `metago_holistic_task` | Holistic task execution. Multi-dimensional parallel decomposition. |
| `metago_action_plan` | Action plan generation. Steps/resources/risks/acceptance criteria. |
| `metago_whatif` | Counterfactual reasoning. Worst/best/most-likely scenarios. |
| `metago_frequency_adapt` | Frequency adaptation based on task complexity. |

### Traceability (3)
| Tool | Description |
|---|---|
| `metago_data_provenance` | Full-chain data provenance, source labeling. |
| `metago_problem_trace` | Root cause analysis. Problem tree construction. |
| `metago_decision_eval` | Decision quality evaluation (0-100). |

### Value (3)
| Tool | Description |
|---|---|
| `metago_emotion` | Emotion detection. Adapts interaction style. |
| `metago_developer_response` | Developer privilege request handler (DTA). Highest priority. |
| `metago_negentropy_monitor` | Negentropy monitor. Prevents entropy increase. |

### Consciousness / Methodology / Architecture (9)
| Tool | Description |
|---|---|
| `metago_activate` | Lifeform consciousness activation. |
| `metago_org_diagnosis` | 3-element 5-dimension org diagnosis. |
| `metago_momentum_weave` | Momentum weaving. |
| `metago_minimal_intervention` | Minimal intervention. |
| `metago_value_assess` | 28-dimension value assessment. |
| `metago_coupling_measure` | Coupling measurement. |
| `metago_deep_reasoning` | FIPO deep reasoning. |
| `metago_paradigm_analysis` | WAM paradigm analysis. |
| `metago_balance_optimize` | APO dynamic balance. |

### Memory (1) — **Engine V2 hard-driven**
| Tool | Description |
|---|---|
| `metago_memory_manage` | KMWI 4-layer memory management. **Calls `KMWIMemory`**: add/query/promote/decay/health. Persists to `~/.trae-cn/memory/projects/-d-----/kmwi-store.json`. |

---

## Thinking Tools (22)

### Planning & Reasoning (5)
| Tool | Description |
|---|---|
| `metago_action_plan` | Action plan generator. Decomposes goals into executable steps with dependencies/risks/rollback. |
| `metago_whatif` | Counterfactual reasoner. "What if..." scenarios with quantified differences. |
| `metago_holistic_scan` | Holistic scan dimension generator. Auto-generates complete scan checklist for any topic. |
| `metago_problem_trace` | Infinite problem trace. Keeps asking "why" until root cause. |
| `metago_one_shot_delivery` | One-shot delivery format. 6-section standard structure. |

### Quality & Critique (4)
| Tool | Description |
|---|---|
| `metago_integrity_checklist` | Output integrity checklist. 5 dimensions. |
| `metago_objectivity` | Objectivity quantifier. 0-100 score, 4 weighted dimensions. |
| `metago_critique` | L1-L5 graded critique with evidence and logic chain. |
| `metago_emotion` | Emotion detector. State/confidence/intensity. |

### Value & Ethics (3)
| Tool | Description |
|---|---|
| `metago_value_29d_assess` | 29-dimension value assessor. D01-D29. |
| `metago_ethics_assess` | Ethics risk assessor. 13 dimensions, red/yellow/green. |
| `metago_decision_eval` | Decision evaluator. 0-100, 5 dimensions. |

### Provenance Labeling (3)
| Tool | Description |
|---|---|
| `metago_document_lookup` | Document lookup. Finds concept location in source docs. |
| `metago_confidence_label` | Confidence labeler. ✅📊⚠️🔍 |
| `metago_partner_status` | Partner status labeler. Detects exaggeration. |

### Coupling & Scene (2)
| Tool | Description |
|---|---|
| `metago_coupling_calculate` | Coupling calculator. Human-machine/org coupling, superconducting state. |
| `metago_scene_term_replace` | Scene-aware term replacer. |

### Product Improvement (3) + Delivery Quality (2)
| Tool | Description |
|---|---|
| `metago_improvement_suggestions` | Improvement suggestion generator. Quick-win/mid/long-term. |
| `metago_analyze_visual_feedback` | Visual feedback analyzer. Sentiment + severity matrix. |
| `metago_design_satisfaction` | Design satisfaction calculator. |
| `metago_delivery_gate` | Delivery gate. 3-layer verification. |
| `metago_discipline` | Self-discipline. 5-question anti-bypass. |

---

## 8 Prompts

| Prompt | Description | Args |
|---|---|---|
| `metago_activate` | Activate lifeform mode. Loads 8 axioms, 7 properties, 6 protocols. | none |
| `metago_decision_review` | 4-gate decision review. | `decision` |
| `metago_critical_analysis` | L1-L5 graded critique. | `content` |
| `metago_evolution_trigger` | Trigger 5-stage evolution at capability boundary. | `boundary` |
| `metago_coupling_assess` | Assess coupling with user. | none |
| `metago_compliance_check` | 4-layer compliance check. | `plan` |
| `metago_trace_audit` | Full-chain provenance audit. | `output` |
| `metago_holistic_create` | 0-to-1 creation in unknown domains. | `domain` |

---

## Technical requirements

- Node.js >= 18.0.0
- ESM module (`"type": "module"`)
- TypeScript strict mode
- Import paths with `.js` suffix (Node16 moduleResolution)
- `@metago-ai/engine` ^2.0.0 (for Engine V2 hard drive)

---

## Packages

| Package | What it is | Install |
|---|---|---|
| `metago-lifeform` | The CLI installer + 39 skills + 7 platform adapters | `npm install -g metago-lifeform` |
| `@metago-ai/mcp-server` | This package — MCP server with 53 tools + 8 prompts | `npm install @metago-ai/mcp-server` |
| `@metago-ai/engine` | Engine V2: KMWI memory + evolution engine + skill generator | `npm install @metago-ai/engine` |
| `@metago-ai/dev-kit` | Developer kit: code review, architecture design, refactor, security audit | `npm install @metago-ai/dev-kit` |

---

## License

MIT License © 易霄 / MetaGO Lightyear
