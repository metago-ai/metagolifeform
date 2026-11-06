# PLATFORM-MATRIX · 11 平台安装验收

> 生成时间：2026-11-05 ｜ 依据：`node scripts/verify-platforms.cjs` 真实干跑（临时 HOME，不污染本机）
> 技能源：包内 114 个 SKILL.md；MCP：metago 55 + metago-algorithms 57 = 112 工具。

| 平台 | 结果 | 法则字符数 | 技能 | 验证 | 安装落点 |
|---|---|---:|---:|---|---|
| trae | PASS | 53631 | 114 | 8/0/0 | ~/.trae-cn/rules.md · %APPDATA%/Trae CN/User/mcp.json |
| claude-code | PASS | 53785 | 114 | 8/0/0 | ~/.claude/CLAUDE.md · ~/.claude.json (或 ~/.claude/skills) |
| codex | PASS | 53640 | 114 | 6/0/0 | ~/.codex/AGENTS.md · ~/.codex/config.toml |
| cursor | PASS | 53670 | 114 | 8/0/0 | ~/.cursor/rules/metago.mdc · 平台 User/mcp.json |
| codebuddy | PASS | 53760 | 114 | 8/0/0 | ~/.codebuddy/CODEBUDDY.md · ~/.codebuddy/mcp.json |
| qoder | PASS | 53661 | 114 | 9/0/0 | ~/.qoder-cn/AGENTS.md · ~/.qoder-cn/settings.json |
| zcode | PASS | 53640 | 114 | 8/0/0 | ~/.zcode/CLAUDE.md · ~/.zcode/config/mcp.json |
| chatgpt-work | PASS | 53815 | 114 | 8/0/0 | ~/.chatgpt/AGENTS.md · ~/.chatgpt/mcp.json |
| workbuddy | PASS | 53760 | 114 | 8/0/0 | ~/.workbuddy/AGENTS.md · ~/.workbuddy/mcp.json |
| kimi-code | PASS | 53760 | 114 | 8/0/0 | ~/.kimi-code/AGENTS.md · ~/.kimi-code/mcp.json |
| kimi-work | PASS | 53758 | 114 | 6/0/0 | ~/.kimi-work/AGENTS.md · 官方限制：不注入自定义 MCP |

## 验证边界

- 本表是**安装器级**验收：在临时 HOME 中真实生成法则、拷贝技能、写入 MCP 配置，并运行安装后自检。
- 本机没有 Trae / Claude Code / Codex / Cursor / CodeBuddy / ZCode / ChatGPT Work / WorkBuddy / Kimi 客户端，**未做真实客户端加载验收**；到对应平台后需复跑 `verify`。
- Kimi Work 官方限制不注入自定义 MCP，只安装法则 + 技能；这是平台能力边界，不是安装失败。
- Qoder 用户级目录为 `~/.qoder-cn`，MCP 写入 `settings.json` 的 `mcpServers`（合并，不覆盖其他键）。

## 离线安装包

- `local-edition/offline-packages/` 下 6 个 tgz 已按修补后的 portable 运行时重建，路径 B 不再拿到旧代码。
- `@metago-ai/engine` 已补入 `atoms/atoms_engines.json` 与 `genome/atoms_engines.json`，解除原子工厂对 `D:/metago-build/...` 的回退依赖。
- 抽验结果：T3 `227/227`；原子 `atoms/verify.cjs` 总判定 PASS；MCP 握手 `metago` 55 工具、`metago-algorithms` 57 工具。
- 路径 B 仍需 npm registry 解析 `@modelcontextprotocol/sdk`、`zod`；完全离线请走路径 A（portable）。

## 复跑

```bash
node scripts/verify-platforms.cjs
node scripts/export-adapters.cjs   # 重新生成 11 平台适配模板
node scripts/cli.js install --platform <平台> --skip-backup --skip-build
```
