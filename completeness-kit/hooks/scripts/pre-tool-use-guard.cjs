#!/usr/bin/env node
/**
 * hooks/scripts/pre-tool-use-guard.cjs — PreToolUse 强制门
 * 拦截 Agent 输出中"禁用完成声明词"（声明纪律硬门）。
 * 输入: stdin JSON（hook 事件）；输出: 拦截 JSON（block）或放行 JSON（allow）。
 * 快速执行，绝不阻塞正常流程。
 */
const fs = require('fs');
const path = require('path');
const { detectForbidden } = require('../../lib/declaration');

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => { input += d; });
  process.stdin.on('end', () => {
    let evt = {};
    try { evt = JSON.parse(input || '{}'); } catch {}
    // 从事件中取工具输入文本（Edit/Write/其他含文本的工具）
    const toolInput = evt.tool_input || {};
    const texts = [toolInput.content, toolInput.text, toolInput.new_string, toolInput.description, toolInput.command].filter(Boolean).join('\n');
    const found = detectForbidden(texts);
    if (found.length) {
      const msg = `⚠️ 完整性治理拦截：输出包含禁用声明词（${found.join('、')}）。按声明纪律，禁止声称"绝对完整/100%完美"。正确做法：运行 completeness-guard verify 后使用标准声明格式："当前基线（Vx，N 项）覆盖全绿 + 已知缺口 M 项已登记"。`;
      console.log(JSON.stringify({ decision: 'block', reason: msg }));
    } else {
      console.log(JSON.stringify({ decision: 'allow', reason: 'ok' }));
    }
    process.exit(0);
  });
}
main();
