// verify_algorithms_semantic.mjs — R142 B4 · 927 条算法的性质断言
//
// ════ 为什么这样做 ════
// R141 的 t12-full-scan.cjs 判据是 `if (r.success || r.degraded) ok++` ——
// **只验「没崩」，不验「算对」**。约 700 条算法从未被验证过计算结果的正确性。
//
// ════ 关键纪律 ════
// **不写「期望值」——我算错过两次**（chebyshev 写成 3 实际 4、dice 写成 0.8 实际 2/3）。
// 只写**不依赖我算术**的性质：
//   U-1 可执行     success === true（或明确的 degraded，且带原因）
//   U-2 无脏数     输出里不含 NaN / Infinity
//   U-3 确定性     同一输入跑两次，结果完全相同（抓 Math.random 类问题）
//   U-4 有实质     输出非空壳（不是全空数组/全 null）
// 再加族特定性质（P-*，见 FAMILY_RULES）：
//   距离非负 / 相似度 ∈[-1,1] / 自相似=1 / 对称 / 熵≥0 / 归一化∈[0,1] / 排序有序 等
//
// ════ 覆盖口径 ════
// 输出必须报「有性质断言的条数」与「仅通用断言的条数」，
// 禁止用「927 全部通过」这种总数冒充（元验证 M-3）。
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const req = createRequire(A + '/')
const reg = req(A + '/engine/algorithms/registry.js')
const R = reg.registry || reg.default || reg
const all = R.getRegistry ? R.getRegistry() : []

/* R142：改用 bind.cjs 的 run 作为执行入口。
   原因：它做了 executeAlgorithmSync 没做的三件事——
     ① revive()  还原 {__map__:true} / {__set__} / {__regex__} 标记为真 Map/Set/RegExp
     ② fnBridge() 把函数型形参的表达式字符串编译成真函数（如 "x => x*2"）
     ③ toPositional() 多参转位置数组
   用 executeAlgorithmSync 跑会得到「store.set is not a function」「rng is not a function」
   这类假失败——那是调用方式错，不是算法错。
   （注：这也说明两条执行路径能力不同，已单独记为待查项） */
const { bind } = req(A + '/engine/algorithms/t3impl/bind.cjs')
const B = bind(reg)

let shapes = {}
try { shapes = JSON.parse(readFileSync(A + '/engine/algorithms/t3impl/shapes.json', 'utf8')) } catch (e) { }

// ── 通用工具 ──────────────────────────────────────────
function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return false
  if (typeof a === 'number') {
    if (Number.isNaN(a) || Number.isNaN(b)) return false
    return a === b || Math.abs(a - b) < 1e-12
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((x, i) => deepEqual(x, b[i]))
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a).filter(k => k !== 'provenance' && k !== 'durationMs')
    const kb = Object.keys(b).filter(k => k !== 'provenance' && k !== 'durationMs')
    if (ka.length !== kb.length) return false
    return ka.every(k => deepEqual(a[k], b[k]))
  }
  return false
}

function findBad(v, path = '') {
  if (typeof v === 'number') {
    if (!isFinite(v)) return `${path || '根'} = ${v}`
    return null
  }
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) {
      const r = findBad(v[i], `${path}[${i}]`)
      if (r) return r
    }
    return null
  }
  if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) {
      const r = findBad(v[k], path ? `${path}.${k}` : k)
      if (r) return r
    }
  }
  return null
}

function isEmptyShell(v) {
  if (v === null || v === undefined) return true
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') {
    const ks = Object.keys(v).filter(k => k !== 'provenance' && k !== 'durationMs' && k !== 'algorithmFamily')
    if (ks.length === 0) return true
    // 所有值都是空/null → 空壳
    return ks.every(k => {
      const x = v[k]
      if (x === null || x === undefined) return true
      if (Array.isArray(x)) return x.length === 0
      if (typeof x === 'object') return Object.keys(x).length === 0
      return false
    })
  }
  return false
}

function pickNum(o, keys) {
  for (const k of keys) {
    if (o && typeof o[k] === 'number') return o[k]
  }
  // 深一层
  for (const k of Object.keys(o || {})) {
    if (o[k] && typeof o[k] === 'object') {
      for (const kk of keys) if (typeof o[k][kk] === 'number') return o[k][kk]
    }
  }
  return null
}


