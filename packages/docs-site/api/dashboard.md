# 能力度量仪表盘 API

> `@metago-ai/dashboard` v0.1.0 — 让每一次工具调用都成为可量化的能力数据。

## 概览

| 项目 | 值 |
|------|-----|
| 包名 | `@metago-ai/dashboard` |
| 版本 | 0.1.0 |
| 依赖 | 零（仅 Node.js 内置模块） |
| 端口 | 7891（可配置） |
| 数据源 | `~/.metago/logs/calls.jsonl` |

## 启动

```bash
# 在 metago-lifeform 仓库
npm start --workspace @metago-ai/dashboard

# 或直接运行
cd packages/dashboard
npm start
```

浏览器访问 [http://localhost:7891](http://localhost:7891)。

## API 端点

### GET /api/health

健康检查。

**响应**：
```json
{
  "status": "ok",
  "timestamp": "2026-06-30T12:34:56.789Z"
}
```

### GET /api/stats

返回完整统计数据。

**响应结构**：
```json
{
  "summary": {
    "totalRecords": 7,
    "totalCalls": 5,
    "totalErrors": 2,
    "errorRate": 40,
    "startupCount": 1,
    "crashCount": 1,
    "uniqueTools": 3,
    "logFileExists": true,
    "logFileSizeBytes": 870
  },
  "toolStats": [
    {
      "name": "metago_critique",
      "calls": 3,
      "errors": 0,
      "errorRate": 0,
      "avgDurationMs": 156.67,
      "p50Ms": 150,
      "p95Ms": 200
    }
  ],
  "dailyStats": [
    { "day": "2026-06-30", "calls": 5, "errors": 1 }
  ],
  "versionStats": { "1.1.8": 7 },
  "recentRecords": [...]
}
```

**字段说明**：

| 字段 | 说明 |
|------|------|
| `summary.totalRecords` | 总记录数（含 lifecycle） |
| `summary.totalCalls` | 工具调用次数（仅 type=call） |
| `summary.totalErrors` | 错误总数（call error + lifecycle error） |
| `summary.errorRate` | 错误率（totalErrors / totalCalls * 100） |
| `summary.startupCount` | mcp-server 启动次数 |
| `summary.crashCount` | mcp-server 崩溃次数 |
| `summary.uniqueTools` | 唯一工具数 |
| `toolStats[].p50Ms` | P50 延迟（毫秒） |
| `toolStats[].p95Ms` | P95 延迟（毫秒） |
| `recentRecords` | 最近 20 条记录（倒序） |

### GET /api/raw

返回原始记录数组。

**响应**：`[record, record, ...]`（JSON 数组）

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `METAGO_DASHBOARD_PORT` | `7891` | 监听端口 |
| `METAGO_LOG_DIR` | `~/.metago/logs` | 日志目录 |

## 隐私

- 调用参数默认**不记录**（仅记录 toolName + durationMs + result）
- `METAGO_LOG_ARGS=1` 显式开启参数记录
- 疑似敏感字段自动掩码
- 完全禁用：`METAGO_LOG_DISABLE=1`

## 单元测试

```bash
npm test
```

21 项测试覆盖 computeStats 全部逻辑，含边界场景。

## 下一步

- [MCP Server API](./mcp-server) — 37 tools 详解
- [快速开始](../guide/quickstart) — 5 分钟上手
- [39 技能一览](../skills/overview) — 技能详解
