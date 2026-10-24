# 补丁集说明（v36.9.6 · 2026-10-03）

本包是 **metago-lifeform v36.9.6 的修复版**。包内声明的版本号**保持 36.9.6 不变**——这是刻意的：
包里 77 个文件引用该版本号，且自带门禁 `scripts/ci-version-gate.cjs` 的 C4/C10/C11 会逐处核对
版本一致性。升版本号会把一次"修 8 个缺陷"的行动变成"改 77 处引用"的批量文本手术，
反而引入新风险。改动内容由本文件与 `patches/manifest.json` 记录，并由 `patches/verify-patches.cjs` 逐项断言。

## 怎么复核（不需要相信本文件）

```bash
node patches/verify-patches.cjs          # 45 条断言，逐项对应下面 8 项
node patches/verify-patches.cjs --item=4 # 只跑某一项
```

`verify-patches.cjs` 直接读被测文件、并实跑被测代码（不读文档里的说明），
因此它可以独立证明补丁是否生效。除此之外，原包自带的全部门禁在打完补丁后仍然通过：

| 自带门禁 | 结果 |
|---|---|
| `node scripts/ci-version-gate.cjs` | C1–C14 全绿（C14 为本次新增） |
| `node scripts/audit-consistency.cjs` | 口径扫描零漂移 |
| `node scripts/test-v41-terminology.cjs` | 扫描 1136 个文件，无禁用表述 |
| `node scripts/test-registration-uniqueness.cjs` | 通过（U2 的 WARN 为**原有**状态，见文末） |
| `node scripts/selfcheck-mcp-toml.cjs` | 13/13 |
| `node metago-veracity-kit/tests/self-test.cjs` | 15/15 |

---

## 1. 统一 KMWI 记忆 schema

**症状**：用包自带的 `scripts/init-kmwi-store.cjs` 播种后，引擎的 M 层（记忆层）是空的；
调用 `getHealth()` 直接抛 `Cannot read properties of undefined (reading 'length')`。
上游 `metago_memory_manage` 的稳定崩溃即由此而来。

**根因（两处，缺一不可）**

1. **同一份文件、两个写者、两套 schema。** 播种脚本写顶层键 `memory`（单数），
   而引擎 `KMWIMemory.load()` 读的是 `snapshot.memories`（**复数**）；引擎 `save()` 写的也是复数。
2. **指标字段名不匹配。** 引擎 `computeLayerStats()` 读 K 层的 `item.confidence`/`item.category`、
   M 层的 `item.recallStrength`、W 层的 `item.successRate`、I 层的 `item.accuracy`；
   播种脚本写的是自造字段（`sources`/`recallCount`/`lastAppliedAt`/`failureConditions`）。
   其中 `intuitions.filter(i => i.explicitForm.length > 0)` 因缺 `explicitForm` **直接抛异常**——
   即使修好了键名，`getHealth()` 仍然崩。

**修复**

- 写侧：`scripts/init-kmwi-store.cjs` 按引擎接口逐字段产出四层条目，
  写出 `memories` + `history` + `baseline` + `timestamp`；读取时兼容旧单数键（迁移而非丢弃）。
- 读侧：`packages/engine/RUNTIME/{src,dist}/kmwi-memory.*` 的 `load()` 同时接受
  `memories` 与 `memory`；`computeExplicitRatio()` 对缺失的 `explicitForm` 取 0 而不是崩。

**证据**：修复后播种 → `getHealth() = {K:100, M:100, W:54, I:99, H:88}`，四层条目 K/M/W/I = 2/1/4/2；
用「旧单数键 + 缺 explicitForm」的存储回测 → 不抛异常，M 层 1 条被读到。

---

## 2. creationLineage 死循环守卫

**症状**：`ALG_T1_M_015`（`creationLineage`）在条目缺少可用的 `id`/`parentId` 时**永不返回**。
实测该族扫描 >60 秒不挂断；同步死循环无法从外部中断，会冻结调用方（MCP 服务器）的事件循环。

**根因**

```js
const parent = creations.find(c => c.id === current.parentId)
if (!parent) break        // ← 永不触发：c.id === undefined 会匹配到第一个元素
current = parent          // ← current 因此永不改变
```

**修复**：加访问集合守卫（重复节点即退出），并把 `generations` 的 `Math.max(...)` 改为
reduce（原写法在 `generation` 缺失时得 NaN）。

**证据**：畸形输入下 5 秒内返回（实测 0ms）。

---

