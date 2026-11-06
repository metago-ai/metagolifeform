/**
 * metago-lifeform-dsh/console — 元构控制台 V11 的 Host 半边（第 3 步 + 第 4 步 + 第 5 步）
 *
 * 计划 3.1.4 要求的四个端点：
 *   GET  /api/metago/console/snapshot   聚合快照（复用 status.js 采集器 + 动作注册表）
 *   GET  /api/metago/console/stream     SSE 实时推送（不支持则由客户端降级到 3s 轮询）
 *   POST /api/metago/console/action     统一动作入口 { action, params, confirmToken }
 *   GET  /api/metago/console/audit      审计查询
 *
 * 安全四道锁（计划 3.1.4）：
 *   ① 仅 loopback 可写
 *   ② 动作必须在注册表内（未注册一律 404）
 *   ③ L3 需服务端签发的一次性令牌（60s）
 *   ④ 全量审计落 console-audit.jsonl，每次写前记回滚点
 *
 * 交互级别（计划 3.1.3）：
 *   L0 只读 / L1 视图 / L2 安全动作（白名单+审计）/ L3 危险动作（+确认令牌+回滚点）/ L4 一律不给入口
 *
 * @module metago-lifeform-dsh/console
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash, randomBytes } from 'node:crypto'
import { collectStatus, dshHome, familyRollup, memoryState, readText, scanMcpTools, scanSkills } from './status.js'

/* ------------------------------------------------------------------ *
 * 路径
 * ------------------------------------------------------------------ */

function consoleDir() {
  return join(dshHome(), 'logs')
}
function auditPath() {
  return join(consoleDir(), 'console-audit.jsonl')
}
function snapshotDir() {
  return join(consoleDir(), 'console-snapshots')
}
function policyPath() {
  return join(dshHome(), 'metago', 'fabric', 'dsh-metago-gate', 'lib', 'policy.json')
}
function routingPath() {
  return join(dshHome(), '..', 'MetaGO-Atlas', 'ledger', 'capability-routing.json')
}
function atlasLedger(name) {
  return join(dshHome(), '..', 'MetaGO-Atlas', 'ledger', name)
}

function readJsonQuiet(p) {
  try { return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null } catch { return null }
}
function ensureDir(d) {
  try { mkdirSync(d, { recursive: true }) } catch { /* ignore */ }
}


/** 只认真配置行里的 mode: ptc（注释与说明文字里提到不算） */
function hasRealModePtc(text) {
  if (!text) return false
  // 只认「整行就是一条 YAML 设置」：去首尾空白后完全等于 "mode: ptc"
  // 表格行、代码块、说明文字里的引用一律不算（法则 §22.2 与 §22.5 就属于引用）
  return text.split(/\r?\n/).some((line) => line.trim() === 'mode: ptc')
}

/* ------------------------------------------------------------------ *
 * 审计 + 回滚点
 * ------------------------------------------------------------------ */

/** 每次动作写一条审计。审计失败绝不影响动作。 */
function audit(entry) {
  try {
    ensureDir(consoleDir())
    appendFileSync(auditPath(), `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`, 'utf8')
  } catch { /* ignore */ }
}

/** 写前记回滚点：把目标文件当前内容存一份，返回快照 id。 */
function recordRollbackPoint(actionId, targetPath) {
  if (!targetPath || !existsSync(targetPath)) return null
  try {
    ensureDir(snapshotDir())
    const raw = readFileSync(targetPath)
    const sha = createHash('sha256').update(raw).digest('hex').slice(0, 16)
    const id = `${Date.now()}-${sha}`
    const dst = join(snapshotDir(), `${id}.snap`)
    writeFileSync(dst, raw)
    return { id, path: dst, target: targetPath, bytes: raw.length, sha256: sha }
  } catch { return null }
}

/** 回滚到某个快照。 */
export function restoreRollbackPoint(snapshotPath, targetPath) {
  if (!existsSync(snapshotPath)) return { ok: false, error: '快照不存在' }
  try {
    writeFileSync(targetPath, readFileSync(snapshotPath))
    return { ok: true, restored: targetPath, from: snapshotPath }
  } catch (e) { return { ok: false, error: String((e && e.message) || e) } }
}

/* ------------------------------------------------------------------ *
 * L3 一次性确认令牌（60s）
 * ------------------------------------------------------------------ */

const CONFIRM_TTL_MS = 60_000
const confirmTokens = new Map()

