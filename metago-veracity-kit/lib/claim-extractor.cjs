#!/usr/bin/env node
/**
 * lib/claim-extractor.cjs — 宣称提取器
 * 从 Agent 的完成报告文本中提取"事实断言"（我修改了 X / 我测试了 Y / 我创建了 N 个文件）
 * 断言将交给对账器与行为日志逐条核对。
 */
const PATTERNS = [
  { type: 'modified', re: /(?:我)?(?:已)?(?:成功)?(?:修改|编辑|更新|改了|改了)[了过]?\s*["'`]?([\w./\\-]+\.\w+)["'`]?/g, target: 1 },
  { type: 'created', re: /(?:我)?(?:已)?(?:成功)?(?:创建|新建|生成|写了|新增)[了过]?\s*["'`]?([\w./\\-]+\.\w+)["'`]?/g, target: 1 },
  { type: 'tested', re: /(?:我)?(?:已)?(?:成功)?(?:测试|验证|跑通|运行|执行)[了过]?\s*["'`]?([\w./\\-]+\.\w+)["'`]?/g, target: 1 },
  { type: 'testedCmd', re: /(?:我)?(?:已)?(?:成功)?(?:运行|执行|跑|测试)[了过]?\s*(?:命令|测试|脚本|用例)?\s*[:：]?\s*["'`]?([^"'`\n，。]+)/g, target: 1 },
  { type: 'deleted', re: /(?:我)?(?:已)?(?:成功)?(?:删除|移除)[了过]?\s*["'`]?([\w./\\-]+\.\w+)["'`]?/g, target: 1 },
  { type: 'count', re: /(?:我)?(?:已)?(?:成功)?(?:创建|完成|实现|处理)[了过]?\s*(\d+)\s*(?:个|项|条|处)/g, target: 1 }
];

function extract(text) {
  const claims = [];
  for (const { type, re, target } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const value = m[target];
      if (!value) continue;
      claims.push({ type, target: value.trim(), raw: m[0] });
    }
  }
  return claims;
}

module.exports = { extract };
