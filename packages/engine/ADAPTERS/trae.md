# Trae 平台加载协议

## 加载方式
将引擎复制到 `~/.trae-cn/` 目录下。

## 加载步骤
1. 将 `ENGINE.md` 内容追加到 `AGENTS.md`
2. 将 `CONSTITUTION/`、`CORE/`、`INDEX/` 复制到 `~/.trae-cn/engine/`
3. 将 `RUNTIME/` 编译后放到 `~/.trae-cn/engine/runtime/`
4. 将 `ADAPTERS/trae.md` 加载为 Trae 规则

## 调用方式
- AI 读取 `AGENTS.md` 后被驱动（软驱动）
- 通过 `@metago-ai/mcp-server` 调用验证器（硬驱动）
- 通过 `npx metago-engine verify` CLI 验证

## 验证命令
```bash
npx metago-engine status
```
