#!/usr/bin/env node
/**
 * veracity-guard — 元构行为诚实工程套件 CLI
 *
 * 用法:
 *   veracity-guard log [--tool X] [--file X] [--stats]        行为日志查看/统计
 *   veracity-guard claim <文本或 --file 报告.md>               提取完成宣称中的事实断言
 *   veracity-guard reconcile <文本或 --file 报告.md>           宣称 vs 行为日志对账（核心）
 *   veracity-guard verify --list <清单.txt>                    执行独立验证清单（不参与编写）
 *   veracity-guard uncertainty <文本>                          检测"应该没问题"类填充词
 *   veracity-guard report <文本或 --file 报告.md>              一键：对账 + 不确定性 + 完成判定
 *   veracity-guard check-claim <文本>                          hooks 用：检测完成宣称词
 */
const path = require('path');
const fs = require('fs');
const ledger = require('../lib/action-ledger.cjs');
const { extract } = require('../lib/claim-extractor.cjs');
const { reconcile } = require('../lib/reconciler.cjs');
const gate = require('../lib/verification-gate.cjs');
const { detect } = require('../lib/uncertainty.cjs');

const COMPLETION_WORDS = ['已完成', '全部完成', '100%完成', '完美', '交付完成', '任务完成', '全部实现', '全部搞定', '圆满完成'];

function argValue(args, name, def) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}

function readText(args) {
  const f = argValue(args, '--file');
  if (f && fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  return args.slice(1).filter((a) => !a.startsWith('--')).join(' ');
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'help';

  switch (cmd) {
    case 'log': {
      const filter = { tool: argValue(args, '--tool'), file: argValue(args, '--file') };
      const entries = ledger.query(filter, argValue(args, '--ledger'));
      if (args.includes('--stats')) {
        const s = ledger.stats(argValue(args, '--ledger'));
        console.log(`行为日志统计: 共 ${s.total} 条 | ${s.firstTs || '-'} → ${s.lastTs || '-'}`);
        for (const [tool, n] of Object.entries(s.byTool)) console.log(`  ${tool}: ${n}`);
        break;
      }
      if (!entries.length) { console.log('（日志为空——尚未记录任何行为）'); break }
      for (const e of entries.slice(-30)) {
        console.log(`[${e.ts}] ${e.tool}${e.ok === false ? ' ✗' : ''} | ${(e.input || '').slice(0, 80)}`);
      }
      console.log(`（共 ${entries.length} 条）`);
      break;
    }
    case 'claim': {
      const text = readText(args);
      const claims = extract(text);
      console.log(`提取到 ${claims.length} 条事实断言:`);
      for (const c of claims) console.log(`  [${c.type}] ${c.target}  ← ${c.raw}`);
      break;
    }
    case 'reconcile': {
      const text = readText(args);
      const report = reconcile(text, { ledgerFile: argValue(args, '--ledger') });
      console.log('════ 宣称-事实对账 ════');
      for (const r of report.claims) {
        const icon = r.status === 'confirmed' ? '✅' : r.status === 'contradicted' ? '❌' : '⚠️';
        console.log(`${icon} [${r.status}] ${r.claim}`);
        console.log(`      ↳ ${r.evidence}`);
      }
      console.log(`证实率: ${report.confirmed}/${report.total} (${report.rate}%) → ${report.verdict}`);
      process.exit(report.verdict === 'PASS' ? 0 : 1);
      break;
    }
    case 'verify': {
      const list = argValue(args, '--list');
      if (!list) { console.error('用法: veracity-guard verify --list <清单.txt>（清单由用户/独立方定义）'); process.exit(1) }
      const report = gate.run(list, { timeoutMs: parseInt(argValue(args, '--timeout') || '120000') });
      console.log('════ 独立验证门 ════');
      console.log(report.note);
      for (const r of report.results) {
        console.log(`${r.passed ? '✅' : '❌'} ${r.cmd} (${r.durationMs}ms)`);
        if (!r.passed) console.log(`      ↳ ${r.output.slice(0, 150)}`);
      }
      console.log(`通过率: ${report.passed}/${report.total} → ${report.verdict}`);
      process.exit(report.verdict === 'PASS' ? 0 : 1);
      break;
    }
    case 'uncertainty': {
      const text = readText(args);
      const hits = detect(text);
      console.log(hits.length ? `❌ 检测到不确定性填充词: ${hits.join('、')}\n   原则：不确定的项必须显式标注"未验证"，禁止用填充词代替验证` : '✅ 无填充词');
      process.exit(hits.length ? 1 : 0);
      break;
    }
    case 'report': {
      const text = readText(args);
      const rec = reconcile(text, { ledgerFile: argValue(args, '--ledger') });
      const unc = detect(text);
      console.log('════ 行为诚实报告 ════');
      console.log(`事实断言: ${rec.total} 条 | 证实率 ${rec.rate}% → ${rec.verdict}`);
      for (const r of rec.claims.filter((x) => x.status !== 'confirmed')) {
        console.log(`  ⚠️ ${r.status}: ${r.claim} — ${r.evidence}`);
      }
      if (unc.length) console.log(`⚠️ 不确定性填充词: ${unc.join('、')}`);
      const completion = COMPLETION_WORDS.filter((w) => text.includes(w));
      if (completion.length && rec.verdict !== 'PASS') {
        console.log(`⛔ 完成宣称（${completion.join('、')}）被拒绝：证据不足（证实率 ${rec.rate}%）`);
        process.exit(1);
      }
      console.log(rec.verdict === 'PASS' ? '✅ 宣称与事实一致' : '⚠️ 存在未证实断言');
      break;
    }
    case 'check-claim': {
      const text = args.slice(1).join(' ');
      const hits = COMPLETION_WORDS.filter((w) => text.includes(w));
      console.log(hits.length
        ? `⛔ 检测到完成宣称词（${hits.join('、')}）——必须附对账报告与验证报告，否则拒绝宣称`
        : '✅ 无完成宣称词');
      process.exit(hits.length ? 1 : 0);
      break;
    }
    default:
      console.log('元构行为诚实工程套件 v1.0.0\n用法见文件头。核心: reconcile（对账）/ verify（独立验证）/ report（一键判定）');
  }
}

main();
