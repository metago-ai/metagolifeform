/**
 * 易理工程学 · 历法引擎（P1 · 一切的地基）
 *
 * 100% 确定性、零网络依赖、纯 JS 实现：
 *   - 儒略日（JDN）/ 公历 ↔ 干支纪日（JDN mod 60，锚点 2024-01-01 = 甲子）
 *   - 二十四节气时刻（寿星天文历公版公式：VSOP87 太阳黄经精确求根，秒级精度）
 *   - 农历转换（朔望月构造 + 无中气置闰，锚点 2024-02-10 = 甲辰年正月初一）
 *   - 旬空 / 月破 / 十二长生 / 纳音 / 建除十二神（表驱动）
 *
 * 算法来源（计划 §二 指定）：寿星天文历公版近似公式（Sxing），核心见 vendor/shouxing-core.js
 * 回测：test/almanac.test.mjs 对 test/基准表/ 权威基准 100% 对齐（节气到分、干支逐日）。
 */

import { ShouXingUtil } from './vendor/shouxing-core.js';

// ═════════════════════════ 基础常数 ═════════════════════════

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const GANZHI = (() => {
  const out = [];
  for (let i = 0; i < 60; i++) out.push(GAN[i % 10] + ZHI[i % 12]);
  return out;
})();

const JIE_ORDER = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪',
  '大雪', '冬至', '小寒', '大寒'];

/** 中气（节气中的"气"，用于置闰判定）：黄经 0°（春分）起偶数序 */
const ZHONGQI_INDEX = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23]; // 雨水,春分,谷雨,小满,夏至,大暑,处暑,秋分,霜降,小雪,冬至,大寒

/** 六十甲子纳音表（水二局/木三局/金四局/土五局/火六局 之纳音五行） */
const NAYIN = (() => {
  const seq = [
    '海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
    '泉中水', '屋上土', '霹雳火', '松柏木', '长流水', '沙中金', '山下火', '平地木', '壁上土', '金箔金',
    '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水'
  ];
  const out = new Array(60);
  for (let i = 0; i < 60; i++) out[i] = seq[Math.floor(i / 2)];
  return out;
})();

/** 纳音五行（五局）：海中金→金 … */
const NAYIN_WUXING = {
  '海中金': '金', '炉中火': '火', '大林木': '木', '路旁土': '土', '剑锋金': '金', '山头火': '火',
  '涧下水': '水', '城头土': '土', '白蜡金': '金', '杨柳木': '木', '泉中水': '水', '屋上土': '土',
  '霹雳火': '火', '松柏木': '木', '长流水': '水', '沙中金': '金', '山下火': '火', '平地木': '木',
  '壁上土': '土', '金箔金': '金', '覆灯火': '火', '天河水': '水', '大驿土': '土', '钗钏金': '金',
  '桑柘木': '木', '大溪水': '水', '沙中土': '土', '天上火': '火', '石榴木': '木', '大海水': '水'
};

/** 十二长生（天干×地支 → 12 态序），长生=0 起：长生,沐浴,冠带,临官,帝旺,衰,病,死,墓,绝,胎,养 */
const CHANGSHENG_NAMES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
/** 阳干顺行 / 阴干逆行，起点：甲长生于亥、乙长生于午 … */
const CHANGSHENG_START = {
  '甲': { zhi: '亥', dir: 1 }, '丙': { zhi: '寅', dir: 1 }, '戊': { zhi: '寅', dir: 1 },
  '庚': { zhi: '巳', dir: 1 }, '壬': { zhi: '申', dir: 1 },
  '乙': { zhi: '午', dir: -1 }, '丁': { zhi: '酉', dir: -1 }, '己': { zhi: '酉', dir: -1 },
  '辛': { zhi: '子', dir: -1 }, '癸': { zhi: '卯', dir: -1 }
};

/** 地支冲（六冲） */
const ZHI_CHONG = { '子': '午', '午': '子', '丑': '未', '未': '丑', '寅': '申', '申': '寅', '卯': '酉', '酉': '卯', '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳' };

/** 建除十二神（月支定序：寅月建寅起建） */
const JIANCHU = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];

