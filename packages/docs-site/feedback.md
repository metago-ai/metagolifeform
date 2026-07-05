---
outline: [2, 3]
---

# 反馈与社区

> MetaGO 生命体的每一次进化都源自真实反馈。
>
> 遵循 **D43 数据溯源原则**，我们建立了多渠道反馈闭环；遵循 **D38 绝对客观中立**，我们不迎合用户，但真实反馈是元进化的燃料。

---

## 提交反馈

我们提供 5 类反馈渠道，覆盖不同场景和紧急程度：

### 🐛 Bug 报告

**适用场景**：工具异常、错误输出、行为不符合预期、安装失败、性能问题。

**提交渠道**：
- GitHub Issue（推荐）：[提交 Bug 报告](https://github.com/metago-ai/metagolifeform/issues/new?assignees=&labels=bug%2Ctriage&template=bug_report.md)
- Gitee Issue（国内访问）：[Gitee Issue](https://gitee.com/metago/metagolifeform/issues)

**填写要点**（遵循 A1 溯源公理）：
- 提供可复现的最小步骤
- 标注 AI 平台（Trae / Claude Code / Cursor 等）
- 附上 MetaGO 版本和 Node.js 版本
- 粘贴相关日志（`~/.metago/logs/`）

### ✨ 功能建议

**适用场景**：新能力建议、新场景扩展、现有能力改进。

**提交渠道**：
- GitHub Issue：[提交功能建议](https://github.com/metago-ai/metagolifeform/issues/new?assignees=&labels=enhancement%2Ctriage&template=feature_request.md)
- Gitee Issue：[Gitee Issue](https://gitee.com/metago/metagolifeform/issues)

**填写要点**：
- 描述解决的问题（不是直接要功能）
- 说明使用场景和频率
- 标注所属能力族（认知/保障/治理/进化/执行/溯源/价值/意识/方法论/架构/工程质量族/Dev Kit）

### 💬 整体反馈

**适用场景**：使用体验分享、满意度评价、改进方向建议。

**提交渠道**：
- GitHub Issue：[提交整体反馈](https://github.com/metago-ai/metagolifeform/issues/new?assignees=&labels=feedback%2Ctriage&template=feedback.md)

**填写要点**：
- 真实评价满意度（1-5 星）
- 指出最有价值的能力
- 指出最需要改进的能力
- 描述缺失的能力

### 📧 私密反馈

**适用场景**：商务合作、安全漏洞（遵循 responsible disclosure）、私密事宜。

**提交渠道**：metago@metago.life

**安全漏洞处理**：
- 遵循 responsible disclosure 原则
- 请勿直接公开 Issue
- 我们会在 24 小时内响应安全反馈
- 修复后会在 Release Notes 中致谢（除非你要求匿名）

### 💬 社区讨论

**适用场景**：使用问题、最佳实践、经验交流。

**提交渠道**：
- GitHub Discussions（即将上线）
- Gitee Issue（暂代讨论区）

---

## 反馈处理原则

遵循 MetaGO 生命体运行法则：

| 原则 | 应用 |
|------|------|
| **D38 绝对客观中立** | 不迎合用户，但真实反馈是元进化燃料 |
| **A1 溯源公理** | 所有 Bug 都需要可复现步骤 |
| **A2 闭环公理** | 每个 Issue 都形成"反馈→分析→修复→验证→回复"闭环 |
| **A3 元进化公理** | 反馈触发能力进化，新能力回写代码库 |
| **D42 合规主动** | 安全漏洞优先处理，法律优先于效率 |
| **D43 数据溯源** | 反馈数据被记录到 calls.jsonl 用于改进分析 |

---

## 响应时效

| 优先级 | 类型 | 响应时间 | 处理方式 |
|--------|------|---------|---------|
| P0 | 安全漏洞 / 阻塞核心使用 | 24 小时内 | 紧急修复 + Hotfix Release |
| P1 | 严重影响体验 | 72 小时内 | 评估 + 优先排期 |
| P2 | 改进型建议 | 7 天内 | 评估 + 加入 Backlog |
| P3 | 锦上添花 | 30 天内评估 | 评估 + 决策是否实施 |

---

## 社区规范

### 我们承诺

- **绝对客观中立**：不因反馈尖锐而忽视，不因反馈温和而放松
- **直接批判性**：对建议本身做批判性分析，不盲目接受
- **数据溯源**：每个反馈的处理过程可追溯
- **合规主动**：安全与法律优先于效率

### 我们期待

- 尊重他人，事实优先，不人身攻击
- 提供可复现的步骤（遵循 A1 溯源公理）
- 安全漏洞请通过邮件私密反馈，勿直接公开 Issue
- 欢迎贡献代码，PR 请附测试用例
- 反馈时请标注 MetaGO 版本和运行环境

### 贡献者致谢

每个 Release Notes 中会致谢贡献者（除非要求匿名）。贡献包括：
- 报告 Bug 并提供复现步骤
- 提出新功能建议并被采纳
- 贡献代码或测试用例
- 改进文档

---

## 反馈数据如何被使用

遵循 A1 溯源公理 + D43 数据溯源：

1. **收集**：所有反馈通过 GitHub/Gitee Issue 或邮件收集
2. **分类**：自动打标签（bug/enhancement/feedback）+ 人工分类
3. **分析**：基于 calls.jsonl 数据做关联分析，识别共性问题
4. **决策**：基于 [僵尸能力分析报告](../api/zombie-analysis) 和反馈频率做优先级排序
5. **实施**：修复 / 新功能开发 / 能力进化
6. **验证**：通过测试套件 + 运行时验证
7. **回复**：在原 Issue 中反馈处理结果
8. **记录**：写入 Release Notes 和战略执行追踪日志

---

## 联系方式汇总

| 渠道 | 地址 | 适用场景 |
|------|------|---------|
| GitHub Issues | [metago-ai/metagolifeform](https://github.com/metago-ai/metagolifeform/issues) | 国际用户 / Bug / Feature |
| Gitee Issues | [metago/metagolifeform](https://gitee.com/metago/metagolifeform/issues) | 国内用户 / 同步处理 |
| 邮件 | metago@metago.life | 商务 / 安全 / 私密 |
| 文档站 | [MetaGO 文档](https://metago.life/) | 文档查询 |
| 官网 | [MetaGO 官网](https://metago.life/) | 产品介绍 |

---

*遵循：D38 绝对客观中立 + A1 溯源公理 + A2 闭环公理 + D42 合规主动*
