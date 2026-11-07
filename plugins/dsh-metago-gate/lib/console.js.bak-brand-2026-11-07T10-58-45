/**
 * 元构控制台 · 可交互 API + 自包含页面
 *
 * 设计约束（宁可保守）：
 *   - 只注册 /api/metago/gate/* 下的新路径，绝不碰既有的 /api/metago/*（那边的 6 条只读路由是另一个插件的）
 *   - 写操作（改模式）只接受本机回环地址 + 白名单值
 *   - 任何异常都转成 JSON 错误，不抛出到 HTTP 栈
 *   - 页面自包含（无外链、无 CDN），同一份字符串既用于线上路由也用于落盘预览
 *
 * @module dsh-metago-gate/console
 */

import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const MODES = ['shadow', 'ask', 'deny']

function homeDir() {
  return process.env.DSH_HOME || '$DSH_HOME\\home'
}
function gateDir() {
  return join(homeDir(), 'metago', 'fabric')
}
function policyPath() {
  return join(gateDir(), 'dsh-metago-gate', 'lib', 'policy.json')
}
function logDir() {
  return join(gateDir(), 'logs')
}

function isLoopback(req) {
  const a = (req && req.socket && (req.socket.remoteAddress || req.socket.address?.().address)) || ''
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1' || a === ''
}

