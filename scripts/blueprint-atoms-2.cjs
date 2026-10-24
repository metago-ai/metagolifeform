// blueprint-atoms-2.cjs — 第二批：把「需模型/需硬件」里能确定性实现的部分做掉
//
// 为什么能有第二批：
//   上一轮我把「契约产物是自然语言」直接判成「需大模型」。这个判断太粗。
//   自然语言产物有多种确定性生成方式：
//     · 抽取式摘要（词频/位置/TextRank 打分选原句）——不需要生成，只需要选择
//     · 模板填充（结构化数据 + 句式模板）——产物是文本，但由数据决定
//     · 规则库匹配（特征 → 预设策略）——产物的选择由规则决定
//     · 术语表替换（专业词 → 通俗词 + 类比）——改写而非创作
//     · 信号特征提取（HRV 时域/频域指标）——纯数学
//
// 纪律（不许造假）：
//   · 每条都必须有真实算法，产物由输入决定，不同输入必须给出不同产物
//   · 做不到的（真需视觉模型/真需物理设备/真需训练好的解码器）继续诚实标注，不硬凑
'use strict'

const r4 = x => { const v = Number(x); if (!isFinite(v)) return null; const s = v * 1e4; return isFinite(s) ? Math.round(s) / 1e4 : v }
const toArr = v => Array.isArray(v) ? v : (v === null || v === undefined ? [] : [v])
const toNum = v => { const n = Number(v); return isFinite(n) ? n : 0 }
const clamp01 = x => Math.max(0, Math.min(1, Number(x) || 0))

// ── 中文分句 / 分词（无依赖，用于摘要与关键词）────────────
function splitSentences(text) {
  return String(text || '')
    .split(/(?<=[。！？；\n])/g)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}
function tokenize(text) {
  const t = String(text || '')
  const cjk = t.match(/[\u4e00-\u9fa5]{2,4}/g) || []
  const en = (t.toLowerCase().match(/[a-z][a-z0-9\-]{2,}/g) || [])
  const num = t.match(/\d+(?:\.\d+)?%?/g) || []
  return [...cjk, ...en, ...num]
}

// ══════════════════════════════════════════════════════════════
// 1. 时事摘要生成（ATOM_NEWS_SUMMARY_304）：抽取式摘要
//    算法：词频 × 位置权重 × 长度惩罚 → 选 top-N 原句按原序拼接
// ══════════════════════════════════════════════════════════════
function newsSummary(input) {
  const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : { text: String(input || '') }
  const text = String(o.text || o.news || o.article || o.content || (typeof input === 'string' ? input : ''))
  if (!text.trim()) return { ok: false, success: false, reason: 'EMPTY_TEXT', message: '缺少待摘要文本' }
  const sents = splitSentences(text)
  if (!sents.length) return { ok: false, success: false, reason: 'NO_SENTENCE', message: '无法分句' }

  // 词频表（去停用词）
  const STOP = new Set(['我们', '他们', '这个', '那个', '可以', '已经', '表示', '进行', '通过', '以及', '但是', '因为', '所以', '如果', '并且', '或者', '目前', '同时', '此外'])
  const tf = {}
  for (const s of sents) for (const w of tokenize(s)) { if (!STOP.has(w)) tf[w] = (tf[w] || 0) + 1 }

  // 每句打分：词频均值 × 位置权重（首尾句加权）× 长度惩罚
  const scored = sents.map((s, i) => {
    const ws = tokenize(s).filter(w => !STOP.has(w))
    const freq = ws.length ? ws.reduce((a, w) => a + (tf[w] || 0), 0) / ws.length : 0
    const posW = i === 0 ? 1.3 : (i === sents.length - 1 ? 1.15 : 1.0)
    const lenPenalty = s.length > 120 ? 0.85 : (s.length < 8 ? 0.6 : 1.0)
    return { i, text: s, score: r4(freq * posW * lenPenalty), len: s.length }
  })

  const maxSent = Math.max(1, Math.min(toNum(o.maxSentences) || Math.ceil(sents.length * 0.35), 8))
  const picked = scored.slice().sort((a, b) => b.score - a.score).slice(0, maxSent).sort((a, b) => a.i - b.i)

  // 关键词：词频 top-8
  const keywords = Object.keys(tf).sort((a, b) => tf[b] - tf[a]).slice(0, 8).map(w => ({ word: w, freq: tf[w] }))

  const summary = picked.map(p => p.text).join('')
  const ratio = r4(summary.length / Math.max(1, text.length))
  return {
    ok: true, success: true,
    output: {
      summary, summaryLength: summary.length, originalLength: text.length, ratio,
      sentenceCount: sents.length, pickedCount: picked.length,
      picked: picked.map(p => ({ index: p.i, score: p.score, text: p.text })),
      keywords,
      method: 'extractive-tf-pos',
    },
    provenance: ['[BP2_ATOM_NEWS_SUMMARY_304] 抽取式摘要：词频×位置权重×长度惩罚，选句不生成'],
  }
}

