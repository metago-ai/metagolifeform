/**
 * 易理工程学 · 奇门遁甲引擎（P3 · 工程最重）
 * 时家奇门：节气定局（阴阳遁 18 局）→ 三元 → 三奇六仪排布 → 值符值使 → 九星/八门/八神落宫
 * 状态空间：1080 局全枚举可生成
 */
import { GANZHI, ganzhiDayOfDate, jieqiOfYear } from './almanac.js';

/** 九宫（洛书序：坎一坤二震三巽四中五乾六兑七艮八离九） */
export const NINE_PALACES = ['坎', '坤', '震', '巽', '中', '乾', '兑', '艮', '离'];
export const PALACE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** 节气 → 上中下元局数口诀（阳遁 9 局/阴遁 9 局） */
export const DUN_RULES = {
  // 阳遁（冬至→夏至前）
  yang: {
    '冬至': [1, 7, 4], '小寒': [2, 8, 5], '大寒': [3, 9, 6],
    '立春': [8, 5, 2], '雨水': [9, 6, 3], '惊蛰': [1, 7, 4],
    '春分': [3, 9, 6], '清明': [4, 1, 7], '谷雨': [5, 2, 8],
    '立夏': [4, 1, 7], '小满': [5, 2, 8], '芒种': [6, 3, 9]
  },
  // 阴遁（夏至→冬至前）
  yin: {
    '夏至': [9, 3, 6], '小暑': [8, 2, 5], '大暑': [7, 1, 4],
    '立秋': [2, 5, 8], '处暑': [1, 4, 7], '白露': [9, 3, 6],
    '秋分': [7, 1, 4], '寒露': [6, 9, 3], '霜降': [5, 8, 2],
    '立冬': [6, 9, 3], '小雪': [5, 8, 2], '大雪': [4, 7, 1]
  }
};

/** 三元定元：日柱序 mod 15 = 0 上元、5 下元、10 中元 */
export function yuanOfDay(dayGanZhi) {
  const idx = GANZHI.indexOf(dayGanZhi);
  const r = idx % 15;
  if (r === 0) return '上元';
  if (r === 5) return '下元';
  if (r === 10) return '中元';
  // 非符头日：归入前一个符头之元
  const back = (idx - r) % 60; // 最近符头
  const rb = back % 15;
  if (rb === 0) return '上元';
  if (rb === 5) return '下元';
  return '中元';
}

/** 定局：日期 → { dunType: 'yang'|'yin', jieqi, yuan, ju } */
export function dingJu(y, m, d) {
  const jq = jieqiOfYear(y);
  const prevJq = jieqiOfYear(y - 1);
  const ts = Date.UTC(y, m - 1, d);
  // 最近的冬至/夏至（跨年）：日期在 [冬至, 夏至) → 阳遁；[夏至, 冬至) → 阴遁
  const dzThis = jq.find(j => j.name === '冬至');
  const xzThis = jq.find(j => j.name === '夏至');
  const dzPrev = prevJq.find(j => j.name === '冬至');
  const candidates = [
    { name: '冬至', ts: Date.parse(dzPrev.solar.replace(' ', 'T') + '+08:00'), type: 'yang' },
    { name: '夏至', ts: Date.parse(xzThis.solar.replace(' ', 'T') + '+08:00'), type: 'yin' },
    { name: '冬至', ts: Date.parse(dzThis.solar.replace(' ', 'T') + '+08:00'), type: 'yang' }
  ];
  let latest = candidates[0];
  for (const c of candidates) if (c.ts <= ts && c.ts >= latest.ts) latest = c;
  const dunType = latest.type;
  // 当前节（立春惊蛰清明立夏芒种小暑立秋白露寒露立冬大雪小寒 + 冬至/夏至）
  const JIE_NAMES = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
  let jieqiName = '冬至';
  for (const j of jq) {
    const jt = Date.parse(j.solar.replace(' ', 'T') + '+08:00');
    if (jt <= ts && (JIE_NAMES.includes(j.name) || j.name === '冬至' || j.name === '夏至')) jieqiName = j.name;
  }
  const yuan = yuanOfDay(ganzhiDayOfDate(y, m, d));
  const rules = DUN_RULES[dunType];
  const ju = rules[jieqiName] ? rules[jieqiName][{ '上元': 0, '中元': 1, '下元': 2 }[yuan]] : 1;
  return { dunType, jieqi: jieqiName, yuan, ju };
}

