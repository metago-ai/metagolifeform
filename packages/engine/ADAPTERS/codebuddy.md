# CodeBuddy 平台加载协议

## 加载方式
将引擎加载为 CodeBuddy 规则文件。

## 加载步骤
1. 将 `ENGINE.md` 内容写入 `CODEBUDDY.md`
2. 将 `CONSTITUTION/`、`CORE/`、`INDEX/` 复制到 `.codebuddy/engine/`
3. 将 `ADAPTERS/codebuddy.md` 加载为 CodeBuddy 规则

## 调用方式
- AI 读取 `CODEBUDDY.md` 后被驱动（软驱动）
- 通过 `npx metago-engine verify` CLI 验证
