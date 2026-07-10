# Security Policy

## Supported Versions

MetaGO Agent Harness is actively developed. Security fixes are applied to the latest `main` branch and released as patch versions.

| Version | Supported |
|---------|-----------|
| 36.8.x  | Yes       |
| < 36.8  | No        |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in MetaGO Agent Harness, please report it responsibly:

### How to Report

1. **Email**: Send details to **metago@metago.life** with the subject line `[SECURITY] MetaGO Vulnerability Report`.
2. **Encrypt**: If the vulnerability is critical, encrypt your report using our PGP key (available on request).

### What to Include

- **Description**: Clear description of the vulnerability and its impact.
- **Reproduction**: Step-by-step instructions to reproduce the issue.
- **Proof of Concept**: Code or screenshots demonstrating the vulnerability.
- **Affected Components**: Which part of MetaGO is affected (Engine, MCP Server, CLI, Skills, Platform Adapters).
- **Suggested Fix**: If you have a remediation in mind.

### Response Timeline

| Milestone | Target |
|-----------|--------|
| Acknowledgment of report | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix or mitigation | Within 30 days (critical) / 90 days (moderate) |
| Public disclosure | After fix is released, coordinated with reporter |

### Disclosure Policy

- We follow **responsible disclosure** — vulnerabilities are disclosed publicly only after a fix is available.
- We will credit reporters in the release notes unless they prefer to remain anonymous.
- We do not pursue legal action against reporters acting in good faith.

## Security Architecture

MetaGO's security posture is built into its design:

### 1. Decision Lock (4 Gates)

Every agent output passes through 4 verification gates before being delivered:
- **Intent Verification (IVL)** — Is the output what was asked?
- **Intent-Lineage Tracing (ILT)** — Is the output traceable to the input?
- **Semantic Output Gate (OSG)** — Does the output semantically match?
- **Content Completeness** — Is the output complete?

This prevents hallucinated, incomplete, or off-topic outputs from reaching the user.

### 2. Compliance-First (Axiom A36)

**Law over efficiency.** The agent proactively checks legal, ethical, and safety compliance before executing any action. This is hardcoded into the operating law, not a runtime toggle.

### 3. No Hardcoded Secrets

MetaGO does not embed any API keys, tokens, or credentials in the source code. All secrets are managed via environment variables or platform-native secret stores.

### 4. Local-First Data

KMWI memory (Knowledge → Memory → Wisdom → Intuition) persists to local JSON files. No agent data is sent to external servers unless explicitly configured by the user.

### 5. Supply Chain

- All npm packages are pinned to specific versions.
- The `files` field in `package.json` restricts published content to prevent tarball contamination.
- GitHub Actions workflows use pinned action versions.

## Scope

### In Scope

- Vulnerabilities in MetaGO Agent Harness core (`core/`, `adapters/`, `skills/`)
- Vulnerabilities in Engine V2 (`packages/engine/`)
- Vulnerabilities in MCP Server (`packages/mcp-server/`)
- Vulnerabilities in Dev Kit (`packages/dev-kit/`)
- Vulnerabilities in the CLI (`scripts/cli.js`)

### Out of Scope

- Vulnerabilities in third-party dependencies (report to upstream maintainers)
- Vulnerabilities in AI platforms (Trae, Claude Code, etc. — report to respective vendors)
- Social engineering attacks
- DoS attacks against the MetaGO website or Studio

## Contact

- **Security Email**: metago@metago.life
- **General Issues**: [GitHub Issues](https://github.com/metago-ai/metagolifeform/issues)

---

*MetaGO Agent Harness — security is not a feature, it's an axiom.*
