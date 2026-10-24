"use strict";
/**
 * reapply-patches.cjs — vendor 包补丁自愈器（幂等，可重复运行）
 *
 * 背景：@metago-ai/engine 与 @metago-ai/mcp-server 是 npm 安装的，
 * 本会话为修 7 类缺陷直接改了它们的 dist 文件。一次 npm install/update 会全部丢失，
 * 系统会**静默退回带缺陷状态**（决策锁崩溃、占位符漏检、记忆写入崩溃…）。
 *
 * 用法：
 *   node reapply-patches.cjs          # 检查并补齐缺失补丁
 *   node reapply-patches.cjs --check   # 只检查不修改
 *
 * 设计原则：所有补丁逻辑内联在本文件，不依赖 D:\metago-build 等外部目录。
 */
const fs = require("fs");
const path = require("path");

const NPM = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai";
const CHECK_ONLY = process.argv.includes("--check");

const p = (x, n) => String(x).padEnd(n).slice(0, n);
const log = [];
const say = (s) => { console.log(s); log.push(s); };

/* ---------- 通用注入工具 ---------- */
function injectAfter(file, anchor, insert, marker) {
  const abs = path.join(NPM, file);
  if (!fs.existsSync(abs)) return { ok: false, why: "文件不存在" };
  let t = fs.readFileSync(abs, "utf8");
  if (marker && t.includes(marker)) return { ok: true, why: "已在位" };
  const i = t.indexOf(anchor);
  if (i < 0) return { ok: false, why: "锚点未找到: " + anchor.slice(0, 40) };
  const end = i + anchor.length;
  t = t.slice(0, end) + insert + t.slice(end);
  if (CHECK_ONLY) return { ok: false, why: "缺失（--check 不修改）" };
  fs.writeFileSync(abs, t, "utf8");
  return { ok: true, why: "已注入" };
}

function replaceOnce(file, oldStr, newStr, marker) {
  const abs = path.join(NPM, file);
  if (!fs.existsSync(abs)) return { ok: false, why: "文件不存在" };
  let t = fs.readFileSync(abs, "utf8");
  if (marker && t.includes(marker)) return { ok: true, why: "已在位" };
  if (!t.includes(oldStr)) return { ok: false, why: "原文未找到" };
  t = t.replace(oldStr, newStr);
  if (CHECK_ONLY) return { ok: false, why: "缺失（--check 不修改）" };
  fs.writeFileSync(abs, t, "utf8");
  return { ok: true, why: "已替换" };
}

const NORM_LINE = (v) =>
  `if (typeof ${v} !== 'string') { ${v} = (${v} === null || ${v} === undefined) ? '' : ` +
  `(typeof ${v} === 'object' ? (() => { try { return JSON.stringify(${v}); } catch (e) { return ''; } })() : String(${v})); }\n`;