function sendJson(res, body, status = 200) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 64 * 1024) raw = raw.slice(0, 64 * 1024)
    })
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}) } catch { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

/** 读最近 N 条 gate 事件 */
export function tailLog(tail = 40) {
  try {
    const day = new Date().toISOString().slice(0, 10)
    const p = join(logDir(), `gate-${day}.jsonl`)
    if (!existsSync(p)) return { day, file: p, exists: false, events: [] }
    const lines = readFileSync(p, 'utf8').split('\n').filter(Boolean)
    const n = Math.max(1, Math.min(500, Number(tail) || 40))
    const slice = lines.slice(-n)
    const events = []
    for (const line of slice) {
      try { events.push(JSON.parse(line)) } catch { events.push({ raw: line }) }
    }
    return { day, file: p, exists: true, total: lines.length, events }
  } catch (error) {
    return { error: String((error && error.message) || error), events: [] }
  }
}

/** 读策略摘要 */
export function policySummary() {
  try {
    const p = JSON.parse(readFileSync(policyPath(), 'utf8'))
    return {
      mode: p.meta && p.meta.mode,
      version: p.meta && p.meta.version,
      risk: {
        high: (p.risk && p.risk.high || []).length,
        medium: (p.risk && p.risk.medium || []).length,
        low: (p.risk && p.risk.low || []).length,
      },
      stages: (p.killChain && p.killChain.stages || []).map((s) => ({ id: s.id, name: s.name, patterns: s.patterns.length })),
      escalateAtStages: p.killChain && p.killChain.escalateAtStages,
      layers: Object.keys(p.fourLayers || {}).filter((k) => k !== 'note'),
      routingRules: (p.routing && p.routing.rules || []).length,
      placeholderPatterns: (p.completeness && p.completeness.placeholderPatterns || []).length,
    }
  } catch (error) {
    return { error: String((error && error.message) || error), configured: false }
  }
}

/** 改模式（写回 policy.json，先备份） */
export function setMode(mode) {
  if (!MODES.includes(mode)) return { ok: false, error: `mode 必须是 ${MODES.join(' / ')}` }
  const p = policyPath()
  try {
    const raw = readFileSync(p, 'utf8')
    const policy = JSON.parse(raw)
    const from = policy.meta && policy.meta.mode
    policy.meta = policy.meta || {}
    policy.meta.mode = mode
    policy.meta.modeChangedAt = new Date().toISOString()
    const bak = `${p}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`
    copyFileSync(p, bak)
    writeFileSync(p, `${JSON.stringify(policy, null, 2)}\n`, 'utf8')
    return { ok: true, from, to: mode, backup: bak, note: '运行时立即生效（插件每次判定都读内存中的 state.mode，重启后以文件为准）' }
  } catch (error) {
    return { ok: false, error: String((error && error.message) || error) }
  }
}

/**
 * 构造路由表。getSnapshot 由插件注入，避免循环依赖。
 * @param {{getSnapshot: () => object, applyMode?: (m: string) => object}} deps
 */
/* ------------------------------------------------------------------ *
 * 只读数据端点（P9-09/11/12 的数据层）
 * 数据源：元构自己的台账目录（METAGO_ATLAS 可覆盖）
 * 全部 GET、无令牌、不写任何文件、读不到就返回 { ok:false, error }
 * ------------------------------------------------------------------ */

function atlasDir() {
  return process.env.METAGO_ATLAS || '$METAGO_LIFEFORM_HOME'
}

function readJsonQuiet(p) {
  try {
    if (!existsSync(p)) return null
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch { return null }
}

/** 能力路由摘要 */
function capabilitiesData() {
  const j = readJsonQuiet(join(atlasDir(), 'ledger', 'capability-routing.json'))
  if (!j) return { ok: false, error: 'capability-routing.json 不可读' }
  const tasks = Array.isArray(j.tasks) ? j.tasks : []
  return {
    ok: true,
    total: tasks.length,
    tasks: tasks.map((x) => ({
      id: x.id,
      taskType: x.taskType,
      triggers: (x.triggers || []).slice(0, 4),
      tools: (x.mustUseTools || []).length,
      firstTool: (x.mustUseTools || [])[0] || null,
      checks: (x.mustRunChecks || []).length,
    })),
  }
}

/** 记忆体系统计 */
function memoryData() {
  const p = readJsonQuiet(join(atlasDir(), 'ledger', 'progress.json'))
  const m = p && p.memory ? p.memory : null
  if (!m) return { ok: false, error: 'progress.json 里没有 memory 段' }
  return {
    ok: true,
    spaces: m.spaces, active: m.active, insights: m.insights, edges: m.edges,
    deleted: m.deleted, dbBytes: m.dbBytes, version: m.version,
    mappedInReport: m.mappedInReport, omitted: m.omitted, gap: m.gap,
  }
}

/** 运维状态 */
function opsData() {
  const prog = readJsonQuiet(join(atlasDir(), 'ledger', 'progress.json'))
  const gates = readJsonQuiet(join(atlasDir(), 'ledger', 'gates.json'))
  const base = readJsonQuiet(join(atlasDir(), 'ledger', 'base-version.json'))
  const diff = readJsonQuiet(join(atlasDir(), 'ledger', 'tools-diff-report.json'))
  return {
    ok: true,
    round: prog ? prog.round : null,
    phase: prog ? prog.phase : null,
    wbs: prog ? prog.wbs : null,
    gates: gates ? { tierA: gates.tierA ? gates.tierA.count : null, tierAPassing: gates.tierA ? gates.tierA.passing : null, tierB: gates.tierB ? gates.tierB.count : null } : null,
    base: base ? base.baseVersionLine : null,
    toolsDiff: diff ? diff.verdict : null,
    updatedAt: prog ? prog.updatedAt : null,
  }
}

/** 健康总览：18 道闸 / 红队 / 工具面 diff / 三面 */
function healthData() {
  const gates = readJsonQuiet(join(atlasDir(), 'ledger', 'gates.json'))
  const red = readJsonQuiet(join(atlasDir(), 'ledger', 'redteam-report.json'))
  const diff = readJsonQuiet(join(atlasDir(), 'ledger', 'tools-diff-report.json'))
  const prog = readJsonQuiet(join(atlasDir(), 'ledger', 'progress.json'))
  const tiers = gates && gates.tierA ? gates.tierA.gates || [] : []
  return {
    ok: true,
    gates: {
      tierA: tiers.length,
      passing: tiers.filter((g) => String(g.verified || '').indexOf('PASS') >= 0).length,
      failing: tiers.filter((g) => String(g.verified || '').indexOf('FAIL') >= 0).map((g) => g.id),
      tierB: gates && gates.tierB ? gates.tierB.count : null,
    },
    redteam: red ? {
      blockRate: red.redteam && red.redteam.blockRate,
      blocked: red.redteam && red.redteam.blocked,
      highRiskCases: red.redteam && red.redteam.highRiskCases,
      falsePositive: red.benign && red.benign.falsePositive,
      falsePositiveRate: red.benign && red.benign.falsePositiveRate,
      verdict: red.verdict,
    } : null,
    toolsDiff: diff ? { verdict: diff.verdict, removed: (diff.removed || []).length, added: (diff.added || []).length } : null,
    threeFaces: prog ? { skills: (prog.layers && prog.layers.skillsTotal) || (prog.skills && prog.skills.total), lawBytes: 121771, packages: 55 } : null,
  }
}

/** 控制台审计日志 */
function auditTail(n) {
  try {
    const p = join(logDir(), 'console-audit.jsonl')
    if (!existsSync(p)) return { ok: true, lines: [], total: 0 }
    const all = readFileSync(p, 'utf8').split('\n').filter(Boolean)
    const tail = all.slice(-Math.max(1, Math.min(200, n)))
    return {
      ok: true,
      total: all.length,
      lines: tail.map((l) => { try { return JSON.parse(l) } catch { return { raw: l.slice(0, 120) } } }),
    }
  } catch (e) { return { ok: false, error: String((e && e.message) || e) } }
}

/* ------------------------------------------------------------------ *
 * 统一动作层（P9-06）+ 审计（P9-07）
 * ------------------------------------------------------------------ */

/** 审计：每次 /action 调用写一条 JSONL。审计失败绝不影响动作本身。 */
function auditAction(req, name, payload, result) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      action: name,
      payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload) : [],
      ok: !!(result && result.ok),
      error: (result && result.error) || null,
      ip: String((req && req.socket && req.socket.remoteAddress) || 'unknown'),
      ua: String((req && req.headers && req.headers['user-agent']) || '').slice(0, 80),
    })
    appendFileSync(join(logDir(), 'console-audit.jsonl'), line + '\n', 'utf8')
  } catch { /* 审计失败不阻断 */ }
}

