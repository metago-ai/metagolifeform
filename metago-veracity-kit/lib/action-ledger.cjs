#!/usr/bin/env node
/**
 * lib/action-ledger.cjs — 行为日志引擎（客观事实层）
 * 记录每次工具调用/文件操作/命令执行（由 hooks 自动写入，或 Agent 显式记录）
 * 日志与 LLM 记忆分离：我的记忆会说谎，日志不会。
 * 格式：JSONL 追加，防篡改建议：日志文件只读权限（install.js 设置）。
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function ledgerFile(custom) {
  return custom || process.env.VERACITY_LEDGER || path.join(os.homedir(), '.metago', 'veracity', 'action-ledger.jsonl');
}

function record(entry, custom) {
  const file = ledgerFile(custom);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const line = {
    ts: new Date().toISOString(),
    tool: entry.tool || 'unknown',
    input: (entry.input || '').slice(0, 500),
    output: (entry.output || '').slice(0, 500),
    exitCode: entry.exitCode !== undefined ? entry.exitCode : null,
    files: Array.isArray(entry.files) ? entry.files.slice(0, 20) : [],
    session: entry.session || '',
    ok: entry.ok !== undefined ? entry.ok : null
  };
  fs.appendFileSync(file, JSON.stringify(line) + '\n', 'utf8');
  return line;
}

function query(filter, custom) {
  const file = ledgerFile(custom);
  if (!fs.existsSync(file)) return [];
  const entries = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => {
    try { return JSON.parse(l) } catch { return null }
  }).filter(Boolean);
  if (!filter) return entries;
  return entries.filter((e) => {
    if (filter.tool && e.tool !== filter.tool) return false;
    if (filter.file && !(e.files || []).some((f) => f.includes(filter.file))) return false;
    if (filter.since && new Date(e.ts) < new Date(filter.since)) return false;
    if (filter.ok !== undefined && e.ok !== filter.ok) return false;
    return true;
  });
}

function stats(custom) {
  const entries = query(null, custom);
  const byTool = {};
  for (const e of entries) byTool[e.tool] = (byTool[e.tool] || 0) + 1;
  return { total: entries.length, byTool, firstTs: entries[0]?.ts, lastTs: entries[entries.length - 1]?.ts };
}

module.exports = { record, query, stats, ledgerFile };
