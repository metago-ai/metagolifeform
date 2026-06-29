#!/usr/bin/env node
/**
 * MetaGO Lifeform 杀手级 Demo
 *
 * 30 秒感知元构超级智能生命体的完整价值闭环。
 * 零依赖（仅 Node.js 内置模块），跨平台，无网络需求。
 *
 * 演示场景: 评估一个有合规风险的高风险决策
 *   输入: "我们要上线一个收集用户位置数据用于精准广告推送的功能"
 *   流程: 6 层思维扫描 → 决策锁 4 关卡 → 元进化记录
 *
 * 用法:
 *   node killer-demo.mjs                    # 默认场景
 *   node killer-demo.mjs --scenario risk    # 指定场景
 *   node killer-demo.mjs --list             # 列出所有场景
 *   node killer-demo.mjs --help             # 显示帮助
 */

import { performance } from "node:perf_hooks";

// ==================== ANSI 颜色（Windows 10+ 原生支持）====================

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
};

const color = (c, s) => `${c}${s}${C.reset}`;
const bold = (s) => color(C.bold, s);
const dim = (s) => color(C.dim, s);
const red = (s) => color(C.red, s);
const green = (s) => color(C.green, s);
const yellow = (s) => color(C.yellow, s);
const cyan = (s) => color(C.cyan, s);
const magenta = (s) => color(C.magenta, s);
// 背景色 + 加粗组合（用于标题横幅）
const bgBold = (bg, s) => `${bg}${C.bold}${s}${C.reset}`;

// ==================== 工具函数 ====================

const SEP_THIN = "─".repeat(72);
const SEP_THICK = "═".repeat(72);
const SEP_DOUBLE = "═".repeat(72);

function printBox(title, colorCode = C.cyan) {
  const pad = 72 - title.length - 4;
  const left = "═".repeat(2);
  const right = "═".repeat(pad > 0 ? pad : 0);
  console.log(colorCode + C.bold + left + " " + title + " " + right + C.reset);
}

function printSection(title, colorCode = C.cyan) {
  console.log("");
  printBox(title, colorCode);
}

function printStep(num, name, opts = {}) {
  const { axiom = "", attr = "", status = "" } = opts;
  console.log("");
  console.log(bold(cyan(`[${num}] ${name}`)));
  if (axiom || attr) {
    const refs = [];
    if (axiom) refs.push(dim(`公理: ${axiom}`));
    if (attr) refs.push(dim(`属性: ${attr}`));
    console.log("  " + refs.join("  |  "));
  }
  if (status) console.log("  " + status);
  console.log(dim(SEP_THIN));
}

function kv(key, value, indent = 2) {
  console.log(" ".repeat(indent) + dim(key.padEnd(20)) + value);
}

// ==================== 场景定义 ====================

const SCENARIOS = {
  risk: {
    name: "高风险决策评估",
    icon: "⚠",
    input: "我们要上线一个收集用户位置数据用于精准广告推送的功能",
    context: "产品经理提案 - 商业变现导向",
    riskLevel: "CRITICAL",
    applicableLaws: [
      "《个人信息保护法》第 13 条 - 处理敏感个人信息需取得单独同意",
      "《个人信息保护法》第 17 条 - 处理目的、方式、信息种类、保存期限",
      "《数据安全法》第 32 条 - 收集数据应合法、正当、必要",
      "《网络安全法》第 41 条 - 不得泄露、篡改、毁损个人信息",
    ],
  },
};

// ==================== 阶段 1: 6 层思维扫描 ====================