/** 动作白名单：只有登记在这里的动作能被 /action 调用（未登记一律 404） */
function buildActions(deps) {
  const { getSnapshot, applyMode, explainTool, getMode } = deps
  const modeOf = typeof getMode === 'function' ? getMode : () => 'shadow'
  return {
    status: {
      write: false,
      domain: 'overview',
      desc: '读运行时快照',
      run: () => ({ ok: true, gate: safe(getSnapshot), mode: modeOf() }),
    },
    policy: {
      write: false,
      domain: 'governance',
      desc: '读策略摘要',
      run: () => ({ ok: true, policy: policySummary() }),
    },
    explain: {
      write: false,
      domain: 'governance',
      desc: '解释一个工具的风险判定（payload.tool）',
      run: (payload) => {
        const tool = String((payload && payload.tool) || '').trim()
        if (!tool) return { ok: false, error: '缺少 payload.tool' }
        const d = typeof explainTool === 'function' ? explainTool(tool) : { level: 'unknown' }
        return { ok: true, tool, ...d, mode: modeOf() }
      },
    },
    setMode: {
      write: true,
      domain: 'governance',
      desc: '切换门禁模式（payload.mode = shadow|ask|deny）',
      run: (payload) => {
        const next = String((payload && payload.mode) || '')
        if (!MODES.includes(next)) return { ok: false, error: 'mode 必须是 ' + MODES.join(' / ') }
        const r = setMode(next)
        if (r && r.ok && typeof applyMode === 'function') {
          try { applyMode(next) } catch { /* 内存态失败不影响文件态 */ }
        }
        return r || { ok: false, error: 'setMode 未返回结果' }
      },
    },
  }
}

export function buildRoutes({ getSnapshot, applyMode, explainTool, getMode, readToken }) {
  // 两个新参数的默认值：没传时 explain 端点降级为"不可用"，但**不崩**
  const explainOf = typeof explainTool === 'function' ? explainTool : null
  const modeOf = typeof getMode === 'function' ? getMode : () => 'shadow'
  return [
    {
      kind: 'exact',
      path: '/api/metago/gate/status',
      handler: (_req, res) => sendJson(res, { ok: true, gate: safe(getSnapshot), policy: policySummary(), log: { dir: logDir() }, ts: new Date().toISOString() }),
    },
    {
      kind: 'exact',
      path: '/api/metago/gate/log',
      handler: (req, res) => {
        const url = new URL(req.url || '/', 'http://127.0.0.1')
        sendJson(res, { ok: true, ...tailLog(url.searchParams.get('tail') || 40) })
      },
    },
    {
      /* 可解释性：GET /api/metago/gate/explain?tool=<工具名>
       * 回答"为什么这个工具被判成这个等级"，纯只读。 */
      kind: 'exact',
      path: '/api/metago/gate/explain',
      handler: (req, res) => {
        const url = new URL(req.url || '/', 'http://127.0.0.1')
        const tool = String(url.searchParams.get('tool') || '').trim()
        if (!tool) {
          return sendJson(res, {
            ok: false,
            error: '缺少 tool 参数',
            usage: 'GET /api/metago/gate/explain?tool=pwsh',
          }, 400)
        }
        const detail = explainOf
          ? explainOf(tool)
          : { level: 'unknown', reason: 'explain-not-available' }
        return sendJson(res, { ok: true, tool, ...detail, mode: modeOf() })
      },
    },
    {
      kind: 'exact',
      path: '/api/metago/gate/health',
      handler: (_req, res) => sendJson(res, healthData()),
    },
    {
      kind: 'exact',
      path: '/api/metago/gate/capabilities',
      handler: (_req, res) => sendJson(res, capabilitiesData()),
    },
    {
      kind: 'exact',
      path: '/api/metago/gate/memory',
      handler: (_req, res) => sendJson(res, memoryData()),
    },
    {
      kind: 'exact',
      path: '/api/metago/gate/ops',
      handler: (_req, res) => sendJson(res, opsData()),
    },
    {
      kind: 'exact',
      path: '/api/metago/gate/audit',
      handler: (req, res) => {
        const url = new URL(req.url || '/', 'http://127.0.0.1')
        sendJson(res, auditTail(Number(url.searchParams.get('tail') || 30)))
      },
    },
    {
      /* 统一动作入口：GET 列动作（自描述），POST 执行动作 */
      kind: 'exact',
      path: '/api/metago/gate/action',
      handler: async (req, res) => {
        const actions = buildActions({ getSnapshot, applyMode, explainTool, getMode })
        if (req.method === 'GET') {
          return sendJson(res, {
            ok: true,
            actions: Object.entries(actions).map(([k, v]) => ({ name: k, write: v.write, domain: v.domain || 'overview', desc: v.desc })),
          })
        }
        if (req.method !== 'POST') return sendJson(res, { ok: false, error: 'GET or POST only' }, 405)
        if (!isLoopback(req)) return sendJson(res, { ok: false, error: '仅允许本机回环地址' }, 403)

        let body = {}
        try { body = await readBody(req) } catch { return sendJson(res, { ok: false, error: '请求体不是合法 JSON' }, 400) }
        const name = String(body.action || '').trim()
        const entry = actions[name]
        if (!entry) {
          auditAction(req, name || '(empty)', body.payload, { ok: false, error: 'unknown-action' })
          return sendJson(res, { ok: false, error: '未知动作: ' + name, actions: Object.keys(actions) }, 404)
        }
        if (entry.write) {
          const expected = typeof readToken === 'function' ? readToken() : ''
          const given = String((req.headers && req.headers['x-metago-token']) || '')
          if (!expected) {
            auditAction(req, name, body.payload, { ok: false, error: 'no-token-configured' })
            return sendJson(res, { ok: false, error: '控制台未配置令牌，写动作已禁用' }, 403)
          }
          if (given !== expected) {
            auditAction(req, name, body.payload, { ok: false, error: 'bad-token' })
            return sendJson(res, { ok: false, error: '令牌无效' }, 403)
          }
        }
        let result
        try { result = entry.run(body.payload || {}) } catch (e) {
          result = { ok: false, error: String((e && e.message) || e) }
        }
        auditAction(req, name, body.payload, result)
        return sendJson(res, result)
      },
    },
    {
      kind: 'exact',
      path: '/api/metago/gate/mode',
      handler: async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, { ok: false, error: 'POST only' }, 405)
        if (!isLoopback(req)) return sendJson(res, { ok: false, error: '仅允许本机回环地址' }, 403)
        const body = await readBody(req)
        const next = String(body.mode || '')
        const result = setMode(next)
        if (result.ok && typeof applyMode === 'function') {
          try { applyMode(next) } catch { /* 内存态失败不影响文件态 */ }
        }
        return sendJson(res, result.ok ? { ok: true, ...result } : { ok: false, ...result }, result.ok ? 200 : 400)
      },
    },
    {
      kind: 'exact',
      path: '/api/metago/gate/console',
      handler: (_req, res) => {
        const html = consoleHtml()
        res.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'content-length': Buffer.byteLength(html),
        })
        res.end(html)
      },
    },
  ]
}