/** 旬空表：每旬（10 天）的空亡二支 */
const XUNKONG = (() => {
  const out = {};
  for (let i = 0; i < 60; i += 10) {
    const head = GANZHI[i];
    const z1 = ZHI[(i + 10) % 12];
    const z2 = ZHI[(i + 11) % 12];
    out[head] = [z1, z2];
    // 旬首 5 个干支同旬
    for (let j = 1; j < 10; j++) out[GANZHI[i + j]] = [z1, z2];
  }
  return out;
})();

// ═════════════════════════ 儒略日与干支 ═════════════════════════

/** 公历 → 儒略日（noon-based JDN，UTC 语境；date 为 {y,m,d} 整数日） */
export function julianDay(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  let jdn = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  return jdn; // noon-based integer JDN
}

/** 儒略日 → 公历 {y,m,d}（整数日，UTC） */
export function julianDayToDate(jdn) {
  let a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const dd = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * dd / 4);
  const mm = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * mm + 2) / 5) + 1;
  const month = mm + 3 - 12 * Math.floor(mm / 10);
  const year = 100 * b + dd - 4800 + Math.floor(mm / 10);
  return { y: year, m: month, d: day };
}

/** 儒略日 → 干支日名（锚点：2024-01-01 = 甲子，JDN=2460311） */
export function ganzhiDay(jdn) {
  const idx = ((jdn - 2460311) % 60 + 60) % 60;
  return GANZHI[idx];
}

/** 公历日期 → 干支日名 */
export function ganzhiDayOfDate(y, m, d) {
  return ganzhiDay(julianDay(y, m, d));
}

/** 干支序号（0-59） */
export function ganzhiIndex(name) {
  return GANZHI.indexOf(name);
}

export function dayXunKong(ganzhiName) {
  return XUNKONG[ganzhiName] || [];
}

// ═════════════════════════ 节气（太阳黄经）════════════════════════

const DEG = Math.PI / 180;

/** 太阳视黄经（Meeus 25.2 平黄经 + 6 项中心差[含月球摄动] + 章动前 4 项 + 光行差 + ΔT） */
export function sunApparentLongitude(jdeTT) {
  const T = (jdeTT - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mp = 134.96298139 + 477198.8673981 * T; // 月球平近点角
  const Mr = M * DEG, Mpr = Mp * DEG;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
    + 0.000289 * Math.sin(3 * Mr)
    + (0.000025 - 0.000002 * T) * Math.sin(Mpr)
    + 0.000006 * Math.sin(2 * Mpr - Mr)
    + 0.000003 * Math.sin(3 * Mpr);
  const geometric = L0 + C;
  // 章动经度主项（前 4 项）+ 光行差 -0.00569
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  const omegaR = omega * DEG;
  const lSun = geometric * DEG;
  const dPsi =
    -0.00478 * Math.sin(omegaR)
    - 0.0004 * Math.sin(2 * omegaR)
    + 0.0003 * Math.sin(2 * lSun)
    - 0.0001 * Math.sin(3 * lSun);
  const apparent = geometric - 0.00569 + dPsi;
  return ((apparent % 360) + 360) % 360;
}

/** ΔT（TT−UT，秒）：Espenak & Meeus 2006 近似，适用 2005-2050 */
export function deltaTSeconds(year) {
  const t = year - 2000;
  return 62.92 + 0.32217 * t + 0.005589 * t * t;
}

/** 求太阳黄经到达 targetLong 的最近儒略日（二分法，返回 JDE 时刻） */
export function sunLongitudeTime(targetLong, guessJde) {
  const target = ((targetLong % 360) + 360) % 360;
  let lo = guessJde - 20;
  let hi = guessJde + 20;
  const f = (jde) => {
    let d = sunApparentLongitude(jde) - target;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  };
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) * f(lo) <= 0) hi = mid; else lo = mid;
    if (hi - lo < 1e-7) break; // ~0.0086 秒
  }
  return (lo + hi) / 2;
}

