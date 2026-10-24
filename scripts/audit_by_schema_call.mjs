// audit_by_schema_call.mjs — 最可靠的核对：按 schema 声明的字段真调，验结果对不对
//
// 为什么放弃静态分析：
//   audit_schema_vs_impl.mjs 用正则从适配器源码猜「读了哪些字段」，误报率高
//   （simplified_svd 明明读了 a.matrix，被我的过滤列表排除了）。
//   静态分析猜的是「写了什么」，实测验的是「能不能用」——后者才是判据。
//
// 方法：
//   ① 从 tools/<name>.json 读 arguments.properties + required
//   ② 用**声明的字段名**构造一组合理参数（不是适配器想要的字段）
//   ③ spawn 全新 MCP 服务器调该工具
//   ④ 判据：success===true 且输出有数值内容（不是空壳/NaN）
//   这一步只验「照 schema 传参能不能跑通」，语义正确性由 mcp-tools-semantic.cjs 负责
import { spawn } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const req = createRequire(A + '/')
const TR = req(A + '/tool-registry.js')
const L3 = Object.keys(TR.L3_ID_MAP || {})

// 按字段名 + 类型造一个"合理"的值（不是随便填，要让算法能跑）
function valueFor(name, spec) {
  const t = spec && spec.type
  const n = String(name).toLowerCase()

  /* 第一层必须按 schema 声明的 type 分流——「按 schema 传参」的测试只能以 schema 为唯一依据。
     否则会出现「schema 已改成 string，测试仍传数组」的假失败。 */
  if (t === 'string') {
    if (/^(a|s1)$/.test(n)) return 'metago'
    if (/^(b|s2)$/.test(n)) return 'metag0'
    if (/entitya/.test(n)) return 'a'
    if (/entityb/.test(n)) return 'b'
    if (/order/.test(n)) return 'desc'
    if (/mode|operation|type/.test(n)) return 'default'
    return 'test'
  }
  if (t === 'boolean') return true
  if (t === 'number') {
    if (/threshold/.test(n)) return 0.5
    if (/iterations/.test(n)) return 10
    if (/halfLife/.test(n)) return 1000
    if (/targetDim|components/.test(n)) return 2
    if (/^k$|clusters/.test(n)) return 2
    if (/tolerance/.test(n)) return 0.01
    if (/score/.test(n)) return 1.2
    if (/min/.test(n)) return 0
    if (/max/.test(n)) return 2
    if (/weight/.test(n)) return 0.8
    if (/now|time/.test(n)) return 1700000000000
    return 1
  }
  if (t === 'array') {
    if (/^(matrix)$/.test(n) || /^(pairs|relations|edges|entities)$/.test(n))
      return n === 'entities' ? [{ id: 'a' }, { id: 'b' }] : [[0, 0.9], [0.9, 0]]
    if (/^(a|b|s1|s2|forward|backward|values|series|scores)$/.test(n)) return [0.8, 0.6, 0.9]
    if (/timeSeries|timestamps/.test(n)) return [0.3, 0.5, 0.7]
    if (/items/.test(n)) return [[0, 0.5], [1, 0.6]]
    if (/vectors|data|samples|points|rows/.test(n)) return [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
    if (/entities|nodes|labels/.test(n)) return [{ id: 'a' }, { id: 'b' }]
    return [1, 2, 3]
  }
  if (t === 'object') {
    if (/matrix/.test(n)) return { size: 2, matrix: [[1, 0.5], [0.5, 1]], labels: ['a', 'b'] }
    if (/store/.test(n)) return {}
    if (/forward|backward/.test(n)) return [0.8, 0.6, 0.9]
    if (/timeSeries/.test(n)) return [0.3, 0.5, 0.7]
    if (/pairs|entities/.test(n)) return [[0, 0.9], [0.9, 0]]
    if (/score/.test(n)) return 1.2
    return { a: 1 }
  }
  // 无 type 声明：按名字兜底
  if (/^(matrix)$/.test(n)) return { size: 2, matrix: [[1, 0.5], [0.5, 1]], labels: ['a', 'b'] }
  if (/^(vectors|data|samples|points|rows)$/.test(n)) return [[1, 2], [2, 3], [3, 4.1]]
  if (/^(a|b)$/.test(n)) return [1, 2, 3]
  if (/^(scores|values|series|items|list)$/.test(n)) return [0.5, 0.8, 0.2, 0.9]
  if (/^(pairs|relations|edges)$/.test(n)) return [[0, 0.9], [0.9, 0]]
  if (/^(entities|nodes|labels)$/.test(n)) return [{ id: 'a' }, { id: 'b' }]
  if (/^(store)$/.test(n)) return {}
  if (/^(order|descending)$/.test(n)) return n === 'order' ? 'desc' : true
  if (/^(timeSeries|timestamps)$/.test(n)) return [0.3, 0.5, 0.7]
  if (/^(items_ts)$/.test(n)) return [[0, 0.5], [1, 0.6]]
  if (t === 'number') {
    if (/threshold/.test(n)) return 0.5
    if (/iterations/.test(n)) return 10
    if (/halfLife/.test(n)) return 1000
    if (/targetDim|components/.test(n)) return 2
    if (/^k$|clusters/.test(n)) return 2
    if (/tolerance/.test(n)) return 0.01
    if (/score/.test(n)) return 1.2
    if (/min|max/.test(n)) return 0
    if (/weight/.test(n)) return 0.8
    if (/now|time/.test(n)) return 1700000000000
    return 1
  }
  if (t === 'boolean') return true
  if (t === 'array') {
    if (/items|window|events|timestamps/.test(n)) return [[0, 0.5], [1, 0.6]]
    if (/scores|values/.test(n)) return [0.5, 0.8]
    if (/pairs/.test(n)) return [[0, 0.9]]
    if (/entities/.test(n)) return [{ id: 'a' }, { id: 'b' }]
    return [1, 2]
  }
  if (t === 'object') {
    if (/matrix/.test(n)) return { size: 2, matrix: [[1, 0.5], [0.5, 1]], labels: ['a', 'b'] }
    if (/store/.test(n)) return {}
    if (/score/.test(n)) return 1.2
    return { a: 1 }
  }
  return 'x'
}

/* R142 修：examples 优先。
   理由：examples 是 schema 的一部分，调用方（尤其 AI）会同时读 properties 与 examples。
   只按 type 造值会造出「类型对但语义错」的参数（如 entities 造 [{id}] 而实际要二维系数组），
   那是测试脚本的缺陷，不是 schema 的缺陷。 */
function buildArgs(props, required, examples) {
  if (Array.isArray(examples) && examples[0] && typeof examples[0] === 'object') {
    return JSON.parse(JSON.stringify(examples[0]))
  }
  const out = {}
  for (const k of Object.keys(props)) {
    if (required.includes(k)) out[k] = valueFor(k, props[k])
  }
  return out
}

function runServer(script) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], { stdio: ['pipe', 'pipe', 'pipe'] })
    let buf = '', id = 0
    const pending = new Map()
    let settled = false
    const done = (v) => { if (settled) return; settled = true; resolve(v) }
    const timer = setTimeout(() => done({ error: 'timeout' }), 180000)
    const send = (o) => { try { child.stdin.write(JSON.stringify(o) + '\n') } catch (e) { } }
    const call = (m, p) => new Promise((res) => { const i = ++id; pending.set(i, res); send({ jsonrpc: '2.0', id: i, method: m, params: p }) })
    child.stdout.on('data', (d) => {
      buf += d.toString()
      let i
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
        if (!line) continue
        let m; try { m = JSON.parse(line) } catch (e) { continue }
        if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
      }
    })
    child.on('error', e => done({ error: e.message }))
    ;(async () => {
      await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'a', version: '1' } })
      send({ jsonrpc: '2.0', method: 'notifications/initialized' })
      clearTimeout(timer); settled = true
      resolve({
        call: async (name, args) => {
          const r = await call('tools/call', { name, arguments: args })
          let text = ''
          try { text = (r.result.content || []).map(x => x.text || '').join('') } catch (e) { }
          try { return JSON.parse(text) } catch (e) { return { raw: text.slice(0, 200) } }
        },
        kill: () => { try { child.kill() } catch (e) { } },
      })
    })().catch(e => { clearTimeout(timer); done({ error: e.message }) })
  })
}

