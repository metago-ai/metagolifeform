---
name: metago-qimen
description: 奇门遁甲分层时空态势。当需要空间-时间-态势分层建模（环境/基础/主体/不可控层）、九宫态势分析时使用。
---

# metago-qimen

## 能力
时家奇门：节气定局（阴阳遁 18 局）/ 三元 / 三奇六仪 / 值符值使 / 九星八门八神 / 1080 局全枚举

## 输入
metago-shushu qimen <yyyy-mm-dd> <hour>

## 应用
天盘=环境层 / 地盘=基础层 / 人盘=主体层 / 神盘=不可控层 —— 直接服务 P-Space OS / SIP 态势建模

## 输出
阴阳遁局数 + 九宫三奇六仪 + 星门神落宫

---
## 合规红线（所有易理技能通用）
1. 一切断言 = 启发式标签 + 置信度 + 规则编号，禁止无据断言
2. 不用于医疗/投资/法律等受监管决策替代（A36）
3. 输出含免责声明段；避封建迷信表述
4. 引擎：本环境的 `yili` MCP 服务器（14 个工具）——`shushu_almanac` 历法 / `bazi_calc` 四柱 / `liuyao_divine` 六爻 / `qimen_calc` 奇门 / `ziwei_calc` 紫微 / `taiyi_calc` 太乙 / `yijing_divine` 周易 / `hetu_luoshu` 河图洛书 / `wuxing_analyze` 五行 / `shushu_diagnose` 象数诊断 / `shushu_calculus` 文言微积分 / `shushu_zeri` 择日 / `ganzhi_convert` 干支 / `shushu_info` 引擎元数据