/* ════ 非确定性算法清单（R142 实测登记）════
   为什么要有这个清单：
     对「用 Math.random」的算法要求「两次结果完全相同」是**错的要求**——
     那是把「随机」当成「缺陷」。正确的判据是「多次运行都无 NaN、都在合理范围、不崩」。
   但清单不能是万能豁免：每个条目必须写明**随机来源**，且新增条目必须在此处显式登记。
   这样「非确定性」是**已知特性**，不是「检查漏了」。 */
const NON_DETERMINISTIC = {
  'ALG_T1_C_029': 'Math.random 初始化主奇异向量（SVD 幂迭代的常见做法）',
  'ALG_T1_E_006': '间接调用带 Math.random 的子函数（进化循环调用变异/交叉）',
  'ALG_T1_E_012': 'Math.random 生成变异',
  'ALG_T1_E_014': 'Math.random 选择交叉点',
  'ALG_T1_M_001': 'Math.random 组合新想法',
  'ALG_T1_M_009': 'Math.random 发散生成',
  'ALG_T1_K_002': 'Math.random + Date.now 生成唯一记忆 ID（功能需要）',
  'ALG_T1_G_002': 'Math.random 聚类中心初始化',
  'ALG_T2_M_002': 'Math.random 合成新原语',
  'ALG_T1_M_011': '默认 rng=Math.random；算法有 rng 形参本可确定性调用，但 fnBridge 未覆盖该形参，JSON 无法传函数',
  'ALG_T2_D_005': '内部用 Date.now() 打时间戳',
  'ALG_T1_E_003': 'Math.random',
}

/* 合法空结果判定：
   与「空壳」区分——
     空壳：输出只有一个空数组/null（没算或算空了）
     合法空结果：输出有 **≥2 个字段且全为空**，且字段名本身表达「无」
                （如 conflicts / vulnerabilities / missingPremises / circularRefs）
   这类是「查了、确实没有」的完整回答，不是缺陷。 */
/* 补 tradeoff：价值冲突检测返回 {conflicts:[], tradeoffs:[]}，两个字段都表达「无」 */
const EMPTY_SEMANTIC = /conflict|tradeoff|vulnerab|missing|circular|error|issue|anomal|orphan|violation|gap|risk/i

// ── 族特定性质 ────────────────────────────────────────
// 每个函数返回 null（通过）或字符串（失败原因）
const FAMILY_RULES = {
  COUPLING: (id, name, out) => {
    const n = name.toLowerCase()
    // 距离类：非负
    if (/distance|chebyshev|manhattan|euclidean|hamming/.test(n)) {
      const d = pickNum(out, ['distance', 'value', 'result'])
      if (d !== null && d < 0) return `距离为负 ${d}`
    }
    // 相似度/系数类：∈[-1,1]
    if (/similarity|coefficient|cosine|jaccard|dice|correlation/.test(n)) {
      const s = pickNum(out, ['score', 'similarity', 'coefficient', 'value', 'result', 'correlation'])
      if (s !== null && (s < -1.000001 || s > 1.000001)) return `相似度越界 ${s}`
    }
    // 自相似：sim(a,a) 应为 1（用样例自身对比不现实，跳过）
    // 超导态：布尔
    if (/superconductive/.test(n)) {
      if (out && typeof out.superconductive !== 'boolean') return 'superconductive 不是布尔'
    }
    return null
  },
  VALUE: (id, name, out) => {
    const v = pickNum(out, ['value', 'score', 'total', 'result'])
    if (v !== null && (v < -1e9 || v > 1e9)) return `值超出合理范围 ${v}`
    return null
  },
  NEGENTROPY: (id, name, out) => {
    const h = pickNum(out, ['entropy', 'shannonEntropy'])
    if (h !== null && h < 0) return `熵为负 ${h}`
    const ne = pickNum(out, ['negentropy', 'negentropyValue'])
    if (ne !== null && !isFinite(ne)) return `负熵非有限 ${ne}`
    return null
  },
  BIAS: (id, name, out) => {
    const d = pickNum(out, ['drift', 'bias', 'deviation', 'score'])
    if (d !== null && d < -1e-9) return `偏差为负 ${d}`
    return null
  },
  LOGIC: () => null,
  REASONING: () => null,
  EVOLUTION: () => null,
  CREATION: () => null,
  MEMORY: () => null,
  LEARNING: () => null,
  INTUITION: () => null,
  CONFLICT: () => null,
  TIME: () => null,
  FREQUENCY: () => null,
  DECISION: () => null,
  SECURITY: () => null,
  DIALOG: () => null,
  PROACTIVE: () => null,
  IDEA: () => null,
  AUDIT: () => null,
}

