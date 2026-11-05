/**
 * atom-dispatch.mjs — 元构 597 条原子的统一分发层（纯函数，无 Cordis 依赖）
 *
 * 设计定案（见 V37.1-07）：
 *   1 个工具 + operation 字符串，而不是 597 个工具。
 *   理由：工具面 651 → 1248（+92%），且工具面越大越容易触发「全 defer」类故障（INC-002）。
 *
 * 三种模式：
 *   invoke   —— 调用（impl(input) → validate(id, output)）
 *   describe —— 返回该原子的契约与可调用性（不执行）
 *   list     —— 按 action / domain / status 过滤返回 ID 列表（不执行）
 *
 * 铁律：
 *   · 任何异常都在本层捕获，返回 ok:false，绝不向上抛（INC-001 教训）
 *   · unsupported 必须带 reason，禁止用 null/空对象冒充成功
 *   · 成功必须回传 contract（action/domain/src），可溯源（A1）
 *   · 契约校验不通过时保留 output，只标 degraded，不静默丢弃
 *
 * @module atom-dispatch
 */

import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)

const DEFAULT_ENGINE_ATOMS = '%APPDATA%/npm/node_modules/@metago-ai/engine/atoms'
const DEFAULT_INDEX = '$METAGO_LIFEFORM_HOME\\ledger\\atom-index.json'

/** 运行时状态（进程内单例） */
const state = {
  loaded: false,
  index: null,           // atom-index.json 的内容
  byId: new Map(),       // id -> row
  factory: null,
  validator: null,
  loadError: null,
  stats: { invoke: 0, describe: 0, list: 0, errors: 0, unsupported: 0, degraded: 0 },
}

/**
 * 惰性加载：索引 + 引擎工厂 + 契约校验器
 * @param {{atomsDir?: string, indexFile?: string}} [opts]
 */
export function load(opts = {}) {
  if (state.loaded) return { ok: true, cached: true }
  const atomsDir = opts.atomsDir || DEFAULT_ENGINE_ATOMS
  const indexFile = opts.indexFile || DEFAULT_INDEX
  try {
    state.factory = require(`${atomsDir}/atom-factory.cjs`)
    try { state.validator = require(`${atomsDir}/contract-validator.cjs`) } catch { state.validator = null }
  } catch (error) {
    state.loadError = `引擎原子层加载失败: ${error && error.message}`
    return { ok: false, error: state.loadError }
  }
  if (existsSync(indexFile)) {
    try {
      state.index = JSON.parse(readFileSync(indexFile, 'utf8'))
      for (const row of state.index.rows || []) state.byId.set(row.id, row)
    } catch (error) {
      state.loadError = `索引读取失败: ${error && error.message}`
      state.index = null
    }
  }
  state.loaded = true
  return { ok: true, cached: false, indexed: state.byId.size, hasValidator: state.validator !== null }
}

function ensure() {
  if (!state.loaded) {
    const r = load()
    if (!r.ok) throw new Error(r.error)
  }
  if (!state.factory) throw new Error(state.loadError || '引擎未加载')
}

/** 全部原子 ID（优先用索引；索引缺失时退回工厂） */
export function allIds() {
  ensure()
  if (state.byId.size) return [...state.byId.keys()]
  const all = state.factory.getAllContracts()
  return Object.keys(all)
}

/** 一行元信息（索引优先，缺失时现场构造） */
function metaOf(id) {
  ensure()
  const row = state.byId.get(id)
  if (row) return row
  const all = state.factory.getAllContracts()
  if (!all[id]) return null
  const c = all[id]
  return { id, action: c.action || '—', domain: c.domain || '—', kind: 'standard-atom', status: 'unknown' }
}

/* ------------------------------------------------------------------ *
 * describe
 * ------------------------------------------------------------------ */

export function describe(atomId) {
  state.stats.describe += 1
  try {
    ensure()
    const meta = metaOf(atomId)
    if (!meta) {
      return { ok: false, unsupported: false, atom: atomId, reason: '未知原子 ID；用 mode:"list" 查看可用 ID' }
    }
    const all = state.factory.getAllContracts()
    const contract = all[atomId] ? { action: all[atomId].action || '—', domain: all[atomId].domain || '—' } : null
    return {
      ok: true,
      atom: atomId,
      action: meta.action,
      domain: meta.domain,
      kind: meta.kind,
      status: meta.status,
      external: !!meta.external,
      needsModel: !!meta.needsModel,
      contract,
      note: meta.status === 'unsupported'
        ? '该原子无计算实现（EXTERNAL_NEEDED），调用会返回 unsupported'
        : (meta.action === '—'
          ? '契约无动作标注：返回通用形态，并标 degraded'
          : undefined),
    }
  } catch (error) {
    state.stats.errors += 1
    return { ok: false, unsupported: false, atom: atomId, reason: `describe 失败: ${error && error.message}` }
  }
}

/* ------------------------------------------------------------------ *
 * list
 * ------------------------------------------------------------------ */

