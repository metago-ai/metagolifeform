# -*- coding: utf-8 -*-
"""fix_exitcode_var.py — 修正引用不存在变量的退出码（DEF-050）

现象：schema-vs-shape.cjs 判定「总判定：PASS」但退出码 1。
根因：我批量补退出码时按常见命名猜了 `conflicts`，而脚本里实际叫 `issues`
      → process.exit(conflicts.length === 0 ? 0 : 1) 抛 ReferenceError → 退出码 1。

同类风险：所有批量补的退出码都要逐一实跑验证变量名存在。
本脚本：
  1. 修正 schema-vs-shape.cjs
  2. 对所有「末尾 process.exit/sys.exit 引用变量」的脚本做静态变量存在性检查
"""
import pathlib
import re
import subprocess

H = pathlib.Path(r"D:\DSH-Official\home\scripts")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0\scripts")
PYEXE = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"

# ① 修 schema-vs-shape.cjs
print("=" * 84)
print("① 修正 schema-vs-shape.cjs 的退出码变量")
print("=" * 84)
for base in [H, PKG]:
    p = base / "schema-vs-shape.cjs"
    if not p.exists():
        continue
    t = p.read_text(encoding="utf-8")
    if "conflicts.length" not in t:
        print(f"  · {base.parent.name}/{p.name} 无需修")
        continue
    t2 = t.replace("// 退出码（门禁语义）：conflicts.length === 0 ? 0 : 1",
                   "// 退出码（门禁语义）：issues 为空即通过（DEF-050：原误写 conflicts，实际变量名是 issues）")
    t2 = t2.replace("process.exit(conflicts.length === 0 ? 0 : 1);",
                    "process.exit(issues.length === 0 ? 0 : 1);")
    p.write_text(t2, encoding="utf-8")
    print(f"  ✓ {base.parent.name}/{p.name}  conflicts → issues")

r = subprocess.run(["node", "--check", str(H / "schema-vs-shape.cjs")], capture_output=True,
                   text=True, encoding="utf-8", errors="replace")
print("  语法:", "OK" if r.returncode == 0 else (r.stderr or "")[:120])

r2 = subprocess.run(["node", str(H / "schema-vs-shape.cjs")], capture_output=True, text=True,
                    encoding="utf-8", errors="replace", timeout=300)
verdict = [l.strip() for l in (r2.stdout or "").split("\n") if "总判定" in l]
print(f"  实跑退出码 {r2.returncode} ｜ {verdict[0][:60] if verdict else '(无判定)'}")

# ② 静态检查：所有脚本末尾 exit 引用的变量是否在本文件里定义
print()
print("=" * 84)
print("② 静态检查：exit 表达式引用的变量是否存在")
print("=" * 84)

BAD = []
files = sorted(set([p.name for p in H.glob("*.cjs")] + [p.name for p in H.glob("*.py")]))
for name in files:
    p = H / name
    if not p.exists():
        continue
    t = p.read_text(encoding="utf-8", errors="replace")
    # 找 process.exit(...) / sys.exit(...) 里的标识符
    exprs = re.findall(r"(?:process\.exit|sys\.exit)\s*\(([^;]*?)\)\s*;", t, re.S)
    for e in exprs:
        # 只取「不是某对象属性」的标识符（CORR-030：summary.ok 的 ok 不是变量）
        for ident in re.findall(r"(?<![.\w])([a-zA-Z_]\w*)\b(?!\s*\()", e):
            if ident in ("process", "sys", "exit", "length", "true", "false", "null",
                         "undefined", "Number", "len", "if", "not", "else", "and", "or",
                         "globals", "get", "TOTAL_MISSING", "String", "Boolean"):
                continue
            # 该标识符是否在文件里以 const/let/var/赋值 形式出现
            defined = re.search(
                r"\b(?:const|let|var)\s+" + re.escape(ident) + r"\b|"
                r"\b" + re.escape(ident) + r"\s*(?:=|\+=|\+\+)",
                t)
            if not defined:
                BAD.append((name, ident, e.strip()[:70]))
                break

if BAD:
    print(f"发现 {len(BAD)} 处 exit 表达式引用了未定义变量：")
    for n, ident, e in BAD:
        print(f"  ✗ {n:<34} 未定义: {ident}")
        print(f"      exit({e})")
else:
    print("  ✓ 未发现 exit 引用未定义变量")

print()
print("总判定：" + ("PASS" if not BAD else f"需关注（{len(BAD)} 处）"))