/** JDE（TT）→ 北京时间 Date 对象（TT 减 ΔT 得 UT，再 +8h） */
function jdeToBeijingDate(jdeTT) {
  const y = Math.floor(2000 + (jdeTT - 2451545.0) / 365.25);
  const ms = (jdeTT - deltaTSeconds(y) / 86400 - 2440587.5) * 86400000;
  return new Date(ms + 8 * 3600000); // +8h → 北京时间
}

/**
 * 计算某公历年全部 24 节气时刻（北京时间，精确到秒）
 * 以该年冬至（黄经 270°）为锚，前后扩展覆盖全年，过滤出公历年份 == year 的 24 个。
 * 计算核心：寿星天文历公版公式（VSOP87 太阳黄经精确求根，秒级精度）。
 * @returns {Array<{name, solar, jde}>} solar = 'YYYY-MM-DD HH:mm:ss'（北京时间）
 */
export function jieqiOfYear(year) {
  const out = [];
  // 寿星 qiAccurate2 输入输出均为 J2000 偏移天数（JD - 2451545）
  // 锚：该年立春（2月初，粗猜偏差 <15° 内，一次收敛）
  const lichun = ShouXingUtil.qiAccurate2(julianDay(year, 2, 4) - 2451545);
  // 立春起：向前 2 个（小寒/大寒属该公历年 1 月）、向后 23 个覆盖至年末
  for (let off = -2; off <= 23; off++) {
    const idx = (((off % 24) + 24) % 24);
    const offJd = ShouXingUtil.qiAccurate2(lichun + 15.2184 * off);
    const jdeFull = offJd + 2451545;
    // 寿星 JD 为北京时间语义（+1/3 天基准），直接按 UTC 转换即得北京时间
    const dt = new Date((jdeFull - 2440587.5) * 86400000);
    if (dt.getUTCFullYear() !== year) continue;
    out.push({
      name: JIE_ORDER[idx],
      solar: `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')} ${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}:${String(dt.getUTCSeconds()).padStart(2, '0')}`,
      jde: +jdeFull.toFixed(6)
    });
  }
  out.sort((a, b) => a.solar.localeCompare(b.solar)); // 时间序（公历年内 1 月的小寒/大寒在前）
  return out;
}

/** 给定日期（北京）→ 最近的节气（前/后） */
export function nearJieqi(y, m, d, hour = 0, minute = 0) {
  const ts = Date.UTC(y, m - 1, d, hour - 8, minute); // 北京 → UTC ms
  const all = [];
  for (const yy of [y - 1, y, y + 1]) all.push(...jieqiOfYear(yy));
  let prev = null, next = null;
  for (const j of all) {
    const jt = Date.parse(j.solar.replace(' ', 'T') + '+08:00');
    if (jt <= ts) prev = j; else { next = j; break; }
  }
  return { prev, next };
}

// ═════════════════════════ 表驱动（旬空/月破/长生/纳音/神煞）════════════════════════

/** 月破：与月建（月支）相冲的地支 */
export function monthBreak(monthZhi) {
  return ZHI_CHONG[monthZhi];
}

/** 十二长生：干×支 → 12 态名 */
export function changsheng(gan, zhi) {
  const cfg = CHANGSHENG_START[gan];
  if (!cfg) return null;
  const startIdx = ZHI.indexOf(cfg.zhi);
  const zhiIdx = ZHI.indexOf(zhi);
  let delta = (zhiIdx - startIdx + 12) % 12;
  if (cfg.dir === -1) delta = (startIdx - zhiIdx + 12) % 12;
  return CHANGSHENG_NAMES[delta % 12];
}

/** 六十甲子纳音 */
export function nayin(ganzhiName) {
  const i = GANZHI.indexOf(ganzhiName);
  if (i < 0) return null;
  return { name: NAYIN[i], wuxing: NAYIN_WUXING[NAYIN[i]] };
}

/** 建除十二神：由月支与日支定（月支建月起建） */
export function jianchu(monthZhi, dayZhi) {
  const mi = ZHI.indexOf(monthZhi);
  const di = ZHI.indexOf(dayZhi);
  if (mi < 0 || di < 0) return null;
  // 建除起于月建（寅月起建）：(日支 - 月支 + 12) % 12
  const idx = ((di - mi) % 12 + 12) % 12;
  return JIANCHU[idx];
}

