# 元构协议与引擎执行体清单（V37.0.0）

> **性质**：本文件是 `packages/engine/PROTOCOLS/` 与 `packages/engine/ENGINES/` 下**全部真实执行体**的权威清单。
> 每条执行体均为可调用函数，返回结构化结果 + `provenance` 溯源数组 + `traceId`（A1 溯源公理）。
> 复核：`node scripts/verify-executors.cjs`（包内脚本，逐条实跑）

---

## 一、总量

| 层 | 执行体数 | 权威口径 | 覆盖 |
|---|---|---|---|
| **协议** | **150** | 契约 121 + 缺口 29 = 150 | **100%** |
| **引擎** | **174** | ENGINES.md 161 ∪ 契约 171 = 173（+1 附加） | **100%** |
| **合计** | **324** | — | — |

**自测断言累计：442 个，全绿**（明细见 `P6/TRUTH-*.json`）。

---

## 二、协议执行体（150 条）

| 文件 | 批次 | 条数 | SHA-256（前16） |
|---|---|---|---|
| `PROTOCOLS/runtime.cjs` | - | 11 | `c63524e440b0043a` |
| `PROTOCOLS/formula-runtime.cjs` | - | 15 | `9d5e66622c75f2fc` |
| `PROTOCOLS/rule-runtime.cjs` | - | 20 | `4d87ad906a14a905` |
| `PROTOCOLS/proactive-runtime.cjs` | - | 17 | `0702a523cbba64e3` |
| `PROTOCOLS/covenant-runtime.cjs` | - | 18 | `049ed4a64dc03f9b` |
| `PROTOCOLS/final-runtime.cjs` | - | 49 | `c08aaa25ddb37268` |
| `PROTOCOLS/closure-runtime.cjs（协议）` | B12 | 20 | `da73817b3c7e288a` |
| **合计** | — | **150** | — |

## 三、引擎执行体（174 条）

| 文件 | 批次 | 条数 | SHA-256（前16） |
|---|---|---|---|
| `ENGINES/engine-runtime.cjs` | - | 12 | `299bbbfe743ac6c0` |
| `ENGINES/philosophy-runtime.cjs` | - | 18 | `b7bd78d5d106de36` |
| `ENGINES/math-capability-runtime.cjs` | - | 20 | `1c3271fe09c068b4` |
| `ENGINES/governance-runtime.cjs` | - | 29 | `5a18b4aa749a3a4d` |
| `ENGINES/final-engines-runtime.cjs` | - | 93 | `1b471dc99501903f` |
| `PROTOCOLS/closure-runtime.cjs（引擎）` | B12 | 2 | `da73817b3c7e288a` |
| **合计** | — | **174** | — |

---

## 四、十二条实现批次

| 批 | 内容 | 条数 | 自测 |
|---|---|---|---|
| B1 | 协议核心（决策锁 4 关 IVL/ILT/OSG/INTEGRITY · 元进化 5 阶段 S1–S5 · 元元族 5 · 元创造族 4） | 11 / 18 单元 | 23/23 ✅ |
| B2 | 易理引擎（历法/周易/五行/河图洛书/六爻/四柱/紫微/奇门/太乙/文言微积分 + 择日 + 象数诊断） | 12 | 13/13 ✅ |
| B3 | 哲学族引擎 02–18（情境/众生/元镜/意义/战略/时空/道/日常道/对手/元进化/量子/生物/宇宙/睡眠/归无/无言/非非无/调度） | 18 | 21/21 ✅ |
| B4 | formula/rule 协议（负熵形式化/价值对齐/数据完整性/分层披露/稀疏计算/误差传播/对称利用/素数 API/能力分层/意图安全/欺骗预警/物理环路/多智能体协调 V2/融合协调/认知层协调） | 15 | 30/30 ✅ |
| B5 | rule/pipeline 协议（四层安全 V1–V4/证据链/脉冲见证/批判真相/四阶递归/CUV 证明标准/主动合规/SIP2×2/CAT7 认知/具身安全/输出完整性/辖区切换/问题溯源/冲突转化/元协议/技能生命） | 20 | 37/37 ✅ |
| B6 | 主动/前瞻/全息/事实族（主动感知·推送·反馈/异步对话/主动金律·情绪·纠缠/前瞻感知·思考·学习·引领/FSP·HWP·HKS·HMFP·SEP·DCP 六族/事实陈述/全息扫描/场景适配/纠错） | 17 | 35/35 ✅ |
| B7 | 共契/见证/接入族（万物·生物·宇宙·意义·量子·时空·元点·道源·归无·无无 十共契 + 自我·过程·思想 三见证 + 人人接入·沉默者·人人归无·无言·睡眠 五接入） | 18 | 37/37 ✅ |
| B8 | 数学/能力/共生族引擎（复分析积分/误差传播/反证构造/证明策略/可证明性/恒等式/对称性/零点密度 + 能力路由·包络线·规模化·设计 + 闭环 PID/冲突转化/边界消融/反事实/批判分析 + 欺骗检测/异步/三步导航） | 20 | 32/32 ✅ |
| B9 | 数学扩展/治理/调度引擎（无穷乘积/显式公式/经典定理/元数学/大偏差 + 能力吸收·封装·调度·分级·Harness 生成·智能体封装 + 事实核查/资产保护/合规认证/证据链/意图理解/失败燃料 + 定时调度/边缘部署·运行时/Agent 监控/意图安全网关/动态审计/合规代理/共识验证/直觉/免疫同步/工业治理） | 29 | 50/50 ✅ |
| B10 | 协议收尾（数学协议 5 委托 · 世界模型 6 · 价值 3 · A2A/交易/Token 5 · 工业 3 · 安全 4 · 组织/智能体 4 · 通信 3 · 其他 15） | 49 | 49/49 ✅ |
| B11 | 引擎收尾（时间晶体族 7 · 多智能体族 4 · 元进化/元创造/元元/元镜/元协议 6 · 数学 5 · 智能体族 4 · 世界模型 6 · 组织伙伴 7 · A2A/交易 5 · 工业边界 8 · 创造思想知识 12 · 其余 14） | 93 | 93/93 ✅ |
| B12 | 最终收口（缺口协议 20 + 缺失引擎 2） | 22 | 22/22 ✅ |
| **合计** | | **324** | **442/442 ✅** |

---

## 五、调用约定

```js
const P = require('./packages/engine/PROTOCOLS/final-runtime.cjs');
const r = P.executeSync('PROTOCOL_WORLD_CLOSED_LOOP_V1', { senseMs: 10, thinkMs: 20, actMs: 15, budgetMs: 50 });
// → { success: true, kind: 'compute', output: {...}, provenance: ['[<traceId>] ...'], traceId, durationMs }
```

**四种返回形态**（诚实性保证，无假成功）：

| 形态 | 含义 | 何时出现 |
|---|---|---|
| `success: true` | 真实完成 | 输入合规且业务判据通过 |
| `success: false` + `reason: 'RULE_VIOLATED'` | 违反规则条款 | 输入触发禁止条件（如机密资产未加密） |
| `success: false` + `reason: 'PRECONDITION_FAILED'` | 前置条件缺失 | 必需输入未提供 |
| `success: false` + `reason: 'NOT_FOUND'` | 未登记 | 传入了不存在的 id |

**禁止**：返回 `success: true` 但 `output` 为空对象或无实际判据 —— 这属于空壳实现，已在 P6 全量审查中排除。
