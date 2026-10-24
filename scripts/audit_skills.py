# -*- coding: utf-8 -*-
"""audit_skills.py — 技能层真实可用性审计

此前只统计过「112 个技能文件」，从未验证：
  1. 每个 SKILL.md 的 frontmatter 是否合法（name / description 必填）
  2. name 是否与目录名一致（不一致会导致调用失败）
  3. description 是否为空或占位符
  4. 是否有重复 name
  5. 正文是否为空壳
"""
import pathlib
import re

SK = pathlib.Path(r"D:\DSH-Official\home\skills")

FM = re.compile(r"^---\s*\n(.*?)\n---", re.S)


def parse_front(t):
    m = FM.match(t)
    if not m:
        return None
    d = {}
    for line in m.group(1).split("\n"):
        if ":" in line and not line.strip().startswith("#"):
            k, v = line.split(":", 1)
            d[k.strip()] = v.strip().strip('"').strip("'")
    return d


rows = []
for p in sorted(SK.rglob("SKILL.md")):
    rel = p.relative_to(SK).as_posix()
    dirname = p.parent.name
    t = p.read_text(encoding="utf-8", errors="replace")
    fm = parse_front(t)
    body = FM.sub("", t, count=1).strip()
    rows.append({
        "dir": dirname,
        "rel": rel,
        "fm": fm,
        "name": (fm or {}).get("name", ""),
        "desc": (fm or {}).get("description", ""),
        "bodyLen": len(body),
        "size": p.stat().st_size,
    })

print("=" * 84)
print("技能层真实可用性审计")
print("=" * 84)
print("技能文件总数：", len(rows))
print()

problems = {"无frontmatter": [], "缺name": [], "缺description": [],
            "name与目录不符": [], "description过短": [], "正文过短": [], "重名": []}

seen = {}
for r in rows:
    if r["fm"] is None:
        problems["无frontmatter"].append(r["rel"])
        continue
    if not r["name"]:
        problems["缺name"].append(r["rel"])
    if not r["desc"]:
        problems["缺description"].append(r["rel"])
    elif len(r["desc"]) < 15:
        problems["description过短"].append((r["rel"], r["desc"]))
    if r["name"] and r["name"] != r["dir"]:
        problems["name与目录不符"].append((r["rel"], r["name"], r["dir"]))
    if r["bodyLen"] < 200:
        problems["正文过短"].append((r["rel"], r["bodyLen"]))
    if r["name"]:
        seen.setdefault(r["name"], []).append(r["rel"])

for name, lst in seen.items():
    if len(lst) > 1:
        problems["重名"].append((name, lst))

total_bad = 0
for k, v in problems.items():
    total_bad += len(v)
    mark = "OK" if not v else "**%d 处**" % len(v)
    print("%-18s %s" % (k, mark))
    for item in v[:6]:
        print("      ", item if isinstance(item, str) else " | ".join(str(x) for x in item))
    if len(v) > 6:
        print("       … 其余 %d 处" % (len(v) - 6))

print()
print("-" * 84)
print("问题总数：", total_bad)
print("判定：", "PASS（全部技能可加载）" if total_bad == 0 else "需修复")

# 输出正常清单摘要
print()
print("技能清单（前 20）：")
for r in rows[:20]:
    print("  %-42s %-30s %5d 字节" % (r["dir"][:42], (r["desc"] or "-")[:30], r["size"]))
