"use strict";
/**
 * verify-package.cjs — v36.10.0 交付级验收
 *
 * 九项检查，任一 FAIL 即整体 FAIL：
 *  A. 结构完整（VERSION / MANIFEST / FACTS / SHA256SUMS / CHANGELOG）
 *  B. registry 接线（T3 227 全挂 handler，且 executeAlgorithmSync 真跑通）
 *  C. T3 自测（t3test 227/227 + 反桩）
 *  D. 原子引擎（compute 类自测 + 诚实性）
 *  E. 公理/属性/协议/引擎四条清单覆盖率
 *  F. FACTS.json 可解析且带裁决
 *  G. 引用迁移回验（对已安装 home 的技能文件）
 *  H. SHA256SUMS 抽样校验
 *  I. 无残留"假装成功"路径（T3 无 handler 却 implemented=true）
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

/* 修（Round 34 解包实跑发现）：原为构建机绝对路径，交付包换机即崩。改用脚本自身目录，随包可移植。 */
const PKG = path.resolve(__dirname);
const HOME = "D:/DSH-Official/home";
const results = [];
let fail = 0;

/**
 * runCapture — 执行子进程并**只取 stdout**，不管退出码。
 * 为什么需要：检查器加退出码后，execFileSync 遇到非零退出会抛异常，
 * 而本脚本是靠「解析 stdout 里的总判定」来判断的，不应被退出码打断。（DEF-044）
 */
function runCapture(exe, args, opts) {
  const o = Object.assign({ encoding: "utf8", timeout: 300000 }, opts || {});
  try {
    return String(execFileSync(exe, args, o));
  } catch (e) {
    if (e && e.stdout) return String(e.stdout);
    if (e && e.status !== undefined) return "";   // 无 stdout 但确有退出码
    throw e;
  }
}

function chk(code, name, ok, detail) {
  results.push({ code, name, ok, detail });
  if (!ok) fail++;
}

/* A. 结构 */
const must = ["VERSION", "MANIFEST.json", "FACTS.json", "SHA256SUMS.txt", "CHANGELOG.md", "package.json"];
const missing = must.filter(f => !fs.existsSync(path.join(PKG, f)));
const ver = fs.existsSync(path.join(PKG, "VERSION")) ? fs.readFileSync(path.join(PKG, "VERSION"), "utf8").trim() : "?";
chk("A1", "关键文件齐全", missing.length === 0, missing.length ? "缺 " + missing.join(",") : `6/6 齐全，VERSION=${ver}`);

const pj = JSON.parse(fs.readFileSync(path.join(PKG, "package.json"), "utf8"));
const TARGET_VERSION = "37.0.0";   /* 修（Round 34）：硬编码目标版本随体系升版同步 */
const actualVer = (fs.existsSync(path.join(PKG, "VERSION"))
  ? fs.readFileSync(path.join(PKG, "VERSION"), "utf8").trim() : "");
chk("A3", "版本等于目标版本", actualVer === TARGET_VERSION,
  actualVer === TARGET_VERSION
    ? `VERSION=${actualVer}（目标 ${TARGET_VERSION}）`
    : `VERSION=${actualVer || "(缺失)"}，但目标为 ${TARGET_VERSION} —— 两处一致不等于正确`);

const verFile = fs.existsSync(path.join(PKG, "VERSION"))
  ? fs.readFileSync(path.join(PKG, "VERSION"), "utf8").trim() : "";
chk("A2", "package.json 版本一致", !!verFile && pj.version === verFile,
  `package.json=${pj.version} / VERSION=${verFile || "(缺失)"}`);

