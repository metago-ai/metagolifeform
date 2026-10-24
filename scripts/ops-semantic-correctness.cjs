"use strict";
/**
 * ops-semantic-correctness.cjs — 39 个特化算子的**语义正确性**测试
 *
 * 此前只验过「有响应」（输出非空且随输入变化）。本脚本验「算得对」：
 * 用已知数学性质做断言，例如：
 *   - entropy([1,1,1,1]) === 0（完全均匀 → 零熵）
 *   - entropy 在分布更分散时应更大
 *   - median 必须落在数据区间内且等于真中位数
 *   - zscore 的均值应约为 0
 *   - iqr 必须 <= range
 *   - gini([1,1,1,1]) === 0（完全平等）
 *   - rank 单调不减
 */
const E = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine/atoms/specialized.cjs";
const { OPS } = require(E);

const p = (x, n) => String(x).padEnd(n).slice(0, n);
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

let pass = 0, fail = 0;
const fails = [];
function T(name, cond, detail) {
  if (cond) { pass++; console.log("  ✓ " + p(name, 44) + (detail || "")); }
  else { fail++; fails.push(name + " | " + (detail || "")); console.log("  ✗ " + p(name, 44) + (detail || "")); }
}

console.log("=".repeat(90));
console.log("特化算子语义正确性");
console.log("=".repeat(90));

/* ---------- entropy ---------- */
console.log("\n【entropy 信息熵】");
{
  const uni = OPS.entropy([1, 1, 1, 1]);
  const skew = OPS.entropy([10, 1, 1, 1]);
  const two = OPS.entropy([1, 1, 0, 0]);
  const v1 = uni.entropy !== undefined ? uni.entropy : (uni.value !== undefined ? uni.value : uni);
  const v2 = skew.entropy !== undefined ? skew.entropy : (skew.value !== undefined ? skew.value : skew);
  const v3 = two.entropy !== undefined ? two.entropy : (two.value !== undefined ? two.value : two);
  T("均匀分布熵 = 0", typeof v1 === "number" && near(v1, 0, 1e-9), `熵=${v1}`);
  T("偏斜分布熵 > 均匀分布熵", typeof v2 === "number" && v2 > v1, `${v2} > ${v1}`);
  T("两等分熵 < 四等分熵", typeof v3 === "number" && v1 > v3, `四等分=${v1} 两等分=${v3}`);
  T("熵非负", [v1, v2, v3].every(x => x >= 0), "");
}

/* ---------- gini ---------- */
console.log("\n【gini 基尼系数】");
{
  const eq = OPS.gini([5, 5, 5, 5]);
  const un = OPS.gini([0, 0, 0, 100]);
  const g1 = eq.gini !== undefined ? eq.gini : (eq.value !== undefined ? eq.value : eq);
  const g2 = un.gini !== undefined ? un.gini : (un.value !== undefined ? un.value : un);
  T("完全平等 gini = 0", typeof g1 === "number" && near(g1, 0, 1e-9), `gini=${g1}`);
  T("极不平等 gini 接近 1", typeof g2 === "number" && g2 > 0.7, `gini=${g2}`);
  T("gini 在 [0,1]", g1 >= 0 && g1 <= 1 && g2 >= 0 && g2 <= 1, "");
}

/* ---------- median ---------- */
console.log("\n【median 中位数】");
{
  const r1 = OPS.median([1, 2, 3, 4, 5]);
  const r2 = OPS.median([1, 2, 3, 4]);
  const r3 = OPS.median([5, 1, 3]);
  const g = (r) => r.median !== undefined ? r.median : (r.value !== undefined ? r.value : r);
  T("奇数个 → 3", near(g(r1), 3), `=${g(r1)}`);
  T("偶数个 → 2.5", near(g(r2), 2.5), `=${g(r2)}`);
  T("乱序输入 → 3（不依赖顺序）", near(g(r3), 3), `=${g(r3)}`);
}

/* ---------- iqr ---------- */
console.log("\n【iqr 四分位距】");
{
  const r = OPS.iqr([1, 2, 3, 4, 5, 6, 7, 8]);
  const v = r.iqr !== undefined ? r.iqr : (r.value !== undefined ? r.value : r);
  T("iqr 为数值且 >= 0", typeof v === "number" && v >= 0, `iqr=${v}`);
  T("iqr <= 极差", typeof v === "number" && v <= 7, `${v} <= 7`);
}

/* ---------- zscore ---------- */
console.log("\n【zscore 标准分】");
{
  const V = [2, 4, 4, 4, 5, 5, 7, 9];
  const r = OPS.zscore(V);
  const zs = r.zscores || r.zScores || r.zscore || r.scores || r.values;
  if (Array.isArray(zs) && zs.length === V.length) {
    const mean = zs.reduce((a, x) => a + x, 0) / zs.length;
    T("z 分均值 ≈ 0", near(mean, 0, 1e-6), `mean=${mean.toFixed(9)}`);
    const sd = Math.sqrt(zs.reduce((a, x) => a + x * x, 0) / zs.length);
    T("z 分标准差 ≈ 1", near(sd, 1, 1e-6), `sd=${sd.toFixed(9)}`);
  } else {
    T("zscore 返回逐元素数组", false, "返回: " + JSON.stringify(r).slice(0, 80));
  }
}

