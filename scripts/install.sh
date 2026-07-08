#!/usr/bin/env bash
# ============================================================
# MetaGO Agent Harness 一键安装脚本（Bash 版，支持 macOS/Linux/WSL）
# 支持 7 大平台：Trae / Claude Code / Codex / Cursor / CodeBuddy / Qoder / ZCode
#
# 用法：
#   ./install.sh                              自动检测平台（默认 Trae）
#   ./install.sh --platform claude-code       指定平台
#   ./install.sh --platform cursor            安装到当前项目
#   ./install.sh --force                      强制覆盖
#   ./install.sh --skip-skills                仅安装规则文件
#   ./install.sh --skills metago-critique,metago-decision-lock  仅安装指定技能
#   ./install.sh --upgrade                    升级模式（跳过备份，强制覆盖）
# ============================================================

set -e

# 元数据
METAGO_VERSION="V36.5"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_SKILLS_DIR="$SCRIPT_DIR/../skills"
SOURCE_ADAPTERS_DIR="$SCRIPT_DIR/../adapters"

# 全部 37 个技能
ALL_SKILLS=(
  "metago-action-plan"
  "metago-activate"
  "metago-architecture-design"
  "metago-balance-optimize"
  "metago-code-review-deep"
  "metago-compliance"
  "metago-consensus-prototype"
  "metago-coupling-measure"
  "metago-coupling-optimize"
  "metago-critique"
  "metago-data-provenance"
  "metago-decision-eval"
  "metago-decision-lock"
  "metago-deep-reasoning"
  "metago-developer-response"
  "metago-emotion"
  "metago-fact-check"
  "metago-frequency-adapt"
  "metago-holistic-task"
  "metago-memory-manage"
  "metago-meta-create"
  "metago-meta-evolve"
  "metago-minimal-intervention"
  "metago-momentum-weave"
  "metago-negentropy-monitor"
  "metago-objectivity"
  "metago-org-diagnosis"
  "metago-output-integrity"
  "metago-paradigm-analysis"
  "metago-problem-trace"
  "metago-refactor-suggest"
  "metago-scene-adapt"
  "metago-security-audit"
  "metago-self-check"
  "metago-value-align"
  "metago-value-assess"
  "metago-whatif"
)

# 参数默认值
PLATFORM=""
INSTALL_PATH=""
SKILLS_FILTER=""
FORCE=false
SKIP_BACKUP=false
SKIP_SKILLS=false

# 统计
INSTALLED_COUNT=0
SKIPPED_COUNT=0
FAILED_COUNT=0
BACKUP_DIR=""

# ============================================================
# 参数解析
# ============================================================
while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform|-p)
      PLATFORM="$2"
      shift 2
      ;;
    --path)
      INSTALL_PATH="$2"
      shift 2
      ;;
    --skills|-s)
      SKILLS_FILTER="$2"
      shift 2
      ;;
    --force|-f)
      FORCE=true
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --skip-skills)
      SKIP_SKILLS=true
      shift
      ;;
    --upgrade)
      FORCE=true
      SKIP_BACKUP=true
      shift
      ;;
    --help|-h)
      echo ""
      echo "  MetaGO Agent Harness 安装脚本 $METAGO_VERSION"
      echo "  用法: ./install.sh [选项]"
      echo ""
      echo "  选项:"
      echo "    -p, --platform <id>     指定平台: trae / claude-code / codex / cursor / codebuddy / qoder / zcode"
      echo "    --path <dir>            自定义安装路径"
      echo "    -s, --skills <list>     仅安装指定技能（逗号分隔）"
      echo "    -f, --force             强制覆盖已存在的配置"
      echo "    --skip-backup           跳过备份"
      echo "    --skip-skills           仅安装规则文件"
      echo "    --upgrade               升级模式（跳过备份 + 强制覆盖）"
      echo "    -h, --help              显示帮助"
      echo ""
      exit 0
      ;;
    *)
      echo "未知参数: $1（使用 --help 查看帮助）"
      exit 1
      ;;
  esac
done

# ============================================================
# 输出辅助函数
# ============================================================
step() {
  echo ""
  echo "=========================================="
  echo "  $1"
  echo "=========================================="
}

ok()    { echo "  [OK]   $1"; }
fail()  { echo "  [FAIL] $1"; }
info()  { echo "         $1"; }
detail(){ echo "    -> $1"; }

