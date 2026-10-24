# -*- coding: utf-8 -*-
"""fix_decisionlock_types.py — 修复 DecisionLock 对非字符串输入崩溃（DEF-019）

实测崩溃：
  validate({...})   → userRequest.split is not a function
  validate([...])   → userRequest.split is not a function
  validate(null)    → Cannot read properties of null (reading 'includes')
  validate(undefined) → Cannot read properties of undefined (reading 'includes')

修法：validate 入口统一归一化三个参数为字符串。
"""
import pathlib
import re
import shutil
import subprocess
import time

CANDIDATES = [
    pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine\RUNTIME\dist\decision-lock.js"),
    pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine\RUNTIME\dist\validators.js"),
]
P = next((p for p in CANDIDATES if p.exists() and "async validate(" in p.read_text(encoding="utf-8", errors="replace")), None)
if P is None:
    # 全盘找
    root = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine")
    for f in root.rglob("*.js"):
        try:
            if "async validate(" in f.read_text(encoding="utf-8", errors="replace"):
                P = f
                break
        except Exception:
            pass

if P is None:
    print("未找到 DecisionLock.validate 所在文件")
    raise SystemExit(1)
print("目标文件:", P)

s = P.read_text(encoding="utf-8")
if "/* DC_NORMALIZED */" in s:
    print("已修复，跳过")
    raise SystemExit(0)

M = re.search(r"(async validate\(output,\s*intent,\s*userRequest\)\s*\{\s*\n)", s)
if not M:
    print("未匹配 validate 签名")
    raise SystemExit(1)

INJECT = M.group(1) + """        /* DC_NORMALIZED：三个入参统一归一为字符串，避免调用方传对象/数组/null 时崩溃 */
        const _norm = (v) => {
            if (typeof v === 'string') return v;
            if (v === null || v === undefined) return '';
            try { return typeof v === 'object' ? JSON.stringify(v) : String(v); }
            catch (e) { return ''; }
        };
        output = _norm(output);
        intent = _norm(intent);
        userRequest = _norm(userRequest);
"""
s = s[:M.start()] + INJECT + s[M.end():]

BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-decisionlock-" + time.strftime("%Y%m%d-%H%M%S"))
BACKUP.mkdir(parents=True, exist_ok=True)
shutil.copy2(P, BACKUP / P.name)
P.write_text(s, encoding="utf-8")
print("已注入归一化，备份:", BACKUP / P.name)

r = subprocess.run(["node", "--check", str(P)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:200])
