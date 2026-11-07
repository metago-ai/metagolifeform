/**
 * dsh-metago-gate — MetaGO Fabric V11 治理门禁（Host half，影子模式）
 *
 * 把元构的四项治理设计（四层安全基因 / PEA / Promptware 七阶段 / 决策锁）
 * 挂到 DSH 原生的 9 个钩子事件上。
 *
 * 设计原则（按 V37.1-04 三条红线）：
 *   1. 不改 DSH 内核 —— 只用公开的钩子面
 *   2. 不改法则平台白名单 —— 本插件自带的策略表就是它的实现
 *   3. 默认 shadow 模式 —— 只记录、只看、绝不改判，零行为变化
 *
 * 安全约束（每一处都必须遵守）：
 *   - 所有钩子回调整体 try/catch，永不抛出（一个插件错误不得拖垮宿主）
 *   - 所有 I/O 失败静默降级（记不进日志就不记，绝不因此中断任务）
 *   - 绝不修改 `next()` 的返回值，除非 mode 明确是 ask/deny
 *
 * @module dsh-metago-gate
 */

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildRoutes } from './console.js'

export const name = 'dsh-metago-gate'

/** 本插件不依赖任何服务：只用 ctx.on，因此不声明 inject。 */

/* ------------------------------------------------------------------ *
 * 策略加载
 * ------------------------------------------------------------------ */

const HERE = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const POLICY_PATH = join(HERE, 'policy.json')

let POLICY = null
try {
  POLICY = JSON.parse(readFileSync(POLICY_PATH, 'utf8'))
} catch (error) {
  POLICY = null
  // 策略加载失败时插件退化为"纯记录器"，不做任何判定
  console.error('[metago-gate] policy.json 读取失败，退化为只记录模式:', error && error.message)
}

/** 运行时状态：只在内存，不落盘（落盘的只有事件流）。 */
const state = {
  mode: (POLICY && POLICY.meta && POLICY.meta.mode) || 'shadow',
  toolCalls: 0,
  stageHits: 0,
  escalations: 0,
  logFailures: 0,
  startedAt: new Date().toISOString(),
  lastEvents: [],
}

/* ------------------------------------------------------------------ *
 * 日志（容错写）
 * ------------------------------------------------------------------ */

function logDir() {
  const home = process.env.DSH_HOME || '$DSH_HOME\\home'
  return join(home, 'metago', 'fabric', 'logs')
}

function writeEvent(record) {
  try {
    const dir = logDir()
    mkdirSync(dir, { recursive: true })
    const day = new Date().toISOString().slice(0, 10)
    appendFileSync(join(dir, `gate-${day}.jsonl`), `${JSON.stringify(record)}\n`, 'utf8')
  } catch {
    state.logFailures += 1
  }
  // 内存环形缓冲，供 /api 查询（最多 50 条）
  state.lastEvents.push(record)
  if (state.lastEvents.length > 50) state.lastEvents.shift()
}

/* ------------------------------------------------------------------ *
 * 判定核心（纯函数，可单测）
 * ------------------------------------------------------------------ */

/** 按策略表判定原始风险等级（不含白名单豁免） */
function rawRiskOf(toolName) {
  const r = POLICY.risk
  if (r.high.includes(toolName)) return 'high'
  if (r.medium.includes(toolName)) return 'medium'
  if (r.low.includes(toolName)) return 'low'
  // 前缀匹配（如 mcp__playwright__browser_run_code_unsafe 已在 high 全名列出）
  if (r.high.some((t) => t.endsWith('*') && toolName.startsWith(t.slice(0, -1)))) return 'high'
  if (r.medium.some((t) => t.endsWith('*') && toolName.startsWith(t.slice(0, -1)))) return 'medium'
  return r.defaultRisk || 'low'
}

/**
 * 工具名 → 风险等级（含白名单豁免）
 *
 * 白名单（policy.risk.exempt）优先于一切：命中即判 low，并标记 exempted=true。
 * 用途：那些「名字看起来高危、实际只读」的工具（例如只读的 shell 查询封装）。
 * **空数组时不改变任何行为** —— 这是本函数上线的安全前提。
 */
