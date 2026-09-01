// e2e-phase5-paths.cjs — 路径 A（便携离线）/ B（tgz 安装）实测（沙盒 prefix 重定向）
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ROOT = 'D:/DH工作区/metagolifeform';
const LE = path.join(ROOT, 'local-edition');
const SAND = path.join(os.tmpdir(), 'metago-e2e-p5-3694');
const PREFIX = path.join(SAND, 'npmprefix');
fs.rmSync(SAND, { recursive: true, force: true });
fs.mkdirSync(PREFIX, { recursive: true });
const env = Object.assign({}, process.env, {
  USERPROFILE: SAND, HOME: SAND,
  APPDATA: path.join(SAND, 'AppData', 'Roaming'),
  NPM_CONFIG_PREFIX: PREFIX,
  PATH: PREFIX + path.delimiter + path.join(PREFIX, 'node_modules', '.bin') + path.delimiter + process.env.PATH,
});
function runPs1(args) {
  return spawnSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', path.join(LE, 'install-local.ps1'), ...args], {
    cwd: LE, env, encoding: 'utf8', timeout: 600000,
  });
}
const results = [];
function log(ok, name, detail) { results.push({ ok, name, detail }); console.log((ok ? '[PASS] ' : '[FAIL] ') + name + (detail ? ' :: ' + detail : '')); }

// ---- 路径 A：便携快照离线 ----
console.log('=== 路径 A：install-local -Offline（便携快照） ===');
let r = runPs1(['-Offline', '-Platform', 'trae']);
const aout = (r.stdout || '') + (r.stderr || '');
log(r.status === 0, 'A 退出码 0', 'status=' + r.status);
log(fs.existsSync(path.join(SAND, '.trae-cn', 'rules.md')), 'A 法则落点', path.join(SAND, '.trae-cn', 'rules.md'));
log(fs.existsSync(path.join(SAND, '.trae-cn', 'skills')), 'A 技能目录');
log(fs.existsSync(path.join(PREFIX, 'node_modules', 'metago-lifeform', 'package.json')), 'A 全局树含 metago-lifeform');
const gv = spawnSync('node', [path.join(PREFIX, 'node_modules', 'metago-lifeform', 'scripts', 'cli.js'), 'version'], { env, encoding: 'utf8' });
log(gv.stdout.includes('36.9.4'), 'A CLI 版本 36.9.4', (gv.stdout || '').trim().split('\n').pop());
const mcpA = path.join(SAND, 'AppData', 'Roaming', 'Trae CN', 'User', 'mcp.json');
let mcpOk = false;
if (fs.existsSync(mcpA)) { try { const j = JSON.parse(fs.readFileSync(mcpA, 'utf8')); mcpOk = !!(j.mcpServers && j.mcpServers.metago); } catch {} }
log(mcpOk, 'A MCP 已注册', mcpOk ? 'metago 在 mcp.json' : '缺失');

// ---- 路径 B：tgz 安装（临时移走 portable 触发） ----
console.log('=== 路径 B：install-local（tgz 路径） ===');
const portableNm = path.join(LE, 'portable', 'node_modules');
const moved = 'D:/DH工作区/_portable-nm-moved-b';
fs.rmSync(moved, { recursive: true, force: true });
fs.renameSync(portableNm, moved);
try {
  r = runPs1(['-Platform', 'codex']);
  const bout = (r.stdout || '') + (r.stderr || '');
  log(r.status === 0, 'B 退出码 0（tgz 路径）', 'status=' + r.status);
  log(fs.existsSync(path.join(SAND, '.codex', 'AGENTS.md')), 'B 法则落点', path.join(SAND, '.codex', 'AGENTS.md'));
  const bt = path.join(SAND, '.codex', 'config.toml');
  const bOk = fs.existsSync(bt) && /\[mcp_servers\.metago\]/.test(fs.readFileSync(bt, 'utf8'));
  log(bOk, 'B codex config.toml 已注册');
  log(fs.existsSync(path.join(PREFIX, 'node_modules', 'metago-lifeform', 'package.json')), 'B 全局树 metago-lifeform');
} catch (e) { log(false, 'B 异常', e.message.slice(0, 80)); }
finally { fs.renameSync(moved, portableNm); }

// ---- 路径 C：源码目录安装（= 直接 CLI，阶段 4 已覆盖，此处复验一次 trae） ----
console.log('=== 路径 C：源码 CLI（trae） ===');
const rc = spawnSync('node', [path.join(ROOT, 'scripts', 'cli.js'), 'install', '--platform', 'trae', '--skip-backup', '--skip-build'], {
  cwd: ROOT, env, encoding: 'utf8', timeout: 300000,
});
log(rc.status === 0, 'C 退出码 0', 'status=' + rc.status);
log(fs.existsSync(path.join(SAND, '.trae-cn', 'rules.md')) && fs.readFileSync(path.join(SAND, '.trae-cn', 'rules.md'), 'utf8').includes('V36.9.4'), 'C 法则 V36.9.4');

const pass = results.filter(x => x.ok).length;
console.log(`\n=== 汇总：${pass}/${results.length} ===`);
process.exit(pass === results.length ? 0 : 1);
