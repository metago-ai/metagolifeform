"use strict";
/**
 * fix-struct-params.cjs — 按「参数自身体」的字段访问推断结构
 *
 * 新增能力（相比 fix-iterable）：
 *   const { a, b } = param          → param = {a:…, b:…}
 *   param.field / param['field']    → param = {field:…}
 *   param.get(…)                    → param = Map
 *   param.length / param.size       → param = 数组
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
  "every", "sort", "slice", "concat", "join", "push", "keys", "values", "entries", "split", "trim",
  "get", "set", "has", "toFixed", "toString", "indexOf", "includes", "startsWith", "endsWith"]);

/* 参数自身体的结构线索 */
function structOf(src, p) {
  const e = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const s = { fields: [], isMap: false, isArray: false, isString: false, isNumber: false };
  let m;

  // 解构：const { a, b } = param
  const de = new RegExp("(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*" + e + "\\b").exec(src);
  if (de) {
    de[1].split(",").forEach(x => {
      const k = x.split(":").pop().trim().split("=")[0].trim();
      if (k && k !== "...") s.fields.push(k);
    });
  }
  // 直接属性访问：param.field（排除内置）
  const rp = new RegExp("\\b" + e + "\\s*\\.\\s*([A-Za-z_$][\\w$]*)", "g");
  while ((m = rp.exec(src))) if (!BUILTIN.has(m[1])) s.fields.push(m[1]);
  // 索引访问：param['field']
  const ri = new RegExp("\\b" + e + "\\s*\\[\\s*['\"]([A-Za-z_$][\\w$]*)['\"]\\s*\\]").exec(src);
  if (ri) s.fields.push(ri[1]);

  if (new RegExp("\\b" + e + "\\s*\\.\\s*(get|set|has)\\s*\\(").test(src)) s.isMap = true;
  if (new RegExp("\\b" + e + "\\s*\\.\\s*(map|filter|reduce|forEach|length|size|sort|slice)\\b").test(src)) s.isArray = true;
  if (new RegExp("\\b" + e + "\\s*\\.\\s*(split|trim|toLowerCase|startsWith|endsWith)\\s*\\(").test(src)) s.isString = true;
  if (new RegExp("\\b" + e + "\\s*\\.\\s*(toFixed|toPrecision)\\s*\\(").test(src)) s.isNumber = true;
  if (new RegExp("Math\\.[a-z]+\\s*\\(\\s*" + e + "\\b").test(src)) s.isNumber = true;

  s.fields = [...new Set(s.fields)];
  return s;
}

function valFor(field, depth = 0) {
  const n = String(field).toLowerCase();
  if (depth > 2) return 1;
  if (/^(statement|conclusion|label|name|id|key|type|category|text|content|rule|pattern)$/.test(n)) return "A";
  if (/^(children|premises|properties|features|values|vector|items|nodes|list)$/.test(n)) return [{ statement: "B", children: [] }];
  if (/^(truth|valid|allowed|active|enabled|found|ok)$/.test(n)) return true;
  if (/^(timestamp|time|at|count|size|n|num|quantity|amount|total|weight|score|confidence|value|level|threshold|rate|ratio|priority|urg.*|risk.*|std|mean|variance)$/.test(n)) return 1;
  if (/^(id)$/.test(n)) return "a";
  return 1;
}

function buildStruct(st) {
  if (st.isMap) return { __map__: true, entries: [["a", 1], ["b", 2]] };
  if (st.fields.length) {
    const o = {};
    st.fields.forEach(f => { o[f] = valFor(f); });
    return o;
  }
  if (st.isArray) return [0.5, 0.8, 0.2, 0.9];
  if (st.isString) return "sample text";
  if (st.isNumber) return 0.75;
  return undefined;
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
    const cands = [buildStruct(structOf(src, pn[0]))].filter(Boolean);
    cands.push([0.5, 0.8, 0.2], { __map__: true, entries: [["a", 1]] }, 0.75, "sample text");
    for (const c of cands) {
      const t0 = Date.now();
      let r;
      try { r = B.run(e.id, clone(c)); } catch (err) { continue; }
      if (Date.now() - t0 > 300) continue;
      if (ok(r)) { SH[e.id] = clone(c); done = true; break; }
    }
  }

  // 位置型/多参
  if (!done) {
    const cur = (SH[e.id] && typeof SH[e.id] === "object" && !Array.isArray(SH[e.id])) ? clone(SH[e.id]) : {};
    pn.forEach(p => { if (!(p in cur)) cur[p] = 0.75; });
    for (let round = 0; round < 2 && !done; round++) {
      for (const p of pn) {
        if (done) break;
        const prev = cur[p];
        const st = structOf(src, p);
        const cands = [buildStruct(st)].filter(Boolean);
        cands.push([0.5, 0.8, 0.2], { __map__: true, entries: [["a", 1]] }, 0.75, "sample text", 2);
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
  }

  if (done) fixed++; else still.push(e.id);
}

fs.writeFileSync(SHAPES_P, JSON.stringify(SH, null, 1), "utf8");
for (const p of ["D:/metago-build/outbound/v36.10.0/packages/algorithms/engine/algorithms/t3impl/shapes.json",
  "D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0/packages/algorithms/engine/algorithms/t3impl/shapes.json"]) {
  if (fs.existsSync(path.dirname(p))) fs.copyFileSync(SHAPES_P, p);
}
console.log("已修:", fixed, "｜ 仍失败:", still.length);
