---
name: metago-capability-index
description: 能力索引：把"这件事该用哪个工具/读哪个技能/跑哪个校验"一次查清。本机 26 类任务型（数值计算、耦合度、价值评估、决策评估、逻辑推理、创造进化、记忆、算法检索、原子调用、PPT、Word、Excel、设计出图、深度研究、3D、易理、浏览器、采集、文件、影片、音视频、逆向、系统取证、交付验证等）各自对应哪些真实工具与必跑校验，全部来自实测（工具 696 个 / 技能 171 个）。凡是"这个任务用什么工具""该调哪个 MCP""有没有更合适的做法""工具名到底是什么""要跑哪些校验才能算完成"这类问题，先读本技能，不要凭印象编工具名。
whenToUse: 接到任务但不确定该用哪个工具族；或不确定某个工具名是否真实存在；或要确认"做完要跑哪些校验"；或要把某个任务从"我会做"升级成"我按路由做"。触发词包括：算相似度、余弦相似度、这两个有多像、距离是多少、Jaccard、Dice、相关系数、皮尔逊、斯皮尔曼、协方差、两个变量相关吗、降维、PCA、主成分、SVD、特征提取、耦合度、耦生度、超导态、关系强度、耦合矩阵、价值评估、多维价值、DCV。
---

# 能力索引 · 任务 → 工具 / 技能 / 校验

> **这张表是机器生成的**（脚本 `$METAGO_LIFEFORM_HOME\scripts\p4-12-gen-capability-skill.mjs`），
> 数据源 `ledger/capability-routing.json`。要改路由就改那个 JSON，再重新生成——**不要手改本文件**。
> 表里每个工具名都经 `check-routing.mjs` 校验过：**引用了不存在的工具会直接报错**。

## 一、先看这张总表（26 类任务）

| 路由 | 任务类型 | 触发话术 | 首选工具 |
|---|---|---|---|
| route-01 | 相似度与距离计算（向量/文本/集合） | 算相似度、余弦相似度、这两个有多像、距离是多少、Jaccard、Dice | `mcp__metago-algorithms__cosine_similarity` |
| route-02 | 相关性与协方差 | 相关系数、皮尔逊、斯皮尔曼、协方差、两个变量相关吗 | `mcp__metago-algorithms__pearson_correlation` |
| route-03 | 降维 / 矩阵分解 / 特征提取 | 降维、PCA、主成分、SVD、特征提取 | `mcp__metago-algorithms__extract_pca` |
| route-04 | 耦生度 / 耦合矩阵 / 超导态判定 | 耦合度、耦生度、超导态、关系强度、耦合矩阵 | `mcp__metago-algorithms__coupling_calculate` |
| route-05 | 价值评估（29/31 维） | 价值评估、多维价值、DCV、贡献度、值不值 | `mcp__metago-algorithms__value_assess` |
| route-06 | 决策评估与方案取舍 | 该选哪个、方案对比、决策、要不要做、评估这个决定 | `mcp__metago-algorithms__decision_decide` |
| route-07 | 逻辑推理与推理链 | 推理链、逻辑是否自洽、证明、矛盾在哪、三段论 | `mcp__metago-algorithms__logic_reason` |
| route-08 | 创造与进化运算 | 从 0 到 1、新想法、元进化、能力边界、自生成 | `mcp__metago-algorithms__creation_create` |
| route-09 | 记忆检索与固化 | 上次说过什么、查记忆、记住这个、之前怎么定的 | `mcp__metago-algorithms__memory_operate` |
| route-10 | 算法检索与发现 | 有哪些算法、找算法、统计多少个、这个族有什么 | `mcp__metago-algorithms__list_algorithms` |
| route-11 | 元构 597 原子调用 | 调原子、ATOM_、业务原子、原子能干什么 | `metago_atom` |
| route-12 | PPT 制作与就地编辑 | 做 PPT、改这份 pptx、汇报材料、演示文稿 | `mcp__metago-work（可选，需另装 $METAGO_WORK_HOME 引擎）__ppt_build` |
| route-13 | Word 文档生成与定点修改 | 写文档、做 docx、改这份 Word、转 PDF | `mcp__metago-work（可选，需另装 $METAGO_WORK_HOME 引擎）__doc_build` |
| route-14 | Excel 表格与数据处理 | 做表格、清洗数据、透视、算一下这列、xlsx | `mcp__metago-work（可选，需另装 $METAGO_WORK_HOME 引擎）__sheet_create` |
| route-15 | 设计出图（海报/信息图/卡片） | 做张图、海报、信息图、封面、名片 | `mcp__metago-work（可选，需另装 $METAGO_WORK_HOME 引擎）__design_render` |
| route-16 | 深度研究与研究报告 | 调研、研究报告、查资料写报告、竞争分析 | `mcp__metago-work（可选，需另装 $METAGO_WORK_HOME 引擎）__research_new` |
| route-17 | 3D / CAD 模型查看与渲染 | 看看这个模型、STEP 文件、3D 渲染、户型、GLB | `mcp__metago-3d（可选，需另装 $METAGO_3D_HOME 引擎）__model3d_inspect` |
| route-18 | 易理推演（八字/奇门/六爻/紫微/择日） | 八字、奇门、六爻、紫微、择日、起卦 | `mcp__yili__bazi_calc` |
| route-19 | 浏览器自动化与 UI 交互验证 | 打开网页、点这个按钮、走查界面、截图给我看、UI 测试 | `mcp__playwright__browser_navigate` |
| route-20 | 网页内容采集 | 抓取网页、爬这个站、批量取数据、反爬 | `mcp__scrapling__scrapling_fetch` |
| route-21 | 本地文件读写与搜索 | 读这个文件、改这个文件、找文件、grep | `read` |
| route-22 | 影片制作（解说片/宣传片） | 做片子、宣传片、视频、解说词、配乐 | `film_project` |
| route-23 | 音视频处理（剪辑/转码/抽帧） | 剪一下、转码、抽帧、加字幕、看这个视频唱了什么 | `ffmpeg_probe` |
| route-24 | 二进制 / 安装包 / 逆向分析 | 分析这个 exe、拆 apk、看这个 asar、逆向、二进制 | `mcp__rea__open_binary` |
| route-25 | 系统状态取证（安装/端口/进程） | 装好了吗、版本是多少、端口、进程、环境自检 | `metago_lifeform_status` |
| route-26 | 交付前验证（七层 + 对抗式审查） | 做完了吗、验证一下、交付、能不能发 | `mcp__metago__metago_delivery_gate` |