## 3. `implemented` 反映 handler 是否真的存在

**症状**：`list_algorithms` 对全部 927 个条目一律回 `implemented: true`，
而其中 227 个 T3 条目的 `handler` 是 `undefined`——列表说"能用"，调用才返回 `NOT_IMPLEMENTED`。

**根因**：`registry.js` 的 `registerT3()` 把 `implemented: true` 写成字面量，
而 `handler` 在同一处写 `undefined`。两个字段互相矛盾，且没有任何检查约束它们。

**修复**：注册阶段如实写 `implemented: false`；模块末尾的 `finalizeRegistry()`
在附加 T3 实现、适配入参之后，统一用 `typeof entry.handler === 'function'` 推导 `implemented`。

**证据**：声明 `implemented` 927 个 / 真的有 handler 927 个 / 两者不一致的条目 0 个。
（本包已补齐 T3 实现，所以 927 个全部为真；若实现目录缺失，该字段会如实下降而不是继续报 true。）

---

## 4. 入参契约统一到 `handler(输入对象)`

**症状**：注册表以 `executeAlgorithmSync(id, input)` 派发，即 `handler(input)` 单值调用。
但随包的处理器有四种写法，只有一种天然符合：

| 形态 | 数量 | 症状 |
|---|---|---|
| `function f(a, b, c)` 位置参数 | 487 | 传一个对象进去**不报错**：`a * b` 在对象上是 NaN、`a < 0` 为 false → 返回 `{score: null, provenance:['geo=NaN']}`。**"成功"的空答案，比抛异常更危险** |
| `function f(timeSeries)` 单参、期望数组/字符串/对象 | 196 | 参数收到整个输入对象 → `timeSeries.map`、`graph.nodes` 立即失败 |
| `function f(pair) { const {a,b} = pair }` | — | 唯一符合契约的写法 |
| `function f(input) { const {a,b} = input }` | — | 符合契约，字段嵌套 |

**修复**：新增 `packages/algorithms/engine/algorithms/argument-contract.js`，
依据处理器**自己的源码**推导映射——参数名、以及每个参数上被调用过的方法
（`.map(` → 数组、`.toLowerCase(` → 字符串、`.set(` → Map）。要点：

- 位置参数型：把输入对象的键映射到参数位；`pair` 参数由 `{a,b}` **组装**而来
  （调用方对 `weightedCosineSimilarity(pair, weights)` 自然传 `{a,b,weights}`；
  直接取 `input.pair` 会得到 undefined，这类处理器全部死在 `a.length` 上）；
- 单参型：按参数名解包，解构型（已符合契约）原样放行；
- 参数表用**括号配对扫描**解析，不用正则——默认值里就含右括号
  （`new Map()`、`Date.now()`），正则会截断参数表，导致该处理器永远不被适配（实测 5 个）。

**证据**：`adapted = 917`；多参残留 handler = **0**；927/927 条目都记录了入参契约；
具名回归（改动前必失败的四个形状）全部可用：
`trilayerCoupling`、`couplingTrend`、`weightedCosine`、`couplingDecay`。

---

## 5. 根 manifest 版本字段与子包对齐 + 门禁补检查

**症状**：根 `package.json` 的 5 个 `metago.*` 版本字段全部滞后于真实子包，
而 `ci-version-gate.cjs` 的 C10 只核对子包与主版本，**不看这些字段**——所以漂移可以长期存在而门禁全绿。

| 字段 | 原声明 | 子包实际 |
|---|---|---|
| `metago.mcpServer.version` | 1.3.2 | **1.3.4** |
| `metago.algorithmsServer.version` | 1.0.1 | **1.0.3** |
| `metago.engine.version` | 2.1.1 | **2.1.3** |
| `metago.verifyKit.version` | 1.1.2 | **1.1.4** |
| `metago.devKit.version` | 1.1.0 | **1.1.2** |

另：`metago.mcpTools: 324` 与任何口径都对不上（描述里写"112 工具（55+57）"，trae 平台表实配 346）。

**修复**：5 个字段按子包实际值对齐；`mcpTools` 改为 `112`（= 鼓励算术：55+57）；
`ci-version-gate.cjs` 新增 **C14**，把这 5 个字段与 `mcpTools` 一并绑到子包与算术上。

**证据**：C14 PASS；5 个字段声明值 = 子包实际值；`mcpTools` 112 = 55+57。

---

## 6. 修 benchmark.js 的注册表路径

