---
name: "metago-discipline"
description: "AI 自律执行协议。输出任务完成前必须执行的五问自检：①是否运行 verify？②verify 是否有 FAIL？③报告含验证小节？④每项 ✅ 有证据？⑤做了业务层验证？任何一问答否禁止宣告完成。"
version: "1.0.0"
author: "MetaGO"
category: "工程质量"
platforms: ["cursor","claude-code","codex","trae","codebuddy","qoder","zcode"]
trigger:
  - "任务完成"
  - "交付完成"
  - "自律检查"
  - "反绕过检查"
  - "五问自检"
---

# AI 自律执行协议（metago-discipline）

## 描述
在输出"任务完成"前必须执行的五问自检，作为交付的最后一道防线。包含反绕过识别机制，把"AI 知道要做"变成"AI 不可绕过地执行"。

## 触发条件
每次 AI Agent 输出"任务完成"或"交付完成"状态前自动激活。

## 核心流程
1. 五问自检
   - ① 是否运行 npm run verify？
   - ② verify 输出是否有 FAIL？
   - ③ 交付报告含验证小节？
   - ④ 每项 ✅ 有执行证据？
   - ⑤ 是否做了业务层验证？
2. 任何一问答"否" → 禁止宣告完成
3. 反绕过识别
   - 检测"应该没问题"/"逻辑上正确"/"之前验证过"等绕过话术
4. 输出自检结果 + 绕过检测结果

## 输出格式
五问自检清单（每项 ✅/❌ + 证据或缺失项），反绕过检测结果。

## 根源文档
`AGENTS.md` 第十五章「AI 自律执行协议」

## 与其他技能的协同
- 与 `metago-delivery-gate` 协同：组成完整质量闭环
- 与 `metago-self-check` 协同：双重自检，防遗漏
- 与 `metago-fact-check` 协同：验证报告中声明的事实真伪
