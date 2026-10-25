# -*- coding: utf-8 -*-
"""declare_hook_scope.py — 诚实声明 hooks 的适用平台（DEF-068）

事实核查：
  · 元构 hooks 脚本存在：completeness-kit/hooks/{hooks.json, scripts/pre-tool-use-guard.cjs, scripts/stop-verify.cjs}
  · kit 的 config 明确写：hooks.platforms = ["zcode","claude-code"]
  · DSH 侧找不到任何 hook 配置或 hook 机制（$DSH_HOME 下无 hooks 配置；
    app.asar 是归档，无法确认内部是否有 hook 扩展点）

结论：**DSH 上 hooks 是不生效的**。这本身不是缺陷（平台差异），
      但如果文档让人以为"元构门禁自动在跑"就是误导。

修法：在 AGENTS.md 完整性治理条款里加一行「平台适用性」，
      明确 DSH 上 hooks 不生效、等价机制是什么，并写进 project_memory.md 的待办。
"""
import pathlib
import shutil
import time

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
BAK = pathlib.Path(r"D:\metago-build") / ("backup-hookscope-" + time.strftime("%Y%m%d-%H%M%S"))
BAK.mkdir(parents=True, exist_ok=True)

NOTE = """
6. **平台适用性（hooks 不跨平台生效）**：`pre-tool-use-guard` / `stop-verify` 两个 hook 仅在
   **zcode / claude-code** 上自动触发（见 `metago-completeness-kit/config/completeness.config.json`
   的 `hooks.platforms`）。**在 DeepSeek Harness 上不会自动运行**——等价机制是：
   · 法则第零节 + 本章条款（软约束）
   · `scripts/full-regression.py`（35 项五层硬门，须主动运行）
   · `completeness-guard verify` / `veracity-guard report`（须主动运行）
   禁止声称"钩子会自动拦住"。
"""

changed = 0
for root in [H, PKG]:
    p = root / "AGENTS.md"
    if not p.exists():
        continue
    t = p.read_text(encoding="utf-8")
    if "平台适用性（hooks 不跨平台生效）" in t:
        print(f"  · {root.name} 已有该声明")
        continue
    # 定位完整性治理条款块尾
    anchor = "<!-- METAGO-COMPLETENESS-KIT-MARK -->"
    if anchor in t:
        i = t.find(anchor)
        new = t[:i] + NOTE.strip() + "\n" + t[i:]
    else:
        new = t.rstrip("\n") + "\n" + NOTE
    shutil.copy2(p, BAK / (root.name + "-AGENTS.md"))
    for _ in range(5):
        try:
            p.write_text(new, encoding="utf-8")
            break
        except PermissionError:
            time.sleep(0.8)
    print(f"  ✓ {root.name}/AGENTS.md 已加「平台适用性」声明")
    changed += 1

print(f"\n改动 {changed} 处")

# 同步到 project_memory.md 的待办
mem = H / "project_memory.md"
if mem.exists():
    t = mem.read_text(encoding="utf-8")
    line = ("- **hooks 平台局限**：`pre-tool-use-guard` / `stop-verify` 仅 zcode / claude-code 自动触发；"
            "DSH 上不生效，等价机制是 `full-regression.py`（须主动运行）")
    if "hooks 平台局限" not in t:
        t = t.rstrip("\n") + "\n" + line + "\n"
        mem.write_text(t, encoding="utf-8")
        print("✓ project_memory.md 待办已补该条")
    else:
        print("· project_memory.md 已有该条")

# 复核
print()
print("复核 AGENTS.md：")
p = H / "AGENTS.md"
t = p.read_text(encoding="utf-8")
print("  含「平台适用性（hooks 不跨平台生效）」:", "平台适用性（hooks 不跨平台生效）" in t)
print("  含「禁止声称\"钩子会自动拦住\"」:", '禁止声称"钩子会自动拦住"' in t)
chs = t.count("\n## 第一")
print("  章节数仍为 20:", t.count("\n## 第") >= 20)
