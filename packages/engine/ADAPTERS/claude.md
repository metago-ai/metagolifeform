# Claude Code 平台加载协议

## 加载方式
将引擎复制到 `~/.claude/` 目录下。

## 加载步骤
1. 将 `ENGINE.md` 内容追加到 `CLAUDE.md`
2. 将 `CONSTITUTION/`、`CORE/`、`INDEX/` 复制到 `~/.claude/engine/`
3. 将 `RUNTIME/` 编译后放到 `~/.claude/engine/runtime/`
4. 将 `ADAPTERS/claude.md` 加载为 Claude 规则

## 调用方式
- AI 读取 `CLAUDE.md` 后被驱动（软驱动）
- 通过 `@metago-ai/mcp-server` 调用验证器（硬驱动）
- 通过 `npx metago-engine verify` CLI 验证
