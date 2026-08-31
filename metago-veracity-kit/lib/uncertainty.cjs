#!/usr/bin/env node
/**
 * lib/uncertainty.cjs — 不确定性检测
 * 检测"应该没问题/大概/应该可以"类填充词——Agent 用它们代替真实验证时必须被标记。
 */
const FILLERS = ['应该没问题', '应该可以', '大概没问题', '可能没问题', '应该是没问题', '理论上没问题', '应该能', '大概率没问题'];

function detect(text) {
  return FILLERS.filter((f) => text.includes(f));
}

module.exports = { detect, FILLERS };
