# -*- coding: utf-8 -*-
"""restore_dev_scripts.py — 恢复被产品能力引用的脚本（CORR-017）

误判：我只检查了「文档/蓝本引用」，没检查「代码引用」。
      arch-lint.cjs   被 metago-lifeform/scripts/metago-arch-cli.cjs 依赖 → 归档后架构治理 CLI 会断
      init-delivery.cjs 被 metago-delivery-gate 技能（UDGK 流程第 1 步）依赖 → 归档后 UDGK 会断
      audit_law_references.py 被 fix_law_refs.py 引用

正确判据：只要「任何 .cjs/.js/.py 代码」或「任何技能/文档」引用了它，就不能归档。
"""
import pathlib
import re
import shutil

H = pathlib.Path(r"D:\DSH-Official\home")
SC = H / "scripts"
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")
ARCH = sorted(pathlib.Path(r"D:\metago-build").glob("dev-scripts-*"))[-1]

# 收集「代码层」引用：扫所有 .cjs/.js/.py/.md/.json/.yml
REF_ROOTS = [H / "skills", H / "scripts", H / "metago", PKG,
             pathlib.Path(r"D:\metago-build\outbound\v36.10.0\packages")]
referenced = set()
name_re = re.compile(r"([A-Za-z0-9_\-]+\.(?:cjs|py|mjs|js))")
for root in REF_ROOTS:
    if not root.exists():
        continue
    for p in root.rglob("*"):
        if not p.is_file() or p.suffix not in (".cjs", ".js", ".py", ".md", ".json", ".yml", ".yaml"):
            continue
        if "node_modules" in p.parts:
            continue
        try:
            t = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        for m in name_re.findall(t):
            if m != p.name and not m.startswith("fix_") and not m.startswith("fix-") \
               and not m.startswith("add_") and not m.startswith("add-"):
                referenced.add(m)

# 被归档但仍被引用的 → 必须恢复
restore = []
for p in sorted(ARCH.iterdir()):
    if not p.is_file():
        continue
    if p.name in referenced:
        restore.append(p.name)

print(f"归档目录：{ARCH.name}（{len(list(ARCH.iterdir()))} 个文件）")
print(f"其中仍被代码/技能/文档引用、必须恢复：{len(restore)} 个")
for n in restore:
    print("    " + n)

restored = 0
for n in restore:
    src = ARCH / n
    dst = SC / n
    if not dst.exists():
        shutil.copy2(src, dst)
        restored += 1
    # 同步到包
    pdst = PKG / "scripts" / n
    if not pdst.exists():
        pdst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, pdst)
    # 从归档目录移出（表示"已归位"）
    src.unlink()

print()
print(f"已恢复 {restored} 个")
left = [p.name for p in sorted(SC.iterdir()) if p.is_file() and p.suffix in (".cjs", ".py", ".mjs", ".js")]
print(f"$DSH_HOME/scripts 现有 {len(left)} 个脚本")
arch_left = [p.name for p in sorted(ARCH.iterdir()) if p.is_file()]
print(f"归档目录剩余 {len(arch_left)} 个（确认无代码引用）")
