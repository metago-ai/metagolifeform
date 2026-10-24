# -*- coding: utf-8 -*-
"""fix_verify_capture.py — verify-package 改为「捕获 stdout 不看退出码」（DEF-044）

根因：给检查器加退出码后，`execFileSync` 遇到非零退出会抛异常；
      verify-package 的 catch 只设了 k6d（细节）没设 k6Ok，于是判定为 FAIL。
      而这些检查器本来是用「解析 stdout 里的总判定」来判断的，不该依赖退出码。

修法：加一个 runCapture() —— 无论退出码是多少，都返回 stdout；
      把所有「解析 stdout」的 execFileSync 换成它。
"""
import pathlib
import re
import subprocess

V = pathlib.Path(r"D:\metago-build\verify-package.cjs")
s = V.read_text(encoding="utf-8")

if "function runCapture" in s:
    print("· runCapture 已存在")
else:
    # 在第一个 chk 定义之前插入 helper
    anchor = re.search(r"\nfunction chk\s*\(|\nconst chk\s*=", s)
    if not anchor:
        print("✗ 找不到 chk 定义位置")
        raise SystemExit(1)
    helper = r'''
/**
 * runCapture — 执行子进程并**只取 stdout**，不管退出码。
 * 为什么需要：检查器加退出码后，execFileSync 遇到非零退出会抛异常，
 * 而本脚本是靠「解析 stdout 里的总判定」来判断的，不应被退出码打断。（DEF-044）
 */
function runCapture(exe, args, opts) {
  const o = Object.assign({ encoding: "utf8", timeout: 300000 }, opts || {});
  try {
    return String(execFileSync(exe, args, o));
  } catch (e) {
    if (e && e.stdout) return String(e.stdout);
    if (e && e.status !== undefined) return "";   // 无 stdout 但确有退出码
    throw e;
  }
}
'''
    pos = anchor.start()
    s = s[:pos] + helper + s[pos:]
    print("✓ 已插入 runCapture")

# 把所有「解析 stdout」的 execFileSync 调用换成 runCapture
# 形如 execFileSync(process.execPath, [xxx], { ... }) 或 execFileSync("node",[...],{...})
pat = re.compile(r"execFileSync\(\s*(process\.execPath|\"node\"|'node')\s*,\s*(\[[^\]]*\])\s*,\s*(\{[^}]*\})\s*\)", re.S)
n = 0
def repl(m):
    global n
    n += 1
    return f"runCapture({m.group(1)}, {m.group(2)}, {m.group(3)})"
s2 = pat.sub(repl, s)
print(f"✓ 替换 execFileSync → runCapture：{n} 处")

# 有的调用是多行 args，pat 可能漏；再按前缀粗暴替换兜底
left = len(re.findall(r"execFileSync\(\s*process\.execPath", s2))
if left:
    s2 = re.sub(r"execFileSync\(\s*process\.execPath", "runCapture(process.execPath", s2)
    print(f"✓ 兜底再替换 {left} 处")

V.write_text(s2, encoding="utf-8")
r = subprocess.run(["node", "--check", str(V)], capture_output=True, text=True,
                   encoding="utf-8", errors="replace")
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:200])

# 复核
t = V.read_text(encoding="utf-8")
print()
print("复核：")
print("  含 runCapture 定义:", "function runCapture" in t)
print("  剩余 execFileSync 调用:", len(re.findall(r"execFileSync\(", t)))
for m in re.finditer(r"execFileSync\(", t):
    ln = t[:m.start()].count("\n") + 1
    print(f"    L{ln}: {t.split(chr(10))[ln-1].strip()[:80]}")
