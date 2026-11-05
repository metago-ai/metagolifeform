#!/usr/bin/env node
/**
 * audit-image.mjs — 图片客观体检（尺寸/空白/纯色边/裁切风险）。
 *
 * 用法: node audit-image.mjs --input D:\a.png --out D:\审计\img1
 * 产出: <out>/report.json
 * 之后必须用 read_image 打开图片本身，看构图、文字、内容是否符合需求。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : (process.argv[i + 1] ?? true); };
const input = arg('input', null);
const out = arg('out', path.resolve('audit-image-' + Date.now()));
if (!input || !fs.existsSync(input)) { console.error('用法: node audit-image.mjs --input <image> --out <dir>'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });

const ffmpeg = 'ffmpeg', ffprobe = 'ffprobe';
let meta = {};
try {
  const j = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-print_format', 'json', '-show_streams', input], { encoding: 'utf8' }));
  const v = (j.streams || [])[0] || {};
  meta = { width: v.width, height: v.height, format: v.codec_name, pixFmt: v.pix_fmt };
} catch (e) { console.error('ffprobe 失败: ' + e.message); process.exit(2); }

const W = 64, H = 64;
const raw = execFileSync(ffmpeg, ['-v', 'error', '-i', input, '-vf', `scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 64 * 1024 * 1024 });
let sum = 0, sum2 = 0;
for (let i = 0; i < W * H; i++) { const v = raw[i] ?? 0; sum += v; sum2 += v * v; }
const mean = sum / (W * H), std = Math.sqrt(Math.max(0, sum2 / (W * H) - mean * mean));

// 四边纯色程度（判断是否被裁切/留白过多）
const edgeGray = (side) => {
  const vals = [];
  for (let x = 0; x < W; x++) {
    if (side === 'top') vals.push(raw[x]);
    if (side === 'bottom') vals.push(raw[(H - 1) * W + x]);
  }
  for (let y = 0; y < H; y++) {
    if (side === 'left') vals.push(raw[y * W]);
    if (side === 'right') vals.push(raw[y * W + W - 1]);
  }
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  const s = Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length);
  return { mean: +m.toFixed(1), std: +s.toFixed(1) };
};
const edges = { top: edgeGray('top'), bottom: edgeGray('bottom'), left: edgeGray('left'), right: edgeGray('right') };

const issues = [];
if (std < 3) issues.push({ level: 'P0', type: 'blank-image', detail: `整图近乎纯色（std=${std.toFixed(2)}），可能是空白图/渲染失败` });
if (meta.width && meta.width < 400) issues.push({ level: 'P1', type: 'low-resolution', detail: `宽度仅 ${meta.width}px，投屏/打印会糊` });
const uniformEdges = Object.entries(edges).filter(([, v]) => v.std < 6).map(([k]) => k);
if (uniformEdges.length === 4) issues.push({ level: 'P1', type: 'uniform-border', detail: '四边都是纯色：主体可能过小或四周留白过多（或被裁切）' });
else if (uniformEdges.length >= 2) issues.push({ level: 'P2', type: 'partial-uniform-border', detail: `纯色边：${uniformEdges.join('/')} —— 检查构图是否偏斜` });

const report = { input, generatedAt: new Date().toISOString(), meta, stats: { mean: +mean.toFixed(1), std: +std.toFixed(2), edges }, issues, summary: { P0: issues.filter(i => i.level === 'P0').length, P1: issues.filter(i => i.level === 'P1').length } };
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

console.log(`图片: ${input}  ${meta.width}x${meta.height}  ${meta.format}`);
console.log(`灰度: mean=${report.stats.mean} std=${report.stats.std}`);
Object.entries(edges).forEach(([k, v]) => console.log(`  边 ${k}: mean=${v.mean} std=${v.std}`));
console.log(`问题: P0=${report.summary.P0} P1=${report.summary.P1}`);
for (const i of issues) console.log(`  [${i.level}] ${i.type}: ${i.detail}`);
console.log('提醒: 必须用 read_image 打开图片本身看内容与构图。');
process.exit(report.summary.P0 > 0 ? 1 : 0);
