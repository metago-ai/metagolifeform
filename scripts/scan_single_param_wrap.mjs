// scan_single_param_wrap.mjs — 找「算法单参 + 适配器返回数组」的可疑组合
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const req = createRequire(A + '/')
const TR = req(A + '/tool-registry.js')
const reg = req(A + '/engine/algorithms/registry.js')
const R = reg.registry || reg.default || reg
const all = R.getRegistry ? R.getRegistry() : []
const MAP = TR.L3_ID_MAP || {}
const src = readFileSync(A + '/tool-registry.js', 'utf8')
function paramNames(fn) {
  const m = String(fn).match(/^[^(]*\(([^)]*)\)/)
  if (!m) return []
  return m[1].split(',').map(x => x.trim().split('=')[0].trim()).filter(Boolean)
}
const suspects = []
for (const nm of Object.keys(MAP).sort()) {
  const algId = MAP[nm]
  const e = all.find(x => x.id === algId)
  if (!e) continue
  const n = paramNames(e.handler).length
  const i = src.indexOf(nm + ': function')
  if (i < 0) continue
  let j = src.indexOf('{', i), depth = 0, end = j
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') depth++
    else if (src[k] === '}') { depth--; if (depth === 0) { end = k + 1; break } }
  }
  const body = src.slice(i, end)
  // 适配器最后一条 return 是不是返回数组字面量
  const rets = [...body.matchAll(/return\s+(\[[^\]]*\]|[^;\n]+)/g)].map(m => m[1].trim())
  const lastRet = rets[rets.length - 1] || ''
  const returnsArray = /^\[/.test(lastRet)
  if (n === 1 && returnsArray) {
    suspects.push({ nm, algId, params: paramNames(e.handler), lastRet: lastRet.slice(0, 70) })
  }
}
console.log('  可疑（单参算法 + 适配器返回数组）: ' + suspects.length + ' 个')
for (const s of suspects) {
  console.log(`    ${s.nm.padEnd(26)} ${s.algId}  形参=${JSON.stringify(s.params)}  适配器返回=${s.lastRet}`)
}
process.exit(0)
