#!/usr/bin/env node
/**
 * MetaGO Agent Harness - CLI 入口
 * 跨平台命令行工具，封装 install.ps1 / uninstall.ps1 / verify.ps1
 *
 * 用法:
 *   metago-lifeform install [--platform <平台>]   安装到指定平台（默认: trae）
 *   metago-lifeform uninstall                     卸载
 *   metago-lifeform verify                        验证安装
 *   metago-lifeform help                          显示帮助
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PKG_ROOT = path.resolve(__dirname, '..');
const SCRIPTS_DIR = path.join(PKG_ROOT, 'scripts');
const PLATFORMS = ['trae', 'claude-code', 'codex', 'cursor', 'codebuddy', 'qoder', 'zcode'];
// 从 package.json 动态读取版本号，避免硬编码不同步（与 logger.ts 同模式）
const VERSION = require('../package.json').version;

function parseArgs(argv) {
  const args = argv.slice(2);
  let command = args[0];
  let platform = 'trae';
  const platformIdx = args.findIndex(a => a === '--platform' || a === '-p');
  if (platformIdx !== -1 && args[platformIdx + 1]) {
    platform = args[platformIdx + 1];
  } else {
    const eqArg = args.find(a => a.startsWith('--platform='));
    if (eqArg) platform = eqArg.split('=')[1];
  }
  return { command, platform };
}

function runPowerShell(scriptName, extraArgs) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  if (!fs.existsSync(scriptPath)) {
    console.error(`错误: 找不到脚本 ${scriptPath}`);
    process.exit(1);
  }
  const args = ['-ExecutionPolicy', 'Bypass', '-File', `"${scriptPath}"`];
  if (extraArgs) args.push(...extraArgs);
  try {
    execSync(`powershell ${args.join(' ')}`, { stdio: 'inherit', cwd: PKG_ROOT });
  } catch (e) {
    process.exit(e.status || 1);
  }
}

/**
 * 在 macOS/Linux 上执行 Bash 脚本
 */
function runBash(scriptName, extraArgs) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  if (!fs.existsSync(scriptPath)) {
    console.error(`错误: 找不到脚本 ${scriptPath}`);
    process.exit(1);
  }
  const shellArgs = [scriptPath];
  if (extraArgs) shellArgs.push(...extraArgs);
  try {
    const cmd = 'bash ' + shellArgs.map(a => `"${a}"`).join(' ');
    execSync(cmd, { stdio: 'inherit', cwd: PKG_ROOT });
  } catch (e) {
    process.exit(e.status || 1);
  }
}

/**
 * 跨平台安装：Windows 用 PowerShell，macOS/Linux 用 Bash
 */
function runInstall(extraArgs) {
  if (process.platform === 'win32') {
    runPowerShell('install.ps1', extraArgs);
  } else {
    runBash('install.sh', extraArgs);
  }
}

// ============================================================
// 跨平台平台配置（Node 原生实现，macOS/Linux 不再依赖 PowerShell）
// ============================================================
const os = require('os');
const HOME = os.homedir();
const IS_WIN = process.platform === 'win32';

