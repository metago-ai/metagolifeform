---
name: metago-bazi
description: 四柱八字多尺度时间模型。当需要多时间尺度标注（战略/战术/运营/执行）、周期框架分析时使用。
trigger:
  - "周期框架分析"
  - "四柱"
  - "八字"
  - "十神"
  - "大运"
---

# metago-bazi

## 能力
四柱排盘（节气月）/ 十神 / 大运（阳男阴女顺逆）/ 流年 / 五行力量平衡

## 输入
metago-shushu bazi <yyyy-mm-dd> <hour> [男|女]

## 红线（强制）
不做"命运论断"；只做时间结构标注与周期框架（年=战略/月=战术/日=运营/时=执行，对接四阶飞轮）

## 输出
四柱 + 日主 + 十神 + 纳音 + 五行力量 + 大运

---
## 合规红线（所有易理技能通用）
1. 一切断言 = 启发式标签 + 置信度 + 规则编号，禁止无据断言
2. 不用于医疗/投资/法律等受监管决策替代（A36）
3. 输出含免责声明段；避封建迷信表述
4. 引擎：本环境的 `yili` MCP 服务器（14 个工具）——`shushu_almanac` 历法 / `bazi_calc` 四柱 / `liuyao_divine` 六爻 / `qimen_calc` 奇门 / `ziwei_calc` 紫微 / `taiyi_calc` 太乙 / `yijing_divine` 周易 / `hetu_luoshu` 河图洛书 / `wuxing_analyze` 五行 / `shushu_diagnose` 象数诊断 / `shushu_calculus` 文言微积分 / `shushu_zeri` 择日 / `ganzhi_convert` 干支 / `shushu_info` 引擎元数据
