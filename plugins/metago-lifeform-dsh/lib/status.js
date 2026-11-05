/**
 * metago-lifeform-dsh — collection logic.
 *
 * Everything the console and the status tool report is produced here, from real
 * artifacts, at request time. Node builtins only: no third-party import at module
 * scope, so a missing optional package can never take the plugin fiber down.
 *
 * The details that matter:
 *   - The law tables are PARSED, never hard-coded. The upstream project ships
 *     several mutually inconsistent counters for the same facts (its own
 *     `CONSTITUTION/AXIOMS.md` carries four different totals), and only the
 *     document itself is load-bearing for the agent.
 *   - The MCP tool counts come from the live tool registry, so the console can
 *     never claim a server that failed to mount.
 *   - `@metago-ai/*` versions come from the installed package manifests, not from
 *     this plugin's own assumptions.
 *
 * @module metago-lifeform-dsh/status
 */

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

/** Stable plugin identity used across routes. */
export const name = 'metago-lifeform-dsh'

/** Default instruction budget the preset declares for the law. */
export const DEFAULT_LAW_BUDGET = 262144

/** `$DSH_HOME` as the running Harness composed it. */
export function dshHome() {
  return process.env.DSH_HOME || join(process.env.USERPROFILE || process.env.HOME || '', '.dsh')
}

/** Read a UTF-8 text file, or `undefined` on any failure. */
export function readText(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return undefined
  }
}