function appSupport(...segments) {
  if (IS_WIN) return path.join(process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming'), ...segments);
  if (process.platform === 'darwin') return path.join(HOME, 'Library', 'Application Support', ...segments);
  return path.join(process.env.XDG_CONFIG_HOME || path.join(HOME, '.config'), ...segments);
}

const NODE_PLATFORM_CONFIGS = {
  'trae':        { name: 'Trae',        base: path.join(HOME, '.trae-cn'), rules: 'rules.md',       skills: 'skills',          supportsSkills: true,  mcpConfig: appSupport('Trae CN', 'User', 'mcp.json') },
  'claude-code': { name: 'Claude Code', base: path.join(HOME, '.claude'),  rules: 'CLAUDE.md',       skills: 'skills',          supportsSkills: true,  mcpConfig: appSupport('Claude', 'claude_desktop_config.json') },
  'codex':       { name: 'OpenAI Codex',base: path.join(HOME, '.codex'),   rules: 'AGENTS.md',       skills: '',                supportsSkills: false, mcpConfig: path.join(HOME, '.codex', 'config.json') },
  'cursor':      { name: 'Cursor',      base: process.cwd(),               rules: path.join('.cursor', 'rules', 'metago.mdc'), skills: '', supportsSkills: false, mcpConfig: path.join(process.cwd(), '.cursor', 'mcp.json') },
  'codebuddy':   { name: 'CodeBuddy',   base: process.cwd(),               rules: 'CODEBUDDY.md',    skills: path.join('.codebuddy', 'rules'), supportsSkills: true, mcpConfig: path.join(process.cwd(), '.codebuddy', 'mcp.json') },
  'qoder':       { name: 'Qoder',       base: process.cwd(),               rules: path.join('.qoder', 'rules', 'metago.md'), skills: '', supportsSkills: false, mcpConfig: path.join(process.cwd(), '.qoder', 'mcp.json') },
  'zcode':       { name: 'ZCode',       base: path.join(HOME, '.claude'),  rules: 'CLAUDE.md',       skills: 'skills',          supportsSkills: true,  mcpConfig: path.join(HOME, '.zcode', 'config', 'mcp.json') },
};

/**
 * Node 原生验证（非 Windows 平台的 verify 回退实现）
 */
function verifyNative(platform, installPath) {
  const cfg = NODE_PLATFORM_CONFIGS[platform];
  const base = installPath || cfg.base;
  let pass = 0, fail = 0;
  const rulesFile = path.join(base, cfg.rules);
  if (fs.existsSync(rulesFile) && /元构|MetaGO/.test(fs.readFileSync(rulesFile, 'utf8'))) {
    console.log(`  [PASS] 规则文件: ${rulesFile}`); pass++;
  } else {
    console.log(`  [FAIL] 规则文件缺失或内容不符: ${rulesFile}`); fail++;
  }
  if (cfg.supportsSkills) {
    const skillsDir = path.join(base, cfg.skills);
    const count = fs.existsSync(skillsDir)
      ? fs.readdirSync(skillsDir).filter((d) => d.startsWith('metago-') && fs.existsSync(path.join(skillsDir, d, 'SKILL.md'))).length
      : 0;
    if (count > 0) { console.log(`  [PASS] 技能目录: ${count} 个 metago 技能`); pass++; }
    else { console.log(`  [FAIL] 技能目录无 metago 技能: ${skillsDir}`); fail++; }
  }
  console.log(`\n  验证结果: ${pass} 通过 / ${fail} 失败`);
  process.exit(fail === 0 ? 0 : 1);
}

/**
 * Node 原生卸载（非 Windows 平台回退）：优先从最近备份恢复规则文件，否则删除规则文件；保留技能目录
 */
function uninstallNative(platform, installPath) {
  const cfg = NODE_PLATFORM_CONFIGS[platform];
  const base = installPath || cfg.base;
  const rulesFile = path.join(base, cfg.rules);
  const backups = fs.existsSync(base)
    ? fs.readdirSync(base).filter((d) => d.startsWith('.metago-backup-')).sort().reverse()
    : [];
  let restored = false;
  for (const b of backups) {
    const candidate = path.join(base, b, 'rules', path.basename(rulesFile));
    if (fs.existsSync(candidate)) {
      fs.copyFileSync(candidate, rulesFile);
      console.log(`  [OK] 已从备份恢复规则文件: ${candidate}`); restored = true; break;
    }
  }
  if (!restored && fs.existsSync(rulesFile)) {
    fs.rmSync(rulesFile);
    console.log(`  [OK] 已删除规则文件（无备份可恢复）: ${rulesFile}`);
  }
  console.log('  [OK] 卸载完成（metago-* 技能目录按卸载策略保留，可手动删除）');
}

/**
 * Node 原生 MCP 配置（非 Windows 平台回退）：全局安装两个服务器并合并 mcpServers 配置
 */
function setupMcpNative(platform, skipBuild) {
  const cfg = NODE_PLATFORM_CONFIGS[platform];
  if (!skipBuild) {
    console.log('  正在全局安装 @metago-ai/mcp-server 与 @metago-ai/algorithms ...');
    try {
      execSync('npm install -g @metago-ai/mcp-server @metago-ai/algorithms', { stdio: 'inherit' });
    } catch (e) {
      console.error('  [FAIL] npm 全局安装失败'); process.exit(e.status || 1);
    }
  }
  const configPath = cfg.mcpConfig;
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  let config = {};
  if (fs.existsSync(configPath)) {
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch { config = {}; }
  }
  config.mcpServers = config.mcpServers || {};
  config.mcpServers['metago'] = { command: 'metago-mcp-server', args: [] };
  config.mcpServers['metago-algorithms'] = { command: 'metago-algorithms', args: [] };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`  [OK] MCP 配置已写入: ${configPath}`);
  console.log('  服务器: metago（53 tools）+ metago-algorithms（57 tools / 927 algorithms）');
}

