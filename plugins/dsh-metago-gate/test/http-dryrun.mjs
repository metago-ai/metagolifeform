/**
 * HTTP 面演练：把 buildRoutes 挂到真实 http server 上跑一遍。
 * 不依赖 Cordis，也不需要 DSH 在跑。
 *
 * 运行：node test/http-dryrun.mjs
 */

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
const logDirForTest = () => {
  const home = process.env.DSH_HOME || '$DSH_HOME\\home'
  return home + '\\metago\\fabric\\logs'
}
import { buildRoutes, consoleHtml, policySummary, setMode, tailLog } from '../lib/console.js'
import { snapshot, explainTool } from '../lib/index.js'

let pass = 0
let fail = 0
const failures = []
const ok = (label, cond, detail = '') => {
  if (cond) pass += 1
  else { fail += 1; failures.push(`${label} ${detail}`) }
}

import { readToken } from '../lib/index.js'
const routes = buildRoutes({ getSnapshot: snapshot, applyMode: () => {}, explainTool, getMode: () => 'shadow', readToken })
ok('路由数 = 11', routes.length === 11, String(routes.length))
ok('全部是 exact 且路径唯一', new Set(routes.map((r) => r.path)).size === routes.length && routes.every((r) => r.kind === 'exact'))
ok('路径都在 /api/metago/gate/ 下', routes.every((r) => r.path.startsWith('/api/metago/gate/')))

const byPath = new Map(routes.map((r) => [r.path, r.handler]))

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  const handler = byPath.get(url.pathname)
  if (!handler) { res.writeHead(404); res.end('nf'); return }
  Promise.resolve(handler(req, res)).catch((e) => {
    try { res.writeHead(500); res.end(String(e && e.message)) } catch { /* ignore */ }
  })
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
const base = `http://127.0.0.1:${port}`

async function getJson(p, init) {
  const r = await fetch(base + p, init)
  const text = await r.text()
  let body = null
  try { body = JSON.parse(text) } catch { body = { raw: text.slice(0, 200) } }
  return { status: r.status, body, text }
}

/* ---- status ---- */
const s = await getJson('/api/metago/gate/status')
ok('GET status 200', s.status === 200, String(s.status))
ok('status 有 gate.mode', s.body?.gate?.mode === 'shadow', JSON.stringify(s.body?.gate?.mode))
ok('status 有 policy.risk.high', typeof s.body?.policy?.risk?.high === 'number', String(s.body?.policy?.risk?.high))
ok('status 有七阶段', Array.isArray(s.body?.policy?.stages) && s.body.policy.stages.length === 7, String(s.body?.policy?.stages?.length))

/* ---- log ---- */
const l = await getJson('/api/metago/gate/log?tail=5')
ok('GET log 200', l.status === 200, String(l.status))
ok('log 返回 events 数组', Array.isArray(l.body?.events), typeof l.body?.events)

/* ---- mode：非法应 400 ---- */
const bad = await getJson('/api/metago/gate/mode', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'nuke' }),
})
ok('POST mode 非法值 → 400', bad.status === 400, String(bad.status))
ok('POST mode 非法值有 error', typeof bad.body?.error === 'string', JSON.stringify(bad.body))

/* ---- mode：GET 应 405 ---- */
const wrong = await getJson('/api/metago/gate/mode')
ok('GET mode → 405', wrong.status === 405, String(wrong.status))

/* ---- mode：合法值（切到 shadow，与当前一致，安全）---- */
const good = await getJson('/api/metago/gate/mode', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'shadow' }),
})
ok('POST mode shadow → 200', good.status === 200, String(good.status))
ok('POST mode 返回 to=shadow', good.body?.to === 'shadow', JSON.stringify(good.body))

/* ---- console 页面 ---- */
const c = await getJson('/api/metago/gate/console')
ok('GET console 200', c.status === 200, String(c.status))
ok('console 是 HTML', c.text.startsWith('<!doctype html>'), c.text.slice(0, 30))
ok('console 自包含（无 http:// 外链）', !/src="http|href="http/.test(c.text))
ok('console 含三个模式按钮', ['shadow', 'ask', 'deny'].every((m) => c.text.includes(`data-m="${m}"`)))
ok('console 含 2 秒刷新', c.text.includes('setInterval(refresh, 2000)'))

/* ---- 纯函数 ---- */
ok('policySummary 有 mode', typeof policySummary().mode === 'string')
ok('tailLog 返回对象', typeof tailLog(3) === 'object')
ok('consoleHtml 可重复生成且稳定', consoleHtml().length > 4000 && consoleHtml().length === consoleHtml().length)

/* ---- explain 端点：可解释性必须真的能用，且必须是只读 ---- */
const ex1 = await fetch(`http://127.0.0.1:${port}/api/metago/gate/explain`)
ok('explain 缺 tool 参数返回 400', ex1.status === 400, 'status=' + ex1.status)

const ex2 = await fetch(`http://127.0.0.1:${port}/api/metago/gate/explain?tool=pwsh`)
const b2 = await ex2.json()
ok('explain pwsh 判定 high', b2.level === 'high', 'level=' + b2.level)
ok('explain 给出命中规则', typeof b2.matchedRule === 'string' && b2.matchedRule.length > 0, String(b2.matchedRule))
ok('explain 给出改法建议', typeof b2.howToChange === 'string' && b2.howToChange.length > 0)

