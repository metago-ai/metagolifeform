---
name: metago-hetu-luoshu
description: 河图洛书组合结构与空间编码。当需要空间排布分析、幻方构造、九宫配卦时使用。
trigger:
  - "空间排布分析"
  - "幻方构造"
  - "九宫配卦"
  - "河图洛书"
  - "幻方"
---

# metago-hetu-luoshu

## 能力
幻方构造（奇数阶 Siamese / 双偶数阶 / 六阶 LUX 变体——算学宝鉴纵横图法）+ 洛书九宫配卦 + 河图生成数

## 输入
metago-shushu luoshu [n]

## 应用
九宫空间排布分析（P-Space OS 空间槽位模型）；象数仪表盘几何基座

## 数据
洛书：戴九履一（行/列/对角和 15）；河图：一六水/二七火/三八木/四九金/五十土

---
## 合规红线（所有易理技能通用）
1. 一切断言 = 启发式标签 + 置信度 + 规则编号，禁止无据断言
2. 不用于医疗/投资/法律等受监管决策替代（A36）
3. 输出含免责声明段；避封建迷信表述
4. 引擎：本环境的 `yili` MCP 服务器（14 个工具）——`shushu_almanac` 历法 / `bazi_calc` 四柱 / `liuyao_divine` 六爻 / `qimen_calc` 奇门 / `ziwei_calc` 紫微 / `taiyi_calc` 太乙 / `yijing_divine` 周易 / `hetu_luoshu` 河图洛书 / `wuxing_analyze` 五行 / `shushu_diagnose` 象数诊断 / `shushu_calculus` 文言微积分 / `shushu_zeri` 择日 / `ganzhi_convert` 干支 / `shushu_info` 引擎元数据
