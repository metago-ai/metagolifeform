---
name: "metago-delivery-gate"
description: "交付前原子验证门控。在宣告任务完成前强制执行三层验证清单（技术层 tsc/build/产物扫描 + 业务层 HTTP/云函数/AI对话 + 链路层 exe/latest.yml），任何一项 FAIL 禁止宣告完成。"
version: "1.0.0"
author: "MetaGO"
category: "工程质量"
platforms: ["cursor","claude-code","codex","trae","codebuddy","qoder","zcode"]
trigger:
  - "交付验证"
  - "发布前检查"
  - "运行时验证"
  - "交付前验证"
  - "npm run verify"
---

# 交付前原子验证门控（metago-delivery-gate）

## 描述
在宣告"任务完成"前强制执行三层验证清单，把运行时验证从软约束变成硬门。任何一项 FAIL 禁止宣告完成。

## 触发条件
当 AI Agent 收到"任务完成"类指令或代码交付请求时自动激活。配套 metago-discipline 进行五问自检。

## 核心流程
1. 接收交付任务描述
2. 检查 L1 技术层：tsc -b / vite build / 产物扫描
3. 检查 L2 业务层：Web HTTP 200 / 云函数可调 / AI 对话端到端
4. 检查 L3 链路层：exe HTTP 200 + 大小 / latest.yml HTTP 200
5. 检查 L4 缺陷猎杀：10 维度主动扫描
6. 输出带证据的验证报告

## 输出格式
结构化验证报告，包含：
- V1.x 技术层各项结果 + 命令输出
- V2.x 业务层各项结果 + HTTP 状态码/AI 回复片段
- V3.x 链路层各项结果 + Content-Length
- 全部通过/失败统计

## 根源文档
`AGENTS.md` 第十四章「交付前原子验证协议」

## 与其他技能的协同
- 与 `metago-discipline` 协同：交付门控 + 五问自检组成完整质量闭环
- 与 `metago-decision-lock` 协同：关键交付节点触发决策锁校验
- 与 `metago-output-integrity` 协同：验证报告中无幻觉 ✅
