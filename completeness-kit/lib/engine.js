/**
 * lib/engine.js — 完整性验证引擎
 * 对目标文档执行基线覆盖检查 + 元数据检查，输出可复现的验证报告。
 */
const fs = require('fs');
const path = require('path');
const { loadBaselines, countItems } = require('./baseline');

function verifyDoc(docPath, opts = {}) {
  if (!fs.existsSync(docPath)) {
    return { ok: false, error: `文档不存在: ${docPath}`, passed: 0, total: 0, failures: ['文档不存在'] };
  }
  const doc = fs.readFileSync(docPath, 'utf8');
  const baselines = loadBaselines(opts);
  let total = 0, passed = 0;
  const failures = [];

  for (const b of baselines) {
    for (const [item, keywords] of Object.entries(b.items)) {
      total++;
      const hit = keywords.filter(k => doc.includes(k));
      if (hit.length === keywords.length) passed++;
      else failures.push(`  ✗ ${b.id}/${item} 缺关键词: ${keywords.filter(k => !doc.includes(k)).join(', ')}`);
    }
  }

  // 元数据检查（可配置）
  const meta = opts.meta || {
    '章节完整性': { test: (doc.match(/^#{1,2} /gm) || []).length >= (opts.minSections || 10) },
    '无占位符': { test: !/\{\{[A-Z_]+\}\}/.test(doc) },
    '无 TODO 残留': { test: !/TODO|待补充|（待补/.test(doc) }
  };
  for (const [name, m] of Object.entries(meta)) {
    total++;
    if (m.test) passed++;
    else failures.push(`  ✗ 元数据/${name}`);
  }

  return {
    ok: failures.length === 0,
    passed,
    total,
    failures,
    baselines: baselines.map(b => b.id).join(', '),
    doc: docPath,
    ts: new Date().toISOString()
  };
}

function renderReport(r) {
  const lines = [];
  lines.push('══════════════════════════════════════════════════════════');
  lines.push('  完整性验证报告（MetaGO Completeness Kit）');
  lines.push('══════════════════════════════════════════════════════════');
  lines.push(`  目标文档: ${r.doc}`);
  lines.push(`  基线: ${r.baselines}`);
  lines.push(`  覆盖: ${r.passed}/${r.total}`);
  if (r.failures.length) {
    lines.push('\n  缺口清单:');
    lines.push(r.failures.join('\n'));
    lines.push('\n  ❌ 存在缺口 —— 禁止宣称"完整"。补齐后重新验证。');
  } else {
    lines.push('\n  ✅ 当前基线覆盖全绿。');
    lines.push('  注意: 本报告仅证明"当前基线清单"覆盖；基线之外的新标准/新功能');
    lines.push('       需更新基线清单（completeness-guard baseline add）后重新验证。');
  }
  return lines.join('\n');
}

module.exports = { verifyDoc, renderReport, countItems };
