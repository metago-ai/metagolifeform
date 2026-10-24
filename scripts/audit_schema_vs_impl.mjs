// audit_schema_vs_impl.mjs — 全量核对 30 个 L3 工具的 schema 声明 vs 算法真实签名
//
// 为什么必须做这件事：
//   build_coupling_matrix 的教训说明——只改适配器不改 schema，调用方照 schema 传参会撞墙。
//   而 schema 与算法签名不符是系统性问题（上游给的 schema 未必对得上实现）。
//
// 核对方法：
//   ① 读 tools/<name>.json 的 arguments.properties（schema 声明的参数名）
//   ② 读算法 handler 的形参名（Fn 型跳过，因为它们由适配器造）
//   ③ 读适配器实际读取的字段名（源码里 a.xxx 的出现）
//   判据：schema 声明的每个必填字段，必须至少被适配器读取（否则传了没用）；
//         适配器读取的字段，应该在 schema 里出现（否则调用方不知道要传）
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const req = createRequire(A + '/')
const TR = req(A + '/tool-registry.js')
const reg = req(A + '/engine/algorithms/registry.js')
const R = reg.registry || reg.default || reg
const all = R.getRegistry ? R.getRegistry() : []

// 1. 拿 L3 工具清单
//    只扫 L3：L4 族级工具走 L4_FAMILY_MAP（{operation,input} 是它们的正确形态），不需要 L3 适配器。
//    一开始我把 57 个全扫进来报了 35 处——那是检测器范围错，不是真问题。
const L3_ONLY = new Set(Object.keys(TR.L3_ID_MAP || {}))
const toolsDir = A + '/tools'
const toolFiles = readdirSync(toolsDir).filter(f => f.endsWith('.json'))
const schemas = {}
for (const f of toolFiles) {
  try {
    const d = JSON.parse(readFileSync(toolsDir + '/' + f, 'utf8'))
    const nm = d.name || f.replace(/\.json$/, '')
    const args = d.arguments || d.inputSchema || {}
    if (!L3_ONLY.has(nm)) continue   // 只统计 L3
    schemas[nm] = { props: Object.keys(args.properties || {}), required: args.required || [] }
  } catch (e) { }
}

// 2. 读 tool-registry 源码，抽出每个适配器函数体
const src = readFileSync(A + '/tool-registry.js', 'utf8')
const adaptBodies = {}
for (const nm of Object.keys(schemas)) {
  const i = src.indexOf(nm + ': function')
  if (i < 0) continue
  // 找配对的结束（用大括号计数）
  let j = src.indexOf('{', i)
  let depth = 0, end = j
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') depth++
    else if (src[k] === '}') { depth--; if (depth === 0) { end = k + 1; break } }
  }
  adaptBodies[nm] = src.slice(i, end)
}

// 3. 算法 handler 形参
function paramNames(fn) {
  const m = String(fn).match(/^[^(]*\(([^)]*)\)/)
  if (!m) return []
  return m[1].split(',').map(x => x.trim().split('=')[0].trim()).filter(Boolean)
}

console.log('='.repeat(96))
console.log(`schema vs 适配器 vs 算法 三方核对（L3 工具 ${Object.keys(schemas).length} 个）`)
console.log('='.repeat(96))

const issues = []
for (const nm of Object.keys(schemas).sort()) {
  const sch = schemas[nm]
  const body = adaptBodies[nm] || ''
  // 适配器读取的字段：形如 a.xxx / args.xxx
  const readFields = [...new Set([...body.matchAll(/\ba\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]))]
    .filter(x => !['length', 'map', 'forEach', 'filter', 'join', 'push', 'size', 'matrix', 'labels', 'id', 'name', 'from', 'to', 'weight', 'source', 'target', 'slice', 'split', 'replace', 'trim', 'codePointAt', 'charCodeAt', 'includes', 'indexOf'].includes(x))

  // 找该工具对应的算法
  const map = TR.L3_ID_MAP || {}
  const algId = Object.keys(map).find(k => k === nm) ? map[nm] : null
  const entry = all.find(e => e.id === algId)
  const params = entry ? paramNames(entry.handler) : []

  // 判据 A：schema 必填字段必须被适配器读取
  const unread = sch.required.filter(f => !readFields.includes(f))
  // 判据 B：适配器读取的字段应在 schema 出现
  const undeclared = readFields.filter(f => !sch.props.includes(f))

  if (unread.length || undeclared.length) {
    issues.push({ nm, algId, required: sch.required, props: sch.props, readFields, params, unread, undeclared })
  }
}

if (!issues.length) {
  console.log('\n  全部一致，无 schema/适配器不匹配')
} else {
  console.log(`\n发现 ${issues.length} 个工具存在 schema 与适配器不一致：\n`)
  for (const it of issues) {
    console.log(`  ${it.nm}（${it.algId || '?'}）`)
    console.log(`      schema 声明: ${JSON.stringify(it.props)}  必填: ${JSON.stringify(it.required)}`)
    console.log(`      适配器读取: ${JSON.stringify(it.readFields)}`)
    console.log(`      算法形参:   ${JSON.stringify(it.params)}`)
    if (it.unread.length) console.log(`      ⚠ schema 必填但适配器未读（传了没用）: ${JSON.stringify(it.unread)}`)
    if (it.undeclared.length) console.log(`      ⚠ 适配器读取但 schema 未声明（调用方不知道要传）: ${JSON.stringify(it.undeclared)}`)
  }
}
console.log(`\n合计 ${issues.length} 处不一致 / ${Object.keys(schemas).length} 个工具`)
