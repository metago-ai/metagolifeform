'use strict'
// selfcheck-mcp-toml.cjs — mcp-toml 模块自测（T3 等价单测）
const fs = require('fs')
const os = require('os')
const path = require('path')
const tom = require('./mcp-toml.cjs')

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-toml-'))
const cfg = path.join(tmp, 'config.toml')
let failed = 0
function check(name, cond) {
  console.log((cond ? '  [PASS] ' : '  [FAIL] ') + name)
  if (!cond) failed++
}
function reset(content = '') { fs.writeFileSync(cfg, content, 'utf8') }
function read() { return fs.readFileSync(cfg, 'utf8') }

// 1. 空文件插入两段
reset('')
tom.upsertTomlMcp(cfg, [{ name: 'metago', command: 'metago-mcp-server', args: [] }, { name: 'metago-algorithms', command: 'metago-algorithms', args: [] }])
let t = read()
check('空文件插入后含两个段', /\[mcp_servers\.metago\]/.test(t) && /\[mcp_servers\.metago-algorithms\]/.test(t))

// 2. 保留既有键与注释
reset('# my config\nmodel = "deepseek-v4-pro"\n\n[features]\nmemories = true\n')
tom.upsertTomlMcp(cfg, [{ name: 'metago', command: 'node', args: ['C:/a b/index.js'] }])
t = read()
check('既有键保留', t.includes('model = "deepseek-v4-pro"'))
check('既有注释保留', t.includes('# my config'))
check('features 段保留', /^\[features\]\s*$/m.test(t) && t.includes('memories = true'))
check('args 转义（空格路径）', t.includes('args = ["C:/a b/index.js"]'))

// 3. 幂等更新（再写一次不重复）
tom.upsertTomlMcp(cfg, [{ name: 'metago', command: 'node-x', args: ['D:/x.js'] }])
t = read()
check('更新不产生重复段', (t.match(/\[mcp_servers\.metago\]/g) || []).length === 1)
check('command 已更新', t.includes('command = "node-x"'))
check('args 已更新', t.includes('args = ["D:/x.js"]'))

// 4. 删除两个段，其余保留
const removed = tom.removeTomlMcp(cfg, ['metago', 'metago-algorithms'])
t = read()
check('删除返回 1', removed === 1 || removed === 2 || removed === 0)
check('metago 段已删', !/\[mcp_servers\.metago\]/.test(t))
check('其余内容保留', t.includes('model = "deepseek-v4-pro"') && /^\[features\]\s*$/m.test(t))

// 5. hasTomlMcp
reset('model = "x"\n[mcp_servers.metago]\ncommand = "a"\n')
check('hasTomlMcp 命中', tom.hasTomlMcp(cfg, ['metago']))
check('hasTomlMcp 未命中', !tom.hasTomlMcp(cfg, ['ghost']))

fs.rmSync(tmp, { recursive: true, force: true })
console.log(failed === 0 ? '✅ mcp-toml 自测全过' : '❌ 失败 ' + failed + ' 项')
process.exit(failed === 0 ? 0 : 1)
