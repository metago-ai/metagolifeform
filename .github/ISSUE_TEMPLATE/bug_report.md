---
name: 🐛 Bug 报告
about: 报告 MetaGO 生命体的 bug、异常行为或错误输出
title: "[BUG] "
labels: ["bug", "triage"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        感谢你为 MetaGO 生命体报告 Bug！请尽量完整填写以下信息，帮助我们快速定位问题。

        > 遵循 A1 溯源公理：所有 Bug 都需要可复现的步骤。

  - type: textarea
    id: what-happened
    attributes:
      label: Bug 描述
      description: 简明描述你遇到的问题
      placeholder: "例如：执行 metago_critique 工具时返回空结果，无错误信息"
    validations:
      required: true

  - type: textarea
    id: reproduce
    attributes:
      label: 复现步骤
      description: 详细步骤，让我们能重现这个 Bug
      placeholder: |
        1. 安装 @metago-ai/mcp-server v1.1.5
        2. 在 Trae 中调用 metago_critique 工具
        3. 输入参数：{ "content": "..." }
        4. 观察输出：...
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: 期望行为
      description: 你认为应该发生什么
      placeholder: "例如：应返回 L1-L5 分级批判性分析结果"
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: 实际行为
      description: 实际发生了什么
      placeholder: "例如：返回空对象 {}，无错误日志"
    validations:
      required: true

  - type: dropdown
    id: platform
    attributes:
      label: AI 平台
      description: 你在哪个平台使用 MetaGO？
      options:
        - Trae
        - Claude Code
        - Codex
        - Cursor
        - CodeBuddy
        - Qoder
        - ZCode
        - 其他 MCP 客户端
    validations:
      required: true

  - type: input
    id: version
    attributes:
      label: MetaGO 版本
      description: 运行 `npm list metago-lifeform` 或 `npm list @metago-ai/mcp-server` 获取版本号
      placeholder: "例如：metago-lifeform@36.7.9 / @metago-ai/mcp-server@1.1.5"
    validations:
      required: true

  - type: input
    id: node-version
    attributes:
      label: Node.js 版本
      description: 运行 `node --version` 获取
      placeholder: "例如：v22.14.0"
    validations:
      required: true

  - type: input
    id: os
    attributes:
      label: 操作系统
      placeholder: "例如：Windows 11 / macOS 14 / Ubuntu 22.04"
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: 错误日志
      description: 相关日志输出（如有）。可在 `~/.metago/logs/` 查找。
      render: shell

  - type: textarea
    id: context
    attributes:
      label: 补充信息
      description: 截图、配置文件、其他相关信息
