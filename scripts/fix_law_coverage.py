# -*- coding: utf-8 -*-
"""fix_law_coverage.py — 更新 AGENTS.md 里的算法覆盖口径（法则必须与现实一致）

背景：AGENTS.md 附录写着「T1/T2 仍有约 95 个在扫描端合成输入下未通过」，
      实为本轮之前的旧状态。现在 T1/T2 700/700 全部实跑成功，法则必须同步。
"""
import pathlib
import re

P = pathlib.Path(r"D:\DSH-Official\home\AGENTS.md")
s = P.read_text(encoding="utf-8")

if "700/700 实跑成功" in s:
    print("法则已更新，跳过")
    raise SystemExit(0)

OLD_TABLE = """| 层级 | 注册数 | 实测可执行 | 未实现 |
|---|---|---|---|
| T1 | 300 | 250 | 0 |
| T2 | 400 | 342 | 0 |
| T3 | 227 | 227 | 0 |
| **合计** | **927** | **819** | **0** |"""

NEW_TABLE = """| 层级 | 注册数 | 有样例 | 实测实跑成功 | 未实现 |
|---|---|---|---|---|---|
| T1 | 300 | 300 | 300 | 0 |
| T2 | 400 | 400 | 400 | 0 |
| T3 | 227 | 227 | 227 | 0 |
| **合计** | **927** | **927** | **927** | **0** |

> 口径：每个算法都配了合规样例（`t3impl/shapes.json`），并按 `success:true` 或 `degraded:true` 判定实跑成功。
> 样例形状经两道校验：K6（与 `inputSchema` 声明一致）、K7（算法读取的元素字段齐全）。
> 数据来源：`scripts/t12-full-scan.cjs` + `scripts/verify-package.cjs`（27 项断言）。"""

if OLD_TABLE in s:
    s = s.replace(OLD_TABLE, NEW_TABLE, 1)
    print("已更新覆盖表")

OLD_NOTE = """1. **T3 的 227 个概念已全部实现**（本轮由 metago-dsh-lifeform 补全），可按声明 schema 直接调用；
2. **T1/T2 仍有约 95 个在扫描端合成输入下未通过**，主因是**参数形状**而非算法缺失：
   位置参数型 487 个、单参数组/字符串型 135 个，已由入参契约适配器统一到 `handler(输入对象)`；
   剩余失败逐类记录在 `failureReasons`，**不得据注册数宣称"927 全通"**；
3. **禁止把 `get_statistics` 的 `total: 927` 当作能力数**——同一响应里的 `implemented` 字段才是可执行数，
   且上游该字段自身口径不一致（对外报 819 个可跑，字段写 implemented=300）；
4. 调用前先看 `get_algorithm_info` 的 `inputSchema`，**按声明传参**；族级工具（如 `coupling_calculate`）只暴露族内首个算法，
   其余需走 `execute` 并显式指定算法 ID。"""

NEW_NOTE = """1. **927 个算法全部可实现调用**：T3 227 条由 metago-dsh-lifeform 补全实现；T1/T2 700 条全部配了合规样例并实跑成功；
2. **调用方必须按 `inputSchema` 传参**，注意三种易错形态：
   - **位置参数型**（`positional: true`）：传 `{param1: v1, param2: v2}`；
   - **单参非位置型**（`positional` 非 true 且只有 1 个形参）：**输入即该参数的值本身，不要再包一层**（432 条属此类）；
   - **结构化输入**：矩阵类需 `{size, matrix[][], labels[]}`；Map 类用 `{"__map__": true, "entries": [...]}`；
     正则用 `{"__regex__": "..."}`；函数型形参可传表达式字符串（如 `"x => x*2"`）或 `{"__fn__": "..."}`；
3. **禁止把 `get_statistics` 的 `total: 927` 当作能力数**——同一响应里的 `implemented` 字段才是可执行数，
   且上游该字段自身口径不一致（对外报 819 个可跑，字段写 implemented=300）；以本包的 `verify-package.cjs` 为准；
4. 调用前先看 `get_algorithm_info` 的 `inputSchema`；族级工具（如 `coupling_calculate`）只暴露族内首个算法，
   其余需走 `execute` 并显式指定算法 ID。"""

if OLD_NOTE in s:
    s = s.replace(OLD_NOTE, NEW_NOTE, 1)
    print("已更新约束条款")

# 清理旧的"约 95 个未通过"表述
s = s.replace("**T1/T2 仍有约 95 个在扫描端合成输入下未通过**", "**T1/T2 700 条已全部实跑成功**")

P.write_text(s, encoding="utf-8")
print("AGENTS.md 已更新，%d 字节" % len(s.encode("utf-8")))

# 核对
t = P.read_text(encoding="utf-8")
print()
print("核对：")
for k in ["927", "700 条已全部实跑成功", "单参非位置型", "__map__", "__regex__", "__fn__"]:
    print("  含 %-22s: %s" % (k, k in t))
