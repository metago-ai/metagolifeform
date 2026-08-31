/**
 * lib/enforce.js — 强制门
 * 检测禁用"完成声明"（PreToolUse 拦截）+ 完成声明合规检查（供 hooks 与 CLI 门禁调用）。
 */
const { FORBIDDEN, detectForbidden, generateDeclaration } = require('./declaration');

function checkOutputForForbidden(text) {
  const found = detectForbidden(text);
  return {
    allowed: found.length === 0,
    found,
    message: found.length
      ? `检测到禁用声明词（${found.join('、')}）——按声明纪律禁止使用。正确格式：completeness-guard declaration 生成。`
      : 'ok'
  };
}

module.exports = { checkOutputForForbidden, generateDeclaration, FORBIDDEN };
