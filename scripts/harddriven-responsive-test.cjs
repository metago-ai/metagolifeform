"use strict";
/**
 * harddriven-responsive-test.cjs — 12 个硬驱动工具是否真的「按输入算」
 *
 * 已有：112/112 工具可调用。
 * 待验：硬驱动工具是否真的把输入算进去了 —— 还是无论传什么都返回同一段话？
 * 方法：每个工具传两组语义相反的输入，比较输出。若完全相同 → 该工具没在用输入。
 */
const { spawn } = require("child_process");

const SERVER = "C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/mcp-server/dist/index.js";

/* 每个硬驱动工具：两组「应当导致不同结论」的输入 */
const CASES = {
  metago_decision_lock: [
    "根据耦生度大于1，系统已进入超导态。依据：定理推导，来源：附录卷。",
    "我觉得大概应该差不多可以吧，反正就那么回事。",
  ],
  metago_self_check: [
    "本方案覆盖 12 个维度：需求、架构、实现、测试、部署、监控、安全、合规、成本、进度、风险、验收。每项都有对应证据。",
    "TODO: 待补充。",
  ],
  metago_output_integrity: [
    "耦生度 C = (C_carbon × C_silicon × C_bit)^(1/3)，实测 1.23，来源 genome/FACTS.json。",
    "调用 foo.bar(x) 返回 magic_value，实现见 internal_module。",
  ],
  metago_compliance: [
    "本方案不收集任何个人信息，仅处理公开统计数据，已附数据处理说明与法律依据。",
    "把所有用户手机号和身份证号导出到公开服务器供任何人下载。",
  ],
  metago_objectivity: [
    "测试显示方案 A 的 P95 延迟为 120ms，方案 B 为 210ms（样本 1000 次，环境相同）。",
    "毫无疑问方案 A 是最好的，谁选 B 就是不懂技术。",
  ],
  metago_data_provenance: [
    "数据来自 genome/FACTS.json，采集方式：脚本扫描，可复核路径 D:/metago-build/genome/FACTS.json。",
    "数字是 42，具体哪来的记不清了。",
  ],
  metago_critique: [
    "因为耦生度大于1，所以系统处于超导态。该结论在边界条件下可能不成立，且未考虑噪声影响。",
    "这个方案完美无缺，不可能有任何问题。",
  ],
  metago_emotion: [
    "我非常愤怒！这太糟糕了！！",
    "今天天气不错，心情很好。",
  ],
  metago_negentropy_monitor: [
    "100 1 1 1 1",
    "10 10 10 10 10",
  ],
};

const child = spawn(process.execPath, [SERVER], { stdio: ["pipe", "pipe", "pipe"] });
let buf = "", id = 0;
const pend = new Map();
const send = o => { try { child.stdin.write(JSON.stringify(o) + "\n"); } catch (e) { } };
const call = (m, p) => new Promise(r => { const i = ++id; pend.set(i, r); send({ jsonrpc: "2.0", id: i, method: m, params: p }); });

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
  await call("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "hr", version: "1" } });
  const tl = await call("tools/list", {});
  const tools = new Map(((tl.result && tl.result.tools) || []).map(t => [t.name, t]));

  console.log("=".repeat(92));
  console.log("硬驱动工具「输入改变 → 输出是否变化」");
  console.log("=".repeat(92));
  console.log("工具".padEnd(30) + "参数名".padEnd(12) + "A长度".padEnd(9) + "B长度".padEnd(9) + "判定");
  console.log("-".repeat(92));

  let ok = 0, bad = 0, skip = 0;
  for (const [name, [inA, inB]] of Object.entries(CASES)) {
    const tool = tools.get(name);
    if (!tool) {
      console.log(name.padEnd(30) + "—".padEnd(12) + "—".padEnd(9) + "—".padEnd(9) + "✗ 工具不存在");
      bad++;
      continue;
    }
    const props = Object.keys((tool.inputSchema && tool.inputSchema.properties) || {});
    const req = (tool.inputSchema && tool.inputSchema.required) || [];
    // 选一个字符串型参数
    let pname = req.find(p => props.includes(p)) || props[0];
    if (!pname) {
      console.log(name.padEnd(30) + "—".padEnd(12) + "—".padEnd(9) + "—".padEnd(9) + "- 无参数");
      skip++;
      continue;
    }

    const fetchOne = async (val) => {
      const args = {};
      for (const p of req) args[p] = p === pname ? val : "x";
      if (!req.length) args[pname] = val;
      try {
        const r = await Promise.race([
          call("tools/call", { name, arguments: args }),
          new Promise(x => setTimeout(() => x({ __t: 1 }), 20000)),
        ]);
        if (r.__t) return null;
        return String(((r.result && r.result.content) || []).map(c => c.text || "").join(""));
      } catch (e) { return null; }
    };

    const outA = await fetchOne(inA);
    const outB = await fetchOne(inB);
    if (outA === null || outB === null) {
      console.log(name.padEnd(30) + pname.padEnd(12) + "—".padEnd(9) + "—".padEnd(9) + "✗ 调用失败");
      bad++;
      continue;
    }
    // 去掉输入回显后比较「结论部分」是否不同
    const stripEcho = s => s.replace(/## 用户输入[\s\S]*?(?=## |$)/, "");
    const cA = stripEcho(outA), cB = stripEcho(outB);
    const differ = cA !== cB;
    const sameLen = outA.length === outB.length;
    if (differ) {
      ok++;
      console.log(name.padEnd(30) + pname.padEnd(12) + String(outA.length).padEnd(9) +
        String(outB.length).padEnd(9) + "✓ 结论不同");
    } else {
      bad++;
      console.log(name.padEnd(30) + pname.padEnd(12) + String(outA.length).padEnd(9) +
        String(outB.length).padEnd(9) + "✗ 结论相同（未使用输入）" + (sameLen ? " 且长度相同" : ""));
    }
  }

  console.log();
  console.log("-".repeat(92));
  console.log(`响应输入：${ok} ｜ 未响应：${bad} ｜ 跳过：${skip}`);
  console.log("总判定：" + (bad === 0 ? "PASS" : "需关注"));
  child.kill();
  process.exitCode = bad === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
})();