/* ---------- rank ---------- */
console.log("\n【rank 秩】");
{
  const r = OPS.rank([10, 30, 20]);
  const arr = r.ranks || r.rank || r.values || r;
  if (Array.isArray(arr)) {
    T("返回数组且长度一致", arr.length === 3, JSON.stringify(arr));
    // 最大值应排最后
    const iMax = [10, 30, 20].indexOf(30);
    T("最大值秩最高", arr[iMax] === Math.max(...arr), `arr=${JSON.stringify(arr)}`);
  } else T("rank 返回数组", false, JSON.stringify(r).slice(0, 60));
}

/* ---------- aggregate ---------- */
console.log("\n【aggregate 聚合】");
{
  const r = OPS.aggregate([1, 2, 3, 4]);
  const sum = r.sum !== undefined ? r.sum : r.total;
  const avg = r.mean !== undefined ? r.mean : r.avg;
  T("sum([1,2,3,4]) = 10", near(sum, 10), `sum=${sum}`);
  T("mean = 2.5", near(avg, 2.5), `mean=${avg}`);
}

/* ---------- threshold ---------- */
console.log("\n【threshold 阈值】");
{
  const r = OPS.threshold([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
  const cn = r.count !== undefined ? r.count : (r.above !== undefined ? r.above : r.passed);
  T("阈值 5 时通过数 = 5", near(cn, 5), `count=${cn}`);
}

/* ---------- classify ---------- */
console.log("\n【classify 分类】");
{
  const r = OPS.classify([1, 1, 1, 9, 9, 9], 2);
  const groups = r.groups || r.clusters || r.classes;
  T("聚成 2 类", Array.isArray(groups) ? groups.length === 2 : false,
    Array.isArray(groups) ? `组数=${groups.length}` : JSON.stringify(r).slice(0, 60));
}

/* ---------- trend ---------- */
console.log("\n【trend 趋势】");
{
  const up = OPS.trend([1, 2, 3, 4, 5]);
  const down = OPS.trend([5, 4, 3, 2, 1]);
  const flat = OPS.trend([3, 3, 3, 3, 3]);
  const d = (r) => r.direction || r.trend || r.slope;
  T("上升序列 → 正斜率/up", (d(up) === "up" || d(up) === "increasing" || d(up) > 0), JSON.stringify(d(up)));
  T("下降序列 → 负斜率/down", (d(down) === "down" || d(down) === "decreasing" || d(down) < 0), JSON.stringify(d(down)));
  T("平稳序列 → 零斜率/flat", (d(flat) === "flat" || d(flat) === "stable" || near(Number(d(flat)) || 0, 0)), JSON.stringify(d(flat)));
}

/* ---------- coverage ---------- */
console.log("\n【coverage 覆盖率】");
{
  const full = OPS.coverage([1, 2, 3], [1, 2, 3]);
  const half = OPS.coverage([1, 2, 3], [1, 2]);
  const c = (r) => r.coverage !== undefined ? r.coverage : r.rate;
  T("全覆盖 = 1", near(c(full), 1), `=${c(full)}`);
  T("部分覆盖 < 1", c(half) < 1, `=${c(half)}`);
}

/* ---------- stability ---------- */
console.log("\n【stability 稳定性】");
{
  const s1 = OPS.stability([5, 5, 5, 5, 5]);
  const s2 = OPS.stability([1, 9, 1, 9, 1]);
  const g = (r) => r.stability !== undefined ? r.stability : r.score;
  T("恒定序列稳定性最高", g(s1) >= g(s2), `${g(s1)} vs ${g(s2)}`);
}

/* ---------- distance ---------- */
console.log("\n【distance 距离】");
{
  const same = OPS.distance([1, 2, 3], [1, 2, 3]);
  const diff = OPS.distance([0, 0, 0], [3, 4, 0]);
  const g = (r) => r.distance !== undefined ? r.distance : r.value;
  T("同向量距离 = 0", near(g(same), 0), `=${g(same)}`);
  T("欧氏距离 3-4-5 = 5", near(g(diff), 5), `=${g(diff)}`);
}

console.log();
console.log("-".repeat(90));
console.log(`语义断言：通过 ${pass} ｜ 失败 ${fail}`);
if (fails.length) {
  console.log("\n失败明细：");
  fails.forEach(f => console.log("  ✗ " + f));
}
console.log(fail === 0 ? "总判定：PASS（语义正确）" : "总判定：需关注");
process.exitCode = fail === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