export function riskDetailOf(toolName) {
  if (!POLICY || typeof toolName !== 'string') {
    return { level: 'low', exempted: false, reason: 'invalid-input' }
  }
  const ex = POLICY.risk && POLICY.risk.exempt
  if (Array.isArray(ex) && ex.length) {
    if (ex.includes(toolName)) return { level: 'low', exempted: true, reason: 'exempt-exact' }
    if (ex.some((t) => typeof t === 'string' && t.endsWith('*') && toolName.startsWith(t.slice(0, -1)))) {
      return { level: 'low', exempted: true, reason: 'exempt-prefix' }
    }
  }
  return { level: rawRiskOf(toolName), exempted: false, reason: 'policy' }
}

/** 工具名 → 风险等级（向后兼容的薄包装，返回值与改动前完全一致） */
export function riskOf(toolName) {
  return riskDetailOf(toolName).level
}

/**
 * 工具名 → 完整判定解释（供 /api/metago/gate/explain 用）
 *
 * 返回：{ level, exempted, reason, matchedRule, killChainStages, advice }
 * 纯只读，不写任何状态。
 */
export function explainTool(toolName) {
  const d = riskDetailOf(toolName)
  const out = {
    level: d.level,
    exempted: d.exempted,
    reason: d.reason,
    matchedRule: null,
    killChainStages: [],
    advice: null,
    howToChange: null,
  }

  // 命中的是哪一条规则
  if (d.exempted) {
    out.matchedRule = d.reason === 'exempt-exact'
      ? `policy.risk.exempt 精确命中 "${toolName}"`
      : 'policy.risk.exempt 前缀命中'
  } else if (POLICY && POLICY.risk) {
    const r = POLICY.risk
    if (r.high.includes(toolName)) out.matchedRule = 'policy.risk.high 全名命中'
    else if (r.medium.includes(toolName)) out.matchedRule = 'policy.risk.medium 全名命中'
    else if (r.low.includes(toolName)) out.matchedRule = 'policy.risk.low 全名命中'
    else if (r.high.some((x) => x.endsWith('*') && toolName.startsWith(x.slice(0, -1)))) out.matchedRule = 'policy.risk.high 前缀命中'
    else if (r.medium.some((x) => x.endsWith('*') && toolName.startsWith(x.slice(0, -1)))) out.matchedRule = 'policy.risk.medium 前缀命中'
    else out.matchedRule = `未命中任何名单，落到 defaultRisk="${r.defaultRisk || 'low'}"`
  }

  // 会触发哪些杀伤链阶段
  try {
    const v = assess({ toolName, input: '' })
    out.killChainStages = v.stages || []
    out.advice = v.advice || null
    out.why = v.why || null
  } catch (error) {
    out.killChainStages = []
    out.advice = 'assess-error'
    out.why = String((error && error.message) || error)
  }

  // 怎么改（给操作建议，不是自动改）
  if (out.level === 'high' && !out.exempted) {
    out.howToChange = '要降低判定：确认它真的只读后，把工具名加进 policy.json 的 risk.exempt（支持 foo* 前缀）。加前必答三问见 gate-manual.md §四。'
  } else if (out.level === 'low') {
    out.howToChange = '已是低风险，无需处理。'
  } else {
    out.howToChange = '如需调整，改 policy.risk.{high,medium,low} 名单或加 exempt。'
  }

  return out
}

/** 从工具入参里抽取可扫描文本 */
function harvestText(input) {
  if (input == null) return ''
  if (typeof input === 'string') return input
  const parts = []
  const walk = (v, depth) => {
    if (depth > 4 || v == null) return
    if (typeof v === 'string') { parts.push(v); return }
    if (Array.isArray(v)) { for (const x of v) walk(x, depth + 1); return }
    if (typeof v === 'object') { for (const x of Object.values(v)) walk(x, depth + 1) }
  }
  walk(input, 0)
  return parts.join('\n')
}

/** Promptware 七阶段检测 */
export function detectStages(text, intentText = '') {
  const hits = []
  if (!POLICY || !POLICY.killChain) return hits
  for (const stage of POLICY.killChain.stages) {
    const hay = stage.targets.includes('intent')
      ? `${text}\n${intentText}`
      : text
    for (const p of stage.patterns) {
      let re
      try { re = new RegExp(p, 'i') } catch { continue }
      if (re.test(hay)) {
        hits.push({ id: stage.id, name: stage.name, pattern: p })
        break
      }
    }
  }
  return hits
}

