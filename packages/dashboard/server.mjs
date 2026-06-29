/**
 * MetaGO 能力度量仪表盘 - 服务器
 *
 * 基于 calls.jsonl 数据源，提供可视化 API。
 * 零依赖（仅用 Node.js 内置模块），启动即用。
 *
 * 数据源：~/.metago/logs/calls.jsonl
 * 端口：默认 7891（可通过 PORT 环境变量修改）
 */

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.METAGO_DASHBOARD_PORT || 7891;
const LOG_DIR = process.env.METAGO_LOG_DIR || join(homedir(), ".metago", "logs");
const CALLS_FILE = join(LOG_DIR, "calls.jsonl");

// MIME 类型映射
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

/**
 * 读取并解析 calls.jsonl
 */
function readCalls() {
  if (!existsSync(CALLS_FILE)) {
    return { records: [], fileExists: false, fileSize: 0 };
  }
  const stat = statSync(CALLS_FILE);
  const content = readFileSync(CALLS_FILE, "utf-8");
  const records = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed));
    } catch {
      // 跳过损坏的行
    }
  }
  return { records, fileExists: true, fileSize: stat.size };
}

/**
 * 计算统计数据
 */
function computeStats(records) {
  const total = records.length;
  const toolCalls = records.filter((r) => r.type === "call");
  const errors = records.filter((r) => r.result === "error");
  const lifecycle = records.filter((r) => r.type === "lifecycle");
  const startups = lifecycle.filter((r) => r.error === undefined && r.result === "ok");
  const crashes = lifecycle.filter((r) => r.result === "error");

  // 按工具分组统计
  const byTool = {};
  for (const r of toolCalls) {
    const name = r.toolName || "unknown";
    if (!byTool[name]) {
      byTool[name] = { calls: 0, errors: 0, totalDurationMs: 0, durations: [] };
    }
    byTool[name].calls++;
    if (r.result === "error") byTool[name].errors++;
    if (typeof r.durationMs === "number") {
      byTool[name].totalDurationMs += r.durationMs;
      byTool[name].durations.push(r.durationMs);
    }
  }

  // 计算每个工具的 P50/P95
  const toolStats = Object.entries(byTool)
    .map(([name, data]) => {
      const avg = data.calls > 0 ? data.totalDurationMs / data.calls : 0;
      const sorted = [...data.durations].sort((a, b) => a - b);
      const p50Ms = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.5)] : 0;
      const p95Ms = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;
      const errorRate = data.calls > 0 ? (data.errors / data.calls) * 100 : 0;
      return {
        name,
        calls: data.calls,
        errors: data.errors,
        errorRate: Number(errorRate.toFixed(2)),
        avgDurationMs: Number(avg.toFixed(2)),
        p50Ms: Number(p50Ms.toFixed(2)),
        p95Ms: Number(p95Ms.toFixed(2)),
      };
    })
    .sort((a, b) => b.calls - a.calls);

  // 按天分组
  const byDay = {};
  for (const r of toolCalls) {
    const day = r.ts ? r.ts.slice(0, 10) : "unknown";
    if (!byDay[day]) byDay[day] = { calls: 0, errors: 0 };
    byDay[day].calls++;
    if (r.result === "error") byDay[day].errors++;
  }
  const dailyStats = Object.entries(byDay)
    .map(([day, data]) => ({ day, ...data }))
    .sort((a, b) => a.day.localeCompare(b.day));

  // 版本分布
  const byVersion = {};
  for (const r of records) {
    const v = r.version || "unknown";
    byVersion[v] = (byVersion[v] || 0) + 1;
  }

  return {
    summary: {
      totalRecords: total,
      totalCalls: toolCalls.length,
      totalErrors: errors.length,
      errorRate: toolCalls.length > 0 ? Number(((errors.length / toolCalls.length) * 100).toFixed(2)) : 0,
      startupCount: startups.length,
      crashCount: crashes.length,
      uniqueTools: Object.keys(byTool).length,
      logFileExists: true,
      logFileSizeBytes: 0,
    },
    toolStats,
    dailyStats,
    versionStats: byVersion,
    recentRecords: records.slice(-20).reverse(),
  };
}

/**
 * HTTP 服务器
 */
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (pathname === "/api/stats") {
    try {
      const { records, fileExists, fileSize } = readCalls();
      if (!fileExists) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          error: "calls.jsonl not found",
          path: CALLS_FILE,
          hint: "Run @metago-ai/mcp-server at least once to generate log data",
        }));
        return;
      }
      const stats = computeStats(records);
      stats.summary.logFileExists = true;
      stats.summary.logFileSizeBytes = fileSize;
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(stats, null, 2));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }

  if (pathname === "/api/raw") {
    try {
      const { records } = readCalls();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(records, null, 2));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }

  if (pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    return;
  }

  // 静态文件服务
  let filePath = pathname === "/" ? "/index.html" : pathname;
  const fullPath = resolve(__dirname, "public" + filePath);

  if (!fullPath.startsWith(resolve(__dirname, "public"))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!existsSync(fullPath)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = extname(fullPath);
  const mime = MIME[ext] || "application/octet-stream";
  try {
    const content = readFileSync(fullPath);
    res.writeHead(200, { "Content-Type": mime });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
});

// 仅在直接执行时启动服务器（避免单元测试 import 时触发 listen）
const isMain = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`;
if (isMain) {
  server.listen(PORT, () => {
    console.log("");
    console.log("  ╔══════════════════════════════════════════╗");
    console.log("  ║  MetaGO 能力度量仪表盘 v0.1               ║");
    console.log("  ╠══════════════════════════════════════════╣");
    console.log(`  ║  地址: http://localhost:${PORT}            ║`);
    console.log(`  ║  数据: ${CALLS_FILE.length > 32 ? CALLS_FILE.slice(0, 32) + "..." : CALLS_FILE.padEnd(32)}║`);
    console.log("  ║  按 Ctrl+C 退出                           ║");
    console.log("  ╚══════════════════════════════════════════╝");
    console.log("");
  });
}

// 导出供单元测试使用
export { computeStats, readCalls };
