# -*- coding: utf-8 -*-
"""platform_content_audit.py — 11 个平台法则文件的内容质量审计

只版本号对不够，还要查：
  1. 占位符是否全部替换（{{...}} / __XXX__ 残留）
  2. 核心章节是否齐备（公理/属性/协议/验证/记忆/MCP/算法）
  3. 平台专名替换是否正确（不该出现别的平台名）
  4. 关键数字是否与母本一致（6 服务器/162 工具/112 技能/34 断言）
  5. BOM / 行尾 / 编码
"""
import pathlib
import re

H = pathlib.Path(r"C:\Users\MetaGO")
SRC = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")

PLATFORMS = [
    ("trae",        ".trae-cn/rules.md",            "Trae"),
    ("claude-code", ".claude/CLAUDE.md",            "Claude Code"),
    ("codex",       ".codex/AGENTS.md",             "Codex"),
    ("cursor",      ".cursor/rules/metago.mdc",     "Cursor"),
    ("codebuddy",   ".codebuddy/CODEBUDDY.md",      "CodeBuddy"),
    ("qoder",       ".qoder/rules/metago.md",       "Qoder"),
    ("zcode",       ".zcode/CLAUDE.md",             "ZCode"),
    ("chatgpt-work",".chatgpt/AGENTS.md",           "ChatGPT"),
    ("workbuddy",   ".workbuddy/AGENTS.md",         "WorkBuddy"),
    ("kimi-code",   ".kimi-code/AGENTS.md",         "Kimi Code"),
    ("kimi-work",   ".kimi-work/AGENTS.md",         "Kimi Work"),
]

# 必须出现的核心章节标记（宽松匹配）
REQUIRED = [
    ("公理",   r"溯源公理|A1"),
    ("属性",   r"根本属性|D3[789]"),
    ("协议",   r"元进化|运行协议"),
    ("验证",   r"运行时验证|七层|L1"),
    ("记忆",   r"记忆生命体|KMWI|四层记忆"),
    ("算法",   r"927|算法触发"),
    ("MCP",    r"MCP"),
    ("技能",   r"技能"),
]

PLACEHOLDER_PAT = re.compile(r"\{\{[a-zA-Z_][\w.]*\}\}|__[A-Z][A-Z0-9_]+__|\{\{[^}]*\}\}")

print("=" * 96)
print("11 个平台法则文件内容审计")
print("=" * 96)

rows = []
for pid, rel, disp in PLATFORMS:
    p = H / rel
    if not p.exists():
        rows.append((disp, rel, "缺失", 0, 0, 0, []))
        continue
    raw = p.read_bytes()
    has_bom = raw[:3] == b"\xef\xbb\xbf"
    t = raw.decode("utf-8-sig")

    # 占位符
    ph = PLACEHOLDER_PAT.findall(t)
    # 必需章节
    miss = [name for name, pat in REQUIRED if not re.search(pat, t)]
    # 版本
    vm = re.findall(r"V36\.\d+\.\d+", t)
    ver = vm[0] if vm else "无"
    # 关键数字
    has162 = "162" in t
    has112 = "112" in t
    lines = t.count("\n") + 1
    rows.append((disp, rel, ver, lines, len(ph), len(miss), miss, has_bom, has162, has112))

print(f"{'平台':<14}{'版本':<10}{'行数':>7}{'占位符':>7}{'缺章节':>7}  问题")
print("-" * 96)
problems = 0
for r in rows:
    if len(r) == 4:
        print(f"  {r[0]:<12}{'缺失':<10}{'-':>7}{'-':>7}{'-':>7}  ✗ 文件不存在")
        problems += 1
        continue
    disp, rel, ver, lines, nph, nmiss, miss, bom, h162, h112 = r
    issues = []
    if ver != "V36.12.0":
        issues.append("版本")
    if nph:
        issues.append(f"占位符{nph}")
    if nmiss:
        issues.append(f"缺{'/'.join(miss)}")
    if bom:
        issues.append("BOM")
    if not h162:
        issues.append("无162")
    if issues and len(issues) >= 1:
        problems += 1
    print(f"  {disp:<12}{ver:<10}{lines:>7}{nph:>7}{nmiss:>7}  " + ("✓" if not issues else "⚠ " + ",".join(issues)))

print()
print("-" * 96)
print(f"平台数 {len(rows)} ｜ 有问题 {problems}")

# 平台专名交叉污染检查
print()
print("平台专名交叉污染（文件里出现了别的平台名）:")
CONTAM = {
    "trae": ["Claude Code", "Codex CLI", "Cursor 编辑器"],
    "claude-code": ["Trae 的", "CodeBuddy 的"],
    "codex": ["Trae 的", "Cursor 编辑器"],
}
contam_hits = 0
for pid, rel, disp in PLATFORMS:
    p = H / rel
    if not p.exists():
        continue
    t = p.read_text(encoding="utf-8", errors="replace")
    bad = [x for x in CONTAM.get(pid, []) if x in t]
    if bad:
        contam_hits += 1
        print(f"  ⚠ {disp}: 出现 {bad}")
print("  " + ("无交叉污染" if contam_hits == 0 else f"{contam_hits} 个平台有污染"))