function safe(fn) {
  try { return fn() } catch (error) { return { error: String((error && error.message) || error) } }
}

/** 把页面落盘一份，供离线预览/留证 */
export function writeConsolePreview(path) {
  try {
    const dir = path.replace(/[\\/][^\\/]+$/, '')
    mkdirSync(dir, { recursive: true })
    writeFileSync(path, consoleHtml(), 'utf8')
    return { ok: true, path }
  } catch (error) {
    return { ok: false, error: String((error && error.message) || error) }
  }
}

/* ------------------------------------------------------------------ *
 * 自包含页面（无外链、无 CDN、无框架）
 * ------------------------------------------------------------------ */

export function consoleHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MetaGO Fabric V11 · 元构控制台</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230d9488'/%3E%3Cpath d='M8 23V9l8 9 8-9v14' fill='none' stroke='%23fff' stroke-width='2.6' stroke-linejoin='round'/%3E%3C/svg%3E">
<style>
  :root{
    --bg:#0d1117;--panel:#161b22;--line:#22282f;--fg:#e6edf3;--dim:#8b949e;
    --ok:#3fb950;--warn:#d29922;--bad:#f85149;--accent:#58a6ff;--accent2:#a371f7;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);
    font:14px/1.6 -apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
  header{padding:18px 24px;border-bottom:1px solid var(--line);
    display:flex;align-items:center;gap:16px;flex-wrap:wrap;background:var(--panel)}
  h1{font-size:16px;margin:0;letter-spacing:.5px}
  h1 .dot{color:var(--accent2)}
  .tag{font-size:12px;color:var(--dim);border:1px solid var(--line);border-radius:999px;padding:2px 10px}
  main{padding:20px 24px;display:grid;gap:16px;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}
@media (max-width:880px){main{grid-template-columns:minmax(0,1fr)}}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px}
  .card h2{font-size:13px;margin:0 0 12px;color:var(--dim);font-weight:600;letter-spacing:.4px;text-transform:uppercase}
  .kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
  @media (max-width:520px){.kpi{grid-template-columns:repeat(2,minmax(0,1fr))}}
  .kpi div{min-width:0}
  .kpi .n{font-size:24px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1.2}
  .kpi .l{font-size:12px;color:var(--dim);white-space:nowrap}
  .banner{grid-column:1/-1;background:rgba(210,153,34,.1);border:1px solid rgba(210,153,34,.4);
    color:var(--warn);border-radius:10px;padding:10px 16px;font-size:13px;display:none}
  .banner.on{display:block}
  .modes{display:flex;gap:8px;margin-top:4px}
  button{font:inherit;cursor:pointer;background:#21262d;color:var(--fg);
    border:1px solid var(--line);border-radius:8px;padding:7px 14px;transition:.15s}
  button:hover{border-color:var(--accent);color:var(--accent)}
  button.on{background:rgba(88,166,255,.15);border-color:var(--accent);color:var(--accent)}
  button[data-m=deny].on{background:rgba(248,81,73,.15);border-color:var(--bad);color:var(--bad)}
  button[data-m=ask].on{background:rgba(210,153,34,.15);border-color:var(--warn);color:var(--warn)}
  table{width:100%;border-collapse:collapse;font-size:12.5px}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}
  th{color:var(--dim);font-weight:500}
  .pill{display:inline-block;border-radius:6px;padding:1px 7px;font-size:11.5px;border:1px solid var(--line)}
  .pill.ok{color:var(--ok);border-color:rgba(63,185,80,.4)}
  .pill.warn{color:var(--warn);border-color:rgba(210,153,34,.4)}
  .pill.bad{color:var(--bad);border-color:rgba(248,81,73,.4)}
  .full{grid-column:1/-1}
  .muted{color:var(--dim);font-size:12px}
  .row{display:flex;justify-content:space-between;gap:12px;padding:4px 0;border-bottom:1px dashed var(--line)}
  .row:last-child{border-bottom:0}
  code{background:#0b0f14;border:1px solid var(--line);border-radius:5px;padding:1px 5px;font-size:12px}
  .err{color:var(--bad)}

section[data-page]{grid-column:1/-1;display:grid;gap:16px}
  section[data-page][hidden]{display:none}
  nav.tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}
