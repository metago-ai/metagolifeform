﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<#
.SYNOPSIS
    MetaGO Lifeform Kit 一键安装脚本（支持7大平台）

.DESCRIPTION
    将元构超级智能生命体 Kit 安装到指定平台，包含：
    - 平台检测与路径适配（Trae/Claude Code/Codex/Cursor/CodeBuddy/Qoder/ZCode）
    - 备份现有配置（rules 文件与 metago-* 技能）
    - 安装 37 个 metago 技能（仅支持技能的平台）
    - 升级平台规则文件
    - 创建知识晶体索引模板（仅 Trae）
    - 安装 MCP 调度映射（仅 Trae）
    - 验证安装结果

.PARAMETER Platform
    目标平台，可选值：trae、claude-code、codex、cursor、codebuddy、qoder、zcode
    默认：trae

.PARAMETER InstallPath
    自定义安装路径（覆盖平台默认路径）

.PARAMETER Skills
    指定要安装的技能列表（逗号分隔），默认安装全部22个
    示例：-Skills metago-critique,metago-decision-lock

.PARAMETER Upgrade
    升级模式：跳过备份，强制覆盖已存在的技能与规则

.PARAMETER Force
    强制覆盖已存在的 metago 技能目录

.PARAMETER SkipBackup
    跳过备份步骤，直接安装

.PARAMETER SkipSkills
    跳过技能安装，仅安装规则文件

.EXAMPLE
    .\scripts\install.ps1
    使用默认平台（Trae）安装

.EXAMPLE
    .\scripts\install.ps1 -Platform claude-code
    安装到 Claude Code 平台

.EXAMPLE
    .\scripts\install.ps1 -Platform cursor
    安装到 Cursor 平台（仅规则文件，Cursor 不支持技能目录）

.EXAMPLE
    .\scripts\install.ps1 -Platform trae -Skills metago-critique,metago-decision-lock
    仅安装指定技能到 Trae

.EXAMPLE
    .\scripts\install.ps1 -Platform trae -Upgrade
    升级现有 Trae 安装（跳过备份，强制覆盖）

.NOTES
    版本：V36.5
    作者：易霄 / MetaGO Lightyear
#>

[CmdletBinding()]
param(
    [ValidateSet('trae','claude-code','codex','cursor','codebuddy','qoder','zcode')]
    [string]$Platform = 'trae',

    [string]$InstallPath,

    [string]$Skills,

    [switch]$Upgrade,

    [switch]$Force,

    [switch]$SkipBackup,

    [switch]$SkipSkills
)

$ErrorActionPreference = "Stop"

# ============================================================
# 元数据
# ============================================================
$script:MetaGoVersion = "V36.6"

# 全部39个技能清单（37个核心技能 + 2个交付质量技能）
$script:AllSkills = @(
    "metago-action-plan",
    "metago-compliance",
    "metago-coupling-optimize",
    "metago-critique",
    "metago-data-provenance",
    "metago-decision-eval",
    "metago-decision-lock",
    "metago-developer-response",
    "metago-emotion",
    "metago-fact-check",
    "metago-frequency-adapt",
    "metago-holistic-task",
    "metago-meta-create",
    "metago-meta-evolve",
    "metago-negentropy-monitor",
    "metago-objectivity",
    "metago-output-integrity",
    "metago-problem-trace",
    "metago-scene-adapt",
    "metago-self-check",
    "metago-value-align",
    "metago-whatif",
    "metago-activate",
    "metago-org-diagnosis",
    "metago-momentum-weave",
    "metago-minimal-intervention",
    "metago-value-assess",
    "metago-coupling-measure",
    "metago-deep-reasoning",
    "metago-paradigm-analysis",
    "metago-balance-optimize",
    "metago-memory-manage",
    "metago-consensus-prototype",
    "metago-architecture-design",
    "metago-code-review-deep",
    "metago-refactor-suggest",
    "metago-security-audit",
    "metago-delivery-gate",
    "metago-discipline"
)

# 解析 -Skills 参数
if ($Skills) {
    $script:SkillList = $Skills -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
    # 验证技能名
    foreach ($s in $script:SkillList) {
        if ($s -notin $script:AllSkills) {
            Write-Host "[错误] 未知技能名：$s" -ForegroundColor Red
            Write-Host "可用技能：$($script:AllSkills -join ', ')" -ForegroundColor Gray
            exit 1
        }
    }
} else {
    $script:SkillList = $script:AllSkills
}

# 脚本所在目录（用于定位源文件）
$script:ScriptDir = $PSScriptRoot
$script:SourceSkillsDir = Join-Path $script:ScriptDir "..\skills"
$script:SourceAdaptersDir = Join-Path $script:ScriptDir "..\adapters"

