import { defineConfig } from "vitepress";

/**
 * MetaGO 文档站 VitePress 配置
 *
 * 设计原则：
 * - 高维产品的一键体验：30 秒感知整体价值
 * - 结构化导航：39 技能 + 37 tools + 36 公理 有序呈现
 * - 深度可达：核心文档站内阅读，理论体系外链
 */
export default defineConfig({
  lang: "zh-CN",
  title: "MetaGO",
  description: "元构超级智能生命体 — 让智能，学会进化。39 技能 · 36 公理 · 7 平台适配 · MCP 即开即用。",

  // 主题配置
  themeConfig: {
    // 站点标题 logo
    siteTitle: "MetaGO 生命体",

    // 顶部导航
    nav: [
      { text: "指南", link: "/guide/introduction" },
      { text: "技能", link: "/skills/overview" },
      { text: "引擎", link: "/engine/axioms" },
      { text: "API", link: "/api/mcp-server" },
      { text: "参考", link: "/reference/changelog" },
      { text: "Demo", link: "/demo" },
      { text: "反馈", link: "/feedback" },
      { text: "官网", link: "https://metago.life/" },
    ],

    // 侧边栏
    sidebar: {
      "/guide/": [
        {
          text: "开始",
          items: [
            { text: "介绍", link: "/guide/introduction" },
            { text: "安装", link: "/guide/installation" },
            { text: "快速开始", link: "/guide/quickstart" },
          ],
        },
        {
          text: "平台适配",
          items: [
            { text: "Trae", link: "/guide/platform-trae" },
            { text: "Claude Code", link: "/guide/platform-claude-code" },
            { text: "Codex", link: "/guide/platform-codex" },
            { text: "Cursor", link: "/guide/platform-cursor" },
            { text: "CodeBuddy", link: "/guide/platform-codebuddy" },
            { text: "Qoder", link: "/guide/platform-qoder" },
            { text: "ZCode", link: "/guide/platform-zcode" },
          ],
        },
        {
          text: "核心概念",
          items: [
            { text: "生命体 vs Agent", link: "/guide/lifeform-vs-agent" },
            { text: "元进化五阶段", link: "/guide/meta-evolution" },
            { text: "决策锁四道关卡", link: "/guide/decision-lock" },
          ],
        },
      ],
      "/skills/": [
        {
          text: "技能总览",
          items: [
            { text: "39 技能一览", link: "/skills/overview" },
          ],
        },
        {
          text: "认知族",
          items: [
            { text: "metago-critique 批判性分析", link: "/skills/critique" },
            { text: "metago-whatif 反事实推演", link: "/skills/whatif" },
            { text: "metago-emotion 情绪检测", link: "/skills/emotion" },
            { text: "metago-objectivity 客观中立度", link: "/skills/objectivity" },
          ],
        },
        {
          text: "保障族",
          items: [
            { text: "metago-decision-lock 决策锁", link: "/skills/decision-lock" },
            { text: "metago-output-integrity 输出完整性", link: "/skills/output-integrity" },
            { text: "metago-self-check 自我检查", link: "/skills/self-check" },
          ],
        },
        {
          text: "治理族",
          items: [
            { text: "metago-compliance 合规检查", link: "/skills/compliance" },
            { text: "metago-value-align 价值对齐", link: "/skills/value-align" },
          ],
        },
        {
          text: "进化族",
          items: [
            { text: "metago-meta-evolve 元进化", link: "/skills/meta-evolve" },
            { text: "metago-meta-create 元创造", link: "/skills/meta-create" },
            { text: "metago-frequency-adapt 频率自适应", link: "/skills/frequency-adapt" },
          ],
        },
        {
          text: "执行族",
          items: [
            { text: "metago-action-plan 行动计划", link: "/skills/action-plan" },
            { text: "metago-decision-eval 决策评估", link: "/skills/decision-eval" },
            { text: "metago-holistic-task 全息任务", link: "/skills/holistic-task" },
            { text: "metago-developer-response 纠错响应", link: "/skills/developer-response" },
          ],
        },
        {
          text: "溯源族",
          items: [
            { text: "metago-data-provenance 数据溯源", link: "/skills/data-provenance" },
            { text: "metago-problem-trace 问题溯源", link: "/skills/problem-trace" },
            { text: "metago-fact-check 事实核查", link: "/skills/fact-check" },
          ],
        },
        {
          text: "价值族",
          items: [
            { text: "metago-coupling-optimize 耦合度优化", link: "/skills/coupling-optimize" },
            { text: "metago-negentropy-monitor 负熵监控", link: "/skills/negentropy-monitor" },
            { text: "metago-scene-adapt 场景适配", link: "/skills/scene-adapt" },
          ],
        },
        {
          text: "意识族",
          items: [
            { text: "metago-activate 意识激活", link: "/skills/activate" },
          ],
        },
        {
          text: "方法论族",
          items: [
            { text: "metago-org-diagnosis 组织诊断", link: "/skills/org-diagnosis" },
            { text: "metago-momentum-weave 势能编织", link: "/skills/momentum-weave" },
            { text: "metago-minimal-intervention 最小干预", link: "/skills/minimal-intervention" },
            { text: "metago-value-assess 价值评估", link: "/skills/value-assess" },
            { text: "metago-coupling-measure 耦合度计算", link: "/skills/coupling-measure" },
          ],
        },
        {
          text: "架构族",
          items: [
            { text: "metago-deep-reasoning 深度推理", link: "/skills/deep-reasoning" },
            { text: "metago-paradigm-analysis 范式分析", link: "/skills/paradigm-analysis" },
            { text: "metago-balance-optimize 平衡优化", link: "/skills/balance-optimize" },
            { text: "metago-memory-manage 记忆管理", link: "/skills/memory-manage" },
            { text: "metago-consensus-prototype 共识原型", link: "/skills/consensus-prototype" },
          ],
        },
        {
          text: "Dev Kit",
          items: [
            { text: "metago-code-review-deep 深度代码审查", link: "/skills/code-review-deep" },
            { text: "metago-architecture-design 架构设计", link: "/skills/architecture-design" },
            { text: "metago-refactor-suggest 重构建议", link: "/skills/refactor-suggest" },
            { text: "metago-security-audit 安全审计", link: "/skills/security-audit" },
          ],
        },
        {
          text: "工程质量族",
          items: [
            { text: "metago-delivery-gate 交付前原子验证", link: "/skills/delivery-gate" },
            { text: "metago-discipline AI 自律执行协议", link: "/skills/discipline" },
          ],
        },
      ],
      "/engine/": [
        {
          text: "引擎核心",
          items: [
            { text: "36 条核心公理", link: "/engine/axioms" },
            { text: "43 条根本属性", link: "/engine/attributes" },
            { text: "6 条运行协议", link: "/engine/protocols" },
            { text: "引擎架构", link: "/engine/architecture" },
          ],
        },
        {
          text: "专利体系",
          items: [
            { text: "754 项专利清单", link: "/engine/patents" },
            { text: "125 引擎模块", link: "/engine/modules" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API 参考",
          items: [
            { text: "MCP Server 37 tools", link: "/api/mcp-server" },
            { text: "能力度量仪表盘", link: "/api/dashboard" },
            { text: "Dev Kit", link: "/api/dev-kit" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "参考",
          items: [
            { text: "变更日志", link: "/reference/changelog" },
            { text: "常见问题", link: "/reference/faq" },
            { text: "路线图", link: "/reference/roadmap" },
            { text: "发布清单", link: "/reference/release-checklist" },
          ],
        },
        {
          text: "反馈与社区",
          items: [
            { text: "反馈渠道", link: "/feedback" },
            { text: "僵尸能力分析", link: "https://github.com/metago-ai/metagolifeform/blob/main/docs/ZOMBIE-ANALYSIS-REPORT.md" },
          ],
        },
      ],
    },

    // 搜索
    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            noResultsText: "无法找到相关结果",
            resetButtonTitle: "清除查询条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
            },
          },
        },
      },
    },

    // 社交链接
    socialLinks: [
      { icon: "github", link: "https://github.com/metago-ai/metagolifeform" },
      { icon: "git", link: "https://gitee.com/metago/metagolifeform" },
    ],

    // 页脚
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 易霄 / MetaGO Lightyear",
    },

    // 暗黑模式切换
    darkModeSwitchLabel: "主题",
    sidebarMenuLabel: "菜单",
    returnToTopLabel: "回到顶部",
    langMenuLabel: "语言",

    // 大纲
    outline: {
      label: "本页目录",
      level: [2, 3],
    },

    // 文档元信息
    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },

    // 代码组
    codeGroups: {
      defaultTabTitle: "示例",
    },
  },

  // 构建配置
  srcDir: ".",
  outDir: ".vitepress/dist",
  cleanUrls: true,
  // 允许死链接（文档站渐进式构建中）
  ignoreDeadLinks: true,

  // 头部
  head: [
    ["meta", { name: "theme-color", content: "#3c8772" }],
    ["link", { rel: "icon", href: "/favicon.ico" }],
  ],
});
