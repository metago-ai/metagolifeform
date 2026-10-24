# -*- coding: utf-8 -*-
"""fix_adapter_replacements.py — 补「DeepSeek Harness → 平台名」的替换规则（DEF-037）

根因：
  PHRASE_REPLACEMENTS / HEAD_REPLACEMENTS 里所有规则都基于「Trae」，
  而当前母本 AGENTS.md 已改为以「DeepSeek Harness」为运行时撰写。
  于是生成 11 个平台模板时，替换规则一条也匹配不上 → 11 个文件内容完全相同。
  实测：11 个文件 SHA256 全为 7d9acfc4aff1。

修法：
  在替换表里补上基于「DeepSeek Harness」的规则，同时保留原有「Trae」规则（向后兼容）。
"""
import json
import pathlib
import re
import subprocess

P = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0\scripts\build-adapters.cjs")
s = P.read_text(encoding="utf-8")

# 1) 先统计母本里 DeepSeek Harness 的出现形态，确认要替换什么
MASTER = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0\AGENTS.md")
mt = MASTER.read_text(encoding="utf-8")
forms = {}
for m in re.finditer(r"DeepSeek Harness[^\n，。；）】]{0,40}", mt):
    k = m.group(0).strip()
    forms[k] = forms.get(k, 0) + 1
print("母本里「DeepSeek Harness」的常见形态（前 12）：")
for k, v in sorted(forms.items(), key=lambda x: -x[1])[:12]:
    print(f"  {v:>3} × {k[:60]}")

# 2) 构造新规则表（追加到 PHRASE_REPLACEMENTS 每个平台）
PLAT_NAMES = {
    "trae": ("Trae", ".trae-cn/"),
    "claude-code": ("Claude Code", ".claude/"),
    "codex": ("Codex", ".codex/"),
    "cursor": ("Cursor", ".cursor/"),
    "codebuddy": ("CodeBuddy", ".codebuddy/"),
    "qoder": ("Qoder", ".qoder/"),
    "zcode": ("ZCode", ".zcode/"),
    "chatgpt-work": ("ChatGPT", ".chatgpt/"),
    "workbuddy": ("WorkBuddy", ".workbuddy/"),
    "kimi": ("Kimi", ".kimi/"),
}

if "DeepSeek Harness 的四个子系统" in s:
    print("\n替换表里已有 DeepSeek Harness 规则，跳过")
else:
    # 在每个平台的 PHRASE_REPLACEMENTS 条目末尾插入新规则
    # 采用「在 generatePlatformLaw 里统一追加」的做法，避免逐个改表
    ANCHOR = "  const replacements = PHRASE_REPLACEMENTS[platformId] || {};"
    INJECT = '''  const replacements = Object.assign({}, PHRASE_REPLACEMENTS[platformId] || {});
  /* DEF-037 修复：母本已改为以「DeepSeek Harness」为运行时撰写，
     原替换表只认「Trae」，导致 11 个平台模板内容完全相同。此处统一补规则。 */
  if (cfg && cfg.name && cfg.name !== 'DeepSeek Harness') {
    const PN = cfg.name;
    replacements['DeepSeek Harness 的四个子系统（规则与记忆、技能与命令、索引与文档、MCP）'] =
      PN + ' 的能力体系（规则系统、技能系统、工具系统、记忆系统）';
    replacements['本母本以 DeepSeek Harness 为运行时撰写'] = '本母本以 ' + PN + ' 为运行时撰写';
    replacements['DeepSeek Harness 第一人称视角撰写'] = PN + ' 第一人称视角撰写';
    replacements['DeepSeek Harness 系统中'] = PN + ' 系统中';
    replacements['DeepSeek Harness 系统记忆'] = PN + ' 系统记忆';
    replacements['DeepSeek Harness 自动摘要'] = PN + ' 自动摘要';
    replacements['DeepSeek Harness 持久化记忆体系'] = PN + ' 持久化记忆体系';
    replacements['DeepSeek Harness 的 skills/ 目录'] = PN + ' 的 skills/ 目录';
    replacements['DeepSeek Harness 平台'] = PN + ' 平台';
    replacements['DeepSeek Harness'] = PN;
  }'''
    if ANCHOR in s:
        s = s.replace(ANCHOR, INJECT, 1)
        print("\n✓ 已在 generatePlatformLaw 里注入统一替换规则")
    else:
        print("\n✗ 未匹配 replacements 锚点")
        raise SystemExit(1)

    # 3) 平台配置里补 chatbot/workbuddy 的名称（若缺）
    for pid in PLAT_NAMES:
        if f"'{pid}':" not in s:
            print(f"  ⚠ PLATFORM_CONFIGS 缺 {pid}")

    P.write_text(s, encoding="utf-8")
    print("✓ 已写回 build-adapters.cjs")

r = subprocess.run(["node", "--check", str(P)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:200])