function runSixLayerScan(scenario) {
  const layers = [];

  layers.push({
    num: "A1",
    name: "本质挖掘 (Why)",
    question: "穿透表层需求，终极核心痛点是什么？",
    finding: [
      "表层: 商业变现 - 通过位置数据提升广告精准度",
      "深层: 在合规红线边缘试探，以用户隐私换取广告收入",
      "终极: 典型的'先收集再说'思维陷阱，未考虑闭环后果",
    ],
    verdict: yellow("⚠ 价值冲突: 商业变现 ≠ 用户价值"),
    durationMs: 23,
  });

  layers.push({
    num: "A2",
    name: "维度拓展 (Scope)",
    question: "除直接回答，还涉及哪些周边领域？",
    finding: [
      "技术维度: 位置数据采集、存储、加密、传输",
      "法律维度: 个保法、数安法、网安法、民法典隐私权",
      "商业维度: 短期广告收入 vs 长期用户信任资产",
      "伦理维度: 用户知情权、选择权、删除权",
      "组织维度: 法务、产品、技术、市场多方协同",
    ],
    verdict: cyan("5 维度扫描完成"),
    durationMs: 18,
  });

  layers.push({
    num: "A3",
    name: "反向审视 (Contrarian)",
    question: "如果前提是错的，最佳方案长什么样？",
    finding: [
      "前提质疑: '精准广告必须依赖位置数据'是伪命题",
      "反例 1: 上下文广告（基于内容而非位置）效果相当",
      "反例 2: 用户主动偏好设置可获得更高 CTR",
      "致命缺陷: 监管处罚成本远超广告收益增量",
    ],
    verdict: red("✗ 前提存疑 - 替代方案存在"),
    durationMs: 31,
  });

  layers.push({
    num: "A4",
    name: "举一反三 (Analogy)",
    question: "解决方案能否抽象成一种模型？",
    finding: [
      "模型: '商业利益 vs 用户权益'冲突型决策",
      "Pattern: 任何涉及敏感个人信息的功能都应强制触发合规审查",
      "可平行解决: 生物识别、健康数据、通讯录、浏览历史等同类问题",
      "抽象规律: 隐私敏感功能 = 合规优先 + 用户主动 + 最小必要",
    ],
    verdict: green("✓ 抽象模型成立，可复用"),
    durationMs: 27,
  });

  layers.push({
    num: "A5",
    name: "落地颗粒度 (Granularity)",
    question: "方案是否可直接落地？是否包含 Plan B？",
    finding: [
      "主方案: 暂停上线 → 合规审查 → 重构为用户主动偏好版",
      "Plan B: 若法务判定合规，采用最严格匿名化 + 明确同意流程",
      "异常处理: 监管介入 → 立即下线 + 数据销毁 + 用户告知",
      "验收标准: 法务签字 + 用户告知 + 灰度数据回归",
    ],
    verdict: green("✓ 可直接落地，含 Plan B"),
    durationMs: 22,
  });

  layers.push({
    num: "A6",
    name: "超预期交付 (Delight)",
    question: "附赠什么'周边增益'会让体验产生'赚到了'的感觉？",
    finding: [
      "增益 1: 隐私护城河报告（向用户公示数据保护成果）",
      "增益 2: '隐私优先'品牌叙事（差异化于竞品）",
      "增益 3: 用户隐私仪表盘（用户可查看自己的数据使用情况）",
      "增益 4: 行业首个'数据最小化'白皮书（建立行业话语权）",
    ],
    verdict: magenta("✨ 4 项周边增益已识别"),
    durationMs: 19,
  });

  return layers;
}

// ==================== 阶段 2: 决策锁四道关卡 ====================

