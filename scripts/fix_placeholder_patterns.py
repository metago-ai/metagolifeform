# -*- coding: utf-8 -*-
"""fix_placeholder_patterns.py — 扩宽占位符检测（DEF-018）

缺陷：placeholders = ['[placeholder]', '<TODO>', 'xxx', 'TBD', 'FIXME', '[未填写]', '[待补充]']
      且用 output.includes(p)（区分大小写、要求精确形态）
      → 'XXX'（大写）漏检、裸 'TODO' 漏检、裸「待补充」漏检、'[待填]' 漏检
      → 校验器对最常见的占位符形态形同虚设

修法：改为正则 + 不区分大小写 + 覆盖常见形态
"""
import pathlib
import re
import shutil
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine\RUNTIME\dist\validators.js")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-placeholder-" + time.strftime("%Y%m%d-%H%M%S"))
s = P.read_text(encoding="utf-8")

if "PLACEHOLDER_PATTERNS_V2" in s:
    print("已修复，跳过")
    raise SystemExit(0)

OLD = "const placeholders = ['[placeholder]', '<TODO>', 'xxx', 'TBD', 'FIXME', '[未填写]', '[待补充]'];"
NEW = """/* PLACEHOLDER_PATTERNS_V2：扩宽到常见占位符形态，不区分大小写 */
        const placeholderRe = /\\[(?:placeholder|未填写|待补充|待填|待定|todo|tbd|fixme)\\]|<\\s*(?:TODO|TBD|FIXME|占位)\\s*>|\\bTODO\\b|\\bTBD\\b|\\bFIXME\\b|\\bx{3,}\\b|待补充|待填写|此处省略|略过不计/gi;
        const found = [];
        let _m;
        placeholderRe.lastIndex = 0;
        while ((_m = placeholderRe.exec(String(output))) !== null) {
            const v = _m[0];
            if (!found.includes(v)) found.push(v);
            if (found.length >= 10) break;
            if (_m.index === placeholderRe.lastIndex) placeholderRe.lastIndex++;
        }"""

if OLD in s:
    s = s.replace(OLD, NEW, 1)
    s = s.replace("const hasFakeApi = fakeApiPatterns.some(p => p.test(output));",
                  "const hasFakeApi = fakeApiPatterns.some(p => p.test(String(output)));", 1)
    BACKUP.mkdir(parents=True, exist_ok=True)
    shutil.copy2(P, BACKUP / P.name)
    P.write_text(s, encoding="utf-8")
    print("已备份并写回:", BACKUP / P.name)
else:
    print("未匹配目标行")
    raise SystemExit(1)
