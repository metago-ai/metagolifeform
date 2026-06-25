#!/usr/bin/env node
// MetaGO MCP Server 入口
// 将 22 个元构技能封装为 MCP tools，8 个引导词封装为 MCP prompts
// 任何 MCP 客户端（Claude Desktop / Cursor / Trae 等）即开即用

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SKILLS } from "./skills-data.js";
import { PROMPTS, type PromptMessage } from "./prompts.js";

// 创建 MetaGO MCP Server 实例
const server = new McpServer({
  name: "@metago-ai/mcp-server",
  version: "1.0.0",
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

// ==================== 注册 22 个元构技能为 MCP tools ====================
for (const skill of SKILLS) {
  server.tool(
    skill.toolName,
    skill.description,
    {
      input: z.string().describe("待处理的内容/问题/代码"),
    },
    async (args) => {
      const text = `${skill.guide}\n\n## 用户输入\n${args.input}`;
      return {
        content: [{ type: "text" as const, text }],
      };
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
  console.error("[@metago-ai/mcp-server] 服务已启动，等待客户端连接...");
}

main().catch((err: unknown) => {
  console.error("[@metago-ai/mcp-server] 致命错误:", err);
  process.exit(1);
});

// 处理进程信号，确保优雅退出
process.on("SIGINT", () => {
  console.error("[@metago-ai/mcp-server] 收到 SIGINT，正在退出...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error("[@metago-ai/mcp-server] 收到 SIGTERM，正在退出...");
  process.exit(0);
});
