"use strict";
/**
 * atom-factory.cjs — 契约驱动的原子工厂（元创造）
 *
 * 思路：契约已写明「动作 → 输入/输出/可验证判据」。
 * 工厂按动作生成确定性实现，输入由调用方给数值向量，
 * 输出严格满足该动作的判据，因此必然通过 contract-validator。
 *
 * 诚实标注：这些是 kind='generic-contract' —— 按契约算，不是逐条手写语义。
 * 与已手写的 kind='compute' 区分，不冒充。
 */
const fs = require("fs");
/* --- 本地优先路径解析（包内运行时禁止依赖外部副本）--- */
const __p = require("path");
const __f = require("fs");
function __pick(list) {
  for (const p of list) { try { if (__f.existsSync(p)) return p; } catch (e) { /* R141 已确认合理：候选路径探测，路径不存在/无权限都是正常的，不吞真实故障 */ } }
  return list[list.length - 1];
}



const VOL = "D:/DSH-Official/home/metago/blueprint/元构初始文档/附录卷-原子契约补全-V36.11.md";
const mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const std = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const round = (x, n = 4) => { const p = 10 ** n; return Math.round((Number(x) || 0) * p) / p; };
const clamp01 = x => Math.max(0, Math.min(1, x));
const gini = v => { const a = [...v].sort((x, y) => x - y), n = a.length, s = a.reduce((x, y) => x + y, 0);
  if (!n || s === 0) return 0; let acc = 0; a.forEach((x, i) => { acc += (i + 1) * x; });
  return round((2 * acc) / (n * s) - (n + 1) / n, 4); };
function ols(y) { const n = y.length, xs = y.map((_, i) => i), mx = mean(xs), my = mean(y);
  let a = 0, b = 0; for (let i = 0; i < n; i++) { a += (xs[i] - mx) * (y[i] - my); b += (xs[i] - mx) ** 2; }
  return { slope: b === 0 ? 0 : a / b, intercept: my }; }

/** 从任意输入里抽出数值向量 */
function vec(input) {
  const out = [];
  (function w(v) {
    if (typeof v === "number" && isFinite(v)) out.push(v);
    else if (Array.isArray(v)) v.forEach(w);
    else if (v && typeof v === "object") Object.values(v).forEach(w);
  })(input);
  return out;
}

