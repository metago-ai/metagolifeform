// scan_fn_params.mjs — 扫出全量 927 算法里「含函数型形参」的数量与分布
//
// 判据（三条任一命中即为函数型形参）：
//   ① 形参名像函数：fn / func / callback / predicate / scoreFn / weightFn / compute ...
//   ② inputSchema 描述里含 "=>" 或 "function" 或 "fn"
//   ③ handler 源码里对该形参有调用迹像（形参名 + "(" 或 ".call" 或 ".apply"）
//
// 用 indexOf 而非动态正则构造——形参名可能含正则元字符（如 regex / path）。
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const require2 = createRequire(A + '/')
const reg = require2('./engine/algorithms/registry.js')
const regObj = reg.registry || reg.default || reg

function paramNames(fn) {
  const m = String(fn).match(/^[^(]*\(([^)]*)\)/)
  if (!m) return []
  return m[1].split(',').map(x => x.trim().split('=')[0].trim()).filter(Boolean)
}

const FN_NAMES = new Set([
  'fn', 'func', 'filter', 'callback', 'cb', 'predicate', 'pred', 'comparator',
  'reducer', 'mapper', 'scoreFn', 'weightFn', 'distanceFn', 'compute', 'computeFn',
  'fn1', 'fn2', 'scorer', 'keyFn', 'hashFn', 'transform', 'transformFn', 'apply',
  'visit', 'visitor', 'selector', 'formatter', 'encoder', 'decoder', 'test',
])

const rows = []
const all = regObj.getRegistry ? regObj.getRegistry() : []
for (const e of all) {
  if (!e || !e.handler) continue
  const names = paramNames(e.handler)
  const sch = String(e.inputSchema || '')
  const src = String(e.handler)
  const fnParams = []
  for (const n of names) {
    const byName = FN_NAMES.has(n) || /fn$/i.test(n)
    const paren = n + '('
    const call = n + '.call'
    const apply = n + '.apply'
    const bySrc = src.indexOf(paren) >= 0 || src.indexOf(call) >= 0 || src.indexOf(apply) >= 0
    // schema 里该形参那一项的说明里是否点了"函数"
    let bySchema = false
    const parts = sch.split(',')
    for (const part of parts) {
      if (part.indexOf(n) >= 0 && (part.indexOf('=>') >= 0 || /function/i.test(part) || /\bfn\b/i.test(part))) {
        bySchema = true
      }
    }
    if (byName || bySchema || bySrc) fnParams.push({ name: n, byName, bySchema, bySrc })
  }
  if (fnParams.length) rows.push({ id: e.id, tier: String(e.tier), name: e.name, sch, fnParams })
}

console.log('='.repeat(102))
console.log('含函数型形参的算法')
console.log('='.repeat(102))
console.log('algo'.padEnd(16) + 'tier'.padEnd(10) + '形参'.padEnd(22) + 'inputSchema')
console.log('-'.repeat(102))
for (const r of rows) {
  console.log(r.id.padEnd(16) + r.tier.padEnd(10) + r.fnParams.map(f => f.name).join(',').padEnd(22) + r.sch.slice(0, 44))
}

const byTier = {}
for (const r of rows) byTier[r.tier] = (byTier[r.tier] || 0) + 1
console.log('\n' + '-'.repeat(102))
console.log('合计 ' + rows.length + ' 条算法含函数型形参')
for (const k of Object.keys(byTier)) console.log('  ' + k + ': ' + byTier[k])

const isL3 = (id) => {
  const m = id.match(/^ALG_T1_C_(\d{3})$/)
  if (!m) return false
  const n = parseInt(m[1], 10)
  return n >= 1 && n <= 30
}
const l3 = rows.filter(r => isL3(r.id))
console.log('\n其中落在 MCP L3 工具范围（ALG_T1_C_001..030）：' + l3.length + ' 条')
for (const r of l3) console.log('  ' + r.id + ' ' + r.name + '  形参=' + r.fnParams.map(f => f.name).join(','))

// 各形参的判定来源
console.log('\n判定来源分布：')
const srcCount = { byName: 0, bySchema: 0, bySrc: 0 }
for (const r of rows) for (const f of r.fnParams) {
  if (f.byName) srcCount.byName++
  if (f.bySchema) srcCount.bySchema++
  if (f.bySrc) srcCount.bySrc++
}
console.log('  ' + JSON.stringify(srcCount))
