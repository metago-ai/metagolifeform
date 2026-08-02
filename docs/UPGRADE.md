# MetaGO Lifeform 升级指南

本文档说明如何从旧版本（V36.8.7 及更早）升级到 V36.9.1。

## 升级前必读

V36.9.1 是跨平台修复版本，主要变更：
- **修复**：`setup-mcp` 路径解析 bug（旧版 PowerShell 脚本使用仓库相对路径导致全局安装失败）
- **新增**：第十八章 MCP工具与技能智慧触发协议（v3.0 通用框架 + 平台动态注入）
- **新增**：自动备份机制（安装前备份到 `~/.metago-backups/<时间戳>/`）
- **新增**：`list-backups` / `restore-backup` / `cleanup-backups` 备份管理命令
- **增强**：安装后验收脚本（8大类 30+ 检查项）
- **更新**：所有7个平台适配模板到 V36.9.1（无BOM、含第十八章、动态注入清单）
- **统一**：所有安装脚本（install.ps1/install.sh/setup-mcp-server.ps1）均转发到 `node cli.js` 统一逻辑

## 标准升级流程（推荐）

### Windows（PowerShell）

```powershell
# 1. 卸载旧版本（如果全局安装了旧包）
npm uninstall -g metago-lifeform

# 2. 安装新版本
npm install -g metago-lifeform@36.9.1

# 3. 重新安装到目标平台（会自动备份旧配置）
metago-lifeform install --platform trae --force

# 4. 重新配置 MCP（修复旧版路径bug）
metago-lifeform setup-mcp --platform trae

# 5. 运行验收脚本验证
metago-lifeform verify
# 或直接运行：
# node "$(npm root -g)/metago-lifeform/local-edition/verify-local-install.cjs"
```

### macOS/Linux（Bash）

```bash
# 1. 卸载旧版本
npm uninstall -g metago-lifeform

# 2. 安装新版本
npm install -g metago-lifeform@36.9.1

# 3. 重新安装到目标平台
metago-lifeform install --platform claude-code --force

# 4. 重新配置 MCP
metago-lifeform setup-mcp --platform claude-code

# 5. 验收
node "$(npm root -g)/metago-lifeform/local-edition/verify-local-install.cjs"
```

## 从本地压缩包升级（离线环境）

```powershell
# 解压压缩包
Expand-Archive -Path metagolifeform-local-v36.9.1.zip -DestinationPath .

# 进入目录
cd metagolifeform-v36.9.1

# 运行本地安装脚本（Windows）
.\local-edition\install-local.ps1

# macOS/Linux
# bash local-edition/install-local.sh
```

## 升级回滚（如遇问题）

V36.9.1 引入自动备份机制，安装前会自动备份旧配置：

```powershell
# 查看可用备份
metago-lifeform list-backups

# 恢复到某个备份
metago-lifeform restore-backup <备份目录名>

# 清理旧备份（保留最近5个）
metago-lifeform cleanup-backups
```

备份内容存储在 `~/.metago-backups/` 目录下，包含：
- 旧版法则文件（AGENTS.md / CLAUDE.md 等）
- 旧版 MCP 配置（mcp.json）
- 旧版技能目录（skills/）

## 多平台升级

如果你同时使用多个平台（如 Trae + Claude Code + Cursor），需要为每个平台分别运行安装命令：

```powershell
metago-lifeform install --platform trae --force
metago-lifeform install --platform claude-code --force
metago-lifeform install --platform cursor --force
```

## 常见问题

### Q: 升级后 MCP 工具不显示？
旧版 `setup-mcp` 存在路径bug，V36.9.1已修复。重新运行：
```powershell
metago-lifeform setup-mcp --platform <你的平台>
```
然后重启 IDE。

### Q: 升级后法则文件还是旧版本？
使用 `--force` 参数强制覆盖：
```powershell
metago-lifeform install --platform <你的平台> --force
```

### Q: 离线安装后 metago-lifeform 命令不可用？
确保已全局安装 npm 包：
```powershell
npm install -g .\local-edition\offline-packages\metago-lifeform-36.9.1.tgz
```

### Q: 如何确认升级成功？
运行验收脚本：
```powershell
node "$(npm root -g)/metago-lifeform/local-edition/verify-local-install.cjs"
```
全部 30+ 检查项通过即表示升级成功。
