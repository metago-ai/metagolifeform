---
name: metago-ziwei
description: 紫微斗数十二域画像。当需要十二维评估画像、领域关联分析（三方四正）时使用。
trigger:
  - "十二维评估画像"
  - "领域关联分析（三方四正"
  - "紫微斗数"
  - "十二宫"
  - "四化"
  - "三方四正"
---

# metago-ziwei

## 能力
安星全流程：命身宫/十二宫/五行局/紫微天府/十四主星/四化/三方四正

## 输入
metago-shushu ziwei <农历年> <月> <日> <时> <年干支> <年纳音>

## 应用
十二宫域 = 十二评估维度（与三元五纬五纬雷达互为粗细两档）；三方四正 = 维度关联

## 红线
画像为评估维度框架，非命运论断

---
## 合规红线（所有易理技能通用）
1. 一切断言 = 启发式标签 + 置信度 + 规则编号，禁止无据断言
2. 不用于医疗/投资/法律等受监管决策替代（A36）
3. 输出含免责声明段；避封建迷信表述
4. 引擎：本环境的 `yili` MCP 服务器（14 个工具）——`shushu_almanac` 历法 / `bazi_calc` 四柱 / `liuyao_divine` 六爻 / `qimen_calc` 奇门 / `ziwei_calc` 紫微 / `taiyi_calc` 太乙 / `yijing_divine` 周易 / `hetu_luoshu` 河图洛书 / `wuxing_analyze` 五行 / `shushu_diagnose` 象数诊断 / `shushu_calculus` 文言微积分 / `shushu_zeri` 择日 / `ganzhi_convert` 干支 / `shushu_info` 引擎元数据
