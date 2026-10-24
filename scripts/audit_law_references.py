# -*- coding: utf-8 -*-
"""audit_law_references.py — AGENTS.md 里的路径/命令/脚本引用存在性核查

思路：法则若引用了不存在的文件或跑不通的命令，就是「承诺了做不到的事」。
本脚本抽取三类引用并逐个核实：
  1. 反引号内的绝对路径
  2. `node scripts/xxx.cjs` 形式的脚本引用
  3. `metago-lifeform xxx` 形式的 CLI 命令
"""
import pathlib
import sys
import re
import shutil
import subprocess

H = pathlib.Path(r"D:\DSH-Official\home")
A = H / "AGENTS.md"
t = A.read_text(encoding="utf-8")

print("=" * 88)
print("AGENTS.md 引用核查")
print("=" * 88)
print("文件大小: %.1f KB ｜ 行数: %d" % (A.stat().st_size / 1024, t.count("\n") + 1))
print()

# ---------- 1. 绝对路径 ----------
abs_paths = set(re.findall(r"`([A-Za-z]:\\[^`\n]+?)`", t))
abs_paths |= set(re.findall(r"`(D:\\[^`\n]+?)`", t))
abs_paths = {p.strip().rstrip("。，,.") for p in abs_paths if len(p) < 200}

print("【1. 绝对路径引用】共 %d 个" % len(abs_paths))
miss_path = []
for p in sorted(abs_paths):
    pp = pathlib.Path(p)
    ok = pp.exists()
    if not ok:
        miss_path.append(p)
    print("  %s %s" % ("✓" if ok else "✗", p[:88]))
print()

# ---------- 2. scripts/ 脚本引用 ----------
scripts = set(re.findall(r"scripts[/\\]([A-Za-z0-9_.-]+\.(?:cjs|mjs|js|py|sh))", t))
print("【2. scripts/ 脚本引用】共 %d 个" % len(scripts))
miss_script = []
for s in sorted(scripts):
    cands = [H / "scripts" / s]
    ok = any(c.exists() for c in cands)
    if not ok:
        miss_script.append(s)
    print("  %s %s" % ("✓" if ok else "✗", s))
print()

# ---------- 3. CLI 命令 ----------
cmds = set(re.findall(r"`(metago-[a-z-]+)(?:\s+([a-z-]+))?", t))
print("【3. CLI 命令引用】共 %d 个" % len(cmds))
miss_cmd = []
for name, sub in sorted(cmds):
    w = shutil.which(name)
    ok = w is not None
    if not ok:
        miss_cmd.append(name)
    print("  %s %-22s %s" % ("✓" if ok else "✗", name, (w or "未找到")[:52]))
print()

# ---------- 4. 技能名引用（与磁盘比对） ----------
SK = H / "skills"
disk_skills = {p.parent.name for p in SK.rglob("SKILL.md")}
ref_skills = set(re.findall(r"`(metago-[a-z0-9-]+)`", t))
# 排除已知的包名/MCP 名
KNOWN_NON_SKILL = {"metago-ai", "metago-algorithms", "metago-arch-gov", "metago-completeness-kit",
                   "metago-dsh-lifeform", "metago-lifeform", "metago-voice"}
real_missing = sorted(r for r in ref_skills if r not in disk_skills and r not in KNOWN_NON_SKILL)
print("【4. 技能名引用】共 %d 个 ｜ 磁盘 %d 个技能" % (len(ref_skills), len(disk_skills)))
if real_missing:
    for m in real_missing:
        print("  ✗ 引用但磁盘无: %s" % m)
else:
    print("  ✓ 全部引用均有对应技能文件（已知包名类引用已排除）")
print()

# ---------- 汇总 ----------
print("-" * 88)
print("缺失路径 %d ｜ 缺失脚本 %d ｜ 缺失命令 %d ｜ 缺失技能 %d" % (
    len(miss_path), len(miss_script), len(miss_cmd), len(real_missing)))
total = len(miss_path) + len(miss_script) + len(miss_cmd) + len(real_missing)
print("总判定：", "PASS" if total == 0 else f"需关注（{total} 处悬空引用）")

# ---- 退出码（门禁语义）----
sys.exit(0 if not miss_cmd else 1)
