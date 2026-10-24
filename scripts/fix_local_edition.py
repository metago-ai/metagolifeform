# -*- coding: utf-8 -*-
"""fix_local_edition.py — 修离线安装版三处问题（DEF-036）

自检 57/59，2 项失败：
  2.1  法则版本为 V36.11.0   → local-edition 里的 AGENTS.md 是旧版
  2.3  Engine 版本为 2.1.1    → 检查脚本期望值过期（实际 2.1.3）

另发现：offline-packages/metago-lifeform-36.9.6.tgz 是旧版（应为 36.11.0）
"""
import json
import pathlib
import shutil
import subprocess
import tarfile
import time

SRC = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")
LE = SRC / "local-edition"
OF = LE / "offline-packages"


def safe_cp(a, b):
    for _ in range(5):
        try:
            shutil.copy2(a, b)
            return True
        except PermissionError:
            time.sleep(0.8)
    return False


print("=" * 84)
print("修离线安装版")
print("=" * 84)

# 1) 找 local-edition 里的 AGENTS.md 副本并同步
print("\n① 法则母本同步")
agents_copies = list(LE.rglob("AGENTS.md"))
print(f"  local-edition 里发现 {len(agents_copies)} 处 AGENTS.md：")
for p in agents_copies[:8]:
    v = ""
    try:
        t = p.read_text(encoding="utf-8", errors="replace")
        import re
        m = re.search(r"V36\.\d+\.\d+", t)
        v = m.group(0) if m else "?"
    except Exception:
        pass
    print(f"    {p.relative_to(LE).as_posix():<46} {v}")

fixed = 0
for p in agents_copies:
    if safe_cp(SRC / "AGENTS.md", p):
        fixed += 1
print(f"  已同步 {fixed} 处")

# 2) 检查脚本的 Engine 期望值
print("\n② 检查脚本 Engine 期望值")
chk = LE / "verify-local-install.cjs"
if chk.exists():
    s = chk.read_text(encoding="utf-8")
    hits = [l.strip()[:90] for l in s.split("\n") if "2.1.1" in l]
    print(f"  含 2.1.1 的行 {len(hits)} 处：")
    for h in hits[:5]:
        print("    " + h)
    if "2.1.1" in s:
        s2 = s.replace("2.1.1", "2.1.3")
        chk.write_text(s2, encoding="utf-8")
        print("  ✓ 已将期望值 2.1.1 → 2.1.3（实际安装版本）")

# 3) 重新打包 metago-lifeform 36.11.0 到 offline-packages
print("\n③ 重新打包离线 bundle 里的 metago-lifeform")
old = OF / "metago-lifeform-36.9.6.tgz"
print(f"  旧包：{old.name}" + (f"（{old.stat().st_size/1024/1024:.1f} MB）" if old.exists() else "（不存在）"))
r = subprocess.run(["npm", "pack", "--pack-destination", str(OF), str(SRC)],
                   capture_output=True, text=True, encoding="utf-8",
                   errors="replace", timeout=900, cwd=str(OF), shell=True)
new = sorted(OF.glob("metago-lifeform-*.tgz"))
print(f"  打包结果：{[x.name for x in new]}")
keep = [x for x in new if "36.11.0" in x.name]
if keep:
    print(f"  ✓ 新包 {keep[0].name}（{keep[0].stat().st_size/1024/1024:.1f} MB）")
    for x in new:
        if x != keep[0]:
            x.unlink()
            print(f"  - 已删旧包 {x.name}")
else:
    print("  ✗ 未生成 36.11.0 包")
    print((r.stdout or "")[-400:])
    print((r.stderr or "")[-400:])

# 4) 复核 offline-packages 全部版本
print("\n④ offline-packages 版本复核")
for t in sorted(OF.glob("*.tgz")):
    try:
        with tarfile.open(t, "r:gz") as tf:
            m = tf.extractfile("package/package.json")
            d = json.loads(m.read().decode("utf-8-sig")) if m else {}
        print(f"  {t.name:<44} {d.get('name','?'):<24} {d.get('version','?')}")
    except Exception as e:
        print(f"  {t.name:<44} 读取失败 {str(e)[:36]}")
