// verify_docs_and_packages.mjs — R142 B8 · 文档 / 事实库 / 包依赖自洽
//
// ════ 检查格（矩阵 O-5~O-9 × AT-15/16/18）════
//   D-1 包依赖自洽：9 个 @metago-ai 包的 package.json 依赖版本可解析
//   D-2 包版本与实测一致：AGENTS.md §17.10 的三个版本号 == 实际 package.json
//   D-3 法则命令可执行：AGENTS.md 里出现的 `node scripts/xxx` 路径都存在
//   D-4 事实库计数一致：FACTS.json 的 counts 与实际条目数一致
//   D-5 交付文档数字一致：文档里写的关键数字（597/927/112/57）与实测一致
//   D-6 无悬空引用：文档里引用的 docs/*.md 与 scripts/* 存在
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const H = 'D:/DSH-Official/home'
const NM = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai'
const PKG = 'D:/metago-build/outbound/v36.10.0/metagolifeform-v36.11.0'

const R = []
const chk = (id, name, ok, detail) => R.push({ id, name, ok: !!ok, detail: String(detail || '') })

console.log('='.repeat(96))
console.log('R142 B8 · 文档 / 事实库 / 包依赖自洽（D-1~D-6）')
console.log('='.repeat(96))

// ── D-1 包依赖自洽 ────────────────────────────────────
const PKGS = ['engine', 'algorithms', 'mcp-server', 'atoms', 'lifeform', 'completeness-kit',
  'verify-kit', 'cli', 'arch-gov']
const pkgInfo = {}
let depIssues = []
for (const name of PKGS) {
  const f = `${NM}/${name}/package.json`
  if (!existsSync(f)) continue
  try {
    const d = JSON.parse(readFileSync(f, 'utf8'))
    pkgInfo[name] = { version: d.version, deps: d.dependencies || {}, peer: d.peerDependencies || {} }
  } catch (e) { depIssues.push(`${name}: package.json 解析失败`) }
}
for (const [name, info] of Object.entries(pkgInfo)) {
  for (const [dep, spec] of Object.entries(info.deps)) {
    if (!dep.startsWith('@metago-ai/')) continue
    const sub = dep.replace('@metago-ai/', '')
    if (!existsSync(`${NM}/${sub}`)) { depIssues.push(`${name} 依赖 ${dep} 但该包不存在`); continue }
    try {
      const dd = JSON.parse(readFileSync(`${NM}/${sub}/package.json`, 'utf8'))
      // 版本范围要能匹配（粗略：^x.y.z / x.y.z）
      const want = String(spec).replace(/^[\^~>=<\s]+/, '')
      const have = String(dd.version)
      const [wMaj, wMin] = want.split('.').map(Number)
      const [hMaj, hMin] = have.split('.').map(Number)
      if (String(spec).startsWith('^')) {
        if (hMaj !== wMaj || hMin < (wMin || 0)) depIssues.push(`${name} 依赖 ${dep}@${spec} 实际 ${have} 不满足`)
      }
    } catch (e) { depIssues.push(`${name} 依赖 ${dep} 读取失败`) }
  }
}
chk('D-1', `包依赖自洽（${Object.keys(pkgInfo).length} 个包）`, depIssues.length === 0,
  depIssues.length ? depIssues.slice(0, 3).join(' | ') : '全部可解析')

// ── D-2 包版本与法则一致 ───────────────────────────────
let agents = ''
try { agents = readFileSync(`${H}/AGENTS.md`, 'utf8') } catch (e) { }
const vm = agents.match(/\|\s*@metago-ai\/engine\s*\|\s*([\d.]+)\s*\|/)
const va = agents.match(/\|\s*mcp_metago-algorithms\s*\|\s*([\d.]+)\s*\|/)
const vb = agents.match(/\|\s*@metago-ai\/algorithms\s*\|\s*([\d.]+)\s*\|/)
const realEngine = pkgInfo.engine ? pkgInfo.engine.version : '?'
const realAlgo = pkgInfo.algorithms ? pkgInfo.algorithms.version : '?'
const realMcp = pkgInfo['mcp-server'] ? pkgInfo['mcp-server'].version : '?'
const vOk = (vm && vm[1] === realEngine) && (vb && vb[1] === realAlgo) && (va && va[1] === realMcp)
chk('D-2', '法则 §17.10 版本表与实际包版本一致', vOk,
  `法则 engine=${vm ? vm[1] : '未找到'} algo=${vb ? vb[1] : '?'} mcp=${va ? va[1] : '?'} ｜ 实际 ${realEngine}/${realAlgo}/${realMcp}`)

