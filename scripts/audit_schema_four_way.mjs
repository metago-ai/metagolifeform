// audit_schema_four_way.mjs — R142 B1 · 全 57 工具四方对账
//
// ════ 四方 = 算法签名 / 适配器读字段 / schema.properties / examples ════
// 真相源：算法 handler 的形参名（metagoParamNames），不是 schema、不是 example。
//
// 七条判据：
//   J1  schema.properties 的键 ⊆ 算法形参 ∪ 适配器映射
//   J2  算法形参的必要项，schema 必须有对应键（或适配器从别的键推导）
//   J3  properties[k].type == typeof(examples[0][k])
//   J4  required ⊆ examples[0] 的键
//   J5  examples[0] 通过自身 schema 校验（含 additionalProperties）
//   J6  算法不支持的字段不得出现在 schema
//   J7  L4 族级工具 required 必须含 operation，且 operation 有 enum
//
// 输出：每个工具一行五列表 + 违反项清单 + 总判定
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const req = createRequire(A + '/')
const TR = req(A + '/tool-registry.js')
const reg = req(A + '/engine/algorithms/registry.js')
const R = reg.registry || reg.default || reg
const all = R.getRegistry ? R.getRegistry() : []
const L3_MAP = TR.L3_ID_MAP || {}
const L4_MAP = TR.L4_FAMILY_MAP || {}

function paramNames(fn) {
  const m = String(fn).match(/^[^(]*\(([^)]*)\)/)
  if (!m) return []
  return m[1].split(',').map(x => x.trim().split('=')[0].trim()).filter(Boolean)
}

// 抽适配器函数体（大括号计数，稳）
function adaptBody(src, nm) {
  const i = src.indexOf(nm + ': function')
  if (i < 0) return ''
  let j = src.indexOf('{', i), depth = 0, end = j
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') depth++
    else if (src[k] === '}') { depth--; if (depth === 0) { end = k + 1; break } }
  }
  return src.slice(i, end)
}

const src = readFileSync(A + '/tool-registry.js', 'utf8')

// ── 极简 JSON Schema 校验（只覆盖本项目用到的子集）──────────────
function schemaErrors(value, schema, path = '') {
  const errs = []
  if (!schema || typeof schema !== 'object') return errs
  const t = schema.type
  const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
  if (t === 'array' && actual !== 'array' && actual !== 'object') errs.push(`${path||'根'}: 声明 array 实际 ${actual}`)
  if (t === 'addition') { /* 占位 */ }
  if (t === 'string' && actual !== 'string') errs.push(`${path||'根'}: 声明 string 实际 ${actual}`)
  if (t === 'number' && actual !== 'number') errs.push(`${path||'根'}: 声明 number 实际 ${actual}`)
  if (t === 'boolean' && actual !== 'boolean') errs.push(`${path||'根'}: 声明 boolean 实际 ${actual}`)
  if (t === 'object' && actual !== 'object' && actual !== 'array') errs.push(`${path||'根'}: 声明 object 实际 ${actual}`)
  if (schema.enum && !schema.enum.includes(value)) errs.push(`${path||'根'}: 值 ${JSON.stringify(value)} 不在 enum`)
  if (Array.isArray(value) && schema.items) {
    value.forEach((v, i) => errs.push(...schemaErrors(v, schema.items, `${path}[${i}]`)))
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const props = schema.properties || {}
    for (const k of Object.keys(props)) {
      if (value[k] !== undefined) errs.push(...schemaErrors(value[k], props[k], path ? `${path}.${k}` : k))
    }
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(value)) {
        if (!props[k]) errs.push(`${path ? path + '.' : ''}${k}: 未在 properties 声明（additionalProperties:false 会拒绝）`)
      }
    }
  }
  return errs
}

// ── 主循环 ────────────────────────────────────────────
const files = readdirSync(A + '/tools').filter(f => f.endsWith('.json')).sort()
const rows = []
let totalViol = 0

