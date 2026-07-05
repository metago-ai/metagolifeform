# @metago-ai/docs-site

> MetaGO 文档站 — 基于 VitePress 的结构化文档站点。

## 这是什么

`@metago-ai/docs-site` 是 MetaGO 生命体的文档门户。基于 VitePress 构建，提供：

- 结构化导航（39 技能 + 36 公理 + 53 tools）
- 本地搜索（无需 Algolia）
- 暗黑模式
- 响应式设计
- 中文本地化

## 快速开始

```bash
# 开发模式（热更新）
npm run dev --workspace @metago-ai/docs-site

# 构建生产版本
npm run build --workspace @metago-ai/docs-site

# 预览构建结果
npm run preview --workspace @metago-ai/docs-site
```

默认端口：
- dev: 5173
- preview: 4173

## 文档结构

```
docs-site/
├── .vitepress/
│   ├── config.ts          # VitePress 配置（导航/侧边栏/搜索/主题）
│   ├── dist/               # 构建产物（gitignore）
│   └── cache/              # 构建缓存（gitignore）
├── index.md                # 首页（Hero + Features）
├── guide/                  # 指南
│   ├── introduction.md     # 介绍
│   ├── installation.md     # 安装
│   └── quickstart.md       # 快速开始
├── skills/                 # 技能文档
│   └── overview.md         # 39 技能一览
├── engine/                 # 引擎文档
│   └── axioms.md           # 36 条核心公理
├── api/                    # API 文档
│   ├── mcp-server.md       # MCP Server 53 tools
│   └── dashboard.md       # 能力度量仪表盘
└── reference/              # 参考（待补充）
```

## 设计原则

1. **高维产品的一键体验** — 30 秒感知整体价值
2. **结构化导航** — 39 技能 + 53 tools + 36 公理 有序呈现
3. **深度可达** — 核心文档站内阅读，理论体系外链
4. **渐进式构建** — 先框架后内容，ignoreDeadLinks 允许渐进

## 配置说明

### 导航栏（nav）

顶部导航在 `.vitepress/config.ts` 的 `themeConfig.nav` 中配置。

### 侧边栏（sidebar）

按路径前缀分组：
- `/guide/` — 指南
- `/skills/` — 39 技能（按能力族分组）
- `/engine/` — 引擎核心
- `/api/` — API 参考
- `/reference/` — 参考

### 搜索

使用 VitePress 内置本地搜索（`search.provider: "local"`），无需 Algolia。

## 部署

### 静态部署

构建后 `dist/` 是纯静态文件，可部署到任何静态托管：

- CloudBase（现有官网）
- GitHub Pages
- Vercel / Netlify
- Nginx

### CloudBase 部署

```bash
# 构建
npm run build --workspace @metago-ai/docs-site

# 部署到 CloudBase
cloudbase hosting:deploy .vitepress/dist -e metago-d6gfw1e4rf2a5bcad
```

## 下一步演进

- [ ] 补充 39 技能详细页（当前只有总览）
- [ ] 添加平台适配器详细页
- [ ] 迁移 WHITEPAPER.md（白皮书）
- [ ] 添加 API 交互式 Playground
- [ ] 多语言支持（中/英）
- [ ] Algolia DocSearch 接入（当本地搜索不够时）

## 技术栈

| 组件 | 选型 | 理由 |
|------|------|------|
| 框架 | VitePress 1.6 | Vue 生态，专为文档设计 |
| 构建 | Vite | 极速 HMR |
| 搜索 | 本地索引 | 无需 Algolia，开箱即用 |
| 部署 | 静态托管 | 任何平台通用 |

---

*版本：0.1.0 | 最后更新：2026-06-30*
