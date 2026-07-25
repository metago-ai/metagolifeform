#!/usr/bin/env node
/**
 * verify-kit 发布前门禁：确保 metago-verify bin 不是"静默 exit 0"的桩。
 *
 * 检查：
 *   1. dist/index.js 存在且有 shebang
 *   2. CLI 入口守卫使用 pathToFileURL（Windows 兼容）
 *   3. 实际执行 bin，必须产生输出（报告 JSON 或自律检查结论），禁止静默退出
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const pkgRoot = path.resolve(__dirname, '..');
const distBin = path.join(pkgRoot, 'dist', 'index.js');
const errors = [];

if (!fs.existsSync(distBin)) {
  errors.push('dist/index.js 不存在，请先 npm run build');
} else {
  const head = fs.readFileSync(distBin, 'utf8');
  if (!head.startsWith('#!/usr/bin/env node')) errors.push('dist/index.js 缺少 shebang');
  if (!head.includes('pathToFileURL')) errors.push('dist/index.js CLI 入口守卫未使用 pathToFileURL（Windows 会静默 exit 0）');
}

if (errors.length === 0) {
  try {
    const out = execFileSync(process.execPath, [distBin], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000 });
    if (!out || out.trim().length < 50) errors.push('bin 执行输出为空或过短——疑似静默桩');
  } catch (e) {
    // exit 1（自律检查失败）是合法行为，但必须有输出
    const out = ((e.stdout || '') + (e.stderr || '')).toString();
    if (!out || out.trim().length < 50) errors.push('bin 执行无输出且非零退出——疑似静默桩');
    if (e.status !== 1) errors.push(`bin 退出码异常: ${e.status}`);
  }
}

if (errors.length > 0) {
  console.error('[verify-bin] 发布门禁未通过：');
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('[verify-bin] 发布门禁通过（dist 存在 + shebang + pathToFileURL 守卫 + 实际执行有输出）');
