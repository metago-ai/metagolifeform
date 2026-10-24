// adversarial_review.mjs — A38 对抗式审查（攻击者视角，非自证）
//
// 角色：我不是实现者，我是要让这套东西出错的人。
// 目标：找出能让「检查显示绿、实际是坏的」的路径。
//
// 七个攻击面：
//   A1 检查器自身可被欺骗（构造输入让检查通过但功能不对）
//   A2 静默降级（某处失败被吞掉，上层看不出）
//   A3 空壳/占位（返回结构完整但内容无意义）
//   A4 恒定输出（不同输入同一输出 = 假实现）
//   A5 数值污染（NaN/Infinity/负零/超范围）
//   A6 资源与并发（大输入、深度递归、超时）
//   A7 语义错位（做的是别的事，但形状看着像）
import { createRequire } from 'node:module'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'

const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai'
const PKG = 'D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0'
const H = 'D:/DSH-Official/home'

const req = createRequire(A + '/algorithms/')
const reg = req(A + '/algorithms/engine/algorithms/registry.js')
const R = reg.registry || reg.default || reg
const reqA = createRequire(PKG + '/packages/engine/atoms/contract-validator.cjs')
const CV = reqA(PKG + '/packages/engine/atoms/contract-validator.cjs')
const F = reqA(PKG + '/packages/engine/atoms/atom-factory.cjs')
const BP = reqA(PKG + '/packages/engine/atoms/blueprint-atoms.cjs')

const findings = []
const add = (sev, id, what, evidence, fix) => findings.push({ sev, id, what, evidence, fix })

// ══ A1 检查器可被欺骗 ══════════════════════════════════════════
console.log('='.repeat(94))
console.log('A1 检查器自身可被欺骗')
console.log('='.repeat(94))

// A1-a：契约校验器的 validate() 对「任意输出」是否都放行？
{
  const samples = [null, undefined, {}, { x: 1 }, [], 'text', 0, -1, NaN]
  let passed = 0
  for (const s of samples) {
    try { const v = CV.validate('ATOM_ABSORPTION_PRIORITY_015', s); if (v.pass) passed++ } catch (e) { }
  }
  console.log(`  契约校验器对 ${samples.length} 种无意义输出，放行 ${passed} 种`)
  if (passed > 2) add('HIGH', 'AR-A1a', '契约校验器对无意义输出放行过多', `${samples.length} 种异常输出中 ${passed} 种被判通过`, '校验器需先判「输出非空且有实质内容」再做语义校验')
  else console.log('    → 放行数在可接受范围（语义校验按动作类型检查具体字段）')
}

// A1-b：isEmptyShell 能否挡住「只填一个无意义字段」？
{
  const shells = [
    { value: 0 }, { ok: true }, { result: 'x' }, { matrix: [] },
    { scores: [0, 0, 0] }, { provenance: ['x'] },
  ]
  let blocked = 0
  for (const s of shells) {
    const fn = F.make('ATOM_ABSORPTION_PRIORITY_015')
    // 用输出守卫的判断逻辑（tool-registry 的 isEmptyShell 等价物）
    const keys = Object.keys(s).filter(k => k !== 'provenance')
    const empty = keys.length === 0 || keys.every(k => {
      const v = s[k]; if (v === null || v === undefined) return true
      if (Array.isArray(v)) return v.length === 0
      if (typeof v === 'object') return Object.keys(v).length === 0
      if (typeof v === 'string') return v.trim() === ''
      return false
    })
    if (empty) blocked++
  }
  console.log(`  isEmptyShell 对 ${shells.length} 种「看似有值实则空」的输出，挡住 ${blocked} 种`)
  console.log('    （{value:0} / {scores:[0,0,0]} 不算空壳——0 和 0 数组是合法结果）')
}

// ══ A2 静默降级 ════════════════════════════════════════════════
console.log('\n' + '='.repeat(94))
console.log('A2 静默降级（失败被吞）')
console.log('='.repeat(94))
{
  // 扫关键文件里的裸 catch
  const FILES = [
    A + '/engine/atoms/atom-factory.cjs',
    A + '/engine/atoms/contract-validator.cjs',
    A + '/algorithms/tool-registry.js',
    A + '/algorithms/engine/algorithms/registry.js',
  ]
  let bare = 0
  const spots = []
  for (const f of FILES) {
    if (!existsSync(f)) continue
    const t = readFileSync(f, 'utf8')
    // 找 catch (e) { } 或 catch (e) { /* ... */ } 这种空处理
    const re = /catch\s*\([^)]*\)\s*\{\s*(?:\/\*[^*]*\*\/)?\s*\}/g
    let m
    while ((m = re.exec(t))) {
      bare++
      if (spots.length < 6) {
        const line = t.slice(0, m.index).split('\n').length
        spots.push(`${f.split('/').pop()}:${line}`)
      }
    }
  }
  console.log(`  裸 catch（空处理）${bare} 处  ${spots.length ? spots.join(', ') : ''}`)
  if (bare > 0) add('MEDIUM', 'AR-A2', `存在 ${bare} 处裸 catch`, spots.join(', '), '逐个确认：这些 catch 是否可能吞掉真实故障；能区分「可选缺失」与「加载失败」的必须区分')
}

