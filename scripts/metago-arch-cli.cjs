#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PKG_ROOT = path.resolve(__dirname, '..');
const LINT = path.join(PKG_ROOT, 'scripts', 'arch-lint.cjs');
let pkg = {};
try {
  pkg = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));
} catch (e) {
  // 忽略
}
const ARCH_VERSION = (pkg.metago && pkg.metago.archComponent) || '1.1.0';

function runLint(dir, extraArgs) {
  return spawnSync(process.execPath, [LINT, dir].concat(extraArgs || []), { encoding: 'utf8' });
}

function cmdVersion() {
  console.log('metago-arch-gov ' + ARCH_VERSION + '（随 metago-lifeform 主包分发）');
  return 0;
}

function cmdInit(dir, tier) {
  const target = path.resolve(dir || '.');
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    console.error('❌ 目录不存在: ' + target);
    return 2;
  }
  const cfgPath = path.join(target, 'arch.config.json');
  if (fs.existsSync(cfgPath)) {
    console.log('ℹ️ 已存在 arch.config.json，跳过（如需修改请手动编辑）');
    return 0;
  }
  const tierVal = (tier || 'B').toUpperCase();
  if (!['A', 'B', 'C'].includes(tierVal)) {
    console.error('❌ 档位必须是 A/B/C');
    return 2;
  }
  const cfg = {
    tier: tierVal,
    check: {
      strict: true,
      layers: {
        domain: ['domain', 'entities', 'models'],
        application: ['application', 'services', 'use-cases', 'usecases'],
        adapters: ['adapters', 'api', 'controllers', 'endpoints'],
        infrastructure: ['infrastructure', 'core', 'db', 'database']
      },
      bannedDeps: {
        python: ['sqlalchemy', 'asyncpg', 'httpx', 'requests', 'redis', 'fastapi', 'flask', 'django', 'aiohttp'],
        ts: ['express', 'fastify', 'sequelize', 'prisma', 'typeorm', 'knex', 'pg', 'mysql', 'redis', 'axios']
      },
      allowImports: ['app.core.config', 'app.core.database', 'src.config', 'src.core.config']
    }
  };
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  console.log('✅ 已创建 ' + cfgPath + '（档位 ' + tierVal + '）');
  return 0;
}

function cmdScaffold(name, tier) {
  if (!name) {
    console.error('❌ 用法: metago-lifeform arch scaffold <项目名> --tier=A|B|C');
    return 2;
  }
  const root = path.resolve(process.cwd(), name);
  if (fs.existsSync(root)) {
    console.error('❌ 目标已存在: ' + root);
    return 2;
  }
  const mk = (p) => fs.mkdirSync(p, { recursive: true });
  const tierVal = ((tier || 'B').toUpperCase() === 'A') ? 'A' : 'B';
  mk(path.join(root, 'src/domain/entities'));
  mk(path.join(root, 'src/application/use-cases'));
  mk(path.join(root, 'src/application/ports'));
  mk(path.join(root, 'src/adapters/repositories'));
  mk(path.join(root, 'src/infrastructure'));

  fs.writeFileSync(path.join(root, 'arch.config.json'), JSON.stringify({ tier: tierVal, check: { strict: true } }, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(root, 'README.md'),
    '# ' + name + '\n\n整洁架构骨架（metago-lifeform arch scaffold 生成）\n\n分层：domain（实体/接口）→ application（用例）→ adapters（实现）→ infrastructure（装配）\n\n检查：metago-lifeform arch check .\n');
  fs.writeFileSync(path.join(root, 'src/domain/entities/Example.ts'),
    '// 实体：核心业务规则，零框架依赖\nexport interface Example {\n  id: string;\n  name: string;\n}\n');
  fs.writeFileSync(path.join(root, 'src/application/ports/ExampleRepository.ts'),
    "import type { Example } from '../../domain/entities/Example';\n\nexport interface ExampleRepository {\n  findById(id: string): Example | null;\n}\n");
  fs.writeFileSync(path.join(root, 'src/application/use-cases/PlaceOrder.ts'),
    "import type { ExampleRepository } from '../ports/ExampleRepository';\n\nexport class PlaceOrder {\n  constructor(private readonly repo: ExampleRepository) {}\n  execute(id: string) {\n    return this.repo.findById(id);\n  }\n}\n");
  fs.writeFileSync(path.join(root, 'src/adapters/repositories/MemoryExampleRepository.ts'),
    "import type { Example } from '../../domain/entities/Example';\nimport type { ExampleRepository } from '../../application/ports/ExampleRepository';\n\nexport class MemoryExampleRepository implements ExampleRepository {\n  findById(id: string): Example | null {\n    return null;\n  }\n}\n");
  fs.writeFileSync(path.join(root, 'src/infrastructure/main.ts'),
    "import { MemoryExampleRepository } from '../adapters/repositories/MemoryExampleRepository';\nimport { PlaceOrder } from '../application/use-cases/PlaceOrder';\n\nconst repo = new MemoryExampleRepository();\nconst useCase = new PlaceOrder(repo);\nconsole.log(useCase.execute('1'));\n");

  console.log('✅ 已生成整洁架构骨架: ' + root);
  return 0;
}

function cmdCheck(dir, json) {
  const r = runLint(dir, json ? ['--json'] : []);
  process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status === null ? 1 : r.status;
}

function cmdReport(dir) {
  const target = path.resolve(dir || '.');
  const r = runLint(target, []);
  const reportPath = path.join(target, 'arch-report.md');
  const lines = [
    '# 架构检查报告',
    '- 时间: ' + new Date().toISOString(),
    '- 目录: ' + target,
    '',
    '```',
    r.stdout.trim(),
    '```',
    ''
  ];
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  process.stdout.write(r.stdout);
  console.log('📄 报告已写入: ' + reportPath);
  return r.status === null ? 1 : r.status;
}

function help() {
  console.log('metago-arch-gov CLI（主包内置，v1.1.0）\n\n用法:\n  metago-lifeform arch version\n  metago-lifeform arch init [目录] --tier=A|B|C\n  metago-lifeform arch scaffold <项目名> --tier=A|B|C\n  metago-lifeform arch check [目录] [--json]\n  metago-lifeform arch report [目录]\n\n（独立安装包可用 metago-arch 前缀调用相同子命令）\n');
  return 0;
}

function main(argv) {
  const args = argv || process.argv.slice(2);
  const cmd = args[0] || 'help';
  const rest = args.slice(1);
  const tierArg = rest.find((a) => a.startsWith('--tier='));
  let tier = tierArg ? tierArg.slice('--tier='.length) : null;
  if (!tier) {
    const tierIdx = rest.indexOf('--tier');
    if (tierIdx >= 0 && rest[tierIdx + 1]) tier = rest[tierIdx + 1];
  }
  const pos = rest.filter((a) => !a.startsWith('--'));
  switch (cmd) {
    case 'version': return cmdVersion();
    case 'init': return cmdInit(pos[0] || '.', tier);
    case 'scaffold': return cmdScaffold(pos[0], tier);
    case 'check': return cmdCheck(pos[0] || '.', rest.includes('--json'));
    case 'report': return cmdReport(pos[0] || '.');
    default: return help();
  }
}

module.exports = { main };
if (require.main === module) process.exit(main());
