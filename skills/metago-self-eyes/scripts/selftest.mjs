#!/usr/bin/env node
/**
 * selftest.mjs — 审计器的自测断言（补上"跑完没人比对预期"的空白）。
 *
 * 用法: node selftest.mjs
 * 断言:
 *   1) 埋雷页 selftest-page.html → 必须命中 8 类问题（含纵向裁字、横向溢出、越界、破图、低对比度、占位、小按钮）
 *   2) 空白页 empty-page.html   → 必须命中 near-empty
 *   3) 零问题页 clean-page.html → P0=0 且 P1=0（阴性对照，防误报）
 * 任一不满足 → 退出码 1。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outRoot = path.join(root, '.selftest-out');
fs.mkdirSync(outRoot, { recursive: true });

const node = process.execPath;

function run(fixture) {
  const out = path.join(outRoot, path.basename(fixture, '.html'));
  let code = 0;
  try {
    execFileSync(node, [path.join(here, 'audit-web.mjs'), '--html', path.join(root, fixture), '--out', out, '--widths', '1440,390'], { stdio: 'pipe' });
  } catch (e) {
    code = e.status ?? 1;   // audit 在有 P0 时按设计退出 1
  }
  const report = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8'));
  const types = new Set(report.issues.map((i) => i.type));
  return { report, types, code, out };
}

const failures = [];
const ck = (ok, msg) => { if (!ok) failures.push(msg); console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${msg}`); };

console.log('① 埋雷页 selftest-page.html');
const bad = run('scripts/selftest-page.html');
const required = ['text-clipped', 'text-vert-clipped', 'horizontal-overflow', 'outside-viewport', 'broken-image', 'low-contrast', 'placeholder-content', 'tiny-target'];
for (const t of required) ck(bad.types.has(t), `命中 ${t}`);
ck(bad.report.summary.P0 >= 4, `P0 ≥ 4（实际 ${bad.report.summary.P0}）`);
ck(bad.code === 1, `有 P0 时退出码=1（实际 ${bad.code}）`);

console.log('② 空白页 empty-page.html');
const empty = run('fixtures/empty-page.html');
ck(empty.types.has('near-empty'), '命中 near-empty');

console.log('③ 零问题页 clean-page.html（阴性对照）');
const clean = run('fixtures/clean-page.html');
ck(clean.report.summary.P0 === 0 && clean.report.summary.P1 === 0,
   `P0=0 且 P1=0（实际 P0=${clean.report.summary.P0} P1=${clean.report.summary.P1}）`);
ck(clean.code === 0, `零问题页退出码=0（实际 ${clean.code}）`);

const total = required.length + 5;
console.log('');
if (failures.length) {
  console.log(`❌ 自测失败 ${failures.length}/${total} 项：`);
  for (const f of failures) console.log('   - ' + f);
  console.log(`产物目录: ${outRoot}`);
  process.exit(1);
}
console.log(`✅ 自测全绿 ${total}/${total} 项。审计器既能抓错（8 类 + 空白），也不误报（阴性对照 0 问题）。`);
console.log(`产物目录: ${outRoot}`);
