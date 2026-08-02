# MCP 服务器手动配置指南

本文档说明如何手动配置 MetaGO MCP 服务器（当自动配置失败或需要自定义时）。

## 概述

MetaGO Lifeform 提供两个核心 MCP 服务器：

| 服务器名称 | npm 包 | 命令 | 功能 |
|-----------|--------|------|------|
| metago | `@metago-ai/mcp-server` | `metago-mcp-server` | 核心思维工具（决策锁、自检、合规等 53 工具） |
| metago-algorithms | `@metago-ai/mcp-algorithms` | `metago-algorithms` | 算法引擎（927 算法 + 57 工具） |

## 方式一：命令垫片（推荐）

全局安装后，npm 会自动创建命令垫片，直接在 MCP 配置中使用命令名即可：

### Trae（MCP 配置文件：Windows `%APPDATA%\Trae CN\User\mcp.json` / macOS `~/Library/Application Support/Trae CN/User/mcp.json` / Linux `~/.config/Trae CN/User/mcp.json`）

```json
{
  "mcpServers": {
    "metago": {
      "command": "metago-mcp-server",
      "args": []
    },
    "metago-algorithms": {
      "command": "metago-algorithms",
      "args": []
    }
  }
}
```

### Claude Code (~/.claude/settings.json)

```json
{
  "mcpServers": {
    "metago": {
      "command": "metago-mcp-server",
      "args": []
    },
    "metago-algorithms": {
      "command": "metago-algorithms",
      "args": []
    }
  }
}
```

### Cursor (.cursor/mcp.json)

```json
{
  "mcpServers": {
    "metago": {
      "command": "metago-mcp-server",
      "args": []
    },
    "metago-algorithms": {
      "command": "metago-algorithms",
      "args": []
    }
  }
}
```

## 方式二：使用 npx（无需全局安装）

如果不想全局安装，可以使用 npx 直接调用：

```json
{
  "mcpServers": {
    "metago": {
      "command": "npx",
      "args": ["-y", "@metago-ai/mcp-server@latest"]
    },
    "metago-algorithms": {
      "command": "npx",
      "args": ["-y", "@metago-ai/mcp-algorithms@latest"]
    }
  }
}
```

**注意**：npx 方式每次启动会检查更新，可能较慢。推荐全局安装方式。

## 方式三：使用绝对路径

如果命令垫片不在 PATH 中（如某些 IDE 的 MCP 启动环境不继承 shell PATH），可以使用绝对路径：

### 查找全局安装路径

```powershell
# Windows PowerShell
npm root -g
# 通常输出: C:\Users\<你的用户名>\AppData\Roaming\npm\node_modules

# 命令位置:
# C:\Users\<你的用户名>\AppData\Roaming\npm\metago-mcp-server.cmd
# C:\Users\<你的用户名>\AppData\Roaming\npm\metago-algorithms.cmd
```

```bash
# macOS/Linux
npm bin -g
# 通常输出: /usr/local/bin
# 或: ~/.nvm/versions/node/vXX/bin
```

### 配置示例（Windows 绝对路径）

```json
{
  "mcpServers": {
    "metago": {
      "command": "C:\\Users\\<你的用户名>\\AppData\\Roaming\\npm\\metago-mcp-server.cmd",
      "args": []
    },
    "metago-algorithms": {
      "command": "C:\\Users\\<你的用户名>\\AppData\\Roaming\\npm\\metago-algorithms.cmd",
      "args": []
    }
  }
}
```

## 方式四：Node 直接调用

如果以上方式都不行，可以直接用 node 调用入口文件：

```powershell
# 查找入口文件路径
$globalRoot = npm root -g
$mcpEntry = Join-Path $globalRoot "@metago-ai/mcp-server/dist/index.js"
$algEntry = Join-Path $globalRoot "@metago-ai/mcp-algorithms/dist/index.js"
```

```json
{
  "mcpServers": {
    "metago": {
      "command": "node",
      "args": ["C:/Users/<你的用户名>/AppData/Roaming/npm/node_modules/@metago-ai/mcp-server/dist/index.js"]
    }
  }
}
```

## 验证 MCP 配置

配置完成后，重启 IDE，然后验证 MCP 服务器是否正常连接：

### 命令行验证

```powershell
# 测试 metago-mcp-server
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | metago-mcp-server

# 测试 metago-algorithms
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | metago-algorithms
```

正常情况下应返回 JSON-RPC 响应，包含服务器信息和工具列表。

### 使用验收脚本

```powershell
metago-lifeform verify
```

## 各平台 MCP 配置文件位置

| 平台 | 配置文件路径 | 作用域 |
|------|-------------|--------|
| Trae (Windows) | `%APPDATA%\Trae CN\User\mcp.json` | 全局用户级 |
| Trae (macOS) | `~/Library/Application Support/Trae CN/User/mcp.json` | 全局用户级 |
| Trae (Linux) | `~/.config/Trae CN/User/mcp.json` | 全局用户级 |
| Claude Code (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` | 全局 |
| Claude Code (macOS/Linux) | `~/Library/Application Support/Claude/claude_desktop_config.json` 或 `~/.claude/settings.json` | 全局 |
| Cursor (Windows) | `%APPDATA%\Cursor\User\mcp.json` | 全局用户级 |
| Cursor (项目级) | `<项目根目录>/.cursor/mcp.json` | 项目级 |
| CodeBuddy | `~/.codebuddy/mcp.json` | 全局 |
| Qoder | `~/.qoder/mcp.json` | 全局 |
| ZCode | `~/.zcode/config/mcp.json` | 全局 |
| Codex | `~/.codex/config.json` | 全局 |

## 常见问题

### Q: 配置后 IDE 显示 MCP 服务器连接失败？
1. 确认命令在终端中可执行：在终端运行 `metago-mcp-server --help`
2. 确认 npm 全局 bin 目录在系统 PATH 中
3. 尝试使用绝对路径配置
4. 检查 IDE 是否需要重启才能加载新的 MCP 配置

### Q: metago-mcp-server 启动但没有工具？
确保已正确安装 `@metago-ai/mcp-server` 包：
```powershell
npm install -g @metago-ai/mcp-server @metago-ai/mcp-algorithms
```

### Q: Windows 上 .cmd 后缀需要写吗？
在大多数 IDE 的 MCP 配置中，不需要写 `.cmd` 后缀，直接写 `metago-mcp-server` 即可。Windows 会自动解析。如果不行，尝试加上 `.cmd`。

### Q: 如何禁用某个 MCP 服务器？
从 mcp.json 的 mcpServers 中删除对应条目即可，或设置 `disabled: true`（如果 IDE 支持）。
