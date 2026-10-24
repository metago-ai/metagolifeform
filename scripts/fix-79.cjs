"use strict";
/**
 * fix-79.cjs — 按结构线索批量构造剩余 79 条的样例
 */
const fs = require("fs");
const path = require("path");
const T3 = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/t3impl";
const REG = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js");
const { bind } = require(path.join(T3, "bind.cjs"));
const SHAPES_P = path.join(T3, "shapes.json");
const SH = JSON.parse(fs.readFileSync(SHAPES_P, "utf8"));
const B = bind(REG);

const clone = o => JSON.parse(JSON.stringify(o));
const ok = r => !!(r && (r.success || r.degraded));

/* 按参数名/线索给值 */
function valFor(name, clue) {
  const n = String(name).toLowerCase();
  if (clue && clue.isMap) return { __map__: true, entries: [["a", { value: 0.8, importance: 0.6 }], ["b", { value: 0.4, importance: 0.9 }]] };
  if (clue && clue.props && clue.props.includes("test")) return { __regex__: "\\d+" };
  if (clue && clue.props && clue.props.includes("charCodeAt")) return "元构测试内容";
  if (/^(encoder)$/.test(n)) return "(x) => x";
  if (/^(store)$/.test(n)) return { __map__: true, entries: [["a", { value: 0.8, importance: 0.6, lastAccess: 1 }], ["b", { value: 0.4, importance: 0.9, lastAccess: 2 }]] };
  if (/^(matrix)$/.test(n)) return [[1, 0.4, 0.8], [0.4, 1, 0.6], [0.8, 0.6, 1]];
  if (/^(samples|specimens|specimen|data|values|series|history|episodes|generations|ideas|creations|deviations|threats|factors|scores|covered|unlabeled|instances|observations|hypotheses|players|parties|constraints|premises|conclusion|proof|tree|model|sourceModel|targetSamples|content|proof|state|situation|conflict|menus|options|rules|patterns|bounds|criteria)$/.test(n)) {
    if (/^(model|sourceModel)$/.test(n)) return { weights: [[0.5, 0.3], [0.2, 0.8]], bias: [0.1, -0.1] };
    if (/^(proof)$/.test(n)) return { steps: [{ statement: "A", rule: "ax" }, { statement: "B", rule: "mp" }] };
    if (/^(tree)$/.test(n)) return { statement: "A", children: [{ statement: "B", children: [] }, { statement: "C", children: [] }] };
    if (/^(content)$/.test(n)) return { requiredFields: ["a", "b"], fields: { a: 1, b: 2 } };
    if (/^(state|situation)$/.test(n)) return { risk: 0.8, urgency: 0.9, familiarity: 0.2, tension: 0.7 };
    if (/^(conflict)$/.test(n)) return { parties: [{ id: "p1", demand: 9 }, { id: "p2", demand: 2 }], intensity: 0.8 };
    if (/^(players|parties)$/.test(n)) return [{ id: "p1", strategy: "A", payoff: 3 }, { id: "p2", strategy: "B", payoff: 5 }];
    if (/^(rules|patterns)$/.test(n)) return [{ regex: { __regex__: "\\d+" }, rule: "num", severity: "high" }];
    if (/^(premises)$/.test(n)) return [{ statement: "A", truth: true }, { statement: "A→B", truth: true }];
    if (/^(conclusion)$/.test(n)) return { statement: "B", truth: null };
    if (/^(observations)$/.test(n)) return [{ statement: "B", truth: true }];
    if (/^(hypotheses)$/.test(n)) return [{ statement: "A→B", confidence: 0.8 }];
    if (/^(episodes)$/.test(n)) return [{ s0: 0, action: 0, reward: 1, s1: 1 }, { s0: 1, action: 1, reward: -1, s1: 0 }];
    return [1, 2, 3, 4, 5];
  }
  if (/^(total|numStates|numActions|budget|topK|iterations|epochs|k|n|count|maxIterations|seed)$/.test(n)) return 3;
  if (/^(learningRate|discountFactor|freezeRatio|threshold|minSimilarity|consolidationThreshold|adjustmentRate|targetIntegrity|tolerance|rate|confidence)$/.test(n)) return 0.5;
  if (/^(query|text|input|message|content|expression|type|strategy|name|label|key|text)$/.test(n)) return "sample";
  if (/^(samples|covered)$/.test(n)) return [1, 2, 3];
  return 0.75;
}

const fails = [];
REG.getRegistry().forEach(e => {
  if (typeof e.handler !== "function" || (e.tier !== "T1" && e.tier !== "T2")) return;
  let r;
  try { r = B.run(e.id, clone(SH[e.id])); } catch (err) { fails.push(e); return; }
  if (!ok(r)) fails.push(e);
});

console.log("待修:", fails.length);

let fixed = 0;
const still = [];

for (const e of fails) {
  const src = Function.prototype.toString.call(e.handler);
  const pn = e.paramNames || [];
  if (!pn.length) { still.push(e.id); continue; }

  // 每个参数的结构线索
  const clueFor = p => {
    const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const props = [];
    let m;
    const rp = new RegExp("\\b" + esc + "\\s*\\.\\s*([A-Za-z_$][\\w$]*)", "g");
    while ((m = rp.exec(src))) props.push(m[1]);
    const isMap = new RegExp("\\b" + esc + "\\s*\\.\\s*(get|set|has)\\s*\\(").test(src);
    return { props, isMap };
  };

  const build = () => {
    if (!e.positional && pn.length === 1) return valFor(pn[0], clueFor(pn[0]));
    const o = {};
    pn.forEach(p => { o[p] = valFor(p, clueFor(p)); });
    return o;
  };

  const cand = build();
  let r;
  try { r = B.run(e.id, clone(cand)); } catch (err) { r = null; }
  if (ok(r)) { SH[e.id] = clone(cand); fixed++; continue; }

  // 逐参回退尝试
  let done = false;
  const cur = (cand && typeof cand === "object" && !Array.isArray(cand)) ? clone(cand) : {};
  const ALT = [
    [1, 2, 3, 4, 5], ["a", "b", "c"], { x: 1, y: 2 },
    [{ statement: "A", children: [] }], { __map__: true, entries: [["a", 1]] },
    0.5, 3, "sample", true,
    { regex: { __regex__: "\\d+" } }, { value: 1, weight: 0.5, id: "a", timestamp: 1 },
  ];
  for (const p of pn) {
    if (done) break;
    const prev = cur[p];
    for (const a of ALT) {
      cur[p] = clone(a);
      let rr;
      try { rr = B.run(e.id, clone(cur)); } catch (er) { cur[p] = prev; continue; }
      if (ok(rr)) { SH[e.id] = clone(cur); fixed++; done = true; break; }
    }
    if (!done) cur[p] = prev;
  }
  if (!done) still.push(e.id);
}

fs.writeFileSync(SHAPES_P, JSON.stringify(SH, null, 1), "utf8");
for (const p of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p))) fs.copyFileSync(SHAPES_P, p);
}
console.log("已修:", fixed, "｜ 仍失败:", still.length);
if (still.length) fs.writeFileSync("D:/metago-build/still-fail.json", JSON.stringify(still, null, 1), "utf8");
