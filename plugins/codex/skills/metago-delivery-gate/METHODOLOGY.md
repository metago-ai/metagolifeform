# UDGK 通用交付门禁套件 · 使用手册（METHODOLOGY）

> **UDGK = Universal Delivery Gate Kit（通用交付门禁工程套件）**
> 定位：一套**不依赖任何具体项目**、**独立于任务的可复用资产**。任何 AI 接到任务时按同一套流程执行，从机制上杜绝「验证全绿但形态没做」。

---

## 一、为什么需要 UDGK（本源问题）

历史教训：多轮交付中，AI 只改样式参数（圆角/字号），未实现文档要求的核心形态
（如 Agent 执行轨迹可视化：工具调用卡片、思考流可折叠块、AI 头像），用户反复反馈
「UI 无变化」。根因：

1. **文档要求与实现脱节**：需求写在文档里，但实现时被简化或忽略。
2. **测试不覆盖形态**：typecheck/vitest/verify 只验证逻辑，不验证 UI 形态。
3. **「编译通过」≠「形态达标」**：tsc 0 错误 + build 成功，不等于界面真的变了。

UDGK 的解法：**把形态要求工程化，变成机器可判定的四重门禁**。

---

## 二、套件包含 5 个可复用资产

| 资产 | 文件 | 作用 | 通用性 |
|------|------|------|--------|
| ① RTM 模板 | `templates/requirements-traceability.md` | 把自然语言需求逐条翻译成「要求→代码→断言→证据」映射表 | 任何任务填表即用 |
| ② 形态断言模板 | `templates/form-assertions.spec.ts` | 把「长什么样」翻译成 DOM 断言（可含卡顿断言） | 任何 UI 套用 |
| ③ 视觉基线器 | `scripts/visual-regression.cjs` | 截图 + 像素 diff，量化「变了没有」 | 任何 UI 套用 |
| ④ 通用门禁脚本 | `scripts/verify-delivery.cjs` | 一键扫描 RTM + 跑断言 + 跑 diff + 汇总报告 | 任何项目 node 即跑 |
| ⑤ 使用手册 | `METHODOLOGY.md` | 教会 AI 和人类：怎么用这套件 | 一次编写，永久复用 |

---

## 三、核心机制：把「文档/需求」翻译成「可判定的四重门禁」

任何任务执行时强制走这条流水线，**四道门禁任何一道不过，系统判定「未完成」**：

| 门禁 | 判定 | 考查对象 | 机器判定 |
|------|------|----------|----------|
| 门禁 1 RTM 完整性 | 表头四列齐备 + 无空要求 + 无空证据 | 需求有没有逐条翻译 | RTM 有无空单元格 |
| 门禁 2 形态断言 | e2e/asserts/ 全部断言通过 | 长什么样有没有做出来 | 断言 exit code |
| 门禁 3 视觉 diff | current/ 与 baseline/ 像素差 ≤ 阈值 | 界面真的变了没有 | 像素差百分比 |
| 门禁 4 报告生成 | delivery-report.md 全绿 | 证据链是否完整 | 报告 PASS/FAIL |

每道门都是**机器可判定、可一票否决**的。考查的不是「我认不认为做完了」，而是「断言过没过、diff 差不差、RTM 有没有空」。

---

## 四、套件怎么通用（不绑死任何项目）

1. **模板化**：所有资产都是 .md 模板 / .ts 模板 / .cjs 脚本，不含项目特定路径
2. **配置驱动**：套件读 `delivery.config.json`（指定需求文档在哪、断言目录、截图目录、允许的 diff 阈值），换项目只改配置不改代码
3. **零依赖**：脚本只需 Node + 已有测试框架（Playwright/Vitest 可选），不引入新重型依赖
4. **可插拔**：任何语言/框架都能用——RTM 和门禁脚本与语言无关，断言/截图适配具体栈

