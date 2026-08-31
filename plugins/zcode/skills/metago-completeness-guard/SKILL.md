---
name: metago-completeness-guard
description: 完整性治理——把"完整"从主观断言变成机器可验证的检查。当需要宣称任务/方案/文档"完成""完整""完美"时，必须先运行完整性验证并生成标准声明；禁止使用禁用声明词（绝对完整/100%完美/不会再缺等）。提供验证引擎、活基线、缺口登记册、完整性雷达、强制门的使用方法。
version: "1.0.0"
author: "MetaGO"
category: "元构工程质量族"
platforms: ["trae","claude-code","codex","cursor","codebuddy","qoder","zcode","chatgpt-work","workbuddy","kimi-code","kimi-work"]
trigger: ["宣称完成", "宣称完整", "交付前", "验证方案", "缺口登记", "完整性检查"]
---

# 元构完整性治理（MetaGO Completeness Guard）

## 核心原则（不可违反）

1. **完整性 = 基线覆盖全绿，不是主观断言**——宣称完整前必须运行验证，输出覆盖报告；
2. **缺口可见**——所有未覆盖项必须登记（可见的缺口优于隐藏的完美），不存在"没发现=没有"；
3. **声明纪律**——禁止使用禁用词：`绝对完整 / 100%完美 / 100%完整 / 不会再缺 / 不可能有遗漏`；标准声明格式：
   > "当前基线（Vx，N 项）覆盖全绿 + 已知缺口 M 项已登记"
4. **基线是活的**——新框架/新标准/新功能 → `baseline add` 纳入基线 → 重新验证；
5. **完整性是持续治理**——定期 `radar check` 扫描行业/竞品/元构升级，不是一次达成。

## 操作流程（强制按序）

1. **初始化**：`completeness-guard init --target <项目目录>`（生成配置 + 缺口登记册 + 雷达档案）
2. **验证**：`completeness-guard verify --doc <文档路径>`——全绿（exit 0）才允许宣称完整；有缺口 → 补齐或登记后重跑
3. **登记缺口**：`completeness-guard gaps add "<缺口描述>" --source <来源> --plan <计划>`（来源：用户/雷达/自审）
4. **雷达**：`completeness-guard radar check`——过期则按观察清单扫描行业新标准/竞品新功能/元构升级，发现 → `gaps add` 或 `baseline add`
5. **声明**：`completeness-guard declaration --doc <路径>`——生成标准声明（替代"我做完了一切都完整"式断言）

## 强制门（安装后自动生效）

- **PreToolUse 拦截**：输出含禁用声明词时返回拦截（hooks 已配置时）；
- **Stop 触发**：会话结束时若存在未验证交付，生成提醒；
- **CLI 门禁**：`completeness-guard verify` 失败 exit 1——CI 可接入，失败即阻断发布。

## 配置要点

- `completeness.config.json`：target（文档路径/版本）、baselines（启用基线）、enforcement（强制等级/禁用词/hooks）、radar（扫描周期）、gaps（登记册路径）；
- 自定义基线：`completeness-guard baseline add <组> <条目> <关键词...>` 或编辑 `baselines/user-custom.json`。

## 与本技能配套的资产

- CLI：`completeness-guard`（verify/init/baseline/gaps/radar/declaration/check-text）
- 基线：B1 权威框架 / B2 行业标配 / B3 协议标准 / B4 自解剖 / B5 元构法则 / B6 竞品对标 / B7 用户自定义
- 本技能即"软强制层"（教会 Agent 遵守）；hooks 为"硬强制层"（不可绕过）。
