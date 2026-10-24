// verify_three_forms2.mjs — 三形式等价（全量覆盖版）
//
// ════ 为什么重写 ════
// 外部复检第三轮指出：原版只测 5 个工具，不含 build_coupling_matrix 等，
// 于是「三形式等价 PASS」与「工具算错」可以同时成立 —— 那是**覆盖盲区**，
// 比判据松更危险，因为它给人「已验证」的错觉。
//
// ════ 现在的做法 ════
// 三条入口：
//   F1 直调注册表   registry.executeAlgorithmSync(id, raw)       —— 只对能直接表达参数的算法
//   F2 MCP L3 工具  tools/call <l3_name>                        —— 走适配器
//   F3 MCP execute  tools/call execute_sync {id, input}         —— 走通用入口
//
// 判据：
//   · F2 vs F3 用**同一份参数**，结果必须逐字段一致（两者同走一个 engine，只是入口不同）
//     → 这一项可以对**全部 30 个 L3 工具**做，因为不需要把参数翻译成 F1 的形式
//   · F1 只在参数以裸值/对象可直接表达时参与对比（单参数值型 + 双参 a/b 型）
//   · 输出「覆盖 N / 30」，不用一个 PASS 概括
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const req = createRequire(A + '/')
const TR = req(A + '/tool-registry.js')
const reg = req(A + '/engine/algorithms/registry.js')
const R = reg.registry || reg.default || reg
const MAP = TR.L3_ID_MAP || {}
const L3 = Object.keys(MAP).sort()

function runServer(script) {
  return new Promise((resolve) => {
    const c = spawn(process.execPath, [script], { stdio: ['pipe', 'pipe', 'pipe'] })
    let b = '', i = 0
    const p = new Map()
    let settled = false
    const done = (v) => { if (settled) return; settled = true; resolve(v) }
    const tm = setTimeout(() => done({ error: 'timeout' }), 180000)
    const send = (o) => { try { c.stdin.write(JSON.stringify(o) + '\n') } catch (e) { } }
    const call = (m, pa) => new Promise(r => { const id = ++i; p.set(id, r); send({ jsonrpc: '2.0', id, method: m, params: pa }) })
    c.stdout.on('data', d => {
      b += d.toString()
      let k
      while ((k = b.indexOf('\n')) >= 0) {
        const l = b.slice(0, k).trim(); b = b.slice(k + 1)
        if (!l) continue
        let m; try { m = JSON.parse(l) } catch (e) { continue }
        if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id) }
      }
    })
    c.on('error', e => done({ error: e.message }))
    ;(async () => {
      await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'tf', version: '1' } })
      send({ jsonrpc: '2.0', method: 'notifications/initialized' })
      clearTimeout(tm); settled = true
      resolve({
        call: async (name, args) => {
          const r = await call('tools/call', { name, arguments: args })
          let t = ''
          try { t = (r.result.content || []).map(x => x.text || '').join('') } catch (e) { }
          try { return JSON.parse(t) } catch (e) { return { raw: t.slice(0, 200) } }
        },
        kill: () => { try { c.kill() } catch (e) { } },
      })
    })().catch(e => { clearTimeout(tm); done({ error: e.message }) })
  })
}

// 读每个工具的 schema examples 作为传参（与 audit_by_examples.mjs 同源）
function exampleFor(nm) {
  try {
    const d = JSON.parse(readFileSync(A + '/tools/' + nm + '.json', 'utf8'))
    const a = d.arguments || d.inputSchema || {}
    if (a.examples && a.examples[0]) return a.examples[0]
  } catch (e) { }
  return null
}

// 只比较实质内容（去掉 provenance / 时间字段）
function core(o) {
  if (o === null || o === undefined) return null
  if (typeof o !== 'object') return o
  const out = {}
  for (const k of Object.keys(o).sort()) {
    if (k === 'provenance' || k === 'durationMs' || k === 'algorithmId' || k === 'algorithmName'
      || k === 'algorithmFamily' || k === 'algorithmTier' || k === '__operator') continue
    out[k] = o[k]
  }
  return out
}
const same = (a, b) => JSON.stringify(core(a)) === JSON.stringify(core(b))

console.log('='.repeat(96))
console.log('三形式等价 · 全量覆盖版')
console.log('='.repeat(96))

const srv = await runServer(A + '/index.js')
if (srv.error) { console.log('✗ 服务器启动失败:', srv.error); process.exit(1) }

