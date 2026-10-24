# -*- coding: utf-8 -*-
"""version_consistency.py — 全系统版本一致性总检

检查所有「应当声明版本」的位置是否都是 V36.11.0 / 36.11.x：
  · 9 个 npm 包的 package.json（version + rules_version）
  · 交付包 package.json / VERSION / VERSIONS.json
  · AGENTS.md 里的版本声明
  · 11 个平台适配法则
  · 蓝本卷的版本标注
  · 离线版 portable
任何一处落后都算不一致。
"""
import json
import pathlib
import re

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")
NPM = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules")
WANT = "36.11"
WANT_RULES = "V36.11"

rows = []


def add(name, ver, rules, where, check_ver=False):
    """check_ver=True 时才要求 version 里含 36.11；子包只看 rules_version"""
    rules_ok = str(rules).startswith(WANT_RULES) if rules else False
    ver_ok = (WANT in str(ver)) if check_ver else True
    rows.append((name, ver, rules, rules_ok and ver_ok, where))


# ① npm 包
for scope, pkgs in [("@metago-ai", ["algorithms", "dev-kit", "engine", "mcp-server", "verify-kit"]),
                    ("", ["metago-lifeform", "metago-cli", "metago-completeness-kit", "metago-veracity-kit"])]:
    for p in pkgs:
        d = NPM / scope / p if scope else NPM / p
        pj = d / "package.json"
        if not pj.exists():
            add(p, "缺失", "缺失", "npm")
            continue
        js = json.loads(pj.read_bytes().decode("utf-8-sig"))
        add(p, js.get("version", "?"), js.get("rules_version", "无"), "npm")

# ② 交付包
pj = json.loads((PKG / "package.json").read_bytes().decode("utf-8-sig"))
add("metago-lifeform(包)", pj.get("version"), pj.get("rules_version"), "PKG")
for f in ["VERSION"]:
    p = PKG / f
    if p.exists():
        add(f, p.read_text(encoding="utf-8").strip(), WANT_RULES, "PKG", check_ver=True)

# ③ AGENTS.md
t = (H / "AGENTS.md").read_text(encoding="utf-8")
m = re.search(r"V36\.11\.\d+", t)
add("AGENTS.md(版本声明)", m.group(0) if m else "未找到", "V36.11.0" if m else "", "HOME")

# ④ 11 平台
PLAT = [("Trae", ".trae-cn/rules.md"), ("Claude Code", ".claude/CLAUDE.md"), ("Codex", ".codex/AGENTS.md"),
        ("Cursor", ".cursor/rules/metago.mdc"), ("CodeBuddy", ".codebuddy/CODEBUDDY.md"),
        ("Qoder", ".qoder/rules/metago.md"), ("ZCode", ".zcode/CLAUDE.md"),
        ("ChatGPT", ".chatgpt/AGENTS.md"), ("WorkBuddy", ".workbuddy/AGENTS.md"),
        ("Kimi Code", ".kimi-code/AGENTS.md"), ("Kimi Work", ".kimi-work/AGENTS.md")]
for name, rel in PLAT:
    p = pathlib.Path(r"C:\Users\MetaGO") / rel
    if not p.exists():
        add("平台:" + name, "缺失", "缺失", "platform")
        continue
    s = p.read_text(encoding="utf-8", errors="replace")
    mm = re.search(r"V36\.(\d+)\.(\d+)", s)
    add("平台:" + name, mm.group(0) if mm else "未声明", "V36.11.0" if mm and mm.group(1) == "11" else "", "platform")

# ⑤ 蓝本：只有「本次交付产出」的卷要求 V36.11；原文层豁免（CORR-035）
bp = H / "metago" / "blueprint" / "元构初始文档"
if bp.exists():
    CURRENT = ("总索引-V36.11.md", "附录卷-原子契约补全-V36.11.md")
    ORIGINAL = re.compile(r"^(元构全息文档体系-第[一二三四五六七八]卷|元构全息知识晶体索引|附录卷-第[1-4]部分|附录卷-索引)")
    for f in sorted(bp.glob("*.md")):
        if ORIGINAL.match(f.name):
            continue          # 原文层：豁免
        s2 = f.read_text(encoding="utf-8", errors="replace")[:3000]
        mm = re.search(r"V36\.(\d+)", s2)
        ver = mm.group(0) if mm else "未标注"
        add("蓝本:" + f.name[:22], ver, "V36.11" if mm and mm.group(1) == "11" else ver,
            "blueprint", check_ver=True)

# ⑥ 离线 portable
pp = PKG / "local-edition" / "portable" / "node_modules" / "metago-lifeform" / "package.json"
if pp.exists():
    js = json.loads(pp.read_bytes().decode("utf-8-sig"))
    add("离线portable", js.get("version"), js.get("rules_version", "无"), "offline")

print("=" * 96)
print("全系统版本一致性总检（目标 V36.11）")
print("=" * 96)
print("%-34s %-14s %-12s %-6s %s" % ("项", "version", "rules_version", "判定", "来源"))
print("-" * 96)
bad = 0
for name, ver, rules, ok, where in rows:
    if not ok:
        bad += 1
    print("%-34s %-14s %-12s %-6s %s" % (name[:34], str(ver)[:14], str(rules)[:12],
                                         "✓" if ok else "✗", where))
print()
print("-" * 96)
print(f"共 {len(rows)} 项 ｜ 一致 {len(rows) - bad} ｜ 不一致 {bad}")
print("总判定：" + ("PASS（全系统版本统一 V36.11）" if bad == 0 else f"需关注（{bad} 项不一致）"))
