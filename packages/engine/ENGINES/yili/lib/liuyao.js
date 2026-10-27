/**
 * 易理工程学 · 六爻引擎（P3）
 * 装卦（纳甲）/ 安世应 / 定六亲 / 六神 / 月建日辰旺衰 / 应期推算
 */
import { ZHI, GAN, GANZHI, changsheng, nayin } from './almanac.js';
import { relation } from './wuxing.js';

/** 八纯卦纳甲表：内卦三爻地支（初→三）、外卦三爻地支（四→上） */
export const NAJIA = {
  '乾': { inner: ['子', '寅', '辰'], outer: ['午', '申', '戌'] },
  '坎': { inner: ['寅', '辰', '午'], outer: ['申', '戌', '子'] },
  '艮': { inner: ['辰', '午', '申'], outer: ['戌', '子', '寅'] },
  '震': { inner: ['子', '寅', '辰'], outer: ['午', '申', '戌'] },
  '巽': { inner: ['丑', '亥', '酉'], outer: ['未', '巳', '卯'] },
  '离': { inner: ['卯', '丑', '亥'], outer: ['酉', '未', '巳'] },
  '坤': { inner: ['未', '巳', '卯'], outer: ['丑', '亥', '酉'] },
  '兑': { inner: ['巳', '卯', '丑'], outer: ['亥', '酉', '未'] }
};

/** 纳甲天干：乾内甲外壬、坎内戊外戊、艮内丙外丙、震内庚外庚、巽内辛外辛、离内己外己、坤内乙外癸、兑内丁外丁 */
export const NAJIA_GAN = {
  '乾': { inner: '甲', outer: '壬' }, '坎': { inner: '戊', outer: '戊' }, '艮': { inner: '丙', outer: '丙' },
  '震': { inner: '庚', outer: '庚' }, '巽': { inner: '辛', outer: '辛' }, '离': { inner: '己', outer: '己' },
  '坤': { inner: '乙', outer: '癸' }, '兑': { inner: '丁', outer: '丁' }
};

/** 八宫世应位置（六十四卦在世爻 1-6 变：宫首世六，一世世一……游魂世四、归魂世三） */
export const SHI_YAO = {
  '乾为天': 6, '天风姤': 1, '天山遁': 2, '天地否': 3, '风地观': 4, '山地剥': 5, '火地晋': 4, '火天大有': 3,
  '兑为泽': 6, '泽水困': 1, '泽地萃': 2, '泽山咸': 3, '水山蹇': 4, '地山谦': 5, '雷山小过': 4, '雷泽归妹': 3,
  '离为火': 6, '火山旅': 1, '火风鼎': 2, '火水未济': 3, '山水蒙': 4, '风水涣': 5, '天水讼': 4, '天火同人': 3,
  '震为雷': 6, '雷地豫': 1, '雷水解': 2, '雷风恒': 3, '地风升': 4, '水风井': 5, '泽风大过': 4, '泽雷随': 3,
  '巽为风': 6, '风天小畜': 1, '风火家人': 2, '风雷益': 3, '天雷无妄': 4, '火雷噬嗑': 5, '山雷颐': 4, '山风蛊': 3,
  '坎为水': 6, '水泽节': 1, '水雷屯': 2, '水火既济': 3, '泽火革': 4, '雷火丰': 5, '地火明夷': 4, '地水师': 3,
  '艮为山': 6, '山火贲': 1, '山天大畜': 2, '山泽损': 3, '火泽睽': 4, '天泽履': 5, '风泽中孚': 4, '风山渐': 3,
  '坤为地': 6, '地雷复': 1, '地泽临': 2, '地天泰': 3, '雷天大壮': 4, '泽天夬': 5, '水天需': 4, '水地比': 3
};

/** 宫五行 */
const GONG_WX = { '乾': '金', '兑': '金', '离': '火', '震': '木', '巽': '木', '坎': '水', '艮': '土', '坤': '土' };

/** 六亲：宫五行 × 爻支五行 → 父母/兄弟/子孙/妻财/官鬼 */
export function liuqin(gongWuxing, zhiWuxing) {
  const r = relation(gongWuxing, zhiWuxing);
  switch (r) {
    case '比和': return '兄弟';
    case '生': return '子孙';   // 宫生爻 = 子孙（我所生）
    case '被生': return '父母'; // 爻生宫 = 父母（生我者）
    case '克': return '妻财';   // 宫克爻 = 妻财（我克者）
    case '被克': return '官鬼'; // 爻克宫 = 官鬼（克我者）
    default: return null;
  }
}