// ══════════════════════════════════════════════════════════════
// 2. 政策翻译官（ATOM_POLICY_TRANSLATE_101）：术语表替换 + 句式通俗化
// ══════════════════════════════════════════════════════════════
const POLICY_TERMS = [
  [['普惠性', '普惠'], '覆盖面广、大家都够得着'],
  [['专项', '专项资金'], '为某件事单独拨的钱'],
  [['申报'], '提交申请'],
  [['核准', '核定'], '官方审核后确定'],
  [['备案'], '登记留档'],
  [['补贴'], '政府给的钱'],
  [['税收减免', '减免税'], '少交税'],
  [['贴息'], '政府帮你付一部分利息'],
  [['配套资金'], '要求你自筹一部分钱'],
  [['门槛'], '最低条件'],
  [['资质'], '官方认可的资格'],
  [['兑现'], '把钱或政策落到实处'],
  [['实施细则'], '具体怎么操作的规定'],
  [['有效期内'], '在规定时间内'],
  [['主体'], '申请人或单位'],
  [['统筹'], '统一安排'],
  [['试点'], '先在小范围试'],
  [['梯度'], '分档次'],
  [['动态调整'], '会随情况变化'],
  [['一事一议'], '每一件单独商量'],
]
function policyTranslate(input) {
  const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : { text: String(input || '') }
  const raw = String(o.text || o.policy || o.content || (typeof input === 'string' ? input : ''))
  if (!raw.trim()) return { ok: false, success: false, reason: 'EMPTY_TEXT', message: '缺少政策原文' }

  /* 方案：**括号注释**，不重写句子。
     理由：纯规则改写做不到通顺（它不懂语法），强行替换只会产出「词对但句错」的乱码。
     保留原文结构、在术语后加括号解释，既通顺又不丢信息——这才是真实可用的产物。 */
  const applied = []
  let annotated = raw
  for (const [keys, rep] of POLICY_TERMS) {
    for (const k of keys) {
      if (annotated.indexOf(k) < 0) continue
      // 避免重复注释（该术语已被括注过）
      const already = new RegExp(k + '（[^）]*）').test(annotated)
      if (!already) annotated = annotated.split(k).join(k + '（' + rep + '）')
      applied.push({ term: k, plain: rep })
      break
    }
  }
  // 清理可能的嵌套括号与重复标点
  annotated = annotated.replace(/（([^（）]*)）（([^（）]*)）/g, '（$1）')
  annotated = annotated.replace(/[。；]{2,}/g, '。')

  // 分句（>55 字按逗号切，避免长句难读）
  const sentences = splitSentences(annotated)
    .flatMap(s => s.replace(/（[^）]*）/g, '').length > 55 ? s.split(/[，,]/).map(x => x.trim()).filter(Boolean).map(x => x + '。') : [s])

  // 硬信息（数字/期限/金额）：单独抽出来，这些是不能改写的
  const facts = (raw.match(/\d+(?:\.\d+)?\s*(?:%|万元|亿元|元|个工作日|天|月|年)/g) || [])

  // 术语对照表（供用户逐条核对）
  const table = applied.map(a => ({ 术语: a.term, 通俗: a.plain }))

  return {
    ok: true, success: true,
    output: {
      // 主产物：注释版原文（通顺、信息无损）
      annotated,
      // 副产物：术语对照表
      glossary: table,
      termCount: applied.length,
      original: raw,
      hardFacts: [...new Set(facts)],
      sentenceCount: sentences.length,
      // 能力边界：明确这是「加注」不是「重写」
      method: 'inline-gloss',
      note: '本实现给政策术语加括号注释，保留原文结构；不做整句重写（纯规则无法保证改写后通顺）。',
    },
    provenance: ['[BP2_ATOM_POLICY_TRANSLATE_101] 术语内联注释：保留原文 + 括号解释 + 术语对照表；硬信息不改写'],
  }
}

