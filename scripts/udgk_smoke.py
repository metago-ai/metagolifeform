# -*- coding: utf-8 -*-
"""udgk_smoke.py — UDGK 四重门禁端到端冒烟

法则第零节强制要求：任何任务宣告完成前必须运行 verify-delivery.cjs 四重门禁。
本脚本在一个临时项目里跑一遍完整链路：
  init-delivery → 填 RTM → verify-delivery → 看四重门禁是否真的判定
"""
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

NODE = "node"
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")
ENV = {k: v for k, v in os.environ.items()
       if k not in ("METAGO_PYTHON", "METAGO_VERIFY_DIR", "METAGO_MEMORY_HOME")}

print("=" * 88)
print("UDGK 四重门禁端到端冒烟")
print("=" * 88)

tmp = pathlib.Path(tempfile.mkdtemp(prefix="udgk-smoke-"))
proj = tmp / "proj"
proj.mkdir()

def run(script, args=None, cwd=None):
    cmd = [NODE, str(PKG / "scripts" / script)] + (args or [])
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                           errors="replace", timeout=180, env=ENV, cwd=str(cwd or proj))
        return r.returncode, ((r.stdout or "") + (r.stderr or ""))
    except Exception as e:
        return -1, str(e)

# 1) init-delivery
print("\n① init-delivery")
rc, out = run("init-delivery.cjs")
print(f"  rc={rc}")
for line in out.strip().split("\n")[:8]:
    if line.strip():
        print("  " + line.strip()[:84])

created = []
for name in ["docs/rtm.md", "delivery.config.json", "e2e/asserts"]:
    p = proj / name
    created.append((name, p.exists()))
print("  产物：")
for n, e in created:
    print(f"    {'✓' if e else '✗'} {n}")

# 2) verify-delivery（空 RTM，应当 FAIL 或报缺项）
print("\n② verify-delivery（空 RTM —— 期望不是 PASS）")
rc, out = run("verify-delivery.cjs")
tail = [l.strip() for l in out.strip().split("\n") if l.strip()]
for l in tail[-12:]:
    print("  " + l[:84])
verdict_empty = "PASS" in out.upper() and "FAIL" not in out.upper()

# 3) 填一行 RTM 再跑
rtm = proj / "docs" / "rtm.md"
if rtm.exists():
    t = rtm.read_text(encoding="utf-8", errors="replace")
    # 追加一行合法需求
    if "|" in t:
        t += "\n| R001 | 冒烟需求 | scripts/x.cjs | e2e/asserts/x.spec.ts | 命令输出 |\n"
        rtm.write_text(t, encoding="utf-8")
        print("\n③ 填入 1 行 RTM 后重跑")
        rc2, out2 = run("verify-delivery.cjs")
        for l in [x.strip() for x in out2.strip().split("\n") if x.strip()][-10:]:
            print("  " + l[:84])

# 4) visual-regression
print("\n④ visual-regression")
rc3, out3 = run("visual-regression.cjs", ["--help"])
print(f"  rc={rc3}")
for l in [x.strip() for x in out3.strip().split("\n") if x.strip()][:6]:
    print("  " + l[:84])

print()
print("-" * 88)
print("判定：")
print(f"  init-delivery 生成骨架：{'✓' if all(e for _, e in created) else '✗'}")
print(f"  空 RTM 时不误判 PASS：{'✓' if not verdict_empty else '✗（空 RTM 也 PASS，门禁失效）'}")

shutil.rmtree(tmp, ignore_errors=True)
print("（已清理临时目录）")
