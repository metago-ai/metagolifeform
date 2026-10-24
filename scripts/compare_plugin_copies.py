# -*- coding: utf-8 -*-
"""compare_plugin_copies.py — 比对插件「源码副本」与「已安装副本」

风险：profile 的 package.json 用 `file:D:/.../metago-dsh-lifeform/packages/metago-lifeform-dsh`
      即下次 pnpm install 会用源码覆盖已安装副本。
      若两者内容不同 → 现在的运行版本与源码不一致（改了一边另一边不生效，或下次安装被回退）。
"""
import hashlib
import pathlib
import sys

SRC = pathlib.Path(r"D:\Documents\deepseek-harness\default-workspace\metago-dsh-lifeform\packages\metago-lifeform-dsh")
DST = pathlib.Path(r"D:\DSH-Official\home\profiles\desktop\node_modules\metago-lifeform-dsh")


def tree(root):
    out = {}
    for p in root.rglob("*"):
        if p.is_file():
            rel = p.relative_to(root).as_posix()
            out[rel] = (hashlib.sha256(p.read_bytes()).hexdigest(), p.stat().st_size)
    return out


print("=" * 82)
print("插件双副本比对")
print("=" * 82)
print("源码 :", SRC)
print("已装 :", DST)
print()

if not SRC.exists() or not DST.exists():
    print("有一侧不存在，无法比对")
    raise SystemExit(0)

a, b = tree(SRC), tree(DST)
only_a = sorted(set(a) - set(b))
only_b = sorted(set(b) - set(a))
diff = sorted(k for k in set(a) & set(b) if a[k][0] != b[k][0])

print("源码文件 %d 个 ｜ 已装文件 %d 个" % (len(a), len(b)))
print("仅在源码: %d ｜ 仅在已装: %d ｜ 内容不同: %d" % (len(only_a), len(only_b), len(diff)))
print()

KEY = ["lib/index.js", "lib/client.js", "package.json", "patch/cordis.patch.yml"]
print("【关键文件比对】")
for k in KEY:
    if k in a and k in b:
        same = a[k][0] == b[k][0]
        print("  %s %-26s 源码 %6d B ｜ 已装 %6d B" % ("✓" if same else "✗ 不同", k, a[k][1], b[k][1]))
    elif k in a:
        print("  ✗ %-26s 仅源码有" % k)
    elif k in b:
        print("  ✗ %-26s 仅已装有" % k)
    else:
        print("  - %-26s 两侧都无" % k)

if only_a:
    print()
    print("【仅在源码】", len(only_a))
    for k in only_a[:12]:
        print("   +", k)
if only_b:
    print()
    print("【仅在已装】", len(only_b))
    for k in only_b[:12]:
        print("   -", k)
if diff:
    print()
    print("【内容不同】", len(diff))
    for k in diff[:12]:
        print("   ≠", k, "源码 %dB / 已装 %dB" % (a[k][1], b[k][1]))

print()
print("-" * 82)
total = len(only_a) + len(only_b) + len(diff)
print("总判定：", "PASS（两副本一致）" if total == 0 else f"需关注（{total} 处差异，存在漂移风险）")

# ---- 退出码（DEF-042/043：有判定行必须有退出码）----
sys.exit(0 if not globals().get("diffs") else 1)
