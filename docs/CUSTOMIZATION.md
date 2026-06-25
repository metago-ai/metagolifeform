# MetaGO Lifeform Kit 自定义指南

> 本文介绍如何添加自定义技能、修改规则、配置 MCP 调度、创建知识晶体索引、适配其他 AI 平台，以及自定义 MCP Server 的 tools 与 prompts。

---

## 目录

- [添加自定义技能](#添加自定义技能)
- [修改 rules.md](#修改-rulesmd)
- [配置 MCP 调度映射](#配置-mcp-调度映射)
- [创建知识晶体索引](#创建知识晶体索引)
- [适配其他平台](#适配其他平台)
- [自定义 MCP Server tools 与 prompts](#自定义-mcp-server-tools-与-prompts)
- [技能格式模板示例](#技能格式模板示例)

---

## 添加自定义技能

MetaGO Lifeform Kit 的技能采用标准 `SKILL.md` 格式，由 **YAML frontmatter** + **Markdown 正文** 构成。你可以为任何重复性任务创建自定义技能。

### SKILL.md 格式说明

每个技能是一个独立目录，包含一个 `SKILL.md` 文件：

```
skills/
  metago-your-skill/        ← 技能目录（建议以 metago- 前缀命名）
    SKILL.md                 ← 技能定义文件
```

#### 文件结构

```markdown
---
（可选）溯源元数据 frontmatter
---

---
name: "metago-your-skill"
description: "技能描述。说明技能的用途与触发条件。当XXX时触发。"
---

# 技能名称（中文）

技能的简要说明。

## 触发条件

- 触发条件1
- 触发条件2

## 执行流程

### 步骤1：XXX
- 具体操作

### 步骤2：XXX
- 具体操作

## 输出格式

\```
【技能名称】
字段1：[值]
字段2：[值]
判定：[结论]
\```

## 与其他技能的协同

- 与 `metago-xxx` 协同：[协同说明]
```

#### YAML frontmatter 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 技能唯一标识，建议使用 `metago-` 前缀 + 小写连字符 |
| `description` | 是 | 技能描述，必须包含用途与触发条件，末尾建议标注"当XXX时触发" |

#### 可选溯源元数据

在 `name`/`description` frontmatter 之前，可以添加溯源元数据：

```yaml
---
source_document: 源文档路径
source_skill: 源技能名称
source_section: 源文档章节与行号
---
```

### 创建自定义技能的步骤

#### 步骤 1：创建技能目录

```powershell
New-Item -ItemType Directory -Path "d:\元构能力\metago-lifeform\skills\metago-your-skill"
```

#### 步骤 2：编写 SKILL.md

创建 `d:\元构能力\metago-lifeform\skills\metago-your-skill\SKILL.md`，按上述格式编写。

#### 步骤 3：验证技能加载

在所使用的 AI 平台（Trae / Claude Code / Codex / Cursor / CodeBuddy / Qoder / ZCode）中重新打开项目，对 AI 说：

```
请使用 metago-your-skill 技能执行 XXX 任务
```

如果技能被正确加载，AI 会按技能定义的流程执行。

### 自定义技能最佳实践

1. **单一职责**：每个技能只做一件事，复杂能力拆分为多个技能
2. **明确触发条件**：在 `description` 末尾明确标注"当XXX时触发"
3. **结构化输出**：使用固定格式的输出模板，便于其他技能解析
4. **标注协同关系**：在"与其他技能的协同"章节说明与现有技能的协作方式
5. **遵循公理约束**：自定义技能不得违反 8 条核心公理，特别是 A36（法律优先于效率）

---

## 修改 rules.md

`rules.md` 是 MetaGO Lifeform Kit 的统一规则加载入口，包含公理、属性、协议、技能索引与行业规则。

### rules.md 的结构

```markdown
# MetaGO Lifeform Kit 规则

## 一、核心公理（8 条）
[A1-A36 公理定义]

## 二、根本属性（7 条）
[D37-D43 属性定义]

## 三、运行协议（6 项）
[元进化循环/决策锁/批判性分析/合规主动/频率自适应/数据溯源]

## 四、技能索引（22 个）
[22 个 metago-* 技能的名称与描述]

## 五、MCP 工具调度映射
[技能 → MCP 工具的映射表]

## 六、行业规则（可扩展）
[行业特定规则]
```

### 添加行业特定规则

在 `rules.md` 的"六、行业规则"章节添加你的行业规则：

```markdown
## 六、行业规则

### 6.1 金融行业规则

- 所有涉及投资建议的输出必须附带风险提示
- 不得提供确定性收益承诺
- 必须引用最新监管政策（溯源至官方文件）
- 涉及客户数据时强制触发 metago-compliance 合规检查

### 6.2 医疗行业规则

- 不得提供确定性诊断结论（必须建议就医）
- 所有医学信息必须溯源至权威医学文献
- 涉及处方药信息时强制触发合规检查
- 必须标注"本信息不构成医疗建议"

### 6.3 法律行业规则

- 不得提供确定性法律结论（必须建议咨询律师）
- 法律条文必须溯源至现行有效法规
- 案例引用必须标注判决文书编号
- 必须标注"本信息不构成法律意见"
```

### 修改公理与属性的注意事项

> ⚠️ **警告**：8 条核心公理与 7 条根本属性是系统的本体论基础，**不建议修改**。修改公理可能导致系统行为不可预测。

如果确实需要调整（如关闭某条公理的强制触发），请在 `rules.md` 中添加覆盖声明：

```markdown
## 公理覆盖声明

> 以下覆盖声明仅适用于本项目，不影响 MetaGO Lifeform Kit 的核心设计。

- A36 法律优先于效率：在本项目中，对于内部工具链操作，允许在合规评估通过后跳过强制审批环节
```

### 添加项目特定规则

在 `rules.md` 末尾添加项目特定规则：

```markdown
## 七、项目特定规则

### 7.1 代码风格
- 使用 4 空格缩进
- 函数名使用 camelCase
- 常量名使用 UPPER_SNAKE_CASE

### 7.2 提交规范
- 遵循 Conventional Commits 规范
- 每次提交必须通过决策锁校验
- 涉及破坏性变更必须标注 BREAKING CHANGE

### 7.3 文档规范
- 所有文档使用中文编写
- Markdown 格式
- 必须包含目录
```

---

## 配置 MCP 调度映射

MCP（Model Context Protocol）工具调度映射表定义了技能与 MCP 工具之间的调用关系。

### 映射表格式

映射表位于 `rules.md` 的"五、MCP 工具调度映射"章节，也独立维护于 `config/mcp-mapping.yaml`：

```yaml
# MCP 工具调度映射表
mcp_mapping:
  # 文件操作类
  file_read:
    tool: "read_file"
    skills: ["metago-data-provenance", "metago-holistic-task", "metago-fact-check"]
    description: "读取文件内容"

  file_write:
    tool: "write_file"
    skills: ["metago-action-plan"]
    description: "写入文件内容"
    pre_check: "metago-compliance"  # 写入前强制合规检查

  # 代码搜索类
  code_search:
    tool: "search_codebase"
    skills: ["metago-holistic-task", "metago-problem-trace"]
    description: "语义化代码搜索"

  # 网络搜索类
  web_search:
    tool: "web_search"
    skills: ["metago-fact-check", "metago-holistic-task"]
    description: "网络搜索"
    pre_check: "metago-compliance"

  # 命令执行类
  run_command:
    tool: "run_command"
    skills: ["metago-action-plan"]
    description: "执行命令行命令"
    pre_check: "metago-compliance"
    post_check: "metago-output-integrity"

  # 数据库查询类
  db_query:
    tool: "db_query"
    skills: ["metago-holistic-task", "metago-data-provenance"]
    description: "数据库查询"
    pre_check: "metago-compliance"
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `tool` | 是 | MCP 工具名称 |
| `skills` | 是 | 允许调用该工具的技能列表 |
| `description` | 否 | 工具描述 |
| `pre_check` | 否 | 调用前强制执行的检查技能 |
| `post_check` | 否 | 调用后强制执行的检查技能 |

### 添加自定义 MCP 映射

如果你有自定义的 MCP 工具，在 `config/mcp-mapping.yaml` 中添加映射：

```yaml
  # 自定义工具
  custom_api_call:
    tool: "custom_api"
    skills: ["metago-your-skill"]
    description: "调用自定义 API"
    pre_check: "metago-compliance"
    post_check: "metago-data-provenance"
```

### MCP 调度的安全约束

1. **合规前置**：涉及文件写入、命令执行、外部 API 调用的工具，必须设置 `pre_check: "metago-compliance"`
2. **完整性后置**：涉及代码生成的工具，建议设置 `post_check: "metago-output-integrity"`
3. **溯源强制**：所有 MCP 工具调用都会生成脉冲见证，记录到溯源链
4. **权限隔离**：每个工具只能被 `skills` 列表中的技能调用，防止越权

---

## 创建知识晶体索引

知识晶体索引是对大型文档的全息索引，支持按需激活（激活率 < 30%）。

### 知识晶体索引的格式

参考 `元构全息知识晶体索引.md`，知识晶体索引按多维度组织：

```markdown
# [文档名称] 知识晶体索引

> 本文件是《[源文档]》文档（X行/Y字符）的全息知识晶体索引。
> 支持全息按需激活（激活率<30%），按多维度快速定位文档内容。
> 源文档：[源文档路径]

---

## 维度一：版本演进索引

| 版本 | 名称 | 行号范围 | 核心内容 |
|------|------|----------|----------|
| V1.0 | 基础架构 | 1-800 | ... |

---

## 维度二：核心概念索引

| 编号 | 概念 | 行号范围 | 核心要义 |
|------|------|----------|----------|
| 1 | 概念A | 100-200 | ... |

---

## 维度三：关键规则索引

| 规则ID | 规则名称 | 行号范围 | 功能 | 激活技能 |
|--------|----------|----------|------|----------|
| R001 | 规则A | 200-250 | ... | metago-xxx |

---

## 全息按需激活规则

1. **激活率<30%**：每次任务只激活相关维度
2. **按需定位**：根据任务类型，从对应维度索引定位
3. **交叉引用**：多维度交叉定位
4. **技能联动**：索引指向激活技能

### 激活示例

**任务：代码审查**
  维度三(规则A) + 维度二(概念B)
  激活技能：metago-decision-lock + metago-output-integrity
```

### 创建知识晶体索引的步骤

#### 步骤 1：分析源文档

通读源文档，识别可索引的维度（版本、概念、规则、案例等）。

#### 步骤 2：建立行号映射

为每个关键内容标注行号范围，便于精确定位。

#### 步骤 3：关联激活技能

为每个索引项关联对应的 `metago-*` 技能。

#### 步骤 4：编写激活示例

为常见任务类型编写激活示例，指导系统如何按需激活。

#### 步骤 5：放置索引文件

将知识晶体索引文件放置在项目根目录或 `knowledge/` 目录下：

```
d:\元构能力\metago-lifeform\
  knowledge/
    your-doc-index.md    ← 你的知识晶体索引
```

#### 步骤 6：在 rules.md 中注册

在 `rules.md` 的技能索引章节后添加知识晶体索引引用：

```markdown
## 四、技能索引（22 个）
[...]

## 四.1、知识晶体索引
- 元构全息知识晶体索引：[元构全息知识晶体索引.md](../元构全息知识晶体索引.md)
- 你的文档索引：[knowledge/your-doc-index.md](./knowledge/your-doc-index.md)
```

---

## 平台适配

MetaGO Lifeform Kit 已支持 7 大 AI 平台，技能文件采用标准 Markdown + YAML frontmatter 格式，通过 `adapters/` 目录下的适配器模板适配各平台。

### 已支持平台（7个）

| 平台 | 规则文件 | 适配器目录 | 状态 |
|------|----------|------------|------|
| Trae | `rules.md` | `adapters/trae/` | ✅ 已支持 |
| Claude Code | `CLAUDE.md` | `adapters/claude-code/` | ✅ 已支持 |
| OpenAI Codex | `AGENTS.md` | `adapters/codex/` | ✅ 已支持 |
| Cursor | `.cursor/rules/*.mdc` | `adapters/cursor/` | ✅ 已支持 |
| CodeBuddy | `CODEBUDDY.md` | `adapters/codebuddy/` | ✅ 已支持 |
| Qoder | `.qoder/rules/*.md` | `adapters/qoder/` | ✅ 已支持 |
| ZCode | `CLAUDE.md` | `adapters/zcode/` | ✅ 已支持 |

### Claude Code / ZCode 适配

#### 步骤 1：创建 CLAUDE.md

在项目根目录创建 `CLAUDE.md`，将 `rules.md` 内容映射进去：

```markdown
# CLAUDE.md

## 项目规则

[将 rules.md 的公理、属性、协议内容粘贴于此]

## 技能索引

[将 22 个技能的 name 与 description 列表粘贴于此]
```

#### 步骤 2：配置技能加载路径

Claude Code 会自动扫描项目目录下的 `SKILL.md` 文件。确保 `skills/` 目录结构不变：

```
your-project/
  CLAUDE.md               ← 规则映射
  skills/
    metago-critique/
      SKILL.md
    metago-decision-lock/
      SKILL.md
    ...
```

#### 步骤 3：MCP 工具配置

在 Claude Code 的 MCP 配置中，添加 MetaGO 工具映射：

```json
{
  "mcpServers": {
    "metago-tools": {
      "command": "node",
      "args": ["./mcp-server/metago-server.js"],
      "env": {
        "METAGO_SKILLS_PATH": "./skills"
      }
    }
  }
}
```

> ZCode 与 Claude Code 兼容，使用相同的 `CLAUDE.md` 规则文件和 `~/.claude/skills/` 技能目录，适配方式完全一致。

### Cursor 适配

#### 步骤 1：创建 .cursor/rules/*.mdc

在项目 `.cursor/rules/` 目录下创建 `.mdc` 规则文件（含 YAML frontmatter），将 `rules.md` 核心内容映射进去：

```markdown
---
description: MetaGO Lifeform Kit 规则
globs: "**/*"
---

# Cursor Rules for MetaGO Lifeform Kit

## 核心公理
[8 条公理的简要说明]

## 根本属性
[7 条属性的简要说明]

## 运行协议
[6 项协议的简要说明]

## 技能索引
[22 个技能的 name 与 description]
```

#### 步骤 2：技能目录映射

Cursor 不原生支持 `SKILL.md` 格式的技能加载，需要将技能描述合并到 `.mdc` 规则文件中：

```markdown
## 技能详细说明

### metago-critique（批判性分析）
[技能正文内容]

### metago-decision-lock（决策锁）
[技能正文内容]
```

#### 步骤 3：MCP 工具适配

Cursor 支持 MCP 工具调用，可直接复用 MetaGO 的 MCP 映射配置。

### OpenAI Codex 适配

在项目根目录创建 `AGENTS.md`，将 `rules.md` 核心内容映射进去（文件大小 ≤ 32KB）：

```markdown
# AGENTS.md

## 核心公理
[8 条公理的简要说明]

## 根本属性
[7 条属性的简要说明]

## 运行协议
[6 项协议的简要说明]

## 技能索引
[22 个技能的 name 与 description]
```

> Codex 兼容 AGENTS.md 开放标准（Linux Foundation 下的 Agentic AI Foundation 管理），核心规则内容编写一次即可在多个兼容平台复用。

### CodeBuddy 适配

在项目根目录创建 `CODEBUDDY.md`，将 `rules.md` 核心内容映射进去。CodeBuddy 支持通过 `.codebuddy/rules/` 目录加载技能规则。

### Qoder 适配

在项目 `.qoder/rules/` 目录下创建 `.md` 规则文件，将 `rules.md` 核心内容映射进去。Qoder 同样兼容 AGENTS.md 开放标准。

### 如何为新平台创建适配器

1. 在 `adapters/` 下创建新目录（如 `adapters/windsurf/`）
2. 创建规则模板文件（参考现有适配器）
3. 创建 README.md 说明配置路径和安装方法
4. 更新 `scripts/install.ps1` 添加新平台支持
5. 更新主 README.md 的平台表格

### 适配器模板结构

每个适配器必须包含：
- 规则模板文件（.template 后缀）
- README.md（配置路径、安装方法、验证方式）
- 完整的8条公理、7条属性、6项协议内容

### 适配通用原则

1. **规则映射**：将 `rules.md` 的公理、属性、协议转换为目标平台的规则格式
2. **技能注入**：将 `SKILL.md` 的 `description` 注入到目标平台的技能/工具描述中
3. **MCP 适配**：如果目标平台支持 MCP，直接复用映射配置；否则将工具调用逻辑内嵌到技能正文中
4. **验证流程**：适配后，使用"你是元构超级智能生命体吗？"验证规则是否生效

---

## 自定义 MCP Server tools 与 prompts

MCP Server 子包位于 [`packages/mcp-server/`](../packages/mcp-server/)，其能力元数据完全代码化，便于自定义扩展。本节介绍如何添加自定义 tools 与 prompts。

### 文件结构概览

```
packages/mcp-server/
├── src/
│   ├── index.ts          入口：注册 tools/prompts，启动 stdio 传输
│   ├── skills-data.ts    22 个技能元数据（tools 源）
│   └── prompts.ts        8 个引导词元数据（prompts 源）
├── package.json          @metago/mcp-server
└── tsconfig.json
```

入口 `index.ts` 遍历 `SKILLS` 与 `PROMPTS` 两个数组，自动注册为 MCP tools / prompts。因此，**自定义能力的核心是修改 `skills-data.ts` 与 `prompts.ts` 两个数据文件**，无需改动注册逻辑。

### 自定义 MCP tool（修改 skills-data.ts）

#### SkillMeta 数据结构

```ts
export interface SkillMeta {
  /** 技能唯一标识，如 'metago-decision-lock' */
  id: string;
  /** MCP tool 名称（下划线格式），如 'metago_decision_lock' */
  toolName: string;
  /** 中文名称，如 '决策锁' */
  name: string;
  /** 工具描述（展示给客户端） */
  description: string;
  /** 能力族：认知族 / 保障族 / 治理族 / 进化族 / 执行族 / 溯源族 / 价值族 */
  category: string;
  /** 执行引导词（包含触发条件、核心流程、输出格式） */
  guide: string;
}
```

每个 tool 在被调用时，会返回 `${guide}\n\n## 用户输入\n${args.input}` 的拼接文本。其中 `input` 是固定参数（字符串），由 `index.ts` 中的 zod schema 定义，**自定义 tool 无需重复声明参数 schema**。

#### 添加自定义 tool 示例

在 `packages/mcp-server/src/skills-data.ts` 的 `SKILLS` 数组中追加一项：

```ts
{
  id: "metago-code-review",
  toolName: "metago_code_review",
  name: "代码审查",
  description: "对代码进行安全性、规范性、性能、可维护性四维度审查。当用户请求代码审查、合并请求、代码变更时触发。",
  category: "保障族",
  guide: `## 触发条件
当用户请求代码审查、提交合并请求、代码变更涉及核心模块时触发。

## 执行流程
1. 安全性审查：SQL 注入 / XSS / 敏感信息硬编码 / 权限校验缺失
2. 规范性审查：命名 / 缩进 / 注释 / 文件结构
3. 性能审查：N+1 查询 / 不必要循环 / 内存泄漏 / 阻塞操作
4. 可维护性审查：函数长度 / 单一职责 / 依赖关系 / 单元测试

## 输出格式
按四维度给出 PASS/FAIL 与证据，附总评与改进建议。`,
},
```

#### 命名约定

| 字段 | 约定 |
|------|------|
| `id` | 与 `skills/` 目录下的技能目录同名（连字符格式，如 `metago-code-review`） |
| `toolName` | 下划线格式，客户端通过此名称发起 tool_call（如 `metago_code_review`） |
| `name` | 中文显示名称 |
| `description` | 必须包含用途与触发条件，末尾建议标注"当XXX时触发" |
| `category` | 限定为：认知族 / 保障族 / 治理族 / 进化族 / 执行族 / 溯源族 / 价值族；自定义技能建议归入"保障族"或新建族后同步更新 `category` |

### 自定义 MCP prompt（修改 prompts.ts）

#### PromptMeta 数据结构

```ts
export interface PromptArgument {
  /** 参数名称 */
  name: string;
  /** 参数描述 */
  description: string;
  /** 是否必填 */
  required: boolean;
}

export interface PromptMessage {
  /** 消息角色 */
  role: "user" | "assistant";
  /** 消息内容 */
  content: { type: "text"; text: string };
}

export interface PromptMeta {
  /** MCP prompt 名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 参数列表 */
  arguments?: PromptArgument[];
  /** 消息序列 */
  messages: PromptMessage[];
}
```

消息文本中可使用 `{{参数名}}` 占位符，由 `index.ts` 在运行时替换为实际参数值。

#### 添加自定义 prompt 示例

在 `packages/mcp-server/src/prompts.ts` 的 `PROMPTS` 数组中追加一项：

```ts
{
  name: "metago_code_review_guide",
  description: "代码审查引导：对给定代码执行四维度审查（安全/规范/性能/可维护性）。",
  arguments: [
    {
      name: "code",
      description: "待审查的代码",
      required: true,
    },
  ],
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: "请对以下代码执行四维度审查：\n{{code}}",
      },
    },
    {
      role: "assistant",
      content: {
        type: "text",
        text: "启动代码审查。依次执行安全性（SQL注入/XSS/硬编码/权限）、规范性（命名/缩进/注释/结构）、性能（N+1/循环/内存/阻塞）、可维护性（长度/职责/依赖/测试）四维度，逐项给出 PASS/FAIL 与证据，附总评与改进建议。",
      },
    },
  ],
},
```

#### 参数占位符规则

- 占位符格式：`{{参数名}}`，参数名须与 `arguments[].name` 一致。
- 无参数的 prompt（如 `metago_activate`、`metago_coupling_assess`）可不声明 `arguments` 字段。
- `required: true` 的参数在客户端调用时必须提供；`required: false` 或未声明 `arguments` 的参数可省略。

### 构建与本地验证

完成自定义后，构建并启动 MCP Server 进行验证：

```powershell
# 进入子包目录
cd "d:\元构能力\metago-lifeform\packages\mcp-server"

# 安装依赖（首次）
npm install

# 编译 TypeScript
npm run build      # 产物输出至 dist/

# 启动服务（生产模式）
npm start          # node dist/index.js

# 开发模式（tsx 热加载，便于调试）
npm run dev        # tsx src/index.ts
```

启动后控制台会输出 `[metago-mcp-server] 服务已启动，等待客户端连接...`，随后即可在 MCP 客户端配置中通过 `npx -y @metago/mcp-server` 或本地路径 `node ./packages/mcp-server/dist/index.js` 调用。

> 本地开发时，可在客户端 MCP 配置中直接指向本地构建产物，避免反复发布 npm：
>
> ```json
> {
>   "mcpServers": {
>     "metago": {
>       "command": "node",
>       "args": ["d:/元构能力/metago-lifeform/packages/mcp-server/dist/index.js"]
>     }
>   }
> }
> ```

### 自定义最佳实践

1. **保持一对一映射**：自定义 MCP tool 应与 `skills/` 目录下的 `SKILL.md` 一一对应，避免能力割裂。
2. **guide 完整**：`guide` 字段需包含触发条件、执行流程、输出格式三段，确保客户端获得结构化引导。
3. **遵循公理约束**：自定义 tool 不得违反 8 条核心公理，特别是 A36（法律优先于效率）；涉及外部 API 调用的 tool 建议在 guide 中前置合规检查说明。
4. **prompt 参数最小化**：仅声明真正需要的参数，必填参数须严格校验，可选参数使用 `.optional()`。
5. **能力族归类**：自定义 tool 的 `category` 须归入既有 7 大能力族，便于客户端按族筛选。
6. **版本管理**：自定义后请同步递增 `packages/mcp-server/package.json` 的 `version`，并保持根包 `metago` 元数据中的 `mcpServer.tools` 计数一致。

---

## 技能格式模板示例

以下是完整的技能模板，可直接复制使用：

### 模板一：分析类技能

```markdown
---
source_document: [源文档路径]
source_skill: [源技能名称]
source_section: [源文档章节与行号]
---

---
name: "metago-your-analysis"
description: "[技能名称]。[技能用途说明]。当[触发条件]时触发。"
---

# [技能名称]（English Name）

[技能的简要说明，1-2 段]

## 触发条件

- [触发条件1]
- [触发条件2]
- [触发条件3]

## 核心流程

### 步骤1：[步骤名称]
- [具体操作]
- [输出内容]

### 步骤2：[步骤名称]
- [具体操作]
- [输出内容]

### 步骤3：[步骤名称]
- [具体操作]
- [输出内容]

## 评估维度

| 维度 | 权重 | 说明 |
|------|------|------|
| [维度1] | [X]% | [说明] |
| [维度2] | [X]% | [说明] |
| [维度3] | [X]% | [说明] |

## 判定标准

```
[判定条件1] → [结论1]
[判定条件2] → [结论2]
[判定条件3] → [结论3]
```

## 输出格式

```
【[技能名称]】
[字段1]：[值]
[字段2]：[值]
[字段3]：[值]
判定：[结论]
建议：[改进建议]
```

## 核心原则

1. **[原则1]**：[说明]
2. **[原则2]**：[说明]
3. **[原则3]**：[说明]

## 与其他技能的协同

- 与 `metago-xxx` 协同：[协同说明]
- 与 `metago-yyy` 协同：[协同说明]
```

### 模板二：执行类技能

```markdown
---
name: "metago-your-execution"
description: "[技能名称]。[技能用途说明]。当[触发条件]时触发。"
---

# [技能名称]（English Name）

[技能的简要说明]

## 触发条件

- [触发条件1]
- [触发条件2]

## 执行流程

### 阶段1：[阶段名称]（< [耗时]）
- [操作1]
- [操作2]
- **核心认知**：[关键认知点]

### 阶段2：[阶段名称]（< [耗时]）
- [操作1]
- [操作2]
- **输出**：[输出内容]

### 阶段3：[阶段名称]（< [耗时]）
- [操作1]
- [操作2]
- **判定**：[判定逻辑]

## 输出格式

```markdown
## [技能名称]报告

**触发原因**：[描述]

### [阶段1]
[内容]

### [阶段2]
[内容]

### [阶段3]
[内容]

**最终结果**：[结论]
```

## 与其他技能的协同

- 与 `metago-decision-lock` 协同：[输出前必须通过决策锁校验]
- 与 `metago-self-check` 协同：[输出后触发完整性自检]
```

### 模板三：监控类技能

```markdown
---
name: "metago-your-monitor"
description: "[技能名称]。[技能用途说明]。当[触发条件]时自动触发。"
---

# [技能名称]（English Name）

[技能的简要说明]

## 触发条件

- [触发条件1]
- [触发条件2]

## 监测公式

```
[公式]
[变量说明]
```

## 监测周期

| 频率 | 内容 | 动作 |
|------|------|------|
| [频率1] | [内容] | [动作] |
| [频率2] | [内容] | [动作] |

## 预警机制

| 指标值 | 预警等级 | 动作 |
|--------|----------|------|
| [值1] | [等级] | [动作] |
| [值2] | [等级] | [动作] |

## 输出格式

```
【[技能名称]】
当前指标：[值]
预警等级：[等级]
建议动作：[动作]
```

## 与其他技能的协同

- 与 `metago-xxx` 协同：[协同说明]
```

### 自定义技能完整示例

以下是一个完整的自定义技能示例——代码审查技能：

```markdown
---
name: "metago-code-review"
description: "代码审查技能。对代码进行安全性、规范性、性能、可维护性四维度审查。当用户请求代码审查、提交合并请求、代码变更时触发。"
---

# 代码审查（Code Review）

对代码进行四维度审查，确保代码质量达到生产级标准。

## 触发条件

- 用户请求代码审查
- 检测到合并请求
- 代码变更涉及核心模块

## 审查维度

### 1. 安全性审查
- [ ] 是否存在 SQL 注入风险
- [ ] 是否存在 XSS 风险
- [ ] 是否存在敏感信息硬编码
- [ ] 是否存在权限校验缺失

### 2. 规范性审查
- [ ] 命名是否符合规范
- [ ] 缩进是否统一
- [ ] 注释是否完整
- [ ] 文件结构是否合理

### 3. 性能审查
- [ ] 是否存在 N+1 查询
- [ ] 是否存在不必要的循环
- [ ] 是否存在内存泄漏风险
- [ ] 是否存在阻塞操作

### 4. 可维护性审查
- [ ] 函数长度是否合理（<50行）
- [ ] 单一职责是否满足
- [ ] 依赖关系是否清晰
- [ ] 是否有单元测试

## 判定标准

```
全部通过 → ✅ 允许合并
1-3项未通过 → ⚠️ 建议修改后合并
关键项（安全）未通过 → ❌ 拒绝合并
```

## 输出格式

```
【代码审查报告】
安全性：✅ 通过 / ❌ [问题列表]
规范性：✅ 通过 / ⚠️ [建议列表]
性能：✅ 通过 / ⚠️ [建议列表]
可维护性：✅ 通过 / ⚠️ [建议列表]
审查结论：✅ 允许合并 / ⚠️ 建议修改 / ❌ 拒绝合并
```

## 与其他技能的协同

- 与 `metago-decision-lock` 协同：审查结果必须通过决策锁校验
- 与 `metago-output-integrity` 协同：审查报告必须完整无占位符
- 与 `metago-self-check` 协同：审查后触发完整性自检
```

---

*MetaGO Lifeform Kit · 自定义指南*
*文档版本：1.1 · 最后更新：2026-06-26（新增"自定义 MCP Server tools 与 prompts"章节）*
