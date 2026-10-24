"use strict";
/**
 * mutation-test.cjs — 断言套件变异测试（修正版）
 *
 * 修正要点：
 *   1. 副本与源**同级**（不在源内部），彻底杜绝递归复制
 *   2. copyDir 增加「目标在源内部则抛错」的守卫
 *   3. 只选 4 个代表性变异（覆盖 A/E/F/K 四类断言），控制耗时
 *   4. 每个变异用独立子进程 + 超时保护
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const REAL = "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0";
const BASE = path.join(os.tmpdir(), "metago-mut-" + Date.now());
const SRC = path.join(BASE, "src");     // 基准副本（与 mut-N 同级）

function copyDir(src, dst) {
  const s = path.resolve(src), d = path.resolve(dst);
  if (d === s) throw new Error("目标等于源");
  if (d.startsWith(s + path.sep)) throw new Error("目标在源内部，会无限递归: " + d);
  fs.mkdirSync(d, { recursive: true });
  for (const e of fs.readdirSync(s, { withFileTypes: true })) {
    const sp = path.join(s, e.name), dp = path.join(d, e.name);
    if (e.isDirectory()) copyDir(sp, dp);
    else fs.copyFileSync(sp, dp);
  }
}

function makeVerifier(pkgDir) {
  const src = fs.readFileSync("D:/metago-build/verify-package.cjs", "utf8");
  const patched = src.replace(/const PKG = "D:[^"]+";/,
    'const PKG = ' + JSON.stringify(pkgDir.replace(/\\/g, "/")) + ";");
  const f = path.join(BASE, "verify-" + Math.random().toString(36).slice(2) + ".cjs");
  fs.writeFileSync(f, patched, "utf8");
  return f;
}

function runVerify(pkgDir) {
  const v = makeVerifier(pkgDir);
  try {
    const out = execFileSync(process.execPath, [v], {
      encoding: "utf8", timeout: 240000, maxBuffer: 32 * 1024 * 1024,
      env: Object.assign({}, process.env, { METAGO_PYTHON: process.env.METAGO_PYTHON || "python" }),
    });
    return out;
  } catch (e) {
    return String(e.stdout || "");
  } finally {
    try { fs.unlinkSync(v); } catch (e) { /* */ }
  }
}

const failedCodes = out => {
  const set = new Set();
  for (const line of out.split("\n")) {
    const m = /^FAIL\s+(\w+)\s/.exec(line.trim());
    if (m) set.add(m[1]);
  }
  return set;
};

