"use strict";
/**
 * algo-semantic-invariants.cjs — 算法的语义不变量测试
 *
 * 此前只验过「能跑通（success/degraded）」，没验「算得对」。
 * 本脚本挑有**强数学不变量**的算法做断言，例如：
 *   cosine_similarity(a, a) 必须 = 1
 *   euclidean_distance(a, a) 必须 = 0
 *   jaccard(a, a) = 1，jaccard(a, a 的补集) = 0
 *   dice(a, a) = 1
 *   pearson(a, a) = 1（非常量）
 *   spearman(a, a) = 1
 *   kendall(a, a) = 1
 *   covariance(a, a) = var(a) >= 0
 *   三角不等式：d(a,c) <= d(a,b) + d(b,c)
 */
const path = require("path");
const T3 = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/t3impl";
const REG = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js");
const { bind } = require(path.join(T3, "bind.cjs"));
const B = bind(REG);

const p = (x, n) => String(x).padEnd(n).slice(0, n);
const near = (a, b, eps = 1e-6) => typeof a === "number" && Math.abs(a - b) < eps;
let pass = 0, fail = 0;
const fails = [];
function T(name, cond, detail) {
  if (cond) pass++;
  else { fail++; fails.push(name + "  " + (detail || "")); }
  console.log(`  ${cond ? "✓" : "✗"} ${p(name, 52)} ${detail || ""}`);
}

function run(id, input) {
  try {
    const r = B.run(id, input);
    if (!r || !(r.success || r.degraded)) return { ok: false, err: String((r && r.error) || "失败").slice(0, 40) };
    const o = r.output !== undefined ? r.output : r;
    return { ok: true, out: o };
  } catch (e) { return { ok: false, err: e.message.slice(0, 40) }; }
}

/** 从输出里抠出主数值（算法返回字段名各异） */
function num(out, prefer) {
  if (typeof out === "number") return out;
  if (!out || typeof out !== "object") return NaN;
  for (const k of prefer || []) if (typeof out[k] === "number") return out[k];
  for (const k of ["similarity", "distance", "coefficient", "correlation", "value", "result", "score", "covariance"]) {
    if (typeof out[k] === "number") return out[k];
  }
  const nums = Object.values(out).filter(v => typeof v === "number");
  return nums.length ? nums[0] : NaN;
}

const A = [1, 2, 3, 4, 5];
const Bv = [2, 4, 6, 8, 10];   // A 的 2 倍 → 余弦=1，欧氏>0
const C = [5, 4, 3, 2, 1];     // 与 A 反序
const D = [1, 3, 5, 7, 9];

console.log("=".repeat(96));
console.log("算法语义不变量测试（相似度 / 距离 / 相关）");
console.log("=".repeat(96));

