// merge_t3_shapes.mjs — 合并 225 条自动生成 + 2 条手工补，写入 shapes.json
//
// 两条手工补的原因：
//   ALG_T3_C_005  可选字段 maintenanceEvents 需要具体元素结构 {time, boost}，Proxy 探测不出
//   ALG_T3_L_007  steps[].premises 在 handler 里由默认值兜底，探测路径取不到
//
// 写入前先验证：227 条全部能在 executeAlgorithmSync 下 success 且输出非空壳。
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const require2 = createRequire(A + '/')
const reg = require2('./engine/algorithms/registry.js')
const regObj = reg.registry || reg.default || reg

const p2 = JSON.parse(readFileSync('D:/metago-build/t3_shapes_phase2.json', 'utf8'))
const shapes = Object.assign({}, p2.ok)

// 手工补两条
shapes['ALG_T3_C_005'] = {
  initialScore: 0.9,
  halfLifeDays: 30,
  elapsedDays: 15,
  maintenanceEvents: [{ time: 5, boost: 0.3 }, { time: 10, boost: 0.2 }],
}
shapes['ALG_T3_L_007'] = {
  steps: [
    { conclusion: 'A', rule: 'axiom', premises: [] },
    { conclusion: 'B', rule: 'mp', premises: [0] },
    { conclusion: 'C', rule: 'mp', premises: [1] },
  ],
  root: 2,
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
const hasBad = (v) => {
  if (typeof v === 'number') return !isFinite(v)
  if (Array.isArray(v)) return v.some(hasBad)
  if (v && typeof v === 'object' && !(v instanceof Map) && !(v instanceof Set)) return Object.values(v).some(hasBad)
  return false
}

// 逐条验证
console.log('='.repeat(90))
console.log('合并前验证 227 条')
console.log('='.repeat(90))
const ids = Object.keys(shapes).sort()
let okN = 0
const bad = []
for (const id of ids) {
  let r
  try { r = regObj.executeAlgorithmSync(id, shapes[id]) } catch (e) { r = { success: false, error: e.message } }
  const good = r && r.success === true && isMeaningful(r.output) && !hasBad(r.output)
  if (good) okN++
  else bad.push([id, String((r && r.error) || '输出无意义').slice(0, 70)])
}
console.log(`通过 ${okN} / ${ids.length}`)
if (bad.length) {
  console.log('失败：')
  for (const [id, why] of bad) console.log(`  ${id}  ${why}`)
}

if (bad.length) {
  console.log('\n✗ 有失败项，不写入 shapes.json')
  process.exit(1)
}

// 读取原 shapes.json（700 条），合并
const SH = A + '/engine/algorithms/t3impl/shapes.json'
const orig = JSON.parse(readFileSync(SH, 'utf8'))
const origCount = Object.keys(orig).length
copyFileSync(SH, SH + '.bak-r141')

const merged = Object.assign({}, orig)
for (const id of ids) merged[id] = shapes[id]

console.log('\n' + '='.repeat(90))
console.log('写入 shapes.json')
console.log('='.repeat(90))
console.log(`原 ${origCount} 条 + 新增 T3 ${ids.length} 条 = ${Object.keys(merged).length} 条`)
writeFileSync(SH, JSON.stringify(merged, null, 1), 'utf8')
console.log('已写入 ' + SH)
console.log('备份 ' + SH + '.bak-r141')
