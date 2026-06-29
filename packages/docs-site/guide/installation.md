# 安装指南

MetaGO 支持 7 大 AI 开发平台。选择你的平台查看安装步骤。

## 前置要求

- Node.js >= 16（推荐 18+）
- npm 或 npx
- 支持的 AI 平台之一（Trae / Claude Code / Codex / Cursor / CodeBuddy / Qoder / ZCode）

## 一键安装（推荐）

### Trae

```bash
npx metago-lifeform@latest install:trae
```

安装后重启 Trae，37 技能即生效。

### Claude Code

```bash
npx metago-lifeform@latest install:claude-code
```

### Cursor

```bash
npx metago-lifeform@latest install:cursor
```

### Codex

```bash
npx metago-lifeform@latest install:codex
```

### CodeBuddy

```bash
npx metago-lifeform@latest install:codebuddy
```

### Qoder

```bash
npx metago-lifeform@latest install:qoder
```

### ZCode

```bash
npx metago-lifeform@latest install:zcode
```

## MCP Server 配置（可选）

如果你想通过 MCP 协议使用 MetaGO 的 35 项能力，在 MCP 客户端配置中添加：

```json
{
  "mcpServers": {
    "metago": {
      "command": "npx",
      "args": ["-y", "@metago-ai/mcp-server@latest"]
    }
  }
}
```

支持的 MCP 客户端：
- Claude Desktop
- Cursor（Settings > MCP）
- Trae（MCP 配置）
- 任何支持 MCP 协议的客户端

## 验证安装

安装后，运行验证脚本：

```bash
npx metago-lifeform@latest verify
```

或检查技能列表：

```bash
npx metago-lifeform@latest list:skills
```

应显示 37 个 `metago-*` 技能。

## 卸载

```bash
npx metago-lifeform@latest uninstall:trae
```

将对应平台替换为 `uninstall:claude-code` / `uninstall:cursor` 等。

## 下一步

- [快速开始](./quickstart) — 5 分钟内调用第一个工具
- [平台适配详情](./platform-trae) — 深入了解你的平台
