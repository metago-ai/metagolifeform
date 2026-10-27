---
name: metago-shushu-calculus
description: 文言微积分（象数势函数）。当需要态势趋势建模、临界点（察机）识别、应期求解、累积势能计算时使用。
trigger:
  - "态势趋势建模"
  - "临界点识别"
  - "应期求解"
  - "累积势能计算"
  - "文言微积分"
  - "察机"
  - "应期"
  - "禾势"
---

# metago-shushu-calculus

## 记号（仿《代微积拾级》）
象(t)=v(t) 状态函数；彳U=dU/dt 势之变率；机=彳U=0 之点；应期=解 U(象,t)=阈；禾势=∫U dt

## 模型
U = Σ 因子权重 × 季节调制系数 + A·cos(2πt/T + φ)

## 输入
metago-shushu calculus（JSON 状态）——见 lib/shushu-calculus.js

## 输出
察机（峰/谷）/ 应期（阈值穿越）/ 禾势（累积）——启发式模型，非因果断言

---
## 合规红线（所有易理技能通用）
1. 一切断言 = 启发式标签 + 置信度 + 规则编号，禁止无据断言
2. 不用于医疗/投资/法律等受监管决策替代（A36）
3. 输出含免责声明段；避封建迷信表述
4. 引擎：本环境的 `yili` MCP 服务器（14 个工具）——`shushu_almanac` 历法 / `bazi_calc` 四柱 / `liuyao_divine` 六爻 / `qimen_calc` 奇门 / `ziwei_calc` 紫微 / `taiyi_calc` 太乙 / `yijing_divine` 周易 / `hetu_luoshu` 河图洛书 / `wuxing_analyze` 五行 / `shushu_diagnose` 象数诊断 / `shushu_calculus` 文言微积分 / `shushu_zeri` 择日 / `ganzhi_convert` 干支 / `shushu_info` 引擎元数据
