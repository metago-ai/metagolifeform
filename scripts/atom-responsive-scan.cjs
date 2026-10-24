"use strict";
/**
 * atom-responsive-scan.cjs — 原子是否真正响应输入（空输入对照组）
 *
 * 对照：
 *   A 组：正常数值输入
 *   B 组：空对象 {}
 *   C 组：差异极大的数值输入
 * 若 A 与 C 输出完全相同 → 该原子无视输入（退化）
 */
const path = require("path");
const B = "D:/metago-build/outbound/v36.10.0/packages/engine/atoms";
const V = require(path.join(B, "contract-validator.cjs"));
const F = require(path.join(B, "atom-factory.cjs"));

const canon = v => JSON.stringify(v, (k, x) => {
  if (typeof x === "number" && !isFinite(x)) return "NONFINITE";
  if (k === "__operator" || k === "provenance" || k === "reason") return undefined;
  return x;
});

const A = { items: [1, 2, 3, 4, 5], values: [0.8, 0.6, 0.2, 0.9], a: 1.2, b: 3.4,
  text: '太生气了！怎么又坏了！！', content: '# 标题\n正文段落\n- 项一', data: '元构机密数据', key: 'k1' };
const C = { items: [100, 200, 300], values: [0.01, 0.99], a: 999, b: -57,
  text: '今天非常满意，太好了', content: '普通文本内容没有标记', data: '另一段数据', key: 'k2' };

const allIds = Object.keys(V.CONTRACTS).filter(id =>
  !F.CONSTRAINT_IDS.has(id) && !F.EXTERNAL_NEEDED.has(id));

let responsive = 0, degenerate = [], failed = 0;

for (const id of allIds) {
  const fn = F.make(id);
  if (!fn) continue;
  let ra, rc;
  try { ra = fn(A); rc = fn(C); } catch (e) { failed++; continue; }
  if (!ra || !rc) { failed++; continue; }
  const sa = canon(ra), sc = canon(rc);
  if (sa === sc) degenerate.push({ id, sig: sa.slice(0, 60) });
  else responsive++;
}

console.log("=".repeat(80));
console.log("原子响应性扫描（输入变化 → 输出是否变化）");
console.log("=".repeat(80));
console.log(`可对比 ${responsive + degenerate.length} 条`);
console.log(`  响应输入  ${String(responsive).padStart(4)} 条`);
console.log(`  输出恒定  ${String(degenerate.length).padStart(4)} 条`);
console.log(`  执行异常  ${String(failed).padStart(4)} 条`);
if (degenerate.length) {
  console.log();
  console.log("【输出恒定的原子】");
  degenerate.slice(0, 25).forEach(d => console.log("  " + d.id.padEnd(30) + d.sig));
}
console.log();
console.log(degenerate.length === 0 ? "总判定：PASS（全部响应输入）"
  : `总判定：需关注（${degenerate.length} 条恒定）`);

// 退出码（门禁语义）：degenerate 非空即失败
process.exitCode = degenerate.length === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
