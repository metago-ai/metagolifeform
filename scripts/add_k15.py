# -*- coding: utf-8 -*-
"""add_k15.py — 加 K15：输出洁净度（已知 2 条例外，任何新增即 FAIL）

判据设计：
  · 已知例外：ALG_T2_I_020、ALG_T2_H_020（依赖内部辅助函数 assessIdeaNovelty /
    analyzeIdeaFeasibility / assessIntuitionConfidence，其字段要求未在可检索源码中暴露）
  · 断言逻辑：污染条数必须 ≤ 2 且「全部落在已知例外集合内」。
    任何**新算法**出现污染 → FAIL。这样既承认已知缺口，又能立刻发现新问题。
"""
import pathlib

V = pathlib.Path(r"D:\metago-build\verify-package.cjs")
s = V.read_text(encoding="utf-8")

if 'chk("K15"' in s:
    print("K15 已存在")
    raise SystemExit(0)

BLOCK = r'''/* K15. 输出洁净度（已知 2 条例外，任何新增污染即 FAIL） */
let k15Ok = false, k15d = "";
try {
  const f = path.join(HOME, "scripts/null-nan-scan.cjs");
  if (!fs.existsSync(f)) {
    k15d = "扫描脚本不存在（环境相关项，跳过）";
  } else {
    let o = "";
    try { o = String(execFileSync(process.execPath, [f], { encoding: "utf8", timeout: 180000 })); }
    catch (e) { o = String(e.stdout || ""); }   /* 有污染时脚本 exit 1，但 stdout 有内容 */
    const m = /有 NaN\/Inf\/全 null 的 (\d+) 条/.exec(o);
    const cnt = m ? parseInt(m[1], 10) : -1;
    const KNOWN = ["ALG_T2_I_020", "ALG_T2_H_020"];
    /* 抽取本次被点名的算法 ID */
    const seen = [];
    const re = /^\s+(ALG_[A-Z0-9_]+)\s+/gm;
    let mm;
    while ((mm = re.exec(o))) if (!seen.includes(mm[1])) seen.push(mm[1]);
    const extra = seen.filter(x => !KNOWN.includes(x));
    k15Ok = cnt >= 0 && extra.length === 0;
    k15d = cnt < 0 ? "无法解析" : `污染 ${cnt} 条${extra.length ? "，新增: " + extra.slice(0, 3).join(",") : "（全部为已知例外）"}`;
  }
} catch (e) { k15d = String(e.stdout || e.message).slice(0, 80); }
chk("K15", "输出洁净度（已知 2 例外，新增污染即 FAIL）", k15Ok, k15d);

/* 报告 */'''

s = s.replace("/* 报告 */", BLOCK, 1)
V.write_text(s, encoding="utf-8")
print("已加入 K15 断言")
