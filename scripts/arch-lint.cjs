#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const VERSION = '1.1.0';

const DEFAULT_LAYERS = {
  domain: ['domain', 'entities'],
  application: ['application', 'use-cases', 'usecases'],
  adapters: ['adapters', 'controllers'],
  infrastructure: ['infrastructure']
};

const DEFAULT_BANNED = {
  ts: [
    'express', 'fastify', 'koa', 'hapi', 'hono', 'react', 'react-dom', 'vue', 'angular',
    'jquery', 'sequelize', 'mongoose', 'typeorm', 'prisma', 'knex', 'drizzle-orm', 'pg',
    'pg-promise', 'mysql', 'mysql2', 'mariadb', 'redis', 'ioredis', 'mongodb', 'axios',
    'superagent', 'socket.io', 'ws', 'multer', 'body-parser', 'cors', 'next', 'nuxt',
    '@nestjs/core'
  ],
  python: [
    'sqlalchemy', 'asyncpg', 'psycopg', 'psycopg2', 'redis', 'aioredis', 'httpx',
    'requests', 'fastapi', 'flask', 'django', 'aiohttp', 'pymongo', 'motor', 'sqlmodel',
    'peewee', 'tortoise-orm', 'celery', 'dramatiq'
  ]
};

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'out', '.next', '.nuxt',
  '.output', '.venv', 'venv', '__pycache__', 'coverage', '.turbo', '.cache', '.ivk',
  '.idea', '.vscode', 'target', 'bin', 'obj', '.rollup.cache'
]);

const SRC_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py']);

function loadConfig(dir) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'arch.config.json'), 'utf8').replace(/^\uFEFF/, ''));
    return cfg && typeof cfg.tier === 'string' ? cfg : null;
  } catch (e) {
    return null;
  }
}

function normalizeCheck(cfg) {
  const check = (cfg && cfg.check) || {};
  const layers = {};
  for (const name of Object.keys(DEFAULT_LAYERS)) {
    const extra = (check.layers && Array.isArray(check.layers[name])) ? check.layers[name] : [];
    layers[name] = Array.from(new Set((DEFAULT_LAYERS[name] || []).concat(extra)));
  }
  const banned = {};
  for (const name of Object.keys(DEFAULT_BANNED)) {
    const extra = (check.bannedDeps && Array.isArray(check.bannedDeps[name])) ? check.bannedDeps[name] : [];
    banned[name] = Array.from(new Set((DEFAULT_BANNED[name] || []).concat(extra)));
  }
  const allowImports = Array.from(new Set(Array.isArray(check.allowImports) ? check.allowImports : []));
  const strict = !!(check && check.strict);
  return { layers, banned, allowImports, strict };
}

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return out;
  }
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) walk(p, out);
    } else if (ent.isFile() && SRC_EXTS.has(path.extname(ent.name).toLowerCase())) {
      out.push(p);
    }
  }
  return out;
}

function layerOf(segments, layers) {
  for (const name of ['domain', 'application', 'adapters', 'infrastructure']) {
    if (segments.some((s) => layers[name].includes(s))) return name;
  }
  return null;
}

function importsOf(src) {
  const found = [];
  const es = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const cjs = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  const py = /^(?:from\s+([\w.]+)\s+import\s+|import\s+([\w.]+))/gm;
  let m;
  while ((m = es.exec(src))) found.push({ spec: m[1], index: m.index });
  while ((m = cjs.exec(src))) found.push({ spec: m[1], index: m.index });
  while ((m = py.exec(src))) found.push({ spec: m[1] || m[2], index: m.index });
  return found;
}

function lineOf(src, index) {
  return src.slice(0, index).split('\n').length;
}

function packageNameOf(spec) {
  if (spec.startsWith('@')) {
    return spec.split('/').slice(0, 2).join('/');
  }
  return spec.split('/')[0];
}

function resolveTarget(fileAbs, rootAbs, spec) {
  if (spec.startsWith('.')) {
    const target = path.resolve(path.dirname(fileAbs), spec);
    const rel = path.relative(rootAbs, target);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
    return rel.split(path.sep);
  }
  // 绝对导入解析到项目内（如 from app.core.config import ...）
  const parts = spec.split(/[./]/).filter(Boolean);
  if (!parts.length) return null;
  if (!fs.existsSync(path.join(rootAbs, parts[0]))) return null; // 外部库
  return parts;
}

function isAllowed(spec, allowImports) {
  return allowImports.some((a) => spec === a || spec.startsWith(a + '.') || spec.startsWith(a + '/'));
}

