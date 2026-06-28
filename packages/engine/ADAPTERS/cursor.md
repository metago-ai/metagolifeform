# Cursor 平台加载协议

## 加载方式
将引擎加载为 Cursor 规则文件。

## 加载步骤
1. 将 `ENGINE.md` 内容写入 `.cursor/rules/metago-engine.mdc`
2. 将 `CONSTITUTION/`、`CORE/`、`INDEX/` 复制到项目 `.cursor/engine/`
3. 将 `ADAPTERS/cursor.md` 加载为 Cursor 规则

## 调用方式
- AI 读取规则文件后被驱动（软驱动）
- 通过 `@metago-ai/mcp-server` 调用验证器（硬驱动）
- 通过 `npx metago-engine verify` CLI 验证