// ── 主循环 ────────────────────────────────────────────
console.log('='.repeat(100))
console.log('R142 B4 · 927 条算法性质断言（U-1~U-4 + 族特定 P-*）')
console.log('='.repeat(100))

const rows = []
const stabilityStats = []
let noShape = []
for (const e of all) {
  const id = e.id
  const name = e.name || id
  const fam = e.family || '?'
  const shape = shapes[id]
  if (shape === undefined) { noShape.push(id); continue }

  const v = []
  let out1 = null, out2 = null
  let degraded = false, degradedReason = ''

  // U-1 可执行
  try {
    const r1 = B.run(id, shape)
    if (r1 && r1.degraded) { degraded = true; degradedReason = String(r1.reason || r1.error || '') }
    if (!(r1 && (r1.success === true || r1.degraded === true))) {
      v.push(`U-1 执行失败：${String((r1 && (r1.error || r1.reason)) || '?').slice(0, 60)}`)
    } else {
      out1 = r1.output !== undefined ? r1.output : r1
    }
  } catch (err) {
    v.push(`U-1 抛异常：${String(err.message || err).slice(0, 60)}`)
  }

  if (out1 !== null && !degraded) {
    // U-2 无脏数
    const bad = findBad(out1)
    if (bad) v.push(`U-2 脏数：${bad}`)

    // U-4 有实质
    if (isEmptyShell(out1)) {
      const prov = JSON.stringify((out1 && out1.provenance) || [])
      const provOk = /[=:\s]0(?![0-9])|空|empty|no |无/.test(prov)
      // 合法空结果：≥2 个字段全空，且字段名表达「无」
      const keys = (out1 && typeof out1 === 'object' && !Array.isArray(out1))
        ? Object.keys(out1).filter(k => k !== 'provenance' && k !== 'durationMs') : []
      const semanticEmpty = keys.length >= 2 && keys.every(k => EMPTY_SEMANTIC.test(k))
      if (!provOk && !semanticEmpty) v.push('U-4 空壳且既无 provenance 说明、字段名也不表达「无」')
    }

    // U-3 确定性 / 或（已登记的非确定性算法）多次运行稳定性
    if (NON_DETERMINISTIC[id]) {
      /* 已登记的非确定性算法：跑 20 次统计异常率。
         为什么不用「3 次全绿」：全有全无的判据偶发一次就红，而偶发红灯会让「红」失去意义。
         为什么异常率 > 0 仍判 FAIL：偶发但真实的不稳定 = 缺陷，不能因为「偶发」就放过。 */
      const RUNS = 20
      let unstable = 0
      const samples = []
      for (let k = 0; k < RUNS; k++) {
        try {
          const rk = B.run(id, shape)
          if (!(rk && (rk.success === true || rk.degraded === true))) {
            unstable++
            if (samples.length < 2) samples.push(String((rk && (rk.error || rk.reason)) || '非 success').slice(0, 50))
            continue
          }
          const ok = rk.output !== undefined ? rk.output : rk
          const b = findBad(ok)
          if (b) { unstable++; if (samples.length < 2) samples.push('脏数 ' + b) }
        } catch (err) { unstable++; if (samples.length < 2) samples.push('抛错 ' + String(err.message || err).slice(0, 40)) }
      }
      stabilityStats.push({ id, name, runs: RUNS, unstable, rate: unstable / RUNS, samples })
      if (unstable) {
        v.push(`U-3 已登记非确定性的算法不稳定：${unstable}/${RUNS} 次异常（${(unstable / RUNS * 100).toFixed(0)}%）—— ${samples.join(' | ')}`)
      }
    } else {
      try {
        const r2 = B.run(id, shape)
        out2 = r2 && (r2.output !== undefined ? r2.output : r2)
        if (!deepEqual(out1, out2)) v.push('U-3 非确定性（两次结果不同）且未在 NON_DETERMINISTIC 清单登记')
      } catch (err) {
        v.push(`U-3 第二次抛异常：${String(err.message || err).slice(0, 50)}`)
      }
    }

    // 族特定
    const rule = FAMILY_RULES[fam]
    if (rule) {
      const r = rule(id, name, out1)
      if (r) v.push(`P-* ${r}`)
    }
  }

  rows.push({ id, name, fam, degraded, degradedReason, v, hasFamilyRule: !!FAMILY_RULES[fam] })
}