/* ---------- 自反性：自身与自身 ---------- */
console.log("\n【自反性：sim(a,a)=1 ｜ dist(a,a)=0】");
{
  const SIMS = [
    ["ALG_T1_C_001", "cosine_similarity", 1],
  ];
  for (const [id, name, expect] of SIMS) {
    const r = run(id, { a: A, b: A });
    if (!r.ok) { T(name + " 可运行", false, r.err); continue; }
    const v = num(r.out);
    T(name + "(A,A) = 1", near(v, expect, 1e-6), `= ${v}`);
    const r2 = run(id, { a: A, b: Bv });
    const v2 = num(r2.out);
    T(name + "(A,2A) = 1（同向）", near(v2, 1, 1e-6), `= ${v2}`);
    const r3 = run(id, { a: A, b: C });
    const v3 = num(r3.out);
    T(name + "(A,反序) < 1", v3 < 1, `= ${v3}`);
  }
}
{
  const DISTS = [
    ["ALG_T1_C_004", "euclidean_distance"],
    ["ALG_T1_C_005", "manhattan_distance"],
    ["ALG_T1_C_006", "chebyshev_distance"],
  ];
  for (const [id, name] of DISTS) {
    const r = run(id, { a: A, b: A });
    if (!r.ok) { T(name + " 可运行", false, r.err); continue; }
    const v = num(r.out);
    T(name + "(A,A) = 0", near(v, 0, 1e-9), `= ${v}`);
    const r2 = run(id, { a: [0, 0, 0], b: [3, 4, 0] });
    const v2 = num(r2.out);
    // 欧氏=5，曼哈顿=7，切比雪夫=4
    const expect = name.includes("euclidean") ? 5 : name.includes("manhattan") ? 7 : 4;
    T(name + "(0,[3,4,0]) = " + expect, near(v2, expect, 1e-6), `= ${v2}`);
  }
}
{
  const r = run("ALG_T1_C_002", { a: [1, 2, 3], b: [1, 2, 3] });
  if (r.ok) T("jaccard(A,A) = 1", near(num(r.out), 1), `= ${num(r.out)}`);
  else T("jaccard 可运行", false, r.err);
  const r2 = run("ALG_T1_C_002", { a: [1, 2, 3], b: [4, 5, 6] });
  if (r2.ok) T("jaccard(不相交) = 0", near(num(r2.out), 0), `= ${num(r2.out)}`);
  else T("jaccard 不相交可运行", false, r2.err);
}
{
  const r = run("ALG_T1_C_003", { a: [1, 2, 3], b: [1, 2, 3] });
  if (r.ok) T("dice(A,A) = 1", near(num(r.out), 1), `= ${num(r.out)}`);
  else T("dice 可运行", false, r.err);
  const r2 = run("ALG_T1_C_003", { a: [1, 2], b: [3, 4] });
  if (r2.ok) T("dice(不相交) = 0", near(num(r2.out), 0), `= ${num(r2.out)}`);
}

/* ---------- 相关性 ---------- */
console.log("\n【相关性：corr(a,a)=1 ｜ cov(a,a)=var(a)>=0】");
{
  const r = run("ALG_T1_C_007", { a: A, b: A });
  if (r.ok) {
    const v = num(r.out, ["correlation", "r", "pearson"]);
    T("pearson(A,A) = 1", near(v, 1, 1e-6), `= ${v}`);
  } else T("pearson 可运行", false, r.err);
  const r2 = run("ALG_T1_C_007", { a: A, b: Bv });
  if (r2.ok) {
    const v = num(r2.out, ["correlation", "r"]);
    T("pearson(A,2A) = 1（线性正相关）", near(v, 1, 1e-6), `= ${v}`);
  }
  const r3 = run("ALG_T1_C_007", { a: A, b: C });
  if (r3.ok) {
    const v = num(r3.out, ["correlation", "r"]);
    T("pearson(A,反序) = -1", near(v, -1, 1e-6), `= ${v}`);
  }
}
{
  const r = run("ALG_T1_C_008", { a: A, b: A });
  if (r.ok) T("spearman(A,A) = 1", near(num(r.out, ["correlation", "rho"]), 1, 1e-6), `= ${num(r.out)}`);
  else T("spearman 可运行", false, r.err);
  const r2 = run("ALG_T1_C_008", { a: A, b: C });
  if (r2.ok) T("spearman(A,反序) = -1", near(num(r2.out, ["correlation", "rho"]), -1, 1e-6), `= ${num(r2.out)}`);
}
{
  const r = run("ALG_T1_C_009", { a: A, b: A });
  if (r.ok) T("kendall(A,A) = 1", near(num(r.out, ["tau", "kendall"]), 1, 1e-6), `= ${num(r.out)}`);
  else T("kendall 可运行", false, r.err);
  const r2 = run("ALG_T1_C_009", { a: A, b: C });
  if (r2.ok) T("kendall(A,反序) = -1", near(num(r2.out, ["tau", "kendall"]), -1, 1e-6), `= ${num(r2.out)}`);
}
{
  /* 单参非位置型：输入即 samples 数组本身 */
  const samplesSame = A.map(x => ({ x, y: x }));
  const r = run("ALG_T1_C_030", samplesSame);
  if (r.ok) {
    const v = num(r.out, ["cov", "covariance"]);
    /* 样本协方差用 n-1：var_sample([1,2,3,4,5]) = (4+1+0+1+4)/4 = 2.5
       （总体方差才是 10/5 = 2；实现用 n-1 是正确做法） */
    T("cov(A,A) = 样本方差 = 2.5", near(v, 2.5, 1e-6), `= ${v}`);
    T("cov(A,A) >= 0", v >= 0, `= ${v}`);
  } else T("covariance 可运行", false, r.err);
}

