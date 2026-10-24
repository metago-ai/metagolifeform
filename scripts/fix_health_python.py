# -*- coding: utf-8 -*-
"""fix_health_python.py — 健康检查的 Python 解析改为多候选（DEF-030）

现象：6 组 MCP 里只有 scrapling 超时，其余 5 组（Node 服务）全过。
根因：mcp-all-health.cjs 用 `process.env.METAGO_PYTHON || "python"` 起 Python 服务。
      未设 METAGO_PYTHON 时落到裸 `python` → Windows Store 桩 → 无响应 → 超时。
      我单独用完整路径探测时 173ms 就返回 5 个工具，证明服务本身没问题。
这是 DEF-027（K11 同一问题）的翻版——修了 verify-package 却漏了这个脚本。
"""
import pathlib

P = pathlib.Path(r"D:\DSH-Official\home\scripts\mcp-all-health.cjs")
s = P.read_text(encoding="utf-8")

OLD = '    const exe = isPy ? (process.env.METAGO_PYTHON || "python") : process.execPath;'
NEW = '''    /* Python 多候选回退：裸 python 可能是 Windows Store 桩，会静默挂住 */
    const PY_CANDS = [
      process.env.METAGO_PYTHON,
      "C:/Users/MetaGO/AppData/Local/Python/pythoncore-3.14-64/python.exe",
      "python", "python3", "py",
    ].filter(Boolean);
    const exe = isPy ? PY_CANDS[0] : process.execPath;'''

if OLD in s:
    s = s.replace(OLD, NEW, 1)
    print("已改为多候选 python")
else:
    print("未匹配 exe 行")
    raise SystemExit(1)

# 在 spawn 失败或报告超时时，把「python 全不可用」说清楚
OLD2 = '''    } catch (e) {
      return resolve({ name, ok: false, err: "spawn 失败: " + e.message.slice(0, 40) });
    }'''
NEW2 = '''    } catch (e) {
      return resolve({ name, ok: false, err: "spawn 失败: " + e.message.slice(0, 40) +
        (isPy ? "（Python 服务，检查 METAGO_PYTHON 或 PATH）" : "") });
    }'''
if OLD2 in s:
    s = s.replace(OLD2, NEW2, 1)

P.write_text(s, encoding="utf-8")
print("已写回")

import subprocess
r = subprocess.run(["node", "--check", str(P)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:200])