/* ---------- 补丁定义 ---------- */
const JOBS = [
  {
    id: "P31", what: "R142: creationLineage 循环守卫（manifest 补丁2 从未真正生效）",
    run: () => {
      const src = path.join(__dirname, "patches", "r142-creation-lineage-guard.cjs");
      const dst = path.join(NPM, "algorithms", "engine", "algorithms", "t1", "creation-algorithms.js");
      if (!fs.existsSync(src)) return { ok: false, why: "模板缺失" };
      const cur = fs.existsSync(dst) ? fs.readFileSync(dst, "utf8") : "";
      if (cur.indexOf("lineageGuard") >= 0) return { ok: true, why: "已在位" };
      if (CHECK_ONLY) return { ok: false, why: "缺 lineageGuard（环形数据会死循环）" };
      fs.copyFileSync(src, dst);
      return { ok: true, why: "已从模板恢复" };
    },
  },
  {
    id: "P26", what: "R142: L3 适配器全量修复（BCM 参数契约/单参包装/类型守卫/必填守卫）",
    run: () => {
      const src = path.join(__dirname, "patches", "r142-tool-registry.cjs");
      const dst = path.join(NPM, "algorithms", "tool-registry.js");
      if (!fs.existsSync(src)) return { ok: false, why: "模板缺失" };
      const marks = ["R142-TYPE", "R142-ARGS", "R141-fix：原实现把 scoreFn", "extractPrincipalComponent"];
      const cur = fs.existsSync(dst) ? fs.readFileSync(dst, "utf8") : "";
      const miss = marks.filter(m => cur.indexOf(m) < 0);
      if (!miss.length) return { ok: true, why: "已在位" };
      if (CHECK_ONLY) return { ok: false, why: "缺失标记：" + miss.join("/") };
      fs.copyFileSync(src, dst);
      return { ok: true, why: "已从模板恢复" };
    },
  },
  {
    id: "P27", what: "R142: 57 个工具 schema（type 修正 + L4 operation enum + examples）",
    run: () => {
      const srcDir = path.join(__dirname, "patches", "r142-tools-schemas");
      const dstDir = path.join(NPM, "algorithms", "tools");
      if (!fs.existsSync(srcDir)) return { ok: false, why: "模板缺失" };
      // 抽样比对 3 个关键 schema
      const probes = {
        "normalize_coupling.json": "scores",
        "simplified_svd.json": "matrix",
        "coupling_calculate.json": "operation",
      };
      const bad = [];
      for (const [f, mark] of Object.entries(probes)) {
        const d = path.join(dstDir, f);
        if (!fs.existsSync(d)) { bad.push(f + "(缺失)"); continue; }
        if (fs.readFileSync(d, "utf8").indexOf(mark) < 0) bad.push(f + "(缺" + mark + ")");
      }
      if (!bad.length) return { ok: true, why: "已在位" };
      if (CHECK_ONLY) return { ok: false, why: "不符：" + bad.join("/") };
      for (const f of fs.readdirSync(srcDir)) {
        if (!/\.json$/.test(f)) continue;
        fs.copyFileSync(path.join(srcDir, f), path.join(dstDir, f));
      }
      return { ok: true, why: "已从模板恢复 " + fs.readdirSync(srcDir).filter(f => /\.json$/.test(f)).length + " 个" };
    },
  },
  {
    id: "P28", what: "R142: 检查脚本全家桶（10 个新检查 + 3 个强化）",
    run: () => {
      const srcDir = path.join(__dirname, "patches", "r142-check-scripts");
      const dstDir = __dirname;
      if (!fs.existsSync(srcDir)) return { ok: false, why: "模板缺失" };
      const files = fs.readdirSync(srcDir);
      const bad = [];
      for (const f of files) {
        const d = path.join(dstDir, f);
        if (!fs.existsSync(d)) { bad.push(f + "(缺失)"); continue; }
        const a = fs.readFileSync(path.join(srcDir, f));
        const b = fs.readFileSync(d);
        if (a.length !== b.length) bad.push(f + "(不一致)");
      }
      if (!bad.length) return { ok: true, why: "已在位" };
      if (CHECK_ONLY) return { ok: false, why: "不符 " + bad.length + " 个：" + bad.slice(0, 3).join("/") };
      for (const f of files) fs.copyFileSync(path.join(srcDir, f), path.join(dstDir, f));
      return { ok: true, why: "已恢复 " + files.length + " 个" };
    },
  },
  {
    id: "P29", what: "R142: 断言强度守卫（防修复被自己覆盖回弱版）",
    run: () => {
      const src = path.join(__dirname, "patches", "r142-check-scripts", "assertion_strength_guard.mjs");
      const dst = path.join(__dirname, "assertion_strength_guard.mjs");
      if (!fs.existsSync(src)) return { ok: false, why: "模板缺失" };
      if (fs.existsSync(dst)) {
        const a = fs.readFileSync(src).length, b = fs.readFileSync(dst).length;
        if (a === b) return { ok: true, why: "已在位" };
      }
      if (CHECK_ONLY) return { ok: false, why: "缺失或不一致" };
      fs.copyFileSync(src, dst);
      return { ok: true, why: "已恢复" };
    },
  },
  {
    id: "P25", what: "R141: 第二批 11 条确定性实现（原判需模型/需硬件）",
    run: () => {
      const src = path.join(__dirname, "patches", "r141-blueprint-atoms-2.cjs");
      const dst = path.join(NPM, "engine", "atoms", "blueprint-atoms-2.cjs");
      const af = path.join(NPM, "engine", "atoms", "atom-factory.cjs");
      if (!fs.existsSync(src)) return { ok: false, why: "模板缺失" };
      const ok2 = fs.existsSync(dst) && fs.readFileSync(dst, "utf8").includes("Shannon");
      const okM = fs.existsSync(af) && fs.readFileSync(af, "utf8").includes("BP2_IMPL");
      if (ok2 && okM) return { ok: true, why: "已在位" };
      if (CHECK_ONLY) {
        const miss = [];
        if (!ok2) miss.push("blueprint-atoms-2");
        if (!okM) miss.push("factory挂载");
        return { ok: false, why: "缺失：" + miss.join("/") };
      }
      return { ok: false, why: "需人工确认（校验两处关键改动在位）" };
    },
  },
  {
    id: "P24", what: "R141: 12 条假实现改诚实标注 + r4 数值守卫 + 2 处危险 catch",
    run: () => {
      const af = path.join(NPM, "engine", "atoms", "atom-factory.cjs");
      const cv = path.join(NPM, "engine", "atoms", "contract-validator.cjs");
      const bp = path.join(NPM, "engine", "atoms", "blueprint-atoms.cjs");
      if (!fs.existsSync(af)) return { ok: false, why: "atom-factory 不存在" };
      const t = fs.readFileSync(af, "utf8");
      const hasModel = t.includes("MODEL_NEEDED");
      const hasCatch = t.includes("R141-CONTRACT-VALIDATOR");
      const bpOk = fs.existsSync(bp) && fs.readFileSync(bp, "utf8").includes("if (!isFinite(v)) return null");
      if (hasModel && hasCatch && bpOk) return { ok: true, why: "已在位" };
      if (CHECK_ONLY) {
        const miss = [];
        if (!hasModel) miss.push("MODEL_NEEDED");
        if (!hasCatch) miss.push("危险catch");
        if (!bpOk) miss.push("r4守卫");
        return { ok: false, why: "缺失：" + miss.join("/") };
      }
      return { ok: false, why: "需人工确认（该补丁校验三处关键改动是否在位）" };
    },
  },
  {
    id: "P23", what: "R141: 52 条蓝本契约确定性实现（DEF-084）",
    run: () => {
      const src = path.join(__dirname, "patches", "r141-blueprint-atoms.cjs");
      if (!fs.existsSync(src)) return { ok: false, why: "模板缺失" };
      const dstDir = path.join(NPM, "engine", "atoms");
      const dst = path.join(dstDir, "blueprint-atoms.cjs");
      const body = fs.readFileSync(src);
      const cur = fs.existsSync(dst) ? fs.readFileSync(dst) : null;
      if (cur && cur.equals(body)) {
        // 文件已在位，检查 atom-factory 是否已挂载
        const af = path.join(dstDir, "atom-factory.cjs");
        if (fs.existsSync(af)) {
          const ft = fs.readFileSync(af, "utf8");
          if (ft.includes("loadBlueprintAtoms")) return { ok: true, why: "已在位" };
        }
        return { ok: false, why: "模块在但未挂载" };
      }
      if (CHECK_ONLY) return { ok: false, why: "缺失（--check 不修改）" };
      if (!fs.existsSync(dstDir)) return { ok: false, why: "atoms 目录不存在" };
      fs.writeFileSync(dst, body);
      return { ok: true, why: "已写入 blueprint-atoms.cjs" };
    },
  },
  {
    id: "P22", what: "R141: 5 个哲学族 constraint 原子补齐实现（DEF-083）",
    run: () => {
      const tpl = path.join(__dirname, "patches", "r141-constraint-impl.tpl");
      if (!fs.existsSync(tpl)) return { ok: false, why: "模板缺失" };
      const block = fs.readFileSync(tpl, "utf8");
      const target = "engine/atoms/atom-factory.cjs";
      const abs = path.join(NPM, target);
      if (!fs.existsSync(abs)) return { ok: false, why: "文件不存在" };
      let t = fs.readFileSync(abs, "utf8");
      if (t.includes("METAGO-R141-CONSTRAINT-IMPL")) return { ok: true, why: "已在位" };
      const anchor = "const CONSTRAINT_IDS = new Set([";
      if (!t.includes(anchor)) return { ok: false, why: "锚点未找到" };
      t = t.replace(anchor, block + "\n" + anchor);
      const m = /function make\s*\(([^)]*)\)\s*\{/.exec(t);
      if (!m) return { ok: false, why: "make() 未找到" };
      const inject = "\n  if (CONSTRAINT_IDS && CONSTRAINT_IDS.has && CONSTRAINT_IDS.has(atomId)) {\n"
        + "    const ca = makeConstraintAtom(atomId);\n    if (ca) return ca;\n  }\n";
      t = t.slice(0, m.index + m[0].length) + inject + t.slice(m.index + m[0].length);
      if (CHECK_ONLY) return { ok: false, why: "缺失（--check 不修改）" };
      fs.writeFileSync(abs, t, "utf8");
      return { ok: true, why: "已注入" };
    },
  },
  {
    id: "P21", what: "R141: T3 227 条样例补齐（shapes.json 700 → 927）",
    run: () => {
      const tpl = path.join(__dirname, "patches", "r141-t3-shapes.json");
      if (!fs.existsSync(tpl)) return { ok: false, why: "模板缺失" };
      const add = JSON.parse(fs.readFileSync(tpl, "utf8"));
      const target = "algorithms/engine/algorithms/t3impl/shapes.json";
      const abs = path.join(NPM, target);
      if (!fs.existsSync(abs)) return { ok: false, why: "文件不存在" };
      let cur;
      try { cur = JSON.parse(fs.readFileSync(abs, "utf8")); } catch (e) { return { ok: false, why: "解析失败" }; }
      let miss = 0;
      for (const k of Object.keys(add)) {
        if (!cur[k]) { cur[k] = add[k]; miss++; }
      }
      if (miss === 0) return { ok: true, why: "已在位" };
      if (CHECK_ONLY) return { ok: false, why: "缺失 " + miss + " 条（--check 不修改）" };
      fs.writeFileSync(abs, JSON.stringify(cur, null, 1), "utf8");
      return { ok: true, why: "补入 " + miss + " 条" };
    },
  },
  {
    id: "P19", what: "R141: 算法执行器位置参数展开（P0-A01~A04 根因）",
    run: () => {
      const tpl = path.join(__dirname, "patches", "r141-positional.tpl");
      if (!fs.existsSync(tpl)) return { ok: false, why: "模板缺失" };
      const block = fs.readFileSync(tpl, "utf8");
      const target = "algorithms/engine/algorithms/registry.js";
      const abs = path.join(NPM, target);
      if (!fs.existsSync(abs)) return { ok: false, why: "文件不存在" };
      let t = fs.readFileSync(abs, "utf8");
      if (t.includes("METAGO-R141-POSITIONAL")) {
        /* R142：不能只看「有没有注入」，还要看注入的是哪个版本。
           旧版代码块里 metagoCoerceFn 的 preset 查找在 RE 之后（死代码），
           必须比对 R142-PRESET 标记，否则重装后修好的 preset 会被旧模板覆盖回去。 */
        const needPreset = block.includes("R142-PRESET");
        const hasPreset = t.includes("R142-PRESET");
        if (needPreset && !hasPreset) {
          if (CHECK_ONLY) return { ok: false, why: "代码块是旧版（缺 R142-PRESET），需重新注入" };
          t = t.replace(/\/\* ==== \/?METAGO-R141-POSITIONAL ==== \*\//,
                        block.trim() + "\n/* ==== /METAGO-R141-POSITIONAL ==== */");
          fs.writeFileSync(abs, t, "utf8");
          return { ok: true, why: "已升级为含 R142-PRESET 的新版代码块" };
        }
        return { ok: true, why: "已在位" };
      }
      const anchor = "async function executeAlgorithm(id, input) {";
      if (!t.includes(anchor)) return { ok: false, why: "锚点未找到" };
      t = t.replace(anchor, block + "\n" + anchor);
      const oldA = "        const output = await entry.handler(input);";
      const newA = "        const output = await metagoInvoke(entry.handler, input);";
      if (t.includes(oldA)) t = t.replace(oldA, newA);
      const oldS = "        const output = entry.handler(input);";
      const newS = "        const output = metagoInvoke(entry.handler, input);";
      if (t.includes(oldS)) t = t.replace(oldS, newS);
      if (CHECK_ONLY) return { ok: false, why: "缺失（--check 不修改）" };
      fs.writeFileSync(abs, t, "utf8");
      return { ok: true, why: "已注入" };
    },
  },
  {
    id: "P20", what: "R141: MCP L3 工具参数适配层 + 输出守卫",
    run: () => {
      const tpl = path.join(__dirname, "patches", "r141-l3-adapt.tpl");
      if (!fs.existsSync(tpl)) return { ok: false, why: "模板缺失" };
      const block = fs.readFileSync(tpl, "utf8");
      const target = "algorithms/tool-registry.js";
      const abs = path.join(NPM, target);
      if (!fs.existsSync(abs)) return { ok: false, why: "文件不存在" };
      let t = fs.readFileSync(abs, "utf8");
      if (t.includes("METAGO-R141-L3-ADAPT")) return { ok: true, why: "已在位" };
      const anchor = "function createL3Handler(toolName, algorithmId) {";
      if (!t.includes(anchor)) return { ok: false, why: "锚点未找到" };
      t = t.replace(anchor, block + "\n" + anchor);
      const oldH = [
        "function createL3Handler(toolName, algorithmId) {",
        "  return async (args, registry) => {",
        "    const startTime = Date.now();",
        "    const result = registry.executeAlgorithmSync(algorithmId, args);",
        "    return enrichResult(result, algorithmId, registry, toolName, startTime);",
        "  };",
        "}",
      ].join("\n");
      const newH = [
        "function createL3Handler(toolName, algorithmId) {",
        "  return async (args, registry) => {",
        "    const startTime = Date.now();",
        "    const ad = adaptL3Args(toolName, args);",
        "    if (!ad.ok) {",
        "      return { success: false, error: ad.error,",
        "        provenance: ['[mcp_metago-algorithms] ' + toolName, '[R141-L3-ADAPT] ' + ad.error],",
        "        durationMs: Date.now() - startTime };",
        "    }",
        "    const result = registry.executeAlgorithmSync(algorithmId, ad.input);",
        "    if (result && result.success === true && isEmptyShell(result.output)) {",
        "      return { success: false, error: 'invalid_output: 算法返回空结果（可能是入参形状不匹配）',",
        "        provenance: (result.provenance || []).concat(['[R141-OUTPUT-GUARD] empty shell blocked']),",
        "        durationMs: Date.now() - startTime, output: result.output };",
        "    }",
        "    return enrichResult(result, algorithmId, registry, toolName, startTime);",
        "  };",
        "}",
      ].join("\n");
      if (t.includes(oldH)) t = t.replace(oldH, newH);
      else return { ok: false, why: "createL3Handler 原文未找到" };
      if (CHECK_ONLY) return { ok: false, why: "缺失（--check 不修改）" };
      fs.writeFileSync(abs, t, "utf8");
      return { ok: true, why: "已注入" };
    },
  },
  {
    id: "P1", what: "explicitForm 判空（DEF-016）",
    run: () => replaceOnce("engine/RUNTIME/dist/kmwi-memory.js",
      "const explicit = intuitions.filter(i => i.explicitForm.length > 0).length;",
      "const explicit = intuitions.filter(i => (i.explicitForm || '').length > 0).length;",
      "(i.explicitForm || '')"),
  },
  {
    id: "P3", what: "validateAll 入口 output 归一化（DEF-017）",
    run: () => injectAfter("engine/RUNTIME/dist/validators.js",
      "validateAll(output, context) {\n",
      "        /* NORMALIZED：统一把 output 归一为字符串，避免调用方传对象/数组时崩溃 */\n" +
      "        if (typeof output !== 'string') {\n" +
      "            try { output = typeof output === 'object' && output !== null ? JSON.stringify(output) : String(output); }\n" +
      "            catch (e) { output = ''; }\n" +
      "            if (typeof output !== 'string') output = '';\n" +
      "        }\n",
      "/* NORMALIZED："),
  },
  {
    id: "P4", what: "占位符检测扩宽（DEF-018）",
    run: () => replaceOnce("engine/RUNTIME/dist/validators.js",
      "const placeholders = ['[placeholder]', '<TODO>', 'xxx', 'TBD', 'FIXME', '[未填写]', '[待补充]'];\n        const found = placeholders.filter(p => String(output).includes(p));",
      "/* PLACEHOLDER_PATTERNS_V2：扩宽到常见占位符形态，不区分大小写 */\n" +
      "        const placeholderRe = /\\[(?:placeholder|未填写|待补充|待填|待定|todo|tbd|fixme)\\]|<\\s*(?:TODO|TBD|FIXME|占位)\\s*>|\\bTODO\\b|\\bTBD\\b|\\bFIXME\\b|\\bx{3,}\\b|待补充|待填写|此处省略|略过不计/gi;\n" +
      "        const found = [];\n        let _m;\n        placeholderRe.lastIndex = 0;\n" +
      "        while ((_m = placeholderRe.exec(String(output))) !== null) {\n" +
      "            const v = _m[0];\n            if (!found.includes(v)) found.push(v);\n" +
      "            if (found.length >= 10) break;\n" +
      "            if (_m.index === placeholderRe.lastIndex) placeholderRe.lastIndex++;\n        }",
      "PLACEHOLDER_PATTERNS_V2"),
  },
  {
    id: "P5", what: "公理校验入参归一化（DEF-020）",
    run: () => {
      const targets = [
        ["static checkProvenance(output, input) {", ["output"]],
        ["static checkCompliance(decision) {", ["decision"]],
        ["static checkComplianceProactive(decision) {", ["decision"]],
        ["static checkDataTraceability(output) {", ["output"]],
      ];
      let done = 0, why = [];
      for (const [anchor, vars] of targets) {
        let ins = "\n        /* TYPENORM */\n";
        for (const v of vars) ins += "        " + NORM_LINE(v);
        const r = injectAfter("engine/RUNTIME/dist/validators.js", anchor, ins, "/* TYPENORM */");
        if (r.ok) done++;
        else why.push(anchor.slice(7, 30) + ":" + r.why);
      }
      return { ok: done === targets.length, why: done === targets.length ? `${done} 处已在位/已注入` : why.join("; ") };
    },
  },
  {
    id: "P6", what: "DecisionLock.validate 三入参归一化（DEF-019）",
    run: () => injectAfter("engine/RUNTIME/dist/decision-lock.js",
      "async validate(output, intent, userRequest) {\n",
      "        /* DC_NORMALIZED：三个入参统一归一为字符串，避免调用方传对象/数组/null 时崩溃 */\n" +
      "        const _norm = (v) => { if (typeof v === 'string') return v; if (v === null || v === undefined) return ''; try { return typeof v === 'object' ? JSON.stringify(v) : String(v); } catch (e) { return ''; } };\n" +
      "        output = _norm(output); intent = _norm(intent); userRequest = _norm(userRequest);\n",
      "/* DC_NORMALIZED："),
  },
  {
    id: "P7", what: "四道关卡归一化（DEF-020）",
    run: () => {
      const targets = [
        ["gateIVL(output, intent, userRequest) {", ["output", "intent", "userRequest"]],
        ["gateILT(output, intent) {", ["output", "intent"]],
        ["gateOSG(output) {", ["output"]],
        ["gateIntegrity(output) {", ["output"]],
      ];
      let done = 0, why = [];
      for (const [anchor, vars] of targets) {
        let ins = "\n        /* TYPENORM */\n";
        for (const v of vars) ins += "        " + NORM_LINE(v);
        const r = injectAfter("engine/RUNTIME/dist/decision-lock.js", anchor, ins, "/* TYPENORM */");
        if (r.ok) done++;
        else why.push(anchor.slice(0, 20) + ":" + r.why);
      }
      return { ok: done === targets.length, why: done === targets.length ? `${done} 处已在位/已注入` : why.join("; ") };
    },
  },
  {
    id: "P8", what: "detectFromFeedback 归一化（DEF-020）",
    run: () => injectAfter("engine/RUNTIME/dist/perception.js",
      "detectFromFeedback(feedback) {\n",
      "\n        /* TYPENORM */\n        " + NORM_LINE("feedback"),
      "/* TYPENORM */"),
  },
  {
    id: "P15", what: "mcp-server: emotion 工具接真分类器（含 createRequire 修复）",
    run: () => {
      const f = path.join(NPM, "mcp-server/dist/index.js");
      if (!fs.existsSync(f)) return { ok: false, why: "文件不存在" };
      const t = fs.readFileSync(f, "utf8");
      const need = ["handleEmotion", "emotionMod", "createRequire", "__cjsRequire"];
      const miss = need.filter(x => !t.includes(x));
      if (miss.length === 0) return { ok: true, why: "加载器+handler+分发均在位" };
      return { ok: false, why: CHECK_ONLY ? "缺 " + miss.join(",") : "缺 " + miss.join(",") + "，需重放 wire_emotion_tool2.py + fix_emotion_esm.py" };
    },
  },
  {
    id: "P16", what: "mcp-server: negentropy 工具接熵算子",
    run: () => {
      const f = path.join(NPM, "mcp-server/dist/index.js");
      if (!fs.existsSync(f)) return { ok: false, why: "文件不存在" };
      const t = fs.readFileSync(f, "utf8");
      const need = ["handleNegentropy", "specMod", "pickNumbers"];
      const miss = need.filter(x => !t.includes(x));
      if (miss.length === 0) return { ok: true, why: "加载器+handler+分发均在位" };
      return { ok: false, why: CHECK_ONLY ? "缺 " + miss.join(",") : "缺 " + miss.join(",") + "，需重放 wire_negentropy_tool.py" };
    },
  },
  {
    id: "P17", what: "engine: 情绪词库扩充（LEX_V2，每类 24-30 词）",
    run: () => {
      const f = path.join(NPM, "engine/atoms/atoms-crypto-emotion.cjs");
      if (!fs.existsSync(f)) return { ok: false, why: "文件不存在" };
      const t = fs.readFileSync(f, "utf8");
      if (t.includes("LEX_V2")) return { ok: true, why: "已扩充" };
      return { ok: false, why: CHECK_ONLY ? "缺失（--check 不修改）" : "缺失，需重放 expand_emotion_lexicon.py" };
    },
  },
  {
    id: "P18", what: "engine: ILT 推理链关键词补齐中文（DEF-049）",
    run: () => {
      const f = path.join(NPM, "engine/RUNTIME/dist/decision-lock.js");
      if (!fs.existsSync(f)) return { ok: false, why: "文件不存在" };
      const t = fs.readFileSync(f, "utf8");
      if (t.includes("REASONING_WORDS")) return { ok: true, why: "关键词表已在位" };
      return { ok: false, why: CHECK_ONLY ? "缺失（--check 不修改）" : "缺失，需重放 fix_ilt_keywords.py" };
    },
  },
  {
    id: "P13", what: "mcp-server: 4 工具接入 AxiomValidator（compliance/objectivity/data_provenance/critique）",
    run: () => {
      const f = path.join(NPM, "mcp-server/dist/index.js");
      if (!fs.existsSync(f)) return { ok: false, why: "文件不存在" };
      const t = fs.readFileSync(f, "utf8");
      const need = ['handleAxiomCheck(args.input, "checkCompliance"',
                    'handleAxiomCheck(args.input, "checkObjectivity"',
                    'handleAxiomCheck(args.input, "checkDataTraceability"',
                    'handleAxiomCheck(args.input, "checkCriticality"'];
      const miss = need.filter(x => !t.includes(x));
      if (miss.length === 0) return { ok: true, why: "4 个分支均在位" };
      if (CHECK_ONLY) return { ok: false, why: "缺 " + miss.length + " 个分支（--check 不修改）" };
      return { ok: false, why: "缺 " + miss.length + " 个分支，需运行 wire_more_axiom_tools.py 重放" };
    },
  },
  {
    id: "P14", what: "mcp-server: TOOLKIT_TOOLS 同名工具也走硬驱动",
    run: () => {
      const f = path.join(NPM, "mcp-server/dist/index.js");
      if (!fs.existsSync(f)) return { ok: false, why: "文件不存在" };
      const t = fs.readFileSync(f, "utf8");
      if (t.includes("handleAxiomCheck(tkInput")) return { ok: true, why: "已在位" };
      return { ok: false, why: CHECK_ONLY ? "缺失（--check 不修改）" : "缺失，需运行 wire_toolkit_harddriven.py 重放" };
    },
  },
  {
    id: "P2", what: "KMWI 四层写入归一化（DEF-020）",
    run: () => {
      const targets = [
        ["addKnowledge(content, category, tags = [], source = 'external') {", ["content"]],
        ["addMemory(content, context, tags = [], source = 'experience') {", ["content"]],
        ["addWisdom(pattern, description, causeEffect, tags = [], source = 'synthesis') {", ["pattern"]],
        ["addIntuition(insight, implicitKnowledge, tags = [], source = 'internalization') {", ["insight"]],
      ];
      let done = 0, why = [];
      for (const [anchor, vars] of targets) {
        let ins = "\n        /* TYPENORM */\n";
        for (const v of vars) ins += "        " + NORM_LINE(v);
        const r = injectAfter("engine/RUNTIME/dist/kmwi-memory.js", anchor, ins, "/* TYPENORM */");
        if (r.ok) done++;
        else why.push(anchor.slice(0, 20) + ":" + r.why);
      }
      return { ok: done === targets.length, why: done === targets.length ? `${done} 处已在位/已注入` : why.join("; ") };
    },
  },
];

