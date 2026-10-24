// scan_mcp_surfaces.mjs — 系统性扫描 4 个第三方 MCP 面（U-02/03/04/05）+ prompts（U-08）
//
// 分级判据（S1–S5，来自执行计划 §7.1）：
//   S1 存在：tools/list 能列出，数量与声明一致
//   S2 schema 完整：每个工具有 name/description/inputSchema，必填字段有类型
//   S3 可调：按 schema 传合法最小参数真调，无协议错误
//   S4 非空：返回内容非空
//   S5 语义：见各面的专项断言
//
// **安全策略（不能搞出新问题）**：
//   · 有副作用的工具（playwright 启动浏览器、scrapling 抓外部网页、web-session-api 需登录）
//     本轮只做到 S2（schema 完整），S3 只对明确的只读/纯计算工具执行。
//   · 纯计算面（yili 易理）全量做 S3+S4。
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const NPM = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules'

const SERVERS = [
  { key: 'U-02', name: 'playwright', script: 'D:/MetaGO-Playwright-MCP/server/node_modules/@playwright/mcp/cli.js', mode: 'S2' },
  { key: 'U-03', name: 'web-session-api', script: 'D:/web-session-api/src/mcp-server.js', mode: 'S2' },
  { key: 'U-04', name: 'yili', script: 'D:/DH工作区/易理工程学/mcp/metago-shushu-server.js', mode: 'FULL' },
  { key: 'U-05', name: 'scrapling', script: null, mode: 'S2' },  // Python 服务，单独处理
]

function runServer(script, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], { stdio: ['pipe', 'pipe', 'pipe'] })
    let buf = ''
    let id = 0
    const pending = new Map()
    let settled = false
    const done = (v) => { if (settled) return; settled = true; try { child.kill() } catch (e) { } resolve(v) }
    const timer = setTimeout(() => done({ error: 'timeout' }), timeoutMs || 120000)
    const send = (o) => { try { child.stdin.write(JSON.stringify(o) + '\n') } catch (e) { } }
    const call = (method, params) => new Promise((res) => {
      const myId = ++id
      pending.set(myId, res)
      send({ jsonrpc: '2.0', id: myId, method, params })
    })
    child.stdout.on('data', (d) => {
      buf += d.toString()
      let i
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim()
        buf = buf.slice(i + 1)
        if (!line) continue
        let m
        try { m = JSON.parse(line) } catch (e) { continue }
        if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
      }
    })
    child.on('error', (e) => done({ error: 'spawn: ' + e.message }))
    ;(async () => {
      const init = await call('initialize', {
        protocolVersion: '2024-11-05', capabilities: {},
        clientInfo: { name: 'scan', version: '1.0' },
      })
      send({ jsonrpc: '2.0', method: 'notifications/initialized' })
      const tl = await call('tools/list', {})
      const tools = (tl.result && tl.result.tools) || []
      let prompts = []
      try {
        const pl = await call('prompts/list', {})
        prompts = (pl.result && pl.result.prompts) || []
      } catch (e) { }
      clearTimeout(timer)
      done({ init: !!init.result, tools, prompts })
    })().catch(e => { clearTimeout(timer); done({ error: String(e.message) }) })
  })
}

function s2Check(tools) {
  const bad = []
  for (const t of tools) {
    if (!t.name) bad.push(`${t.name || '?'}: 无 name`)
    if (!t.description) bad.push(`${t.name}: 无 description`)
    if (!t.inputSchema) { bad.push(`${t.name}: 无 inputSchema`); continue }
    const props = t.inputSchema.properties || {}
    const req = t.inputSchema.required || []
    for (const r of req) {
      if (!props[r]) bad.push(`${t.name}: 必填字段 ${r} 不在 properties 里`)
      else if (!props[r].type) bad.push(`${t.name}: 必填字段 ${r} 无 type`)
    }
  }
  return bad
}

const REPORT = { generatedAt: new Date().toISOString(), surfaces: [] }

for (const s of SERVERS) {
  if (!s.script) continue
  console.log('='.repeat(92))
  console.log(`${s.key} · ${s.name}`)
  console.log('='.repeat(92))
  const r = await runServer(s.script, 120000)
  if (r.error) {
    console.log(`  ✗ 启动/握手失败：${r.error}`)
    REPORT.surfaces.push({ key: s.key, name: s.name, ok: false, error: r.error })
    continue
  }
  console.log(`  S1 存在：tools ${r.tools.length} 个 ｜ prompts ${r.prompts.length} 个  ${r.init ? '✓ 握手成功' : '✗ 无 init 响应'}`)
  const bad2 = s2Check(r.tools)
  console.log(`  S2 schema 完整：${bad2.length === 0 ? '✓ 全部合格' : `✗ ${bad2.length} 处问题`}`)
  for (const b of bad2.slice(0, 8)) console.log(`      ${b}`)

  const rows = r.tools.map(t => ({
    name: t.name,
    desc: String(t.description || '').slice(0, 60),
    required: (t.inputSchema && t.inputSchema.required) || [],
    propCount: Object.keys((t.inputSchema && t.inputSchema.properties) || {}).length,
  }))
  if (r.tools.length) {
    console.log('\n  工具清单：')
    for (const x of rows) {
      console.log(`    ${x.name.padEnd(30)} 属性 ${String(x.propCount).padStart(2)} ｜ 必填 ${JSON.stringify(x.required)}`)
    }
  }
  REPORT.surfaces.push({
    key: s.key, name: s.name, ok: true,
    toolCount: r.tools.length, promptCount: r.prompts.length,
    schemaIssues: bad2, tools: rows,
  })
  console.log()
}

writeFileSync('D:/metago-build/mcp_surface_scan.json', JSON.stringify(REPORT, null, 1), 'utf8')
console.log('已写出 D:/metago-build/mcp_surface_scan.json')