### delivery.config.json（配置驱动）
```json
{
  "project": "my-project",
  "requirements": { "doc": "docs/requirements.md", "traceability": "docs/rtm.md" },
  "assertions": { "dir": "e2e/asserts", "pattern": "\\.(js|cjs|mjs|ts|spec\\.ts)$" },
  "visual": { "baseline": ".visual-baseline/baseline", "current": ".visual-baseline/current",
              "diffThreshold": 0.02, "diffOutput": ".visual-baseline/diff" },
  "gate": { "strict": false, "requireRTM": true, "requireAssertions": true, "requireVisual": true },
  "report": { "output": "docs/delivery-report.md" }
}
```
换项目：`node scripts/init-delivery.cjs` 重新生成，或直接改 config。

---

## 五、AI 使用流程（6 步，写进 SKILL.md）

```
1. init-delivery.cjs 初始化
   → node scripts/init-delivery.cjs  生成 delivery.config.json + RTM 空表 + 目录骨架
2. 逐字读需求文档 → 填满 RTM（一条需求缺失 = 禁止往下）
3. 实现 → 每条需求写形态断言（复制 templates/form-assertions.spec.ts）
4. 截图基线 → 视觉 diff
   → node scripts/visual-regression.cjs --snapshot --urls=<页面>
   → node scripts/visual-regression.cjs --baseline
5. verify-delivery.cjs → 出报告（四重门禁）
6. 报告全绿 + 证据截图 → 才允许宣告完成
```

任何一步系统判定 FAIL，AI 必须回到对应步骤修复，**禁止「宣布完成但不做」**。

---

## 六、落地形态（全局可调用的 Skill + 独立脚本）

做成**全局用户级 Skill（元构技能）**，配独立脚本套件：
- skills 是全局用户级的，任何工作目录都能调用 → 最符合「任何 AI 都能用」
- Skill 内嵌使用手册 + 模板 + 脚本，AI 激活技能即自动加载整套流程
- 不进任何项目仓库，不污染具体项目

### 套件内部结构
```
UDGK安装包/
├── install-udgk.ps1            # 全局安装脚本
├── METHODOLOGY.md              # 本使用手册
├── INSTALL.md                  # 快速安装说明
├── 01-Skill/metago-delivery-gate/
│   ├── SKILL.md                        # 流程（6 步）
│   ├── METHODOLOGY.md                  # 手册（本文件副本）
│   └── templates/                      # 模板
│       ├── requirements-traceability.md   # ① RTM 模板
│       ├── form-assertions.spec.ts        # ② 形态断言模板
│       └── verify-report-template.md      # 报告模板
├── 02-Scripts/                          # ③④⑤ 脚本套件
│   ├── init-delivery.cjs                # 初始化（生成 RTM 空表 + config）
│   ├── verify-delivery.cjs              # ④ 通用门禁脚本（四重门禁）
│   ├── visual-regression.cjs            # ③ 视觉基线器（截图+像素diff）
│   ├── delivery.config.json             # 配置模板
│   └── delivery.schema.json             # config 校验 schema
├── 03-Rules/AGENTS-UDGK-section.md      # 引导层（合并进 AGENTS.md）
├── 04-MCP/
│   ├── delivery_gate_check.json         # ★核心硬阀门（强制层）
│   └── metago_delivery_gate.json        # 向后兼容
└── 05-Memory/UDGK-memory-injection.md   # 记忆层（合并进 user_profile.md）
```

---

## 七、形态达标（L8）核心原则

- **仅修改样式参数（圆角/字号）不满足形态要求** —— 必须实现独立组件形态
- 必须实现：工具调用卡片、思考流可折叠块、AI 头像 + 名称、事件流逐块追加
- 每个形态要求必须有对应 DOM 断言 + 视觉基线证据

---

## 八、反绕过条款

| 违规行为 | 处置 |
|---------|------|
| 只改样式参数，不实现组件形态 | 视为未完成，补实现组件 |
| 跳过 RTM / 断言 / diff / 报告任意一门 | 视为未完成，补做 |
| 用「应该没问题」代替验证 | 视为无效交付 |
| 无视觉基线就宣称「界面变了」 | 视为证据缺失，补截图 |
| 验证清单全勾 ✅ 但未执行 | 视为欺骗，回溯所有 ✅ |
| 不跑 verify-delivery.cjs 就宣告完成 | 视为绕过门禁，重跑后判定 |

---

*UDGK V3.0.0 | 通用交付门禁工程套件 | 由易霄 / MetaGO 制定*
