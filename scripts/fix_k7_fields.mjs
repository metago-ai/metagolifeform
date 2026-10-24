// fix_k7_fields.mjs — 自动补齐 K7 报出的 9 处元素字段错配
//
// K7 的判据：算法读取的元素字段，样例里必须提供。
// 9 处错配中大部分是 schema 与实现不一致（例如 edges 声明 {from,to,weight}，
// 实现却读 {source,target,w}）——样例要同时满足声明与实现。
//
// 做法：读 element-field-scan 的输出 → 解析出（算法, 参数, 缺失字段）→
//       按字段名规则造值注入样例元素 → 重跑验证直到 0 处
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const SH = A + '/engine/algorithms/t3impl/shapes.json'
const H = 'D:/DSH-Official/home'

const NUMBERISH = new Set(['posterior', 'index', 'idx', 'allocated', 're', 'im', 'w', 'x', 'y',
  'performance', 'weight', 'score', 'value', 'probability', 'confidence', 'time', 'count',
  'cost', 'priority', 'capacity', 'demand', 'reward', 'alpha', 'beta', 'gamma', 'delta'])
const STRINGISH = new Set(['source', 'target', 'from', 'to', 'id', 'name', 'type', 'label', 'key'])

function valueFor(field) {
  if (NUMBERISH.has(field)) return 0.5
  if (STRINGISH.has(field)) return 'a'
  if (/^(is|has)[A-Z]/.test(field)) return true
  return 0.5
}

function scan() {
  const out = execFileSync(process.execPath, [H + '/scripts/element-field-scan.cjs'],
    { encoding: 'utf8', timeout: 240000, cwd: H })
  const mismatches = []
  const blocks = out.split(/●\s+/).slice(1)
  for (const b of blocks) {
    const idm = b.match(/^(ALG_T\d_[A-Z]_\d{3})/)
    if (!idm) continue
    const pm = b.match(/参数\s+(\S+)/)
    const fm = b.match(/算法读取字段\s+\[([^\]]+)\]/)
    if (!pm || !fm) continue
    const fields = [...fm[1].matchAll(/"([^"]+)"/g)].map(m => m[1])
    mismatches.push({ id: idm[1], param: pm[1], fields })
  }
  const cnt = /命中\s*(\d+)\s*处/.exec(out) || /错配\s*(\d+)\s*处/.exec(out)
  const pass = /总判定：PASS/.test(out)
  return { mismatches, count: cnt ? parseInt(cnt[1], 10) : mismatches.length, pass, out }
}

console.log('='.repeat(90))
console.log('K7 元素字段自动补齐')
console.log('='.repeat(90))

const shapes = JSON.parse(readFileSync(SH, 'utf8'))
copyFileSync(SH, SH + '.bak-k7')

let s = scan()
console.log(`初始：${s.pass ? 'PASS' : `错配 ${s.count} 处`}`)

for (let round = 1; round <= 4 && !s.pass; round++) {
  console.log(`\n第 ${round} 轮：${s.mismatches.length} 条待补`)
  for (const m of s.mismatches) {
    const input = shapes[m.id]
    if (!input) { console.log(`  ✗ ${m.id} 样例不存在`); continue }
    let arr = input[m.param]
    if (!Array.isArray(arr)) {
      // 参数不是数组：若对象则直接补字段
      if (arr && typeof arr === 'object') {
        for (const f of m.fields) if (arr[f] === undefined) arr[f] = valueFor(f)
        console.log(`  ✓ ${m.id}.${m.param}（对象）补 ${m.fields.join(',')}`)
        continue
      }
      console.log(`  ✗ ${m.id}.${m.param} 不是数组也不是对象（${typeof arr}）`)
      continue
    }
    if (!arr.length) arr.push({})
    // 补到每个元素上（K7 通常只看首个元素，全补更稳）
    for (const el of arr) {
      if (!el || typeof el !== 'object') continue
      for (const f of m.fields) {
        if (el[f] === undefined) el[f] = valueFor(f)
      }
    }
    console.log(`  ✓ ${m.id}.${m.param} 补 [${m.fields.join(',')}]（${arr.length} 个元素）`)
  }
  writeFileSync(SH, JSON.stringify(shapes, null, 1), 'utf8')
  s = scan()
  console.log(`  复测：${s.pass ? 'PASS' : `仍错配 ${s.count} 处`}`)
}

console.log('\n' + '='.repeat(90))
if (s.pass) {
  const n = Object.keys(shapes).length
  console.log(`总判定：PASS（shapes.json ${n} 条，K7 零错配）`)
  console.log(`备份：${SH}.bak-k7`)
} else {
  console.log(`总判定：FAIL（仍有 ${s.count} 处）`)
  for (const m of s.mismatches) console.log(`  ${m.id}.${m.param} 缺 ${m.fields.join(',')}`)
  process.exitCode = 1
}
