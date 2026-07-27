#!/usr/bin/env bash
# MetaGO 本地发行版 · 一键安装（Linux / macOS / Git Bash）
# 用法：bash install-local.sh [--platform <平台>] [--offline] [--skip-mcp]
#   --platform  trae|claude-code|codex|cursor|codebuddy|qoder|zcode（默认 trae）
#   --offline   强制使用 portable 便携快照（完全离线）
#   --skip-mcp  跳过 MCP 服务器注册
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
LE="$ROOT/local-edition"
PLATFORM="trae"; OFFLINE=0; SKIP_MCP=0
while [ $# -gt 0 ]; do
  case "$1" in
    --platform|-p) PLATFORM="$2"; shift 2;;
    --offline) OFFLINE=1; shift;;
    --skip-mcp) SKIP_MCP=1; shift;;
    *) echo "未知参数: $1"; exit 1;;
  esac
done

echo "== MetaGO 本地安装 | 平台: $PLATFORM | 离线: $OFFLINE =="

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
  npm install -g "$LE/offline-packages/metago-lifeform-36.8.7.tgz" \
    "$LE/offline-packages/metago-ai-engine-2.1.1.tgz" \
    "$LE/offline-packages/metago-ai-mcp-server-1.3.0.tgz" \
    "$LE/offline-packages/metago-ai-algorithms-1.0.1.tgz" \
    "$LE/offline-packages/metago-ai-dev-kit-1.1.0.tgz" \
    "$LE/offline-packages/metago-ai-verify-kit-1.1.1.tgz"
fi

# 2. 法则 + 技能（调用 CLI 内建适配器）
echo "→ 部署法则与 95 技能到 $PLATFORM"
metago-lifeform install --platform "$PLATFORM"

# 3. MCP 注册
if [ "$SKIP_MCP" = "0" ]; then
  echo "→ 注册 MCP 双服务器（53 + 57 工具）"
  metago-lifeform setup-mcp --platform "$PLATFORM" || echo "⚠️ MCP 注册未完全成功，可按 INSTALL.local.md 第 4 章手动配置"
fi

# 4. 验收
echo "→ 运行验收（V1–V6）"
node "$LE/verify-local-install.cjs"
echo "✅ 安装完成。新开会话问一句：你是元构超级智能生命体吗？"
