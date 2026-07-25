# @metago-ai/verify-kit

> **MetaGO Agent Harness 交付质量保证系统** —— 把"AI 知道要做"变成"AI 不可绕过地执行"的强制门控框架。
> **七层验证架构 + L8 缺陷猎杀** — 对应 AGENTS.md V36.8.5 第十一/十四/十五章。

[![npm](https://img.shields.io/npm/v/@metago-ai/verify-kit.svg?logo=npm)](https://www.npmjs.com/package/@metago-ai/verify-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Layers](https://img.shields.io/badge/Verification-7_layers_+_L8_defect_hunting-blue)](#architecture)
[![Rules](https://img.shields.io/badge/Rules-V36.8.5-9cf)](https://github.com/metago-ai/metagolifeform/blob/main/AGENTS.md)

---

## Why this package exists

All AI agents share one problem:

> The rules say "run runtime verification before declaring done", but the agent only does `tsc + build` and calls it complete.

This package turns verification from a **soft constraint** (the agent can skip it) into a **hard gate** (the agent cannot declare "done" without passing).

## Architecture — 7 layers + L8 defect hunting

| Layer | Name | What it verifies | Severity |
|------|------|-----------------|----------|
| **L1** | Technical | tsc 0 errors · vite build · artifact scan · npm audit | P0 blocking |
| **L2** | Link | HTTP reachability · cloud functions · sub-routes · CORS · CDN | P0 blocking |
| **L3** | Contract | API field types · field names · required fields · error format · POST-GET consistency · enum values · version compat | P0 blocking |
| **L4** | Rendering | No white screen · no crash · empty state · lazy load · DOM nodes · console zero error | P0 blocking |
| **L5** | Interaction | Button feedback · input · dropdown · navigation · form submit · keyboard · loading | P1 important |
| **L6** | State | Navigation retention · refresh retention · login state · draft retention · session switch · selected items | P1 important |
| **L7** | Defense | Empty input · long input · XSS · concurrent · timeout · permission boundary · old data compat · injection | P0 blocking |
| **L8** | Defect hunting | 11 dimensions: zombie features · unpersisted state · mock data · error handling · route deadlinks · type safety · copy consistency · deprecated API · business closure · compliance · terminology | P0 blocking |

**All 8 layers pass = task complete. Any layer fails = task NOT complete.**

## Install

```bash
npm install @metago-ai/verify-kit
```

## Use

```typescript
import { runVerification, disciplineCheck, SELF_DISCIPLINE_QUESTIONS } from '@metago-ai/verify-kit'

const report = await runVerification({
  tech: { tsc: true, build: true, artifactScan: true, npmAudit: true },
  links: [
    { name: 'web', url: 'https://metago.life', expectedStatus: 200 },
    { name: 'exe', url: 'https://metago.life/download/app.exe', minSizeMB: 80 },
  ],
  contract: [
    {
      name: 'user-api',
      endpoint: 'https://api.example.com/user',
      method: 'GET',
      assertions: [
        { field: 'id', type: 'string', required: true },
        { field: 'name', type: 'string', required: true },
        { field: 'balance', type: 'number' },
      ],
    },
  ],
  rendering: { routes: ['/', '/dashboard', '/profile'], checkConsole: true, checkDom: true },
  interaction: { buttons: ['submit', 'cancel'], inputs: ['email', 'password'] },
  state: { loginState: true, refreshState: true, draftRetention: true },
  defense: { emptyInput: true, xssTest: true, longInput: true, concurrentTest: true, permissionBoundary: true },
  defectHunting: {
    scanZombieFeatures: true, scanUnpersistedState: true, scanMockData: true,
    scanErrorHandling: true, scanRouteDeadlinks: true, scanTypeSafety: true,
    scanCopyConsistency: true, scanDeprecatedApi: true, scanBusinessClosure: true,
    scanCompliance: true, scanTerminology: true,
  },
})

// Check if task can be declared complete
const discipline = disciplineCheck(report)
if (!discipline.canDeclareComplete) {
  console.error('BLOCKED:', discipline.failures)
  process.exit(1)
}
```

## CLI

```bash
npx @metago-ai/verify-kit
# or
metago-verify
```

## The 8 self-discipline questions (V3)

Before declaring "task complete", the agent must answer all 8 questions. Any "no" blocks the declaration:

1. Did I run `npm run verify`?
2. Are there any FAILs in the verify output?
3. Does my delivery report include the "7-layer verification report" section?
4. Does every ✅ have execution evidence?
5. Did I verify L3 contract layer? (not just curl status code, but field type/name/required)
6. Did I verify L4 rendering layer? (browser check for white screen/crash/console errors)
7. Did I verify L6 state + L7 defense layers? (refresh retention + abnormal input tests)
8. Did I verify L5 interaction layer with browser_use agent? (click each button for UI feedback, with screenshots)

## Bypass detection

The package includes 11 bypass patterns that, if detected in the agent's output, indicate the agent is trying to skip verification:

- "应该没问题" / "should be fine"
- "逻辑上正确" / "logically correct"
- "之前验证过" / "verified before"
- "纯人工跳过" / "manual skip"
- "L3 只检查状态码 200 不校验字段"
- "L5 标注纯人工跳过"
- "用逻辑正确代替实际验证"
- "发现问题但隐瞒不报"
- ...and 3 more

```typescript
import { detectBypass } from '@metago-ai/verify-kit'

const bypasses = detectBypass(agentOutput)
if (bypasses.length > 0) {
  console.error('BYPASS DETECTED:', bypasses)
}
```

## License

MIT © 2026 易霄 / 元构光年（成都）人工智能科技有限公司

## Links

- [GitHub](https://github.com/metago-ai/metagolifeform/tree/main/packages/verify-kit)
- [npm](https://www.npmjs.com/package/@metago-ai/verify-kit)
- [Homepage](https://metago.life)
- [Issues](https://github.com/metago-ai/metagolifeform/issues)
