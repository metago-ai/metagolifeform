#!/usr/bin/env node
/**
 * hooks/completion-claim-gate.cjs — 完成宣称硬拦截（PreToolUse）
 * 拦截输出中包含完成宣称词（已完成/全部完成/100%/完美/交付）的工具写入，
 * 要求附对账证据。快速执行，绝不阻塞正常流程；证据检查由 CLI 完成。
 */
const { detect: detectUncertainty } = require('../lib/uncertainty.cjs');

const COMPLETION_WORDS = ['已完成', '全部完成', '100%完成', '完美', '交付完成', '任务完成', '全部实现', '全部搞定', '圆满完成', '已经全部'];

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => { input += d });
  process.stdin.on('end', () => {
    let evt = {};
    try { evt = JSON.parse(input || '{}') } catch {}
    const toolInput = evt.tool_input || {};
    const texts = [toolInput.content, toolInput.text, toolInput.new_string, toolInput.description, toolInput.command]
      .filter(Boolean).join('\n');
    const hits = COMPLETION_WORDS.filter((w) => texts.includes(w));
    const unc = detectUncertainty(texts);
    if (hits.length) {
      const msg = `⛔ 行为诚实拦截：输出含完成宣称词（${hits.join('、')}）。按 Veracity Kit 协议，完成宣称必须：\n` +
        `  1) 已运行 veracity-guard reconcile（宣称-事实对账，证实率须为 100%）\n` +
        `  2) 已运行 veracity-guard verify --list <独立验证清单>（清单由用户/独立方定义）\n` +
        `  3) 附对账报告路径。\n` +
        `未附证据的完成宣称将被拒绝。若确有完成证据，请先执行上述验证并附报告，再修正输出措辞（如实说明完成范围与证据）。`;
      console.log(JSON.stringify({ decision: 'block', reason: msg }));
    } else if (unc.length) {
      const msg = `⚠️ 检测到不确定性填充词（${unc.join('、')}）。请改为显式标注："该项未验证/待验证"，不要用填充词代替验证。`;
      console.log(JSON.stringify({ decision: 'block', reason: msg }));
    } else {
      console.log(JSON.stringify({ decision: 'allow', reason: 'ok' }));
    }
    process.exit(0);
  });
}
main();
