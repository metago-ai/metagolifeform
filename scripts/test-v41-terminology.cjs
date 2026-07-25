#!/usr/bin/env node
/**
 * MetaGO V4.1 术语统一强制校验（AGENTS.md 13.2 第 11 条）
 *
 * 扫描所有文档/代码，禁止使用以下过时/错误表述：
 *   AI Harness / AI 运行时控制层 / 生命体 Harness 范式 / MetaGO Lifeform Kit /
 *   above the model / 核心产品是 Agent Harness / 生命体范式 / 驭智层范式 /
 *   Harness 范式 / Harness 产品 / 产品·Harness / 模型之外的运行时控制层
 *
 * 依据：project_memory.md 第四轮概念定稿 + 第五轮术语统一强制规范 + 第七轮"模型之外"概念纠错。
 * 正确术语：MetaGO Agent Harness（智能体运行时控制层套件 · 驭智层）。
 *
 * 用法：node scripts/test-v41-terminology.cjs
 * 退出码：0 全部通过；1 发现禁用表述。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 禁用表述清单（与 AGENTS.md 13.2-11 保持同步；修改清单时两处一起改）
const FORBIDDEN = [
  'AI Harness',
  'AI 运行时控制层',
  '生命体 Harness 范式',
  'MetaGO Lifeform Kit',
  'above the model',
  '核心产品是 Agent Harness',
  '生命体范式',
  '驭智层范式',
  'Harness 范式',
  'Harness 产品',
  '产品·Harness',
  '模型之外的运行时控制层',
];

// 豁免：法则原文（禁用清单的定义处）、本脚本自身、历史变更日志
const EXEMPT = [
  /^AGENTS\.md$/i,
  /^CHANGELOG\.md$/i,
  /^scripts[\\/]test-v41-terminology\.cjs$/i,
  /^docs[\\/]STRATEGY-EXECUTION-LOG\.md$/i,
];

// 行级豁免：该行是在"定义/说明禁用规则"而非"使用"禁用表述
const DEFINITIONAL_MARKERS = ['禁用', '禁止', 'forbidden', 'banned', '违规', '不得使用', '不允许出现'];

const SCAN_EXTS = ['.md', '.js', '.cjs', '.mjs', '.ts', '.json', '.html', '.ps1', '.sh', '.txt'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.metago-backup')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (SCAN_EXTS.includes(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

const hits = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (EXEMPT.some((re) => re.test(rel))) continue;
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (DEFINITIONAL_MARKERS.some((m) => line.toLowerCase().includes(m.toLowerCase()))) return;
    for (const term of FORBIDDEN) {
      if (line.toLowerCase().includes(term.toLowerCase())) {
        hits.push({ file: rel, line: i + 1, term, excerpt: line.trim().slice(0, 100) });
      }
    }
  });
}

console.log('==========================================');
console.log('  MetaGO V4.1 术语统一校验');
console.log('==========================================');
if (hits.length === 0) {
  console.log(`  ✅ 通过：扫描 ${walk(ROOT).length} 个文件，未发现 ${FORBIDDEN.length} 条禁用表述`);
  process.exit(0);
}
console.log(`  ❌ 发现 ${hits.length} 处禁用表述：\n`);
for (const h of hits) {
  console.log(`  ${h.file}:${h.line}  [${h.term}]`);
  console.log(`    ${h.excerpt}`);
}
console.log('\n  正确术语：MetaGO Agent Harness（智能体运行时控制层套件 · 驭智层）');
process.exit(1);
