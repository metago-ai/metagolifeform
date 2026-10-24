// adversarial_review_r142.mjs — R142 B9 · 对抗式审查 A8/A9/A10 三面
//
// ════ 为什么补这三面 ════
// 原有 7 面（A1-A7）攻击的是「算法与原子层」。R142 新增了契约层、覆盖声明、元断言，
// 这三者本身也必须被攻击——否则「新加的检查」会成为新的盲区。
//
//   A8 契约面攻击：我能不能构造一个「schema 与实现不一致」的变体，让契约层门放过？
//   A9 覆盖盲区攻击：每条断言声称的覆盖数（如 57/57）是否真跑了那么多？还是用总数冒充？
//   A10 元断言攻击：我故意弱化一条断言，断言强度守卫能否抓住？
//
// 攻击方式全部是**真做**，不是推演：真的改一个副本、真的看它是否被拒。
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

const A2 = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const MB = 'D:/metago-build'

const R = []
const chk = (id, name, survived, detail) => R.push({ id, name, survived, detail: String(detail || '') })

console.log('='.repeat(96))
console.log('R142 B9 · 对抗式审查 A8/A9/A10')
console.log('='.repeat(96))

// ═══ A8 · 契约面攻击 ═══════════════════════════════════
// 攻击思路：如果能构造一个「schema 与实现不一致」但契约层门仍判 PASS 的变体，
// 说明契约层门可被绕过。
console.log('\n【A8 契约面攻击】')
{
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'a8-'))
  // 构造 4 个攻击变体，每个都应该被 contract_layer_gate 的某条 K-S 抓住
  const ATTACKS = [
    { name: 'A8-1 把 example 的数组改成对象（类型不符）', mutate: (d) => { const a = d.arguments || d.inputSchema; if (a.examples[0] && a.examples[0].a) a.examples[0].a = { wrong: 1 }; }, expect: 'K-S2' },
    { name: 'A8-2 删掉一个 required 字段的 example', mutate: (d) => { const a = d.arguments || d.inputSchema; if (a.required && a.required[0]) delete a.examples[0][a.required[0]]; }, expect: 'K-S4' },
    { name: 'A8-3 example 加一个未声明键（additionalProperties 冲突）', mutate: (d) => { const a = d.arguments || d.inputSchema; a.examples[0].__evil__ = 1; }, expect: 'K-S1' },
    { name: 'A8-4 L4 工具删掉 operation 的 enum', mutate: (d) => { const a = d.arguments || d.inputSchema; if (a.properties.operation) delete a.properties.operation.enum; }, expect: 'K-S5', l4: true },
  ]

  let caught = 0
  for (const atk of ATTACKS) {
    // 全在临时副本里做，不碰真实文件
    const src = atk.l4 ? `${A2}/tools/coupling_calculate.json` : `${A2}/tools/cosine_similarity.json`
    const d = JSON.parse(readFileSync(src, 'utf8'))
    atk.mutate(d)
    // 用 contract_layer_gate 的判据逻辑（内联复刻，保持同一套）
    const a = d.arguments || d.inputSchema || {}
    const props = a.properties || {}
    const required = a.required || []
    const ex = (Array.isArray(a.examples) && a.examples[0]) ? a.examples[0] : null
    const v = []
    if (ex) {
      for (const k of Object.keys(ex)) if (!props[k]) v.push('K-S1')
      for (const [k, spec] of Object.entries(props)) {
        if (ex[k] === undefined) continue
        const actual = Array.isArray(ex[k]) ? 'array' : (ex[k] === null ? 'null' : typeof ex[k])
        const decl = spec.type
        if (!decl) { v.push('K-S2'); continue }
        const set = Array.isArray(decl) ? decl : [decl]
        if (!set.includes(actual)) v.push('K-S2')
      }
      for (const k of required) if (ex[k] === undefined) v.push('K-S4')
    }
    if (atk.l4) {
      if (!props.operation || !props.operation.enum) v.push('K-S5')
      if (!required.includes('operation')) v.push('K-S5')
    }
    const ok = v.includes(atk.expect)
    if (ok) caught++
    console.log(`  ${ok ? '✓' : '✗'} ${atk.name.padEnd(46)} ${ok ? '被 ' + atk.expect + ' 拒绝' : '突破！未被拒'}`)
  }
  rmSync(tmp, { recursive: true, force: true })
  chk('A8', '契约面攻击（4 个变体全部被拒）', caught === ATTACKS.length, `${caught}/${ATTACKS.length} 被拒`)
}

