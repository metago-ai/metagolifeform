// e2e-phase1-codex.cjs — 阶段1 Codex TOML 沙盒 E2E（T3/T4/T5 相关断言）
// 用法: node e2e-phase1-codex.cjs  （工作目录=metagolifeform）
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = 'D:/DH工作区/metagolifeform';
const SANDBOX = path.join(os.tmpdir(), 'metago-e2e-3694', 'codex');
const CLI = path.join(ROOT, 'scripts', 'cli.js');
const results = [];
function log(ok, name, detail) {
  results.push({ ok, name, detail });
  console.log((ok ? '  [PASS] ' : '  [FAIL] ') + name + (detail ? ' :: ' + detail : ''));
}
function runCli(args, env) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    env: Object.assign({}, process.env, { USERPROFILE: SANDBOX, HOME: SANDBOX }, env || {}),
    encoding: 'utf8', timeout: 60000
  });
}
function sections(text) {
  return [...text.matchAll(/^\[([^\]]+)\]\s*$/gm)].map(m => m[1]);
}
// 极简 TOML 健全性：段名唯一；段内 key=value 形如 <key> = <string|array|number>，引号成对
function tomlWellFormed(text) {
  const names = sections(text);
  if (new Set(names).size !== names.length) return { ok: false, why: '重复段名: ' + names.filter((n, i) => names.indexOf(n) !== i) };
  const segs = text.split(/\r?\n/);
  for (let i = 0; i < segs.length; i++) {
    const l = segs[i].trim();
    if (l === '' || l.startsWith('#') || /^\[[^\]]+\]$/.test(l)) continue;
    const m = /^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/.exec(l);
    if (!m) return { ok: false, why: '第' + (i + 1) + '行非法: ' + l };
    const val = m[2].trim();
    if (val.startsWith('"')) { if ((val.match(/"/g) || []).length % 2 !== 0) return { ok: false, why: '引号未闭合: ' + l }; }
    else if (val.startsWith('[')) { if (!val.endsWith(']')) return { ok: false, why: '数组未闭合: ' + l }; }
  }
  return { ok: true };
}

// ---------- 0. 清场 ----------
fs.rmSync(SANDBOX, { recursive: true, force: true });
fs.mkdirSync(path.join(SANDBOX, '.codex'), { recursive: true });
const seed = [
  '# 36.9.6 沙盒预置：既有用户配置（必须保留）',
  '',
  '[model_providers.anthropic]',
  'name = "Anthropic"',
  'base_url = "https://api.anthropic.com"',
  '',
  '[features]',
  'skills = true',
  'tokens = "1 万亿"',
  '',
].join('\n');
fs.writeFileSync(path.join(SANDBOX, '.codex', 'config.toml'), seed, 'utf8');

// ---------- 1. setup-mcp（TOML 合并） ----------
console.log('=== 1-3 setup-mcp --platform codex（TOML 合并） ===');
let r = runCli(['setup-mcp', '--platform', 'codex', '--skip-build']);
log(r.status === 0, 'setup-mcp 退出码 0', 'status=' + r.status);
const out = r.stdout + r.stderr;
log(/MCP 配置已写入（TOML）/.test(out), '输出含 TOML 写入提示');
const tomlPath = path.join(SANDBOX, '.codex', 'config.toml');
const tomlText = fs.readFileSync(tomlPath, 'utf8');
log(/\[mcp_servers\.metago\]/.test(tomlText), '含 [mcp_servers.metago] 段');
log(/\[mcp_servers\.metago-algorithms\]/.test(tomlText), '含 [mcp_servers.metago-algorithms] 段');
log((tomlText.match(/\[mcp_servers\.metago\]/g) || []).length === 1, 'metago 段唯一（无重复）');
log(/^command = "metago-mcp-server"$/m.test(tomlText), 'metago command 正确');
log(/^command = "metago-algorithms"$/m.test(tomlText), 'algorithms command 正确');
log(/\[model_providers\.anthropic\]/.test(tomlText), '既有 model_providers 段保留');
log(/\[features\]/.test(tomlText) && /skills = true/.test(tomlText), '既有 features 段保留');
log(/36\.9\.4 沙盒预置/.test(tomlText), '既有注释保留');
const wf = tomlWellFormed(tomlText);
log(wf.ok, 'TOML 健全性（段唯一/键值合法）', wf.ok ? '' : wf.why);

// ---------- 2. 幂等重跑 ----------
r = runCli(['setup-mcp', '--platform', 'codex', '--skip-build']);
const tomlText2 = fs.readFileSync(tomlPath, 'utf8');
log((tomlText2.match(/\[mcp_servers\.metago\]/g) || []).length === 1, '幂等：重跑无重复段');
log(/skills = true/.test(tomlText2), '幂等：内容仍保留');

// ---------- 3. verify 动态版本 + TOML MCP 校验 ----------
console.log('=== 1-4/1-5 verify --platform codex ===');
fs.writeFileSync(path.join(SANDBOX, '.codex', 'AGENTS.md'),
  '# 元构超级智能生命体运行法则\n*由 MetaGO Agent Harness V36.9.6 安装*\n第十八章已正确注入\n{{PLACEHOLDER_KEEP}}\n'.replace('\n{{PLACEHOLDER_KEEP}}\n', '\n'), 'utf8');
// 构造可过 verify 的最小法则：含 V36.9.6 + 第十八章注入 + 无 Trae 措辞 + 技能目录
const law = [
  '> 基于《元构全息智能引擎》V36.9.6。',
  '',
  '## 第十八章 MCP工具与技能智慧触发协议',
  '',
  '| Server ID | 工具数 | 说明 |',
  '| metago | 55 | 55 工具 |',
  '',
  '## 第十章 元构技能系统（1个metago-*技能）',
  '',
  'metago-critique',
  '',
  '*由 MetaGO Agent Harness V36.9.6 安装*',
].join('\n');
fs.writeFileSync(path.join(SANDBOX, '.codex', 'AGENTS.md'), law, 'utf8');
fs.mkdirSync(path.join(SANDBOX, '.codex', 'skills', 'metago-critique'), { recursive: true });
fs.writeFileSync(path.join(SANDBOX, '.codex', 'skills', 'metago-critique', 'SKILL.md'), '# metago-critique\n', 'utf8');
r = runCli(['verify', '--platform', 'codex']);
const vout = r.stdout + r.stderr;
log(/\[PASS\] 法则版本: V36\.9\.4/.test(vout), 'verify 版本 PASS（动态 V36.9.6）', '');
log(/\[PASS\] MCP 配置（TOML）含 metago 服务器段/.test(vout), 'verify MCP TOML 分支 PASS');
log(/\[PASS\] 第三十八章被替换/.test(vout) || /\[PASS\] 第十八章已正确注入/.test(vout), 'verify 第十八章注入 PASS');

// T4: 旧版本法则 → FAIL
fs.writeFileSync(path.join(SANDBOX, '.codex', 'AGENTS.md'), law.split('V36.9.6').join('V36.9.6'), 'utf8');
r = runCli(['verify', '--platform', 'codex']);
const vout4 = r.stdout + r.stderr;
const t4ok = /\[FAIL\] 法则版本错误/.test(vout4);
if (!t4ok) console.log('--- T4 OUTPUT ---\n' + vout4 + '\n--- END ---');
log(t4ok, 'T4：V36.9.6 法则被正确判 FAIL');
fs.writeFileSync(path.join(SANDBOX, '.codex', 'AGENTS.md'), law, 'utf8');

// ---------- 4. uninstall（TOML 段删除） ----------
console.log('=== 1-6 uninstall --platform codex ===');
r = runCli(['uninstall', '--platform', 'codex', '--skip-backup']);
const xout = r.stdout + r.stderr;
log(r.status === 0, 'uninstall 退出码 0', 'status=' + r.status);
log(/已从 MCP 配置（TOML）移除服务器/.test(xout), 'uninstall 走 TOML 删除分支');
const tomlText3 = fs.readFileSync(tomlPath, 'utf8');
log(!/\[mcp_servers\.metago\]/.test(tomlText3) && !/\[mcp_servers\.metago-algorithms\]/.test(tomlText3), '两个段均已删除');
log(/\[model_providers\.anthropic\]/.test(tomlText3) && /\[features\]/.test(tomlText3), '删除后其余内容保留');
const wf3 = tomlWellFormed(tomlText3);
log(wf3.ok, '删除后 TOML 仍健全', wf3.ok ? '' : wf3.why);

// ---------- 5. trae 回归（JSON 分支未受影响） ----------
console.log('=== 1-3 回归：trae JSON 分支 ===');
const tb = path.join(os.tmpdir(), 'metago-e2e-3694', 'trae');
fs.rmSync(tb, { recursive: true, force: true });
fs.mkdirSync(path.join(tb, 'AppData', 'Roaming', 'Trae CN', 'User'), { recursive: true });
// cli 的 appSupport 用 APPDATA —— 覆盖
r = spawnSync(process.execPath, [CLI, 'setup-mcp', '--platform', 'trae', '--skip-build'], {
  cwd: ROOT,
  env: Object.assign({}, process.env, { USERPROFILE: tb, HOME: tb, APPDATA: path.join(tb, 'AppData', 'Roaming') }),
  encoding: 'utf8', timeout: 60000
});
const tj = path.join(tb, 'AppData', 'Roaming', 'Trae CN', 'User', 'mcp.json');
log(fs.existsSync(tj), 'trae mcp.json 已写入', tj);
if (fs.existsSync(tj)) {
  try {
    const j = JSON.parse(fs.readFileSync(tj, 'utf8'));
    log(!!(j.mcpServers && j.mcpServers.metago && j.mcpServers['metago-algorithms']), 'trae mcp.json 合法 JSON 且含两服务器');
  } catch (e) { log(false, 'trae mcp.json 解析失败', e.message); }
}

// ---------- 汇总 ----------
const pass = results.filter(x => x.ok).length;
const fail = results.filter(x => !x.ok).length;
console.log(`\n=== 汇总: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