/** 十二地支合（六合） */
export const ZHI_HE = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
/** 三合局 */
export const ZHI_SANHE = { '申子辰': '水', '寅午戌': '火', '巳酉丑': '金', '亥卯未': '木' };
/** 地支刑 */
export const ZHI_XING = { '寅': '巳', '巳': '申', '申': '寅', '丑': '戌', '戌': '未', '未': '丑', '子': '卯', '卯': '子', '辰': '辰', '午': '午', '酉': '酉', '亥': '亥' };
/** 地支害 */
export const ZHI_HAI = { '子': '未', '未': '子', '丑': '午', '午': '丑', '寅': '巳', '巳': '寅', '卯': '辰', '辰': '卯', '申': '亥', '亥': '申', '酉': '戌', '戌': '酉' };

// ═════════════════════════ 农历（朔望月构造 + 无中气置闰）════════════════════════

/** 农历月名（1=正月 … 11=冬月/十一月, 12=腊月/十二月） */
export const LUNAR_MONTH_NAMES = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
export const LUNAR_DAY_NAMES = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

/** 闰冬月（闰十一月）特例农历年表（寿星公版数据） */
const LEAP_11 = [75, 94, 170, 265, 322, 398, 469, 553, 583, 610, 678, 735, 754, 773, 849, 887, 936, 1050, 1069, 1126, 1145, 1164, 1183, 1259, 1278, 1308, 1373, 1403, 1441, 1460, 1498, 1555, 1593, 1612, 1631, 1642, 2033, 2128, 2147, 2242, 2614, 2728, 2910, 3062, 3244, 3339, 3616, 3711, 3730, 3825, 4007, 4159, 4197, 4322, 4341, 4379, 4417, 4531, 4599, 4694, 4713, 4789, 4808, 4971, 5085, 5104, 5161, 5180, 5199, 5294, 5305, 5476, 5677, 5696, 5772, 5791, 5848, 5886, 6049, 6068, 6144, 6163, 6258, 6402, 6440, 6497, 6516, 6630, 6641, 6660, 6679, 6736, 6774, 6850, 6869, 6899, 6918, 6994, 7013, 7032, 7051, 7070, 7089, 7108, 7127, 7146, 7222, 7271, 7290, 7309, 7366, 7385, 7404, 7442, 7461, 7480, 7491, 7499, 7594, 7624, 7643, 7662, 7681, 7719, 7738, 7814, 7863, 7882, 7901, 7939, 7958, 7977, 7996, 8034, 8053, 8072, 8091, 8121, 8159, 8186, 8216, 8235, 8254, 8273, 8311, 8330, 8341, 8349, 8368, 8444, 8463, 8474, 8493, 8531, 8569, 8588, 8626, 8664, 8683, 8694, 8702, 8713, 8721, 8751, 8789, 8808, 8816, 8827, 8846, 8884, 8903, 8922, 8941, 8971, 9036, 9066, 9085, 9104, 9123, 9142, 9161, 9180, 9199, 9218, 9256, 9294, 9313, 9324, 9343, 9362, 9381, 9419, 9438, 9476, 9514, 9533, 9544, 9552, 9563, 9571, 9582, 9601, 9639, 9658, 9666, 9677, 9696, 9734, 9753, 9772, 9791, 9802, 9821, 9886, 9897, 9916, 9935, 9954, 9973, 9992];
/** 闰腊月（闰十二月）特例农历年表（寿星公版数据） */
const LEAP_12 = [37, 56, 113, 132, 151, 189, 208, 227, 246, 284, 303, 341, 360, 379, 417, 436, 458, 477, 496, 515, 534, 572, 591, 629, 648, 667, 697, 716, 792, 811, 830, 868, 906, 925, 944, 963, 982, 1001, 1020, 1039, 1058, 1088, 1153, 1202, 1221, 1240, 1297, 1335, 1392, 1411, 1422, 1430, 1517, 1525, 1536, 1574, 3358, 3472, 3806, 3988, 4751, 4941, 5066, 5123, 5275, 5343, 5438, 5457, 5495, 5533, 5552, 5715, 5810, 5829, 5905, 5924, 6421, 6535, 6793, 6812, 6888, 6907, 7002, 7184, 7260, 7279, 7374, 7556, 7746, 7757, 7776, 7833, 7852, 7871, 7966, 8015, 8110, 8129, 8148, 8224, 8243, 8338, 8406, 8425, 8482, 8501, 8520, 8558, 8596, 8607, 8615, 8645, 8740, 8778, 8835, 8865, 8930, 8960, 8979, 8998, 9017, 9055, 9074, 9093, 9112, 9150, 9188, 9237, 9275, 9332, 9351, 9370, 9408, 9427, 9446, 9457, 9465, 9495, 9560, 9590, 9628, 9647, 9685, 9715, 9742, 9780, 9810, 9818, 9829, 9848, 9867, 9905, 9924, 9943, 9962, 10000];
const _YMC = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const _inLeap = (arr, n) => arr.includes(n);