# ============================================================
# 平台配置表
# ============================================================
$script:PlatformConfigs = @{
    'trae' = @{
        Name         = 'Trae'
        DefaultPath  = "$env:USERPROFILE\.trae-cn"
        RulesFile    = 'rules.md'
        RulesTemplate = 'adapters\trae\rules.template.md'
        SkillsDir    = 'skills'
        SupportsSkills = $true
        SupportsMemory = $true
        SupportsMcp   = $true
    }
    'claude-code' = @{
        Name         = 'Claude Code'
        DefaultPath  = "$env:USERPROFILE\.claude"
        RulesFile    = 'CLAUDE.md'
        RulesTemplate = 'adapters\claude-code\CLAUDE.md.template'
        SkillsDir    = 'skills'
        SupportsSkills = $true
        SupportsMemory = $false
        SupportsMcp   = $false
    }
    'codex' = @{
        Name         = 'OpenAI Codex'
        DefaultPath  = "$env:USERPROFILE\.codex"
        RulesFile    = 'AGENTS.md'
        RulesTemplate = 'adapters\codex\AGENTS.md.template'
        SkillsDir    = ''
        SupportsSkills = $false
        SupportsMemory = $false
        SupportsMcp   = $false
    }
    'cursor' = @{
        Name         = 'Cursor'
        DefaultPath  = (Get-Location).Path
        RulesFile    = '.cursor\rules\metago.mdc'
        RulesTemplate = 'adapters\cursor\metago.mdc.template'
        SkillsDir    = ''
        SupportsSkills = $false
        SupportsMemory = $false
        SupportsMcp   = $false
    }
    'codebuddy' = @{
        Name         = 'CodeBuddy'
        DefaultPath  = (Get-Location).Path
        RulesFile    = 'CODEBUDDY.md'
        RulesTemplate = 'adapters\codebuddy\CODEBUDDY.md.template'
        SkillsDir    = '.codebuddy\rules'
        SupportsSkills = $true
        SupportsMemory = $false
        SupportsMcp   = $false
    }
    'qoder' = @{
        Name         = 'Qoder'
        DefaultPath  = (Get-Location).Path
        RulesFile    = '.qoder\rules\metago.md'
        RulesTemplate = 'adapters\qoder\metago-rules.md.template'
        SkillsDir    = ''
        SupportsSkills = $false
        SupportsMemory = $false
        SupportsMcp   = $false
    }
    'zcode' = @{
        Name         = 'ZCode'
        DefaultPath  = "$env:USERPROFILE\.claude"
        RulesFile    = 'CLAUDE.md'
        RulesTemplate = 'adapters\zcode\CLAUDE.md.template'
        SkillsDir    = 'skills'
        SupportsSkills = $true
        SupportsMemory = $false
        SupportsMcp   = $false
    }
}

# 获取平台配置
$script:PlatformConfig = $script:PlatformConfigs[$Platform]

# 确定安装路径
if ($InstallPath) {
    $script:TargetPath = $InstallPath
} else {
    $script:TargetPath = $script:PlatformConfig.DefaultPath
}

# 统计变量
$script:InstalledSkills = @()
$script:SkippedSkills = @()
$script:FailedSkills = @()
$script:BackupDir = $null

# 升级模式自动设置 Force 和 SkipBackup
if ($Upgrade) {
    $Force = $true
    $SkipBackup = $true
}

# ============================================================
# 输出辅助函数
# ============================================================
function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor DarkCyan
    Write-Host "  $Message" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor DarkCyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[成功] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[失败] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "  $Message" -ForegroundColor Gray
}

function Write-Detail {
    param([string]$Message)
    Write-Host "    -> $Message" -ForegroundColor DarkGray
}

