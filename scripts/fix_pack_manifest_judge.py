# -*- coding: utf-8 -*-
"""fix_pack_manifest_judge.py — 修正插件包清单判据（CORR-036）

错在哪：只查根目录的 plugin.json / manifest.json / package.json，
        于是 claude / codex / zcode 三个包被误判「无清单」。

真相：各平台清单放在各自约定的隐藏目录里——
  agent-plugins-1.0.0/plugin.json      （通用格式，根目录）
  claude/.claude-plugin/plugin.json
  codex/.codex-plugin/plugin.json
  zcode/.zcode-plugin/plugin.json
平台规范就是这样，不是缺陷。
"""
import pathlib
import re
import subprocess

P = pathlib.Path(r"D:\metago-build\cli_plugin_arch_test.py")
s = P.read_text(encoding="utf-8")

OLD = '''    for pk in packs:
        d = found / pk
        man = next((d / m for m in ["plugin.json", "manifest.json", "package.json"] if (d / m).exists()), None)
        print(f"    {pk:<22}{'有清单 ' + man.name if man else '⚠ 无清单'}")'''

NEW = '''    # CORR-036：各平台清单在各自约定的路径（含隐藏目录），不是都在根目录
    MANIFEST_CANDIDATES = [
        "plugin.json", "manifest.json", "package.json",
        ".claude-plugin/plugin.json", ".codex-plugin/plugin.json",
        ".zcode-plugin/plugin.json", ".plugin/plugin.json",
    ]
    for pk in packs:
        d = found / pk
        man = next((d / m for m in MANIFEST_CANDIDATES if (d / m).exists()), None)
        rel = man.relative_to(d).as_posix() if man else ""
        print(f"    {pk:<22}{'清单 ' + rel if man else '⚠ 无清单'}")'''

if OLD in s:
    P.write_text(s.replace(OLD, NEW, 1), encoding="utf-8")
    print("✓ 清单判据已修（含平台专属路径）（CORR-036）")
else:
    print("? 未匹配")

r = subprocess.run([r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe",
                    "-c", f"import ast,pathlib;ast.parse(pathlib.Path(r'{P}').read_text(encoding='utf-8'))"],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
print("语法:", "OK" if r.returncode == 0 else (r.stderr or "")[:200])

print()
print("实跑验证：")
r2 = subprocess.run([r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe", str(P)],
                    capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600)
out = r2.stdout or ""
for l in out.split("\n"):
    if "插件包:" in l or "清单" in l or "总判定" in l or "PASS" in l:
        print("  " + l.strip()[:92])
print("  退出码:", r2.returncode)
