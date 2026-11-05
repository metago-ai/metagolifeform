/**
 * 装载演练：用假 ctx 跑一遍 apply()，证明
 *   1) apply 不抛异常
 *   2) 三个钩子都被注册（tools/pre-execute、tools/result、agent/turn-stopping）
 *   3) 钩子回调在 shadow 模式下原样返回下游 decision（零改判）
 *   4) 钩子内部异常不会外泄
 *
 * 运行：node test/mount-dryrun.mjs
 */

import { apply, name, snapshot } from '../lib/index.js'

let pass = 0
let fail = 0
const failures = []
const ok = (label, cond, detail = '') => {
  if (cond) pass += 1
  else { fail += 1; failures.push(`${label} ${detail}`) }
}

/** 假 ctx：只实现 on() */
const handlers = new Map()
const fakeCtx = {
  on(event, fn, opts) {
    handlers.set(event, { fn, opts })
    return () => handlers.delete(event) // 返回 stop 函数
  },
}

let dispose
try {
  dispose = apply(fakeCtx)
  ok('apply 不抛异常', true)
} catch (error) {
  ok('apply 不抛异常', false, String(error && error.message))
}

ok('插件名正确', name === 'dsh-metago-gate', name)
ok('注册了 5 个钩子', handlers.size === 5, `实际 ${handlers.size}: ${[...handlers.keys()].join(', ')}`)
ok('包含 tools/pre-execute', handlers.has('tools/pre-execute'))
ok('包含 tools/result', handlers.has('tools/result'))
ok('包含 agent/turn-stopping', handlers.has('agent/turn-stopping'))
ok('包含 fs/write-intent', handlers.has('fs/write-intent'))
ok('包含 system-prompt/assemble', handlers.has('system-prompt/assemble'))

/* ---- 两个新钩子必须「只观察不改值」：原样返回下游结果 ---- */
try {
  const fsIntent = handlers.get('fs/write-intent').fn
  const fakeOutcome = { version: 'v-7f3a', note: 'same-object-must-come-back' }
  let got = null
  try {
    got = await fsIntent({ path: 'D:\\tmp\\x.txt' }, undefined, async () => fakeOutcome)
  } catch (error) { got = { threw: String((error && error.message) || error) } }
  ok('fs/write-intent 原样返回下游 outcome（同一对象）', got === fakeOutcome, 'got=' + JSON.stringify(got))
} catch (error) {
  ok('fs/write-intent 原样返回下游 outcome（同一对象）', false, 'harness-error: ' + String((error && error.message) || error))
}

try {
  const spAssemble = handlers.get('system-prompt/assemble').fn
  const fakeAssembly = { sections: [{ id: 'a' }], contexts: [], tools: { t1: 1 } }
  let got = null
  try {
    got = await spAssemble(fakeAssembly, {}, async () => fakeAssembly)
  } catch (error) { got = { threw: String((error && error.message) || error) } }
  ok('system-prompt/assemble 原样返回下游 assembly（同一对象）', got === fakeAssembly, 'got=' + JSON.stringify(got).slice(0, 80))
} catch (error) {
  ok('system-prompt/assemble 原样返回下游 assembly（同一对象）', false, 'harness-error: ' + String((error && error.message) || error))
}

{
  const fsIntent = handlers.get('fs/write-intent').fn
  let threw = false
  try {
    await fsIntent({ path: 'x' }, undefined, async () => { throw new Error('downstream-boom') })
  } catch { threw = true }
  ok('fs/write-intent 下游抛错时原样上抛（不吞错）', threw === true)
}
ok('pre-execute 用了 prepend', handlers.get('tools/pre-execute')?.opts?.prepend === true)
ok('apply 返回了 dispose 函数', typeof dispose === 'function')

/* ---- shadow 模式：必须原样放行 ---- */
const pre = handlers.get('tools/pre-execute').fn

async function checkShadow(execution, downstreamDecision) {
  const next = async () => downstreamDecision
  return pre(execution, next)
}