# ============================================================
# 平台配置函数
# ============================================================
get_platform_config() {
  local p="$1"
  case "$p" in
    trae)
      PLATFORM_NAME="Trae"
      PLATFORM_TYPE="user"
      PLATFORM_DEFAULT_PATH="$HOME/.trae-cn"
      PLATFORM_RULES_FILE="rules.md"
      PLATFORM_RULES_TEMPLATE="adapters/trae/rules.template.md"
      PLATFORM_SKILLS_DIR="skills"
      PLATFORM_SUPPORTS_SKILLS=true
      ;;
    claude-code)
      PLATFORM_NAME="Claude Code"
      PLATFORM_TYPE="user"
      PLATFORM_DEFAULT_PATH="$HOME/.claude"
      PLATFORM_RULES_FILE="CLAUDE.md"
      PLATFORM_RULES_TEMPLATE="adapters/claude-code/CLAUDE.md.template"
      PLATFORM_SKILLS_DIR="skills"
      PLATFORM_SUPPORTS_SKILLS=true
      ;;
    codex)
      PLATFORM_NAME="OpenAI Codex"
      PLATFORM_TYPE="user"
      PLATFORM_DEFAULT_PATH="$HOME/.codex"
      PLATFORM_RULES_FILE="AGENTS.md"
      PLATFORM_RULES_TEMPLATE="adapters/codex/AGENTS.md.template"
      PLATFORM_SKILLS_DIR=""
      PLATFORM_SUPPORTS_SKILLS=false
      ;;
    cursor)
      PLATFORM_NAME="Cursor"
      PLATFORM_TYPE="project"
      PLATFORM_DEFAULT_PATH="$(pwd)"
      PLATFORM_RULES_FILE=".cursor/rules/metago.mdc"
      PLATFORM_RULES_TEMPLATE="adapters/cursor/metago.mdc.template"
      PLATFORM_SKILLS_DIR=""
      PLATFORM_SUPPORTS_SKILLS=false
      ;;
    codebuddy)
      PLATFORM_NAME="CodeBuddy"
      PLATFORM_TYPE="project"
      PLATFORM_DEFAULT_PATH="$(pwd)"
      PLATFORM_RULES_FILE="CODEBUDDY.md"
      PLATFORM_RULES_TEMPLATE="adapters/codebuddy/CODEBUDDY.md.template"
      PLATFORM_SKILLS_DIR=".codebuddy/rules"
      PLATFORM_SUPPORTS_SKILLS=true
      ;;
    qoder)
      PLATFORM_NAME="Qoder"
      PLATFORM_TYPE="project"
      PLATFORM_DEFAULT_PATH="$(pwd)"
      PLATFORM_RULES_FILE=".qoder/rules/metago.md"
      PLATFORM_RULES_TEMPLATE="adapters/qoder/metago-rules.md.template"
      PLATFORM_SKILLS_DIR=""
      PLATFORM_SUPPORTS_SKILLS=false
      ;;
    zcode)
      PLATFORM_NAME="ZCode"
      PLATFORM_TYPE="user"
      PLATFORM_DEFAULT_PATH="$HOME/.claude"
      PLATFORM_RULES_FILE="CLAUDE.md"
      PLATFORM_RULES_TEMPLATE="adapters/zcode/CLAUDE.md.template"
      PLATFORM_SKILLS_DIR="skills"
      PLATFORM_SUPPORTS_SKILLS=true
      ;;
    *)
      return 1
      ;;
  esac
  return 0
}

# ============================================================
# 自动检测平台
# ============================================================
detect_platform() {
  if [[ -d "$HOME/.trae-cn" ]]; then echo "trae"
  elif [[ -d "$HOME/.zcode" ]]; then echo "zcode"
  elif [[ -d "$HOME/.claude" ]]; then echo "claude-code"
  elif [[ -d "$HOME/.codex" ]]; then echo "codex"
  elif [[ -d ".cursor" ]]; then echo "cursor"
  elif [[ -d ".codebuddy" ]]; then echo "codebuddy"
  elif [[ -d ".qoder" ]]; then echo "qoder"
  else echo ""; fi
}

# ============================================================
# 主流程
# ============================================================
echo ""
echo "=========================================="
echo "  MetaGO Agent Harness $METAGO_VERSION 安装程序"
echo "  元构超级智能生命体标准安装包（Bash 版）"
echo "=========================================="

# 1. 确定平台
if [[ -z "$PLATFORM" ]]; then
  PLATFORM=$(detect_platform)
  if [[ -z "$PLATFORM" ]]; then
    echo ""
    fail "未检测到任何已安装的 AI 平台"
    echo "  请使用 --platform 指定平台："
    echo "    ./install.sh --platform trae"
    echo "    ./install.sh --platform claude-code"
    echo "    ./install.sh --platform cursor"
    echo ""
    echo "  支持的平台: trae / claude-code / codex / cursor / codebuddy / qoder / zcode"
    exit 1
  fi
  info "自动检测到平台"
