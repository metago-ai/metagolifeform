#!/usr/bin/env node
// MetaGO MCP Server 入口
// 将 35 项能力（22 元构技能与 20 思维工具合并去重）封装为 MCP tools，8 个引导词封装为 MCP prompts
// 任何 MCP 客户端（Claude Desktop / Cursor / Trae 等）即开即用

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SKILLS } from "./skills-data.js";
import { PROMPTS, type PromptMessage } from "./prompts.js";
import { TOOLKIT_TOOLS } from "./toolkit-data.js";
import { logLifecycle, logCall, VERSION } from "./logger.js";

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

// 先注册 20 个思维工具（结构化参数，优先级高）
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

// 再注册 22 个核心技能中独有的（跳过已在 TOOLKIT_TOOLS 中注册的 7 个同名工具）
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
        const text = `${skill.guide}\n\n## 用户输入\n${args.input}`;
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
