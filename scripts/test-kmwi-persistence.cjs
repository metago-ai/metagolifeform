"use strict";
/**
 * test-kmwi-persistence.cjs — KMWI 记忆持久化往返一致性
 *
 * 第十六章「记忆生命体协议」承诺：四层记忆跨会话不丢。
 * 本脚本验证：写入 → 落盘 → 重新实例化 → 读回，四层数据是否完整一致。
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { KMWIMemory } = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine");

const TMP = path.join(os.tmpdir(), "kmwi-roundtrip-" + Date.now() + ".json");

const p = (x, n) => String(x).padEnd(n).slice(0, n);
console.log("=".repeat(84));
console.log("KMWI 持久化往返一致性");
console.log("=".repeat(84));
console.log("临时存储:", TMP);
console.log();

/* 1. 写入四层 */
const m1 = new KMWIMemory(TMP);
const ids = {
  K: m1.addKnowledge("元构知识：耦生度>1 为超导态", "theory", ["元构", "耦生"], "test"),
  M: m1.addMemory("元构记忆：本轮修复了 13 处类型崩溃", "episodic", ["修复"], "test"),
  W: m1.addWisdom("模式：先扫描再修复比逐个碰快一个数量级", "已验证", "扫描→定位→批量修复", ["方法论"], "test"),
  I: m1.addIntuition("直觉：同类缺陷出现 3 次就该写扫描器", "隐性经验", ["方法论"], "test"),
};
console.log("【1. 写入】");
for (const [k, v] of Object.entries(ids)) console.log("  " + k + " 层 → " + (v || "(未返回 id)"));

/* 2. 强制落盘（若有 save） */
console.log();
console.log("【2. 落盘】");
if (typeof m1.save === "function") {
  try { m1.save(); console.log("  save() 调用成功"); } catch (e) { console.log("  save() 抛错: " + e.message.slice(0, 60)); }
} else {
  console.log("  无 save() 方法（可能自动落盘）");
}
console.log("  文件存在:", fs.existsSync(TMP), fs.existsSync(TMP) ? "(" + fs.statSync(TMP).size + " 字节)" : "");

/* 3. 重新实例化 */
console.log();
console.log("【3. 重新加载】");
const m2 = new KMWIMemory(TMP);
const health = m2.getHealth();
console.log("  健康度:", JSON.stringify({ K: health.details.K.total, M: health.details.M.total, W: health.details.W.total, I: health.details.I.total }));

/* 4. 逐层比对 */
console.log();
console.log("【4. 往返一致性】");
const expect = { K: 1, M: 1, W: 1, I: 1 };
let fail = 0;
for (const layer of ["K", "M", "W", "I"]) {
  const got = health.details[layer].total;
  const ok = got >= expect[layer];
  if (!ok) fail++;
  console.log("  " + (ok ? "✓" : "✗") + " " + layer + " 层：写入 1 ｜ 读回 " + got);
}

/* 5. 内容是否真的读回（不只计数） */
console.log();
console.log("【5. 内容抽检】");
const probes = [
  ["K", "耦生度", (x) => x.content],
  ["M", "类型崩溃", (x) => x.content],
  ["W", "数量级", (x) => x.pattern],
  ["I", "扫描器", (x) => x.insight],
];
const layerArrays = {
  K: Array.from((m2.knowledge || new Map()).values()),
  M: Array.from((m2.memories || new Map()).values()),
  W: Array.from((m2.wisdom || new Map()).values()),
  I: Array.from((m2.intuitions || new Map()).values()),
};
for (const [layer, kw, get] of probes) {
  const arr = layerArrays[layer];
  const hit = arr.find(x => String(get(x) || "").includes(kw));
  const ok = !!hit;
  if (!ok) fail++;
  console.log("  " + (ok ? "✓" : "✗") + " " + layer + " 层含「" + kw + "」：" + (ok ? "找到" : "**丢失**"));
}

/* 6. 清理 */
try { fs.unlinkSync(TMP); } catch (e) { }

console.log();
console.log("-".repeat(84));
console.log(fail === 0 ? "总判定：PASS（四层记忆往返完整）" : `总判定：FAIL（${fail} 项不一致）`);
