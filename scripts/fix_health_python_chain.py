# -*- coding: utf-8 -*-
"""fix_health_python_chain.py — 把 PY_CANDS 改成真正的候选链（DEF-030 的完整修复）

上一版的错误：
  const PY_CANDS = [...]; 
  const exe = isPy ? PY_CANDS[0] : process.execPath;   ← 只取第一个，等于没做回退
而且 verify-package 的 K5 会把 METAGO_PYTHON 设成 "python"，
于是 PY_CANDS[0] 就是 Store 桩 → 仍然超时。

正确做法：
  1. 先把候选里的绝对路径筛出「文件确实存在」的
  2. 相对命令（python/python3/py）保留，交给 spawn 去解析
  3. verify-package 的 K5 不再注入默认 "python"
"""
import pathlib
import subprocess

H = pathlib.Path(r"D:\DSH-Official\home")
P = H / "scripts" / "mcp-all-health.cjs"
s = P.read_text(encoding="utf-8")

OLD = '''    /* Python 多候选回退：裸 python 可能是 Windows Store 桩，会静默挂住 */
    const PY_CANDS = [
      process.env.METAGO_PYTHON,
      "C:/Users/MetaGO/AppData/Local/Python/pythoncore-3.14-64/python.exe",
      "python", "python3", "py",
    ].filter(Boolean);
    const exe = isPy ? PY_CANDS[0] : process.execPath;'''

NEW = '''    /* Python 候选链：绝对路径必须真实存在；相对命令交给 spawn 解析。
       只取第一个是错的——若第一个是 Windows Store 桩会静默挂住。 */
    const PY_CANDS = [
      process.env.METAGO_PYTHON,
      "C:/Users/MetaGO/AppData/Local/Python/pythoncore-3.14-64/python.exe",
      "python", "python3", "py",
    ].filter(Boolean);
    const fsx = require("fs");
    const looksAbs = c => /^[A-Za-z]:[\\\\/]/.test(c) || c.startsWith("/");
    const ordered = [];
    for (const c of PY_CANDS) {
      if (looksAbs(c)) { if (fsx.existsSync(c)) ordered.push(c); }
      else ordered.push(c);
    }
    const exe = isPy ? (ordered[0] || "python") : process.execPath;'''

if OLD in s:
    s = s.replace(OLD, NEW, 1)
    P.write_text(s, encoding="utf-8")
    print("✓ mcp-all-health 候选链已修正")
else:
    print("未匹配 PY_CANDS 段")
    raise SystemExit(1)

# 2) verify-package K5 不再注入默认 "python"
V = pathlib.Path(r"D:\metago-build\verify-package.cjs")
v = V.read_text(encoding="utf-8")
OLD2 = '''      env: Object.assign({}, process.env, { METAGO_PYTHON: process.env.METAGO_PYTHON || "python" })'''
NEW2 = '''      env: Object.assign({}, process.env)   /* 不注入默认 "python"：裸 python 可能是 Store 桩 */'''
if OLD2 in v:
    v = v.replace(OLD2, NEW2, 1)
    V.write_text(v, encoding="utf-8")
    print("✓ K5 不再注入默认 python")
else:
    print("未匹配 K5 env 行")

for f in [P, V]:
    r = subprocess.run(["node", "--check", str(f)], capture_output=True, text=True)
    print(("  ✓ " if r.returncode == 0 else "  ✗ ") + f.name + " 语法")
