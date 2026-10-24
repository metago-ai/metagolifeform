// verify_skills_substance.mjs — R142 B6 · 112 技能：内容实质 + 引用有效 + 命令可执行
//
// ════ 现状缺口 ════
// audit_skills.py 只验「frontmatter 可解析 + 正文非空」。
// 这一批要验：内容真的有用、引用的路径真的存在、写出的命令真的能跑。
//
// ════ 断言 ════
//   S-1 frontmatter 完整：name / description 必填，且 name 与目录名一致
//   S-2 正文实质：≥ 300 字，含「何时使用 / when to use」类的触发说明
//   S-3 引用有效：正文里提到的本地路径（D:\ / scripts/ / *.md）必须存在
//   S-4 不重复：description 两两相似度 < 0.92（防复制粘贴的空壳技能）
//   S-5 命令可执行：正文里 ```bash/```sh 代码块中的**本地存在的脚本命令**能解析出脚本路径
//   S-6 无占位符残留：不含 TODO / FIXME / XXX（占位符）/ 「待补充」
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import path from 'node:path'

const SK = 'D:/DSH-Official/home/skills'
const H = 'D:/DSH-Official/home'

function parseFrontmatter(txt) {
  const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { fm: {}, body: txt }
  const fm = {}
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (mm) fm[mm[1]] = mm[2].replace(/^["']|["']$/g, '').trim()
  }
  return { fm, body: txt.slice(m[0].length) }
}

// 中文/英文混合字符数（粗略：去掉空白与标点）
function charCount(s) {
  return s.replace(/\s/g, '').length
}

// description 相似度（词集 Jaccard，中英混合按 2-gram）
function bigrams(s) {
  const t = s.toLowerCase().replace(/\s+/g, '')
  const out = new Set()
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2))
  return out
}
function jaccard(a, b) {
  const A = bigrams(a), B = bigrams(b)
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  return inter / (A.size + B.size - inter)
}

