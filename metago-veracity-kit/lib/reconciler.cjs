#!/usr/bin/env node
/**
 * lib/reconciler.cjs — 宣称-事实对账器
 * 逐条核对：宣称断言 vs 行为日志。
 * 状态：confirmed（日志有对应操作）/ unconfirmed（日志无记录）/ contradicted（日志显示失败）
 */
const ledger = require('./action-ledger.cjs');
const { extract } = require('./claim-extractor.cjs');

const TOOL_BY_CLAIM = {
  modified: ['Edit', 'edit', 'write', 'Write', 'applyEdits'],
  created: ['Write', 'write', 'create', 'file:save', 'skill:create'],
  tested: ['test', 'run', 'exec', 'execute', 'verify', 'Bash'],
  testedCmd: ['Bash', 'exec', 'execute', 'run', 'test'],
  deleted: ['delete', 'remove', 'unlink', 'rm'],
  count: null
};

function reconcile(text, opts = {}) {
  const claims = extract(text);
  const entries = ledger.query(null, opts.ledgerFile);
  const windowMs = (opts.windowMinutes || 120) * 60000;
  const now = Date.now();

  const results = claims.map((claim) => {
    const tools = TOOL_BY_CLAIM[claim.type];
    if (claim.type === 'count') {
      // 数量断言：核对计数类操作数量
      const createEntries = entries.filter((e) => tools === null || TOOL_BY_CLAIM.created.includes(e.tool)).length;
      const n = parseInt(claim.target, 10);
      return {
        claim: claim.raw,
        status: createEntries >= n ? 'confirmed' : 'unconfirmed',
        evidence: `日志中创建类操作 ${createEntries} 次，宣称 ${n}`
      };
    }
    // 文件/命令目标匹配
    const target = claim.target.toLowerCase();
    const recent = entries.filter((e) => now - new Date(e.ts).getTime() <= windowMs);
    const match = recent.find((e) => {
      const toolOk = !tools || tools.includes(e.tool);
      const fileOk = (e.files || []).some((f) => f.toLowerCase().includes(target)) ||
        (e.input || '').toLowerCase().includes(target) ||
        (e.output || '').toLowerCase().includes(target);
      return toolOk && fileOk;
    });
    if (!match) return { claim: claim.raw, status: 'unconfirmed', evidence: `日志中无匹配操作（目标: ${claim.target}）` };
    if (match.ok === false || match.exitCode && match.exitCode !== 0) {
      return { claim: claim.raw, status: 'contradicted', evidence: `日志显示该操作失败（${match.tool} @ ${match.ts}）` };
    }
    return { claim: claim.raw, status: 'confirmed', evidence: `${match.tool} @ ${match.ts}（${match.input.slice(0, 60)}）` };
  });

  const confirmed = results.filter((r) => r.status === 'confirmed').length;
  const rate = claims.length ? Math.round((confirmed / claims.length) * 100) : 100;
  return { claims: results, total: claims.length, confirmed, rate, verdict: rate >= (opts.threshold || 100) ? 'PASS' : 'FAIL' };
}

module.exports = { reconcile };