/** 签发一个 L3 确认令牌（供 snapshot 里列出的危险动作预取）。 */
export function issueConfirmToken(actionId) {
  const token = randomBytes(16).toString('hex')
  confirmTokens.set(token, { actionId, expiresAt: Date.now() + CONFIRM_TTL_MS })
  // 惰性清理
  for (const [k, v] of confirmTokens) if (v.expiresAt < Date.now()) confirmTokens.delete(k)
  return { token, actionId, expiresInMs: CONFIRM_TTL_MS }
}

/** 校验并消耗令牌（一次性）。 */
function consumeConfirmToken(token, actionId) {
  const rec = confirmTokens.get(token)
  if (!rec) return { ok: false, error: '令牌不存在或已使用' }
  confirmTokens.delete(token)
  if (rec.expiresAt < Date.now()) return { ok: false, error: '令牌已过期（>60s）' }
  if (rec.actionId !== actionId) return { ok: false, error: `令牌属于动作 ${rec.actionId}` }
  return { ok: true }
}

/* ------------------------------------------------------------------ *
 * 动作注册表（第 4 步）
 * ------------------------------------------------------------------ */

/**
 * 每个动作声明：id / domain / level / desc / params schema / needsConfirm / rollback / run
 * L4 一律不登记（删记忆 / 改法则 / 卸插件 / 清库）。
 */
