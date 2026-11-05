# DSH 原生插件（可选装）

> 本目录下的三个 `dsh-metago-*` / `metago-lifeform-dsh` 插件是**元构在 DeepSeek Harness 上的原生实现**，
> 与 `plugins/claude`、`plugins/codex` 等「平台法则适配包」不同：它们是**有运行时代码的真插件**。
>
> **不装也能用**——法则、技能、角色、适配模板都已在包根目录，装到任何平台即可。
> **装了才有的能力**：可视化控制台、工具调用门禁、597 原子统一入口。

---

## 三个插件各是什么

| 插件 | 版本 | 作用 | 依赖 |
|---|---|---|---|
| **`dsh-metago-gate`** | 0.1.1 | 治理门禁：订阅 5 个 Harness 原生事件（`tools/pre-execute` / `tools/result` / `agent/turn-stopping` / `fs/write-intent` / `system-prompt/assemble`），每次工具调用留痕 | DSH ≥ 0.2.0 |
| **`dsh-metago-atom`** | 0.1.0 | 597 原子统一入口：一个工具 `metago_atom`，三模式 `invoke` / `describe` / `list` | `@metago-ai/engine` |
| **`metago-lifeform-dsh`** | 1.0.0 | 元构控制台 V11：侧栏 6 域（总览 Live / 能力浏览器 / 治理与门禁 / 记忆与知识 / 运行运维 / 操作审计）+ 10 个动作 | DSH ≥ 0.2.0 |

---

## 怎么装（三个都装）

```
1. 把本目录下的三个插件目录，整个复制到：
   <$DSH_HOME>/profiles/desktop/node_modules/

2. 在 <$DSH_HOME>/cordis.patch.yml 末尾追加：

# >>> metago-fabric-gate managed block >>>
- insert:
    - id: metago-gate
      name: 'dsh-metago-gate'
      config: {}
# <<< metago-fabric-gate managed block <<<

# >>> metago-fabric-atom managed block >>>
- insert:
    - id: metago-atom
      name: 'dsh-metago-atom'
      config: {}
# <<< metago-fabric-atom managed block <<<

# >>> metago-lifeform-dsh managed block >>>
- insert:
    - id: metago-lifeform
      name: 'metago-lifeform-dsh'
      config: {}
# <<< metago-lifeform-dsh managed block <<<

3. 重启 DeepSeek Harness（关窗口再打开，约 60 秒）

4. 验收：
   - 侧栏出现「元构控制台」
   - 打开后 6 个页签都有数据
   - 治理与门禁里点 gate.verify → 应返回 5/5 项通过
```

---

## 三个插件都是"只读优先"设计

| 插件 | 默认行为 | 会不会改变你的既有行为 |
|---|---|---|
| gate | **shadow 模式**：只记录、不改判 | **不会**（要拦需手动切 deny） |
| atom | 只在你调用 `metago_atom` 时工作 | **不会** |
| 控制台 | 只在你打开面板时读数据 | **不会** |

**L4 危险动作（删记忆 / 改法则 / 卸插件 / 清库）在控制台里一律没有入口。**

---

## 不装会怎样

| 能力 | 装了 | 不装 |
|---|---|---|
| 法则 / 技能 / 角色 | ✅ | ✅（包根目录已有） |
| 597 原子 | ✅ 一个工具入口 | 需自己写调用代码 |
| 工具调用留痕 | ✅ 2,840 条实测日志 | 无 |
| 可视化控制台 | ✅ 6 域 | 无 |
| 治理门禁 | ✅ 5 钩子 | 无 |

**核心结论：不装插件也能完整使用元构法则与技能；装插件是"多一层可观测与可操作"。**

---

## 卸载

删掉 `cordis.patch.yml` 里对应块 + 删掉 `node_modules/` 下对应目录，重启即可。

**不影响法则、技能、角色、适配模板。**
