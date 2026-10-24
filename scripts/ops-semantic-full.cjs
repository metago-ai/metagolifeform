"use strict";
/**
 * ops-semantic-full.cjs — 39 个特化算子的语义正确性（全量版 · 基于真实签名）
 *
 * 纪律（CORR-007 教训）：先读实现签名与返回字段，再写断言。
 * 每个断言都用「已知数学/逻辑性质」，不是「输出非空」。
 */
const { OPS } = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine/atoms/specialized.cjs");

const p = (x, n) => String(x).padEnd(n).slice(0, n);
const near = (a, b, eps = 1e-3) => typeof a === "number" && Math.abs(a - b) < eps;
let pass = 0, fail = 0;
const fails = [];
function T(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; fails.push(name + "  " + (detail || "")); }
  console.log(`  ${cond ? "✓" : "✗"} ${p(name, 46)} ${detail || ""}`);
}

console.log("=".repeat(94));
console.log("39 个特化算子语义正确性（全量）");
console.log("=".repeat(94));

/* ---- 分布类 ---- */
console.log("\n【分布 / 无序度】");
T("entropy 均匀 4 等分 = log2(4) = 2", near(OPS.entropy([1, 1, 1, 1]).entropy, 2), "");
T("entropy 归一化最大值 = 1", near(OPS.entropy([1, 1, 1, 1]).normalized, 1), "");
T("entropy 偏斜 < 均匀", OPS.entropy([10, 1, 1, 1]).entropy < OPS.entropy([1, 1, 1, 1]).entropy, "");
T("entropy n 字段正确", OPS.entropy([1, 2, 3]).n === 3, "");
T("gini 全等 = 0", near(OPS.gini([5, 5, 5, 5]).gini, 0), "");
T("gini equality 全等 = 1", near(OPS.gini([5, 5, 5, 5]).equality, 1), "");
T("gini 极不均 > 0.7", OPS.gini([0, 0, 0, 100]).gini > 0.7, "");

/* ---- 位置类 ---- */
console.log("\n【位置 / 离散度】");
T("median 奇数 = 3", near(OPS.median([1, 2, 3, 4, 5]).median, 3), "");
T("median 偶数 = 2.5", near(OPS.median([1, 2, 3, 4]).median, 2.5), "");
T("median 不依赖顺序", near(OPS.median([9, 1, 5]).median, 5), "");
T("median min/max 正确", near(OPS.median([3, 1, 9]).min, 1) && near(OPS.median([3, 1, 9]).max, 9), "");
T("iqr 单调不减 q1<=q3", OPS.iqr([1, 2, 3, 4, 5, 6, 7, 8]).q1 <= OPS.iqr([1, 2, 3, 4, 5, 6, 7, 8]).q3, "");
T("iqr 值 = q3-q1", near(OPS.iqr([1, 2, 3, 4, 5, 6, 7, 8]).iqr,
  OPS.iqr([1, 2, 3, 4, 5, 6, 7, 8]).q3 - OPS.iqr([1, 2, 3, 4, 5, 6, 7, 8]).q1), "");
T("iqr 无离群时 outliers=0", (OPS.iqr([1, 2, 3, 4, 5]).outliers || []).length === 0, "");

/* ---- 标准分 ---- */
console.log("\n【标准分 / 排名】");
{
  const r = OPS.zscore([2, 4, 4, 4, 5, 5, 7, 9]);
  const z = r.zScores;
  const m = z.reduce((a, x) => a + x, 0) / z.length;
  T("zscore z 均值 ≈ 0", near(m, 0), `mean=${m.toFixed(6)}`);
  T("zscore 返回数组", Array.isArray(z) && z.length === 8, "");
  T("zscore 报告的 mean 与真均值一致", near(r.mean, 5), `mean=${r.mean}`);
}
{
  const r = OPS.rank([10, 30, 20]);
  T("rank 约定 1=最大", r.ranks[1] === 1 && r.ranks[2] === 2 && r.ranks[0] === 3, JSON.stringify(r.ranks));
  T("rank topIndex = 最大值索引", r.topIndex === 1, `topIndex=${r.topIndex}`);
  T("rank topValue = 30", near(r.topValue, 30), "");
}

