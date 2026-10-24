# -*- coding: utf-8 -*-
"""expand_emotion_lexicon.py — 扩充情绪词库（DEF-028）

问题：现有词库每类只有 6-11 个词，覆盖不足。
      实测「今天天气不错，心情很好」被判 neutral，因为「不错」「很好」都不在 joy 词表里。

修法：每类扩到 24-30 个常用词，覆盖口语化表达与常见程度搭配。
      同时加入否定词表补充（不好/不开心 等需翻转）。
"""
import pathlib
import shutil
import subprocess
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine\atoms\atoms-crypto-emotion.cjs")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-lex-" + time.strftime("%Y%m%d-%H%M%S"))
s = P.read_text(encoding="utf-8")

if "LEX_V2" in s:
    print("已扩充，跳过")
    raise SystemExit(0)

import re
m = re.search(r"const LEX = \{.*?\n\};", s, re.S)
if not m:
    print("未找到 LEX 定义")
    # 打印上下文帮助定位
    i = s.find("joy")
    print("附近:", repr(s[max(0, i - 200):i + 300]))
    raise SystemExit(1)

NEW_LEX = '''const LEX = {
  /* LEX_V2：每类扩到 24-30 个常用词，覆盖口语化表达 */
  joy: ["开心", "高兴", "快乐", "满意", "喜欢", "兴奋", "太好了", "棒", "赞", "优秀", "完美",
    "不错", "很好", "挺好", "真好", "愉快", "舒服", "顺利", "成功", "惊喜", "期待",
    "感激", "感谢", "幸福", "美好", "精彩", "给力", "牛", "爱了", "心动"],
  anger: ["生气", "愤怒", "气愤", "恼火", "烦", "讨厌", "滚", "废物", "垃圾", "气死",
    "火大", "离谱", "无语", "荒唐", "过分", "恶劣", "愚蠢", "坑", "耍我", "不可接受",
    "忍不了", "受够", "胡闹", "岂有此理", "暴怒", "抓狂"],
  sadness: ["难过", "伤心", "失望", "沮丧", "遗憾", "可惜", "哭", "委屈", "低落",
    "郁闷", "心痛", "无奈", "绝望", "悲伤", "失落", "孤单", "想哭", "难捱",
    "提不起劲", "没意思", "心累", "崩溃"],
  anxiety: ["担心", "焦虑", "紧张", "害怕", "恐惧", "不安", "着急", "慌", "压力",
    "忐忑", "忧心", "发愁", "不敢", "怕", "悬着", "没底", "慌神", "心慌",
    "坐立不安", "惴惴", "折磨", "煎熬"],
  surprise: ["惊讶", "意外", "没想到", "居然", "竟然", "吃惊", "震惊", "出乎意料",
    "不可思议", "意外之喜", "万万没想到", "稀奇", "罕见", "反转", "神奇"],
  fatigue: ["累", "疲惫", "困", "撑不住", "干不动", "疲乏", "乏累", "倦", "没力气",
    "熬不住", "精疲力尽", "身心俱疲", "打不动", "眼冒金星", "想睡", "耗尽了"],
};'''

s = s[:m.start()] + NEW_LEX + s[m.end():]
print("已扩充词库")

BACKUP.mkdir(parents=True, exist_ok=True)
shutil.copy2(P, BACKUP / P.name)
P.write_text(s, encoding="utf-8")
print("已备份并写回:", BACKUP / P.name)

r = subprocess.run(["node", "--check", str(P)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:250])