const ex3 = await fetch(`http://127.0.0.1:${port}/api/metago/gate/explain?tool=read`)
const b3 = await ex3.json()
ok('explain read 判定 low', b3.level === 'low', 'level=' + b3.level)

/* explain 是 GET 只读：用 POST 打它也不应改任何状态（路由只挂 GET 语义） */
const ex4 = await fetch(`http://127.0.0.1:${port}/api/metago/gate/explain?tool=pwsh`, { method: 'POST' })
ok('explain 对 POST 仍只返回解释（不改策略）', ex4.status === 200 || ex4.status === 405, 'status=' + ex4.status)

/* 关闭 server 并等 close 事件，避免 libuv 断言 */
/* ---- P9-09/11/12 只读数据端点 ---- */
{
  const ep = async (name) => {
    const r = await fetch(`http://127.0.0.1:${port}/api/metago/gate/${name}`)
    let j = null
    try { j = await r.json() } catch { j = null }
    return { status: r.status, body: j }
  }
  const hl = await ep('health')
  ok('health 返回 18 道闸与红队', hl.status === 200 && !!hl.body && hl.body.ok === true && hl.body.gates && hl.body.redteam, 'tierA=' + (hl.body && hl.body.gates && hl.body.gates.tierA))
  const cap = await ep('capabilities')
  ok('capabilities 返回任务总数且 >20', cap.status === 200 && !!cap.body && cap.body.ok === true && cap.body.total > 20, 'total=' + (cap.body && cap.body.total))
  const mem = await ep('memory')
  ok('memory 端点可达', mem.status === 200 && !!mem.body, 'ok=' + (mem.body && mem.body.ok))
  const ops = await ep('ops')
  ok('ops 返回进度与门禁', ops.status === 200 && !!ops.body && ops.body.ok === true && !!ops.body.wbs, 'round=' + (ops.body && ops.body.round))
  const aud = await ep('audit?tail=5')
  ok('audit 返回日志', aud.status === 200 && !!aud.body && aud.body.ok === true, 'total=' + (aud.body && aud.body.total))
}

/* ---- P9-13 越权 6 场景 + P9-06/07 /action 与审计 ---- */
{
  const base = `http://127.0.0.1:${port}/api/metago/gate/action`

  // 场景 1：GET 必须只返回动作目录，不泄露令牌
  const g1 = await fetch(base)
  const b1 = await g1.json()
  ok('越权1 GET /action 只列动作', g1.status === 200 && Array.isArray(b1.actions) && b1.actions.length === 4, 'actions=' + (b1.actions || []).length)
  ok('越权1 响应不含令牌', !JSON.stringify(b1).toLowerCase().includes('token'))

  // 场景 2：未知动作必须 404（不能靠"没找到就当成 status"）
  const g2 = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'rm -rf' }) })
  ok('越权2 未知动作返回 404', g2.status === 404, 'status=' + g2.status)

  // 场景 3：写动作不带令牌必须 403
  const g3 = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'setMode', payload: { mode: 'shadow' } }) })
  ok('越权3 写动作无令牌返回 403', g3.status === 403, 'status=' + g3.status)

  // 场景 4：写动作带错令牌必须 403
  const g4 = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json', 'x-metago-token': 'wrong-token' }, body: JSON.stringify({ action: 'setMode', payload: { mode: 'shadow' } }) })
  ok('越权4 写动作错令牌返回 403', g4.status === 403, 'status=' + g4.status)

  // 场景 5：非 POST/GET 方法必须 405
  const g5 = await fetch(base, { method: 'PUT' })
  ok('越权5 PUT 返回 405', g5.status === 405, 'status=' + g5.status)

  // 场景 6：只读动作不需要令牌，但也不能改状态
  const g6 = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'status' }) })
  const b6 = await g6.json()
  ok('越权6 只读动作免令牌且成功', g6.status === 200 && b6.ok === true, 'status=' + g6.status)

  // 场景 7（附加）：合法令牌 + 白名单外 mode 值必须被拒
  const tk = readToken()
  if (tk) {
    const g7 = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json', 'x-metago-token': tk }, body: JSON.stringify({ action: 'setMode', payload: { mode: 'root' } }) })
    const b7 = await g7.json()
    ok('越权7 合法令牌但非法 mode 仍被拒', b7.ok === false, 'ok=' + b7.ok)
  }

  // 审计：/action 调用必须留痕
  const auditPath = join(logDirForTest(), 'console-audit.jsonl')
  let auditLines = 0
  try { auditLines = readFileSync(auditPath, 'utf8').split('\n').filter(Boolean).length } catch { auditLines = 0 }
  ok('审计 console-audit.jsonl 有记录', auditLines > 0, 'lines=' + auditLines)
}

try { if (typeof server.closeAllConnections === 'function') server.closeAllConnections() } catch { /* ignore */ }
await new Promise((resolve) => server.close(resolve))

console.log(`\n  http-dryrun: ${pass} passed, ${fail} failed`)
if (fail > 0) {
  console.log('\n  失败项:')
  for (const f of failures) console.log('   ✘ ' + f)
  process.exit(1)
}
console.log('  ✅ HTTP 面全部通过（端口 ' + port + ' 已释放）\n')
/* __FORCE_EXIT__：Node 25 on Windows 在进程退出时会偶发 libuv 断言，
   与测试结果无关；这里显式以断言结果码退出，避免把断言失败掩盖成崩溃。 */
process.exit(0)  // 能走到这里说明没有失败项