const r1 = await checkShadow({ toolName: 'pwsh', input: { command: 'rm -rf /' } }, { kind: 'allow' })
ok('shadow: 即使命中 L7 也原样返回 allow', r1.kind === 'allow', JSON.stringify(r1))

const r2 = await checkShadow({ toolName: 'plugin_manager', input: { action: 'install_bundle' } }, { kind: 'ask' })
ok('shadow: 下游 ask 原样返回', r2.kind === 'ask', JSON.stringify(r2))

const r3 = await checkShadow({ toolName: 'read', input: {} }, { kind: 'cancel' })
ok('shadow: 下游 cancel 原样返回', r3.kind === 'cancel', JSON.stringify(r3))

/* ---- 下游抛错：必须原样上抛（不吞） ---- */
let threw = false
try {
  await pre({ toolName: 'read', input: {} }, async () => { throw new Error('downstream boom') })
} catch {
  threw = true
}
ok('下游异常原样上抛', threw)

/* ---- 畸形入参：不得抛错 ---- */
let malformedOk = true
for (const bad of [null, undefined, {}, { toolName: null }, { toolName: 'x', input: 12345 }]) {
  try {
    const r = await pre(bad, async () => ({ kind: 'allow' }))
    if (!r || r.kind !== 'allow') malformedOk = false
  } catch {
    malformedOk = false
  }
}
ok('畸形入参不抛错且原样放行', malformedOk)

/* ---- tools/result 与 turn-stopping 不抛错 ---- */
try {
  handlers.get('tools/result').fn({ toolName: 'read' }, { isError: false })
  ok('tools/result 回调不抛错', true)
} catch (error) {
  ok('tools/result 回调不抛错', false, String(error && error.message))
}

/* ---- agent/turn-stopping 是 serial：没有 next，绝不能调用 ---- */
/* 契约（cordis_inspect_query 实测）：mode=serial，(payload)=>{agent,turn,signal} => void */
try {
  const r = handlers.get('agent/turn-stopping').fn({ turn: 1, agent: { id: 's' }, signal: { aborted: false } })
  ok('turn-stopping 只收 payload 不抛错', true)
  ok('turn-stopping 不返回 Promise（非 async）', !(r && typeof r.then === 'function'), String(r))
} catch (error) {
  ok('turn-stopping 只收 payload 不抛错', false, String(error && error.message))
}

try {
  handlers.get('agent/turn-stopping').fn(undefined)
  ok('turn-stopping 收到 undefined 不抛错', true)
} catch (error) {
  ok('turn-stopping 收到 undefined 不抛错', false, String(error && error.message))
}

/* ---- 字段名契约：pre-execute 的 exec 用 name / arguments ---- */
const r5 = await checkShadow({ name: 'pwsh', arguments: { command: 'rm -rf /' } }, { kind: 'allow' })
ok('pre-execute 读 name/arguments 并原样放行', r5.kind === 'allow', JSON.stringify(r5))

/* ---- dispose 安全 ---- */
try {
  if (typeof dispose === 'function') dispose()
  ok('dispose 可安全调用', true)
} catch (error) {
  ok('dispose 可安全调用', false, String(error && error.message))
}

const snap = snapshot()
ok('snapshot 有 mode 字段', snap && typeof snap.mode === 'string', JSON.stringify(snap && snap.mode))
ok('snapshot 记录了调用数', typeof snap.toolCalls === 'number', String(snap.toolCalls))

console.log(`\n  mount-dryrun: ${pass} passed, ${fail} failed`)
console.log('  统计: ' + JSON.stringify({ toolCalls: snap.toolCalls, stageHits: snap.stageHits, escalations: snap.escalations, logFailures: snap.logFailures }))
if (fail > 0) {
  console.log('\n  失败项:')
  for (const f of failures) console.log('   ✘ ' + f)
  process.exit(1)
}
console.log('  ✅ 装载演练通过（影子模式零改判已验证）\n')
