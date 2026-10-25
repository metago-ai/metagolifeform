# MetaGO Lifeform 多平台插件层（V36.12.0）

> 本发行版为**全量版**：一个包内含 规则（AGENTS.md）+ 112 技能 + 112 MCP 工具（55+57/927 算法）+ 35 专家智能体 + 多平台插件层，适配 11 个平台形态，两套插件标准全齐。

## 1. 插件层结构

```
plugins/
├── agent-plugins-1.0.0/        ← 标准①：Agent Plugins 1.0.0（OpenAI 联盟）
│   ├── plugin.json              根清单（$schema + name + version 等 10 字段）
│   ├── skills/                  100 个 SKILL.md（字节级跨平台兼容）
│   ├── mcp.json                 双服务器声明（type: stdio + 命令名）
│   └── com.metago.life/         反域名扩展目录（agents 35 个 + manifest + README）
├── claude/                     ← 标准②：Anthropic 系（.claude-plugin/）
│   ├── .claude-plugin/plugin.json
│   ├── skills/                  98 个
│   ├── agents/                  35 个专家子智能体
│   ├── commands/                4 个 slash 命令（activate/verify/skills/agents）
│   ├── hooks/hooks.json         决策锁审计钩子（PreToolUse + Stop）
│   ├── .mcp.json                双服务器
│   └── scripts/                 audit-tool-use.cjs / session-end.cjs
├── zcode/                      ← ZCode 明确格式（.zcode-plugin/plugin.json，含内联 mcpServers）
├── codex/                      ← Codex 兼容名（.codex-plugin/plugin.json）
└── platform-matrix.json        ← 11 平台 × 资源 × 落点矩阵（安装器数据源）
```

## 2. 两套插件标准（全齐）

| 标准 | 清单位置 | 兼容客户端 | 覆盖组件 |
|------|---------|-----------|---------|
| **Agent Plugins 1.0.0**（2026-08-06 发布） | 根 `plugin.json` | VS Code、Cursor、GitHub Copilot、ChatGPT、Codex、Amazon Kiro、Google | skills + mcp（v1 不含 agents/hooks，扩展走 `com.*` 目录） |
| **Anthropic 插件 SDK** | `.claude-plugin/plugin.json` | Claude Code、ZCode（兼容） | skills + agents + commands + hooks + mcp |
| ZCode 明确格式 | `.zcode-plugin/plugin.json` | ZCode | skills + agents + commands + hooks + mcp（内联） |
| Codex 兼容名 | `.codex-plugin/plugin.json` | OpenAI Codex | skills + agents |

## 3. 使用方式

### 3.1 生成插件包（CLI 一键）
```bash
metago-lifeform plugin-pack --format all                 # 全部 4 个标准 → ./dist/plugins/
metago-lifeform plugin-pack --format claude --out ./dist # 仅 Claude 系
metago-lifeform plugin-pack --format agent-plugins-1.0.0 # 仅 OpenAI 联盟标准
```

### 3.2 平台安装时随装插件
```bash
metago-lifeform install --platform zcode --with-plugin    # ZCode 全量（含插件部署）
metago-lifeform install --platform claude-code --with-plugin
bash local-edition/install-local.sh --platform zcode --with-plugin
```

### 3.3 手动安装（各平台）
- **ZCode**：设置 → 插件管理 → 添加本地市场目录（`metago-lifeform install --with-plugin` 已自动注册 `metago-local` 市场）
- **Claude Code**：`claude --plugin-dir <插件包路径>` 或复制到 `~/.claude/plugins/metago-lifeform/`
- **Agent Plugins 1.0.0 客户端**：将 `plugins/agent-plugins-1.0.0/` 作为 Agent Plugin 安装（根 plugin.json 会被识别）

## 4. 11 平台形态 × 能力矩阵

| 平台形态 | 技能 | 智能体 | MCP | 插件清单 |
|---------|------|--------|-----|---------|
| zcode | ✅ 原生 | ✅ 原生 | ✅ 原生 | .zcode-plugin/ + .claude-plugin/ |
| claude-code | ✅ 原生 | ✅ 原生 | ✅ 原生 | .claude-plugin/ |
| cursor | ✅ 原生（2.4+） | ⚠️ .agents/ 兼容 | ✅ | Agent Plugins 1.0.0 |
| trae | ✅ 原生 | ⚠️ 按能力 | ✅ | ⚠️ VS Code 风格 |
| codex | ✅ 原生 | ⚠️ 兼容目录 | ✅ | .codex-plugin/ + Agent Plugins 1.0.0 |
| chatgpt-work | ✅ 原生 | ⚠️ 按能力 | ✅ | Agent Plugins 1.0.0 |
| codebuddy | ✅ 原生 | ⚠️ 按能力 | ✅ | ⚠️ 自家格式 |
| workbuddy | ✅ 原生 | ⚠️ 按能力 | ✅ | ⚠️ 自家格式 |
| qoder | ✅ 原生 | ⚠️ 按能力 | ✅ | ⚠️ 自家格式 |
| kimi-code | ✅ 原生 | ⚠️ 按能力 | ✅（CLI） | ❌ 无通道（技能+法则生效） |
| kimi-work | ✅ 原生 | ⚠️ 按能力 | ❌（桌面不注入，已知限制） | ❌ 同上 |

✅=原生支持　⚠️=兼容目录或最小适配　❌=平台无此通道（如实标注）

## 5. 已知边界（如实说明）

1. **Agent Plugins 1.0.0 发布仅数日（2026-08-06）**，各客户端生态落地程度有限——本发行版按规范校验格式，客户端实测待生态成熟。
2. **agents（子智能体）是跨平台性最弱的一层**：Agent Plugins v1 规范明确不含 agents 组件，故置于 `com.metago.life/agents/` 扩展目录与 Claude 系包内；非 Claude 系平台按能力加载或跳过。
3. **Kimi Work 桌面版不注入自定义 MCP 工具**（官方限制，官方插件同样受限）——生效通道为"法则 + 技能 + Bash 直调"。
4. **MCP 双服务器依赖 npm 全局层**：`metago-mcp-server` / `metago-algorithms` 命令需先安装 `local-edition/offline-packages/` 的 6 个 tgz 包。

## 6. 验收

```bash
node local-edition/verify-local-install.cjs --platform zcode
# 类别 10（插件层 8 项）+ 类别 11（平台矩阵 3 项）全 PASS 即插件层正确
```
