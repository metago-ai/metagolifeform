#!/usr/bin/env node
/**
 * hooks/scripts/stop-verify.cjs — Stop 强制门（软提醒）
 * 会话结束时提醒：若本会话有交付物，应运行完整性验证并生成声明。
 */
function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => { input += d; });
  process.stdin.on('end', () => {
    console.log(JSON.stringify({
      decision: 'allow',
      reason: '会话结束。提醒（软门）：如本会话有交付物/方案/文档，请运行 completeness-guard verify 验证完整性，并以标准声明格式收尾（"当前基线覆盖全绿 + 已知缺口已登记"）。'
    }));
    process.exit(0);
  });
}
main();
