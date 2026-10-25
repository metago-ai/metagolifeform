# -*- coding: utf-8 -*-
"""align_versions.py — 版本口径对齐（先备份，再改）

两件事：
  1. 给缺 rules_version 的包补上 V36.12.0（纯加法，不改变行为）
  2. metago-lifeform 的 version 从 36.9.6 → 36.12.0（它是体系版本号，不是 semver 组件版本）

安全措施：改动前把每个 package.json 备份到指定目录；记录改动清单以便回滚。
"""
import json
import pathlib
import shutil
import time

NPM_ROOT = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-versions-" + time.strftime("%Y%m%d-%H%M%S"))
TARGET_RULES = "V36.12.0"
TARGET_SYSTEM_VER = "36.12.0"

# 需要处理的包
SCOPED = NPM_ROOT / "@metago-ai"
PLAIN = NPM_ROOT

changed = []
backed = []

def process(pkg_dir, bump_version=False):
    pj = pkg_dir / "package.json"
    if not pj.exists():
        return
    try:
        raw = pj.read_bytes()
        p = json.loads(raw.decode("utf-8-sig"))
    except Exception as e:
        print("  解析失败:", pkg_dir.name, str(e)[:50])
        return

    name = p.get("name", pkg_dir.name)
    old_ver = p.get("version", "-")
    old_rv = p.get("rules_version", None)
    need_rv = old_rv is None or not str(old_rv).startswith("36.11")
    need_ver = bump_version and old_ver != TARGET_SYSTEM_VER

    if not (need_rv or need_ver):
        return

    # 备份
    BACKUP.mkdir(parents=True, exist_ok=True)
    safe = name.replace("/", "__").replace("@", "")
    shutil.copy2(pj, BACKUP / (safe + ".package.json"))
    backed.append(safe)

    # 改动
    if need_rv:
        p["rules_version"] = TARGET_RULES
    if need_ver:
        p["version"] = TARGET_SYSTEM_VER

    pj.write_bytes(json.dumps(p, ensure_ascii=False, indent=2).encode("utf-8") + b"\n")
    changed.append((name, old_ver, p.get("version"), old_rv, p.get("rules_version")))

print("=" * 88)
print("版本口径对齐")
print("=" * 88)
print("备份目录:", BACKUP)
print()

# @metago-ai/* 下的包
print("【@metago-ai/*】")
for d in sorted(SCOPED.iterdir()) if SCOPED.exists() else []:
    if d.is_dir() and (d / "package.json").exists():
        process(d, bump_version=False)

# 非 scoped 的 metago 包
print()
print("【metago-* 包】")
for d in sorted(PLAIN.iterdir()) if PLAIN.exists() else []:
    if not d.is_dir():
        continue
    if "metago" not in d.name.lower():
        continue
    if not (d / "package.json").exists():
        continue
    # metago-lifeform 是体系版本号载体 → 同步 version
    process(d, bump_version=(d.name == "metago-lifeform"))

print()
print("-" * 88)
print("改动 %d 个包：" % len(changed))
print("%-34s %-10s %-10s %-12s %s" % ("包名", "旧版本", "新版本", "旧rules", "新rules"))
for name, ov, nv, orv, nrv in changed:
    print("%-34s %-10s %-10s %-12s %s" % (name[:34], ov, nv, str(orv), str(nrv)))

if not changed:
    print("  无需改动")

print()
print("备份文件 %d 个，位于: %s" % (len(backed), BACKUP))
print("回滚方法：把备份目录里的 *.package.json 还原到对应包目录")