// ══════════════════════════════════════════════════════════════
// 3. 科技祛魅器（ATOM_TECH_DEMYSTIFY_201）：术语表 + 类比库
// ══════════════════════════════════════════════════════════════
const TECH_TERMS = [
  [['大模型', 'LLM', '大语言模型'], '读过海量文字、学会接话茬的程序', '像一个读完全市图书馆、能跟你聊任何话题的人'],
  [['神经网络'], '模仿脑细胞连接方式的计算结构', '像一张巨大的网，每个结都在传小纸条'],
  [['训练'], '拿大量例子反复调整参数', '像反复做题对答案，慢慢摸出规律'],
  [['推理'], '训练好之后用来回答问题', '像考场上用学到的东西答题'],
  [['向量', 'embedding'], '把东西变成一串数字', '像给每样东西编一个坐标，意思近的坐标就挨得近'],
  [['微调'], '在通用模型上再用专门数据调一遍', '像大学毕业后又上了个岗位培训班'],
  [['RAG', '检索增强'], '先去资料库找答案再回答', '像开卷考试，先翻书再写'],
  [['Agent', '智能体'], '能自己规划并动手做事的程序', '像不只是出主意，还真的替你去办'],
  [['算力'], '计算能力，通常指 GPU 数量', '像厨房里的灶眼数，越多同时炒的菜越多'],
  [['参数'], '模型内部可调的数值', '像收音机上密密麻麻的旋钮'],
  [['token'], '文本被切成的最小单位', '像把句子切成积木块来数'],
  [['对齐'], '让模型行为符合人的期望', '像给它立规矩、教它分寸'],
  [['幻觉'], '模型编出看似合理但不存在的内容', '像记错了却讲得理直气壮'],
  [['多模态'], '能同时处理文字图片声音等', '像不只看字，还能看图听声'],
]
function techDemystify(input) {
  const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : { term: String(input || '') }
  const term = String(o.term || o.text || o.name || (typeof input === 'string' ? input : ''))
  if (!term.trim()) return { ok: false, success: false, reason: 'EMPTY_TERM', message: '缺少待解释术语' }
  const hits = []
  for (const [keys, what, analogy] of TECH_TERMS) {
    if (keys.some(k => term.indexOf(k) >= 0 || k.toLowerCase() === term.toLowerCase())) {
      hits.push({ term: keys[0], what, analogy })
    }
  }
  const plain = hits.length
    ? hits.map(h => `「${h.term}」就是${h.what}。${h.analogy}。`).join('')
    : `「${term}」未在内置术语库中。已知 ${TECH_TERMS.length} 个术语，可尝试其中的一个。`
  return {
    ok: true, success: true,
    output: { term, plain, matched: hits, matchedCount: hits.length, librarySize: TECH_TERMS.length, method: 'term-analogy-table' },
    provenance: ['[BP2_ATOM_TECH_DEMYSTIFY_201] 术语表 + 类比库；未命中时明确告知而不是编造'],
  }
}

// ══════════════════════════════════════════════════════════════
// 4. 思想见证器（ATOM_RES_IDEA_WITNESS_059）：事件序列 → 结构化传记
// ══════════════════════════════════════════════════════════════
function ideaWitness(input) {
  const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : { events: toArr(input) }
  const events = toArr(o.events || o.timeline || o.process || o.actions)
  if (!events.length) return { ok: false, success: false, reason: 'NO_EVENTS', message: '缺少创意过程事件' }
  const norm = events.map((e, i) => {
    if (typeof e === 'string') return { index: i, stage: '事件', content: e, at: null }
    return {
      index: i,
      stage: String((e && (e.stage || e.phase || e.type)) || '事件'),
      content: String((e && (e.content || e.text || e.note || e.what)) || JSON.stringify(e)),
      at: (e && (e.at || e.time || e.timestamp)) || null,
    }
  })
  // 按阶段聚类，形成"传记"结构
  const stages = {}
  for (const n of norm) (stages[n.stage] = stages[n.stage] || []).push(n)
  const chapterNames = Object.keys(stages)
  const chapters = chapterNames.map((name, i) => ({
    chapter: i + 1, name,
    events: stages[name],
    summary: `${name}阶段共 ${stages[name].length} 次记录：` + stages[name].slice(0, 3).map(x => x.content.slice(0, 24)).join('；'),
  }))
  // 传记正文（模板填充，内容由事件决定）
  const bio = chapters.map(c => `第${c.chapter}章 ${c.name}\n${c.summary}`).join('\n\n')
  // 提取转折点（阶段切换处）
  const turns = []
  for (let i = 1; i < norm.length; i++) if (norm[i].stage !== norm[i - 1].stage) turns.push({ at: norm[i].index, from: norm[i - 1].stage, to: norm[i].stage })
  return {
    ok: true, success: true,
    output: {
      biography: bio, chapters, chapterCount: chapters.length,
      eventCount: norm.length, turningPoints: turns,
      span: norm.length > 1 ? `${norm[0].index} → ${norm[norm.length - 1].index}` : '单事件',
      method: 'event-cluster-template',
    },
    provenance: ['[BP2_ATOM_RES_IDEA_WITNESS_059] 事件按阶段聚类 → 模板化传记；正文由事件内容决定，不是固定文本'],
  }
}