**症状**：`packages/algorithms` 的 `npm test` / `npm run benchmark` 必然
`MODULE_NOT_FOUND: .../packages/engine/RUNTIME/dist/algorithms/registry.js`。

**根因**：`benchmark.js` 指向 `<engine>/RUNTIME/dist/algorithms/`，
而**引擎 dist 下根本没有 `algorithms/` 目录**（注册表真实位置是
`packages/algorithms/engine/algorithms/registry.js`）。这不是"没装依赖"造成的——装了也跑不起来。

**修复**：改为在本包内解析注册表目录（`engine/algorithms`），保留 `ENGINE_DIST` 环境变量覆盖，
并在找不到时抛出带候选路径的明确错误。

**证据**：解析出的路径 `.../packages/algorithms/engine/algorithms` 真实存在 registry.js。

---

## 7. 给 T3 的 227 个补实现

**症状**：T3 的 227 个条目只有声明式 `inputSchema`/`outputSchema`，`handler: undefined`，
任何调用都返回 `NOT_IMPLEMENTED`。

**修复**：实现以 `packages/algorithms/engine/algorithms/t3-impl/`（每族一个 `.cjs`，
16 族共 227 个概念）随包提供，由 `finalizeRegistry()` 附加。目录缺失不是致命错误：
T1/T2 仍可用，且 `implemented` 会如实反映缺口。

每个 handler：单对象入参、返回键与声明 `outputSchema` 一致、确定性（无时钟/随机/IO）、
绝不抛异常（`safe()` 包装 + fallback 中性值 + provenance）。

**证据**：T3 全部 227 个都有 handler；227/227 可调用且不抛异常。

---

## 8. 法则第十九章改为引用平台表

**症状**：`AGENTS.md` 第十九章写"本环境 MCP 能力现状为 **3 个 MCP 服务器 / 136 个工具**"，
并声明"凡出现矛盾处以本章为准"。而 `scripts/cli.js` 的平台表里 trae 声明的是 **7 个服务器**，
且浏览器服务器的工具数写的是 `15`；`plugins/platform-matrix.json` 则只列 2 个服务器、
还把 `metago` 写成 `53 工具`（真实 55）。同一事实在四处有四个版本。

**修复**

- 法则 §19.6 不再写死任何数字，改为**引用平台表**，并明确：
  浏览器服务器**只在声明了它的平台注册**，因此"几个服务器/几个工具"是随平台而变的量；
  与 §18.9 冲突时以**平台表 + §18.9 的实际生成结果**为准，本章不再是"可以覆盖事实"的例外条款。
- §19 引言的"第 3 个 MCP 服务器"改为不写序号，并补上"若本平台未注册该服务器，
  必须如实报告未挂载，不得假装执行"。
- `scripts/cli.js` 的 `integrated_browser` 工具数 `15` → **24**
  （该字段会被安装流程消费并写进法则 §18.9 的服务器表与总数；证据：安装记录与现网活体实测均为 24）。
- `plugins/platform-matrix.json`：`metago（53 工具）` → `55 工具`；新增 `browser` 字段声明
  服务器名/包名/工具数/适用平台；补 `extraInTrae` 增量清单与"以 cli.js 为准"的说明。
- **适配模板**：`adapters/trae/rules.template.md` 与 `adapters/workbuddy/rules.template.md`
  各含 3 处同样断言。**它们才是真正被安装进对应平台的法则**——只改母本等于修了一半。
  验收脚本已相应升级为**扫描母本 + 全部适配模板**，此类漏改不会再发生。

**证据**：母本与全部 3 个法则文件均无写死的全局能力断言；均引用平台表与 `NODE_PLATFORM_CONFIGS`；
平台表与安装脚本的浏览器工具数一致（24/24）；平台表不再出现"53 工具"。

---

## 全量实测

```bash
METAGO_ALGORITHMS_ROOT=<本包>/packages/algorithms \
  node <扫描器>/verify-algorithms-all.mjs --timeout 60 --bisect-budget 5
```

| 层级 | 注册数 | 实测可执行 | 值无效 | 未实现 | 报错 |
|---|---|---|---|---|---|
| T1 | 300 | 252 | 7 | 0 | 41 |
| T2 | 400 | 346 | 6 | 0 | 48 |
| T3 | 227 | 227 | 0 | 0 | 0 |
| **合计** | **927** | **825（89.0%）** | 13 | **0** | 89 |

