# -*- coding: utf-8 -*-
"""rebuild_offline.py — 重打 metago-lifeform 离线包并刷新 portable

背景：offline-packages/metago-lifeform-36.12.0.tgz 是本轮之前打的，
      缺 8 个本轮新增脚本（patch-dedupe / scripts-syntax-gate / vendor-syntax-gate /
      fix_shapes_9 / fix_shapes_2 / fix_audit_global / all-scripts-smoke / delivery.config.json）。
      离线安装会拿到旧脚本集 → 「全套最新版本的安装包」不成立。

步骤：
  1. 在 PKG 目录 npm pack
  2. 用新 tgz 替换 offline-packages 里的旧包
  3. 解包到 local-edition/portable/node_modules/metago-lifeform（覆盖）
  4. 重跑 verify-local-install.cjs
"""
import json
import pathlib
import shutil
import subprocess
import tarfile
import time

PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
LE = PKG / "local-edition"
OFF = LE / "offline-packages"
PORT = LE / "portable" / "node_modules" / "metago-lifeform"
NODE = "node"
NPM_CLI = r"C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"

print("=" * 84)
print("① npm pack")
out = None
for cmd in ([NODE, NPM_CLI, "pack", "--silent"], [r"C:\Program Files\nodejs\npm.cmd", "pack", "--silent"]):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                           errors="replace", timeout=600, cwd=str(PKG))
        tgz = [l.strip() for l in (r.stdout or "").split("\n") if l.strip().endswith(".tgz")]
        if tgz and (PKG / tgz[-1]).exists():
            out = PKG / tgz[-1]
            print(f"  ✓ 生成 {out.name}  {out.stat().st_size/1024/1024:.2f} MB")
            break
        print(f"  · 尝试失败 rc={r.returncode} {(r.stderr or '')[:100]}")
    except Exception as e:
        print(f"  · 异常 {e}")
if out is None:
    raise SystemExit("npm pack 失败")

# 校验新包内容
with tarfile.open(out, "r:gz") as t:
    names = set(t.getnames())
top = {n.split("/")[-1] for n in names if n.startswith("package/scripts/") and n.count("/") == 2}
print(f"  顶层 scripts {len(top)} 个")
for k in ["patch-dedupe.cjs", "scripts-syntax-gate.py", "vendor-syntax-gate.py"]:
    print(f"    {k:<28}{'✓' if k in top else '✗'}")

print()
print("=" * 84)
print("② 替换 offline-packages")
OFF.mkdir(parents=True, exist_ok=True)
for old in OFF.glob("metago-lifeform-*.tgz"):
    if old.name != out.name:
        old.unlink()
        print(f"  ✓ 删除旧包 {old.name}")
dst = OFF / out.name
shutil.copy2(out, dst)
print(f"  ✓ 已放入 {dst.name}  {dst.stat().st_size/1024/1024:.2f} MB")

print()
print("=" * 84)
print("③ 刷新 portable/node_modules/metago-lifeform")
if PORT.exists():
    bak = LE / ("portable-bak-" + time.strftime("%H%M%S"))
    shutil.move(str(PORT), str(bak))
    print(f"  旧版已移走 → {bak.name}")
PORT.mkdir(parents=True, exist_ok=True)
with tarfile.open(dst, "r:gz") as t:
    for m in t.getmembers():
        if not m.name.startswith("package/"):
            continue
        rel = m.name[len("package/"):]
        if not rel:
            continue
        target = PORT / rel
        if m.isdir():
            target.mkdir(parents=True, exist_ok=True)
        elif m.isfile():
            target.parent.mkdir(parents=True, exist_ok=True)
            with t.extractfile(m) as f:
                target.write_bytes(f.read())
n = sum(1 for p in PORT.rglob("*") if p.is_file())
print(f"  ✓ 解包 {n} 个文件")
for k in ["patch-dedupe.cjs", "scripts-syntax-gate.py", "verify-package.cjs"]:
    p = PORT / "scripts" / k
    print(f"    {'✓' if p.exists() else '✗'} scripts/{k}")

# 清掉 PKG 根目录的 tgz（保持目录整洁）
if out.exists() and out.parent == PKG:
    out.unlink()
    print(f"  ✓ 已清理临时 {out.name}")

print()
print("=" * 84)
print("④ 离线安装版自检")
r = subprocess.run([NODE, str(LE / "verify-local-install.cjs")], capture_output=True,
                   text=True, encoding="utf-8", errors="replace", timeout=900)
for l in (r.stdout or "").split("\n"):
    if any(k in l for k in ("通过:", "失败:", "❌")):
        print("  " + l.strip()[:90])
print("  退出码:", r.returncode)
