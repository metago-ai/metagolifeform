// verify_variation.mjs — R142 补丁 · 「变化性」断言
//
// ════ 为什么需要这一层（第五轮复检点出的盲区）════
// 我原有的检查：
//   · 契约层 K-S1~S5    → 类型/必填/example 自洽
//   · audit_by_examples → 按 examples 调用「能跑通」
//   · 语义断言          → 输出符合我写的数值断言
// 缺的一层：**按 examples 调用后，结果是否有意义**。
//
// time_decay_cooccurrence 就是从这个缝里漏过去的：
//   schema 类型全对、必填全有、example 自洽、调用 success:true
//   但结果 score=0（因为缺 item1/item2，匹配不到任何共现）
//
// ════ 本断言的判据（不依赖我写期望值，只依赖「输入变了输出得变」）════
// 对每个工具构造两组**语义上不同**的输入 A 和 B：
//   · 若工具是计算/统计/聚类类 → A 与 B 的输出必须不同
//   · 若两组不同输入的输出**完全相同** → 说明工具没真的在算那个东西（空转）
//
// 为什么这个判据可靠：它不依赖我知道正确答案是什么，只依赖「这个工具确实在使用它的输入」。
// 一个总是返回同一个值的工具，不管 schema 多正确，都是假的。
//
// ════ 局限（如实说明）════
// 它只能抓「完全不响应输入」的空转，抓不到「响应了但算错」。
// 后者靠 mcp-tools-semantic.cjs 的数值断言。
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const TR = createRequire(A + '/') (A + '/tool-registry.js')
const L3 = Object.keys(TR.L3_ID_MAP || {}).sort()

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
      await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'var', version: '1' } })
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

// 只取核心数值（去掉 provenance / durationMs），用于比较「算出来的东西」
function coreNums(o, depth = 0) {
  if (depth > 4) return null
  if (typeof o === 'number') return Number(o.toFixed(6))
  if (typeof o === 'boolean') return o
  if (typeof o === 'string') return o
  if (Array.isArray(o)) return o.map(x => coreNums(x, depth + 1))
  if (o && typeof o === 'object') {
    const out = {}
    for (const k of Object.keys(o).sort()) {
      if (k === 'provenance' || k === 'durationMs' || k === 'algorithmId' || k === 'algorithmFamily') continue
      out[k] = coreNums(o[k], depth + 1)
    }
    return out
  }
  return o
}

// 构造两组语义不同的输入：基于 schema 的 examples 变形
let __CUR_SEED = 0
function makeVariant(schema, seed = 0) {
  __CUR_SEED = seed
  return makePair(schema)
}
function makePair(schema) {
  const SEED = __CUR_SEED
  const a = schema.arguments || schema.inputSchema || {}
  const props = a.properties || {}
  const ex = (a.examples && a.examples[0]) ? JSON.parse(JSON.stringify(a.examples[0])) : null
  if (!ex) return null

  /* 变形原则（第一次实现时踩过的坑）：
     × 等比变换（v*0.5+c）保持向量方向 → cosine/spearman/pearson 变形后仍得 1 → 误报空转
     √ 质数打散：完全改变数值关系，且是确定性的（同输入同输出，不影响复现）
     √ 成对字段（a/b、x/y、forward/backward）**只打散后一个**，保证两组语义真的不同 */
  const PRIME = (x, i) => {
    const n = Number(x)
    if (!isFinite(n)) return x
    // seed 参与运算：不同组变形得到不同的打散结果
    const r = ((Math.abs(Math.round(n * 1000)) * 7919 + (i + 1) * 104729 + (SEED + 1) * 15485863) % 997) / 97
    return Number(r.toFixed(4))
  }
  /* 第二版：所有字符串都加后缀（第一版只给 PAIR_KEYS 加，导致 items 里的 'a'/'b' 不变，
     而 cooccurrence_frequency 正是从 items 推导 item1/item2 的） */
  const B = JSON.parse(JSON.stringify(ex))

  for (const [k, v] of Object.entries(B)) {
    const isPairSecond = true   // 第二版：所有字符串都变形
    if (Array.isArray(v)) {
      if (v.length && Array.isArray(v[0])) {
        B[k] = v.map((row, ri) => Array.isArray(row)
          ? row.map((cell, ci) => typeof cell === 'number' ? PRIME(cell, ri * 10 + ci)
            : (typeof cell === 'string' && isPairSecond ? cell + '_V' + SEED : cell))
          : row)
      } else {
        B[k] = v.map((cell, i) => typeof cell === 'number' ? PRIME(cell, i)
          : (typeof cell === 'string' && isPairSecond ? cell + '_V' + SEED : cell))
      }
    } else if (typeof v === 'number') {
      B[k] = PRIME(v, 3)
    } else if (typeof v === 'string') {
      B[k] = isPairSecond ? v + '_V' + SEED : v
    } else if (v && typeof v === 'object') {
      const o2 = {}
      let idx = 0
      for (const [kk, vv] of Object.entries(v)) {
        o2[kk] = typeof vv === 'number' ? PRIME(vv, idx++) : vv
      }
      B[k] = o2
    }
  }
  return { A: ex, B }
}

console.log('='.repeat(96))
console.log('R142 补丁 · 变化性断言（两组不同输入 → 输出必须不同）')
console.log('='.repeat(96))

