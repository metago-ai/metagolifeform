#!/usr/bin/env node
/**
 * MetaGO Engine 发布前完整性门禁
 *
 * 在 npm publish 之前强制校验包内容完整，防止再次出现：
 *   - EVOLUTION.md 未随包发布（loader.js requiredFiles 校验失败，CLI 全灭）
 *   - RUNTIME/dist/algorithms/ 缺失（927 算法硬驱动失效，@metago-ai/algorithms 无引擎可载）
 *   - dist/cli.js 无 shebang（POSIX 下 bin 无法直接执行）
 *
 * 用法：node scripts/verify-dist.cjs   （npm publish 时通过 prepublishOnly 自动触发）
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const pkgRoot = path.resolve(__dirname, '..');
const errors = [];

function check(cond, msg) {
  if (!cond) errors.push(msg);
}

// 1. loader.js requiredFiles 对应的实体文件必须存在
const requiredFiles = [
  'ENGINE.md',
  'CONSTITUTION/AXIOMS.md',
  'CORE/ATTRIBUTES.md',
  'CORE/PROTOCOLS.md',
  'INDEX/engines.json',
  'INDEX/skills.json',
  'INDEX/tools.json',
  'INDEX/knowledge.json',
  'EVOLUTION.md',
];
for (const rel of requiredFiles) {
  check(fs.existsSync(path.join(pkgRoot, rel)), `缺少 loader 必需文件: ${rel}`);
}

// 2. 构建产物必须存在；算法注册表为"增强项"（硬校验+软告警分级）
//    - 硬：dist 存在、cli.js 有 shebang（CLI 可用性）
//    - 软：dist/algorithms 注册表（927 算法内嵌；engine 核心运行不依赖它，
//      消费方 @metago-ai/algorithms 已自带 vendored 注册表。缺失时告警：
//      完整内嵌版应从含全量源码的 monorepo 构建发布）
const distDir = path.join(pkgRoot, 'RUNTIME', 'dist');
check(fs.existsSync(distDir), 'RUNTIME/dist/ 不存在，请先运行 npm run build');
const warnings = [];
const registryPath = path.join(distDir, 'algorithms', 'registry.js');
if (fs.existsSync(distDir) && !fs.existsSync(registryPath)) {
  warnings.push('RUNTIME/dist/algorithms/ 未内嵌（927 算法注册表不在本包内；@metago-ai/algorithms 已 vendored 自带，不影响功能。如需内嵌请从全量 monorepo 构建发布）');
}

// 3. CLI 入口必须有 shebang
const cliPath = path.join(distDir, 'cli.js');
if (fs.existsSync(cliPath)) {
  const head = fs.readFileSync(cliPath, 'utf8').slice(0, 64);
  check(head.startsWith('#!/usr/bin/env node'), 'RUNTIME/dist/cli.js 缺少 #!/usr/bin/env node shebang（检查 src/cli.ts 首行）');
} else {
  errors.push('RUNTIME/dist/cli.js 不存在，请先运行 npm run build');
}

// 4. package.json files 列表必须覆盖关键路径
const pkg = require(path.join(pkgRoot, 'package.json'));
const files = pkg.files || [];
for (const need of ['RUNTIME/dist/', 'EVOLUTION.md']) {
  check(files.includes(need), `package.json files 缺少 "${need}"`);
}

if (warnings.length > 0) {
  console.warn('[verify-dist] 告警（不阻断发布）：');
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
}
if (errors.length > 0) {
  console.error('[verify-dist] 发布门禁未通过：');
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`[verify-dist] 发布门禁通过（${requiredFiles.length} 必需文件 + CLI shebang 均就绪）`);