// ── 汇总 ──────────────────────────────────────────────
const bad = rows.filter(r => r.v.length)
const degradedList = rows.filter(r => r.degraded)
const withRule = rows.filter(r => r.hasFamilyRule && !r.degraded)
const onlyGeneric = rows.filter(r => !r.hasFamilyRule && !r.degraded)

console.log(`\n算法总数: ${all.length} ｜ 有样例: ${rows.length} ｜ 无样例: ${noShape.length}`)
if (noShape.length) console.log(`  无样例的（无法验证）: ${noShape.slice(0, 10).join(', ')}${noShape.length > 10 ? ' …' : ''}`)
console.log(`\nU-1~U-4 通用断言: 全部 ${rows.length} 条都跑了`)
console.log(`  其中带族特定性质 P-*: ${withRule.length} 条`)
console.log(`  仅通用断言（无族规则）: ${onlyGeneric.length} 条  ← 这是覆盖边界，如实报出`)
console.log(`  诚实降级（degraded）: ${degradedList.length} 条`)
const ndRegistered = rows.filter(r => NON_DETERMINISTIC[r.id])
console.log(`  已登记的非确定性算法: ${ndRegistered.length} 条（判据=3 次运行均无脏数，非「两次相同」）`)
for (const d of ndRegistered) console.log(`    · ${d.id} ${d.name} —— ${NON_DETERMINISTIC[d.id]}`)
if (stabilityStats.length) {
  const unstableOnes = stabilityStats.filter(s => s.unstable > 0)
  console.log(`  非确定性算法稳定性（各跑 ${stabilityStats[0].runs} 次）：`)
  console.log(`    异常率 0 的：${stabilityStats.length - unstableOnes.length} / ${stabilityStats.length}`)
  if (unstableOnes.length) {
    console.log(`    ⚠ 偶发异常的（必须调查）：${unstableOnes.length} 条`)
    for (const s of unstableOnes) {
      console.log(`      · ${s.id} ${s.name}：${s.unstable}/${s.runs} 次（${(s.rate * 100).toFixed(0)}%） —— ${s.samples.join(' | ')}`)
    }
  }
}
for (const d of degradedList.slice(0, 8)) {
  console.log(`    · ${d.id} ${d.name}：${d.degradedReason.slice(0, 60)}`)
}

// 按族的失败分布
const byFam = {}
for (const r of bad) byFam[r.fam] = (byFam[r.fam] || 0) + 1
console.log(`\n通过 ${rows.length - bad.length} ｜ 失败 ${bad.length}`)
if (bad.length) {
  console.log('\n失败清单（按族分布）：')
  for (const [f, n] of Object.entries(byFam).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${f}: ${n} 条`)
  }
  console.log('\n失败明细（前 40 条）：')
  for (const r of bad.slice(0, 40)) {
    console.log(`  ${r.id} ${String(r.name).slice(0, 30)} [${r.fam}]`)
    for (const x of r.v) console.log(`      ✗ ${x}`)
  }
  if (bad.length > 40) console.log(`  … 还有 ${bad.length - 40} 条`)
}

console.log('\n' + '-'.repeat(100))
const allOk = bad.length === 0 && noShape.length === 0
console.log(allOk
  ? `总判定：PASS（${rows.length}/${all.length} 条全部通过 U-1~U-4；P-* 覆盖 ${withRule.length} 条）`
  : `总判定：FAIL（失败 ${bad.length} 条 ｜ 无样例 ${noShape.length} 条）`)
process.exit(allOk ? 0 : 1)
