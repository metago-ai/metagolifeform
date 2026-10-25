# metagolifeform v36.12.0 · 先读我

> 本包基于 v36.9.6 升级。**升级的性质不是补丁，是基因层补全 + 证据层重建。**

---

## 一、拿到包先做三件事

```bash
# 1. 三套自测（任一 FAIL 即不可信）
node packages/algorithms/engine/algorithms/t3impl/t3test.cjs   # 期望 227/227
node packages/engine/atoms/verify.cjs                          # 期望 compute 50/50
node verify-package.cjs                                        # 期望 17/17

# 2. 校验完整性
sha256sum -c SHA256SUMS.txt | tail -5

# 3. 直接调一条 T3 算法（不经任何转接层）
node -e "const R=require('./packages/algorithms/engine/algorithms/registry.js');
console.log(JSON.stringify(R.executeAlgorithmSync('ALG_T3_C_003',
  {score:1.12,stabilityHistory:[1.05,1.1],threshold:1.0}),null,1))"
# 期望：success:true, output:{superconductive:true,margin:0.12,...,phase:'super'}
```

---

## 二、这次改了什么

| 层 | 升级前 | 升级后 |
|---|---|---|
| **T3 算法** | 227 条空壳（`handler: undefined` 却 `implemented: true`） | **227 条真实实现，已挂入 `registerT3` 后的运行时注册表** |
| 公理 | 12 条 | **38 条** |
| 属性 | 11 条 | **47 / 47 全覆盖** |
| 协议 | 6 条 | **121 / 121** |
| 引擎 | 只有索引清单 | **161 / 161** |
| 原子 | 0 条实现 | **50 条 compute 实现** + 四级诚实拒绝 |
| 位置多参算法可调 | 结构性不通 | **462 / 474 = 97.5%** |
| T2 `inputSchema` | 400 条字面值 `"varies"` | **0 条残留** |

### 四个关键文件

| 文件 | 作用 |
|---|---|
| `FACTS.json` | **单一真相源**。51 条事实，每条带 evidence 指针；3 组冲突 + 7 条权威裁决 |
| `NUMBERING-ALIGNMENT.md` | **编号撞车方案书**。14 处同号不同义的逐条对照 + 三个方案（待决策） |
| `UPGRADE-NOTES.md` | 全量工程台账，R1–R27 每一步做了什么、结论从哪来 |
| `DELIVERY-VERIFY.md` | 17 项交付验收结果 |

---

## 三、**没做完的**（写在最显眼处）

| 缺口 | 数量 | 真实原因 |
|---|---|---|
| 原子真实实现 | **50 / 984（5.1%）** | 蓝本 **473 条原子没有「输入/输出」契约**。无契约 = 无可验证的实现标准。这是规格缺失，不是编程缺失 |
| T1/T2 难调算法 | 12 条 | 嵌套对象型形参，通用形态推不出，需逐条读语义手写输入 |
| 函数型形参算法 | 21 条 | **MCP 是 JSON 协议，无法传函数**。属结构性不可传，除非改协议 |
| 公理 A31 / A32 / A33 | 3 条 | 蓝本表格中无此编号 |
| **编号撞车** | **14 处** | **待决策**，见 `NUMBERING-ALIGNMENT.md` |

**本包不做以下声明**：
- ❌ 不声称「597 条原子全部实现」
- ❌ 不声称「927 算法全部可执行」
- ❌ 不声称「编号体系已统一」

---

## 四、原子引擎的四级分类（请务必理解）

本包对原子**不做「有就报成功」的处理**：

| kind | 含义 | 调用结果 |
|---|---|---|
| `compute` | 确定性计算，有公式，自测通过 | `success: true` + 真实数值 |
| `template` | 结构化生成，未实现 | **`success: false`**, `reason: TEMPLATE_NOT_IMPLEMENTED` |
| `external` | 需模型/服务（翻译、语音、视觉、硬件） | **`success: false`**, `reason: EXTERNAL_REQUIRED` |
| `declared` | 蓝本只有名字，无 I/O 契约 | **`success: false`**, `reason: NO_CONTRACT` |

`packages/engine/atoms/verify.cjs` 里有一项专门检查「非 compute 类是否返回了 `success: true`」——**返回一次就整体 FAIL**。这个检查不是防 bug，是防"假装"。

---

## 五、蓝本换代说明

**旧蓝本**：单文件 `元构全息智能引擎.txt`（34,655 行）
**新蓝本**：`元构初始文档/`（4 附录卷 + 8 卷 + 2 索引）

4 个附录卷是旧蓝本的**逐行副本**，已用程序逐行校验：**34,653 / 34,655 行完全一致（99.99%）**。
行号映射工具 `blueprint_map` 可把「原文第 N 行」换算成「第几卷第几行」，可回验。

⚠️ **附录卷止于 V36.3**。`A37/A38/D44/D45` 等是 V36.9.x 增量，**不在附录卷内**，其真实出处是 `AGENTS.md`。已迁移的 14 处引用按此分流。

---

## 六、如果要继续往上做

按投入产出排序：

1. **补原子 I/O 契约**（473 条）→ 这是唯一能把原子实现率从 5% 拉上去的路径，属**产品设计工作**
2. **选编号对齐方案**（甲/乙/丙）→ 10 分钟可完成，影响面小
3. **补 12 条难调算法的输入规格** → 逐条需读实现语义
4. **改 MCP 协议以支持函数型入参** → 架构级决策，影响面大

---

*本包不承诺「完整」。它承诺的是：每个数字可追、每个缺口登记、每项能力可复跑。*