/** 三奇六仪排布：六仪戊己庚辛壬癸 + 三奇丁丙乙（乙丙丁）。阳遁顺布、阴遁逆布，从局数宫起 */
export function sanqiLiuyi(dunType, ju) {
  const seq = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
  const start = ju; // 局数宫号（1-9）
  const out = {};
  for (let i = 0; i < 9; i++) {
    let palace = start - 1;
    if (dunType === 'yang') palace = (palace + i) % 9;
    else palace = ((palace - i) % 9 + 9) % 9;
    out[NINE_PALACES[palace]] = seq[i];
  }
  return out;
}

/** 九星（中宫天禽寄坤二宫） */
export const JIU_XING = { '坎': '天蓬', '坤': '天芮', '震': '天冲', '巽': '天辅', '中': '天禽', '乾': '天心', '兑': '天柱', '艮': '天任', '离': '天英' };
/** 八门 */
export const BA_MEN = { '坎': '休门', '坤': '死门', '震': '伤门', '巽': '杜门', '中': '中门', '乾': '开门', '兑': '惊门', '艮': '生门', '离': '景门' };
/** 八神（阳遁顺排、阴遁逆排，值符起） */
export const BA_SHEN = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];

/** 旬首：时柱 → 六甲旬首 */
export function xunShou(hourGanZhi) {
  const idx = GANZHI.indexOf(hourGanZhi);
  const head = idx - (idx % 10);
  const map = { 0: '甲子', 10: '甲戌', 20: '甲申', 30: '甲午', 40: '甲辰', 50: '甲寅' };
  return map[head];
}

/** 六甲旬首对应六仪：甲子戊、甲戌己、甲申庚、甲午辛、甲辰壬、甲寅癸 */
const XUNSHOU_YI = { '甲子': '戊', '甲戌': '己', '甲申': '庚', '甲午': '辛', '甲辰': '壬', '甲寅': '癸' };

/**
 * 时家奇门排盘
 * @returns 完整盘面
 */
export function qimenCalc(y, m, d, hour) {
  const { dunType, jieqi, yuan, ju } = dingJu(y, m, d);
  const dayGz = ganzhiDayOfDate(y, m, d);
  const hourZhi = Math.floor(((hour + 1) % 24) / 2);
  // 时柱干支（五鼠遁简化：按日干起）
  const hourGz = GANZHI[((GANZHI.indexOf(dayGz) % 10 % 5) * 2 + hourZhi) % 60]; // 简化：日干定子时干
  const xun = xunShou(hourGz);
  const yi = XUNSHOU_YI[xun];
  const liuyi = sanqiLiuyi(dunType, ju);
  // 值符宫 = 旬首六仪落宫
  const fuGong = Object.keys(liuyi).find(p => liuyi[p] === yi) || '坎';
  // 九星八门落宫：值符星随六仪落宫（简化：值符宫起布九星/八门）
  const xingOrder = ['天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心', '天禽'];
  const menOrder = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门'];
  const board = {};
  const startIdx = PALACE_NUMBERS.indexOf(ju) >= 0 ? ju - 1 : 0;
  for (let i = 0; i < 9; i++) {
    const p = NINE_PALACES[(startIdx + (dunType === 'yang' ? i : -i + 8)) % 9];
    board[p] = { yi: liuyi[p] };
  }
  // 九星落宫（值符星在值符宫，其余按宫序）
  const xingBoard = {};
  for (let i = 0; i < 9; i++) {
    const p = NINE_PALACES[i];
    xingBoard[p] = i === 4 ? '天禽' : xingOrder[(i + (NINE_PALACES.indexOf(fuGong) >= 0 ? NINE_PALACES.indexOf(fuGong) : 0)) % 9];
  }
  return {
    dunType, jieqi, yuan, ju, dayGz, hourGz, hourZhi, xunShou: xun,
    liuyi, fuGong,
    board,
    xingBoard,
    menBoard: menOrderBoard(dunType, ju),
    shenBoard: shenBoard(dunType, fuGong),
    fullEnumeration: 1080 // 状态空间：18 局 × 60 时
  };
}

function menOrderBoard(dunType, ju) {
  const men = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门'];
  const out = {};
  const start = ju - 1;
  for (let i = 0; i < 9; i++) {
    const p = NINE_PALACES[i];
    out[p] = i === 4 ? '中门' : men[(i - start + 8) % 8];
  }
  return out;
}

function shenBoard(dunType, fuGong) {
  const out = {};
  const start = NINE_PALACES.indexOf(fuGong);
  for (let i = 0; i < 8; i++) {
    const idx = dunType === 'yang' ? (start + i) % 9 : ((start - i) % 9 + 9) % 9;
    out[NINE_PALACES[idx]] = BA_SHEN[i];
  }
  return out;
}
