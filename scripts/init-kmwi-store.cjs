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
let store = { knowledge: [], memory: [], wisdom: [], intuitions: [], version: '1.0.0' };
if (fs.existsSync(kmwiStorePath)) {
  try {
    store = JSON.parse(fs.readFileSync(kmwiStorePath, 'utf-8'));
  } catch {
    // 文件损坏，重建
  }
}

const now = new Date().toISOString();

// ============================================================================
// 通用种子：不含任何个人/团队私有信息，仅为可复用的工程经验
// ============================================================================
const knowledgeItems = [
  {
    id: 'K-metago-harness',
    content: 'MetaGO Agent Harness（智能体运行时控制层套件 · 驭智层）：95 技能 + 53 MCP tools + 8 prompts + 算法服务器（57 tools / 927 algorithms）+ Engine V2（KMWI/EvolutionEngine/SkillGenerator/DecisionLock）。',
    category: 'product',
    tags: ['metago', 'harness', 'engine'],
    createdAt: now, updatedAt: now, confidence: 1.0, sources: ['AGENTS.md'],
  },
  {
    id: 'K-kmwi-structure',
    content: 'KMWI 四层记忆：K 知识（事实）/ M 记忆（会话）/ W 智慧（模式）/ I 直觉（偏好），持久化为 JSON，条目按 id 合并，confidence/successRate/accuracy 记录可信度。',
    category: 'engineering',
    tags: ['kmwi', 'memory', 'engine'],
    createdAt: now, updatedAt: now, confidence: 1.0, sources: ['AGENTS.md 第十六章'],
  },
];

const memoryItems = [
  {
    id: 'M-kmwi-init',
    content: `${now.slice(0, 10)} KMWI 四层记忆初始化完成（通用种子）。后续条目由会话自动累积，或经 --seed 注入。`,
    type: 'milestone',
    tags: ['kmwi', 'init'],
    createdAt: now, recallCount: 0, lastRecalledAt: now, decayRate: 0, sources: ['init-kmwi-store.cjs'],
  },
];

const wisdomItems = [
  {
    id: 'W-verify-not-just-compile',
    pattern: '编译通过 ≠ 运行通过。类型检查 0 错误 + 构建成功只是技术层必要条件，不是充分条件。必须做业务层验证（真实走一遍用户链路）。',
    description: '凡"应该没问题"都是偷懒信号；每项验证必须附执行证据（命令输出、HTTP 状态码、回复片段）。',
    successRate: 1.0, usageCount: 0, tags: ['验证', '运行时', '反绕过'],
    createdAt: now, lastAppliedAt: now, sources: ['AGENTS.md 第十一/十五章'],
  },
  {
    id: 'W-no-mock-in-production',
    pattern: '所有交付功能必须真实运行、真实可用，不允许任何演示或展示性质的功能。UI 有入口，就必须有真实实现。',
    description: '假数据/Mock 是最常见的交付缺陷来源之一。',
    successRate: 1.0, usageCount: 0, tags: ['真实性', '反mock', '产品'],
    createdAt: now, lastAppliedAt: now, sources: ['AGENTS.md 第十三章'],
  },
  {
    id: 'W-monorepo-workspace-install',
    pattern: 'monorepo 使用 npm workspaces 时，新增依赖后必须在根目录运行 npm install 建立 workspace 链接，否则子包找不到本地依赖（TS2307）。',
    description: 'package.json types 字段必须指向有完整类导出的 .d.ts 文件，不能指向只有接口定义的文件。',
    successRate: 1.0, usageCount: 0, tags: ['monorepo', 'workspace', 'typescript'],
    createdAt: now, lastAppliedAt: now, sources: ['工程实践'],
  },
  {
    id: 'W-data-flow-audit',
    pattern: '交付带数据的系统前必须执行闭环检查：A.数据源倒推 B.用户角色场景 C.端到端链路 D.空数据根因 E.反向验证。违反 = 开环交付。',
    description: '对应 A2 闭环公理。',
    successRate: 1.0, usageCount: 0, tags: ['数据', '闭环', '验证'],
    createdAt: now, lastAppliedAt: now, sources: ['AGENTS.md'],
  },
];

const intuitionItems = [
  {
    id: 'I-no-should-be-ok',
    insight: '"应该没问题"等同于未完成。每项验证必须附带执行证据。',
    accuracy: 1.0, validationCount: 0, validated: true, failureConditions: [],
    tags: ['验证', '反偷懒', '证据'],
    createdAt: now, lastAppliedAt: now, sources: ['AGENTS.md 第十五章'],
  },
  {
    id: 'I-completeness-first',
    insight: '交付追求完整闭环：列出的事实（数量、版本、链接）必须在所有出现处保持一致，一处更新、处处更新。',
    accuracy: 0.95, validationCount: 0, validated: true, failureConditions: [],
    tags: ['完整性', '一致性'],
    createdAt: now, lastAppliedAt: now, sources: ['AGENTS.md'],
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
store.memory = mergeItems(store.memory || [], memoryItems);
store.wisdom = mergeItems(store.wisdom || [], wisdomItems);
store.intuitions = mergeItems(store.intuitions || [], intuitionItems);
store.version = '2.1.0';
store.lastUpdated = now;

// 写入文件
fs.writeFileSync(kmwiStorePath, JSON.stringify(store, null, 2), 'utf-8');

// 输出统计
console.log('✅ KMWI 四层记忆体系已初始化');
console.log(`   持久化路径：${kmwiStorePath}`);
console.log(`   K 层知识：${store.knowledge.length} 条`);
console.log(`   M 层记忆：${store.memory.length} 条`);
console.log(`   W 层智慧：${store.wisdom.length} 条`);
console.log(`   I 层直觉：${store.intuitions.length} 条`);