const hasFiniteNumber = (v) => {
  if (typeof v === 'number') return isFinite(v)
  if (Array.isArray(v)) return v.some(hasFiniteNumber)
  if (v && typeof v === 'object') return Object.values(v).some(hasFiniteNumber)
  return false
}

console.log('='.repeat(96))
console.log(`按 schema 声明传参 · 实测 30 个 L3 工具`)
console.log('='.repeat(96))

const srv = await runServer(A + '/index.js')
if (srv.error) { console.log('✗ 服务器启动失败:', srv.error); process.exit(1) }

const toolsDir = A + '/tools'
const rows = []
for (const nm of L3.sort()) {
  const f = toolsDir + '/' + nm + '.json'
  let props = {}, required = [], exList = null
  try {
    const d = JSON.parse(readFileSync(f, 'utf8'))
    const args = d.arguments || d.inputSchema || {}
    props = args.properties || {}
    required = args.required || []
    exList = Array.isArray(args.examples) ? args.examples : null
  } catch (e) { }
  const callArgs = buildArgs(props, required, exList)
  let r
  try { r = await srv.call(nm, callArgs) } catch (e) { r = { error: e.message } }
  const okSuccess = r && r.success === true
  const hasNum = hasFiniteNumber(r && r.output)
  const errText = r && (r.error || (r.output && r.output.error) || '')

  /* 合法的空结果：算法明确返回空数组，且 provenance 说明计数为 0。
     与「入参形状不匹配导致的空」区分——后者由 OUTPUT-GUARD 报 invalid_output，走 errText 分支。 */
  const isEmptyLegit = (() => {
    const o = r && r.output
    if (!o || typeof o !== 'object') return false
    const prov = Array.isArray(o.provenance) ? o.provenance.join(' ') : ''
    if (/invalid_output|不匹配/.test(prov)) return false          // 形状错导致的空：不算合法
    const keys = Object.keys(o).filter(k => k !== 'provenance')
    const allEmpty = keys.length > 0 && keys.every(k => {
      const v = o[k]
      if (Array.isArray(v)) return v.length === 0
      return false
    })
    // provenance 必须明确写了 0 计数（如 strong=0 / weak=0 / asymmetric=0）
    return allEmpty && /[=:\s]0(?![0-9])/.test(prov)
  })()

  /* 记录类操作：写入确认返回 {key} 之类，本身无计算数值 */
  const isRecordLike = (() => {
    const o = r && r.output
    if (!o || typeof o !== 'object') return false
    return !!(o.key || o.stored || o.recorded || o.reference)
  })()

  /* 聚类类：合法输出是「簇标签的分组」，标签是字符串，本身无计算数值。
     判据：clusters 是非空数组且每个元素是非空数组。 */
  const isClusterLike = (() => {
    const o = r && r.output
    if (!o || typeof o !== 'object') return false
    const c = o.clusters || o.assignments || o.groups
    if (!Array.isArray(c) || c.length === 0) return false
    return c.every(x => Array.isArray(x) ? x.length > 0 : true)
  })()

  const ok = okSuccess && (hasNum || isEmptyLegit || isRecordLike || isClusterLike)
  const why = hasNum ? '有数值' : isEmptyLegit ? '合法空结果' : isRecordLike ? '记录确认' : isClusterLike ? '聚类分组' : '无实质'
  rows.push({ nm, ok, okSuccess, hasNum, err: String(errText).slice(0, 70), callArgs })
  const flag = ok ? '✓' : '✗'
  console.log(`  ${flag} ${nm.padEnd(28)} success=${okSuccess} ${why}${errText ? '  ' + String(errText).slice(0, 50) : ''}`)
}
srv.kill()

