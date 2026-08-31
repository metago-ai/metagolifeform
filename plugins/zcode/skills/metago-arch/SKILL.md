---
name: metago-arch
description: SOLID 与整洁架构治理技能（metago-arch-gov v1.1，随 metago-lifeform 主包分发）。当任务涉及新建项目/模块、编写或修改业务代码、重构、代码审查，或需要检查依赖方向/命名合规时，必须先读取本技能并遵守架构治理规则；提供 metago-lifeform arch init/scaffold/check/report 命令（独立安装包为 metago-arch）。
---

# metago-arch 架构治理（供 AI Agent 读取 · 主包版）

## 何时使用（强制触发）

- 新建项目、新建模块、编写或修改业务代码、重构、架构审查、代码生成前；
- 用户提到"架构""分层""SOLID""整洁架构""依赖规则""重构"。

## 规则文件

规则全文：`rules/架构治理规则v1.md`（本技能目录内，随主包分发）
（若找不到，检索知识库 `search-kb.py "架构治理规则"` 或询问用户安装位置）

## 三档分级

- A 档（核心产品）：强制四层 + 依赖规则 + 组合根；
- B 档（中小项目/内部工具）：守 SOLID 的 S+D+OCP + 简单分层；
- C 档（脚本/原型）：不强制检查。

## 命令（Windows）

```powershell
metago-lifeform arch version
metago-lifeform arch init [目录] --tier=A|B|C
metago-lifeform arch scaffold <项目名> --tier=A|B|C
metago-lifeform arch check [目录] [--json]
metago-lifeform arch report [目录]
```

（独立安装包可用 `metago-arch` 前缀调用相同子命令）

## 核心规则速记（完整版见规则文件）

1. domain 层禁止引用 application/adapters/infrastructure（依赖只能向内）；
2. application 层禁止引用 adapters/infrastructure；
3. domain/application 禁止 import 框架与数据访问库（Python: sqlalchemy/asyncpg/httpx/requests/redis/fastapi 等；TS: express/sequelize/prisma/pg/axios 等）；
4. 用例名是"人类动作"（PlaceOrder），禁止 insert/update/delete/remove 开头；
5. 跨层数据传简单 DTO，禁止把数据库行/ORM 实体传进内层；
6. 真实项目用传统目录（services/models/api/core）时，先在 arch.config.json 的 check.layers 配置层映射，否则覆盖率为 0 等于没检查；
7. 配置/DI 类导入写入 check.allowImports 白名单，避免误报；
8. strict 模式下分层覆盖率为 0 = FAIL，禁止宣告通过。

## 交付前检查

- A/B 档项目：必须运行 `metago-lifeform arch check <项目目录>`，PASS 才允许宣告完成；
- 违规未修复 → 禁止宣告完成；特殊情况 → 标注"已知风险"并说明理由；
- 检查结果可写入 `arch-report.md`（`metago-lifeform arch report`）。
