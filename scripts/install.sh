#!/usr/bin/env bash
# ============================================================
# MetaGO Agent Harness 一键安装脚本（Bash 版 V36.9.1 - 转发到 cli.js）
# 支持 macOS/Linux/WSL，7 大平台：Trae / Claude Code / Codex / Cursor / CodeBuddy / Qoder / ZCode
#
# 用法：
#   ./install.sh                              默认平台（自动检测或 trae）
#   ./install.sh --platform claude-code       指定平台
#   ./install.sh --platform cursor --project-local  项目级安装
#   ./install.sh --force                      强制覆盖
#   ./install.sh --skip-backup                跳过备份
#   ./install.sh --skip-skills                仅安装规则文件
#   ./install.sh --help                       显示帮助
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_PATH="$SCRIPT_DIR/cli.js"

if [[ ! -f "$CLI_PATH" ]]; then
  echo "[错误] 找不到 cli.js: $CLI_PATH"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "[错误] 未找到 Node.js，请先安装 Node.js >= 14"
  exit 1
fi

CLI_ARGS=("$CLI_PATH" "install")

while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform|-p)
      CLI_ARGS+=("--platform" "$2")
      shift 2
      ;;
    --force|-f|--upgrade)
      CLI_ARGS+=("--force")
      shift
      ;;
    --skip-backup)
      CLI_ARGS+=("--skip-backup")
      shift
      ;;
    --skip-skills)
      CLI_ARGS+=("--skip-skills")
      shift
      ;;
    --project-local)
      CLI_ARGS+=("--project-local")
      shift
      ;;
    --help|-h)
      echo ""
      echo "MetaGO Agent Harness 安装脚本 V36.9.1"
      echo "用法: ./install.sh [选项]"
      echo ""
      echo "选项:"
      echo "  -p, --platform <id>     指定平台: trae / claude-code / codex / cursor / codebuddy / qoder / zcode"
      echo "  -f, --force             强制覆盖"
      echo "  --skip-backup           跳过备份"
      echo "  --skip-skills           仅安装规则文件"
      echo "  --project-local         项目级安装（.trae/ 目录）"
      echo "  -h, --help              显示帮助"
      echo ""
      exit 0
      ;;
    *)
      echo "未知参数: $1（使用 --help 查看帮助）"
      exit 1
      ;;
  esac
done

node "${CLI_ARGS[@]}"
exit $?
