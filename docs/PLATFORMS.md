# MetaGO Lifeform 11 平台兼容矩阵（V36.9.4 · 承诺书与测试台账）

> 本文档是"任何平台任何 Agent 可用"的承诺书与测试台账。每格在阶段 4（11 平台矩阵 E2E）逐项验收后勾选并附证据。
> 平台版形态 = 规则（法则文件）+ 技能（SKILL.md）+ MCP（按平台格式写入）+ 插件（按平台标准打包）。

| 平台 | 法则落点 | 技能目录 | MCP 配置文件 | MCP 格式 | 插件通道 | 已知限制（如实声明） |
|---|---|---|---|---|---|---|
| trae | `~/.trae-cn/rules.md` | `~/.trae-cn/skills` | `%APPDATA%\Trae CN\User\mcp.json` | JSON | — | — |
| claude-code | `~/.claude/CLAUDE.md` | `~/.claude/skills` | `%APPDATA%\Claude\claude_desktop_config.json` | JSON | `~/.claude/plugins/metago-lifeform` | — |
| codex | `~/.codex/AGENTS.md` | `~/.codex/skills` | `~/.codex/config.toml` | **TOML** | `~/.codex/plugins/metago-lifeform` | — |
| cursor | `~/.cursor/rules/metago.mdc` | `~/.cursor/skills` | `%APPDATA%\Cursor\User\mcp.json` | JSON | agent-plugins 兼容 | — |
| codebuddy | `~/.codebuddy/CODEBUDDY.md` | `~/.codebuddy/rules/skills` | `~/.codebuddy/mcp.json` | JSON | — | — |
| qoder | `~/.qoder/rules/metago.md` | 不支持（CLI 已明确） | `~/.qoder/mcp.json` | JSON | — | 技能经 MCP/法则生效 |
| zcode | `~/.zcode/CLAUDE.md` | `~/.zcode/skills` | `~/.zcode/config/mcp.json` | JSON | 本地市场 `~/.zcode/cli/plugins/marketplaces/metago-local` | — |
| chatgpt-work | `~/.chatgpt/AGENTS.md` | `~/.chatgpt/skills` | `~/.chatgpt/mcp.json` | JSON | agent-plugins-1.0.0 | — |
| workbuddy | `~/.workbuddy/AGENTS.md` | `~/.workbuddy/skills` | `~/.workbuddy/mcp.json` | JSON | — | — |
| kimi-code | `~/.kimi-code/AGENTS.md` | `~/.kimi-code/skills` | `~/.kimi-code/mcp.json` | JSON | — | — |
| kimi-work | `~/.kimi-work/AGENTS.md` | `~/.kimi-work/skills` | 无（官方不注入自定义 MCP） | — | — | 生效通道 = 法则 + 技能 + Bash 直调 |

## 测试台账（阶段 4 填写）

| 平台 | ① install | ② verify | ③ setup-mcp | ④ uninstall | ⑤ 幂等重装 | 验证级别 |
|---|---|---|---|---|---|---|
| trae | ✅ | ✅ | ✅ | ✅ | ✅ | 结构级（沙盒全链路） |
| claude-code | ✅ | ✅ | ✅ | ✅ | ✅ | 结构级（沙盒全链路） |
| codex | ✅ | ✅ | ✅ | ✅ | ✅ | 结构级（TOML 解析断言） |
| cursor | ✅ | ✅ | ✅ | ✅ | ✅ | 结构级（沙盒全链路） |
| codebuddy | ✅ | ✅ | ✅ | ✅ | ✅ | 结构级（沙盒全链路） |
| qoder | ✅ | ✅ | ✅ | ✅ | ✅ | 结构级（技能经 MCP/法则生效） |
| zcode | ✅ | ✅ | ✅ | ✅ | ✅ | 结构级（沙盒全链路） |
| chatgpt-work | ✅ | ✅ | ✅ | ✅ | ✅ | 结构级（沙盒全链路） |
| workbuddy | ✅ | ✅ | ✅ | ✅ | ✅ | 结构级（沙盒全链路） |
| kimi-code | ✅ | ✅ | ✅ | ✅ | ✅ | 结构级（沙盒全链路） |
| kimi-work | ✅ | ✅ | ✅ | ✅ | ✅ | 结构级（MCP 官方限制=设计行为） |

> 实测明细：scripts/e2e-phase4-matrix.cjs · 11/11 平台全绿（2026-09-01）；真实客户端首启问询（T14）由用户按需执行，见 RELEASE-NOTES 第三节。

> 验证级别：真实客户端生效（T14 类）/ 结构级断言（配置文件 + 适配模板内容）。
> 无法真实打开的客户端（Qoder / ChatGPT Work / WorkBuddy / Kimi 系）以结构级断言验收，并在 RELEASE-NOTES 如实标注。

*本次更新：2026-09-01（V36.9.4 发布级修复轮创建；Codex 行由 config.json 修正为 config.toml / TOML 格式）*