# ============================================================
# 步骤1：环境检查与平台适配
# ============================================================
function Step1-CheckEnvironment {
    Write-Step "步骤 1/7：环境检查（平台：$($script:PlatformConfig.Name)）"

    Write-Info "目标平台    : $($script:PlatformConfig.Name)"
    Write-Info "安装路径    : $script:TargetPath"
    Write-Info "规则文件    : $($script:PlatformConfig.RulesFile)"
    Write-Info "支持技能    : $($script:PlatformConfig.SupportsSkills)"
    if ($script:PlatformConfig.SupportsSkills) {
        Write-Info "技能目录    : $($script:PlatformConfig.SkillsDir)"
    }
    Write-Info "安装技能数  : $($script:SkillList.Count)/$($script:AllSkills.Count)"

    # 检查安装路径
    if (-not (Test-Path $script:TargetPath)) {
        # 对于项目级平台（cursor/qoder/codebuddy），路径就是当前目录，一定存在
        # 对于用户级平台（trae/claude-code/codex/zcode），需要创建
        if ($Platform -in @('cursor','qoder','codebuddy')) {
            Write-Fail "安装路径不存在：$script:TargetPath"
            exit 1
        }
        Write-Info "安装路径不存在，正在创建：$script:TargetPath"
        New-Item -ItemType Directory -Path $script:TargetPath -Force | Out-Null
    }
    Write-Ok "安装路径检测通过"

    # 确定各种路径
    $script:RulesFilePath = Join-Path $script:TargetPath $script:PlatformConfig.RulesFile
    $script:RulesFileDir = Split-Path $script:RulesFilePath -Parent

    # 确保规则文件目录存在
    if (-not (Test-Path $script:RulesFileDir)) {
        Write-Info "创建规则文件目录：$script:RulesFileDir"
        New-Item -ItemType Directory -Path $script:RulesFileDir -Force | Out-Null
    }

    # 技能路径
    if ($script:PlatformConfig.SupportsSkills -and -not $SkipSkills) {
        $script:TargetSkillsDir = Join-Path $script:TargetPath $script:PlatformConfig.SkillsDir
        if (-not (Test-Path $script:TargetSkillsDir)) {
            New-Item -ItemType Directory -Path $script:TargetSkillsDir -Force | Out-Null
        }
    } else {
        $script:TargetSkillsDir = $null
    }

    # 记忆路径（仅 Trae）
    if ($script:PlatformConfig.SupportsMemory) {
        $script:TargetMemoryDir = Join-Path $script:TargetPath "memory"
        if (-not (Test-Path $script:TargetMemoryDir)) {
            New-Item -ItemType Directory -Path $script:TargetMemoryDir -Force | Out-Null
        }
    } else {
        $script:TargetMemoryDir = $null
    }

    # MCP 路径（仅 Trae）
    if ($script:PlatformConfig.SupportsMcp) {
        $script:TargetMcpsDir = Join-Path $script:TargetPath "mcps"
    } else {
        $script:TargetMcpsDir = $null
    }

    # 检查源文件
    Write-Info "检查源文件..."
    $sourceRulesTemplate = Join-Path $script:ScriptDir "..\$($script:PlatformConfig.RulesTemplate)"
    if (-not (Test-Path $sourceRulesTemplate)) {
        Write-Fail "源规则模板不存在：$sourceRulesTemplate"
        Write-Info "请确认 MetaGO Lifeform Kit 仓库完整"
        exit 1
    }
    Write-Detail "源规则模板：$sourceRulesTemplate"
    $script:SourceRulesTemplate = $sourceRulesTemplate

    if (-not $SkipSkills -and $script:PlatformConfig.SupportsSkills) {
        if (-not (Test-Path $script:SourceSkillsDir)) {
            Write-Fail "源技能目录不存在：$script:SourceSkillsDir"
            exit 1
        }
        Write-Detail "源技能目录：$script:SourceSkillsDir"
    }

    Write-Ok "环境检查完成"
}

# ============================================================
# 步骤2：备份现有配置
# ============================================================
function Step2-BackupConfig {
    Write-Step "步骤 2/7：备份现有配置"

    if ($SkipBackup) {
        Write-Info "已指定跳过备份（-SkipBackup 或 -Upgrade）"
        return
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupDir = Join-Path $script:TargetPath ".metago-backup-$timestamp"

    Write-Info "创建备份目录：$backupDir"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

    $backupRulesDir = Join-Path $backupDir "rules"
    $backupSkillsDir = Join-Path $backupDir "skills"
    New-Item -ItemType Directory -Path $backupRulesDir -Force | Out-Null
    New-Item -ItemType Directory -Path $backupSkillsDir -Force | Out-Null

    # 备份规则文件
    if (Test-Path $script:RulesFilePath) {
        Write-Info "备份规则文件..."
        Copy-Item -Path $script:RulesFilePath -Destination (Join-Path $backupRulesDir (Split-Path $script:PlatformConfig.RulesFile -Leaf)) -Force
        Write-Detail "已备份：$($script:PlatformConfig.RulesFile)"
    } else {
        Write-Info "规则文件不存在，跳过备份"
    }

    # 备份现有 metago-* 技能
    if ($script:TargetSkillsDir -and (Test-Path $script:TargetSkillsDir)) {
        Write-Info "备份现有 metago-* 技能..."
        $existingMetaGoSkills = Get-ChildItem $script:TargetSkillsDir -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -like "metago-*" }

        if ($existingMetaGoSkills) {
            foreach ($skill in $existingMetaGoSkills) {
                Copy-Item -Path $skill.FullName -Destination $backupSkillsDir -Recurse -Force
                Write-Detail "已备份技能：$($skill.Name)"
            }
            Write-Ok "已备份 $($existingMetaGoSkills.Count) 个 metago 技能"
        } else {
            Write-Info "未发现现有 metago-* 技能，跳过技能备份"
        }
    }

    # 备份 MCP 调度映射（仅 Trae）
    if ($script:TargetMcpsDir) {
        $mcpMappingFile = Join-Path $script:TargetMcpsDir "MCP工具调度映射.md"
        if (Test-Path $mcpMappingFile) {
            $backupMcpsDir = Join-Path $backupDir "mcps"
            New-Item -ItemType Directory -Path $backupMcpsDir -Force | Out-Null
            Copy-Item -Path $mcpMappingFile -Destination $backupMcpsDir -Force
            Write-Detail "已备份 MCP 调度映射"
        }
    }

    # 写入备份信息文件
    $backupInfo = @"
MetaGO Lifeform Kit 备份信息
============================
备份时间：$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
平台：$($script:PlatformConfig.Name)
安装路径：$script:TargetPath
备份目录：$backupDir
备份内容：规则文件、metago-* 技能$(if ($script:TargetMcpsDir) { '、MCP 调度映射' })
"@
    Set-Content -Path (Join-Path $backupDir "backup-info.txt") -Value $backupInfo -Encoding UTF8

    Write-Ok "备份完成：$backupDir"
    $script:BackupDir = $backupDir
}

