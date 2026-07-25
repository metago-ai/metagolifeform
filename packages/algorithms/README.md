# @metago-ai/algorithms — 927 算法 MCP 服务器

> **MetaGO Agent Harness** 的算法核心 — 57 工具 / 927 算法 / 14 触发大类 / 4 层架构，Engine V2.1.0 硬驱动。

[![npm](https://img.shields.io/npm/v/@metago-ai/algorithms.svg?logo=npm)](https://www.npmjs.com/package/@metago-ai/algorithms)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Tools](https://img.shields.io/badge/Tools-57-blue)](#tool-list)
[![Algorithms](https://img.shields.io/badge/Algorithms-927-orange)](#architecture)
[![Engine](https://img.shields.io/badge/Engine-V2.1.0-blue)](https://www.npmjs.com/package/@metago-ai/engine)

---

## What it is

`@metago-ai/algorithms` is the algorithmic backbone of the MetaGO Agent Harness. It exposes **57 MCP tools** backed by **927 algorithms** across **14 trigger categories**, organized in a **4-layer architecture**. Every tool is hard-driven by `@metago-ai/engine@2.1.0` (KMWI memory + evolution engine + skill generator).

This is not a library of math functions. It is a Model Context Protocol (MCP) server that gives any MCP-compatible AI agent (Trae, Claude Code, Codex, Cursor, etc.) real-time access to coupling calculation, value assessment, distance metrics, correlation analysis, dimensionality reduction, security audit, frequency processing, and 7 more trigger categories.

## Architecture — 4 layers / 14 trigger categories

| Layer | Name | Tools | Algorithms | Trigger Categories |
|------|------|-------|------------|-------------------|
| **L1** | 通用入口层 (General Entry) | 3 | 9 | 3 |
| **L2** | 检索发现层 (Retrieval & Discovery) | 4 | 18 | 4 |
| **L3** | 高频专用层 (High-Frequency Specialized) | 30 | 540 | 4 |
| **L4** | 族级工具层 (Family Tools) | 20 | 360 | 3 |
| **Total** | — | **57** | **927** | **14** |

### The 14 trigger categories

| # | Category | Layer | Trigger condition |
|---|----------|-------|------------------|
| 1 | Algorithm execution | L1 | Agent needs to execute an algorithm |
| 2 | Algorithm retrieval | L1 | Agent needs to find an algorithm by name/family/capability |
| 3 | Statistics | L1 | Agent needs server statistics |
| 4 | Family listing | L2 | Agent needs to list algorithm families |
| 5 | Algorithm search | L2 | Agent needs semantic search over algorithms |
| 6 | Info lookup | L2 | Agent needs detailed info on a specific algorithm |
| 7 | Proactive suggestion | L2 | Agent needs algorithm recommendations for a task |
| 8 | Coupling calculation | L3 | Task involves relationship strength / coupling degree |
| 9 | Value assessment | L3 | Task involves multi-dimensional value scoring |
| 10 | Distance metrics | L3 | Task involves similarity / distance between vectors |
| 11 | Correlation analysis | L3 | Task involves statistical correlation |
| 12 | Dimensionality reduction | L3 | Task involves PCA / SVD / feature reduction |
| 13 | Security audit | L3 | Task involves vulnerability / security assessment |
| 14 | Frequency processing | L3 | Task involves frequency-domain analysis |

## Install

```bash
npm install @metago-ai/algorithms
```

## Use as MCP server

### Trae / Claude Code / Cursor / any MCP client

Add to your MCP client config:

```json
{
  "mcpServers": {
    "metago-algorithms": {
      "command": "node",
      "args": ["node_modules/@metago-ai/algorithms/index.js"]
    }
  }
}
```

### Standalone

```bash
npx @metago-ai/algorithms
# or
node node_modules/@metago-ai/algorithms/index.js
```

## Tool list (57 tools)

### L1 — General Entry (3 tools)
- `execute` — Execute any algorithm by name with parameters
- `execute_sync` — Synchronous algorithm execution
- `get_statistics` — Server statistics (tool count, algorithm count, layer distribution)

### L2 — Retrieval & Discovery (4 tools)
- `list_algorithms` — List all 927 algorithms with metadata
- `list_families` — List 14 algorithm families
- `search_algorithms` — Semantic search over algorithm descriptions
- `get_algorithm_info` — Detailed info on a specific algorithm

### L3 — High-Frequency Specialized (30 tools)

#### Coupling (8 tools)
- `coupling_calculate` · `coupling_clustering` · `coupling_trend` · `normalize_coupling`
- `build_coupling_matrix` · `sort_coupling_scores` · `is_superconductive` · `cooccurrence_frequency`

#### Value Assessment (3 tools)
- `value_assess` · `build_value_vector` · `evaluate_bidirectional`

#### Distance Metrics (6 tools)
- `euclidean_distance` · `manhattan_distance` · `chebyshev_distance`
- `cosine_similarity` · `dice_coefficient` · `jaccard_coefficient`

#### Correlation (4 tools)
- `pearson_correlation` · `spearman_correlation` · `kendall_tau` · `covariance`

#### Dimensionality Reduction (3 tools)
- `extract_pca` · `simplified_svd` · `reduce_dimension`

#### Security & Audit (3 tools)
- `security_assess` · `audit_check` · `bias_detect`

#### Frequency & Time (3 tools)
- `frequency_process` · `time_analyze` · `time_decay_cooccurrence`

### L4 — Family Tools (20 tools)

#### Fuzzy & Semantic (3 tools)
- `fuzzy_string_match` · `semantic_similarity` · `weighted_cosine`

#### Reasoning (3 tools)
- `reasoning_chain` · `logic_reason` · `conflict_resolve`

#### Asymmetry & Symmetry (3 tools)
- `detect_asymmetry` · `record_symmetric` · `identify_strong_pairs` · `identify_weak_pairs`

#### Negentropy (1 tool)
- `negentropy_measure`

#### Intuition (1 tool)
- `intuition_gauge`

#### Lifeform Operations (8 tools)
- `memory_operate` · `learning_learn` · `creation_create` · `evolution_evolve`
- `decision_decide` · `dialog_manage` · `idea_generate` · `proactive_suggest`

## Engine dependency

This package is hard-driven by `@metago-ai/engine@2.1.0`:
- **KMWI Memory** — 4-layer memory (Knowledge → Memory → Wisdom → Intuition) backs algorithm state
- **EvolutionEngine** — 5-stage meta-evolution can generate new algorithms on demand
- **DecisionLock** — 4-gate verification before every algorithm output
- **SkillGenerator** — generates new algorithm SKILL.md files from internal patterns

## License

MIT © 2026 易霄 / 元构光年（成都）人工智能科技有限公司

## Links

- [GitHub](https://github.com/metago-ai/metagolifeform/tree/main/packages/algorithms)
- [npm](https://www.npmjs.com/package/@metago-ai/algorithms)
- [Homepage](https://metago.life)
- [Issues](https://github.com/metago-ai/metagolifeform/issues)
