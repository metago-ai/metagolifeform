/**
 * 易理工程学 · 文言微积分引擎（P4）
 * 察机（势函数驻点）/ 应期（解时方程）/ 势函数 U(象,时)
 */
import { jieqiOfYear } from './almanac.js';

/**
 * 势函数 U(象, 时)：状态 × 时间 → ℝ
 * 模型：U = Σ 因子贡献 × 时间调制（旺相休囚死系数）+ 周期项
 * @param {object} state 状态：{ factors: [{name, wuxing, weight}] }
 * @param {number} t 时间（天，从基准起）
 * @param {object} seasonCoef 季节调制 {wuxing: coef}
 */
export function potential(state, t, seasonCoef) {
  let U = 0;
  for (const f of state.factors || []) {
    const coef = seasonCoef ? (seasonCoef[f.wuxing] ?? 1) : 1;
    U += (f.weight || 1) * coef;
  }
  // 周期项：年周期（365.2422 天）
  U += (state.annualAmplitude || 0) * Math.cos((2 * Math.PI * t) / 365.2422 + (state.phase || 0));
  return U;
}

/**
 * 察机：求势函数驻点（dU/dt = 0）——数值法（黄金分割/扫描）
 * @returns {Array<{t, U, kind: '峰'|'谷'|'鞍'}>}
 */
export function chaJi(state, seasonCoef, t0 = 0, t1 = 365.2422, step = 1) {
  const pts = [];
  for (let t = t0; t <= t1; t += step) {
    pts.push({ t, U: potential(state, t, seasonCoef) });
  }
  const extremes = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1].U, b = pts[i].U, c = pts[i + 1].U;
    if (b > a && b > c) extremes.push({ t: pts[i].t, U: b, kind: '峰' });
    if (b < a && b < c) extremes.push({ t: pts[i].t, U: c, kind: '谷' });
  }
  return extremes;
}

/** 应期：解 U(象, t) = 阈值 的时（数值扫描） */
export function yingqi(state, seasonCoef, threshold, t0 = 0, t1 = 365.2422, step = 1) {
  const hits = [];
  let prev = potential(state, t0, seasonCoef);
  for (let t = t0 + step; t <= t1; t += step) {
    const cur = potential(state, t, seasonCoef);
    if ((prev - threshold) * (cur - threshold) <= 0) {
      hits.push({ t, U: cur, approx: true });
    }
    prev = cur;
  }
  return hits;
}

/** 禾势（累积势能）：∫U dt（数值积分，梯形法） */
export function heShi(state, seasonCoef, t0 = 0, t1 = 365.2422, step = 1) {
  let sum = 0;
  let prevT = t0, prevU = potential(state, t0, seasonCoef);
  for (let t = t0 + step; t <= t1; t += step) {
    const U = potential(state, t, seasonCoef);
    sum += ((prevU + U) / 2) * (t - prevT);
    prevT = t; prevU = U;
  }
  return sum;
}

/** 文言微积分报告 */
export function shushuCalculus(state, seasonCoef, opts = {}) {
  const extremes = chaJi(state, seasonCoef, opts.t0, opts.t1, opts.step);
  const jq = [];
  for (const e of extremes) {
    const day = Math.floor(e.t);
    jq.push({ 机: e.kind === '峰' ? '势之极（峰）' : '势之谷', 彳U: 0, 象时: `t=${day.toFixed(1)}天`, U: +e.U.toFixed(3) });
  }
  return {
    象势函数: 'U = Σ 权重×季节系数 + A·cos(2πt/T + φ)',
    察机: jq,
    应期: opts.threshold !== undefined ? yingqi(state, seasonCoef, opts.threshold, opts.t0, opts.t1, opts.step) : [],
    禾势: +heShi(state, seasonCoef, opts.t0, opts.t1, opts.step).toFixed(2),
    规则: 'R-CAL-01 势函数模型（启发式，非因果断言）',
    置信度: '结构 100%，结论启发式'
  };
}
