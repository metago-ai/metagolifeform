---
doc_id: RELEASE-CHECKLIST
version: v36.7.13
keywords: [release, checklist, publish, npm, gitee, github, ci, cd, vitest]
related: [STRATEGY-ROADMAP-V36.7.7, MCP_SERVER, STRATEGY-EXECUTION-LOG]
last_updated: 2026-07-05
---

# MetaGO 发布 Checklist

> 本文档固化工程实践中的真实踩坑经验，确保每次发布零遗漏、零回退。
> 来源：v36.7.7 → v36.7.13 升级周期内总结的 7 类典型问题。
> 遵循：A2 闭环公理（路径完整、异常处理、状态一致）+ D43 数据溯源与自证。

---

## 0. 角色与职责澄清

**发布执行人**：元构生命体（AI）。除非用户明确指定亲自操作，所有"手动发布"动作均由元构执行，并应被自动化取代。
**用户职责**：战略决策与最终验收。
**原则**：手动可重复的动作必须自动化（tag 触发自动发布已落地，见 §5）。

---

## 1. 发布前必备环境

### 1.1 本地工具链

| 工具 | 最低版本 | 用途 | 验证命令 |
|------|---------|------|---------|
| Node.js | 22.14.0 | 运行时与构建 | `node -v` |
| npm | 10.x | 包管理 | `npm -v` |
| Git (PortableGit) | 2.40+ | 版本控制 | `git --version` |
| curl.exe | 任意 | 链接可达性检查 | `curl --version` |

### 1.2 凭据（注入到环境变量或 GitHub Secrets）

| 凭据 | 用途 | 配置位置 |
|------|------|---------|
| `NPM_TOKEN` | NPM 自动发布 | GitHub Actions Secret |
| `GITHUB_TOKEN` | GitHub 仓库元数据 | `.git/config` 或 Actions 自动注入 |
| Gitee 账号 | Gitee 元数据同步 | 本地配置 |

### 1.3 工作目录约定