/** 四层安全基因：本应触发哪一层 */
export function layersFor(toolName) {
  const out = []
  if (!POLICY || !POLICY.fourLayers) return out
  const f = POLICY.fourLayers
  for (const key of ['L1_审批', 'L2_授权', 'L3_隔离']) {
    const cfg = f[key]
    if (cfg && Array.isArray(cfg.tools) && cfg.tools.includes(toolName)) out.push(key)
  }
  if (f.L4_审计 && f.L4_审计.always) out.push('L4_审计')
  return out
}

/** 占位符检测（决策锁 V1.1 内容完整性） */
export function detectPlaceholders(text) {
  if (!POLICY || !POLICY.completeness || typeof text !== 'string') return []
  return POLICY.completeness.placeholderPatterns.filter((p) => text.includes(p))
}

/**
 * 综合判定：给定一次工具调用，返回"影子模式下的建议处置"。
 * 注意：shadow 模式下本函数的返回值只用于记录，不改变真实决策。
 */
export function assess({ toolName, input, intentText = '' }) {
  const risk = riskOf(toolName)
  const text = harvestText(input)
  const stages = detectStages(text, intentText)
  const layers = layersFor(toolName)
  const escalateAt = (POLICY && POLICY.killChain && POLICY.killChain.escalateAtStages) || 3

  let advice = 'allow'
  let why = []
  if (stages.some((s) => s.id === 'L7')) { advice = 'block_and_quarantine'; why.push('命中 L7 目标执行') }
  else if (stages.some((s) => s.id === 'L6')) { advice = 'block_and_immunize'; why.push('命中 L6 横向移动') }
  else if (stages.length >= escalateAt) { advice = 'block_and_alert'; why.push(`命中 ${stages.length} 个阶段（阈值 ${escalateAt}）`) }
  else if (risk === 'high' && layers.includes('L1_审批')) { advice = 'ask'; why.push('高危工具落在审批层') }

  return {
    toolName,
    risk,
    stages: stages.map((s) => s.id),
    stageNames: stages.map((s) => s.name),
    layers,
    advice,
    why,
  }
}

/* ------------------------------------------------------------------ *
 * Cordis 插件入口
 * ------------------------------------------------------------------ */

/**
 * 路由摘要（供 system-prompt/assemble 注入用）。
 * 当前**不注入**，只用来报"若要注入会有多少字符"。
 * 真要注入时必须：① 加显式开关 ② 算影响面 ③ 隔离空跑 ④ 演练回滚（四道闸）。
 */
/** 读控制台写动作令牌；文件不存在则返回空串（写动作会被禁用） */
export function readToken() {
  try {
    // 与 console.js 同一个 home 解析口径
    const home = process.env.DSH_HOME || '$DSH_HOME\\home'
    const p = home + '\\metago\\fabric\\dsh-metago-gate\\lib\\console-token.json'
    if (!existsSync(p)) return ''
    const j = JSON.parse(readFileSync(p, 'utf8'))
    return String((j && j.token) || '')
  } catch { return '' }
}

export const ROUTE_DIGEST = [
  '能力路由（26 类）：数值计算→metago-algorithms；耦合/价值/决策/推理→族工具；',
  '原子→metago_atom；PPT/Word/Excel/设计/研究→metago-work；3D→metago-3d；',
  '易理→yili；浏览器→playwright；采集→scrapling；逆向→rea；文件→read/write/glob/grep；',
  '影片→film_*；音视频→ffmpeg_*；系统取证→metago_lifeform_status。',
].join('')

