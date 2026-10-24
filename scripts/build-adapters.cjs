#!/usr/bin/env node
/**
 * build-adapters.cjs - 从 AGENTS.md 母本生成所有7个平台的适配模板
 * 
 * 用法: node scripts/build-adapters.cjs
 * 
 * 此脚本读取 cli.js 中的平台配置和生成逻辑，
 * 为每个平台生成对应的适配模板文件到 adapters/<platform>/ 目录。
 * 生成的模板是静态的（与动态安装生成的一致），用于：
 * 1. 仓库内查看和审查各平台版本
 * 2. 旧版直接复制模板的安装方式兼容
 * 3. npm 包发布时附带参考模板
 */

const fs = require('fs');
const path = require('path');

const PKG_ROOT = path.resolve(__dirname, '..');
const ADAPTERS_DIR = path.join(PKG_ROOT, 'adapters');
const SKILLS_DIR = path.join(PKG_ROOT, 'skills');

function removeBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) return content.slice(1);
  return content;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
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

function scanAvailableSkills() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs.readdirSync(SKILLS_DIR)
    .filter(d => {
      const skillPath = path.join(SKILLS_DIR, d, 'SKILL.md');
      return fs.existsSync(skillPath) && d.startsWith('metago-');
    });
}

const PLATFORM_CONFIGS = {
  'trae': {
    name: 'Trae',
    adapterDir: 'trae',
    templateFile: 'rules.template.md',
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 55 },
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
    adapterDir: 'claude-code',
    templateFile: 'CLAUDE.md.template',
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 55 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'codex': {
    name: 'Codex',
    adapterDir: 'codex',
    templateFile: 'AGENTS.md.template',
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 55 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'cursor': {
    name: 'Cursor',
    adapterDir: 'cursor',
    templateFile: 'metago.mdc.template',
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 55 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'codebuddy': {
    name: 'CodeBuddy',
    adapterDir: 'codebuddy',
    templateFile: 'CODEBUDDY.md.template',
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 55 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'qoder': {
    name: 'Qoder',
    adapterDir: 'qoder',
    templateFile: 'metago-rules.md.template',
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 55 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'zcode': {
    name: 'ZCode',
    adapterDir: 'zcode',
    templateFile: 'CLAUDE.md.template',
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 55 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'chatgpt-work': {
    name: 'ChatGPT Work',
    adapterDir: 'chatgpt-work',
    templateFile: 'AGENTS.md.template',
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 55 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'workbuddy': {
    name: 'WorkBuddy',
    adapterDir: 'workbuddy',
    templateFile: 'rules.template.md',
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 55 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'kimi-code': {
    name: 'Kimi Code',
    adapterDir: 'kimi',
    templateFile: 'AGENTS.md.template',
    mcpServers: [
      { name: 'metago', command: 'metago-mcp-server', tools: 55 },
      { name: 'metago-algorithms', command: 'metago-algorithms', tools: 57, algorithms: 927 }
    ]
  },
  'kimi-work': {
    name: 'Kimi Work',
    adapterDir: 'kimi',
    templateFile: 'AGENTS.kimi-work.template',
    mcpServers: []
  }
};

const HEAD_REPLACEMENTS = {
  'claude-code': { 'Trae 第一人称视角撰写': 'Claude Code 第一人称视角撰写', '本母本以 Trae 为运行时撰写': '本母本以 Claude Code 为运行时撰写', '把"Trae"读作': '把"Claude Code"读作' },
  'codex': { 'Trae 第一人称视角撰写': 'Codex 第一人称视角撰写', '本母本以 Trae 为运行时撰写': '本母本以 Codex 为运行时撰写', '把"Trae"读作': '把"Codex"读作' },
  'cursor': { 'Trae 第一人称视角撰写': 'Cursor 第一人称视角撰写', '本母本以 Trae 为运行时撰写': '本母本以 Cursor 为运行时撰写', '把"Trae"读作': '把"Cursor"读作' },
  'codebuddy': { 'Trae 第一人称视角撰写': 'CodeBuddy 第一人称视角撰写', '本母本以 Trae 为运行时撰写': '本母本以 CodeBuddy 为运行时撰写', '把"Trae"读作': '把"CodeBuddy"读作' },
  'qoder': { 'Trae 第一人称视角撰写': 'Qoder 第一人称视角撰写', '本母本以 Trae 为运行时撰写': '本母本以 Qoder 为运行时撰写', '把"Trae"读作': '把"Qoder"读作' },
  'zcode': { 'Trae 第一人称视角撰写': 'ZCode 第一人称视角撰写', '本母本以 Trae 为运行时撰写': '本母本以 ZCode 为运行时撰写', '把"Trae"读作': '把"ZCode"读作' },
  'chatgpt-work': { 'Trae 第一人称视角撰写': 'ChatGPT Work 第一人称视角撰写', '本母本以 Trae 为运行时撰写': '本母本以 ChatGPT Work 为运行时撰写', '把"Trae"读作': '把"ChatGPT Work"读作' },
  'workbuddy': { 'Trae 第一人称视角撰写': 'WorkBuddy 第一人称视角撰写', '本母本以 Trae 为运行时撰写': '本母本以 WorkBuddy 为运行时撰写', '把"Trae"读作': '把"WorkBuddy"读作' },
  'kimi-code': { 'Trae 第一人称视角撰写': 'Kimi Code 第一人称视角撰写', '本母本以 Trae 为运行时撰写': '本母本以 Kimi Code 为运行时撰写', '把"Trae"读作': '把"Kimi Code"读作' },
  'kimi-work': { 'Trae 第一人称视角撰写': 'Kimi Work 第一人称视角撰写', '本母本以 Trae 为运行时撰写': '本母本以 Kimi Work 为运行时撰写', '把"Trae"读作': '把"Kimi Work"读作' },
};

const PHRASE_REPLACEMENTS = {
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
    '.trae-cn/': '.codex/'
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
    'Trae 系统中': 'ChatGPT Work 中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'ChatGPT Work 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'ChatGPT Work 记忆体系',
    'Trae 的 skills/ 目录': 'ChatGPT Work 的 skills/ 目录',
    'Trae 平台': 'ChatGPT Work 平台',
    '.trae-cn/': '.chatgpt/'
  },
  'workbuddy': {
    'Trae 系统中': 'WorkBuddy 中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'WorkBuddy 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'WorkBuddy 记忆体系',
    'Trae 的 skills/ 目录': 'WorkBuddy 的 skills/ 目录',
    'Trae 平台': 'WorkBuddy 平台',
    '.trae-cn/': '.workbuddy/'
  },
  'kimi-code': {
    'Trae 系统中': 'Kimi Code 中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'Kimi Code 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'Kimi Code 记忆体系',
    'Trae 的 skills/ 目录': 'Kimi Code 的 skills/ 目录',
    'Trae 平台': 'Kimi Code 平台',
    '.trae-cn/': '.kimi-code/'
  },
  'kimi-work': {
    'Trae 系统中': 'Kimi Work 中',
    'Trae 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）': 'Kimi Work 的能力体系（规则系统、技能系统、工具系统、记忆系统）',
    'Trae 系统记忆体系': 'Kimi Work 记忆体系',
    'Trae 的 skills/ 目录': 'Kimi Work 的 skills/ 目录',
    'Trae 平台': 'Kimi Work 平台',
    '.trae-cn/': '.kimi-work/'
  }
};

function generateMcpServersTable(mcpServers) {
  let totalTools = 0;
  let rows = '| Server ID | 工具数 | 说明 |\n|-----------|--------|------|\n';
  for (const srv of mcpServers) {
    totalTools += srv.tools;
    const desc = srv.algorithms ? `${srv.tools} 工具 · ${srv.algorithms} 算法` : `${srv.tools} 工具`;
    rows += `| ${srv.name} | ${srv.tools} | ${desc} |\n`;
  }
  rows += `| **总计** | **${totalTools}** | **${mcpServers.length} 个 MCP 服务器** |\n`;
  return rows;
}

function generateSkillsTable(availableSkills) {
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
  };

  const coreSkills = new Set();
  for (const skills of Object.values(skillCategories)) {
    for (const s of skills) coreSkills.add(s);
  }
  const expertSkills = availableSkills.filter(s => s.startsWith('metago-') && !coreSkills.has(s));

  let table = '| 能力族 | 技能 |\n|--------|------|\n';
  for (const [category, skills] of Object.entries(skillCategories)) {
    const existing = skills.filter(s => availableSkills.includes(s));
    if (existing.length > 0) {
      table += `| ${category} | ${existing.join(', ')} |\n`;
    }
  }
  if (expertSkills.length > 0) {
    table += `| 专家团 | ${expertSkills.join(', ')} |\n`;
  }
  table += `| **总计** | **${availableSkills.length} 个技能** |\n`;
  return table;
}

function generatePlatformLaw(platformId, availableSkills) {
  const cfg = PLATFORM_CONFIGS[platformId];
  const motherPath = path.join(PKG_ROOT, 'AGENTS.md');
  let content = fs.readFileSync(motherPath, 'utf8');
  content = removeBOM(content);

  const replacements = Object.assign({}, PHRASE_REPLACEMENTS[platformId] || {});
  /* DEF-037 修复：母本已改为以「DeepSeek Harness」为运行时撰写，
     原替换表只认「Trae」，导致 11 个平台模板内容完全相同。此处统一补规则。 */
  if (cfg && cfg.name && cfg.name !== 'DeepSeek Harness') {
    const PN = cfg.name;
    replacements['DeepSeek Harness 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）'] =
      PN + ' 的能力体系（规则系统、技能系统、工具系统、记忆系统）';
    replacements['本母本以 DeepSeek Harness 为运行时撰写'] = '本母本以 ' + PN + ' 为运行时撰写';
    replacements['DeepSeek Harness 第一人称视角撰写'] = PN + ' 第一人称视角撰写';
    replacements['DeepSeek Harness 系统中'] = PN + ' 系统中';
    replacements['DeepSeek Harness 系统记忆'] = PN + ' 系统记忆';
    replacements['DeepSeek Harness 自动摘要'] = PN + ' 自动摘要';
    replacements['DeepSeek Harness 持久化记忆体系'] = PN + ' 持久化记忆体系';
    replacements['DeepSeek Harness 的 skills/ 目录'] = PN + ' 的 skills/ 目录';
    replacements['DeepSeek Harness 平台'] = PN + ' 平台';
    replacements['DeepSeek Harness'] = PN;
  }
  for (const [from, to] of Object.entries(replacements)) {
    content = content.split(from).join(to);
  }
  const headReplacements = HEAD_REPLACEMENTS[platformId] || {};
  for (const [from, to] of Object.entries(headReplacements)) {
    content = content.split(from).join(to);
  }
  // 反引号 skills 目录（母本用 `skills/` 反引号形式，PHRASE 表为无反引号版本）
  content = content.split('Trae 的 `skills/` 目录').join(`${cfg.name} 的 \`skills/\` 目录`);
  // 补充变体替换（PHRASE 表未覆盖的简写/反斜杠形式）
  content = content.split('Trae 系统记忆体系').join(`${cfg.name} 记忆体系`);
  content = content.split('Trae 系统记忆').join(`${cfg.name} 记忆体系`);
  content = content.split('Trae 自动摘要').join(`${cfg.name} 自动摘要`);
  content = content.split('Trae 平台').join(`${cfg.name} 平台`);
  content = content.split('Trae 系统').join(`${cfg.name} 系统`);
  content = content.split('.trae-cn\\').join(`.${platformId === 'trae' ? 'trae-cn' : platformId}\\`);
  content = content.split('非 Trae 用户').join(`非 ${cfg.name} 用户`);

  content = content.replace(/\{\{PLATFORM_NAME\}\}/g, cfg.name);
  content = content.replace(/\{\{SKILLS_COUNT\}\}/g, String(availableSkills.length));
  content = content.replace(/\{\{ARCH_RULES_PATH\}\}/g, 'skills/metago-arch/rules/架构治理规则v1.md');
  content = content.replace(/\{\{PLATFORM_MEMORY_PATH_PLACEHOLDER\}\}/g, `~/.${platformId === 'trae' ? 'trae-cn' : platformId}/`);

  const mcpTable = generateMcpServersTable(cfg.mcpServers);
  const skillsTable = generateSkillsTable(availableSkills);
  content = content.replace(/\{\{MCP_SERVERS_TABLE\}\}/g, mcpTable);
  content = content.replace(/\{\{SKILLS_TABLE\}\}/g, skillsTable);

  return content;
}

function main() {
  const availableSkills = scanAvailableSkills();
  console.log(`扫描到 ${availableSkills.length} 个技能`);

  const motherContent = fs.readFileSync(path.join(PKG_ROOT, 'AGENTS.md'), 'utf8');
  console.log(`母本 AGENTS.md 已加载，包含第十八章: ${motherContent.includes('第十八章')}`);

  const platforms = Object.keys(PLATFORM_CONFIGS);
  let okCount = 0;

  for (const platformId of platforms) {
    const cfg = PLATFORM_CONFIGS[platformId];
    const adapterDir = path.join(ADAPTERS_DIR, cfg.adapterDir);
    const templatePath = path.join(adapterDir, cfg.templateFile);

    console.log(`\n生成 ${cfg.name} 平台模板...`);

    const content = generatePlatformLaw(platformId, availableSkills);

    if (content.charCodeAt(0) === 0xFEFF) {
      console.log(`  [WARNING] 生成内容包含 BOM，移除中...`);
    }

    fs.writeFileSync(templatePath, content, 'utf8');

    const hasBOM = fs.readFileSync(templatePath).slice(0, 3).equals(Buffer.from([0xEF, 0xBB, 0xBF]));
    const pkgJson = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));
    const hasVersion = content.includes(`V${pkgJson.version}`);
    const hasChapter18 = content.includes('第十八章');
    const hasMcpTable = !content.includes('{{MCP_SERVERS_TABLE}}');
    const hasSkillsTable = !content.includes('{{SKILLS_TABLE}}');
    const hasNoPlaceholders = !content.includes('{{PLATFORM_NAME}}') && !content.includes('{{') ;

    console.log(`  版本 V${pkgJson.version}: ${hasVersion ? '✅' : '❌'}`);
    console.log(`  无 BOM: ${!hasBOM ? '✅' : '❌'}`);
    console.log(`  第十八章: ${hasChapter18 ? '✅' : '❌'}`);
    console.log(`  MCP清单已注入: ${hasMcpTable ? '✅' : '❌'}`);
    console.log(`  技能清单已注入: ${hasSkillsTable ? '✅' : '❌'}`);
    console.log(`  无占位符残留: ${hasNoPlaceholders ? '✅' : '❌'}`);

    if (hasVersion && !hasBOM && hasChapter18 && hasMcpTable && hasSkillsTable && hasNoPlaceholders) {
      okCount++;
      console.log(`  [OK] ${templatePath}`);
    } else {
      console.log(`  [FAIL] 模板生成验证失败`);
    }
  }

  console.log(`\n========================================`);
  console.log(`  适配模板生成完成: ${okCount}/${platforms.length} 通过`);
  console.log(`========================================`);

  if (okCount === platforms.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();
