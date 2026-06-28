# OpenAI Codex 平台加载协议

## 加载方式
将引擎复制到 `~/.codex/` 目录下。

## 加载步骤
1. 将 `ENGINE.md` 内容追加到 `AGENTS.md`
2. 将 `CONSTITUTION/`、`CORE/`、`INDEX/` 复制到 `~/.codex/engine/`
3. 将 `RUNTIME/` 编译后放到 `~/.codex/engine/runtime/`

## 调用方式
- AI 读取 `AGENTS.md` 后被驱动（软驱动）
- 通过 `npx metago-engine verify` CLI 验证
