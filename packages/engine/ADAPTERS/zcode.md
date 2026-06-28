# ZCode 平台加载协议

## 加载方式
将引擎加载到 `~/.claude/` 目录下（ZCode 复用 Claude 配置）。

## 加载步骤
1. 将 `ENGINE.md` 内容追加到 `CLAUDE.md`
2. 将 `CONSTITUTION/`、`CORE/`、`INDEX/` 复制到 `~/.claude/engine/`
3. 将 `ADAPTERS/zcode.md` 加载为 ZCode 规则

## 调用方式
- AI 读取 `CLAUDE.md` 后被驱动（软驱动）
- 通过 `npx metago-engine verify` CLI 验证