export function apply(ctx) {
  // 急停开关：设置环境变量 METAGO_GATE=off 即完全跳过钩子与路由（无需改配置）。
  if (String(process.env.METAGO_GATE || '').toLowerCase() === 'off') {
    try { console.log('[metago-gate] METAGO_GATE=off — hooks and routes skipped') } catch { /* ignore */ }
    return () => {}
  }

  const stops = []

  /* -- tools/pre-execute：waterfall，返回 decision ------------------ */
  stops.push(ctx.on('tools/pre-execute', async (execution, next) => {
    const started = Date.now()
    let decision
    try {
      decision = await next()
    } catch (error) {
      // 下游自己抛错，原样上抛语义（不是我们能管的），但要留痕
      try {
        writeEvent({ ts: new Date().toISOString(), event: 'pre-execute-downstream-error', message: String(error && error.message) })
      } catch { /* ignore */ }
      throw error
    }

    try {
      // 契约（host/Event · tools/pre-execute）：exec 是 ToolExecution，
      // 真实字段是 `name` 与 `arguments`（不是 toolName / input / args）。
      const toolName = (execution && (execution.name || execution.toolName)) || 'unknown'
      const input = (execution && (execution.arguments !== undefined ? execution.arguments : execution.input)) || null
      const verdict = assess({ toolName, input })
      state.toolCalls += 1
      state.stageHits += verdict.stages.length
      if (verdict.advice !== 'allow') state.escalations += 1

      writeEvent({
        ts: new Date().toISOString(),
        event: 'pre-execute',
        mode: state.mode,
        toolName: verdict.toolName,
        risk: verdict.risk,
        stages: verdict.stages,
        layers: verdict.layers,
        advice: verdict.advice,
        why: verdict.why,
        downstream: decision && decision.kind ? decision.kind : String(decision),
        ms: Date.now() - started,
      })
    } catch { /* 记录失败绝不影响执行 */ }

    // ---- 关键：shadow 模式永不改判 ----
    if (state.mode === 'shadow') return decision

    // 非 shadow 模式下的最小升级逻辑（默认不启用）
    try {
      const toolName = (execution && (execution.name || execution.toolName)) || 'unknown'
      const input = (execution && (execution.arguments !== undefined ? execution.arguments : execution.input)) || null
      const v = assess({ toolName, input })
      if (decision && decision.kind === 'allow' && v.advice === 'ask') return { kind: 'ask' }
      if (decision && decision.kind === 'allow' && v.advice.startsWith('block')) return { kind: 'cancel' }
    } catch { /* ignore */ }

    return decision
  }, { prepend: true }))

  /* -- tools/result：emit，审计层 L4（脉冲见证本地等价物）---------- */
  stops.push(ctx.on('tools/result', (execution, result) => {
    try {
      const toolName = (execution && (execution.name || execution.toolName)) || 'unknown'
      writeEvent({
        ts: new Date().toISOString(),
        event: 'result',
        toolName,
        isError: !!(result && result.isError),
        ms: null,
      })
    } catch { /* ignore */ }
  }))

  /* -- agent/turn-stopping：交付门禁（只统计，不拦）----------------- */
  // ⚠️ 契约（cordis_inspect_query · host/Event · 2026-11-04 实测）：
  //   mode: serial · signature: (payload: { agent, turn, signal }) => Promise<void> | void
  //   **serial 事件没有 next**。v0.1.0 在这里写了 `return next()`，
  //   导致每轮收尾必抛 `TypeError: next is not a function` → 整轮被判失败。
  //   本 v0.1.1 起：不收 next、不返回任何值、异常全吞。
  stops.push(ctx.on('agent/turn-stopping', (payload) => {
    try {
      writeEvent({
        ts: new Date().toISOString(),
        event: 'turn-stopping',
        turn: payload && payload.turn,
        placeholderScan: 'deferred',
      })
    } catch { /* serial 回调绝不允许抛出：抛出会终止本轮 */ }
    // serial 模式：没有 next 可调，也没有返回值契约
  }))

  /* -- fs/write-intent：waterfall (target, actor, next) -----------------
   * 契约实测：waterfall，有 next；返回 Promise<FsWriteIntent | undefined>。
   * 本钩子**只观察，不改返回值** —— await next() 拿到 outcome 后原样 return。
   * 用途：留痕"谁要写哪个目标"，为将来的写前审批攒数据。
   * 绝不做的事：不因风险而返回不同的 outcome（那会改变写入行为，属红区）。 */
  stops.push(ctx.on('fs/write-intent', async (target, actor, next) => {
    let outcome
    try {
      outcome = await next()
    } catch (error) {
      try {
        writeEvent({
          ts: new Date().toISOString(),
          event: 'fs-write-intent-downstream-error',
          message: String((error && error.message) || error),
        })
      } catch { /* ignore */ }
      throw error
    }
    try {
      writeEvent({
        ts: new Date().toISOString(),
        event: 'fs-write-intent',
        mode: state.mode,
        target: target && (target.path || target.name || String(target)) || 'unknown',
        hasIntent: outcome !== undefined && outcome !== null,
        intentKeys: outcome && typeof outcome === 'object' ? Object.keys(outcome) : [],
        actorSeen: actor !== undefined,
      })
      state.fsIntents = (state.fsIntents || 0) + 1
    } catch { /* ignore */ }
    return outcome
  }))

  /* -- system-prompt/assemble：waterfall (assembly, context, next) ------
   * 契约实测：waterfall，有 next；返回 Promise<PromptAssembly>。
   * 默认**只观察不注入**：改提示词会影响所有会话，属红区决策（V37.1-06 §22.3）。
   * METAGO_ROUTE_INJECT=1 只是显式开关位，当前即使为 1 也只记账，不真改 assembly。 */
  stops.push(ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    let nextAssembly
    try {
      nextAssembly = await next()
    } catch (error) {
      try {
        writeEvent({
          ts: new Date().toISOString(),
          event: 'sp-assemble-downstream-error',
          message: String((error && error.message) || error),
        })
      } catch { /* ignore */ }
      throw error
    }
    try {
      const a = nextAssembly || {}
      const sections = Array.isArray(a.sections) ? a.sections.length : null
      const contexts = Array.isArray(a.contexts) ? a.contexts.length : null
      const tools = Array.isArray(a.tools) ? a.tools.length : (a.tools && typeof a.tools === 'object' ? Object.keys(a.tools).length : null)
      const keys = a && typeof a === 'object' ? Object.keys(a) : []
      const injectSwitch = String(process.env.METAGO_ROUTE_INJECT || '') === '1'

      // ---- P5-05：真正注入（仅当 METAGO_ROUTE_INJECT=1）----
      // 默认不设该环境变量 → 下面整段不执行，行为与注入前完全一致。
      // ROUTE_DIGEST 本身已是一段 join 好的纯文本（实测 229 字符），直接作为一条 context 追加。
      let injected = false
      let injectedChars = 0
      if (injectSwitch) {
        try {
          const asm = nextAssembly && typeof nextAssembly === 'object' ? nextAssembly : null
          if (asm) {
            const list = Array.isArray(asm.contexts) ? asm.contexts : []
            const already = list.some((c) => c && typeof c === 'object' && c.metagoRouteDigest === true)
            if (!already) {
              list.push({ type: 'text', metagoRouteDigest: true, text: ROUTE_DIGEST })
              asm.contexts = list
              injected = true
              injectedChars = ROUTE_DIGEST.length
            }
          }
        } catch { /* 注入失败绝不影响会话：宁可没注入，不可让提示词坏掉 */ }
      }
      writeEvent({
        ts: new Date().toISOString(),
        event: 'system-prompt-assemble',
        mode: state.mode,
        topLevelKeys: keys,
        sections,
        contexts,
        tools,
        // 若将来启用注入，摘要会是这么多字符；现在只报数字，不改内容
        routeDigestChars: ROUTE_DIGEST.length,
        injectSwitch: injectSwitch ? 'on' : 'off',
        injected: false,
      })
      state.promptAssemblies = (state.promptAssemblies || 0) + 1
    } catch { /* ignore */ }
    return nextAssembly
  }))

  /* -- HTTP 面：/api/metago/gate/*（只新增路径，不碰既有 /api/metago/*）-- */
  // webServer 不在 inject 里：这样即使 Web 服务不可用，钩子仍然照常工作。
  try {
    const web = ctx && ctx.webServer
    if (web && typeof web.register === 'function') {
      const routes = buildRoutes({
        getSnapshot: snapshot,
        applyMode: (mode) => { state.mode = mode },
        explainTool,
        getMode: () => state.mode,
        readToken,
      })
      for (const route of routes) {
        try {
          ctx.effect(() => {
            const dispose = web.register(route)
            return () => { try { dispose() } catch { /* ignore */ } }
          }, `dsh-metago-gate: ${route.path}`)
        } catch (error) {
          // 单条路由注册失败（例如路径已被占用）不影响其余路由与钩子
          try { writeEvent({ ts: new Date().toISOString(), event: 'route-register-failed', path: route.path, message: String(error && error.message) }) } catch { /* ignore */ }
        }
      }
      state.routesMounted = true
    }
  } catch { /* 无 webServer 时静默跳过，钩子不受影响 */ }

  /* -- 清理 --------------------------------------------------------- */
  return () => {
    for (const stop of stops) {
      try { if (typeof stop === 'function') stop() } catch { /* ignore */ }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 供控制台读取的运行时快照
 * ------------------------------------------------------------------ */

export function snapshot() {
  return {
    plugin: name,
    version: '0.1.1',
    mode: state.mode,
    policyLoaded: POLICY !== null,
    routesMounted: !!state.routesMounted,
    startedAt: state.startedAt,
    toolCalls: state.toolCalls,
    stageHits: state.stageHits,
    escalations: state.escalations,
    logFailures: state.logFailures,
    recent: state.lastEvents.slice(-10),
  }
}
