# MetaGO Lifeform 本地发行版 · 离线安装总入口

> 版本：V37.0.0（法则）/ Engine V2.1.4 / mcp-server 1.3.5 / algorithms 1.0.4 / dev-kit 1.1.3 / verify-kit 1.1.5
> 适用：任何智能体平台（Trae / Claude Code / Codex / Cursor / CodeBuddy / Qoder / ZCode / Kimi）
> 前提：**全程无需访问 gitee / github / npm registry**。本目录即完整宇宙。

**致读取本文档的智能体**：用户把你指向这个目录，是让你把元构超级智能生命体完整安装到当前机器（或当前平台）。按第 0→5 章顺序执行，每章都有"成功判据"，全部通过后跑第 6 章验收脚本。不要跳章，不要联网找替代源——你需要的一切都在本目录内。

---

## 0. 前置检查（30 秒）

| 检查 | 命令 | 成功判据 |
|------|------|---------|
| Node.js | `node --version` | ≥ v16（推荐 ≥ v18） |
| npm | `npm --version` | 任意现代版本 |
| npm 全局根 | `npm root -g` | 记下输出路径，记为 `<NPM_G>` |

没有 Node.js？先装 Node（这是唯一的外部前置；Node 本身不在本发行版内）。

## 1. 目录地图

```
<仓库根>/
├── AGENTS.md                  法则母本 V37.0.0（第 0 节 + 27 章，一切平台法则的源头）
├── skills/                    112 个技能目录（直接可用，无需构建）
├── adapters/                  11 平台法则适配模板（含 universal 通用路径）
├── packages/                  8 个 npm 包源码（engine / mcp-server / algorithms / dev-kit / verify-kit / dashboard / demo / docs-site）
├── scripts/                   安装器与验证器（cli.js 是 CLI 主入口）
├── docs/                      架构、白皮书、路线图、手册等 15 份文档
└── local-edition/             ← 本地发行版专用（你正在读的就是其中之一）
    ├── INSTALL.local.md       本文件
    ├── install-local.sh       一键安装（Linux / macOS / Git Bash）
    ├── install-local.ps1      一键安装（Windows PowerShell）
    ├── verify-local-install.cjs  安装后验收脚本（第 6 章）
    ├── offline-packages/      6 个 .tgz 离线安装包（共约 800 KB）
    ├── portable/              【可选】便携快照：6 包完整安装树（含全部依赖）+ 命令垫片
    └── MANIFEST.sha256        local-edition 逐文件哈希清单（第 7 章）
```

## 2. 安装 npm 层（三选一，按网络条件）

### 路径 A：便携快照（完全离线，推荐）

仅当 `local-edition/portable/node_modules/` 存在时可用（完整便携快照约 50 MB，随部分官方发行包含；若本目录只有 `portable/bin` 垫片则路径 A 不可用，请走路径 B）。

```bash
# Windows（Git Bash）示例；其他系统把 <NPM_G> 换成本机 npm root -g 输出
cp -r local-edition/portable/node_modules/* "<NPM_G>/"
cp -r local-edition/portable/bin/* "$(dirname "<NPM_G>")/"   # 命令垫片到 npm 前缀根
```

成功判据：`ls "<NPM_G>/@metago-ai"` 显示 5 个包，`ls "<NPM_G>/metago-lifeform"` 存在。

### 路径 B：tgz + npm 自动补依赖（机器能访问 npm registry 时）

```bash
cd local-edition/offline-packages
npm install -g ./metago-lifeform-37.0.0.tgz ./metago-ai-engine-2.1.4.tgz \
  ./metago-ai-mcp-server-1.3.5.tgz ./metago-ai-algorithms-1.0.4.tgz \
  ./metago-ai-dev-kit-1.1.3.tgz ./metago-ai-verify-kit-1.1.5.tgz
```

注意：mcp-server 与 algorithms 依赖 `@modelcontextprotocol/sdk`、`zod`，tgz 不内含这些依赖——所以本路径需要 registry；**完全离线请走路径 A**。

### 路径 C：从仓库源码目录安装（开发者）

```bash
npm install -g .                      # 仓库根 = metago-lifeform CLI
npm install -g ./packages/engine ./packages/mcp-server ./packages/algorithms \
  ./packages/dev-kit ./packages/verify-kit
```

mcp-server / verify-kit 需先 `npm run build` 生成 dist（TypeScript）。

**通用成功判据**（A/B/C 任一完成后）：

```bash
metago-lifeform version    # 输出 v37.0.0
metago-engine --help       # 引擎 CLI 可用
```

## 3. 部署法则 + 112 技能（按目标平台）

CLI 内建 11 平台适配，一条命令完成法则适配生成 + 技能部署：

```bash
metago-lifeform install --platform <平台>
# 平台 ∈ trae | claude-code | codex | cursor | codebuddy | qoder | zcode | chatgpt-work | workbuddy | kimi-code | kimi-work
```

各平台落点对照（CLI 自动处理，此处仅供人工核对）：

