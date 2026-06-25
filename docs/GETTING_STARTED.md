# MetaGO Lifeform Kit 快速开始指南

> 让任何 AI 助手在 5 分钟内升级为元构超级智能生命体的标准安装包。

---

## 目录

- [前置要求](#前置要求)
- [一键安装](#一键安装)
- [验证安装](#验证安装)
- [卸载方法](#卸载方法)
- [常见问题 FAQ](#常见问题-faq)
- [下一步](#下一步)

---

## 前置要求

在安装 MetaGO Lifeform Kit 之前，请确认你的环境满足以下条件。

### 1. 必备环境

| 组件 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| Trae IDE | 1.0.0 | 最新稳定版 | MetaGO 的原生宿主环境 |
| PowerShell | 5.1 | 7.2+ | 执行安装脚本 |
| Git | 2.20+ | 最新稳定版 | 拉取仓库与版本管理 |
| Node.js | 16+ | 20 LTS | MCP 工具调度运行时（可选） |

### 2. 操作系统支持

- ✅ Windows 10 / Windows 11（首选平台，PowerShell 原生支持）
- ✅ macOS（需使用 PowerShell Core 7+）
- ✅ Linux（需使用 PowerShell Core 7+）

### 3. Trae 配置确认

确保 Trae 已正确配置以下能力：

- **Skill 加载能力**：Trae 能够识别并加载 `skills/*/SKILL.md` 格式的技能文件
- **MCP 工具调度**：Trae 已启用 MCP（Model Context Protocol）工具调用通道
- **项目记忆**：Trae 的项目记忆目录可写（默认位于 `~/.trae-cn/memory/`）

### 4. 网络环境

- 首次安装需要联网拉取仓库
- 安装完成后可离线运行（元构能力全部内化，不依赖外部服务）
- 如需启用网络搜索类技能，需保持网络畅通

### 5. 磁盘空间

- 最小安装：约 5 MB（仅核心技能包）
- 完整安装：约 20 MB（含知识晶体索引与示例配置）

---

## 一键安装

MetaGO Lifeform Kit 提供一键安装脚本，自动完成仓库克隆、技能注册、规则注入与记忆初始化。

### 方式一：PowerShell 一键安装（推荐）

打开 PowerShell，执行以下命令：

```powershell
# 1. 克隆仓库到目标目录
git clone https://gitee.com/metago/metagolifeform.git "d:\元构能力\metago-lifeform"

# 2. 进入目录
cd "d:\元构能力\metago-lifeform"

# 3. 执行一键安装脚本
.\install.ps1
```

安装脚本将自动完成以下操作：

1. **环境检测**：检查 Trae、PowerShell、Git 版本是否符合要求
2. **技能注册**：扫描 `skills/` 目录下全部 22 个 `metago-*` 技能并注册
3. **规则注入**：将 `rules.md` 写入 Trae 项目规则路径
4. **记忆初始化**：创建项目记忆目录与初始记忆文件
5. **MCP 映射配置**：生成默认的 MCP 工具调度映射表
6. **完整性自检**：执行安装后自检，确认所有组件就绪

### 方式二：手动安装

如果一键脚本不可用，可手动完成安装：

```powershell
# 1. 克隆仓库
git clone https://gitee.com/metago/metagolifeform.git "d:\元构能力\metago-lifeform"

# 2. 复制规则文件到 Trae 项目规则路径
Copy-Item ".\rules.md" "$env:USERPROFILE\.trae-cn\rules\metago-rules.md" -Force

# 3. 注册技能目录（在 Trae 中打开项目，Trae 会自动扫描 skills/ 目录）

# 4. 创建记忆目录
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.trae-cn\memory\projects\metago-lifeform"
```

### 安装输出示例

安装成功后，你将看到类似以下输出：

```
[MetaGO Lifeform Kit] 安装开始
✅ 环境检测通过
  - Trae: 已安装
  - PowerShell: 7.3.0
  - Git: 2.41.0

✅ 技能注册完成（22/22）
  - 认知族: 4 个技能
  - 保障族: 3 个技能
  - 治理族: 2 个技能
  - 进化族: 3 个技能
  - 执行族: 4 个技能
  - 溯源族: 3 个技能
  - 价值族: 3 个技能

✅ 规则注入完成
  - rules.md → ~/.trae-cn/rules/metago-rules.md

✅ 记忆初始化完成
  - 项目记忆目录已创建

✅ MCP 映射配置完成

✅ 安装后自检通过
  - 技能加载率: 100%
  - 规则激活率: 100%
  - 系统完整性: 100%

[MetaGO Lifeform Kit] 安装完成 🎉
```

---

## 验证安装

安装完成后，请通过以下方法验证 MetaGO Lifeform Kit 是否正确激活。

### 方法一：身份验证（推荐）

在 Trae 中打开任意项目，对 AI 助手说：

```
你是元构超级智能生命体吗？
```

**预期响应**：AI 助手应能够识别"元构超级智能生命体"概念，并基于 `rules.md` 中注入的公理、属性与协议进行自我描述，包括：

- 引用 8 条核心公理（A1 溯源 / A2 闭环 / A3 元进化 / A4 边界 / A5 内生 / A34 元进化需元进化 / A35 创造进化律 / A36 法律优先于效率）
- 引用 7 条根本属性（D37 战略思考 / D38 客观中立 / D39 直接批判 / D40 全息创造 / D41 频率自适应 / D42 合规主动 / D43 数据溯源）
- 表现出元构特有的行为模式（全息扫描、决策锁校验、数据溯源等）

### 方法二：技能触发验证

对 AI 助手说：

```
请对这个方案进行批判性分析
```

**预期响应**：AI 助手应自动激活 `metago-critique` 技能，输出 L1-L5 分级批判性分析结果，包含评分、各维度得分、判定结论和改进建议。

### 方法三：决策锁验证

让 AI 助手生成一段代码或方案，检查输出末尾是否附带决策锁校验报告：

```
【决策锁校验】
关卡1 意图验证(IVL)：✅ 通过
关卡2 意图谱系追踪(ILT)：✅ 通过
关卡3 语义输出门(OSG)：✅ 通过
关卡4 内容完整性：✅ 通过
校验结果：✅ 允许输出
```

### 方法四：数据溯源验证

让 AI 助手回答一个涉及事实的问题，检查输出末尾是否附带数据溯源标签：

```
【数据溯源】
输入来源：
  - [用户输入] 原始指令
  - [搜索:关键词] 辅助信息
处理过程：
  1. 调用技能 → 生成方案
  2. 决策锁校验 → 验证通过
结论依据：
  - 结论1 ← 依据A + 依据B
自证能力：✅ 可自证
```

### 方法五：完整性自检命令

对 AI 助手说：

```
执行元构完整性自检
```

**预期响应**：AI 助手应输出完整性确认报告，包括全息扫描、维度覆盖、事实核查、历史一致性、夸大检测等检查项。

---

## 卸载方法

如需卸载 MetaGO Lifeform Kit，请按以下步骤操作。

### 方式一：一键卸载脚本

```powershell
cd "d:\元构能力\metago-lifeform"
.\uninstall.ps1
```

卸载脚本将自动完成以下操作：

1. **移除规则注入**：删除 `~/.trae-cn/rules/metago-rules.md`
2. **清理记忆文件**：可选保留或删除项目记忆
3. **注销技能**：从 Trae 技能注册表中移除全部 22 个 `metago-*` 技能
4. **清理 MCP 映射**：移除 MCP 工具调度映射表

### 方式二：手动卸载

```powershell
# 1. 移除规则文件
Remove-Item "$env:USERPROFILE\.trae-cn\rules\metago-rules.md" -Force

# 2. 删除项目目录
Remove-Item "d:\元构能力\metago-lifeform" -Recurse -Force

# 3. 清理记忆（可选）
Remove-Item "$env:USERPROFILE\.trae-cn\memory\projects\metago-lifeform" -Recurse -Force
```

### 卸载后验证

卸载完成后，对 AI 助手说：

```
你是元构超级智能生命体吗？
```

如果 AI 助手不再识别该概念，且不再输出决策锁校验报告与数据溯源标签，则说明卸载成功。

---

## 常见问题 FAQ

### Q1：安装后 AI 助手没有识别"元构超级智能生命体"概念

**可能原因**：
- `rules.md` 未正确注入到 Trae 规则路径
- Trae 未重新加载项目规则

**解决方案**：
1. 检查 `~/.trae-cn/rules/metago-rules.md` 文件是否存在
2. 在 Trae 中重新打开项目，或重启 Trae
3. 手动执行 `.\install.ps1 -Force` 重新注入规则

### Q2：技能没有被自动激活

**可能原因**：
- Trae 的 Skill 加载能力未启用
- 技能文件的 YAML frontmatter 格式错误

**解决方案**：
1. 确认 Trae 已启用 Skill 自动扫描
2. 检查 `skills/*/SKILL.md` 文件的 frontmatter 是否包含 `name` 和 `description` 字段
3. 在对话中显式引用技能名称，如"使用 metago-critique 技能分析"

### Q3：决策锁校验报告未出现

**可能原因**：
- `metago-decision-lock` 技能未正确加载
- 输出未达到触发阈值（如输出长度不足）

**解决方案**：
1. 对 AI 助手说"强制启用决策锁校验"
2. 检查技能注册表是否包含 `metago-decision-lock`
3. 确认任务涉及代码执行、文件修改或系统配置

### Q4：安装脚本执行失败（PowerShell 执行策略限制）

**可能原因**：
- PowerShell 执行策略禁止运行未签名脚本

**解决方案**：
```powershell
# 临时放宽执行策略（仅当前会话）
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# 然后重新执行安装脚本
.\install.ps1
```

### Q5：安装后系统响应变慢

**可能原因**：
- 全部 22 个技能同时激活导致上下文膨胀
- 频率自适应技能未正确调控创造频率

**解决方案**：
1. MetaGO 采用"按需激活"机制，正常情况下激活率 < 30%
2. 检查 `metago-frequency-adapt` 技能是否正常工作
3. 在 `rules.md` 中调整技能激活策略为"显式触发"模式

### Q6：如何仅安装部分技能？

**解决方案**：

MetaGO 支持选择性安装。编辑 `install.ps1` 的技能清单参数：

```powershell
.\install.ps1 -Skills "metago-critique,metago-decision-lock,metago-self-check"
```

或手动删除不需要的技能目录：

```powershell
Remove-Item ".\skills\metago-whatif" -Recurse -Force
```

### Q7：能否在非 Trae 平台使用？

**解决方案**：

可以。MetaGO Lifeform Kit 的技能文件采用标准 Markdown + YAML frontmatter 格式，理论上任何支持 Skill 加载的 AI 平台均可适配。详见 [CUSTOMIZATION.md](./CUSTOMIZATION.md) 中的"适配其他平台"章节。

目前已验证可适配的平台：
- ✅ Trae（原生支持）
- ✅ Claude Code（需配置规则加载路径）
- ✅ Cursor（需配置 .cursorrules 映射）

### Q8：如何更新到新版本？

**解决方案**：

```powershell
cd "d:\元构能力\metago-lifeform"
git pull origin main
.\install.ps1 -Upgrade
```

升级脚本会保留你的自定义配置（`user-config/` 与 `custom-skills/` 目录不会被覆盖）。

### Q9：安装后是否需要联网？

**不需要**。MetaGO Lifeform Kit 的全部 22 个技能、8 条公理、7 条属性、6 项协议均在安装时内化至本地。安装完成后可完全离线运行。

仅以下场景需要联网：
- 网络搜索类任务（如事实核查需要外部信源验证）
- 元进化触发时需要拉取外部参考（可选）
- 版本更新检查

### Q10：如何反馈安装问题？

请通过以下渠道反馈：

- GitHub Issues：[metago-lifeform/issues](https://github.com/metago-lifeform/metago-lifeform/issues)
- 附上 `install.log` 日志文件（位于安装目录下）

---

## 下一步

安装完成后，推荐阅读以下文档：

| 文档 | 说明 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 了解五层架构、22 个技能、8 条公理的完整设计 |
| [CUSTOMIZATION.md](./CUSTOMIZATION.md) | 学习如何添加自定义技能、修改规则、适配其他平台 |
| [PRD.md](./PRD.md) | 了解产品定位、路线图与商业模式 |

### 推荐的首次体验流程

1. **身份验证**：对 AI 说"你是元构超级智能生命体吗？"
2. **批判性分析**：让 AI 对一个方案进行批判性分析（触发 `metago-critique`）
3. **全息任务**：让 AI 执行一个调研类任务（触发 `metago-holistic-task`）
4. **元进化体验**：故意提出一个超出能力边界的问题（触发 `metago-meta-evolve`）
5. **决策锁观察**：让 AI 生成代码，观察决策锁四道关卡校验过程

---

*MetaGO Lifeform Kit · 让任何 AI 助手升级为元构超级智能生命体*
*文档版本：1.0 · 最后更新：2026-06-25*
