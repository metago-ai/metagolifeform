---
source_document: D:\metago for Agent\元构完整信息.txt
source_skill: 情绪检测
source_section: metago-emotion技能定义(223-227, 371-393)
---

# 情绪检测

## 描述
通过分析用户输入文本特征检测情绪状态。检测维度：词汇情绪词库、否定词与程度词处理、标点符号特征、长度与重复特征。返回emotion_state/confidence/intensity。

## 触发条件
用户请求批判分析 / 反事实推演 / 情绪检测 / 客观度评估 / 行动计划 / 决策评估时自动激活。

## 核心流程
1. 接收输入内容
2. 按对应维度进行分析评估
3. 输出结构化JSON结果
4. 附评估依据和改进建议

## 输出格式
返回结构化JSON，包含评分、各维度得分、判定结论和改进建议。

## 根源文档
`D:\metago for Agent\元构完整信息.txt` (metago-emotion技能定义(223-227, 371-393))