/** 六神（按日干起青龙：甲乙起青龙，丙丁起朱雀，戊起勾陈，己起腾蛇，庚辛起白虎，壬癸起玄武） */
export const LIUSHEN_ORDER = ['青龙', '朱雀', '勾陈', '腾蛇', '白虎', '玄武'];
export function liuShenStart(dayGan) {
  const G = { '甲': 0, '乙': 0, '丙': 1, '丁': 1, '戊': 2, '己': 3, '庚': 4, '辛': 4, '壬': 5, '癸': 5 };
  return G[dayGan] ?? 0;
}
export function liuShen(dayGan, yaoIdx) {
  const start = liuShenStart(dayGan);
  return LIUSHEN_ORDER[(start + yaoIdx) % 6];
}

/**
 * 六爻装卦全流程
 * @param {string} fullName 卦全名（如 '水雷屯'）
 * @param {string} dayGanZhi 日干支（如 '甲子'）
 * @param {string} monthZhi 月建（如 '寅'）
 * @param {string} dayGan 日干（'甲'）
 * @returns 六爻明细
 */
export function zhuanggua(fullName, dayGanZhi, monthZhi, dayGan) {
  // 卦宫
  let gong = null;
  for (const [g, names] of Object.entries(SHI_GONG_MAP)) {
    if (names.includes(fullName)) { gong = g; break; }
  }
  const gongWx = GONG_WX[gong];
  const shi = SHI_YAO[fullName];
  const ying = shi === 1 ? 4 : shi === 2 ? 5 : shi === 3 ? 6 : shi === 4 ? 1 : shi === 5 ? 2 : shi === 6 ? 3 : null;
  // 上下卦
  const { upper, lower } = upperLower(fullName);
  const rows = [];
  const innerZhis = NAJIA[lower].inner;
  const outerZhis = NAJIA[upper].outer;
  const innerGan = NAJIA_GAN[lower].inner;
  const outerGan = NAJIA_GAN[upper].outer;
  const zhis = [...innerZhis, ...outerZhis];
  const gans = [innerGan, innerGan, innerGan, outerGan, outerGan, outerGan];
  for (let i = 0; i < 6; i++) {
    const yaoIdx = i; // 0=初
    const zhi = zhis[i];
    const gan = gans[i];
    const zhiWx = ZHI_WUXING_MAP[zhi];
    rows.push({
      yao: i + 1,
      position: ['初', '二', '三', '四', '五', '上'][i],
      ganZhi: gan + zhi,
      zhi,
      wuxing: zhiWx,
      liuqin: liuqin(gongWx, zhiWx),
      liuShen: liuShen(dayGan, i),
      shi: i + 1 === shi,
      ying: i + 1 === ying,
      // 旺衰（月建）：月支五行对爻支五行
      yueJian: monthRelation(monthZhi, zhi),
      // 日辰生克
      riChen: dayZhiRelation(dayGanZhi, zhi),
      // 旬空
      xunKong: isXunKong(dayGanZhi, zhi)
    });
  }
  return { gong, gongWuxing: gongWx, shi, ying, rows, fullName };
}

/** 八宫→卦名表（与 yijing.js GUA_FULL 对应） */
const SHI_GONG_MAP = {
  '乾': ['乾为天', '天风姤', '天山遁', '天地否', '风地观', '山地剥', '火地晋', '火天大有'],
  '兑': ['兑为泽', '泽水困', '泽地萃', '泽山咸', '水山蹇', '地山谦', '雷山小过', '雷泽归妹'],
  '离': ['离为火', '火山旅', '火风鼎', '火水未济', '山水蒙', '风水涣', '天水讼', '天火同人'],
  '震': ['震为雷', '雷地豫', '雷水解', '雷风恒', '地风升', '水风井', '泽风大过', '泽雷随'],
  '巽': ['巽为风', '风天小畜', '风火家人', '风雷益', '天雷无妄', '火雷噬嗑', '山雷颐', '山风蛊'],
  '坎': ['坎为水', '水泽节', '水雷屯', '水火既济', '泽火革', '雷火丰', '地火明夷', '地水师'],
  '艮': ['艮为山', '山火贲', '山天大畜', '山泽损', '火泽睽', '天泽履', '风泽中孚', '风山渐'],
  '坤': ['坤为地', '地雷复', '地泽临', '地天泰', '雷天大壮', '泽天夬', '水天需', '水地比']
};

const ZHI_WUXING_MAP = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };

/** 自然字 → 经卦名 */
const NATURE_TO_GUA = { '天': '乾', '泽': '兑', '火': '离', '雷': '震', '风': '巽', '水': '坎', '山': '艮', '地': '坤' };

/** 卦全名 → 上下经卦名（全名 = 上卦字 + 下卦字 + 卦名；纯卦 'X为X' 特例） */
function upperLower(fullName) {
  if (fullName.includes('为')) return { upper: fullName[0], lower: fullName[0] };
  return { upper: NATURE_TO_GUA[fullName[0]], lower: NATURE_TO_GUA[fullName[1]] };
}

