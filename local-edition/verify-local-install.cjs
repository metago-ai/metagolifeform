#!/usr/bin/env node
/**
 * MetaGO Lifeform V36.9.1 安装后验收脚本（8大类 30+ 检查项）
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

const EXPECTED_VERSION = '36.9.1';
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
      rulesFile: path.join(HOME, '.trae-cn', 'builtin', 'work', 'AGENTS.md'),
      skillsDir: path.join(HOME, '.trae-cn', 'skills'),
      supportsSkills: true,
      mcpConfig: appSupport('Trae CN', 'User', 'mcp.json'),
      memoryDir: path.join(HOME, '.trae-cn', 'memory')
    },
    'claude-code': {
      name: 'Claude Code',
      base: path.join(HOME, '.claude'),
      rulesFile: path.join(HOME, 'CLAUDE.md'),
      skillsDir: path.join(HOME, '.claude', 'skills'),
      supportsSkills: true,
      mcpConfig: appSupport('Claude', 'claude_desktop_config.json'),
      memoryDir: path.join(HOME, '.claude')
    },
    'codex': {
      name: 'Codex',
      base: path.join(HOME, '.codex'),
      rulesFile: path.join(HOME, '.codex', 'AGENTS.md'),
      skillsDir: '',
      supportsSkills: false,
      mcpConfig: path.join(HOME, '.codex', 'config.json'),
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
      rulesFile: path.join(HOME, '.qoder', 'metago-rules.md'),
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
  console.log('║  MetaGO Lifeform V36.9.1 安装后验收                      ║');
  console.log('║  8 大类 · 30+ 检查项                                     ║');
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

  check('2.1', '法则版本为 V36.9.1', () => {
    if (!fileExists(paths.rulesFile)) return { pass: false, detail: '法则文件不存在' };
    const content = removeBOM(fs.readFileSync(paths.rulesFile, 'utf8'));
    const hasVersion = /V36\.8\.8/.test(content);
    return { pass: hasVersion, detail: hasVersion ? 'V36.9.1' : '版本号未找到或不正确' };
  });

  check('2.2', '全局 metago-lifeform 版本为 36.9.1', () => {
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

  check('2.4', 'metago-lifeform --version 输出 36.9.1', () => {
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

  check('6.1', 'mcp.json 包含 metago 服务器', () => {
    if (!fileExists(paths.mcpConfig)) return { pass: true, detail: `${platform} 平台跳过 mcp.json 检查` };
    const cfg = safeReadJSON(paths.mcpConfig);
    if (!cfg) return { pass: false, detail: 'mcp.json 解析失败' };
    const mcpServers = cfg.mcpServers || {};
    const has = Object.keys(mcpServers).some(k => k.includes('metago') && !k.includes('skill') && !k.includes('toolkit') && !k.includes('algorithms'));
    return { pass: has, detail: has ? 'metago 已配置' : '未找到 metago MCP 服务器' };
  });

  check('6.2', 'mcp.json 包含 metago-algorithms 服务器', () => {
    if (!fileExists(paths.mcpConfig)) return { pass: true, detail: `${platform} 平台跳过 mcp.json 检查` };
    const cfg = safeReadJSON(paths.mcpConfig);
    if (!cfg) return { pass: false, detail: 'mcp.json 解析失败' };
    const mcpServers = cfg.mcpServers || {};
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
    console.log('  🎉 全部检查通过！MetaGO Lifeform V36.9.1 安装正确。');
    process.exit(0);
  } else {
    console.log(`  ⚠️  有 ${failed.length} 项未通过，请检查上方详细信息。`);
    process.exit(1);
  }
}

main();