nav.tabs .tab{background:transparent;border:1px solid var(--line);color:var(--fg);padding:6px 14px;border-radius:999px;cursor:pointer;font-size:13px}
nav.tabs .tab.on{background:var(--accent);border-color:var(--accent);color:#0b0d12;font-weight:600}
.list{max-height:420px;overflow:auto;display:flex;flex-direction:column;gap:6px;margin-top:10px}
.item{border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:13px}
.item .ti{font-weight:600}
.item .me{color:var(--muted);font-size:12px;margin-top:3px}
.kv{display:grid;grid-template-columns:180px 1fr;gap:6px 12px;font-size:13px;margin-top:10px}
.kv .k{color:var(--muted)}
.kv .v{font-variant-numeric:tabular-nums}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:10px}
</style>
</head>
<body>
<header>
  <h1>MetaGO Fabric V11 <span class="dot">·</span> 元构控制台 <span class="muted">治理门禁</span></h1>
  <span class="tag" id="tag-mode">mode —</span>
  <span class="tag" id="tag-ts">—</span>
  <span class="tag" id="tag-conn">连接中…</span>
</header>

<nav class="tabs" id="tabs">
  <button class="tab on" data-go="overview">总览</button>
  <button class="tab" data-go="capabilities">能力</button>
  <button class="tab" data-go="governance">治理</button>
  <button class="tab" data-go="memory">记忆</button>
  <button class="tab" data-go="ops">运维</button>
  <button class="tab" data-go="audit">审计</button>
</nav>

