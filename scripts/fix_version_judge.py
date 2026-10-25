# -*- coding: utf-8 -*-
"""fix_version_judge.py — 修正版本一致性判据（CORR-035）

错在哪：
  ① 要求子包 version 里含 36.11 —— 但子包有自己的 semver（algorithms 1.0.3 / engine 2.1.3），
     **只有 rules_version 需要对齐 V36.11**
  ② 要求蓝本原文层各卷标 V36.11 —— 但它们是 V9.0–V36.3 的原文副本，
     卷内标的是「该卷写就时的版本」，改写即失真

正确判据：
  A. 9 个 npm 包 + 交付包 + 离线 portable：**rules_version 必须是 V36.11.x**（version 自定）
  B. 显式版本声明处（VERSION / AGENTS.md / 11 平台 / 总索引 / 附录卷-原子契约补全）：必须是 V36.11
  C. 蓝本原文层（第一~八卷 + 附录卷 1-4 + 索引）：**豁免**，不参与版本对齐
"""
import pathlib
import re

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")

p = pathlib.Path(r"D:\metago-build\version_consistency.py")
s = p.read_text(encoding="utf-8")

# ① 子包只判 rules_version
s = s.replace(
    'def add(name, ver, rules, where):\n'
    '    ok = (WANT in str(ver)) and (str(rules).startswith(WANT_RULES) if rules else False)\n'
    '    rows.append((name, ver, rules, ok, where))',
    'def add(name, ver, rules, where, check_ver=False):\n'
    '    """check_ver=True 时才要求 version 里含 36.11；子包只看 rules_version"""\n'
    '    rules_ok = str(rules).startswith(WANT_RULES) if rules else False\n'
    '    ver_ok = (WANT in str(ver)) if check_ver else True\n'
    '    rows.append((name, ver, rules, rules_ok and ver_ok, where))')

# ② 蓝本原文层豁免
OLD_BP = '''# ⑤ 蓝本
bp = H / "metago" / "blueprint" / "元构初始文档"
if bp.exists():
    for f in sorted(bp.glob("*.md")):
        s = f.read_text(encoding="utf-8", errors="replace")[:3000]
        mm = re.search(r"V36\\.(\\d+)", s)
        ver = mm.group(0) if mm else "未标注"
        add("蓝本:" + f.name[:22], ver, "V36.11" if mm and mm.group(1) == "11" else ver, "blueprint")'''
NEW_BP = '''# ⑤ 蓝本：只有「本次交付产出」的卷要求 V36.11；原文层豁免（CORR-035）
bp = H / "metago" / "blueprint" / "元构初始文档"
if bp.exists():
    CURRENT = ("总索引-V36.11.md", "附录卷-原子契约补全-V36.11.md")
    ORIGINAL = re.compile(r"^(元构全息文档体系-第[一二三四五六七八]卷|元构全息知识晶体索引|附录卷-第[1-4]部分|附录卷-索引)")
    for f in sorted(bp.glob("*.md")):
        if ORIGINAL.match(f.name):
            continue          # 原文层：豁免
        s2 = f.read_text(encoding="utf-8", errors="replace")[:3000]
        mm = re.search(r"V36\\.(\\d+)", s2)
        ver = mm.group(0) if mm else "未标注"
        add("蓝本:" + f.name[:22], ver, "V36.11" if mm and mm.group(1) == "11" else ver,
            "blueprint", check_ver=True)'''
if OLD_BP in s:
    s = s.replace(OLD_BP, NEW_BP)
    print("✓ 蓝本判据已改（原文层豁免）")
else:
    print("? 蓝本段未匹配")

# ③ VERSION 那行要求版本
s = s.replace('add(f, p.read_text(encoding="utf-8").strip(), WANT_RULES, "PKG")',
              'add(f, p.read_text(encoding="utf-8").strip(), WANT_RULES, "PKG", check_ver=True)')

p.write_text(s, encoding="utf-8")
print("✓ 判据已修（CORR-035）")

import subprocess
r = subprocess.run([r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe", "-c",
                    f"import ast,pathlib;ast.parse(pathlib.Path(r'{p}').read_text(encoding='utf-8'))"],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
print("语法:", "OK" if r.returncode == 0 else (r.stderr or "")[:200])

print()
r2 = subprocess.run([r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe", str(p)],
                    capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=300)
out = r2.stdout or ""
for l in out.split("\n"):
    if "共 " in l or "总判定" in l:
        print("  " + l.strip()[:80])
