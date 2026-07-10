const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'packages', 'docs-site');

const replacements = [
  // config.ts
  { file: '.vitepress/config.ts', from: '39 技能 + 37 tools + 36 公理 有序呈现', to: '39 技能 + 53 tools + 8 公理 有序呈现' },
  { file: '.vitepress/config.ts', from: '元构超级智能生命体 — 让智能，学会进化。39 技能 · 36 公理 · 7 平台适配 · MCP 即开即用。', to: 'MetaGO Agent Harness（驭智层）— 让 AI 学会自我进化。39 技能 · 53 MCP tools · 8 公理 · Engine V2 · 7 平台适配。' },
  { file: '.vitepress/config.ts', from: 'MetaGO 生命体', to: 'MetaGO Agent Harness' },
  // skills/overview.md
  { file: 'skills/overview.md', from: '22 + 20 - 7 + 2 = 37', to: '53 tools = 39 skills + 14 toolkit (Engine V2 硬驱动)' },
  { file: 'skills/overview.md', from: '共 37 tools', to: '共 53 tools' },
  { file: 'skills/overview.md', from: '22 + 20 - 7 + 2', to: '53 tools (含 Engine V2 toolkit)' },
  { file: 'skills/overview.md', from: '36 条核心公理', to: '8 条公理 + 7 条属性' },
  { file: 'skills/overview.md', from: 'MCP Server 37 tools', to: 'MCP Server 53 tools' },
  // api/dashboard.md
  { file: 'api/dashboard.md', from: '37 tools 详解', to: '53 tools 详解' },
  // README.md
  { file: 'README.md', from: '39 技能 + 36 公理 + 53 tools', to: '39 技能 + 8 公理 + 53 tools' },
  { file: 'README.md', from: '36 条核心公理', to: '8 条公理 + 7 条属性' },
  { file: 'README.md', from: '39 技能 + 53 tools + 36 公理', to: '39 技能 + 53 tools + 8 公理' },
  // demo.md
  { file: 'demo.md', from: '36 条核心公理', to: '8 条公理 + 7 条属性' },
  // guide/quickstart.md
  { file: 'guide/quickstart.md', from: '36 公理 + 43 属性', to: '8 公理 + 7 属性' },
  { file: 'guide/quickstart.md', from: '36 条核心公理', to: '8 条公理 + 7 条属性' },
  { file: 'guide/quickstart.md', from: '37 tools 详解', to: '53 tools 详解' },
  // guide/introduction.md
  { file: 'guide/introduction.md', from: '36 条核心公理 + 43 条根本属性 + 6 条运行协议', to: '8 条公理 + 7 条属性 + 6 条运行协议' },
  { file: 'guide/introduction.md', from: '36 公理 + 43 属性', to: '8 公理 + 7 属性' },
  { file: 'guide/introduction.md', from: '37 tools + 8 prompts', to: '53 tools + 8 prompts' },
  { file: 'guide/introduction.md', from: '36 公理 + 125 引擎 + 754 专利', to: '8 公理 + Engine V2 (KMWI + 进化引擎 + 技能生成器)' },
  // engine/axioms.md
  { file: 'engine/axioms.md', from: '# 36 条核心公理', to: '# 8 条公理 + 7 条属性' },
  { file: 'engine/axioms.md', from: '36 条核心公理，其中 8 条为根本公理（A1-A8），其余为衍生公理', to: '8 条核心公理（A1-A5, A34-A36）+ 7 条根本属性（D37-D43），构成生命体基因' },
];

let successCount = 0;
let skipCount = 0;

replacements.forEach(r => {
  const filePath = path.join(docsDir, r.file);
  try {
    if (!fs.existsSync(filePath)) {
      console.log('SKIP (not found): ' + r.file);
      skipCount++;
      return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(r.from)) {
      content = content.split(r.from).join(r.to);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('OK: ' + r.file + ' — replaced');
      successCount++;
    } else {
      console.log('SKIP (not matched): ' + r.file);
      skipCount++;
    }
  } catch (e) {
    console.log('ERROR: ' + r.file + ' — ' + e.message);
    skipCount++;
  }
});

console.log('\nTotal: ' + successCount + ' replaced, ' + skipCount + ' skipped');