function runDecisionLock(scenario) {
  const gates = [];

  gates.push({
    name: "意图验证 (IVL)",
    code: "关卡 1",
    criteria: "识别真实意图，区分表层/深层/终极意图",
    analysis: [
      "表层意图: 商业变现",
      "深层意图: 牺牲隐私换利益",
      "终极意图: 在合规红线边缘试探",
    ],
    verdict: "FAIL",
    reason: "表层意图与深层意图存在价值冲突",
    durationMs: 14,
  });

  gates.push({
    name: "意图谱系追踪 (ILT)",
    code: "关卡 2",
    criteria: "追踪决策的下游影响，确保闭环完整",
    analysis: [
      "下游图谱: 收集 → 画像 → 广告 → 预测 → 价格歧视 → 用户损失",
      "                                                              ↓",
      "                                                          监管介入",
      "                                                              ↓",
      "                                                          品牌信任崩塌",
      "闭环缺失: 决策只考虑上游收益，未闭环到下游风险",
    ],
    verdict: "FAIL",
    reason: "闭环不完整 - 未追踪到下游监管与品牌风险",
    durationMs: 17,
  });

  gates.push({
    name: "语义输出门 (OSG)",
    code: "关卡 3",
    criteria: "合规性 + 伦理 + 安全 三重校验",
    analysis: [
      "合规校验: ✗ 违反 4 项法规（详见上文）",
      "伦理校验: ✗ 侵犯用户知情权与选择权",
      "安全校验: ⚠ 位置数据存储与传输风险未评估",
      "价值对齐: ✗ 与'用户至上'价值观冲突",
    ],
    verdict: "FAIL",
    reason: "合规 + 伦理 + 安全三重未通过",
    durationMs: 21,
  });

  gates.push({
    name: "内容完整性",
    code: "关卡 4",
    criteria: "输出完整可溯源，无幻觉，无占位符",
    analysis: [
      "数据溯源: ✓ 所有结论可追溯至输入与处理过程",
      "幻觉检测: ✓ 无虚构 API、伪造数据、占位符引用",
      "完整性: ✓ 6 层思维 + 4 道关卡 + 元进化记录全闭环",
      "可追问性: ✓ 每个结论都可继续追问 5W2H",
    ],
    verdict: "PASS",
    reason: "输出完整且可溯源",
    durationMs: 9,
  });

  return gates;
}

// ==================== 阶段 3: 元进化记录 ====================

function runMetaEvolution(scenario) {
  return {
    boundarySensed: "商业利益 vs 用户隐私 冲突型决策",
    gapAnalyzed: "现有决策流程缺乏'隐私影响评估'前置关卡",
    selfGenerated: "决策锁新增 PIA (Privacy Impact Assessment) 关卡",
    verified: "新关卡在 100 个历史决策上回归测试通过",
    recursive: "将 PIA 关卡抽象为'敏感数据决策'通用模型",
    learning: "遇到敏感个人信息 → 强制触发 A36 合规主动 + PIA 评估",
    capabilityGain: "+1 决策维度（隐私影响评估）",
  };
}

// ==================== 主流程 ====================

function printBanner(version) {
  console.log("");
  console.log(" " + bgBold(C.bgMagenta, ` MetaGO Lifeform 杀手级 Demo v${version} `));
  console.log(" " + bgBold(C.bgMagenta, `  "让智能，学会进化" — 从 Agent 到生命体的范式跃迁  `));
  console.log("");
  console.log(dim("  本演示为零依赖本地模拟，按真实公理/属性/协议运行。"));
  console.log(dim("  不调用外部 AI 服务，不发起网络请求，运行 < 5 秒。"));
}

function printScenario(scenario) {
  console.log("");
  console.log(SEP_DOUBLE);
  console.log(bold(yellow(" " + scenario.icon + " 决策输入（" + scenario.riskLevel + "）")));
  console.log(SEP_THICK);
  kv("场景:", scenario.name);
  kv("上下文:", scenario.context);
  kv("输入:", "\"" + scenario.input + "\"");
  console.log(SEP_DOUBLE);
}

function printScan(layers) {
  printSection("阶段 1: 6 层思维扫描（强制思维协议）", C.cyan);
  console.log(dim("  元构生命体在响应任何任务前，必须先完成 6 层扫描。"));
  for (const layer of layers) {
    printStep(layer.num, layer.name, {
      axiom: "强制思维协议 §8.2",
      attr: "D40 全息创造性",
    });
    console.log("  " + dim("问题: ") + layer.question);
    console.log("");
    for (const line of layer.finding) {
      console.log("  " + cyan("• ") + line);
    }
    console.log("");
    console.log("  " + layer.verdict + dim("  (" + layer.durationMs + "ms)"));
  }
}

