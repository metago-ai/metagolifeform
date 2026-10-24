# -*- coding: utf-8 -*-
"""fix_preset_desc.py — 更新 Agent 预设的过期数字（DEF-071）

只改两类内容，不动任何 YAML 结构：
  ① 顶部注释「WHY 262144 AND NOT THE SHIPPED 65536」里的体积/章节/截断数据
  ② config.description 里的版本号、法则体积、技能数

实测基准（AGENTS.md 现况）：
  101,535 B ｜ 1,579 行 ｜ 27 个二级标题（其中 20 个 `## 第X章`）
  若按旧 65,536 字节截断 → 截断 36,001 B，丢 8 个二级标题（含第十八/十九/二十章）
  现 maxBytes 262,144 → 余量 160,609 B

源码与装机两处同步，SHA256 校验一致后才算完成。
"""
import hashlib
import pathlib
import shutil
import time

SRC = pathlib.Path(r"D:\Documents\deepseek-harness\default-workspace\metago-dsh-lifeform"
                   r"\packages\metago-lifeform-dsh\patch\preset.patch.yml")
INST = pathlib.Path(r"D:\DSH-Official\home\profiles\desktop\node_modules"
                    r"\metago-lifeform-dsh\patch\preset.patch.yml")
BAK = pathlib.Path(r"D:\metago-build") / ("backup-preset-" + time.strftime("%Y%m%d-%H%M%S"))

# ── 替换对（原文 → 新文），逐段整块匹配，避免误伤 ────────────────────────
OLD_COMMENT = """# WHY 262144 AND NOT THE SHIPPED 65536:
#   `$DSH_HOME/AGENTS.md` is the MetaGO law, 89,282 B / 22 chapters. At 65536 the
#   composer truncates 24,159 B and 32 headings — including all of chapter 18
#   (MCP trigger protocol) and chapter 20 (process-safety law). This row is the
#   ONLY place that budget takes effect: `dsh-web-app` disables the host-plane
#   `agent-instructions` row, so an override for that row id in
#   `$DSH_HOME/cordis.patch.yml` is inert."""

NEW_COMMENT = """# WHY 262144 AND NOT THE SHIPPED 65536:
#   `$DSH_HOME/AGENTS.md` is the MetaGO law, 101,535 B / 20 chapters (27 level-2
#   headings). At 65536 the composer truncates 36,001 B and 8 headings — that is
#   chapter 18 (MCP trigger protocol), chapter 19 (browser automation), chapter 20
#   (process-safety law), plus the architecture-governance block, the
#   completeness-governance block, the Fabric guide, the algorithm-scope appendix
#   and the handoff navigation. This row is the ONLY place that budget takes
#   effect: `dsh-web-app` disables the host-plane `agent-instructions` row, so an
#   override for that row id in `$DSH_HOME/cordis.patch.yml` is inert."""

OLD_DESC = """        description: >-
          MetaGO Agent Harness（智能体运行时控制层套件 · 驭智层）V36.9.4 全量模式：
          完整 89,282 B 法则（第零节 UDGK + 20 章 + 架构治理 + 完整性治理，10 公理 / 9 属性）、
          100 个 metago-* 技能、112 个元构 MCP 工具（55 + 57 · 927 算法）、
          四层 KMWI 记忆，以及元构控制台原生界面。"""

NEW_DESC = """        description: >-
          MetaGO Agent Harness（智能体运行时控制层套件 · 驭智层）V36.11.0 全量模式：
          完整 101,535 B 法则（第零节 UDGK + 20 章 + 架构治理 + 完整性治理，10 公理 / 9 属性）、
          112 个 metago-* 技能、112 个元构 MCP 工具（55 + 57 · 927 算法）、
          四层 KMWI 记忆，以及元构控制台原生界面。"""

print("=" * 88)
print("更新 Agent 预设（DEF-071）")
print("=" * 88)

if not SRC.exists():
    raise SystemExit(f"源码不存在：{SRC}")

BAK.mkdir(parents=True, exist_ok=True)
shutil.copy2(SRC, BAK / "preset.patch.yml")
print(f"  备份 → {BAK / 'preset.patch.yml'}")

t = SRC.read_text(encoding="utf-8")
orig = t

# ① 注释段
if OLD_COMMENT in t:
    t = t.replace(OLD_COMMENT, NEW_COMMENT, 1)
    print("  ✓ 注释段已更新（89,282→101,535 B / 22→20 章+27 标题 / 24,159→36,001 B / 32→8 标题）")
elif NEW_COMMENT in t:
    print("  · 注释段已是新版")
else:
    print("  ✗ 注释段未匹配 —— 中止")
    raise SystemExit(1)

# ② description
if OLD_DESC in t:
    t = t.replace(OLD_DESC, NEW_DESC, 1)
    print("  ✓ description 已更新（V36.9.4→V36.11.0 / 89,282→101,535 B / 100→112 技能）")
elif NEW_DESC in t:
    print("  · description 已是新版")
else:
    print("  ✗ description 未匹配 —— 回滚")
    SRC.write_text(orig, encoding="utf-8")
    raise SystemExit(1)

SRC.write_text(t, encoding="utf-8")
print(f"  源码已写回：{len(orig)} → {len(t)} 字符")

# ③ 结构完整性校验（YAML 关键结构不能被破坏）
print()
print("结构校验：")
for kw in ["- insert:", "- id: preset-metago", "name: '@deepseek-ai/dsh-agent-preset'",
           "id: metago", "name: 元构超级智能生命体模式", "order: 2",
           "prefix: |-", "maxBytes: 262144", "tool-metago-status"]:
    print(f"  {'✓' if kw in t else '✗'} {kw}")

# ④ 同步到装机位置
print()
for _ in range(5):
    try:
        shutil.copy2(SRC, INST)
        break
    except PermissionError:
        time.sleep(0.8)
h1 = hashlib.sha256(SRC.read_bytes()).hexdigest()[:12]
h2 = hashlib.sha256(INST.read_bytes()).hexdigest()[:12]
print(f"同步装机：源码 {h1} ｜ 装机 {h2} ｜ {'✓ 一致' if h1 == h2 else '✗ 不一致'}")

# ⑤ 残留旧值检查
print()
print("残留旧值检查（应全部为 0）：")
for old in ["V36.9.4", "89,282", "100 个 metago", "24,159", "22 chapters", "32 headings"]:
    n = t.count(old)
    print(f"  {'✓' if n == 0 else '✗'} {old:<16} 残留 {n} 处")
