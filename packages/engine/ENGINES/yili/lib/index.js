/**
 * 易理工程学 · 引擎汇总入口
 */
export * from './almanac.js';
export * from './wuxing.js';
export * from './hetu-luoshu.js';
export * from './yijing.js';
export * from './liuyao.js';
export * from './bazi.js';
export * from './ziwei.js';
export * from './qimen.js';
export * from './taiyi.js';
export * from './zeri.js';
export * from './shushu-calculus.js';
export * from './diagnose.js';

export const ENGINE = {
  name: '易理工程学',
  version: '0.2.0',
  families: ['历法', '周易', '五行八卦', '河图洛书', '六爻', '四柱', '紫微', '奇门', '太乙', '择日', '文言微积分', '象数诊断'],
  almanac: '寿星天文历公版公式（Sxing）',
  confidence: '一切断言均为启发式标签 + 置信度 + 规则编号，可溯源可复算'
};