const srv = await runServer(A + '/index.js')
if (srv.error) { console.log('✗ 服务器启动失败:', srv.error); process.exit(1) }

const results = []
for (const nm of L3) {
  let schema = null
  try { schema = JSON.parse(readFileSync(`${A}/tools/${nm}.json`, 'utf8')) } catch (e) { continue }
  const pair = makePair(schema)
  if (!pair) { results.push({ nm, status: 'SKIP', why: '无 examples' }); continue }

  const ra = await srv.call(nm, pair.A)
  const okA = ra && ra.success === true
  if (!okA) { results.push({ nm, status: 'SKIP', why: 'A 组调用失败' }); continue }

  const ca = JSON.stringify(coreNums(ra.output !== undefined ? ra.output : ra))

  /* 结构性变形（补充数值变形）：
     有些工具的输出是「比值」（如 cooccurrenceFrequency 的 score = both/either），
     只改数值不改变比值 → 误报空转。必须改**结构**（如把每条序列截断一半）才能改变比值。 */
  {
    const a2 = schema.arguments || schema.inputSchema || {}
    const ex2 = (a2.examples && a2.examples[0]) ? JSON.parse(JSON.stringify(a2.examples[0])) : null
    if (ex2) {
      let structural = false
      for (const [k, v] of Object.entries(ex2)) {
        if (!Array.isArray(v) || !v.length) continue
        if (Array.isArray(v[0])) {
          // 二维：每条子数组截断成前半（保持非空）
          ex2[k] = v.map(row => Array.isArray(row) ? row.slice(0, Math.max(1, Math.ceil(row.length / 2))) : row)
          structural = true
        } else {
          // 一维：只保留前一半
          ex2[k] = v.slice(0, Math.max(1, Math.ceil(v.length / 2)))
          structural = true
        }
      }
      if (structural) {
        const rs = await srv.call(nm, ex2)
        if (rs && rs.success === true) {
          const cs = JSON.stringify(coreNums(rs.output !== undefined ? rs.output : rs))
          if (ca !== cs) {
            results.push({ nm, status: 'PASS', why: '(结构性变形改变了输出)' })
            continue
          }
        }
      }
    }
  }

  /* 多组变形：单一变形可能碰巧保持输出（如 Kendall 序恰好不变），
     所以生成 4 组，只要有一组输出不同，就证明工具确实响应输入。 */
  let anyDifferent = false
  const variants = []
  for (let vi = 0; vi < 4 && !anyDifferent; vi++) {
    const vb = makeVariant(schema, vi)
    if (!vb) break
    variants.push(vb)
    const rb = await srv.call(nm, vb.B)   // 传 B 组参数（之前误传整个 {A,B} 对象）
    if (!(rb && rb.success === true)) continue
    const cb = JSON.stringify(coreNums(rb.output !== undefined ? rb.output : rb))
    if (ca !== cb) anyDifferent = true
  }

  if (anyDifferent) {
    results.push({ nm, status: 'PASS', why: `(${variants.length} 组变形中至少 1 组结果不同)` })
    continue
  }

  /* 输出相同 → 分两级判：
     V-1（强）：输出主值是标量数值 → 输入变了输出不变，判空转
     V-2（弱）：输出是结构/排序/标签 → 只记录，不判 FAIL（这类工具的输出不必然随输入改形状） */
  const co = ra.output !== undefined ? ra.output : ra
  const scalarKeys = ['score', 'similarity', 'distance', 'correlation', 'coefficient', 'value',
    'normalized', 'result', 'ratio', 'index', 'variance', 'singularValue', 'entropy', 'negentropy']
  const hasScalar = scalarKeys.some(k => typeof (co || {})[k] === 'number')
  if (hasScalar) {
    results.push({ nm, status: 'FAIL', why: '标量输出不随输入变化（空转）', sample: ca.slice(0, 90) })
  } else {
    results.push({ nm, status: 'WEAK', why: '结构型输出未变化（不判 FAIL，如实记录）', sample: ca.slice(0, 90) })
  }
}
srv.kill()

const fail = results.filter(r => r.status === 'FAIL')
const skip = results.filter(r => r.status === 'SKIP')
const pass = results.filter(r => r.status === 'PASS')
const weak = results.filter(r => r.status === 'WEAK')

console.log(`\n通过 ${pass.length} ｜ 空转(V-1) ${fail.length} ｜ 结构未变(V-2) ${weak.length} ｜ 跳过 ${skip.length} ｜ 合计 ${results.length}`)
if (weak.length) {
  console.log('\n结构型输出未变化（V-2，不判 FAIL，如实记录）：')
  for (const w of weak) console.log(`  ⊘ ${w.nm}：${w.sample}`)
}
if (fail.length) {
  console.log('\n空转的工具（输入变了输出不变 → 没真的在算）：')
  for (const f of fail) {
    console.log(`  ✗ ${f.nm}`)
    console.log(`      ${f.why}`)
    console.log(`      固定输出：${f.sample}`)
  }
}
if (skip.length) {
  console.log('\n跳过：')
  for (const s of skip) console.log(`  ⊘ ${s.nm}：${s.why}`)
}

console.log('\n' + '-'.repeat(96))
const allOk = fail.length === 0
console.log(allOk
  ? `总判定：PASS（变化性 ${pass.length}/${results.length}，无空转）`
  : `总判定：FAIL（${fail.length} 个工具空转）`)
process.exit(allOk ? 0 : 1)
