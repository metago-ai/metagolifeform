# -*- coding: utf-8 -*-
"""fix_audit_global.py — 修正全局安装核验的包清单（DEF-058）

现状：PACKAGES = ["algorithms","engine","mcp-server","lifeform","algorithms-cli"]
      但 `@metago-ai/lifeform` 与 `@metago-ai/algorithms-cli` 根本不存在
      （lifeform 与 cli 是非 scoped 的 metago-lifeform / metago-cli）→ 恒报「3/5，缺 2」。

实况：
  @metago-ai/ 下 5 个：algorithms · dev-kit · engine · mcp-server · verify-kit
  非 scoped 4 个：metago-lifeform · metago-cli · metago-completeness-kit · metago-veracity-kit
  9 个全部 rules_version = V36.11.0

修法：把清单改成「scoped 5 + 非 scoped 4」，逐包核 version 与 rules_version。
"""
import pathlib
import re
import shutil
import subprocess
import time

H = pathlib.Path(r"D:\DSH-Official\home\scripts\audit_global.py")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0\scripts\audit_global.py")

NEW = r'''# -*- coding: utf-8 -*-
"""audit_global.py — 全局用户级生效核验

核验三件事：
  1. 全局安装：@metago-ai/* 5 个 + 非 scoped metago-* 4 个，全部在位
  2. 版本对齐：每个包 rules_version = V36.11.0
  3. 跨目录可用：从任意工作目录能否加载（不依赖 cwd）

DEF-058：原清单把 lifeform / algorithms-cli 当成 @metago-ai/ 下的包，
        但它们是**非 scoped** 的 metago-lifeform / metago-cli → 恒报「3/5，缺 2」。
"""
import json
import pathlib
import subprocess
import sys

NPM = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules")
SCOPED = ["algorithms", "dev-kit", "engine", "mcp-server", "verify-kit"]
UNSCOPED = ["metago-lifeform", "metago-cli", "metago-completeness-kit", "metago-veracity-kit"]
WANT_RULES = "V36.11.0"

print("=" * 88)
print("全局用户级生效核验")
print("=" * 88)


def check(pkg_dir, label):
    pj = pkg_dir / "package.json"
    if not pkg_dir.exists() or not pj.exists():
        print("  %-42s %-8s %-10s %s" % (label, "缺失", "-", "-"))
        return False, None
    try:
        d = json.loads(pj.read_bytes().decode("utf-8-sig"))
    except Exception as e:
        print("  %-42s %-8s %-10s %s" % (label, "解析失败", "-", str(e)[:20]))
        return False, None
    ver = d.get("version", "?")
    rv = d.get("rules_version") or d.get("dsh_rules_version") or "无"
    ok = str(rv).startswith("V36.11")
    print("  %-42s %-8s %-10s %s %s" % (label, "在位", ver, rv, "" if ok else "⚠"))
    return ok, ver


print()
print("【1. @metago-ai/* 作用域包】")
print("  %-42s %-8s %-10s %s" % ("包", "存在", "版本", "rules_version"))
print("-" * 88)
ok_s = 0
for name in SCOPED:
    good, _ = check(NPM / "@metago-ai" / name, "@metago-ai/" + name)
    if good:
        ok_s += 1

print()
print("【2. 非 scoped 包】")
print("  %-42s %-8s %-10s %s" % ("包", "存在", "版本", "rules_version"))
print("-" * 88)
ok_u = 0
for name in UNSCOPED:
    good, _ = check(NPM / name, name)
    if good:
        ok_u += 1

print()
print("【3. 跨目录可用（不依赖 cwd）】")
probe = ("const E=require('C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine');"
         "process.stdout.write(typeof E.DecisionLock==='function'?'ok':'bad');")
cross = 0
for cwd in [pathlib.Path.home(), pathlib.Path(r"D:\DSH-Official\home"), pathlib.Path(r"C:\\")]:
    try:
        r = subprocess.run(["node", "-e", probe], capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=120, cwd=str(cwd))
        good = "ok" in (r.stdout or "")
    except Exception:
        good = False
    print("  %-42s %s" % (str(cwd), "✓ 可加载" if good else "✗ 失败"))
    if good:
        cross += 1

print()
print("-" * 88)
print("作用域包 %d / %d ｜ 非 scoped %d / %d ｜ 跨目录 %d / 3"
      % (ok_s, len(SCOPED), ok_u, len(UNSCOPED), cross))
bad = (len(SCOPED) - ok_s) + (len(UNSCOPED) - ok_u) + (3 - cross)
print("总判定：" + ("PASS（全局用户级全部生效）" if bad == 0 else "需关注（%d 项不满足）" % bad))
sys.exit(0 if bad == 0 else 1)
'''

for p in [H, PKG]:
    p.write_text(NEW, encoding="utf-8")
    print(f"✓ 已重写 {p.parent.parent.name}/{p.name}")

r = subprocess.run([r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe",
                    "-c", f"import ast,pathlib;ast.parse(pathlib.Path(r'{H}').read_text(encoding='utf-8'))"],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:200])

print()
print("实跑：")
r2 = subprocess.run([r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe", str(H)],
                    capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=300)
print(r2.stdout or (r2.stderr or "")[:300])
print("退出码:", r2.returncode)
