# -*- coding: utf-8 -*-
"""cli_plugin_arch_test.py — plugin-pack 与 arch 两条能力链实测

此前只测了 version / arch version / list-backups（纯只读）。
这次测「真的产出东西」的两条链，全部在临时目录进行，不碰系统：
  A. plugin-pack --format all --out <tmp>   → 应生成 4 套插件包
  B. arch init → arch check <tmp项目>       → 应生成 arch.config.json 并给出检查结论
"""
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

print("=" * 88)
print("CLI 能力链实测：plugin-pack / arch")
print("=" * 88)

tmp = pathlib.Path(tempfile.mkdtemp(prefix="metago-cli-test-"))
ok_all = True


def run(args, cwd=None, timeout=300):
    try:
        return subprocess.run("metago-lifeform " + args, capture_output=True, text=True,
                              encoding="utf-8", errors="replace", timeout=timeout,
                              cwd=str(cwd or tmp), shell=True)
    except Exception as e:
        class R:
            returncode = -1
            stdout = ""
            stderr = str(e)
        return R()


# ---------- A. plugin-pack ----------
print("\n【A】plugin-pack --format all")
outdir = tmp / "plugins-out"
r = run(f'plugin-pack --format all --out "{outdir}"')
print(f"  rc={r.returncode}")
tail = [l for l in ((r.stdout or "") + (r.stderr or "")).split("\n") if l.strip()][-6:]
for l in tail:
    print("    " + l.strip()[:92])

# 找出实际生成位置（可能在 outdir 或 ./dist/plugins）
cands = [outdir, tmp / "dist" / "plugins", tmp / "plugins"]
found = next((c for c in cands if c.exists()), None)
if found:
    packs = sorted([d.name for d in found.iterdir() if d.is_dir()])
    files = sum(1 for _ in found.rglob("*") if _.is_file())
    print(f"  生成目录: {found}")
    print(f"  插件包: {packs}")
    print(f"  文件数: {files}")
    # CORR-036：各平台清单在各自约定的路径（含隐藏目录），不是都在根目录
    MANIFEST_CANDIDATES = [
        "plugin.json", "manifest.json", "package.json",
        ".claude-plugin/plugin.json", ".codex-plugin/plugin.json",
        ".zcode-plugin/plugin.json", ".plugin/plugin.json",
    ]
    for pk in packs:
        d = found / pk
        man = next((d / m for m in MANIFEST_CANDIDATES if (d / m).exists()), None)
        rel = man.relative_to(d).as_posix() if man else ""
        print(f"    {pk:<22}{'清单 ' + rel if man else '⚠ 无清单'}")
    if len(packs) >= 4 and files > 0:
        print("  ✓ PASS（4 套插件包已生成）")
    else:
        print("  ✗ 生成不完整")
        ok_all = False
else:
    print("  ✗ 未找到生成目录")
    ok_all = False

# ---------- B. arch ----------
print("\n【B】arch init → arch check")
proj = tmp / "proj"
proj.mkdir()
(proj / "src" / "core").mkdir(parents=True)
(proj / "src" / "api").mkdir(parents=True)
(proj / "src" / "core" / "domain.js").write_text(
    "module.exports = { value: 1 };\n", encoding="utf-8")
(proj / "src" / "api" / "handler.js").write_text(
    "const d = require('../core/domain');\nmodule.exports = () => d.value;\n", encoding="utf-8")

r1 = run(f'arch init "{proj}"')
print(f"  arch init rc={r1.returncode}")
for l in [x for x in ((r1.stdout or "") + (r1.stderr or "")).split("\n") if x.strip()][-4:]:
    print("    " + l.strip()[:92])
cfg = proj / "arch.config.json"
print(f"  arch.config.json: {'✓ 已生成' if cfg.exists() else '✗ 未生成'}")
if cfg.exists():
    try:
        d = json.loads(cfg.read_text(encoding="utf-8"))
        print(f"    配置键: {list(d.keys())[:8]}")
    except Exception as e:
        print(f"    解析失败 {e}")

r2 = run(f'arch check "{proj}"')
print(f"  arch check rc={r2.returncode}")
for l in [x for x in ((r2.stdout or "") + (r2.stderr or "")).split("\n") if x.strip()][-6:]:
    print("    " + l.strip()[:92])
if cfg.exists() and r2.returncode in (0, 1):
    print("  ✓ PASS（arch 能初始化并给出检查结论）")
else:
    ok_all = False

# ---------- 收尾 ----------
shutil.rmtree(tmp, ignore_errors=True)
print()
print("-" * 88)
print("（已清理临时目录）")
print("总判定：" + ("PASS（plugin-pack 与 arch 两条链均可运行）" if ok_all else "需关注"))
sys.exit(0 if ok_all else 1)