function checkFile(fileAbs, rootAbs, violations, ctx, stats) {
  let src;
  try {
    src = fs.readFileSync(fileAbs, 'utf8').replace(/^\uFEFF/, '');
  } catch (e) {
    return;
  }
  const rel = path.relative(rootAbs, fileAbs);
  const segs = rel.split(path.sep);
  const fileLayer = layerOf(segs, ctx.layers);
  if (!fileLayer) return;
  stats.covered++;

  for (const imp of importsOf(src)) {
    const line = lineOf(src, imp.index);
    if (isAllowed(imp.spec, ctx.allowImports)) continue;
    const targetSegs = resolveTarget(fileAbs, rootAbs, imp.spec);
    if (targetSegs) {
      const targetLayer = layerOf(targetSegs, ctx.layers);
      if (fileLayer === 'domain' && targetLayer && targetLayer !== 'domain') {
        violations.push({ file: rel, line, rule: 'D1', spec: imp.spec, msg: 'domain 层禁止引用外层（依赖只能向内）' });
      }
      if (fileLayer === 'domain' && !targetLayer) {
        violations.push({ file: rel, line, rule: 'D3', spec: imp.spec, msg: 'domain 层禁止引用分层外文件' });
      }
      if (fileLayer === 'application' && (targetLayer === 'adapters' || targetLayer === 'infrastructure')) {
        violations.push({ file: rel, line, rule: 'D2', spec: imp.spec, msg: 'application 层禁止引用 adapters/infrastructure' });
      }
    } else if (!imp.spec.startsWith('.')) {
      const pkg = packageNameOf(imp.spec);
      const lang = path.extname(fileAbs).toLowerCase() === '.py' ? 'python' : 'ts';
      const bannedList = ctx.banned[lang] || [];
      if ((fileLayer === 'domain' || fileLayer === 'application') && bannedList.includes(pkg)) {
        violations.push({ file: rel, line, rule: 'D4', spec: imp.spec, msg: 'domain/application 禁止 import 框架/数据访问库: ' + pkg });
      }
    }
  }

  const base = path.basename(fileAbs, path.extname(fileAbs));
  const inUseCases = segs.some((s) => s === 'use-cases' || s === 'usecases' || ctx.layers.application.includes(s));
  if (fileLayer === 'application' && inUseCases && /^(insert|update|delete|remove)([A-Z_]|$)/i.test(base)) {
    violations.push({ file: rel, line: 1, rule: 'N1', spec: base, msg: '用例名应为人类动作（如 PlaceOrder），禁止 insert/update/delete/remove 开头' });
  }
}

function main() {
  const args = process.argv.slice(2);
  const dirArg = args.find((a) => !a.startsWith('--')) || '.';
  const json = args.includes('--json');
  const root = path.resolve(dirArg);

  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    if (json) {
      console.log(JSON.stringify({ ok: false, error: '目录不存在: ' + root }));
      process.exit(2);
    }
    console.error('❌ 目录不存在: ' + root);
    process.exit(2);
  }

  const cfg = loadConfig(root);
  const tier = cfg ? cfg.tier.toUpperCase() : null;

  if (!tier) {
    if (json) {
      console.log(JSON.stringify({ ok: true, tier: 'C', skipped: true, reason: '未找到 arch.config.json' }));
      process.exit(0);
    }
    console.log('ℹ️ 未找到 arch.config.json，按 C 档（不检查）处理。运行 metago-arch init 可配置档位。');
    process.exit(0);
  }
  if (tier === 'C') {
    if (json) {
      console.log(JSON.stringify({ ok: true, tier: 'C', skipped: true }));
      process.exit(0);
    }
    console.log('ℹ️ 项目档位 C（脚本/原型），跳过架构检查。');
    process.exit(0);
  }

  const ctx = normalizeCheck(cfg);
  const files = walk(root, []);
  const violations = [];
  const stats = { covered: 0 };
  for (const f of files) checkFile(f, root, violations, ctx, stats);

  const coverage = {
    scanned: files.length,
    covered: stats.covered,
    uncovered: files.length - stats.covered,
    rate: files.length ? Math.round((stats.covered / files.length) * 1000) / 10 : 0
  };
  const zeroCoverageBlock = ctx.strict && coverage.covered === 0;
  const summary = {
    ok: violations.length === 0 && !zeroCoverageBlock,
    tool: 'metago-arch-lint',
    version: VERSION,
    tier,
    coverage,
    violations
  };
  if (json) {
    console.log(JSON.stringify(summary, null, 2));
    process.exit(summary.ok ? 0 : 1);
  }

  console.log('metago-arch check');
  console.log('目录: ' + root);
  console.log('档位: ' + tier);
  console.log('扫描文件: ' + files.length + '（分层覆盖 ' + stats.covered + '，覆盖率 ' + coverage.rate + '%）');
  console.log('违规: ' + violations.length);
  if (zeroCoverageBlock) {
    console.log('❌ FAIL：分层覆盖率为 0，规则未覆盖任何文件。请在 arch.config.json 配置 check.layers 层映射，或降级为 C 档。');
    process.exit(1);
  }
  if (violations.length === 0) {
    console.log('✅ PASS：依赖方向与命名合规');
    process.exit(0);
  }
  for (const v of violations) {
    console.log('❌ ' + v.rule + ' ' + v.file + ':' + v.line + ' → ' + v.msg + '（' + v.spec + '）');
  }
  process.exit(1);
}

module.exports = { main, checkFile, loadConfig, normalizeCheck, VERSION };
if (require.main === module) main();
