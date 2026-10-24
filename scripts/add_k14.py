# -*- coding: utf-8 -*-
"""add_k14.py — 加 K14 断言：算法语义不变量（34 项）"""
import pathlib

V = pathlib.Path(r"D:\metago-build\verify-package.cjs")
s = V.read_text(encoding="utf-8")

if 'chk("K14"' in s:
    print("K14 已存在")
    raise SystemExit(0)

BLOCK = r'''/* K14. 算法语义不变量（34 项数学性质断言） */
let k14Ok = false, k14d = "";
try {
  const f = path.join(HOME, "scripts/algo-semantic-invariants.cjs");
  if (!fs.existsSync(f)) {
    k14d = "不变量测试脚本不存在（环境相关项，跳过）";
  } else {
    const o = String(execFileSync(process.execPath, [f], { encoding: "utf8", timeout: 180000 }));
    const m = /语义不变量：通过 (\d+) ｜ 失败 (\d+)/.exec(o);
    k14Ok = /总判定：PASS/.test(o);
    k14d = m ? `不变量 ${m[1]} 项通过，失败 ${m[2]}` : "无法解析";
  }
} catch (e) { k14d = String(e.stdout || e.message).slice(0, 80); }
chk("K14", "算法语义不变量（自反性/对称性/三角不等式）", k14Ok, k14d);

/* 报告 */'''

s = s.replace("/* 报告 */", BLOCK, 1)
V.write_text(s, encoding="utf-8")
print("已加入 K14 断言")
