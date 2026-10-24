"use strict";
/** extract-chains.cjs — 提取剩余 22 条的属性访问链，用于精确构造 */
const path = require("path");
const T3 = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/t3impl";
const REG = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/engine/algorithms/registry.js");
const { bind } = require(path.join(T3, "bind.cjs"));
const SH = require(path.join(T3, "shapes.json"));
const B = bind(REG);

function hydrate(o) {
  if (Array.isArray(o)) return o.map(hydrate);
  if (o && typeof o === "object") {
    if (o.__map__) { const m = new Map(); (o.entries || []).forEach(([k, v]) => m.set(hydrate(k), hydrate(v))); return m; }
    if (o.__set__) return new Set((o.values || []).map(hydrate));
    if (typeof o.__regex__ === "string") { try { return new RegExp(o.__regex__, o.flags || ""); } catch (e) { return o.__regex__; } }
    if (typeof o.__fn__ === "string") { try { const fb = require(path.join(T3, "fn-bridge.cjs")); const f = fb.compile(o.__fn__); if (f) return f; } catch (e) {} return o.__fn__; }
    const c = {};
    for (const k of Object.keys(o)) c[k] = hydrate(o[k]);
    return c;
  }
  return o;
}
const ok = r => !!(r && (r.success || r.degraded));

const fails = [];
REG.getRegistry().forEach(e => {
  if (typeof e.handler !== "function" || (e.tier !== "T1" && e.tier !== "T2")) return;
  let r;
  try { r = B.run(e.id, hydrate(SH[e.id])); } catch (x) { fails.push(e); return; }
  if (!ok(r)) fails.push(e);
});

const REPORT = [];
for (const e of fails) {
  const src = Function.prototype.toString.call(e.handler);
  const pn = e.paramNames || [];
  const chains = new Set();
  pn.forEach(p => {
    const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // p.a.b 形式
    const re2 = new RegExp("\\b" + esc + "\\s*\\.\\s*([A-Za-z_$][\\w$]*)\\s*\\.\\s*([A-Za-z_$][\\w$]*)", "g");
    let m;
    while ((m = re2.exec(src))) chains.add(p + "." + m[1] + "." + m[2]);
    const re1 = new RegExp("\\b" + esc + "\\s*\\.\\s*([A-Za-z_$][\\w$]*)", "g");
    while ((m = re1.exec(src))) chains.add(p + "." + m[1]);
    // 解构
    const de = new RegExp("(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*" + esc + "\\b").exec(src);
    if (de) de[1].split(",").forEach(x => chains.add(p + ".{" + x.trim().split(":").pop().trim() + "}"));
    // 元素访问 p[i].f 或 for..of 别名
    const reElem = new RegExp(esc + "\\s*\\[[^\\]]+\\]\\s*\\.\\s*([A-Za-z_$][\\w$]*)", "g");
    while ((m = reElem.exec(src))) chains.add(p + "[].{}".replace("{}", m[1]));
    const al = [];
    const r3 = new RegExp(esc + "\\s*\\.\\s*(?:map|filter|forEach|find|some|every|sort)\\s*\\(\\s*\\(?\\s*([A-Za-z_$][\\w$]*)", "g");
    while ((m = r3.exec(src))) al.push(m[1]);
    const r4 = new RegExp("for\\s*\\(\\s*(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s+of\\s+" + esc + "\\b", "g");
    while ((m = r4.exec(src))) al.push(m[1]);
    for (const a of new Set(al)) {
      const ra = new RegExp("\\b" + a + "\\s*\\.\\s*([A-Za-z_$][\\w$]*)\\s*(?:\\.\\s*([A-Za-z_$][\\w$]*))?", "g");
      while ((m = ra.exec(src))) chains.add(p + "[].{" + m[1] + "}" + (m[2] ? "." + m[2] : ""));
    }
  });
  REPORT.push({ id: e.id, desc: String(e.description || "").slice(0, 26), params: pn, positional: !!e.positional,
    chains: [...chains].filter(c => !/\.(length|size|map|filter|reduce|forEach|push|slice|join|toFixed|toLowerCase|toUpperCase|trim|split|includes|indexOf|find|some|every|sort|concat)$/.test(c)).slice(0, 8) });
}

REPORT.forEach(r => {
  console.log("### " + r.id + " | " + r.desc + " | " + (r.positional ? "位置" : "单参") + " | " + JSON.stringify(r.params));
  console.log("    " + r.chains.join("  ｜  "));
});