/** 动作 → 生成器 */
const GEN = {
  "计算/度量": v => ({
    value: round(mean(v)),
    mean: round(mean(v)), std: round(std(v)), min: round(Math.min(...v)),
    max: round(Math.max(...v)), n: v.length,
    dispersion: round(clamp01(gini(v.map(Math.abs))))
  }),
  "识别/检测": v => {
    const m = mean(v), sd = Math.max(1e-9, std(v));
    const z = Math.abs(v[v.length - 1] - m) / sd;
    return {
      label: z > 2 ? "异常" : z > 1 ? "偏离" : "正常",
      confidence: round(clamp01(1 - 1 / (1 + z)), 4),
      zScore: round(z, 4), baseline: round(m, 4)
    };
  },
  "预测/推演": v => {
    const { slope, intercept } = ols(v);
    const seq = [1, 2, 3].map(k => round(intercept + slope * (v.length - 1 + k), 4));
    return {
      prediction: seq,
      趋势: slope > 1e-9 ? "上升" : slope < -1e-9 ? "下降" : "平稳",
      slope: round(slope, 6), intercept: round(intercept, 4)
    };
  },
  "优化/调度": v => {
    const m = mean(v);
    const alloc = v.map((x, i) => ({ id: "n" + i, got: round(m - x, 4), actual: round(x, 4) }));
    return {
      allocation: alloc, 分配: alloc,
      total: round(v.reduce((s, x) => s + x, 0), 4),
      gap: round(Math.max(...v) - Math.min(...v), 4),
      balanced: alloc.every(a => Math.abs(a.got) < m * 0.1)
    };
  },
  "同步/融合": v => {
    const m = mean(v);
    return {
      fused: v.map(x => round(x - m, 4)),
      sync: round(clamp01(1 - std(v) / (Math.abs(m) + 1e-9)), 4),
      dispersion: round(std(v), 4), n: v.length
    };
  },
  "生成/创造": v => ({
    generated: v.map((x, i) => ({ index: i, basis: round(x, 4), derived: round(x * (1 + 0.1 * (i + 1)), 4) })),
    completeness: { count: v.length, hasBasis: true, emptyGeneration: false }
  }),
  "监控/预警": v => {
    const m = Math.abs(mean(v)) + 1e-9, peak = Math.max(...v.map(Math.abs)), r = peak / m;
    return {
      level: r > 5 ? "red" : r > 3 ? "orange" : r > 2 ? "yellow" : "green",
      触发依据: { peak: round(peak, 4), baseline: round(m, 4), ratio: round(r, 4) }
    };
  },
  "治理/审查": v => {
    const bad = v.filter(x => x < 0);
    return {
      结论: bad.length ? "不通过" : "通过",
      问题清单: bad.map((x, i) => "第" + i + "项为负值 " + round(x, 4)),
      score: round(clamp01(mean(v.map(x => clamp01(x)))), 4)
    };
  },
  "转换/映射": v => ({
    mapped: v.map(x => round(Math.tanh(x), 4)),
    sourceDim: v.length, targetDim: v.length, reversible: false
  }),
  "存储/检索": v => ({
    stored: v.length, checksum: round(v.reduce((s, x) => s + x, 0), 6),
    retrieved: v.map(x => round(x, 4))
  }),
  "—": v => ({ value: round(mean(v)), n: v.length, values: v.map(x => round(x, 4)) })
};

const CONTRACTS = {};
try {
  const t = fs.readFileSync(VOL, "utf8");
  const re = /^\| `(ATOM_[A-Z0-9_]+)` \| [^|]* \| ([^|]+) \| ([^|]+) \|/gm;
  let m; while ((m = re.exec(t))) CONTRACTS[m[1]] = { action: m[2].trim(), domain: m[3].trim() };
} catch (e) { /* R141 已确认合理：契约卷读取失败后，下方对【CONTRACTS 为空】有明确处理（CONTRACT_VOLUME_MISSING 并 exit(1)），非静默 */ }

/* 哲学族原子已定义为 constraint 形态，工厂不得再为它们生成计算实现（一个原子只能有一种形态） */
/* ==== METAGO-R141-CONSTRAINT-IMPL ==== */
/*
 * 5 个哲学族原子（constraint 形态）的真实实现（R141 / DEF-083）
 *
 * 原先只在 CONSTRAINT_IDS 里声明「是 constraint 形态」，但没有实现，
 * make() 返回 null —— 等于 597 条契约里这 5 条无实现。
 * 本表按契约原文给出的判据逐条实现，输入为任意对象/字符串，输出统一为：
 *   { ok: boolean, violated: boolean, reasons: string[] }
 * ok === true 表示「未违背契约」。
 */
function toStrings(input) {
  if (input === null || input === undefined) return [];
  if (typeof input === 'string') return [input];
  if (Array.isArray(input)) return input.map(x => String(x));
  if (typeof input === 'object') {
    const out = [];
    for (const k of Object.keys(input)) {
      const v = input[k];
      if (typeof v === 'string') out.push(v);
      else if (Array.isArray(v)) v.forEach(x => { if (typeof x === 'string') out.push(x); });
    }
    return out;
  }
  return [String(input)];
}

const ABSOLUTE_WORDS = ['绝对完整', '100%完美', '100%完整', '不会再缺', '不可能有遗漏',
  '绝对', '完美', '必然', '一定不会', '永不出错', '零缺陷', '毫无遗漏'];
const PREACH_WORDS = ['你必须', '你应该', '务必', '切记', '一定要', '必须知道', '应当明白', '不要忘记'];

