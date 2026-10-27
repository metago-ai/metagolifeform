/**
 * 易理工程学 · 紫微斗数引擎（P3）
 * 安星全流程：命宫身宫 → 十二宫 → 五行局 → 紫微/天府 → 十四主星 → 六吉六煞 → 四化
 */

/** 十二宫（地支位） */
export const ZIWEI_PALACES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 十二宫域 */
export const GONG_DOMAINS = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];

/** 纳音 → 五行局 */
const NAYIN_JU = { '水': 2, '木': 3, '金': 4, '土': 5, '火': 6 };
const NAYIN_WX = {
  '海中金': '金', '炉中火': '火', '大林木': '木', '路旁土': '土', '剑锋金': '金', '山头火': '火',
  '涧下水': '水', '城头土': '土', '白蜡金': '金', '杨柳木': '木', '泉中水': '水', '屋上土': '土',
  '霹雳火': '火', '松柏木': '木', '长流水': '水', '沙中金': '金', '山下火': '火', '平地木': '木',
  '壁上土': '土', '金箔金': '金', '覆灯火': '火', '天河水': '水', '大驿土': '土', '钗钏金': '金',
  '桑柘木': '木', '大溪水': '水', '沙中土': '土', '天上火': '火', '石榴木': '木', '大海水': '水'
};

/** 紫微在子基准表 → 旋转法 */
const ZIWEI_AT_ZI = { '紫微': 0, '天机': 11, '太阳': 9, '武曲': 8, '天同': 7, '廉贞': 6, '天府': 4, '太阴': 5, '贪狼': 2, '巨门': 1, '天相': 3, '天梁': 2, '七杀': 10, '破军': 6 };

/** 六吉六煞 */
export const SIX_AUSPICIOUS = ['文昌', '文曲', '左辅', '右弼', '天魁', '天钺'];
export const SIX_MALEFIC = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];

/** 四化表（生年干） */
export const SHI_HUA = {
  '甲': { 禄: '廉贞', 权: '破军', 科: '武曲', 忌: '太阳' },
  '乙': { 禄: '天机', 权: '天梁', 科: '紫微', 忌: '太阴' },
  '丙': { 禄: '天同', 权: '天机', 科: '文昌', 忌: '廉贞' },
  '丁': { 禄: '太阴', 权: '天同', 科: '天机', 忌: '巨门' },
  '戊': { 禄: '贪狼', 权: '太阴', 科: '右弼', 忌: '天机' },
  '己': { 禄: '武曲', 权: '贪狼', 科: '天梁', 忌: '文曲' },
  '庚': { 禄: '太阳', 权: '武曲', 科: '太阴', 忌: '天同' },
  '辛': { 禄: '巨门', 权: '太阳', 科: '文曲', 忌: '文昌' },
  '壬': { 禄: '天梁', 权: '紫微', 科: '左辅', 忌: '武曲' },
  '癸': { 禄: '破军', 权: '巨门', 科: '太阴', 忌: '贪狼' }
};

/**
 * 紫微安星
 * @param {number} birthDay 农历生日（1-30）
 * @param {string} nayinName 生年纳音（如 '海中金'）
 * @returns 紫微宫偏移（0=子）
 */
export function ziweiStar(birthDay, nayinName) {
  const wx = NAYIN_WX[nayinName];
  const ju = NAYIN_JU[wx];
  if (!ju) return null;
  return ((birthDay + ju - 7) % 12 + 12) % 12;
}

/** 天府宫 = 紫微宫 + 9（紫微-天府差：紫微子→天府辰 = +4？基准：紫微子(0)、天府辰(4)。旋转保持差 = +4） */
export function tianfuStar(ziweiIdx) {
  return (ziweiIdx + 4) % 12;
}

/** 十四主星落宫（紫微宫 → 各星偏移，旋转基准表） */
export function mainStars(ziweiIdx) {
  const out = {};
  for (const [star, base] of Object.entries(ZIWEI_AT_ZI)) {
    out[star] = ((base + (ziweiIdx - 0)) % 12 + 12) % 12;
  }
  return out;
}

/**
 * 安命宫：寅宫起正月顺数生月，至生月宫逆数生时
 * 安身宫：寅宫起正月顺数生月，至生月宫顺数生时
 */
export function mingShenGong(birthMonth, birthHour) {
  const hourZhi = Math.floor(((birthHour + 1) % 24) / 2); // 时辰（0=子）
  const monthIdx = (birthMonth - 1) % 12;
  const startFromYin = 2; // 寅
  const monthPalace = (startFromYin + monthIdx) % 12;
  const ming = ((monthPalace - hourZhi) % 12 + 12) % 12;
  const shen = (monthPalace + hourZhi) % 12;
  return { ming, shen };
}

/** 十二宫排布：命宫起逆时针布十二宫域 */
export function palaceDomains(mingIdx) {
  const out = {};
  for (let i = 0; i < 12; i++) {
    const idx = ((mingIdx - i) % 12 + 12) % 12;
    out[GONG_DOMAINS[i]] = idx;
  }
  return out;
}

/** 三方四正：命宫的三方（+4、+8 宫）与四正（对宫 +6） */
export function sanfangSizheng(mingIdx) {
  return {
    sanfang: [mingIdx, (mingIdx + 4) % 12, (mingIdx + 8) % 12],
    sizheng: [mingIdx, (mingIdx + 4) % 12, (mingIdx + 8) % 12, (mingIdx + 6) % 12]
  };
}

/** 五行局（纳音名 → 局数） */
export function wuxingJu(nayinName) {
  const wx = NAYIN_WX[nayinName];
  return wx ? NAYIN_JU[wx] : null;
}

/**
 * 紫微全盘
 * @returns 十二宫各宫主星/四化/吉煞 + 命身宫 + 五行局
 */
export function ziweiCalc({ lunarYear, birthMonth, birthDay, birthHour, yearGanZhi, nayinYear }) {
  const yearGan = yearGanZhi[0];
  const ju = wuxingJu(nayinYear);
  const zw = ziweiStar(birthDay, nayinYear);
  const tf = tianfuStar(zw);
  const stars = mainStars(zw);
  const { ming, shen } = mingShenGong(birthMonth, birthHour);
  const domains = palaceDomains(ming);
  const hua = SHI_HUA[yearGan] || {};
  const board = {};
  for (let i = 0; i < 12; i++) {
    const domain = Object.keys(domains).find(k => domains[k] === i);
    const starsHere = Object.entries(stars).filter(([, idx]) => idx === i).map(([name]) => name);
    const huaHere = Object.entries(hua).filter(([, star]) => starsHere.includes(star)).map(([type]) => type);
    board[ZIWEI_PALACES[i]] = {
      domain,
      stars: starsHere,
      hua: huaHere,
      isMing: i === ming,
      isShen: i === shen
    };
  }
  return {
    board,
    ming: ZIWEI_PALACES[ming],
    shen: ZIWEI_PALACES[shen],
    wuxingJu: ju,
    ziwei: ZIWEI_PALACES[zw],
    tianfu: ZIWEI_PALACES[tf],
    sihua: hua,
    sanfang: sanfangSizheng(ming),
    lunarYear, birthMonth, birthDay, birthHour, yearGanZhi
  };
}
