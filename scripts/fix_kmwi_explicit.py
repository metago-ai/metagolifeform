# -*- coding: utf-8 -*-
"""fix_kmwi_explicit.py — 修复 KMWIMemory 的 explicitForm 未判空缺陷

缺陷：kmwi-memory.js 第 662 行
    const explicit = intuitions.filter(i => i.explicitForm.length > 0).length;
  假设每条直觉都有 explicitForm 字段，实际历史数据里没有 → 抛
  "Cannot read properties of undefined (reading 'length')"
  → 连带 getHealth / getDecayRates / getStrengthenSuggestions 全部崩溃
  → metago_memory_manage 工具不可用

修法：改成 (i.explicitForm || '').length > 0
"""
import pathlib
import shutil
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine\RUNTIME\dist\kmwi-memory.js")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-kmwi-" + time.strftime("%Y%m%d-%H%M%S"))

s = P.read_text(encoding="utf-8")

OLD = "const explicit = intuitions.filter(i => i.explicitForm.length > 0).length;"
NEW = "const explicit = intuitions.filter(i => (i.explicitForm || '').length > 0).length;"

if NEW in s:
    print("已修复，跳过")
    raise SystemExit(0)

if OLD not in s:
    print("未匹配目标行，检查实际内容")
    import re
    for i, l in enumerate(s.splitlines(), 1):
        if "explicitForm" in l:
            print("  L%d: %s" % (i, l.strip()[:120]))
    raise SystemExit(1)

BACKUP.mkdir(parents=True, exist_ok=True)
shutil.copy2(P, BACKUP / P.name)
print("已备份:", BACKUP / P.name)

s = s.replace(OLD, NEW, 1)
P.write_text(s, encoding="utf-8")
print("已修复 explicitForm 判空")

# 顺带检查同类未判空
print()
print("同类风险扫描（.length 直接访问可能为 undefined 的字段）:")
import re
risky = []
for i, l in enumerate(s.splitlines(), 1):
    m = re.search(r"\b([a-zA-Z_$][\w$]*)\s*\.\s*([a-zA-Z_$][\w$]*)\s*\.\s*length\b", l)
    if m and "||" not in l and "?." not in l and "&&" not in l:
        risky.append((i, l.strip()[:110]))
for i, txt in risky[:12]:
    print("  L%-5d %s" % (i, txt))
print("  共 %d 处需人工确认" % len(risky))
