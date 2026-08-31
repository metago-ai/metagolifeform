# 元构完整性治理套件（MetaGO Completeness Kit）

> 把"完整性"从**主观断言**变成**可安装、可配置、可强制生效的机器检查**。
> 适用于任何 Agent 与任何交付物（架构方案 / 代码 / 文档 / 报告）。

## 一句话原理

```
过去的我："我做完了，很完整。"（感觉）
现在的我："104 项验证全绿，缺口登记册 6 项如下，雷达在跑。"（证据）
```

## 四大机制（全部工程化）

| 机制 | 实现 | 强制方式 |
|------|------|---------|
| **验证引擎** | `completeness-guard verify`（基线关键词检查 + 元数据检查） | CLI 门禁（失败 exit 1） |
| **活基线** | `baselines/*.json` + `baseline add`（基线是活的，新框架随时纳入） | 配置可开关 |
| **缺口登记册** | `completeness-guard gaps add/list/close`（可见的缺口优于隐藏的完美） | 流程要求 |
| **完整性雷达** | `completeness-guard radar check/scan/findings`（持续扫描行业/竞品/元构升级） | 周期检查 |
| **声明纪律** | `declaration` 生成标准声明 + `check-text` 检测禁用词 | hooks 硬门 |

## 安装（三选一）

```bash
# 1. 一键安装到平台（技能 + hooks 强制门 + 声明纪律注入，三层生效）
node install.js --platform zcode --global-cli
node install.js --platform claude-code

# 2. 仅全局 CLI
npm install -g .

# 3. 仅使用技能（任意 Agent 平台，复制 SKILL.md 到技能目录即可）
```

## 使用

```bash
completeness-guard init --target <项目目录>          # 初始化（配置+登记册+雷达）
completeness-guard verify --doc docs/方案.md          # 验证（全绿 exit 0）
completeness-guard gaps add "A2A 对接" --plan "P2"     # 登记缺口
completeness-guard radar check                        # 雷达检查
completeness-guard declaration --doc docs/方案.md      # 生成标准声明
completeness-guard check-text "我100%完美完成了"        # 检测禁用词（exit 1）
```

## 强制生效的四个层次（不可绕过）

1. **技能注入**（软）：Agent 学会遵守流程；
2. **配置启用**：`completeness.config.json`（enforcement.level: hard）；
3. **hooks 硬门**：PreToolUse 拦截禁用声明词 + Stop 触发提醒；
4. **CLI 门禁**：verify 失败 exit 1，可接入 CI 阻断发布。

## 内置基线（B1-B7）

权威框架（感知七层+能力栈 19 项）/ 行业标配 29 项 / 协议标准 12 项 / 自解剖 29 项 / 元构法则 10 项 / 竞品对标 18 项 / 用户自定义（可扩展）。

## 与元构生态的关系

- 本套件是元构"交付门禁/决策锁/自检"思想在**完整性治理**上的独立工程化；
- 技能 `metago-completeness-guard` 可并入元构技能库（98 → 99）；
- 可与元构七层验证（L1-L7）叠加使用：七层验证管"交付质量"，本套件管"声称完整时的证据"。

*由元构光年（成都）人工智能科技有限公司发布 | v1.0.0 | MIT*
