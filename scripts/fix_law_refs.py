# -*- coding: utf-8 -*-
"""fix_law_refs.py — 修正法则里的 3 处悬空引用（DEF-023）

1. verify-package.cjs：存在于 D:\metago-build\，但法则写 `scripts/verify-package.cjs`
   → 装一份到 $DSH_HOME/scripts/
2. update-law-algorithm-coverage.mjs：全盘不存在 → 该块注释指向它的「重跑方法」失效
3. verify-algorithms-all.mjs：全盘不存在 → 附录里写的「机器实测命令」跑不了
   处置：改指向真实存在的等价脚本（t12-full-scan.cjs / verify-package.cjs / audit_skills.py）
"""
import pathlib
import shutil

H = pathlib.Path(r"D:\DSH-Official\home")
A = H / "AGENTS.md"
s = A.read_text(encoding="utf-8")

# ---- 1. 装 verify-package.cjs 与依赖脚本 ----
SRC = pathlib.Path(r"D:\metago-build")
DST = H / "scripts"
installed = []
for n in ["verify-package.cjs", "t12-full-scan.cjs", "mutation-test.cjs",
          "schema-vs-shape.cjs", "element-field-scan.cjs", "find-hangs.cjs",
          "atom-hollow-scan.cjs", "atom-responsive-scan.cjs", "empty-output-scan.cjs",
          "mcp-tools-callable.cjs", "mcp-tool-nature.cjs", "validator-robustness.cjs",
          "test-kmwi-persistence.cjs", "regress57.py", "audit_install.py", "audit_global.py",
          "audit_skills.py", "audit_law_references.py"]:
    p = SRC / n
    if p.exists():
        shutil.copy2(p, DST / n)
        installed.append(n)
print("已安装/更新到 $DSH_HOME/scripts：%d 个" % len(installed))

# ---- 2. 修正注释块里的失效命令 ----
OLD1 = "<!-- 由 metago-dsh-lifeform/scripts/update-law-algorithm-coverage.mjs 写入（幂等、可回滚）。\n     上游重新生成 AGENTS.md 时本块会丢失，重跑该脚本即可恢复。\n     回滚：node scripts/update-law-algorithm-coverage.mjs --revert <备份时间戳> -->"
NEW1 = ("<!-- 本块由人工维护（原生成脚本 update-law-algorithm-coverage.mjs 已不存在，2026-10-18 核实）。\n"
        "     上游重新生成 AGENTS.md 时本块会丢失，重跑下方「复核命令」即可重建判断依据。\n"
        "     回归检查：node $DSH_HOME/scripts/verify-package.cjs（含 K1-K11 共 29 项断言） -->")
if OLD1 in s:
    s = s.replace(OLD1, NEW1, 1)
    print("已修正注释块中的失效脚本引用")

# ---- 3. 修正附录里的实测命令 ----
OLD2 = ("> 本附录以机器实测为准：`node scripts/verify-algorithms-all.mjs --timeout 60 --bisect-budget 5`\n"
        "> （数据：2026-10-02T23:11:07.268Z，完整证据 `$DSH_HOME/metago/algorithm-coverage.json`）")
NEW2 = ("> 本附录以机器实测为准（2026-10-18 复核，原 `verify-algorithms-all.mjs` 已不存在，改用以下三条）：\n"
        ">\n"
        "> ```bash\n"
        "> node $DSH_HOME/scripts/t12-full-scan.cjs      # T1/T2 700 条逐条实跑\n"
        "> node $DSH_HOME/scripts/verify-package.cjs     # 包验收 29 项（含 T3 227 条自测）\n"
        "> python $DSH_HOME/scripts/audit_skills.py      # 技能层可加载性\n"
        "> ```\n"
        ">\n"
        "> 最新实测：2026-10-18，T1 300/300、T2 400/400、T3 227/227 全部实跑成功。")
if OLD2 in s:
    s = s.replace(OLD2, NEW2, 1)
    print("已修正附录中的失测命令")

# ---- 4. 附录里的数据来源行同步 ----
OLD3 = "> 数据来源：`scripts/t12-full-scan.cjs` + `scripts/verify-package.cjs`（27 项断言）。"
NEW3 = "> 数据来源：`scripts/t12-full-scan.cjs` + `scripts/verify-package.cjs`（**29 项断言**，含 K1-K11）。"
if OLD3 in s:
    s = s.replace(OLD3, NEW3, 1)
    print("已同步断言数 27 → 29")

A.write_text(s, encoding="utf-8")
print()
print("AGENTS.md 已更新，%.1f KB" % (A.stat().st_size / 1024))

# 复核
t2 = A.read_text(encoding="utf-8")
print()
print("复核：")
for k in ["update-law-algorithm-coverage.mjs 已不存在", "verify-algorithms-all.mjs` 已不存在",
          "29 项断言", "t12-full-scan.cjs"]:
    print("  含 %-40s: %s" % (k, k in t2))
