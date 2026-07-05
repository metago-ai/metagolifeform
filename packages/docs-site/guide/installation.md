# 安装指南

MetaGO 支持 7 大 AI 开发平台。选择你的平台查看安装步骤。

## 前置要求

- Node.js >= 18（必须）
- npm 或 npx
- 支持的 AI 平台之一（Trae / Claude Code / Codex / Cursor / CodeBuddy / Qoder / ZCode）

## 方式一：从仓库克隆（推荐，功能最完整）

```bash
git clone https://gitee.com/metago/metagolifeform.git
cd metagolifeform
```

### 1. 安装技能 + 规则文件

```powershell
# Windows PowerShell
npm run install:trae

# 或指定平台
node scripts/cli.js install --platform zcode
```

安装后重启平台，39 个技能即生效。

### 2. 安装并配置 MCP Server（53 个工具）

```powershell
# Windows PowerShell
node scripts/cli.js setup-mcp --platform trae
```

此命令会自动完成：
1. 检查 Node.js >= 18
2. npm install（安装 MCP Server 依赖）
3. npm run build（构建 TypeScript）
4. 配置平台的 MCP 服务器连接
5. 验证工具数（应为 53）

**安装完成后重启平台，在 MCP 面板中即可看到 53 个工具。**

## 方式二：通过 npx 安装（仅技能 + 规则）

```bash
npx metago-lifeform@latest install --platform trae
```

> 注意：npx 方式仅安装技能和规则文件，不包含 MCP Server 配置。如需 MCP 工具，请使用方式一。

## 各平台安装命令

| 平台 | 安装命令 |
|------|---------|
| Trae | `node scripts/cli.js install --platform trae` |
| Claude Code | `node scripts/cli.js install --platform claude-code` |
| Cursor | `node scripts/cli.js install --platform cursor` |
| Codex | `node scripts/cli.js install --platform codex` |
| CodeBuddy | `node scripts/cli.js install --platform codebuddy` |
| Qoder | `node scripts/cli.js install --platform qoder` |
| ZCode | `node scripts/cli.js install --platform zcode` |

## MCP Server 配置（手动方式）

如果自动配置失败，可手动在平台的 MCP 配置文件中添加：

```json
{
  "mcpServers": {
    "metago": {
      "command": "node",
      "args": ["C:/path/to/metagolifeform/packages/mcp-server/dist/index.js"]
    }
  }
}
```

各平台配置文件位置：

| 平台 | 配置文件路径 |
|------|-------------|
| Trae | `%APPDATA%\Trae CN\User\mcp.json` |
| Claude Desktop | `%APPDATA%\Claude\claude_desktop_config.json` |
| Cursor | `.cursor/mcp.json`（项目根目录） |
| ZCode | `%USERPROFILE%\.zcode\config\mcp.json` |

## 验证安装

```bash
# 验证技能安装
node scripts/cli.js verify

# 检查技能列表
npm run list:skills

# 验证 MCP Server 工具数（应为 53）
node scripts/cli.js setup-mcp --platform trae
```

应显示：
- 39 个 `metago-*` 技能
- 53 个 MCP 工具

## 常见问题

### Q: MCP 工具显示 "Tool not found"

**原因**：MCP Server 未正确构建或配置。

**解决方案**：
```bash
cd packages/mcp-server
npm install
npm run build
# 然后重新配置 MCP 服务器
```

### Q: 工具数不足 53

**原因**：`skills-data.ts` 或 `toolkit-data.ts` 不完整。

**解决方案**：从仓库拉取最新代码：
```bash
git pull origin main
cd packages/mcp-server
npm run build
```

### Q: npm install 失败

**解决方案**：
1. 检查 Node.js 版本 >= 18：`node --version`
2. 清理缓存：`npm cache clean --force`
3. 删除 node_modules 后重试：`rm -rf node_modules && npm install`

## 卸载

```bash
node scripts/cli.js uninstall
```

## 下一步

- [快速开始](./quickstart) — 5 分钟内调用第一个工具
- [MCP Server 文档](../api/mcp-server) — 了解 53 个工具的详细说明