/* ---------- 执行 ---------- */
say("=".repeat(84));
say("vendor 补丁自愈" + (CHECK_ONLY ? "（仅检查）" : ""));
say("=".repeat(84));
say(p("ID", 5) + p("状态", 10) + "说明");
say("-".repeat(84));

let fail = 0;
for (const job of JOBS) {
  let r;
  try { r = job.run(); } catch (e) { r = { ok: false, why: "异常:" + e.message.slice(0, 50) }; }
  if (!r.ok) fail++;
  say(p(job.id, 5) + p(r.ok ? "在位/已修" : "需处理", 10) + job.what.slice(0, 30) + "  " + r.why);
}

say("");
say("-".repeat(84));
say(`共 ${JOBS.length} 组补丁 ｜ 通过 ${JOBS.length - fail} ｜ 需处理 ${fail}`);

/* 语法自检：只有实际写入时才需要 */
if (!CHECK_ONLY) {
  const { execFileSync } = require("child_process");
  const files = [
    "engine/RUNTIME/dist/kmwi-memory.js",
    "engine/RUNTIME/dist/validators.js",
    "engine/RUNTIME/dist/decision-lock.js",
    "engine/RUNTIME/dist/perception.js",
  ];
  say("");
  say("语法校验：");
  for (const f of files) {
    const abs = path.join(NPM, f);
    try {
      execFileSync(process.execPath, ["--check", abs], { stdio: "pipe" });
      say("  ✓ " + f);
    } catch (e) {
      say("  ✗ " + f);
      fail++;
    }
  }
}

say("");
say(fail === 0 ? "总判定：PASS" : `总判定：需关注（${fail} 项）`);
/* DEF-056：补丁跑完后自动做一次重复收敛，避免不幂等块累积 */
try {
  require("child_process").execFileSync(process.execPath,
    [require("path").join(__dirname, "patch-dedupe.cjs")], { stdio: "inherit" });
} catch (e) { /* 收敛失败不阻断主流程 */ }

process.exitCode = fail === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