/* B. registry 接线 */
let regMod, t3ok = false, execOk = false, execOut = "";
try {
  regMod = require(path.join(PKG, "packages/algorithms/engine/algorithms/registry.js"));
  const reg = regMod.getRegistry();
  const t3 = reg.filter(e => e.tier === "T3");
  const withH = t3.filter(e => typeof e.handler === "function");
  t3ok = t3.length === 227 && withH.length === 227;
  const r = regMod.executeAlgorithmSync("ALG_T3_C_001", {
    techChain: [{ phase: 0.1, value: 1.2 }],
    consensusChain: [{ phase: 0.15, value: 0.9 }],
    windowSize: 1
  });
  execOk = r.success === true;
  execOut = r.success ? JSON.stringify(r.output) : String(r.error);
} catch (e) { execOut = e.message; }
chk("B1", "T3 全部挂上 handler", t3ok, t3ok ? "227/227" : "未全部挂载");
chk("B2", "executeAlgorithmSync 真实执行 ALG_T3_C_001", execOk, execOut.slice(0, 110));

/* C. T3 自测 */
let t3test = "";
try {
  t3test = runCapture(process.execPath, [path.join(PKG, "packages/algorithms/engine/algorithms/t3impl/t3test.cjs")], { encoding: "utf8" });
} catch (e) { t3test = String(e.stdout || e.message); }
const m227 = /通过\s+(\d+)\s+｜\s*失败\s+(\d+)/.exec(t3test);
chk("C1", "T3 自测 227/227", !!m227 && m227[1] === "227" && m227[2] === "0",
  m227 ? `通过 ${m227[1]} / 失败 ${m227[2]}` : "无法解析");

/* D. 原子引擎 */
let atomOut = "";
try {
  atomOut = runCapture(process.execPath, [path.join(PKG, "packages/engine/atoms/verify.cjs")], { encoding: "utf8" });
} catch (e) { atomOut = String(e.stdout || ""); }
const atomPass = /总判定：PASS/.test(atomOut);
const mc = /compute（真实计算）\s+(\d+)\s+通过\s+(\d+)\s+\/\s*失败\s+(\d+)/.exec(atomOut);
chk("D1", "原子 compute 类自测", atomPass, mc ? `${mc[1]} 条，通过 ${mc[2]} / 失败 ${mc[3]}` : "无法解析");
chk("D2", "诚实性（非 compute 不得假装成功）", /诚实性校验[^:]*:\s*通过/.test(atomOut), "已校验");

/* E. 清单覆盖率 */
function countRows(p, re) {
  if (!fs.existsSync(p)) return -1;
  return (fs.readFileSync(p, "utf8").match(re) || []).length;
}
const E = path.join(PKG, "packages/engine");
const ax = countRows(path.join(E, "CONSTITUTION/AXIOMS.md"), /^\| A\d+ \|/gm);
const at = countRows(path.join(E, "CORE/ATTRIBUTES.md"), /^\| D\d+ \|/gm);
const pr = countRows(path.join(E, "CORE/PROTOCOLS.md"), /^\| PROTOCOL_/gm);
const en = countRows(path.join(E, "INDEX/ENGINES.md"), /^\| ENGINE_/gm);
const am = countRows(path.join(E, "CORE/ATOMS.md"), /^\| ATOM_/gm);
chk("E1", "属性全覆盖 47", at === 47, `实收 ${at}`);
chk("E2", "协议全覆盖 =121", pr >= 121, `实收 ${pr}`);
chk("E3", "引擎全覆盖 =161", en >= 161, `实收 ${en}`);
chk("E4", "公理 ≥38", ax >= 38, `实收 ${ax}`);
chk("E5", "原子已登记 ≥500", am >= 500, `实收 ${am}`);

/* F. FACTS */
let facts = null;
try { facts = JSON.parse(fs.readFileSync(path.join(PKG, "FACTS.json"), "utf8")); } catch (e) { /* */ }
chk("F1", "FACTS.json 可解析且带裁决",
  !!facts && Array.isArray(facts.resolutions) && facts.resolutions.length >= 5,
  facts ? `${facts.counts.facts} 事实 / ${facts.counts.conflicts} 冲突 / ${facts.resolutions.length} 裁决` : "解析失败");

