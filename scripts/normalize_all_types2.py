# -*- coding: utf-8 -*-
"""normalize_all_types2.py — 用精确签名补完剩余 7 处归一化"""
import pathlib
import re
import shutil
import subprocess
import time

ROOT = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-normalize2-" + time.strftime("%Y%m%d-%H%M%S"))

NORM = ("if (typeof {v} !== 'string') {{ {v} = ({v} === null || {v} === undefined) ? '' : "
        "(typeof {v} === 'object' ? (() => {{ try {{ return JSON.stringify({v}); }} catch (e) {{ return ''; }} }})() : String({v})); }}\n")

TARGETS = [
    ("RUNTIME/dist/validators.js", 'static checkCompliance(decision) {', ["decision"]),
    ("RUNTIME/dist/validators.js", 'static checkComplianceProactive(decision) {', ["decision"]),
    ("RUNTIME/dist/validators.js", 'static checkDataTraceability(output) {', ["output"]),
    ("RUNTIME/dist/kmwi-memory.js", "addKnowledge(content, category, tags = [], source = 'external') {", ["content"]),
    ("RUNTIME/dist/kmwi-memory.js", "addMemory(content, context, tags = [], source = 'experience') {", ["content"]),
    ("RUNTIME/dist/kmwi-memory.js", "addWisdom(pattern, description, causeEffect, tags = [], source = 'synthesis') {", ["pattern"]),
    ("RUNTIME/dist/kmwi-memory.js", "addIntuition(insight, implicitKnowledge, tags = [], source = 'internalization') {", ["insight"]),
]

MARK = "/* TYPENORM */"
changed = []
for rel, sig, vars_ in TARGETS:
    P = ROOT / rel
    s = P.read_text(encoding="utf-8")
    idx = s.find(sig)
    if idx < 0:
        print("未匹配:", rel, sig[:50])
        continue
    end = idx + len(sig)
    if MARK in s[end:end + 400]:
        print("已归一化:", sig[:50])
        continue
    inject = "\n        " + MARK + "\n"
    for v in vars_:
        inject += "        " + NORM.format(v=v)
    s = s[:end] + inject + s[end:]
    BACKUP.mkdir(parents=True, exist_ok=True)
    dst = BACKUP / rel.replace("/", "__")
    if not dst.exists():
        shutil.copy2(P, dst)
    P.write_text(s, encoding="utf-8")
    changed.append(rel)
    print("已注入:", rel.split("/")[-1], "←", sig[:60])

print()
print("语法校验：")
for rel in sorted(set(changed)):
    r = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    print("  %-24s %s" % (rel.split("/")[-1], "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:150]))