export function list({ action, domain, status, limit = 200, offset = 0 } = {}) {
  state.stats.list += 1
  try {
    ensure()
    let rows = [...state.byId.values()]
    if (!rows.length) {
      const all = state.factory.getAllContracts()
      rows = Object.keys(all).map((id) => ({ id, action: all[id].action || '—', domain: all[id].domain || '—', status: 'unknown' }))
    }
    if (action) rows = rows.filter((r) => r.action === action)
    if (domain) rows = rows.filter((r) => r.domain === domain)
    if (status) rows = rows.filter((r) => r.status === status)
    const total = rows.length
    const page = rows.slice(Math.max(0, offset), Math.max(0, offset) + Math.max(1, Math.min(2000, limit)))
    return {
      ok: true,
      total,
      offset,
      count: page.length,
      ids: page.map((r) => r.id),
      facets: {
        byAction: countBy(rows, (r) => r.action),
        byDomain: countBy(rows, (r) => r.domain),
        byStatus: countBy(rows, (r) => r.status),
      },
    }
  } catch (error) {
    state.stats.errors += 1
    return { ok: false, reason: `list 失败: ${error && error.message}` }
  }
}

function countBy(rows, keyFn) {
  const out = {}
  for (const r of rows) {
    const k = keyFn(r) || '—'
    out[k] = (out[k] || 0) + 1
  }
  return out
}

/* ------------------------------------------------------------------ *
 * invoke
 * ------------------------------------------------------------------ */

export function invoke(atomId, input, { validate = true } = {}) {
  state.stats.invoke += 1
  try {
    ensure()
    const meta = metaOf(atomId)
    if (!meta) {
      return { ok: false, unsupported: false, atom: atomId, reason: '未知原子 ID；用 mode:"list" 查看可用 ID' }
    }

    // 1) 取实现
    let impl = null
    try {
      impl = state.factory.make(atomId)
    } catch (error) {
      state.stats.errors += 1
      return { ok: false, unsupported: false, atom: atomId, reason: `工厂取实现失败: ${error && error.message}` }
    }
    if (!impl) {
      state.stats.unsupported += 1
      return {
        ok: false,
        unsupported: true,
        atom: atomId,
        action: meta.action,
        domain: meta.domain,
        reason: '该原子需要硬件或训练好的模型，纯软件无法获得输入（设计如此，不是故障）',
      }
    }

    // 2) 执行（任何异常都吞掉）
    let output
    try {
      output = impl(input)
    } catch (error) {
      state.stats.errors += 1
      return { ok: false, unsupported: false, atom: atomId, reason: `执行抛错: ${error && error.message}` }
    }

    // 3) 契约校验（失败不丢 output，只标 degraded）
    let verdict = null
    if (validate && state.validator && typeof state.validator.validate === 'function') {
      try {
        verdict = state.validator.validate(atomId, output)
      } catch { verdict = null }
    }

    const degradedByOutput = !!(output && typeof output === 'object' && (output.approximated === true || output.ok === false))
    const degradedByAction = meta.action === '—'
    const degradedByContract = verdict ? verdict.pass === false : false
    const degraded = degradedByOutput || degradedByAction || degradedByContract
    if (degraded) state.stats.degraded += 1

    return {
      ok: true,
      atom: atomId,
      action: meta.action,
      domain: meta.domain,
      status: degraded ? 'degraded' : 'ok',
      degraded,
      degradedReason: degraded
        ? [
          degradedByOutput ? '实现自身标注近似/失败' : null,
          degradedByAction ? '契约无动作标注（通用形态）' : null,
          degradedByContract ? '契约校验未通过' : null,
        ].filter(Boolean).join('; ')
        : undefined,
      contract: verdict ? { action: verdict.action, domain: verdict.domain, src: verdict.src } : null,
      checks: verdict && Array.isArray(verdict.checks) ? verdict.checks : undefined,
      operator: output && output.__operator,
      outputMode: output && output.__mode,
      output,
    }
  } catch (error) {
    state.stats.errors += 1
    return { ok: false, unsupported: false, atom: atomId, reason: `分发层异常: ${error && error.message}` }
  }
}

/* ------------------------------------------------------------------ *
 * 统一入口（对应工具入参）
 * ------------------------------------------------------------------ */

export function dispatch({ operation, input, mode = 'invoke', filter } = {}) {
  if (mode === 'list') return list(filter || {})
  if (typeof operation !== 'string' || !operation.trim()) {
    return { ok: false, unsupported: false, reason: 'operation 必填（原子 ID）；用 mode:"list" 查看可用 ID' }
  }
  const id = operation.trim()
  if (mode === 'describe') return describe(id)
  return invoke(id, input)
}

/** 运行时快照（给控制台/测试用） */
export function snapshot() {
  return {
    loaded: state.loaded,
    indexed: state.byId.size,
    hasValidator: state.validator !== null,
    loadError: state.loadError,
    stats: { ...state.stats },
  }
}
