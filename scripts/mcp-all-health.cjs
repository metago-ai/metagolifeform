"use strict";
/**
 * mcp-all-health.cjs — 全部 MCP 服务器的健康检查
 *
 * 目的：确认本次改造（T3 接线 / 输出守卫 / 原子层 / registry 补丁）
 *       没有破坏任何一组 MCP 服务器。
 * 做法：对每组服务器做 MCP 握手 + tools/list，统计工具数。
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

/* 从 DSH 配置读取 MCP 服务器定义 */
const CFG_CANDIDATES = [
  "D:/DSH-Official/home/cordis.patch.yml",
  "D:/DSH-Official/home/data/cordis.yml",
];

function findServers() {
  const found = {};
  // 已知路径（从运行中的工具定义反推 + 常见安装位置）
  const KNOWN = [
    ["metago", "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/mcp-server/dist/index.js"],
    ["metago-algorithms", "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/index.js"],
    ["playwright", "D:/MetaGO-Playwright-MCP/server/node_modules/@playwright/mcp/cli.js"],
    ["web-session-api", "D:/web-session-api/src/mcp-server.js"],
    ["yili", "D:/DH工作区/易理工程学/mcp/metago-shushu-server.js"],
  ];
  KNOWN.forEach(([n, p]) => {
    if (p && fs.existsSync(p)) found[n] = p;
  });
  // Python 类 MCP 服务器（前缀 PY: 标识）
  const PY_KNOWN = [
    ["scrapling", "D:/Documents/deepseek-harness/default-workspace/metago-dsh-lifeform/integrations/scrapling-mcp/server.py"],
  ];
  PY_KNOWN.forEach(([n, p]) => {
    if (p && fs.existsSync(p)) found[n] = "PY:" + p;
  });
  return found;
}

const SERVERS = findServers();   /* PY_PROBE */

function probe(name, script) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let child;
    const isPy = script.startsWith("PY:");
    const realScript = isPy ? script.slice(3) : script;
    /* Python 候选链：绝对路径必须真实存在；相对命令交给 spawn 解析。
       只取第一个是错的——若第一个是 Windows Store 桩会静默挂住。 */
    const PY_CANDS = [
      process.env.METAGO_PYTHON,
      "C:/Users/MetaGO/AppData/Local/Python/pythoncore-3.14-64/python.exe",
      "python", "python3", "py",
    ].filter(Boolean);
    const fsx = require("fs");
    const looksAbs = c => /^[A-Za-z]:[\\/]/.test(c) || c.startsWith("/");
    const ordered = [];
    for (const c of PY_CANDS) {
      if (looksAbs(c)) { if (fsx.existsSync(c)) ordered.push(c); }
      else ordered.push(c);
    }
    const exe = isPy ? (ordered[0] || "python") : process.execPath;
    try {
      child = spawn(exe, [realScript], {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: path.dirname(realScript),
        env: { ...process.env },
      });
    } catch (e) {
      return resolve({ name, ok: false, err: "spawn 失败: " + e.message.slice(0, 40) +
        (isPy ? "（Python 服务，检查 METAGO_PYTHON 或 PATH）" : "") });
    }

    let buf = "", done = false;
    const timer = setTimeout(() => {
      if (!done) { done = true; try { child.kill(); } catch (e) {} resolve({ name, ok: false, err: "超时" }); }
    }, 20000);

    const send = o => { try { child.stdin.write(JSON.stringify(o) + "\n"); } catch (e) {} };

    child.stdout.on("data", d => {
      buf += d.toString();
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        let m;
        try { m = JSON.parse(line); } catch (e) { continue; }
        if (m.id === 1 && m.result) {
          send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
        } else if (m.id === 2 && m.result) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          const n = (m.result.tools || []).length;
          try { child.kill(); } catch (e) {}
          resolve({ name, ok: true, tools: n, ms: Date.now() - t0 });
        }
      }
    });
    child.stderr.on("data", () => {});
    child.on("error", e => {
      if (done) return;
      done = true; clearTimeout(timer);
      resolve({ name, ok: false, err: e.message.slice(0, 40) });
    });

    send({
      jsonrpc: "2.0", id: 1, method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "health", version: "1" } },
    });
  });
}

(async () => {
  console.log("=".repeat(72));
  console.log("MCP 服务器全量健康检查");
  console.log("=".repeat(72));
  const names = Object.keys(SERVERS);
  if (!names.length) {
    console.log("未找到可探测的服务器脚本");
    process.exit(0);
  }
  let ok = 0, bad = 0;
  for (const n of names) {
    const r = await probe(n, SERVERS[n]);
    if (r.ok) {
      ok++;
      console.log(`PASS  ${n.padEnd(20)} ${String(r.tools).padStart(3)} 工具  ${r.ms}ms`);
    } else {
      bad++;
      console.log(`FAIL  ${n.padEnd(20)} ${r.err}`);
    }
  }
  console.log("-".repeat(72));
  console.log(`合计 ${names.length} 组 ｜ 通过 ${ok} ｜ 失败 ${bad}`);
  console.log(bad === 0 ? "总判定：PASS" : "总判定：PARTIAL");

  // 说明未探测的服务器
  const missing = ["yili", "scrapling", "web-session-api"].filter(x => !SERVERS[x]);
  if (missing.length) {
    console.log();
    console.log("未探测（脚本路径未知，但工具已在会话内注册）: " + missing.join(", "));
  }
  process.exitCode = bad === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
})();
