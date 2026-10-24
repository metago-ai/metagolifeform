# -*- coding: utf-8 -*-
"""normalize_all_types.py — 批量给引擎入口加类型归一化（DEF-020）

13 个入口在对象输入下崩溃，属同一缺陷类。逐个修不如统一注入。
做法：在每个目标方法体开头插入一行归一化语句。
"""
import pathlib
import re
import shutil
import subprocess
import time

ROOT = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-normalize-" + time.strftime("%Y%m%d-%H%M%S"))

NORM = ("if (typeof {v} !== 'string') {{ {v} = ({v} === null || {v} === undefined) ? '' : "
        "(typeof {v} === 'object' ? (() => {{ try {{ return JSON.stringify({v}); }} catch (e) {{ return ''; }} }})() : String({v})); }}\n")

# (文件, 方法签名正则左括号锚点, 需归一化的形参名列表)
TARGETS = [
    ("RUNTIME/dist/validators.js", r"static checkProvenance\(output,\s*input\)\s*\{", ["output"]),
    ("RUNTIME/dist/validators.js", r"static checkCompliance\(decision,\s*context\)\s*\{", ["decision"]),
    ("RUNTIME/dist/validators.js", r"static checkComplianceProactive\(decision,\s*context\)\s*\{", ["decision"]),
    ("RUNTIME/dist/validators.js", r"static checkDataTraceability\(output,\s*input\)\s*\{", ["output"]),
    ("RUNTIME/dist/decision-lock.js", r"gateIVL\(output,\s*intent,\s*userRequest\)\s*\{", ["output", "intent", "userRequest"]),
    ("RUNTIME/dist/decision-lock.js", r"gateILT\(output,\s*intent\)\s*\{", ["output", "intent"]),
    ("RUNTIME/dist/decision-lock.js", r"gateOSG\(output\)\s*\{", ["output"]),
    ("RUNTIME/dist/decision-lock.js", r"gateIntegrity\(output\)\s*\{", ["output"]),
    ("RUNTIME/dist/kmwi-memory.js", r"addKnowledge\(content,\s*category,\s*tags,\s*source\)\s*\{", ["content"]),
    ("RUNTIME/dist/kmwi-memory.js", r"addMemory\(content,\s*type,\s*tags,\s*source\)\s*\{", ["content"]),
    ("RUNTIME/dist/kmwi-memory.js", r"addWisdom\(pattern,\s*description,\s*causalChain,\s*tags,\s*source\)\s*\{", ["pattern"]),
    ("RUNTIME/dist/kmwi-memory.js", r"addIntuition\(insight,\s*explanation,\s*tags,\s*source\)\s*\{", ["insight"]),
    ("RUNTIME/dist/perception.js", r"detectFromFeedback\(feedback\)\s*\{", ["feedback"]),
]

MARK = "/* TYPENORM */"
changed_files = []
report = []

for rel, anchor, vars_ in TARGETS:
    P = ROOT / rel
    if not P.exists():
        report.append((rel, anchor[:40], "文件不存在"))
        continue
    s = P.read_text(encoding="utf-8")
    m = re.search(anchor, s)
    if not m:
        report.append((rel, anchor[:40], "未匹配签名"))
        continue
    # 已插入过则跳过
    tail = s[m.end():m.end() + 400]
    if MARK in tail:
        report.append((rel, anchor[:40], "已归一化"))
        continue
    inject = "        " + MARK + "\n"
    for v in vars_:
        inject += "        " + NORM.format(v=v)
    s = s[:m.end()] + inject + s[m.end():]
    BACKUP.mkdir(parents=True, exist_ok=True)
    dst = BACKUP / rel.replace("/", "__")
    if not dst.exists():
        shutil.copy2(P, dst)
    P.write_text(s, encoding="utf-8")
    changed_files.append(rel)
    report.append((rel, anchor[:40], "已注入 " + ",".join(vars_)))

print("=" * 80)
print("类型归一化注入")
print("=" * 80)
for rel, a, st in report:
    print("  %-32s %-24s %s" % (rel.split("/")[-1][:32], a[:24], st))
print()
print("改动文件:", len(set(changed_files)), "｜ 备份:", BACKUP)

print()
print("语法校验：")
for rel in sorted(set(changed_files)):
    r = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    print("  %-32s %s" % (rel.split("/")[-1], "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:150]))