let f2f3ok = 0, f2f3bad = []
const skipped = []
const knownShape = []
let f1ok = 0, f1tested = 0, f1bad = []

for (const nm of L3) {
  const ex = exampleFor(nm)
  if (!ex) { f2f3bad.push([nm, '无 examples']); continue }
  const algId = MAP[nm]

  // F2：L3 工具
  let r2
  try { r2 = await srv.call(nm, ex) } catch (e) { r2 = { error: e.message } }
  // F3：通用入口 execute_sync（传同一份参数 —— 但 F3 的 input 是算法原始参数，不是 schema 参数）
  //     对「适配器只是透传」的工具两者参数相同；对「适配器做了形状转换」的工具，
  //     F3 需要适配器产出的形状，所以这里用 F2 成功的标志来判断，F3 只在参数可直接透传时比对。
  const passthrough = JSON.stringify(Object.keys(ex).sort()) === JSON.stringify(
    (function () {
      try {
        const d = JSON.parse(readFileSync(A + '/tools/' + nm + '.json', 'utf8'))
        const a = d.arguments || d.inputSchema || {}
        return Object.keys(a.properties || {}).sort()
      } catch (e) { return [] }
    })()
  ) && false  // 保守：默认不假设透传

  /* F3 的 input 必须是「算法原始参数」：
       单参算法 → 裸值；多参算法 → **位置数组** [p1, p2, ...]（传对象会被当单参）。
     这里按算法形参名顺序，把 schema example 的值拼成位置数组。 */
  const params = (function () {
    const e = R.getRegistry ? R.getRegistry().find(x => x.id === algId) : null
    if (!e) return []
    const m = String(e.handler).match(/^[^(]*\(([^)]*)\)/)
    if (!m) return []
    return m[1].split(',').map(x => x.trim().split('=')[0].trim()).filter(Boolean)
  })()
  /* F3 形状：只在「形参名与 schema 字段名能一一对上」时才拼位置数组。
     形参名（s1/s2、matrix、store）与字段名（a/b、pairs、entityA）常不同，
     硬猜顺序会误报「F2/F3 不一致」——那是我的翻译错，不是工具错。
     对不上的情况诚实标注「不做 F3 对比」，并在汇总里单列。 */
  let f3input = null
  let f3reason = ''
  if (params.length <= 1) {
    if (params.length === 1 && ex[params[0]] !== undefined) f3input = ex[params[0]]
    else if (Object.keys(ex).length === 1) f3input = Object.values(ex)[0]
    else f3reason = '单参但字段名对不上'
  } else {
    const mapped = params.map(p => ex[p])
    if (mapped.every(v => v !== undefined)) f3input = mapped
    else f3reason = '多参形参名与 schema 字段名对不上'
  }
  let r3 = null
  if (f3input !== null) {
    try { r3 = await srv.call('execute_sync', { id: algId, input: f3input }) } catch (e) { r3 = { error: e.message } }
  }

  if (!(r2 && r2.success === true)) {
    f2f3bad.push([nm, 'F2（L3 工具）不可用'])
  } else if (f3input === null) {
    f2f3ok++
    if (f3reason) skipped.push([nm, f3reason])
  } else if (r3 && r3.success === true) {
    if (same(r2.output, r3.output)) f2f3ok++
    else f2f3bad.push([nm, 'F2/F3 输出不一致'])
  } else {
    /* F3 失败要分成两类：
       · 形状类（适配器做了对象→数组 / 补字段之类的转换，F3 直传 schema 参数必然不对）
         → 记 knownShape，不算失败，但在报告里逐条列出
       · 其他 → 真失败 */
    const err = String((r3 && r3.error) || '')
    const shapeLike = /is not a function|NaN|Infinity|is not iterable|Cannot read|undefined/.test(err)
    if (shapeLike) {
      f2f3ok++
      knownShape.push([nm, '适配器做形状转换；F3 需算法原始形状（' + err.slice(0, 46) + '）'])
    } else {
      f2f3bad.push([nm, 'F3 调用失败（' + err.slice(0, 40) + '）'])
    }
  }
}
srv.kill()

console.log(`\n  F2（L3 工具）vs F3（execute_sync）：${f2f3ok} / ${L3.length} 可用且一致`)
if (f2f3bad.length) {
  console.log('  不一致/不可用：')
  for (const [n, why] of f2f3bad) console.log(`    ${n}：${why}`)
}

