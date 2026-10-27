/**
 * 384 爻辞表汇总（通行本《周易》经文）
 */
import { YAOCI } from './yaoci-1.js';
import { YAOCI_2 } from './yaoci-2.js';
import { YAOCI_3 } from './yaoci-3.js';
import { YAOCI_4 } from './yaoci-4.js';

export const YAOCI_ALL = { ...YAOCI, ...YAOCI_2, ...YAOCI_3, ...YAOCI_4 };

/** 校验：64 卦 × 6 爻 = 384 条 */
export function verifyYaoci() {
  const names = Object.keys(YAOCI_ALL);
  const total = names.reduce((s, n) => s + YAOCI_ALL[n].length, 0);
  const bad = names.filter(n => YAOCI_ALL[n].length !== 6);
  return { guaCount: names.length, total, bad };
}
