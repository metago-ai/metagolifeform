# -*- coding: utf-8 -*-
"""renumber_rtm.py — RTM 编号连续化（DEF-069）

病情：RTM 编号是 R01–R19 然后跳到 R100–R183。
      断档 80 个号（R20–R99）不是需求丢失，是**编号从 2 位改 3 位时的跳号**。
      但对需求追踪矩阵来说，任何断档都会让审计者问「R20–R99 是什么」——
      追踪矩阵的价值就在于「编号能一路数下去」。

修法：R100–R183 → R20–R103，使全表连续为 R01–R103。
      已核实：rtm.md 之外无任何地方引用 R1xx，重编号安全。
"""
import pathlib
import re
import shutil
import time

RTM = pathlib.Path(r"D:\DSH-Official\home\docs\rtm.md")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0\docs\rtm.md")
BAK = pathlib.Path(r"D:\metago-build") / ("backup-rtm-" + time.strftime("%Y%m%d-%H%M%S"))
BAK.mkdir(parents=True, exist_ok=True)

t = RTM.read_text(encoding="utf-8")
shutil.copy2(RTM, BAK / "rtm.md")

# ① 统计改前
before_ids = sorted({int(m.group(1)) for m in re.finditer(r"\bR(\d{1,3})\b", t)})
print(f"改前：{len(before_ids)} 个编号，范围 R{before_ids[0]}–R{before_ids[-1]}")

# ② 建映射：R100+ → R20+（保持 100-99=1 的偏移）
MAP = {}
for old in before_ids:
    if old >= 100:
        MAP[old] = old - 80      # 100→20, 183→103

print(f"需重编号 {len(MAP)} 个：R100→R{MAP[100]} … R{max(MAP)}→R{MAP[max(MAP)]}")

# ③ 替换（只替 R100 及以上，且避免误伤 R1000）
def repl(m):
    n = int(m.group(1))
    if n in MAP:
        new = MAP[n]
        return "R%02d" % new
    # R01–R19 保持原样（可能已是 2 位）
    return "R%02d" % n

t2 = re.sub(r"\bR(\d{1,3})\b", repl, t)

# ④ 标题版本也更新
t2 = t2.replace("# UDGK RTM · 元构 v36.10.0 需求追踪矩阵",
                "# UDGK RTM · 元构 V36.11.0 需求追踪矩阵")

RTM.write_text(t2, encoding="utf-8")
print(f"✓ 已重写 rtm.md（{len(t)} → {len(t2)} B）")

# ⑤ 复核连续性
after_ids = sorted({int(m.group(1)) for m in re.finditer(r"\bR(\d{1,3})\b", t2)})
missing = [i for i in range(after_ids[0], after_ids[-1] + 1) if i not in after_ids]
print(f"\n改后：{len(after_ids)} 个编号，范围 R{after_ids[0]}–R{after_ids[-1]}")
print(f"  断档：{missing if missing else '无 ✓'}")

# ⑥ 数据行计数
rows = [l for l in t2.split("\n") if re.match(r"^\|\s*R\d{2,3}\s*\|", l)]
empty = [r.split("|")[1].strip() for r in rows if len(r.split("|")) >= 6 and not r.split("|")[5].strip()]
print(f"  数据行：{len(rows)} ｜ 证据列为空：{len(empty)}")

# ⑦ 同步到包
PKG.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(RTM, PKG)
print(f"✓ 已同步到包内 docs/rtm.md")
print(f"备份：{BAK / 'rtm.md'}")
