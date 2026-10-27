---
name: metago-shushu-diagnose
description: 象数诊断（五行透镜）。当需要组织要素五行映射、生克回路分析、杠杆点定位（最小干预穴位）时使用。
trigger:
  - "组织要素五行映射"
  - "生克回路分析"
  - "杠杆点定位（最小干预穴位"
  - "象数诊断"
  - "五行透镜"
  - "杠杆点"
  - "最小干预"
---

# metago-shushu-diagnose

## 方法
1. 要素五行映射（关键词表 + 默认土）
2. 生克回路分析（正/负反馈链）
3. 断"穴位"：被克最多且权重高的要素 = 杠杆点（最小干预心法第 2 定律）

## 输入
metago-shushu diagnose <要素名:权重,...> <季节五行>

## 输出
各要素五行/旺相休囚死/关系 + 杠杆点 + 回路

## 红线
杠杆点为干预策略启发式定位，非因果断言

---
## 合规红线（所有易理技能通用）
1. 一切断言 = 启发式标签 + 置信度 + 规则编号，禁止无据断言
2. 不用于医疗/投资/法律等受监管决策替代（A36）
3. 输出含免责声明段；避封建迷信表述
4. 引擎：本环境的 `yili` MCP 服务器（14 个工具）——`shushu_almanac` 历法 / `bazi_calc` 四柱 / `liuyao_divine` 六爻 / `qimen_calc` 奇门 / `ziwei_calc` 紫微 / `taiyi_calc` 太乙 / `yijing_divine` 周易 / `hetu_luoshu` 河图洛书 / `wuxing_analyze` 五行 / `shushu_diagnose` 象数诊断 / `shushu_calculus` 文言微积分 / `shushu_zeri` 择日 / `ganzhi_convert` 干支 / `shushu_info` 引擎元数据
