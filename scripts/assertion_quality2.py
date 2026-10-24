# -*- coding: utf-8 -*-
"""assertion_quality2.py — 断言质量审计 v2

上一版的错（CORR-025）：
  只把 T()/assert()/ok()/expect()/check() 当断言，漏掉「pass++/fail++ 计数式」写法，
  于是 t3test / contract-validator / mutation-test / atom-hollow-scan 被数成 0 条断言。
本版三种写法都认：
  A. 函数式：T(name, cond) / assert(x) / ok(x) / expect(x) / check(id,...)
  B. 计数式：pass++ / ok++ / 通过++ / fail++ / bad++ / 失败++
  C. 收集式：issues.push(...) / problems.push(...) / errors.push(...)
恒真断言判定不变（这部分上一版结论有效）：0 处。
"""
import pathlib
import re

H = pathlib.Path(r"D:\DSH-Official\home")
SC = H / "scripts"
MB = pathlib.Path(r"D:\metago-build")
NPM = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai")

TESTS = [
    ("算子语义",      "ops-semantic-full.cjs",        86,  [SC, MB]),
    ("算法不变量",    "algo-semantic-invariants.cjs",  34,  [SC, MB]),
    ("T3 全量",       "t3test.cjs",                    227, [NPM / "algorithms/engine/algorithms/t3impl"]),
    ("契约校验",      "contract-validator.cjs",        None, [NPM / "engine/atoms"]),
    ("原子空壳",      "atom-hollow-scan.cjs",          None, [SC, MB]),
    ("mutation",      "mutation-test.cjs",             17,  [SC, MB]),
    ("包验收",        "verify-package.cjs",            34,  [SC, MB]),
    ("断言期望审计",  "audit-expectations.cjs",        None, [SC, MB]),
]

PAT_A = re.compile(r"\b(?:T|assert|ok|expect|check)\s*\(")
PAT_B = re.compile(r"\b(?:pass|ok|fail|bad|errors?|issues?|problems?)\s*(?:\+\+|\+=)")
PAT_C = re.compile(r"\b(?:issues?|problems?|errors?|fails?|diffs?|missing|hollow\w*|dup\w*|same\w*|bad\w*|warn\w*)\.push\s*\(")

TAUT = [
    (r"assert\(\s*true\s*[),]", "assert(true)"),
    (r"T\([^,]+,\s*true\s*[,)]", "T(name,true)"),
    (r"ok\(\s*true\s*\)", "ok(true)"),
    (r"expect\(\s*true\s*\)", "expect(true)"),
    (r"assert\(\s*(\w+(?:\.\w+)*)\s*===\s*\1\s*\)", "x===x"),
    (r"if\s*\(\s*true\s*\)", "if(true)"),
    (r"assert\(\s*1\s*===\s*1\s*\)", "1===1"),
]

print("=" * 92)
print("断言质量审计 v2（函数式 + 计数式 + 收集式 三种写法都认）")
print("=" * 92)
print(f"{'测试集':<14}{'文件':<32}{'函数式':>7}{'计数式':>7}{'收集式':>7}{'恒真':>6}  判定")
print("-" * 92)

problems = []
for label, fname, claim, roots in TESTS:
    found = None
    for r in roots:
        if not r.exists():
            continue
        cand = r / fname
        if cand.exists():
            found = cand
            break
        hits = list(r.rglob(fname))
        if hits:
            found = hits[0]
            break
    if found is None:
        print(f"  {label:<12}{fname:<32}{'找不到':>7}")
        continue
    t = found.read_text(encoding="utf-8", errors="replace")
    a = len(PAT_A.findall(t))
    b = len(PAT_B.findall(t))
    c = len(PAT_C.findall(t))
    taut = []
    for pat, desc in TAUT:
        if re.search(pat, t):
            taut.append(desc)
    ok = (a + b + c) > 0 and not taut
    if taut:
        problems.append((label, sorted(set(taut))))
    claim_note = f" (声称 {claim})" if claim else ""
    print(f"  {label:<12}{found.name:<32}{a:>7}{b:>7}{c:>7}{len(taut):>6}  "
          + ("✓" if ok else "✗") + claim_note)

print()
print("-" * 92)
print(f"有恒真断言的：{len(problems)}" + ("" if problems else "  ✓ 无"))
for label, taut in problems:
    print(f"  · {label}: {taut}")

# 断言总量估算
print()
print("说明：函数式/计数式/收集式的绝对数不能直接相加（一个 T() 可能断多条、一个 pass++ 就是一条），")
print("      本审计只用于判断「是否存在断言」与「是否存在恒真断言」，不用于核对声称数量。")
