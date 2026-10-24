// probe_t3_schema.mjs — 侦察 T3 227 条算法的 inputSchema 形态 + 现有 shapes.json 结构
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const require2 = createRequire(A + '/')
const reg = require2('./engine/algorithms/registry.js')
const regObj = reg.registry || reg.default || reg

const all = regObj.getRegistry ? regObj.getRegistry() : []
const t3 = all.filter(e => String(e.tier) === 'T3')
console.log('='.repeat(96))
console.log(`T3 算法 ${t3.length} 条`)
console.log('='.repeat(96))

// 按 inputSchema 形态归类
const shapes = new Map()
for (const e of t3) {
  const s = String(e.inputSchema || '?')
  if (!shapes.has(s)) shapes.set(s, [])
  shapes.get(s).push(e.id)
}
console.log(`\ninputSchema 去掉具体名后共 ${shapes.size} 种不同形态：`)
const sorted = [...shapes.entries()].sort((a, b) => b[1].length - a[1].length)
for (const [s, ids] of sorted.slice(0, 30)) {
  console.log(`  ${String(ids.length).padStart(3)} 条  ${s.slice(0, 70)}`)
  console.log(`         例：${ids.slice(0, 3).join(', ')}`)
}

// 看几条 T3 的完整对象
console.log('\n' + '='.repeat(96))
console.log('样例对象（前 3 条）')
console.log('='.repeat(96))
for (const e of t3.slice(0, 3)) {
  console.log(`\n${e.id} ${e.name}`)
  for (const k of Object.keys(e)) {
    const v = e[k]
    if (typeof v === 'function') continue
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    console.log(`  ${k}: ${s.length > 120 ? s.slice(0, 120) + '…' : s}`)
  }
  console.log(`  handler 形参: ${(String(e.handler).match(/^[^(]*\(([^)]*)\)/) || [, '?'])[1]}`)
}

// 现有 shapes.json 结构
console.log('\n' + '='.repeat(96))
console.log('现有 shapes.json 结构')
console.log('='.repeat(96))
try {
  const sh = JSON.parse(readFileSync(A + '/engine/algorithms/t3impl/shapes.json', 'utf8'))
  const keys = Object.keys(sh)
  console.log(`条目 ${keys.length} 条`)
  for (const k of keys.slice(0, 5)) {
    console.log(`  ${k} → ${JSON.stringify(sh[k]).slice(0, 150)}`)
  }
  const t3keys = keys.filter(k => k.indexOf('ALG_T3') === 0)
  console.log(`其中 T3: ${t3keys.length} 条`)
} catch (e) {
  console.log('读取失败:', e.message)
}

// 看 bind.cjs 怎么用 shapes
console.log('\n' + '='.repeat(96))
console.log('t3impl/bind.cjs 如何使用 shapes')
console.log('='.repeat(96))
try {
  const bt = readFileSync(A + '/engine/algorithms/t3impl/bind.cjs', 'utf8')
  const lines = bt.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('shapes') >= 0 || lines[i].indexOf('SHAPES') >= 0) {
      console.log(`  L${i + 1}: ${lines[i].trim().slice(0, 110)}`)
    }
  }
} catch (e) {
  console.log('读取失败:', e.message)
}
