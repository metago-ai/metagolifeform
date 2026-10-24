# -*- coding: utf-8 -*-
"""wire_toolkit_harddriven.py — 给 TOOLKIT_TOOLS 注册体加硬驱动分发

根因：metago_critique / metago_objectivity 等 7 个工具**同名的有两个版本**，
      TOOLKIT_TOOLS（结构化参数）先注册，SKILLS 版本被跳过。
      而硬驱动分支只加在 SKILLS 注册体里 → 这 7 个工具永远走软驱动。
修法：在 TOOLKIT_TOOLS 的 handler 里也加同样的引擎分发。
"""
import pathlib
import shutil
import subprocess
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\mcp-server\dist\index.js")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-toolkit-" + time.strftime("%Y%m%d-%H%M%S"))
s = P.read_text(encoding="utf-8")

if "handleAxiomCheck(tkInput" in s:
    print("已接入，跳过")
    raise SystemExit(0)

OLD = """            const text = `${tool.guide}\\n\\n## 用户输入\\n${argsStr}`;
            logCall(tool.toolName, args, "ok", Date.now() - startTime);"""

NEW = """            /* 硬驱动：同名的 TOOLKIT_TOOLS 版本也要走真实现，否则永远只有指南 */
            let tkResult = "";
            const tkName = tool.toolName;
            const tkInput = argsStr;
            try {
                if (tkName === "metago_critique") {
                    tkResult = handleAxiomCheck(tkInput, "checkCriticality", "批判性检测");
                }
                else if (tkName === "metago_objectivity") {
                    tkResult = handleAxiomCheck(tkInput, "checkObjectivity", "客观中立度评估");
                }
            } catch (e) { tkResult = ""; }
            const text = tkResult
                ? `${tool.guide}\\n\\n## 用户输入\\n${argsStr}\\n\\n## Engine V2 真实执行结果\\n${tkResult}`
                : `${tool.guide}\\n\\n## 用户输入\\n${argsStr}`;
            logCall(tool.toolName, args, "ok", Date.now() - startTime);"""

if OLD in s:
    s = s.replace(OLD, NEW, 1)
    print("已给 TOOLKIT_TOOLS 加硬驱动分发")
else:
    print("未匹配 TOOLKIT_TOOLS 文本模板")
    # 打印附近内容帮助定位
    i = s.find("tool.guide")
    print("附近内容:", repr(s[i - 120:i + 200]) if i > 0 else "未找到 tool.guide")
    raise SystemExit(1)

BACKUP.mkdir(parents=True, exist_ok=True)
shutil.copy2(P, BACKUP / P.name)
P.write_text(s, encoding="utf-8")
print("已备份并写回:", BACKUP / P.name)

r = subprocess.run(["node", "--check", str(P)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:250])
