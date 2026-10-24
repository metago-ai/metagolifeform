# -*- coding: utf-8 -*-
"""verify_blueprint_claims3.py — 按「表格行」计数（真实格式）

上一版错在哪：以为清单文件是 `## A1` 这种标题格式，
实际是 markdown 表格（`| A1 | 名称 | 来源 |`）。
另外总索引写的判定方法是「`^## A\\d` 行数」——那个方法与文件真实格式不符，也是错的。
"""
import pathlib
import sys
import re

NPM = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai")
E = NPM / "engine"
BP = pathlib.Path(r"D:\DSH-Official\home\metago\blueprint\元构初始文档")
IDX = BP / "总索引-V36.11.md"

t = IDX.read_text(encoding="utf-8")
CLAIMS = {}
for kw, pat in [("核心公理", r"\| 核心公理 \| \*\*(\d+)\*\*"),
                ("根本属性", r"\| 根本属性 \| \*\*(\d+)\*\*"),
                ("运行协议", r"\| 运行协议 \| \*\*(\d+)\*\*"),
                ("引擎", r"\| 引擎 \| \*\*(\d+)\*\*"),
                ("原子", r"\| 原子 \| \*\*(\d+)\*\*")]:
    m = re.search(pat, t)
    if m:
        CLAIMS[kw] = int(m.group(1))

def table_ids(p, pat):
    """数表格首列里符合 pat 的唯一 ID"""
    if not p.exists():
        return None
    ids = set()
    for line in p.read_text(encoding="utf-8", errors="replace").split("\n"):
        if not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if not cells:
            continue
        m = re.fullmatch(pat, cells[0])
        if m:
            ids.add(cells[0])
    return len(ids)

def any_ids(p, pat):
    if not p.exists():
        return None
    txt = p.read_text(encoding="utf-8", errors="replace")
    return len(set(re.findall(pat, txt)))

ACTUAL = {
    "核心公理": ("CONSTITUTION/AXIOMS.md", table_ids(E / "CONSTITUTION" / "AXIOMS.md", r"A\d{1,3}")),
    "根本属性": ("CORE/ATTRIBUTES.md", table_ids(E / "CORE" / "ATTRIBUTES.md", r"D\d{1,3}")),
    "运行协议": ("CORE/PROTOCOLS.md", table_ids(E / "CORE" / "PROTOCOLS.md", r"PROTOCOL_[A-Z0-9_]+")),
    "引擎":     ("INDEX/ENGINES.md", any_ids(E / "INDEX" / "ENGINES.md", r"\bENGINE_[A-Z0-9_]+\b")),
    "原子":     ("CORE/ATOMS.md", any_ids(E / "CORE" / "ATOMS.md", r"\bATOM_[A-Z0-9_]+\b")),
}

print("=" * 88)
print("蓝本五项声明 vs 实体清单（表格行计数）")
print("=" * 88)
ok = bad = 0
for kw, declared in CLAIMS.items():
    fname, actual = ACTUAL[kw]
    if actual is None:
        print(f"  ?  {kw:<6} 声明 {declared:<5} —— 文件 {fname} 不存在")
        bad += 1
        continue
    m = declared == actual
    ok += m
    bad += (not m)
    print(f"  {'✓' if m else '✗'}  {kw:<6} 声明 {declared:<5} 实测 {actual:<5} ({fname})")

print()
print("-" * 88)
print(f"一致 {ok} ｜ 不一致 {bad}")
if bad == 0:
    print("总判定：PASS（五项声明全部与实体清单一致）")

# ---- 退出码（门禁语义）：bad 为「声明与实体不一致」的项数 ----
sys.exit(0 if bad == 0 else 1)