// gen_t3_shapes.mjs — T3 样例生成器（B02 第一部分：141 条纯内建类型）
//
// 做法：
//   ① 解析 inputSchema 串（TS 风格对象字面量）→ 字段名 + 类型 + 是否可选
//   ② 按类型递归造值
//   ③ 跑一遍算法，success 且输出非空壳 → 收录
//   ④ 失败则按候选值组合重试（最多 N 轮）
//   ⑤ 结果写入 t3_shapes_generated.json（不直接改 vendor 的 shapes.json）
//
// 为什么先写临时文件：
//   验收要在「生成的样例真能让算法跑出有意义结果」之后，
//   直接写 vendor 会让未验收的样例污染包验收。
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const require2 = createRequire(A + '/')
const reg = require2('./engine/algorithms/registry.js')
const regObj = reg.registry || reg.default || reg

const scan = JSON.parse(readFileSync('D:/metago-build/t3_scan.json', 'utf8'))
const CUSTOM = new Set(Object.keys(scan.customTypes))
const BUILTIN = new Set(['number', 'string', 'boolean', 'any', 'unknown', 'void', 'null',
  'undefined', 'object', 'Map', 'Set', 'Array', 'Record', 'Promise', 'Date', 'RegExp'])

// ── ① schema 解析 ──────────────────────────────────────────────
// 输入形如 { a: number; b?: string[]; c: {x:number;y:number}[] }
function splitTopLevel(s) {
  const out = []
  let depth = 0, cur = ''
  for (const ch of s) {
    if (ch === '{' || ch === '[' || ch === '(' || ch === '<') depth++
    else if (ch === '}' || ch === ']' || ch === ')' || ch === '>') depth--
    if (ch === ';' && depth === 0) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out.map(x => x.trim()).filter(Boolean)
}

function parseSchema(sch) {
  let s = String(sch || '').trim()
  if (s.startsWith('{') && s.endsWith('}')) s = s.slice(1, -1)
  const fields = []
  for (const part of splitTopLevel(s)) {
    // name?: type  |  name: type
    const m = part.match(/^([A-Za-z_$][\w$]*)\s*(\??)\s*:\s*([\s\S]+)$/)
    if (!m) continue
    fields.push({ name: m[1], optional: m[2] === '?', type: m[3].trim() })
  }
  return fields
}

// ── ② 类型 → 值 ────────────────────────────────────────────────
let variant = 0
function valueOf(type) {
  let t = String(type || '').trim()
  // 去可选标记残留
  t = t.replace(/^\?/, '').trim()

  // 字面量联合："a" | "b" | "c"
  const lits = [...t.matchAll(/"([^"]+)"/g)].map(m => m[1])
  if (lits.length && /^[\s"|a-zA-Z0-9_\-]+$/.test(t)) {
    return lits[Math.min(variant % lits.length, lits.length - 1)]
  }

  // 数组 X[]
  if (t.endsWith('[]')) {
    const inner = t.slice(0, -2).trim()
    const n = 3
    return Array.from({ length: n }, (_, i) => { variant = i; return valueOf(inner) })
  }
  // Array<X>
  const am = t.match(/^Array<([\s\S]+)>$/)
  if (am) {
    const n = 3
    return Array.from({ length: n }, (_, i) => { variant = i; return valueOf(am[1].trim()) })
  }
  // 内联对象 { a: number; b: number }
  if (t.startsWith('{')) {
    const o = {}
    for (const f of parseSchema(t)) o[f.name] = valueOf(f.type)
    return o
  }
  // 元组 / 联合等复杂类型：按 unknown 处理
  if (t.indexOf('|') >= 0) {
    const first = t.split('|')[0].trim().replace(/^"|"$/g, '')
    return valueOf(first)
  }

  const base = t.replace(/<[\s\S]*>$/, '').trim()
  switch (base) {
    case 'number': return [0.5, 0.3, 0.9, 0][variant % 4]
    case 'string': return ['a', 'b', 'c'][variant % 3]
    case 'boolean': return variant % 2 === 0
    case 'unknown':
    case 'any':
    case 'object': return { value: 0.5 }
    case 'Map': return new Map([['a', 0.5]])
    case 'Set': return new Set(['a', 'b'])
    case 'Record': return { a: 0.5 }
    default:
      if (CUSTOM.has(base)) return null  // 交给阶段二
      return 0.5
  }
}

// ── ③ 跑算法并判「有意义」 ──────────────────────────────────────
function isMeaningful(out) {
  if (out === null || out === undefined) return false
  if (typeof out === 'number') return isFinite(out)
  if (typeof out === 'string') return out.length > 0
  if (Array.isArray(out)) return out.length > 0
  if (typeof out === 'object') {
    const ks = Object.keys(out).filter(k => k !== 'provenance')
    if (!ks.length) return false
    return ks.some(k => {
      const v = out[k]
      if (v === null || v === undefined) return false
      if (Array.isArray(v)) return true          // 空数组也算有字段（语义可能合法）
      if (typeof v === 'number') return isFinite(v)
      if (typeof v === 'object') return Object.keys(v).length > 0
      return true
    })
  }
  return true
}

const results = { ok: [], failed: [], skipped: [] }

for (const s of scan.schemas) {
  const id = s.id
  const types = [...s.schema.matchAll(/:\s*([A-Za-z_$][\w$]*)/g)].map(m => m[1])
  const hasCustom = types.some(t => CUSTOM.has(t))
  if (hasCustom) { results.skipped.push(id); continue }

  const fields = parseSchema(s.schema)
  if (!fields.length) { results.failed.push([id, 'schema 解析不出字段', s.schema.slice(0, 80)]); continue }

  let best = null
  for (let attempt = 0; attempt < 4 && !best; attempt++) {
    variant = attempt
    const input = {}
    let nullField = null
    for (const f of fields) {
      const v = valueOf(f.type)
      if (v === null) { nullField = f.name; break }
      input[f.name] = v
    }
    if (nullField) break
    let r
    try { r = regObj.executeAlgorithmSync(id, input) } catch (e) { r = { success: false, error: e.message } }
    if (r && r.success === true && isMeaningful(r.output)) {
      best = { input, attempt }
    } else if (attempt === 3) {
      results.failed.push([id, String((r && r.error) || '输出无意义').slice(0, 80),
        JSON.stringify(input).slice(0, 110)])
    }
  }
  if (best) results.ok.push({ id, input: best.input, attempt: best.attempt, schema: s.schema })
}

console.log('='.repeat(94))
console.log('T3 样例自动生成（阶段一：纯内建类型）')
console.log('='.repeat(94))
console.log(`成功 ${results.ok.length} ｜ 失败 ${results.failed.length} ｜ 跳过（含自定义类型）${results.skipped.length}`)
console.log(`合计 ${results.ok.length + results.failed.length + results.skipped.length} / ${scan.schemas.length}`)

if (results.failed.length) {
  console.log('\n失败明细（前 20）：')
  for (const [id, why, inp] of results.failed.slice(0, 20)) {
    console.log(`  ${id}  ${why}`)
    console.log(`      input: ${inp}`)
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  phase: 'builtin-only',
  ok: Object.fromEntries(results.ok.map(x => [x.id, x.input])),
  failed: results.failed.map(([id, why]) => ({ id, why })),
  skippedCustom: results.skipped,
  stats: { ok: results.ok.length, failed: results.failed.length, skipped: results.skipped.length },
}
writeFileSync('D:/metago-build/t3_shapes_phase1.json', JSON.stringify(out, null, 1), 'utf8')
console.log('\n已写出 D:/metago-build/t3_shapes_phase1.json')
