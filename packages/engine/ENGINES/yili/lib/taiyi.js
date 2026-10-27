/**
 * 易理工程学 · 太乙神数引擎（P3）
 * 太乙积年（《太乙金镜式经》为主本）+ 十六神落宫 + 九宫八门
 * 流派分歧登记机制：不同积年基数分歧全部登记并存，不武断取一
 */

/** 流派分歧登记：积年基数（上元甲子纪元点） */
export const JINIAN_SCHOOLS = {
  '金镜式经（主本）': { epochYear: -10153977, note: '《太乙金镜式经》上元甲子纪元' },
  '旧历家': { epochYear: -10153917, note: '差 60 年（一甲子）' },
  '新历家': { epochYear: -10154037, note: '差 60 年（一甲子）' }
};

/** 太乙积年（主本）：公元年 → 积年数 */
export function taiyiJinian(year, school = '金镜式经（主本）') {
  const epoch = JINIAN_SCHOOLS[school].epochYear;
  return year - epoch;
}

/** 太乙 360 年周期内年序 */
export function taiyiYearInCycle(year, school = '金镜式经（主本）') {
  const n = taiyiJinian(year, school);
  return ((n % 360) + 360) % 360;
}

/** 太乙行宫（简化：积年 mod 24 → 太乙所在宫，24 宫序为传统式盘） */
export function taiyiPalace(year, school = '金镜式经（主本）') {
  const n = taiyiJinian(year, school);
  // 传统：太乙每 24 年行一周（太乙式二十四宫）；以子为 1
  const idx = (((n - 1) % 24) + 24) % 24;
  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  return {
    palace24: idx + 1,
    gan: GAN[idx % 10],
    zhi: ZHI[idx % 12],
    yearInCycle: taiyiYearInCycle(year, school)
  };
}

/** 十六神（太乙式）：名 + 属性 */
export const SHI_LIU_SHEN = [
  { name: '地主', kind: '阳' }, { name: '阳德', kind: '阳' }, { name: '和德', kind: '阳' }, { name: '吕申', kind: '阳' },
  { name: '高丛', kind: '阳' }, { name: '太阳', kind: '阳' }, { name: '大炅', kind: '阳' }, { name: '大神', kind: '阳' },
  { name: '大威', kind: '阳' }, { name: '天道', kind: '阳' }, { name: '大武', kind: '阳' }, { name: '武德', kind: '阳' },
  { name: '太簇', kind: '阴' }, { name: '阴主', kind: '阴' }, { name: '阴德', kind: '阴' }, { name: '大义', kind: '阴' }
];

/** 十六神落宫（简化：太乙积年 mod 16 起布） */
export function shiliushenBoard(year, school = '金镜式经（主本）') {
  const n = taiyiJinian(year, school);
  const start = ((n % 16) + 16) % 16;
  const out = {};
  for (let i = 0; i < 16; i++) {
    out[SHI_LIU_SHEN[(start + i) % 16].name] = (i % 9) + 1;
  }
  return out;
}

/** 太乙九宫八门（简化：九宫配八门，太乙所在宫为值事门起点） */
export function taiyiBaMen(year, school = '金镜式经（主本）') {
  const p = taiyiPalace(year, school);
  const palaces = ['坎', '坤', '震', '巽', '中', '乾', '兑', '艮', '离'];
  const men = ['休门', '死门', '伤门', '杜门', '中门', '开门', '惊门', '生门', '景门'];
  const out = {};
  for (let i = 0; i < 9; i++) out[palaces[i]] = men[(i + (p.palace24 % 9)) % 9];
  return out;
}

/** 完整太乙分析 */
export function taiyiCalc(year, school = '金镜式经（主本）') {
  return {
    year,
    school,
    jinian: taiyiJinian(year, school),
    yearInCycle: taiyiYearInCycle(year, school),
    palace: taiyiPalace(year, school),
    shiliushen: shiliushenBoard(year, school),
    bamen: taiyiBaMen(year, school),
    schools: JINIAN_SCHOOLS,
    note: '流派分歧已登记（金镜式经为主本，其余并存不武断）'
  };
}
