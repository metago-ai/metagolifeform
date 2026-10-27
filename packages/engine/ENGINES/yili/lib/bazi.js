/**
 * 易理工程学 · 四柱八字引擎（P3）
 * 四柱排盘 / 十神 / 大运（阳男阴女顺行）/ 流年 / 十二长生旺衰
 * 红线：不做命运论断，只做时间结构标注与周期框架
 */
import { GAN, ZHI, GANZHI, ganzhiYearOf, ganzhiMonthOf, ganzhiDayOfDate, ganzhiHourOf, changsheng } from './almanac.js';
import { GAN_WUXING } from './wuxing.js';

/** 十神（日干 × 他干）：比肩/劫财/食神/伤官/偏财/正财/七杀/正官/偏印/正印 */
export function shishen(dayGan, otherGan) {
  if (dayGan === otherGan) return '比肩';
  const d = GAN.indexOf(dayGan), o = GAN.indexOf(otherGan);
  const dYang = d % 2 === 0, oYang = o % 2 === 0;
  const dWx = GAN_WUXING[dayGan], oWx = GAN_WUXING[otherGan];
  const rel = dWx === oWx ? '比' : dWx === '木' ? (oWx === '火' ? '生' : oWx === '土' ? '克' : oWx === '金' ? '被克' : '被生') : null;
  const r = wuxingRel(dWx, oWx);
  if (r === '比') return dYang === oYang ? '比肩' : '劫财';
  if (r === '生') return dYang === oYang ? '食神' : '伤官';       // 我生
  if (r === '被生') return dYang === oYang ? '偏印' : '正印';     // 生我
  if (r === '克') return dYang === oYang ? '偏财' : '正财';       // 我克
  return dYang === oYang ? '七杀' : '正官';                       // 克我
}

function wuxingRel(a, b) {
  const s = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const k = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
  if (a === b) return '比';
  if (s[a] === b) return '生';
  if (k[a] === b) return '克';
  if (s[b] === a) return '被生';
  return '被克';
}

/** 藏干（十二支主气）：子癸 丑己癸辛 寅甲丙戊 卯乙 辰戊乙癸 巳丙戊庚 午丁己 未己丁乙 申庚壬戊 酉辛 戌戊辛丁 亥壬甲 */
export const CANG_GAN = {
  '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'], '卯': ['乙'],
  '辰': ['戊', '乙', '癸'], '巳': ['丙', '戊', '庚'], '午': ['丁', '己'], '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'], '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲']
};

/** 地支五行（主气） */
const ZHI_WX = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };

/**
 * 四柱排盘
 * @returns {year, month, day, hour, pillars{...}, shishen{}, dayMaster, dayMasterWuxing, cangGan{}, naYin{}}
 */
export function baziCalc(y, m, d, hour) {
  const dayGz = ganzhiDayOfDate(y, m, d);
  const yearGz = ganzhiYearOf(y, m, d, hour);
  const monthGz = ganzhiMonthOf(yearGz, y, m, d, hour);
  const hourGz = ganzhiHourOf(dayGz, hour);
  const dayMaster = dayGz[0];
  const dmWx = GAN_WUXING[dayMaster];
  const pillars = {
    year: { ganZhi: yearGz, gan: yearGz[0], zhi: yearGz[1], wuxing: GAN_WUXING[yearGz[0]] },
    month: { ganZhi: monthGz, gan: monthGz[0], zhi: monthGz[1], wuxing: GAN_WUXING[monthGz[0]] },
    day: { ganZhi: dayGz, gan: dayGz[0], zhi: dayGz[1], wuxing: GAN_WUXING[dayGz[0]] },
    hour: { ganZhi: hourGz, gan: hourGz[0], zhi: hourGz[1], wuxing: GAN_WUXING[hourGz[0]] }
  };
  const shishenMap = {};
  for (const [k, p] of Object.entries(pillars)) {
    shishenMap[k + 'Gan'] = shishen(dayMaster, p.gan);
    shishenMap[k + 'ZhiMain'] = shishen(dayMaster, CANG_GAN[p.zhi][0]);
  }
  const cangGan = {};
  for (const [k, p] of Object.entries(pillars)) {
    cangGan[k] = CANG_GAN[p.zhi].map(g => ({ gan: g, shishen: shishen(dayMaster, g) }));
  }
  const naYin = {};
  for (const [k, p] of Object.entries(pillars)) {
    const idx = GANZHI.indexOf(p.ganZhi);
    const nai = ['海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
      '泉中水', '屋上土', '霹雳火', '松柏木', '长流水', '沙中金', '山下火', '平地木', '壁上土', '金箔金',
      '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水'][Math.floor(idx / 2)];
    naYin[k] = nai;
  }
  return {
    y, m, d, hour,
    pillars,
    dayMaster,
    dayMasterWuxing: dmWx,
    shishenMap,
    cangGan,
    naYin,
    wuxingBalance: balanceOf(pillars)
  };
}

/** 五行力量粗算（天干 1 + 地支主气 1 + 藏干 0.5） */
export function balanceOf(pillars) {
  const score = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  for (const [k, p] of Object.entries(pillars)) {
    score[p.wuxing] += 1;
    score[ZHI_WX[p.zhi]] += 1;
    const cg = CANG_GAN[p.zhi];
    for (let i = 1; i < cg.length; i++) score[GAN_WUXING[cg[i]]] += 0.3;
  }
  return score;
}

/**
 * 大运排法：阳男阴女顺行、阴男阳女逆行；从月柱起排，每运一柱（10 年）
 * @returns {forward, list[], gender, yearGan, monthGanZhi}
 */
export function dayunCalc(y, m, d, hour, gender) {
  const yearGz = ganzhiYearOf(y, m, d, hour);
  const yearGan = yearGz[0];
  const ganYang = GAN.indexOf(yearGan) % 2 === 0;
  const forward = (ganYang && gender === '男') || (!ganYang && gender === '女');
  const monthGz = ganzhiMonthOf(yearGz, y, m, d, hour);
  const monthIdx = GANZHI.indexOf(monthGz);
  const step = forward ? 1 : -1;
  const list = [];
  for (let i = 1; i <= 8; i++) {
    const idx = (((monthIdx + step * i) % 60) + 60) % 60;
    list.push({ ganZhi: GANZHI[idx], index: i });
  }
  return { forward, list, gender, yearGan, monthGanZhi: monthGz };
}

/** 流年：起运年后每年干支（简化：年龄 → 干支） */
export function liunianCalc(age) {
  // 以 2024 甲辰为锚：流年干支 = (2024 + age - 1) 年干支（立春界简化）
  const idx = (((2024 - 4 + age - 1) % 60) + 60) % 60;
  return GANZHI[idx];
}