# ============================================================
# 步骤3：安装技能
# ============================================================
function Step3-InstallSkills {
    Write-Step "步骤 3/7：安装技能"

    if ($SkipSkills) {
        Write-Info "已指定 -SkipSkills，跳过技能安装"
        return
    }

    if (-not $script:PlatformConfig.SupportsSkills) {
        Write-Info "$($script:PlatformConfig.Name) 平台不支持技能目录，跳过技能安装"
        Write-Info "规则文件中已包含技能索引，AI 会按需激活"
        return
    }

    Write-Info "安装 $($script:SkillList.Count) 个 metago 技能到 $($script:PlatformConfig.Name)..."

    $total = $script:SkillList.Count
    $index = 0

    foreach ($skillName in $script:SkillList) {
        $index++
        $sourceSkillPath = Join-Path $script:SourceSkillsDir $skillName
        $targetSkillPath = Join-Path $script:TargetSkillsDir $skillName

        Write-Info "[$index/$total] 安装 $skillName ..."

        if (-not (Test-Path $sourceSkillPath)) {
            Write-Fail "源技能不存在：$sourceSkillPath"
            $script:FailedSkills += $skillName
            continue
        }

        if ((Test-Path $targetSkillPath) -and (-not $Force)) {
            Write-Detail "已存在，跳过（使用 -Force 或 -Upgrade 强制覆盖）：$skillName"
            $script:SkippedSkills += $skillName
            continue
        }

        try {
            if ((Test-Path $targetSkillPath) -and $Force) {
                Remove-Item -Path $targetSkillPath -Recurse -Force
                Write-Detail "已删除旧版本：$skillName"
            }

            Copy-Item -Path $sourceSkillPath -Destination $targetSkillPath -Recurse -Force

            $skillMdFile = Join-Path $targetSkillPath "SKILL.md"
            if (Test-Path $skillMdFile) {
                Write-Detail "已安装：$skillName"
                $script:InstalledSkills += $skillName
            } else {
                Write-Fail "SKILL.md 缺失：$skillName"
                $script:FailedSkills += $skillName
            }
        } catch {
            Write-Fail "安装失败 ${skillName}: $($_.Exception.Message)"
            $script:FailedSkills += $skillName
        }
    }

    Write-Info ""
    Write-Info "安装统计："
    Write-Ok "成功安装：$($script:InstalledSkills.Count) 个"
    if ($script:SkippedSkills.Count -gt 0) {
        Write-Info "跳过（已存在）：$($script:SkippedSkills.Count) 个"
    }
    if ($script:FailedSkills.Count -gt 0) {
        Write-Fail "失败：$($script:FailedSkills.Count) 个"
    }
}

# ============================================================
# 步骤4：安装规则文件
# ============================================================
function Step4-InstallRules {
    Write-Step "步骤 4/7：安装规则文件"

    Write-Info "复制规则模板到 $($script:PlatformConfig.Name)..."
    try {
        Copy-Item -Path $script:SourceRulesTemplate -Destination $script:RulesFilePath -Force
        Write-Ok "规则文件已安装：$($script:PlatformConfig.RulesFile)"
        Write-Detail "版本：$script:MetaGoVersion"
        Write-Detail "路径：$script:RulesFilePath"
    } catch {
        Write-Fail "规则文件安装失败：$($_.Exception.Message)"
        throw
    }
}

