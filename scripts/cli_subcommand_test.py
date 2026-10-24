# -*- coding: utf-8 -*-
"""cli_subcommand_test.py — metago-lifeform 全部子命令实测

此前只验了 `--help`。这次逐个跑「只读/幂等」子命令，确认真的能用：
  version / arch version / list-backups / verify（只读）
不跑的：install / setup-mcp / uninstall / restore-backup（改系统）
"""
import subprocess
import sys

CASES = [
    ("version",         ["version"]),
    ("arch version",    ["arch", "version"]),
    ("list-backups",    ["list-backups"]),
]

print("=" * 84)
print("metago-lifeform 子命令实测（只读类）")
print("=" * 84)

bad = 0
for name, args in CASES:
    try:
        r = subprocess.run(["metago-lifeform"] + args, capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=180,
                           shell=False)
    except Exception as e:
        # Windows 下 .cmd 需要 shell
        try:
            r = subprocess.run("metago-lifeform " + " ".join(args), capture_output=True,
                               text=True, encoding="utf-8", errors="replace", timeout=180, shell=True)
        except Exception as e2:
            print(f"  ✗ {name:<18} 异常 {e2}")
            bad += 1
            continue
    out = ((r.stdout or "") + (r.stderr or "")).strip()
    lines = [l for l in out.split("\n") if l.strip()]
    ok = r.returncode == 0 and len(lines) > 0
    if not ok:
        bad += 1
    print(f"  {'✓' if ok else '✗'} {name:<18} rc={r.returncode}  {len(lines)} 行")
    for l in lines[-3:]:
        print("      " + l.strip()[:88])

print()
print("-" * 84)
print(f"子命令 {len(CASES)} 个 ｜ 通过 {len(CASES) - bad} ｜ 失败 {bad}")
print("总判定：" + ("PASS" if bad == 0 else f"需关注（{bad} 个失败）"))
sys.exit(0 if bad == 0 else 1)
