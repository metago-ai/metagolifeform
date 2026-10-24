# -*- coding: utf-8 -*-
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

print("=" * 88)
print("全局用户级生效核验")
print("=" * 88)


def check(pkg_dir, label):
    pj = pkg_dir / "package.json"
    if not pkg_dir.exists() or not pj.exists():
        print("  %-42s %-8s %-10s %s" % (label, "缺失", "-", "-"))
        return False
    try:
        d = json.loads(pj.read_bytes().decode("utf-8-sig"))
    except Exception as e:
        print("  %-42s %-8s %-10s %s" % (label, "解析失败", "-", str(e)[:20]))
        return False
    ver = d.get("version", "?")
    rv = d.get("rules_version") or d.get("dsh_rules_version") or "无"
    ok = str(rv).startswith("V36.11")
    print("  %-42s %-8s %-10s %s %s" % (label, "在位", ver, rv, "" if ok else "⚠"))
    return ok


print()
print("【1. @metago-ai/* 作用域包】")
print("  %-42s %-8s %-10s %s" % ("包", "存在", "版本", "rules_version"))
print("-" * 88)
ok_s = sum(1 for n in SCOPED if check(NPM / "@metago-ai" / n, "@metago-ai/" + n))

print()
print("【2. 非 scoped 包】")
print("  %-42s %-8s %-10s %s" % ("包", "存在", "版本", "rules_version"))
print("-" * 88)
ok_u = sum(1 for n in UNSCOPED if check(NPM / n, n))

print()
print("【3. 跨目录可用（不依赖 cwd）】")
probe = ("const E=require('C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine');"
         "process.stdout.write(typeof E.DecisionLock==='function'?'ok':'bad');")
cross = 0
for cwd in [pathlib.Path.home(), pathlib.Path(r"D:\DSH-Official\home"), pathlib.Path("C:\\")]:
    try:
        r = subprocess.run(["node", "-e", probe], capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=180, cwd=str(cwd))
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