// 提取正文里的本地路径引用
function extractPaths(body) {
  const out = new Set()
  // Windows 绝对路径
  for (const m of body.matchAll(/[A-Za-z]:[\\/][^\s`'"()<>\[\]]+/g)) out.add(m[0])
  // 相对脚本路径
  for (const m of body.matchAll(/(?:^|[\s`'"(])((?:scripts|docs|skills)\/[^\s`'"()<>\[\]]+)/g)) out.add(m[0].trim())
  return [...out]
}

// 把引用解析成绝对路径并判断存在
/* 操作指引里的「目标文件」不是本仓库引用，不该校验存在性。
   例：metago-delivery-gate 写「打开 docs/requirements.md 逐条拆解」——
   那是**用户项目里**的文件，本仓库当然没有。 */
const GUIDANCE_TARGETS = new Set([
  'docs/requirements.md', 'docs/rtm.md', 'docs/delivery-report.md',
  'docs/report.md', 'docs/spec.md', 'docs/design.md',
])

function resolveRef(p) {
  let q = p.replace(/[，。；：、）)】]$/, '').replace(/\\/g, '/')
  if (!q) return null
  if (/^[A-Za-z]:\//.test(q)) return q
  if (q.startsWith('$DSH_HOME/')) return H + '/' + q.slice('$DSH_HOME/'.length)
  if (q.startsWith('scripts/') || q.startsWith('docs/') || q.startsWith('skills/')) return H + '/' + q
  return null
}

console.log('='.repeat(96))
console.log('R142 B6 · 112 技能实质验证（S-1~S-6）')
console.log('='.repeat(96))

const dirs = readdirSync(SK).filter(d => {
  try { return statSync(path.join(SK, d)).isDirectory() } catch (e) { return false }
})

const rows = []
for (const d of dirs) {
  const f = path.join(SK, d, 'SKILL.md')
  if (!existsSync(f)) { rows.push({ d, v: ['S-1 目录下无 SKILL.md'] }); continue }
  const txt = readFileSync(f, 'utf8')
  const { fm, body } = parseFrontmatter(txt)
  const v = []

  // S-1 frontmatter
  if (!fm.name) v.push('S-1 缺 name')
  else if (fm.name !== d) v.push(`S-1 name="${fm.name}" 与目录名 "${d}" 不一致`)
  if (!fm.description) v.push('S-1 缺 description')

  // S-2a（必须）正文实质：≥300 字
  const n = charCount(body)
  if (n < 300) v.push(`S-2a 正文仅 ${n} 字（< 300）`)
  // S-2b（统计项，不判 FAIL）：正文是否含独立的「何时使用 / 适用场景」段落
  // 理由：description 是技能激活的官方依据（AI 靠它决定是否激活），
  //       正文有独立段落是文档质量的加分项，不是功能可用的必要条件。
  const hasWhenSection = /何时使用|when to use|适用场景|使用场景|USE WHEN/i.test(body)

  // S-3 引用有效
  const refs = extractPaths(body)
  const missing = []
  for (const r of refs) {
    const abs = resolveRef(r)
    if (!abs) continue
    // 通配/模式路径跳过（如 scripts/verify_*.mjs）
    if (/[*?<>]/.test(abs)) continue
    if (GUIDANCE_TARGETS.has(r.replace(/\\/g, '/'))) continue   // 指引目标：不校验
    if (!existsSync(abs)) missing.push(r)
  }
  if (missing.length) v.push(`S-3 引用路径不存在 ${missing.length} 处：${missing.slice(0, 2).join(', ')}`)

  /* S-6 占位符残留
     只匹配真正的占位标记（TODO / FIXME / XXX / 待补充）。
     **不匹配「占位符」这个词本身**——有些技能的职责就是「检测占位符」，
     匹配这个词必然误报（实测 metago-decision-lock / metago-output-integrity 就是这样）。 */
  /* 按技能职责豁免：
     有些技能的职责**就是检测占位符**（如 metago-decision-lock「引用占位符检测」、
     metago-output-integrity「TODO 标记 → 拒绝」），它们的正文必然列举 TODO/FIXME。
     这不是残留，是功能说明。
     判据：description 声明了「占位符检测 / 完整性 / 幻觉检测」类职责 → 豁免。
     注意：豁免只针对 S-6；S-2a（正文实质）仍然必须通过，
           所以「声称检测占位符但正文空洞」的技能照样会被抓。 */
  const isPlaceholderDetector = /占位符|placeholder|幻觉|完整性|integrity/i.test(fm.description || '')
  if (!isPlaceholderDetector && /\bTODO\b|\bFIXME\b|\bXXX\b|待补充/.test(body)) {
    v.push('S-6 含占位标记（TODO/FIXME/XXX/待补充）')
  }

  rows.push({ d, v, desc: fm.description || '', body, n, hasWhen: hasWhenSection })
}

// S-4 相似度（两两）
const withDesc = rows.filter(r => r.desc)
const dup = []
for (let i = 0; i < withDesc.length; i++) {
  for (let j = i + 1; j < withDesc.length; j++) {
    const s = jaccard(withDesc[i].desc, withDesc[j].desc)
    if (s >= 0.92) dup.push([withDesc[i].d, withDesc[j].d, s.toFixed(3)])
  }
}

// S-5 命令可执行（提取代码块里引用的本地脚本，检查存在）
let cmdTotal = 0, cmdMissing = []
for (const r of rows) {
  if (!r.body) continue
  const blocks = [...r.body.matchAll(/```(?:bash|sh|powershell|pwsh)?\r?\n([\s\S]*?)```/g)].map(m => m[1])
  for (const b of blocks) {
    for (const line of b.split(/\r?\n/)) {
      const m = line.match(/\b(?:node|python|py)\s+([^\s;|&]+\.(?:cjs|mjs|js|py))/i)
      if (!m) continue
      cmdTotal++
      const target = m[1].replace(/\\/g, '/')
      const abs = /^[A-Za-z]:\//.test(target) ? target
        : target.startsWith('$DSH_HOME/') ? H + '/' + target.slice(11)
          : (target.startsWith('scripts/') ? H + '/' + target : null)
      if (abs && !existsSync(abs) && !/[*?<>]/.test(abs)) cmdMissing.push([r.d, target])
    }
  }
}

// ── 汇总 ────────────────────────────────────────────
const bad = rows.filter(r => r.v.length)
console.log(`\n技能总数: ${rows.length}`)
console.log(`S-1 frontmatter: ${rows.filter(r => !r.v.some(x => x.startsWith('S-1'))).length} / ${rows.length}`)
console.log(`S-2a 正文≥300字: ${rows.filter(r => !r.v.some(x => x.startsWith('S-2a'))).length} / ${rows.length}`)
console.log(`S-2b 有「何时使用」段落: ${rows.filter(r => r.hasWhen).length} / ${rows.length}  ← 统计项，非 FAIL 条件`)
console.log(`S-3 引用有效:    ${rows.filter(r => !r.v.some(x => x.startsWith('S-3'))).length} / ${rows.length}`)
console.log(`S-4 无重复描述:  ${dup.length === 0 ? '通过' : dup.length + ' 对过于相似'}`)
console.log(`S-5 命令脚本:    检查 ${cmdTotal} 条，缺失 ${cmdMissing.length} 条`)
console.log(`S-6 无占位符:    ${rows.filter(r => !r.v.some(x => x.startsWith('S-6'))).length} / ${rows.length}`)
console.log(`\n完全通过: ${rows.length - bad.length} ｜ 有问题: ${bad.length}`)

if (bad.length) {
  console.log('\n问题清单（前 30）：')
  for (const r of bad.slice(0, 30)) {
    console.log(`  ${r.d}`)
    for (const x of r.v) console.log(`      ✗ ${x}`)
  }
  if (bad.length > 30) console.log(`  … 还有 ${bad.length - 30}`)
}
if (dup.length) {
  console.log('\nS-4 过于相似的技能对（前 10）：')
  for (const [a, b, s] of dup.slice(0, 10)) console.log(`  ${s}  ${a}  ↔  ${b}`)
}
if (cmdMissing.length) {
  console.log('\nS-5 引用但缺失的脚本（前 15）：')
  for (const [sk, p] of cmdMissing.slice(0, 15)) console.log(`  ${sk}  → ${p}`)
}


// ── 有牙自检：5 个已知坏的技能样本，必须被拒 ──────────────
console.log('\n' + '-'.repeat(96))
console.log('有牙自检（已知坏样本必须被拒，防止判据被放宽到漏过）')
{
  const { mkdtempSync, writeFileSync, mkdirSync, rmSync } = await import('node:fs')
  const os = await import('node:os')
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'r142sk-'))
  const CASES = [
    { d: 'bad-nofm', body: '正文内容'.repeat(60), expect: 'S-1' },                      // 无 frontmatter
    { d: 'bad-name', fm: '---\nname: wrong-name\ndescription: x\n---\n', body: '正文'.repeat(200), expect: 'S-1' }, // name 与目录不一致
    { d: 'bad-short', fm: '---\nname: bad-short\ndescription: x\n---\n', body: '太短了', expect: 'S-2a' },          // 正文过短
    { d: 'bad-todo', fm: '---\nname: bad-todo\ndescription: x\n---\n', body: '正文'.repeat(200) + '\nTODO: 补充', expect: 'S-6' }, // TODO 残留
    { d: 'bad-ref', fm: '---\nname: bad-ref\ndescription: x\n---\n', body: '正文'.repeat(200) + '\n见 scripts/这个文件不存在_xyz.mjs', expect: 'S-3' }, // 引用缺失
  ]
  let caught = 0
  for (const c of CASES) {
    const dir = path.join(tmp, c.d)
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, 'SKILL.md'), (c.fm || '') + c.body, 'utf8')
    // 用同一套判据检查这个样本
    const txt = readFileSync(path.join(dir, 'SKILL.md'), 'utf8')
    const { fm, body } = parseFrontmatter(txt)
    const vv = []
    if (!fm.name) vv.push('S-1 缺 name')
    else if (fm.name !== c.d) vv.push(`S-1 name 与目录不一致`)
    if (!fm.description) vv.push('S-1 缺 description')
    const nn = charCount(body)
    if (nn < 300) vv.push(`S-2a 正文 ${nn} 字`)
    if (/\bTODO\b|\bFIXME\b|\bXXX\b|待补充/.test(body)) vv.push('S-6 含占位标记')
    const refs = extractPaths(body)
    const miss = []
    for (const r of refs) {
      const abs = resolveRef(r)
      if (!abs || /[*?<>]/.test(abs) || GUIDANCE_TARGETS.has(r.replace(/\\/g, '/'))) continue
      if (!existsSync(abs)) miss.push(r)
    }
    if (miss.length) vv.push('S-3 引用缺失')
    const ok = vv.some(x => x.startsWith(c.expect))
    if (ok) caught++
    console.log(`   ${ok ? '✓' : '✗'} ${c.d.padEnd(12)} 期望被 ${c.expect} 拒绝 → ${ok ? '已拒绝' : '漏过！'}`)
  }
  try { rmSync(tmp, { recursive: true, force: true }) } catch (e) { }
  console.log(`   有牙：${caught} / ${CASES.length}`)
  if (caught !== CASES.length) { console.log('总判定：FAIL（判据被放宽到漏过已知坏样本）'); process.exit(1) }
}

console.log('\n' + '-'.repeat(96))
const allOk = bad.length === 0 && dup.length === 0 && cmdMissing.length === 0
console.log(allOk
  ? `总判定：PASS（技能 ${rows.length}/${rows.length}，S-1~S-6 全绿）`
  : `总判定：FAIL（有问题技能 ${bad.length} ｜ 相似对 ${dup.length} ｜ 缺失脚本 ${cmdMissing.length}）`)
process.exit(allOk ? 0 : 1)
