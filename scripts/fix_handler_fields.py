# -*- coding: utf-8 -*-
"""fix_handler_fields.py — 修正 handler 里的字段名假设

实际字段：axiomId / axiomName / status('pass'|'fail'|'warning') / severity / message / details
我原来写的是：axiom / id / name / passed
"""
import pathlib
import shutil
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\mcp-server\dist\index.js")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-mcpindex3-" + time.strftime("%Y%m%d-%H%M%S"))
s = P.read_text(encoding="utf-8")

FIXES = [
    # output_integrity
    ("lines.push(`■ 结论：${r.passed ? '✅ 通过' : '❌ 未通过'}`);",
     "lines.push(`■ 结论：${r.status === 'pass' ? '✅ 通过' : '❌ 未通过'}`);"),
    # self_check 逐项标记
    ("const mark = r.passed === true ? '✅' : r.status === 'warning' ? '⚠️' : '❌';\n            lines.push(`${mark} ${r.axiom || r.id || '-'}  ${r.name || ''}：${r.passed === true ? 'PASS' : (r.status || 'FAIL')}`);\n            if (r.message && r.passed !== true) lines.push(`    ${r.message}`);",
     "const mark = r.status === 'pass' ? '✅' : r.status === 'warning' ? '⚠️' : '❌';\n            lines.push(`${mark} ${r.axiomId || '-'} ${r.axiomName || ''}：${String(r.status || 'fail').toUpperCase()}`);\n            if (r.message) lines.push(`    ${r.message}`);"),
    # self_check 需修正项
    ("const failed = results.filter(r => r.passed !== true && r.status !== 'warning');",
     "const failed = results.filter(r => r.status === 'fail');"),
    ("for (const f of failed.slice(0, 8)) lines.push(`  - ${f.axiom || f.id}：${f.message || '未通过'}`);",
     "for (const f of failed.slice(0, 8)) lines.push(`  - ${f.axiomId}: ${f.axiomName} — ${f.message || '未通过'}`);"),
]

n = 0
for old, new in FIXES:
    if old in s:
        s = s.replace(old, new, 1)
        n += 1

BACKUP.mkdir(parents=True, exist_ok=True)
shutil.copy2(P, BACKUP / P.name)
P.write_text(s, encoding="utf-8")
print("修正 %d 处字段名，已备份: %s" % (n, BACKUP / P.name))

import subprocess
r = subprocess.run(["node", "--check", str(P)], capture_output=True, text=True)
print("语法检查:", "OK" if r.returncode == 0 else "错\n" + (r.stderr or "")[:300])
