"use strict";
/**
 * mcp-tool-nature.cjs — 判定每个 metago 工具的性质：硬驱动（真计算）还是软驱动（返回指南）
 *
 * 背景：index.js L108-116 显示只有 3 个工具走 Engine V2 硬驱动，
 *      其余返回 `${skill.guide}\n\n## 用户输入\n${args.input}`。
 *      这不是缺陷，是一种合法的 MCP 模式（prompt tool），但必须如实说明比例。
 */
const { spawn } = require("child_process");
const SCRIPT = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/mcp-server/dist/index.js";

const child = spawn(process.execPath, [SCRIPT], { stdio: ["pipe", "pipe", "pipe"] });
let buf = "", id = 0;
const pending = new Map();
const send = o => { try { child.stdin.write(JSON.stringify(o) + "\n"); } catch (e) { } };
const call = (m, p) => new Promise(r => { const i = ++id; pending.set(i, r); send({ jsonrpc: "2.0", id: i, method: m, params: p }); });

child.stdout.on("data", d => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    let m; try { m = JSON.parse(line); } catch (e) { continue; }
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  }
});
child.stderr.on("data", () => { });

function textOf(r) {
  try {
    const c = r.result && r.result.content;
    if (Array.isArray(c) && c[0] && c[0].text) return c[0].text;
  } catch (e) { }
  return "";
}

(async () => {
  await call("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "n", version: "1" } });
  const tl = await call("tools/list", {});
  const tools = (tl.result.tools || []);

  console.log("=".repeat(86));
  console.log("metago MCP 工具性质判定");
  console.log("=".repeat(86));
  console.log("工具总数:", tools.length);
  console.log();

  const hard = [], soft = [], other = [];

  for (const t of tools) {
    const props = (t.inputSchema || {}).properties || {};
    const k0 = Object.keys(props)[0];
    let args = {};
    if (k0 === "input") args = { input: "元构能力验证测试" };
    else if (k0) {
      const ty = props[k0].type;
      args[k0] = ty === "number" ? 1 : ty === "boolean" ? true : ty === "array" ? [] : "test";
    }
    const r = await Promise.race([
      call("tools/call", { name: t.name, arguments: args }),
      new Promise(x => setTimeout(() => x({ timeout: 1 }), 12000)),
    ]);
    if (r.timeout) { other.push([t.name, "超时"]); continue; }
    if (r.result && r.result.isError) { other.push([t.name, "isError"]); continue; }
    const txt = textOf(r);
    // 判据：软驱动 = 输出主要就是 guide 本身 + 用户输入回显
    const isEcho = /## 用户输入/.test(txt) && !/真实执行结果/.test(txt);
    const isHard = /Engine V2 真实执行结果/.test(txt);
    if (isHard) hard.push([t.name, txt.length]);
    else if (isEcho) soft.push([t.name, txt.length]);
    else other.push([t.name, "其它形态 " + txt.length + " 字"]);
  }

  const p = (x, n) => String(x).padEnd(n).slice(0, n);
  console.log("【硬驱动：调用真实 Engine 代码】" + hard.length + " 个");
  hard.forEach(([n, l]) => console.log("  ✓ " + p(n, 34) + l + " 字"));
  console.log();
  console.log("【软驱动：返回指南 + 输入回显（prompt tool 模式）】" + soft.length + " 个");
  soft.slice(0, 12).forEach(([n, l]) => console.log("  · " + p(n, 34) + l + " 字"));
  if (soft.length > 12) console.log("  … 其余 " + (soft.length - 12));
  console.log();
  if (other.length) {
    console.log("【其它】" + other.length + " 个");
    other.forEach(([n, w]) => console.log("  ? " + p(n, 34) + w));
  }

  console.log();
  console.log("-".repeat(86));
  console.log("判定：硬驱动 %d ｜ 软驱动 %d ｜ 其它 %d" % (hard.length, soft.length, other.length));
  console.log("说明：软驱动是合法的 MCP「prompt tool」模式——它把技能指南注入模型上下文，");
  console.log("      由模型执行具体工作。这不是缺陷，但**必须如实标注**，不能让调用方以为它在做计算。");
  child.kill();
})();
