"use strict";
/**
 * fix-iterable.cjs — 批量修「参数应可迭代/应为数组」类失败
 *
 * 规则：
 *   单参非位置型 + 源码对该参数做 map/reduce/forEach/spread → 样例 = 数组本身
 *   位置型 + 某参数被 map/reduce → 该参数 = 数组
 * 数组元素形态依据源码对元素的字段访问来定。
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

const BUILTIN = new Set(["length", "size", "map", "filter", "reduce", "forEach", "find", "some",
  "every", "sort", "slice", "concat", "join", "push", "keys", "values", "entries", "split", "trim", "get", "set", "has"]);

function fieldsOf(src, p) {
  const e = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const f = [];
  let m;
  const r1 = new RegExp(e + "\\s*\\[[^\\]]+\\]\\s*\\.\\s*([A-Za-z_$][\\w$]*)", "g");
  while ((m = r1.exec(src))) if (!BUILTIN.has(m[1])) f.push(m[1]);
  const al = [];
  const r2 = new RegExp("(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*" + e + "\\s*\\[[^\\]]+\\]", "g");
  while ((m = r2.exec(src))) al.push(m[1]);
  const r3 = new RegExp(e + "\\s*\\.\\s*(?:map|filter|forEach|find|some|every|sort)\\s*\\(\\s*\\(?\\s*([A-Za-z_$][\\w$]*)", "g");
  while ((m = r3.exec(src))) al.push(m[1]);
  const r4 = new RegExp("for\\s*\\(\\s*(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s+of\\s+" + e + "\\b", "g");
  while ((m = r4.exec(src))) al.push(m[1]);
  for (const a of new Set(al)) {
    if (BUILTIN.has(a)) continue;
    const ra = new RegExp("\\b" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\.\\s*([A-Za-z_$][\\w$]*)", "g");
    while ((m = ra.exec(src))) if (!BUILTIN.has(m[1])) f.push(m[1]);
  }
  return [...new Set(f)];
}

function arrValue(fields) {
  if (!fields.length) return [0.5, 0.8, 0.2, 0.9];
  const out = [];
  for (let i = 0; i < 3; i++) {
    const o = {};
    fields.forEach(f => {
      const n = f.toLowerCase();
      if (/^(x|y|value|score|weight|confidence|rate|ratio|amount)$/.test(n)) o[f] = 0.5 + i * 0.2;
      else if (/^(id|key|name|label|type)$/.test(n)) o[f] = "k" + i;
      else if (/^(values|vector|features|dims)$/.test(n)) o[f] = [0.5, 0.8];
      else o[f] = 1 + i;
    });
    out.push(o);
  }
  return out;
}

const reg = REG.getRegistry();
const fails = reg.filter(e => {
  if (typeof e.handler !== "function" || (e.tier !== "T1" && e.tier !== "T2")) return false;
  let r;
  try { r = B.run(e.id, SH[e.id]); } catch (err) { return true; }
  return !ok(r);
});

let fixed = 0;
const still = [];

for (const e of fails) {
  const src = Function.prototype.toString.call(e.handler);
  const pn = e.paramNames || [];
  if (!pn.length) { still.push(e.id); continue; }
  let done = false;

  // 单参非位置型
  if (!e.positional && pn.length === 1) {
    const p = pn[0];
    const cands = [arrValue(fieldsOf(src, p))];
    if (/Object\.keys\s*\(\s*/.test(src)) cands.push({ a: 1, b: 2, c: 3 });
    if (/\.get\s*\(/.test(src)) cands.push({ __map__: true, entries: [["a", 1], ["b", 2]] });
    cands.push([["a", 1], ["b", 2]]);
    for (const c of cands) {
      const t0 = Date.now();
      let r;
      try { r = B.run(e.id, clone(c)); } catch (err) { continue; }
      if (Date.now() - t0 > 300) continue;
      if (ok(r)) { SH[e.id] = clone(c); done = true; break; }
    }
  }

  // 位置型/多参
  if (!done && (e.positional || pn.length > 1)) {
    const cur = (SH[e.id] && typeof SH[e.id] === "object" && !Array.isArray(SH[e.id])) ? clone(SH[e.id]) : {};
    pn.forEach(p => { if (!(p in cur)) cur[p] = 0.75; });
    for (const p of pn) {
      if (done) break;
      const prev = cur[p];
      const cands = [arrValue(fieldsOf(src, p)), [0.5, 0.8, 0.2], { __map__: true, entries: [["a", 1]] }, { a: 1, b: 2 }];
      for (const c of cands) {
        cur[p] = clone(c);
        const t0 = Date.now();
        let r;
        try { r = B.run(e.id, clone(cur)); } catch (err) { cur[p] = prev; break; }
        if (Date.now() - t0 > 300) { cur[p] = prev; break; }
        if (ok(r)) { SH[e.id] = clone(cur); done = true; break; }
      }
      if (!done) cur[p] = prev;
    }
  }

  if (done) fixed++; else still.push(e.id);
}

fs.writeFileSync(SHAPES_P, JSON.stringify(SH, null, 1), "utf8");
for (const p of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.12.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p))) fs.copyFileSync(SHAPES_P, p);
}
console.log("已修:", fixed, "｜ 仍失败:", still.length);
