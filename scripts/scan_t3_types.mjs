// scan_t3_types.mjs — 扫出 T3 inputSchema 里出现的全部自定义类型名
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const require2 = createRequire(A + '/')
const reg = require2('./engine/algorithms/registry.js')
const regObj = reg.registry || reg.default || reg

const all = regObj.getRegistry ? regObj.getRegistry() : []
const t3 = all.filter(e => String(e.tier) === 'T3')

const BUILTIN = new Set(['number', 'string', 'boolean', 'any', 'unknown', 'void', 'null',
  'undefined', 'object', 'Map', 'Set', 'Array', 'Record', 'Promise', 'Date', 'RegExp'])

const typeCount = new Map()
const primCount = new Map()

for (const e of t3) {
  const s = String(e.inputSchema || '')
  // 把 ":" 或 ":" 后的类型片段抓出来（到 ; } ? , ] 为止）
  const re = /:\s*([A-Za-z_$][\w$]*)/g
  let m
  while ((m = re.exec(s)) !== null) {
    const name = m[1]
    if (BUILTIN.has(name)) {
      primCount.set(name, (primCount.get(name) || 0) + 1)
    } else {
      typeCount.set(name, (typeCount.get(name) || 0) + 1)
    }
  }
  // 数组元素类型 X[] 与 Array<X>
  const re2 = /([A-Z][A-Za-z0-9_$]*)\[\]/g
  while ((m = re2.exec(s)) !== null) {
    if (!BUILTIN.has(m[1])) typeCount.set(m[1], (typeCount.get(m[1]) || 0) + 1)
  }
}

console.log('='.repeat(90))
console.log(`T3 ${t3.length} 条：自定义类型 ${typeCount.size} 种 / 内建类型 ${primCount.size} 种`)
console.log('='.repeat(90))
console.log('\n内建类型用量：')
for (const [k, v] of [...primCount.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(4)}  ${k}`)
}
console.log(`\n自定义类型（按出现次数）：`)
for (const [k, v] of [...typeCount.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(4)}  ${k}`)
}

// 输出 JSON 供后续造值器使用
const out = {
  t3Count: t3.length,
  customTypes: Object.fromEntries([...typeCount.entries()].sort((a, b) => b[1] - a[1])),
  builtinUsage: Object.fromEntries(primCount),
  schemas: t3.map(e => ({ id: e.id, name: e.name, family: String(e.family), schema: String(e.inputSchema || '') })),
}
writeFileSync('D:/metago-build/t3_scan.json', JSON.stringify(out, null, 1), 'utf8')
console.log('\n已写出 D:/metago-build/t3_scan.json')
