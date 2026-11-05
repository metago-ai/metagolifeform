/**
 * mount-dryrun.mjs — 用假 ctx 演练插件装载（**不启动真宿主、不注册进运行体**）
 *
 * 这是 V37.1-06「闸 3 隔离空跑」的实现：在把插件交给宿主之前，
 * 用最小假实现验证注册契约、信封形态、异常安全。
 *
 * 运行：node $METAGO_LIFEFORM_HOME\plugins\dsh-metago-atom\test\mount-dryrun.mjs
 */

import { apply, inject, name, snapshot } from '../lib/index.js'

let pass = 0
let fail = 0
const failures = []
const ok = (label, cond, detail = '') => {
  if (cond) { pass += 1; console.log(`  ✅ ${label}`) } else { fail += 1; failures.push(`${label} ${detail}`); console.log(`  ❌ ${label} ${detail}`) }
}

console.log('\n  dsh-metago-atom mount-dryrun\n')
ok('插件名正确', name === 'dsh-metago-atom', name)
ok('inject 含 tools', Array.isArray(inject) && inject.includes('tools'), JSON.stringify(inject))

/** 假 ctx：只实现 tools.register */
const registered = []
const fakeCtx = {
  tools: {
    register(definition) {
      registered.push(definition)
      return () => { registered.pop() }
    },
  },
}

let dispose
try {
  dispose = apply(fakeCtx)
  ok('apply 不抛异常', true)
} catch (error) {
  ok('apply 不抛异常', false, String(error && error.message))
}

ok('注册了 1 个工具', registered.length === 1, `实际 ${registered.length}`)
const def = registered[0] || {}

/* ---- 必填字段：ToolDefinition 契约 ---- */
ok('name = metago_atom', def.name === 'metago_atom', String(def.name))
ok('有 description', typeof def.description === 'string' && def.description.length > 50, String(def.description || '').length)
ok('有 parameters（object schema）', def.parameters && def.parameters.type === 'object')
ok('parameters 含 operation', !!(def.parameters && def.parameters.properties && def.parameters.properties.operation))
ok('parameters 含 mode 且枚举三值', JSON.stringify(def.parameters?.properties?.mode?.enum) === JSON.stringify(['invoke', 'describe', 'list']))
ok('有 output.schema', !!(def.output && def.output.schema))
ok('有 output.render（函数）', typeof def.output?.render === 'function')
ok('有 execute（函数）', typeof def.execute === 'function')

/* ---- 安全底线：不得设 deferLoading ---- */
ok('**未设 deferLoading**（INC-002 底线）', def.deferLoading === undefined, String(def.deferLoading))

/* ---- render 形态 ---- */
try {
  const blocks = def.output.render({}, { ok: true, atom: 'X' })
  ok('render 返回数组', Array.isArray(blocks), typeof blocks)
  ok('render 返回 text 块', blocks.length > 0 && blocks[0].type === 'text' && typeof blocks[0].text === 'string', JSON.stringify(blocks).slice(0, 120))
} catch (error) {
  ok('render 可调用', false, String(error && error.message))
}

/* ---- execute 冒烟：5 条代表性原子 ---- */
const smoke = [
  { operation: 'ATOM_RESOURCE_ALLOCATE_001', input: [10, 20, 30] },
  { operation: 'ATOM_RESOURCE_ALLOCATE_001', mode: 'describe' },
  { mode: 'list', filter: { status: 'unsupported' } },
  { operation: 'ATOM_SECURE_LOCK_201' },
  { operation: 'ATOM_NOT_EXIST_999' },
]
let smokeOk = 0
for (const args of smoke) {
  try {
    const r = await def.execute(args, {})
    const structured = r && typeof r === 'object' && typeof r.ok === 'boolean'
    if (structured) smokeOk += 1
    console.log(`     · ${JSON.stringify(args).slice(0, 52).padEnd(54)} → ok=${r && r.ok} ${r && r.unsupported ? 'unsupported' : ''} ${r && r.reason ? '(' + String(r.reason).slice(0, 40) + ')' : ''}`)
  } catch (error) {
    console.log(`     · ${JSON.stringify(args).slice(0, 52)} → ✘ 抛出 ${error && error.message}`)
  }
}
ok('5 条冒烟全部返回结构化信封（无抛出）', smokeOk === smoke.length, `${smokeOk}/${smoke.length}`)

/* ---- 异常安全：脏入参不得抛 ---- */
let dirtyOk = true
for (const bad of [null, undefined, 123, 'str', [], { operation: '' }, { mode: 'nope' }]) {
  try {
    const r = await def.execute(bad, {})
    if (!r || typeof r.ok !== 'boolean') dirtyOk = false
  } catch { dirtyOk = false }
}
ok('脏入参不抛错且返回结构化结果', dirtyOk)

/* ---- dispose 安全 ---- */
try {
  if (typeof dispose === 'function') dispose()
  ok('dispose 可安全调用', true)
} catch (error) {
  ok('dispose 可安全调用', false, String(error && error.message))
}

/* ---- 快照 ---- */
const snap = snapshot()
ok('snapshot 有 loaded 字段', typeof snap.loaded === 'boolean', JSON.stringify(snap).slice(0, 120))
console.log(`\n  统计: ${JSON.stringify(snap.stats)} · 索引 ${snap.indexed} 条`)

console.log(`\n  ${pass} passed, ${fail} failed`)
if (fail > 0) {
  console.log('\n  失败项:')
  for (const f of failures) console.log('   ✘ ' + f)
  process.exit(1)
}
console.log('  ✅ 装载演练通过（假 ctx · 未进运行体）\n')
