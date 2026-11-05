# dsh-metago-atom · 元构 597 原子分发层

> **状态：核心已通过全量自检（31/31），尚未注册进 DSH 运行体。**
> 位置：`$METAGO_LIFEFORM_HOME\plugins\dsh-metago-atom\`（绿区，未安装）
> 规格：`V37.1-07-原子可调用面规格.md`

---

## 一、为什么是「1 个工具 + N 个 operation」

597 条原子若各做一个工具，工具面会从 **651 → 1,248（+92%）**，并且直接踩在 INC-002 的雷区上
（工具面越大，越容易触发「全工具 defer」类故障）。所以做成**一个分发工具**，原子 ID 走 `operation`。

---

## 二、三种模式

| mode | 作用 | 是否执行原子 |
|---|---|---|
| `invoke`（默认） | 执行并做契约校验 | ✅ |
| `describe` | 返回契约与可调用性 | ❌ |
| `list` | 按 action / domain / status 过滤 | ❌ |

```js
// invoke
dispatch({ operation: 'ATOM_RESOURCE_ALLOCATE_001', input: [10, 20, 30] })
// → { ok, atom, action, domain, status, contract, checks, output, degraded? }

// describe
dispatch({ operation: 'ATOM_SECURE_LOCK_201', mode: 'describe' })
// → { ok, atom, status: 'unsupported', note: '…' }

// list
dispatch({ mode: 'list', filter: { status: 'unsupported' } })
// → { ok, total: 3, ids: [...] }
```

---

## 三、全量自检结果（实测）

```
node test\selftest.mjs
→ 索引 597 条 · 校验器 有
→ 扫描结果（官方候选池）: contractPass=594  noSample=0  unsupported=3  error=0
→ 31 passed, 0 failed
```

**与 R141 独立吻合**：R141 用值断言得「594 可调用 + 3 不支持」，
本轮用**契约校验器**再验一遍，同样是 **594 / 3 / 0**。两条独立路径同结论。

**算子分布**（39 种，说明语义特化真的生效，不是一套模板套所有）：
`generate 47 · classify 47 · fusion 32 · trend 26 · verify 25 · assess 22 · monitor 19 · optimize 12 · learn 12 · execute 11 · risk 10 · score 7 · record 7 · wrap 6 · match 6 · …`

---

## 四、为什么扫描要「候选输入池」

第一版用 `undefined` 当输入，得到 `ok=9 / degraded=585` —— 那验的是「缺输入会不会降级」，
**不是**「能不能算」。引擎自带的 `atoms/verify.cjs` 用的是「候选池逐试取第一个成功者」，
本层照抄同一策略（判据换成契约校验通过），才得到 594/3/0 的真实结论。

**教训**：自检的输入必须**符合契约**，否则测出来的全是假象。

---

## 五、三条铁律（写死在代码里）

1. 任何异常都在本层捕获，返回 `ok:false`，**绝不向上抛**（INC-001 教训）
2. `unsupported` 必须带 `reason`，**禁止**用 `null` / 空对象冒充成功
3. 契约校验不通过时**保留 `output`**、只标 `degraded`，不静默丢弃（R141「诚实的不支持 > 虚假的支持」的延伸）

---

## 六、下一步（未做，属红黄区）

| # | 步骤 | 前置 |
|---|---|---|
| 1 | 查 `ctx.tools` 服务契约（`cordis_inspect_query` host/Service） | **必须先查，不能猜**（INC-001 教训） |
| 2 | 写 Cordis 外壳注册 `metago_atom` | 明确不设 `deferLoading` |
| 3 | 改后跑 `validate-runtime-safety.mjs` | 必须 14/14 |
| 4 | 冒烟：抽样 5 条实调 | 5/5 符合信封 |
| 5 | 重启后能发消息 | 才算"完成"（V37.1-06 §4.1） |

---

*核心 `lib/dispatch.mjs` · 自检 `test/selftest.mjs` · 数据 `$METAGO_LIFEFORM_HOME\ledger\atom-index.json`*