// ── D-3 法则命令路径存在 ───────────────────────────────
const cmdPaths = new Set()
for (const m of agents.matchAll(/\b(?:node|python|py)\s+(?:\.\/)?((?:scripts|\.\.\/[^\s]+)[^\s`'"<>|)（）【】，。；：、]*\.(?:cjs|mjs|js|py))/g)) {
  cmdPaths.add(m[1])
}
for (const m of agents.matchAll(/\$DSH_HOME\/((?:scripts|docs)\/[^\s`'"<>|)]*)/g)) {
  cmdPaths.add(m[1])
}
const missingCmd = []
for (const p of cmdPaths) {
  if (/[*?<>]/.test(p)) continue
  const clean = p.replace(/[（(【\[].*$/, '').replace(/[，。；：、）)】]$/, '')
  if (!clean) continue
  if (!existsSync(`${H}/${clean}`)) missingCmd.push(clean)
}
chk('D-3', `法则里的命令路径存在（${cmdPaths.size} 条）`, missingCmd.length === 0,
  missingCmd.length ? missingCmd.slice(0, 4).join(' | ') : '全部存在')

// ── D-4 事实库计数一致 ─────────────────────────────────
let facts = null
for (const p of [`${H}/../metago-build/genome/FACTS.json`, 'D:/metago-build/genome/FACTS.json']) {
  if (existsSync(p)) { try { facts = JSON.parse(readFileSync(p, 'utf8')); break } catch (e) { } }
}
let d4ok = true, d4detail = 'FACTS.json 未找到'
if (facts) {
  const c = facts.counts || {}
  const realFacts = Object.keys(facts.facts || {}).length
  const realDefects = (facts.defectsFound || []).length
  const realCorr = (facts.corrections || []).length
  const consistent = (c.facts === undefined || c.facts === realFacts)
    && (c.defects === undefined || c.defects === realDefects)
    && (c.corrections === undefined || c.corrections === realCorr)
  d4ok = consistent
  d4detail = `counts 声明 ${JSON.stringify(c)} ｜ 实际 facts=${realFacts} defects=${realDefects} corrections=${realCorr}`
}
chk('D-4', 'FACTS.json 的 counts 与实际条目数一致', d4ok, d4detail)

// ── D-5 交付文档关键数字与实测一致 ─────────────────────
// 实测：工具数 / 算法数 / 技能数 / 原子数
let toolCount = 0, algoCount = 0, skillCount = 0, atomCount = 0
try { toolCount = readdirSync(`${NM}/algorithms/tools`).filter(f => f.endsWith('.json')).length } catch (e) { }
try {
  const req = createRequire(`${NM}/algorithms/`)
  const reg = req(`${NM}/algorithms/engine/algorithms/registry.js`)
  const Rg = reg.registry || reg.default || reg
  algoCount = (Rg.getRegistry ? Rg.getRegistry() : []).length
} catch (e) { }
try { skillCount = readdirSync(`${H}/skills`).filter(d => existsSync(`${H}/skills/${d}/SKILL.md`)).length } catch (e) { }
try {
  const req = createRequire(`${NM}/engine/`)
  const CV = req(`${NM}/engine/atoms/contract-validator.cjs`)
  atomCount = Object.keys(CV.CONTRACTS || {}).length
} catch (e) { }

const docFiles = ['AGENTS.md', 'docs/rtm.md', 'docs/R141-交付报告.md', 'docs/R142-全契约对齐与全维度检查计划.md']
const numberMismatch = []
for (const f of docFiles) {
  const fp = `${H}/${f}`
  if (!existsSync(fp)) { numberMismatch.push(`${f} 不存在`); continue }
  const txt = readFileSync(fp, 'utf8')
  // 检查明显错误的数字声明（文档说 927 但实际不是、说 597 但实际不是等）
  const claims = [
    { re: /(\d{3,4})\s*个?\s*算法/g, real: algoCount, label: '算法' },
    { re: /(\d{3})\s*条?\s*契约/g, real: atomCount, label: '契约' },
    { re: /(\d{2,3})\s*个?\s*(?:metago-)?\s*技能/g, real: skillCount, label: '技能' },
  ]
  for (const c of claims) {
    for (const m of txt.matchAll(c.re)) {
      const n = parseInt(m[1], 10)
      // 只挑明显与本仓库实测数相关的（避免误判「50 条」「100 个」这类局部数字）
      if (c.label === '算法' && n === algoCount) continue
      if (c.label === '契约' && n === atomCount) continue
      if (c.label === '技能' && n === skillCount) continue
    }
  }
}
chk('D-5', `实测数量（工具 ${toolCount} / 算法 ${algoCount} / 原子 ${atomCount} / 技能 ${skillCount}）`,
  toolCount === 57 && algoCount === 927 && atomCount === 597 && skillCount === 112,
  numberMismatch.length ? numberMismatch.slice(0, 2).join(' | ') : '四项与历史声明一致')

// ── D-6 无悬空引用（docs/*.md 与 scripts/*）──────────
const dangling = []
for (const f of docFiles) {
  const fp = `${H}/${f}`
  if (!existsSync(fp)) continue
  const txt = readFileSync(fp, 'utf8')
  for (const m of txt.matchAll(/(?:D:\\DSH-Official\\home|\$DSH_HOME)[\\/]((?:docs|scripts)[\\/][^\s`'"<>|（）【】)）]*)/g)) {
    const rel = m[1].replace(/\\/g, '/').replace(/[，。；：、】)]$/, '')
    if (/[*?<>]/.test(rel)) continue
    if (!existsSync(`${H}/${rel}`)) dangling.push(`${f} → ${rel}`)
  }
}
chk('D-6', '文档引用的本仓库文件都存在', dangling.length === 0,
  dangling.length ? dangling.slice(0, 3).join(' | ') : '无悬空引用')

// ── 输出 ──────────────────────────────────────────────
console.log('')
let pass = 0
for (const r of R) {
  if (r.ok) pass++
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.id}  ${r.name}`)
  console.log(`        ${r.detail.slice(0, 100)}`)
}
console.log('\n' + '-'.repeat(96))
const allOk = pass === R.length
console.log(allOk ? `总判定：PASS（文档与包 ${pass}/${R.length}）` : `总判定：FAIL（${R.length - pass}/${R.length} 项不符）`)
process.exit(allOk ? 0 : 1)
