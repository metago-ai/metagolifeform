# @metago-ai/verify-kit

> **AI 交付质量保证系统** —— 把"AI 知道要做"变成"AI 不可绕过地执行"的强制门控框架。

## 为什么需要这个包？

所有 AI Agent（不只 MetaGO）都有一个共同问题：

> 规范写在系统提示词里，AI 知道要做运行时验证，但实际上只做了 `tsc + build` 就宣告"任务完成"。

**根因**：tsc/build 是硬门（不通过无法继续），验证是软约束（跳过也能"完成"）。

`verify-kit` 把运行时验证从软约束变成硬门。

## 适用场景

- 任何使用 AI Agent 开发软件的团队
- 任何需要"交付前质量门控"的 CI 流水线
- 任何 LLM-based 自动化系统（Claude Code / Cursor / Trae / Codex / CodeBuddy / Qoder / ZCode）
- MetaGO Lifeform Kit 的配套组件

## 安装

```bash
npm install --save-dev @metago-ai/verify-kit
```

## 使用

### 1. 作为 CLI

```bash
# 执行完整验证
npx metago-verify

# 只检查技术层
npx metago-verify --layer tech

# 只检查业务层
npx metago-verify --layer business
```

### 2. 作为 Node 模块

```typescript
import { runVerification, type VerifyConfig } from '@metago-ai/verify-kit'

const config: VerifyConfig = {
  // 技术层
  tech: {
    tsc: true,
    build: true,
    artifactScan: true,
  },
  // 业务层
  business: {
    webUrl: 'https://your-app.com',
    healthEndpoint: '/api/health',
    pingMessage: { action: 'chat', message: 'ping' },
  },
  // 链路层
  links: [
    { name: 'exe-download', url: 'https://your-app.com/download/app.exe', minSizeMB: 80 },
    { name: 'update-yml', url: 'https://your-app.com/update/latest.yml' },
  ],
}

const report = await runVerification(config)
if (!report.allPassed) {
  console.error('❌ 验证失败，禁止宣告任务完成')
  process.exit(1)
}
```

### 3. 接入 CI/CD

```yaml
# .github/workflows/verify.yml
- name: Pre-Delivery Verify
  run: npx metago-verify
```

### 4. 接入 AI Agent 系统提示词

把 [AGENTS.template.md](./AGENTS.template.md) 的内容复制到你的 AI Agent 系统提示词中。

## 三层验证架构

| 层级 | 名称 | 内容 | 工具 |
|------|------|------|------|
| L1 | 技术层 | tsc / build / 产物扫描 | 自动化 |
| L2 | 业务层 | HTTP 可达 / API 可调 / E2E 对话 | 自动化 + 半人工 |
| L3 | 链路层 | 部署资源可访问 | HTTP HEAD |

**三层全部通过 = 允许宣告"任务完成"。任意一层失败 = 任务未完成。**

## 反绕过机制

`verify-kit` 的核心创新不是检查本身，而是**反绕过机制**：

1. **强制证据**：每一项 ✅ 必须附带执行证据（命令输出、HTTP 状态码、AI 回复片段）
2. **JSON 报告**：生成 `verify-report.json`，可供 CI 解析、可被 AI 系统提示词引用
3. **退出码**：全部通过 `exit 0`，任意失败 `exit 1`（CI 自动拦截）
4. **AI 自检协议**：配套 5 问自检清单，防止 AI 自己绕过

## AI 自律执行协议（配套）

```
接收任务 → 执行 → tsc（硬门1）→ build（硬门2）→ verify（硬门3）→ 部署 → HTTP 验证（硬门4）→ 报告 → 5 问自检 → 宣告完成
```

5 问自检（输出"任务完成"前必答）：
1. 我运行了 `verify` 吗？
2. verify 有 FAIL 吗？
3. 报告含验证小节吗？
4. 每项 ✅ 都有证据吗？
5. 我做业务层验证了吗？

**任何一问答"否" = 禁止宣告完成。**

## 与 MetaGO Lifeform Kit 的关系

`verify-kit` 是 MetaGO Lifeform Kit 的独立组件，可独立使用，也可作为配套：

- 在 Trae / Cursor / Claude Code 等 IDE 中通过 MCP 调用 `metago_delivery_gate` 工具
- 在 CI/CD 中通过 CLI 调用
- 在 MetaGO Agent 工作台中通过技能激活

## 许可证

MIT © MetaGO
