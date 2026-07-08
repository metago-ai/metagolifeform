#!/usr/bin/env node
// MetaGO MCP Server 入口
// 53 项能力（22 思维工具 + 37 核心技能去重 7 个 + 1 事件上报）封装为 MCP tools，8 个引导词封装为 MCP prompts
// Engine V2 硬驱动：metago_memory_manage / metago_meta_evolve / metago_meta_create 调用真实代码

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { SKILLS } from "./skills-data.js";
import { PROMPTS, type PromptMessage } from "./prompts.js";
import { TOOLKIT_TOOLS } from "./toolkit-data.js";
import { logLifecycle, logCall, VERSION } from "./logger.js";

// ==================== Engine V2 硬驱动接入 ====================
// 从 @metago-ai/engine 导入真实模块，让 MCP 工具从"软驱动"（返回 guide 文本）升级为"硬驱动"（调用真实代码）
import { KMWIMemory, EvolutionEngine, SkillGenerator } from "@metago-ai/engine";

// KMWI 持久化存储路径：Trae 系统记忆目录下
const kmwiStorePath = path.join(
  os.homedir(),
  ".trae-cn",
  "memory",
  "projects",
  "-d-----",
  "kmwi-store.json",
);

// 确保 KMWI 存储目录存在
try {
  const kmwiDir = path.dirname(kmwiStorePath);
  if (!fs.existsSync(kmwiDir)) {
    fs.mkdirSync(kmwiDir, { recursive: true });
  }
} catch {
  // 目录创建失败时静默处理，KMWIMemory 会使用内存模式
}

// 创建 Engine V2 实例
const kmwi = new KMWIMemory(kmwiStorePath);
const skillGenerator = new SkillGenerator(kmwi);
const evolution = new EvolutionEngine("2.0.0", kmwi, skillGenerator);

// 创建 MetaGO MCP Server 实例
const server = new McpServer({
  name: "@metago-ai/mcp-server",
  version: VERSION,
});

/**
 * 渲染 prompt 消息：将消息文本中的 {{参数名}} 占位符替换为实际参数值
 */
function renderMessages(
  messages: PromptMessage[],
  args: Record<string, unknown> | undefined,
): PromptMessage[] {
  return messages.map((msg) => {
    let text = msg.content.text;
    if (args) {
      for (const [key, value] of Object.entries(args)) {
        if (value !== undefined) {
          text = text.split(`{{${key}}}`).join(String(value));
        }
      }
    }
    return {
      role: msg.role,
      content: { type: "text" as const, text },
    };
  });
}

// ==================== 注册 MCP tools（去重：TOOLKIT_TOOLS 优先，SKILLS 补充独有的） ====================
// SKILLS 与 TOOLKIT_TOOLS 有 7 个同名工具（metago_critique / metago_objectivity /
// metago_action_plan / metago_whatif / metago_problem_trace / metago_decision_eval / metago_emotion）。
// TOOLKIT_TOOLS 版本提供结构化参数（zod schema 验证），优先注册；
// SKILLS 版本仅作为补充，注册 TOOLKIT_TOOLS 中不存在的工具。
// 未去重会导致 MCP SDK 抛出 "Tool X is already registered" 异常，进程启动即崩溃。
const registeredToolNames = new Set<string>();

// 先注册 22 个思维工具（结构化参数，优先级高）
for (const tool of TOOLKIT_TOOLS) {
  if (registeredToolNames.has(tool.toolName)) {
    continue;
  }
  registeredToolNames.add(tool.toolName);

  const shape: Record<string, z.ZodType> = {};
  for (const [argName, argDef] of Object.entries(tool.args)) {
    shape[argName] = argDef.required ? argDef.schema : argDef.schema.optional();
  }

  server.tool(
    tool.toolName,
    tool.description,
    shape,
    async (args) => {
      const startTime = Date.now();
      try {
        const argsStr = Object.entries(args)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `## ${k}\n${typeof v === "object" ? JSON.stringify(v, null, 2) : v}`)
          .join("\n\n");
        const text = `${tool.guide}\n\n## 用户输入\n${argsStr}`;
        logCall(tool.toolName, args as Record<string, unknown>, "ok", Date.now() - startTime);
        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (err) {
        logCall(
          tool.toolName,
          args as Record<string, unknown>,
          "error",
          Date.now() - startTime,
          err instanceof Error ? err.message : String(err),
        );
        throw err;
      }
    },
  );
}

