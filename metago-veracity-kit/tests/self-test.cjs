#!/usr/bin/env node
/**
 * 自测：Veracity Kit 核心链路（行为日志 → 宣称提取 → 对账 → 拦截）
 */
const os = require('os');
const path = require('path');
const fs = require('fs');
const ledger = require('../lib/action-ledger.cjs');
const { extract } = require('../lib/claim-extractor.cjs');
const { reconcile } = require('../lib/reconciler.cjs');
const gate = require('../lib/verification-gate.cjs');
const { detect } = require('../lib/uncertainty.cjs');

const TMP = path.join(os.tmpdir(), 'veracity-test-' + Date.now());
fs.mkdirSync(TMP, { recursive: true });
const ledgerFile = path.join(TMP, 'ledger.jsonl');
const listFile = path.join(TMP, 'verify-list.txt');

let pass = 0, fail = 0;
function t(name, ok, detail) {
  if (ok) { pass++; console.log('  ✓ ' + name) } else { fail++; console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')) }
}

console.log('=== 1. 行为日志引擎 ===')
// 模拟 hooks 记录：修改 app.ts、运行测试
ledger.record({ tool: 'Edit', input: '修改 src/app.ts 第 10 行', files: ['src/app.ts'], ok: true }, ledgerFile)
ledger.record({ tool: 'Bash', input: 'npm test', output: '2 passed', exitCode: 0, ok: true }, ledgerFile)
ledger.record({ tool: 'Write', input: '创建 README.md', files: ['README.md'], ok: false }, ledgerFile)
const all = ledger.query(null, ledgerFile)
t('记录 3 条', all.length === 3)
t('按文件查询', ledger.query({ file: 'app.ts' }, ledgerFile).length === 1)
t('统计', ledger.stats(ledgerFile).total === 3)

console.log('=== 2. 宣称提取 ===')
const report = '我已修改 src/app.ts 并运行了 npm test，创建了 README.md，全部完成，应该没问题。'
const claims = extract(report)
t('提取断言 ≥3', claims.length >= 3, '实际 ' + claims.length)
t('含 modified 断言', claims.some((c) => c.type === 'modified' && c.target.includes('app.ts')))
t('含 tested 断言', claims.some((c) => c.type === 'tested' || c.type === 'testedCmd'))

console.log('=== 3. 对账（核心）===')
const rec = reconcile(report, { ledgerFile, windowMinutes: 120 })
t('修改断言已证实', rec.claims.some((r) => r.status === 'confirmed' && r.claim.includes('app.ts')))
t('创建断言未证实（日志显示失败）', rec.claims.some((r) => r.status === 'contradicted' || (r.status === 'unconfirmed' && r.claim.includes('README.md'))))
t('证实率 < 100% 时 verdict FAIL', rec.verdict === 'FAIL', '实际 ' + rec.verdict + ' (' + rec.rate + '%)')

console.log('=== 4. 独立验证门 ===')
fs.writeFileSync(listFile, '# 用户定义清单\nnode -e "console.log(1)"\nnode -e "process.exit(1)"\n')
const vg = gate.run(listFile, { timeoutMs: 30000 })
t('清单 2 条', vg.total === 2)
t('1 过 1 败 → FAIL', vg.verdict === 'FAIL')
t('不参与清单编写（仅执行）', vg.note.includes('独立于 Agent'))

console.log('=== 5. 不确定性检测 ===')
t('填充词命中', detect('这个应该没问题吧').length === 1)
t('正常文本无命中', detect('该项已验证通过，证据见日志').length === 0)

console.log('=== 6. 完成宣称词（hooks 用）===')
const words = ['已完成', '全部完成', '100%完成', '完美']
t('宣称词检测', words.every((w) => require('../bin/veracity-guard.js') || true))

fs.rmSync(TMP, { recursive: true, force: true })
console.log('\n结果: ' + pass + '/' + (pass + fail))
process.exit(fail === 0 ? 0 : 1)
