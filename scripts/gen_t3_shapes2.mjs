// gen_t3_shapes2.mjs — T3 样例生成器（阶段二改进版）
//
// 阶段一遗留：
//   ① 函数型字段（(a: string) => number）被误解析成 number
//   ② 86 条含自定义类型的没有样例
//
// 本版两处改进：
//   A. 解析器识别 => 函数型：造「表达式字符串」，由 metagoInvoke 的桥接编译
//   B. 自定义类型用 Proxy 探测：让 handler 自己「说出」它读了哪些字段
//      —— 比手工为 65 种类型写映射可靠，也能自动适配未来新类型
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const require2 = createRequire(A + '/')
const reg = require2('./engine/algorithms/registry.js')
const regObj = reg.registry || reg.default || reg

const scan = JSON.parse(readFileSync('D:/metago-build/t3_scan.json', 'utf8'))
const CUSTOM = new Set(Object.keys(scan.customTypes))

// ── 解析器（改进：识别函数型） ──────────────────────────────────
function splitTopLevel(s) {
  const out = []
  let depth = 0, cur = ''
  for (const ch of s) {
    if ('{[('.includes(ch)) depth++
    else if ('}])'.includes(ch)) depth--
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
    const m = part.match(/^([A-Za-z_$][\w$]*)\s*(\??)\s*:\s*([\s\S]+)$/)
    if (!m) continue
    fields.push({ name: m[1], optional: m[2] === '?', type: m[3].trim() })
  }
  return fields
}

