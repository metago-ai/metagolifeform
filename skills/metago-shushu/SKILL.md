---
name: metago-shushu
description: 易理工程学总纲：象数推演引擎（八家全量：周易/奇门/六爻/四柱/太乙/紫微/阴阳五行八卦/河图洛书）。当需要态势推演、决策建模、周期分析、时空分层、关系反馈分析时使用。
trigger:
  - "态势推演"
  - "决策建模"
  - "周期分析"
  - "时空分层"
  - "关系反馈分析"
  - "象数推演"
  - "易理工程学"
  - "八家全量"
---

# metago-shushu

## 核心定位
决策建模与推演工具（非命理咨询）：象数 = 结构化建模语言，输出 = 文言名 + 现代参数 + 规则编号 + 置信度四联。

## 引擎入口
CLI: metago-shushu <命令>（almanac/yijing/liuyao/bazi/ziwei/qimen/taiyi/wuxing/luoshu/zeri/diagnose/calculus）
MCP: mcp__metago-shushu__*（14 工具）

## 八家能力表
| 家 | 工具 | 建模内核 |
|---|---|---|
| 周易 | yijing | 六位状态向量 + 转移算子（变互错综） |
| 六爻 | liuyao | 决策查询系统（用神/世应/旺衰/应期） |
| 四柱 | bazi | 多尺度时间模型（年战略/月战术/日运营/时执行） |
| 紫微 | ziwei | 十二域画像雷达（与三元五纬互为粗细两档） |
| 奇门 | qimen | 分层时空态势（天/地/人/神盘，1080 局） |
| 太乙 | taiyi | 宏观周期框架（积年主本 + 分歧登记） |
| 五行 | wuxing | 关系代数与反馈回路（生克矩阵） |
| 河洛 | luoshu | 组合结构与空间编码（幻方/九宫） |

## 强制规范
1. 一切吉凶断言 = 启发式标签 + 置信度 + 规则编号
2. 不用于医疗/投资/法律等受监管决策替代（A36 合规）
3. 输出含免责声明段；避封建迷信表述
4. 可溯源：输入 + 规则 + 结果全链记录

---
## 合规红线（所有易理技能通用）
1. 一切断言 = 启发式标签 + 置信度 + 规则编号，禁止无据断言
2. 不用于医疗/投资/法律等受监管决策替代（A36）
3. 输出含免责声明段；避封建迷信表述
4. 引擎：本环境的 `yili` MCP 服务器（14 个工具）——`shushu_almanac` 历法 / `bazi_calc` 四柱 / `liuyao_divine` 六爻 / `qimen_calc` 奇门 / `ziwei_calc` 紫微 / `taiyi_calc` 太乙 / `yijing_divine` 周易 / `hetu_luoshu` 河图洛书 / `wuxing_analyze` 五行 / `shushu_diagnose` 象数诊断 / `shushu_calculus` 文言微积分 / `shushu_zeri` 择日 / `ganzhi_convert` 干支 / `shushu_info` 引擎元数据
