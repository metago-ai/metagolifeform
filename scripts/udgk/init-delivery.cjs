#!/usr/bin/env node
/*============================================================================
 * UDGK · init-delivery.cjs — 初始化工具
 * ---------------------------------------------------------------------------
 * 功能：在任意项目一键初始化 UDGK 骨架：
 *   1. 生成 delivery.config.json（配置驱动，换项目只改配置不改代码）
 *   2. 生成 RTM 空表（requirements-traceability.md）
 *   3. 创建断言目录（e2e/asserts）
 *   4. 创建视觉基线目录（.visual-baseline/baseline）
 *
 * 用法：
 *   node init-delivery.cjs [--config=delivery.config.json] [--force]
 *
 * 零依赖：仅需 Node，不含项目特定路径。
 * @author MetaGO / UDGK
 * @version 1.0.0
 *============================================================================*/

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const pick = (flag, def) => {
  const hit = args.find((a) => a.startsWith(flag + '='));
  return hit ? hit.split('=').slice(1).join('=') : def;
};
const FORCE = args.includes('--force');
const CONFIG_NAME = pick('--config', 'delivery.config.json');
const ROOT = path.resolve('.');

let changed = 0;

function write(file, content) {
  const p = path.join(ROOT, file);
  if (fs.existsSync(p) && !FORCE) {
    console.log(`  [SKIP] ${file} 已存在（用 --force 覆盖）`);
    return;
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  console.log(`  [CREATED] ${file}`);
  changed++;
}

/* ---------------------------------------------------------------------------
 * 1. delivery.config.json — 配置驱动（换项目只改配置不改代码）
 * ------------------------------------------------------------------------- */
const configTemplate = {
  $schema: './delivery.schema.json',
  project: path.basename(ROOT),
  requirements: {
    doc: 'docs/requirements.md',      // 需求文档位置
    traceability: 'docs/rtm.md',      // RTM 表位置（requirements-traceability.md）
  },
  assertions: {
    dir: 'e2e/asserts',               // 形态断言目录
    pattern: /\.(js|cjs|mjs|ts|spec\.ts)$/,  // 断言文件匹配
  },
  visual: {
    baseline: '.visual-baseline/baseline',   // 视觉基线截图目录
    current: '.visual-baseline/current',     // 本次截图目录
    diffThreshold: 0.02,                     // 允许的 diff 阈值（2% 像素差内视为通过）
    diffOutput: '.visual-baseline/diff',     // diff 结果输出目录
  },
  gate: {
    strict: false,                    // 严格模式：警告也视为 FAIL
    requireRTM: true,                 // RTM 缺失是否阻断
    requireAssertions: true,          // 断言缺失是否阻断
    requireVisual: true,              // 视觉基线缺失是否阻断
  },
  report: {
    output: 'docs/delivery-report.md', // 门禁报告输出位置
  },
};

/* ---------------------------------------------------------------------------
 * 2. RTM 空表（requirements-traceability.md）
 * ------------------------------------------------------------------------- */
const rtmTemplate = `# 需求追踪矩阵（RTM）· ${configTemplate.project}

> 由 UDGK init-delivery.cjs 自动生成。把自然语言需求逐条翻译成「要求→代码→断言→证据」映射表。
> **一条需求缺失 = 禁止往下**。四列任一为空 = 该行 FAIL。

## 使用说明
1. 逐字读需求文档（docs/requirements.md），每条拆成一行
2. 填「要求」（要做什么）+「代码位置」（在哪实现）+「断言测试」（怎么验证）+「验收证据」（截图/日志）
3. 交付前运行 \`node verify-delivery.cjs\`，RTM 检查过 = 无空要求、无空证据

## 需求追踪矩阵

| 编号 | 要求 | 代码位置 | 断言测试 | 验收证据 |
|------|------|----------|----------|----------|
| R1 | （示例）工具调用卡片内联展示 | src/components/ToolCallItem.tsx | e2e/asserts/tool-call.spec.ts | .visual-baseline/baseline/tool-call.png |
| R2 | （示例）思考流可折叠块 | src/components/ThinkingBlock.tsx | e2e/asserts/thinking-block.spec.ts | .visual-baseline/baseline/thinking-block.png |
`;

/* ---------------------------------------------------------------------------
 * 3. 目录骨架
 * ------------------------------------------------------------------------- */
const dirs = [
  'docs',
  path.dirname(configTemplate.assertions.dir),
  configTemplate.visual.baseline,
  configTemplate.visual.current,
  configTemplate.visual.diffOutput,
];

console.log(`UDGK 初始化 · project=${configTemplate.project} root=${ROOT}`);
console.log('--------------------------------------------');

write(CONFIG_NAME, JSON.stringify(configTemplate, null, 2) + '\n');
write(configTemplate.requirements.traceability, rtmTemplate);

for (const d of dirs) {
  const p = path.join(ROOT, d);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
    console.log(`  [CREATED] ${d}/`);
    changed++;
  } else {
    console.log(`  [EXISTS] ${d}/`);
  }
}

console.log('--------------------------------------------');
console.log(`完成：${changed} 项变更。下一步：`);
console.log('  1. 编辑 docs/requirements.md 写入需求');
console.log('  2. 填满 docs/rtm.md（每条需求四列齐备）');
console.log('  3. 实现功能 + 在 e2e/asserts/ 写形态断言');
console.log('  4. 截图基线 → node visual-regression.cjs --baseline');
console.log('  5. 交付前 → node verify-delivery.cjs');