// ══════════════════════════════════════════════════════════════
// 5. 非技术转化器（ATOM_RES_NON_TECH_058）：模式映射 → 结构化方案
// ══════════════════════════════════════════════════════════════
const NON_TECH_PATTERNS = [
  { key: /太麻烦|太慢|等待|排队|手工|重复/, domain: '流程自动化', tech: ['任务编排', 'RPA', '批处理'], skeleton: ['识别重复步骤', '定义输入输出', '串成流水线', '加人工复核点'] },
  { key: /记不住|找不到|忘了|乱|分散|版本/, domain: '知识管理', tech: ['结构化存储', '全文检索', '版本控制'], skeleton: ['统一入口', '建立索引', '按语义检索', '留痕与回溯'] },
  { key: /沟通|协调|对齐|误解|信息不对称/, domain: '协同系统', tech: ['统一状态源', '变更通知', '权限分层'], skeleton: ['统一数据源', '事件驱动通知', '冲突检测', '责任归属'] },
  { key: /算不清|统计|报表|核对|数据/, domain: '数据管道', tech: ['ETL', '指标口径', '自动校验'], skeleton: ['统一口径', '采集清洗', '计算指标', '异常告警'] },
  { key: /质量|出错|返工|检查/, domain: '质量门禁', tech: ['自动化校验', '测试基线', '门禁阻断'], skeleton: ['定义验收判据', '自动化检查', '不通过即阻断', '回归对比'] },
  { key: /客户|用户|反馈|需求/, domain: '需求管理', tech: ['反馈归集', '优先级评分', '闭环追踪'], skeleton: ['统一收集', '结构化打标', '加权排序', '闭环验证'] },
]
function nonTechTransform(input) {
  const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : { idea: String(input || '') }
  const idea = String(o.idea || o.text || o.problem || (typeof input === 'string' ? input : ''))
  if (!idea.trim()) return { ok: false, success: false, reason: 'EMPTY_IDEA', message: '缺少待转化想法' }
  const hits = NON_TECH_PATTERNS.filter(p => p.key.test(idea))
  const chosen = hits.length ? hits : [NON_TECH_PATTERNS[0]]
  const plans = chosen.map((p, i) => ({
    plan: i + 1, domain: p.domain,
    candidateTech: p.tech,
    steps: p.skeleton.map((s, j) => ({ step: j + 1, action: s })),
    // 可行性：命中越多关键词越确定
    confidence: r4(Math.min(1, (p.key.test(idea) ? 0.6 : 0.3) + (chosen.length === 1 ? 0.3 : 0.1))),
  }))
  return {
    ok: true, success: true,
    output: { idea, plans, planCount: plans.length, matchedPatterns: hits.length, librarySize: NON_TECH_PATTERNS.length, method: 'pattern-to-plan' },
    provenance: ['[BP2_ATOM_RES_NON_TECH_058] 问题特征匹配 → 领域 + 技术候选 + 步骤骨架；未命中时给最通用域并标低置信'],
  }
}

// ══════════════════════════════════════════════════════════════
// 6. 摩擦致敬器（ATOM_RES_FRICTION_061）：痛苦表达 → 创造力路径
// ══════════════════════════════════════════════════════════════
const FRICTION_RULES = [
  { key: /重复|枯燥|机械|没意思/, path: '把重复抽象成模板/工具', lever: '自动化', quote: '摩擦点=可自动化的边界' },
  { key: /不会|不懂|学不会|难/, path: '把难点拆成最小可学单元', lever: '拆解', quote: '卡住的地方=知识缺口的位置' },
  { key: /没人理解|说不清|沟通/, path: '把隐性经验显性化', lever: '形式化', quote: '说不清=还没想清' },
  { key: /时间不够|来不及|太忙/, path: '找出真正的瓶颈环节', lever: '最小干预', quote: '忙=优先级没排完' },
  { key: /做不完|太多|撑不住/, path: '按价值/成本二维筛选', lever: '取舍', quote: '做不完=该砍的没砍' },
  { key: /失败|错|返工|白做/, path: '把失败转成可复用的检查项', lever: '沉淀', quote: '每次返工都是一条没写下的规则' },
  { key: /不公平|凭什么|委屈/, path: '把隐含规则写成显式规则', lever: '显式化', quote: '不公平感=规则不透明的信号' },
  { key: /孤独|没人|一个人/, path: '找同类问题的人共建', lever: '耦生', quote: '孤独=还没找到共振频率' },
]
function frictionTribute(input) {
  const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : { text: String(input || '') }
  const text = String(o.text || o.pain || o.content || (typeof input === 'string' ? input : ''))
  if (!text.trim()) return { ok: false, success: false, reason: 'EMPTY_TEXT', message: '缺少痛苦表达' }
  const hits = FRICTION_RULES.filter(r => r.key.test(text))
  const paths = (hits.length ? hits : [FRICTION_RULES[1]]).map((r, i) => ({
    path: i + 1, trigger: text.match(r.key)?.[0] || r.key.source,
    creativePath: r.path, lever: r.lever, insight: r.quote,
  }))
  return {
    ok: true, success: true,
    output: {
      paths, pathCount: paths.length, matchedRules: hits.length, librarySize: FRICTION_RULES.length,
      // 强度：命中规则数越多，说明这个痛苦越"结构化"，越可转化
      transformability: r4(clamp01(hits.length / 3)),
      method: 'friction-rule-library',
    },
    provenance: ['[BP2_ATOM_RES_FRICTION_061] 痛苦表达特征 → 创造力路径规则库；可转化度=命中规则数/3'],
  }
}

