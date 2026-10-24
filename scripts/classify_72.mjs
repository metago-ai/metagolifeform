// classify_72.mjs — 把 72 条无实现的蓝本契约按「能否用确定性算法实现」分类
//
// 分类规则（按 output 语义判断，不按名字猜）：
//   DET   确定性可实现：output 是结构化的（密文/校验结果/列表/指标/排序/映射表…）
//   MODEL 需模型：output 是自然语言生成（通俗解释/摘要/故事/文案…）
//   EXT   需外部服务：需视频/音频/硬件/第三方 API
import { readFileSync, writeFileSync } from 'node:fs'

const GEN = JSON.parse(readFileSync('D:/metago-build/genome/atoms_engines.json', 'utf8'))
const UNCOV = JSON.parse(readFileSync('D:/metago-build/atom_uncovered.json', 'utf8'))
const atoms = GEN.atoms || {}
const missing = UNCOV.missing

const MODEL_PAT = /解释|摘要|故事|文案|文章|报告|叙述|描述|提炼|翻译|解说|润色|改写|生成.*文|撰写|写作|拟写|口号|标题|标语|评论/
const EXT_PAT = /视频|音频|图像|图片|语音|手语|脑电|摄像头|传感器|硬件|机器人|模型训练|深度学习|OCR|识别.*面|人脸/

const rows = []
for (const id of missing) {
  const a = atoms[id] || {}
  const out = String(a.output || '')
  const inp = String(a.input || '')
  let kind = 'DET'
  if (EXT_PAT.test(out) || EXT_PAT.test(inp)) kind = 'EXT'
  else if (MODEL_PAT.test(out)) kind = 'MODEL'
  rows.push({ id, name: String(a.name || ''), input: inp, output: out, kind })
}

const g = {}
for (const r of rows) (g[r.kind] = g[r.kind] || []).push(r)

console.log('='.repeat(96))
console.log(`72 条无实现蓝本契约的分类`)
console.log('='.repeat(96))
for (const k of ['DET', 'MODEL', 'EXT']) {
  const list = g[k] || []
  console.log(`\n${k}（${list.length} 条）`)
  for (const r of list) {
    console.log(`  ${r.id.padEnd(34)} ${r.name.padEnd(16)} ${r.input.slice(0, 18)} → ${r.output.slice(0, 26)}`)
  }
}

console.log('\n' + '-'.repeat(96))
console.log(`合计 ${rows.length}：DET ${(g.DET || []).length} ｜ MODEL ${(g.MODEL || []).length} ｜ EXT ${(g.EXT || []).length}`)

writeFileSync('D:/metago-build/atoms_72_classified.json', JSON.stringify({ rows, summary: { DET: (g.DET || []).length, MODEL: (g.MODEL || []).length, EXT: (g.EXT || []).length } }, null, 1), 'utf8')
console.log('已写出 D:/metago-build/atoms_72_classified.json')