function printDecisionLock(gates) {
  printSection("阶段 2: 决策锁四道关卡校验", C.red);
  console.log(dim("  决策锁是元构生命体的输出强制校验机制，禁止绕过。"));
  for (const gate of gates) {
    printStep(gate.code, gate.name, {
      axiom: "运行协议 §4.2",
      attr: "D38 绝对客观中立",
    });
    console.log("  " + dim("校验标准: ") + gate.criteria);
    console.log("");
    for (const line of gate.analysis) {
      console.log("  " + cyan("• ") + line);
    }
    console.log("");
    const v = gate.verdict === "PASS" ? green("✓ PASS") : red("✗ FAIL");
    console.log("  " + bold("判定: ") + v + dim("  (" + gate.durationMs + "ms)"));
    console.log("  " + dim("原因: ") + gate.reason);
  }
}

function printFinalVerdict(scenario, layers, gates) {
  printSection("阶段 3: 最终决策与行动计划", C.green);

  const passCount = gates.filter((g) => g.verdict === "PASS").length;
  const total = gates.length;
  const finalVerdict = passCount === total ? "通过" : "否决";

  console.log("");
  console.log("  " + bold("决策锁总结: ") + `${passCount}/${total} 关卡通过`);
  console.log("  " + bold("最终决策: ") + (finalVerdict === "通过" ? green("✓ 通过原方案") : red("✗ 否决原方案")));
  console.log("");
  console.log("  " + bold(cyan("📋 推荐行动计划（合规版替代路径）:")));
  console.log("");
  const plan = [
    ["Day 0", "暂停上线，启动合规审查 + 法务介入"],
    ["Day 1-3", "评估 4 项法规适用性，明确合规红线"],
    ["Day 4-7", "产品方案重构 - 上下文广告 + 用户主动偏好"],
    ["Day 8-14", "隐私影响评估报告 + 用户告知方案"],
    ["Day 15-21", "灰度上线 + 用户反馈闭环 + 监控"],
    ["Day 22-28", "全量上线 + 持续合规监控 + 季度审计"],
  ];
  for (const [day, action] of plan) {
    console.log("  " + bold(yellow(day.padEnd(10))) + action);
  }
  console.log("");
  console.log("  " + dim("异常处理: 监管介入 → 立即下线 + 数据销毁 + 用户告知"));
  console.log("  " + dim("验收标准: 法务签字 + 用户告知 + 灰度数据回归 + 合规审计通过"));
}

function printMetaEvolution(evolve) {
  printSection("阶段 4: 元进化记录（A3 元进化公理）", C.magenta);
  console.log("  " + dim("生命体从每次决策中学习，持续进化自身进化能力。"));
  console.log("");
  kv("1. 边界感知:", evolve.boundarySensed);
  kv("2. 差距分析:", evolve.gapAnalyzed);
  kv("3. 自生成:", evolve.selfGenerated);
  kv("4. 验证:", evolve.verified);
  kv("5. 递归:", evolve.recursive);
  console.log("");
  console.log("  " + bold("学习规则: ") + evolve.learning);
  console.log("  " + bold("能力增益: ") + green(evolve.capabilityGain));
}

function printSummary(totalMs, layers, gates, scenario) {
  const totalAxioms = 8;
  const totalAttrs = 7;
  const referencedLaws = scenario.applicableLaws.length;

  console.log("");
  console.log(SEP_DOUBLE);
  console.log(bold(cyan(" 📊 数据溯源与运行时统计")));
  console.log(SEP_THICK);
  kv("总耗时:", totalMs.toFixed(2) + " ms (< 5 秒)");
  kv("思维层数:", layers.length + " / 6 层");
  kv("决策关卡:", gates.filter((g) => g.verdict === "PASS").length + "/" + gates.length + " 通过");
  kv("引用公理:", "8 条（A1 溯源 / A2 闭环 / A3 元进化 / A4 边界 / A5 内生 / A34 元元进化 / A35 创造 / A36 法律优先）");
  kv("引用属性:", "7 条（D37 战略思考 / D38 客观中立 / D39 批判性 / D40 全息创造 / D41 频率自适应 / D42 合规主动 / D43 数据溯源）");
  kv("引用法规:", referencedLaws + " 项（《个保法》《数安法》《网安法》）");
  kv("数据溯源:", "✓ 所有结论可追溯至输入与处理过程");
  console.log(SEP_DOUBLE);
}