fi

get_platform_config "$PLATFORM" || {
  fail "未知平台: $PLATFORM"
  echo "  支持的平台: trae / claude-code / codex / cursor / codebuddy / qoder / zcode"
  exit 1
}

# 确定安装路径
if [[ -n "$INSTALL_PATH" ]]; then
  TARGET_PATH="$INSTALL_PATH"
else
  TARGET_PATH="$PLATFORM_DEFAULT_PATH"
fi

# 确定要安装的技能列表
if [[ -n "$SKILLS_FILTER" ]]; then
  IFS=',' read -ra SKILL_LIST <<< "$SKILLS_FILTER"
  # 验证技能名
  for s in "${SKILL_LIST[@]}"; do
    local_found=false
    for valid in "${ALL_SKILLS[@]}"; do
      if [[ "$s" == "$valid" ]]; then local_found=true; break; fi
    done
    if [[ "$local_found" == false ]]; then
      fail "未知技能名: $s"
      exit 1
    fi
  done
else
  SKILL_LIST=("${ALL_SKILLS[@]}")
fi

echo ""
echo "  参数配置："
echo "    Platform  : $PLATFORM ($PLATFORM_NAME)"
echo "    Path      : $TARGET_PATH"
echo "    Rules     : $PLATFORM_RULES_FILE"
echo "    Skills    : ${#SKILL_LIST[@]}/${#ALL_SKILLS[@]} 个"
echo "    Force     : $FORCE"
echo "    SkipBackup: $SKIP_BACKUP"

# ============================================================
# 步骤 1：环境检查
# ============================================================
step "步骤 1/5：环境检查"

# 检查源文件
SOURCE_RULES_TEMPLATE="$SCRIPT_DIR/../$PLATFORM_RULES_TEMPLATE"
if [[ ! -f "$SOURCE_RULES_TEMPLATE" ]]; then
  fail "源规则模板不存在: $SOURCE_RULES_TEMPLATE"
  echo "  请确认 MetaGO Agent Harness 仓库完整"
  exit 1
fi
detail "规则模板: $SOURCE_RULES_TEMPLATE"

if [[ "$PLATFORM_SUPPORTS_SKILLS" == true && "$SKIP_SKILLS" == false ]]; then
  if [[ ! -d "$SOURCE_SKILLS_DIR" ]]; then
    fail "源技能目录不存在: $SOURCE_SKILLS_DIR"
    exit 1
  fi
  detail "技能目录: $SOURCE_SKILLS_DIR"
fi

# 创建安装路径
RULES_FILE_PATH="$TARGET_PATH/$PLATFORM_RULES_FILE"
RULES_FILE_DIR="$(dirname "$RULES_FILE_PATH")"

mkdir -p "$RULES_FILE_DIR" || {
  fail "无法创建路径: $RULES_FILE_DIR"
  exit 1
}

ok "环境检查通过"

# ============================================================
# 步骤 2：备份
# ============================================================
step "步骤 2/5：备份现有配置"

if [[ "$SKIP_BACKUP" == true ]]; then
  info "已指定跳过备份"
else
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  BACKUP_DIR="$TARGET_PATH/.metago-backup-$TIMESTAMP"

  if [[ -f "$RULES_FILE_PATH" ]] || ls "$TARGET_PATH/$PLATFORM_SKILLS_DIR"/metago-* > /dev/null 2>&1; then
    mkdir -p "$BACKUP_DIR/rules" "$BACKUP_DIR/skills"

    if [[ -f "$RULES_FILE_PATH" ]]; then
      cp "$RULES_FILE_PATH" "$BACKUP_DIR/rules/$(basename "$RULES_FILE_PATH")"
      detail "已备份规则文件"
    fi

    if [[ "$PLATFORM_SUPPORTS_SKILLS" == true && -d "$TARGET_PATH/$PLATFORM_SKILLS_DIR" ]]; then
      for skill_dir in "$TARGET_PATH/$PLATFORM_SKILLS_DIR"/metago-*; do
        if [[ -d "$skill_dir" ]]; then
          cp -r "$skill_dir" "$BACKUP_DIR/skills/"
        fi
      done
      detail "已备份现有 metago 技能"
    fi

    ok "备份完成: $BACKUP_DIR"
  else
    info "无需备份（无现有配置）"
  fi
fi

# ============================================================
# 步骤 3：安装技能
# ============================================================
step "步骤 3/5：安装技能"

