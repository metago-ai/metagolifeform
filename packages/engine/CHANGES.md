# 元构引擎版本演进（MetaGO Engine Changelog）

> 本文件记录元构引擎自身的版本演进历史。
> 创建时间：2026-06-28

---

## 版本演进

### 2.1.1（2026-07-26）

**打包完整性修复**

#### 修复
- `package.json files` 补入 `EVOLUTION.md`（loader.js requiredFiles 校验要求，2.1.0 npm 包缺失导致 `metago-engine` CLI 无法启动）
- `RUNTIME/src/cli.ts` 补 `#!/usr/bin/env node` shebang（POSIX 下 bin 直接执行）
- 新增 `scripts/verify-dist.cjs` 发布前门禁并挂接 `prepublishOnly`：强制校验 9 个必需文件 + `dist/algorithms` 三档注册表 + CLI shebang，防止带病发布

### 2.1.0（2026-07-26）

**927 算法硬驱动**

#### 新增
- 927 算法注册表（T1/T2/T3 三档，57 工具 / 14 触发大类）
- 配套 `@metago-ai/algorithms` MCP 服务器包（四层暴露架构）

### 1.0.0（2026-06-28）

**初始发布**

#### 新增
- 引擎入口 ENGINE.md
- 宪法层 CONSTITUTION/AXIOMS.md（36 条公理，8 条关键）
- 核心层 CORE/ATTRIBUTES.md（43 条属性，7 条关键）
- 核心层 CORE/PROTOCOLS.md（108 个协议，6 个关键）
- 索引层 INDEX/engines.json（125 个引擎）
- 索引层 INDEX/skills.json（39 个技能）
- 索引层 INDEX/tools.json（53 项 MCP 工具）
- 索引层 INDEX/knowledge.json（知识晶体索引）
- 运行时 RUNTIME/src/loader.ts（引擎加载器）
- 运行时 RUNTIME/src/validators.ts（公理验证器）
- 运行时 RUNTIME/src/decision-lock.ts（决策锁执行器）
- 运行时 RUNTIME/src/evolution-engine.ts（进化引擎）
- 运行时 RUNTIME/src/perception.ts（感知层）
- 运行时 RUNTIME/src/memory.ts（运行时记忆）
- 运行时 RUNTIME/src/metrics.ts（度量层）
- 运行时 RUNTIME/tests/（测试套件）
- SDK types.d.ts（开发者接口）
- 适配器 ADAPTERS/（7 大平台）
- 进化机制 EVOLUTION.md
- 专利声明 PATENTS.md

#### 技术壁垒
- 公理验证器：基于公理集的 AI 输出验证方法
- 决策锁执行器：AI 决策的多级锁校验机制
- 进化引擎：AI 能力边界自动检测与进化方法
- 感知层：AI 能力边界感知方法
- 引擎加载协议：AI 引擎跨平台加载与校验协议

#### 元构体系对齐
- 元构体系版本：V36.5
- 产品化版本：metago-lifeform@36.7.0
- MCP Server 版本：@metago-ai/mcp-server@1.1.0

---

*由元构引擎维护 | 2026-06-28*
