# -*- coding: utf-8 -*-
"""audit_law_references2.py — 法则引用核查（判据修正版）

修正点：
  1. 命令：只在 ```bash 代码块内**行首**出现的才算 CLI 命令；正文反引号里的 metago-* 多为技能名
  2. 脚本：在 $DSH_HOME/scripts、包目录、D:\\metago-build、各 MCP 安装目录多根搜索
  3. 路径：含 * 或 ? 的按 glob 处理，不算缺失
"""
import glob
import pathlib
import sys
import re
import shutil

H = pathlib.Path(r"D:\DSH-Official\home")
A = H / "AGENTS.md"
t = A.read_text(encoding="utf-8")

ROOTS = [
    H / "scripts",
    pathlib.Path(r"D:\metago-build"),
    pathlib.Path(r"D:\MetaGO-Playwright-MCP\scripts"),
    pathlib.Path(r"D:\DSH-Official\home\profiles\desktop\node_modules\metago-lifeform-dsh\scripts"),
]

print("=" * 88)
print("AGENTS.md 引用核查（判据修正版）")
print("=" * 88)
print()

# ---------- 1. 绝对路径 ----------
abs_paths = {p.strip().rstrip("。，,.") for p in re.findall(r"`([A-Za-z]:\\[^`\n]{2,200})`", t)}
print("【1. 绝对路径】%d 个" % len(abs_paths))
miss_path = []
for p in sorted(abs_paths):
    if "*" in p or "?" in p:
        hits = glob.glob(p)
        ok = len(hits) > 0
        note = f"(glob 命中 {len(hits)})"
    else:
        ok = pathlib.Path(p).exists()
        note = ""
    if not ok:
        miss_path.append(p)
    print("  %s %-70s %s" % ("✓" if ok else "✗", p[:70], note))
print()

# ---------- 2. 脚本引用 ----------
scripts = set(re.findall(r"scripts[/\\]([A-Za-z0-9_.-]+\.(?:cjs|mjs|js|py|sh))", t))
print("【2. 脚本引用】%d 个" % len(scripts))
miss_script = []
for s in sorted(scripts):
    ok = any((r / s).exists() for r in ROOTS if r.exists())
    if not ok:
        miss_script.append(s)
    print("  %s %s" % ("✓" if ok else "✗", s))
print()

# ---------- 3. bash 代码块内的 CLI 命令 ----------
bash_blocks = re.findall(r"```bash\s*\n(.*?)```", t, re.S)
cmds = set()
for b in bash_blocks:
    for line in b.split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"^(metago-[a-z-]+)", line)
        if m:
            cmds.add(m.group(1))
print("【3. bash 代码块内 CLI 命令】%d 个" % len(cmds))
miss_cmd = []
for c in sorted(cmds):
    w = shutil.which(c)
    if not w:
        miss_cmd.append(c)
    print("  %s %-24s %s" % ("✓" if w else "✗", c, (w or "未找到")[:50]))
print()

# ---------- 4. 技能引用 ----------
SK = H / "skills"
disk = {p.parent.name for p in SK.rglob("SKILL.md")}
refs = set(re.findall(r"`(metago-[a-z0-9-]+)`", t))
KNOWN_NON_SKILL = {"metago-ai", "metago-algorithms", "metago-arch-gov", "metago-completeness-kit",
                   "metago-dsh-lifeform", "metago-lifeform", "metago-voice"}
miss_skill = sorted(r for r in refs if r not in disk and r not in KNOWN_NON_SKILL)
print("【4. 技能引用】%d 个 ｜ 磁盘 %d 个" % (len(refs), len(disk)))
if miss_skill:
    for m in miss_skill:
        print("  ✗ %s" % m)
else:
    print("  ✓ 全部有对应文件")
print()

print("-" * 88)
total = len(miss_path) + len(miss_script) + len(miss_cmd) + len(miss_skill)
print("缺失：路径 %d ｜ 脚本 %d ｜ 命令 %d ｜ 技能 %d  合计 %d" % (
    len(miss_path), len(miss_script), len(miss_cmd), len(miss_skill), total))
print("总判定：", "PASS" if total == 0 else f"需关注（{total} 处）")

# ---- 退出码（DEF-042/043：有判定行必须有退出码）----
sys.exit(0 if not globals().get("dangling") else 1)
