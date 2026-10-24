# -*- coding: utf-8 -*-
"""fix_py_capture.py — K11/K16 的 Python 调用也改为容错捕获

问题：audit_skills.py 与 verify_blueprint_claims3.py 现在有退出码，
      非零退出时 execFileSync 抛异常 → 被当成「Python 解释器不可用」→ 误跳过。
修法：改用 runCapture，退出码不影响取 stdout。
"""
import pathlib
import re
import subprocess

V = pathlib.Path(r"D:\metago-build\verify-package.cjs")
s = V.read_text(encoding="utf-8")

# K11 段
OLD11 = '''        out = String(execFileSync(py, [audit], {
          encoding: "utf8", timeout: 120000,
          env: Object.assign({}, process.env, { PYTHONIOENCODING: "utf-8" })
        }));
        break;'''
NEW11 = '''        out = String(runCapture(py, [audit], {
          encoding: "utf8", timeout: 120000,
          env: Object.assign({}, process.env, { PYTHONIOENCODING: "utf-8" })
        }));
        break;'''
if OLD11 in s:
    s = s.replace(OLD11, NEW11, 1)
    print("✓ K11 已改用 runCapture")
else:
    # 宽松匹配
    s2 = re.sub(r"out = String\(execFileSync\(py, \[audit\], \{", "out = String(runCapture(py, [audit], {", s)
    if s2 != s:
        s = s2
        print("✓ K11 已改（宽松匹配）")
    else:
        print("? K11 未匹配")

# K16 段
OLD16 = '''        o = String(execFileSync(py, [f], { encoding: "utf8", timeout: 60000,
          env: Object.assign({}, process.env, { PYTHONIOENCODING: "utf-8" }) }));
        break;'''
NEW16 = '''        o = String(runCapture(py, [f], { encoding: "utf8", timeout: 60000,
          env: Object.assign({}, process.env, { PYTHONIOENCODING: "utf-8" }) }));
        break;'''
if OLD16 in s:
    s = s.replace(OLD16, NEW16, 1)
    print("✓ K16 已改用 runCapture")
else:
    s2 = re.sub(r"o = String\(execFileSync\(py, \[f\], \{", "o = String(runCapture(py, [f], {", s)
    if s2 != s:
        s = s2
        print("✓ K16 已改（宽松匹配）")
    else:
        print("? K16 未匹配")

V.write_text(s, encoding="utf-8")
r = subprocess.run(["node", "--check", str(V)], capture_output=True, text=True,
                   encoding="utf-8", errors="replace")
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:200])

t = V.read_text(encoding="utf-8")
print()
print("剩余 execFileSync：")
for m in re.finditer(r"execFileSync\(", t):
    ln = t[:m.start()].count("\n") + 1
    print(f"  L{ln}: {t.split(chr(10))[ln-1].strip()[:78]}")
