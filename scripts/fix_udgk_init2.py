# -*- coding: utf-8 -*-
"""fix_udgk_init2.py — 修正 init-delivery 的目录创建 bug（DEF-041 真因）

真因（不是「没写」，是「写错了」）：
    const dirs = [
      'docs',
      path.dirname(configTemplate.assertions.dir),   // ← path.dirname('e2e/asserts') = 'e2e'
      ...
    ];
  `path.dirname()` 取的是父目录，于是只建了 `e2e/`，没建 `e2e/asserts/`。
  而门禁 2/4（TTD.1）检查的正是 `e2e/asserts` 存在且非空 → 必然 FAIL。

修法：直接用 configTemplate.assertions.dir。
"""
import pathlib
import subprocess

TARGETS = [
    pathlib.Path(r"D:\DSH-Official\home\scripts\udgk\init-delivery.cjs"),
    pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0\scripts\udgk\init-delivery.cjs"),
]

OLD = "  path.dirname(configTemplate.assertions.dir),"
NEW = "  configTemplate.assertions.dir,   /* DEF-041 修复：原先用 path.dirname() 只建了父目录 e2e/ */"

for p in TARGETS:
    if not p.exists():
        print(f"  - 不存在 {p}")
        continue
    s = p.read_text(encoding="utf-8")
    if NEW in s:
        print(f"  · {p.parent.parent.name}/{p.name} 已修")
        continue
    if OLD in s:
        p.write_text(s.replace(OLD, NEW, 1), encoding="utf-8")
        print(f"  ✓ {p.parent.parent.name}/{p.name} 已修")
    else:
        print(f"  ? {p.name} 未匹配")

print()
for p in TARGETS:
    if p.exists():
        r = subprocess.run(["node", "--check", str(p)], capture_output=True, text=True)
        print(("  ✓ " if r.returncode == 0 else "  ✗ ") + str(p.parent.parent.name) + "/" + p.name)
