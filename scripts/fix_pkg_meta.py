# -*- coding: utf-8 -*-
"""fix_pkg_meta.py — 修正 package.json 的 metago 能力元数据块（DEF-062）

现状（机器可读的能力声明，任何工具读它都会拿到错值）：
  "version": "V36.9.6"   ← 应 V36.11.0
  "axioms": 10           ← 核心公理 38（AGENTS.md 运行公理才是 10，需分开表达）
  "attributes": 43       ← 47
  "protocols": 8         ← 121
  "skills": 100          ← 112
  "mcpTools": 112        ← 对
  "algorithms": 927      ← 对

修法：按实测写入，并把「运行公理 10」与「核心公理 38」分两个键表达，避免歧义。
"""
import json
import pathlib
import re
import shutil
import time

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")
NPM = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai")

# 实测值
n_skills = len([d for d in (H / "skills").iterdir() if d.is_dir() and (d / "SKILL.md").exists()])
n_chs = len(re.findall(r"^## 第.+?章", (H / "AGENTS.md").read_text(encoding="utf-8"), re.M))

def count_md(p, pat):
    if not p.exists():
        return None
    t = p.read_text(encoding="utf-8", errors="replace")
    return len(set(re.findall(pat, t, re.M)))

n_axioms = count_md(NPM / "engine/CONSTITUTION/AXIOMS.md", r"^\|\s*(A\d{1,3})")
n_attrs = count_md(NPM / "engine/CORE/ATTRIBUTES.md", r"^\|\s*(D\d{1,3})")
n_proto = count_md(NPM / "engine/CORE/PROTOCOLS.md", r"^\|\s*(PROTOCOL_[A-Z0-9_]+)")
n_atoms = count_md(NPM / "engine/CORE/ATOMS.md", r"^\|\s*(ATOM_[A-Z0-9_]+)")
n_eng = count_md(NPM / "engine/INDEX/ENGINES.md", r"\b(ENGINE_[A-Z0-9_]+)")

print(f"实测：技能 {n_skills} ｜ 法则章 {n_chs} ｜ 公理 {n_axioms} ｜ 属性 {n_attrs} ｜ "
      f"协议 {n_proto} ｜ 原子 {n_atoms} ｜ 引擎 {n_eng}")

META = {
    "version": "V36.11.0",
    "lawChapters": n_chs,
    "runtimeAxioms": 10,          # AGENTS.md 第二章：A1-A5 + A34-A38
    "axioms": n_axioms,           # 核心公理全量（AXIOMS.md）
    "attributes": n_attrs,
    "protocols": n_proto,
    "skills": n_skills,
    "mcpTools": 112,
    "mcpServers": 6,
    "totalMcpTools": 162,
    "algorithms": 927,
    "atoms": n_atoms,
    "engines": n_eng,
}

for root in [PKG, pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\metago-lifeform")]:
    pj = root / "package.json"
    if not pj.exists():
        print(f"  - {root.name} 无 package.json")
        continue
    d = json.loads(pj.read_bytes().decode("utf-8-sig"))
    old = dict(d.get("metago", {}))
    d["metago"] = {**old, **META}
    pj.write_bytes(json.dumps(d, ensure_ascii=False, indent=2).encode("utf-8"))
    print(f"  ✓ {root.name}/package.json")
    print(f"      version {old.get('version')} → {META['version']}")
    print(f"      attributes {old.get('attributes')} → {META['attributes']}")
    print(f"      protocols {old.get('protocols')} → {META['protocols']}")
    print(f"      skills {old.get('skills')} → {META['skills']}")

# 复核
print()
p = PKG / "package.json"
d = json.loads(p.read_bytes().decode("utf-8-sig"))
print("复核 metago 块：")
for k, v in d["metago"].items():
    if not isinstance(v, (list, dict)):
        print(f"  {k:<18}{v}")
