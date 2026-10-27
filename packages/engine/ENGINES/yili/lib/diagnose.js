/**
 * 易理工程学 · 象数诊断引擎（P4）
 * 组织/要素五行映射 → 生克回路分析 → 断"穴位"（最小干预杠杆点）
 */
import { relation, wangxiangOfSeason, circuitAnalysis } from './wuxing.js';
import { ZHI, GAN } from './almanac.js';

/** 要素五行判定（关键词 → 五行，基于五行属性表） */
const KEYWORD_WX = {
  '木': ['教育', '文化', '出版', '纺织', '农林', '培训', '文案', '设计', '成长', '创新'],
  '火': ['市场', '营销', '品牌', '传媒', '公关', '视觉', '热情', '传播', '餐饮', '能源'],
  '土': ['管理', '运营', '人力', '财务', '合规', '基建', '仓储', '稳定', '协调', '地产'],
  '金': ['销售', '商务', '法务', '风控', '机械', '金融', '审计', '纪律', '执行', '制造'],
  '水': ['研发', '数据', '物流', '调研', '情报', '流动', '创新', '知识', '渠道', '客户']
};

export function detectWuxing(name) {
  for (const [wx, keys] of Object.entries(KEYWORD_WX)) {
    if (keys.some(k => name.includes(k))) return wx;
  }
  return null;
}

/**
 * 象数诊断：要素集 → 五行映射 → 生克回路 → 杠杆点
 * @param {Array<{name, weight?}>} elements 组织要素
 * @param {string} season 季节五行（旺相休囚死）
 */
export function shushuDiagnose(elements, season) {
  const mapped = elements.map(e => ({
    name: e.name,
    wuxing: detectWuxing(e.name) || '土', // 未识别默认土（中枢）
    weight: e.weight || 1
  }));
  const ws = wangxiangOfSeason(season);
  const analysis = [];
  for (const el of mapped) {
    const rels = {};
    for (const other of mapped) {
      if (other === el) continue;
      rels[other.name] = relation(el.wuxing, other.wuxing);
    }
    analysis.push({
      name: el.name,
      wuxing: el.wuxing,
      seasonState: ws[el.wuxing].label,
      relations: rels
    });
  }
  // 杠杆点（最小干预穴位）：被克最多且权重高的要素（调整它影响面最大）
  const leverage = mapped.map(el => {
    const beKe = mapped.filter(o => o !== el && relation(o.wuxing, el.wuxing) === '克').length;
    const sheng = mapped.filter(o => o !== el && relation(el.wuxing, o.wuxing) === '生').length;
    return {
      name: el.name,
      wuxing: el.wuxing,
      被克数: beKe,
      生数: sheng,
      score: beKe * 2 + sheng + el.weight
    };
  }).sort((a, b) => b.score - a.score);
  const loops = circuitAnalysis(mapped.map(e => e.wuxing));
  return {
    elements: analysis,
    leverage: leverage[0] || null,
    loops: loops.loops,
    season,
    rule: 'R-DIAG-01 五行透镜（启发式）',
    note: '断"穴位"为最小干预心法杠杆点定位，非因果断言'
  };
}
