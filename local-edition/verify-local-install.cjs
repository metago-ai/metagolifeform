#!/usr/bin/env node
/**
 * MetaGO 本地发行版 · 安装后验收脚本（V1–V6）
 * 用法：node verify-local-install.cjs [--skills <技能目录>] [--law <AGENTS.md路径>] [--npm-root <npm全局根>]
 * 退出码：0 = 全部通过；1 = 存在 FAIL
 */
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
function opt(name) {
  const i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

const EXPECT = {
  "metago-lifeform": "36.8.7",
  "@metago-ai/engine": "2.1.1",
  "@metago-ai/mcp-server": "1.3.0",
  "@metago-ai/algorithms": "1.0.1",
  "@metago-ai/dev-kit": "1.1.0",
  "@metago-ai/verify-kit": "1.1.1",
};
const GOLDEN = 0.9999677440165068; // cosine_similarity([1,0,0.5],[1,0,0.49])

let fails = 0;
function report(id, ok, detail) {
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${id} ${detail}`);
  if (!ok) fails++;
}

function npmRoot() {
  if (opt("npm-root")) return opt("npm-root");
  try { return execSync("npm root -g", { encoding: "utf8" }).trim(); }
  catch { return null; }
}

/** 与 stdio MCP 服务器做一次 JSON-RPC 会话 */
function mcpSession(serverPath, requests, timeoutMs = 25000) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [serverPath], { stdio: ["pipe", "pipe", "pipe"] });
    let buf = "";
    const results = {};
    const timer = setTimeout(() => { child.kill(); resolve(results); }, timeoutMs);
    child.stdout.on("data", (d) => {
      buf += d.toString();
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
        if (!line || line.startsWith("[")) continue;
        try {
          const o = JSON.parse(line);
          if (o.id != null) {
            results[o.id] = o;
            if (Object.keys(results).length >= requests.filter(r => r.id != null).length) {
              clearTimeout(timer); child.kill(); resolve(results); return;
            }
          }
        } catch { /* 非 JSON 行（日志）忽略 */ }
      }
    });
    child.on("error", () => { clearTimeout(timer); resolve(results); });
    child.stdin.write(requests.map(r => JSON.stringify(r)).join("\n") + "\n");
    child.stdin.end();
  });
}

const INIT = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "metago-verify", version: "1.0" } } };
const INITED = { jsonrpc: "2.0", method: "notifications/initialized" };

(async () => {
  console.log("MetaGO 本地发行版 · 安装验收（V1–V6）\n");

  // V1 Node 版本
  const major = parseInt(process.versions.node.split(".")[0], 10);
  report("V1", major >= 16, `Node ${process.versions.node}（要求 ≥ 16）`);

  // V2 六包版本
  const root = npmRoot();
  if (!root) { report("V2", false, "无法定位 npm 全局根（npm root -g 失败）"); }
  else {
    for (const [pkg, ver] of Object.entries(EXPECT)) {
      const pj = path.join(root, pkg, "package.json");
      try {
        const actual = JSON.parse(fs.readFileSync(pj, "utf8")).version;
        report("V2", actual === ver, `${pkg} = ${actual}（期望 ${ver}）`);
      } catch { report("V2", false, `${pkg} 未安装（${pj} 不存在）`); }
    }
  }

  // V3 法则版本
  const lawPath = opt("law");
  if (!lawPath) { console.log("  [SKIP] V3 未提供 --law，跳过法则版本检查"); }
  else {
    try {
      const head = fs.readFileSync(lawPath, "utf8").slice(0, 2000);
      report("V3", head.includes("V36.8.7"), `${lawPath} 头部${head.includes("V36.8.7") ? "含" : "不含"} V36.8.7`);
    } catch { report("V3", false, `${lawPath} 不可读`); }
  }

  // V4 技能数量
  const skillsDir = opt("skills");
  if (!skillsDir) { console.log("  [SKIP] V4 未提供 --skills，跳过技能数量检查"); }
  else {
    try {
      const n = fs.readdirSync(skillsDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name.startsWith("metago-")).length;
      report("V4", n === 95, `${skillsDir} 下 metago-* 技能 = ${n}（期望 95）`);
    } catch { report("V4", false, `${skillsDir} 不可读`); }
  }

  // V5 算法服务器金标准探活
  if (root) {
    const algo = path.join(root, "@metago-ai", "algorithms", "index.js");
    if (!fs.existsSync(algo)) { report("V5", false, "算法服务器入口不存在"); }
    else {
      const res = await mcpSession(algo, [INIT, INITED,
        { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "cosine_similarity", arguments: { a: [1, 0, 0.5], b: [1, 0, 0.49] } } }]);
      try {
        const text = res[2].result.content[0].text;
        const score = JSON.parse(text).output.score;
        report("V5", score === GOLDEN, `cosine_similarity = ${score}（金标准 ${GOLDEN}）`);
      } catch { report("V5", false, `算法服务器响应异常：${JSON.stringify(res[2] || null).slice(0, 160)}`); }
    }
  } else { report("V5", false, "无 npm 全局根，跳过"); }

  // V6 主 MCP 服务器握手 + 工具数
  if (root) {
    const srv = path.join(root, "@metago-ai", "mcp-server", "dist", "index.js");
    if (!fs.existsSync(srv)) { report("V6", false, "MCP 服务器入口不存在（dist/index.js）"); }
    else {
      const res = await mcpSession(srv, [INIT, INITED, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }]);
      try {
        const n = res[2].result.tools.length;
        report("V6", n >= 53, `握手成功，tools/list = ${n}（要求 ≥ 53）`);
      } catch { report("V6", false, `握手失败：${JSON.stringify(res[2] || res[1] || null).slice(0, 160)}`); }
    }
  } else { report("V6", false, "无 npm 全局根，跳过"); }

  console.log(fails === 0 ? "\n✅ 验收通过（V1–V6）" : `\n❌ 验收失败：${fails} 项未通过`);
  process.exit(fails === 0 ? 0 : 1);
})();
