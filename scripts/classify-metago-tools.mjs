// classify_metago_tools.mjs — 实测 metago 55 个工具的真实返回性质
//
// 分类判据（按返回内容特征，不靠猜）：
//   COMPUTE  计算型：返回里有数值字段（score/value/result/count 等），或结构化计算结果
//   INJECT   注入型：返回是方法模板（含「触发条件」「执行流程」「输出格式」等章节）
//   QUERY    查询型：返回系统状态（版本、计数、列表）
//   UNKNOWN  无法判定
//
// 做法：spawn metago MCP 服务器 → tools/list → 逐个 tools/call（最小参数）→ 分析返回文本
import { spawn } from 'node:child_process'

const SERVER = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/mcp-server/dist/index.js'

function runServer(script) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], { stdio: ['pipe', 'pipe', 'pipe'] })
    let buf = ''
    let id = 0
    const pending = new Map()
    const done = (v) => { try { child.kill() } catch (e) { } resolve(v) }
    const timer = setTimeout(() => done({ error: 'timeout' }), 300000)
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
    ;(async () => {
      await call('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'classify', version: '1.0' },
      })
      send({ jsonrpc: '2.0', method: 'notifications/initialized' })
      const tl = await call('tools/list', {})
      const tools = (tl.result && tl.result.tools) || []
      const out = []
      for (const t of tools) {
        // 用 schema 里每个必填字段造最小参数；没有必填就传空对象
        const props = (t.inputSchema && t.inputSchema.properties) || {}
        const req = (t.inputSchema && t.inputSchema.required) || []
        const args = {}
        for (const k of req) {
          const ty = props[k] && props[k].type
          args[k] = ty === 'number' ? 1 : ty === 'boolean' ? true : ty === 'array' ? [] : ty === 'object' ? {} : 'test'
        }
        let r
        try { r = await Promise.race([call('tools/call', { name: t.name, arguments: args }), new Promise(res => setTimeout(() => res({ timeout: true }), 12000))]) }
        catch (e) { r = { error: e.message } }
        let text = ''
        try {
          const c = r && r.result && r.result.content
          if (Array.isArray(c)) text = c.map(x => x.text || '').join('')
        } catch (e) { }
        out.push({ name: t.name, desc: String(t.description || '').slice(0, 80), text: text.slice(0, 4000), timeout: !!r.timeout })
      }
      clearTimeout(timer)
      done({ tools: out })
    })().catch(e => { clearTimeout(timer); done({ error: e.message }) })
  })
}

// ── 分类 ──────────────────────────────────────────────────────
const INJECT_MARKERS = ['触发条件', '执行流程', '输出格式', '使用方法', '使用步骤', '判定标准']
const NUM_RE = /(?:^|[\s{"',])(?:score|value|result|count|couplingScore|totalScore|percentage|rate|ratio|index|level)\s*[:=]\s*-?\d/i

function classify(t) {
  const s = t.text || ''
  if (t.timeout) return 'TIMEOUT'
  if (!s.trim()) return 'EMPTY'
  const injectHits = INJECT_MARKERS.filter(m => s.indexOf(m) >= 0).length
  const hasNum = NUM_RE.test(s)
  // 注入型的典型形态：多个方法章节 + 无结构化数值
  if (injectHits >= 2 && !hasNum) return 'INJECT'
  if (hasNum && injectHits <= 1) return 'COMPUTE'
  if (/版本|version|服务器|工具数|已安装|统计|列表/i.test(s) && !hasNum) return 'QUERY'
  if (injectHits >= 2) return 'INJECT'
  if (hasNum) return 'COMPUTE'
  return 'UNKNOWN'
}

console.log('='.repeat(96))
console.log('metago 55 工具性质实测')
console.log('='.repeat(96))
const r = await runServer(SERVER)
if (r.error) { console.log('✗ 服务器失败:', r.error); process.exit(1) }

const rows = r.tools.map(t => ({ ...t, kind: classify(t) }))
const g = {}
for (const x of rows) (g[x.kind] = g[x.kind] || []).push(x)

const pad = (s, n) => String(s).padEnd(n)
console.log('\n' + pad('tool', 34) + pad('性质', 10) + '返回长度 / 特征')
console.log('-'.repeat(96))
for (const x of rows) {
  const markers = INJECT_MARKERS.filter(m => (x.text || '').indexOf(m) >= 0)
  console.log(pad(x.name, 34) + pad(x.kind, 10) + `${x.text.length} B  ${markers.length ? '方法章节:' + markers.join('/') : ''}`)
}

console.log('\n' + '-'.repeat(96))
for (const k of Object.keys(g).sort()) {
  console.log(`${k}: ${g[k].length}`)
}
console.log(`合计 ${rows.length}`)

// 落盘供后续使用
import { writeFileSync } from 'node:fs'
writeFileSync('D:/metago-build/metago_tool_kinds.json', JSON.stringify({
  generatedAt: new Date().toISOString(),
  rows: rows.map(x => ({ name: x.name, kind: x.kind, desc: x.desc, len: x.text.length })),
  summary: Object.fromEntries(Object.keys(g).map(k => [k, g[k].length])),
}, null, 1), 'utf8')
console.log('\n已写出 D:/metago-build/metago_tool_kinds.json')