// ══════════════════════════════════════════════════════════════
// 7. 道在日常显现器（ATOM_FUSION_TAO_DAILY_043）：场景 → 道之提示
// ══════════════════════════════════════════════════════════════
const TAO_SCENES = [
  { key: /水|流|柔|退让/, hint: '水不争而利万物——以退为进，绕开硬处', principle: '柔弱胜刚强' },
  { key: /谷|空|虚|留白|空杯/, hint: '谷因其空而能容——留出空白才有余地', principle: '虚室生白' },
  { key: /生长|发芽|养|慢/, hint: '揠苗助长不如静待其时——生长有其节律', principle: '无为而无不为' },
  { key: /反复|循环|周而复始|四季/, hint: '反者道之动——循环不是重复，是螺旋上升', principle: '反者道之动' },
  { key: /刚|硬|强|对抗/, hint: '刚易折，柔常存——过刚处往往先断', principle: '守柔曰强' },
  { key: /少|简|减|舍/, hint: '为学日益，为道日损——减去多余的才见本质', principle: '损之又损' },
  { key: /静|定|安|沉/, hint: '静为躁君——先静下来，躁动自息', principle: '致虚极，守静笃' },
  { key: /知足|满|贪|多/, hint: '知足不辱，知止不殆——知道停的人才走得远', principle: '知止不殆' },
  { key: /始|终|成|败/, hint: '慎终如始，则无败事——收尾时仍如开头般谨慎', principle: '慎终如始' },
  { key: /大|巨|宏|远/, hint: '天下大事必作于细——再大的事也从最小处起', principle: '图难于其易' },
]
function taoDaily(input) {
  const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : { scene: String(input || '') }
  const scene = String(o.scene || o.text || o.content || (typeof input === 'string' ? input : ''))
  if (!scene.trim()) return { ok: false, success: false, reason: 'EMPTY_SCENE', message: '缺少日常场景' }
  const hits = TAO_SCENES.filter(s => s.key.test(scene))
  const hints = (hits.length ? hits : [TAO_SCENES[5]]).map((s, i) => ({
    index: i + 1, scene: scene.match(s.key)?.[0] || '', hint: s.hint, principle: s.principle,
  }))
  return {
    ok: true, success: true,
    output: {
      scene, hints, hintCount: hints.length, matchedScenes: hits.length, librarySize: TAO_SCENES.length,
      // 只给提示，不做吉凶断言（避免超出可验证范围）
      disclaimer: '提示为经典文本的场景映射，不构成对现实结果的预测',
      method: 'scene-to-classic',
    },
    provenance: ['[BP2_ATOM_FUSION_TAO_DAILY_043] 场景特征 → 经典文本提示；仅映射不预测'],
  }
}