/* ---------- 距离度量公理 ---------- */
console.log("\n【距离公理：非负 / 对称 / 三角不等式】");
{
  const d = (x, y) => num(run("ALG_T1_C_004", { a: x, b: y }).out);
  const ab = d(A, D), ba = d(D, A), ac = d(A, C), bc = d(D, C);
  T("欧氏距离非负", ab >= 0, `d(A,D)=${ab}`);
  T("欧氏距离对称 d(a,b)=d(b,a)", near(ab, ba, 1e-9), `${ab} vs ${ba}`);
  T("三角不等式 d(A,C) <= d(A,D)+d(D,C)", ac <= ab + bc + 1e-9, `${ac} <= ${ab}+${bc}=${(ab + bc).toFixed(3)}`);
}

/* ---------- 归一化类不变量的范围 ---------- */
console.log("\n【取值范围】");
{
  const cases = [
    ["ALG_T1_C_001", "cosine", { a: A, b: D }, 0],
    ["ALG_T1_C_002", "jaccard", { a: [1, 2, 3], b: [2, 3, 4] }, 0],
    ["ALG_T1_C_003", "dice", { a: [1, 2, 3], b: [2, 3, 4] }, 0],
  ];
  for (const [id, name, inp, lo] of cases) {
    const v = num(run(id, inp).out);
    T(name + " 落在 [0,1]", v >= lo && v <= 1 + 1e-9, `= ${v}`);
  }
  const r = num(run("ALG_T1_C_007", { a: A, b: D }).out, ["correlation", "r"]);
  T("pearson 落在 [-1,1]", r >= -1 - 1e-9 && r <= 1 + 1e-9, `= ${r}`);
}

/* ---------- 加权与语义相似 ---------- */
console.log("\n【加权 / 语义】");
{
  /* 位置型 2 参：{pair:{a,b}, weights:[]} */
  const r = run("ALG_T1_C_010", { pair: { a: A, b: A }, weights: [1, 1, 1, 1, 1] });
  if (r.ok) T("weighted_cosine(A,A,等权) = 1", near(num(r.out), 1, 1e-6), `= ${num(r.out)}`);
  else T("weighted_cosine 可运行", false, r.err);
  const r2 = run("ALG_T1_C_010", { pair: { a: A, b: A }, weights: [1, 1, 1] });
  if (r2.ok) T("weighted_cosine 权重维度不符 → score=0", near(num(r2.out), 0, 1e-9), `= ${num(r2.out)}`);
}
{
  /* 位置型：{s1:'...', s2:'...'} 传字符串，不是数组 */
  const same = run("ALG_T1_C_011", { s1: "metago coupling", s2: "metago coupling" });
  if (same.ok) T("fuzzy_string_match(相同) = 1", near(num(same.out), 1, 1e-6), `= ${num(same.out)}`);
  else T("fuzzy 可运行", false, same.err);
  const diff = run("ALG_T1_C_011", { s1: "abcdef", s2: "xyzuvw" });
  if (diff.ok) T("fuzzy_string_match(完全不同) = 0", near(num(diff.out), 0, 1e-9), `= ${num(diff.out)}`);
  const part = run("ALG_T1_C_011", { s1: "metago", s2: "metago lifeform" });
  if (part.ok) { const v = num(part.out); T("fuzzy(部分相同) 落在 (0,1)", v > 0 && v < 1, `= ${v}`); }
}

console.log();
console.log("-".repeat(96));
console.log(`语义不变量：通过 ${pass} ｜ 失败 ${fail}`);
if (fails.length) {
  console.log("\n失败明细：");
  fails.forEach(f => console.log("  ✗ " + f));
}
console.log(fail === 0 ? "总判定：PASS" : "总判定：需关注");
process.exitCode = fail === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