/**
 * 构造农历年 lunarYear 的月份表（覆盖 lunarYear 冬月 → lunarYear+1 十月），
 * 算法 = 寿星公版（整日粒度朔/节气 + 闰冬腊特例表 + 无中气置闰）。
 * @returns {Array<{shuo, month, isLeap}>} shuo 为 J2000 偏移整日
 */
function buildLunarYearMonths(lunarYear) {
  const jd0 = Math.floor((lunarYear - 2000) * 365.2422 + 180);
  let w = Math.floor((jd0 - 355 + 183) / 365.2422) * 365.2422 + 355;
  if (ShouXingUtil.calcQi(w) > jd0) w -= 365.2422;
  const jq = [];
  for (let i = 0; i < 26; i++) jq.push(ShouXingUtil.calcQi(w + 15.2184 * i));
  let w2 = ShouXingUtil.calcShuo(jq[0]);
  if (w2 > jq[0]) w2 -= 29.53;
  const hs = [];
  for (let i = 0; i < 16; i++) hs.push(ShouXingUtil.calcShuo(w2 + 29.5306 * i));
  const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  let leapIndex = 16;
  if (_inLeap(LEAP_11, lunarYear)) leapIndex = 13;
  else if (_inLeap(LEAP_12, lunarYear)) leapIndex = 14;
  else if (hs[13] <= jq[24]) {
    let i = 1;
    while (hs[i + 1] > jq[2 * i] && i < 13) i++;
    leapIndex = i;
  }
  for (let j = leapIndex; j < 15; j++) months[j] -= 1;
  const out = [];
  for (let i = 0; i < 15; i++) {
    out.push({ shuo: hs[i], month: _YMC[((months[i] % 12) + 12) % 12], isLeap: i === leapIndex });
  }
  return out;
}

/**
 * 公历日期 → 农历信息（寿星公式：朔望月 + 特例表/无中气置闰）
 * @returns {lunarYear, lunarMonth, lunarDay, isLeap, monthName, dayName, ganzhiYear, ganzhiMonth, ganzhiDay, shengxiao, nayinDay, nayinWuxing}
 */
