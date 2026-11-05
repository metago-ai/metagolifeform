/**
 * metago-lifeform-dsh — Host half.
 *
 * The MetaGO Agent Harness (智能体运行时控制层套件 · 驭智层) exposed as a native
 * DeepSeek Harness plugin. This half owns the read-only `/api/metago/*` surface
 * over the live installation and one status tool.
 *
 * Contract notes (verified against @deepseek-ai/dsh 0.2.0-rc.2):
 *   - `export function apply` + named `inject` / `Config`. Never mix with
 *     `export default`, because the Loader's `unwrapExports` prefers `.default`
 *     and would then drop `inject` / `Config` silently.
 *   - The file is ESM (`"type": "module"`); the Loader imports it dynamically.
 *   - Routes go through `ctx.webServer.register` rather than `@Remote`, because
 *     an external plugin cannot declare a new remote namespace.
 *   - All collection logic lives in `./status.js` (Node builtins only) so it can
 *     be exercised without a Cordis runtime.
 *
 * @module metago-lifeform-dsh
 */

import { join } from 'node:path'
import {
  collectStatus, dshHome, familyRollup, layerMatrix, memoryState,
  name as pluginPackageName, parseLaw, readText, scanMcpTools, scanSkills,
} from './status.js'
import { buildSnapshot, issueConfirmToken, readAudit, runAction } from './console.js'

export { parseLaw, scanSkills, scanMcpTools, memoryState, collectStatus, layerMatrix }

/** Cordis plugin name. */
export const name = 'metago-lifeform-dsh'

/** Services this row needs before it may activate. */
export const inject = ['webServer', 'tools']

/**
 * No `Config` export on purpose.
 *
 * Cordis resolves config through `runtime.Config['~standard'].validate(config)`
 * (see `resolveConfig` in the vendored cordis), so exporting a plain JSON-Schema
 * object makes every activation throw `TypeError: Cannot read properties of
 * undefined (reading 'validate')` and the row lands in `failed` — this plugin did
 * exactly that in its first install. A real schema would need
 * `@deepseek-ai/schemastery`, which is not resolvable from a profile-installed
 * plugin (`require.resolve` fails from both the profile and the DSH runtime).
 *
 * With no `Config`, Cordis passes the raw YAML config through untouched, and the
 * optional knobs are read defensively in `status.js`:
 *   - `lawBudgetBytes`  → falls back to DEFAULT_LAW_BUDGET when absent/invalid
 *   - `memoryPath`      → falls back to the `$DSH_HOME/metago/kmwi.json` probe
 * Both are documented in this package's README; set them in the row config when
 * a deployment needs different values.
 */