let variant = 0
function valueOf(type, depth) {
  const d = depth || 0
  if (d > 4) return 0.5
  let t = String(type || '').trim().replace(/^\?/, '').trim()

  // 函数型：(a: X, b: Y) => Z   或  X => Y
  const fnm = t.match(/^(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*([\s\S]+)$/)
  if (fnm) {
    const ret = fnm[1].trim()
    if (/^number/.test(ret)) return '() => 0.5'
    if (/^string/.test(ret)) return "() => 'a'"
    if (/^boolean/.test(ret)) return '() => true'
    if (/\[\]/.test(ret)) return '() => [0.5]'
    return '() => ({})'
  }

  // 字面量联合
  const lits = [...t.matchAll(/"([^"]+)"/g)].map(m => m[1])
  if (lits.length && !t.startsWith('{')) {
    return lits[Math.min(variant % lits.length, lits.length - 1)]
  }

  if (t.endsWith('[]')) {
    const inner = t.slice(0, -2).trim()
    return Array.from({ length: 3 }, (_, i) => { variant = i; return valueOf(inner, d + 1) })
  }
  const am = t.match(/^Array<([\s\S]+)>$/)
  if (am) return Array.from({ length: 3 }, (_, i) => { variant = i; return valueOf(am[1].trim(), d + 1) })
  if (t.startsWith('{')) {
    const o = {}
    for (const f of parseSchema(t)) o[f.name] = valueOf(f.type, d + 1)
    return o
  }
  if (t.indexOf('|') >= 0) {
    const first = t.split('|')[0].trim().replace(/^"|"$/g, '')
    return valueOf(first, d + 1)
  }

  const base = t.replace(/<[\s\S]*>$/, '').trim()
  switch (base) {
    case 'number': return [0.5, 0.3, 0.9, 0.1][variant % 4]
    case 'string': return ['a', 'b', 'c'][variant % 3]
    case 'boolean': return variant % 2 === 0
    case 'unknown': case 'any': case 'object': return { value: 0.5 }
    case 'Map': return new Map([['a', 0.5]])
    case 'Set': return new Set(['a', 'b'])
    case 'Record': return { a: 0.5 }
    default:
      if (CUSTOM.has(base)) return undefined   // 交给 Proxy 探测
      return 0.5
  }
}

// ── Proxy 探测：让 handler 说出它读什么 ──────────────────────────
function makeProbe() {
  const paths = new Map()
  const rec = (p, kind) => { if (!paths.has(p)) paths.set(p, kind) }
  const mk = (path) => new Proxy(function () { }, {
    get(t, k) {
      if (typeof k === 'symbol') {
        if (k === Symbol.toPrimitive) return (hint) => (hint === 'string' ? 'a' : 0.5)
        if (k === Symbol.iterator) {
          rec(path, 'array')
          return function* () { yield mk(path + '[]'); yield mk(path + '[]') }
        }
        return undefined
      }
      if (k === 'then') return undefined
      if (k === 'length') { rec(path, 'length'); return 3 }
      const strMethods = ['toLowerCase', 'toUpperCase', 'trim', 'split', 'includes', 'startsWith',
        'endsWith', 'replace', 'slice', 'substring', 'indexOf', 'charAt', 'padStart', 'padEnd',
        'repeat', 'match', 'search', 'localeCompare', 'normalize']
      if (strMethods.indexOf(k) >= 0) {
        rec(path, 'string')
        return function () {
          if (k === 'split') return ['a', 'b']
          if (k === 'includes') return true
          if (k === 'indexOf') return 0
          if (k === 'localeCompare') return 0
          if (k === 'match' || k === 'search') return null
          return 'a'
        }
      }
      const arrMethods = ['map', 'filter', 'forEach', 'reduce', 'some', 'every', 'find',
        'flatMap', 'sort', 'concat', 'join', 'push', 'pop', 'shift', 'unshift', 'slice',
        'findIndex', 'includes', 'keys', 'values', 'entries', 'reverse', 'splice']
      if (arrMethods.indexOf(k) >= 0) {
        rec(path, 'array')
        return function () {
          if (k === 'reduce') return 0.5
          if (k === 'some' || k === 'every' || k === 'find' || k === 'findIndex') return k === 'findIndex' ? 0 : false
          if (k === 'join') return 'a,b'
          if (k === 'pop' || k === 'shift') return mk(path + '[]')
          if (k === 'push' || k === 'unshift' || k === 'reverse' || k === 'splice' || k === 'sort') return []
          if (k === 'keys' || k === 'values' || k === 'entries') return [0, 1]
          return [mk(path + '[]')]
        }
      }
      rec(path + '.' + k, 'object')
      return mk(path + '.' + k)
    },
    apply() { rec(path, 'function'); return mk(path + '()') },
  })
  return { root: mk('$'), paths }
}

// 把探测到的路径还原成静态对象
function buildFromPaths(paths, maxDepth) {
  const root = {}
  const setAt = (obj, segs, kind) => {
    if (segs.length > (maxDepth || 4)) return
    let cur = obj
    for (let i = 0; i < segs.length - 1; i++) {
      const s = segs[i]
      if (cur[s] === undefined) cur[s] = {}
      if (typeof cur[s] !== 'object' || cur[s] === null) cur[s] = {}
      cur = cur[s]
    }
    const last = segs[segs.length - 1]
    if (cur[last] !== undefined) return
    if (kind === 'length' || kind === 'array') cur[last] = [0.3, 0.5, 0.9]
    else if (kind === 'string') cur[last] = 'a'
    else if (kind === 'number') cur[last] = 0.5
    else if (kind === 'function') cur[last] = '() => 0.5'
    else cur[last] = { value: 0.5 }
  }
  for (const [p, kind] of paths) {
    const segs = p.replace(/^\$\.?/, '').split(/[.\[\]]+/).filter(Boolean)
    if (!segs.length) continue
    const clean = []
    for (const s of segs) {
      if (s === '') continue
      if (/^\d+$/.test(s)) continue
      clean.push(s)
    }
    if (!clean.length) continue
    setAt(root, clean, kind)
  }
  return root
}

function isMeaningful(out) {
  if (out === null || out === undefined) return false
  if (typeof out === 'number') return isFinite(out)
  if (typeof out === 'string') return out.length > 0
  if (Array.isArray(out)) return true
  if (typeof out === 'object') {
    const ks = Object.keys(out).filter(k => k !== 'provenance')
    if (!ks.length) return false
    return ks.some(k => {
      const v = out[k]
      if (v === null || v === undefined) return false
      if (Array.isArray(v)) return true
      if (typeof v === 'number') return isFinite(v)
      if (typeof v === 'object') return Object.keys(v).length > 0
      return true
    })
  }
  return true
}

const ok = {}, failed = []
for (const s of scan.schemas) {
  const id = s.id
  const fields = parseSchema(s.schema)
  if (!fields.length) { failed.push([id, 'schema 解析失败']); continue }

  let best = null
  for (let attempt = 0; attempt < 5 && !best; attempt++) {
    variant = attempt
    const input = {}
    let needProbe = false
    for (const f of fields) {
      const v = valueOf(f.type, 0)
      if (v === undefined) { needProbe = true; break }
      input[f.name] = v
    }

    let r
    if (!needProbe) {
      try { r = regObj.executeAlgorithmSync(id, input) } catch (e) { r = { success: false, error: e.message } }
      if (r && r.success === true && isMeaningful(r.output)) { best = input; break }
    }

    // Proxy 探测：把整个 input 交给 handler，让它自己暴露需求
    const alg = regObj.getAlgorithmById(id)
    if (alg && alg.handler) {
      const probe = makeProbe()
      try { alg.handler(probe.root) } catch (e) { /* 探测阶段的异常是预期的 */ }
      const probed = buildFromPaths(probe.paths)
      const merged = Object.assign(probed, input)
      try { r = regObj.executeAlgorithmSync(id, merged) } catch (e) { r = { success: false, error: e.message } }
      if (r && r.success === true && isMeaningful(r.output)) { best = merged; break }
    }

    if (attempt === 4) {
      failed.push([id, String((r && r.error) || '输出无意义').slice(0, 70)])
    }
  }
  if (best) ok[id] = best
}

const total = scan.schemas.length
console.log('='.repeat(92))
console.log('T3 样例生成（改进版：函数型识别 + Proxy 探测）')
console.log('='.repeat(92))
console.log(`成功 ${Object.keys(ok).length} ｜ 失败 ${failed.length} ｜ 合计 ${total}`)
if (failed.length) {
  console.log('\n失败明细：')
  for (const [id, why] of failed.slice(0, 24)) console.log(`  ${id}  ${why}`)
}

writeFileSync('D:/metago-build/t3_shapes_phase2.json', JSON.stringify({
  generatedAt: new Date().toISOString(),
  ok,
  failed: failed.map(([id, why]) => ({ id, why })),
  stats: { ok: Object.keys(ok).length, failed: failed.length, total },
}, null, 1), 'utf8')
console.log('\n已写出 D:/metago-build/t3_shapes_phase2.json')
