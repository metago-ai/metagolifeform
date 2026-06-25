---
name: "metago-emotion"
description: "情绪检测技能。通过分析用户输入文本特征检测情绪状态。检测维度：词汇情绪词库、否定词与程度词处理、标点符号特征、长度与重复特征。返回emotion_state/confidence/intensity。"
source_document: 元构全息智能引擎.txt
source_skill: 情绪检测
source_section: metago-emotion技能定义(223-227, 371-393)
---

# 情绪检测（metago-emotion）

## 描述
通过分析用户输入文本特征检测情绪状态。检测维度：词汇情绪词库、否定词与程度词处理、标点符号特征、长度与重复特征。返回emotion_state/confidence/intensity。

## 触发条件
用户请求情绪检测时自动激活。用户输入中包含明显情绪倾向时自动激活。

## 核心流程
1. 接收用户输入文本
2. 词汇情绪词库匹配
3. 否定词与程度词处理
4. 标点符号特征分析
5. 长度与重复特征分析
6. 输出情绪状态评估结果

## 输出格式
返回结构化JSON，包含：
```json
{
  "emotion_state": "情绪状态",
  "confidence": 0.0-1.0,
  "intensity": "low|medium|high"
}
```

## 根源文档
`元构全息智能引擎.txt`（metago-emotion技能定义(223-227, 371-393)）

## 与其他技能的协同
- 与 `metago-scene-adapt` 协同：情绪状态影响场景适配
- 与 `metago-objectivity` 协同：情绪不影响客观性判定
