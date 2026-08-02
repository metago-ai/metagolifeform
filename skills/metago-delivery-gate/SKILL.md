---
name: "metago-delivery-gate"
description: "UDGK 通用交付门禁。激活后 AI 必须按 6 步流水线执行：init-delivery 初始化 → 填满 RTM → 实现+形态断言 → 截图基线 → verify-delivery 四重门禁 → 全绿才允许宣告完成。任何一步 FAIL 禁止宣告完成。"
version: "3.0.0"
author: "MetaGO"
category: "工程质量"
platforms: ["cursor", "claude-code", "codex", "trae", "codebuddy", "qoder", "zcode"]
trigger:
  - "交付验证"
  - "发布前检查"
  - "运行时验证"
  - "任务完成"
  - "形态达标"
  - "按 UDGK 执行"
  - "RTM"
  - "形态断言"
  - "视觉diff"
  - "verify-delivery"
---

# UDGK 通用交付门禁（metago-delivery-gate）

## 描述
把「文档/需求」翻译成「可判定的四重门禁」。任何 AI 接到任务时按同一套流程执行，从机制上杜绝「验证全绿但形态没做」。任何一项 FAIL 禁止宣告完成。

## 触发条件
用户说「按 UDGK 执行」、收到「任务完成」类指令、或任何代码交付请求时**必须**激活。本技能是 UDGK 套件的能力层，配合 AGENTS.md 规则（引导）、MCP 工具 delivery_gate_check（强制）、记忆注入（跨会话）、脚本套件（可执行）使用。

## 本套件包含 5 个可复用资产
| 资产 | 文件 | 作用 |
|------|------|------|
| ① RTM 模板 | `templates/requirements-traceability.md` | 需求逐条翻译成「要求→代码→断言→证据」映射表 |
| ② 形态断言模板 | `templates/form-assertions.spec.ts` | 把「长什么样」翻译成 DOM 断言 |
| ③ 视觉基线器 | `scripts/visual-regression.cjs` | 截图 + 像素 diff，量化「变了没有」 |
| ④ 通用门禁脚本 | `scripts/verify-delivery.cjs` | 一键扫描 RTM + 跑断言 + 跑 diff + 汇总报告 |
| ⑤ 使用手册 | `METHODOLOGY.md` | 教会 AI 和人类：怎么用这套件 |

> 脚本套件位于本包 `scripts/udgk/`（全局安装后为 `~/.trae-cn/scripts/` 或项目 `scripts/udgk/`）。

## AI 使用流程（6 步，必须按序执行）
> 任何一步系统判定 FAIL，回到对应步骤修复，禁止「宣布完成但不做」。

```
1. init-delivery.cjs 初始化
   → node scripts/init-delivery.cjs  生成 delivery.config.json + RTM 空表 + 目录骨架
   （已初始化则跳过）

2. 逐字读需求文档 → 填满 RTM
   → 打开 docs/requirements.md 逐条拆解，填入 docs/rtm.md
   → 一条需求缺失 = 禁止往下

3. 实现 → 每条需求写形态断言
   → 按 RTM「代码位置」实现功能
   → 复制 templates/form-assertions.spec.ts 到 e2e/asserts/<feature>.spec.ts，
     每条需求写 DOM 断言（P0 阻断）

4. 截图基线 → 视觉 diff
   → node scripts/visual-regression.cjs --snapshot --urls=<页面>
   → node scripts/visual-regression.cjs --baseline   建立基线

5. verify-delivery.cjs → 出报告
   → node scripts/verify-delivery.cjs [--strict]
   → 四重门禁：RTM 完整性 / 形态断言 / 视觉 diff / 报告生成

6. 报告全绿 + 证据截图 → 才允许宣告完成
   → 报告 docs/delivery-report.md 全部 PASS + 视觉基线证据存在
   → 任一 FAIL → 回到步骤 2/3/4 修复 → 重跑步骤 5
```

## 四重门禁（任何一道不过 = 系统判定「未完成」）
| 门禁 | 判定 | 考查对象 |
|------|------|----------|
| 门禁 1 RTM 完整性 | 表头四列齐备 + 无空要求 + 无空证据 | 「需求有没有逐条翻译」 |
| 门禁 2 形态断言 | e2e/asserts/ 全部断言通过 | 「长什么样有没有做出来」 |
| 门禁 3 视觉 diff | current/ 与 baseline/ 像素差 ≤ 阈值 | 「界面真的变了没有」 |
| 门禁 4 报告生成 | delivery-report.md 全绿 | 「证据链是否完整」 |

每道门都是机器可判定、可一票否决的。考查的不是「我认不认为做完了」，而是「断言过没过、diff 差不差、RTM 有没有空」。

## 配置驱动（换项目只改配置不改代码）
所有脚本读 `delivery.config.json`：指定需求文档在哪、断言目录、截图目录、允许的 diff 阈值。换项目只需重新 init 或改 config。

## 形态达标（L8）核心原则
- 仅修改样式参数（圆角/字号）**不满足**形态要求
- 必须实现独立组件形态（工具调用卡片、思考流可折叠块、AI 头像 + 名称、事件流逐块追加）
- 每个形态要求必须有对应 DOM 断言 + 视觉基线证据

## 根源文档
- `AGENTS.md` 第十四章「交付前原子验证协议」+ 第零节「UDGK 通用交付门禁」
- UDGK 套件 `METHODOLOGY.md`（使用手册）

## 与其他技能的协同
- 与 `metago-discipline` 协同：交付门控 + 五问自检组成完整质量闭环
- 与 `metago-decision-lock` 协同：关键交付节点触发决策锁校验
- 与 `metago-output-integrity` 协同：验证报告中无幻觉 ✅
- 与 `metago-delivery-gate`（本技能 V1.0.0 升级）：四重门禁覆盖原三层验证清单，且新增形态验证维度