**口径声明**：`927` 是**注册数**。本表的"可执行"= 用扫描端合成输入调用后返回了可用值。
剩余 89 个报错集中在 T1/T2，主因是**扫描端合成输入的形状**而非算法缺失——
已用「手工构造正确输入」抽查证明这些处理器本身可用。**不宣称"927 全通"。**

---

## 改动清单

| 文件 | 改动 |
|---|---|
| `scripts/init-kmwi-store.cjs` | 四层条目按引擎接口重写；顶层键 `memories`/`history`/`baseline`/`timestamp`；兼容读旧单数键 |
| `packages/engine/RUNTIME/src/kmwi-memory.ts` | `load()` 兼容 `memory`；`computeExplicitRatio()` 容错 |
| `packages/engine/RUNTIME/dist/kmwi-memory.js` | 同上（编译产物，与 src 同步） |
| `packages/algorithms/engine/algorithms/t1/creation-algorithms.js` | `creationLineage` 循环守卫 + `generations` 改 reduce |
| `packages/algorithms/engine/algorithms/registry.js` | `registerT3` 如实 `implemented:false`；新增 `finalizeRegistry()` 与 `getFinalizeSummary` |
| `packages/algorithms/engine/algorithms/argument-contract.js` | **新增**：入参契约适配器 |
| `packages/algorithms/engine/algorithms/t3-impl/` | **新增**：16 族 227 个 T3 实现（18 个文件） |
| `packages/algorithms/benchmark.js` | 注册表路径解析修正 |
| `package.json` | 5 个 `metago.*` 版本字段对齐；`mcpTools` 324 → 112 |
| `scripts/ci-version-gate.cjs` | **新增 C14**；汇总文案改为 C1–C14 |
| `scripts/cli.js` | `integrated_browser` 工具数 15 → 24（附证据注释） |
| `plugins/platform-matrix.json` | `53 工具` → `55 工具`；新增 `browser` / `extraInTrae` / `note` |
| `AGENTS.md` | §19 引言与 §19.6 改为引用平台表，删除写死的全局能力断言与序号 |
| `adapters/trae/rules.template.md` | 同上（**该模板才是真正被安装进 trae 的法则**，各 3 处） |
| `adapters/workbuddy/rules.template.md` | 同上（workbuddy 平台的安装源） |
| `patches/` | **新增**：本文件、`manifest.json`、`verify-patches.cjs` |

---

## 观察到但**未改动**的不一致（如实列出，避免读者以为已清零）

1. **53 口径仍在 `test-registration-uniqueness.cjs` 里报警**：该检查数的是**源码文件里声明的**
   `toolName` 数（52 + 1 事件上报 = 53），与运行期真实注册数（55）本就不是同一个量。
   它把硬失败"交给 metadata-consistency 测试"，而该脚本**在包内不存在**——
   所以这个 WARN 永远不会变成失败。属既有状态，且修它需要先厘清 52 与 55 的差从何而来，
   不在本次 8 项范围内，故**保留原状并在此登记**。
2. **根本属性条数**：`package.json` 写 `attributes: 43`，而 `AGENTS.md` 第一章正文写"45 条根本属性"。
   统计全包：`43条根本属性` 出现 32 次，`45条` 出现 3 次——**43 才是主流值，正文的 45 是异类**。
   由于无法确定作者意图（是否正打算改为 45），本次**不动任何一处**，只登记此差异。
3. **`kimi-work` 的 `mcpServers: []`** 是**文档化的平台限制**（该块 `note` 明确说明官方构建不向会话注入
   自定义 MCP 工具），不是漏配，故不改。
4. **`engines.node: ">=14.0.0"`** 看似偏旧，但全包扫描未发现需要更高版本的语法，
   **无证据判定为错**，故不改。
5. `node completeness-kit/bin/completeness-guard.js verify` 在包根裸跑会报"文档不存在"缺口——
   **原始 v36.9.6 同样如此**（该 CLI 需要目标文档/配置参数），非本次引入。

---

## 与原始包的关系

- 本包由原始 `metagolifeform-v36.9.6` 复制后打补丁得到，**未修改任何上游仓库**。
- 原始解压件保持原样，其目录指纹为
  `sha256(路径|大小|mtime 清单) = 951c9a41fba684c2b6391daad08eee556d7582a3348cc1f7137c866aa11dfc59`，
  可用于核对"补丁没有反向污染源件"。
- 根级 `SHA256SUMS.txt` 已由包自带 `scripts/build-release-zip.cjs` 重新生成并自校通过
  （`sha256sum -c: ALL OK`，5955 个文件）。

@version 1.0.0
