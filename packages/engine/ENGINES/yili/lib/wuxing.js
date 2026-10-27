/**
 * 易理工程学 · 阴阳五行八卦引擎（P2）
 * 生克邻接矩阵 / 旺相休囚死调制 / 十二支合冲刑害破算子族
 */

/** 五行序：木火土金水（相生序） */
export const WUXING = ['木', '火', '土', '金', '水'];

/** 相生：木→火→土→金→水→木 */
export const SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
/** 相克：木→土→水→火→金→木 */
export const KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

/** 生克邻接矩阵 M⁵：行生列=1（生），行克列=-1（克），否则 0 */
export function wuxingMatrix() {
  const idx = Object.fromEntries(WUXING.map((w, i) => [w, i]));
  const M = Array.from({ length: 5 }, () => new Array(5).fill(0));
  for (const [a, b] of Object.entries(SHENG)) M[idx[a]][idx[b]] = 1;
  for (const [a, b] of Object.entries(KE)) M[idx[a]][idx[b]] = -1;
  return { matrix: M, index: idx };
}

/** 五行生克关系查询：a 对 b 是 生/克/比/被生/被克 */
export function relation(a, b) {
  if (a === b) return '比和';
  if (SHENG[a] === b) return '生';
  if (KE[a] === b) return '克';
  if (SHENG[b] === a) return '被生';
  if (KE[b] === a) return '被克';
  return '无';
}

/** 旺相休囚死：季节（月支五行）对某五行的 5 级活力系数 {2,1,0.5,0.25,0} */
const ZHI_WUXING = { '寅': '木', '卯': '木', '巳': '火', '午': '火', '辰': '土', '戌': '土', '丑': '土', '未': '土', '申': '金', '酉': '金', '亥': '水', '子': '水' };
export const WANGXIANG = { 2: '旺', 1: '相', 0.5: '休', 0.25: '囚', 0: '死' };

/** 月令五行 → 各五行旺相休囚死 */
export function wangxiangOfSeason(seasonWuxing) {
  const out = {};
  for (const w of WUXING) {
    if (w === seasonWuxing) out[w] = { coef: 2, label: '旺' };
    else if (SHENG[seasonWuxing] === w) out[w] = { coef: 1, label: '相' };
    else if (SHENG[w] === seasonWuxing) out[w] = { coef: 0.5, label: '休' };
    else if (KE[seasonWuxing] === w) out[w] = { coef: 0.25, label: '囚' };
    else out[w] = { coef: 0, label: '死' };
  }
  return out;
}

export function zhiWuxing(zhi) { return ZHI_WUXING[zhi]; }

/** 天干五行 */
export const GAN_WUXING = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };

/** 后天八卦五行/方位 */
export const BAGUA = {
  '乾': { wuxing: '金', direction: '西北', trigram: '☰', nature: '天' },
  '兑': { wuxing: '金', direction: '西', trigram: '☱', nature: '泽' },
  '离': { wuxing: '火', direction: '南', trigram: '☲', nature: '火' },
  '震': { wuxing: '木', direction: '东', trigram: '☳', nature: '雷' },
  '巽': { wuxing: '木', direction: '东南', trigram: '☴', nature: '风' },
  '坎': { wuxing: '水', direction: '北', trigram: '☵', nature: '水' },
  '艮': { wuxing: '土', direction: '东北', trigram: '☶', nature: '山' },
  '坤': { wuxing: '土', direction: '西南', trigram: '☷', nature: '地' }
};

/** 五行属性全表（方位/色/脏腑/行业/情志/季节/数字/行星/八卦/天干/地支） */
export const WUXING_ATTRS = {
  '木': { 方位: '东', 色: '青绿', 脏腑: '肝胆', 行业: '文教/农林/纺织/出版', 情志: '怒', 季节: '春', 数字: '3,8', 行星: '木星', 八卦: '震巽', 天干: '甲乙', 地支: '寅卯' },
  '火': { 方位: '南', 色: '赤红', 脏腑: '心小肠', 行业: '能源/餐饮/传媒/光电', 情志: '喜', 季节: '夏', 数字: '2,7', 行星: '火星', 八卦: '离', 天干: '丙丁', 地支: '巳午' },
  '土': { 方位: '中', 色: '黄棕', 脏腑: '脾胃', 行业: '地产/建筑/农业/仓储', 情志: '思', 季节: '长夏', 数字: '5,0', 行星: '土星', 八卦: '坤艮', 天干: '戊己', 地支: '辰戌丑未' },
  '金': { 方位: '西', 色: '白金银', 脏腑: '肺大肠', 行业: '金融/机械/军工/五金', 情志: '悲', 季节: '秋', 数字: '4,9', 行星: '金星', 八卦: '乾兑', 天干: '庚辛', 地支: '申酉' },
  '水': { 方位: '北', 色: '黑蓝', 脏腑: '肾膀胱', 行业: '物流/航运/水产/数据', 情志: '恐', 季节: '冬', 数字: '1,6', 行星: '水星', 八卦: '坎', 天干: '壬癸', 地支: '亥子' }
};

/** 五行闭环分析：要素集合 → 生克回路（正反馈=生链，负反馈=克链） */
export function circuitAnalysis(elements) {
  const idx = Object.fromEntries(WUXING.map((w, i) => [w, i]));
  const M = wuxingMatrix().matrix;
  const loops = [];
  // 枚举 3 环（生链 3 元：A生B生C生A；克链 3 元：A克B克C克A）
  for (const a of WUXING) {
    for (const b of WUXING) {
      for (const c of WUXING) {
        if (a === b || b === c || a === c) continue;
        if (M[idx[a]][idx[b]] === 1 && M[idx[b]][idx[c]] === 1 && M[idx[c]][idx[a]] === 1) {
          loops.push({ kind: '生链(正反馈)', chain: [a, b, c] });
        }
        if (M[idx[a]][idx[b]] === -1 && M[idx[b]][idx[c]] === -1 && M[idx[c]][idx[a]] === -1) {
          loops.push({ kind: '克链(负反馈)', chain: [a, b, c] });
        }
      }
    }
  }
  // 去重（旋转同构）
  const seen = new Set();
  const uniq = [];
  for (const lp of loops) {
    const key = lp.chain.join('');
    const r1 = lp.chain[1] + lp.chain[2] + lp.chain[0];
    const r2 = lp.chain[2] + lp.chain[0] + lp.chain[1];
    if (seen.has(key) || seen.has(r1) || seen.has(r2)) continue;
    seen.add(key); uniq.push(lp);
  }
  return { loops: uniq, elements };
}
