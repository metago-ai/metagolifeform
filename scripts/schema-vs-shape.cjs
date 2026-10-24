"use strict";
/**
 * schema-vs-shape.cjs — 用算法自声明的 inputSchema 校验样例形状（真实 ground truth）
 *
 * 每个算法的条目都有：
 *   inputSchema: "VectorPair+weights"   ← 按 "+" 分隔，与 paramNames 一一对应
 *   paramNames:  ["pair", "weights"]
 * 据此可判断每个形参的期望种类，与 shapes.json 的实际类型比对。
 */
const path = require("path");
const T3 = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/t3impl";
const REG = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js");
const { bind } = require(path.join(T3, "bind.cjs"));
const SH = require(path.join(T3, "shapes.json"));
bind(REG);

/* 类型名 → 种类（按优先级判断，先特例后通例） */
const KIND_RULES = [
  // 0) 对象字面量：schema 以 { 开头，或含冒号
  [/^\s*\{/, "object"],
  // 1) 明确的标量词汇（单词形式，不含复数集合义）
  [/^(bias|threshold|tolerance|ratio|rate|alpha|beta|gamma|lambda|mu|sigma|epsilon|eps|count|size|capacity|amount|total|index|idx|level|limit|duration|window|multiplier|budget|attempts|iterations|numStates|numActions|numSamples|selectionSize|targetIntegrity|adjustmentRate|boostRate|triggerThreshold|zThreshold|maxHarmonics|fundamentalFreq|phaseDiff|phase|harmonic|freq|frequency|score|scalar|number|int|float|double|probability|confidence|weight$)/i, "number"],
  // 2) 复数 / 集合词汇
  [/(Vector|Matrix|List|Array|Series|Sequence|Set|Pair|Tuple|Group|Cluster|Samples|Data|Batch|Chain|Graph|Tree|Nodes|Edges|Items|Pool|Entries|Rows|Cols|Dimensions|Dims|Points|Events|Records|Sequences|Labels|Values|Weights|Actions|Decisions|Constraints|Norms|Pairs|Steps|Stages|Slots|Buckets|Bins|Rules|Marks|Metrics|Features|Tokens|Keywords|Tags)/i, "collection"],
  // 2.5) 以 s 结尾但语义为单数的常见词
  [/^(maxAttempts|minAttempts|numAttempts|status|bias|variance|consensus|focus|basis)$/i, "number"],
  // 3) 复数通例：以小写 s 结尾且不是 mass noun
  [/^[a-z][A-Za-z]*(?<!(ss|us|is|as|os))s$/, "collection"],
  // 4) 字符串
  [/(String|Text|Label|Name|Message|Word|Sentence|Path|Url|Id|Key|Tag|Fn|Function|Callback)/i, "string"],
  // 5) 布尔
  [/(Boolean|Bool|Flag|Enabled|Detected)/i, "boolean"],
  // 6) 对象/结构体
  [/(Object|Record|Config|Params|Options|Store|Model|Specimen|Genome|Context|State|Constraints|Snapshot|Checkpoint)/i, "object"],
];

function kindOfTypeName(t) {
  if (/\[\]\s*$/.test(t)) return "collection";            // evidence[] / context[]
  if (/Fn$/i.test(t)) return "unknown";                      // scoreFn 允许传表达式字符串

  for (const [re, k] of KIND_RULES) if (re.test(t)) return k;
  return "unknown";
}

function actualKind(v) {
  if (Array.isArray(v)) return "collection";
  if (v && typeof v === "object" && v.__map__) return "object";
  if (v && typeof v === "object") return "object";
  if (typeof v === "number") return "number";
  if (typeof v === "string") return "string";
  if (typeof v === "boolean") return "boolean";
  return "unknown";
}

/* collection 与 object 在多数情况下可互容（数组 vs 结构体），只在明确冲突时报 */
function conflict(expected, actual) {
  if (expected === "unknown" || actual === "unknown") return false;
  if (expected === actual) return false;
  if (expected === "collection" && actual === "object") return false;   // 结构体可当集合
  if (expected === "object" && actual === "collection") return false;
  return true;
}

/* 已知：schema 声明与源码实际用法不一致的条目（以源码为准）
   ALG_T1_V_020 价值覆盖度：schema 声明 total:number，实现里对 total 做迭代（按集合处理） */
const KNOWN_SCHEMA_INACCURATE = { "ALG_T1_V_020": ["total"] };

const issues = [];

REG.getRegistry().forEach(e => {
  if (typeof e.handler !== "function" || !SH[e.id]) return;
  const shape = SH[e.id];
  if (!shape || typeof shape !== "object" || Array.isArray(shape)) return;

  const schema = String(e.inputSchema || "");
  const types = schema.split(/[+、,]/).map(s => s.trim()).filter(Boolean);
  const pn = e.paramNames || [];

  // schema 是对象字面量（以 { 开头）时，说明整个输入是一个结构体
  if (/^\s*\{/.test(schema)) {
    if (actualKind(shape) !== "object" && Object.keys(shape).length > 1) {
      issues.push({ id: e.id, desc: String(e.description || "").slice(0, 30),
        param: "(整体)", schemaType: schema.slice(0, 30), expected: "object",
        actual: actualKind(shape), value: JSON.stringify(shape).slice(0, 36) });
    }
    return;
  }

  // 只有当 schema 段数与形参数一致时才对齐比对
  if (types.length !== pn.length) return;

  pn.forEach((p, i) => {
    if (!(p in shape)) return;
    const exp = kindOfTypeName(types[i]);
    const act = actualKind(shape[p]);
    if (KNOWN_SCHEMA_INACCURATE[e.id] && KNOWN_SCHEMA_INACCURATE[e.id].includes(p)) return;
    if (conflict(exp, act)) {
      issues.push({
        id: e.id, desc: String(e.description || "").slice(0, 30),
        param: p, schemaType: types[i], expected: exp, actual: act,
        value: JSON.stringify(shape[p]).slice(0, 36),
      });
    }
  });
});

console.log("=".repeat(88));
console.log("用算法自声明 inputSchema 校验样例形状");
console.log("=".repeat(88));
console.log(`冲突 ${issues.length} 处，涉及 ${new Set(issues.map(x => x.id)).size} 条算法`);
console.log();

const byId = {};
issues.forEach(x => { (byId[x.id] = byId[x.id] || []).push(x); });

Object.keys(byId).sort().forEach(id => {
  const first = byId[id][0];
  console.log("● " + id + "  " + first.desc);
  byId[id].forEach(x => {
    console.log("   " + x.param.padEnd(16) + " schema=" + x.schemaType.padEnd(18) +
      " 期望=" + x.expected.padEnd(11) + " 实际=" + x.actual.padEnd(11) + " 样例=" + x.value);
  });
});

console.log();
console.log("-".repeat(88));
console.log(issues.length === 0 ? "总判定：PASS（样例形状与声明 schema 一致）"
  : `总判定：需关注（${issues.length} 处形状与声明类型冲突）`);
