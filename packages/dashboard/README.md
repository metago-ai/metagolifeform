# @metago-ai/dashboard

> MetaGO 能力度量仪表盘 — 让每一次工具调用都成为可量化的能力数据。

## 这是什么

`@metago-ai/dashboard` 是 MetaGO 生命体的能力度量可视化层。它读取 `@metago-ai/mcp-server` 写入的 `calls.jsonl` 调用日志，提供实时统计与可视化：

- 总调用次数 / 错误率 / 启动次数 / 崩溃次数
- 每个工具的调用次数、平均时长、P50、P95
- 每日调用趋势折线图
- 工具调用分布环形图
- 最近 20 条调用记录

## 核心特性

- **零依赖**：仅使用 Node.js 内置模块（`http`/`fs`/`path`），无需 Express
- **零构建**：前端单 HTML 文件 + Chart.js CDN，无需 webpack/vite
- **隐私优先**：所有数据本地存储，不上传任何外部服务器
- **开箱即用**：`npm start` 即启动，浏览器访问 `http://localhost:7891`

## 快速开始

```bash
# 在 metago-lifeform 仓库根目录
npm start --workspace @metago-ai/dashboard

# 或直接进入目录运行
cd packages/dashboard
npm start
```

浏览器访问 [http://localhost:7891](http://localhost:7891) 即可看到仪表盘。

**前置条件**：需要先使用 `@metago-ai/mcp-server` 至少一次，以生成 `~/.metago/logs/calls.jsonl` 数据文件。若文件不存在，仪表盘会显示友好提示。

## API 端点

| 端点 | 方法 | 返回 | 说明 |
|------|------|------|------|
| `/api/health` | GET | `{status, timestamp}` | 健康检查 |
| `/api/stats` | GET | `{summary, toolStats, dailyStats, versionStats, recentRecords}` | 完整统计数据 |
| `/api/raw` | GET | `[records...]` | 原始记录数组 |
| `/` | GET | HTML | 仪表盘前端页面 |

## 数据格式

### `calls.jsonl` 每行一个 JSON 记录

```json
{
  "ts": "2026-06-30T12:34:56.789Z",
  "type": "call",
  "toolName": "metago_critique",
  "result": "ok",
  "durationMs": 150,
  "version": "1.1.5"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `ts` | string | ISO 时间戳 |
| `type` | `"call"` \| `"lifecycle"` | 记录类型 |
| `toolName` | string? | 工具名（仅 type=call） |
| `result` | `"ok"` \| `"error"` | 执行结果 |
| `durationMs` | number? | 耗时毫秒（仅 type=call） |
| `error` | string? | 错误信息（result=error 时） |
| `version` | string | mcp-server 版本号 |

### 统计指标说明

**summary**：
- `totalRecords` — 总记录数
- `totalCalls` — 工具调用次数（仅 type=call）
- `totalErrors` — 错误总数（call error + lifecycle error）
- `errorRate` — 错误率（totalErrors / totalCalls * 100）
- `startupCount` — mcp-server 启动次数
- `crashCount` — mcp-server 崩溃次数
- `uniqueTools` — 唯一工具数
- `logFileExists` / `logFileSizeBytes` — 日志文件状态

**toolStats**（按调用次数降序）：
- `calls` / `errors` / `errorRate`
- `avgDurationMs` / `p50Ms` / `p95Ms`

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `METAGO_DASHBOARD_PORT` | `7891` | 仪表盘监听端口 |
| `METAGO_LOG_DIR` | `~/.metago/logs` | 日志目录（含 calls.jsonl） |
| `METAGO_LOG_ARGS` | `0` | mcp-server 是否记录调用参数（隐私开关） |
| `METAGO_LOG_DISABLE` | `0` | 是否完全禁用日志 |

## 单元测试

```bash
npm test
```

测试覆盖 `computeStats` 函数的全部统计逻辑：
- summary 汇总（7 项指标）
- toolStats 工具统计（含 P50/P95 计算）
- dailyStats 按天分组
- versionStats 版本分布
- recentRecords 最近记录
- 边界场景（空数组、单条记录、非 call 类型）

## 架构

```
packages/dashboard/
├── package.json          # 包定义
├── server.mjs            # 后端：Node.js 内置 http 服务器（零依赖）
├── public/
│   └── index.html        # 前端：单 HTML + 内联 CSS + Chart.js CDN
└── tests/
    └── compute-stats.test.mjs  # Vitest 单元测试
```

## 设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 后端框架 | Node.js 内置 http | 零依赖，避免 Express 体积 |
| 前端构建 | 无 | 单 HTML + CDN，部署即用 |
| 图表库 | Chart.js CDN | 成熟稳定，无需构建 |
| 数据存储 | JSONL 文件 | 追加写入性能好，无数据库依赖 |
| 端口 | 7891 | 避开常用端口冲突 |

## 隐私合规

- 调用参数默认**不记录**（仅记录 toolName + durationMs + result）
- 用户可通过 `METAGO_LOG_ARGS=1` 显式开启参数记录
- 疑似敏感字段（password/secret/token/key/credential）自动掩码
- 长字符串截断保留前 500 字符
- 完全禁用日志：`METAGO_LOG_DISABLE=1`

## 下一步演进

- [ ] 历史趋势图（7 天/30 天/90 天）
- [ ] 工具调用热力图（按小时分布）
- [ ] 导出 CSV/JSON 报告
- [ ] 多实例数据聚合（跨设备）
- [ ] 异常检测告警（错误率突增通知）

---

*由 MetaGO Lifeform Kit 生成 | 版本：0.1.0 | 最后更新：2026-06-30*
