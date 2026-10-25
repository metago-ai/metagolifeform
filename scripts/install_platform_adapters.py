# -*- coding: utf-8 -*-
"""install_platform_adapters.py — 把 11 个平台适配模板装到用户目录（先备份）

发现：11 个平台的法则文件全部停留在 V36.9.1–V36.9.6，与母本 V36.12.0 不一致。
      「全局用户级生效」要求这些也升级。
安全：每个目标先备份到 D:\\metago-build\\backup-platforms-<ts>\\，再覆盖。
"""
import pathlib
import re
import shutil
import time

SRC = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
AD = SRC / "adapters"
H = pathlib.Path(r"C:\Users\MetaGO")
BAK = pathlib.Path(r"D:\metago-build") / ("backup-platforms-" + time.strftime("%Y%m%d-%H%M%S"))

MAP = [
    ("trae",         "rules.template.md",        ".trae-cn/rules.md"),
    ("claude-code",  "CLAUDE.md.template",       ".claude/CLAUDE.md"),
    ("codex",        "AGENTS.md.template",       ".codex/AGENTS.md"),
    ("cursor",       "metago.mdc.template",      ".cursor/rules/metago.mdc"),
    ("codebuddy",    "CODEBUDDY.md.template",    ".codebuddy/CODEBUDDY.md"),
    ("qoder",        "metago-rules.md.template", ".qoder/rules/metago.md"),
    ("zcode",        "CLAUDE.md.template",       ".zcode/CLAUDE.md"),
    ("chatgpt-work", "AGENTS.md.template",       ".chatgpt/AGENTS.md"),
    ("workbuddy",    "rules.template.md",        ".workbuddy/AGENTS.md"),
    ("kimi",         "AGENTS.md.template",       ".kimi-code/AGENTS.md"),
    ("kimi",         "AGENTS.kimi-work.template", ".kimi-work/AGENTS.md"),
]

BAK.mkdir(parents=True, exist_ok=True)
print("=" * 88)
print("安装 11 个平台适配（先备份）")
print("=" * 88)
print(f"备份目录：{BAK.name}\n")

def ver_of(p):
    if not p.exists():
        return "（不存在）"
    t = p.read_text(encoding="utf-8", errors="replace")
    m = re.findall(r"V36\.\d+\.\d+", t)
    return m[0] if m else "（无版本号）"

ok = bad = 0
for plat, tpl, rel in MAP:
    src = AD / plat / tpl
    dst = H / rel
    before = ver_of(dst)
    if not src.exists():
        print(f"  ✗ {rel:<34} 模板缺失 {plat}/{tpl}")
        bad += 1
        continue
    # 备份已有
    if dst.exists():
        bdst = BAK / rel
        bdst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(dst, bdst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    try:
        shutil.copy2(src, dst)
    except PermissionError:
        time.sleep(0.8)
        shutil.copy2(src, dst)
    after = ver_of(dst)
    flag = "✓" if after.startswith("V36.11") else "✗"
    if after.startswith("V36.11"):
        ok += 1
    else:
        bad += 1
    print(f"  {flag} {rel:<34} {before:<10} → {after}")

print()
print("-" * 88)
print(f"成功 {ok} ｜ 失败 {bad}")

print()
print("复核：全部平台法则文件版本")
for plat, tpl, rel in MAP:
    dst = H / rel
    print(f"  {rel:<34} {ver_of(dst)}")

print()
print(f"备份保留在：{BAK}")
