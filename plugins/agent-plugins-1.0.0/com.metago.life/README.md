# com.metago.life — 元构专属扩展目录

本目录遵循 Agent Plugins 1.0.0 规范的 `com.*` 反域名命名空间约定：
**其他客户端（VS Code / Cursor / Copilot / ChatGPT / Codex 等）会忽略本目录**，仅元构生态工具与支持扩展目录的客户端读取。

## 内容

| 路径 | 内容 | 说明 |
|------|------|------|
| `agents/` | 35 个元构专家团子智能体 | Claude Code 兼容子智能体格式（frontmatter: name/description/model/tools）。Claude Code / ZCode 客户端可直接从本目录加载；Agent Plugins 1.0.0 v1 规范不含 agents 组件，故置于扩展目录。 |
| `manifest.json` | 本扩展清单 | 声明组件路径与安装依赖（npm 全局层）。 |

## 使用

- **Claude Code / ZCode**：将 `agents/` 复制到 `~/.claude/agents/` 或 `~/.zcode/agents/`（或通过本发行版 `metago-lifeform install --platform <平台>` 自动部署）。
- **其他平台**：agents 为可选组件（平台不支持时跳过，不影响技能与 MCP 生效）。

## 依赖

MCP 双服务器（`metago` / `metago-algorithms`）依赖 npm 全局命令 `metago-mcp-server` / `metago-algorithms`，请先安装本发行版 `local-edition/offline-packages/` 下的 6 个 tgz 包。
