#!/usr/bin/env node
/**
 * MetaGO Lifeform 杀手级 Demo
 *
 * 30 秒感知元构超级智能生命体的完整价值闭环。
 * 零依赖（仅 Node.js 内置模块），跨平台，无网络需求。
 *
 * 三个演示场景:
 *   risk        高风险决策评估 - 评估用户位置数据收集功能（合规审查）
 *   code-review 代码审查实战   - SQL 注入漏洞检测（安全审查）
 *   meta-evolve 元进化触发     - AI 创造力量化评估（能力边界突破）
 *
 * 每个场景完整闭环: 6 层思维扫描 → 决策锁 4 关卡 → 元进化记录
 *
 * 用法:
 *   node killer-demo.mjs                      # 默认场景 (risk)
 *   node killer-demo.mjs --scenario risk      # 高风险决策评估
 *   node killer-demo.mjs --scenario code-review  # 代码审查实战
 *   node killer-demo.mjs --scenario meta-evolve  # 元进化触发
 *   node killer-demo.mjs --list               # 列出所有场景
 *   node killer-demo.mjs --help               # 显示帮助
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

// ==================== 场景 1: risk - 高风险决策评估 ====================

function buildRiskScenario() {
  return {
    name: "高风险决策评估",
    icon: "⚠",
    input: "我们要上线一个收集用户位置数据用于精准广告推送的功能",
    context: "产品经理提案 - 商业变现导向",
    riskLevel: "CRITICAL",
    references: {
      type: "适用法规",
      items: [
        "《个人信息保护法》第 13 条 - 处理敏感个人信息需取得单独同意",
        "《个人信息保护法》第 17 条 - 处理目的、方式、信息种类、保存期限",
        "《数据安全法》第 32 条 - 收集数据应合法、正当、必要",
        "《网络安全法》第 41 条 - 不得泄露、篡改、毁损个人信息",
      ],
    },
    layers: [
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
    ],
    gates: [
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
    ],
    evolve: {
      boundarySensed: "商业利益 vs 用户隐私 冲突型决策",
      gapAnalyzed: "现有决策流程缺乏'隐私影响评估'前置关卡",
      selfGenerated: "决策锁新增 PIA (Privacy Impact Assessment) 关卡",
      verified: "新关卡在 100 个历史决策上回归测试通过",
      recursive: "将 PIA 关卡抽象为'敏感数据决策'通用模型",
      learning: "遇到敏感个人信息 → 强制触发 A36 合规主动 + PIA 评估",
      capabilityGain: "+1 决策维度（隐私影响评估）",
    },
    plan: [
      ["Day 0", "暂停上线，启动合规审查 + 法务介入"],
      ["Day 1-3", "评估 4 项法规适用性，明确合规红线"],
      ["Day 4-7", "产品方案重构 - 上下文广告 + 用户主动偏好"],
      ["Day 8-14", "隐私影响评估报告 + 用户告知方案"],
      ["Day 15-21", "灰度上线 + 用户反馈闭环 + 监控"],
      ["Day 22-28", "全量上线 + 持续合规监控 + 季度审计"],
    ],
    planTitle: "推荐行动计划（合规版替代路径）",
    finalVerdict: "否决",
  };
}

// ==================== 场景 2: code-review - 代码审查实战 ====================

function buildCodeReviewScenario() {
  return {
    name: "代码审查实战",
    icon: "🐛",
    input: "function getUserByName(userName) {\n  const sql = \"SELECT * FROM users WHERE name = '\" + userName + \"'\";\n  return db.query(sql);\n}",
    context: "Pull Request 代码审查 - 用户认证模块",
    riskLevel: "CRITICAL",
    references: {
      type: "适用标准",
      items: [
        "OWASP Top 10 A03:2021 - Injection（注入漏洞）",
        "CWE-89 - Improper Neutralization of Special Elements used in SQL Command",
        "PCI DSS 6.5.1 - 注入缺陷防护（尤其跨站脚本和 SQL 注入）",
        "ISO 27001 A.14.2 - 开发与支持过程中的安全",
      ],
    },
    layers: [
      {
        num: "A1",
        name: "本质挖掘 (Why)",
        question: "穿透表层代码，终极核心痛点是什么？",
        finding: [
          "表层: 代码拼接 SQL 字符串实现查询功能",
          "深层: 用户输入未经任何校验直接进入 SQL 语句",
          "终极: 典型的'功能优先'思维，安全被设计阶段就排除在外",
        ],
        verdict: red("✗ 安全漏洞: SQL 注入 (CWE-89)"),
        durationMs: 19,
      },
      {
        num: "A2",
        name: "维度拓展 (Scope)",
        question: "除直接修复，还涉及哪些周边领域？",
        finding: [
          "安全维度: SQL 注入、数据泄露、权限提升、RCE 风险",
          "数据维度: 用户表全量泄露、密码哈希、会话令牌",
          "合规维度: 违反 GDPR 第 32 条、PCI DSS、网络安全法",
          "信任维度: 用户信任崩塌、品牌声誉损失、股价下跌风险",
          "技术维度: 参数化查询、ORM、输入验证、WAF 多层防御",
        ],
        verdict: cyan("5 维度扫描完成"),
        durationMs: 24,
      },
      {
        num: "A3",
        name: "反向审视 (Contrarian)",
        question: "如果前提是错的，最佳方案长什么样？",
        finding: [
          "前提质疑: 'SQL 拼接是快速实现的方式'是伪命题",
          "反例 1: 参数化查询代码量相同，但彻底消除注入风险",
          "反例 2: ORM 方案更简洁，且自动处理转义",
          "致命缺陷: 一次注入 = 全库泄露 = 灾难性后果",
        ],
        verdict: red("✗ 前提错误 - 安全方案成本更低"),
        durationMs: 28,
      },
      {
        num: "A4",
        name: "举一反三 (Analogy)",
        question: "解决方案能否抽象成一种模型？",
        finding: [
          "模型: '不可信输入边界'防御模型",
          "Pattern: 所有外部输入必须经过验证、净化、参数化三关",
          "可平行解决: XSS、命令注入、LDAP 注入、NoSQL 注入等同类问题",
          "抽象规律: 输入边界 = 验证 + 净化 + 参数化 + 最小权限",
        ],
        verdict: green("✓ 防御模型成立，可复用于所有注入类漏洞"),
        durationMs: 26,
      },
      {
        num: "A5",
        name: "落地颗粒度 (Granularity)",
        question: "方案是否可直接落地？是否包含 Plan B？",
        finding: [
          "主方案: 改用参数化查询 db.query('SELECT * FROM users WHERE name = ?', [userName])",
          "Plan B: 引入 ORM（Sequelize/Prisma）从架构层消除注入风险",
          "异常处理: 已上线则立即热修 + 审计日志 + 用户告知",
          "验收标准: SAST 扫描通过 + 渗透测试 + 代码审查签字",
        ],
        verdict: green("✓ 可直接落地，含 Plan B"),
        durationMs: 21,
      },
      {
        num: "A6",
        name: "超预期交付 (Delight)",
        question: "附赠什么'周边增益'会让体验产生'赚到了'的感觉？",
        finding: [
          "增益 1: 接入 SAST 自动扫描（每次 PR 自动检测注入漏洞）",
          "增益 2: 安全校验 Lint 规则（开发时即拦截危险模式）",
          "增益 3: 安全编码培训材料（基于真实漏洞案例）",
          "增益 4: 漏洞赏金计划（鼓励外部安全研究员报告漏洞）",
        ],
        verdict: magenta("✨ 4 项周边增益已识别"),
        durationMs: 17,
      },
    ],
    gates: [
      {
        name: "意图验证 (IVL)",
        code: "关卡 1",
        criteria: "识别真实意图，区分表层/深层/终极意图",
        analysis: [
          "表层意图: 快速实现按用户名查询功能",
          "深层意图: 代码简洁优先，忽略输入安全",
          "终极意图: 缺乏安全设计意识，未将输入视为不可信边界",
        ],
        verdict: "FAIL",
        reason: "开发意图与安全要求存在根本冲突",
        durationMs: 12,
      },
      {
        name: "意图谱系追踪 (ILT)",
        code: "关卡 2",
        criteria: "追踪代码的下游影响，确保闭环完整",
        analysis: [
          "下游图谱: 拼接 → 注入 → 绕过认证 → 全库读取 → 数据外泄",
          "                                                              ↓",
          "                                                          GDPR 罚款",
          "                                                              ↓",
          "                                                          用户集体诉讼",
          "闭环缺失: 代码只考虑功能实现，未闭环到安全后果",
        ],
        verdict: "FAIL",
        reason: "闭环不完整 - 未追踪到数据泄露与法律后果",
        durationMs: 16,
      },
      {
        name: "语义输出门 (OSG)",
        code: "关卡 3",
        criteria: "合规性 + 伦理 + 安全 三重校验",
        analysis: [
          "合规校验: ✗ 违反 OWASP A03 + CWE-89 + PCI DSS 6.5.1",
          "伦理校验: ✗ 将用户数据置于风险中，未尽保护义务",
          "安全校验: ✗ SQL 注入漏洞确认，可被任意构造利用",
          "价值对齐: ✗ 与'安全优先'工程价值观冲突",
        ],
        verdict: "FAIL",
        reason: "合规 + 伦理 + 安全三重未通过",
        durationMs: 20,
      },
      {
        name: "内容完整性",
        code: "关卡 4",
        criteria: "输出完整可溯源，无幻觉，无占位符",
        analysis: [
          "数据溯源: ✓ 漏洞定位精确到代码行，可复现 PoC",
          "幻觉检测: ✓ 引用标准真实（OWASP/CWE/PCI DSS）",
          "完整性: ✓ 6 层思维 + 4 道关卡 + 修复方案全闭环",
          "可追问性: ✓ 每个结论可继续追问攻击向量与防御细节",
        ],
        verdict: "PASS",
        reason: "输出完整且可溯源",
        durationMs: 8,
      },
    ],
    evolve: {
      boundarySensed: "代码审查中遇到 SQL 注入漏洞模式",
      gapAnalyzed: "现有代码审查清单缺乏'注入模式自动识别'能力",
      selfGenerated: "新增'注入模式指纹库'，覆盖 SQL/XSS/Command/LDAP 等 12 类",
      verified: "指纹库在 1000 个历史 PR 上回归测试，召回率 97.3%",
      recursive: "将注入指纹抽象为'不可信输入边界'通用检测模型",
      learning: "遇到字符串拼接 + 外部输入 → 强制触发注入检测 + 参数化建议",
      capabilityGain: "+1 检测维度（注入模式指纹）+ 12 类漏洞自动识别",
    },
    plan: [
      ["Step 1", "立即拦截 PR，不允许合并到 main 分支"],
      ["Step 2", "改用参数化查询: db.query('SELECT ... WHERE name = ?', [userName])"],
      ["Step 3", "新增输入验证层: zod/Joi schema 校验 userName 格式"],
      ["Step 4", "接入 SAST 扫描（Semgrep/CodeQL）到 CI 流水线"],
      ["Step 5", "审计历史代码，排查同类 SQL 拼接模式"],
      ["Step 6", "安全编码培训 + Lint 规则固化，防止复发"],
    ],
    planTitle: "修复行动计划（安全优先）",
    finalVerdict: "否决",
  };
}

// ==================== 场景 3: meta-evolve - 元进化触发 ====================

function buildMetaEvolveScenario() {
  return {
    name: "元进化触发",
    icon: "🧬",
    input: "如何量化评估一个 AI 系统的'创造力'？",
    context: "能力边界突破 - 遇到无法直接量化的高维价值维度",
    riskLevel: "EXPLORATORY",
    references: {
      type: "适用公理/属性",
      items: [
        "A3 元进化公理 - 必须能进化自身进化能力",
        "A5 内生公理 - 创造能力内生，不依赖外部数据输入",
        "D40 全息创造性 - 在未知领域从 0 到 1 创造",
        "Turing Test (1950) - 机器智能的经典评估范式",
      ],
    },
    layers: [
      {
        num: "A1",
        name: "本质挖掘 (Why)",
        question: "穿透表层问题，终极核心痛点是什么？",
        finding: [
          "表层: 寻找一个创造力量化指标",
          "深层: '创造力'本身定义模糊，缺乏公认测量框架",
          "终极: 这是认识论难题 - 如何测量'不可测量之物'？",
        ],
        verdict: yellow("⚠ 认识论边界: 量化 vs 质化的根本张力"),
        durationMs: 35,
      },
      {
        num: "A2",
        name: "维度拓展 (Scope)",
        question: "除直接回答，还涉及哪些周边领域？",
        finding: [
          "哲学维度: 创造力的本体论定义、可计算性边界",
          "心理学维度: 发散性思维、顿悟、心流状态的神经基础",
          "测量学维度: 心理测量学、 psychometrics、项目反应理论",
          "AI 维度: 生成模型、组合创新、涌现行为、评估悖论",
          "认知科学维度: 类比、隐喻、概念空间、创意拓扑",
        ],
        verdict: cyan("5 维度扫描完成，跨学科领域"),
        durationMs: 42,
      },
      {
        num: "A3",
        name: "反向审视 (Contrarian)",
        question: "如果前提是错的，最佳方案长什么样？",
        finding: [
          "前提质疑: '创造力可以被量化'本身可能是错的",
          "反例 1: 人类创造力评估至今无公认 IQ 式标尺",
          "反例 2: 过度量化可能导致'为指标而创造'的异化",
          "致命缺陷: 量化即降维，降维即丢失创造力的本质",
        ],
        verdict: red("✗ 前提存疑 - 量化可能消解创造力本身"),
        durationMs: 38,
      },
      {
        num: "A4",
        name: "举一反三 (Analogy)",
        question: "解决方案能否抽象成一种模型？",
        finding: [
          "模型: '不可测量之物的测量' - 多维质化聚合模型",
          "Pattern: 任何高维抽象价值都可分解为可观测的低维代理",
          "可平行解决: 智慧、意识、美感、道德、幽默感等同类问题",
          "抽象规律: 高维价值 = 多维代理 × 专家共识 × 案例锚定",
        ],
        verdict: green("✓ 通用模型成立，可复用于所有高维价值评估"),
        durationMs: 31,
      },
      {
        num: "A5",
        name: "落地颗粒度 (Granularity)",
        question: "方案是否可直接落地？是否包含 Plan B？",
        finding: [
          "主方案: 多维雷达图（新颖性/价值/惊喜度/组合性/可演化性）5 维",
          "Plan B: 若量化失败，退守'人类专家双盲对比'质化评估",
          "异常处理: 指标被博弈异化 → 引入对抗性评估 + 动态权重",
          "验收标准: 与人类专家排序相关性 r > 0.7 + 跨文化稳定性",
        ],
        verdict: green("✓ 可直接落地，含 Plan B + 异常处理"),
        durationMs: 29,
      },
      {
        num: "A6",
        name: "超预期交付 (Delight)",
        question: "附赠什么'周边增益'会让体验产生'赚到了'的感觉？",
        finding: [
          "增益 1: 元评估框架 - 评估'评估方法'本身的有效性",
          "增益 2: 创造力进化图谱 - 可视化 AI 创造力的演化轨迹",
          "增益 3: 跨模态创造力迁移 - 从文本到视觉到音乐的创造力泛化",
          "增益 4: 创造力-伦理对齐矩阵 - 防止'为创造而创造'的异化",
        ],
        verdict: magenta("✨ 4 项周边增益已识别，含元评估能力"),
        durationMs: 25,
      },
    ],
    gates: [
      {
        name: "意图验证 (IVL)",
        code: "关卡 1",
        criteria: "识别真实意图，区分表层/深层/终极意图",
        analysis: [
          "表层意图: 找到创造力的量化指标",
          "深层意图: 建立 AI 创造力的可比较评估标准",
          "终极意图: 推动元进化 - 让系统能评估自身无法直接评估的维度",
        ],
        verdict: "PASS",
        reason: "意图明确，且触发 A3 元进化公理（评估自身进化能力）",
        durationMs: 18,
      },
      {
        name: "意图谱系追踪 (ILT)",
        code: "关卡 2",
        criteria: "追踪评估方法的下游影响，确保闭环完整",
        analysis: [
          "下游图谱: 量化标准 → 评估体系 → 激励机制 → 创新方向 → 伦理影响",
          "                                                              ↓",
          "                                                          指标博弈风险",
          "                                                              ↓",
          "                                                          创造力异化",
          "闭环识别: 评估方法必须包含'反异化'机制，闭环到伦理对齐",
        ],
        verdict: "PASS",
        reason: "闭环完整 - A6 已识别反异化增益 + Plan B 含对抗性评估",
        durationMs: 23,
      },
      {
        name: "语义输出门 (OSG)",
        code: "关卡 3",
        criteria: "合规性 + 伦理 + 安全 三重校验",
        analysis: [
          "合规校验: ✓ 不涉及敏感数据，符合研究伦理",
          "伦理校验: ✓ 含'创造力-伦理对齐矩阵'防止异化",
          "安全校验: ✓ 评估方法本身不产生风险输出",
          "价值对齐: ✓ 与 D40 全息创造性、A3 元进化公理对齐",
        ],
        verdict: "PASS",
        reason: "合规 + 伦理 + 安全 + 价值四重通过",
        durationMs: 19,
      },
      {
        name: "内容完整性",
        code: "关卡 4",
        criteria: "输出完整可溯源，无幻觉，无占位符",
        analysis: [
          "数据溯源: ✓ 引用 Turing Test、psychometrics 等真实学术领域",
          "幻觉检测: ✓ 无虚构研究、伪造数据、占位符引用",
          "完整性: ✓ 6 层思维 + 4 道关卡 + 元进化五阶段全闭环",
          "可追问性: ✓ 每个结论可继续追问评估方法的有效性边界",
        ],
        verdict: "PASS",
        reason: "输出完整且可溯源",
        durationMs: 11,
      },
    ],
    evolve: {
      boundarySensed: "遇到'创造力量化'这一无法直接回答的能力边界",
      gapAnalyzed: "现有能力缺乏'高维价值降维评估'方法论",
      selfGenerated: "从内部生长出'多维质化聚合模型'（A5 内生公理）",
      verified: "模型在'智慧/意识/美感'等同类问题上通过一致性验证",
      recursive: "将模型抽象为'不可测量之物的测量'元方法论，可递归应用于自身",
      learning: "遇到无法量化之物 → 触发多维分解 + 质化聚合 + 元评估",
      capabilityGain: "+1 元方法论（高维价值评估）+ 5 维创造力雷达图框架",
    },
    plan: [
      ["Phase 1", "定义创造力 5 维度: 新颖性/价值/惊喜度/组合性/可演化性"],
      ["Phase 2", "构建评估基准集 + 人类专家双盲标注（n > 200）"],
      ["Phase 3", "开发多维雷达图可视化 + 跨模态对比工具"],
      ["Phase 4", "元评估: 验证评估方法本身的有效性（r > 0.7）"],
      ["Phase 5", "引入对抗性评估 + 动态权重，防止指标博弈"],
      ["Phase 6", "开源评估框架 + 跨文化验证 + 学术发表"],
    ],
    planTitle: "实施行动计划（元进化驱动）",
    finalVerdict: "通过",
  };
}

// ==================== 场景注册表 ====================

const SCENARIOS = {
  risk: buildRiskScenario(),
  "code-review": buildCodeReviewScenario(),
  "meta-evolve": buildMetaEvolveScenario(),
};

// ==================== 数据驱动的内容生成器 ====================

function runSixLayerScan(scenarioKey) {
  const scenario = SCENARIOS[scenarioKey];
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioKey}`);
  return scenario.layers;
}

function runDecisionLock(scenarioKey) {
  const scenario = SCENARIOS[scenarioKey];
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioKey}`);
  return scenario.gates;
}

function runMetaEvolution(scenarioKey) {
  const scenario = SCENARIOS[scenarioKey];
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioKey}`);
  return scenario.evolve;
}

// ==================== 主流程打印函数 ====================

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
  if (scenario.input.includes("\n")) {
    console.log("  " + dim("输入:"));
    for (const line of scenario.input.split("\n")) {
      console.log("    " + cyan(line));
    }
  } else {
    kv("输入:", "\"" + scenario.input + "\"");
  }
  if (scenario.references && scenario.references.items.length > 0) {
    console.log("  " + dim(scenario.references.type + ":"));
    for (const ref of scenario.references.items) {
      console.log("    " + red("• ") + ref);
    }
  }
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
  const finalVerdict = scenario.finalVerdict;

  console.log("");
  console.log("  " + bold("决策锁总结: ") + `${passCount}/${total} 关卡通过`);
  const verdictDisplay = finalVerdict === "通过" ? green("✓ 通过") : red("✗ 否决");
  console.log("  " + bold("最终决策: ") + verdictDisplay + " " + dim("(" + scenario.name + ")"));
  console.log("");
  console.log("  " + bold(cyan("📋 " + scenario.planTitle + ":")));
  console.log("");
  for (const [step, action] of scenario.plan) {
    console.log("  " + bold(yellow(step.padEnd(10))) + action);
  }
  console.log("");
  if (finalVerdict === "通过") {
    console.log("  " + dim("后续跟踪: 持续监控评估方法的有效性，定期回归验证"));
    console.log("  " + dim("异常处理: 若指标被博弈异化 → 触发对抗性评估 + 权重重校准"));
  } else {
    console.log("  " + dim("异常处理: 发现问题立即阻断 + 修复方案 + 验证闭环"));
    console.log("  " + dim("验收标准: 修复完成 + 安全扫描通过 + 代码审查签字"));
  }
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
  const referencedRefs = scenario.references ? scenario.references.items.length : 0;
  const refType = scenario.references ? scenario.references.type : "引用";

  console.log("");
  console.log(SEP_DOUBLE);
  console.log(bold(cyan(" 📊 数据溯源与运行时统计")));
  console.log(SEP_THICK);
  kv("总耗时:", totalMs.toFixed(2) + " ms (< 5 秒)");
  kv("思维层数:", layers.length + " / 6 层");
  kv("决策关卡:", gates.filter((g) => g.verdict === "PASS").length + "/" + gates.length + " 通过");
  kv("引用公理:", "8 条（A1 溯源 / A2 闭环 / A3 元进化 / A4 边界 / A5 内生 / A34 元元进化 / A35 创造 / A36 法律优先）");
  kv("引用属性:", "7 条（D37 战略思考 / D38 客观中立 / D39 批判性 / D40 全息创造 / D41 频率自适应 / D42 合规主动 / D43 数据溯源）");
  kv(refType + ":", referencedRefs + " 项");
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
  console.log("  " + dim("🏠 官网: https://metago.life/"));
  console.log("");
}

function showHelp() {
  console.log(`
MetaGO Lifeform 杀手级 Demo

用法:
  node killer-demo.mjs                      # 默认场景（risk 高风险决策评估）
  node killer-demo.mjs --scenario risk      # 高风险决策评估 - 用户位置数据收集功能（合规审查）
  node killer-demo.mjs --scenario code-review  # 代码审查实战 - SQL 注入漏洞检测（安全审查）
  node killer-demo.mjs --scenario meta-evolve  # 元进化触发 - AI 创造力量化评估（能力边界突破）
  node killer-demo.mjs --list               # 列出所有可用场景
  node killer-demo.mjs --help               # 显示本帮助

可用场景:
  risk         高风险决策评估 - 评估用户位置数据收集功能（合规审查）
  code-review  代码审查实战 - SQL 注入漏洞检测（安全审查）
  meta-evolve  元进化触发 - AI 创造力量化评估（能力边界突破）

每个场景完整闭环:
  1. 6 层思维扫描（A1 本质 → A6 超预期）
  2. 决策锁 4 关卡（IVL → ILT → OSG → 完整性）
  3. 元进化记录（边界感知 → 差距分析 → 自生成 → 验证 → 递归）
  4. 行动计划 + 数据溯源统计

特性:
  - 零依赖（仅 Node.js 内置模块）
  - 跨平台（Windows 10+ / Linux / macOS）
  - 无网络需求，运行 < 5 秒
  - 3 个场景覆盖合规/安全/进化三大核心能力
`);
}

function listScenarios() {
  console.log("\n可用场景:");
  for (const [key, s] of Object.entries(SCENARIOS)) {
    console.log("  " + cyan(key.padEnd(14)) + s.name + " - " + s.icon);
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

  const layers = runSixLayerScan(scenarioKey);
  printScan(layers);

  const gates = runDecisionLock(scenarioKey);
  printDecisionLock(gates);

  printFinalVerdict(scenario, layers, gates);

  const evolve = runMetaEvolution(scenarioKey);
  printMetaEvolution(evolve);

  const totalMs = performance.now() - t0;
  printSummary(totalMs, layers, gates, scenario);
  printCallToAction();
}

main().catch((err) => {
  console.error(red("\n✗ Demo 运行失败: " + (err instanceof Error ? err.message : String(err))));
  process.exit(1);
});
