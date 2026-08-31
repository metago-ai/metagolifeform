---
description: 列出 35 个元构专家团子智能体并给出派发指引（@名称 直接调用）
argument-hint: []
---

列出元构专家团子智能体并给出派发指引：

1. 读取本插件 agents/ 目录（35 个专家）。
2. 按领域分组输出：产品与设计（metago-pm 品致远 / metago-ux-designer 设灵感 / metago-ux-researcher / metago-visual-director / metago-brand-designer / metago-copywriter / metago-marketing-designer / metago-presentation-designer / metago-motion-designer / metago-ui-illustrator）、工程与架构（metago-system-architect / metago-architecture-reviewer / metago-architecture-guild-team-lead / metago-build-engineer / metago-dev-engineer / metago-test-engineer / metago-test-generator / metago-code-reviewer / metago-refactor-planner / metago-dependency-manager / metago-container-expert / metago-tech-decider）、运维与安全（metago-deploy-engineer / metago-ops-engineer / metago-sre-engineer / metago-monitoring-engineer / metago-security-engineer / metago-root-cause-analyst）、智能体与进化（metago-agent-smith / metago-evolution-expert / metago-expert-agent-lifecycle-manager）、专家扩展（metago-expert-dcv-economist / metago-expert-industrial-interconnect-engineer / metago-expert-knowledge-crystal-curator / metago-expert-world-model-architect）。
3. 每个子智能体输出一行：@名称 + 一句话专长（来自 frontmatter description）。
4. 结尾提示：在输入框用 @metago-<名称> 可直接派发该专家。
