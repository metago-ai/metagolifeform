# -*- coding: utf-8 -*-
"""fix_pkg_rules_version.py — 包内子包补 rules_version（DEF-064）

病情：npm 装机的 5 个子包有 rules_version=V36.11.0，
      但**交付包内**的 packages/*/package.json 没有这个字段。
      → 从交付包重装，rules_version 就丢了（「修复不能存活于重装」）。

修法：以装机值为准，写回包内五个子包的 package.json。
"""
import json
import pathlib

PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")
NPM = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai")
WANT = "V36.11.0"

print("=" * 80)
print("包内子包补 rules_version")
print("=" * 80)

fixed = 0
for n in ["algorithms", "dev-kit", "engine", "mcp-server", "verify-kit"]:
    p = PKG / "packages" / n / "package.json"
    if not p.exists():
        print(f"  - {n} 无 package.json")
        continue
    d = json.loads(p.read_bytes().decode("utf-8-sig"))
    old = d.get("rules_version")
    if old == WANT:
        print(f"  · {n} 已有 {WANT}")
        continue
    # 插到 version 之后，保持字段顺序可读
    new = {}
    for k, v in d.items():
        new[k] = v
        if k == "version":
            new["rules_version"] = WANT
    if "rules_version" not in new:
        new["rules_version"] = WANT
    p.write_bytes(json.dumps(new, ensure_ascii=False, indent=2).encode("utf-8"))
    print(f"  ✓ {n}  rules_version: {old} → {WANT}")
    fixed += 1

print()
print(f"修复 {fixed} 个")
print()
print("复核（包内 vs 装机）：")
for n in ["algorithms", "dev-kit", "engine", "mcp-server", "verify-kit"]:
    a = PKG / "packages" / n / "package.json"
    b = NPM / n / "package.json"
    va = json.loads(a.read_bytes().decode("utf-8-sig")).get("rules_version", "无") if a.exists() else "-"
    vb = json.loads(b.read_bytes().decode("utf-8-sig")).get("rules_version", "无") if b.exists() else "-"
    print(f"  {n:<12} 包内 {va:<10} 装机 {vb:<10} {'✓' if va == vb else '✗'}")
