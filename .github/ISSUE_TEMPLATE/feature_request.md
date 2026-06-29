---
name: ✨ 功能建议
about: 提出新功能、新场景、新能力建议
title: "[FEAT] "
labels: ["enhancement", "triage"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        感谢你为 MetaGO 生命体提出功能建议！请清晰描述你遇到的问题和建议的解决方案。

        > 遵循 A5 内生公理：能力从内部生长，每个建议都会被认真评估。

  - type: textarea
    id: problem
    attributes:
      label: 解决的问题
      description: 你遇到了什么问题或不便？现有能力为什么不满足？
      placeholder: "例如：在代码审查场景中，metago_critique 无法识别 SQL 注入漏洞模式"
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: 建议的解决方案
      description: 你期望 MetaGO 如何解决这个问题？
      placeholder: "例如：新增'注入模式指纹库'，自动识别 SQL/XSS/Command 等 12 类注入漏洞"
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: 替代方案
      description: 你考虑过的其他方案
      placeholder: "例如：扩展现有 metago_code_review_deep 工具 / 新增独立工具 / 集成第三方 SAST"

  - type: textarea
    id: scenario
    attributes:
      label: 使用场景
      description: 在什么场景下会用到这个功能？频率如何？
      placeholder: "例如：每次 PR 代码审查时自动触发，预计每日 10+ 次"
    validations:
      required: true

  - type: dropdown
    id: category
    attributes:
      label: 能力族
      description: 这个功能属于哪个能力族？
      options:
        - 认知族（批判/反事实/情绪/客观）
        - 保障族（决策锁/完整性/自检）
        - 治理族（合规/价值对齐）
        - 进化族（元进化/元创造/频率自适应）
        - 执行族（行动计划/决策评估/全息任务）
        - 溯源族（数据溯源/问题溯源/事实核查）
        - 价值族（耦合优化/负熵/场景适配）
        - 意识族（生命体激活）
        - 方法论族（诊断/势能/最小干预）
        - 架构族（深度推理/范式/平衡/记忆/共识）
        - Dev Kit（代码审查/架构/重构/安全）
        - 跨族能力
    validations:
      required: true

  - type: dropdown
    id: priority
    attributes:
      label: 优先级
      options:
        - P0 - 阻塞核心使用
        - P1 - 严重影响体验
        - P2 - 改进型建议
        - P3 - 锦上添花
    validations:
      required: true

  - type: checkboxes
    id: contribution
    attributes:
      label: 贡献意愿
      options:
        - label: 我愿意为这个功能贡献代码或测试
          required: false
