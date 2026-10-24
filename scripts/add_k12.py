# -*- coding: utf-8 -*-
"""add_k12.py — 加 K12 断言：vendor 补丁在位"""
import pathlib

V = pathlib.Path(r"D:\metago-build\verify-package.cjs")
s = V.read_text(encoding="utf-8")

if 'chk("K12"' in s:
    print("K12 已存在")
    raise SystemExit(0)

BLOCK = r'''/* K12. vendor 补丁在位（npm install 后不被静默回退） */
let k12Ok = false, k12d = "";
try {
  const reap = path.join(HOME, "scripts/reapply-patches.cjs");
  if (!fs.existsSync(reap)) {
    k12d = "自愈脚本不存在（环境相关项，跳过）";
  } else {
    const o = String(execFileSync(process.execPath, [reap, "--check"], {
      encoding: "utf8", timeout: 120000
    }));
    const m = /共 (\d+) 组补丁 ｜ 通过 (\d+) ｜ 需处理 (\d+)/.exec(o);
    k12Ok = /总判定：PASS/.test(o);
    k12d = m ? `补丁 ${m[1]} 组，通过 ${m[2]}，需处理 ${m[3]}` : "无法解析";
  }
} catch (e) { k12d = String(e.stdout || e.message).slice(0, 80); }
chk("K12", "vendor 补丁在位（DEF-016~020 不静默回退）", k12Ok, k12d);

/* 报告 */'''

s = s.replace("/* 报告 */", BLOCK, 1)
V.write_text(s, encoding="utf-8")
print("已加入 K12 断言")