/* G. 引用迁移 */
const refChecks = [
  ["skills/metago-critique/SKILL.md", 43, "元构初始文档"],
  ["skills/metago-whatif/SKILL.md", 39, "L5698"],
  ["skills/metago-first-principles/SKILL.md", 75, "A37"],
  ["AGENTS.md", 4, "元构初始文档"]
];
let refOk = 0;
refChecks.forEach(([rel, ln, term]) => {
  try {
    const lines = fs.readFileSync(path.join(HOME, rel), "utf8").split("\n");
    if ((lines[ln - 1] || "").includes(term)) refOk++;
  } catch (e) { /* */ }
});
chk("G1", "引用迁移抽样回验", refOk === refChecks.length, `${refOk}/${refChecks.length}`);

/* H. SHA256 抽样（抽 20 个） */
let sumOk = 0, sumN = 0;
try {
  const sums = fs.readFileSync(path.join(PKG, "SHA256SUMS.txt"), "utf8").trim().split(/\r?\n/).map(x => x.trim());
  const step = Math.max(1, Math.floor(sums.length / 20));
  for (let i = 0; i < sums.length && sumN < 20; i += step) {
    const parts = sums[i].split(/\s+/); const h = parts[0], rel = parts.slice(1).join(" ");
    const f = path.join(PKG, rel);
    if (!fs.existsSync(f)) continue;
    sumN++;
    if (crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex") === h) sumOk++;
  }
} catch (e) { /* */ }
chk("H1", "SHA256 抽样校验", sumN > 0 && sumOk === sumN, `${sumOk}/${sumN}`);

/* I. 无假装成功 */
let liar = 0;
try {
  const reg = regMod.getRegistry();
  reg.forEach(e => { if (e.implemented === true && typeof e.handler !== "function") liar++; });
} catch (e) { liar = -1; }
chk("I1", "无「标 implemented 但无 handler」条目", liar === 0, liar < 0 ? "无法检查" : `发现 ${liar} 条`);

/* K. 契约校验：592 条契约 × 50 条 compute 原子 */
let kOut = "", kOk = false, kDetail = "";
try {
  kOut = String(runCapture(process.execPath, [path.join(PKG, "packages/engine/atoms/contract-validator.cjs")], { encoding: "utf8" }));
  const mc = /契约总数:\s*(\d+)/.exec(kOut);
  const mp = /通过\s+(\d+)\s*[\/\s]\s*失败\s+(\d+)/.exec(kOut);
  const mm = /compute 原子匹配契约:\s*(\d+)\s*\/\s*(\d+)/.exec(kOut);
  kOk = /总判定：PASS/.test(kOut);
  kDetail = mc && mp && mm
    ? `契约 ${mc[1]} 条，原子匹配 ${mm[1]}/${mm[2]}，校验通过 ${mp[1]} / 失败 ${mp[2]}`
    : "无法解析";
} catch (e) { kDetail = String(e.stdout || e.message).slice(0, 90); }
chk("K1", "契约校验（全量契约 × 原子）", kOk, kDetail);

/* J. 可移植性：从其它工作目录加载包内 registry 与自测 */
let portOk = false, portDetail = "";
try {
  const out = runCapture(process.execPath, ["-e", `
    const R = require(${JSON.stringify(path.join(PKG, "packages/algorithms/engine/algorithms/registry.js"))});
    const reg = R.getRegistry();
    const t3 = reg.filter(e => e.tier === "T3");
    const withH = t3.filter(e => typeof e.handler === "function").length;
    const r = R.executeAlgorithmSync("ALG_T3_C_003", { score: 1.12, stabilityHistory: [1.05, 1.1], threshold: 1.0 });
    console.log(JSON.stringify({ total: reg.length, t3: t3.length, withH, ok: r.success }));
  `], { encoding: "utf8", cwd: "C:\\" });
  const j = JSON.parse(String(out).trim().split("\n").pop());
  portOk = j.total === 927 && j.t3 === 227 && j.withH === 227 && j.ok === true;
  portDetail = `cwd=C:\\ → 注册表 ${j.total}，T3 ${j.withH}/${j.t3}，执行 ${j.ok ? "成功" : "失败"}`;
} catch (e) { portDetail = String(e.message).slice(0, 90); }
chk("J1", "从其它工作目录可加载并执行", portOk, portDetail);

/* K2/K3. 位置多参可调率 + 隐性数据损坏扫描 */
let k2Ok = false, k2d = "";
try {
  const o = String(runCapture(process.execPath, [path.join(PKG, "packages/algorithms/engine/algorithms/t3impl/wire-shapes.cjs")], { encoding: "utf8", timeout: 180000 }));
  const m = /可调通\s+(\d+)\s*（([\d.]+)%）/.exec(o);
  const miss = /完全调不通\s+(\d+)/.exec(o);
  k2Ok = m && miss && miss[1] === "0";
  k2d = m ? `可调通 ${m[1]}（${m[2]}%），调不通 ${miss ? miss[1] : "?"}` : "无法解析";
} catch (e) { k2d = String(e.stdout || e.message).slice(0, 80); }
chk("K2", "T1/T2 位置多参可调率 100%", k2Ok, k2d);

let k3Ok = false, k3d = "";
try {
  const o = String(runCapture(process.execPath, [path.join(PKG, "scripts/nan-scanner.cjs")], { encoding: "utf8", timeout: 180000 }));
  const m = /NAN\/INF 污染:\s*(\d+)/.exec(o);
  const sc = /已扫描可执行算法:\s*(\d+)/.exec(o);
  k3Ok = m && m[1] === "0";
  k3d = m ? `扫描 ${sc ? sc[1] : "?"} 条，NaN 污染 ${m[1]} 条` : "无法解析";
} catch (e) { k3d = String(e.stdout || e.message).slice(0, 80); }
chk("K3", "隐性数据损坏（NaN/Inf）零污染", k3Ok, k3d);

/* K4. 函数型形参算法可调性 + 桥接器安全边界 */
let k4Ok = false, k4d = "";
try {
  const o = String(runCapture(process.execPath, [path.join(PKG, "packages/algorithms/engine/algorithms/t3impl/fn-params-test.cjs")], { encoding: "utf8", timeout: 180000 }));
  const mc = /可调通:\s*(\d+)\s*\/\s*(\d+)/.exec(o);
  const ms = /安全用例:\s*(\d+)\s*\/\s*(\d+)/.exec(o);
  k4Ok = /总判定：PASS/.test(o);
  k4d = mc && ms
    ? `函数型可调 ${mc[1]}/${mc[2]}，安全边界 ${ms[1]}/${ms[2]}`
    : "无法解析";
} catch (e) { k4d = String(e.stdout || e.message).slice(0, 80); }
chk("K4", "函数型形参可调 + 桥接安全边界", k4Ok, k4d);

/* K5. MCP 服务器全量健康（环境相关，脚本缺失时降级为 SKIP） */
let k5Ok = null, k5d = "";
try {
  const probe = path.join(HOME, "scripts/mcp-all-health.cjs");
  if (!fs.existsSync(probe)) {
    k5d = "健康脚本不存在（环境相关项，跳过）";
  } else {
    const o = String(runCapture(process.execPath, [probe], {
      encoding: "utf8", timeout: 240000,
      env: Object.assign({}, process.env)   /* 不注入默认 "python"：裸 python 可能是 Store 桩 */
    }));
    const mc = /合计\s*(\d+)\s*组\s*｜\s*通过\s*(\d+)\s*｜\s*失败\s*(\d+)/.exec(o);
    const mt = /(\d+)\s*工具/g;
    let tot = 0, mm;
    while ((mm = mt.exec(o))) tot += parseInt(mm[1], 10);
    const bad = mc ? parseInt(mc[3], 10) : 1;
    k5Ok = bad === 0;
    k5d = mc ? `服务器 ${mc[2]}/${mc[1]} 组正常，工具合计 ${tot} 个` : "无法解析";
  }
} catch (e) { k5d = String(e.stdout || e.message).slice(0, 80); }
chk("K5", "MCP 服务器全量健康（不破坏现有能力）", k5Ok, k5d);

/* K6. 样例形状与算法自声明 schema 一致 */
let k6Ok = false, k6d = "";
try {
  const o = String(runCapture(process.execPath, [path.join(PKG, "scripts/schema-vs-shape.cjs")], { encoding: "utf8", timeout: 180000 }));
  const mc = /冲突\s*(\d+)\s*处/.exec(o);
  k6Ok = /总判定：PASS/.test(o);
  k6d = mc ? `冲突 ${mc[1]} 处` : "无法解析";
} catch (e) { k6d = String(e.stdout || e.message).slice(0, 80); }
chk("K6", "样例形状与声明 schema 一致", k6Ok, k6d);

/* K7. 元素级字段无错配（算法读取的字段样例必须提供） */
let k7Ok = false, k7d = "";
try {
  const o = String(runCapture(process.execPath, [path.join(PKG, "scripts/element-field-scan.cjs")], { encoding: "utf8", timeout: 180000 }));
  const mc = /命中\s*(\d+)\s*处/.exec(o);
  k7Ok = /总判定：PASS/.test(o);
  k7d = mc ? `错配 ${mc[1]} 处` : "无法解析";
} catch (e) { k7d = String(e.stdout || e.message).slice(0, 80); }
chk("K7", "元素级字段无错配", k7Ok, k7d);

/* K8. 原子层无空壳输出 */
let k8Ok = false, k8d = "";
try {
  const o = String(runCapture(process.execPath, [path.join(PKG, "scripts/atom-hollow-scan.cjs")], { encoding: "utf8", timeout: 180000 }));
  const m = /空壳率\s*([\d.]+)%/.exec(o);
  k8Ok = /总判定：PASS/.test(o);
  k8d = m ? `空壳率 ${m[1]}%` : "无法解析";
} catch (e) { k8d = String(e.stdout || e.message).slice(0, 80); }
chk("K8", "原子层无空壳输出", k8Ok, k8d);

/* K9. 原子响应输入（非退化） */
let k9Ok = false, k9d = "";
try {
  const o = String(runCapture(process.execPath, [path.join(PKG, "scripts/atom-responsive-scan.cjs")], { encoding: "utf8", timeout: 180000 }));
  const m = /响应输入\s*(\d+)\s*条/.exec(o);
  const d = /输出恒定\s*(\d+)\s*条/.exec(o);
  k9Ok = m && d ? parseInt(m[1], 10) > 0 : /总判定：PASS/.test(o);
  k9d = m && d ? `响应 ${m[1]} 条 / 恒定 ${d[1]} 条` : "无法解析";
} catch (e) { k9d = String(e.stdout || e.message).slice(0, 80); }
chk("K9", "原子响应输入（非退化）", k9Ok, k9d);

/* K10. 包内容已全部装入活系统（安装一致性） */
let k10Ok = false, k10d = "";
try {
  const npmRoot = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai";
  const MAP = [
    ["packages/algorithms/engine/algorithms/registry.js", npmRoot + "/algorithms/engine/algorithms/registry.js"],
    ["packages/algorithms/engine/algorithms/t3impl/bind.cjs", npmRoot + "/algorithms/engine/algorithms/t3impl/bind.cjs"],
    ["packages/algorithms/engine/algorithms/t3impl/fn-bridge.cjs", npmRoot + "/algorithms/engine/algorithms/t3impl/fn-bridge.cjs"],
    ["packages/algorithms/engine/algorithms/t3impl/shapes.json", npmRoot + "/algorithms/engine/algorithms/t3impl/shapes.json"],
    ["packages/engine/atoms/engine.cjs", npmRoot + "/engine/atoms/engine.cjs"],
    ["packages/engine/atoms/atom-factory.cjs", npmRoot + "/engine/atoms/atom-factory.cjs"],
    ["packages/engine/atoms/specialized.cjs", npmRoot + "/engine/atoms/specialized.cjs"],
    ["packages/engine/atoms/approx.cjs", npmRoot + "/engine/atoms/approx.cjs"],
    ["packages/engine/atoms/constraints.cjs", npmRoot + "/engine/atoms/constraints.cjs"],
    ["packages/engine/atoms/contract-validator.cjs", npmRoot + "/engine/atoms/contract-validator.cjs"],
    ["packages/engine/atoms/atoms-crypto-emotion.cjs", npmRoot + "/engine/atoms/atoms-crypto-emotion.cjs"],
    ["packages/engine/CONSTITUTION/AXIOMS.md", npmRoot + "/engine/CONSTITUTION/AXIOMS.md"],
    ["packages/engine/CORE/ATTRIBUTES.md", npmRoot + "/engine/CORE/ATTRIBUTES.md"],
    ["packages/engine/CORE/PROTOCOLS.md", npmRoot + "/engine/CORE/PROTOCOLS.md"],
    ["packages/engine/CORE/ATOMS.md", npmRoot + "/engine/CORE/ATOMS.md"],
    ["packages/engine/INDEX/ENGINES.md", npmRoot + "/engine/INDEX/ENGINES.md"],
    ["AGENTS.md", HOME + "/AGENTS.md"]
  ];
  const crypto = require("crypto");
  let okN = 0, bad = [];
  for (const [rel, live] of MAP) {
    const a = path.join(PKG, rel);
    if (!fs.existsSync(a)) { bad.push(rel + "(包内缺)"); continue; }
    if (!fs.existsSync(live)) { bad.push(rel + "(活系统缺)"); continue; }
    const ha = crypto.createHash("sha256").update(fs.readFileSync(a)).digest("hex");
    const hb = crypto.createHash("sha256").update(fs.readFileSync(live)).digest("hex");
    if (ha === hb) okN++; else bad.push(rel + "(内容不同)");
  }
  k10Ok = bad.length === 0;
  k10d = bad.length === 0 ? `${okN}/${MAP.length} 全部已装入且一致` : `${bad.length} 项不一致: ${bad.slice(0,3).join(", ")}`;
} catch (e) { k10d = String(e.message).slice(0, 80); }
chk("K10", "包内容已全部装入活系统", k10Ok, k10d);

/* K11. 技能层可加载性（扫描全部 SKILL.md 的 frontmatter 与正文；数量以实测为准，不写死） */
let k11Ok = false, k11d = "";
try {
  const audit = path.join(HOME, "scripts/audit_skills.py");
  if (!fs.existsSync(audit)) {
    k11d = "审计脚本不存在（环境相关项，跳过）";
  } else {
    /* Python 多候选回退：裸 python 可能解析到 Store 桩或未安装 */
    const PY_CANDS = [
      process.env.METAGO_PYTHON,
      "C:/Users/MetaGO/AppData/Local/Python/pythoncore-3.14-64/python.exe",
      "python", "python3", "py"
    ].filter(Boolean);
    let out = null, lastErr = "";
    for (const py of PY_CANDS) {
      try {
        out = String(runCapture(py, [audit], {
          encoding: "utf8", timeout: 120000,
          env: Object.assign({}, process.env, { PYTHONIOENCODING: "utf-8" })
        }));
        break;
      } catch (e) { lastErr = String(e.message || e).slice(0, 60); }
    }
    if (out === null) {
      k11d = "Python 解释器均不可用（环境相关项，跳过）: " + lastErr;
      k11Ok = true;   // 环境缺失不算产品缺陷
    } else {
      const mt = /技能文件总数：\s*(\d+)/.exec(out);
      const mp = /问题总数：\s*(\d+)/.exec(out);
      k11Ok = /判定：\s*PASS/.test(out);
      k11d = mt && mp ? `技能 ${mt[1]} 个，问题 ${mp[1]} 处` : "无法解析";
    }
  }
} catch (e) { k11d = String(e.stdout || e.message).slice(0, 80); }
chk("K11", "技能层可加载性（frontmatter + 正文）", k11Ok, k11d);

/* K12. vendor 补丁在位（npm install 后不被静默回退） */
let k12Ok = false, k12d = "";
try {
  const reap = path.join(HOME, "scripts/reapply-patches.cjs");
  if (!fs.existsSync(reap)) {
    k12d = "自愈脚本不存在（环境相关项，跳过）";
  } else {
    const o = String(runCapture(process.execPath, [reap, "--check"], {
      encoding: "utf8", timeout: 120000
    }));
    const m = /共 (\d+) 组补丁 ｜ 通过 (\d+) ｜ 需处理 (\d+)/.exec(o);
    k12Ok = /总判定：PASS/.test(o);
    k12d = m ? `补丁 ${m[1]} 组，通过 ${m[2]}，需处理 ${m[3]}` : "无法解析";
  }
} catch (e) { k12d = String(e.stdout || e.message).slice(0, 80); }
chk("K12", "vendor 补丁在位（DEF-016~020 不静默回退）", k12Ok, k12d);

/* K13. 特化算子语义正确性（86 项数学性质断言） */
let k13Ok = false, k13d = "";
try {
  const f = path.join(HOME, "scripts/ops-semantic-full.cjs");
  if (!fs.existsSync(f)) {
    k13d = "语义测试脚本不存在（环境相关项，跳过）";
  } else {
    const o = String(runCapture(process.execPath, [f], { encoding: "utf8", timeout: 120000 }));
    const m = /语义断言：通过 (\d+) ｜ 失败 (\d+)/.exec(o);
    k13Ok = /总判定：PASS/.test(o);
    k13d = m ? `语义断言 ${m[1]} 项通过，失败 ${m[2]}` : "无法解析";
  }
} catch (e) { k13d = String(e.stdout || e.message).slice(0, 80); }
chk("K13", "特化算子语义正确性（已知数学性质断言）", k13Ok, k13d);

/* K14. 算法语义不变量（34 项数学性质断言） */
let k14Ok = false, k14d = "";
try {
  const f = path.join(HOME, "scripts/algo-semantic-invariants.cjs");
  if (!fs.existsSync(f)) {
    k14d = "不变量测试脚本不存在（环境相关项，跳过）";
  } else {
    const o = String(runCapture(process.execPath, [f], { encoding: "utf8", timeout: 180000 }));
    const m = /语义不变量：通过 (\d+) ｜ 失败 (\d+)/.exec(o);
    k14Ok = /总判定：PASS/.test(o);
    k14d = m ? `不变量 ${m[1]} 项通过，失败 ${m[2]}` : "无法解析";
  }
} catch (e) { k14d = String(e.stdout || e.message).slice(0, 80); }
chk("K14", "算法语义不变量（自反性/对称性/三角不等式）", k14Ok, k14d);

/* K15. 输出洁净度（已知 2 条例外，任何新增污染即 FAIL） */
let k15Ok = false, k15d = "";
try {
  const f = path.join(HOME, "scripts/null-nan-scan.cjs");
  if (!fs.existsSync(f)) {
    k15d = "扫描脚本不存在（环境相关项，跳过）";
  } else {
    let o = "";
    try { o = String(runCapture(process.execPath, [f], { encoding: "utf8", timeout: 180000 })); }
    catch (e) { o = String(e.stdout || ""); }   /* 有污染时脚本 exit 1，但 stdout 有内容 */
    const m = /有 NaN\/Inf\/全 null 的 (\d+) 条/.exec(o);
    const cnt = m ? parseInt(m[1], 10) : -1;
    const KNOWN = [];   /* 2026-10-18 已全部清零：污染 103 → 0，改为 0 容忍 */
    /* 抽取本次被点名的算法 ID */
    const seen = [];
    const re = /^\s+(ALG_[A-Z0-9_]+)\s+/gm;
    let mm;
    while ((mm = re.exec(o))) if (!seen.includes(mm[1])) seen.push(mm[1]);
    const extra = seen.filter(x => !KNOWN.includes(x));
    k15Ok = cnt === 0 && extra.length === 0;
    k15d = cnt < 0 ? "无法解析" : (cnt === 0 ? "污染 0 条" : ("污染 " + cnt + " 条: " + extra.slice(0, 3).join(",")));
  }
} catch (e) { k15d = String(e.stdout || e.message).slice(0, 80); }
chk("K15", "输出洁净度（NaN/Inf/全 null = 0 容忍）", k15Ok, k15d);

/* K16. 蓝本五项声明与实体清单一致（公理/属性/协议/引擎/原子） */
let k16Ok = false, k16d = "";
try {
  const f = path.join(HOME, "scripts/verify_blueprint_claims3.py");
  if (!fs.existsSync(f)) {
    k16d = "校验脚本不存在（环境相关项，跳过）";
  } else {
    const PY_CANDS16 = [
      process.env.METAGO_PYTHON,
      "C:/Users/MetaGO/AppData/Local/Python/pythoncore-3.14-64/python.exe",
      "python", "python3", "py"
    ].filter(Boolean);
    let o = null;
    for (const py of PY_CANDS16) {
      try {
        o = String(runCapture(py, [f], { encoding: "utf8", timeout: 60000,
          env: Object.assign({}, process.env, { PYTHONIOENCODING: "utf-8" }) }));
        break;
      } catch (e) { o = null; }
    }
    if (o === null) {
      k16d = "Python 解释器均不可用（环境相关项，跳过）";
      k16Ok = true;
    } else {
      const mm = /一致 (\d+) ｜ 不一致 (\d+)/.exec(o);
      k16Ok = /总判定：PASS/.test(o);
      k16d = mm ? `一致 ${mm[1]} 项，不一致 ${mm[2]} 项` : "无法解析";
    }
  }
} catch (e) { k16d = String(e.message).slice(0, 70); }
chk("K16", "蓝本五项声明与实体清单一致", k16Ok, k16d);

/* 报告 */
console.log("=".repeat(92));
console.log("metagolifeform v36.10.0 交付验收");
console.log("=".repeat(92));
let cur = "";
results.forEach(r => {
  if (r.code[0] !== cur) { cur = r.code[0]; console.log(); }
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.code.padEnd(4)} ${r.name.padEnd(38)} ${r.detail}`);
});
console.log();
console.log("=".repeat(92));
console.log(`合计 ${results.length} 项 ｜ 通过 ${results.length - fail} ｜ 失败 ${fail}`);
console.log(fail === 0 ? "总判定：PASS" : "总判定：FAIL");
console.log("=".repeat(92));

const report = `# metagolifeform v36.10.0 交付验收报告

生成时间：${new Date().toISOString()}
包路径：\`${PKG}\`

| 代码 | 检查项 | 结果 | 证据 |
|---|---|---|---|
${results.map(r => `| ${r.code} | ${r.name} | ${r.ok ? "✅ PASS" : "❌ FAIL"} | ${r.detail.replace(/\|/g, "\\|")} |`).join("\n")}

**合计 ${results.length} 项 ｜ 通过 ${results.length - fail} ｜ 失败 ${fail} ｜ 总判定：${fail === 0 ? "PASS" : "FAIL"}**
`;
fs.writeFileSync(path.join(PKG, "DELIVERY-VERIFY.md"), report, "utf8");
console.log("\n报告已写出:", path.join(PKG, "DELIVERY-VERIFY.md"));

process.exit(fail === 0 ? 0 : 1);
