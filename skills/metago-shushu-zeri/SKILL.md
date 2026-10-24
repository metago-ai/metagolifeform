---
name: metago-shushu-zeri
description: 择日（约束满足搜索）。当需要在时间窗内按约束（避冲/选建除/黄道）筛选可行日期时使用。
---

# metago-shushu-zeri

## 方法
约束满足：时间槽位 × 规则约束的可行解搜索（建除十二神/黄黑道/旬空/二十八宿）

## 输入
metago-shushu zeri <起始日> <天数> [约束 JSON]

## 输出
候选日期 + 干支/建除/黄黑道/旬空/星宿

## 红线（强制）
建除/黄黑道/星宿均为民俗符号，无因果断言；不用于医疗/重大投资等受监管决策

---
## 合规红线（所有易理技能通用）
1. 一切断言 = 启发式标签 + 置信度 + 规则编号，禁止无据断言
2. 不用于医疗/投资/法律等受监管决策替代（A36）
3. 输出含免责声明段；避封建迷信表述
4. 引擎：本环境的 `yili` MCP 服务器（14 个工具）——`shushu_almanac` 历法 / `bazi_calc` 四柱 / `liuyao_divine` 六爻 / `qimen_calc` 奇门 / `ziwei_calc` 紫微 / `taiyi_calc` 太乙 / `yijing_divine` 周易 / `hetu_luoshu` 河图洛书 / `wuxing_analyze` 五行 / `shushu_diagnose` 象数诊断 / `shushu_calculus` 文言微积分 / `shushu_zeri` 择日 / `ganzhi_convert` 干支 / `shushu_info` 引擎元数据