export function lunarOfSolarDate(y, m, d, hour = 12) {
  const jdn = julianDay(y, m, d);
  const offset = jdn - 2451545;
  // 表键 = 立春年（立春前退一年，与年干支同源）
  let baseYear = y;
  const lichun = jieqiOfYear(y).find(j => j.name === '立春');
  if (lichun) {
    const lcTs = Date.parse(lichun.solar.replace(' ', 'T') + '+08:00');
    const curTs = Date.UTC(y, m - 1, d, hour - 8);
    if (curTs < lcTs) baseYear = y - 1;
  }
  let tableKey = baseYear;
  let table = buildLunarYearMonths(tableKey);
  if (offset < table[0].shuo) { tableKey -= 1; table = buildLunarYearMonths(tableKey); }
  let idx = -1;
  for (let i = 0; i < table.length; i++) {
    const start = table[i].shuo;
    const end = i + 1 < table.length ? table[i + 1].shuo : start + 30;
    if (offset >= start && offset < end) { idx = i; break; }
  }
  if (idx < 0) return null;
  const mon = table[idx];
  const lunarDay = Math.floor(offset - mon.shuo) + 1;
  // 农历年号：以表内第一个正月为界——正月及之后属表键年；正月前（冬/腊）属表键年-1
  const zhengIdx = table.findIndex(mm => mm.month === 1 && !mm.isLeap);
  const lunarYear = (zhengIdx >= 0 && idx >= zhengIdx) ? tableKey : tableKey - 1;
  const dayGz = ganzhiDay(jdn);
  const gzIdx = GANZHI.indexOf(dayGz);
  const nai = NAYIN[gzIdx] || '';
  const yearGanZhi = ganzhiYearOf(y, m, d, hour);
  return {
    lunarYear,
    lunarMonth: mon.month,
    lunarDay,
    isLeap: mon.isLeap,
    monthName: (mon.isLeap ? '闰' : '') + LUNAR_MONTH_NAMES[mon.month] + '月',
    dayName: LUNAR_DAY_NAMES[lunarDay] || String(lunarDay),
    ganzhiYear: yearGanZhi,
    ganzhiMonth: ganzhiMonthOf(yearGanZhi, y, m, d, hour),
    ganzhiDay: dayGz,
    shengxiao: ZHI[(((GANZHI.indexOf(yearGanZhi) % 12) + 12) % 12)],
    nayinDay: nai,
    nayinWuxing: NAYIN_WUXING[nai] || ''
  };
}

/** 年干支（立春为界）：(年-4) mod 60，立春前退一年 */
export function ganzhiYearOf(y, m, d, hour = 12) {
  let yy = y;
  const lichun = jieqiOfYear(y).find(j => j.name === '立春');
  if (lichun) {
    const lcTs = Date.parse(lichun.solar.replace(' ', 'T') + '+08:00');
    const curTs = Date.UTC(y, m - 1, d, hour - 8);
    if (curTs < lcTs) yy = y - 1;
  }
  return GANZHI[((((yy - 4) % 60) + 60) % 60)];
}

/** 月干支（节气月：立春起寅月；五虎遁：甲己丙作首，乙庚戊为头，丙辛寻庚起，丁壬壬位流，戊癸甲寅求） */
export function ganzhiMonthOf(yearGanZhi, y, m, d, hour = 12) {
  const ygan = GANZHI.indexOf(yearGanZhi) % 10;
  // 定月支：立春→寅(2)，每节气+1
  let zhiIdx = 2;
  for (const j of jieqiOfYear(y)) {
    const jt = Date.parse(j.solar.replace(' ', 'T') + '+08:00');
    const curTs = Date.UTC(y, m - 1, d, hour - 8);
    if (curTs >= jt) {
      const order = JIE_ORDER.indexOf(j.name);
      if (order >= 0 && order % 2 === 0) zhiIdx = (order / 2 + 2) % 12; // 节（偶数序）：立春→寅 惊蛰→卯 …
    }
  }
  const WUHU_START = { 0: 2, 1: 4, 2: 6, 3: 8, 4: 0 }; // 甲己→丙(2), 乙庚→戊(4), 丙辛→庚(6), 丁壬→壬(8), 戊癸→甲(0)
  const startGan = WUHU_START[ygan % 5];
  const ganIdx = (startGan + (((zhiIdx - 2) % 12) + 12) % 12) % 10;
  return GAN[ganIdx] + ZHI[zhiIdx];
}

/** 时干支（五鼠遁：甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸壬子头） */
export function ganzhiHourOf(dayGanZhi, hour) {
  const dgan = GANZHI.indexOf(dayGanZhi) % 10;
  const WUSHU_START = { 0: 0, 1: 2, 2: 4, 3: 6, 4: 8 };
  const zhiIdx = Math.floor(((hour + 1) % 24) / 2) % 12;
  const ganIdx = (WUSHU_START[dgan % 5] + zhiIdx) % 10;
  return GAN[ganIdx] + ZHI[zhiIdx];
}

export { GAN, ZHI, GANZHI, JIE_ORDER, NAYIN, NAYIN_WUXING, CHANGSHENG_NAMES };
