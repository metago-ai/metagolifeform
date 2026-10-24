# -*- coding: utf-8 -*-
"""restore_responsive_scan.py — 从干净副本恢复 atom-responsive-scan.cjs 并正确加退出码

损坏原因：最早一版 add_exit_codes.py 在 .cjs 文件里追加了 `# ----` 注释（Python 语法），
          JS 不认 → SyntaxError。后来我改脚本用 // 了，但这两个已损坏的副本没回滚。
修法：以 D:\\metago-build\\atom-responsive-scan.cjs（干净、58 行）为基准，
      正确追加 // 注释 + process.exit，再同步到 HOME 与 PKG。
"""
import hashlib
import pathlib
import re
import subprocess
import time

MB = pathlib.Path(r"D:\metago-build\atom-responsive-scan.cjs")
H = pathlib.Path(r"D:\DSH-Official\home\scripts\atom-responsive-scan.cjs")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0\scripts\atom-responsive-scan.cjs")

src = MB.read_text(encoding="utf-8")
print(f"基准：{len(src)} B / {len(src.split(chr(10)))} 行")

# 确认基准里没有 # 注释残留
bad = [l for l in src.split("\n") if l.strip().startswith("#")]
print(f"基准里的 # 行：{len(bad)}")

# 追加退出码（JS 用 //）
t = src.rstrip("\n")
if "process.exit" not in t:
    t += "\n\n// 退出码（门禁语义）：degenerate 非空即失败\nprocess.exit(degenerate.length === 0 ? 0 : 1);\n"
else:
    t += "\n"
print(f"追加后：{len(t)} B / {len(t.split(chr(10)))} 行")

# 语法校验（先写临时文件）
tmp = MB.parent / "__chk_responsive.cjs"
tmp.write_text(t, encoding="utf-8")
r = subprocess.run(["node", "--check", str(tmp)], capture_output=True, text=True,
                   encoding="utf-8", errors="replace")
tmp.unlink(missing_ok=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:160])
if r.returncode != 0:
    raise SystemExit(1)

# 落盘三处
for tgt in [MB, H, PKG]:
    for _ in range(5):
        try:
            tgt.write_text(t, encoding="utf-8")
            break
        except PermissionError:
            time.sleep(0.8)

print()
print("三处 SHA256：")
hs = {}
for label, p in [("MB", MB), ("HOME", H), ("PKG", PKG)]:
    h = hashlib.sha256(p.read_bytes()).hexdigest()[:12]
    hs[label] = h
    print(f"  {label:<6}{h}")
print("  " + ("✓ 一致" if len(set(hs.values())) == 1 else "✗ 不一致"))

# 实跑
print()
r2 = subprocess.run(["node", str(H)], capture_output=True, text=True,
                    encoding="utf-8", errors="replace", timeout=300)
out = (r2.stdout or "") + (r2.stderr or "")
print(f"实跑退出码 {r2.returncode}")
for line in out.strip().split("\n")[-8:]:
    if line.strip():
        print("  " + line.strip()[:88])
