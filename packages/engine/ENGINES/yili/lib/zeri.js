/**
 * 易理工程学 · 择日引擎（P4）
 * 约束满足：时间槽位 × 规则约束的可行解搜索
 */
import { GANZHI, ganzhiDayOfDate, jianchu, dayXunKong, ZHI, GAN } from './almanac.js';

/** 建除十二神吉凶（民俗符号，无因果断言） */
export const JIANCHU_JIXIONG = {
  '建': '吉', '除': '吉', '满': '平', '平': '平', '定': '吉', '执': '平',
  '破': '凶', '危': '凶', '成': '吉', '收': '平', '开': '吉', '闭': '凶'
};

/** 黄道六神（青龙明堂金匮天德玉堂司命）与黑道六神（天刑朱雀白虎天牢玄武勾陈） */
export const HUANGDAO = ['青龙', '明堂', '金匮', '天德', '玉堂', '司命'];
export const HEIDAO = ['天刑', '朱雀', '白虎', '天牢', '玄武', '勾陈'];

/** 黄黑道：日支序（青龙起子） */
export function huangheiDao(dayZhi) {
  const idx = ZHI.indexOf(dayZhi);
  const cycle = ['青龙', '明堂', '天刑', '朱雀', '金匮', '天德', '白虎', '天牢', '玉堂', '司命', '玄武', '勾陈'];
  const name = cycle[((idx % 12) + 12) % 12];
  return { name, kind: HUANGDAO.includes(name) ? '黄道' : '黑道' };
}

/** 值日星宿简化：二十八宿轮值（以角宿起，日支序对应）——标注民俗符号 */
export const XU_SU = ['角', '亢', '氐', '房', '心', '尾', '箕', '斗', '牛', '女', '虚', '危', '室', '壁', '奎', '娄', '胃', '昴', '毕', '觜', '参', '井', '鬼', '柳', '星', '张', '翼', '轸'];

/**
 * 择日搜索：在日期范围内找满足约束的日子
 * @param {number} y0 起始年
 * @param {number} m0 起始月
 * @param {number} d0 起始日
 * @param {number} days 搜索天数
 * @param {object} constraints { avoidZhi: [], requireZhi: [], avoidChong: '子', requireJianchu: ['开','成'], huangdao: true }
 */
export function zeriPick(y0, m0, d0, days, constraints = {}) {
  const results = [];
  const avoidZhi = constraints.avoidZhi || [];
  const requireZhi = constraints.requireZhi || [];
  const avoidChong = constraints.avoidChong || null;
  const requireJianchu = constraints.requireJianchu || [];
  const needHuangdao = constraints.huangdao !== false;
  const CHONG = { '子': '午', '午': '子', '丑': '未', '未': '丑', '寅': '申', '申': '寅', '卯': '酉', '酉': '卯', '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳' };
  const base = new Date(Date.UTC(y0, m0 - 1, d0));
  for (let i = 0; i < days; i++) {
    const dt = new Date(base.getTime() + i * 86400000);
    const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
    const gz = ganzhiDayOfDate(y, m, d);
    const zhi = gz[1];
    if (avoidZhi.includes(zhi)) continue;
    if (requireZhi.length && !requireZhi.includes(zhi)) continue;
    if (avoidChong && CHONG[avoidChong] === zhi) continue;
    const jc = jianchu('寅', zhi); // 简化：以寅月起建
    if (requireJianchu.length && !requireJianchu.includes(jc)) continue;
    const hd = huangheiDao(zhi);
    if (needHuangdao && hd.kind === '黑道') continue;
    const kong = dayXunKong(gz);
    results.push({
      date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      ganzhi: gz,
      zhi,
      jianchu: jc,
      jianchuJiXiong: JIANCHU_JIXIONG[jc] || '平',
      huanghei: hd,
      xunKong: kong.join(''),
      xuSu: XU_SU[((GANZHI.indexOf(gz) % 28) + 28) % 28]
    });
  }
  return results;
}

/** 择日输出（民俗符号标注） */
export function zeriReport(y0, m0, d0, days, constraints) {
  const picks = zeriPick(y0, m0, d0, days, constraints);
  return {
    picks,
    note: '建除/黄黑道/星宿均为民俗符号，无因果断言（规则 R-ZR-01，置信度 100% 于符号本身）',
    constraintSummary: constraints
  };
}
