# -*- coding: utf-8 -*-
"""agent_depth_audit.py — 35 个智能体定义的内容深度审计

技能层已查出 13 个「身份卡」（DEF-047）。
agents/ 下 35 个智能体定义同样可能只有身份没有方法 —— 本脚本按同一标准查。
判据（与技能层对齐，含多种表述）：
  输入/前置 · 步骤/框架 · 输出 · 标准/验证 · 错误/红线 · 示例
"""
import pathlib
import re

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")

SIGNS = [
    (r"输入|入参|参数|前置条件|准备|Input|职责边界", "输入/边界"),
    (r"步骤|流程|Step|工作流|方法|流程|先.*再", "步骤/流程"),
    (r"输出|产出|Output|格式|交付|报告|结论", "输出/交付"),
    (r"标准|质量|判据|验收|验证|质检|Check|判定|不允许", "标准/验收"),
    (r"错误|禁忌|禁止|反模式|注意|红线|风险|局限|不要", "错误/红线"),
    (r"示例|样例|例：|Example|案例|模板", "示例/模板"),
]

def find_agents(base):
    out = []
    d = base / "agents"
    if not d.exists():
        return out
    for p in sorted(d.rglob("*.md")):
        out.append(p)
    return out

targets = find_agents(PKG) or find_agents(H)
print("=" * 90)
print("智能体定义内容深度审计")
print("=" * 90)
print(f"文件数 {len(targets)}")

rows = []
for p in targets:
    t = p.read_text(encoding="utf-8", errors="replace")
    body = re.sub(r"^---\n.*?\n---\n", "", t, count=1, flags=re.S)
    signs = [n for pat, n in SIGNS if re.search(pat, body)]
    heads = re.findall(r"^#{2,3}\s*(.+)$", body, re.M)
    rows.append((p.name, len(t), len(body), len(heads), signs))

rows.sort(key=lambda r: r[2])
buckets = {"<300": 0, "300-800": 0, "800-2000": 0, ">2000": 0}
for n, tot, b, h, s in rows:
    k = "<300" if b < 300 else "300-800" if b < 800 else "800-2000" if b < 2000 else ">2000"
    buckets[k] += 1

print("\n正文字节分布：")
for k, v in buckets.items():
    print(f"  {k:<12}{v:>4}  {'█' * min(40, v)}")

weak = [r for r in rows if len(r[4]) < 2]
print()
print(f"方法结构 < 2 类：{len(weak)}")
print(f"{'文件':<48}{'正文B':>7}{'章节':>5}  命中")
print("-" * 90)
for n, tot, b, h, s in weak[:25]:
    print(f"  {n[:46]:<46}{b:>7}{h:>5}  {','.join(s) if s else '✗ 无'}")

print()
print("-" * 90)
print("最瘦 10 个：")
for n, tot, b, h, s in rows[:10]:
    print(f"  {n[:46]:<46}{b:>7}B  章节{h}  命中{len(s)}")
