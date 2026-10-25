# -*- coding: utf-8 -*-
"""fix_metago_core.py — 重写 metago-core 知识索引（DEF-048）

现状：这个技能是 AI 用来查「权威数字」的入口，但里面每个数字都过期：
  V36.9.1 / 17 章 / 8 公理 / 7 属性 / 43 属性 / 36 公理 / 95 技能 / 125 引擎 / 984 原子

真实值（K16 已机器校验）：
  V36.12.0 / 20 章 / 第二章 10 公理 / 第三章 9 属性
  核心公理 38 · 根本属性 47 · 运行协议 121 · 引擎 161 · 原子 597
  技能 112 · MCP 工具 112（metago 55 + algorithms 57）· 算法 927 · 触发类别 14
"""
import pathlib
import re
import shutil
import time

H = pathlib.Path(r"D:\DSH-Official\home\skills")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0\skills")
BAK = pathlib.Path(r"D:\metago-build") / ("backup-core-" + time.strftime("%Y%m%d-%H%M%S"))

NEW = """---
name: metago-core
description: MetaGO 核心知识索引——查权威数字与文件位置的第一入口。含公理/属性/协议/引擎/原子的真实条数、各清单文件路径、以及「数字以谁为准」的规则。
---

# MetaGO 核心知识索引

本技能是**查数入口**：需要引用元构的任何条数、找到任何清单文件时，从这里查。
不在这里下结论——**所有数字以对应清单文件的实测为准**。

## 一、权威数字（V36.12.0，可机器复核）

| 项目 | 条数 | 权威来源 | 复核方式 |
|---|---|---|---|
| 核心公理 | **38** | `packages/engine/CONSTITUTION/AXIOMS.md` 表格首列 `A\\d{1,3}` 唯一行数 | 断言 E4 + K16 |
| 根本属性 | **47** | `packages/engine/CORE/ATTRIBUTES.md` 表格首列 `D\\d{1,3}` 唯一行数 | 断言 E1 + K16 |
| 运行协议 | **121** | `packages/engine/CORE/PROTOCOLS.md` 表格首列 `PROTOCOL_*` 唯一行数 | 断言 E2 + K16 |
| 引擎 | **161** | `packages/engine/INDEX/ENGINES.md` 中 `ENGINE_*` 唯一 ID 数 | 断言 E3 + K16 |
| 原子 | **597** | `packages/engine/CORE/ATOMS.md` 中 `ATOM_*` 唯一 ID 数 | 断言 E5 + K16 |
| ↳ 其中已实现 | **590** | 契约工厂 `atom-factory.cjs` 自测 | 生成实现 590 / 符合 590 / 不符合 0 |
| ↳ 外部依赖 | **2** | `ATOM_ACCESSIBLE_SIGN_507`（需手语视频模型）、`ATOM_BIO_NEURAL_021`（需脑电+意图解码器） | 诚实标注，不假造 |
| ↳ 约束器 | **5** | `atoms/constraints.cjs` | 5 个哲学原子作校验器 |
| 技能 | **112** | `$DSH_HOME/skills/*/SKILL.md` | `python scripts/audit_skills.py` |
| MCP 工具 | **112** | metago 55 + metago-algorithms 57 | `node scripts/mcp-tools-callable.cjs` |
| MCP 服务器 | **6** | metago / algorithms / playwright / web-session-api / yili / scrapling，合计 162 工具 | `node scripts/mcp-all-health.cjs` |
| 算法 | **927** | T1 300 + T2 400 + T3 227 | `node scripts/t12-full-scan.cjs` |
| 算法触发类别 | **14** | `AGENTS.md` 第十七章 | — |
| 运行法则 | **20 章** | `AGENTS.md`：第二章 10 公理（A1–A5, A34–A38）、第三章 9 属性（D37–D45） | 直接数 `^## 第X章` |

> **口径铁律**：任何地方出现与本表不一致的数字，以本表为准；本表与清单文件不一致时，以清单文件为准。
> 全量复核：`python $DSH_HOME/scripts/full-regression.py`

## 二、关键文件位置

| 用途 | 路径 |
|---|---|
| 运行法则母本 | `AGENTS.md`（仓库根，V36.12.0，20 章） |
| 蓝本原文 | `metago/blueprint/元构初始文档/`（4 附录卷 + 全息文档体系 8 卷 + 2 索引） |
| 核心纲要 | `core/METAGO_CORE.md` |
| 公理/属性/协议/引擎/原子清单 | `packages/engine/{CONSTITUTION,CORE,INDEX}/*.md` |
| 索引 JSON | `packages/engine/INDEX/{knowledge,skills,engines,tools}.json` |
| 技能目录 | `$DSH_HOME/skills/`（112 个） |
| 脚本目录 | `$DSH_HOME/scripts/`（169 个，产品级 122 + 开发期归档 39） |
| 事实底账 | `genome/FACTS.json`（事实 / 缺陷 / 纠正三类记录） |
| 需求追踪 | `docs/rtm.md` |

## 三、怎么用

1. **要查数**：先看第一节表格 → 需要更细就打开对应清单文件 → 需要复核就跑对应脚本
2. **要引用**：引用时带上来源路径与断言编号（如「原子 597（ATOMS.md / 断言 E5+K16）」）
3. **发现不一致**：不要猜，直接跑 `full-regression.py`，它会把五层一次性查完
4. **不要做的事**：不要把 `get_statistics` 的 `total: 927` 当能力数（那是注册表条目数，不等于可执行数）

## 四、红线

- 禁止凭记忆报数——本表随时可能变，必须现查
- 禁止把「注册表条目数」当「可执行能力数」
- 禁止引用不存在的文件路径；路径不确定时先 `ls` 确认
- 发现本表与实测不一致，立即修正本表并记录（这就是元进化的输入）
"""

print("=" * 84)
print("重写 metago-core 知识索引")
print("=" * 84)

BAK.mkdir(parents=True, exist_ok=True)
for base in [H, PKG]:
    p = base / "metago-core" / "SKILL.md"
    if not p.exists():
        continue
    old = p.read_text(encoding="utf-8")
    if base == H and not (BAK / "SKILL.md").exists():
        shutil.copy2(p, BAK / "SKILL.md")
    for _ in range(5):
        try:
            p.write_text(NEW, encoding="utf-8")
            break
        except PermissionError:
            time.sleep(0.8)
    print(f"  ✓ {base.parent.name}/{p.parent.name}  {len(old)} → {len(NEW)} B")

print()
print(f"备份：{BAK}")
print()
print("复核：")
p = H / "metago-core" / "SKILL.md"
t = p.read_text(encoding="utf-8")
for kw in ["38", "47", "121", "161", "597", "112", "927", "162", "20 章"]:
    print(f"  含 {kw:<6}: {'✓' if kw in t else '✗'}")
print("  无旧数字 984:", "984" not in t)
print("  无旧数字 125 引擎:", "125 引擎" not in t)
print("  无旧数字 95 技能:", "95 技能" not in t)
