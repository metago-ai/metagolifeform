---
name: metago-liuyao
description: 六爻决策查询系统。当需要针对具体问题（问财/问事/问事业）做决策分析时使用。
---

# metago-liuyao

## 流程
问事 → 定用神（用神库 60 类）→ 装卦（纳甲/世应/六亲/六神）→ 判旺衰（月建日辰）→ 推应期（冲合空破）

## 输入
metago-shushu liuyao <卦全名> <日干支> <月支> <日干> [问事]
示例: metago-shushu liuyao 水雷屯 甲子 寅 甲 求财

## 输出
六爻明细（六亲/六神/旺衰/旬空/世应）+ 用神 + 应期提示

## 红线
应期为规则推导（冲/合/空/破），属启发式标签，不承诺事实应验

---
## 合规红线（所有易理技能通用）
1. 一切断言 = 启发式标签 + 置信度 + 规则编号，禁止无据断言
2. 不用于医疗/投资/法律等受监管决策替代（A36）
3. 输出含免责声明段；避封建迷信表述
4. 引擎：本环境的 `yili` MCP 服务器（14 个工具）——`shushu_almanac` 历法 / `bazi_calc` 四柱 / `liuyao_divine` 六爻 / `qimen_calc` 奇门 / `ziwei_calc` 紫微 / `taiyi_calc` 太乙 / `yijing_divine` 周易 / `hetu_luoshu` 河图洛书 / `wuxing_analyze` 五行 / `shushu_diagnose` 象数诊断 / `shushu_calculus` 文言微积分 / `shushu_zeri` 择日 / `ganzhi_convert` 干支 / `shushu_info` 引擎元数据
