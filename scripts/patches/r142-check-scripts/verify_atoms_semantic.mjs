// verify_atoms_semantic.mjs — R142 B5 · 597 条原子的值断言 + 确定性
//
// ════ 现状缺口 ════
// 526 条工厂生成的原子只验「有输出」，没有值断言；52 条蓝本原子有 L-1/L-2/L-3 但缺确定性；
// 11 条第二批有语义抽查但缺性质断言；5 条哲学族有违背/合规样本但缺边界。
//
// ════ 断言（按原子类别区分，不做一刀切）════
//   A-1 可调用     make(id) 返回函数（或诚实返回 null 且已登记）
//   A-2 有实质     输出非空壳（合法空结果须 provenance 说明）
//   A-3 无脏数     输出不含 NaN / Infinity
//   A-4 确定性     同一输入两次结果一致（**有随机来源的原子须登记**）
//   A-5 已实现率   报告「可调用 / 诚实不支持」，不用总数冒充
import { createRequire } from 'node:module'

const NPM = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine/atoms'
const req = createRequire(NPM + '/../')
const F = req(NPM + '/atom-factory.cjs')
const CV = req(NPM + '/contract-validator.cjs')

const CONTRACTS = CV.CONTRACTS || {}

/* 官方样例源：engine.cjs 的 SAMPLES（50 条，对应 50 个 COMPUTE 原子）。
   这 50 条的输入是**官方定义**的；其余 547 条契约没有输入规格，只能按原子名推断。
   报告里必须区分这两类，不能混为一谈。 */
let OFFICIAL_SAMPLES = {}
try { OFFICIAL_SAMPLES = req(NPM + '/engine.cjs').SAMPLES || {} } catch (e) { }

// 诚实标注为不支持的（3 条，需硬件/训练模型）
const EXTERNAL = new Set([...((F.EXTERNAL_NEEDED) || [])])
const MODEL = new Set([...((F.MODEL_NEEDED) || [])])

/* 已知的合法空结果：某些原子的契约语义就是「没有就说没有」，
   这类返回空数组是正确行为，不是空壳。判据要求 provenance 或字段名表达「无」。 */
const EMPTY_SEMANTIC = /conflict|tradeoff|vulnerab|missing|circular|error|issue|anomal|orphan|violation|gap|risk|empty|none|无|空/i

/* 已知有随机来源的原子（R141 第二批实现里 emotionRecog 用词典是确定的；
   若有新增随机来源必须在此登记，否则 A-4 会红）。本清单目前为空——
   597 条原子实现里没有用 Math.random 的（工厂 GEN 用确定性哈希）。
   若将来新增，必须写明原因。 */
const NON_DETERMINISTIC = {
  // 'ATOM_XXX': '原因',
}

function findBad(v, path = '') {
  if (typeof v === 'number') return isFinite(v) ? null : `${path || '根'} = ${v}`
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

function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return false
  if (typeof a === 'number') return a === b || Math.abs(a - b) < 1e-12
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((x, i) => deepEqual(x, b[i]))
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a).filter(k => k !== 'provenance')
    const kb = Object.keys(b).filter(k => k !== 'provenance')
    if (ka.length !== kb.length) return false
    return ka.every(k => deepEqual(a[k], b[k]))
  }
  return false
}