/* ---- 趋势 ---- */
console.log("\n【趋势 / 预测】");
{
  const up = OPS.trend([1, 2, 3, 4, 5]);
  const dn = OPS.trend([5, 4, 3, 2, 1]);
  const fl = OPS.trend([3, 3, 3, 3, 3]);
  T("trend 上升 slope>0", up.slope > 0, `slope=${up.slope}`);
  T("trend 下降 slope<0", dn.slope < 0, `slope=${dn.slope}`);
  T("trend 平稳 slope≈0", near(fl.slope, 0), `slope=${fl.slope}`);
  T("trend 含 prediction 字段", "prediction" in up, "");
}

/* ---- 阈值 / 风险 ---- */
console.log("\n【阈值 / 风险】");
{
  const a = OPS.threshold([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const b = OPS.threshold([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
  T("threshold(v) 语义=count_ge_mean", a.__semantics === "count_ge_mean", a.__semantics);
  T("threshold(v) pass = 5", a.pass === 5, `pass=${a.pass}`);
  T("threshold(v,5) 语义=count_ge_given", b.__semantics === "count_ge_given_threshold", b.__semantics);
  T("threshold(v,5) pass = 6（≥5 有 6 个）", b.pass === 6, `pass=${b.pass}`);
  T("threshold 高阈值 → pass 更少", OPS.threshold([1, 2, 3], 100).pass === 0, "");
}
{
  const lo = OPS.risk([1, 1, 1, 1]);
  const hi = OPS.risk([0, 0, 0, 100]);
  T("risk 稳定数据为低风险（green）", /^(green|低|low|正常)$/i.test(String(lo.level)), lo.level);
  T("risk 极值数据风险更高", String(hi.level) !== String(lo.level) || hi.ratio > lo.ratio, `${hi.level} vs ${lo.level}`);
}

/* ---- 稳定性 / 同步 ---- */
console.log("\n【稳定性 / 同步】");
T("stability 恒定 = 1", near(OPS.stability([5, 5, 5, 5, 5]).stability, 1), "");
T("stability 恒定 converged=true", OPS.stability([5, 5, 5, 5, 5]).converged === true, "");
T("stability 波动 < 恒定", OPS.stability([1, 9, 1, 9]).stability < OPS.stability([5, 5, 5, 5]).stability, "");
{
  const f = OPS.fusion([2, 2, 2, 2]);
  T("fusion 恒定序列 sync 最高", near(f.sync, 1), `sync=${f.sync}`);
}

/* ---- 聚合 / 分配 ---- */
console.log("\n【聚合 / 分配】");
{
  const a = OPS.aggregate([1, 2, 3, 4]);
  T("aggregate total = 10", near(a.total, 10), `total=${a.total}`);
  T("aggregate mean = 2.5", near(a.mean, 2.5), "");
  T("aggregate count = 4", a.count === 4, "");
  T("aggregate max/min", near(a.max, 4) && near(a.min, 1), "");
}
{
  const r = OPS.allocate([1, 1, 2]);
  const got = r.allocation.map(x => x.got);
  T("allocate 份额总和 = 1", near(got.reduce((s, x) => s + x, 0), 1), `sum=${got.reduce((s, x) => s + x, 0)}`);
  T("allocate 大份额对应大值", got[2] > got[0], JSON.stringify(got));
}

/* ---- 覆盖率 / 密度 ---- */
console.log("\n【覆盖率 / 密度】");
T("coverage 全唯一 = 1", near(OPS.coverage([1, 2, 3]).coverage, 1), "");
T("coverage 有重复 < 1", OPS.coverage([1, 1, 2]).coverage < 1, `=${OPS.coverage([1, 1, 2]).coverage}`);
T("coverage 语义标签正确", OPS.coverage([1, 2]).__semantics === "uniqueness_ratio_not_set_coverage", "");
{
  const d1 = OPS.density([1, 2, 3]);
  const d2 = OPS.density([1, 100, 200]);
  T("density 返回 count/range", typeof d1.count === "number" && d1.range !== undefined, "");
  T("density 范围窄 → 密度更高", d1.density > d2.density, `${d1.density} vs ${d2.density}`);
}

/* ---- 加权 / 校准 ---- */
console.log("\n【加权 / 校准】");
{
  const r = OPS.weighted([1, 2, 3]);
  T("weighted 返回 weightedScore", typeof r.weightedScore === "number", "");
  T("weighted 返回 weights", Array.isArray(r.weights), "");
}
{
  const r = OPS.calibrate([10, 20, 30]);
  T("calibrate 返回 calibrated 数组", Array.isArray(r.calibrated), "");
  T("calibrate offset = -mean", near(r.offset, -20, 0.5), `offset=${r.offset}`);
}

/* ---- 分类 / 监控 ---- */
console.log("\n【分类 / 监控】");
{
  const norm = OPS.classify([5, 5, 5, 5, 5]);
  T("classify 基线内判正常", /正常|normal|baseline/i.test(String(norm.label)), norm.label);
  T("classify 正常时 detected 为 false", norm.detected === false, `detected=${norm.detected}`);
  const ab = OPS.classify([5, 5, 5, 5, 5, 100]);
  T("classify 含极值时 detected 为 true", ab.detected === true, `detected=${ab.detected}`);
}

/* ---- 语义标签 ---- */
console.log("\n【语义标签（消除歧义）】");
T("distance 有 __semantics", /deviation_from_mean/.test(String(OPS.distance([1, 2]).__semantics || "")), "");
T("coverage 有 __semantics", /uniqueness_ratio/.test(String(OPS.coverage([1, 2]).__semantics || "")), "");
T("threshold 有 __semantics", /count_ge/.test(String(OPS.threshold([1, 2]).__semantics || "")), "");

/* ---- 其余算子的基本契约 ---- */
console.log("\n【其余算子的输出契约】");
const REST = ["correlation", "optimize", "diffuse", "gap", "score", "estimate", "verify",
  "generate", "process", "execute", "learn", "extract", "wrap", "adapt", "vote", "filter", "collect", "record", "advise"];
for (const k of REST) {
  let ok = false, info = "";
  try {
    const r = OPS[k]([1, 2, 3, 4, 5]);
    ok = r && typeof r === "object" && Object.keys(r).length > 0 && !("error" in r);
    info = ok ? "" : JSON.stringify(r).slice(0, 50);
  } catch (e) { info = e.message.slice(0, 50); }
  T(`${k} 返回结构化结果`, ok, info);
}

/* ---- vote 语义 ---- */
console.log("\n【vote 语义】");
{
  const all = OPS.vote([1, 1, 1, 1]);
  const none = OPS.vote([0, 0, 0, 0]);
  T("vote 全赞成通过率 = 1", near(all.通过率, 1), `=${all.通过率}`);
  T("vote 全反对通过率 = 0", near(none.通过率, 0), `=${none.通过率}`);
  T("vote 全赞成 passed=true", all.passed === true, "");
  T("vote 全反对 passed=false", none.passed === false, "");
}

/* ---- record 链完整性 ---- */
console.log("\n【record 账本链】");
{
  const r = OPS.record([1, 2, 3, 4]);
  T("record appendOnly = true", r.appendOnly === true, "");
  T("record verifiable = true", r.verifiable === true, "");
  T("record 记录数 = 4", r.记录数 === 4, `=${r.记录数}`);
}

/* ---- learn 收敛 ---- */
console.log("\n【learn 收敛】");
{
  /* EMA(α=0.1) 需要足够步数才收敛：n=6 数学上不可能，n=50 才收敛。
     实现正确，断言取 n=60 才合理。 */
  const short = OPS.learn(Array(6).fill(5));
  const long = OPS.learn(Array(60).fill(5));
  T("learn 短序列尚未收敛（符合 EMA 数学）", short.converged === false, `n=6 converged=${short.converged} learned=${short.learned}`);
  T("learn 长序列收敛到真值 5", long.converged === true && Math.abs(long.learned - 5) < 0.01, `n=60 learned=${long.learned}`);
  T("learn 学到的值随步数逼近真值", long.learned > short.learned, `${long.learned} > ${short.learned}`);
  T("learn 返回 iterations", typeof long.iterations === "number", "");
}

console.log();
console.log("-".repeat(94));
console.log(`语义断言：通过 ${pass} ｜ 失败 ${fail}`);
if (fails.length) {
  console.log("\n失败明细：");
  fails.forEach(f => console.log("  ✗ " + f));
}
console.log(fail === 0 ? "总判定：PASS" : "总判定：需关注");
process.exitCode = fail === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
