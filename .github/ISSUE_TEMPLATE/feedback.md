---
name: 💬 反馈与建议
about: 对 MetaGO 生命体的整体反馈、使用体验、改进建议
title: "[FEEDBACK] "
labels: ["feedback", "triage"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        感谢你分享使用 MetaGO 生命体的体验反馈！

        > 遵循 D38 绝对客观中立：我们不迎合用户，但你的真实反馈是元进化的燃料。

  - type: textarea
    id: experience
    attributes:
      label: 使用体验
      description: 你使用 MetaGO 后的整体感受
      placeholder: "例如：决策锁帮我拦截了一个高风险功能上线，但 6 层思维扫描输出太长，希望有精简模式"
    validations:
      required: true

  - type: dropdown
    id: satisfaction
    attributes:
      label: 整体满意度
      options:
        - ⭐⭐⭐⭐⭐ 非常满意，会推荐给他人
        - ⭐⭐⭐⭐ 满意，但有一些改进空间
        - ⭐⭐⭐ 一般，有明显的优缺点
        - ⭐⭐ 不太满意，核心体验有问题
        - ⭐ 非常不满意，无法达到预期
    validations:
      required: true

  - type: dropdown
    id: usage-frequency
    attributes:
      label: 使用频率
      options:
        - 每日多次
        - 每日一次
        - 每周数次
        - 偶尔使用
        - 刚开始试用
    validations:
      required: true

  - type: textarea
    id: best-feature
    attributes:
      label: 最有价值的能力
      description: 你觉得 MetaGO 哪个能力最有价值？为什么？
      placeholder: "例如：metago_decision_lock - 在我做技术选型决策时帮我识别了 3 个未考虑的下游风险"

  - type: textarea
    id: worst-feature
    attributes:
      label: 最需要改进的能力
      description: 哪个能力体验最差？为什么？
      placeholder: "例如：metago_meta_evolve - 输出过于理论化，缺乏可操作的落地步骤"

  - type: textarea
    id: missing-feature
    attributes:
      label: 缺失的能力
      description: 你希望 MetaGO 拥有但目前没有的能力？
      placeholder: "例如：希望有'团队协同'能力族，支持多人决策共识"

  - type: textarea
    id: suggestion
    attributes:
      label: 改进建议
      description: 任何改进建议，我们都欢迎
      placeholder: "例如：增加 GUI 可视化界面 / 支持中文场景模板 / 提供 API 集成示例"