## 二、三条使用铁律

1. **工具名不要编**。下面 91 个工具是实测存在的；表里没有的，先跑
   `node $METAGO_LIFEFORM_HOME\scripts\check-routing.mjs` 或查 `ledger/tool-inventory.json`（696 条）。
2. **「必跑校验」不是建议，是判据**。每条路由最后一列那些校验项，是"这件事算不算做完"的硬条件。
   例：出图必须 `read_image` 亲看；改 pptx 必须用 `ppt_edit` 而不是重写整包。
3. **数值只认计算型**。`mcp__metago__*` 的 54 个工具是**方法注入型**，返回框架不返回数字；
   要数值走 `mcp__metago-algorithms__*` 或 `metago_atom`。

## 三、被引用最多的能力

按路由出现次数排（越靠前越常被用到）：

1. `mcp__metago-algorithms__cosine_similarity` — 1 条路由
2. `mcp__metago-algorithms__euclidean_distance` — 1 条路由
3. `mcp__metago-algorithms__jaccard_coefficient` — 1 条路由
4. `mcp__metago-algorithms__semantic_similarity` — 1 条路由
5. `mcp__metago-algorithms__pearson_correlation` — 1 条路由
6. `mcp__metago-algorithms__spearman_correlation` — 1 条路由
7. `mcp__metago-algorithms__kendall_tau` — 1 条路由
8. `mcp__metago-algorithms__covariance` — 1 条路由
9. `mcp__metago-algorithms__extract_pca` — 1 条路由
10. `mcp__metago-algorithms__simplified_svd` — 1 条路由
11. `mcp__metago-algorithms__reduce_dimension` — 1 条路由
12. `mcp__metago-algorithms__coupling_calculate` — 1 条路由
13. `mcp__metago-algorithms__build_coupling_matrix` — 1 条路由
14. `mcp__metago-algorithms__is_superconductive` — 1 条路由
15. `mcp__metago-algorithms__identify_strong_pairs` — 1 条路由

## 四、配套技能（被这些路由点名的）

- `canvas-design`
- `film-pipeline`
- `film-qa`
- `film-studio`
- `metago-3d（可选，需另装 $METAGO_3D_HOME 引擎）`
- `metago-adversarial-review`
- `metago-coupling-measure`
- `metago-critique`
- `metago-decision-eval`
- `metago-deep-reasoning`
- `metago-delivery-gate`
- `metago-expert-knowledge-crystal-curator`
- `metago-memory-manage`
- `metago-meta-create`
- `metago-meta-evolve`
- `metago-shushu`
- `metago-thought-03-dcv-value`
- `metago-value-assess`
- `metago-veracity-guard`
- `metago-work（可选，需另装 $METAGO_WORK_HOME 引擎）`
- `metago-yijing`

## 五、怎么用（最短路径）

```
任务进来
  → 扫上面的总表，按「触发话术」找匹配行
  → 拿到该行的「首选工具」，去 ledger/tool-inventory.json 确认参数
  → 执行
  → 跑该行 mustRunChecks 里的校验（在 ledger/capability-routing.json 的 mustRunChecks 字段）
  → 全过才说完成
```

## 六、同源文件（要细节看这里）

| 文件 | 内容 |
|---|---|
| `$METAGO_LIFEFORM_HOME\ledger\capability-routing.json` | 26 条路由完整定义（含 mustRunChecks / pitfall / evidence） |
| `$METAGO_LIFEFORM_HOME\ledger\capability-layers.md` | 12 层能力台账（每层实测规模与缺口） |
| `$METAGO_LIFEFORM_HOME\ledger\tool-inventory.json` | 696 个工具逐项（分组 / 参数数 / 描述） |
| `$METAGO_LIFEFORM_HOME\ledger\capability-truth.json` | 821 项能力真伪标注（executable / method-injection / method-skill） |
| `$METAGO_LIFEFORM_HOME\reports\skills.md` | 技能可加载性核验 |

---

*自动生成 · 数据源 capability-routing.json · 校验器 check-routing.mjs*
