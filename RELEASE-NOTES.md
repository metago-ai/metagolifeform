# MetaGO Lifeform V36.9.4 发行说明（RELEASE-NOTES）

> 发行包：`metagolifeform-local-v36.9.4.zip`（含根级 `SHA256SUMS.txt`，`sha256sum -c` 全绿）
> 发布日期：2026-09-01 ｜ 目标：**任何用户拿到本包，在任何平台用任何 Agent，都能完整、正常、无任何错误地完成安装、配置、生效，并真实可用。**

## 一、本版修复明细（发布级）

| 编号 | 问题 | 修复 |
|---|---|---|
| P0-1 | Codex MCP 配置路径写 `~/.codex/config.json`（Codex 实际读取 `config.toml`）→ MCP 永不生效 | `cli.js` / `verify-local-install.cjs` 改为 `config.toml`；新增零依赖 `scripts/mcp-toml.cjs`（TOML 段级读写：插入/更新/删除/校验，保留用户既有内容与注释）；`setup-mcp`/`verify`/`uninstall` 按平台格式（toml/json/none）分派 |
| P0-2 | 根级 `agents/` 缺失（打包回归，35 个专家子智能体丢失） | 回填 35 个 `.md`；frontmatter `name` 与文件名 100% 一致；与 plugins 四格式副本 SHA256 对拍全等（门禁 C7） |
| P0-3 | 离线子包元数据戳滞后（V36.8.x/V36.9.0） | engine/algorithms/dev-kit/verify-kit 四个 tgz 内 `metago.*_version` 戳补丁至 V36.9.4（零代码改动，重打后 MANIFEST.sha256 再生成） |
| P0-4 | 引擎"硬宪法"未同步 A37/A38/D44/D45 | `AXIOMS.md` 追加 A37/A38、`ATTRIBUTES.md` 追加 D44/D45（新增行，未改公理原文）；validator 接入 `checkFirstPrinciples`/`checkAdversarialReview`（A37/A38 与 D44/D45 同源双注册）；MCP 工具 **53→55**（新增 `metago_first_principles` / `metago_adversarial_review`，全链口径联动：INDEX/tools.json、docs/MANIFEST、生成器常量、README 公式 22+(39−7)+1=55）；verify-kit 缺陷猎杀 11→**12 维**、自检 8→**10 问**、报告模板加 **L9 对抗式审查小节**（disciplineCheck 增加 L9 门禁） |
| P1-1 | `cli.js verify` 硬编码期望版本 V36.9.2 → 装新版本必误报 FAIL | 改为动态读根 `package.json`；T4 单测（V36.9.4 法则 PASS / V36.9.3 FAIL）通过 |
| P1-2 | 文档/插件元数据旧口径（95/98 技能、八公理、v1.3.1、36.9.2/36.9.3 戳） | 全包口径统一 V36.9.4 / 100 技能 / 10 公理 9 属性；MANIFEST.json、MCP_SERVER.md、PLUGINS.md、UPGRADE.md（历史章节标注）、MAP、GETTING_STARTED、RELEASE-CHECKLIST、plugins 四 manifest + platform-matrix、adapters README、metago-activate 五副本、core/METAGO_CORE、README 徽章、package-lock —— 口径扫描器 `scripts/audit-consistency.cjs` 五类零漂移 |
| P1-3 | mcp-server 测试断言滞后（1.3.1 / 95 / 52+1=53） | `version-sync`：1.3.2；`metadata-consistency`：100 技能 / 54+1=55 工具 / 描述 55 —— 21/21 全绿 |
| P1-4 | 全局 kit 符号链接指向临时解包目录 | 见"已知限制"第 4 条（阶段 6-3 重指向，需确认后执行） |
| P1-5 | `内部蓝本目录/` 旧 1.3.1 树含硬编码令牌 | 见"已知限制"第 3 条（备份后替换 dist，需确认后执行） |
| P1-6 | 根级 `SHA256SUMS.txt` 缺失 | 发布脚本自动生成（zip 内全文件清单），`sha256sum -c` 自校验全绿 |

## 二、11 平台支持矩阵与验证级别

完整矩阵：`docs/PLATFORMS.md`（承诺书 + 测试台账）。阶段 4 矩阵 E2E：**11 平台 × 5 命令（install/verify/setup-mcp/uninstall/幂等重装）全部通过**。

| 验证级别 | 平台 |
|---|---|
| 结构级验证（配置文件结构 + 适配模板内容断言；沙盒 HOME 全链路实测） | 11/11 全覆盖（trae、claude-code、codex、cursor、codebuddy、qoder、zcode、chatgpt-work、workbuddy、kimi-code、kimi-work） |
| 真实客户端生效（T14 类问询） | 本机具备的客户端（Trae/Claude Code/Codex/Cursor/CodeBuddy/ZCode）可自行用"你是元构超级智能生命体吗？"验证；本发行包未代执行真实客户端问询（不触碰用户真实配置，由用户按需执行） |

## 三、已知限制（诚实声明）

1. **Kimi Work 官方不注入自定义 MCP**：生效通道 = 法则 + 技能 + Bash 直调（安装器按平台设计正确跳过并提示）。
2. **第十九章作者机路径说明**：法则第 19 章（Playwright MCP 24 工具）的注入说明含作者机绝对路径 `D:\MetaGO-Playwright-MCP`，非本包文件；其他平台忽略该章即可（不影响功能）。
3. **服务端令牌轮换与旧版 deprecate**：`@metago-ai/mcp-server@1.3.1` 已按泄露处理；服务端事件 API 管理令牌轮换与 npm 1.3.1 deprecate 需云端/npm 凭据，属**交付后必办**，不阻塞本包交付（1.3.2 dist 已零硬编码令牌，C13 门禁全包字节级零命中）。
4. **全局 kit 链接与旧树清理**：`metago-completeness-kit` / `metago-veracity-kit` 全局链接重指向 36.9.4 正式包、`内部蓝本目录/` 旧 1.3.1 树替换为 1.3.2 dist —— 两项均为作者机运维动作，需逐项确认后执行（不影响本包分发）。
5. **验证层次**：阶段 4 以沙盒全链路实测 + 结构断言为准；真实客户端首启问询由用户按需执行（本包不代改用户真实配置）。

## 四、离线三路径（阶段 5 实测）

- **路径 A（便携快照）**：`install-local.ps1 -Offline` 使用 `local-edition/portable/node_modules`（36.9.4 全量树，21.6MB，CLI 冒烟 v36.9.4 ✅）。
- **路径 B（tgz）**：`install-local.ps1`（无便携快照时）用 `offline-packages` 六个 tgz 安装（engine/algorithms/mcp-server/dev-kit/verify-kit 戳 V36.9.4，主包 36.9.4）。
- **路径 C（源码）**：仓库 `scripts/cli.js` 直接执行（阶段 4 矩阵即以此为载体）。

## 五、附：门禁证据

`ci-version-gate.cjs` C1–C13；`audit-consistency.cjs` 五类口径零漂移；mcp-server tests 21/21；engine 宪法校验测试 5/5；阶段 1 Codex TOML E2E 24/24；阶段 4 矩阵 11/11×5。C10（主包 tgz=36.9.4）与 C12（SHA256SUMS）随本包产出后全绿。