const bad = rows.filter(r => !r.ok)
console.log('\n' + '-'.repeat(96))
console.log(`按 schema 传参可跑通：${rows.length - bad.length} / ${rows.length}`)
if (bad.length) {
  console.log('\n不可用清单（照 schema 传参无法得到有效结果）：')
  for (const b of bad) {
    console.log(`  ${b.nm}`)
    console.log(`      传入: ${JSON.stringify(b.callArgs).slice(0, 110)}`)
    console.log(`      错误: ${b.err || '(无错误信息，但无有效数值)'}`)
  }
}

// ── 有牙自检：故意传形状错的数据，必须**不**被宽容放过 ──────────
// 纪律：接受「合法空结果」不能变成接受「任何结果」。用形状错的输入验证这条线还在。
console.log('\n' + '-'.repeat(96))
console.log('有牙自检（形状错的输入必须被判失败，不能被宽容放过）')
{
  const srv2 = await runServer(A + '/index.js')
  const BAD = [
    { tool: 'build_coupling_matrix', args: { entities: [{ id: 'a' }, { id: 'b' }], relations: 'not-an-array' } },
    { tool: 'semantic_similarity', args: { a: [1, 2], b: [3, 4] } },        // 传数组给要字符串的算法
    { tool: 'simplified_svd', args: { matrix: { wrong: 'shape' } } },        // 传对象给要数组的算法
  ]
  let caught = 0
  for (const b of BAD) {
    let r
    try { r = await srv2.call(b.tool, b.args) } catch (e) { r = { error: e.message } }
    const o = r && r.output
    const prov = (o && Array.isArray(o.provenance)) ? o.provenance.join(' ') : ''
    const isErr = !(r && r.success === true) || /invalid_output|不匹配/.test(prov) || !!(r && r.error)
    const legitEmpty = (() => {
      if (!o || typeof o !== 'object') return false
      const keys = Object.keys(o).filter(k => k !== 'provenance')
      const allEmpty = keys.length > 0 && keys.every(k => Array.isArray(o[k]) && o[k].length === 0)
      return allEmpty && /[=:\s]0(?![0-9])/.test(prov)
    })()
    const rejected = isErr && !legitEmpty
    if (rejected) caught++
    console.log(`    ${rejected ? '✓' : '✗'} ${b.tool.padEnd(24)} 形状错输入 → ${rejected ? '已拒绝' : '漏过！'}`)
  }
  srv2.kill()
  console.log(`  有牙自检：${caught} / ${BAD.length} 个形状错输入被拒`)
  if (caught !== BAD.length) { console.log('总判定：FAIL（判据被放宽到漏过形状错输入）'); process.exit(1) }
}

console.log(bad.length === 0 ? '\n总判定：PASS' : `\n总判定：FAIL（${bad.length} 个工具照 schema 传参不可用）`)
process.exit(bad.length === 0 ? 0 : 1)
