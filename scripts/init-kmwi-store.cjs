/**
 * KMWI 四层记忆体系全局初始化脚本
 *
 * 把元构项目的现有知识、经验教训、用户偏好系统化导入到 KMWI 四层：
 *   K(Knowledge) 知识层 — 事实性知识（域名、envId、版本、技术栈）
 *   M(Memory)    记忆层 — 会话级记忆（近期决策、任务上下文）
 *   W(Wisdom)    智慧层 — 经验性洞察（失职教训、成功模式）
 *   I(Intuition) 直觉层 — 隐性知识（用户偏好、判断力）
 *
 * 运行方式：node scripts/init-kmwi-store.cjs
 *
 * 持久化路径：~/.trae-cn/memory/projects/-d-----/kmwi-store.json
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

const kmwiStorePath = path.join(
  os.homedir(), '.trae-cn', 'memory', 'projects', '-d-----', 'kmwi-store.json',
);

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
// K 层（知识）— 事实性知识
// ============================================================================
const knowledgeItems = [
  {
    id: `K-domain`,
    content: '官方域名：metago.life（蜀ICP备2026035958号）。绝对禁止把 CloudBase 默认域名 tcloudbaseapp.com 当成官方域名。',
    category: 'infrastructure',
    tags: ['domain', 'metago.life', 'icp'],
    createdAt: now,
    updatedAt: now,
    confidence: 1.0,
    sources: ['project_memory.md'],
  },
  {
    id: `K-cloudbase-env`,
    content: 'CloudBase envId: metago-d6gfw1e4rf2a5bcad。用于 Studio 前端数据操作和云函数部署。',
    category: 'infrastructure',
    tags: ['cloudbase', 'envid', '云开发'],
    createdAt: now,
    updatedAt: now,
    confidence: 1.0,
    sources: ['project_memory.md'],
  },
  {
    id: `K-mcp-tools-count`,
    content: 'MCP 工具总数 = 53。计算公式：22 思维工具(toolkit-data.ts) + 37 技能(skills-data.ts)去重 7 个同名 + 1 事件上报(metago_report_event) = 53。常见错误：22+38+1=61（38应为37、未去重）。',
    category: 'product',
    tags: ['mcp', 'tools', 'count', 'formula'],
    createdAt: now,
    updatedAt: now,
    confidence: 1.0,
    sources: ['project_memory.md'],
  },
  {
    id: `K-product-stack`,
    content: '产品栈：MetaGO Studio v1.1.9（Web+桌面端）+ 53 个 MCP 工具 + 39 个 metago-* 技能 + Engine V2.0.0（KMWI/EvolutionEngine/SkillGenerator）。桌面端 88.62 MB。',
    category: 'product',
    tags: ['studio', 'mcp', 'skills', 'engine'],
    createdAt: now,
    updatedAt: now,
    confidence: 1.0,
    sources: ['project_memory.md'],
  },
  {
    id: `K-strategy-framework`,
    content: '战略框架：元构光年 = Agent Harness 范式创造者 + FDE 服务模式 + 一人公司。产品线=MetaGO Agent Harness（驭智层）；服务线=AI 原生开发服务（FDE 模式）。Harness=驾驭智能体的运行时控制层；FDE=前沿部署工程。',
    category: 'strategy',
    tags: ['harness', 'fde', '战略', '驭智层'],
    createdAt: now,
    updatedAt: now,
    confidence: 1.0,
    sources: ['project_memory.md'],
  },
  {
    id: `K-eight-dimensions`,
    content: '8 维优势矩阵：核心 3 维（可靠性+进化性+溯源性）作为主卖点；扩展 5 维（客观性+合规性+完整性+理论深度+生命体属性）作为护城河支撑。8 维需并列表达。',
    category: 'strategy',
    tags: ['8维', '优势', '护城河'],
    createdAt: now,
    updatedAt: now,
    confidence: 1.0,
    sources: ['project_memory.md'],
  },
  {
    id: `K-credentials`,
    content: '凭证三重冗余存储：L4-1 git remote URL 硬编码 + L4-2 d:\\元构能力\\.secrets\\credentials.json + L4-3 project_memory.md 凭证区。凭证值不在代码中硬编码，从 credentials.json 或 git remote URL 读取。',
    category: 'secrets',
    tags: ['token', 'github', 'gitee', 'tencent', '凭证'],
    createdAt: now,
    updatedAt: now,
    confidence: 1.0,
    sources: ['project_memory.md'],
  },
  {
    id: `K-deploy-commands`,
    content: '部署命令：Studio 部署用 `tcb hosting deploy ./dist studio --env-id metago-d6gfw1e4rf2a5bcad`。每次部署后必须 curl 验证 metago.life/ 和 metago.life/studio/ 两个路径的 title。SSE 代理在腾讯云 118.24.186.55:8088/8089。',
    category: 'operations',
    tags: ['deploy', 'tcb', 'sse', 'curl'],
    createdAt: now,
    updatedAt: now,
    confidence: 1.0,
    sources: ['project_memory.md'],
  },
  {
    id: `K-engine-v2`,
    content: 'Engine V2 核心模块：MetaGOEngine 聚合类包含 kmwi(KMWIMemory)、skillGenerator(SkillGenerator)、evolution(EvolutionEngine)。KMWIMemory 构造函数接受 filePath 参数自动读写 JSON。已接入 MCP Server（硬驱动 metago_memory_manage / metago_meta_evolve / metago_meta_create）。',
    category: 'engineering',
    tags: ['engine', 'v2', 'kmwi', 'evolution'],
    createdAt: now,
    updatedAt: now,
    confidence: 1.0,
    sources: ['代码实现'],
  },
];

// ============================================================================
// M 层（记忆）— 会话级 / 近期决策
// ============================================================================
const memoryItems = [
  {
    id: `M-p0p1p2-done`,
    content: '2026-07-08 P0+P1+P2 全量开发完成：ShieldPage（8 维护盾）+ DepthAnalysisPage（4 tab）+ FdePage（5 角色 5 阶段）。FDE action 使用 _clientUid 识别普通用户，移到 adminToken 验证之前。',
    type: 'decision',
    tags: ['p0', 'p1', 'p2', 'fde', 'shield'],
    createdAt: now,
    recallCount: 0,
    lastRecalledAt: now,
    decayRate: 0,
    sources: ['project_memory.md'],
  },
  {
    id: `M-data-consistency-fix`,
    content: '2026-07-08 P0-P2 数据一致性全量修复完成（11 项）：所有 61→53、38→37、39→53 同步更新到 Studio+官网+文档。tsc 0 错误，build 成功，Web/exe/latest.yml 全部 HTTP 200。',
    type: 'milestone',
    tags: ['data', 'consistency', '修复'],
    createdAt: now,
    recallCount: 0,
    lastRecalledAt: now,
    decayRate: 0,
    sources: ['project_memory.md'],
  },
  {
    id: `M-engine-v2-mcp`,
    content: '2026-07-08 Engine V2 接入 MCP Server 完成：3 个工具（memory_manage/meta_evolve/meta_create）从软驱动升级为硬驱动。Engine package.json types 路径从 SDK/types.d.ts 改为 RUNTIME/dist/index.d.ts 修复类型导出。',
    type: 'decision',
    tags: ['engine', 'mcp', '硬驱动'],
    createdAt: now,
    recallCount: 0,
    lastRecalledAt: now,
    decayRate: 0,
    sources: ['本轮工作'],
  },
];

// ============================================================================
// W 层（智慧）— 经验性洞察、可复用模式
// ============================================================================
const wisdomItems = [
  {
    id: `W-verify-not-just-compile`,
    pattern: '编译通过 ≠ 运行通过。tsc 0 错误 + vite build 成功只是技术层必要条件，不是充分条件。必须做业务层验证（真实发送 AI 对话、真实点击按钮）。',
    description: '历史教训：2026-07-05 连续两轮只做 tsc+build，用户在 Web 端发现"对话发送后内容不显示"和"云函数返回空"。',
    successRate: 1.0,
    usageCount: 5,
    tags: ['验证', '运行时', '反绕过'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['AGENTS.md 第十一章'],
  },
  {
    id: `W-cloudbase-auth-no-auto-write`,
    pattern: 'CloudBase Auth 用户数据不会自动写入 user_profiles 集合。注册/登录后必须显式调用云函数写入用户档案，否则管理后台看不到用户。',
    description: '事故记录：2026-07-02 管理后台数据未打通，根因是交付时只做了查询展示，漏掉了数据写入环节。',
    successRate: 1.0,
    usageCount: 2,
    tags: ['cloudbase', 'auth', '数据链路'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['project_memory.md'],
  },
  {
    id: `W-tcb-fn-invoke-utf8`,
    pattern: 'tcb fn invoke 传递 JSON 参数必须用 `-d "@file.json"` 方式，文件必须是无 BOM 的 UTF-8（用 [System.IO.File]::WriteAllText + [System.Text.UTF8Encoding]::new($false)）。',
    description: 'PowerShell 默认编码会导致中文参数乱码，云函数解析失败。',
    successRate: 1.0,
    usageCount: 3,
    tags: ['tcb', 'powershell', '编码'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['project_memory.md'],
  },
  {
    id: `W-aiproxy-uid-required`,
    pattern: 'aiProxy 云函数需要 _clientUid 参数通过认证（401 未登录）。支持的模型 ID 是 deepseek-v4-pro 和 glm-5v-turbo，不是 deepseek-chat。',
    description: '调用 aiProxy 必须在请求 JSON 中添加 "_clientUid":"test-verify-uid"。',
    successRate: 1.0,
    usageCount: 4,
    tags: ['aiproxy', '认证', '模型'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['本轮工作'],
  },
  {
    id: `W-monorepo-workspace-install`,
    pattern: 'monorepo 使用 npm workspaces 时，新增依赖后必须在根目录运行 npm install 建立 workspace 链接，否则子包找不到本地依赖（TS2307 Cannot find module）。',
    description: 'Engine 包类型导出问题：package.json types 字段必须指向有完整类导出的 .d.ts 文件，不能指向只有接口定义的文件。',
    successRate: 1.0,
    usageCount: 2,
    tags: ['monorepo', 'workspace', 'typescript'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['本轮工作'],
  },
  {
    id: `W-studio-deploy-path`,
    pattern: 'Studio 部署必须用带 studio cloudPath 的命令：tcb hosting deploy ./dist studio --env-id metago-d6gfw1e4rf2a5bcad。部署后必须同时 curl 验证 metago.life/ 和 metago.life/studio/ 两个路径，防止根目录被覆盖。',
    description: 'CloudBase 静态网站必须设置 error document 为 index.html 支持 SPA 路由。',
    successRate: 1.0,
    usageCount: 6,
    tags: ['deploy', 'studio', 'cloudbase'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['project_memory.md'],
  },
  {
    id: `W-data-flow-audit`,
    pattern: '交付带数据的系统前必须执行 5 项闭环检查：A.数据源倒推 B.用户角色场景 C.端到端链路 D.空数据根因 E.反向验证。违反 = 开环交付 = 违反 A2 闭环公理。',
    description: '执行工具：npm run audit（26 项自动化检查）。',
    successRate: 1.0,
    usageCount: 3,
    tags: ['数据', '闭环', '验证'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['project_memory.md'],
  },
  {
    id: `W-no-mock-in-production`,
    pattern: '所有产品功能必须真实运行、真实可用，不允许任何演示或展示性质的功能。包括按钮和文字描述。如果 UI 有入口，必须有真实实现。',
    description: '用户原话：如果要做的话都必须是要实时关联的。他要是真实的，他一定不是那种纯演示和纯观赏的。',
    successRate: 1.0,
    usageCount: 5,
    tags: ['真实性', '反mock', '产品'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['用户指令'],
  },
];

// ============================================================================
// I 层（直觉）— 隐性知识、用户偏好、判断力
// ============================================================================
const intuitionItems = [
  {
    id: `I-user-completeness`,
    insight: '用户要求 100% 完整性、零遗漏、一次性完美实现。不接受分阶段、不接受 P0/P1/P2 优先级排序、不接受"本周/下周"时间分期。所有问题必须一次性修复完成。',
    accuracy: 0.95,
    validationCount: 8,
    validated: true,
    failureConditions: ['当任务确实过大需要分阶段时（但用户仍要求一次性）', '当依赖外部服务无法立即完成时'],
    tags: ['用户偏好', '完整性', '一次性'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['user_profile.md'],
  },
  {
    id: `I-user-no-multiple-choice`,
    insight: '用户不接受多选项选择。确认方案后执行，不停顿、不提问、持续工作直到终极目标达成。需要决策时直接给出推荐方案并执行。',
    accuracy: 0.9,
    validationCount: 5,
    validated: true,
    failureConditions: ['当方案涉及不可逆操作（如删除、force push）时仍需确认'],
    tags: ['用户偏好', '决策', '执行'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['user_profile.md'],
  },
  {
    id: `I-user-chinese`,
    insight: '沟通语言：中文。用户所有指令用中文，AI 回复也用中文。不喜欢代码名/缩写，要求清晰直接的标题。',
    accuracy: 1.0,
    validationCount: 20,
    validated: true,
    failureConditions: [],
    tags: ['用户偏好', '语言', '中文'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['user_profile.md'],
  },
  {
    id: `I-user-proactive`,
    insight: '用户要求 AI 比用户更周全。"不要什么都老是靠我去提醒你，你自己就要能考虑得到，而且还要比我考虑得更加周全才对。" 主动发现需要更新的内容（README、官网文字、版本号等），不等用户提醒。',
    accuracy: 0.95,
    validationCount: 4,
    validated: true,
    failureConditions: [],
    tags: ['用户偏好', '主动性', '周全'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['用户指令'],
  },
  {
    id: `I-user-quality`,
    insight: '用户追求最高品质、极端高端、极度高品质、高质感的设计效果。设计要有质感，不能廉价。',
    accuracy: 0.9,
    validationCount: 6,
    validated: true,
    failureConditions: [],
    tags: ['用户偏好', '品质', '设计'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['user_profile.md'],
  },
  {
    id: `I-memory-critical`,
    insight: '用户对 AI 记忆问题极其敏感。反复出现的老问题（如版本号滞后、工具数错误、token 丢失）会被严厉批评。承诺永久记录但实际没记录 = 严重失职。AI 是无状态的不是借口。',
    accuracy: 0.98,
    validationCount: 5,
    validated: true,
    failureConditions: [],
    tags: ['记忆', '用户敏感点', '失职'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['用户批评'],
  },
  {
    id: `I-no-should-be-ok`,
    insight: '"应该没问题"是偷懒的信号，等同于未完成。每项验证必须附带执行证据（命令输出、HTTP 状态码、AI 回复片段）。',
    accuracy: 1.0,
    validationCount: 4,
    validated: true,
    failureConditions: [],
    tags: ['验证', '反偷懒', '证据'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['AGENTS.md 第十五章'],
  },
  {
    id: `I-xiaohongshu-no-table`,
    insight: '小红书文章禁止使用表格，其他平台可以。',
    accuracy: 1.0,
    validationCount: 2,
    validated: true,
    failureConditions: [],
    tags: ['内容格式', '小红书'],
    createdAt: now,
    lastAppliedAt: now,
    sources: ['user_profile.md'],
  },
];

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
      // 更新 updatedAt，保留原 createdAt
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
store.version = '2.0.0';
store.lastUpdated = now;

// 写入文件
fs.writeFileSync(kmwiStorePath, JSON.stringify(store, null, 2), 'utf-8');

// 输出统计
console.log('✅ KMWI 四层记忆体系已全局建立');
console.log(`   持久化路径：${kmwiStorePath}`);
console.log(`   K 层知识：${store.knowledge.length} 条`);
console.log(`   M 层记忆：${store.memory.length} 条`);
console.log(`   W 层智慧：${store.wisdom.length} 条`);
console.log(`   I 层直觉：${store.intuitions.length} 条`);
console.log(`   综合健康度：H = ${(
  (store.knowledge.length * 10 + store.memory.length * 10 + store.wisdom.length * 10 + store.intuitions.length * 10) / 4
).toFixed(1)}（基于条目数·粗略评估）`);