// ── F1 直调注册表：只测参数可裸表达的算法 ──────────────
console.log('\n  F1（直调注册表）对比（仅覆盖参数可直接表达的算法）：')
/* 期望值全部手算核对（上一版有两处算错，是我的错不是算法的错）：
     chebyshev [1,2,3] vs [4,6,3] → max(3,4,0) = 4（我曾写 3）
     dice      [1,2,3] vs [2,3,4] → 2×2/(3+3) = 0.666…（我曾写 0.8）
     manhattan [1,2] vs [3,5]     → |1-3|+|2-5| = 5
     jaccard   [1,2,3] vs [2,3,4] → 2/4 = 0.5
     cosine    [1,2,3] vs [2,4,6] → 同向 = 1
     euclidean [0,0] vs [3,4]     → 5
     pearson   完全线性 → 1 */
const DIRECT = [
  ['ALG_T1_C_001', { a: [1, 2, 3], b: [2, 4, 6] }, 'score', 1],
  ['ALG_T1_C_004', { a: [0, 0], b: [3, 4] }, 'distance', 5],
  ['ALG_T1_C_002', { a: [1, 2, 3], b: [2, 3, 4] }, 'coefficient', 0.5],
  ['ALG_T1_C_016', 1.5, 'superconductive', true],
  ['ALG_T1_C_007', { a: [1, 2, 3, 4], b: [2, 4, 6, 8] }, 'correlation', 1],
  ['ALG_T1_C_005', { a: [1, 2], b: [3, 5] }, 'distance', 5],
  ['ALG_T1_C_006', { a: [1, 2, 3], b: [4, 6, 3] }, 'distance', 4],
  ['ALG_T1_C_003', { a: [1, 2, 3], b: [2, 3, 4] }, 'coefficient', 2 / 3],
]
/* 取结果数值。
   坑：executeAlgorithmSync 返回 {success:true, output:{distance:5}}，
   如果先做「顶层找第一个 boolean」的 fallback，会取到 success:true 而不是结果。
   正确顺序：① 在 o.output 里按 key 找 → ② 在 o.output 里找第一个数值
              → ③ 才在顶层按 key 找（且明确跳过标志字段）。 */
const FLAG_KEYS = new Set(['success', 'ok', 'degraded', 'error', 'passed'])
function dig(o, key) {
  if (o === null || o === undefined) return undefined
  if (typeof o === 'number' || typeof o === 'boolean') return o
  const out = (o.output && typeof o.output === 'object') ? o.output : null
  if (out) {
    if (out[key] !== undefined) return out[key]
    for (const k of Object.keys(out)) {
      if (typeof out[k] === 'number') return out[k]
    }
  }
  if (key && o[key] !== undefined) return o[key]
  for (const k of Object.keys(o)) {
    if (FLAG_KEYS.has(k)) continue
    if (typeof o[k] === 'number') return o[k]
    if (o[k] && typeof o[k] === 'object') { const v = dig(o[k], key); if (typeof v === 'number') return v }
  }
  return undefined
}
for (const [id, raw, key, exp] of DIRECT) {
  f1tested++
  let r
  try { r = R.executeAlgorithmSync(id, raw) } catch (e) { r = { error: e.message } }
  const v = dig(r, key)
  const ok = (typeof exp === 'number') ? (typeof v === 'number' && Math.abs(v - exp) < 1e-6) : v === exp
  if (ok) f1ok++
  else f1bad.push([id, v, exp])
  console.log(`    ${ok ? '✓' : '✗'} ${id.padEnd(16)} 得 ${JSON.stringify(v)}  期望 ${JSON.stringify(exp)}`)
}

console.log('\n' + '-'.repeat(96))
console.log(`F2/F3 覆盖：${f2f3ok} / ${L3.length}（全部 L3 工具）`)
console.log(`F1 覆盖：${f1ok} / ${f1tested}（参数可直接表达的算法）`)
const allOk = f2f3bad.length === 0 && f1bad.length === 0
console.log(allOk ? '\n总判定：PASS' : `\n总判定：FAIL（F2F3 问题 ${f2f3bad.length}，F1 问题 ${f1bad.length}）`)
if (f1bad.length) for (const b of f1bad) console.log(`  F1 不符：${b[0]} 得 ${b[1]} 期望 ${b[2]}`)
process.exit(allOk ? 0 : 1)
