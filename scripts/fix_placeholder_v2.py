# -*- coding: utf-8 -*-
"""fix_placeholder_v2.py — 修掉上一步引入的重复声明，改用完整替换"""
import pathlib
import re
import shutil
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine\RUNTIME\dist\validators.js")
s = P.read_text(encoding="utf-8")

# 删掉残留的旧 found 行
OLD_FOUND = "        const found = placeholders.filter(p => String(output).includes(p));\n"
if OLD_FOUND in s:
    s = s.replace(OLD_FOUND, "", 1)
    print("已删除残留的旧 found 行")

# 检查是否还有重复
cnt = len(re.findall(r"const found = ", s))
print("'const found =' 出现次数:", cnt)

P.write_text(s, encoding="utf-8")

# 语法校验
import subprocess
r = subprocess.run(["node", "--check", str(P)], capture_output=True, text=True)
print("语法检查:", "OK" if r.returncode == 0 else "错\n" + (r.stderr or "")[:300])