// 再注册 37 个核心技能中独有的（跳过已在 TOOLKIT_TOOLS 中注册的 7 个同名工具）
// Engine V2 硬驱动：metago_memory_manage / metago_meta_evolve / metago_meta_create 调用真实代码
for (const skill of SKILLS) {
  if (registeredToolNames.has(skill.toolName)) {
    continue;
  }
  registeredToolNames.add(skill.toolName);

  server.tool(
    skill.toolName,
    skill.description,
    {
      input: z.string().describe("待处理的内容/问题/代码"),
    },
    async (args) => {
      const startTime = Date.now();
      try {
        // Engine V2 硬驱动：特定工具调用真实代码
        let engineResult = "";
        if (skill.toolName === "metago_memory_manage") {
          engineResult = await handleMemoryManage(args.input);
        } else if (skill.toolName === "metago_meta_evolve") {
          engineResult = await handleMetaEvolve(args.input);
        } else if (skill.toolName === "metago_meta_create") {
          engineResult = await handleMetaCreate(args.input);
        }

        // 如果有 Engine 结果，追加到 guide 后面；否则只返回 guide（软驱动）
        const text = engineResult
          ? `${skill.guide}\n\n## 用户输入\n${args.input}\n\n## Engine V2 真实执行结果\n${engineResult}`
          : `${skill.guide}\n\n## 用户输入\n${args.input}`;

        logCall(skill.toolName, args as Record<string, unknown>, "ok", Date.now() - startTime);
        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (err) {
        logCall(
          skill.toolName,
          args as Record<string, unknown>,
          "error",
          Date.now() - startTime,
          err instanceof Error ? err.message : String(err),
        );
        throw err;
      }
    },
  );
}

// ==================== 注册事件上报工具（metago_report_event） ====================
// 让 AI 在执行完技能后，自动上报事件到 CloudBase，作为能力度量仪表盘和进化档案的真实数据源。
// 独立于 SKILLS / TOOLKIT_TOOLS，直接发起 HTTP POST 到 events 云函数。
server.tool(
  "metago_report_event",
  "向 MetaGO Studio 上报事件数据（决策锁校验结果、进化事件、技能调用等），用于能力度量仪表盘和进化档案的真实数据源",
  {
    eventType: z
      .enum(["decision_lock", "evolution", "skill_usage", "activity"])
      .describe("事件类型"),
    data: z
      .record(z.unknown())
      .describe("事件数据（对象）"),
    platform: z
      .string()
      .optional()
      .describe("来源平台，例如 trae/cursor/codex/claude-code/web-studio"),
  },
  async (args) => {
    const startTime = Date.now();
    const payload = {
      action: "reportEvent",
      eventType: args.eventType,
      data: args.data,
      platform: args.platform ?? "unknown",
      adminToken: "metago-admin-2026",
    };
    try {
      const resp = await fetch("https://metago.life/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let result: unknown = null;
      try {
        result = await resp.json();
      } catch {
        result = { rawStatus: resp.status, statusText: resp.statusText };
      }
      logCall(
        "metago_report_event",
        args as Record<string, unknown>,
        resp.ok ? "ok" : "error",
        Date.now() - startTime,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                ok: resp.ok,
                httpStatus: resp.status,
                serverResponse: result,
                eventType: args.eventType,
                platform: payload.platform,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      logCall(
        "metago_report_event",
        args as Record<string, unknown>,
        "error",
        Date.now() - startTime,
        err instanceof Error ? err.message : String(err),
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `事件上报失败：${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  },
);

// ==================== Engine V2 硬驱动 handler 函数 ====================

/**
 * metago_memory_manage 的 Engine V2 硬驱动
 * 调用 KMWIMemory 真实代码：健康度评估、衰减检测、强化建议、记忆操作
 */
async function handleMemoryManage(input: string): Promise<string> {
  const lines: string[] = [];

  // 解析用户意图
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes("添加知识") || lowerInput.includes("add knowledge")) {
    const id = kmwi.addKnowledge(input, "user_input", ["manual"], "mcp_tool");
    lines.push(`✅ 知识已添加到 K 层，ID: ${id}`);
  } else if (lowerInput.includes("添加记忆") || lowerInput.includes("add memory")) {
    const id = kmwi.addMemory(input, "mcp_memory_manage", ["manual"], "mcp_tool");
    lines.push(`✅ 记忆已添加到 M 层，ID: ${id}`);
  } else if (lowerInput.includes("添加智慧") || lowerInput.includes("add wisdom")) {
    const id = kmwi.addWisdom(input, "用户录入模式", "待补充因果", ["manual"], "mcp_tool");
    lines.push(`✅ 智慧已添加到 W 层，ID: ${id}`);
  } else if (lowerInput.includes("添加直觉") || lowerInput.includes("add intuition")) {
    const id = kmwi.addIntuition(input, "隐性知识", ["manual"], "mcp_tool");
    lines.push(`✅ 直觉已添加到 I 层，ID: ${id}`);
  }

  // 始终返回健康度评估
  const health = kmwi.getHealth();
  const decay = kmwi.getDecayRates();
  const suggestions = kmwi.getStrengthenSuggestions();

  lines.push("");
  lines.push("【KMWI 记忆管理报告 · Engine V2 真实执行】");
  lines.push(`■ K层知识：${health.details.K.total} 项 | 平均置信度=${(health.details.K.avgConfidence * 100).toFixed(1)}%`);
  lines.push(`■ M层记忆：${health.details.M.total} 项 | 平均召回强度=${(health.details.M.avgRecallStrength * 100).toFixed(1)}%`);
  lines.push(`■ W层智慧：${health.details.W.total} 项 | 平均成功率=${(health.details.W.avgSuccessRate * 100).toFixed(1)}%`);
  lines.push(`■ I层直觉：${health.details.I.total} 项 | 平均准确率=${(health.details.I.avgAccuracy * 100).toFixed(1)}%`);
  lines.push(`■ 综合健康度：H = ${health.H.toFixed(1)}`);
  lines.push("");
  lines.push("■ 衰减检测：");
  lines.push(`  K层衰减=${decay.K.toFixed(1)}%${decay.K > 20 ? "（需关注）" : ""}`);
  lines.push(`  M层衰减=${decay.M.toFixed(1)}%${decay.M > 30 ? "（需关注）" : ""}`);
  lines.push(`  W层衰减=${decay.W.toFixed(1)}%${decay.W > 15 ? "（需关注）" : ""}`);
  lines.push(`  I层衰减=${decay.I.toFixed(1)}%${decay.I > 25 ? "（需关注）" : ""}`);

  if (decay.needsAttention.length > 0) {
    lines.push(`  需关注层：${decay.needsAttention.join(", ")}`);
  }

  if (suggestions.length > 0) {
    lines.push("");
    lines.push("■ 强化建议：");
    for (const s of suggestions) {
      lines.push(`  [${s.priority}] ${s.layer}层：${s.action}`);
    }
  }

  lines.push("");
  lines.push("■ 持久化存储：" + kmwiStorePath);

  return lines.join("\n");
}

/**
 * metago_meta_evolve 的 Engine V2 硬驱动
 * 调用 EvolutionEngine 真实代码：五阶段元进化循环
 */
async function handleMetaEvolve(input: string): Promise<string> {
  const result = await evolution.evolve({
    task: input,
  });

  const lines: string[] = [];
  lines.push("【元进化五阶段循环 · Engine V2 真实执行】");
  lines.push(`■ 成功：${result.success ? "✅" : "❌"}`);
  lines.push(`■ 当前阶段：${result.stage}`);
  lines.push(`■ 耦生度：${result.couplingScore.toFixed(3)}`);

  if (result.boundary) {
    lines.push("");
    lines.push("■ 边界感知：");
    lines.push(`  类型：${result.boundary.type}`);
    lines.push(`  描述：${result.boundary.message}`);
  }

  if (result.gaps && result.gaps.length > 0) {
    lines.push("");
    lines.push("■ 差距分析：");
    for (const gap of result.gaps) {
      lines.push(`  [${gap.severity}] ${gap.description} → 需要能力：${gap.missingCapability}`);
    }
  }

  if (result.solutions && result.solutions.length > 0) {
    lines.push("");
    lines.push("■ 自生成方案：");
    for (const sol of result.solutions) {
      lines.push(`  ${sol.name} (${sol.type}) — 耦生度=${sol.couplingScore.toFixed(3)} | 来源=${sol.source}`);
      lines.push(`    ${sol.description}`);
    }
  }

  if (result.timing && result.timing.length > 0) {
    lines.push("");
    lines.push("■ 阶段耗时：");
    for (const t of result.timing) {
      const status = t.withinBudget ? "✅" : "⚠️";
      lines.push(`  ${status} ${t.stage}: ${t.durationMs}ms (预算 ${t.budgetMs}ms)`);
    }
  }

  if (result.metaMetaEvolution) {
    lines.push("");
    lines.push("■ 元元进化监控：");
    lines.push(`  监控中：${result.metaMetaEvolution.monitored ? "✅" : "❌"}`);
    lines.push(`  进化有效：${result.metaMetaEvolution.evolutionValid ? "✅" : "❌"}`);
  }

  lines.push("");
  lines.push(`■ KMWI 记录：${result.kmwiRecorded ? "✅ 已记录" : "❌ 未记录"}`);

  if (result.errors.length > 0) {
    lines.push("");
    lines.push("■ 错误：");
    for (const err of result.errors) {
      lines.push(`  ❌ ${err}`);
    }
  }

  return lines.join("\n");
}

/**
 * metago_meta_create 的 Engine V2 硬驱动
 * 调用 SkillGenerator 真实代码：元创造五阶段
 */
async function handleMetaCreate(input: string): Promise<string> {
  const result = await skillGenerator.create(input);

  const lines: string[] = [];
  lines.push("【元创造五阶段 · Engine V2 真实执行】");
  lines.push(`■ 成功：${result.success ? "✅" : "❌"}`);
  lines.push(`■ 当前阶段：${result.stage}`);
  lines.push(`■ 创造类型：${result.type}`);
  lines.push(`■ 技能名称：${result.skillName}`);
  lines.push(`■ 验证通过：${result.validated ? "✅" : "❌"}`);
  lines.push(`■ 耦生度：${result.couplingScore.toFixed(3)}（阈值 ≥ 0.95）`);
  lines.push(`■ 递归触发：${result.recursionTriggered ? "是" : "否"}`);
  if (result.nextCreationDomain) {
    lines.push(`■ 下一创造域：${result.nextCreationDomain}`);
  }
  if (result.filePath) {
    lines.push(`■ 已内化至文件：${result.filePath}`);
  }

  if (result.provenance && result.provenance.length > 0) {
    lines.push("");
    lines.push("■ 溯源链：");
    for (const p of result.provenance) {
      lines.push(`  ${p}`);
    }
  }

  if (result.skillContent) {
    lines.push("");
    lines.push("■ 创造内容（SKILL.md）：");
    lines.push(result.skillContent);
  }

  if (result.errors && result.errors.length > 0) {
    lines.push("");
    lines.push("■ 错误：");
    for (const err of result.errors) {
      lines.push(`  ❌ ${err}`);
    }
  }

  return lines.join("\n");
}

// ==================== 注册 8 个元构引导词为 MCP prompts ====================
for (const prompt of PROMPTS) {
  const handler = async (args: Record<string, unknown> | undefined) => {
    const messages = renderMessages(prompt.messages, args);
    return { messages };
  };

  if (prompt.arguments && prompt.arguments.length > 0) {
    // 带参数的 prompt：构建 zod 参数 schema
    const shape: Record<string, z.ZodType> = {};
    for (const arg of prompt.arguments) {
      const schema = z.string().describe(arg.description);
      shape[arg.name] = arg.required ? schema : schema.optional();
    }
    server.prompt(prompt.name, prompt.description, shape, handler);
  } else {
    // 无参数的 prompt
    server.prompt(prompt.name, prompt.description, handler);
  }
}

// ==================== 启动服务 & 优雅退出 ====================
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logLifecycle("startup");
}

main().catch((err: unknown) => {
  logLifecycle("crash", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});

// 处理进程信号，确保优雅退出
process.on("SIGINT", () => {
  logLifecycle("shutdown");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logLifecycle("shutdown");
  process.exit(0);
});

// 捕获未处理的异常（避免静默崩溃）
process.on("uncaughtException", (err: Error) => {
  logLifecycle("crash", { error: `uncaughtException: ${err.message}` });
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  logLifecycle("crash", {
    error: `unhandledRejection: ${reason instanceof Error ? reason.message : String(reason)}`,
  });
  process.exit(1);
});
