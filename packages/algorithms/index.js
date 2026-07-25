#!/usr/bin/env node
/**
 * mcp_metago-algorithms MCP Server
 * 元构 927 算法 MCP 服务器
 *
 * 提供四层暴露架构：
 *   L1 通用入口（3 工具）：execute / execute_sync / get_algorithm_info
 *   L2 检索发现（4 工具）：list_algorithms / search_algorithms / list_families / get_statistics
 *   L3 高频专用（30 工具）：cosine_similarity / euclidean_distance / ...
 *   L4 族级工具（20 工具）：coupling_calculate / value_assess / ...
 *
 * @version 1.0.0
 * @author 易霄 / MetaGO Lightyear
 * @license MIT
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const path = require('path');
const fs = require('fs');

// ============================================================================
// 引擎加载
// ============================================================================

// 优先使用环境变量；其次相对路径（__dirname 为 mcps/mcp_metago-algorithms，上两级到 .trae-cn）
const ENGINE_DIST = process.env.ENGINE_DIST
  || path.resolve(__dirname, '../../packages/engine/RUNTIME/dist');

let registry;
try {
  const registryPath = path.join(ENGINE_DIST, 'algorithms/registry.js');
  if (!fs.existsSync(registryPath)) {
    throw new Error(`引擎 dist 不存在: ${registryPath}`);
  }
  registry = require(registryPath);
  console.error(`[mcp_metago-algorithms] Engine loaded from ${ENGINE_DIST}`);
} catch (e) {
  console.error(`[mcp_metago-algorithms] FATAL: Cannot load engine from ${ENGINE_DIST}`);
  console.error(`[mcp_metago-algorithms] Error: ${e.message}`);
  process.exit(1);
}

// ============================================================================
// 工具注册表加载
// ============================================================================

const toolRegistry = require('./tool-registry.js');
toolRegistry.initialize(registry);
const schemas = toolRegistry.getAllSchemas();
console.error(`[mcp_metago-algorithms] ${schemas.length} tools registered`);

// ============================================================================
// MCP 服务器创建
// ============================================================================

const server = new Server(
  {
    name: 'mcp_metago-algorithms',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// ListTools 处理器
// ============================================================================
// MCP SDK 1.29.0 要求工具对象包含 inputSchema 字段（不是 arguments）
// 这里做字段映射：arguments → inputSchema，并清理内部字段

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const mcpTools = schemas.map((s) => {
    const { name, description, arguments: args, ...rest } = s;
    return {
      name,
      description: description || '',
      inputSchema: args || { type: 'object', properties: {}, additionalProperties: false },
    };
  });
  return { tools: mcpTools };
});

// ============================================================================
// CallTool 处理器
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();

  const handler = toolRegistry.getHandler(name);
  if (!handler) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: `工具 ${name} 不存在`,
            provenance: ['[mcp_metago-algorithms] tool_not_found'],
            durationMs: Date.now() - startTime,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }

  try {
    const result = await handler(args || {}, registry);
    result.durationMs = result.durationMs || (Date.now() - startTime);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (e) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: e.message,
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined,
            provenance: ['[mcp_metago-algorithms] handler_error', `[${name}]`],
            durationMs: Date.now() - startTime,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// 启动服务器
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[mcp_metago-algorithms] Server started, ${schemas.length} tools available`);
}

main().catch((e) => {
  console.error(`[mcp_metago-algorithms] Fatal: ${e.message}`);
  process.exit(1);
});