/** Read and JSON-parse a file, or `undefined` on any failure. */
function readJson(path) {
  const text = readText(path)
  if (text === undefined) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

const NUMBERED_CHAPTER = /^##\s*第([零一二三四五六七八九十百]+)(?:节|章)\s*(.*)$/

/**
 * Parse the law file for the facts the console shows.
 * @param text - Full law source.
 * @returns Version, size, chapter list, axiom/property tables and governance markers.
 */
export function parseLaw(text) {
  const bytes = Buffer.byteLength(text, 'utf8')
  const lines = text.split(/\r?\n/)
  // 版本取「最大值」而不是「第一个」：法则正文先出现 V3.0.0（历史叙述），
  // 取第一个会把现行版本报成 V3.0.0（R94 修复）。
  const allVer = (text.match(/V(\d+)\.(\d+)(?:\.(\d+))?/g) || [])
  const version = allVer.length
    ? allVer
        .map((v) => { const a = v.slice(1).split('.').map(Number); return [a[0] || 0, a[1] || 0, a[2] || 0] })
        .sort((a, b2) => (b2[0] - a[0]) || (b2[1] - a[1]) || (b2[2] - a[2]))[0]
        .join('.')
        .replace(/\.0$/, '')
    : null
  const versions = [...new Set(text.match(/V\d+\.\d+\.\d+/g) || [])]

  const chapters = []
  for (const line of lines) {
    const match = NUMBERED_CHAPTER.exec(line)
    if (match) chapters.push({ numeral: match[1], title: line.replace(/^##\s*/, '').trim() })
  }
  const zero = /^##\s*第零节.*$/m.exec(text)
  if (zero) chapters.unshift({ numeral: '零', title: zero[0].replace(/^##\s*/, '').trim() })

  const axioms = []
  const properties = []
  for (const [, id, title, constraint] of text.matchAll(/^\|\s*(A\d{1,2})\b[^|]*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*$/gm)) {
    axioms.push({ id, title: title.trim(), constraint: constraint.trim() })
  }
  for (const [, id, title, behaviour] of text.matchAll(/^\|\s*(D\d{1,2})\b[^|]*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*$/gm)) {
    properties.push({ id, title: title.trim(), behaviour: behaviour.trim() })
  }

  return {
    bytes,
    lines: lines.length,
    version,
    versions,
    chapters,
    chapterCount: chapters.length,
    headingCount: lines.filter((l) => /^##\s/.test(l)).length,
    axioms,
    properties,
    markers: {
      udgk: text.includes('UDGK'),
      archGovernance: text.includes('METAGO-ARCH-GOV-V1') || text.includes('架构治理强制规则'),
      completeness: text.includes('METAGO-COMPLETENESS-KIT-MARK') || text.includes('完整性治理条款'),
      mcpChapter: /^##\s*第十八章/m.test(text),
      browserChapter: /^##\s*第十九章/m.test(text),
      processLaw: /^##\s*第二十章/m.test(text),
    },
  }
}

/** Parse the YAML frontmatter this plugin reads; every other field is ignored. */
function parseFrontmatter(text) {
  if (!text || !text.startsWith('---')) return {}
  const end = text.indexOf('\n---', 3)
  if (end === -1) return {}
  const out = {}
  let currentKey = null
  for (const rawLine of text.slice(3, end).split(/\r?\n/)) {
    if (/^\s+-\s+/.test(rawLine) && currentKey === 'trigger') {
      out.trigger.push(rawLine.replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, ''))
      continue
    }
    const match = /^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/.exec(rawLine)
    if (!match) continue
    const [, key, rawValue] = match
    currentKey = key
    const value = rawValue.trim().replace(/^["']|["']$/g, '')
    if (key === 'trigger') {
      out.trigger = value === '' || value === '[]'
        ? []
        : value.replace(/^\[|\]$/g, '').split(',').map(item => item.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    } else {
      out[key] = value
    }
  }
  return out
}

/**
 * Enumerate the installed `metago-*` skills and their declared triggers.
 * @param skillsDir - Directory holding one bundle per skill.
 * @returns Catalog summary plus the per-skill rollup.
 */
export function scanSkills(skillsDir) {
  let entries
  try {
    entries = readdirSync(skillsDir, { withFileTypes: true })
  } catch {
    return { dir: skillsDir, exists: false, total: 0, metago: 0, withTrigger: 0, triggerCount: 0, triggers: [], skills: [] }
  }

  const skills = []
  const triggers = new Set()
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const skillFile = join(skillsDir, entry.name, 'SKILL.md')
    if (!existsSync(skillFile)) continue
    const front = parseFrontmatter(readText(skillFile))
    const list = Array.isArray(front.trigger) ? front.trigger.filter(Boolean) : []
    for (const trigger of list) triggers.add(trigger)
    skills.push({
      name: entry.name,
      description: (front.description || '').slice(0, 200),
      category: front.category || null,
      version: front.version || null,
      triggers: list,
      isMetago: entry.name.startsWith('metago-'),
    })
  }

  skills.sort((a, b) => a.name.localeCompare(b.name))
  const metago = skills.filter(skill => skill.isMetago)
  return {
    dir: skillsDir,
    exists: true,
    total: skills.length,
    metago: metago.length,
    withTrigger: metago.filter(skill => skill.triggers.length > 0).length,
    triggerCount: triggers.size,
    triggers: [...triggers].sort(),
    skills: metago.map(({ name: skillName, description, category, version, triggers: list }) => ({
      name: skillName, description, category, version, triggerCount: list.length,
    })),
  }
}

/**
 * Roll a skill catalog up by declared category, falling back to the name prefix.
 * @param skills - Rows from `scanSkills(...).skills`.
 * @returns Descending `{ name, count }` pairs.
 */
export function familyRollup(skills) {
  const families = new Map()
  for (const skill of skills) {
    const key = skill.category || String(skill.name).replace(/^metago-/, '').split('-')[0]
    families.set(key, (families.get(key) || 0) + 1)
  }
  return [...families.entries()].map(([family, count]) => ({ name: family, count })).sort((a, b) => b.count - a.count)
}

/**
 * The authoritative skill-family index, when the engine package is installed.
 *
 * The per-skill declared categories are not a usable taxonomy (only some
 * bundles carry one, and the upstream index itself under-declares two of its
 * families), so the console falls back to name-prefix buckets unless this index
 * is present. Whatever it reports is labelled as coming from the engine.
 * @returns `{ source, total, families }` — `source` names where the numbers came from.
 */
export function engineSkillFamilies() {
  const dir = locatePackage('@metago-ai/engine')
  if (dir === null) return { source: 'name-prefix', total: 0, families: [] }
  const index = readJson(join(dir, 'INDEX', 'skills.json'))
  if (index === undefined || !Array.isArray(index.families)) return { source: 'name-prefix', total: 0, families: [] }
  const families = index.families
    .map(family => ({
      key: family.key || family.name,
      name: family.name || family.key,
      declared: typeof family.count === 'number' ? family.count : null,
      actual: Array.isArray(family.skills) ? family.skills.length : null,
    }))
    .sort((a, b) => (b.actual || 0) - (a.actual || 0))
  const declaredSum = families.reduce((sum, family) => sum + (family.declared || 0), 0)
  const actualSum = families.reduce((sum, family) => sum + (family.actual || 0), 0)
  return {
    source: 'engine INDEX/skills.json',
    version: index.version || null,
    total: actualSum,
    declaredSum,
    // Surfaced on purpose: the upstream file is internally inconsistent
    // (declared 97 vs 100 actual), and the console should show that rather than
    // launder it into a single confident number.
    consistent: declaredSum === actualSum,
    families,
  }
}

/**
 * Count the mounted MCP tools by server, from the live tool registry.
 *
 * `ctx.tools.schemas()` is the public, scope-aware read (nearest-scope override
 * per name, global layer folded in). It is preferred over the registry's
 * internal `tools` entry map, which is a private structure: an earlier revision
 * read `.keys()` off it and the panel showed "0 个工具" while the live session
 * plainly had 112.
 *
 * @param ctx - Plugin context exposing the `tools` service.
 * @returns Per-server counts, the total, and which read produced them.
 */
export function scanMcpTools(ctx) {
  const servers = new Map()
  let total = 0
  let source = 'none'

  const collect = (names) => {
    for (const toolName of names) {
      if (typeof toolName !== 'string' || !toolName.startsWith('mcp__')) continue
      const rest = toolName.slice('mcp__'.length)
      const separator = rest.indexOf('__')
      const server = separator === -1 ? rest : rest.slice(0, separator)
      servers.set(server, (servers.get(server) || 0) + 1)
      total += 1
    }
  }

  try {
    if (typeof ctx.tools.schemas === 'function') {
      const schemas = ctx.tools.schemas()
      if (Array.isArray(schemas)) {
        collect(schemas.map(schema => (schema && (schema.name ?? schema.toolName)) || ''))
        source = 'tools.schemas()'
      }
    }
  } catch {
    // Fall through to the internal read rather than reporting a false zero.
  }

  if (source === 'none') {
    try {
      const entries = ctx.tools.tools
      // `NamedEntries` exposes `entries()`/`keys()` depending on version; prefer
      // the iterator-shaped read and degrade to keys.
      const names = typeof entries?.entries === 'function'
        ? [...entries.entries()].map(entry => (Array.isArray(entry) ? entry[0] : entry))
        : (typeof entries?.keys === 'function' ? [...entries.keys()] : [])
      collect(names)
      source = names.length > 0 || entries !== undefined ? 'tools.tools' : 'none'
    } catch {
      return { total: 0, servers: [], mounted: false, source: 'unavailable' }
    }
  }

  const list = [...servers.entries()].map(([server, count]) => ({ server, count })).sort((a, b) => b.count - a.count)
  return {
    total,
    servers: list,
    mounted: list.some(entry => entry.server === 'metago' || entry.server === 'metago-algorithms'),
    source,
  }
}

/* ------------------------------------------------------------ @metago-ai -- */

/** Candidate roots that may contain an installed `@metago-ai/*` package. */
function packageRoots() {
  const roots = []
  if (process.env.APPDATA) roots.push(join(process.env.APPDATA, 'npm', 'node_modules'))
  roots.push(join(dshHome(), 'profiles', 'desktop', 'node_modules'))
  if (process.env.LOCALAPPDATA) roots.push(join(process.env.LOCALAPPDATA, 'pnpm', 'global', '5', 'node_modules'))
  return roots
}

/** Locate one package directory across the candidate roots. */
function locatePackage(packageName) {
  for (const root of packageRoots()) {
    const candidate = join(root, ...packageName.split('/'))
    if (existsSync(join(candidate, 'package.json'))) return candidate
  }
  return null
}

/** Version + declared counters of an installed `@metago-ai/*` package. */
function packageInfo(packageName) {
  const dir = locatePackage(packageName)
  if (!dir) return { installed: false, dir: null, version: null }
  const manifest = readJson(join(dir, 'package.json')) || {}
  return {
    installed: true,
    dir,
    version: manifest.version || null,
    description: manifest.description || null,
    counters: manifest.metago || null,
  }
}

/** Report the MetaGO packages that drive the runtime behind this plugin. */
export function scanPackages() {
  return {
    engine: packageInfo('@metago-ai/engine'),
    mcpServer: packageInfo('@metago-ai/mcp-server'),
    algorithms: packageInfo('@metago-ai/algorithms'),
    verifyKit: packageInfo('@metago-ai/verify-kit'),
    devKit: packageInfo('@metago-ai/dev-kit'),
  }
}

/** Last-modified and size facts for one path, without reading the body. */
export function fileFacts(path) {
  try {
    const info = statSync(path)
    return { path, exists: true, bytes: info.size, mtime: info.mtime.toISOString() }
  } catch {
    return { path, exists: false, bytes: 0, mtime: null }
  }
}

/** The MCP server's own call ledger, when the server has been used. */
export function scanMcpLog() {
  const dir = join(process.env.USERPROFILE || process.env.HOME || '', '.metago', 'logs')
  const log = fileFacts(join(dir, 'mcp-server.log'))
  const calls = fileFacts(join(dir, 'calls.jsonl'))
  let records = 0
  let errors = 0
  let lastTs = null
  // Bounded read: a runaway ledger must not stall a status request.
  if (calls.exists && calls.bytes < 32 * 1024 * 1024) {
    for (const line of (readText(calls.path) || '').split('\n')) {
      if (line.trim() === '') continue
      records += 1
      try {
        const parsed = JSON.parse(line)
        lastTs = parsed.ts || lastTs
        if (parsed.error || parsed.ok === false) errors += 1
      } catch {
        /* a truncated tail line is expected while the server is writing */
      }
    }
  }
  return { dir, log, calls: { ...calls, records, errors }, lastTs }
}

/* ---------------------------------------------------------------- memory -- */

/** Where the authoritative KMWI store lives for this installation. */
export function memoryStorePath(config = {}) {
  if (typeof config.memoryPath === 'string' && config.memoryPath.trim() !== '') return config.memoryPath.trim()
  const home = dshHome()
  for (const candidate of [join(home, 'metago', 'kmwi.json'), join(home, '.metago-kmwi.json')]) {
    if (existsSync(candidate)) return candidate
  }
  return join(home, 'metago', 'kmwi.json')
}

/** Normalise the engine snapshot, which names each layer differently per version. */
function layersOf(snapshot) {
  const pick = value => (Array.isArray(value) ? value.length : 0)
  return {
    K: pick(snapshot.knowledge),
    M: pick(snapshot.memories ?? snapshot.memory),
    W: pick(snapshot.wisdom),
    I: pick(snapshot.intuitions ?? snapshot.intuition),
  }
}

/**
 * Read the four-layer store, and read its health the way the engine reads it.
 *
 * The engine's `getHealth()` is **not** a count average: each layer is scored
 * 0–100 from that layer's own metrics (K = confidence × freshness, M = conversion
 * rate × recall strength, W = pattern volume × reuse, I = accuracy ×
 * explicitness) and `H` is their mean. An earlier revision of this plugin
 * computed `(K+M+W+I)/4` over item counts instead, which reported `H = 2.25` for
 * a store the engine scores at `69` — a different number on the same screen, so
 * it was simply wrong.
 *
 * The engine is therefore the authority whenever it is installed and loadable,
 * and `healthSource` says which of the two produced the number. Falling back to
 * the count formula is honest only because it is labelled.
 *
 * @param config - Plugin config carrying an optional explicit path.
 * @returns Layer counts, engine health, decay and provenance for the panel.
 */
export function memoryState(config = {}) {
  const path = memoryStorePath(config)
  const raw = readText(path)
  if (raw === undefined) {
    return {
      path,
      exists: false,
      layers: { K: 0, M: 0, W: 0, I: 0 },
      total: 0,
      health: 0,
      healthSource: 'absent',
      history: 0,
      timestamp: null,
      note: 'KMWI 存储尚未创建。上游 init-kmwi-store.cjs 可播种（本仓库 scripts/seed-kmwi-* 亦可用），播种后引擎健康度即生效。',
    }
  }
  let snapshot
  try {
    snapshot = JSON.parse(raw)
  } catch (error) {
    return {
      path,
      exists: true,
      parseError: String((error && error.message) || error),
      layers: { K: 0, M: 0, W: 0, I: 0 },
      total: 0,
      health: 0,
      healthSource: 'unreadable',
      history: 0,
    }
  }
  const layers = layersOf(snapshot)
  const total = layers.K + layers.M + layers.W + layers.I
  const engine = engineHealth(path)
  return {
    path,
    exists: true,
    bytes: Buffer.byteLength(raw, 'utf8'),
    version: snapshot.version || null,
    timestamp: snapshot.timestamp || null,
    layers,
    total,
    // The engine's 0–100 composite when available, the labelled count formula
    // otherwise. Never silently mix the two.
    health: engine.health ?? Number((total / 4).toFixed(3)),
    healthSource: engine.health !== undefined ? `engine ${engine.version || ''}`.trim() : 'item-count / 4（引擎不可用时的降级算法）',
    layerScores: engine.layerScores ?? null,
    decay: engine.decay ?? null,
    history: Array.isArray(snapshot.history) ? snapshot.history.length : 0,
    baseline: snapshot.baseline || null,
    // The engine reads `memories` (plural) while the upstream seed script writes
    // `memory` (singular), so a seeded store silently hides its M layer from the
    // engine. Surface the mismatch instead of showing a half-empty store.
    schemaWarning: Array.isArray(snapshot.memory) && !Array.isArray(snapshot.memories)
      ? '顶层键为 memory（单数），引擎读 memories（复数）：M 层对引擎不可见。运行 scripts/migrate-kmwi-store.mjs 迁移。'
      : null,
  }
}

/**
 * Ask the installed engine for the store's health.
 *
 * Loaded lazily and defensively: the engine is an optional dependency, its own
 * `load()` swallows malformed snapshots, and a failure here must degrade to the
 * labelled fallback rather than break the console.
 * @param path - Store path.
 * @returns `{ health?, layerScores?, decay?, version? }`.
 */
export function engineHealth(path) {
  const dir = locatePackage('@metago-ai/engine')
  if (dir === null) return {}
  const entry = join(dir, 'RUNTIME', 'dist', 'index.js')
  if (!existsSync(entry)) return {}
  let mod
  try {
    // A synchronous require keeps this usable from the route table; the engine
    // ships CommonJS.
    mod = createRequire(import.meta.url)(entry)
  } catch {
    return {}
  }
  try {
    const manifest = readJson(join(dir, 'package.json')) || {}
    const memory = new mod.KMWIMemory(path)
    const health = memory.getHealth()
    return {
      health: health.H,
      layerScores: { K: health.K, M: health.M, W: health.W, I: health.I },
      decay: typeof memory.getDecayRates === 'function' ? memory.getDecayRates() : null,
      version: manifest.version || null,
    }
  } catch (error) {
    return { error: String((error && error.message) || error) }
  }
}

/* ---------------------------------------------------------------- status -- */

/**
 * Algorithm coverage, read from the sweep's own evidence file.
 *
 * "927 algorithms" is a REGISTRY size, not a capability count, and the console must
 * not repeat the registry's number as if it were the executable one. The sweep
 * writes `_evidence/algorithm-coverage.json` next to the plugin source; this reads
 * it and reports registered/executable per tier, plus the failures it found.
 *
 * When the evidence file is absent the field says so instead of inventing numbers.
 * @returns Coverage summary, or `{ source: 'absent', ... }`.
 */
export function algorithmCoverage(config = {}) {
  const candidates = [
    config.coveragePath,
    join(dshHome(), 'metago', 'algorithm-coverage.json'),
    'D:\\Documents\\deepseek-harness\\default-workspace\\metago-dsh-lifeform\\_evidence\\algorithm-coverage.json',
  ].filter(candidate => typeof candidate === 'string' && candidate !== '')
  for (const path of candidates) {
    const raw = readText(path)
    if (raw === undefined) continue
    try {
      const report = JSON.parse(raw)
      const byTier = report.byTier ?? {}
      return {
        source: path,
        generatedAt: report.generatedAt ?? null,
        registered: report.totals?.registered ?? 0,
        executable: report.totals?.ok ?? 0,
        invalid: report.totals?.invalid ?? 0,
        notImplemented: report.totals?.notimpl ?? 0,
        errors: report.totals?.error ?? 0,
        byTier,
        topFailureReasons: (report.failureReasons ?? []).slice(0, 5),
        note: '注册数 ≠ 可执行数：T3 的 227 个概念已由本工作区实现，T1/T2 剩余失败主要来自扫描端合成的输入形状，逐类记录在 topFailureReasons。',
      }
    } catch {
      /* a truncated report must not break the status route */
    }
  }
  return { source: 'absent', registered: 0, executable: 0, note: '尚未运行 scripts/verify-algorithms-all.mjs，覆盖数据不可用。' }
}

/**
 * Whole-installation facts for the console and the status tool.
 * @param ctx - Plugin context (tool registry).
 * @param config - Plugin config.
 * @returns The status payload served at `/api/metago/status`.
 */
export function collectStatus(ctx, config = {}) {
  const home = dshHome()
  const lawPath = join(home, 'AGENTS.md')
  const lawText = readText(lawPath)
  const law = lawText === undefined
    ? { path: lawPath, exists: false, sha256: null, bytes: 0, lines: 0, version: null, chapters: [], axioms: [], properties: [], markers: {} }
    : { path: lawPath, exists: true, sha256: createHash('sha256').update(lawText).digest('hex'), ...parseLaw(lawText) }

  const configured = Number(config.lawBudgetBytes) > 0 ? Number(config.lawBudgetBytes) : DEFAULT_LAW_BUDGET
  const skills = scanSkills(join(home, 'skills'))
  const mcp = scanMcpTools(ctx)

  return {
    ok: true,
    plugin: { name, version: '1.0.0', uptimeMs: Math.round(process.uptime() * 1000) },
    ts: new Date().toISOString(),
    home,
    law,
    lawBudget: {
      configured,
      fits: law.exists ? law.bytes <= configured : false,
      headroom: law.exists ? configured - law.bytes : 0,
      truncatedBy: law.exists && law.bytes > configured ? law.bytes - configured : 0,
      note: 'DSH 在组合期按 preset 内 agent-instructions 的 maxBytes 截断法则；$DSH_HOME 补丁里的同名行在宿主平面是 disabled 的，不参与判定。',
    },
    skills: { ...skills, families: familyRollup(skills.skills), engineFamilies: engineSkillFamilies() },
    mcp,
    algorithms: algorithmCoverage(),
    packages: scanPackages(),
    memory: memoryState(config),
    runtime: {
      node: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      dshHomeFromEnv: process.env.DSH_HOME || null,
      log: scanMcpLog(),
      veracityLedger: fileFacts(join(process.env.USERPROFILE || process.env.HOME || '', '.metago', 'veracity', 'action-ledger.jsonl')),
    },
  }
}

/** The 层-用法 matrix the panel renders beside the law tables. */
export function layerMatrix(ctx, config = {}) {
  const status = collectStatus(ctx, config)
  return {
    layers: [
      { id: 'preset', label: '驱动层 · 法则', state: status.law.exists ? 'live' : 'absent', detail: `${status.law.lines} 行 / ${status.law.chapterCount} 章` },
      { id: 'skills', label: '能力层 · 技能', state: status.skills.metago > 0 ? 'live' : 'absent', detail: `${status.skills.metago} 个技能 / ${status.skills.triggerCount} 触发词` },
      { id: 'mcp', label: '执行层 · 工具', state: status.mcp.mounted ? 'live' : 'absent', detail: `${status.mcp.total} 个 MCP 工具` },
      { id: 'engine', label: '进化层 · 引擎', state: status.packages.engine.installed ? 'live' : 'absent', detail: status.packages.engine.version ? `v${status.packages.engine.version}` : '未安装' },
      { id: 'memory', label: '记忆层 · KMWI', state: status.memory.exists ? 'live' : 'idle', detail: `H=${status.memory.health}` },
    ],
  }
}
