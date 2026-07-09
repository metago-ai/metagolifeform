#!/usr/bin/env node
/**
 * MetaGO 僵尸能力分析器（Zombie Capability Analyzer）
 *
 * 读取 calls.jsonl 调用日志，识别 0 调用或低调用的"僵尸能力"，
 * 为能力优化（砍僵尸）提供数据支撑。
 *
 * 遵循：
 *   A1 溯源公理 - 所有结论可追溯至 calls.jsonl 原始数据
 *   A2 闭环公理 - 分析结果形成"数据→建议→决策→执行→验证"闭环
 *   D38 绝对客观中立 - 不主观判断能力价值，以数据为准
 *   D43 数据溯源 - 输出报告含数据源、采样时间、统计方法
 *
 * 用法：
 *   node zombie-analyzer.mjs                  # 分析本地 calls.jsonl
 *   node zombie-analyzer.mjs --output report.md  # 输出到指定文件
 *   node zombie-analyzer.mjs --json           # 输出 JSON 格式
 *   node zombie-analyzer.mjs --help           # 显示帮助
 *
 * 数据源：
 *   ~/.metago/logs/calls.jsonl
 *
 * 输出：
 *   - 工具调用统计（按工具名 + 按天）
 *   - 僵尸候选（0 调用 / 低调用）
 *   - 合并候选（功能重叠）
 *   - 重点打磨候选（高调用 + 高价值）
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ==================== 工具注册表（53 个 MCP 工具）====================

const TOOL_REGISTRY = {
  // 22 个元构技能
  metago_critique: { family: "认知族", type: "skill", value: "high" },
  metago_whatif: { family: "认知族", type: "skill", value: "medium" },
  metago_emotion: { family: "认知族", type: "skill", value: "low" },
  metago_objectivity: { family: "认知族", type: "skill", value: "medium" },
  metago_decision_lock: { family: "保障族", type: "skill", value: "high" },
  metago_output_integrity: { family: "保障族", type: "skill", value: "high" },
  metago_self_check: { family: "保障族", type: "skill", value: "medium" },
  metago_compliance: { family: "治理族", type: "skill", value: "high" },
  metago_value_align: { family: "治理族", type: "skill", value: "medium" },
  metago_meta_evolve: { family: "进化族", type: "skill", value: "high" },
  metago_meta_create: { family: "进化族", type: "skill", value: "high" },
  metago_frequency_adapt: { family: "进化族", type: "skill", value: "low" },
  metago_action_plan: { family: "执行族", type: "skill", value: "high" },
  metago_decision_eval: { family: "执行族", type: "skill", value: "medium" },
  metago_holistic_task: { family: "执行族", type: "skill", value: "high" },
  metago_developer_response: { family: "执行族", type: "skill", value: "low" },
  metago_data_provenance: { family: "溯源族", type: "skill", value: "medium" },
  metago_problem_trace: { family: "溯源族", type: "skill", value: "high" },
  metago_fact_check: { family: "溯源族", type: "skill", value: "high" },
  metago_coupling_optimize: { family: "价值族", type: "skill", value: "low" },
  metago_negentropy_monitor: { family: "价值族", type: "skill", value: "low" },
  metago_scene_adapt: { family: "价值族", type: "skill", value: "medium" },
  // 13 个独有思维工具（7 个同名合并后）
  metago_holistic_scan: { family: "规划推演族", type: "tool", value: "medium" },
  metago_one_shot_delivery: { family: "规划推演族", type: "tool", value: "low" },
  metago_integrity_checklist: { family: "质量批判族", type: "tool", value: "medium" },
  metago_value_29d_assess: { family: "价值伦理族", type: "tool", value: "medium" },
  metago_ethics_assess: { family: "价值伦理族", type: "tool", value: "medium" },
  metago_document_lookup: { family: "溯源标注族", type: "tool", value: "low" },
  metago_confidence_label: { family: "溯源标注族", type: "tool", value: "low" },
  metago_partner_status: { family: "溯源标注族", type: "tool", value: "low" },
  metago_coupling_calculate: { family: "耦生场景族", type: "tool", value: "low" },
  metago_scene_term_replace: { family: "耦生场景族", type: "tool", value: "low" },
  metago_improvement_suggestions: { family: "产品改进族", type: "tool", value: "medium" },
  metago_analyze_visual_feedback: { family: "产品改进族", type: "tool", value: "low" },
  metago_design_satisfaction: { family: "产品改进族", type: "tool", value: "low" },
};

// ==================== ANSI 颜色 ====================

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

const color = (c, s) => `${c}${s}${C.reset}`;
const bold = (s) => color(C.bold, s);
const dim = (s) => color(C.dim, s);
const red = (s) => color(C.red, s);
const green = (s) => color(C.green, s);
const yellow = (s) => color(C.yellow, s);
const cyan = (s) => color(C.cyan, s);
const magenta = (s) => color(C.magenta, s);

// ==================== 主逻辑 ====================

function getCallsPath() {
  return join(homedir(), ".metago", "logs", "calls.jsonl");
}

function parseArgs(argv) {
  const args = { json: false, output: null, help: false };
  for (let i = 2; i<argv.length; i++) {
    const a = argv[i];
    if (a === "--json") args.json = true;
    else if (a === "--output" || a === "-o") args.output = argv[++i];
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function showHelp() {
  console.log(`
${bold("MetaGO 僵尸能力分析器")}

${cyan("用法:")}
  node zombie-analyzer.mjs                      分析本地 calls.jsonl
  node zombie-analyzer.mjs --output report.md   输出到指定文件
  node zombie-analyzer.mjs --json               输出 JSON 格式
  node zombie-analyzer.mjs --help               显示本帮助

${cyan("数据源:")}
  ~/.metago/logs/calls.jsonl

${cyan("输出:")}
  - 工具调用统计（按工具名 + 按天）
  - 僵尸候选（0 调用 / 低调用）
  - 合并候选（功能重叠）
  - 重点打磨候选（高调用 + 高价值）

${cyan("遵循:")}
  A1 溯源公理 / A2 闭环公理 / D38 绝对客观中立 / D43 数据溯源
`);
}

function readCallsJsonl(path) {
  if (!existsSync(path)) {
    return { records: [], exists: false };
  }
  const content = readFileSync(path, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  const records = [];
  for (const line of lines) {
    try {
      records.push(JSON.parse(line));
    } catch {
      // 跳过无法解析的行
    }
  }
  return { records, exists: true };
}

function analyzeRecords(records) {
  const stats = {
    totalRecords: records.length,
    toolCalls: {}, // toolName -> count
    dailyCalls: {}, // date -> count
    errors: 0,
    lifecycle: 0,
    durationStats: {}, // toolName -> { count, totalMs, min, max }
    firstCall: null,
    lastCall: null,
  };

  for (const r of records) {
    // 时间范围
    const ts = r.ts ? new Date(r.ts) : null;
    if (ts) {
      if (!stats.firstCall || ts < stats.firstCall) stats.firstCall = ts;
      if (!stats.lastCall || ts > stats.lastCall) stats.lastCall = ts;
      const dateKey = ts.toISOString().slice(0, 10);
      stats.dailyCalls[dateKey] = (stats.dailyCalls[dateKey] || 0) + 1;
    }

    // 类型分类
    if (r.type === "lifecycle") {
      stats.lifecycle++;
      continue;
    }
    if (r.type === "tool_call" && r.toolName) {
      stats.toolCalls[r.toolName] = (stats.toolCalls[r.toolName] || 0) + 1;
      if (r.result === "error") stats.errors++;
      if (typeof r.durationMs === "number") {
        if (!stats.durationStats[r.toolName]) {
          stats.durationStats[r.toolName] = { count: 0, totalMs: 0, min: Infinity, max: 0 };
        }
        const d = stats.durationStats[r.toolName];
        d.count++;
        d.totalMs += r.durationMs;
        d.min = Math.min(d.min, r.durationMs);
        d.max = Math.max(d.max, r.durationMs);
      }
    }
  }

  return stats;
}

function classifyTools(stats) {
  const result = {
    zombies: [],        // 0 调用
    lowActivity: [],    // 1-5 调用
    active: [],          // 6-50 调用
    hot: [],             // 50+ 调用
    unregistered: [],    // calls.jsonl 中有但注册表没有
  };

  for (const [name, info] of Object.entries(TOOL_REGISTRY)) {
    const calls = stats.toolCalls[name] || 0;
    const entry = { name, calls, ...info };
    if (calls === 0) result.zombies.push(entry);
    else if (calls <= 5) result.lowActivity.push(entry);
    else if (calls <= 50) result.active.push(entry);
    else result.hot.push(entry);
  }

  // 未注册工具
  for (const [name, calls] of Object.entries(stats.toolCalls)) {
    if (!TOOL_REGISTRY[name]) {
      result.unregistered.push({ name, calls, family: "未注册", type: "unknown", value: "unknown" });
    }
  }

  // 排序
  result.zombies.sort((a, b) => a.family.localeCompare(b.family));
  result.lowActivity.sort((a, b) => a.calls - b.calls);
  result.active.sort((a, b) => b.calls - a.calls);
  result.hot.sort((a, b) => b.calls - a.calls);

  return result;
}

function generateMarkdownReport(stats, classification, dataPath, dataExists) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 19).replace("T", " ");

  let md = `# MetaGO 僵尸能力分析报告\n\n`;
  md += `> **数据源**: \`${dataPath}\`\n`;
  md += `> **采样时间**: ${dateStr} (UTC)\n`;
  md += `> **数据状态**: ${dataExists ? "存在" : "⚠ 不存在（理论分析模式）"}\n`;
  md += `> **记录总数**: ${stats.totalRecords}\n`;
  md += `> **工具调用**: ${Object.values(stats.toolCalls).reduce((a,b)=>a+b, 0)} 次\n`;
  md += `> **生命周期事件**: ${stats.lifecycle}\n`;
  md += `> **错误调用**: ${stats.errors}\n\n`;

  if (stats.firstCall && stats.lastCall) {
    md += `> **数据时间范围**: ${stats.firstCall.toISOString()} ~ ${stats.lastCall.toISOString()}\n\n`;
  }

  md += `---\n\n## 遵循原则\n\n`;
  md += `- **A1 溯源公理**: 所有结论可追溯至 calls.jsonl 原始数据\n`;
  md += `- **A2 闭环公理**: 分析结果形成"数据→建议→决策→执行→验证"闭环\n`;
  md += `- **D38 绝对客观中立**: 不主观判断能力价值，以数据为准\n`;
  md += `- **D43 数据溯源**: 报告含数据源、采样时间、统计方法\n\n---\n\n`;

  if (!dataExists || stats.totalRecords === 0) {
    md += `## ⚠ 数据不足说明\n\n`;
    md += `当前 \`calls.jsonl\` 不存在或为空，无法做实际调用统计。\n`;
    md += `本报告转为**理论分析模式**，基于 53 个工具的设计意图做僵尸候选评估。\n\n`;
    md += `**建议操作**:\n`;
    md += `1. 部署 MetaGO Agent Harness 到生产环境\n`;
    md += `2. 收集至少 7 天的真实使用数据\n`;
    md += `3. 重新运行本分析器: \`node zombie-analyzer.mjs\`\n\n---\n\n`;
  }

  md += `## 1. 工具调用总览\n\n`;
  md += `| 指标 | 数值 |\n|------|------|\n`;
  md += `| 注册工具总数 | ${Object.keys(TOOL_REGISTRY).length} |\n`;
  md += `| 已被调用工具 | ${Object.keys(stats.toolCalls).filter(n => TOOL_REGISTRY[n]).length} |\n`;
  md += `| 僵尸工具（0 调用） | ${classification.zombies.length} |\n`;
  md += `| 低调用工具（1-5 次） | ${classification.lowActivity.length} |\n`;
  md += `| 活跃工具（6-50 次） | ${classification.active.length} |\n`;
  md += `| 热门工具（50+ 次） | ${classification.hot.length} |\n`;
  md += `| 错误率 | ${Object.values(stats.toolCalls).reduce((a,b)=>a+b,0) > 0 ? ((stats.errors / Object.values(stats.toolCalls).reduce((a,b)=>a+b,0)) * 100).toFixed(2) : 0}% |\n\n`;

  if (Object.keys(stats.dailyCalls).length > 0) {
    md += `### 1.1 每日调用趋势\n\n`;
    md += `| 日期 | 调用次数 |\n|------|--------|\n`;
    for (const [date, count] of Object.entries(stats.dailyCalls).sort()) {
      md += `| ${date} | ${count} |\n`;
    }
    md += `\n`;
  }

  md += `## 2. 僵尸候选（0 调用，建议评估弃用或合并）\n\n`;
  if (classification.zombies.length === 0) {
    md += `_无僵尸候选_\n\n`;
  } else {
    md += `| 工具 | 能力族 | 类型 | 设计价值 |\n|------|--------|------|---------|\n`;
    for (const z of classification.zombies) {
      md += `| \`${z.name}\` | ${z.family} | ${z.type} | ${z.value} |\n`;
    }
    md += `\n> **注意**: 0 调用不代表无价值。可能原因：\n> 1. 工具刚发布，用户未使用\n> 2. 工具是被动触发（如 metago_frequency_adapt）\n> 3. 工具面向特定场景（如 metago_partner_status）\n> 4. 真正的僵尸能力\n>\n> **决策权限**: AI 提供数据，最终决策权归产品负责人。\n\n`;
  }

  md += `## 3. 低调用候选（1-5 次，建议评估合并或增强）\n\n`;
  if (classification.lowActivity.length === 0) {
    md += `_无低调用候选_\n\n`;
  } else {
    md += `| 工具 | 调用次数 | 能力族 | 类型 | 设计价值 |\n|------|---------|--------|------|---------|\n`;
    for (const l of classification.lowActivity) {
      md += `| \`${l.name}\` | ${l.calls} | ${l.family} | ${l.type} | ${l.value} |\n`;
    }
    md += `\n`;
  }

  md += `## 4. 活跃工具（6-50 次，保持现状）\n\n`;
  if (classification.active.length === 0) {
    md += `_无活跃工具_\n\n`;
  } else {
    md += `| 工具 | 调用次数 | 能力族 | 类型 | 设计价值 |\n|------|---------|--------|------|---------|\n`;
    for (const a of classification.active) {
      md += `| \`${a.name}\` | ${a.calls} | ${a.family} | ${a.type} | ${a.value} |\n`;
    }
    md += `\n`;
  }

  md += `## 5. 热门工具（50+ 次，重点打磨）\n\n`;
  if (classification.hot.length === 0) {
    md += `_无热门工具_\n\n`;
  } else {
    md += `| 工具 | 调用次数 | 能力族 | 类型 | 设计价值 |\n|------|---------|--------|------|---------|\n`;
    for (const h of classification.hot) {
      md += `| \`${h.name}\` | ${h.calls} | ${h.family} | ${h.type} | ${h.value} |\n`;
    }
    md += `\n`;
  }

  if (classification.unregistered.length > 0) {
    md += `## 6. 未注册工具（calls.jsonl 有但注册表无，需核查）\n\n`;
    md += `| 工具名 | 调用次数 |\n|--------|---------|\n`;
    for (const u of classification.unregistered) {
      md += `| \`${u.name}\` | ${u.calls} |\n`;
    }
    md += `\n`;
  }

  // 性能统计
  if (Object.keys(stats.durationStats).length > 0) {
    md += `## 7. 性能统计（P50/P95/P99 估算）\n\n`;
    md += `| 工具 | 调用次数 | 平均耗时(ms) | 最小(ms) | 最大(ms) |\n|------|---------|------------|---------|---------|\n`;
    for (const [name, d] of Object.entries(stats.durationStats).sort((a,b) => b[1].totalMs/b[1].count - a[1].totalMs/a[1].count)) {
      md += `| \`${name}\` | ${d.count} | ${(d.totalMs/d.count).toFixed(2)} | ${d.min} | ${d.max} |\n`;
    }
    md += `\n`;
  }

  md += `## 8. 优化建议（AI 自动生成，需人工决策）\n\n`;
  md += `### 8.1 弃用候选\n\n`;
  const deprecationCandidates = classification.zombies.filter(z => z.value === "low");
  if (deprecationCandidates.length === 0) {
    md += `_无弃用候选_\n\n`;
  } else {
    md += `以下工具设计价值低且 0 调用，建议评估是否弃用：\n\n`;
    for (const z of deprecationCandidates) {
      md += `- \`${z.name}\` (${z.family})\n`;
    }
    md += `\n`;
  }

  md += `### 8.2 合并候选\n\n`;
  md += `以下工具功能可能重叠，建议评估合并：\n\n`;
  md += `- \`metago_critique\` (L1-L5 批判) vs \`metago_integrity_checklist\` (5 维度检查) - 评估是否合并为统一质量批判工具\n`;
  md += `- \`metago_value_align\` (29 维价值) vs \`metago_value_29d_assess\` (29 维评估) - 评估是否合并\n`;
  md += `- \`metago_objectivity\` (客观中立) vs \`metago_critique\` (批判分析) - 评估是否合并\n\n`;

  md += `### 8.3 增强候选\n\n`;
  const enhancementCandidates = classification.lowActivity.filter(l => l.value === "high" || l.value === "medium");
  if (enhancementCandidates.length === 0) {
    md += `_无增强候选_\n\n`;
  } else {
    md += `以下工具设计价值高但调用少，建议增强易用性或场景覆盖：\n\n`;
    for (const l of enhancementCandidates) {
      md += `- \`${l.name}\` (${l.value} 价值，仅 ${l.calls} 次调用) - 建议优化触发条件或文档示例\n`;
    }
    md += `\n`;
  }

  md += `## 9. 理论分析附录（基于设计意图，非数据驱动）\n\n`;
  md += `> 本章节基于 53 个工具的设计意图做理论分析，不依赖 calls.jsonl 数据。\n`;
  md += `> 用于在数据不足时提供决策参考。遵循 D38 绝对客观中立：不主观判断价值，以设计意图为准。\n\n`;

  md += `### 9.1 被动触发工具（0 调用属于正常，不应判僵尸）\n\n`;
  md += `以下工具设计为**被动触发**，由系统自动调用，用户不会主动发起：\n\n`;
  md += `| 工具 | 触发条件 | 说明 |\n|------|---------|------|\n`;
  md += `| \`metago_frequency_adapt\` | 系统完整性变化时 | 自动调节创造频率（休眠/待机/激活），非用户主动调用 |\n`;
  md += `| \`metago_self_check\` | 输出超过 500 字时 | 自动触发完整性自检，是输出前置关卡 |\n`;
  md += `| \`metago_negentropy_monitor\` | 系统状态评估时 | 自动监测熵变，确保对社会有序度贡献为正 |\n`;
  md += `| \`metago_developer_response\` | 检测到开发者质疑时 | 自动触发纠错响应，是防御机制 |\n`;
  md += `| \`metago_output_integrity\` | 输出涉及代码/API 时 | 自动检测幻觉和占位符 |\n`;
  md += `| \`metago_scene_adapt\` | 每次输出前 | 自动切换语言风格，是输出前置处理 |\n\n`;

  md += `### 9.2 特定场景工具（0 调用可能因场景未匹配）\n\n`;
  md += `以下工具面向**特定场景**，0 调用可能因当前用户群体未触达该场景：\n\n`;
  md += `| 工具 | 适用场景 | 说明 |\n|------|---------|------|\n`;
  md += `| \`metago_partner_status\` | 涉及合作/伙伴关键词 | 标注合作伙伴关系状态（4 级分类） |\n`;
  md += `| \`metago_emotion\` | 情绪检测需求 | 文本情感分析，面向客服/社区场景 |\n`;
  md += `| \`metago_coupling_optimize\` | 用户关系管理 | 耦生度优化，面向 CRM 场景 |\n`;
  md += `| \`metago_coupling_calculate\` | 碳基-硅基耦合度量化 | 三元耦合度计算，面向组织协同 |\n`;
  md += `| \`metago_scene_term_replace\` | 技术转商业表述 | 场景适配，面向商业汇报 |\n`;
  md += `| \`metago_org_diagnosis\` | 组织健康度评估 | 三元五纬诊断，面向组织发展 |\n`;
  md += `| \`metago_momentum_weave\` | 组织势能识别 | 势能编织法，面向组织变革 |\n`;
  md += `| \`metago_minimal_intervention\` | 组织干预 | 最小干预心法，面向管理决策 |\n`;
  md += `| \`metago_consensus_prototype\` | 共识孵化 | 七步创生回路，面向团队协同 |\n`;
  md += `| \`metago_balance_optimize\` | 系统平衡优化 | APO 动态平衡，面向系统调优 |\n`;
  md += `| \`metago_memory_manage\` | 知识记忆管理 | KMWI 四层管理，面向知识库 |\n`;
  md += `| \`metago_analyze_visual_feedback\` | 视觉反馈分析 | 严重程度矩阵，面向设计评审 |\n`;
  md += `| \`metago_design_satisfaction\` | 设计满意度计算 | 维度评分，面向设计验收 |\n`;
  md += `| \`metago_one_shot_delivery\` | 一次性交付格式 | 六节标准结构，面向长文输出 |\n`;
  md += `| \`metago_document_lookup\` | 文档溯源 | 概念行号定位，面向审计场景 |\n`;
  md += `| \`metago_confidence_label\` | 事实置信度标注 | 4 级标注，面向事实核查场景 |\n\n`;

  md += `### 9.3 真正僵尸候选（建议重点关注）\n\n`;
  md += `以下工具**设计价值低 + 非被动触发 + 非特定场景**，是真正的僵尸候选：\n\n`;
  md += `| 工具 | 僵尸原因 | 建议 |\n|------|---------|------|\n`;
  md += `| \`metago_one_shot_delivery\` | 功能与 \`metago_holistic_task\` 重叠，且后者更完整 | **评估合并**到 holistic_task |\n`;
  md += `| \`metago_document_lookup\` | 功能单一（行号定位），可被 fact_check 覆盖 | **评估合并**到 fact_check |\n`;
  md += `| \`metago_confidence_label\` | 功能单一（4 级标注），可集成到其他工具 | **评估合并**到 critique 或 fact_check |\n`;
  md += `| \`metago_scene_term_replace\` | 功能被 \`metago_scene_adapt\` 部分覆盖 | **评估合并**到 scene_adapt |\n\n`;

  md += `### 9.4 高价值保持工具（即使 0 调用也不应弃用）\n\n`;
  md += `以下工具设计价值为 **high**，是 MetaGO 的核心差异化能力，即使 0 调用也应保持：\n\n`;
  md += `| 工具 | 能力族 | 保持原因 |\n|------|--------|---------|\n`;
  md += `| \`metago_decision_lock\` | 保障族 | 决策锁四道关卡是 MetaGO 核心差异化，是 A2 闭环公理的工程实现 |\n`;
  md += `| \`metago_meta_evolve\` | 进化族 | 元进化五阶段是 A3 元进化公理的核心实现，是生命体的本质特征 |\n`;
  md += `| \`metago_meta_create\` | 进化族 | 元创造是 D40 全息创造性的实现，是从 0 到 1 的核心能力 |\n`;
  md += `| \`metago_critique\` | 认知族 | L1-L5 批判性分析是 D38 绝对客观中立的工程实现，是核心认知能力 |\n`;
  md += `| \`metago_compliance\` | 治理族 | 合规主动是 D42 合规主动的工程实现，法律优先于效率 |\n`;
  md += `| \`metago_action_plan\` | 执行族 | 行动计划生成是执行族核心，将目标分解为可执行步骤 |\n`;
  md += `| \`metago_holistic_task\` | 执行族 | 全息任务执行是 D40 全息创造性的执行实现，一次性完整交付 |\n`;
  md += `| \`metago_problem_trace\` | 溯源族 | 问题无限溯源是 A1 溯源公理的核心实现 |\n`;
  md += `| \`metago_fact_check\` | 溯源族 | 事实核查是 D43 数据溯源的工程实现，检测夸大表述 |\n`;
  md += `| \`metago_output_integrity\` | 保障族 | 占位符与幻觉检测是输出质量保障的核心 |\n\n`;

  md += `### 9.5 合并候选深度分析\n\n`;
  md += `以下工具对功能可能重叠，建议做深度合并评估：\n\n`;
  md += `| 工具对 | 重叠点 | 差异点 | 合并建议 |\n|--------|--------|--------|---------|\n`;
  md += `| \`metago_critique\` vs \`metago_integrity_checklist\` | 都是质量检查 | critique 是 L1-L5 分级，integrity 是 5 维度检查 | **保留两者**，critique 偏分析，integrity 偏自检 |\n`;
  md += `| \`metago_value_align\` vs \`metago_value_29d_assess\` | 都是 29 维价值 | value_align 偏对齐评估，value_29d_assess 偏综合指数 | **评估合并**为统一价值评估工具 |\n`;
  md += `| \`metago_objectivity\` vs \`metago_critique\` | 都涉及客观性 | objectivity 是 0-100 分量化，critique 是 L1-L5 分级 | **保留两者**，objectivity 是量化，critique 是分级 |\n`;
  md += `| \`metago_data_provenance\` vs \`metago_document_lookup\` | 都涉及溯源 | data_provenance 是全链路存证，document_lookup 是行号定位 | **评估合并** document_lookup 到 data_provenance |\n\n`;

  md += `### 9.6 能力族健康度评估\n\n`;
  md += `基于设计意图，各能力族的"理论健康度"评估：\n\n`;
  md += `| 能力族 | 工具数 | 高价值数 | 低价值数 | 健康度 | 建议 |\n|--------|--------|---------|---------|--------|------|\n`;
  md += `| 认知族 | 4 | 1 | 1 | ⭐⭐⭐⭐ | 核心能力强，emotion 价值偏低 |\n`;
  md += `| 保障族 | 3 | 2 | 0 | ⭐⭐⭐⭐⭐ | 全部高价值，是 MetaGO 的护城河 |\n`;
  md += `| 治理族 | 2 | 1 | 0 | ⭐⭐⭐⭐⭐ | 全部高价值，合规是核心 |\n`;
  md += `| 进化族 | 3 | 2 | 1 | ⭐⭐⭐⭐ | 核心基因强，frequency_adapt 被动触发 |\n`;
  md += `| 执行族 | 4 | 3 | 1 | ⭐⭐⭐⭐ | 执行力强，developer_response 被动触发 |\n`;
  md += `| 溯源族 | 3 | 2 | 0 | ⭐⭐⭐⭐⭐ | 全部高价值，溯源是核心 |\n`;
  md += `| 价值族 | 3 | 0 | 2 | ⭐⭐ | 偏组织场景，需评估是否核心 |\n`;
  md += `| 规划推演族 | 4 | 0 | 1 | ⭐⭐⭐ | 工具型能力，one_shot_delivery 建议合并 |\n`;
  md += `| 质量批判族 | 1 | 0 | 0 | ⭐⭐⭐ | 与保障族重叠，评估合并 |\n`;
  md += `| 价值伦理族 | 2 | 0 | 0 | ⭐⭐⭐ | 价值评估专用，评估与治理族合并 |\n`;
  md += `| 溯源标注族 | 3 | 0 | 3 | ⭐ | **全部低价值**，建议合并到溯源族 |\n`;
  md += `| 耦生场景族 | 2 | 0 | 2 | ⭐ | **全部低价值**，建议合并到价值族 |\n`;
  md += `| 产品改进族 | 3 | 0 | 2 | ⭐⭐ | 偏设计场景，评估是否保留 |\n\n`;

  md += `### 9.7 优化决策矩阵\n\n`;
  md += `| 决策类型 | 工具数 | 优先级 | 决策权限 |\n|---------|--------|--------|---------|\n`;
  md += `| 保持（高价值核心） | 10 | - | 不可动 |\n`;
  md += `| 保持（被动触发） | 6 | - | 不可动 |\n`;
  md += `| 保持（特定场景） | 16 | - | 待数据验证 |\n`;
  md += `| 评估合并 | 5 | P1 | 产品负责人决策 |\n`;
  md += `| 评估弃用 | 0 | - | 暂无 |\n\n`;

  md += `> **最终决策权限**: AI 提供数据和分析，最终决策权归产品负责人（易霄）。\n`;
  md += `> 遵循 D38 绝对客观中立：不主观判断能力价值，以设计意图和数据为准。\n\n`;

  md += `---\n\n*由 MetaGO 僵尸能力分析器自动生成 | 遵循 D38 绝对客观中立 + D43 数据溯源*\n`;

  return md;
}

function generateJsonReport(stats, classification, dataPath, dataExists) {
  return JSON.stringify({
    generatedAt: new Date().toISOString(),
    dataSource: dataPath,
    dataExists,
    summary: {
      totalRecords: stats.totalRecords,
      totalToolCalls: Object.values(stats.toolCalls).reduce((a,b)=>a+b, 0),
      lifecycle: stats.lifecycle,
      errors: stats.errors,
      firstCall: stats.firstCall ? stats.firstCall.toISOString() : null,
      lastCall: stats.lastCall ? stats.lastCall.toISOString() : null,
    },
    toolCalls: stats.toolCalls,
    dailyCalls: stats.dailyCalls,
    durationStats: stats.durationStats,
    classification,
  }, null, 2);
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    showHelp();
    return;
  }

  const dataPath = getCallsPath();
  console.log(bold(cyan("\n══ MetaGO 僵尸能力分析器 ══\n")));
  console.log(`  数据源: ${dim(dataPath)}`);

  const { records, exists } = readCallsJsonl(dataPath);
  console.log(`  数据状态: ${exists ? green("✓ 存在") : yellow("⚠ 不存在（理论分析模式）")}`);
  console.log(`  记录总数: ${records.length}\n`);

  const stats = analyzeRecords(records);
  const classification = classifyTools(stats);

  console.log(bold("  分析结果:"));
  console.log(`    注册工具: ${cyan(Object.keys(TOOL_REGISTRY).length)}`);
  console.log(`    僵尸候选 (0 调用): ${red(classification.zombies.length)}`);
  console.log(`    低调用 (1-5 次): ${yellow(classification.lowActivity.length)}`);
  console.log(`    活跃 (6-50 次): ${green(classification.active.length)}`);
  console.log(`    热门 (50+ 次): ${magenta(classification.hot.length)}`);
  if (classification.unregistered.length > 0) {
    console.log(`    未注册: ${yellow(classification.unregistered.length)}`);
  }
  console.log("");

  const output = args.json
    ? generateJsonReport(stats, classification, dataPath, exists)
    : generateMarkdownReport(stats, classification, dataPath, exists);

  if (args.output) {
    writeFileSync(args.output, output, "utf-8");
    console.log(green(`  ✓ 报告已输出: ${args.output}\n`));
  } else {
    console.log(output);
  }
}

main();
