"use strict";
/**
 * prompts-invoke-test.cjs — 8 个 MCP prompts 端到端可用性
 *
 * 之前只验了 prompts/list 能列出 8 个名字，没验「调用能不能拿到内容」。
 * 本脚本逐个 prompts/get，检查返回的 messages 非空且含实质内容。
 */
const { spawn } = require("child_process");

const SERVER = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/mcp-server/dist/index.js";

const child = spawn(process.execPath, [SERVER], { stdio: ["pipe", "pipe", "pipe"] });
let buf = "", id = 0;
const pend = new Map();
const send = o => { try { child.stdin.write(JSON.stringify(o) + "\n"); } catch (e) { } };
const call = (m, p) => new Promise(r => { const i = ++id; pend.set(i, r); send({ jsonrpc: "2.0", id: i, method: m, params: p }); });

const TIMEOUT = 15000;
child.stdout.on("data", d => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let m;
    try { m = JSON.parse(line); } catch (e) { continue; }
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  }
});
child.stderr.on("data", () => { });

(async () => {
  await call("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "pi", version: "1" } });
  const pl = await call("prompts/list", {});
  const prompts = (pl.result && pl.result.prompts) || [];

  console.log("=".repeat(88));
  console.log("MCP prompts 端到端调用测试");
  console.log("=".repeat(88));
  console.log(`prompts 数量：${prompts.length}\n`);
  console.log("名称".padEnd(32) + "参数".padEnd(18) + "返回".padEnd(10) + "判定");
  console.log("-".repeat(88));

  let ok = 0, bad = 0;
  for (const p of prompts) {
    const args = {};
    for (const a of (p.arguments || [])) {
      // 按参数名给一个有意义的测试值
      const n = String(a.name).toLowerCase();
      args[a.name] = /input|content|text|decision|claim|idea|content/i.test(n)
        ? "耦生度大于1表示系统处于超导态。依据：定理推导，来源：附录卷。"
        : "test";
    }
    const argDesc = Object.keys(args).length ? Object.keys(args).join(",") : "（无）";
    let r;
    try {
      r = await Promise.race([
        call("prompts/get", { name: p.name, arguments: args }),
        new Promise(x => setTimeout(() => x({ __timeout: true }), TIMEOUT)),
      ]);
    } catch (e) {
      r = { __err: true };
    }

    if (r.__timeout) {
      bad++; console.log(p.name.padEnd(32) + argDesc.padEnd(18) + "超时".padEnd(10) + "✗");
      continue;
    }
    if (r.__err || !r.result) {
      const msg = r.error ? JSON.stringify(r.error).slice(0, 40) : "无 result";
      bad++; console.log(p.name.padEnd(32) + argDesc.padEnd(18) + msg.padEnd(10) + "✗");
      continue;
    }
    const msgs = r.result.messages || [];
    const totalChars = msgs.reduce((s, m) => s + String((m.content && m.content.text) || "").length, 0);
    const hasBody = msgs.length > 0 && totalChars > 80;
    if (hasBody) {
      ok++;
      console.log(p.name.padEnd(32) + argDesc.padEnd(18) + `${msgs.length}条/${totalChars}B`.padEnd(10) + "✓");
    } else {
      bad++;
      console.log(p.name.padEnd(32) + argDesc.padEnd(18) + `${msgs.length}条/${totalChars}B`.padEnd(10) + "✗ 内容过少");
    }
  }

  console.log()
  console.log("-".repeat(88))
  console.log(`可调用且返回实质内容：${ok} ｜ 失败 ${bad}`);
  console.log("总判定：" + (bad === 0 ? "PASS" : "需关注"));
  child.kill();
  process.exitCode = bad === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
})();