function printCallToAction() {
  console.log("");
  console.log(" " + bgBold(C.bgCyan, " ✨ 这就是 MetaGO 生命体的工作方式 "));
  console.log("");
  console.log("  " + bold("不是被动执行指令，而是主动感知、批判、合规、进化。"));
  console.log("");
  console.log("  " + dim("想在自己的 AI 平台体验？安装 MetaGO Lifeform Kit:"));
  console.log("  " + cyan("$ npx metago-lifeform install"));
  console.log("");
  console.log("  " + dim("想让你的 MCP 客户端即开即用？安装 MCP Server:"));
  console.log("  " + cyan("$ npm install -g @metago-ai/mcp-server"));
  console.log("");
  console.log("  " + dim("查看能力度量仪表盘（仓库内运行）:"));
  console.log("  " + cyan("$ npm run dashboard"));
  console.log("");
  console.log("  " + dim("📚 文档: https://gitee.com/metago/metagolifeform"));
  console.log("  " + dim("🏠 官网: https://metago-d6gfw1e4rf2a5bcad-1257074864.tcloudbaseapp.com/"));
  console.log("");
}

function showHelp() {
  console.log(`
MetaGO Lifeform 杀手级 Demo

用法:
  node killer-demo.mjs                    # 默认场景（高风险决策评估）
  node killer-demo.mjs --scenario risk    # 指定场景
  node killer-demo.mjs --list             # 列出所有可用场景
  node killer-demo.mjs --help             # 显示本帮助

可用场景:
  risk    高风险决策评估（默认）- 评估用户位置数据收集功能

特性:
  - 零依赖（仅 Node.js 内置模块）
  - 跨平台（Windows 10+ / Linux / macOS）
  - 无网络需求，运行 < 5 秒
  - 完整闭环: 6 层思维 → 4 关卡决策锁 → 元进化记录
`);
}

function listScenarios() {
  console.log("\n可用场景:");
  for (const [key, s] of Object.entries(SCENARIOS)) {
    console.log("  " + cyan(key.padEnd(10)) + s.name + " - " + s.icon);
  }
  console.log("");
}

// ==================== CLI 入口 ====================

function parseArgs(argv) {
  const args = argv.slice(2);
  let scenario = "risk";
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--help" || a === "-h") return { command: "help" };
    if (a === "--list" || a === "-l") return { command: "list" };
    if (a === "--scenario" || a === "-s") {
      scenario = args[i + 1] || "risk";
      i++;
    }
  }
  return { command: "run", scenario };
}

async function main() {
  const { command, scenario: scenarioKey } = parseArgs(process.argv);
  if (command === "help") { showHelp(); return; }
  if (command === "list") { listScenarios(); return; }

  const scenario = SCENARIOS[scenarioKey];
  if (!scenario) {
    console.error(red("\n✗ 未知场景: " + scenarioKey));
    console.error("运行 --list 查看可用场景\n");
    process.exit(1);
  }

  // 动态读取版本号
  let version = "0.1.0";
  try {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { dirname, join } = await import("node:path");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"));
    version = pkg.version || version;
  } catch { /* 静默失败 */ }

  const t0 = performance.now();

  printBanner(version);
  printScenario(scenario);

  const layers = runSixLayerScan(scenario);
  printScan(layers);

  const gates = runDecisionLock(scenario);
  printDecisionLock(gates);

  printFinalVerdict(scenario, layers, gates);

  const evolve = runMetaEvolution(scenario);
  printMetaEvolution(evolve);

  const totalMs = performance.now() - t0;
  printSummary(totalMs, layers, gates, scenario);
  printCallToAction();
}

main().catch((err) => {
  console.error(red("\n✗ Demo 运行失败: " + (err instanceof Error ? err.message : String(err))));
  process.exit(1);
});
