"use strict";
/**
 * mcp-e2e.cjs — MCP 通道端到端验证
 *
 * 真实走 MCP 协议：spawn 服务器 → initialize → tools/list → tools/call
 * 验证内容：
 *   1. 服务器能启动并完成 MCP 握手
 *   2. 工具列表数量与声明一致
 *   3. execute 工具能真实执行 T3 算法并返回结果（非 NOT_IMPLEMENTED）
 *   4. get_algorithm_info 对 T3 返回 implemented=true
 */
const { spawn } = require("child_process");
const path = require("path");

const SERVER = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms/index.js";
const TIMEOUT = 25000;

function main() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SERVER], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: path.dirname(SERVER),
      env: { ...process.env, METAGO_MCP_QUIET: "1" },
    });

    let buf = "";
    let stderr = "";
    let phase = 0;
    const results = [];
    const record = (n, ok, d) => results.push({ n, ok: !!ok, d: d || "" });

    const send = (obj) => child.stdin.write(JSON.stringify(obj) + "\n");

    const timer = setTimeout(() => {
      record("超时", false, `${TIMEOUT}ms 内未完成`);
      child.kill();
      finish();
    }, TIMEOUT);

    function finish() {
      clearTimeout(timer);
      try { child.kill(); } catch (e) { /* ignore */ }

      console.log("=".repeat(76));
      console.log("MCP 通道端到端验证");
      console.log("=".repeat(76));
      results.forEach(r => {
        console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.n.padEnd(36)} ${r.d}`);
      });
      console.log("-".repeat(76));
      const fail = results.filter(r => !r.ok).length;
      console.log(`合计 ${results.length} 项 ｜ 通过 ${results.length - fail} ｜ 失败 ${fail}`);
      if (stderr.trim()) {
        console.log();
        console.log("服务器 stderr（前 6 行）:");
        stderr.trim().split("\n").slice(0, 6).forEach(l => console.log("  " + l.slice(0, 110)));
      }
      console.log(fail === 0 ? "总判定：PASS" : "总判定：FAIL");
      resolve(fail === 0 ? 0 : 1);
    }

    child.stderr.on("data", d => { stderr += d.toString(); });

    child.stdout.on("data", (d) => {
      buf += d.toString();
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        let msg;
        try { msg = JSON.parse(line); } catch (e) { continue; }
        handle(msg);
      }
    });

    function handle(msg) {
      if (msg.id === 1 && msg.result) {
        record("MCP 握手 initialize", true,
          `server=${msg.result.serverInfo ? msg.result.serverInfo.name : "?"} ` +
          `protocol=${msg.result.protocolVersion || "?"}`);
        // 下一阶段：工具列表
        send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });

      } else if (msg.id === 2 && msg.result) {
        const tools = msg.result.tools || [];
        record("tools/list 工具数量", tools.length === 57, `${tools.length} 个（声明 57）`);
        const hasExec = tools.some(t => t.name === "execute");
        const hasInfo = tools.some(t => t.name === "get_algorithm_info");
        record("execute 工具存在", hasExec, hasExec ? "有" : "缺");
        record("get_algorithm_info 工具存在", hasInfo, hasInfo ? "有" : "缺");

        // 下一阶段：真实执行 T3
        send({
          jsonrpc: "2.0", id: 3, method: "tools/call",
          params: {
            name: "execute",
            arguments: {
              id: "ALG_T3_C_001",
              input: {
                techChain: [{ phase: 0.1, value: 1.2 }],
                consensusChain: [{ phase: 0.15, value: 0.9 }],
                windowSize: 1
              }
            }
          }
        });

      } else if (msg.id === 3 && msg.result) {
        const c = msg.result.content || [];
        const text = c.map(x => x.text || "").join(" ");
        let parsed = null;
        try { parsed = JSON.parse(text); } catch (e) { /* 可能不是纯 JSON */ }
        const gotReal = /phaseDiff|couplingScore|progressEfficiency/.test(text);
        const notImpl = /NOT_IMPLEMENTED|未实现/.test(text);
        record("MCP 调用 execute 执行 T3", gotReal && !notImpl,
          gotReal ? text.replace(/\s+/g, " ").slice(0, 100)
                  : (notImpl ? "返回 NOT_IMPLEMENTED（仍是空壳）" : text.slice(0, 90)));
        if (parsed && parsed.success !== undefined) {
          record("execute 返回 success=true", parsed.success === true, `success=${parsed.success}`);
        }

        // 下一阶段：算法信息
        send({
          jsonrpc: "2.0", id: 4, method: "tools/call",
          params: { name: "get_algorithm_info", arguments: { id: "ALG_T3_C_003" } }
        });

      } else if (msg.id === 4 && msg.result) {
        const text = (msg.result.content || []).map(x => x.text || "").join(" ");
        record("get_algorithm_info 对 T3", !/NOT_IMPLEMENTED|未实现/.test(text),
          text.replace(/\s+/g, " ").slice(0, 100));
        finish();

      } else if (msg.error) {
        record("JSON-RPC 错误", false, `id=${msg.id}: ${JSON.stringify(msg.error).slice(0, 90)}`);
        finish();
      }
    }

    // 握手
    send({
      jsonrpc: "2.0", id: 1, method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "metago-e2e", version: "1.0.0" },
      },
    });
  });
}

main().then(code => process.exit(code));
