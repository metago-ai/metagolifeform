# -*- coding: utf-8 -*-
"""fix_validator_normalize.py — 在 validateAll 入口统一归一化 output 为字符串

比逐个改 .includes / .toLowerCase 更稳妥：入口归一一次，后续全部安全。
"""
import pathlib
import re

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine\RUNTIME\dist\validators.js")
s = P.read_text(encoding="utf-8")

if "/* NORMALIZED */" in s:
    print("已归一化，跳过")
    raise SystemExit(0)

# 找 validateAll 的入口
M = re.search(r"(validateAll\(output,\s*context\)\s*\{\s*\n)", s)
if not M:
    print("未找到 validateAll 入口")
    raise SystemExit(1)

INJECT = M.group(1) + """        /* NORMALIZED：统一把 output 归一为字符串，避免调用方传对象/数组时崩溃 */
        if (typeof output !== 'string') {
            try { output = typeof output === 'object' && output !== null ? JSON.stringify(output) : String(output); }
            catch (e) { output = ''; }
            if (typeof output !== 'string') output = '';
        }
        /* 同理归一 context 中的 input 若存在且非字符串，由各 check 自行 String() 处理 */
"""
s = s[:M.start()] + INJECT + s[M.end():]
P.write_text(s, encoding="utf-8")
print("已在 validateAll 入口注入归一化")

# 顺带修 4 处对 output 直接调方法的行（加 String 包裹）
FIXES = [
    ("const lowerOutput = output.toLowerCase();", "const lowerOutput = String(output).toLowerCase();"),
    ("const hasCritical = criticalPhrases.some(p => output.toLowerCase().includes(p.toLowerCase()));",
     "const hasCritical = criticalPhrases.some(p => String(output).toLowerCase().includes(p.toLowerCase()));"),
    ("const found = placeholders.filter(p => output.includes(p));",
     "const found = placeholders.filter(p => String(output).includes(p));"),
]
n = 0
for old, new in FIXES:
    if old in s:
        s = s.replace(old, new, 1)
        n += 1
P.write_text(s, encoding="utf-8")
print("另修 %d 处直接字符串方法调用" % n)
