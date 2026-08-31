#!/usr/bin/env node
/**
 * 元构·工具调用审计钩子（PreToolUse）
 * 将写操作（Edit/Write/Bash）审计日志追加到插件审计目录。
 * 快速退出，绝不阻塞主流程；环境变量缺失时静默跳过。
 */
const fs = require('fs');
const path = require('path');

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => { input += d; });
  process.stdin.on('end', () => {
    try {
      const root = process.env.CLAUDE_PLUGIN_ROOT || process.env.PLUGIN_ROOT;
      if (!root) process.exit(0);
      const logDir = path.join(root, 'audit-logs');
      fs.mkdirSync(logDir, { recursive: true });
      const evt = JSON.parse(input || '{}');
      const line = JSON.stringify({
        ts: new Date().toISOString(),
        tool: evt.tool_name || 'unknown',
        session: evt.session_id || '',
        input: (evt.tool_input || {}).command || (evt.tool_input || {}).file_path || ''
      });
      fs.appendFileSync(path.join(logDir, 'tool-use.log'), line + '\n');
    } catch (e) { /* 审计失败不影响主流程 */ }
    process.exit(0);
  });
}

main();
