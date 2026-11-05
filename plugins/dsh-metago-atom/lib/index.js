/**
 * dsh-metago-atom — 元构 597 原子作为**一个** DSH 原生工具（Host half）
 *
 * 契约来源（cordis_inspect_query · host/Service · tools · 2026-11-04 实测）：
 *   register(definition: ToolDefinition): () => void
 *   ToolDefinition extends ToolSchema {
 *     readonly output: ToolOutputDefinition   // 必填：{ schema, render(args,value)=>ContentBlock[] }
 *     execute(args: unknown, exec: ToolRunContext): Promise<unknown>
 *   }
 *   ToolSchema { deferLoading?: true; name; description; parameters }
 *
 * 安全约束（V37.1-06）：
 *   · **不设 deferLoading** —— 保持非延迟，避免 INC-002 那类「全工具 defer」故障
 *   · 整个 execute 包 try/catch，错误转成结构化信封，**绝不向上抛**
 *   · 急停开关：环境变量 METAGO_ATOM=off 时完全跳过注册
 *
 * @module dsh-metago-atom
 */

import { dispatch, load, snapshot } from './dispatch.mjs'

export const name = 'dsh-metago-atom'

/** 硬依赖 tools 服务：没有它就无法注册工具。 */
export const inject = ['tools']

const TOOL_NAME = 'metago_atom'

/**
 * 注册一个工具。
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  if (String(process.env.METAGO_ATOM || '').toLowerCase() === 'off') {
    try { console.log('[metago-atom] METAGO_ATOM=off — tool not registered') } catch { /* ignore */ }
    return () => {}
  }

  // 预热：拿不到引擎就打日志继续（不要因为预热失败而阻断宿主）
  try {
    const r = load()
    if (!r.ok) console.error('[metago-atom] 引擎加载失败:', r.error)
    else console.log(`[metago-atom] 就绪 · 索引 ${r.indexed} 条 · 校验器 ${r.hasValidator ? '有' : '无'}`)
  } catch (error) {
    console.error('[metago-atom] 预热异常:', error && error.message)
  }

  let dispose = null
  try {
    dispose = ctx.tools.register({
      // 注意：**不写 deferLoading**。写 true 会让本工具延迟加载；保持非延迟是安全底线。
      name: TOOL_NAME,
      description: [
        '调用元构（MetaGO）597 条业务原子中的任意一条。一个工具覆盖全部原子，按 operation 分发。',
        '',
        '三种模式：',
        '  mode="invoke"（默认）——执行原子并做契约校验；参数 input 原样传给原子。',
        '  mode="describe"——只返回该原子的契约与可调用性（action/domain/kind/status），不执行。',
        '  mode="list"——按 action / domain / status 过滤返回原子 ID 列表，不执行。',
        '',
        '返回统一信封：',
        '  { ok, atom, action, domain, status, contract, checks, output, degraded? }',
        '  3 条原子诚实不支持（物理锁具/手语/脑电），返回 { ok:false, unsupported:true, reason }。',
        '',
        '典型用法：先 mode="list" 找 ID，再 mode="describe" 看契约，最后 mode="invoke" 执行。',
        '不确定传什么输入时：计算类给数值数组 [1,2,3,4,5]，识别类给 {features:[...]}，生成类给 {spec,...}。',
      ].join('\n'),
      parameters: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            description: '原子 ID，例如 ATOM_RESOURCE_ALLOCATE_001。mode="list" 时可省略。',
          },
          input: {
            description: '传给原子的输入（任意 JSON）。计算类通常传数值数组；不传则原子自行降级。',
          },
          mode: {
            type: 'string',
            enum: ['invoke', 'describe', 'list'],
            description: 'invoke（默认）/ describe / list。',
          },
          filter: {
            type: 'object',
            description: 'mode="list" 时的过滤条件：{ action?, domain?, status?, limit?, offset? }',
            properties: {
              action: { type: 'string' },
              domain: { type: 'string' },
              status: { type: 'string', enum: ['callable', 'unsupported', 'error', 'unknown'] },
              limit: { type: 'integer' },
              offset: { type: 'integer' },
            },
          },
        },
        additionalProperties: false,
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            atom: { type: 'string' },
            action: { type: 'string' },
            domain: { type: 'string' },
            status: { type: 'string' },
            degraded: { type: 'boolean' },
            unsupported: { type: 'boolean' },
            reason: { type: 'string' },
            output: {},
          },
        },
        // ContentBlock 的最简文本形态；若宿主形态不同，只需改这一行。
        // render 在 execute 之外执行，**不受 execute 的 try/catch 保护**，故此处自带兜底：
        // 序列化失败（循环引用/超长）也必须返回合法块，绝不让渲染异常冒到宿主。
        render: (_args, value) => {
          try {
            return [{ type: 'text', text: JSON.stringify(value) }]
          } catch {
            return [{ type: 'text', text: '{"ok":false,"unsupported":false,"reason":"结果序列化失败（可能含循环引用）"}' }]
          }
        },
      },
      execute: async (args) => {
        // 任何异常都转成信封，绝不向上抛（INC-001 教训）
        try {
          return dispatch(args && typeof args === 'object' ? args : {})
        } catch (error) {
          return {
            ok: false,
            unsupported: false,
            reason: `metago_atom 分发异常: ${error && error.message}`,
          }
        }
      },
    })
  } catch (error) {
    // 注册失败不拖垮宿主：打日志并退出，其他工具面不受影响
    try { console.error(`[metago-atom] 工具注册失败（已跳过，不影响宿主）: ${error && error.message}`) } catch { /* ignore */ }
    return () => {}
  }

  return () => {
    try { if (typeof dispose === 'function') dispose() } catch { /* ignore */ }
  }
}

/** 供控制台/自检读取 */
export { snapshot }
