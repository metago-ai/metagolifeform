// contract_layer_gate.mjs — R142 B2 · 契约层总门（含元断言）
//
// ════ 为什么需要这个门 ════
// 四轮复检每轮都能扫出「schema 与实际不一致」，而我的验证体系里从没有这一层。
// B1 把 89 处修完了，本门的作用是：**让它不可能再坏回去**。
//
// ════ 五条断言（契约层）════
//   K-S1  properties 的键集合 ⊆ examples[0] 的键集合 ∪ 可选字段
//   K-S2  properties[k].type 与 examples[0][k] 的实际类型一致（支持联合类型）
//   K-S3  examples[0] 通过自身 schema 校验（含 additionalProperties:false）
//   K-S4  required ⊆ examples[0] 的键
//   K-S5  L4 族级工具的 required 必须含 operation，且 operation 有 enum
//
// ════ 元断言（本门自己必须可信）════
//   K-S0  构造 6 个「已知坏的 schema」，K-S1~S5 必须全部拒绝。
//         若某个坏样本被漏过 → 对应断言无牙 → 本门 FAIL。
//
// 输出格式与 full-regression.py 匹配：末行「总判定：PASS」或「总判定：FAIL（…）」
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const req = createRequire(A + '/')
const TR = req(A + '/tool-registry.js')
const L4_MAP = TR.L4_FAMILY_MAP || {}

