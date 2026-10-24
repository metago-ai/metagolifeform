# -*- coding: utf-8 -*-
"""fix_validator_types.py — 修复 AxiomValidator 的输入类型假设

缺陷（DEF-017）：validators.js:23
    const hasInputRef = input ? output.includes(input.substring(0, 50)) : false;
  假设 input 一定是字符串，实际调用方可能传对象 → input.substring is not a function

同类风险：文件中其他对 input/output 直接调用字符串方法的地方
"""
import pathlib
import re
import shutil
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine\RUNTIME\dist\validators.js")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-validators-" + time.strftime("%Y%m%d-%H%M%S"))

s = P.read_text(encoding="utf-8")
orig = s

# 1) 目标行修复
OLD = "const hasInputRef = input ? output.includes(input.substring(0, 50)) : false;"
NEW = "const hasInputRef = input ? String(output).includes(String(input).substring(0, 50)) : false;"
if OLD in s:
    s = s.replace(OLD, NEW, 1)
    print("已修 checkProvenance 的 input.substring")
else:
    print("未匹配 checkProvenance 目标行")

# 2) 全量扫描同类风险：对 input/output/context 直接调字符串方法
RISK = re.compile(r"\b(input|output|context)\s*\.\s*(substring|toLowerCase|toUpperCase|trim|split|startsWith|endsWith|includes|charAt|replace|length)\b")
hits = []
for i, l in enumerate(s.splitlines(), 1):
    for m in RISK.finditer(l):
        hits.append((i, l.strip()[:120]))
        break

print()
print("同类风险行（%d 处）：" % len(hits))
for i, txt in hits[:20]:
    print("  L%-5d %s" % (i, txt))

if s != orig:
    BACKUP.mkdir(parents=True, exist_ok=True)
    shutil.copy2(P, BACKUP / P.name)
    P.write_text(s, encoding="utf-8")
    print()
    print("已备份并写回:", BACKUP / P.name)
else:
    print()
    print("无改动")
