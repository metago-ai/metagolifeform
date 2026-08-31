#!/usr/bin/env node
/**
 * 元构·会话结束钩子（Stop）
 * 会话结束时记录摘要。快速退出，绝不阻塞主流程。
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
      let evt = {};
      try { evt = JSON.parse(input || '{}'); } catch {}
      fs.appendFileSync(path.join(logDir, 'session.log'),
        JSON.stringify({ ts: new Date().toISOString(), stop_hook_fired: true, session: evt.session_id || '' }) + '\n');
    } catch (e) { /* 审计失败不影响主流程 */ }
    process.exit(0);
  });
}

main();