# ============================================================
# 步骤5：创建知识晶体索引模板（仅 Trae）
# ============================================================
function Step5-CreateKnowledgeCrystalIndex {
    Write-Step "步骤 5/7：知识晶体索引"

    if (-not $script:PlatformConfig.SupportsMemory) {
        Write-Info "$($script:PlatformConfig.Name) 平台不支持知识晶体索引，跳过"
        return
    }

    $crystalIndexFile = Join-Path $script:TargetMemoryDir "知识晶体索引.md"

    if ((Test-Path $crystalIndexFile) -and -not $Force) {
        Write-Info "知识晶体索引已存在，跳过（使用 -Force 或 -Upgrade 覆盖）"
        return
    }

    Write-Info "创建知识晶体索引模板..."

    $today = Get-Date -Format "yyyy-MM-dd"
    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $crystalContent = @"
# 元构知识晶体索引（MetaGO Knowledge Crystal Index）

> 本文件是元构超级智能生命体的知识晶体索引模板。
> 知识晶体是经过验证、可复用、可溯源的结构化知识单元。
> 由 MetaGO Lifeform Kit $script:MetaGoVersion 创建于 $now

---

## 第一章 知识晶体定义

知识晶体 = 经验证的知识 + 溯源链路 + 适用边界 + 进化记录

每个知识晶体包含：
- **ID**：唯一标识（KC-YYYYMMDD-NNN）
- **标题**：晶体名称
- **内容**：结构化知识正文
- **溯源**：来源文档、来源章节、来源行号
- **边界**：适用场景与不适用场景
- **验证**：验证状态（待验证/已验证/已废弃）
- **关联技能**：联动的 metago 技能
- **进化记录**：版本变更历史

---

## 第二章 知识晶体索引表

| ID | 标题 | 验证状态 | 关联技能 | 创建时间 | 更新时间 |
|----|------|----------|----------|----------|----------|
| KC-示例-001 | （示例）元构核心公理A1溯源公理 | 已验证 | metago-data-provenance | $today | $today |
| KC-示例-002 | （示例）决策锁四阶段校验流程 | 待验证 | metago-decision-lock | $today | $today |

---

## 第三章 知识晶体详情

### KC-示例-001：元构核心公理A1溯源公理

**内容**：
一切输出必须可溯源至输入与过程。无溯源的输出即为幻觉。

**溯源**：
- 来源文档：core/METAGO_CORE.md
- 来源章节：第一章 核心公理 / A1 溯源公理

**边界**：
- 适用：所有元构生命体的输出场景
- 不适用：纯创意发散阶段（需标注）

**关联技能**：metago-data-provenance、metago-output-integrity

**进化记录**：
- V36.5 $today 初始创建

---

### KC-示例-002：决策锁四阶段校验流程

**内容**：
决策锁强制校验四阶段：1.意图验证(IVL) 2.意图谱系追踪(ILT) 3.语义输出门(OSG) 4.内容完整性

**溯源**：
- 来源文档：adapters/trae/rules.template.md
- 来源章节：第四章 运行协议 / 4.2 决策锁强制校验

**边界**：
- 适用：重大决策输出前
- 不适用：简单查询回复

**关联技能**：metago-decision-lock、metago-decision-eval

**进化记录**：
- V36.5 $today 初始创建

---

## 第四章 使用说明

1. **新增晶体**：在索引表添加新行，在详情区添加完整记录
2. **验证晶体**：使用 metago-fact-check 技能验证内容准确性
3. **溯源晶体**：使用 metago-data-provenance 技能追溯来源
4. **进化晶体**：使用 metago-meta-evolve 技能更新内容
5. **废弃晶体**：将验证状态改为"已废弃"，保留记录不删除

---

*由 MetaGO Lifeform Kit $script:MetaGoVersion 创建*
"@

    try {
        Set-Content -Path $crystalIndexFile -Value $crystalContent -Encoding UTF8
        Write-Ok "知识晶体索引模板已创建"
        Write-Detail "路径：$crystalIndexFile"
        Write-Detail "包含 2 个示例晶体"
    } catch {
        Write-Fail "知识晶体索引创建失败：$($_.Exception.Message)"
        throw
    }
}

