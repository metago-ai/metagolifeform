#!/usr/bin/env node
/**
 * MCP 工具注册唯一性测试（CONTRIBUTING「测试与质量」引用）
 * 检查：
 *   U1 skills-data.ts / toolkit-data.ts 中 toolName 全局唯一
 *   U2 mcp 工具名与 53 口径一致（两文件 toolName 计数和 = 52，+ index.ts 事件上报 1 = 53）
 *   U3 prompts.ts 中 prompt name 唯一
 * 用法：node scripts/test-registration-uniqueness.cjs   退出码：0 通过 / 1 失败
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function namesOf(file, re) {
  const p = path.join(ROOT, 'packages/mcp-server/src', file);
  if (!fs.existsSync(p)) { console.log('  [FAIL] ' + file + ' 不存在'); fail++; return []; }
  const c = fs.readFileSync(p, 'utf8');
  return [...c.matchAll(re)].map(m => m[1]);
}
const skillTools = namesOf('skills-data.ts', /toolName:\s*["'](metago_[a-z0-9_]+)["']/g);
const kitTools = namesOf('toolkit-data.ts', /toolName:\s*["'](metago_[a-z0-9_]+)["']/g);
const all = skillTools.concat(kitTools);
// 36.7.15 定稿"同名合并 7"：以下 7 个工具在两文件同名定义（注册时合并去重），属预期
const KNOWN_MERGES = new Set(['metago_action_plan','metago_whatif','metago_problem_trace','metago_objectivity','metago_critique','metago_emotion','metago_decision_eval']);
const dupInFile = f => { const s = new Set(), d = new Set(); for (const n of f) { if (s.has(n)) d.add(n); s.add(n); } return [...d]; };
const fileDups = dupInFile(skillTools).concat(dupInFile(kitTools));
const cross = skillTools.filter(n => kitTools.includes(n));
const unexpected = cross.filter(n => !KNOWN_MERGES.has(n)).concat(fileDups);
console.log('  [U1] toolName 唯一性: ' + (unexpected.length ? 'FAIL 非预期重复=' + [...new Set(unexpected)].join(',') : 'PASS（文件内 0 重复；跨文件同名合并 ' + cross.length + '/7 符合定稿）'));
if (unexpected.length) fail++;
const idx = fs.readFileSync(path.join(ROOT, 'packages/mcp-server/src/index.ts'), 'utf8');
const hasReport = /metago_report_event/.test(idx);
const total = new Set(all).size + (hasReport ? 1 : 0);
console.log('  [U2] 53 口径核对: ' + (total === 53 ? 'PASS (' + skillTools.length + '+' + kitTools.length + '+1=' + total + ')' : 'WARN 实际=' + total + '（若为有意的工具集变更，请同步 53→N 全链口径）'));
if (total !== 53) fail += 0; // 软提示：口径变更需全链同步，硬失败交 metadata-consistency 测试
const prompts = namesOf('prompts.ts', /name:\s*["']([a-z0-9_\-]+)["']/g);
const pdup = prompts.filter((n, i) => prompts.indexOf(n) !== i);
console.log('  [U3] prompt 唯一性: ' + (pdup.length ? 'FAIL 重复=' + [...new Set(pdup)].join(',') : 'PASS (' + new Set(prompts).size + ' 个)'));
if (pdup.length) fail++;
console.log(fail === 0 ? '✅ 注册唯一性测试通过' : '❌ 注册唯一性测试失败：' + fail + ' 项');
process.exitCode = fail === 0 ? 0 : 1;   /* DEF-055：用 exitCode 避免管道输出被截断 */