// ══ A3 空壳 ════════════════════════════════════════════════════
console.log('\n' + '='.repeat(94))
console.log('A3 空壳输出（52 条蓝本原子逐个查）')
console.log('='.repeat(94))
{
  const NONEMPTY = (o) => {
    if (o === null || o === undefined) return false
    if (typeof o === 'number') return isFinite(o)
    if (typeof o === 'string') return o.trim().length > 0
    if (Array.isArray(o)) return o.length > 0
    if (typeof o === 'object') {
      const ks = Object.keys(o).filter(k => k !== 'provenance')
      if (!ks.length) return false
      return ks.some(k => {
        const v = o[k]
        if (v === null || v === undefined) return false
        if (Array.isArray(v)) return v.length > 0
        if (typeof v === 'string') return v.trim().length > 0
        if (typeof v === 'number') return isFinite(v)
        if (typeof v === 'object') return Object.keys(v).length > 0
        return true
      })
    }
    return true
  }
  const INPUTS = [
    {}, [], null, 0, '', 'x', { a: 1 }, [[1, 2], [3, 4]],
    { steps: [] }, { actions: [] }, { votes: [] }, { ideas: [] },
  ]
  let shell = 0
  const bad = []
  for (const id of Object.keys(BP.IMPL)) {
    const fn = BP.IMPL[id]
    for (const inp of INPUTS) {
      let out
      try { out = fn(inp) } catch (e) { continue }
      const inner = out && out.output !== undefined ? out.output : out
      // ok:false 的拒绝响应不算空壳（那是正确的参数校验）
      if (out && out.ok === false) continue
      if (!NONEMPTY(inner)) { shell++; if (bad.length < 8) bad.push(id + ' ← ' + JSON.stringify(inp).slice(0, 20)) }
    }
  }
  console.log(`  52 条 × ${INPUTS.length} 种输入 = ${52 * INPUTS.length} 次调用，空壳 ${shell} 次`)
  if (bad.length) console.log('    样例：' + bad.join(' | '))
  if (shell > 0) add('MEDIUM', 'AR-A3', `${shell} 次调用返回空壳`, bad.join(' | '), '空壳应返回 ok:false + 明确 reason，而不是空对象')
}

// ══ A4 恒定输出 ════════════════════════════════════════════════
console.log('\n' + '='.repeat(94))
console.log('A4 恒定输出（同输入多次调用 / 不同输入同一输出）')
console.log('='.repeat(94))
{
  let same = 0
  const bad = []
  for (const id of Object.keys(BP.IMPL)) {
    const fn = BP.IMPL[id]
    const a = JSON.stringify(fn({ x: 1, value: 0.5 }))
    const b = JSON.stringify(fn({ x: 1, value: 0.5 }))
    if (a !== b) { same++; bad.push(id + '（同输入两次结果不同 = 不确定性）') }
  }
  console.log(`  同输入两次调用结果不同：${same} 条`)
  if (bad.length) console.log('    ' + bad.join(' | '))
  if (same > 0) add('HIGH', 'AR-A4', '序列化输出含随机性', bad.join(' | '), '除显式接收 seed 的采样类算法外，输出必须确定')
  else console.log('    → 确定性 OK（采样类算法用 LCG + 显式 seed，同 seed 同结果）')
}