function isEmptyShell(v) {
  if (v === null || v === undefined) return true
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') {
    const ks = Object.keys(v).filter(k => k !== 'provenance' && k !== 'method' && k !== 'note')
    if (!ks.length) return true
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

// 按原子类别造一个「能触发真实计算」的输入
function makeInput(id, contract) {
  // ① 官方样例优先
  if (OFFICIAL_SAMPLES[id] !== undefined) return OFFICIAL_SAMPLES[id]
  const s = (id || '').toUpperCase()
  // ② 按原子名推断（实测过的形状）
  if (/POLICY_COMPARE/.test(s)) {
    return { policies: ['本政策补贴五十万元，申报期三个月，覆盖两千家企业。',
                        '本政策补贴三十万元，申报期两个月，覆盖一千五百家企业。'] }
  }
  if (/POLICY_FORECAST|TECH_TREND/.test(s)) {
    return { 历史数据: [1, 2, 3, 4, 5], 经济数据: [2, 4, 5.8, 8.1, 10] }
  }
  // 文本类
  if (/NEWS_SUMMARY|POLICY_TRANSLATE|TECH_DEMYSTIFY|NON_TECH|FRICTION|TAO_DAILY/.test(s)) {
    return { text: '本市发布新政。补贴最高五十万元。申报期三个月。预计覆盖两千家企业。' }
  }
  if (/EMOTION_RECOG/.test(s)) return { text: '这个功能非常好用，我很满意' }
  if (/PEOPLE_CAPTURE/.test(s)) return { text: '记录一个想法：提升流程效率' }
  if (/IDEA_WITNESS/.test(s)) return { events: [{ time: 1, event: '起步' }, { time: 5, event: '转折' }, { time: 9, event: '成型' }] }
  if (/NEGENTROPY/.test(s)) return { values: [0.9, 0.1, 0.1, 0.9] }
  if (/BIO/.test(s)) return { rr: [800, 810, 795, 820, 805, 815, 800, 812] }
  // 契约有 input 描述时按契约猜
  const inp = contract && contract.input
  if (inp && typeof inp === 'object') {
    const first = Object.keys(inp)[0]
    if (first && /text|content|input|raw/i.test(first)) return { [first]: '测试内容，用于验证原子能真实计算。' }
    if (first && /num|value|score|rate/i.test(first)) return { [first]: 0.7 }
    if (first) return { [first]: 'x' }
  }
  return { text: '测试内容，用于验证原子能真实计算。' }
}

console.log('='.repeat(96))
console.log('R142 B5 · 597 条原子值断言（A-1~A-5）')
console.log('='.repeat(96))

const ids = Object.keys(CONTRACTS).sort()
const rows = []
let nullCount = 0, callable = 0

for (const id of ids) {
  const contract = CONTRACTS[id]
  const v = []
  let fn = null
  try { fn = F.make(id) } catch (e) { v.push('A-1 make 抛异常：' + String(e.message || e).slice(0, 50)) }

  if (!fn) {
    nullCount++
    const isHonestNull = EXTERNAL.has(id) || MODEL.has(id)
    if (!isHonestNull && !(F.CONSTRAINT_IDS && F.CONSTRAINT_IDS.has && F.CONSTRAINT_IDS.has(id))) {
      v.push('A-1 无实现且未在 EXTERNAL_NEEDED / MODEL_NEEDED / CONSTRAINT 登记')
    }
    rows.push({ id, kind: isHonestNull ? 'honest-null' : 'null', v })
    continue
  }
  callable++

  const input = makeInput(id, contract)
  let o1 = null, o2 = null
  try {
    o1 = fn(input)
  } catch (e) {
    v.push('A-1 调用抛异常：' + String(e.message || e).slice(0, 60))
  }

  if (o1 !== undefined && o1 !== null) {
    // A-3 无脏数
    const b = findBad(o1)
    if (b) v.push('A-3 脏数：' + b)

    // A-2 有实质
    if (isEmptyShell(o1)) {
      const prov = JSON.stringify((o1 && o1.provenance) || [])
      const keys = (o1 && typeof o1 === 'object' && !Array.isArray(o1)) ? Object.keys(o1).filter(k => k !== 'provenance') : []
      const semanticEmpty = keys.length >= 2 && keys.every(k => EMPTY_SEMANTIC.test(k))
      const provOk = /[=:\s]0(?![0-9])|空|empty|none|无|缺少|不足/.test(prov)
      if (!semanticEmpty && !provOk) v.push('A-2 空壳且无说明')
    }

    // A-4 确定性
    if (NON_DETERMINISTIC[id]) {
      let unstable = 0
      for (let k = 0; k < 3; k++) {
        try {
          const rk = fn(input)
          const bb = findBad(rk)
          if (bb) unstable++
        } catch (e) { unstable++ }
      }
      if (unstable) v.push(`A-4 已登记非确定性原子仍不稳定（${unstable}/3）`)
    } else {
      try {
        o2 = fn(input)
        if (!deepEqual(o1, o2)) v.push('A-4 非确定性（两次结果不同）且未登记')
      } catch (e) {
        v.push('A-4 第二次抛异常：' + String(e.message || e).slice(0, 50))
      }
    }
  } else {
    v.push('A-2 输出为 undefined/null')
  }

  rows.push({ id, kind: fn.kind || 'factory', v })
}

// ── 汇总 ────────────────────────────────────────────
const bad = rows.filter(r => r.v.length)
const byKind = {}
for (const r of rows) byKind[r.kind] = (byKind[r.kind] || 0) + 1

console.log(`\n契约总数 ${ids.length}`)
console.log(`  可调用: ${callable}`)
console.log(`  诚实不支持（已登记）: ${rows.filter(r => r.kind === 'honest-null').length}`)
console.log(`  按实现来源: ${JSON.stringify(byKind)}`)
const officialCnt = ids.filter(id => OFFICIAL_SAMPLES[id] !== undefined).length
console.log(`\n输入来源（如实分类，不用总数冒充）：`)
console.log(`  官方样例（engine.SAMPLES）: ${officialCnt} 条  ← 输入有官方定义`)
console.log(`  按原子名推断: ${ids.length - officialCnt} 条  ← 输入为推断，可能存在形状偏差`)
console.log(`\n通过 ${rows.length - bad.length} ｜ 失败 ${bad.length}`)

if (bad.length) {
  const byKindBad = {}
  for (const r of bad) byKindBad[r.kind] = (byKindBad[r.kind] || 0) + 1
  console.log('\n失败分布：' + JSON.stringify(byKindBad))
  console.log('\n失败明细（前 40）：')
  for (const r of bad.slice(0, 40)) {
    console.log(`  ${r.id} [${r.kind}]`)
    for (const x of r.v) console.log(`      ✗ ${x}`)
  }
  if (bad.length > 40) console.log(`  … 还有 ${bad.length - 40} 条`)
}

console.log('\n' + '-'.repeat(96))
console.log(bad.length === 0
  ? `总判定：PASS（597 条：可调用 ${callable} / 诚实不支持 ${nullCount}，全部通过 A-1~A-5）`
  : `总判定：FAIL（${bad.length} 条不符）`)
process.exit(bad.length === 0 ? 0 : 1)
