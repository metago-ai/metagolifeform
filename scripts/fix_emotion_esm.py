# -*- coding: utf-8 -*-
"""fix_emotion_esm.py — 修 metago_emotion 加载失败（CORR-013）

根因：mcp-server/dist/index.js 是 **ESM**（顶部用 import），
      模块作用域里没有 `require`，所以 emotionMod() 里所有 require 都抛 ReferenceError，
      被 catch 吞掉后 _EMO 变成 false → 工具报「引擎未提供 detectEmotion」。

修法：用 `createRequire(import.meta.url)` 造一个 CJS require。
"""
import pathlib
import shutil
import subprocess
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\mcp-server\dist\index.js")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-emoesm-" + time.strftime("%Y%m%d-%H%M%S"))
s = P.read_text(encoding="utf-8")

if "createRequire" in s:
    print("已修，跳过")
    raise SystemExit(0)

# 1) 顶部加 createRequire
OLD_IMPORT = 'import { McpServer } from "@modelcontextprotocol/'
i = s.find(OLD_IMPORT)
if i < 0:
    print("未找到 import 锚点")
    raise SystemExit(1)
# 在第 1 个 import 前插入
insert_at = s.rfind("\n", 0, i) + 1
INJ = ('import { createRequire as __createRequire } from "module";\n'
       'const __cjsRequire = __createRequire(import.meta.url);\n')
s = s[:insert_at] + INJ + s[insert_at:]
print("已加 createRequire")

# 2) 把 emotionMod 里的 require 换成 __cjsRequire
OLD_FN = '''        for (const c of cands) {
            try { _EMO = require(c); break; } catch (e) { }
        }'''
NEW_FN = '''        for (const c of cands) {
            try { _EMO = __cjsRequire(c); break; } catch (e) { }
        }'''
if OLD_FN in s:
    s = s.replace(OLD_FN, NEW_FN, 1)
    print("已把 require 换成 __cjsRequire")
else:
    print("未匹配 require 循环")
    raise SystemExit(1)

BACKUP.mkdir(parents=True, exist_ok=True)
shutil.copy2(P, BACKUP / P.name)
P.write_text(s, encoding="utf-8")
print("已备份并写回:", BACKUP / P.name)

r = subprocess.run(["node", "--check", str(P)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:250])