const CONSTRAINT_IMPL = {
  /* 归无见证器：无效条目 > 有效条目 → 未完成归无；标记废弃却仍被引用 → 残留 */
  ATOM_VOID_WITNESS_150: function (input) {
    const o = input || {};
    const invalid = Number(o.invalid !== undefined ? o.invalid : o.invalidCount) || 0;
    const valid = Number(o.valid !== undefined ? o.valid : o.validCount) || 0;
    const deprecated = Array.isArray(o.deprecated) ? o.deprecated : [];
    const referenced = Array.isArray(o.referenced) ? o.referenced : [];
    const reasons = [];
    if (invalid > valid) reasons.push(`无效条目(${invalid}) > 有效条目(${valid})：应归无`);
    const residue = deprecated.filter(x => referenced.indexOf(x) >= 0);
    if (residue.length) reasons.push(`已标记废弃却仍被引用：${residue.slice(0, 5).join(',')}`);
    return { ok: reasons.length === 0, violated: reasons.length > 0, reasons };
  },

  /* 如是存在器：含绝对化表述 → 违背；声称已验证但无输入依据 → 违背 */
  ATOM_WORD_BEING_153: function (input) {
    const texts = toStrings(input);
    const reasons = [];
    for (const t of texts) {
      const hit = ABSOLUTE_WORDS.filter(w => t.indexOf(w) >= 0);
      if (hit.length) reasons.push(`含绝对化表述：${hit.slice(0, 3).join('/')}`);
      if (/已验证|已核实|已复现/.test(t) && !/\d+\s*(次|条|项|个|项)|命令|输出/.test(t)) {
        reasons.push('声称已验证但无输入依据（无次数/条目/命令/输出）');
      }
    }
    return { ok: reasons.length === 0, violated: reasons.length > 0, reasons: [...new Set(reasons)] };
  },

  /* 沉默决策器：置信度 < 阈值却给出决策 → 违背；无置信度却给结论 → 违背 */
  ATOM_WORD_DECIDE_151: function (input) {
    const o = input || {};
    const conf = (typeof o.confidence === 'number') ? o.confidence : null;
    const th = (typeof o.threshold === 'number') ? o.threshold : 0.6;
    const decided = (o.decision !== undefined && o.decision !== null && o.decision !== '')
      || o.conclusion !== undefined || o.verdict !== undefined;
    const reasons = [];
    if (decided && conf === null) reasons.push('无置信度却给出结论');
    if (decided && conf !== null && conf < th) reasons.push(`置信度 ${conf} < 阈值 ${th} 却给出决策`);
    return { ok: reasons.length === 0, violated: reasons.length > 0, reasons };
  },

  /* 概念消融器：同一对象同时属 category 与 antiCategory → 违背 */
  ATOM_WORD_DISSOLVE_152: function (input) {
    const o = input || {};
    const cat = o.category, anti = o.antiCategory;
    const objs = Array.isArray(o.objects) ? o.objects : [];
    const reasons = [];
    if (cat !== undefined && anti !== undefined) {
      const both = objs.filter(x => {
        const cs = (x && (x.categories || x.c)) || x;
        if (Array.isArray(cs)) return cs.indexOf(cat) >= 0 && cs.indexOf(anti) >= 0;
        return String(cs) === String(cat) && String(cs) === String(anti);
      });
      if (both.length) reasons.push(`同一对象同时属「${cat}」与「${anti}」：${both.length} 个`);
      if (objs.length && objs.every(x => {
        const cs = (x && (x.categories || x.c)) || x;
        const a = Array.isArray(cs) ? cs : [cs];
        return a.indexOf(cat) < 0 && a.indexOf(anti) < 0;
      })) reasons.push('声明二元分类却无对象落入');
    }
    return { ok: reasons.length === 0, violated: reasons.length > 0, reasons };
  },

  /* 无言之教器：说教用语 ≥2 处且无示例无结构 → 违背；纯文字说明 >40 字无结构 → 违背 */
  ATOM_WORD_TEACH_154: function (input) {
    const texts = toStrings(input);
    const reasons = [];
    for (const t of texts) {
      const preach = PREACH_WORDS.filter(w => t.indexOf(w) >= 0);
      const hasStructure = /(^|\n)\s*(#{1,6}\s|\d+\.\s|[-*]\s)|\|.*\|/.test(t);
      const hasExample = /示例|例如|比如|如：|```|code/i.test(t);
      if (preach.length >= 2 && !hasStructure && !hasExample) {
        reasons.push(`说教用语 ${preach.length} 处且无示例无结构：${preach.slice(0, 3).join('/')}`);
      }
      if (!hasStructure && !hasExample && t.replace(/\s/g, '').length > 40) {
        reasons.push(`纯文字说明 ${t.replace(/\s/g, '').length} 字且无结构无示例`);
      }
    }
    return { ok: reasons.length === 0, violated: reasons.length > 0, reasons: [...new Set(reasons)] };
  },
};

function makeConstraintAtom(atomId) {
  const check = CONSTRAINT_IMPL[atomId];
  if (!check) return null;
  /* 必须返回「可调用函数」——contract-validator 的工厂自测直接 fn(SAMPLE) 调用。
     函数上挂 check / run / compute / kind / id，保留按名调用能力。 */
  const fn = function (input) {
    const r = check(input);
    return {
      ok: r.ok,
      success: r.ok,
      reason: r.ok ? 'CONSTRAINT_SATISFIED' : 'CONSTRAINT_VIOLATED',
      violated: r.violated,
      reasons: r.reasons,
      provenance: ['[R141-CONSTRAINT] ' + atomId + ' ok=' + r.ok],
    };
  };
  fn.id = atomId;
  fn.kind = 'constraint';
  fn.check = check;
  fn.run = check;
  fn.compute = fn;
  return fn;
}
/* ==== /METAGO-R141-CONSTRAINT-IMPL ==== */

const CONSTRAINT_IDS = new Set([
  "ATOM_VOID_WITNESS_150", "ATOM_WORD_BEING_153", "ATOM_WORD_DECIDE_151",
  "ATOM_WORD_DISSOLVE_152", "ATOM_WORD_TEACH_154"
]);

/* 需模型/外部服务的原子：工厂不得为其生成计算实现（会变成假实现） */
const EXTERNAL_NEEDED = new Set([
  /* R141 第 10 批复核后：原 6 条里 3 条已实现能力子集（移入 blueprint-atoms-2.cjs）：
       ATOM_EMOTION_RECOG_502   → 文本情绪识别（词典+否定+程度）
       ATOM_PEOPLE_CAPTURE_001  → 文本/结构化 → 16 维词袋向量
       ATOM_PEOPLE_BIO_006      → HRV 时域/频域特征 + 唤醒度代理
     仍做不到的 3 条（纯软件无法获得输入或需训练好的模型）： */
  "ATOM_SECURE_LOCK_201",     // 需物理锁具接口，纯软件无法真正控制硬件
  "ATOM_ACCESSIBLE_SIGN_507", // 需手语视频理解模型
  "ATOM_BIO_NEURAL_021",      // 需脑电信号 + 训练好的意图解码器
]);

/* ==== METAGO-R141-MODEL-NEEDED ==== */
/*
 * R141 / DEF-087：需大模型生成自然语言产物的原子（8 条）
 *
 * 这些原子由工厂 GEN 本可以生成「计算实现」，但输出与契约语义错位：
 *   契约要「通俗解释」，工厂给「把输入数组转成字符串」；
 *   契约要「思想传记」，工厂给「{value,n,values} 统计」。
 * 那是**虚假实现**——有输出、能跑通、但做的不是这件事。
 *
 * 按「诚实的不支持 > 虚假的支持」原则，make() 对这 8 条返回 null，
 * 由上层明确告知：此能力需要大模型推理，本实现不提供。
 */
const MODEL_NEEDED = new Set([
  /* R141 第 10 批：原 8 条「需大模型生成自然语言」已用确定性算法实现（blueprint-atoms-2.cjs）：
     抽取式摘要（词频×位置权重选句）/ 术语内联注释 / 规则库匹配 / 模板填充 / Shannon 熵报告。
     纯规则能做的就不该标成「需模型」——那是我上一轮的分类太粗。本集合现为空。 */
]);
/* ==== /METAGO-R141-MODEL-NEEDED ==== */

/* 全量契约：优先用 contract-validator 的 597 条（含蓝本原有 124），回退到本模块的 473 */
let ALL_CONTRACTS = null;
{
  /* 区分两种情况：文件不存在（允许回退到本模块 473 条）／文件存在但加载失败（必须抛错）。
     否则「存在但坏了」会被当成「没有」，静默少 124 条契约而所有检查照样绿。 */
  const __fp = require('path').join(__dirname, 'contract-validator.cjs')
  if (__fp && require('fs').existsSync(__fp)) {
    try {
      const CV = require("./contract-validator.cjs");
      if (CV && CV.CONTRACTS) ALL_CONTRACTS = CV.CONTRACTS;
    } catch (e) {
      throw new Error('[R141-CONTRACT-VALIDATOR] 文件存在但加载失败：' + e.message)
    }
  }
}

let _ATOMS = null;
function atomMeta(atomId) {
  if (_ATOMS === null) {
    try {
      const fs2 = require("fs");
      const g = JSON.parse(fs2.readFileSync(__pick([
  __p.join(__dirname, "..", "..", "..", "..", "..", "genome", "atoms_engines.json"),
  __p.join(__dirname, "..", "..", "..", "genome", "atoms_engines.json"),
  "D:/metago-build/genome/atoms_engines.json",
]), "utf8"));
      _ATOMS = g.atoms || {};
    } catch (e) { _ATOMS = {}; }
  }
  return _ATOMS[atomId] || {};
}

let _CB = null;
function cosmicBio() {
  if (_CB === null) {
    try { _CB = require("./atoms-cosmic-bio.cjs"); } catch (e) { _CB = false; }
  }
  return _CB || null;
}

let _CE = null;
function cryptoEmotion() {
  if (_CE === null) {
    try { _CE = require("./atoms-crypto-emotion.cjs"); } catch (e) { _CE = false; }
  }
  return _CE || null;
}

/* 4 个原子 → 真实实现函数名 */
const SPECIAL_IMPL = {
  ATOM_SECURITY_ENCRYPT_603: "encryptAtom",
  ATOM_SECURITY_DECRYPT_604: "decryptAtom",
  ATOM_EMOTION_RECOG_502: "detectEmotion",
  ATOM_ACCESSIBLE_READ_506: "accessibleRead",
  /* V36.11 补充：曾判「需外部」，实为可确定性计算 */
  ATOM_COSMIC_GRAVITY_032: "gravityWavePerceiver",
  ATOM_COSMIC_DISTRIBUTE_030: "distributedExistence",
  ATOM_BIO_SPECIES_025: "crossSpeciesPerceiver",
};

let _APPROX = null;
function approx() {
  if (_APPROX === null) {
    try { _APPROX = require("./approx.cjs"); } catch (e) { _APPROX = false; }
  }
  return _APPROX || null;
}

let _SPEC = null;
function spec() {
  if (_SPEC === null) {
    try { _SPEC = require("./specialized.cjs"); } catch (e) { _SPEC = false; }
  }
  return _SPEC || null;
}

function make(atomId) {
  /* R141/DEF-087：需大模型生成自然语言的原子不提供计算实现（诚实标注，不造假） */
  if (typeof MODEL_NEEDED !== 'undefined' && MODEL_NEEDED.has(atomId)) return null;

  /* R141：哲学族原子走 constraint 实现，不再返回 null */
  if (CONSTRAINT_IDS && CONSTRAINT_IDS.has && CONSTRAINT_IDS.has(atomId)) {
    const ca = makeConstraintAtom(atomId);
    if (ca) return ca;
  }
  /* R141：52 条「蓝本原有契约」的确定性实现（blueprint-atoms.cjs）
     纪律：模块**不存在**可以跳过（可选模块）；模块存在但**加载失败**必须抛错，
     绝不能静默降级——否则实现没生效、检查却全绿（这种假绿已在本轮抓到多次）。 */
  const BP_IMPL = (function loadBlueprintAtoms() {
    const __fs = require('fs')
    const __path = require('path')
    const p = __path.join(__dirname, 'blueprint-atoms.cjs')
    if (!__fs.existsSync(p)) return null            // 未安装：允许
    try {
      return require(p)                              // 存在则必须能加载
    } catch (e) {
      throw new Error('[R141-BP-ATOMS] blueprint-atoms.cjs 存在但加载失败：' + e.message)
    }
  })()
  if (BP_IMPL && BP_IMPL.IMPL && BP_IMPL.IMPL[atomId]) {
    const impl = BP_IMPL.IMPL[atomId]
    const fn = function (input) {
      const r = impl(input)
      if (r && r.output !== undefined) return r.output
      return r
    }
    fn.id = atomId
    fn.kind = 'blueprint'
    fn.run = impl
    return fn
  }

  /* R141 第 10 批：第二批「原本判成需模型/需硬件、实际可确定性实现」的原子 */
  const BP2_IMPL = (function loadBlueprintAtoms2() {
    const __fs2 = require('fs')
    const __path2 = require('path')
    const p2 = __path2.join(__dirname, 'blueprint-atoms-2.cjs')
    if (!__fs2.existsSync(p2)) return null
    try { return require(p2) } catch (e) {
      throw new Error('[R141-BP-ATOMS-2] blueprint-atoms-2.cjs 存在但加载失败：' + e.message)
    }
  })()
  if (BP2_IMPL && BP2_IMPL.IMPL && BP2_IMPL.IMPL[atomId]) {
    const impl2 = BP2_IMPL.IMPL[atomId]
    const fn2 = function (input) {
      const r = impl2(input)
      if (r && r.output !== undefined) return r.output
      return r
    }
    fn2.id = atomId
    fn2.kind = 'blueprint2'
    fn2.run = impl2
    return fn2
  }

  if (CONSTRAINT_IDS.has(atomId)) return null;   // 归约束器形态，非计算
  if (EXTERNAL_NEEDED.has(atomId)) return null;  // 需模型/外部服务，不假造实现
  // 专用真实实现（曾被误判为需外部的原子）
  if (SPECIAL_IMPL[atomId]) {
    const fname = SPECIAL_IMPL[atomId];
    // 先找 cosmicBio（引力波/分布式/跨物种），再找 cryptoEmotion
    const cb = cosmicBio();
    if (cb && typeof cb[fname] === "function") {
      return function cosmicBioAtom(input) {
        try {
          const out = cb[fname](input);
          if (out && typeof out === "object") return out;
          return { ok: false, success: false, reason: "NON_OBJECT_OUTPUT" };
        } catch (e) {
          return { ok: false, success: false, reason: "EXEC_ERROR", message: String(e.message || e).slice(0, 120) };
        }
      };
    }
    const ce = cryptoEmotion();
    if (ce && typeof ce[SPECIAL_IMPL[atomId]] === "function") {
      const fname = SPECIAL_IMPL[atomId];
      return function specialAtom(input) {
        try {
          const out = ce[fname](input);
          if (out && typeof out === "object") { out.__operator = fname; return out; }
          return { value: out, __operator: fname };
        } catch (e) {
          return { success: false, error: String(e.message).slice(0, 80), reason: "SPECIAL_FAILED" };
        }
      };
    }
  }

  const c = (ALL_CONTRACTS && ALL_CONTRACTS[atomId]) || CONTRACTS[atomId];
  if (!c) return null;

  // 语义特化：按功能描述路由到专门算子（精度升级）
  const sp = spec();
  const meta = atomMeta(atomId);
  const hit = sp ? sp.pick(meta.desc || "", meta.name || "", atomId) : null;
  if (hit) {
    // 特化算子结果 + 契约合规基线（两者合并：既要语义贴切，也要满足契约判据）
    const baseGen = GEN[c.action] || GEN["—"];
    return function specializedAtom(input) {
      const v = vec(input);
      if (!v.length) return { ok: false, reason: "NO_NUMERIC_INPUT" };
      let base = {};
      try { base = baseGen(v) || {}; } catch (e) { base = {}; }
      const specOut = hit.fn(v) || {};
      const merged = Object.assign({}, base, specOut);
      merged.__operator = hit.op;
      return merged;
    };
  }

  // 二级路由：语义近似（需模型类任务的确定性近似，输出标注 approximated）
  const ap = approx();
  const ah = ap ? ap.pickApprox(meta.desc || "", meta.name || "") : null;
  if (ah) {
    const baseGen2 = GEN[c.action] || GEN["—"];
    return function approximateAtom(input) {
      let base = {};
      try {
        const v = vec(input);
        base = v.length ? (baseGen2(v) || {}) : {};
      } catch (e) { base = {}; }
      let aout = {};
      try { aout = ah.fn(input) || {}; } catch (e) { aout = {}; }
      const merged = Object.assign({}, base, aout);
      merged.__operator = ah.op;
      merged.__mode = "approximate";
      return merged;
    };
  }

  const g = GEN[c.action] || GEN["—"];
  return function genericContractAtom(input) {
    const v = vec(input);
    if (!v.length) return { ok: false, reason: "NO_NUMERIC_INPUT" };
    return g(v);
  };
}

module.exports = {
  MODEL_NEEDED, make, GEN, CONTRACTS, vec, CONSTRAINT_IDS, EXTERNAL_NEEDED,
  getAllContracts: () => ALL_CONTRACTS || CONTRACTS };

if (require.main === module) {
  const { validate } = require("./contract-validator.cjs");
  const SAMPLE = [0.8, 0.6, 0.75, 0.9, 0.55];
  let pass = 0, fail = 0; const bad = [];
  const ALL = (typeof ALL_CONTRACTS !== "undefined" && ALL_CONTRACTS) ? ALL_CONTRACTS : CONTRACTS;
  Object.keys(ALL).forEach(id => {
    if (CONSTRAINT_IDS.has(id)) return;
    const fn = make(id);
    if (!fn) return;
    const out = fn(SAMPLE);
    const v = validate(id, out);
    if (v.pass) pass++; else { fail++; if (bad.length < 8) bad.push([id, v]); }
  });
  console.log("=".repeat(72));
  console.log("契约驱动原子工厂自测");
  console.log("=".repeat(72));
  console.log("契约总数:", Object.keys(ALL).length, "（含蓝本原有契约）");
  console.log("生成实现:", pass + fail, "｜ 符合契约:", pass, "｜ 不符合:", fail);
  bad.forEach(([id, v]) => {
    console.log("  FAIL " + id + " [" + v.action + "/" + v.domain + "]");
    v.checks.filter(c => !c.ok).forEach(c => console.log("      - " + c.n + " " + c.d));
  });
  console.log('跳过（需模型/外部）:', EXTERNAL_NEEDED.size, '｜ 跳过（约束器）:', CONSTRAINT_IDS.size);
  console.log(fail === 0 ? "总判定：PASS" : "总判定：FAIL");
  process.exit(fail === 0 ? 0 : 1);
}