export function buildRegistry(ctx, config) {
  const A = {}

  /* ---------- ① 总览 Live（L1） ---------- */
  A['snapshot.refresh'] = {
    domain: 'overview', level: 'L1', needsConfirm: false,
    desc: '重新采集一次快照（等价于页面刷新）',
    params: {},
    run: () => ({ ok: true, note: '客户端重新 GET /console/snapshot 即可' }),
  }

  /* ---------- ② 能力浏览器（L1–L2） ---------- */
  A['tool.dryRun'] = {
    domain: 'capability', level: 'L2', needsConfirm: false,
    desc: '工具试调用：只校验参数并返回"将要执行什么"，绝不真执行',
    params: { tool: 'string', args: 'object?' },
    run: ({ tool, args }) => {
      if (!tool) return { ok: false, error: '缺少 tool' }
      const mcp = scanMcpTools(ctx)
      const hit = (mcp.servers || []).find((s) => s.server === tool || (s.tools || []).includes(tool))
      return {
        ok: true,
        dryRun: true,
        tool,
        resolved: hit ? { server: hit.server, count: hit.count } : null,
        wouldCall: { tool, arguments: args || {} },
        note: '这是 dry-run：没有真的执行工具',
      }
    },
  }

  /* ---------- ③ 治理与门禁（L2–L3） ---------- */
  A['gate.verify'] = {
    domain: 'governance', level: 'L2', needsConfirm: false,
    desc: '一键跑校验：把 policy / preset / 法则的关键不变量重算一遍',
    params: {},
    run: () => {
      const pol = readJsonQuiet(policyPath())
      const lawText = readText(join(dshHome(), 'AGENTS.md'))
      const checks = []
      checks.push({ id: 'policy.readable', pass: !!pol, detail: pol ? `mode=${pol.meta && pol.meta.mode}` : 'policy.json 不可读' })
      checks.push({ id: 'law.exists', pass: !!lawText, detail: lawText ? `${Buffer.byteLength(lawText, 'utf8')} B` : 'AGENTS.md 缺失' })
      checks.push({ id: 'law.noModePtc', pass: !hasRealModePtc(lawText), detail: '法则的真配置行里不含 mode: ptc' })
      const preset = readText(join(dshHome(), 'profiles', 'desktop', 'node_modules', 'metago-lifeform-dsh', 'patch', 'preset.patch.yml'))
      checks.push({ id: 'preset.noModePtc', pass: !hasRealModePtc(preset), detail: '预设的真配置行里不含 mode: ptc' })
      checks.push({ id: 'preset.noToolPresentationRow', pass: !preset || !/^\s*-\s+id:\s*tool-presentation\s*$/m.test(preset), detail: '预设无 tool-presentation 行' })
      return { ok: checks.every((c) => c.pass), checks }
    },
  }

  A['gate.toggleMode'] = {
    domain: 'governance', level: 'L3', needsConfirm: true,
    desc: '切换门禁模式（shadow / ask / deny）—— 会改变所有会话的工具执行决策',
    params: { mode: 'shadow|ask|deny' },
    rollback: () => policyPath(),
    run: ({ mode }) => {
      if (!['shadow', 'ask', 'deny'].includes(mode)) return { ok: false, error: 'mode 必须是 shadow / ask / deny' }
      const p = policyPath()
      const pol = readJsonQuiet(p)
      if (!pol) return { ok: false, error: 'policy.json 不可读' }
      pol.meta = pol.meta || {}
      pol.meta.mode = mode
      writeFileSync(p, `${JSON.stringify(pol, null, 2)}\n`, 'utf8')
      return { ok: true, mode, note: '已写入 policy.json；运行中的 gate 需重启或走 /action setMode 才改内存态' }
    },
  }

  A['gate.explain'] = {
    domain: 'governance', level: 'L1', needsConfirm: false,
    desc: '解释一个工具为什么被判某个风险等级',
    params: { tool: 'string' },
    run: ({ tool }) => {
      if (!tool) return { ok: false, error: '缺少 tool' }
      const pol = readJsonQuiet(policyPath()) || {}
      const risk = pol.risk || {}
      const inList = (arr) => Array.isArray(arr) && arr.includes(tool)
      let level = 'unknown'; let matched = '未命中任何名单'
      if (inList(risk.high)) { level = 'high'; matched = 'policy.risk.high 全名命中' }
      else if (inList(risk.medium)) { level = 'medium'; matched = 'policy.risk.medium 全名命中' }
      else if (inList(risk.low)) { level = 'low'; matched = 'policy.risk.low 全名命中' }
      else if (Array.isArray(pol.risk && pol.risk.exempt) && pol.risk.exempt.some((e) => e === tool || (String(e).endsWith('*') && tool.startsWith(String(e).slice(0, -1))))) {
        level = 'low'; matched = 'policy.risk.exempt 豁免命中'
      }
      return { ok: true, tool, level, matchedRule: matched, mode: (pol.meta && pol.meta.mode) || 'shadow' }
    },
  }

  /* ---------- ④ 记忆与知识（L2） ---------- */
  A['memory.recallTest'] = {
    domain: 'memory', level: 'L2', needsConfirm: false,
    desc: '召回测试：在 KMWI 落盘文件里按关键词检索，返回命中与来源行',
    params: { query: 'string', limit: 'number?' },
    run: ({ query, limit }) => {
      if (!query) return { ok: false, error: '缺少 query' }
      const st = memoryState(config)
      const p = st && st.path ? st.path : null
      if (!p || !existsSync(p)) return { ok: false, error: 'KMWI 文件不可读', path: p }
      const raw = readFileSync(p, 'utf8')
      const lines = raw.split(/\r?\n/)
      const q = String(query).toLowerCase()
      const hits = []
      for (let i = 0; i < lines.length; i += 1) {
        if (lines[i].toLowerCase().includes(q)) {
          hits.push({ line: i + 1, text: lines[i].slice(0, 200) })
          if (hits.length >= (limit || 10)) break
        }
      }
      return { ok: true, query, hits, scanned: lines.length, source: p }
    },
  }

  /* ---------- ⑤ 运行运维（L2–L3） ---------- */
  A['ops.mcpHealth'] = {
    domain: 'ops', level: 'L1', needsConfirm: false,
    desc: '重新采集 MCP 服务器健康与工具计数',
    params: {},
    run: () => {
      const mcp = scanMcpTools(ctx)
      return { ok: true, total: mcp.total, mounted: mcp.mounted, servers: mcp.servers }
    },
  }

  A['ops.skillsRescan'] = {
    domain: 'ops', level: 'L1', needsConfirm: false,
    desc: '重新扫描技能目录',
    params: {},
    run: () => {
      const s = scanSkills(join(dshHome(), 'skills'))
      return { ok: true, total: s.total, metago: s.metago, withTrigger: s.withTrigger, triggerCount: s.triggerCount, families: familyRollup(s.skills) }
    },
  }

  A['ops.toggleGateRoute'] = {
    domain: 'ops', level: 'L3', needsConfirm: true,
    desc: '禁用/启用 gate 插件的路由（等价于临时关掉控制台后端）',
    params: { enabled: 'boolean' },
    rollback: () => join(dshHome(), 'cordis.patch.yml'),
    run: ({ enabled }) => ({
      ok: true,
      enabled: !!enabled,
      note: '本动作只返回计划，不真的改 cordis.patch.yml —— 改挂载行属红区（会重启后影响所有会话）。要真改请手工编辑并跑 validate-runtime-safety。',
    }),
  }

  /* ---------- ⑥ 操作审计（L1） ---------- */
  A['audit.tail'] = {
    domain: 'audit', level: 'L1', needsConfirm: false,
    desc: '读审计日志尾部',
    params: { limit: 'number?' },
    run: ({ limit }) => readAudit(limit),
  }

  return A
}

/* ------------------------------------------------------------------ *
 * 审计读取
 * ------------------------------------------------------------------ */