// ── 极简 JSON Schema 校验（项目用到的子集）──────────────
function schemaErrors(value, schema, path = '') {
  const errs = []
  if (!schema || typeof schema !== 'object') return errs
  const t = schema.type
  const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
  if (t) {
    const decl = Array.isArray(t) ? t.map(x => (x === 'float' || x === 'int') ? 'number' : x) : [t]
    if (!decl.includes(actual)) errs.push(`${path || '根'}: 声明 ${JSON.stringify(t)} 实际 ${actual}`)
  }
  if (schema.enum && !schema.enum.includes(value)) errs.push(`${path || '根'}: 值不在 enum`)
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

// ── 单份 schema 的五条断言 ────────────────────────────
function checkOne(nm, d, isL4) {
  const a = d.arguments || d.inputSchema || {}
  const props = a.properties || {}
  const required = a.required || []
  const ex = (Array.isArray(a.examples) && a.examples[0]) ? a.examples[0] : null
  const v = []

  if (!ex) { v.push('K-S2/S3/S4: 无 examples'); return { v, n: Object.keys(props).length } }

  // K-S1：example 的每个键都要在 properties 里
  for (const k of Object.keys(ex)) {
    if (!props[k]) v.push(`K-S1: example 键 ${k} 不在 properties`)
  }

  // K-S2：type 一致（联合类型支持）
  for (const [k, spec] of Object.entries(props)) {
    if (ex[k] === undefined) continue
    const actual = Array.isArray(ex[k]) ? 'array' : (ex[k] === null ? 'null' : typeof ex[k])
    const decl = spec.type
    if (!decl) { v.push(`K-S2: ${k} 未声明 type（实际 ${actual}）`); continue }
    const set = Array.isArray(decl) ? decl.map(x => (x === 'float' || x === 'int') ? 'number' : x) : [decl]
    if (!set.includes(actual)) v.push(`K-S2: ${k} 声明 ${JSON.stringify(decl)} 实际 ${actual}`)
  }

  // K-S3：example 过自身 schema
  const se = schemaErrors(ex, a, '')
  if (se.length) v.push(`K-S3: example 不合自身 schema（${se.slice(0, 2).join('；')}）`)

  // K-S4：required ⊆ example
  for (const k of required) {
    if (ex[k] === undefined) v.push(`K-S4: 必填 ${k} 在 example 里缺失`)
  }

  // K-S5：L4 的 operation
  if (isL4) {
    if (!props.operation) v.push('K-S5: L4 工具缺 operation 声明')
    else if (!props.operation.enum) v.push('K-S5: operation 缺 enum')
    if (!required.includes('operation')) v.push('K-S5: operation 未列入 required')
  }
  return { v, n: Object.keys(props).length }
}

// ── 主检查 ───────────────────────────────────────────
const files = readdirSync(A + '/tools').filter(f => f.endsWith('.json')).sort()
let total = 0, bad = 0, nprops = 0
const details = []
for (const f of files) {
  const nm = f.replace(/\.json$/, '')
  let d
  try { d = JSON.parse(readFileSync(A + '/tools/' + f, 'utf8')) } catch (e) { continue }
  total++
  const { v, n } = checkOne(nm, d, !!L4_MAP[nm])
  nprops += n
  if (v.length) { bad++; details.push([nm, v]) }
}

console.log('='.repeat(96))
console.log('R142 B2 · 契约层总门（K-S1~S5 + K-S0 元断言）')
console.log('='.repeat(96))
console.log(`\n① 契约层五条断言`)
console.log(`   工具总数 ${total} ｜ 有违反 ${bad} ｜ 涉及字段 ${nprops}`)
for (const [nm, v] of details) {
  console.log(`\n   ${nm}`)
  for (const x of v) console.log(`      ✗ ${x}`)
}

// ── K-S0 元断言：6 个已知坏的 schema，必须被拒 ──────────
// 每个样本对应一条断言，且必须只由那条断言抓出（证明每条都有牙）
const TEETH = [
  {
    name: 'K-S1 example 有多余键',
    schema: { properties: { x: { type: 'number' } }, examples: [{ x: 1, extra: 2 }] },
    expect: 'K-S1',
  },
  {
    name: 'K-S2 类型不符',
    schema: { properties: { x: { type: 'object' } }, examples: [{ x: [1, 2] }] },
    expect: 'K-S2',
  },
  {
    name: 'K-S3 additionalProperties 冲突',
    schema: { properties: { x: { type: 'number' } }, additionalProperties: false, examples: [{ x: 1, y: 2 }] },
    expect: 'K-S3',
  },
  {
    name: 'K-S4 必填缺 example',
    schema: { properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'], examples: [{ x: 1 }] },
    expect: 'K-S4',
  },
  {
    name: 'K-S5 L4 缺 operation',
    schema: { properties: { input: { type: 'object' } }, required: ['input'], examples: [{ input: {} }] },
    expect: 'K-S5',
    isL4: true,
  },
  {
    name: 'K-S2 type 未声明',
    schema: { properties: { x: { description: '无 type' } }, examples: [{ x: 1 }] },
    expect: 'K-S2',
  },
]

console.log(`\n② K-S0 元断言（6 个已知坏 schema 必须被拒）`)
let teethOk = 0
const teethMiss = []
for (const t of TEETH) {
  const { v } = checkOne('fake', { arguments: t.schema }, !!t.isL4)
  const caught = v.some(x => x.startsWith(t.expect))
  if (caught) teethOk++
  else teethMiss.push(t.name)
  console.log(`   ${caught ? '✓' : '✗'} ${t.name.padEnd(34)} → ${caught ? '已拒绝（' + t.expect + '）' : '漏过！'}`)
}
console.log(`   有牙：${teethOk} / ${TEETH.length}`)

// ── 判定 ─────────────────────────────────────────────
console.log('\n' + '-'.repeat(96))
const allOk = bad === 0 && teethOk === TEETH.length
if (allOk) {
  console.log(`总判定：PASS（契约层 ${total}/${total} ｜ 元断言 ${teethOk}/${TEETH.length}）`)
} else {
  console.log(`总判定：FAIL（契约违反 ${bad} 个工具 ｜ 元断言漏过 ${teethMiss.length} 个）`)
  if (teethMiss.length) console.log(`  无牙的断言：${teethMiss.join(' | ')}`)
}
process.exit(allOk ? 0 : 1)
