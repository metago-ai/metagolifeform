---
name: metago-yijing
description: 周易六十四卦状态机与态势推演。当需要将多维指标映射为状态向量、推演状态转移路径时使用。
---

# metago-yijing

## 方法
1. 指标二值化：6 维指标（≥阈=1）→ 六位状态向量
2. 起卦：metago-shushu yijing <seed>（seeded 可复现）
3. 推演：本卦 → 变卦（动爻翻转）→ 互卦（2-5爻）→ 错卦 → 综卦
4. 报告：《态势推演报告》客观结构 100% 确定 + 断辞启发式

## 卦表
64 卦全表（八宫/通行本序/卦辞）在 lib/yijing.js；384 爻辞在 data/yaoci.js

## 输出示例
本卦: 山天大畜（111001）动爻: 六四 变卦: 火天大有 互卦: 雷泽归妹

---
## 合规红线（所有易理技能通用）
1. 一切断言 = 启发式标签 + 置信度 + 规则编号，禁止无据断言
2. 不用于医疗/投资/法律等受监管决策替代（A36）
3. 输出含免责声明段；避封建迷信表述
4. 引擎：本环境的 `yili` MCP 服务器（14 个工具）——`shushu_almanac` 历法 / `bazi_calc` 四柱 / `liuyao_divine` 六爻 / `qimen_calc` 奇门 / `ziwei_calc` 紫微 / `taiyi_calc` 太乙 / `yijing_divine` 周易 / `hetu_luoshu` 河图洛书 / `wuxing_analyze` 五行 / `shushu_diagnose` 象数诊断 / `shushu_calculus` 文言微积分 / `shushu_zeri` 择日 / `ganzhi_convert` 干支 / `shushu_info` 引擎元数据
