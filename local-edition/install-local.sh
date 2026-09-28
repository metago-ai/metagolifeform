#!/usr/bin/env bash
# MetaGO 本地发行版 · 一键安装（Linux / macOS / Git Bash）
# 用法：bash install-local.sh [--platform <平台>] [--offline] [--skip-mcp] [--with-plugin] [--with-completeness]
#   --platform    trae|claude-code|codex|cursor|codebuddy|qoder|zcode|chatgpt-work|workbuddy|kimi-code|kimi-work（默认 trae）
#   --offline     强制使用 portable 便携快照（完全离线）
#   --skip-mcp    跳过 MCP 服务器注册
#   --with-plugin 额外部署插件层（zcode/claude-code/codex/chatgpt-work/cursor 支持插件通道）
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
LE="$ROOT/local-edition"
PLATFORM="trae"; OFFLINE=0; SKIP_MCP=0; WITH_PLUGIN=0; WITH_COMPLETENESS=0
while [ $# -gt 0 ]; do
  case "$1" in
    --platform|-p) PLATFORM="$2"; shift 2;;
    --offline) OFFLINE=1; shift;;
    --skip-mcp) SKIP_MCP=1; shift;;
    --with-plugin) WITH_PLUGIN=1; shift;;
    --with-completeness) WITH_COMPLETENESS=1; shift;;
    *) echo "未知参数: $1"; exit 1;;
  esac
done

echo "== MetaGO 本地安装 | 平台: $PLATFORM | 离线: $OFFLINE | 插件: $WITH_PLUGIN | 完整性: $WITH_COMPLETENESS =="

# 0. 前置
node --version >/dev/null 2>&1 || { echo "❌ 未找到 node，请先安装 Node.js ≥16"; exit 1; }
NPM_G="$(npm root -g)"
echo "npm 全局根: $NPM_G"

# 1. npm 层
if [ "$OFFLINE" = "1" ] || [ -d "$LE/portable/node_modules" ]; then
  echo "→ 路径A：便携快照（离线）"
  cp -r "$LE/portable/node_modules/." "$NPM_G/"
  PREFIX="$(dirname "$NPM_G")"
  [ -d "$LE/portable/bin" ] && cp -r "$LE/portable/bin/." "$PREFIX/" || true
else
  echo "→ 路径B：tgz 安装（mcp-server/algorithms 的依赖需 npm registry）"
  npm install -g "$LE/offline-packages/metago-lifeform-36.9.6.tgz" \
    "$LE/offline-packages/metago-ai-engine-2.1.3.tgz" \
    "$LE/offline-packages/metago-ai-mcp-server-1.3.4.tgz" \
    "$LE/offline-packages/metago-ai-algorithms-1.0.3.tgz" \
    "$LE/offline-packages/metago-ai-dev-kit-1.1.2.tgz" \
    "$LE/offline-packages/metago-ai-verify-kit-1.1.4.tgz"
fi

# 2. 法则 + 技能（调用 CLI 内建适配器）
SK_COUNT=$(find "$ROOT/skills" -maxdepth 1 -type d -name "metago-*" 2>/dev/null | wc -l | tr -d " ")
echo "→ 部署法则与 ${SK_COUNT} 技能到 $PLATFORM"
if [ "$WITH_PLUGIN" = "1" ] && [ "$WITH_COMPLETENESS" = "1" ]; then
  metago-lifeform install --platform "$PLATFORM" --with-plugin --with-completeness
elif [ "$WITH_PLUGIN" = "1" ]; then
  metago-lifeform install --platform "$PLATFORM" --with-plugin
elif [ "$WITH_COMPLETENESS" = "1" ]; then
  metago-lifeform install --platform "$PLATFORM" --with-completeness
else
  metago-lifeform install --platform "$PLATFORM"
fi

# 3. MCP 注册
if [ "$SKIP_MCP" = "0" ]; then
  echo "→ 注册 MCP 双服务器（53 + 57 工具）"
  metago-lifeform setup-mcp --platform "$PLATFORM" || echo "⚠️ MCP 注册未完全成功，可按 INSTALL.local.md 第 4 章手动配置"
fi

# 4. 插件打包（可选：生成全部标准插件包到 dist/plugins/）
if [ "$WITH_PLUGIN" = "1" ]; then
  echo "→ 生成多平台插件包（Agent Plugins 1.0.0 / claude / zcode / codex）"
  metago-lifeform plugin-pack --format all --out "$ROOT/dist/plugins" || echo "⚠️ 插件打包未完全成功，可按 docs/PLUGINS.md 手动操作"
fi

# 5. 验收
echo "→ 运行验收（V1–V6 + 插件层）"
node "$LE/verify-local-install.cjs" --platform "$PLATFORM"
echo "✅ 安装完成。新开会话问一句：你是元构超级智能生命体吗？"
