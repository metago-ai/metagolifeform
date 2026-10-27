/**
 * 易理工程学 · 河图洛书引擎（P2）
 * 幻方构造（奇数阶/双偶数阶/单偶数阶——算学宝鉴纵横图法）+ 九宫配卦配数
 */

/** 洛书九宫数（传统排布：戴九履一，左三右七，二四为肩，六八为足，五居中央） */
export const LUOSHU_GRID = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6]
];

/** 洛书九宫配后天八卦（坎一/坤二/震三/巽四/中五/乾六/兑七/艮八/离九） */
export const LUOSHU_GUA = {
  1: '坎', 2: '坤', 3: '震', 4: '巽', 5: '中', 6: '乾', 7: '兑', 8: '艮', 9: '离'
};

/** 河图生成数：一六共宗水、二七同道火、三八为朋木、四九为友金、五十同途土 */
export const HETU_PAIRS = {
  '水': [1, 6], '火': [2, 7], '木': [3, 8], '金': [4, 9], '土': [5, 10]
};

/** 奇数阶幻方（Siamese 法，n 为奇数） */
export function magicSquareOdd(n) {
  if (n % 2 === 0) throw new Error('magicSquareOdd 需要奇数阶');
  const sq = Array.from({ length: n }, () => new Array(n).fill(0));
  let r = 0, c = Math.floor(n / 2);
  for (let k = 1; k <= n * n; k++) {
    sq[r][c] = k;
    const nr = (r - 1 + n) % n, nc = (c + 1) % n;
    if (sq[nr][nc] !== 0) { r = (r + 1) % n; }
    else { r = nr; c = nc; }
  }
  return sq;
}

/** 双偶数阶幻方（n=4k，对称交换法） */
export function magicSquareDoubleEven(n) {
  if (n % 4 !== 0) throw new Error('magicSquareDoubleEven 需要 4 的倍数阶');
  const sq = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => i * n + j + 1));
  const k = n / 4;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const inA = (i % 4 < 2) === (j % 4 < 2) ? false : (i % 4 >= 2) === (j % 4 >= 2);
      // 对角区（4×4 子块的对角线）需要交换
      const ii = Math.floor(i / 4), jj = Math.floor(j / 4);
      const diag = (i % 4 === j % 4) || (i % 4 + j % 4 === 3);
      const corner = (ii + jj) % 2 === 0;
      if (diag === corner) {
        sq[i][j] = n * n + 1 - sq[i][j];
      }
    }
  }
  return sq;
}

/**
 * 单偶数阶幻方（n=4k+2）。
 * 当前实现：康威 LUX 变体，已验证 n=6（k=1）行/列/对角全等（算学宝鉴纵横图法同族）。
 * 交换规则（0/2/3/1 布局 + A↔C 左 k 列除中间行 + A↔C 中间行第 k+1 列）。
 */
export function magicSquareSingleEven(n) {
  if (n % 4 !== 2) throw new Error('magicSquareSingleEven 需要 4k+2 阶');
  if (n !== 6) throw new Error('单偶数阶幻方当前支持 k=1（六阶），已验证；更高阶请扩展 LUX 表');
  const m = n / 2;
  const k = (n - 2) / 4;
  const mid = Math.floor(m / 2);
  const A = magicSquareOdd(m);
  const sq = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      const v = A[i][j];
      sq[i][j] = v;                    // 左上 A
      sq[i][j + m] = v + 2 * m * m;    // 右上 B
      sq[i + m][j] = v + 3 * m * m;    // 左下 C
      sq[i + m][j + m] = v + m * m;    // 右下 D
    }
  }
  // 交换 A ↔ C：左 k 列（除中间行）
  for (let i = 0; i < m; i++) {
    if (i === mid) continue;
    for (let j = 0; j < k; j++) {
      const t = sq[i][j]; sq[i][j] = sq[i + m][j]; sq[i + m][j] = t;
    }
  }
  // 交换 A ↔ C：中间行第 k+1 列
  const t = sq[mid][k]; sq[mid][k] = sq[mid + m][k]; sq[mid + m][k] = t;
  return sq;
}

/** 通用幻方构造（算学宝鉴纵横图法：奇/双偶/单偶） */
export function magicSquare(n) {
  if (n % 2 === 1) return magicSquareOdd(n);
  if (n % 4 === 0) return magicSquareDoubleEven(n);
  return magicSquareSingleEven(n);
}

/** 幻方性质校验：行/列/对角线和相等 */
export function verifyMagicSquare(sq) {
  const n = sq.length;
  const target = (n * (n * n + 1)) / 2;
  const sums = [];
  for (let i = 0; i < n; i++) sums.push(sq[i].reduce((a, b) => a + b, 0));
  for (let j = 0; j < n; j++) { let s = 0; for (let i = 0; i < n; i++) s += sq[i][j]; sums.push(s); }
  let d1 = 0, d2 = 0;
  for (let i = 0; i < n; i++) { d1 += sq[i][i]; d2 += sq[i][n - 1 - i]; }
  sums.push(d1, d2);
  return { target, ok: sums.every(s => s === target), sums };
}

/** 九宫配卦：3×3 洛书 → 八卦名 */
export function luoshuWithGua() {
  return LUOSHU_GRID.map(row => row.map(v => ({ number: v, gua: LUOSHU_GUA[v] })));
}

/** 九宫方位：给定数字 → 方位（坎北/离南/震东/兑西/巽东南/乾西北/坤西南/艮东北/中） */
export function luoshuDirection(number) {
  const dir = {
    1: '北', 2: '西南', 3: '东', 4: '东南', 5: '中', 6: '西北', 7: '西', 8: '东北', 9: '南'
  };
  return dir[number] || null;
}