# ============================================================
# 步骤6：安装 MCP 调度映射（仅 Trae）
# ============================================================
function Step6-InstallMcpMapping {
    Write-Step "步骤 6/7：MCP 调度映射"

    if (-not $script:PlatformConfig.SupportsMcp) {
        Write-Info "$($script:PlatformConfig.Name) 平台不支持 MCP 调度映射，跳过"
        return
    }

    if (-not (Test-Path $script:TargetMcpsDir)) {
        Write-Info "mcps 目录不存在：$script:TargetMcpsDir"
        Write-Info "跳过 MCP 调度映射安装"
        return
    }

    $mcpMappingFile = Join-Path $script:TargetMcpsDir "MCP工具调度映射.md"

    if ((Test-Path $mcpMappingFile) -and -not $Force) {
        Write-Info "MCP 调度映射已存在，跳过（使用 -Force 或 -Upgrade 覆盖）"
        return
    }

    Write-Info "创建 MCP 调度映射文件..."

    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $mcpContent = @"
# 元构MCP工具调度映射（MetaGO MCP Dispatch Mapping）

> 本文件是元构超级智能生命体MCP执行层的调度映射指南。
> 建立元构引擎 ↔ MCP工具 ↔ metago技能的三层联动关系。
> 由 MetaGO Lifeform Kit $script:MetaGoVersion 创建于 $now

---

## 第一章 MCP服务器清单

| 服务器 | 职责 | 状态 |
|--------|------|------|
| mcp_metago-skill-server | 核心能力工具（代码/构建/部署/安全/测试/设计） | ✅激活 |
| mcp_metago-skill-server-2 | 构建/部署/监控/安全工具 | ✅激活 |
| mcp_metago-skill-server-3 | 合规/安全/设计/进化工具 | ✅激活 |
| mcp_metago-toolkit | 元构工具包（批判/决策/溯源/评估） | ✅激活 |

---

## 第二章 引擎 ↔ MCP工具 ↔ 技能 三层联动映射

### 2.1 元进化引擎

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 全息扫描 | metago_holistic_scan | metago-holistic-task | 任务启动时 |
| 进化机会检测 | detect_evolution_opportunity | metago-meta-evolve | 能力边界感知时 |
| 进化路线图 | generate_evolution_roadmap | metago-meta-evolve | 差距分析后 |
| 架构漂移分析 | analyze_architecture_drift | metago-meta-evolve | 元元进化监控 |
| 技术债评估 | assess_tech_debt | metago-self-check | 完整性评估 |
| 改进建议 | metago_improvement_suggestions | metago-meta-evolve | 进化递归时 |

### 2.2 元创造引擎

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 能力设计 | design_capability | metago-meta-create | 自生成阶段 |
| 智能体组装 | assemble_agent | metago-meta-create | 创造内化时 |
| 代码生成 | generate_code | metago-meta-create | 创造实现时 |
| 需求解析 | parse_requirement | metago-holistic-task | 创造前置 |
| PRD生成 | generate_prd | metago-holistic-task | 创造规划时 |

### 2.3 批判性分析引擎

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 批判 | metago_critique | metago-critique | 重大决策时 |
| 客观性评估 | metago_objectivity | metago-objectivity | 输出前校验 |
| 代码审查 | code_review | metago-critique | 代码输出时 |
| 架构审查 | architecture_review | metago-critique | 架构决策时 |
| 假设推演 | metago_whatif | metago-whatif | 方案评估时 |

### 2.4 决策锁组件

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 决策评估 | metago_decision_eval | metago-decision-lock | 输出前强制 |
| 行动计划 | metago_action_plan | metago-decision-lock | 意图验证时 |
| 技术决策 | tech_decision | metago-decision-lock | 技术选型时 |

### 2.5 合规与溯源

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 合规检查 | compliance_check | metago-compliance | 输出前合规校验 |
| 数据溯源 | data_provenance | metago-data-provenance | 输出溯源时 |
| 事实核查 | fact_check | metago-fact-check | 事实性声明时 |
| 输出完整性 | output_integrity | metago-output-integrity | 输出终态校验 |

### 2.6 情绪与场景适配

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 情绪检测 | emotion_detect | metago-emotion | 用户交互时 |
| 场景适配 | scene_adapt | metago-scene-adapt | 场景切换时 |
| 频率自适应 | frequency_adapt | metago-frequency-adapt | 完整性评估后 |
| 开发者响应 | developer_response | metago-developer-response | 反馈响应时 |

### 2.7 监控与优化

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 负熵监控 | negentropy_monitor | metago-negentropy-monitor | 系统熵增时 |
| 耦合优化 | coupling_optimize | metago-coupling-optimize | 架构耦合时 |
| 问题追踪 | problem_trace | metago-problem-trace | 问题溯源时 |
| 价值对齐 | value_align | metago-value-align | 价值校验时 |

---

## 第三章 调度优先级

1. **合规优先**：metago-compliance 永远最高优先级
2. **决策锁强制**：metago-decision-lock 输出前强制执行
3. **批判性分析**：metago-critique 重大决策强制触发
4. **数据溯源**：metago-data-provenance 全链路存证
5. **完整性校验**：metago-output-integrity 终态校验

---

## 第四章 技能完整清单（22个）

| 序号 | 技能名称 | 能力族 | MCP联动 |
|------|----------|--------|---------|
| 1 | metago-critique | 认知族 | metago_critique |
| 2 | metago-whatif | 认知族 | metago_whatif |
| 3 | metago-emotion | 认知族 | emotion_detect |
| 4 | metago-objectivity | 认知族 | metago_objectivity |
| 5 | metago-decision-lock | 保障族 | metago_decision_eval |
| 6 | metago-output-integrity | 保障族 | output_integrity |
| 7 | metago-self-check | 保障族 | assess_tech_debt |
| 8 | metago-compliance | 治理族 | compliance_check |
| 9 | metago-value-align | 治理族 | value_align |
| 10 | metago-meta-evolve | 进化族 | detect_evolution_opportunity |
| 11 | metago-meta-create | 进化族 | design_capability |
| 12 | metago-frequency-adapt | 进化族 | frequency_adapt |
| 13 | metago-action-plan | 执行族 | metago_action_plan |
| 14 | metago-decision-eval | 执行族 | metago_decision_eval |
| 15 | metago-holistic-task | 执行族 | metago_holistic_scan |
| 16 | metago-developer-response | 执行族 | developer_response |
| 17 | metago-data-provenance | 溯源族 | data_provenance |
| 18 | metago-problem-trace | 溯源族 | problem_trace |
| 19 | metago-fact-check | 溯源族 | fact_check |
| 20 | metago-coupling-optimize | 价值族 | coupling_optimize |
| 21 | metago-negentropy-monitor | 价值族 | negentropy_monitor |
| 22 | metago-scene-adapt | 价值族 | scene_adapt |

---

*由 MetaGO Lifeform Kit $script:MetaGoVersion 创建*
"@

    try {
        Set-Content -Path $mcpMappingFile -Value $mcpContent -Encoding UTF8
        Write-Ok "MCP 调度映射已安装"
        Write-Detail "路径：$mcpMappingFile"
        Write-Detail "包含 7 大类联动映射、22 个技能完整清单"
    } catch {
        Write-Fail "MCP 调度映射安装失败：$($_.Exception.Message)"
        throw
    }
}