/** Send one JSON response with no-store caching. */
function json(res, body, statusCode = 200) {
  const payload = JSON.stringify(body)
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

/**
 * Wrap one handler so a throw becomes a 500 with a readable message.
 * @param handler - Route handler.
 * @returns The guarded handler.
 */
function guarded(handler) {
  return (req, res) => {
    try {
      const result = handler(req, res)
      if (result && typeof result.then === 'function') {
        result.catch(error => json(res, { ok: false, error: String((error && error.message) || error) }, 500))
      }
    } catch (error) {
      json(res, { ok: false, error: String((error && error.message) || error) }, 500)
    }
  }
}

/**
 * Paths this process has already routed, claimed by a live activation.
 *
 * This package is deliberately mounted twice: once on the host plane (the
 * console's read surface) and once inside the 元构 preset (the model-facing
 * tool). Both activations would otherwise register the same exact routes, and
 * `ctx.webServer` rejects a duplicate exact path outright — which is exactly how
 * the preset came to report
 * `webserver: duplicate exact route "/api/metago/status"` and showed up as
 * 加载失败 in the GUI. Routing is a process-wide resource, so a module-level
 * ledger (cleared when the owning fiber disposes) is the right owner for it.
 */
const claimedRoutes = new Set()

/**
 * Register the plugin: one grouped HTTP surface plus one status tool.
 * @param ctx - Cordis context.
 * @param config - Validated plugin config.
 */
export function apply(ctx, config = {}) {
  const routes = [
    ['/api/metago/status', () => collectStatus(ctx, config)],
    ['/api/metago/layers', () => layerMatrix(ctx, config)],
    ['/api/metago/skills', () => {
      const skills = scanSkills(join(dshHome(), 'skills'))
      return { ...skills, families: familyRollup(skills.skills) }
    }],
    ['/api/metago/memory', () => memoryState(config)],
    ['/api/metago/law', () => {
      const text = readText(join(dshHome(), 'AGENTS.md'))
      return text === undefined ? { error: 'AGENTS.md 不存在' } : parseLaw(text)
    }],
    ['/api/metago/ping', () => ({ plugin: pluginPackageName, version: '1.0.0', ts: new Date().toISOString() })],
  ]

  // `registerRoutes: false` is the explicit opt-out; the ledger below is the
  // automatic one, so an ordering change between host and preset activation
  // cannot resurrect the duplicate.
  if (config.registerRoutes !== false) {
    for (const [path, produce] of routes) {
      if (claimedRoutes.has(path)) continue
      claimedRoutes.add(path)
      ctx.effect(() => {
        const dispose = ctx.webServer.register({
          kind: 'exact',
          path,
          handler: guarded((_req, res) => json(res, { ok: true, ...produce() })),
        })
        return () => {
          claimedRoutes.delete(path)
          dispose()
        }
      }, `metago-lifeform-dsh: ${path}`)
    }
  }

  /* ------------------------------------------------------------------ *
   * 元构控制台 V11 · Host 半边（计划 3.1.4 的四个端点）
   *   GET  /api/metago/console/snapshot   聚合快照（状态 + 动作注册表）
   *   GET  /api/metago/console/stream     SSE 实时推送
   *   POST /api/metago/console/action     统一动作入口（四道锁 + 审计 + 回滚点）
   *   GET  /api/metago/console/audit      审计查询
   * 这四个端点和上面 6 条只读路由一样，都受 claimedRoutes 防重与 registerRoutes 开关控制。
   * ------------------------------------------------------------------ */
  if (config.registerRoutes !== false) {
    const consoleRoutes = [
      ['/api/metago/console/snapshot', guarded((_req, res) => json(res, buildSnapshot(ctx, config)))],
      ['/api/metago/console/audit', guarded((req, res) => {
        const url = new URL(req.url || '/', 'http://127.0.0.1')
        json(res, readAudit(Number(url.searchParams.get('limit') || 100)))
      })],
      ['/api/metago/console/confirm', guarded((req, res) => {
        // 签发 L3 一次性令牌：GET ?action=<id>
        const url = new URL(req.url || '/', 'http://127.0.0.1')
        const actionId = String(url.searchParams.get('action') || '')
        if (!actionId) return json(res, { ok: false, error: '缺少 action' }, 400)
        return json(res, { ok: true, ...issueConfirmToken(actionId) })
      })],
      ['/api/metago/console/action', guarded(async (req, res) => {
        if (req.method !== 'POST') return json(res, { ok: false, error: 'POST only' }, 405)
        const out = await runAction(ctx, config, req)
        return json(res, out.body, out.status)
      })],
      ['/api/metago/console/stream', guarded((req, res) => {
        // SSE：先推一帧完整快照，之后每 2s 推一帧精简状态；客户端不支持则由其自行降级到轮询。
        res.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-store',
          connection: 'keep-alive',
        })
        const push = (event, data) => {
          try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`) } catch { /* ignore */ }
        }
        const once = () => { try { push('snapshot', buildSnapshot(ctx, config)) } catch { /* ignore */ } }
        once()
        const timer = setInterval(() => {
          try {
            const s = collectStatus(ctx, config)
            push('tick', { ts: new Date().toISOString(), lawBytes: s.law.bytes, skills: s.skills.metago, mcp: s.mcp.total })
          } catch { /* ignore */ }
        }, 2000)
        const stop = () => { clearInterval(timer); try { res.end() } catch { /* ignore */ } }
        req.on('close', stop)
        req.on('error', stop)
      })],
    ]

    for (const [path, handler] of consoleRoutes) {
      if (claimedRoutes.has(path)) continue
      claimedRoutes.add(path)
      ctx.effect(() => {
        const dispose = ctx.webServer.register({ kind: 'exact', path, handler })
        return () => {
          claimedRoutes.delete(path)
          dispose()
        }
      }, `metago-lifeform-dsh: ${path}`)
    }
  }

  // One explicit tool keeps the plugin visible to the model without competing
  // with the 112 MetaGO MCP tools: it answers "is the installation healthy?"
  // from the same collector the panel uses.
  //
  // `registerTool` splits the two planes this package occupies. The host-plane
  // row (patch/cordis.patch.yml) serves the console's HTTP routes and passes
  // `registerTool: false`; the preset-scope row passes `registerTool: true`, so
  // a session bound to the 元构 preset carries the tool. Without the split the
  // same tool name would be registered twice (host plane + preset plane) and the
  // scope-aware registry would shadow one with the other.
  if (config.registerTool === false) return

  ctx.effect(() => ctx.tools.register({
    name: 'metago_lifeform_status',
    description: 'MetaGO Fabric V11 · 读取本机 MetaGO Lifeform 安装状态：法则版本与体积对预设预算的余量、技能目录规模、已挂载 MCP 工具计数、KMWI 记忆健康度、已安装的 @metago-ai 包版本。在就 MetaGO 安装状况下任何结论之前先用它取证。',
    // [METAGO_FIX 2026-10-03] DSH 0.2.0 把 parameters 原样作为函数 schema 送给
    // 模型 API；空对象 {} 会被序列化成 `type: null`，DeepSeek 直接以
    // INVALID_REQUEST 拒绝整轮请求。无参工具也必须显式声明对象类型。
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute() {
      const status = collectStatus(ctx, config)
      return [
        `法则: ${status.law.exists ? `V${status.law.version} · ${status.law.bytes}B / 预算 ${status.lawBudget.configured}B · ${status.law.lines} 行 · ${status.law.chapterCount} 章 · ${status.lawBudget.fits ? '全文可加载' : `将截断 ${status.lawBudget.truncatedBy}B`}` : '缺失'}`,
        `技能: ${status.skills.metago} 个 metago-* / 共 ${status.skills.total} 个 · 触发词 ${status.skills.triggerCount} 条`,
        `MCP: ${status.mcp.total} 个工具 · ${status.mcp.servers.map(entry => `${entry.server}=${entry.count}`).join(' / ') || '无'}`,
        `公理: ${status.law.axioms.length} 条有正文 | 属性: ${status.law.properties.length} 条有正文`,
        `KMWI: ${status.memory.exists ? `H=${status.memory.health} · K${status.memory.layers.K}/M${status.memory.layers.M}/W${status.memory.layers.W}/I${status.memory.layers.I}` : '未落盘'}`,
        `引擎: ${status.packages.engine.installed ? `v${status.packages.engine.version}` : '未安装'} | 算法: ${status.packages.algorithms.installed ? `v${status.packages.algorithms.version}` : '未安装'} | MCP 服务器: ${status.packages.mcpServer.installed ? `v${status.packages.mcpServer.version}` : '未安装'}`,
      ].join('\n')
    },
  }), 'metago-lifeform-dsh: metago_lifeform_status')
}