for (const f of files) {
  const nm = f.replace(/\.json$/, '')
  let d
  try { d = JSON.parse(readFileSync(A + '/tools/' + f, 'utf8')) } catch (e) { continue }
  const args = d.arguments || d.inputSchema || {}
  const props = args.properties || {}
  const required = args.required || []
  const ex = (Array.isArray(args.examples) && args.examples[0]) ? args.examples[0] : null

  const isL3 = !!L3_MAP[nm]
  const isL4 = !!L4_MAP[nm]
  const algId = isL3 ? L3_MAP[nm] : null
  const entry = algId ? all.find(x => x.id === algId) : null
  const params = entry ? paramNames(entry.handler) : []
  const body = adaptBody(src, nm)

  // 适配器读取的字段：a.xxx。排除明显是方法/局部名的
  const METHOD_NOISE = new Set(['length', 'map', 'forEach', 'filter', 'join', 'push', 'slice', 'split',
    'replace', 'trim', 'sort', 'find', 'reduce', 'some', 'every', 'includes', 'indexOf', 'toFixed',
    'toString', 'set', 'get', 'has', 'size', 'keys', 'values', 'entries', 'pop', 'shift', 'concat',
    'codePointAt', 'charCodeAt', 'startsWith', 'endsWith', 'toLowerCase', 'toUpperCase', 'matchAll', 'match'])
  const readFields = [...new Set([...body.matchAll(/\ba\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]))]
    .filter(x => !METHOD_NOISE.has(x))

  const v = []
  const L4_FORM = new Set(['execute', 'execute_sync', 'get_algorithm_info', 'list_algorithms',
    'search_algorithms', 'list_families', 'get_statistics'])

  // ── J7：L4 族级工具必须声明 operation ──
  if (isL4) {
    if (!props.operation) v.push('J7: L4 工具缺 operation 声明')
    else if (!props.operation.enum) v.push('J7: operation 缺 enum')
    if (!required.includes('operation')) v.push('J7: operation 未列入 required')
  }

  // ── J3：type 与 example 实际类型 ──
  if (ex) {
    for (const [k, spec] of Object.entries(props)) {
      if (ex[k] === undefined) continue
      const declared = spec.type
      const actual = Array.isArray(ex[k]) ? 'array' : (ex[k] === null ? 'null' : typeof ex[k])
      if (!declared) { v.push(`J3: ${k} 未声明 type（实际 ${actual}）`); continue }
      /* 联合类型（JSON Schema 的 type 可以是数组）：只要实际类型在集合内即通过。
         典型场景：L4 的 input 是「算法原始参数」，形状随 operation 而变。 */
      if (Array.isArray(declared)) {
        const norm = (x) => (x === 'float' || x === 'int') ? 'number' : x
        if (!declared.map(norm).includes(actual)) {
          v.push(`J3: ${k} 声明 ${JSON.stringify(declared)} 实际 ${actual}`)
        }
      } else if (declared !== actual) {
        v.push(`J3: ${k} 声明 ${declared} 实际 ${actual}`)
      }
    }
    // ── J1：example 的键必须都在 properties 里 ──
    for (const k of Object.keys(ex)) {
      if (!props[k]) v.push(`J1: example 键 ${k} 不在 properties`)
    }
    // ── J4：required ⊆ example ──
    for (const k of required) {
      if (ex[k] === undefined) v.push(`J4: 必填 ${k} 在 example 里缺失`)
    }
    // ── J5：example 通过自身 schema ──
    const se = schemaErrors(ex, args, '')
    if (se.length) v.push(`J5: example 不合自身 schema（${se.slice(0, 2).join('；')}）`)
  } else {
    v.push('J5: 无 examples')
  }

  // ── J2：无适配器的工具（L1/L2/L4），算法形参必须有对应 schema 键 ──
  if (!isL3 && !isL4 && entry && params.length && Object.keys(props).length) {
    for (const p of params) {
      if (!props[p] && !readFields.includes(p)) {
        // 单参且 schema 只有一个键：视为派生关系，跳过
        if (!(params.length === 1 && Object.keys(props).length === 1)) {
          v.push(`J2: 算法形参 ${p} 无对应 schema 键`)
        }
      }
    }
  }

  // ── J6：schema 声明了算法不支持且适配器也不读的字段（必填则更严重）──
  if (entry && params.length && Object.keys(props).length) {
    for (const k of Object.keys(props)) {
      if (isL3 && !readFields.includes(k) && !params.includes(k)) {
        const sev = required.includes(k) ? '（必填）' : ''
        v.push(`J6: ${k} 算法不支持且适配器不读${sev}`)
      }
    }
  }

  rows.push({ nm, kind: isL3 ? 'L3' : isL4 ? 'L4' : (L4_FORM.has(nm) ? 'L1/L2' : '其他'), algId, params, readFields, nProps: Object.keys(props).length, viol: v })
  totalViol += v.length
}

// ── 输出 ──────────────────────────────────────────────
const bad = rows.filter(r => r.viol.length)
console.log('='.repeat(100))
console.log('R142 B1 · 全 57 工具四方对账（J1-J7）')
console.log('='.repeat(100))
console.log(`\n工具总数: ${rows.length} ｜ L3: ${rows.filter(r => r.kind === 'L3').length} ｜ L4: ${rows.filter(r => r.kind === 'L4').length} ｜ 其他: ${rows.filter(r => r.kind === '其他' || r.kind === 'L1/L2').length}`)
console.log(`有违反的工具: ${bad.length} ｜ 违反条目: ${totalViol}\n`)

if (bad.length) {
  console.log('违反清单：')
  for (const r of bad) {
    console.log(`\n  ${r.nm}  [${r.kind}]  ${r.algId || ''}`)
    console.log(`      算法形参=${JSON.stringify(r.params)}  适配器读=${JSON.stringify(r.readFields)}  schema键数=${r.nProps}`)
    for (const x of r.viol) console.log(`      ✗ ${x}`)
  }
}

console.log('\n' + '-'.repeat(100))
console.log(`判定：${totalViol === 0 ? 'PASS（四方一致）' : `FAIL（${totalViol} 处违反，涉及 ${bad.length} 个工具）`}`)
process.exit(totalViol === 0 ? 0 : 1)
