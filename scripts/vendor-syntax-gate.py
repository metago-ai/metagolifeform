# -*- coding: utf-8 -*-
"""vendor-syntax-gate.py — vendor JS/Python 语法门（权威判据）

为什么用 node --check 而不是「找重复声明」：
  同名变量在不同函数作用域内是合法的，用正则找重复声明会误报 69 个（CORR-034）。
  `node --check` 是语法层的权威判定：真重复声明会直接报 SyntaxError。

覆盖：@metago-ai 下全部 .js（排除嵌套 node_modules）+ 全部 .py 用 ast.parse。
"""
import pathlib
import subprocess
import sys
import concurrent.futures

NPM = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai")
PYEXE = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"

js = [p for p in NPM.rglob("*.js") if "node_modules" not in str(p).replace(str(NPM), "")]
py = [p for p in NPM.rglob("*.py") if "node_modules" not in str(p).replace(str(NPM), "")]

print("=" * 84)
print("vendor 语法门")
print("=" * 84)
print(f"JS {len(js)} 个 ｜ Python {len(py)} 个")


def chk_js(p):
    try:
        r = subprocess.run(["node", "--check", str(p)], capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=90)
        return (p, r.returncode, (r.stderr or "")[:200])
    except Exception as e:
        return (p, -1, str(e)[:120])


def chk_py(p):
    try:
        r = subprocess.run([PYEXE, "-c",
                            f"import ast,pathlib;ast.parse(pathlib.Path(r'{p}').read_text(encoding='utf-8'))"],
                           capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=90)
        return (p, r.returncode, (r.stderr or "")[:200])
    except Exception as e:
        return (p, -1, str(e)[:120])


bad = []
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    for p, rc, err in ex.map(chk_js, js):
        if rc != 0:
            bad.append((p, err))
    for p, rc, err in ex.map(chk_py, py):
        if rc != 0:
            bad.append((p, err))

print()
if bad:
    print(f"■ 语法失败 {len(bad)} 个：")
    for p, err in bad[:12]:
        print("  ✗ " + p.relative_to(NPM).as_posix())
        for l in err.strip().split("\n")[:3]:
            print("      " + l.strip()[:100])
else:
    print("■ 语法失败：0 ✓")

print()
print("-" * 84)
print(f"检查 {len(js) + len(py)} 个文件 ｜ 失败 {len(bad)}")
print("总判定：" + ("PASS（vendor 全部语法正确）" if not bad else f"FAIL（{len(bad)} 个文件无法解析）"))
sys.exit(0 if not bad else 1)