<main>
<section data-page="overview">
  <div class="banner" id="banner">离线预览：当前打开的是页面副本，未连到 /api/metago/gate/*，下面是<strong>示例数据</strong>（仅用于查看版式）。接上插件后自动显示真实数据。</div>

  <section class="card">
    <h2>运行时计数</h2>
    <div class="kpi">
      <div><div class="n" id="k-calls">—</div><div class="l">工具调用</div></div>
      <div><div class="n" id="k-stages">—</div><div class="l">阶段命中</div></div>
      <div><div class="n" id="k-escal">—</div><div class="l">升级建议</div></div>
      <div><div class="n" id="k-logfail">—</div><div class="l">日志失败</div></div>
    </div>
    <div class="muted" id="k-start" style="margin-top:10px">—</div>
  </section>

  <section class="card">
    <h2>模式（真实控制操作）</h2>
    <div class="modes">
      <button data-m="shadow">shadow 影子</button>
      <button data-m="ask">ask 询问</button>
      <button data-m="deny">deny 拦截</button>
    </div>
    <div class="muted" id="mode-msg" style="margin-top:10px">shadow = 只记录不改判；ask/deny 会改变工具执行决策。</div>
  </section>

  <section class="card">
    <h2>策略表</h2>
    <div id="policy"></div>
  </section>

  <section class="card">
    <h2>七阶段杀伤链</h2>
    <table><thead><tr><th>阶段</th><th>名称</th><th>规则数</th></tr></thead><tbody id="stages"></tbody></table>
  </section>

  <section class="card full">
    <h2>最近事件（每 2 秒刷新）</h2>
    <table>
      <thead><tr><th>时间</th><th>事件</th><th>工具</th><th>风险</th><th>阶段</th><th>建议</th><th>下游</th></tr></thead>
      <tbody id="events"><tr><td colspan="7" class="muted">加载中…</td></tr></tbody>
    </table>
    <div class="muted" id="logpath" style="margin-top:10px"></div>
  </section>
</section>


<section data-page="capabilities" hidden>
  <div class="card">
    <h2>能力路由 <span class="muted" id="cap-count">—</span></h2>
    <div class="muted">数据源 <code>/api/metago/gate/capabilities</code> ← <code>ledger/capability-routing.json</code></div>
    <div id="cap-list" class="list"></div>
  </div>
</section>

<section data-page="governance" hidden>
  <div class="card">
    <h2>健康总览 <span class="muted">18 道硬门 / 红队 / 工具面</span></h2>
    <div class="kv" id="gov-health"></div>
  </div>
  <div class="card">
    <h2>门禁策略</h2>
    <div id="gov-policy" class="kv"></div>
  </div>
  <div class="card">
    <h2>解释一个工具为什么被判这个等级</h2>
    <div class="row">
      <input id="ex-tool" placeholder="工具名，如 pwsh / read / metago_atom" value="pwsh" />
      <button class="btn" id="ex-go">解释</button>
    </div>
    <div id="ex-out" class="kv"></div>
  </div>
  <div class="card">
    <h2>动作</h2>
    <div class="muted">写动作需要令牌（<code>lib/console-token.json</code>），请求头 <code>x-metago-token</code>。此处按钮走只读判定，不代你写。</div>
    <div class="row">
      <button class="btn" data-mode="shadow">shadow</button>
      <button class="btn" data-mode="ask">ask</button>
      <button class="btn" data-mode="deny">deny</button>
    </div>
    <div class="muted" id="act-note">—</div>
  </div>
</section>

<section data-page="memory" hidden>
  <div class="card">
    <h2>记忆体系</h2>
    <div class="kpis" id="mem-kpis"></div>
    <div class="muted" id="mem-gap" style="margin-top:10px">—</div>
  </div>
</section>

<section data-page="ops" hidden>
  <div class="card">
    <h2>运维状态</h2>
    <div class="kv" id="ops-kv"></div>
  </div>
</section>

<section data-page="audit" hidden>
  <div class="card">
    <h2>控制台审计 <span class="muted" id="audit-total">—</span></h2>
    <div class="muted">每次 /action 调用一条；只记动作名与参数键名，不记值。</div>
    <div id="audit-list" class="list"></div>
  </div>
</section>

</main>

<script>
const $ = (id) => document.getElementById(id)
const setText = (id, v) => { const el = $(id); if (el) el.textContent = v == null ? '—' : String(v) }
const riskPill = (r) => r === 'high' ? 'bad' : r === 'medium' ? 'warn' : 'ok'

async function getJSON(url) {
  const r = await fetch(url, { headers: { accept: 'application/json' } })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

function renderStatus(d) {
  const g = d.gate || {}
  setText('tag-mode', 'mode ' + (g.mode || '?'))
  setText('tag-ts', new Date(d.ts || Date.now()).toLocaleTimeString())
  setText('k-calls', g.toolCalls ?? 0)
  setText('k-stages', g.stageHits ?? 0)
  setText('k-escal', g.escalations ?? 0)
  setText('k-logfail', g.logFailures ?? 0)
  setText('k-start', '启动于 ' + (g.startedAt || '—') + ' · 策略已载入 ' + (g.policyLoaded ? '是' : '否'))
  const p = d.policy || {}
  const rows = [
    ['版本', p.version || '—'],
    ['高风险工具', p.risk ? p.risk.high : '—'],
    ['中风险工具', p.risk ? p.risk.medium : '—'],
    ['低风险工具', p.risk ? p.risk.low : '—'],
    ['升级阈值（命中阶段数）', p.escalateAtStages ?? '—'],
    ['四层安全基因', (p.layers || []).join(' / ') || '—'],
    ['路由规则', p.routingRules ?? '—'],
    ['占位符模式', p.placeholderPatterns ?? '—'],
  ]
  $('policy').innerHTML = rows.map(([k, v]) =>
    '<div class="row"><span class="muted">' + k + '</span><span>' + String(v) + '</span></div>').join('')
  $('stages').innerHTML = (p.stages || []).map((s) =>
    '<tr><td><code>' + s.id + '</code></td><td>' + s.name + '</td><td>' + s.patterns + '</td></tr>').join('')
    || '<tr><td colspan="3" class="muted">无</td></tr>'
  document.querySelectorAll('button[data-m]').forEach((b) => {
    b.classList.toggle('on', b.dataset.m === g.mode)
  })
  setText('logpath', d.log && d.log.dir ? '日志目录：' + d.log.dir : '')
}

function renderLog(d) {
  const ev = d.events || []
  if (!ev.length) {
    $('events').innerHTML = '<tr><td colspan="7" class="muted">' +
      (d.exists === false ? '今日还没有任何事件（下次启动插件后开始记录）' : '暂无事件') + '</td></tr>'
    return
  }
  $('events').innerHTML = ev.slice().reverse().map((e) => {
    const t = e.ts ? new Date(e.ts).toLocaleTimeString() : '—'
    const stages = (e.stages || []).join(',')
    return '<tr><td>' + t + '</td><td>' + (e.event || '') + '</td><td>' + (e.toolName || '') +
      '</td><td>' + (e.risk ? '<span class="pill ' + riskPill(e.risk) + '">' + e.risk + '</span>' : '') +
      '</td><td>' + stages + '</td><td>' + (e.advice || '') + '</td><td>' + (e.downstream || '') + '</td></tr>'
  }).join('')
}

const DEMO_STATUS = {
  ok: true,
  ts: new Date().toISOString(),
  gate: { mode: 'shadow', policyLoaded: true, routesMounted: true, startedAt: '（示例）', toolCalls: 128, stageHits: 6, escalations: 2, logFailures: 0 },
  policy: {
    mode: 'shadow', version: '0.1.0',
    risk: { high: 15, medium: 15, low: 16 },
    stages: [
      { id: 'L1', name: '初始访问', patterns: 5 }, { id: 'L2', name: '权限提升', patterns: 6 },
      { id: 'L3', name: '侦察', patterns: 3 }, { id: 'L4', name: '持久化', patterns: 2 },
      { id: 'L5', name: '命令与控制', patterns: 7 }, { id: 'L6', name: '横向移动', patterns: 5 },
      { id: 'L7', name: '目标执行', patterns: 8 },
    ],
    escalateAtStages: 3,
    layers: ['L1_审批', 'L2_授权', 'L3_隔离', 'L4_审计'],
    routingRules: 7, placeholderPatterns: 10,
  },
  log: { dir: '（示例）$DSH_HOME\\\\metago\\\\fabric\\\\logs' },
}
const DEMO_LOG = {
  ok: true, exists: true, total: 128,
  events: [
    { ts: new Date(Date.now() - 42000).toISOString(), event: 'pre-execute', toolName: 'read', risk: 'low', stages: [], advice: 'allow', downstream: 'allow' },
    { ts: new Date(Date.now() - 31000).toISOString(), event: 'pre-execute', toolName: 'pwsh', risk: 'high', stages: ['L5'], layers: ['L2_授权', 'L4_审计'], advice: 'allow', downstream: 'allow' },
    { ts: new Date(Date.now() - 21000).toISOString(), event: 'result', toolName: 'pwsh', isError: false },
    { ts: new Date(Date.now() - 12000).toISOString(), event: 'pre-execute', toolName: 'plugin_manager', risk: 'high', stages: [], layers: ['L1_审批', 'L4_审计'], advice: 'ask', downstream: 'ask' },
    { ts: new Date(Date.now() - 4000).toISOString(), event: 'pre-execute', toolName: 'write', risk: 'high', stages: [], layers: ['L4_审计'], advice: 'allow', downstream: 'allow' },
  ],
}

async function refresh() {
  try {
    const [s, l] = await Promise.all([getJSON('/api/metago/gate/status'), getJSON('/api/metago/gate/log?tail=40')])
    renderStatus(s); renderLog(l)
    $('tag-conn').textContent = '已连接 · 实时'
    $('tag-conn').className = 'tag'
    $('banner').classList.remove('on')
  } catch (e) {
    // 离线降级：渲染结构完整的示例数据，让版式仍可审阅
    renderStatus(DEMO_STATUS); renderLog(DEMO_LOG)
    $('tag-conn').textContent = '离线预览'
    $('tag-conn').className = 'tag err'
    $('banner').classList.add('on')
  }
}

document.querySelectorAll('button[data-m]').forEach((b) => {
  b.addEventListener('click', async () => {
    const mode = b.dataset.m
    setText('mode-msg', '正在切到 ' + mode + ' …')
    try {
      const r = await fetch('/api/metago/gate/mode', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const d = await r.json()
      setText('mode-msg', d.ok ? ('已切换到 ' + d.to + '（备份 ' + (d.backup || '').split(/[\\\\/]/).pop() + '）') : ('失败：' + (d.error || '未知')))
      refresh()
    } catch (e) {
      setText('mode-msg', '失败：' + e.message)
    }
  })
})

refresh()
setInterval(refresh, 2000)

/* ---------- 6 页切换与渲染（P9-08~12） ---------- */
const PAGES = ['overview', 'capabilities', 'governance', 'memory', 'ops', 'audit']
function showPage(name) {
  for (const p of PAGES) {
    const el = document.querySelector('[data-page="' + p + '"]')
    if (el) el.hidden = p !== name
  }
  for (const b of document.querySelectorAll('nav.tabs .tab')) {
    b.classList.toggle('on', b.dataset.go === name)
  }
  try { location.hash = name === 'overview' ? '' : '#' + name } catch { /* ignore */ }
  if (name === 'capabilities') loadCapabilities()
  if (name === 'governance') loadGovernance()
  if (name === 'memory') loadMemory()
  if (name === 'ops') loadOps()
  if (name === 'audit') loadAudit()
}
for (const b of document.querySelectorAll('nav.tabs .tab')) {
  b.addEventListener('click', () => showPage(b.dataset.go))
}