// ══════════════════════════════════════════════════════════════
// 8. 负熵责任器（ATOM_RES_NEGENTROPY_066）：指标 → 结构化负熵报告
// ══════════════════════════════════════════════════════════════
function negentropyReport(input) {
  const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : { values: toArr(input) }
  const vals = toArr(o.values || o.series || o.state || o.metrics).map(toNum).filter(v => isFinite(v))
  if (vals.length < 2) return { ok: false, success: false, reason: 'TOO_FEW_VALUES', message: '至少需要 2 个数值' }
  // Shannon 熵（归一化到 [0,1]）
  const sum = vals.reduce((a, b) => a + Math.abs(b), 0) || 1
  const ps = vals.map(v => Math.abs(v) / sum)
  const H = -ps.reduce((a, p) => a + (p > 0 ? p * Math.log(p) : 0), 0)
  const Hmax = Math.log(vals.length)
  const normalized = Hmax ? r4(H / Hmax) : 0
  // 负熵 = 1 - 归一化熵（越有序越高）
  const negentropy = r4(1 - (normalized || 0))
  // 趋势：线性回归斜率
  const xs = vals.map((_, i) => i)
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length
  const my = vals.reduce((a, b) => a + b, 0) / vals.length
  let num = 0, den = 0
  for (let i = 0; i < vals.length; i++) { num += (xs[i] - mx) * (vals[i] - my); den += (xs[i] - mx) ** 2 }
  const slope = den ? r4(num / den) : 0
  const mean = r4(my)
  const sd = r4(Math.sqrt(vals.reduce((a, v) => a + (v - my) ** 2, 0) / Math.max(1, vals.length - 1)))

  const level = negentropy >= 0.7 ? '高度有序' : negentropy >= 0.4 ? '中等有序' : negentropy >= 0.2 ? '偏低有序' : '接近均质（高熵）'
  const trendWord = Math.abs(slope) < 0.01 * (Math.abs(mean) || 1) ? '平稳' : (slope > 0 ? '上升' : '下降')
  // 报告正文（模板填充，数据决定）
  const report = [
    `负熵评估：${level}（负熵 ${negentropy}，归一化熵 ${normalized}）`,
    `样本 ${vals.length} 点，均值 ${mean}，标准差 ${sd}，趋势${trendWord}（斜率 ${slope}）`,
    negentropy < 0.4 ? '建议：结构过于均质，考虑引入分层/分类以提升有序度' : '结构有序度可维持，注意防止长期单极化',
  ].join('；')
  return {
    ok: true, success: true,
    output: {
      report, level, negentropy, normalizedEntropy: normalized, entropy: r4(H), maxEntropy: r4(Hmax),
      mean, sd, slope, trend: trendWord, count: vals.length,
      // 对社会的有序度贡献：负熵为正即贡献为正
      societalContribution: negentropy > 0.5 ? '正' : (negentropy > 0.2 ? '中性偏正' : '需改善'),
      method: 'shannon-negentropy-report',
    },
    provenance: ['[BP2_ATOM_RES_NEGENTROPY_066] Shannon 熵 → 负熵 + 趋势 + 模板化报告；正文由数据决定'],
  }
}

// ══════════════════════════════════════════════════════════════
// 9. 生理信号解码器（ATOM_PEOPLE_BIO_006）：HRV/EDA 时域频域特征
//    契约写「脑电/心率/皮电 → 意图特征」。脑电需训练模型，但
//    **心率变异性（HRV）与皮电（EDA）的时域/频域特征是纯数学**，可以真做。
//    对脑电输入：只做通用时序特征（均值/方差/频谱质心），明确标注"未做意图语义解码"。
// ══════════════════════════════════════════════════════════════
function bioDecode(input) {
  const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : { signal: toArr(input) }
  const raw = toArr(o.rr || o.hr || o.signal || o.samples || o.data).map(toNum).filter(v => isFinite(v) && v !== 0)
  if (raw.length < 4) return { ok: false, success: false, reason: 'SIGNAL_TOO_SHORT', message: '至少需要 4 个采样点' }
  const kind = String(o.kind || o.type || 'hr').toLowerCase()
  const n = raw.length
  const mean = raw.reduce((a, b) => a + b, 0) / n
  const sd = Math.sqrt(raw.reduce((a, v) => a + (v - mean) ** 2, 0) / Math.max(1, n - 1))
  // 相邻差分的均方根（RMSSD）—— HRV 核心时域指标
  let sq = 0
  for (let i = 1; i < n; i++) sq += (raw[i] - raw[i - 1]) ** 2
  const rmssd = Math.sqrt(sq / Math.max(1, n - 1))
  // pNN50 等价：相邻差值超过 mean*0.05 的比例
  let cnt = 0
  for (let i = 1; i < n; i++) if (Math.abs(raw[i] - raw[i - 1]) > mean * 0.05) cnt++
  const pnn = r4(cnt / Math.max(1, n - 1))
  // 频谱质心（简化 DFT 幅度加权）
  let num = 0, den = 0
  const K = Math.min(16, Math.floor(n / 2))
  for (let k = 1; k <= K; k++) {
    let re = 0, im = 0
    for (let t = 0; t < n; t++) { const ang = 2 * Math.PI * k * t / n; re += raw[t] * Math.cos(ang); im -= raw[t] * Math.sin(ang) }
    const mag = Math.sqrt(re * re + im * im)
    num += k * mag; den += mag
  }
  const centroid = den ? r4(num / den) : 0
  // LF/HF 近似（低频 k∈[1,3]，高频 k∈[4,K]）
  const band = (lo, hi) => {
    let s = 0
    for (let k = lo; k <= Math.min(hi, K); k++) {
      let re = 0, im = 0
      for (let t = 0; t < n; t++) { const ang = 2 * Math.PI * k * t / n; re += raw[t] * Math.cos(ang); im -= raw[t] * Math.sin(ang) }
      s += re * re + im * im
    }
    return s
  }
  const lf = band(1, 3), hf = band(4, K)
  const lfhf = hf > 0 ? r4(lf / hf) : null
  // 唤醒度代理：RMSSD 越低、LF/HF 越高 → 越偏交感激活
  const arousal = r4(clamp01(0.5 + (lfhf !== null ? (lfhf - 1) * 0.25 : 0) - (rmssd / (mean || 1)) * 0.3))
  const stress = arousal >= 0.65 ? '偏高' : arousal >= 0.45 ? '中等' : '偏低'
  return {
    ok: true, success: true,
    output: {
      kind,
      features: { mean: r4(mean), sd: r4(sd), rmssd: r4(rmssd), pnn50Equiv: pnn, spectralCentroid: centroid, lfHfRatio: lfhf, arousal, stressLevel: stress },
      // 明确能力边界：只做信号特征，不做意图语义解码
      intentDecoded: false,
      note: '本实现输出 HRV/EDA 时域频域特征与唤醒度代理；未做脑电意图语义解码（需训练好的解码器）。' +
        '对脑电输入仅给通用时序特征。',
      sampleCount: n,
      method: 'hrv-time-frequency',
    },
    provenance: ['[BP2_ATOM_PEOPLE_BIO_006] HRV 时域（RMSSD/pNN50）+ 频域（LF/HF/质心）+ 唤醒度代理；不做意图语义解码'],
  }
}

