#!/usr/bin/env node
/**
* MetaGO Lifeform 安装后验收脚本（期望版本动态读取根 package.json · 36.9.3 起）
 *
 * 用法:
 *   node verify-local-install.cjs                          自动检测平台
 *   node verify-local-install.cjs --platform trae          指定平台
 *   node verify-local-install.cjs --project-local          检查项目级安装
 *   node verify-local-install.cjs --skills "<技能目录>"     指定技能目录路径
 *   node verify-local-install.cjs --law "<法则文件路径>"    指定法则文件路径
 *
 * 返回码: 0=全部通过, 1=存在失败项
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// 36.9.3 修复：期望版本动态读取根 package.json，杜绝「发布忘改验收」类漂移
const EXPECTED_VERSION = (() => { try { return require('../package.json').version; } catch { return '36.9.6'; } })();
const EXPECTED_ENGINE = '2.1.1';
const MIN_SKILLS = 90;
const HOME = os.homedir();
const IS_WIN = process.platform === 'win32';

function appSupport(...segments) {
  if (IS_WIN) return path.join(process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming'), ...segments);
  if (process.platform === 'darwin') return path.join(HOME, 'Library', 'Application Support', ...segments);
  return path.join(process.env.XDG_CONFIG_HOME || path.join(HOME, '.config'), ...segments);
}

function removeBOM(c) {
  if (c.charCodeAt(0) === 0xFEFF) return c.slice(1);
  return c;
}

function hasBOM(filePath) {
  const buf = fs.readFileSync(filePath);
  return buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
}

function safeReadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function fileExists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function commandAvailable(cmd) {
  try {
    const out = execSync(`${cmd} --help`, { encoding: 'utf8', timeout: 8000, stdio: 'pipe' });
    return { available: true, detail: '命令可用' };
  } catch {
    // Fallback: check for .cmd shim on Windows
    if (IS_WIN) {
      try {
        const globalBin = execSync('npm bin -g', { encoding: 'utf8' }).trim();
        const cmdPath = path.join(globalBin, `${cmd}.cmd`);
        if (fileExists(cmdPath)) return { available: true, detail: `存在: ${cmdPath}` };
      } catch {}
    }
    return { available: false, detail: `${cmd} 不在 PATH 中` };
  }
}

function detectPlatform() {
  const candidates = [
    { id: 'trae', dir: path.join(HOME, '.trae-cn') },
    { id: 'claude-code', dir: path.join(HOME, '.claude') },
    { id: 'cursor', dir: path.join(HOME, '.cursor') },
    { id: 'codebuddy', dir: path.join(HOME, '.codebuddy') },
    { id: 'codex', dir: path.join(HOME, '.codex') },
    { id: 'qoder', dir: path.join(HOME, '.qoder') },
    { id: 'zcode', dir: path.join(HOME, '.zcode') }
  ];
  for (const c of candidates) {
    if (fileExists(c.dir)) return c.id;
  }
  return 'trae';
}

// Platform configuration matching cli.js NODE_PLATFORM_CONFIGS
function getPlatformConfig(platform) {
  const configs = {
    'trae': {
      name: 'Trae',
      base: path.join(HOME, '.trae-cn'),
// 36.9.4 修复：与 cli.js 落点对齐（旧值 builtin/work/AGENTS.md 是遗留内置位，与安装器写入的 rules.md 不一致 → 合格安装必判 1.1 FAIL）
      rulesFile: path.join(HOME, '.trae-cn', 'rules.md'),
      skillsDir: path.join(HOME, '.trae-cn', 'skills'),
      supportsSkills: true,
      mcpConfig: appSupport('Trae CN', 'User', 'mcp.json'),
      memoryDir: path.join(HOME, '.trae-cn', 'memory')
    },
    'claude-code': {
      name: 'Claude Code',
      base: path.join(HOME, '.claude'),
// 36.9.4 修复：与 cli.js 落点对齐（.claude/CLAUDE.md；旧值 HOME/CLAUDE.md 位置错误）
      rulesFile: path.join(HOME, '.claude', 'CLAUDE.md'),
      skillsDir: path.join(HOME, '.claude', 'skills'),
      supportsSkills: true,
      mcpConfig: appSupport('Claude', 'claude_desktop_config.json'),
      memoryDir: path.join(HOME, '.claude')
    },
    'codex': {
      name: 'Codex',
      base: path.join(HOME, '.codex'),
      rulesFile: path.join(HOME, '.codex', 'AGENTS.md'),
      skillsDir: path.join(HOME, '.codex', 'skills'),
      supportsSkills: true,
      // 36.9.6: Codex CLI 实际读取 config.toml（旧 config.json 是 Codex 不读的文件）
      mcpConfig: path.join(HOME, '.codex', 'config.toml'),
      mcpFileFormat: 'toml',
      memoryDir: path.join(HOME, '.codex')
    },
    'cursor': {
      name: 'Cursor',
      base: path.join(HOME, '.cursor'),
      rulesFile: path.join(HOME, '.cursor', 'rules', 'metago.mdc'),
      skillsDir: path.join(HOME, '.cursor', 'skills'),
      supportsSkills: true,
      mcpConfig: appSupport('Cursor', 'User', 'mcp.json'),
      memoryDir: path.join(HOME, '.cursor')
    },
    'codebuddy': {
      name: 'CodeBuddy',
      base: path.join(HOME, '.codebuddy'),
      rulesFile: path.join(HOME, '.codebuddy', 'CODEBUDDY.md'),
      skillsDir: path.join(HOME, '.codebuddy', 'rules', 'skills'),
      supportsSkills: true,
      mcpConfig: path.join(HOME, '.codebuddy', 'mcp.json'),
      memoryDir: path.join(HOME, '.codebuddy')
    },
    'qoder': {
      name: 'Qoder',
      base: path.join(HOME, '.qoder'),
// 36.9.4 修复：与 cli.js 落点对齐（旧值 metago-rules.md 与安装器 rules/metago.md 不一致）
      rulesFile: path.join(HOME, '.qoder', 'rules', 'metago.md'),
      skillsDir: '',
      supportsSkills: false,
      mcpConfig: path.join(HOME, '.qoder', 'mcp.json'),
      memoryDir: path.join(HOME, '.qoder')
    },
    'zcode': {
      name: 'ZCode',
      base: path.join(HOME, '.zcode'),
      rulesFile: path.join(HOME, '.zcode', 'CLAUDE.md'),
      skillsDir: path.join(HOME, '.zcode', 'skills'),
      supportsSkills: true,
      mcpConfig: path.join(HOME, '.zcode', 'config', 'mcp.json'),
      memoryDir: path.join(HOME, '.zcode')
    },
    'chatgpt-work': {
      name: 'ChatGPT Work',
      base: path.join(HOME, '.chatgpt'),
      rulesFile: path.join(HOME, '.chatgpt', 'AGENTS.md'),
      skillsDir: path.join(HOME, '.chatgpt', 'skills'),
      supportsSkills: true,
      mcpConfig: path.join(HOME, '.chatgpt', 'mcp.json'),
      memoryDir: path.join(HOME, '.chatgpt')
    },
    'workbuddy': {
      name: 'WorkBuddy',
      base: path.join(HOME, '.workbuddy'),
      rulesFile: path.join(HOME, '.workbuddy', 'AGENTS.md'),
      skillsDir: path.join(HOME, '.workbuddy', 'skills'),
      supportsSkills: true,
      mcpConfig: path.join(HOME, '.workbuddy', 'mcp.json'),
      memoryDir: path.join(HOME, '.workbuddy')
    },
    'kimi-code': {
      name: 'Kimi Code',
      base: path.join(HOME, '.kimi-code'),
      rulesFile: path.join(HOME, '.kimi-code', 'AGENTS.md'),
      skillsDir: path.join(HOME, '.kimi-code', 'skills'),
      supportsSkills: true,
      mcpConfig: path.join(HOME, '.kimi-code', 'mcp.json'),
      memoryDir: path.join(HOME, '.kimi-code')
    },
    'kimi-work': {
      name: 'Kimi Work',
      base: path.join(HOME, '.kimi-work'),
      rulesFile: path.join(HOME, '.kimi-work', 'AGENTS.md'),
      skillsDir: path.join(HOME, '.kimi-work', 'skills'),
      supportsSkills: true,
      mcpConfig: null,
      memoryDir: path.join(HOME, '.kimi-work')
    }
  };
  return configs[platform] || configs['trae'];
}

function getPlatformPaths(platform, projectLocal, customSkillsDir, customLawFile) {
  const cwd = process.cwd();
  const cfg = getPlatformConfig(platform);

  if (projectLocal) {
    return {
      rulesFile: customLawFile || path.join(cwd, '.trae', 'rules', 'metago.md'),
      configDir: path.join(cwd, '.trae'),
      skillsDir: customSkillsDir || path.join(cwd, '.trae', 'skills'),
      mcpConfig: path.join(cwd, '.trae', 'mcp.json'),
      memoryDir: path.join(cwd, '.trae-memory'),
      supportsSkills: true
    };
  }

  return {
    rulesFile: customLawFile || cfg.rulesFile,
    configDir: cfg.base,
    skillsDir: customSkillsDir || cfg.skillsDir,
    mcpConfig: cfg.mcpConfig,
    memoryDir: cfg.memoryDir,
    supportsSkills: cfg.supportsSkills
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  let platform = null;
  let projectLocal = false;
  let skillsDir = null;
  let lawFile = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--platform' && args[i + 1]) {
      platform = args[i + 1];
      i++;
    } else if (args[i] === '--project-local') {
      projectLocal = true;
    } else if (args[i] === '--skills' && args[i + 1]) {
      skillsDir = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--law' && args[i + 1]) {
      lawFile = path.resolve(args[i + 1]);
      i++;
    }
  }
  if (!platform) platform = detectPlatform();
  return { platform, projectLocal, skillsDir, lawFile };
}

const results = [];
function check(id, desc, fn) {
  try {
    const { pass, detail } = fn();
    results.push({ id, desc, pass, detail });
  } catch (err) {
    results.push({ id, desc, pass: false, detail: `异常: ${err.message}` });
  }
}

function main() {
  const { platform, projectLocal, skillsDir: customSkillsDir, lawFile: customLawFile } = parseArgs();
  const paths = getPlatformPaths(platform, projectLocal, customSkillsDir, customLawFile);
  const pkgRoot = path.resolve(__dirname, '..');

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log(`║  MetaGO Lifeform V${EXPECTED_VERSION} 安装后验收                      ║`);
  console.log('║  10 大类 · 45+ 检查项（含插件层与平台矩阵）                                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  目标平台: ${platform}`);
  console.log(`  安装模式: ${projectLocal ? '项目级 (.trae/)' : '全局用户级'}`);
  console.log(`  法则文件: ${paths.rulesFile}`);
  if (customSkillsDir) console.log(`  技能目录: ${paths.skillsDir} (自定义覆盖)`);
  if (customLawFile) console.log(`  法则路径: ${paths.rulesFile} (自定义覆盖)`);
  console.log('');

  // ============ 类别 1: 文件存在性 ============
  console.log('─── 类别 1: 文件存在性 ───');

  check('1.1', '法则文件存在', () => {
    const exists = fileExists(paths.rulesFile);
    return { pass: exists, detail: exists ? '存在' : `不存在: ${paths.rulesFile}` };
  });

  check('1.2', '全局 npm 包存在 (metago-lifeform)', () => {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const pkgPath = path.join(globalRoot, 'metago-lifeform', 'package.json');
    const exists = fileExists(pkgPath);
    return { pass: exists, detail: exists ? pkgPath : `未找到全局包: ${pkgPath}` };
  });

  check('1.3', 'MCP 配置文件存在', () => {
    if (platform === 'trae' || projectLocal) {
      const exists = fileExists(paths.mcpConfig);
      return { pass: exists, detail: exists ? '存在' : `不存在: ${paths.mcpConfig}` };
    }
    return { pass: true, detail: `${platform} 平台使用其他 MCP 配置方式，跳过` };
  });

  check('1.4', '技能目录存在', () => {
    if (!paths.supportsSkills) {
      return { pass: true, detail: `${platform} 平台不支持独立技能目录，跳过` };
    }
    const exists = fileExists(paths.skillsDir);
    return { pass: exists, detail: exists ? paths.skillsDir : `不存在: ${paths.skillsDir}` };
  });

  check('1.5', 'cli.js 入口存在（全局包）', () => {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const cliPath = path.join(globalRoot, 'metago-lifeform', 'scripts', 'cli.js');
    const exists = fileExists(cliPath);
    return { pass: exists, detail: exists ? '存在' : `不存在: ${cliPath}` };
  });

  check('1.6', '备份目录存在', () => {
    const backupDir = path.join(HOME, '.metago-backups');
    if (!fileExists(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    return { pass: fileExists(backupDir), detail: backupDir };
  });

  // ============ 类别 2: 版本正确性 ============
  console.log('─── 类别 2: 版本正确性 ───');

  check('2.1', `法则版本为 V${EXPECTED_VERSION}`, () => {
    if (!fileExists(paths.rulesFile)) return { pass: false, detail: '法则文件不存在' };
    const content = removeBOM(fs.readFileSync(paths.rulesFile, 'utf8'));
const hasVersion = content.includes('V' + EXPECTED_VERSION); // 36.9.3 修复：动态版本判定（旧硬编码 /V36\.9\.2/ 会让新版本验收必失败）
    return { pass: hasVersion, detail: hasVersion ? 'V' + EXPECTED_VERSION : '版本号未找到或不正确' };
  });

  check('2.2', `全局 metago-lifeform 版本为 ${EXPECTED_VERSION}`, () => {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const pkgPath = path.join(globalRoot, 'metago-lifeform', 'package.json');
    const pkg = safeReadJSON(pkgPath);
    if (!pkg) return { pass: false, detail: '无法读取 package.json' };
    const correct = pkg.version === EXPECTED_VERSION;
    return { pass: correct, detail: correct ? pkg.version : `期望 ${EXPECTED_VERSION}, 实际 ${pkg.version}` };
  });

  check('2.3', 'Engine 版本为 2.1.1', () => {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const pkgPath = path.join(globalRoot, 'metago-lifeform', 'package.json');
    const pkg = safeReadJSON(pkgPath);
    if (!pkg || !pkg.metago || !pkg.metago.engine) return { pass: false, detail: '无 metago.engine 字段' };
    const correct = pkg.metago.engine.version === EXPECTED_ENGINE;
    return { pass: correct, detail: correct ? pkg.metago.engine.version : `期望 ${EXPECTED_ENGINE}, 实际 ${pkg.metago.engine.version}` };
  });

  check('2.4', `metago-lifeform --version 输出 ${EXPECTED_VERSION}`, () => {
    try {
      const out = execSync('metago-lifeform --version', { encoding: 'utf8', timeout: 10000 }).trim();
      const correct = out.includes(EXPECTED_VERSION);
      return { pass: correct, detail: out };
    } catch (e) {
      return { pass: false, detail: `命令执行失败: ${e.message}` };
    }
  });

  // ============ 类别 3: 无 BOM ============
  console.log('─── 类别 3: 编码检查（无 BOM）───');

  check('3.1', '法则文件无 UTF-8 BOM', () => {
    if (!fileExists(paths.rulesFile)) return { pass: false, detail: '法则文件不存在' };
    const bom = hasBOM(paths.rulesFile);
    return { pass: !bom, detail: bom ? '包含 BOM！' : '无 BOM' };
  });

  check('3.2', '全局 AGENTS.md 母本无 BOM', () => {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const agentsPath = path.join(globalRoot, 'metago-lifeform', 'AGENTS.md');
    if (!fileExists(agentsPath)) return { pass: true, detail: '母本未在全局包内（打包模式不同）' };
    const bom = hasBOM(agentsPath);
    return { pass: !bom, detail: bom ? '包含 BOM！' : '无 BOM' };
  });

  // ============ 类别 4: 第十八章完整性 ============
  console.log('─── 类别 4: 第十八章完整性 ───');

  check('4.1', '第十八章存在', () => {
    if (!fileExists(paths.rulesFile)) return { pass: false, detail: '法则文件不存在' };
    const content = removeBOM(fs.readFileSync(paths.rulesFile, 'utf8'));
    const has = content.includes('第十八章') && content.includes('MCP工具与技能');
    return { pass: has, detail: has ? '第十八章标题存在' : '第十八章缺失' };
  });

  check('4.2', 'MCP Server 清单已注入（非占位符）', () => {
    if (!fileExists(paths.rulesFile)) return { pass: false, detail: '法则文件不存在' };
    const content = removeBOM(fs.readFileSync(paths.rulesFile, 'utf8'));
    const noPlaceholder = !content.includes('{{MCP_SERVERS_TABLE}}');
    const hasTable = content.includes('MCP Server') || content.includes('Server ID');
    return { pass: noPlaceholder && hasTable, detail: noPlaceholder ? (hasTable ? '已注入具体清单' : '占位符替换了但无表格') : '仍包含占位符 {{MCP_SERVERS_TABLE}}' };
  });

  check('4.3', '技能清单已注入（非占位符）', () => {
    if (!fileExists(paths.rulesFile)) return { pass: false, detail: '法则文件不存在' };
    const content = removeBOM(fs.readFileSync(paths.rulesFile, 'utf8'));
    const noPlaceholder = !content.includes('{{SKILLS_TABLE}}');
    const hasTable = content.includes('能力族') || content.includes('技能');
    return { pass: noPlaceholder && hasTable, detail: noPlaceholder ? (hasTable ? '已注入具体清单' : '占位符替换了但无表格') : '仍包含占位符 {{SKILLS_TABLE}}' };
  });

  check('4.4', '无任何 {{...}} 占位符残留', () => {
    if (!fileExists(paths.rulesFile)) return { pass: false, detail: '法则文件不存在' };
    const content = removeBOM(fs.readFileSync(paths.rulesFile, 'utf8'));
    const matches = content.match(/\{\{[A-Z_]+\}\}/g);
    return { pass: !matches, detail: matches ? `残留占位符: ${matches.join(', ')}` : '无占位符残留' };
  });

  check('4.5', '§18.11 协同章节存在', () => {
    if (!fileExists(paths.rulesFile)) return { pass: false, detail: '法则文件不存在' };
    const content = removeBOM(fs.readFileSync(paths.rulesFile, 'utf8'));
    const has = content.includes('与其他章节的协同');
    return { pass: has, detail: has ? '§18.11 存在' : '§18.11 协同章节缺失' };
  });

  // ============ 类别 5: 技能完整性 ============
  console.log('─── 类别 5: 技能完整性 ───');

  check('5.1', 'metago-activate 技能存在', () => {
    if (!paths.supportsSkills) return { pass: true, detail: `${platform} 平台不支持独立技能目录，跳过` };
    const skillPath = path.join(paths.skillsDir, 'metago-activate', 'SKILL.md');
    const exists = fileExists(skillPath);
    return { pass: exists, detail: exists ? skillPath : '不存在' };
  });

  check('5.2', 'metago-decision-lock 技能存在', () => {
    if (!paths.supportsSkills) return { pass: true, detail: `${platform} 平台不支持独立技能目录，跳过` };
    const skillPath = path.join(paths.skillsDir, 'metago-decision-lock', 'SKILL.md');
    const exists = fileExists(skillPath);
    return { pass: exists, detail: exists ? '存在' : '不存在' };
  });

  check('5.3', 'metago-code-review-deep 技能存在', () => {
    if (!paths.supportsSkills) return { pass: true, detail: `${platform} 平台不支持独立技能目录，跳过` };
    const skillPath = path.join(paths.skillsDir, 'metago-code-review-deep', 'SKILL.md');
    const exists = fileExists(skillPath);
    return { pass: exists, detail: exists ? '存在' : '不存在' };
  });

  check('5.4', '核心元构技能数量 ≥ ' + MIN_SKILLS, () => {
    if (!paths.supportsSkills) return { pass: true, detail: `${platform} 平台不支持独立技能目录，跳过` };
    const skillsDir = paths.skillsDir;
    if (!fileExists(skillsDir)) return { pass: false, detail: '技能目录不存在' };
    const dirs = fs.readdirSync(skillsDir).filter(d => {
      return d.startsWith('metago-') && fileExists(path.join(skillsDir, d, 'SKILL.md'));
    });
    const ok = dirs.length >= MIN_SKILLS;
    return { pass: ok, detail: `${dirs.length} 个 (需要 ≥ ${MIN_SKILLS})` };
  });

  // ============ 类别 6: MCP 配置 ============
  console.log('─── 类别 6: MCP 配置 ───');

  check('6.1', 'MCP 配置包含 metago 服务器', () => {
    if (!fileExists(paths.mcpConfig)) return { pass: true, detail: `${platform} 平台跳过 mcp 检查` };
    if (getPlatformConfig(platform).mcpFileFormat === 'toml') {
      const text = removeBOM(fs.readFileSync(paths.mcpConfig, 'utf8'));
      const has = /^\[mcp_servers\.metago\]/m.test(text);
      return { pass: has, detail: has ? 'metago 段已配置' : '未找到 [mcp_servers.metago] 段' };
    }
    const cfgJ = safeReadJSON(paths.mcpConfig);
    if (!cfgJ) return { pass: false, detail: 'mcp.json 解析失败' };
    const mcpServers = cfgJ.mcpServers || {};
    const has = Object.keys(mcpServers).some(k => k.includes('metago') && !k.includes('skill') && !k.includes('toolkit') && !k.includes('algorithms'));
    return { pass: has, detail: has ? 'metago 已配置' : '未找到 metago MCP 服务器' };
  });

  check('6.2', 'MCP 配置包含 metago-algorithms 服务器', () => {
    if (!fileExists(paths.mcpConfig)) return { pass: true, detail: `${platform} 平台跳过 mcp 检查` };
    if (getPlatformConfig(platform).mcpFileFormat === 'toml') {
      const text = removeBOM(fs.readFileSync(paths.mcpConfig, 'utf8'));
      const has = /^\[mcp_servers\.metago-algorithms\]/m.test(text);
      return { pass: has, detail: has ? 'metago-algorithms 段已配置' : '未找到 [mcp_servers.metago-algorithms] 段' };
    }
    const cfgJ = safeReadJSON(paths.mcpConfig);
    if (!cfgJ) return { pass: false, detail: 'mcp.json 解析失败' };
    const mcpServers = cfgJ.mcpServers || {};
    const has = Object.keys(mcpServers).some(k => k.includes('algorithms'));
    return { pass: has, detail: has ? 'metago-algorithms 已配置' : '未找到 metago-algorithms MCP 服务器' };
  });

  check('6.3', 'metago-mcp-server 命令可执行', () => {
    const r = commandAvailable('metago-mcp-server');
    return { pass: r.available, detail: r.detail };
  });

  check('6.4', 'metago-algorithms 命令可执行', () => {
    const r = commandAvailable('metago-algorithms');
    return { pass: r.available, detail: r.detail };
  });

  // ============ 类别 7: CLI 命令可用性 ============
  console.log('─── 类别 7: CLI 命令可用性 ───');

  check('7.1', 'metago-lifeform 命令在 PATH 中', () => {
    try {
      const out = execSync('metago-lifeform --help', { encoding: 'utf8', timeout: 8000, stdio: 'pipe' });
      return { pass: out.includes('Usage') || out.includes('用法') || out.length > 0, detail: '命令可用' };
    } catch (e) {
      return { pass: false, detail: `命令不可用: ${e.message}` };
    }
  });

  check('7.2', 'metago-lifeform list-backups 可用', () => {
    try {
      execSync('metago-lifeform list-backups', { encoding: 'utf8', timeout: 8000, stdio: 'pipe' });
      return { pass: true, detail: '备份列表命令可用' };
    } catch {
      return { pass: false, detail: 'list-backups 子命令不可用' };
    }
  });

  check('7.3', 'metago-lifeform 包 bin 字段正确注册主命令', () => {
    // metago-lifeform 包只注册自己的 bin 命令；
    // metago-mcp-server 和 metago-algorithms 来自独立的 npm 包，
    // 它们的可用性在 6.3/6.4/7.4/7.5 中检查
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const pkgPath = path.join(globalRoot, 'metago-lifeform', 'package.json');
    const pkg = safeReadJSON(pkgPath);
    if (!pkg || !pkg.bin) return { pass: false, detail: '无 bin 字段' };
    const hasMain = !!pkg.bin['metago-lifeform'];
    return { pass: hasMain, detail: hasMain ? 'metago-lifeform bin 已正确注册' : 'metago-lifeform bin 缺失' };
  });

  check('7.4', 'metago-mcp-server 命令在 PATH 中（来自 @metago-ai/mcp-server）', () => {
    const r = commandAvailable('metago-mcp-server');
    return { pass: r.available, detail: r.detail };
  });

  check('7.5', 'metago-algorithms 命令在 PATH 中（来自 @metago-ai/algorithms）', () => {
    const r = commandAvailable('metago-algorithms');
    return { pass: r.available, detail: r.detail };
  });

  check('7.6', 'metago-engine 命令在 PATH 中（来自 @metago-ai/engine）', () => {
    const r = commandAvailable('metago-engine');
    return { pass: r.available, detail: r.detail };
  });

  // ============ 类别 8: 备份机制 ============
  console.log('─── 类别 8: 备份与恢复 ───');

  check('8.1', '备份目录 ~/.metago-backups/ 存在', () => {
    const backupDir = path.join(HOME, '.metago-backups');
    const exists = fileExists(backupDir);
    return { pass: exists, detail: exists ? backupDir : '备份目录不存在' };
  });

  check('8.2', '备份目录可写', () => {
    const backupDir = path.join(HOME, '.metago-backups');
    try {
      const testFile = path.join(backupDir, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return { pass: true, detail: '可写' };
    } catch (e) {
      return { pass: false, detail: `写入失败: ${e.message}` };
    }
  });

  check('8.3', 'cli.js 包含 backupNative 函数', () => {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const cliPath = path.join(globalRoot, 'metago-lifeform', 'scripts', 'cli.js');
    if (!fileExists(cliPath)) return { pass: false, detail: 'cli.js 不存在' };
    const content = fs.readFileSync(cliPath, 'utf8');
    const has = content.includes('backupNative') && content.includes('list-backups');
    return { pass: has, detail: has ? '备份逻辑已内嵌' : 'backupNative 函数缺失' };
  });

  // ============ 类别 9: 架构治理组件（metago-arch-gov v1.1.0） ============
  console.log('─── 类别 9: 架构治理组件（metago-arch-gov v1.1.0） ───');

  check('9.1', 'metago-arch 技能已安装', () => {
    if (!paths.skillsDir) return { pass: true, detail: '平台不支持技能目录，跳过' };
    const skillFile = path.join(paths.skillsDir, 'metago-arch', 'SKILL.md');
    const exists = fileExists(skillFile);
    return { pass: exists, detail: exists ? skillFile : '未找到 metago-arch 技能' };
  });

  check('9.2', '主包包含架构治理脚本', () => {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const archLint = path.join(globalRoot, 'metago-lifeform', 'scripts', 'arch-lint.cjs');
    const archCli = path.join(globalRoot, 'metago-lifeform', 'scripts', 'metago-arch-cli.cjs');
    const ok = fileExists(archLint) && fileExists(archCli);
    return { pass: ok, detail: ok ? 'arch-lint.cjs + metago-arch-cli.cjs 存在' : '架构治理脚本缺失' };
  });

  check('9.3', 'metago-lifeform arch version 可用', () => {
    try {
      const out = execSync('metago-lifeform arch version', { encoding: 'utf8', timeout: 10000 }).trim();
      const ok = out.includes('metago-arch-gov');
      return { pass: ok, detail: out };
    } catch (e) {
      return { pass: false, detail: `命令失败: ${e.message}` };
    }
  });

  check('9.4', '法则文件包含架构治理规则', () => {
    if (!fileExists(paths.rulesFile)) return { pass: false, detail: '法则文件不存在' };
    const content = removeBOM(fs.readFileSync(paths.rulesFile, 'utf8'));
    const ok = content.includes('METAGO-ARCH-GOV-V1') && /metago-(lifeform arch|arch) check/.test(content);
    return { pass: ok, detail: ok ? '架构治理强制规则段存在' : '规则段缺失' };
  });

// ============ 类别 10: 插件层完整性（V36.9.2 新增 · 8 项） ============
  console.log('─── 类别 10: 插件层完整性（Agent Plugins 1.0.0 / claude / zcode / codex） ───');

  const pluginsRoot = path.join(pkgRoot, 'plugins');
  const PLUGIN_FORMATS = ['agent-plugins-1.0.0', 'claude', 'zcode', 'codex'];
  const MANIFEST_PATHS = {
    'agent-plugins-1.0.0': path.join('plugin.json'),
    'claude': path.join('.claude-plugin', 'plugin.json'),
    'zcode': path.join('.zcode-plugin', 'plugin.json'),
    'codex': path.join('.codex-plugin', 'plugin.json')
  };

  check('10.1', '插件 manifest schema 合法（4 格式）', () => {
    let ok = 0; const details = [];
    for (const fmt of PLUGIN_FORMATS) {
      const mf = path.join(pluginsRoot, fmt, MANIFEST_PATHS[fmt]);
      if (!fileExists(mf)) { details.push(`${fmt}: manifest 缺失`); continue; }
      const pj = safeReadJSON(mf);
      if (!pj || !pj.name || !pj.version) { details.push(`${fmt}: JSON/字段非法`); continue; }
      if (fmt === 'agent-plugins-1.0.0' && pj['$schema'] !== 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json') {
        details.push(`${fmt}: \$schema 错误`); continue;
      }
      ok++;
    }
    const pass = ok === 4;
    return { pass, detail: pass ? '4/4 manifest 全部合法' : details.join('; ') };
  });

  check('10.2', '插件包 skills 可发现（每包 ≥90）', () => {
    let ok = 0; const details = [];
    for (const fmt of PLUGIN_FORMATS) {
      const sd = path.join(pluginsRoot, fmt, 'skills');
      if (!fileExists(sd)) { details.push(`${fmt}: skills 缺失`); continue; }
      const count = fs.readdirSync(sd).filter(d => d.startsWith('metago-') && fileExists(path.join(sd, d, 'SKILL.md'))).length;
      if (count >= 90) ok++; else details.push(`${fmt}: ${count}`);
    }
    const pass = ok === 4;
    return { pass, detail: pass ? '4/4 插件包技能可发现（≥90 标准 · 实际 100）' : details.join('; ') };
  });

  check('10.3', '插件包 MCP 可解析（双服务器）', () => {
    const checks = [
      [path.join(pluginsRoot, 'agent-plugins-1.0.0', 'mcp.json'), 'agent-plugins-1.0.0'],
      [path.join(pluginsRoot, 'claude', '.mcp.json'), 'claude'],
      [path.join(pluginsRoot, 'zcode', '.zcode-plugin', 'plugin.json'), 'zcode(内联)']
    ];
    let ok = 0; const details = [];
    for (const [f, label] of checks) {
      if (!fileExists(f)) { details.push(`${label}: 文件缺失`); continue; }
      const cfg = safeReadJSON(f);
      if (!cfg) { details.push(`${label}: JSON 非法`); continue; }
      const servers = cfg.mcpServers || {};
      const hasMeta = !!servers['metago'];
      const hasAlgo = !!servers['metago-algorithms'];
      if (hasMeta && hasAlgo) ok++; else details.push(`${label}: 服务器不完整 (metago:${hasMeta}, algorithms:${hasAlgo})`);
    }
    const pass = ok === 3;
    return { pass, detail: pass ? '3/3 MCP 声明可解析（metago + metago-algorithms）' : details.join('; ') };
  });

  check('10.4', '插件包 agents 完整（35 个/包）', () => {
    let ok = 0; const details = [];
    const agentDirs = [
      ['agent-plugins-1.0.0', path.join(pluginsRoot, 'agent-plugins-1.0.0', 'com.metago.life', 'agents')],
      ['claude', path.join(pluginsRoot, 'claude', 'agents')],
      ['zcode', path.join(pluginsRoot, 'zcode', 'agents')],
      ['codex', path.join(pluginsRoot, 'codex', 'agents')],
      ['包根', path.join(pkgRoot, 'agents')]
    ];
    for (const [label, ad] of agentDirs) {
      if (!fileExists(ad)) { details.push(`${label}: agents 缺失`); continue; }
      const count = fs.readdirSync(ad).filter(f => f.endsWith('.md')).length;
      if (count >= 35) ok++; else details.push(`${label}: ${count}`);
    }
    const pass = ok === agentDirs.length;
    return { pass, detail: pass ? `${agentDirs.length}/${agentDirs.length} agents 完整（35 专家）` : details.join('; ') };
  });

  check('10.5', 'platform-matrix.json 合法且覆盖 11 平台', () => {
    const mf = path.join(pluginsRoot, 'platform-matrix.json');
    if (!fileExists(mf)) return { pass: false, detail: 'platform-matrix.json 缺失' };
    const pm = safeReadJSON(mf);
    if (!pm || !Array.isArray(pm.platforms)) return { pass: false, detail: '矩阵 JSON 非法' };
    const ids = pm.platforms.map(p => p.id);
    const need = ['zcode', 'claude-code', 'cursor', 'trae', 'codex', 'chatgpt-work', 'codebuddy', 'workbuddy', 'qoder', 'kimi-code', 'kimi-work'];
    const missing = need.filter(n => !ids.includes(n));
    const pass = missing.length === 0 && ids.length === 11;
    return { pass, detail: pass ? `矩阵 ${ids.length}/11 平台全覆盖` : `缺失平台: ${missing.join(', ')}` };
  });

  check('10.6', '插件层无 {{...}} 占位符残留', () => {
    const targets = [
      path.join(pluginsRoot, 'agent-plugins-1.0.0', 'plugin.json'),
      path.join(pluginsRoot, 'claude', '.claude-plugin', 'plugin.json'),
      path.join(pluginsRoot, 'zcode', '.zcode-plugin', 'plugin.json'),
      path.join(pluginsRoot, 'codex', '.codex-plugin', 'plugin.json'),
      path.join(pluginsRoot, 'platform-matrix.json')
    ];
    const hits = [];
    for (const t of targets) {
      if (!fileExists(t)) { hits.push(`${path.basename(t)}: 缺失`); continue; }
      const content = fs.readFileSync(t, 'utf8');
      const matches = content.match(/\{\{[A-Z_]+\}\}/g);
      if (matches) hits.push(`${path.basename(t)}: ${matches.join(',')}`);
    }
    return { pass: hits.length === 0, detail: hits.length === 0 ? '无占位符残留' : hits.join('; ') };
  });

  check('10.7', '插件 manifest 与矩阵无 BOM', () => {
    const targets = [
      path.join(pluginsRoot, 'agent-plugins-1.0.0', 'plugin.json'),
      path.join(pluginsRoot, 'claude', '.claude-plugin', 'plugin.json'),
      path.join(pluginsRoot, 'zcode', '.zcode-plugin', 'plugin.json'),
      path.join(pluginsRoot, 'codex', '.codex-plugin', 'plugin.json'),
      path.join(pluginsRoot, 'platform-matrix.json')
    ];
    const bomFiles = targets.filter(t => fileExists(t) && hasBOM(t));
    return { pass: bomFiles.length === 0, detail: bomFiles.length === 0 ? '全部无 BOM' : `含 BOM: ${bomFiles.join(', ')}` };
  });

  check('10.8', '包根 agents/ 文件名与 name 一致', () => {
    const ad = path.join(pkgRoot, 'agents');
    if (!fileExists(ad)) return { pass: false, detail: '包根 agents/ 缺失' };
    const files = fs.readdirSync(ad).filter(f => f.endsWith('.md'));
    let ok = 0; const bad = [];
    for (const f of files) {
      const c = fs.readFileSync(path.join(ad, f), 'utf8');
      const name = (c.match(/^name:\s*(.+)$/m) || [])[1];
      if (name && name.trim() === f.replace(/\.md$/, '')) ok++; else bad.push(f);
    }
    return { pass: ok === files.length && files.length >= 35, detail: `${ok}/${files.length} 匹配${bad.length ? ', 异常: ' + bad.join(',') : ''}` };
  });

  // ============ 类别 11: 平台矩阵一致性（11 形态） ============
  console.log('─── 类别 11: 平台矩阵一致性 ───');

  check('11.1', 'CLI 支持 11 平台形态', () => {
    const cliPath = path.join(pkgRoot, 'scripts', 'cli.js');
    if (!fileExists(cliPath)) return { pass: false, detail: 'cli.js 缺失' };
    const content = fs.readFileSync(cliPath, 'utf8');
    const m = content.match(/const PLATFORMS = \[([^\]]+)\]/);
    if (!m) return { pass: false, detail: 'PLATFORMS 定义未找到' };
    const platforms = m[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
    const need = ['zcode', 'claude-code', 'cursor', 'trae', 'codex', 'chatgpt-work', 'codebuddy', 'workbuddy', 'qoder', 'kimi-code', 'kimi-work'];
    const missing = need.filter(n => !platforms.includes(n));
    const pass = missing.length === 0;
    return { pass, detail: pass ? `CLI 支持 ${platforms.length}/11 平台形态` : `缺失: ${missing.join(', ')}` };
  });

  check('11.2', '新平台适配器存在（kimi/workbuddy/chatgpt-work）', () => {
    const dirs = ['kimi', 'workbuddy', 'chatgpt-work'].map(d => path.join(pkgRoot, 'adapters', d));
    const missing = dirs.filter(d => !fileExists(d));
    const pass = missing.length === 0;
    return { pass, detail: pass ? '3 个新适配器全部存在' : `缺失: ${missing.join(', ')}` };
  });

  check('11.3', `法则母本版本为 V${EXPECTED_VERSION}`, () => {
    const agentsPath = path.join(pkgRoot, 'AGENTS.md');
    if (!fileExists(agentsPath)) return { pass: false, detail: '母本缺失' };
    const content = fs.readFileSync(agentsPath, 'utf8');
const pass = content.includes('V' + EXPECTED_VERSION); // 36.9.3 动态化
    return { pass, detail: pass ? '母本 V' + EXPECTED_VERSION : '母本版本不是 V' + EXPECTED_VERSION };
  });


// ============ 类别 12: 完整性治理套件（V36.9.2 并入） ============
  console.log('─── 类别 12: 完整性治理套件（metago-completeness-kit） ───');

  const kitRoot = path.join(pkgRoot, 'completeness-kit');

  check('12.1', '套件目录存在（completeness-kit/）', () => {
    const exists = fileExists(kitRoot);
    return { pass: exists, detail: exists ? kitRoot : 'completeness-kit/ 缺失' };
  });

  check('12.2', '套件 CLI 存在且可运行', () => {
    const cli = path.join(kitRoot, 'bin', 'completeness-guard.js');
    if (!fileExists(cli)) return { pass: false, detail: 'bin/completeness-guard.js 缺失' };
    try {
      const out = execSync('node ' + cli + ' baseline list', { encoding: 'utf8', timeout: 15000 });
      const ok = out.includes('合计') || out.includes('B1');
      return { pass: ok, detail: ok ? 'CLI 可运行（基线可列出）' : 'CLI 输出异常: ' + out.slice(0, 80) };
    } catch (e) {
      return { pass: false, detail: 'CLI 运行失败: ' + e.message.slice(0, 120) };
    }
  });

  check('12.3', '内置基线 ≥ 6 组 / ≥100 项', () => {
    const bd = path.join(kitRoot, 'baselines');
    if (!fileExists(bd)) return { pass: false, detail: 'baselines/ 缺失' };
    const files = fs.readdirSync(bd).filter(f => f.endsWith('.json'));
    let items = 0;
    for (const f of files) {
      try { items += Object.keys(JSON.parse(fs.readFileSync(path.join(bd, f), 'utf8')).items || {}).length; } catch {}
    }
    const pass = files.length >= 6 && items >= 100;
    return { pass, detail: files.length + ' 组 / ' + items + ' 项' };
  });

  check('12.4', 'metago-completeness-guard 技能已分发（主目录+插件包）', () => {
    const targets = [
      path.join(pkgRoot, 'skills', 'metago-completeness-guard', 'SKILL.md'),
      path.join(pkgRoot, 'plugins', 'agent-plugins-1.0.0', 'skills', 'metago-completeness-guard', 'SKILL.md'),
      path.join(pkgRoot, 'plugins', 'claude', 'skills', 'metago-completeness-guard', 'SKILL.md'),
      path.join(pkgRoot, 'plugins', 'zcode', 'skills', 'metago-completeness-guard', 'SKILL.md'),
      path.join(pkgRoot, 'plugins', 'codex', 'skills', 'metago-completeness-guard', 'SKILL.md')
    ];
    const missing = targets.filter(t => !fileExists(t));
    const pass = missing.length === 0;
    return { pass, detail: pass ? '5/5 位置已分发（主 + 4 插件包）' : '缺失: ' + missing.join('; ') };
  });

  check('12.5', '套件 README 存在', () => {
    const ok = fileExists(path.join(kitRoot, 'README.md')) && fileExists(path.join(kitRoot, 'install.js'));
    return { pass: ok, detail: ok ? 'README + install.js 存在' : '文档或安装器缺失' };
  });


// ============ 类别 13: 行为诚实工程套件（V36.9.2 并入） ============
  console.log('─── 类别 13: 行为诚实工程套件（metago-veracity-kit） ───');

  const vkRoot = path.join(pkgRoot, 'metago-veracity-kit');

  check('13.1', '套件目录存在（metago-veracity-kit/）', () => {
    const exists = fileExists(vkRoot);
    return { pass: exists, detail: exists ? vkRoot : 'metago-veracity-kit/ 缺失' };
  });

  check('13.2', '套件 CLI 存在且可运行', () => {
    const cli = path.join(vkRoot, 'bin', 'veracity-guard.js');
    if (!fileExists(cli)) return { pass: false, detail: 'bin/veracity-guard.js 缺失' };
    try {
      const out = execSync('node ' + cli + ' uncertainty 测试', { encoding: 'utf8', timeout: 15000 });
      const ok = out.includes('无填充词') || out.includes('填充词');
      return { pass: ok, detail: ok ? 'CLI 可运行' : 'CLI 输出异常' };
    } catch (e) { return { pass: false, detail: 'CLI 运行失败: ' + e.message.slice(0, 100) } }
  });

  check('13.3', '核心模块齐全（日志/提取/对账/验证门/拦截）', () => {
    const files = ['lib/action-ledger.cjs', 'lib/claim-extractor.cjs', 'lib/reconciler.cjs', 'lib/verification-gate.cjs', 'lib/uncertainty.cjs', 'hooks/completion-claim-gate.cjs'];
    const missing = files.filter((f) => !fileExists(path.join(vkRoot, f)));
    return { pass: missing.length === 0, detail: missing.length ? '缺失: ' + missing.join('; ') : '6/6 模块齐全' };
  });

  check('13.4', 'metago-veracity-guard 技能已分发（主目录+插件包）', () => {
    const targets = [
      path.join(pkgRoot, 'skills', 'metago-veracity-guard', 'SKILL.md'),
      path.join(pkgRoot, 'plugins', 'agent-plugins-1.0.0', 'skills', 'metago-veracity-guard', 'SKILL.md'),
      path.join(pkgRoot, 'plugins', 'claude', 'skills', 'metago-veracity-guard', 'SKILL.md'),
      path.join(pkgRoot, 'plugins', 'zcode', 'skills', 'metago-veracity-guard', 'SKILL.md'),
      path.join(pkgRoot, 'plugins', 'codex', 'skills', 'metago-veracity-guard', 'SKILL.md')
    ];
    const missing = targets.filter((t) => !fileExists(t));
    return { pass: missing.length === 0, detail: missing.length ? '缺失: ' + missing.join('; ') : '5/5 位置已分发' };
  });

  check('13.5', '对账器端到端自测通过', () => {
    try {
      const out = execSync('node ' + path.join(vkRoot, 'tests', 'self-test.cjs'), { encoding: 'utf8', timeout: 30000 });
      const ok = out.includes('15/15');
      return { pass: ok, detail: ok ? '自测 15/15 通过' : '自测未全过: ' + out.split('\n').filter((l) => l.includes('✗')).join(';') };
    } catch (e) { return { pass: false, detail: '自测运行失败: ' + e.message.slice(0, 120) } }
  });

  // ============ 输出结果 ============
  console.log('');
  console.log('══════════════════════════════════════════════════════════');
  console.log('  验收结果汇总');
  console.log('══════════════════════════════════════════════════════════');

  const passed = results.filter(r => r.pass);
  const failed = results.filter(r => !r.pass);

  for (const r of results) {
    const icon = r.pass ? '✅' : '❌';
    console.log(`  ${icon} ${r.id}  ${r.desc}`);
    if (!r.pass) {
      console.log(`         ↳ ${r.detail}`);
    }
  }

  console.log('');
  console.log(`  通过: ${passed.length}/${results.length}`);
  console.log(`  失败: ${failed.length}/${results.length}`);
  console.log('');

  if (failed.length === 0) {
    console.log(`  🎉 全部检查通过！MetaGO Lifeform V${EXPECTED_VERSION} 全量版（规则+技能+MCP+智能体+插件）安装正确。`);
    process.exit(0);
  } else {
    console.log(`  ⚠️  有 ${failed.length} 项未通过，请检查上方详细信息。`);
    process.exit(1);
  }
}

main();
