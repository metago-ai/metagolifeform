'use strict'
/**
 * mcp-toml.cjs — Codex config.toml 的 MCP 服务器段读写（36.9.6）
 * 保守文本操作：只在 [mcp_servers.xxx] 段边界内插入/更新/删除，保留文件其余
 * 内容与注释（段边界 = 行首 '[' 且不位于 inline 注释内）。零外部依赖。
 */
const fs = require('fs')

/** TOML 字符串字面量转义（双引号字符串）。 */
function tomlString(value) {
  return '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ') + '"'
}

/** 列出全部段名（行首 [name]）。 */
function sectionIndex(lines) {
  const idx = new Map() // section -> [start, end) 行区间（不含下一段头）
  let current = null
  for (let i = 0; i < lines.length; i++) {
    const m = /^\[([^\]]+)\]\s*$/.exec(lines[i])
    if (m) {
      if (current) idx.set(current.name, { start: current.start, end: i })
      current = { name: m[1].trim(), start: i }
    }
  }
  if (current) idx.set(current.name, { start: current.start, end: lines.length })
  return idx
}

/** 把一组 { name, command, args } 写入 toml 配置文件的 mcp_servers.<name> 段（幂等）。 */
function upsertTomlMcp(configPath, servers) {
  let text = ''
  if (fs.existsSync(configPath)) {
    text = fs.readFileSync(configPath, 'utf8')
  }
  let lines = text.split(/\r?\n/)
  if (lines.length > 0 && lines[lines.length - 1] === '' && text.endsWith('\r\n')) lines.pop()
  if (lines.length > 0 && lines[lines.length - 1] === '' && text.endsWith('\n')) lines.pop()
  for (const srv of servers || []) {
    const section = 'mcp_servers.' + srv.name
    const idx = sectionIndex(lines)
    const block = [
      '[' + section + ']',
      'command = ' + tomlString(srv.command),
      ...(srv.args && srv.args.length ? ['args = [' + srv.args.map(tomlString).join(', ') + ']'] : []),
    ]
    const hit = idx.get(section)
    if (hit) {
      // 更新 command/args 行，保留段内其它行（如 env 等）
      const head = lines.slice(0, hit.start + 1)
      const tail = lines.slice(hit.end)
      const keyed = lines.slice(hit.start + 1, hit.end).filter(l => !/^\s*(command|args)\s*=/.test(l))
      lines = head.concat(keyed, block.slice(1), tail)
    } else {
      if (lines.length && lines[lines.length - 1].trim() !== '') lines.push('')
      lines = lines.concat(block)
    }
  }
  if (lines.length && lines[lines.length - 1] !== '') lines.push('')
  fs.writeFileSync(configPath, lines.join('\n'), 'utf8')
}

/** 从 toml 配置中删除 mcp_servers.<name> 段；返回删除的段数。 */
function removeTomlMcp(configPath, serverNames) {
  if (!fs.existsSync(configPath)) return 0
  const text = fs.readFileSync(configPath, 'utf8')
  let lines = text.split(/\r?\n/)
  const names = new Set((serverNames || []).map(n => 'mcp_servers.' + n))
  const idx = sectionIndex(lines)
  const removals = []
  for (const [name, span] of idx) {
    if (names.has(name)) removals.push(span)
  }
  // 降序删除避免索引漂移
  removals.sort((a, b) => b.start - a.start)
  for (const span of removals) {
    // 连同段尾多余空行一起收敛（保留一个换行边界）
    let end = span.end
    while (end > span.start + 1 && lines[end - 1].trim() === '') end--
    if (end < lines.length) end += 1
    lines.splice(span.start, end - span.start)
  }
  fs.writeFileSync(configPath, lines.join('\n'), 'utf8')
  return removals.length
}

/** 校验配置是否含指定 MCP 服务器段（段名精确匹配，避免正则转义坑）。 */
function hasTomlMcp(configPath, serverNames) {
  if (!fs.existsSync(configPath)) return false
  const lines = fs.readFileSync(configPath, 'utf8').split(/\r?\n/)
  const sections = new Set(lines.map(l => l.trim()).filter(l => /^\[[^\]]+\]$/.test(l)))
  return (serverNames || []).every(n => sections.has('[' + 'mcp_servers.' + n + ']'))
}

module.exports = { tomlString, upsertTomlMcp, removeTomlMcp, hasTomlMcp, sectionIndex }
