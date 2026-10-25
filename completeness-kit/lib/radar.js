/**
 * lib/radar.js — 完整性雷达
 * 应对"我们都发现不了"的场景：持续扫描行业新标准/竞品新功能/元构升级。
 * 维护 radar.json（上次扫描时间 + 观察清单），提供 check（该扫描什么）与 mark（登记新发现）。
 */
const fs = require('fs');
const path = require('path');

// 内置观察清单（雷达基线——随行业演进需人工/Agent 更新）
const DEFAULT_WATCH = {
  standards: [
    'Agent Plugins 规范版本更新（agent-plugins.org）',
    'AG-UI 规范版本更新（docs.ag-ui.com）',
    'A2UI 规范版本更新（a2ui.org）',
    'Agent Skills 规范更新（agentskills.io）',
    'MCP 规范版本更新（modelcontextprotocol.io）',
    'A2A 协议进展（Google）'
  ],
  competitors: [
    'ZCode 新版本功能（zcode.z.ai）',
    'Codex 新功能（OpenAI）',
    'Trae Work 新功能（字节）',
    'Kimi Work 新功能（月之暗面）',
    'Cursor 新功能（Anysphere）',
    'ChatGPT Work 新功能'
  ],
  ecosystem: [
    '元构发行版升级（metago-lifeform 新版本）',
    '元构 112 个技能/927 算法更新',
    '新开源 Agent UI/编排框架'
  ]
};

function loadRadar(file) {
  if (fs.existsSync(file)) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  }
  return { version: '1.0', lastScan: null, watch: DEFAULT_WATCH, findings: [] };
}

function saveRadar(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function check(file, opts = {}) {
  const radar = loadRadar(file);
  const now = new Date().toISOString();
  const overdue = !radar.lastScan || (Date.now() - new Date(radar.lastScan).getTime()) > (opts.intervalDays || 7) * 86400000;
  return {
    radar,
    overdue,
    nextScan: radar.lastScan ? new Date(new Date(radar.lastScan).getTime() + (opts.intervalDays || 7) * 86400000).toISOString() : '首次扫描',
    lastScan: radar.lastScan
  };
}

function markScanned(file) {
  const radar = loadRadar(file);
  radar.lastScan = new Date().toISOString();
  saveRadar(file, radar);
  return radar.lastScan;
}

function addFinding(file, desc, source) {
  const radar = loadRadar(file);
  const f = { id: `F${radar.findings.length + 1}`, desc, source, status: 'new', createdAt: new Date().toISOString() };
  radar.findings.push(f);
  saveRadar(file, f.id && radar);
  return f;
}

module.exports = { loadRadar, saveRadar, check, markScanned, addFinding, DEFAULT_WATCH };
