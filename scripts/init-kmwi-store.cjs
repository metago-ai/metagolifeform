#!/usr/bin/env node
/**
 * KMWI 四层记忆体系初始化脚本（通用版）
 *
 * 把项目知识、经验教训、用户偏好系统化导入到 KMWI 四层：
 *   K(Knowledge) 知识层 — 事实性知识（技术栈、版本、架构决策）
 *   M(Memory)    记忆层 — 会话级记忆（近期决策、任务上下文）
 *   W(Wisdom)    智慧层 — 经验性洞察（教训、成功模式）
 *   I(Intuition) 直觉层 — 隐性知识（用户偏好、判断力）
 *
 * 运行方式：
 *   node scripts/init-kmwi-store.cjs                      使用默认存储路径（按当前项目目录派生）
 *   node scripts/init-kmwi-store.cjs --store=<path>       指定 kmwi-store.json 路径
 *   node scripts/init-kmwi-store.cjs --seed=<file.json>   追加自定义种子数据（四层 JSON）
 *
 * 默认存储路径：~/.trae-cn/memory/projects/<项目目录哈希>/kmwi-store.json
 * （可用环境变量 METAGO_MEMORY_HOME 覆盖 ~/.trae-cn 根目录）
 *
 * 注意：仓库内置种子只含通用工程经验；团队/个人私有知识请通过 --seed 注入，
 * 私有种子文件不要提交到公开仓库。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 2.1.0
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

const args = process.argv.slice(2);
const optStore = (args.find((a) => a.startsWith('--store=')) || '').split('=')[1];
const optSeed = (args.find((a) => a.startsWith('--seed=')) || '').split('=')[1];

// 项目目录 → 稳定的哈希目录名（与 Trae 的项目编码风格一致：非字母数字转 -）
const projectKey = process.cwd().replace(/[^a-zA-Z0-9]/g, '-');
const memoryHome = process.env.METAGO_MEMORY_HOME || path.join(os.homedir(), '.trae-cn');
const kmwiStorePath = optStore
  ? path.resolve(optStore)
  : path.join(memoryHome, 'memory', 'projects', projectKey, 'kmwi-store.json');

const kmwiDir = path.dirname(kmwiStorePath);
if (!fs.existsSync(kmwiDir)) {
  fs.mkdirSync(kmwiDir, { recursive: true });
}

// 加载现有 store（如果有）
//
// 顶层键必须与引擎 @metago-ai/engine 的 KMWIMemory 一致：
//   { version, timestamp, knowledge, memories, wisdom, intuitions, history, baseline }
// 引擎 load() 读的是 `memories`（复数）；本脚本早期版本写的是 `memory`（单数），
// 于是"播种成功"之后引擎的 M 层仍然是空的。读取时两种键都接受，写出时只写规范键，
// 这样已有存储会被迁移而不是被丢弃。
let store = {
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  knowledge: [],
  memories: [],
  wisdom: [],
  intuitions: [],
  history: [],
  baseline: null,
};
if (fs.existsSync(kmwiStorePath)) {
  try {
    const loaded = JSON.parse(fs.readFileSync(kmwiStorePath, 'utf-8'));
    store = {
      ...store,
      ...loaded,
      // 兼容旧键：单数 memory → 复数 memories
      memories: loaded.memories || loaded.memory || [],
    };
  } catch {
    // 文件损坏，重建
  }
}

const now = new Date().toISOString();

// ============================================================================
// 通用种子：不含任何个人/团队私有信息，仅为可复用的工程经验
// ============================================================================
// 四层条目均按引擎 @metago-ai/engine 的类型接口逐字段给出（见 kmwi-memory.d.ts）：
//   KnowledgeItem{ id, content, category, tags, source, confidence, createdAt,
//                  lastAccessedAt, accessCount, linkedMemoryIds }
//   MemoryItem   { id, content, context, type, tags, source, createdAt,
//                  lastAccessedAt, accessCount, recallStrength, linkedWisdomIds }
//   WisdomItem   { id, pattern, description, causeEffect, applicability, antiPattern,
//                  tags, source, usageCount, successRate, createdAt, lastAppliedAt,
//                  linkedIntuitionIds }
//   IntuitionItem{ id, insight, implicitKnowledge, explicitForm, failureScenarios,
//                  accuracy, tags, source, createdAt, lastValidatedAt, validationCount }
// 早前版本用的是 `sources`（复数）/`failureConditions`/`recallCount` 等自造字段，
// 引擎读不到 → M 层恒为 0，且 `i.explicitForm.length` 直接抛异常。
const knowledgeItems = [
  {
    id: 'K-metago-harness',
    content: 'MetaGO Agent Harness（智能体运行时控制层套件 · 驭智层）：100 技能 + 55 MCP tools + 8 prompts + 算法服务器（57 tools / 927 algorithms）+ Engine V2（KMWI/EvolutionEngine/SkillGenerator/DecisionLock）。',
    category: 'product',
    tags: ['metago', 'harness', 'engine'],
    source: 'AGENTS.md',
    confidence: 1.0,
    createdAt: now, lastAccessedAt: now, accessCount: 0, linkedMemoryIds: [],
  },
  {
    id: 'K-kmwi-structure',
    content: 'KMWI 四层记忆：K 知识（事实）/ M 记忆（会话）/ W 智慧（模式）/ I 直觉（偏好），持久化为 JSON，条目按 id 合并，confidence/successRate/accuracy 记录可信度。',
    category: 'engineering',
    tags: ['kmwi', 'memory', 'engine'],
    source: 'AGENTS.md 第十六章',
    confidence: 1.0,
    createdAt: now, lastAccessedAt: now, accessCount: 0, linkedMemoryIds: [],
  },
];

const memoryItems = [
  {
    id: 'M-kmwi-init',
    content: `${now.slice(0, 10)} KMWI 四层记忆初始化完成（通用种子）。后续条目由会话自动累积，或经 --seed 注入。`,
    context: 'KMWI 初始化',
    type: 'long_term',
    tags: ['kmwi', 'init'],
    source: 'init-kmwi-store.cjs',
    // recallStrength 是引擎 M 层唯一读取的强度字段（computeLayerStats 的
    // `recallSum += item.recallStrength`）。只写 recallCount 这类计数字段，
    // 引擎会把它当成 0，M 层恒为下限。
    createdAt: now, lastAccessedAt: now, accessCount: 0, recallStrength: 1.0,
    linkedWisdomIds: [],
  },
];

const wisdomItems = [
  {
    id: 'W-verify-not-just-compile',
    pattern: '编译通过 ≠ 运行通过。类型检查 0 错误 + 构建成功只是技术层必要条件，不是充分条件。必须做业务层验证（真实走一遍用户链路）。',
    description: '凡"应该没问题"都是偷懒信号；每项验证必须附执行证据（命令输出、HTTP 状态码、回复片段）。',
    causeEffect: '把编译通过当成功能通过 → 用户一用就暴露 → 返工',
    applicability: '任何交付前的自检',
    antiPattern: false,
    source: 'AGENTS.md 第十一/十五章',
    successRate: 1.0, usageCount: 0, tags: ['验证', '运行时', '反绕过'],
    createdAt: now, lastAppliedAt: now, linkedIntuitionIds: [],
  },
  {
    id: 'W-no-mock-in-production',
    pattern: '所有交付功能必须真实运行、真实可用，不允许任何演示或展示性质的功能。UI 有入口，就必须有真实实现。',
    description: '假数据/Mock 是最常见的交付缺陷来源之一。',
    causeEffect: '用 mock 占位换进度 → 交付物不可用 → 信任崩塌',
    applicability: '功能开发与验收',
    antiPattern: true,
    source: 'AGENTS.md 第十三章',
    successRate: 1.0, usageCount: 0, tags: ['真实性', '反mock', '产品'],
    createdAt: now, lastAppliedAt: now, linkedIntuitionIds: [],
  },
  {
    id: 'W-monorepo-workspace-install',
    pattern: 'monorepo 使用 npm workspaces 时，新增依赖后必须在根目录运行 npm install 建立 workspace 链接，否则子包找不到本地依赖（TS2307）。',
    description: 'package.json types 字段必须指向有完整类导出的 .d.ts 文件，不能指向只有接口定义的文件。',
    causeEffect: '子包直接 npm install → 工作区链接缺失 → 类型解析失败',
    applicability: 'monorepo/workspaces 工程',
    antiPattern: false,
    source: '工程实践',
    successRate: 1.0, usageCount: 0, tags: ['monorepo', 'workspace', 'typescript'],
    createdAt: now, lastAppliedAt: now, linkedIntuitionIds: [],
  },
  {
    id: 'W-data-flow-audit',
    pattern: '交付带数据的系统前必须执行闭环检查：A.数据源倒推 B.用户角色场景 C.端到端链路 D.空数据根因 E.反向验证。违反 = 开环交付。',
    description: '对应 A2 闭环公理。',
    causeEffect: '只看单点功能，不看数据闭环 → 空数据/断链 → 上线即故障',
    applicability: '带数据的系统交付',
    antiPattern: false,
    source: 'AGENTS.md',
    successRate: 1.0, usageCount: 0, tags: ['数据', '闭环', '验证'],
    createdAt: now, lastAppliedAt: now, linkedIntuitionIds: [],
  },
];

const intuitionItems = [
  {
    id: 'I-no-should-be-ok',
    insight: '"应该没问题"等同于未完成。每项验证必须附带执行证据。',
    implicitKnowledge: '凡是无法立刻给出证据的结论，都不算结论。',
    // explicitForm 是**字符串**，引擎 computeExplicitRatio() 读 `i.explicitForm.length`；
    // 早前版本写成 failureConditions: [] 且没有 explicitForm → getHealth() 直接抛
    // Cannot read properties of undefined (reading 'length')。
    explicitForm: '每项验证附命令输出/HTTP 状态码/回复片段作为证据',
    failureScenarios: ['用"逻辑上正确"代替实际验证', '把上一轮的验证当成这一轮的'],
    accuracy: 1.0, validationCount: 1, validated: true,
    tags: ['验证', '反偷懒', '证据'],
    source: 'AGENTS.md 第十五章',
    createdAt: now, lastValidatedAt: now,
  },
  {
    id: 'I-completeness-first',
    insight: '交付追求完整闭环：列出的事实（数量、版本、链接）必须在所有出现处保持一致，一处更新、处处更新。',
    implicitKnowledge: '数字漂移是失职的前兆，不是排版问题。',
    explicitForm: '同一事实在 N 处出现时，改动必须同步 N 处，并由门禁校验',
    failureScenarios: ['只改了一处，其他处仍是旧值', '门禁只覆盖手写清单里的字段'],
    accuracy: 0.95, validationCount: 1, validated: true,
    tags: ['完整性', '一致性'],
    source: 'AGENTS.md',
    createdAt: now, lastValidatedAt: now,
  },
];

// ============================================================================
// 自定义种子（--seed=<file.json>，结构 { knowledge: [], memory: [], wisdom: [], intuitions: [] }）
// ============================================================================
if (optSeed) {
  const seedPath = path.resolve(optSeed);
  if (!fs.existsSync(seedPath)) {
    console.error(`❌ 种子文件不存在: ${seedPath}`);
    process.exit(1);
  }
  try {
    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    for (const key of ['knowledge', 'memory', 'wisdom', 'intuitions']) {
      if (Array.isArray(seed[key])) {
        const target = { knowledge: knowledgeItems, memory: memoryItems, wisdom: wisdomItems, intuitions: intuitionItems }[key];
        target.push(...seed[key]);
      }
    }
    console.log(`   已加载自定义种子: ${seedPath}`);
  } catch (e) {
    console.error(`❌ 种子文件 JSON 解析失败: ${e.message}`);
    process.exit(1);
  }
}

// ============================================================================
// 合并：不覆盖已有项（按 id 去重）
// ============================================================================
function mergeItems(existing, newItems) {
  const map = new Map();
  for (const item of existing) {
    map.set(item.id, item);
  }
  for (const item of newItems) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    } else {
      const merged = { ...map.get(item.id), ...item };
      merged.createdAt = map.get(item.id).createdAt;
      merged.updatedAt = now;
      map.set(item.id, merged);
    }
  }
  return Array.from(map.values());
}

store.knowledge = mergeItems(store.knowledge || [], knowledgeItems);
store.memories = mergeItems(store.memories || [], memoryItems);
store.wisdom = mergeItems(store.wisdom || [], wisdomItems);
store.intuitions = mergeItems(store.intuitions || [], intuitionItems);
store.version = '2.1.0';
store.timestamp = now;
store.lastUpdated = now;
// 引擎 save() 会写这两个字段、load() 会读它们；播种时一并给出，避免"引擎补齐前
// 的中间态"里 history/baseline 缺失导致的 undefined 分支。
store.history = Array.isArray(store.history) ? store.history : [];
if (!store.baseline) store.baseline = null;
delete store.memory;

// 写入文件
fs.writeFileSync(kmwiStorePath, JSON.stringify(store, null, 2), 'utf-8');

// 输出统计
console.log('✅ KMWI 四层记忆体系已初始化');
console.log(`   持久化路径：${kmwiStorePath}`);
console.log(`   K 层知识：${store.knowledge.length} 条`);
console.log(`   M 层记忆：${store.memories.length} 条`);
console.log(`   W 层智慧：${store.wisdom.length} 条`);
console.log(`   I 层直觉：${store.intuitions.length} 条`);
console.log('   顶层键：' + Object.keys(store).join(', '));
