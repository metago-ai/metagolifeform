/**
 * lib/baseline.js — 基线管理器
 * 加载内置基线 + 用户自定义基线；提供条目查询。
 */
const fs = require('fs');
const path = require('path');

const KIT_ROOT = path.resolve(__dirname, '..');

function loadBaselines(opts = {}) {
  const dirs = [];
  // 内置基线目录
  const builtin = path.join(KIT_ROOT, 'baselines');
  if (fs.existsSync(builtin)) dirs.push(builtin);
  // 用户自定义基线目录（config 可指定）
  if (opts.baselineDirs) {
    for (const d of opts.baselineDirs) {
      const abs = path.isAbsolute(d) ? d : path.resolve(process.cwd(), d);
      if (fs.existsSync(abs)) dirs.push(abs);
    }
  }
  const baselines = [];
  for (const dir of dirs) {
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      try {
        const b = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        if (b.id && b.items) baselines.push(b);
      } catch (e) {
        console.warn(`[warn] 基线文件解析失败: ${f} (${e.message})`);
      }
    }
  }
  return baselines;
}

function countItems(baselines) {
  let n = 0;
  for (const b of baselines) n += Object.keys(b.items).length;
  return n;
}

module.exports = { loadBaselines, countItems };