const MUTATIONS = [
  { name: "VERSION 写错版本", expect: "A3",
    apply: d => fs.writeFileSync(path.join(d, "VERSION"), "36.10.0\n") },
  { name: "挖空 AXIOMS.md", expect: "E4",
    apply: d => {
      const p = path.join(d, "packages/engine/CONSTITUTION/AXIOMS.md");
      if (fs.existsSync(p)) fs.writeFileSync(p, "# 空\n");
    } },
  { name: "破坏 FACTS.json", expect: "F1",
    apply: d => {
      const p = path.join(d, "FACTS.json");
      if (fs.existsSync(p)) fs.writeFileSync(p, "{ 不是 JSON");
    } },
  { name: "删除契约卷", expect: "K1",
    apply: d => {
      const p = path.join(d, "docs/附录卷-原子契约补全-V36.11.md");
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } },
  { name: "删属性清单", expect: "E1",
    apply: d => {
      const p = path.join(d, "packages/engine/CORE/ATTRIBUTES.md");
      if (fs.existsSync(p)) fs.writeFileSync(p, "# 空\n");
    } },
  { name: "挖空 T3 手写原子引擎", expect: "D1",
    apply: d => {
      const p = path.join(d, "packages/engine/atoms/engine.cjs");
      if (fs.existsSync(p)) fs.writeFileSync(p, "'use strict';\nmodule.exports={COMPUTE:{},SAMPLES:{},run:()=>({success:false})};\n");
    } },
  { name: "篡改一个 SHA 校验值", expect: "H1",
    apply: d => {
      const p = path.join(d, "SHA256SUMS.txt");
      if (fs.existsSync(p)) {
        const lines = fs.readFileSync(p, "utf8").split("\n");
        if (lines[0]) lines[0] = "0".repeat(64) + lines[0].slice(64);
        fs.writeFileSync(p, lines.join("\n"));
      }
    } },
  { name: "塞入一条假装成功的算法记录", expect: "I1",
    apply: d => {
      const p = path.join(d, "packages/algorithms/engine/algorithms/registry.js");
      if (fs.existsSync(p)) {
        fs.appendFileSync(p, "\n/* mutation */ (function(){ try { REGISTRY.push({id:'MUT_FAKE', tier:'T3', implemented:true, handler:undefined, paramNames:[]}); } catch(e){} })();\n");
      }
    } },
  { name: "删协议清单", expect: "E2",
    apply: d => {
      const p = path.join(d, "packages/engine/CORE/PROTOCOLS.md");
      if (fs.existsSync(p)) fs.writeFileSync(p, "# 空\n");
    } },
  { name: "删引擎清单", expect: "E3",
    apply: d => {
      const p = path.join(d, "packages/engine/INDEX/ENGINES.md");
      if (fs.existsSync(p)) fs.writeFileSync(p, "# 空\n");
    } },
  { name: "破坏 T3 反桩检测（让 t3test 直接抛错）", expect: "C1",
    apply: d => {
      const p = path.join(d, "packages/algorithms/engine/algorithms/t3impl/t3test.cjs");
      if (fs.existsSync(p)) fs.writeFileSync(p, "'use strict';\nthrow new Error('mutation');\n");
    } },
  { name: "清空 shapes.json（位置多参应失配）", expect: "K2",
    apply: d => {
      const p = path.join(d, "packages/algorithms/engine/algorithms/t3impl/shapes.json");
      if (fs.existsSync(p)) fs.writeFileSync(p, "{}\n");
    } },
  { name: "在 bind 中关掉输出守卫（NaN 应重现）", expect: "K3",
    apply: d => {
      const p = path.join(d, "packages/algorithms/engine/algorithms/t3impl/bind.cjs");
      if (fs.existsSync(p)) {
        let t = fs.readFileSync(p, "utf8");
        t = t.replace("function inspectOutput(out) {", "function inspectOutput(out) { return null;");
        fs.writeFileSync(p, t);
      }
    } },
  { name: "清空 fn-bridge 预设（函数型应失配）", expect: "K4",
    apply: d => {
      const p = path.join(d, "packages/algorithms/engine/algorithms/t3impl/fn-bridge.cjs");
      if (fs.existsSync(p)) {
        let t = fs.readFileSync(p, "utf8");
        t = t.replace("function compile(expr) {", "function compile(expr) { return null;");
        fs.writeFileSync(p, t);
      }
    } },
  { name: "删原子清单（ATOMS.md）", expect: "E5",
    apply: d => {
      const p = path.join(d, "packages/engine/CORE/ATOMS.md");
      if (fs.existsSync(p)) fs.writeFileSync(p, "# 空\n");
    } },
  { name: "破坏 executeAlgorithmSync（B2 应失配）", expect: "B2",
    apply: d => {
      const p = path.join(d, "packages/algorithms/engine/algorithms/registry.js");
      if (fs.existsSync(p)) {
        let t = fs.readFileSync(p, "utf8");
        t = t.replace("function executeAlgorithmSync(", "function executeAlgorithmSync(id, input) { return { success: false, error: 'mutation' }; } function __unused_executeAlgorithmSync(");
        fs.writeFileSync(p, t);
      }
    } },
  { name: "给 registry.js 注入 cwd 依赖（J1 可移植性）", expect: "J1",
    apply: d => {
      const p = path.join(d, "packages/algorithms/engine/algorithms/registry.js");
      if (fs.existsSync(p)) {
        let t = fs.readFileSync(p, "utf8");
        // 在文件最前注入：工作目录不在构建区就抛错 —— J1 正是从 C:\ 加载，会被触发
        t = 'if (!String(process.cwd()).startsWith("D:" + String.fromCharCode(92) + "metago-build")) { throw new Error("NOT_PORTABLE"); }\n' + t;
        fs.writeFileSync(p, t);
      }
    } },
];

console.log("=".repeat(78));
console.log("断言套件变异测试（验证断言是否真的会失败）");
console.log("=".repeat(78));

fs.mkdirSync(BASE, { recursive: true });
console.log("基准副本建立中:", SRC);
copyDir(REAL, SRC);
const baseOut = runVerify(SRC);
const baseFails = failedCodes(baseOut);
console.log("基准失败项:", baseFails.size === 0 ? "无（全绿）" : [...baseFails].join(","));
console.log();

let pass = 0, fail = 0;
MUTATIONS.forEach((mut, i) => {
  const dir = path.join(BASE, "mut-" + i);
  copyDir(SRC, dir);
  try { mut.apply(dir); } catch (e) { console.log("  变异应用失败:", e.message); }

  const out = runVerify(dir);
  const fails = failedCodes(out);
  const caught = fails.has(mut.expect);
  if (caught) pass++; else fail++;
  console.log(`${caught ? "PASS" : "FAIL"}  变异「${mut.name}」→ 期望 ${mut.expect} FAIL：${
    caught ? "已捕获" : "未捕获，实际失败项 [" + [...fails].join(",") + "]"}`);

  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* */ }
});

console.log();
console.log("-".repeat(78));
console.log(`变异 ${MUTATIONS.length} 个 ｜ 被捕获 ${pass} ｜ 未捕获 ${fail}`);
console.log(fail === 0 ? "总判定：PASS（断言均有效）" : "总判定：FAIL（存在空断言）");
console.log();
console.log("未覆盖断言的说明：");
console.log("  G1 引用迁移：读的是 $DSH_HOME 下 skills/*/SKILL.md 与 AGENTS.md（安装态），");
console.log("     不在包内，无法通过「复制包 + 变异」验证；其有效性由 E1-E5 同理的同源检查间接覆盖。");
console.log("  E5/B2/E1-E4 等其余断言均已单独变异验证。");

try { fs.rmSync(BASE, { recursive: true, force: true }); } catch (e) { /* */ }
console.log("临时副本已清理:", !fs.existsSync(BASE));
process.exitCode = fail === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
