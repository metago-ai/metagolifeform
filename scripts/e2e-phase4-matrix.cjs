// e2e-phase4-matrix.cjs — 11 平台 × 5 命令矩阵 E2E（沙盒 HOME/APPDATA 重定向）
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ROOT = 'D:/DH工作区/metagolifeform';
const CLI = path.join(ROOT, 'scripts', 'cli.js');
const SANDBOX = path.join(os.tmpdir(), 'metago-e2e-quest-3694');
const PLATFORMS = ['trae', 'claude-code', 'codex', 'cursor', 'codebuddy', 'qoder', 'zcode', 'chatgpt-work', 'workbuddy', 'kimi-code', 'kimi-work'];
const BASE = {
  'trae': '.trae-cn', 'claude-code': '.claude', 'codex': '.codex', 'cursor': '.cursor',
  'codebuddy': '.codebuddy', 'qoder': '.qoder', 'zcode': '.zcode', 'chatgpt-work': '.chatgpt',
  'workbuddy': '.workbuddy', 'kimi-code': '.kimi-code', 'kimi-work': '.kimi-work'
};
const RULES = {
  'trae': 'rules.md', 'claude-code': 'CLAUDE.md', 'codex': 'AGENTS.md', 'cursor': path.join('rules', 'metago.mdc'),
  'codebuddy': 'CODEBUDDY.md', 'qoder': path.join('rules', 'metago.md'), 'zcode': 'CLAUDE.md',
  'chatgpt-work': 'AGENTS.md', 'workbuddy': 'AGENTS.md', 'kimi-code': 'AGENTS.md', 'kimi-work': 'AGENTS.md'
};
fs.rmSync(SANDBOX, { recursive: true, force: true });
fs.mkdirSync(SANDBOX, { recursive: true });
const rows = [];
function runCli(args) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    env: Object.assign({}, process.env, {
      USERPROFILE: SANDBOX, HOME: SANDBOX,
      APPDATA: path.join(SANDBOX, 'AppData', 'Roaming'),
      LOCALAPPDATA: path.join(SANDBOX, 'AppData', 'Local'),
    }),
    encoding: 'utf8', timeout: 300000,
  });
}
for (const p of PLATFORMS) {
  const row = { platform: p };
  try {
    // ① install
    let r = runCli(['install', '--platform', p, '--skip-backup', '--skip-build']);
    const rulesPath = path.join(SANDBOX, BASE[p], RULES[p]);
    const lawOk = fs.existsSync(rulesPath);
    const law = lawOk ? fs.readFileSync(rulesPath, 'utf8') : '';
    const noPlaceholder = !/\{\{[A-Z_]+}}/.test(law);
    const verOk = law.includes('V36.9.4');
    const skillsPath = path.join(SANDBOX, BASE[p], 'skills');
    const skillCount = fs.existsSync(skillsPath) ? fs.readdirSync(skillsPath).filter(d => d.startsWith('metago-')).length : -1;
    row.install = r.status === 0 && lawOk && noPlaceholder && verOk;
    row.installDetail = `law=${lawOk} 占位=${!noPlaceholder} 版本=${verOk} 技能=${skillCount}`;
    // ② verify
    r = runCli(['verify', '--platform', p]);
    const vout = r.stdout + r.stderr;
    row.verify = r.status === 0 && !/\[FAIL\]/.test(vout);
    row.verifyDetail = (vout.match(/\[FAIL\]/g) || []).length + ' FAIL';
    // ③ setup-mcp
    r = runCli(['setup-mcp', '--platform', p, '--skip-build']);
    const sout = r.stdout + r.stderr;
    if (p === 'kimi-work') {
      row.setup = r.status === 0 && /不注入自定义 MCP/.test(sout);
      row.setupDetail = '跳过（官方限制）';
    } else if (p === 'codex') {
      const tf = fs.readFileSync(path.join(SANDBOX, '.codex', 'config.toml'), 'utf8');
      row.setup = r.status === 0 && /\[mcp_servers\.metago\]/.test(tf) && /\[mcp_servers\.metago-algorithms\]/.test(tf) && !/\[mcp_servers\.metago\]/.test(tf.split('\n').filter((l, i, a) => a.indexOf(l) !== i).join('') || '\u0000');
      row.setupDetail = 'TOML 含两段';
    } else {
      const mcpFiles = { 'trae': path.join(SANDBOX, 'AppData', 'Roaming', 'Trae CN', 'User', 'mcp.json'), 'claude-code': path.join(SANDBOX, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'), 'cursor': path.join(SANDBOX, 'AppData', 'Roaming', 'Cursor', 'User', 'mcp.json'), 'codebuddy': path.join(SANDBOX, '.codebuddy', 'mcp.json'), 'qoder': path.join(SANDBOX, '.qoder', 'mcp.json'), 'zcode': path.join(SANDBOX, '.zcode', 'config', 'mcp.json'), 'chatgpt-work': path.join(SANDBOX, '.chatgpt', 'mcp.json'), 'workbuddy': path.join(SANDBOX, '.workbuddy', 'mcp.json'), 'kimi-code': path.join(SANDBOX, '.kimi-code', 'mcp.json') };
      const mp = mcpFiles[p];
      let ok = false; let detail = 'NOFILE';
      if (mp && fs.existsSync(mp)) {
        try {
          const j = JSON.parse(fs.readFileSync(mp, 'utf8'));
          ok = !!(j.mcpServers && j.mcpServers.metago && j.mcpServers['metago-algorithms']);
          detail = ok ? 'JSON 含两服务器' : 'JSON 缺服务器';
        } catch (e) { detail = 'JSON 解析失败'; }
      }
      row.setup = ok; row.setupDetail = detail;
    }
    // ④ uninstall
    r = runCli(['uninstall', '--platform', p, '--skip-backup']);
    row.uninstall = r.status === 0 && !fs.existsSync(rulesPath);
    row.uninstallDetail = r.status === 0 ? (fs.existsSync(rulesPath) ? '法则未删' : '法则已删') : 'exit≠0';
    // ⑤ 幂等重装
    r = runCli(['install', '--platform', p, '--skip-backup', '--skip-build']);
    row.idempotent = r.status === 0;
    row.idempotentDetail = r.status === 0 ? 'exit=0' : 'exit≠0';
  } catch (e) {
    row.install = row.verify = row.setup = row.uninstall = row.idempotent = false;
    row.installDetail = 'EX: ' + e.message.slice(0, 60);
  }
  rows.push(row);
  console.log(`[${row.platform}] ①${row.install ? 'P' : 'F'} ②${row.verify ? 'P' : 'F'} ③${row.setup ? 'P' : 'F'} ④${row.uninstall ? 'P' : 'F'} ⑤${row.idempotent ? 'P' : 'F'} ${row.installDetail || ''} ${row.setupDetail || ''}`);
}
const pass = rows.filter(r => r.install && r.verify && r.setup && r.uninstall && r.idempotent).length;
console.log(`\n=== 结算：${pass}/11 平台全绿 ===`);
for (const r of rows) {
  if (!(r.install && r.verify && r.setup && r.uninstall && r.idempotent)) {
    console.log('FAIL-DETAIL', JSON.stringify(r));
  }
}
process.exit(pass === PLATFORMS.length ? 0 : 1);