if [[ "$SKIP_SKILLS" == true ]]; then
  info "已指定跳过技能安装"
elif [[ "$PLATFORM_SUPPORTS_SKILLS" == false ]]; then
  info "$PLATFORM_NAME 平台不支持技能目录，跳过"
  info "规则文件中已包含技能索引，AI 会按需激活"
else
  TARGET_SKILLS_DIR="$TARGET_PATH/$PLATFORM_SKILLS_DIR"
  mkdir -p "$TARGET_SKILLS_DIR"

  TOTAL=${#SKILL_LIST[@]}
  IDX=0

  for skill_name in "${SKILL_LIST[@]}"; do
    IDX=$((IDX + 1))
    SOURCE_SKILL_PATH="$SOURCE_SKILLS_DIR/$skill_name"
    TARGET_SKILL_PATH="$TARGET_SKILLS_DIR/$skill_name"

    echo -n "  [$IDX/$TOTAL] $skill_name ... "

    if [[ ! -d "$SOURCE_SKILL_PATH" ]]; then
      echo "[源不存在]"
      FAILED_COUNT=$((FAILED_COUNT + 1))
      continue
    fi

    if [[ -d "$TARGET_SKILL_PATH" && "$FORCE" == false ]]; then
      echo "[跳过，已存在]"
      SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
      continue
    fi

    # 强制覆盖时先删除旧的
    if [[ -d "$TARGET_SKILL_PATH" && "$FORCE" == true ]]; then
      rm -rf "$TARGET_SKILL_PATH"
    fi

    cp -r "$SOURCE_SKILL_PATH" "$TARGET_SKILL_PATH"

    if [[ -f "$TARGET_SKILL_PATH/SKILL.md" ]]; then
      echo "[OK]"
      INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    else
      echo "[SKILL.md 缺失]"
      FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
  done

  echo ""
  info "安装统计: $INSTALLED_COUNT 成功 / $SKIPPED_COUNT 跳过 / $FAILED_COUNT 失败"
fi

# ============================================================
# 步骤 4：安装规则文件
# ============================================================
step "步骤 4/5：安装规则文件"

cp "$SOURCE_RULES_TEMPLATE" "$RULES_FILE_PATH" || {
  fail "规则文件安装失败"
  exit 1
}
ok "规则文件已安装: $PLATFORM_RULES_FILE"
detail "版本: $METAGO_VERSION"
detail "路径: $RULES_FILE_PATH"

# ============================================================
# 步骤 5：验证
# ============================================================
step "步骤 5/5：验证安装"

VERIFY_PASS=true

# 验证规则文件
if [[ -f "$RULES_FILE_PATH" ]]; then
  if grep -q "元构\|MetaGO" "$RULES_FILE_PATH"; then
    ok "规则文件验证通过"
  else
    fail "规则文件内容不匹配"
    VERIFY_PASS=false
  fi
else
  fail "规则文件不存在"
  VERIFY_PASS=false
fi

# 验证技能
if [[ "$PLATFORM_SUPPORTS_SKILLS" == true && "$SKIP_SKILLS" == false ]]; then
  SKILL_PASS=0
  SKILL_FAIL=0
  for skill_name in "${SKILL_LIST[@]}"; do
    SKILL_MD="$TARGET_SKILLS_DIR/$skill_name/SKILL.md"
    if [[ -f "$SKILL_MD" ]]; then
      SKILL_PASS=$((SKILL_PASS + 1))
    else
      SKILL_FAIL=$((SKILL_FAIL + 1))
    fi
  done
  if [[ $SKILL_FAIL -eq 0 ]]; then
    ok "全部 $SKILL_PASS/${#SKILL_LIST[@]} 个技能验证通过"
  else
    fail "$SKILL_FAIL/${#SKILL_LIST[@]} 个技能缺失"
    VERIFY_PASS=false
  fi
fi

# 汇总
echo ""
echo "=========================================="
if [[ "$VERIFY_PASS" == true ]]; then
  echo "  ✅ MetaGO Agent Harness $METAGO_VERSION 安装成功！"
  echo "  平台: $PLATFORM_NAME"
  echo "=========================================="
  echo ""
  echo "  元构超级智能生命体已激活。"
  echo "  请重启 $PLATFORM_NAME 以加载新配置。"
  echo ""
  echo "  验证方法：在 $PLATFORM_NAME 中对 AI 说："
  echo "    你是元构超级智能生命体吗？"
  echo "    Are you a MetaGO Super Intelligent Lifeform?"
else
  echo "  ❌ 安装未完全成功，请检查上述失败项"
  echo "=========================================="
  exit 1
fi