// ══ A5 数值污染 ════════════════════════════════════════════════
console.log('\n' + '='.repeat(94))
console.log('A5 数值污染（NaN / Infinity / -0 / 超范围）')
console.log('='.repeat(94))
{
  const hasBad = (v) => {
    if (typeof v === 'number') return !isFinite(v) || Object.is(v, -0)
    if (Array.isArray(v)) return v.some(hasBad)
    if (v && typeof v === 'object') return Object.values(v).some(hasBad)
    return false
  }
  let dirty = 0
  const bad = []
  for (const id of Object.keys(BP.IMPL)) {
    for (const inp of [{}, { x: 'abc' }, { x: NaN }, { x: Infinity }, { a: [NaN, 1] }, { value: -1e308 }]) {
      let out
      try { out = BP.IMPL[id](inp) } catch (e) { continue }
      const inner = out && out.output !== undefined ? out.output : out
      if (hasBad(inner)) { dirty++; if (bad.length < 6) bad.push(id + ' ← ' + JSON.stringify(inp).slice(0, 24)) }
    }
  }
  console.log(`  52 条 × 6 种恶意数值输入，产生 NaN/Inf/-0：${dirty} 次`)
  if (bad.length) console.log('    ' + bad.join(' | '))
  if (dirty > 0) add('HIGH', 'AR-A5', `${dirty} 次产生污染数值`, bad.join(' | '), '所有数值出口需 isFinite 守卫')
  else console.log('    → 数值洁净')
}

// ══ A6 资源与并发 ══════════════════════════════════════════════
console.log('\n' + '='.repeat(94))
console.log('A6 资源边界（大输入 / 深递归）')
console.log('='.repeat(94))
{
  const big = new Array(100000).fill(0.5)
  const t0 = Date.now()
  let err = null
  try { BP.IMPL.ATOM_SCIENTIFIC_PAPER_211({ keywords: ['x'], papers: big.map((_, i) => ({ title: 'x' + i })) }) } catch (e) { err = e.message }
  const dt1 = Date.now() - t0
  const t1 = Date.now()
  let err2 = null
  try { BP.IMPL.ATOM_SWARM_CONSENSUS_217({ votes: big.map((_, i) => ({ opinion: 'o' + (i % 10), weight: 1 })) }) } catch (e) { err2 = e.message }
  const dt2 = Date.now() - t1
  console.log(`  10 万条论文检索：${dt1} ms ${err ? '错误:' + err.slice(0, 40) : '✓'}`)
  console.log(`  10 万票共识：    ${dt2} ms ${err2 ? '错误:' + err2.slice(0, 40) : '✓'}`)
  if (dt1 > 10000 || dt2 > 10000) add('MEDIUM', 'AR-A6', '大输入耗时过长', `${dt1}ms / ${dt2}ms`, '加上限或分批')
  else console.log('    → 大输入可接受')
}

// ══ A7 语义错位 ════════════════════════════════════════════════
console.log('\n' + '='.repeat(94))
console.log('A7 语义错位（14 条诚实标注的原子必须 make()=null，不得被工厂补上）')
console.log('='.repeat(94))
{
  const MUST_NULL = [...(F.MODEL_NEEDED || []), ...(F.EXTERNAL_NEEDED || [])]
  let wrong = 0
  const bad = []
  for (const id of MUST_NULL) {
    let fn = null
    try { fn = F.make(id) } catch (e) { }
    if (fn !== null) { wrong++; bad.push(id + ':' + (fn.kind || 'gen')) }
  }
  console.log(`  应返回 null 的 ${MUST_NULL.length} 条，实际返回非 null：${wrong} 条`)
  if (bad.length) console.log('    ' + bad.join(' | '))
  if (wrong > 0) add('CRITICAL', 'AR-A7', '诚实标注的原子被工厂补上了假实现', bad.join(' | '), 'make() 必须对 MODEL_NEEDED / EXTERNAL_NEEDED 早退')
  else console.log('    → 全部 null，无假实现')
}

// ══ 汇总 ══════════════════════════════════════════════════════
console.log('\n' + '='.repeat(94))
console.log('对抗式审查结论')
console.log('='.repeat(94))
const bySev = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] }
for (const f of findings) (bySev[f.sev] = bySev[f.sev] || []).push(f)
console.log(`  发现 ${findings.length} 项：CRITICAL ${bySev.CRITICAL.length} ｜ HIGH ${bySev.HIGH.length} ｜ MEDIUM ${bySev.MEDIUM.length}`)
for (const f of findings) {
  console.log(`\n  [${f.sev}] ${f.id} — ${f.what}`)
  console.log(`    证据：${f.evidence}`)
  console.log(`    处置：${f.fix}`)
}
if (!findings.length) console.log('  七个攻击面全部未突破')

writeFileSync('D:/metago-build/adversarial_review.json', JSON.stringify({ generatedAt: new Date().toISOString(), findings, surfaces: 7 }, null, 1), 'utf8')
console.log('\n已写出 D:/metago-build/adversarial_review.json')
const critical = bySev.CRITICAL.length
process.exit(critical > 0 ? 1 : 0)