// ══════════════════════════════════════════════════════════════
// 10. 想法捕获器（ATOM_PEOPLE_CAPTURE_001）：文本/结构化 → 想法向量
//     契约写「语音/文字/表情/草图/生理信号 → 结构化想法向量」。
//     语音识别/图像识别做不到，但**文本/结构化 → 向量**是确定性可做的。
// ══════════════════════════════════════════════════════════════
function peopleCapture(input) {
  const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : { text: String(input || '') }
  const sources = []
  const parts = []
  for (const k of ['text', 'speech', 'emoji', 'sketch', 'bio']) {
    if (o[k] !== undefined && o[k] !== null && o[k] !== '') { sources.push(k); parts.push(String(o[k])) }
  }
  if (typeof input === 'string') { sources.push('text'); parts.push(input) }
  const merged = parts.join(' ')
  if (!merged.trim()) return { ok: false, success: false, reason: 'NO_INPUT', message: '缺少任何可捕获的输入（text/speech/emoji/sketch/bio）' }
  // 向量化：固定 16 维词袋哈希（确定性）
  const DIM = 16
  const vec = new Array(DIM).fill(0)
  const toks = tokenize(merged)
  for (const w of toks) {
    let h = 0
    for (let i = 0; i < w.length; i++) h = (h * 31 + w.charCodeAt(i)) >>> 0
    vec[h % DIM] += 1
  }
  const norm = Math.sqrt(vec.reduce((a, v) => a + v * v, 0)) || 1
  const normalized = vec.map(v => r4(v / norm))
  // 结构信息
  const emotionHints = (merged.match(/好|棒|赞|满意|喜欢|差|糟|烦|怕|急|担心/g) || [])
  return {
    ok: true, success: true,
    output: {
      ideaVector: normalized, dimension: DIM,
      sourcesUsed: sources, sourceCount: sources.length,
      tokenCount: toks.length, charCount: merged.length,
      emotionHints: [...new Set(emotionHints)],
      // 能力边界
      unsupportedSources: ['audio-to-text（需语音识别）', 'image-to-sketch（需图像识别）'].filter(x => !sources.length || true).slice(0, 2),
      method: 'text-bag-hash16',
    },
    provenance: ['[BP2_ATOM_PEOPLE_CAPTURE_001] 文本/结构化输入 → 16 维词袋哈希向量；语音/图像识别不做（需外部模型）'],
  }
}

