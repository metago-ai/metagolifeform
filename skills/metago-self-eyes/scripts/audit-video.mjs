#!/usr/bin/env node
/**
 * audit-video.mjs — 视频客观体检：抽帧 + 黑场/空白/近静止连段 + 联络表。
 *
 * 用法: node audit-video.mjs --input D:\a.mp4 --out D:\审计\v1 [--fps 1] [--cols 6]
 * 产出: <out>/frames/*.jpg  <out>/contact.jpg  <out>/report.json
 * 之后必须用 read_image 看 contact.jpg 与关键帧。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : (process.argv[i + 1] ?? true); };
const input = arg('input', null);
const out = arg('out', path.resolve('audit-video-' + Date.now()));
const fps = Number(arg('fps', 1));
const cols = Number(arg('cols', 6));
if (!input || !fs.existsSync(input)) { console.error('用法: node audit-video.mjs --input <video> --out <dir>'); process.exit(2); }

fs.mkdirSync(path.join(out, 'frames'), { recursive: true });
const ffmpeg = 'ffmpeg', ffprobe = 'ffprobe';

// 1) 探测
let probe = {};
try {
  const j = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', input], { encoding: 'utf8' }));
  const v = (j.streams || []).find((s) => s.codec_type === 'video') || {};
  probe = { duration: Number(j.format?.duration || 0), width: v.width, height: v.height, fps: v.avg_frame_rate, codec: v.codec_name, sizeMB: +(Number(j.format?.size || 0) / 1048576).toFixed(2) };
} catch (e) { console.error('ffprobe 失败: ' + e.message); process.exit(2); }

// 2) 抽帧（统一小尺寸，供分析 + 联络表）
const framesDir = path.join(out, 'frames');
execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', input, '-vf', `fps=${fps}`, '-q:v', '3', path.join(framesDir, 'f%04d.jpg')]);

// 3) 逐帧灰度统计（黑场/空白检测）
const W = 64, H = 36;
const raw = execFileSync(ffmpeg, ['-v', 'error', '-i', input, '-vf', `fps=${fps},scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1024 * 1024 * 512 });
const frameSize = W * H;
const stats = [];
for (let o = 0, idx = 0; o + frameSize <= raw.length; o += frameSize, idx++) {
  let sum = 0, sum2 = 0;
  for (let i = 0; i < frameSize; i++) { const v = raw[o + i]; sum += v; sum2 += v * v; }
  const mean = sum / frameSize;
  const std = Math.sqrt(Math.max(0, sum2 / frameSize - mean * mean));
  stats.push({ idx, t: +(idx / fps).toFixed(2), mean: +mean.toFixed(1), std: +std.toFixed(1), diff: null });
}
for (let i = 1; i < stats.length; i++) {
  let d = 0;
  for (let k = 0; k < frameSize; k++) d += Math.abs(raw[i * frameSize + k] - raw[(i - 1) * frameSize + k]);
  stats[i].diff = +(d / frameSize).toFixed(2);
}

// 4) 判定
const issues = [];
for (const s of stats) {
  if (s.std < 3 && s.mean < 24) issues.push({ level: 'P0', type: 'black-frame', t: s.t, detail: `黑场：mean=${s.mean} std=${s.std}` });
  else if (s.std < 2.5) issues.push({ level: 'P1', type: 'flat-frame', t: s.t, detail: `近乎纯色/空白：std=${s.std}` });
}
// 近静止连段（diff 很小且持续）
let runStart = null;
for (let i = 1; i < stats.length; i++) {
  const staticFrame = stats[i].diff !== null && stats[i].diff < 1.2;
  if (staticFrame && runStart === null) runStart = stats[i - 1].t;
  if (!staticFrame && runStart !== null) {
    const dur = stats[i - 1].t - runStart;
    if (dur >= 3) issues.push({ level: 'P1', type: 'static-run', t: +runStart.toFixed(1), detail: `近静止 ${dur.toFixed(1)} 秒（画面几乎不动）` });
    runStart = null;
  }
}
if (runStart !== null && stats.length) {
  const dur = stats[stats.length - 1].t - runStart;
  if (dur >= 3) issues.push({ level: 'P1', type: 'static-run', t: +runStart.toFixed(1), detail: `近静止 ${dur.toFixed(1)} 秒（直到片尾）` });
}

// 5) 联络表
const contact = path.join(out, 'contact.jpg');
const nFrames = Math.max(1, stats.length);
const rows = Math.ceil(nFrames / cols);
try {
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', input, '-vf', `fps=${fps},scale=320:-1,tile=${cols}x${rows}`, '-frames:v', '1', contact]);
} catch { /* 联络表失败不阻断 */ }

const report = { input, generatedAt: new Date().toISOString(), probe, sampledFrames: stats.length, framesDir, contact, issues, summary: { P0: issues.filter(i => i.level === 'P0').length, P1: issues.filter(i => i.level === 'P1').length } };
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

console.log(`视频: ${input}  ${probe.width}x${probe.height}  ${probe.duration.toFixed(1)}s  ${probe.sizeMB}MB`);
console.log(`抽帧: ${stats.length} 张 → ${framesDir}`);
console.log(`联络表: ${contact}`);
console.log(`问题: P0=${report.summary.P0} P1=${report.summary.P1}`);
for (const i of issues.slice(0, 25)) console.log(`  [${i.level}] ${i.type} @${i.t}s  ${i.detail}`);
console.log('提醒: 必须用 read_image 打开 contact.jpg 与关键帧，逐段看画面。');
process.exit(report.summary.P0 > 0 ? 1 : 0);
