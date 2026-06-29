/**
 * MetaGO MCP Server - Logger 模块
 *
 * 双轨日志：
 * 1. 人可读日志：~/.metago/logs/mcp-server.log（追加写入，带时间戳）
 * 2. 机器可读 JSONL：~/.metago/logs/calls.jsonl（为能力度量仪表盘预留）
 *
 * 数据结构（calls.jsonl 每行一个 JSON）：
 *   {
 *     "ts": "2026-06-30T12:34:56.789Z",
 *     "type": "call" | "error" | "lifecycle",
 *     "toolName"?: "metago_xxx",
 *     "args"?: {...},            // 调用参数（脱敏后）
 *     "result"?: "ok" | "error",
 *     "durationMs"?: 123,
 *     "error"?: "message",
 *     "version": "1.1.4"
 *   }
 *
 * 隐私合规：
 * - 调用参数默认不写入 calls.jsonl（仅记录 toolName + durationMs + result）
 * - 用户可通过环境变量 METAGO_LOG_ARGS=1 显式开启参数记录
 * - 完全禁用日志：METAGO_LOG_DISABLE=1
 */

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const LOG_DIR =
  process.env.METAGO_LOG_DIR || join(homedir(), ".metago", "logs");
const LOG_FILE = join(LOG_DIR, "mcp-server.log");
const CALLS_FILE = join(LOG_DIR, "calls.jsonl");

const LOG_DISABLED = process.env.METAGO_LOG_DISABLE === "1";
const LOG_ARGS_ENABLED = process.env.METAGO_LOG_ARGS === "1";

const VERSION = "1.1.4";

function ensureLogDir(): void {
  if (LOG_DISABLED) return;
  try {
    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch {
    // 静默失败，日志不应阻塞主流程
  }
}

function timestamp(): string {
  return new Date().toISOString();
}

/**
 * 写入人可读日志（带时间戳）
 */
export function log(level: "info" | "warn" | "error", message: string): void {
  if (LOG_DISABLED) return;
  const line = `[${timestamp()}] [${level.toUpperCase()}] ${message}\n`;

  // 同步输出到 stderr
  process.stderr.write(line);

  // 同步追加到文件
  try {
    ensureLogDir();
    appendFileSync(LOG_FILE, line);
  } catch {
    // 静默失败
  }
}

/**
 * 写入机器可读 JSONL 调用记录（为仪表盘预留）
 */
interface CallRecord {
  ts: string;
  type: "call" | "error" | "lifecycle";
  toolName?: string;
  args?: unknown;
  result?: "ok" | "error";
  durationMs?: number;
  error?: string;
  version: string;
}

function writeCallRecord(record: Omit<CallRecord, "ts" | "version">): void {
  if (LOG_DISABLED) return;
  try {
    ensureLogDir();
    const fullRecord: CallRecord = {
      ...record,
      ts: timestamp(),
      version: VERSION,
    };
    appendFileSync(CALLS_FILE, JSON.stringify(fullRecord) + "\n");
  } catch {
    // 静默失败
  }
}

/**
 * 记录工具调用（用于能力度量仪表盘）
 */
export function logCall(
  toolName: string,
  args: Record<string, unknown>,
  result: "ok" | "error",
  durationMs: number,
  error?: string,
): void {
  const record: Omit<CallRecord, "ts" | "version"> = {
    type: "call",
    toolName,
    result,
    durationMs,
  };

  // 仅在用户显式开启时记录参数（隐私保护）
  if (LOG_ARGS_ENABLED) {
    record.args = sanitizeArgs(args);
  }

  if (error) {
    record.error = error;
  }

  writeCallRecord(record);

  // 同时输出到人可读日志
  if (result === "error") {
    log("error", `Tool ${toolName} failed (${durationMs}ms): ${error || "unknown"}`);
  } else {
    log("info", `Tool ${toolName} called (${durationMs}ms)`);
  }
}

/**
 * 脱敏参数（移除可能的敏感数据）
 */
function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined) continue;
    // 对疑似敏感字段做掩码
    if (/password|secret|token|key|credential/i.test(key)) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof value === "string" && value.length > 500) {
      // 长字符串只保留前 500 字符
      sanitized[key] = value.slice(0, 500) + "...[truncated]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * 记录生命周期事件（启动/退出/崩溃）
 */
export function logLifecycle(
  event: "startup" | "shutdown" | "crash",
  meta?: { error?: string },
): void {
  writeCallRecord({
    type: "lifecycle",
    result: event === "crash" ? "error" : "ok",
    error: meta?.error,
  });

  if (event === "startup") {
    log("info", `MetaGO MCP Server v${VERSION} started`);
    log("info", `Log dir: ${LOG_DIR}`);
  } else if (event === "shutdown") {
    log("info", `MetaGO MCP Server v${VERSION} shutdown`);
  } else if (event === "crash") {
    log("error", `MetaGO MCP Server v${VERSION} crashed: ${meta?.error || "unknown"}`);
  }
}

/**
 * 包装工具处理函数：自动记录调用日志
 */
export function wrapToolHandler<TArgs extends Record<string, unknown>>(
  toolName: string,
  handler: (args: TArgs) => Promise<{ content: Array<{ type: "text"; text: string }> }>,
): (args: TArgs) => Promise<{ content: Array<{ type: "text"; text: string }> }> {
  return async (args: TArgs) => {
    const startTime = Date.now();
    try {
      const result = await handler(args);
      const durationMs = Date.now() - startTime;
      logCall(toolName, args, "ok", durationMs);
      return result;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      logCall(toolName, args, "error", durationMs, errorMsg);
      throw err;
    }
  };
}