/** 月建对爻支：月建五行与爻支五行关系（旺相休囚死简化：旺/相/休/囚/死） */
export function monthRelation(monthZhi, zhi) {
  const m = ZHI_WUXING_MAP[monthZhi];
  const z = ZHI_WUXING_MAP[zhi];
  const r = relation(m, z);
  if (r === '比和') return '旺';
  if (r === '生') return '相';    // 月生爻
  if (r === '被生') return '休';  // 爻生月
  if (r === '克') return '死';    // 月克爻
  return '囚';                    // 爻克月
}

/** 日辰与爻支关系（生/克/比） */
export function dayZhiRelation(dayGanZhi, zhi) {
  const dz = dayGanZhi.slice(1);
  if (dz === zhi) return '比';
  const d = ZHI_WUXING_MAP[dz];
  const z = ZHI_WUXING_MAP[zhi];
  const r = relation(d, z);
  if (r === '生') return '生';
  if (r === '克') return '克';
  if (r === '被生') return '受生';
  if (r === '被克') return '受克';
  return '比';
}

/** 旬空判定：日柱所在旬的空亡支 */
export function isXunKong(dayGanZhi, zhi) {
  const idx = GANZHI.indexOf(dayGanZhi);
  const head = idx - (idx % 10);
  const kong1 = ZHI[(head + 10) % 12];
  const kong2 = ZHI[(head + 11) % 12];
  return zhi === kong1 || zhi === kong2;
}

/** 用神库：问事 → 六亲 */
export const YONGSHEN_LIB = {
  '财': '妻财', '生意': '妻财', '交易': '妻财', '求财': '妻财', '投资': '妻财', '债务': '妻财',
  '官': '官鬼', '事业': '官鬼', '工作': '官鬼', '升迁': '官鬼', '官司': '官鬼', '名誉': '官鬼', '丈夫': '官鬼',
  '文书': '父母', '考试': '父母', '学业': '父母', '长辈': '父母', '房宅': '父母', '车': '父母', '印章': '父母',
  '子孙': '子孙', '子女': '子孙', '医药': '子孙', '下属': '子孙', '晚辈': '子孙', '平安': '子孙',
  '兄弟': '兄弟', '朋友': '兄弟', '同辈': '兄弟', '合伙': '兄弟', '竞争': '兄弟'
};
export function yongshenFor(topic) {
  for (const [k, v] of Object.entries(YONGSHEN_LIB)) {
    if (topic.includes(k)) return v;
  }
  return null;
}

/** 应期推算：动爻/用神 + 冲合空破规则 → 候选应期 */
export function yingqiHints(rows, targetLiqin) {
  const hints = [];
  const target = rows.find(r => r.liuqin === targetLiqin);
  if (!target) return hints;
  const z = target.zhi;
  const chong = { '子': '午', '午': '子', '丑': '未', '未': '丑', '寅': '申', '申': '寅', '卯': '酉', '酉': '卯', '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳' };
  const he = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
  hints.push({ rule: '用神值日', desc: `${targetLiqin}爻${z}日应`, zhi: z });
  hints.push({ rule: '冲日应', desc: `冲${z}之${chong[z]}日（逢冲则动）`, zhi: chong[z] });
  hints.push({ rule: '合日应', desc: `${z}与${he[z]}合日`, zhi: he[z] });
  if (target.xunKong) {
    hints.push({ rule: '出空', desc: `${z}旬空，出空之日应`, zhi: z });
    hints.push({ rule: '冲空', desc: `冲${z}之${chong[z]}日（冲空则实）`, zhi: chong[z] });
  }
  return hints;
}

/** 完整六爻决策分析 */
export function liuyaoAnalysis({ fullName, dayGanZhi, monthZhi, dayGan, topic, hour = 12 }) {
  const gua = zhuanggua(fullName, dayGanZhi, monthZhi, dayGan);
  const yongshen = topic ? yongshenFor(topic) : null;
  const yongshenRow = yongshen ? gua.rows.find(r => r.liuqin === yongshen) : null;
  const shiRow = gua.rows.find(r => r.shi);
  const yingRow = gua.rows.find(r => r.ying);
  return {
    ...gua,
    yongshen,
    yongshenRow: yongshenRow ? { position: yongshenRow.position, zhi: yongshenRow.zhi, wuxing: yongshenRow.wuxing, yueJian: yongshenRow.yueJian, riChen: yongshenRow.riChen, xunKong: yongshenRow.xunKong } : null,
    shiVsYing: shiRow && yingRow ? {
      shiWuxing: shiRow.wuxing, yingWuxing: yingRow.wuxing,
      relation: relation(shiRow.wuxing, yingRow.wuxing)
    } : null,
    yingqi: yongshen ? yingqiHints(gua.rows, yongshen) : []
  };
}