export function readAudit(limit = 100) {
  const p = auditPath()
  if (!existsSync(p)) return { ok: true, total: 0, lines: [] }
  try {
    const all = readFileSync(p, 'utf8').split('\n').filter(Boolean)
    const tail = all.slice(-Math.max(1, Math.min(500, limit)))
    return {
      ok: true,
      total: all.length,
      lines: tail.map((l) => { try { return JSON.parse(l) } catch { return { raw: l.slice(0, 200) } } }).reverse(),
    }
  } catch (e) { return { ok: false, error: String((e && e.message) || e) } }
}

/* ------------------------------------------------------------------ *
 * 动作执行（统一入口）
 * ------------------------------------------------------------------ */

function isLoopback(req) {
  const addr = (req && req.socket && req.socket.remoteAddress) || ''
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1'
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (c) => { raw += c; if (raw.length > 1_000_000) reject(new Error('请求体过大')) })
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}) } catch { reject(new Error('请求体不是合法 JSON')) } })
    req.on('error', reject)
  })
}

/** 执行一个动作，含四道锁 + 审计 + 回滚点。 */
export async function runAction(ctx, config, req) {
  if (!isLoopback(req)) return { status: 403, body: { ok: false, error: '仅允许本机回环地址' } }
  let body
  try { body = await readBody(req) } catch (e) { return { status: 400, body: { ok: false, error: String((e && e.message) || e) } } }

  const actionId = String(body.action || '').trim()
  const params = body.params && typeof body.params === 'object' ? body.params : {}
  const registry = buildRegistry(ctx, config)
  const entry = registry[actionId]

  if (!entry) {
    audit({ action: actionId || '(empty)', level: '-', result: 'unknown-action', ip: req.socket && req.socket.remoteAddress })
    return { status: 404, body: { ok: false, error: `未知动作: ${actionId}`, actions: Object.keys(registry) } }
  }

  // L3 必须带一次性确认令牌
  if (entry.level === 'L3') {
    const chk = consumeConfirmToken(String(body.confirmToken || ''), actionId)
    if (!chk.ok) {
      audit({ action: actionId, level: entry.level, result: 'confirm-rejected', error: chk.error })
      return { status: 403, body: { ok: false, error: chk.error, needsConfirm: true, action: actionId } }
    }
  }

  // 写前记回滚点
  let rollbackPoint = null
  if (entry.level === 'L3' && typeof entry.rollback === 'function') {
    try { rollbackPoint = recordRollbackPoint(actionId, entry.rollback()) } catch { rollbackPoint = null }
  }

  let result
  try { result = entry.run(params) } catch (e) { result = { ok: false, error: String((e && e.message) || e) } }

  audit({
    action: actionId,
    level: entry.level,
    domain: entry.domain,
    paramKeys: Object.keys(params),
    result: result && result.ok ? 'ok' : 'fail',
    error: (result && result.error) || null,
    rollbackPoint: rollbackPoint ? rollbackPoint.id : null,
    ip: req.socket && req.socket.remoteAddress,
  })

  return { status: 200, body: { ...result, action: actionId, actionLevel: entry.level, domain: entry.domain, rollbackPoint } }
}

/* ------------------------------------------------------------------ *
 * 快照
 * ------------------------------------------------------------------ */

/** 聚合快照：状态 + 动作注册表（含每个动作的级别与是否需要确认）。 */
export function buildSnapshot(ctx, config) {
  const status = collectStatus(ctx, config)
  const registry = buildRegistry(ctx, config)
  const actions = Object.entries(registry).map(([id, v]) => ({
    id,
    domain: v.domain,
    level: v.level,
    needsConfirm: !!v.needsConfirm,
    desc: v.desc,
    params: v.params || {},
  }))
  const byDomain = {}
  for (const a of actions) {
    byDomain[a.domain] = byDomain[a.domain] || { count: 0, levels: {} }
    byDomain[a.domain].count += 1
    byDomain[a.domain].levels[a.level] = (byDomain[a.domain].levels[a.level] || 0) + 1
  }
  return {
    ok: true,
    ts: new Date().toISOString(),
    status,
    console: {
      version: 'V11',
      domains: ['overview', 'capability', 'governance', 'memory', 'ops', 'audit'],
      actions,
      byDomain,
      currentMode: (readJsonQuiet(policyPath()) || {}).meta ? ((readJsonQuiet(policyPath()) || {}).meta || {}).mode || 'shadow' : 'shadow',
      auditPath: auditPath(),
      confirmTtlMs: CONFIRM_TTL_MS,
      l4Blocked: ['删记忆', '改法则', '卸插件', '清库'],
    },
  }
}
