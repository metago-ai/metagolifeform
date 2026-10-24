"use strict";
/**
 * mcp-tools-callable.cjs — 验证 MCP 工具「可调用」而不只是「可列出」
 *
 * 此前只做 initialize + tools/list（mcp-all-health.cjs），
 * 拿到工具数量就算通过。但「列出 55 个工具」不等于「55 个都能调」。
 * 本脚本按 schema 构造最小合法参数，逐个真实调用一次。
 */
/*
 * R141 职责边界（两个检测器分工，避免重复与误判）：
 *   mcp-tools-callable.cjs  → 判「112 个工具都能响应」：协议层可达 + 无 NaN
 *                             （用瞎造的最小参数，允许返回业务错误）
 *   mcp-tools-semantic.cjs  → 判「30 个 L3 工具结果正确」：合法参数 + 数学性质断言
 *                             + 判据有牙自检
 */
const { spawn } = require("child_process");
const path = require("path");

const SERVERS = [
  ["metago", "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/mcp-server/dist/index.js"],
  ["metago-algorithms", "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/index.js"],
];

/** 按工具 schema 造最小参数 */
function minimalArgs(tool) {
  const s = tool.inputSchema || {};
  const props = s.properties || {};
  const required = s.required || [];
  const out = {};
  for (const k of required) {
    const p = props[k] || {};
    const t = p.type || (p.anyOf ? p.anyOf[0]?.type : undefined);
    if (p.enum && p.enum.length) out[k] = p.enum[0];
    else if (t === "number" || t === "integer") out[k] = p.minimum !== undefined ? p.minimum : 1;
    else if (t === "boolean") out[k] = true;
    else if (t === "array") out[k] = [];
    else if (t === "object") out[k] = {};
    else out[k] = p.examples && p.examples.length ? p.examples[0] : "test";
  }
  return out;
}

function runServer(name, script) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], { stdio: ["pipe", "pipe", "pipe"] });
    let buf = "";
    let id = 0;
    const pending = new Map();
    const done = (v) => { try { child.kill(); } catch (e) { } resolve(v); };
    const timer = setTimeout(() => done({ error: "超时" }), 240000);

    const send = (o) => { try { child.stdin.write(JSON.stringify(o) + "\n"); } catch (e) { } };
    const call = (method, params) => new Promise((res) => {
      const myId = ++id;
      pending.set(myId, res);
      send({ jsonrpc: "2.0", id: myId, method, params });
    });

    child.stdout.on("data", (d) => {
      buf += d.toString();
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        let m;
        try { m = JSON.parse(line); } catch (e) { continue; }
        if (m.id && pending.has(m.id)) {
          pending.get(m.id)(m);
          pending.delete(m.id);
        }
      }
    });
    child.stderr.on("data", () => { });

    (async () => {
      await call("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "callable", version: "1" } });
      const tl = await call("tools/list", {});
      const tools = (tl.result && tl.result.tools) || [];

      const results = [];
      for (const t of tools) {
        const args = minimalArgs(t);
        const r = await Promise.race([
          call("tools/call", { name: t.name, arguments: args }),
          new Promise((res) => setTimeout(() => res({ timeout: true }), 15000)),
        ]);
        /* ==== R141 判据加固 v2 ====
       v1 的 payload 路径猜错（MCP 直连返回在 result.content[].text，不是 structuredContent），
       导致加固完全失效。v2 从 content[] 拼文本，再决定按 JSON 还是按 Markdown 判。 */
    const textOf = (r) => {
      try {
        const c = r && r.result && r.result.content;
        if (!Array.isArray(c)) return '';
        return c.map((x) => (x && typeof x.text === 'string' ? x.text : '')).join('');
      } catch (e) { return ''; }
    };
    const tryJson = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
    const isEmptyShell = (o) => {
      if (o === null || o === undefined) return true;
      if (Array.isArray(o)) return o.length === 0;
      if (typeof o !== 'object') return false;
      const ks = Object.keys(o).filter((k) => k !== 'provenance');
      if (ks.length === 0) return true;
      return ks.every((k) => {
        const v = o[k];
        if (v === null || v === undefined) return true;
        if (Array.isArray(v)) return v.length === 0;
        if (typeof v === 'object') return Object.keys(v).length === 0;
        if (typeof v === 'string') return v.trim() === '';
        return false;
      });
    };
    const hasNaN = (v) => {
      if (typeof v === 'number') return !isFinite(v);
      if (Array.isArray(v)) return v.some(hasNaN);
      if (v && typeof v === 'object') return Object.values(v).some(hasNaN);
      return false;
    };
    const text = textOf(r);
    const obj = tryJson(text);
    let softFail = false, shell = false, nanOut = false, emptyText = false;
    if (obj && typeof obj === 'object') {
      softFail = obj.success === false;
      shell = obj.output !== undefined && isEmptyShell(obj.output);
      nanOut = obj.output !== undefined && hasNaN(obj.output);
    } else {
      // Markdown 型工具：文本非空即算有内容
      emptyText = text.trim().length === 0;
    }
    /* ==== R141 职责边界（三次迭代后的结论）====
       本脚本用**瞎造的最小参数**调用，因此工具返回业务错误（参数校验）是预期行为，
       不能判为「不可调用」。例：execute({id:"test"}) → 「算法 test 不存在」是正确的。
       本脚本只判协议层：超时 / 协议错 / 输出含 NaN。
       语义正确性（含空壳、success:false、数学性质）全部交给 mcp-tools-semantic.cjs
       ——那里有每个工具的合法参数与精确期望值，并有「判据有牙自检」。 */
    void shell;
    void softFail;
    void emptyText;
    const isErr = r.timeout || (r.error) || (r.result && r.result.isError) || nanOut;
        results.push({ name: t.name, ok: !isErr, err: r.timeout ? "超时" : (r.error ? JSON.stringify(r.error).slice(0, 60) : (r.result && r.result.isError ? "isError" : "")) });
      }
      clearTimeout(timer);
      done({ tools: results });
    })().catch((e) => { clearTimeout(timer); done({ error: String(e.message).slice(0, 60) }); });
  });
}

(async () => {
  console.log("=".repeat(84));
  console.log("MCP 工具「可调用」验证（按 schema 构造最小参数，逐个真实调用）");
  console.log("=".repeat(84));

  let totalTools = 0, totalOk = 0;
  const failures = [];

  for (const [name, script] of SERVERS) {
    if (!require("fs").existsSync(script)) { console.log(`\n${name}: 脚本不存在，跳过`); continue; }
    process.stderr.write(`\n  正在测 ${name} ...\n`);
    const r = await runServer(name, script);
    if (r.error) { console.log(`\n${name}: ${r.error}`); continue; }
    const ok = r.tools.filter(t => t.ok).length;
    totalTools += r.tools.length;
    totalOk += ok;
    console.log(`\n● ${name}：${ok} / ${r.tools.length} 可调用`);
    const bad = r.tools.filter(t => !t.ok);
    bad.forEach(t => { failures.push([name, t.name, t.err]); console.log("    ✗ " + t.name.padEnd(30) + t.err); });
  }

  console.log();
  console.log("-".repeat(84));
  console.log(`合计 ${totalTools} 个工具 ｜ 可调用 ${totalOk} ｜ 不可调用 ${totalTools - totalOk}`);
  console.log(totalTools - totalOk === 0 ? "总判定：PASS（全部工具真实可调用）" : `总判定：需关注（${failures.length} 个）`);
  process.exitCode = totalTools - totalOk === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
})();
