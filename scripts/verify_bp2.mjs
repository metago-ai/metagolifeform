// verify_bp2.mjs — 验证第二批 11 条实现的真实性（L-1/L-2/L-3 + 语义正确性）
import { createRequire } from 'node:module'

const M = createRequire('D:/metago-build/blueprint-atoms-2.cjs')('D:/metago-build/blueprint-atoms-2.cjs')

// A/B 两组「结构不同」的输入
const AB = {
  ATOM_NEWS_SUMMARY_304: [
    '本市发布新政支持中小企业。补贴最高可达五十万元。申报期为三个月。企业需提供营业执照和审计报告。政策旨在降低融资成本。预计覆盖两千家企业。',
    '全国科研经费投入持续增长。基础研究占比提升至百分之八。高校成为主要承担单位。企业研发投入也在增加。区域分布仍不均衡。东部地区领先明显。',
  ],
  ATOM_POLICY_TRANSLATE_101: [
    '符合条件的普惠性专项补贴，经申报核准后予以兑现，有效期内一事一议。',
    '鼓励企业开展技术试点，给予税收减免与贴息支持，需配套资金不低于30%。',
  ],
  ATOM_TECH_DEMYSTIFY_201: ['大模型是怎么工作的', '向量和RAG有什么关系'],
  ATOM_RES_IDEA_WITNESS_059: [
    { events: [{ stage: '萌芽', content: '想到用规则替代人工' }, { stage: '验证', content: '跑了三次对比' }, { stage: '成型', content: '收敛成标准流程' }] },
    { events: [{ stage: '调研', content: '看了 20 篇论文' }, { stage: '实现', content: '写了原型' }, { stage: '失败', content: '精度不够' }, { stage: '实现', content: '换算法重做' }] },
  ],
  ATOM_RES_NON_TECH_058: ['每天手工抄表太麻烦还容易错', '团队之间信息不对称，老是返工'],
  ATOM_RES_FRICTION_061: ['每天都在重复枯燥的录入，没意思', '一个人做，没人理解，说不清'],
  ATOM_FUSION_TAO_DAILY_043: ['最近做事太刚硬，处处对抗', '想让自己静下来，别那么贪多'],
  ATOM_RES_NEGENTROPY_066: [{ values: [0.9, 0.1, 0.1, 0.9] }, { values: [0.5, 0.5, 0.5, 0.5] }],
  ATOM_PEOPLE_BIO_006: [{ rr: [800, 810, 795, 805, 790, 815, 800], kind: 'hr' }, { rr: [800, 950, 780, 1000, 760, 980, 810], kind: 'hr' }],
  ATOM_PEOPLE_CAPTURE_001: ['我想把报表自动化', { text: '预算紧张', emoji: '😰' }],
  ATOM_EMOTION_RECOG_502: ['这个功能非常好用，我很满意', '太差了，完全不能用，我很失望'],
}

console.log('='.repeat(96))
console.log('第二批 11 条实现验证')
console.log('='.repeat(96))

let pass = 0
const rows = []
for (const id of Object.keys(M.IMPL).sort()) {
  const fn = M.IMPL[id]
  const [inA, inB] = AB[id] || [{}, { x: 1 }]
  let ra, rb, ea = null, eb = null
  try { ra = fn(inA) } catch (e) { ea = e.message }
  try { rb = fn(inB) } catch (e) { eb = e.message }
  const oa = ra && (ra.output !== undefined ? ra.output : ra)
  const ob = rb && (rb.output !== undefined ? rb.output : rb)
  const ok1 = !ea && ra && ra.ok !== false
  const ok2 = ok1 && oa && typeof oa === 'object' && Object.keys(oa).length > 0
  const sa = JSON.stringify(oa), sb = JSON.stringify(ob)
  const ok3 = ok2 && sb && sa !== sb
  const all = ok1 && ok2 && ok3
  if (all) pass++
  rows.push({ id, ok1, ok2, ok3, ea })
  console.log(`\n  ${all ? '✓' : '✗'} ${id}`)
  console.log(`      L-1 可调用 ${ok1 ? '✓' : '✗'}${ea ? ' ' + ea.slice(0, 50) : ''} ｜ L-2 有内容 ${ok2 ? '✓' : '✗'} ｜ L-3 有语义 ${ok3 ? '✓' : '✗'}`)
  if (ok2) {
    const brief = JSON.stringify(oa).slice(0, 150)
    console.log(`      A 组产物：${brief}`)
  }
}

