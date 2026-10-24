# -*- coding: utf-8 -*-
"""audit_refs.py — 审计「元构全息智能引擎」旧引用是否已全部迁移"""
import pathlib
import re

TARGETS = {
    "蓝本卷": pathlib.Path(r"D:\DSH-Official\home\metago\blueprint\元构初始文档"),
    "law": pathlib.Path(r"D:\DSH-Official\home"),
    "skills": pathlib.Path(r"D:\DSH-Official\home\skills"),
}

# 旧引用模式（应当已被迁移或明确标注为历史文献）
OLD_PAT = re.compile(r"元构全息智能引擎")
# 迁移后的正确引用
NEW_PAT = re.compile(r"元构初始文档|附录卷")

print("=" * 86)
print("「元构全息智能引擎」旧引用审计")
print("=" * 86)

# 蓝本卷：作为历史文献，出现该名称属正常，但要确认没有把它当作唯一引用源
bp = TARGETS["蓝本卷"]
bp_hits = []
for p in sorted(bp.glob("*.md")):
    t = p.read_text(encoding="utf-8", errors="replace")
    n_old = len(OLD_PAT.findall(t))
    n_new = len(NEW_PAT.findall(t))
    if n_old:
        bp_hits.append((p.name, n_old, n_new))

print()
print("【蓝本卷内（历史文献，出现旧名属正常）】")
print("%-46s %8s %8s" % ("文件", "旧名次数", "新引用次数"))
for name, o, nn in bp_hits:
    print("%-46s %8d %8d" % (name[:46], o, nn))

# law 与 skills：这些是运行期生效的文档，必须已迁移
print()
print("【运行期文档（law / skills）——必须已迁移】")
issues = []
for label, root in [("law", TARGETS["law"]), ("skills", TARGETS["skills"])]:
    for p in sorted(root.rglob("*.md")):
        if "元构初始文档" in str(p):
            continue
        try:
            t = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        lines = t.split("\n")
        hits = []
        for i, l in enumerate(lines, 1):
            if OLD_PAT.search(l):
                # 若同一行也含「元构初始文档」或「附录卷」，视为已迁移（并存说明）
                if NEW_PAT.search(l):
                    continue
                hits.append((i, l.strip()[:100]))
        if hits:
            issues.append((label, p.relative_to(root).as_posix(), hits))

if not issues:
    print("  无未迁移的旧引用")
else:
    for label, rel, hits in issues:
        print("  ● [%s] %s（%d 处）" % (label, rel, len(hits)))
        for ln, txt in hits[:5]:
            print("      L%-5d %s" % (ln, txt))
        if len(hits) > 5:
            print("      … 其余 %d 处" % (len(hits) - 5))

print()
print("-" * 86)
print("未迁移处数：", sum(len(h[2]) for h in issues))
print("判定规则：")
print("  1) 蓝本卷本身出现旧名 = 历史文献原貌，不改写")
print("  2) 运行期文档（AGENTS.md / skills/*/SKILL.md）出现旧名 = 必须迁移或加注")
print("  3) 同一行同时含旧名与新引用 = 并存说明，视为已迁移")