function showHelp() {
  console.log(`
MetaGO Agent Harness v${VERSION}
元构超级智能生命体标准安装包

用法:
  metago-lifeform install [--platform <平台>]   安装到指定平台（默认: trae）
  metago-lifeform setup-mcp [--platform <平台>]  安装并配置 MCP Server（53 tools）+ 算法服务器（57 tools）
  metago-lifeform uninstall                     卸载当前平台适配
  metago-lifeform verify                        验证安装是否成功
  metago-lifeform version                       显示版本号
  metago-lifeform help                          显示本帮助

支持平台:
  ${PLATFORMS.join(', ')}

示例:
  metago-lifeform install                        # 安装到 Trae（默认）
  metago-lifeform install --platform claude-code  # 安装到 Claude Code
  metago-lifeform install -p cursor              # 安装到 Cursor（短参数）
  metago-lifeform verify                         # 验证安装

验证安装:
  在对应平台中对 AI 说: "你是元构超级智能生命体吗？"
  若回复包含【闭环分析】和元构公理引用，说明安装成功。

文档:
  官网: https://metago.life/
  仓库: https://gitee.com/metago/metagolifeform
  GitHub: https://github.com/metago-ai/metagolifeform
  MCP Server: @metago-ai/mcp-server (npm)
`);
}

function main() {
  const { command, platform } = parseArgs(process.argv);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  switch (command) {
    case 'install':
    case 'i': {
      if (!PLATFORMS.includes(platform)) {
        console.error(`错误: 不支持的平台 "${platform}"。支持的平台: ${PLATFORMS.join(', ')}`);
        process.exit(1);
      }
      console.log(`\n[MetaGO Agent Harness] 正在安装到 ${platform} 平台...`);
      const extraArgs = ['-Platform', platform];
      const passthroughArgs = process.argv.slice(3).filter(a =>
        !a.startsWith('--platform') && !a.startsWith('-p') && a !== platform
      );
      if (process.platform === 'win32') {
        runPowerShell('install.ps1', extraArgs.concat(passthroughArgs));
      } else {
        runBash('install.sh', ['--platform', platform].concat(passthroughArgs));
      }
      break;
    }
    case 'setup-mcp':
    case 'mcp': {
      if (!PLATFORMS.includes(platform)) {
        console.error(`错误: 不支持的平台 "${platform}"。支持的平台: ${PLATFORMS.join(', ')}`);
        process.exit(1);
      }
      console.log(`\n[MetaGO MCP Server] 正在安装并配置到 ${platform} 平台...`);
      const skipBuild = process.argv.includes('--skip-build');
      if (process.platform === 'win32') {
        const mcpArgs = ['-Platform', platform];
        if (skipBuild) mcpArgs.push('-SkipBuild');
        runPowerShell('setup-mcp-server.ps1', mcpArgs);
      } else {
        setupMcpNative(platform, skipBuild);
      }
      break;
    }
    case 'uninstall':
    case 'u': {
      console.log('\n[MetaGO Agent Harness] 正在卸载...');
      if (process.platform === 'win32') {
        runPowerShell('uninstall.ps1', []);
      } else {
        uninstallNative(platform);
      }
      break;
    }
    case 'verify':
    case 'v': {
      console.log('\n[MetaGO Agent Harness] 正在验证安装...');
      if (process.platform === 'win32') {
        runPowerShell('verify.ps1', []);
      } else {
        verifyNative(platform);
      }
      break;
    }
    case 'version':
    case 'ver': {
      console.log(`MetaGO Agent Harness v${VERSION}`);
      break;
    }
    default:
      console.error(`未知命令: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main();
