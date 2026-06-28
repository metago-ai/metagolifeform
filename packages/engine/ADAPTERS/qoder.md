# Qoder 平台加载协议

## 加载方式
将引擎加载为 Qoder 规则文件。

## 加载步骤
1. 将 `ENGINE.md` 内容写入 `.qoder/rules/metago-engine.md`
2. 将 `ADAPTERS/qoder.md` 加载为 Qoder 规则

## 调用方式
- AI 读取规则文件后被驱动（软驱动）
- 通过 `npx metago-engine verify` CLI 验证