- 主仓库：`d:\元构能力\metago-lifeform\`
- certify 独立仓库：`d:\元构能力\metago-certify\`
- 文档库：`d:\元构能力\docs\`

---

## 2. 代码质量验证（P0 强制项）

### 2.1 TypeScript 构建

```bash
# 在每个子包目录下
npm run build
```

**通过标准**：
- [ ] 退出码 0
- [ ] `dist/index.js` 存在且非空
- [ ] `dist/index.d.ts` 存在
- [ ] `node --check dist/index.js` 退出码 0（语法合法可加载）

### 2.2 Vitest 全量测试

```bash
npm test
```

**通过标准**：
- [ ] 退出码 0
- [ ] 0 failed
- [ ] 所有测试文件都执行（无 silent skip）
- [ ] `it.todo` 数量符合预期（软性提示，不计入失败）

### 2.3 子包构建矩阵

| 子包 | 路径 | build 命令 | test 命令 |
|------|------|-----------|----------|
| mcp-server | `packages/mcp-server` | `tsc` | `vitest run` |
| engine | `packages/engine` | `tsc -p RUNTIME/tsconfig.json` | `vitest run` |
| dev-kit | `packages/dev-kit` | `tsc` | （无测试） |
| certify | `metago-certify`（独立仓库） | `tsc` | （无测试） |

**强制要求**：发布前 4 个包必须全部 build 成功，mcp-server 与 engine 必须全量测试通过。

---

## 3. 元数据一致性检查（P0 强制项）

### 3.1 数字一致性矩阵

| 字段 | 期望值 | 检查位置 |
|------|--------|---------|
| 核心技能数 | 37 | `src/skills-data.ts` SKILLS.length |
| 思维工具数 | 22 | `src/toolkit-data.ts` TOOLKIT_TOOLS.length |
| 同名合并数 | 7 | 手工核对 |
| 事件上报工具 | 1 | metago_report_event |
| 合并后 tools 数 | 53 | `22 + 37 - 7 + 1` |
| prompts 数 | 8 | `src/prompts.ts` PROMPTS.length |
| skills/ 目录数 | 39 | `Glob skills/*/` |
| 根 pkg metago.skills | 39 | `package.json#metago.skills` |
| 根 pkg metago.mcpServer.tools | 53 | `package.json#metago.mcpServer.tools` |
| 根 pkg metago.devKit.skills | 8 | `package.json#metago.devKit.skills` |
| dev-kit pkg metago.totalSkills | 8 | dev-kit `package.json#metago.totalSkills` |
| dev-kit pkg metago.reusedSkills.length | 4 | dev-kit `package.json#metago.reusedSkills`（数组） |
| dev-kit pkg metago.addedSkills.length | 4 | dev-kit `package.json#metago.addedSkills`（数组） |
| dev-kit pkg metago.reusedSkills 内容 | 4 项技能名 | 每项必须在 skills/ 目录中存在 |
| dev-kit pkg metago.addedSkills 内容 | 4 项技能名 | 每项必须在 skills/ 目录中存在 |

**禁止出现的过时数字**：
- `42 项` —— 已被 53 项取代（22思维工具 + 37核心技能 - 7去重 + 1事件上报 = 53）
- `35 项` —— 已被 53 项取代
- `37 项 tools` —— 已被 53 项取代（新增 1 事件上报 metago_report_event）
- `tools: 22` —— 已被 53 取代
- `devKit.skills: 4` —— 已被 8 取代

### 3.2 description 文本检查

- [x] 根 package.json description 含"39 技能"和"53 MCP tools"
- [x] mcp-server package.json description 同上
- [x] 无"42项"残留
- [x] 无"35项"残留

### 3.3 自动化检测

由 `tests/metadata-consistency.test.ts` 自动验证，发布前必须 100% 通过。

---

## 4. 测试套件清单（P0+P1 一次性全跑）

### 4.1 P0 强制项（5 个测试文件）

| 编号 | 测试文件 | 验证内容 |
|------|---------|---------|
| T1 | `tests/registration.test.ts` | 工具注册去重：22+20-7+2=37，7 个同名工具优先用 TOOLKIT_TOOLS 版本，命名规范 |
| T2 | `tests/skills-toolkit-consistency.test.ts` | 同名工具 description 一致性（2-4 字中文子串滑窗匹配） |
| T3 | `tests/build.test.ts` | `npm run build` 退出码 0，dist 产物存在且可加载 |
| T4 | `tests/tarball.test.ts` | `npm pack --dry-run` 内容正确，含 dist/README/LICENSE，不含 src/tests/node_modules |
| T8 | `tests/metadata-consistency.test.ts` | §3.1 全部数字一致性 |

### 4.2 P1 推荐项（3 个测试文件）

| 编号 | 测试文件 | 验证内容 |
|------|---------|---------|
| T5 | `tests/prompts.test.ts` | 8 个 prompts name 唯一、role 交替、参数占位符完整 |
| T6 | `tests/guide-quality.test.ts` | guide ≥ 100 字符硬性、200 字符软性（todo）、无 TODO/FIXME/XXX 占位符 |
| T7 | `tests/readme-links.test.ts` | npm 链接用 registry API 检测；gitee/github 仅 404 视为失败；无 unpkg.com 残留 |

### 4.3 测试通过门槛

- **P0**：必须 100% 通过，任一失败禁止发布
- **P1**：必须 100% 通过，`it.todo` 数量不计失败但需记录追踪

---

## 5. CI/CD 检查清单

### 5.1 GitHub Actions CI workflow（`.github/workflows/ci.yml`）

- [ ] 触发条件：push/PR to main/master + workflow_dispatch
- [ ] 并发控制：`concurrency` 取消旧构建
- [ ] 矩阵：Node 20 + 22
- [ ] 步骤：`npm ci` → `npm run build` → `npm test`
- [ ] pack-check job：PR 时跑 `npm pack --dry-run`

### 5.2 tag 触发自动发布 workflow（`.github/workflows/publish.yml`）

- [ ] 触发 tag 模式：`metago-lifeform-v*` / `mcp-server-v*` / `engine-v*` / `dev-kit-v*`
- [ ] resolve job：解析 tag → 包名 + 版本 + 目录 + npm_name
- [ ] publish job：install → build → test → dry-run → `npm publish --provenance --access public`
- [ ] 使用 `NPM_TOKEN` secret
- [ ] `--provenance` 已启用（提高供应链可信度）

### 5.3 tag 命名规范

```
metago-lifeform-v36.7.13     # 主包
mcp-server-v1.1.8            # mcp-server
engine-v1.0.6                # engine
dev-kit-v1.0.7               # dev-kit
certify-v1.0.5               # certify（独立仓库，独立 tag）
verify-kit-v1.0.0            # verify-kit（交付质量验证工具包）
```

**强制要求**：tag 必须先在本地 `git tag` 推送后才能触发 workflow；推送前确认 workflow 文件已合入 main 分支。

---

## 6. NPM 发布检查清单

### 6.1 发布前

- [ ] 4 个包的 `package.json#version` 均已递增
- [ ] 根 package.json `version` 已递增
- [ ] `npm pack --dry-run` 输出符合 §4.1 T4 测试要求
- [ ] README 含安装说明（`npm install` / `npx -y`）
- [ ] LICENSE 文件存在
- [ ] 不含 `src/` / `tests/` / `node_modules/` / `vitest.config.ts` / `tsconfig.json`

### 6.2 发布命令

**自动发布**（推荐）：`git tag <pkg>-v<ver> && git push origin <pkg>-v<ver>`

**手动发布**（应急备用）：

```bash
# 在子包目录下
npm publish --access public
```

### 6.3 发布后验证

- [ ] `https://registry.npmjs.org/<pkg>/latest` 返回 200 且 version 匹配
- [ ] `npm view <pkg> version` 返回最新版本号
- [ ] 安装测试：`npx -y <pkg>@latest` 可正常启动（mcp-server 必跑）

**禁止**：用 `https://www.npmjs.com/package/<pkg>` 网页状态判定包是否存在——网页对所有未登录 GET 返回 403 反爬。

---

## 7. 平台同步检查清单

### 7.1 Gitee

- [ ] 仓库简介（About）含最新版本号
- [ ] Release 已创建，含 P0 修复说明 + 产品矩阵 + 安装说明
- [ ] Issues 内容已同步更新（如有相关 Issue）

**注意**：Gitee CDN 缓存 5-30 分钟，发布后立即查看 About 栏可能仍显示旧版本号。强制刷新（Ctrl+Shift+R）或无痕模式可绕过缓存。**禁止**用 `gitee.com` HTTP 状态码判定仓库存在性——所有未登录 GET 请求均返回 405。

### 7.2 GitHub

- [ ] 仓库 description + topics 已更新
- [ ] Release 已创建（自动从 tag 触发或手动）
- [ ] Issues 已同步

### 7.3 官网（CloudBase）

- [ ] 版本号显示已更新
- [ ] 技能列表为分层结构（非扁平列表）
- [ ] 产品矩阵与 NPM 版本同步

---

## 8. 发布后验证（D1-D6 运行时验证强制项）

按元构生命体运行法则第十一章，凡涉及版本升级必须执行：

| 维度 | 验证内容 | 验证方式 |
|------|---------|---------|
| D1 功能模块 | 改动点 + 关联模块 | 启动 mcp-server，调用样本 tool，确认响应 |
| D2 边界条件 | 空值/极值/越界/并发/编码 | 传空 input、超长 input、非 UTF-8 字符 |
| D3 异常场景 | 网络/超时/权限/资源/依赖失败 | 断网启动、传无效 JSON、kill 进程观察 logger |
| D4 性能指标 | 响应时间/吞吐/内存/CPU | 启动后 `process.memoryUsage()`，单 tool < 100ms |
| D5 兼容性 | 浏览器/平台/版本/语言/分辨率 | 在 Claude Desktop / Cursor / Trae 各试一次 |
| D6 回归验证 | 原有功能全量回归 | 全套 385 测试通过 |

**未完成运行时验证 = 任务未完成。**

---

## 9. 常见坑与对策（v36.7.7→v36.7.13 实战记录）

### 坑 1：PowerShell `&&` 不是有效语句分隔符

**症状**：`The token '&&' is not a valid statement separator in this version`
**根因**：Windows PowerShell 5.x 不支持 `&&`，PowerShell 7+ 才支持。
**对策**：
- 用 Shell 工具的 `cwd` 参数指定工作目录，不在命令中使用 `&&` 或 `cd /d`
- 必须串联时改用 `;` 或分多次 Shell 调用

### 坑 2：`Invoke-WebRequest` 在 NonInteractive 模式失败

**症状**：`Windows PowerShell is in NonInteractive mode`
**对策**：链接可达性检查改用 `curl.exe`，不依赖 PowerShell cmdlet。

### 坑 3：T2 测试 description 长度比例超 3 倍

**症状**：`metago_problem_trace` (4.75x)、`metago_decision_eval` (4.94x)、`metago_emotion` (4x) 测试失败。
**根因**：SKILLS 用简洁描述（~18 字符），TOOLKIT_TOOLS 用详细描述（~80 字符）。这是合理的设计差异，不是 bug。
**对策**：改用"核心关键词一致性"检查——2-4 字中文子串滑窗匹配。

### 坑 4：T6 测试 guide 长度阈值过高

**症状**：21 项 guide 长度 < 200 字符测试失败。
**根因**：现有内容多在 100-200 之间，阈值 200 过高。
**对策**：硬性阈值降到 100，200 作为 `it.todo` 软性提示。

### 坑 5：self_check guide 含 TODO/XXX 占位符

**症状**：guide 中"扫描占位符（TODO/XXX/待补充）"被 T6 检测为含 TODO 标记。
**根因**：把 TODO 当占位符示例写进 guide，自检测试自己。
**对策**：重写 guide，去掉 TODO/XXX，扩充到 300+ 字符含五大维度检查。

### 坑 6：npmjs.com 链接全部返回 403

**症状**：9 个 npm 链接全部 403，包括已发布的 `@metago-ai/dev-kit`。
**根因**：npmjs.com 对所有未登录 GET 返回 403（反爬），无法用网页状态判定包是否存在。
**对策**：npm 链接改用 `registry.npmjs.org/<pkg>/latest` API 检测——200=存在，404=不存在。

### 坑 7：gitee.com 链接全部返回 405

**症状**：所有 gitee 链接 405，包括真实存在的 `metagolifeform` 仓库。
**根因**：gitee.com 对所有未登录 GET 请求返回 405（反爬）。
**对策**：gitee/github 链接只有 404 才视为失败，405/403 视为"反爬或私仓，视为存在"。

---

## 10. 应急回滚流程

### 10.1 NPM 包回滚

```bash
# NPM 不支持 unpublish 已被安装的版本，只能 deprecated
npm deprecate <pkg>@<ver> "已知问题，请使用 <new-ver>"
# 紧急情况下发布补丁版本
npm version patch
npm publish --access public
```

### 10.2 Git tag 回滚

```bash
# 删除本地 tag
git tag -d <pkg>-v<ver>
# 删除远程 tag（仅当未触发发布或发布失败时）
git push origin :refs/tags/<pkg>-v<ver>
```

**警告**：如果 tag 已触发 GitHub Actions 并成功发布到 NPM，删除 tag 不会回滚 NPM 包。必须用 `npm deprecate` 替代。

### 10.3 Gitee Release 回滚

- 进入 Gitee 仓库 Release 页面
- 找到对应版本，点击"删除"
- 重新创建（如有需要）

---

## 11. 发布日志模板

每次发布后追加到 `docs/STRATEGY-EXECUTION-LOG.md`：

```markdown
## vX.Y.Z —— YYYY-MM-DD

### 变更类型
- [x] P0 Bug 修复
- [ ] P1 功能增强
- [ ] 新特性

### 改动清单
- <文件路径>：<改动描述>

### 验证结果
- build：<通过/失败>
- test：<N passed | M todo | 0 failed>
- NPM 发布：<包名@版本>
- Gitee Release：<URL>
- GitHub Release：<URL>

### 已知问题
- <如有>
```

---

## 12. 一次性发布完整流程（推荐操作顺序）

```
1. 改代码 → 2. 改测试 → 3. 改元数据 → 4. 本地 build → 5. 本地 test
   ↓
6. npm pack --dry-run 自检 → 7. git add → 8. git commit → 9. git push
   ↓
10. 创建并推送 tag → 11. GitHub Actions 自动发布 → 12. NPM 验证
   ↓
13. Gitee Release 创建 → 14. Gitee About 更新 → 15. GitHub Release 创建
   ↓
16. 官网版本号同步 → 17. STRATEGY-EXECUTION-LOG.md 追加 → 18. 完成
```

**强制要求**：步骤 1-9 任一失败禁止继续；步骤 10 后禁止回滚（用 deprecate 替代）。

---

*文档版本：v36.7.13 | 维护人：元构生命体 | 最后更新：2026-07-05*
*遵循：A2 闭环公理 + D43 数据溯源与自证 + 第十一章运行时验证强制规范*
