/**
 * lib/declaration.js — 标准声明生成器
 * 声明纪律：禁止"绝对完整/100%完美"；统一格式："当前基线（Vx，N 项）覆盖全绿 + 已知缺口 M 项已登记"。
 */
const path = require('path');
const { loadGaps } = require('./gaps');

const FORBIDDEN = ['绝对完整', '100%完美', '100%完整', '不会再缺', '不可能有遗漏', '绝对100%'];

function detectForbidden(text) {
  return FORBIDDEN.filter(w => text.includes(w));
}

function generateDeclaration(opts = {}) {
  const { report, gapsFile, docVersion } = opts;
  const gaps = loadGaps(gapsFile);
  const open = gaps.gaps.filter(g => g.status !== 'resolved');
  const baselineVer = report ? report.baselines.split(',').length : '?';
  const n = report ? report.total : '?';
  const green = report ? report.passed === report.total : false;
  const m = open.length;

  if (!green) {
    return `⚠️ 未通过完整性验证（${report ? report.passed + '/' + report.total : '?'}）——禁止宣告完成。先补齐缺口并重新验证。`;
  }
  return [
    `✅ 当前基线（${baselineVer} 组，${n} 项）覆盖全绿${docVersion ? '（文档 ' + docVersion + '）' : ''} + 已知缺口 ${m} 项已登记（completeness-guard gaps list 查看）。`,
    `   完整性 = 可验证事实（本声明由验证报告支撑，可复现）。`
  ].join('\n');
}

module.exports = { FORBIDDEN, detectForbidden, generateDeclaration };
