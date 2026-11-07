# dsh-metago-gate · 元构·智能生命体 治理门禁（影子模式）

> **一句话**：把元构的四层安全基因、PEA 决策锁、Promptware 七阶段杀伤链，挂到 DeepSeek Harness 原生的 9 个钩子事件上。
> **当前形态**：`shadow`（影子）模式 —— **只记录，绝不改判**，对现有行为零影响。

---

## 一、它解决什么

V37.1-03《治理落地现状》实测结论：

> 元构的治理设计极其完整，但**在本机落地率为 0** —— 四层安全基因、决策锁、PEA、七阶段链全部停留在文档。
> 而 DSH 恰好提供了承载它们的 **9 个原生钩子**，且一个都没被使用。

本插件就是把这些设计**挂上去**的第一个实现。

---

## 二、三种模式（默认 shadow）

| 模式 | 行为 | 适用 |
|---|---|---|
| **shadow**（默认） | 只记录"本应触发哪一层 / 命中哪几个阶段 / 建议怎么处置"，**返回下游 decision 原样不变** | 上线第一阶段：量误伤率 |
| `ask` | 高危工具（落在审批层）若下游 allow → 升级为 `ask` | 影子模式验证过、误报率可接受后 |
| `deny` | 命中 L7 目标执行或 ≥3 阶段 → 取消 | 正式启用 |

改模式：编辑 `lib/policy.json` 的 `meta.mode`。

---

## 三、挂了哪三个钩子

| 事件 | 模式 | 本插件的职责 |
|---|---|---|
| `tools/pre-execute` | waterfall（`prepend:true`） | 风险分级 + 七阶段检测 + 四层判定 → 记录；shadow 下原样放行 |
| `tools/result` | emit | 审计层 L4：每次工具结果入 JSONL（脉冲见证的本地等价物） |
| `agent/turn-stopping` | serial（透传） | 交付门禁挂点（当前只记录） |

---

## 四、日志

```
$DSH_HOME\metago\fabric\logs\gate-YYYY-MM-DD.jsonl
```

每行一条 JSON：

```json
{"ts":"2026-11-04T01:44:07.447Z","event":"pre-execute","mode":"shadow",
 "toolName":"pwsh","risk":"high","stages":["L7"],"layers":["L2_授权","L4_审计"],
 "advice":"block_and_quarantine","why":["命中 L7 目标执行"],
 "downstream":"allow","ms":0}
```

**写日志失败不抛错**：`logFailures` 计数 + 内存环形缓冲，绝不影响任务执行。

---

## 五、自测（无需 DSH 运行时）

```powershell
node test\selftest.mjs       # 26 项：风险分级 / 四层 / 七阶段 / 综合判定 / 占位符 / 幂等
node test\mount-dryrun.mjs   # 18 项：假 ctx 装载演练 / shadow 零改判 / 畸形入参 / dispose
node test\http-dryrun.mjs    # 22 项：真 http server 挂路由 / 405 / 400 / 页面自包含
```

三个都必须全绿才允许注册进 profile。

---

## 五之二、可交互控制台（P9）

插件自带 4 条 HTTP 路由（**只新增 `/api/metago/gate/*`，不碰既有的 `/api/metago/*`**）：

| 路由 | 方法 | 作用 |
|---|---|---|
| `/api/metago/gate/status` | GET | 运行时计数 + 策略摘要 + 日志目录 |
| `/api/metago/gate/log?tail=N` | GET | 最近 N 条事件（JSONL 尾部） |
| `/api/metago/gate/mode` | **POST** | **真实控制操作**：切 shadow / ask / deny，写回 policy.json 并备份 |
| `/api/metago/gate/console` | GET | 自包含控制台页面（无外链、无 CDN） |

设计约束：
- 写操作只接受**本机回环地址**（非回环 403），值走白名单（非法 400，GET 405）
- 页面每 2 秒轮询刷新；**离线打开时渲染结构完整的示例数据**并显式标注"离线预览"，不留空壳
- 离线预览：`~\Desktop\元构控制台-治理门禁-预览.html`

---

## 六、安全约束（写死在代码里）

1. **所有钩子回调整体 try/catch**，永不向上抛（一个插件错误不得拖垮宿主）
2. **所有 I/O 失败静默降级**（记不进日志就不记）
3. **shadow 模式绝不修改 `next()` 的返回值**（已在 `mount-dryrun.mjs` 用 6 种决策验证）
4. **不声明 `inject`**：只订阅事件，不依赖任何服务，装载顺序无关
5. **无客户端半边**：纯 host 插件，不碰 UI，不触发界面重载风险

---

## 七、与元构文档的对应

| 本插件元素 | 元构出处 |
|---|---|
| `fourLayers`（L1 审批 / L2 授权 / L3 隔离 / L4 审计） | V24.0 根本属性 37「四层安全基因」 |
| `killChain`（七阶段 + ≥3 阶段升级处置） | V28.0「Promptware 杀伤链」 |
| `completeness.placeholderPatterns` | 决策锁 V1.1「内容完整性」（NEG_20260508_002） |
| `routing.rules` | V37.1-04 第 0 层路由表 |
| 审计 JSONL | V23.0「脉冲见证」的本地等价物 |

---

## 八、版本

- 0.1.0（2026-11-04）：首版，shadow 模式，三个钩子，26+18 项自测全绿