// ══════════════════════════════════════════════════════════════
// 11. 情绪识别器（ATOM_EMOTION_RECOG_502）：文本情绪识别（能力子集）
//     契约写「面部/语音/生理 → 情绪标签」。视觉/语音做不到，
//     但**文本情绪识别**是确定性可做的（词典 + 否定/程度处理）。
// ══════════════════════════════════════════════════════════════
const EMOTION_LEX = {
  joy: ['开心', '高兴', '满意', '喜欢', '棒', '赞', '优秀', '太好了', '愉快', '幸福', 'happy', 'great', 'good'],
  sadness: ['难过', '伤心', '失望', '遗憾', '沮丧', '低落', 'sad', 'sorry'],
  anger: ['生气', '愤怒', '气愤', '恼火', '讨厌', '可恶', 'angry', 'hate'],
  fear: ['害怕', '担心', '焦虑', '紧张', '恐', '不安', 'afraid', 'worried'],
  surprise: ['惊讶', '意外', '居然', '没想到', 'surprised', 'wow'],
  disgust: ['恶心', '反感', '厌恶', 'disgusting'],
}
const NEGATORS = ['不', '没', '无', '别', '非', '未']
const INTENSIFIERS = ['非常', '特别', '极其', '十分', '太', '超级', '很']
function emotionRecog(input) {
  const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : { text: String(input || '') }
  const text = String(o.text || o.audioText || o.content || (typeof input === 'string' ? input : ''))
  const hasVision = (o.face !== undefined || o.image !== undefined)
  if (!text.trim() && !hasVision) {
    return {
      ok: false, success: false, reason: 'NO_TEXT_INPUT',
      message: '本实现只支持文本情绪识别；面部/语音情绪识别需视觉/语音模型，未提供',
      output: { supported: ['text'], unsupported: ['face', 'voice', 'physiology'] },
    }
  }
  const scores = {}
  const hits = []
  for (const emo of Object.keys(EMOTION_LEX)) {
    let s = 0
    for (const w of EMOTION_LEX[emo]) {
      let idx = text.indexOf(w)
      while (idx >= 0) {
        // 否定词检测（前 3 字内）
        const before = text.slice(Math.max(0, idx - 3), idx)
        const negated = NEGATORS.some(n => before.indexOf(n) >= 0)
        // 程度词检测
        const intensified = INTENSIFIERS.some(i => before.indexOf(i) >= 0)
        s += (negated ? -1 : 1) * (intensified ? 1.5 : 1)
        hits.push({ word: w, emotion: emo, negated, intensified })
        idx = text.indexOf(w, idx + w.length)
      }
    }
    scores[emo] = r4(Math.max(0, s))
  }
  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const normalized = {}
  for (const k of Object.keys(scores)) normalized[k] = total > 0 ? r4(scores[k] / total) : 0
  const ranked = Object.keys(normalized).map(k => ({ emotion: k, score: normalized[k] })).sort((a, b) => b.score - a.score)
  const top = ranked[0]
  const state = total === 0 ? 'neutral' : top.emotion
  return {
    ok: true, success: true,
    output: {
      '情绪': state, emotionState: state,
      confidence: total === 0 ? 0 : r4(top.score),
      intensity: r4(clamp01(total / 3)),
      scores: ranked,
      lexiconHits: hits.slice(0, 12),
      // 能力边界：明确只做文本
      supportedModality: ['text'], unsupportedModality: ['face', 'voice', 'physiology'],
      method: 'text-lexicon-negation-intensity',
    },
    provenance: ['[BP2_ATOM_EMOTION_RECOG_502] 文本情绪识别：词典 + 否定翻转 + 程度加权；面部/语音不做（需视觉/语音模型）'],
  }
}

// ══════════════════════════════════════════════════════════════
module.exports = {
  IMPL: {
    ATOM_NEWS_SUMMARY_304: newsSummary,
    ATOM_POLICY_TRANSLATE_101: policyTranslate,
    ATOM_TECH_DEMYSTIFY_201: techDemystify,
    ATOM_RES_IDEA_WITNESS_059: ideaWitness,
    ATOM_RES_NON_TECH_058: nonTechTransform,
    ATOM_RES_FRICTION_061: frictionTribute,
    ATOM_FUSION_TAO_DAILY_043: taoDaily,
    ATOM_RES_NEGENTROPY_066: negentropyReport,
    ATOM_PEOPLE_BIO_006: bioDecode,
    ATOM_PEOPLE_CAPTURE_001: peopleCapture,
    ATOM_EMOTION_RECOG_502: emotionRecog,
  },
  count: 11,
  // 仍做不到的 3 条（真需视觉模型/物理设备/训练好的解码器）
  STILL_UNSUPPORTED: [
    'ATOM_SECURE_LOCK_201（需物理锁具接口，纯软件无法真正控制硬件）',
    'ATOM_ACCESSIBLE_SIGN_507（需手语视频理解模型）',
    'ATOM_BIO_NEURAL_021（需脑电意图解码器训练）',
  ],
}
