# -*- coding: utf-8 -*-
"""backport_preset_fix.py — 把已装版的 preset.patch.yml 修复回灌到源码（DEF-024）

问题：
  已装版 profiles/.../patch/preset.patch.yml 于 2026-10-17 修掉了会破坏 DSH 的
  `suffix: Your working directory is {{cwd}}.`（DSH 对未注册变量直接抛错 → 每条消息「本轮运行失败」）。
  但**源码版仍带这个 suffix**。profile 的 package.json 用 file: 指向源码 →
  一旦执行 pnpm install，已装版会被源码覆盖，**GUI 会重新坏掉**。

处置：把已装版（含修复与说明注释）回灌到源码，使两边一致，未来安装安全。
"""
import hashlib
import pathlib
import shutil
import time

SRC = pathlib.Path(r"D:\Documents\deepseek-harness\default-workspace\metago-dsh-lifeform\packages\metago-lifeform-dsh\patch\preset.patch.yml")
DST = pathlib.Path(r"D:\DSH-Official\home\profiles\desktop\node_modules\metago-lifeform-dsh\patch\preset.patch.yml")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-preset-src-" + time.strftime("%Y%m%d-%H%M%S"))

print("=" * 78)
print("preset.patch.yml 修复回灌")
print("=" * 78)

s = SRC.read_text(encoding="utf-8")
d = DST.read_text(encoding="utf-8")

BROKEN = "suffix: Your working directory is {{cwd}}."
if BROKEN not in s:
    print("源码里已无破坏性 suffix，可能已修复")
else:
    BACKUP.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SRC, BACKUP / "preset.patch.yml")
    print("已备份源码版:", BACKUP / "preset.patch.yml")
    # 直接用已装版（修复版）覆盖源码
    shutil.copy2(DST, SRC)
    print("已用修复版覆盖源码")

# 复核
s2 = SRC.read_text(encoding="utf-8")
d2 = DST.read_text(encoding="utf-8")
print()
print("复核：")
print("  源码含破坏性 suffix:", BROKEN in s2)
print("  源码含修复说明注释  :", "unknown prompt variable" in s2)
print("  两副本 SHA256 一致  :",
      hashlib.sha256(s2.encode()).hexdigest() == hashlib.sha256(d2.encode()).hexdigest())
print("  源码行数: %d ｜ 已装行数: %d" % (len(s2.split("\n")), len(d2.split("\n"))))

# 全仓搜同类风险：其它 patch 文件里是否还有双花括号未注册变量
print()
print("同类风险扫描（patch 目录下含 {{...}} 模板变量的行）：")
import re
PATCH_DIRS = [
    pathlib.Path(r"D:\Documents\deepseek-harness\default-workspace\metago-dsh-lifeform\packages\metago-lifeform-dsh\patch"),
    pathlib.Path(r"D:\DSH-Official\home\profiles\desktop\node_modules\metago-lifeform-dsh\patch"),
]
seen = 0
for pd in PATCH_DIRS:
    if not pd.exists():
        continue
    for f in pd.glob("*.yml"):
        t = f.read_text(encoding="utf-8", errors="replace")
        for i, l in enumerate(t.split("\n"), 1):
            if re.search(r"\{\{\s*\w+\s*\}\}", l) and not l.strip().startswith("#"):
                print("  ✗ %s L%d: %s" % (f.name, i, l.strip()[:80]))
                seen += 1
if seen == 0:
    print("  ✓ 未发现未注册模板变量")