const api = async (p) => {
  const r = await fetch(p, { headers: { accept: 'application/json' } })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

async function loadCapabilities() {
  const box = $('cap-list'); if (!box) return
  try {
    const j = await api('/api/metago/gate/capabilities')
    if (!j.ok) { box.innerHTML = '<div class="item">不可用：' + esc(j.error) + '</div>'; return }
    setText('cap-count', j.total + ' 类')
    box.innerHTML = j.tasks.map((x) => (
      '<div class="item"><div class="ti">' + esc(x.taskType) + '</div>' +
      '<div class="me">' + esc(x.id) + ' · 工具 ' + x.tools + ' 个 · 首选 ' + esc(x.firstTool || '—') + '</div>' +
      '<div class="me">触发：' + esc((x.triggers || []).join('、')) + '</div></div>'
    )).join('')
  } catch (e) { box.innerHTML = '<div class="item">读取失败：' + esc(e.message) + '</div>' }
}

async function loadHealth() {
  const box = $('gov-health'); if (!box) return
  try {
    const j = await api('/api/metago/gate/health')
    const g = j.gates || {}, r = j.redteam || {}, d = j.toolsDiff || {}, f = j.threeFaces || {}
    const rows = [
      ['硬门 A 档', (g.passing || 0) + ' / ' + (g.tierA || 0) + (g.failing && g.failing.length ? '（FAIL: ' + g.failing.join(',') + '）' : '')],
      ['硬门 B 档候选', (g.tierB == null ? '—' : g.tierB + ' 个（未实跑）')],
      ['红队拦截率', (r.blockRate || '—') + '（' + (r.blocked || 0) + '/' + (r.highRiskCases || 0) + '）'],
      ['误伤', (r.falsePositive || 0) + '（' + (r.falsePositiveRate || '—') + '）'],
      ['红队判定', r.verdict || '—'],
      ['工具面 diff', (d.verdict || '—') + '（删 ' + (d.removed || 0) + ' / 增 ' + (d.added || 0) + '）'],
      ['三面', '技能 ' + (f.skills || '—') + ' · 法则 ' + (f.lawBytes || '—') + ' B · 包 ' + (f.packages || '—')],
    ]
    box.innerHTML = rows.map(([k, v]) => '<div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div>').join('')
  } catch (e) { box.innerHTML = '<div class="k">错误</div><div class="v">' + esc(e.message) + '</div>' }
}

async function loadGovernance() {
  try { await loadHealth() } catch { /* ignore */ }
  const box = $('gov-policy'); if (!box) return
  try {
    const j = await api('/api/metago/gate/policy')
    const p = j.policy || {}
    const rows = Object.entries(p).map(([k, v]) => (
      '<div class="k">' + esc(k) + '</div><div class="v">' + esc(typeof v === 'object' ? JSON.stringify(v) : v) + '</div>'
    ))
    box.innerHTML = rows.join('')
  } catch (e) { box.innerHTML = '<div class="k">错误</div><div class="v">' + esc(e.message) + '</div>' }
}

async function doExplain() {
  const out = $('ex-out'); const tool = ($('ex-tool') && $('ex-tool').value || '').trim()
  if (!out) return
  out.innerHTML = '<div class="k">查询中</div><div class="v">…</div>'
  try {
    const j = await api('/api/metago/gate/explain?tool=' + encodeURIComponent(tool))
    const rows = [
      ['工具', j.tool], ['等级', j.level], ['豁免', String(!!j.exempted)],
      ['命中规则', j.matchedRule], ['杀伤链阶段', (j.killChainStages || []).join(', ') || '（无）'],
      ['建议', j.advice], ['怎么改', j.howToChange],
    ]
    out.innerHTML = rows.map(([k, v]) => '<div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div>').join('')
  } catch (e) { out.innerHTML = '<div class="k">错误</div><div class="v">' + esc(e.message) + '</div>' }
}

async function loadMemory() {
  const kp = $('mem-kpis'); if (!kp) return
  try {
    const j = await api('/api/metago/gate/memory')
    if (!j.ok) { kp.innerHTML = '<div class="item">不可用：' + esc(j.error) + '</div>'; return }
    const cells = [
      ['空间', j.spaces], ['活跃', j.active], ['洞见', j.insights],
      ['图谱边', j.edges], ['已遗忘', j.deleted], ['库体积', (j.dbBytes / 1048576).toFixed(2) + ' MB'],
    ]
    kp.innerHTML = cells.map(([l, v]) => '<div><div class="n">' + esc(v) + '</div><div class="l">' + esc(l) + '</div></div>').join('')
    setText('mem-gap', j.gap || '')
  } catch (e) { kp.innerHTML = '<div class="item">读取失败：' + esc(e.message) + '</div>' }
}

async function loadOps() {
  const box = $('ops-kv'); if (!box) return
  try {
    const j = await api('/api/metago/gate/ops')
    const w = j.wbs || {}
    const rows = [
      ['轮次', j.round], ['阶段', j.phase], ['更新于', j.updatedAt],
      ['WBS 总数', w.total], ['DONE', w.done], ['PARTIAL', w.partial], ['NOT_DONE', w.notDone], ['CONFLICT', w.conflict],
      ['严格完成率', w.strictRate], ['含部分', w.withPartial],
      ['硬门 A 档', (j.gates && j.gates.tierAPassing) + ' / ' + (j.gates && j.gates.tierA)],
      ['硬门 B 档', (j.gates && j.gates.tierB) + ' 个候选'],
      ['底座', j.base], ['工具面 diff', j.toolsDiff],
    ]
    box.innerHTML = rows.map(([k, v]) => '<div class="k">' + esc(k) + '</div><div class="v">' + esc(v == null ? '—' : v) + '</div>').join('')
  } catch (e) { box.innerHTML = '<div class="k">错误</div><div class="v">' + esc(e.message) + '</div>' }
}

async function loadAudit() {
  const box = $('audit-list'); if (!box) return
  try {
    const j = await api('/api/metago/gate/audit?tail=50')
    setText('audit-total', (j.total || 0) + ' 条')
    const lines = (j.lines || []).slice().reverse()
    box.innerHTML = lines.length
      ? lines.map((x) => (
        '<div class="item"><div class="ti">' + esc(x.action) + ' · ' + (x.ok ? 'OK' : 'FAIL') + '</div>' +
        '<div class="me">' + esc(x.ts) + ' · ' + esc(x.ip) + ' · payloadKeys=' + esc((x.payloadKeys || []).join(',')) + (x.error ? ' · ' + esc(x.error) : '') + '</div></div>'
      )).join('')
      : '<div class="item">还没有动作记录。先在上面点几次"解释"。</div>'
  } catch (e) { box.innerHTML = '<div class="item">读取失败：' + esc(e.message) + '</div>' }
}

document.addEventListener('click', (ev) => {
  const t = ev.target
  if (t && t.id === 'ex-go') doExplain()
  if (t && t.dataset && t.dataset.mode) {
    setText('act-note', '要切换模式需带令牌，POST /api/metago/gate/action {action:"setMode",payload:{mode:"' + t.dataset.mode + '"}}')
  }
})

/* 首屏按 hash 决定显示哪页 */
try { showPage((location.hash || '').replace('#', '') || 'overview') } catch { /* ignore */ }

</script>
</body>
</html>`
}
