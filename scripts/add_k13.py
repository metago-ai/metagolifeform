# -*- coding: utf-8 -*-
"""add_k13.py — 加 K13 断言：算子语义正确性（86 项）"""
import pathlib

V = pathlib.Path(r"D:\metago-build\verify-package.cjs")
s = V.read_text(encoding="utf-8")

if 'chk("K13"' in s:
    print("K13 已存在")
    raise SystemExit(0)

BLOCK = r'''/* K13. 特化算子语义正确性（86 项数学性质断言） */
let k13Ok = false, k13d = "";
try {
  const f = path.join(HOME, "scripts/ops-semantic-full.cjs");
  if (!fs.existsSync(f)) {
    k13d = "语义测试脚本不存在（环境相关项，跳过）";
  } else {
    const o = String(execFileSync(process.execPath, [f], { encoding: "utf8", timeout: 120000 }));
    const m = /语义断言：通过 (\d+) ｜ 失败 (\d+)/.exec(o);
    k13Ok = /总判定：PASS/.test(o);
    k13d = m ? `语义断言 ${m[1]} 项通过，失败 ${m[2]}` : "无法解析";
  }
} catch (e) { k13d = String(e.stdout || e.message).slice(0, 80); }
chk("K13", "特化算子语义正确性（已知数学性质断言）", k13Ok, k13d);

/* 报告 */'''

s = s.replace("/* 报告 */", BLOCK, 1)
V.write_text(s, encoding="utf-8")
print("已加入 K13 断言")