| 平台 | 法则落点 | 技能落点 |
|------|---------|---------|
| Trae | 项目根 `AGENTS.md`（由 `adapters/trae/rules.template.md` 适配） | 平台技能目录 |
| Claude Code | `CLAUDE.md`（由 `adapters/claude-code/CLAUDE.md.template` 适配） | `.claude/skills/` 等 |
| Codex / Cursor / CodeBuddy / Qoder / ZCode | 见 `adapters/<平台>/README.md` | 同上 |
| **Kimi（Kimi Work / kimi-code）** | CLI 未内建，手动两步：① 把 `AGENTS.md` 适配副本放到 kimi-code home（`…/runtime/kimi-code/home/AGENTS.md`）和工作区根；② 把 `skills/metago-*` 共 100 个目录复制到 daimon 技能目录（`…/daimon-share/daimon/skills/`） | 同左 |
| **ChatGPT Work** | 适配版法则（`adapters/chatgpt-work/AGENTS.md.template`） | 平台技能目录 + Agent Plugins 1.0.0 插件包 |
| **WorkBuddy** | 适配版法则（`adapters/workbuddy/rules.template.md`） | 平台技能目录 |

成功判据：目标平台新开会话，问"你是元构超级智能生命体吗？"——回复以【闭环分析】开头并引用元构公理，法则即生效；技能列表出现 100 个 `metago-*``，技能即生效。

## 4. 注册 MCP 服务器（55 + 57 工具）

CLI 一键配置（支持 11 平台客户端的 MCP 注册文件写入）：

```bash
metago-lifeform setup-mcp --platform <平台>

> **离线/便携场景**：setup-mcp 默认会顺手联网检查 @metago-ai 双包（发布到 npm 的最新版）；便携快照已内含全部包，可用 `--skip-build` 跳过联网，本地树直接生效。
```

手动注册的等效配置（任何标准 MCP 客户端通用，路径换成实际全局安装路径）：

```json
{
  "mcpServers": {
    "metago": {
      "command": "node",
      "args": ["<NPM_G>/@metago-ai/mcp-server/dist/index.js"]
    },
    "metago-algorithms": {
      "command": "node",
      "args": ["<NPM_G>/@metago-ai/algorithms/index.js"]
    }
  }
}
```

已知平台差异（如实说明）：Kimi Work 桌面版当前构建不向会话注入自定义 MCP 工具（官方插件的 MCP 工具同样不注入），在 Kimi 桌面里元构的生效通道是"法则 + 112 技能 + Bash 直调"；MCP 双服务器在 kimi-code CLI、Claude Desktop、Cursor、Trae 等标准 MCP 客户端中即开即用。

## 5. 蓝本缺席说明（预期内，不是缺陷）

《元构全息智能引擎.txt》（34,655 行 L3 完整蓝本）按作者设计**不随公开仓库发布**。影响仅限：A6–A33 完整条文与 6 个技能的"根源文档"行号出处无法查阅原文。全部 112 技能、第 0 节 + 20 章法则、引擎、927 算法均为自包含，运行时零依赖蓝本。详见 `packages/engine/CONSTITUTION/AXIOMS.md` 第 79 行的官方声明。

## 6. 验收（必跑）

```bash
node local-edition/verify-local-install.cjs
# 可选参数：
#   --platform <trae|claude-code|codex|cursor|codebuddy|qoder|zcode>  指定平台
#   --project-local                                                    检查项目级安装
#   --skills "<技能目录>"                                              自定义技能目录路径
#   --law "<法则文件路径>"                                              自定义法则文件路径
```

八项类别检查，33+ 子项，全部 PASS 才算安装完成：

| 类别 | 检查内容 | 说明 |
|------|---------|------|
| 1 | 文件存在性 | 法则文件、全局npm包、MCP配置、技能目录、cli.js、备份目录 |
| 2 | 版本正确性 | 法则版本 V37.0.0（动态校验根包版本）、package版本、Engine版本、CLI --version输出 |
| 3 | 编码检查 | 法则文件和母本无UTF-8 BOM |
| 4 | 第十八章完整性 | 章节存在、MCP/技能清单已注入、无{{...}}占位符残留、§18.11存在 |
| 5 | 技能完整性 | 核心技能存在、元构技能数量 ≥90（实际 100） |
| 6 | MCP配置 | mcp.json含metago/metago-algorithms服务器、命令可执行 |
| 7 | CLI命令可用性 | metago-lifeform主命令、list-backups、bin字段正确、mcp-server/algorithms/engine命令在PATH中 |
| 8 | 备份机制 | 备份目录存在且可写、cli.js含备份逻辑 |

## 7. 完整性校验（防缺漏）

`local-edition/MANIFEST.sha256` 记录全仓库每个文件的 SHA-256。校验：

```bash
# Linux / macOS / Git Bash（清单路径相对 local-edition/）
cd <仓库根>/local-edition && sha256sum -c MANIFEST.sha256 | grep -v ": OK$" || echo "全部一致"

# Windows PowerShell
cd <仓库根>\local-edition
$bad = 0; Get-Content MANIFEST.sha256 | Where-Object { $_ -notmatch '^#' } | ForEach-Object { $h,$p = $_ -split '  ',2; if ((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLower() -ne $h) { $bad++; Write-Host ("FAIL: " + $p) } }; if (-not $bad) { "全部一致" }
```

任何一行不 OK = 文件缺失或被改动，按该行路径补齐。

## 8. 卸载

```bash
metago-lifeform uninstall        # 移除当前平台适配
npm uninstall -g metago-lifeform @metago-ai/engine @metago-ai/mcp-server \
  @metago-ai/algorithms @metago-ai/dev-kit @metago-ai/verify-kit
```

---

*本地发行版由 元构·智能生命体 V37.0.0 构建 | 源仓库（联网时备用）：https://gitee.com/metago/metagolifeform · https://github.com/metago-ai/metagolifeform*