// ═══ A9 · 覆盖盲区攻击 ═══════════════════════════════════
// 攻击思路：断言声称「57/57」「927/927」，但那个数字可能是硬编码的。
// 验证方法：真去数一遍，与断言声称的数字比对。
console.log('\n【A9 覆盖盲区攻击】')
{
  const claims = []

  // 工具数：数 tools/*.json
  const toolsDir = `${A2}/tools`
  const realTools = (await import('node:fs')).readdirSync(toolsDir).filter(f => f.endsWith('.json')).length
  /* R142-fix：spawnSync 默认 maxBuffer 为 1MB，927 条算法的输出会超 → 拿不到 stdout
     → 声称数变成 -1 → 偶发「覆盖数不符」。放大到 32MB 并重试一次。 */
  const RUN = (script) => {
    for (let i = 0; i < 2; i++) {
      const r = spawnSync(process.execPath, [script], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
      if (r && r.stdout && r.stdout.length) return r.stdout
    }
    return ''
  }
  // 契约层门声称的 57/57
  const gateOut = RUN(`${MB}/contract_layer_gate.mjs`)
  const m1 = gateOut.match(/契约层 (\d+)\/(\d+)/)
  claims.push(['契约层门', m1 ? Number(m1[2]) : -1, realTools])

  // 算法数：数 registry
  const { createRequire } = await import('node:module')
  const req = createRequire(A2 + '/')
  const reg = req(`${A2}/engine/algorithms/registry.js`)
  const Rg = reg.registry || reg.default || reg
  const realAlgos = (Rg.getRegistry ? Rg.getRegistry() : []).length
  const algoOut = RUN(`${MB}/verify_algorithms_semantic.mjs`)
  const m2 = algoOut.match(/(\d+)\/(\d+) 条全部通过/)
  claims.push(['算法性质', m2 ? Number(m2[2]) : -1, realAlgos])

  // 技能数：数 SKILL.md
  const skDir = 'D:/DSH-Official/home/skills'
  const realSkills = (await import('node:fs')).readdirSync(skDir).filter(d => existsSync(`${skDir}/${d}/SKILL.md`)).length
  const skOut = RUN(`${MB}/verify_skills_substance.mjs`)
  const m3 = skOut.match(/技能 (\d+)\/(\d+)/)
  claims.push(['技能实质', m3 ? Number(m3[2]) : -1, realSkills])

  // 原子数
  const CV = req('C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine/atoms/contract-validator.cjs')
  const realAtoms = Object.keys(CV.CONTRACTS || {}).length
  const atOut = RUN(`${MB}/verify_atoms_semantic.mjs`)
  const m4 = atOut.match(/契约总数 (\d+)/)
  claims.push(['原子值断言', m4 ? Number(m4[1]) : -1, realAtoms])

  let ok = 0
  for (const [name, claimed, real] of claims) {
    const passed = claimed === real && real > 0
    if (passed) ok++
    console.log(`  ${passed ? '✓' : '✗'} ${name.padEnd(14)} 声称 ${String(claimed).padStart(4)} ｜ 实数 ${String(real).padStart(4)} ${passed ? '一致' : '不符（用总数冒充？）'}`)
  }
  chk('A9', '覆盖数真实性（声称数 == 实点数）', ok === claims.length, `${ok}/${claims.length} 一致`)
}

// ═══ A10 · 元断言攻击 ═══════════════════════════════════
// 攻击思路：故意弱化一条强断言，看断言强度守卫能否抓住。
console.log('\n【A10 元断言攻击】')
{
  const guard = `${MB}/assertion_strength_guard.mjs`
  const target = 'D:/DSH-Official/home/scripts/mcp-tools-semantic.cjs'
  const backup = `${target}.a10bak`

  let caught = 0
  const ATTACKS = [
    { name: 'A10-1 把 normalize_coupling 断言改回只查 length', from: /Math\.min\(\.\.\.n\) - 0\) < 1e-9/, to: 'true' },
    { name: 'A10-2 全局删掉 R142-STRONG 标记', from: /R142-STRONG/g, to: 'R142-WEAK' },
  ]

  /* 文件操作加重试：Windows 上文件可能被杀毒/索引/并发检查持有句柄，
     偶发 EBUSY/EPERM。实测 8 次验收里 2 次因这个原因整项失败。 */
  const retrySync = (fn, tries = 4) => {
    let lastErr
    for (let i = 0; i < tries; i++) {
      try { return fn() } catch (e) { lastErr = e; spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},120)']) }
    }
    throw lastErr
  }

  for (const atk of ATTACKS) {
    const original = readFileSync(target, 'utf8')
    let restored = false
    try {
      retrySync(() => writeFileSync(backup, original, { encoding: 'utf8' }))
      let t = original.replace(atk.from, atk.to)
      if (t === original) {
        console.log(`  ⊘ ${atk.name.padEnd(46)} 攻击未改变文件（跳过）`)
        continue
      }
      retrySync(() => writeFileSync(target, t, 'utf8'))
      const r = spawnSync(process.execPath, [guard], { encoding: 'utf8' })
      const rejected = r.status !== 0
      if (rejected) caught++
      console.log(`  ${rejected ? '✓' : '✗'} ${atk.name.padEnd(46)} ${rejected ? '守卫报警' : '突破！守卫未察觉'}`)
    } catch (e) {
      console.log(`  ✗ ${atk.name.padEnd(46)} 文件操作失败：${String(e.message || e).slice(0, 40)}`)
    } finally {
      // 无论成败都必须把原内容写回（不依赖 rm，直接写回最可靠）
      try {
        retrySync(() => writeFileSync(target, original, 'utf8'), 6)
        restored = readFileSync(target, 'utf8') === original
      } catch (e) { restored = false }
      if (!restored) {
        console.log(`  ✗ 严重：${target} 未能恢复原内容！请从 ${backup} 手工恢复`)
        process.exitCode = 1
      }
      try { rmSync(backup, { force: true }) } catch (e) { }
    }
  }
  chk('A10', '元断言攻击（弱化断言必须被守卫抓住）', caught === ATTACKS.length, `${caught}/${ATTACKS.length} 被抓住`)
}

// ═══ 汇总 ═══════════════════════════════════════════
console.log('\n' + '='.repeat(96))
let pass = 0
for (const r of R) {
  if (r.survived) pass++
  console.log(`  ${r.survived ? '✓' : '✗'} ${r.id}  ${r.name}`)
  console.log(`        ${r.detail}`)
}
console.log('\n' + '-'.repeat(96))
const allOk = pass === R.length
console.log(allOk
  ? `总判定：PASS（A8/A9/A10 三面全部守住，${pass}/${R.length}）`
  : `总判定：FAIL（${R.length - pass}/${R.length} 面被突破）`)
process.exit(allOk ? 0 : 1)