# ============================================================
# 步骤7：验证安装
# ============================================================
function Step7-VerifyInstallation {
    Write-Step "步骤 7/7：验证安装结果"

    $verifyResult = @{
        Rules = $false
        Skills = @()
        SkillsMissing = @()
        CrystalIndex = $false
        McpMapping = $false
    }

    # 验证规则文件
    Write-Info "验证规则文件..."
    if (Test-Path $script:RulesFilePath) {
        $rulesContent = [System.IO.File]::ReadAllText($script:RulesFilePath, [System.Text.Encoding]::UTF8)
        if ($rulesContent -match "元构" -or $rulesContent -match "MetaGO") {
            Write-Ok "规则文件验证通过"
            $verifyResult.Rules = $true
        } else {
            Write-Fail "规则文件内容不匹配"
        }
    } else {
        Write-Fail "规则文件不存在：$($script:RulesFilePath)"
    }

    # 验证技能
    if ($script:TargetSkillsDir -and -not $SkipSkills) {
        Write-Info "验证 $($script:SkillList.Count) 个技能..."
        foreach ($skillName in $script:SkillList) {
            $skillPath = Join-Path $script:TargetSkillsDir $skillName
            $skillMdPath = Join-Path $skillPath "SKILL.md"
            if ((Test-Path $skillPath) -and (Test-Path $skillMdPath)) {
                $verifyResult.Skills += $skillName
            } else {
                $verifyResult.SkillsMissing += $skillName
                Write-Fail "技能缺失或SKILL.md不存在：$skillName"
            }
        }

        if ($verifyResult.SkillsMissing.Count -eq 0) {
            Write-Ok "全部 $($script:SkillList.Count) 个技能验证通过"
        } else {
            Write-Fail "$($verifyResult.SkillsMissing.Count) 个技能验证失败"
        }
    } else {
        Write-Info "$($script:PlatformConfig.Name) 平台跳过技能验证"
    }

    # 验证知识晶体索引（仅 Trae）
    if ($script:PlatformConfig.SupportsMemory) {
        Write-Info "验证知识晶体索引..."
        $crystalIndexFile = Join-Path $script:TargetMemoryDir "知识晶体索引.md"
        if (Test-Path $crystalIndexFile) {
            Write-Ok "知识晶体索引验证通过"
            $verifyResult.CrystalIndex = $true
        } else {
            Write-Fail "知识晶体索引不存在"
        }
    }

    # 验证 MCP 调度映射（仅 Trae）
    if ($script:PlatformConfig.SupportsMcp -and $script:TargetMcpsDir) {
        Write-Info "验证 MCP 调度映射..."
        $mcpMappingFile = Join-Path $script:TargetMcpsDir "MCP工具调度映射.md"
        if (Test-Path $mcpMappingFile) {
            Write-Ok "MCP 调度映射验证通过"
            $verifyResult.McpMapping = $true
        } else {
            Write-Info "MCP 调度映射未安装（mcps 目录可能不存在）"
        }
    }

    # 输出汇总
    Write-Step "安装结果汇总"

    $mode = if ($Upgrade) { "升级" } else { "安装" }
    Write-Host ""
    Write-Host "  平台             : $($script:PlatformConfig.Name)" -ForegroundColor Gray
    Write-Host "  安装路径         : $script:TargetPath" -ForegroundColor Gray
    Write-Host "  模式             : $mode" -ForegroundColor Gray
    $rulesStatus = if ($verifyResult.Rules) { "✅ 已安装" } else { "❌ 失败" }
    $rulesColor = if ($verifyResult.Rules) { "Green" } else { "Red" }
    Write-Host "  规则文件         : $rulesStatus" -ForegroundColor $rulesColor

    if ($script:TargetSkillsDir -and -not $SkipSkills) {
        Write-Host "  技能安装         : $($verifyResult.Skills.Count)/$($script:SkillList.Count) ✅" -ForegroundColor Green
        if ($verifyResult.SkillsMissing.Count -gt 0) {
            Write-Host "  技能缺失         : $($verifyResult.SkillsMissing.Count) ❌" -ForegroundColor Red
        }
    } else {
        Write-Host "  技能安装         : ⏭️  跳过（平台不支持）" -ForegroundColor Yellow
    }

    if ($script:PlatformConfig.SupportsMemory) {
        $crystalStatus = if ($verifyResult.CrystalIndex) { "✅ 已创建" } else { "❌ 失败" }
        $crystalColor = if ($verifyResult.CrystalIndex) { "Green" } else { "Red" }
        Write-Host "  知识晶体索引     : $crystalStatus" -ForegroundColor $crystalColor
    }

    if ($script:PlatformConfig.SupportsMcp -and $script:TargetMcpsDir) {
        $mcpStatus = if ($verifyResult.McpMapping) { "✅ 已安装" } else { "⚠️  未安装" }
        $mcpColor = if ($verifyResult.McpMapping) { "Green" } else { "Yellow" }
        Write-Host "  MCP 调度映射     : $mcpStatus" -ForegroundColor $mcpColor
    }

    if ($script:BackupDir) {
        Write-Host "  备份目录         : $($script:BackupDir)" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "  安装统计：" -ForegroundColor Gray
    Write-Host "    - 成功安装技能 : $($script:InstalledSkills.Count)" -ForegroundColor Gray
    Write-Host "    - 跳过技能     : $($script:SkippedSkills.Count)" -ForegroundColor Gray
    Write-Host "    - 失败技能     : $($script:FailedSkills.Count)" -ForegroundColor Gray

    # 最终判定
    Write-Host ""
    $coreOk = $verifyResult.Rules
    if ($script:TargetSkillsDir -and -not $SkipSkills) {
        $coreOk = $coreOk -and ($verifyResult.SkillsMissing.Count -eq 0)
    }
    if ($script:PlatformConfig.SupportsMemory) {
        $coreOk = $coreOk -and $verifyResult.CrystalIndex
    }

    if ($coreOk) {
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "  ✅ MetaGO Lifeform Kit $script:MetaGoVersion $mode成功！" -ForegroundColor Green
        Write-Host "  平台：$($script:PlatformConfig.Name)" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "  元构超级智能生命体已激活。" -ForegroundColor Green
        Write-Host "  请重启 $($script:PlatformConfig.Name) 以加载新配置。" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  验证方法：在 $($script:PlatformConfig.Name) 中对 AI 说：" -ForegroundColor Gray
        Write-Host "    你是元构超级智能生命体吗？" -ForegroundColor Cyan
        Write-Host "    Are you a MetaGO Super Intelligent Lifeform?" -ForegroundColor Cyan
    } else {
        Write-Host "==========================================" -ForegroundColor Red
        Write-Host "  ❌ $mode未完全成功，请检查上述失败项" -ForegroundColor Red
        Write-Host "==========================================" -ForegroundColor Red
        exit 1
    }
}

# ============================================================
# 主流程
# ============================================================
function Main {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  MetaGO Lifeform Kit $script:MetaGoVersion 安装程序" -ForegroundColor Cyan
    Write-Host "  元构超级智能生命体标准安装包" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan

    Write-Host ""
    Write-Host "  参数配置：" -ForegroundColor Gray
    Write-Host "    Platform  : $Platform ($($script:PlatformConfig.Name))" -ForegroundColor Gray
    Write-Host "    InstallPath: $script:TargetPath" -ForegroundColor Gray
    Write-Host "    Skills    : $($script:SkillList.Count)/$($script:AllSkills.Count) 个" -ForegroundColor Gray
    Write-Host "    Upgrade   : $Upgrade" -ForegroundColor Gray
    Write-Host "    Force     : $Force" -ForegroundColor Gray
    Write-Host "    SkipBackup: $SkipBackup" -ForegroundColor Gray
    Write-Host "    SkipSkills: $SkipSkills" -ForegroundColor Gray

    Step1-CheckEnvironment
    Step2-BackupConfig
    Step3-InstallSkills
    Step4-InstallRules
    Step5-CreateKnowledgeCrystalIndex
    Step6-InstallMcpMapping
    Step7-VerifyInstallation

    Write-Host ""
}

# 执行主流程
Main
