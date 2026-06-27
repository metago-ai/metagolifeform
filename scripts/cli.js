#!/usr/bin/env node
/**
 * MetaGO Lifeform Kit - CLI 入口
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
const VERSION = '36.5.0';

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

function showHelp() {
  console.log(`
MetaGO Lifeform Kit v${VERSION}
元构超级智能生命体标准安装包

用法:
  metago-lifeform install [--platform <平台>]   安装到指定平台（默认: trae）
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
  官网: https://metago-d6gfw1e4rf2a5bcad-1257074864.tcloudbaseapp.com/
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

  if (process.platform !== 'win32') {
    console.error('错误: 当前版本仅支持 Windows 平台（依赖 PowerShell 脚本）。');
    console.error('Linux/macOS 支持将在后续版本提供。');
    console.error('如需手动安装，请参考 docs/GETTING_STARTED.md');
    process.exit(1);
  }

  switch (command) {
    case 'install':
    case 'i': {
      if (!PLATFORMS.includes(platform)) {
        console.error(`错误: 不支持的平台 "${platform}"。支持的平台: ${PLATFORMS.join(', ')}`);
        process.exit(1);
      }
      console.log(`\n[MetaGO Lifeform Kit] 正在安装到 ${platform} 平台...`);
      runPowerShell('install.ps1', ['-Platform', platform]);
      break;
    }
    case 'uninstall':
    case 'u': {
      console.log('\n[MetaGO Lifeform Kit] 正在卸载...');
      runPowerShell('uninstall.ps1', []);
      break;
    }
    case 'verify':
    case 'v': {
      console.log('\n[MetaGO Lifeform Kit] 正在验证安装...');
      runPowerShell('verify.ps1', []);
      break;
    }
    case 'version':
    case 'ver': {
      console.log(`MetaGO Lifeform Kit v${VERSION}`);
      break;
    }
    default:
      console.error(`未知命令: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main();