// 语义正确性抽查（不只是「有输出」，要「输出对」）
console.log('\n' + '='.repeat(96))
console.log('语义正确性抽查')
console.log('='.repeat(96))
const checks = [
  ['时事摘要', () => {
    const r = M.IMPL.ATOM_NEWS_SUMMARY_304(AB.ATOM_NEWS_SUMMARY_304[0])
    const o = r.output
    return { ok: o.summaryLength < o.originalLength, detail: `摘要 ${o.summaryLength}B < 原文 ${o.originalLength}B，比例 ${o.ratio}` }
  }],
  ['政策翻译', () => {
    const r = M.IMPL.ATOM_POLICY_TRANSLATE_101(AB.ATOM_POLICY_TRANSLATE_101[0])
    const o = r.output
    return { ok: o.termCount > 0 && o.plain !== o.original, detail: `替换 ${o.termCount} 个术语，保留硬信息 ${o.hardFacts.length} 条` }
  }],
  ['科技祛魅', () => {
    const r = M.IMPL.ATOM_TECH_DEMYSTIFY_201('大模型')
    const o = r.output
    return { ok: o.matchedCount > 0 && /像/.test(o.plain), detail: `命中 ${o.matchedCount} 个术语，产物含类比` }
  }],
  ['负熵（高有序 vs 均质）', () => {
    const hi = M.IMPL.ATOM_RES_NEGENTROPY_066({ values: [0.9, 0.1, 0.1, 0.9] }).output
    const lo = M.IMPL.ATOM_RES_NEGENTROPY_066({ values: [0.5, 0.5, 0.5, 0.5] }).output
    return { ok: hi.negentropy > lo.negentropy, detail: `有序组负熵 ${hi.negentropy} > 均质组 ${lo.negentropy}` }
  }],
  ['生理信号（稳 vs 波动）', () => {
    const s = M.IMPL.ATOM_PEOPLE_BIO_006(AB.ATOM_PEOPLE_BIO_006[0]).output
    const v = M.IMPL.ATOM_PEOPLE_BIO_006(AB.ATOM_PEOPLE_BIO_006[1]).output
    return { ok: v.features.rmssd > s.features.rmssd, detail: `波动组 RMSSD ${v.features.rmssd} > 平稳组 ${s.features.rmssd}` }
  }],
  ['情绪识别（正 vs 负）', () => {
    const p = M.IMPL.ATOM_EMOTION_RECOG_502(AB.ATOM_EMOTION_RECOG_502[0]).output
    const n = M.IMPL.ATOM_EMOTION_RECOG_502(AB.ATOM_EMOTION_RECOG_502[1]).output
    return { ok: p['情绪'] !== n['情绪'], detail: `正面→${p['情绪']}(${p.confidence})，负面→${n['情绪']}(${n.confidence})` }
  }],
  ['想法向量归一化', () => {
    const o = M.IMPL.ATOM_PEOPLE_CAPTURE_001('我想把报表自动化').output
    const norm = Math.sqrt(o.ideaVector.reduce((a, v) => a + v * v, 0))
    return { ok: Math.abs(norm - 1) < 0.01, detail: `16 维向量模长 ${norm.toFixed(4)} ≈ 1` }
  }],
  ['思想传记章节数', () => {
    const o = M.IMPL.ATOM_RES_IDEA_WITNESS_059(AB.ATOM_RES_IDEA_WITNESS_059[0]).output
    return { ok: o.chapterCount === 3 && o.turningPoints.length === 2, detail: `${o.chapterCount} 章 / ${o.turningPoints.length} 个转折点` }
  }],
  ['空输入必须拒绝', () => {
    const r = M.IMPL.ATOM_NEWS_SUMMARY_304('')
    return { ok: r.ok === false && r.reason, detail: `空文本 → ok:false, reason:${r.reason}` }
  }],
  ['未命中术语不编造', () => {
    const o = M.IMPL.ATOM_TECH_DEMYSTIFY_201('量子色动力学').output
    return { ok: o.matchedCount === 0 && /未在内置术语库/.test(o.plain), detail: '未命中 → 明确告知，不编造解释' }
  }],
]
let semOk = 0
for (const [name, fn] of checks) {
  let r
  try { r = fn() } catch (e) { r = { ok: false, detail: '异常:' + e.message.slice(0, 50) } }
  if (r.ok) semOk++
  console.log(`  ${r.ok ? '✓' : '✗'} ${name.padEnd(24)} ${r.detail}`)
}

console.log('\n' + '-'.repeat(96))
console.log(`L-1/L-2/L-3：${pass} / ${Object.keys(M.IMPL).length}`)
console.log(`语义抽查：${semOk} / ${checks.length}`)
console.log(`仍不支持：${M.STILL_UNSUPPORTED.length} 条（真需视觉模型/物理设备/训练好的解码器）`)
M.STILL_UNSUPPORTED.forEach(x => console.log('  - ' + x))
const allOk = pass === Object.keys(M.IMPL).length && semOk === checks.length
console.log(allOk ? '\n总判定：PASS' : '\n总判定：FAIL')
process.exit(allOk ? 0 : 1)
