#!/usr/bin/env node
/**
 * MetaGO Agent Harness - CLI 入口 (V36.9.2)
 * 跨平台命令行工具，统一实现所有平台的安装/MCP配置/插件打包/备份/验证
 *
 * 用法:
 *   metago-lifeform install [--platform <平台>] [--project-local] [--force] [--skip-backup] [--with-plugin] [--with-completeness]
 *   metago-lifeform setup-mcp [--platform <平台>] [--skip-build]
 *   metago-lifeform plugin-pack [--format <agent-plugins-1.0.0|claude|zcode|codex>] [--out <目录>]
  metago-lifeform completeness <verify|init|gaps|radar|declaration|...>
  metago-lifeform veracity <log|claim|reconcile|verify|report|...>
                          行为诚实套件代理（宣称-事实对账，同 veracity-guard）
                          完整性治理套件代理（同 completeness-guard 命令）
 *   metago-lifeform uninstall [--platform <平台>]
 *   metago-lifeform verify [--platform <平台>]
 *   metago-lifeform list-backups
 *   metago-lifeform restore-backup <timestamp>
 *   metago-lifeform cleanup-backups [--keep N]
 *   metago-lifeform version
 *   metago-lifeform help
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PKG_ROOT = path.resolve(__dirname, '..');
const VERSION = require(path.join(PKG_ROOT, 'package.json')).version;
const PLATFORMS = ['trae', 'claude-code', 'codex', 'cursor', 'codebuddy', 'qoder', 'zcode', 'chatgpt-work', 'workbuddy', 'kimi-code', 'kimi-work'];
const PLUGIN_FORMATS = ['agent-plugins-1.0.0', 'claude', 'zcode', 'codex'];
// 36.9.3 修复：项目级安装目录按平台映射（旧版对所有平台硬编码 .trae）
const PROJECT_LOCAL_DIRS = {
  'trae': '.trae', 'claude-code': '.claude', 'codex': '.codex', 'cursor': '.cursor',
  'codebuddy': '.codebuddy', 'qoder': '.qoder', 'zcode': '.zcode', 'chatgpt-work': '.chatgpt',
  'workbuddy': '.workbuddy', 'kimi-code': '.kimi-code', 'kimi-work': '.kimi-work'
};
const PKG_META = (() => { try { return require(path.join(PKG_ROOT, 'package.json')).metago || {}; } catch { return {}; } })();
const MCP_SERVER_VER = (PKG_META.mcpServer && PKG_META.mcpServer.version) || '1.3.2';
const ALGORITHMS_VER = (PKG_META.algorithmsServer && PKG_META.algorithmsServer.version) || '1.0.1';
const HOME = os.homedir();
const IS_WIN = process.platform === 'win32';
const BACKUP_ROOT = path.join(HOME, '.metago-backups');
const MAX_BACKUPS = 10;

// ============================================================
// 平台配置
// ============================================================
function appSupport(...segments) {
  if (IS_WIN) return path.join(process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming'), ...segments);
  if (process.platform === 'darwin') return path.join(HOME, 'Library', 'Application Support', ...segments);
  return path.join(process.env.XDG_CONFIG_HOME || path.join(HOME, '.config'), ...segments);
}

const NODE_PLATFORM_CONFIGS = {
  'trae': {
    name: 'Trae',
    base: path.join(HOME, '.trae-cn'),
    rules: 'rules.md',
    skills: 'skills',
    supportsSkills: true,
    mcpConfig: appSupport('Trae CN', 'User', 'mcp.json'),
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 53 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 },
      { name: 'mcp_metago-skill-server', command: 'metago-skill-server', tools: 123 },
      { name: 'mcp_metago-skill-server-2', command: 'metago-skill-server-2', tools: 40 },
      { name: 'mcp_metago-skill-server-3', command: 'metago-skill-server-3', tools: 36 },
      { name: 'mcp_metago-toolkit', command: 'metago-toolkit', tools: 20 },
      { name: 'integrated_browser', command: 'npx', args: ['@playwright/mcp@latest'], tools: 15 }
    ]
  },
  'claude-code': {
    name: 'Claude Code',
    base: path.join(HOME, '.claude'),
    rules: 'CLAUDE.md',
    skills: 'skills',
    supportsSkills: true,
    mcpConfig: appSupport('Claude', 'claude_desktop_config.json'),
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 53 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'codex': {
    name: 'Codex',
    base: path.join(HOME, '.codex'),
    rules: 'AGENTS.md',
    skills: 'skills',
    supportsSkills: true,
    mcpConfig: path.join(HOME, '.codex', 'config.json'),
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 53 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'cursor': {
    name: 'Cursor',
    base: path.join(HOME, '.cursor'),
    rules: path.join('rules', 'metago.mdc'),
    skills: 'skills',
    supportsSkills: true,
    mcpConfig: appSupport('Cursor', 'User', 'mcp.json'),
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 53 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'codebuddy': {
    name: 'CodeBuddy',
    base: path.join(HOME, '.codebuddy'),
    rules: 'CODEBUDDY.md',
    skills: path.join('rules', 'skills'),
    supportsSkills: true,
    mcpConfig: path.join(HOME, '.codebuddy', 'mcp.json'),
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 53 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'qoder': {
    name: 'Qoder',
    base: path.join(HOME, '.qoder'),
    rules: path.join('rules', 'metago.md'),
    skills: '',
    supportsSkills: false,
    mcpConfig: path.join(HOME, '.qoder', 'mcp.json'),
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 53 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'chatgpt-work': {
    name: 'ChatGPT Work',
    base: path.join(HOME, '.chatgpt'),
    rules: 'AGENTS.md',
    skills: 'skills',
    supportsSkills: true,
    mcpConfig: path.join(HOME, '.chatgpt', 'mcp.json'),
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 53 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ],
    pluginFormat: 'agent-plugins-1.0.0'
  },
  'workbuddy': {
    name: 'WorkBuddy',
    base: path.join(HOME, '.workbuddy'),
    rules: 'AGENTS.md',
    skills: 'skills',
    supportsSkills: true,
    mcpConfig: path.join(HOME, '.workbuddy', 'mcp.json'),
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 53 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'kimi-code': {
    name: 'Kimi Code',
    base: path.join(HOME, '.kimi-code'),
    rules: 'AGENTS.md',
    skills: 'skills',
    supportsSkills: true,
    mcpConfig: path.join(HOME, '.kimi-code', 'mcp.json'),
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 53 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ],
    note: 'Kimi 桌面版（kimi-work）不注入自定义 MCP 工具；kimi-code CLI 为标准 MCP 客户端。daimon 技能目录请用 --install-path 指定'
  },
  'kimi-work': {
    name: 'Kimi Work',
    base: path.join(HOME, '.kimi-work'),
    rules: 'AGENTS.md',
    skills: 'skills',
    supportsSkills: true,
    mcpConfig: null,
    mcpServers: [],
    note: 'Kimi Work 桌面版当前构建不向会话注入自定义 MCP 工具（官方限制）；生效通道为法则 + 技能 + Bash 直调'
  },
  'zcode': {
    name: 'ZCode',
    base: path.join(HOME, '.zcode'),
    rules: 'CLAUDE.md',
    skills: 'skills',
    supportsSkills: true,
    mcpConfig: path.join(HOME, '.zcode', 'config', 'mcp.json'),
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 53 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  }
};

const PLATFORM_PHRASE_REPLACEMENTS = {
  'trae': {},
  'claude-code': {
    'Trae 系统中': 'Claude Code 系统中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'Claude Code 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'Claude Code 记忆体系',
    'Trae 的 skills/ 目录': 'Claude Code 的 skills/ 目录',
    'Trae 平台': 'Claude Code 平台',
    '.trae-cn/': '.claude/'
  },
  'codex': {
    'Trae 系统中': 'Codex 系统中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'Codex 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'Codex 记忆体系',
    'Trae 的 skills/ 目录': 'Codex 的配置目录',
    'Trae 平台': 'Codex 平台',
    '.trae-cn/': '.codex/',
    'Trae 的`skills/` 目录': 'Codex 的配置目录',
    'Trae 的 `skills/` 目录': 'Codex 的配置目录',
    'Trae 系统记忆': 'Codex 系统记忆',
    'Trae 自动摘要': 'Codex 自动摘要',
  },
  'cursor': {
    'Trae 系统中': 'Cursor 系统中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'Cursor 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'Cursor 记忆体系',
    'Trae 的 skills/ 目录': 'Cursor 的 skills/ 目录',
    'Trae 平台': 'Cursor 平台',
    '.trae-cn/': '.cursor/'
  },
  'codebuddy': {
    'Trae 系统中': 'CodeBuddy 系统中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'CodeBuddy 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'CodeBuddy 记忆体系',
    'Trae 的 skills/ 目录': 'CodeBuddy 的 skills/ 目录',
    'Trae 平台': 'CodeBuddy 平台',
    '.trae-cn/': '.codebuddy/'
  },
  'qoder': {
    'Trae 系统中': 'Qoder 系统中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'Qoder 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'Qoder 记忆体系',
    'Trae 的 skills/ 目录': 'Qoder 的配置目录',
    'Trae 平台': 'Qoder 平台',
    '.trae-cn/': '.qoder/'
  },
  'zcode': {
    'Trae 系统中': 'ZCode 系统中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'ZCode 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'ZCode 记忆体系',
    'Trae 的 skills/ 目录': 'ZCode 的 skills/ 目录',
    'Trae 平台': 'ZCode 平台',
    '.trae-cn/': '.zcode/'
  },
  'chatgpt-work': {
    'Trae 系统中': 'ChatGPT Work 系统中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'ChatGPT Work 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'ChatGPT Work 记忆体系',
    'Trae 的 skills/ 目录': 'ChatGPT Work 的 skills/ 目录',
    'Trae 平台': 'ChatGPT Work 平台',
    '.trae-cn/': '.chatgpt/'
  },
  'workbuddy': {
    'Trae 系统中': 'WorkBuddy 系统中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'WorkBuddy 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'WorkBuddy 记忆体系',
    'Trae 的 skills/ 目录': 'WorkBuddy 的 skills/ 目录',
    'Trae 平台': 'WorkBuddy 平台',
    '.trae-cn/': '.workbuddy/'
  },
  'kimi-code': {
    'Trae 系统中': 'Kimi Code 系统中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'Kimi Code 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'Kimi Code 记忆体系',
    'Trae 的 skills/ 目录': 'Kimi Code 的 skills/ 目录',
    'Trae 平台': 'Kimi Code 平台',
    '.trae-cn/': '.kimi-code/'
  },
  'kimi-work': {
    'Trae 系统中': 'Kimi Work 系统中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'Kimi Work 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'Kimi Work 记忆体系',
    'Trae 的 skills/ 目录': 'Kimi Work 的 skills/ 目录',
    'Trae 平台': 'Kimi Work 平台',
    '.trae-cn/': '.kimi-work/'
  }
};

// ============================================================
// 参数解析
// ============================================================
function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    command: args[0] || 'help',
    platform: 'trae',
    projectLocal: false,
    force: false,
    skipBackup: false,
    skipSkills: false,
    skipBuild: false,
    keepSkills: false,
    deleteSkills: false,
    installPath: null,
    keepBackups: 10,
    restoreTarget: null,
    archArgs: []
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--platform' || arg === '-p') {
      result.platform = args[++i] || 'trae';
    } else if (arg.startsWith('--platform=')) {
      result.platform = arg.split('=')[1];
    } else if (arg === '--project-local') {
      result.projectLocal = true;
    } else if (arg === '--force' || arg === '-f' || arg === '--upgrade') {
      result.force = true;
    } else if (arg === '--skip-backup') {
      result.skipBackup = true;
    } else if (arg === '--skip-skills') {
      result.skipSkills = true;
    } else if (arg === '--skip-build') {
      result.skipBuild = true;
    } else if (arg === '--keep-skills') {
      result.keepSkills = true;
    } else if (arg === '--delete-skills') {
      result.deleteSkills = true;
    } else if (arg === '--install-path' || arg === '--install-path=') {
      result.installPath = args[++i] || null;
    } else if (arg.startsWith('--install-path=')) {
      result.installPath = arg.split('=')[1];
    } else if (arg === '--with-plugin') {
      result.withPlugin = true;
    } else if (arg === '--with-completeness') {
      result.withCompleteness = true;
    } else if (arg === '--format') {
      result.format = args[++i] || 'all';
    } else if (arg.startsWith('--format=')) {
      result.format = arg.split('=')[1];
    } else if (arg === '--out') {
      result.out = args[++i] || null;
    } else if (arg.startsWith('--out=')) {
      result.out = arg.split('=')[1];
    } else if (arg === '--keep') {
      result.keepBackups = parseInt(args[++i]) || 10;
    } else if (result.command === 'arch') {
      result.archArgs.push(arg);
    } else if (!arg.startsWith('-') && result.command === 'restore-backup' && !result.restoreTarget) {
      result.restoreTarget = arg;
    }
  }

  return result;
}

// ============================================================
// 工具函数
// ============================================================
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) return content.slice(1);
  return content;
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getTimestamp() {
  const d = new Date();
  return d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') + '-' +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') +
    String(d.getSeconds()).padStart(2, '0');
}

// ============================================================
// 备份功能
// ============================================================
function backupNative(platform, installPath) {
  const cfg = NODE_PLATFORM_CONFIGS[platform];
  const base = installPath || cfg.base;
  const timestamp = getTimestamp();
  const backupDir = path.join(BACKUP_ROOT, `backup-${timestamp}-${platform}`);
  
  let needBackup = false;
  const filesToBackup = [];

  const rulesFile = path.join(base, cfg.rules);
  if (fs.existsSync(rulesFile)) {
    needBackup = true;
    filesToBackup.push({ src: rulesFile, dest: path.basename(rulesFile) });
  }

  if (fs.existsSync(cfg.mcpConfig)) {
    needBackup = true;
    filesToBackup.push({ src: cfg.mcpConfig, dest: path.basename(cfg.mcpConfig) });
  }

  if (cfg.supportsSkills) {
    const skillsDir = path.join(base, cfg.skills);
    if (fs.existsSync(skillsDir)) {
      needBackup = true;
      filesToBackup.push({ src: skillsDir, dest: 'skills', isDir: true });
    }
  }

  if (!needBackup) return null;

  console.log(`  [备份] 检测到旧版本配置，备份到: ${backupDir}`);
  ensureDir(backupDir);

  for (const f of filesToBackup) {
    const destPath = path.join(backupDir, f.dest);
    if (f.isDir) {
      copyDir(f.src, destPath);
    } else {
      ensureDir(path.dirname(destPath));
      fs.copyFileSync(f.src, destPath);
    }
  }

  const manifest = {
    timestamp,
    platform,
    backupDir,
    version: 'pre-36.9.2',
    files: filesToBackup.map(f => f.dest),
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  cleanupOldBackups();
  return backupDir;
}

function listBackups() {
  if (!fs.existsSync(BACKUP_ROOT)) {
    console.log('  没有找到备份');
    return [];
  }
  const backups = fs.readdirSync(BACKUP_ROOT)
    .filter(d => d.startsWith('backup-'))
    .map(d => {
      const manifestPath = path.join(BACKUP_ROOT, d, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try { return JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { return null; }
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (backups.length === 0) {
    console.log('  没有找到备份');
    return [];
  }

  console.log(`\n  找到 ${backups.length} 个备份:\n`);
  for (const b of backups) {
    console.log(`  - ${b.timestamp} (${b.platform}) → ${b.backupDir}`);
  }
  return backups;
}

function restoreBackup(timestamp) {
  const backups = listBackups();
  const backup = backups.find(b => b.timestamp === timestamp || b.timestamp.startsWith(timestamp));
  if (!backup) {
    console.error(`  [错误] 找不到备份: ${timestamp}`);
    process.exit(1);
  }

  const cfg = NODE_PLATFORM_CONFIGS[backup.platform];
  console.log(`\n  [恢复] 从备份恢复: ${backup.backupDir}`);

  for (const f of backup.files) {
    const srcPath = path.join(backup.backupDir, f);
    let destPath;
    if (f === 'skills') {
      destPath = path.join(cfg.base, cfg.skills);
    } else if (f === path.basename(cfg.mcpConfig)) {
      destPath = cfg.mcpConfig;
    } else {
      destPath = path.join(cfg.base, cfg.rules);
    }
    ensureDir(path.dirname(destPath));
    if (fs.existsSync(srcPath)) {
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      console.log(`    ✓ 已恢复: ${f}`);
    }
  }
  console.log('  [OK] 恢复完成');
}

function cleanupOldBackups(keep = MAX_BACKUPS) {
  if (!fs.existsSync(BACKUP_ROOT)) return;
  const backups = fs.readdirSync(BACKUP_ROOT)
    .filter(d => d.startsWith('backup-'))
    .sort()
    .reverse();
  if (backups.length <= keep) return;
  const toDelete = backups.slice(keep);
  for (const d of toDelete) {
    const fullPath = path.join(BACKUP_ROOT, d);
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`  [清理] 已删除旧备份: ${d}`);
  }
}

// ============================================================
// 平台法则生成（动态模板注入）
// ============================================================
function generateMcpServersTable(platform) {
  const cfg = NODE_PLATFORM_CONFIGS[platform];
  let totalTools = 0;
  let rows = '| Server ID | 工具数 | 说明 |\n|-----------|--------|------|\n';
  for (const srv of cfg.mcpServers) {
    totalTools += srv.tools;
    const desc = srv.algorithms ? `${srv.tools} 工具 · ${srv.algorithms} 算法` : `${srv.tools} 工具`;
    rows += `| ${srv.name} | ${srv.tools} | ${desc} |\n`;
  }
  rows += `| **总计** | **${totalTools}** | **${cfg.mcpServers.length} 个 MCP 服务器** |\n`;
  return rows;
}

function generateSkillsTable(platform, availableSkills) {
  const skillCategories = {
    '认知族': ['metago-critique', 'metago-whatif', 'metago-emotion', 'metago-objectivity'],
    '保障族': ['metago-decision-lock', 'metago-output-integrity', 'metago-self-check'],
    '治理族': ['metago-compliance', 'metago-value-align'],
    '进化族': ['metago-meta-evolve', 'metago-meta-create', 'metago-frequency-adapt'],
    '执行族': ['metago-action-plan', 'metago-decision-eval', 'metago-holistic-task', 'metago-developer-response'],
    '溯源族': ['metago-data-provenance', 'metago-problem-trace', 'metago-fact-check'],
    '价值族': ['metago-coupling-optimize', 'metago-negentropy-monitor', 'metago-scene-adapt'],
    '意识族': ['metago-activate'],
    '方法论族': ['metago-org-diagnosis', 'metago-momentum-weave', 'metago-minimal-intervention', 'metago-value-assess', 'metago-coupling-measure'],
    '架构族': ['metago-deep-reasoning', 'metago-first-principles', 'metago-arch', 'metago-paradigm-analysis', 'metago-balance-optimize', 'metago-memory-manage', 'metago-consensus-prototype'],
    'Dev Kit': ['metago-code-review-deep', 'metago-architecture-design', 'metago-refactor-suggest', 'metago-security-audit'],
    '工程质量族': ['metago-delivery-gate', 'metago-discipline', 'metago-adversarial-review', 'metago-completeness-guard', 'metago-veracity-guard'],
    '专家团': availableSkills.filter(s => s.startsWith('metago-') && 
      !['metago-critique','metago-whatif','metago-emotion','metago-objectivity','metago-decision-lock','metago-output-integrity','metago-self-check','metago-compliance','metago-value-align','metago-meta-evolve','metago-meta-create','metago-frequency-adapt','metago-action-plan','metago-decision-eval','metago-holistic-task','metago-developer-response','metago-data-provenance','metago-problem-trace','metago-fact-check','metago-coupling-optimize','metago-negentropy-monitor','metago-scene-adapt','metago-activate','metago-org-diagnosis','metago-momentum-weave','metago-minimal-intervention','metago-value-assess','metago-coupling-measure','metago-deep-reasoning','metago-paradigm-analysis','metago-balance-optimize','metago-memory-manage','metago-consensus-prototype','metago-code-review-deep','metago-architecture-design','metago-refactor-suggest','metago-security-audit','metago-delivery-gate','metago-discipline','metago-first-principles','metago-arch','metago-adversarial-review','metago-completeness-guard','metago-veracity-guard'].includes(s))
  };

  let table = '| 能力族 | 技能 |\n|--------|------|\n';
  for (const [category, skills] of Object.entries(skillCategories)) {
    const existing = skills.filter(s => availableSkills.includes(s));
    if (existing.length > 0) {
      table += `| ${category} | ${existing.join(', ')} |\n`;
    }
  }
  table += `| **总计** | **${availableSkills.length} 个技能** |\n`;
  return table;
}

function generatePlatformLaw(platform, availableSkills, projectLocal = false) {
  const cfg = NODE_PLATFORM_CONFIGS[platform];
  const motherPath = path.join(PKG_ROOT, 'AGENTS.md');
  let content = fs.readFileSync(motherPath, 'utf8');
  content = removeBOM(content);

  const replacements = PLATFORM_PHRASE_REPLACEMENTS[platform] || {};
  for (const [from, to] of Object.entries(replacements)) {
    content = content.split(from).join(to);
  }

  // 36.9.3 修复：头部/变体替换统一——与 build-adapters.cjs 同逻辑，消除"CLI 安装版"与"模板生成版"双源分叉
  content = content.split('Trae 第一人称视角撰写').join(cfg.name + ' 第一人称视角撰写');
  content = content.split('本母本以 Trae 为运行时撰写').join('本母本以 ' + cfg.name + ' 为运行时撰写');
  content = content.split('把"Trae"读作').join('把"' + cfg.name + '"读作');
  content = content.split('Trae 的 `skills/` 目录').join(cfg.name + ' 的 `skills/` 目录');
  content = content.split('Trae 系统记忆体系').join(cfg.name + ' 记忆体系');
  content = content.split('Trae 系统记忆').join(cfg.name + ' 记忆体系');
  content = content.split('Trae 自动摘要').join(cfg.name + ' 自动摘要');
  content = content.split('非 Trae 用户').join('非 ' + cfg.name + ' 用户');
  if (platform !== 'trae') {
    content = content.split('.trae-cn\\').join('.' + platform + '\\');
  }

  content = content.replace(/\{\{PLATFORM_NAME\}\}/g, cfg.name);
  content = content.replace(/\{\{SKILLS_COUNT\}\}/g, String(availableSkills.length));
  content = content.replace(/\{\{PLATFORM_MEMORY_PATH_PLACEHOLDER\}\}/g, cfg.base);

  const mcpTable = generateMcpServersTable(platform);
  const skillsTable = generateSkillsTable(platform, availableSkills);
  content = content.replace(/\{\{MCP_SERVERS_TABLE\}\}/g, mcpTable);
  content = content.replace(/\{\{SKILLS_TABLE\}\}/g, skillsTable);

  let archRulesPath;
  if (cfg.supportsSkills && cfg.skills) {
    const base = projectLocal ? path.join(process.cwd(), PROJECT_LOCAL_DIRS[platform] || '.trae') : cfg.base;
    archRulesPath = path.join(base, cfg.skills, 'metago-arch', 'rules', '架构治理规则v1.md');
  } else {
    archRulesPath = path.join(PKG_ROOT, 'skills', 'metago-arch', 'rules', '架构治理规则v1.md');
  }
  content = content.replace(/\{\{ARCH_RULES_PATH\}\}/g, archRulesPath);

  return content;
}

function scanAvailableSkills() {
  const skillsDir = path.join(PKG_ROOT, 'skills');
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir)
    .filter(d => {
      const skillPath = path.join(skillsDir, d, 'SKILL.md');
      return fs.existsSync(skillPath) && d.startsWith('metago-');
    });
}

// ============================================================
// 架构治理组件（metago-arch-gov v1.1.0 · 随主包分发）
// ============================================================
function runArchCommand(args) {
  const archCli = path.join(PKG_ROOT, 'scripts', 'metago-arch-cli.cjs');
  const r = spawnSync(process.execPath, [archCli].concat(args || []), { stdio: 'inherit' });
  if (r.status !== null) process.exit(r.status);
  process.exit(1);
}

// ============================================================
// 插件打包与部署（V36.9.2 新增 · 多平台插件层）
// ============================================================
function pluginPack(format, outDir) {
  const formats = !format || format === 'all' ? PLUGIN_FORMATS : [format];
  for (const fmt of formats) {
    if (!PLUGIN_FORMATS.includes(fmt)) {
      console.error(`  [错误] 不支持的插件格式 "${fmt}"。支持: ${PLUGIN_FORMATS.join(', ')}`);
      process.exit(1);
    }
    const src = path.join(PKG_ROOT, 'plugins', fmt);
    if (!fs.existsSync(src)) {
      console.error(`  [错误] 插件包源码不存在: ${src}`);
      process.exit(1);
    }
    const dest = path.join(outDir, fmt);
    console.log(`  [打包] ${fmt} → ${dest}`);
    copyDir(src, dest);
    console.log(`    ✓ 插件包已生成 (${fmt})`);
  }
  console.log(`\n  🎉 插件打包完成，输出目录: ${outDir}`);
  console.log(`  使用方式:`);
  console.log(`    - ZCode: 设置 → 插件管理 → 添加本地市场目录 ${outDir}`);
  console.log(`    - Claude Code: claude --plugin-dir ${path.join(outDir, 'claude')}`);
  console.log(`    - 通用 (Agent Plugins 1.0.0): ${path.join(outDir, 'agent-plugins-1.0.0')} 作为 Agent Plugin 安装`);
}

function installPlugin(platform) {
  const cfg = NODE_PLATFORM_CONFIGS[platform];
  const formatMap = {
    'zcode': 'zcode',
    'claude-code': 'claude',
    'codex': 'codex',
    'chatgpt-work': 'agent-plugins-1.0.0',
    'cursor': 'agent-plugins-1.0.0'
  };
  const fmt = formatMap[platform];
  if (!fmt) {
    console.log(`  [插件] ${cfg.name} 无插件通道（技能+法则+MCP 已全量生效）`);
    return;
  }
  const src = path.join(PKG_ROOT, 'plugins', fmt);
  if (!fs.existsSync(src)) {
    console.log(`  [插件] 插件包源码缺失: ${src}`);
    return;
  }
  let dest;
  if (platform === 'zcode') {
    dest = path.join(cfg.base, 'cli', 'plugins', 'marketplaces', 'metago-local', 'plugins', fmt);
    ensureDir(path.dirname(dest));
    copyDir(src, dest);
    // 注册本地市场（file 源）
    const marketDir = path.join(cfg.base, 'cli', 'plugins', 'marketplaces', 'metago-local');
    const mp = {
      name: 'metago-local',
      plugins: [{
        name: 'metago-lifeform',
        source: { source: 'file', type: 'directory', path: `plugins/${fmt}` },
        description: `MetaGO Lifeform（元构超级智能生命体）— ${scanAvailableSkills().length} 技能 + 35 专家子智能体 + 双 MCP 服务器`,
        description_i18n: {
          'en': `MetaGO Lifeform - ${scanAvailableSkills().length} skills + 35 expert subagents + dual MCP servers`,
          'zh-CN': `元构超级智能生命体 — ${scanAvailableSkills().length} 技能 + 35 专家子智能体 + 双 MCP 服务器`
        },
        version: VERSION,
        author: { name: '易霄 / 元构光年（成都）人工智能科技有限公司' },
        category: 'lifeform'
      }]
    };
    fs.writeFileSync(path.join(marketDir, 'marketplace.json'), JSON.stringify(mp, null, 2), 'utf8');
    console.log(`  [插件] ${cfg.name} 插件已部署: ${dest}`);
    console.log(`  [插件] 本地市场已注册: ${path.join(marketDir, 'marketplace.json')}（设置 → 插件管理 → Discover 可安装）`);
  } else if (platform === 'claude-code') {
    dest = path.join(cfg.base, 'plugins', 'metago-lifeform');
    ensureDir(path.dirname(dest));
    copyDir(src, dest);
    console.log(`  [插件] ${cfg.name} 插件已部署: ${dest}`);
    console.log(`  [插件] 重启 Claude Code 后 /plugin 可查看；或 claude --plugin-dir ${src}`);
  } else if (platform === 'codex') {
    dest = path.join(cfg.base, 'plugins', 'metago-lifeform');
    ensureDir(path.dirname(dest));
    copyDir(src, dest);
    console.log(`  [插件] ${cfg.name} 插件已部署: ${dest}`);
  } else {
    dest = path.join(cfg.base, 'plugins', 'metago-lifeform');
    ensureDir(path.dirname(dest));
    copyDir(src, dest);
    console.log(`  [插件] ${cfg.name} 插件（Agent Plugins 1.0.0）已部署: ${dest}`);
  }
}


function setupMcpAllPlatforms(platform, skipBuild, installPath) {
  const cfg = NODE_PLATFORM_CONFIGS[platform];
  if (!cfg.mcpConfig) {
    // 36.9.3 修正：以平台能力为准，无论是否 project-local/installPath 均不写 MCP 配置（旧守卫用 !installPath 短路会在 project-local 下崩溃）
    console.log(`  [MCP] ${cfg.name} 不注入自定义 MCP 工具（官方限制），跳过 MCP 配置写入（生效通道：法则+技能+Bash 直调）`);
    return;
  }
  if (!skipBuild) {
    console.log('  [MCP] 正在确保 @metago-ai/mcp-server 与 @metago-ai/algorithms 已安装...');
    try {
      execSync(`npm install -g @metago-ai/mcp-server@${MCP_SERVER_VER} @metago-ai/algorithms@${ALGORITHMS_VER}`, { stdio: 'inherit' });
    } catch (e) {
      console.warn('  [警告] npm 全局安装失败，尝试继续（可能已安装）');
    }
  }

  const configPath = installPath ? path.join(installPath, path.basename(cfg.mcpConfig)) : cfg.mcpConfig;
  ensureDir(path.dirname(configPath));
  
  let config = {};
  if (fs.existsSync(configPath)) {
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch { config = {}; }
  }
  config.mcpServers = config.mcpServers || {};

  for (const srv of cfg.mcpServers) {
    config.mcpServers[srv.name] = {
      command: srv.command,
      args: srv.args || []
    };
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`  [OK] MCP 配置已写入: ${configPath}`);
  const totalTools = cfg.mcpServers.reduce((sum, s) => sum + s.tools, 0);
  console.log(`  服务器: ${cfg.mcpServers.length} 个 MCP 服务器，共 ${totalTools} 工具`);
}

// ============================================================
// 安装逻辑（跨平台原生）
// ============================================================
function installNative(platform, opts) {
  const cfg = NODE_PLATFORM_CONFIGS[platform];
  const availableSkills = scanAvailableSkills();
  
  let base = cfg.base;
  if (opts.projectLocal) {
    base = path.join(process.cwd(), PROJECT_LOCAL_DIRS[platform] || '.trae');
    console.log(`  [项目级] 安装到当前项目: ${base}`);
  }

  if (!opts.skipBackup && !opts.force) {
    backupNative(platform, opts.projectLocal ? base : null);
  }

  console.log(`\n  [1/4] 生成平台法则文件 (${cfg.name})...`);
  const lawContent = generatePlatformLaw(platform, availableSkills, opts.projectLocal);
  const rulesFile = path.join(base, cfg.rules);
  ensureDir(path.dirname(rulesFile));
  fs.writeFileSync(rulesFile, lawContent, 'utf8');
  console.log(`    ✓ 法则文件: ${rulesFile}`);

  if (cfg.supportsSkills && !opts.skipSkills) {
    console.log(`  [2/4] 安装技能 (${availableSkills.length} 个)...`);
    const skillsDest = path.join(base, cfg.skills);
    const skillsSrc = path.join(PKG_ROOT, 'skills');
    if (fs.existsSync(skillsDest) && opts.force) {
      fs.rmSync(skillsDest, { recursive: true, force: true });
    }
    copyDir(skillsSrc, skillsDest);
    console.log(`    ✓ 技能目录: ${skillsDest}`);
  } else {
    console.log(`  [2/4] 技能安装: 跳过 (${cfg.supportsSkills ? 'opts.skipSkills' : '平台不支持技能'})`);
  }

  console.log(`  [3/4] 配置 MCP 服务器...`);
  setupMcpAllPlatforms(platform, false, opts.projectLocal ? base : null);

  if (opts.withPlugin && !opts.projectLocal) {
    console.log(`  [3.5/4] 部署插件层...`);
    installPlugin(platform);
  }

  if (opts.withCompleteness && !opts.projectLocal) {
    console.log(`  [3.6/4] 部署完整性治理套件...`);
    try {
      const kitInstall = path.join(PKG_ROOT, 'completeness-kit', 'install.js');
      if (fs.existsSync(kitInstall)) {
        const r = spawnSync(process.execPath, [kitInstall, '--platform', platform], { stdio: 'inherit' });
        if (r.status === 0) console.log(`    ✓ 完整性套件已部署到 ${cfg.name}`);
        else console.log(`    ⚠️ 完整性套件部署未完全成功（exit ${r.status}）`);
      } else {
        console.log(`    - 套件未随包分发（缺 completeness-kit/install.js）`);
      }
    } catch (e) {
      console.log(`    ⚠️ 完整性套件部署失败: ${e.message}`);
    }
  }

  console.log(`  [4/4] 安装后验证...`);
  verifyNative(platform, opts.projectLocal ? base : null);

  console.log(`\n  🎉 ${cfg.name} 平台安装完成 (V${VERSION})!`);
}

// ============================================================
// 卸载逻辑
// ============================================================
function uninstallNative(platform, opts) {
  const cfg = NODE_PLATFORM_CONFIGS[platform];
  const base = (opts && opts.installPath) || cfg.base;
  console.log(`\n  [卸载] 从 ${cfg.name} 平台卸载...`);

  if (!opts || !opts.skipBackup) {
    backupNative(platform, (opts && opts.installPath) || null);
    console.log('  [OK] 已备份当前配置');
  }

  const rulesFile = path.join(base, cfg.rules);
  if (fs.existsSync(rulesFile)) {
    fs.rmSync(rulesFile);
    console.log(`    ✓ 已删除法则文件: ${rulesFile}`);
  }

  if (cfg.mcpConfig && fs.existsSync(cfg.mcpConfig)) {
    try {
      const config = JSON.parse(fs.readFileSync(cfg.mcpConfig, 'utf8'));
      if (config.mcpServers) {
        for (const srv of cfg.mcpServers) {
          delete config.mcpServers[srv.name];
        }
        fs.writeFileSync(cfg.mcpConfig, JSON.stringify(config, null, 2));
        console.log(`    ✓ 已从 MCP 配置移除服务器`);
      }
    } catch (e) {
      console.warn(`    [警告] 无法更新 MCP 配置: ${e.message}`);
    }
  }

  if (cfg.supportsSkills && opts && opts.deleteSkills) {
    const skillsDir = path.join(base, cfg.skills);
    if (fs.existsSync(skillsDir)) {
      fs.rmSync(skillsDir, { recursive: true, force: true });
      console.log(`    ✓ 已删除技能目录: ${skillsDir}`);
    }
  } else {
    console.log('  [OK] 技能目录保留（如需删除请加 --delete-skills）');
  }

  console.log('  [OK] 卸载完成');
}

// ============================================================
// 验证逻辑
// ============================================================
function verifyNative(platform, installPath) {
  const cfg = NODE_PLATFORM_CONFIGS[platform];
  const base = installPath || cfg.base;
  let pass = 0, fail = 0, warn = 0;

  const rulesFile = path.join(base, cfg.rules);
  if (fs.existsSync(rulesFile)) {
    const content = removeBOM(fs.readFileSync(rulesFile, 'utf8'));
    const hasBOM = content.charCodeAt(0) === 0xFEFF;
    if (hasBOM) {
      console.log(`  [FAIL] 法则文件有 BOM`); fail++;
    } else {
      console.log(`  [PASS] 法则文件无 BOM`); pass++;
    }
    
    if (/V36\.9\.2/.test(content)) {
      console.log(`  [PASS] 法则版本: V36.9.2`); pass++;
    } else {
      const verMatch = content.match(/V\d+\.\d+\.\d+/);
      console.log(`  [FAIL] 法则版本错误 (期望 V36.9.2, 实际 ${verMatch ? verMatch[0] : '未知'})`); fail++;
    }

    if (/第十八章/.test(content) && !/\{\{MCP_SERVERS_TABLE\}\}/.test(content) && !/\{\{SKILLS_TABLE\}\}/.test(content)) {
      console.log(`  [PASS] 第十八章已正确注入`); pass++;
    } else {
      console.log(`  [FAIL] 第十八章未正确注入或存在占位符残留`); fail++;
    }

    const body = content.split(/\r?\n/).filter(l => !l.trim().startsWith('>')).join('\n');
    const traeTerms = ['Trae 系统中', 'Trae 的四个子系统', '.trae-cn/'];
    const hasTraeTerms = platform !== 'trae' && traeTerms.some(t => body.includes(t));
    if (!hasTraeTerms) {
      console.log(`  [PASS] 平台措辞替换正确`); pass++;
    } else {
      console.log(`  [WARN] 发现 Trae 专属措辞残留`); warn++;
    }
  } else {
    console.log(`  [FAIL] 法则文件不存在: ${rulesFile}`); fail++;
  }

  let config = {};
  if (cfg.mcpConfig && fs.existsSync(cfg.mcpConfig)) {
    try {
      config = JSON.parse(fs.readFileSync(cfg.mcpConfig, 'utf8'));
      console.log(`  [PASS] MCP 配置是合法 JSON`); pass++;
    } catch {
      console.log(`  [FAIL] MCP 配置 JSON 解析失败`); fail++;
    }
    const servers = config.mcpServers || {};
    let mcpOk = true;
    for (const srv of cfg.mcpServers.slice(0, 2)) {
      if (servers[srv.name] && servers[srv.name].command) {
        if (servers[srv.name].command === srv.command) {
          console.log(`  [PASS] MCP 服务器 ${srv.name} 配置正确 (command: ${srv.command})`); pass++;
        } else {
          console.log(`  [WARN] MCP 服务器 ${srv.name} command 不是全局命令: ${servers[srv.name].command}`); warn++;
        }
      } else {
        console.log(`  [FAIL] MCP 服务器 ${srv.name} 缺失`); fail++;
        mcpOk = false;
      }
    }
  } else if (!cfg.mcpConfig) {
    console.log(`  [PASS] ${cfg.name} 不注入自定义 MCP 工具（官方限制），MCP 检查按平台设计跳过`); pass++;
  } else {
console.log(`  [FAIL] MCP 配置文件不存在: ${cfg.mcpConfig}`); fail++;
  }

  if (cfg.supportsSkills) {
    const skillsDir = path.join(base, cfg.skills);
    if (fs.existsSync(skillsDir)) {
      const count = fs.readdirSync(skillsDir)
        .filter(d => d.startsWith('metago-') && fs.existsSync(path.join(skillsDir, d, 'SKILL.md'))).length;
      if (count >= 90) { // 36.9.3：与 verify-local-install.cjs MIN_SKILLS=90 统一（旧值 39 为 39 技能时代遗留）
        console.log(`  [PASS] 技能目录: ${count} 个技能`); pass++;
      } else {
        console.log(`  [WARN] 技能数量偏少: ${count}`); warn++;
      }
    } else {
      console.log(`  [FAIL] 技能目录不存在: ${skillsDir}`); fail++;
    }
  }

  console.log(`\n  验证结果: ${pass} 通过 / ${fail} 失败 / ${warn} 警告`);
  return { pass, fail, warn };
}

// ============================================================
// 帮助
// ============================================================
function showHelp() {
  console.log(`
MetaGO Agent Harness v${VERSION}
元构超级智能生命体标准安装包（跨平台全量版 V36.9.2 · 规则+技能+MCP+智能体+插件）

用法:
  metago-lifeform install [--platform <平台>] [--project-local] [--force] [--skip-backup] [--with-plugin]
                           安装到指定平台（默认: trae）；--with-plugin 额外部署插件层
  metago-lifeform setup-mcp [--platform <平台>] [--skip-build]
                           安装并配置 MCP 服务器
  metago-lifeform plugin-pack [--format <agent-plugins-1.0.0|claude|zcode|codex|all>] [--out <目录>]
                           生成多平台插件包（默认输出 ./dist/plugins/）
  metago-lifeform uninstall [--platform <平台>]
                           卸载当前平台适配
  metago-lifeform verify [--platform <平台>]
                           验证安装是否成功
  metago-lifeform list-backups
                           列出所有备份
  metago-lifeform restore-backup <timestamp>
                           从指定备份恢复
  metago-lifeform cleanup-backups [--keep N]
                          清理旧备份（默认保留 10 个）
  metago-lifeform arch <version|init|scaffold|check|report>
                          架构治理组件（SOLID + 整洁架构，v1.1.0）
  metago-lifeform version   显示版本号
  metago-lifeform help      显示本帮助

支持平台（11 形态）:
  ${PLATFORMS.join(', ')}

支持插件标准（两套全齐）:
  agent-plugins-1.0.0  OpenAI 联盟（VS Code / Cursor / Copilot / ChatGPT / Codex / Kiro）
  claude               Anthropic 系（Claude Code / ZCode 兼容）
  zcode                ZCode 明确格式
  codex                Codex 兼容名

示例:
  metago-lifeform install --platform zcode --with-plugin   # ZCode 全量安装（含插件）
  metago-lifeform plugin-pack --format all                 # 生成全部插件包
  metago-lifeform plugin-pack --format claude --out ./dist # 仅生成 Claude 系插件包

文档:
  官网: https://metago.life/
  仓库: https://gitee.com/metago/metagolifeform
  GitHub: https://github.com/metago-ai/metagolifeform
`);
}

// ============================================================
// 主入口
// ============================================================
function main() {
  const opts = parseArgs(process.argv);
  const platform = opts.platform;

  if (!PLATFORMS.includes(platform) && !['help', 'version', 'list-backups', 'cleanup-backups', 'restore-backup', 'arch', 'plugin-pack', 'completeness', 'veracity'].includes(opts.command)) {
    console.error(`错误: 不支持的平台 "${platform}"。支持的平台: ${PLATFORMS.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║       MetaGO Agent Harness v${VERSION}                     ║`);
  console.log(`║       元构超级智能生命体 · 跨平台安装器                      ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝\n`);

  switch (opts.command) {
    case 'install':
    case 'i':
      installNative(platform, opts);
      break;
    case 'setup-mcp':
    case 'mcp':
      setupMcpAllPlatforms(platform, opts.skipBuild);
      break;
    case 'plugin-pack':
    case 'pp':
      pluginPack(opts.format, opts.out || path.join(process.cwd(), 'dist', 'plugins'));
      break;
    case 'veracity':
    case 'vc': {
      // 行为诚实工程套件代理（V36.9.2 并入）
      const vCli = path.join(PKG_ROOT, 'metago-veracity-kit', 'bin', 'veracity-guard.js');
      if (!fs.existsSync(vCli)) {
        console.error('错误: 行为诚实套件未随包分发（缺 metago-veracity-kit/bin/veracity-guard.js）');
        process.exit(1);
      }
      const args = process.argv.slice(3);
      const r = spawnSync(process.execPath, [vCli].concat(args), { stdio: 'inherit' });
      process.exit(r.status !== null ? r.status : 1);
      break;
    }
    case 'completeness':
    case 'ck': {
      // 完整性治理套件代理（V36.9.2 并入）
      const kitCli = path.join(PKG_ROOT, 'completeness-kit', 'bin', 'completeness-guard.js');
      if (!fs.existsSync(kitCli)) {
        console.error('错误: 完整性治理套件未随包分发（缺 completeness-kit/bin/completeness-guard.js）');
        process.exit(1);
      }
      const args = opts.archArgs.length ? opts.archArgs : process.argv.slice(3);
      const r = spawnSync(process.execPath, [kitCli].concat(args), { stdio: 'inherit' });
      process.exit(r.status !== null ? r.status : 1);
      break;
    }
    case 'uninstall':
    case 'u':
      uninstallNative(platform, opts);
      break;
    case 'verify':
    case 'v':
      const result = verifyNative(platform, opts.installPath);
      process.exit(result.fail > 0 ? 1 : 0);
      break;
    case 'list-backups':
      listBackups();
      break;
    case 'restore-backup':
      if (!opts.restoreTarget) {
        console.error('错误: 请指定要恢复的备份时间戳');
        listBackups();
        process.exit(1);
      }
      restoreBackup(opts.restoreTarget);
      break;
    case 'cleanup-backups':
      cleanupOldBackups(opts.keepBackups);
      console.log(`  [OK] 已清理，保留最近 ${opts.keepBackups} 个备份`);
      break;
    case 'arch':
      runArchCommand(opts.archArgs);
      break;
    case 'version':
    case 'ver':
      console.log(`MetaGO Agent Harness v${VERSION}`);
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp();
      break;
  }
}

main();
