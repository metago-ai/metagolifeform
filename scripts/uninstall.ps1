﻿﻿﻿﻿﻿﻿﻿<#
.SYNOPSIS
    MetaGO Lifeform Kit 卸载脚本（支持7大平台）

.DESCRIPTION
    从目标平台卸载元构超级智能生命体 Kit，包含：
    - 查找最新备份（.metago-backup-* 目录，仅 Trae）
    - 恢复 rules.md（从备份恢复，或写入基础版本，仅 Trae）
    - 删除所有 metago-* 技能（仅 Trae）
    - 删除 MCP 调度映射（仅 Trae）
    - 删除目标平台的规则文件（所有平台）
    - 输出卸载结果

.PARAMETER Platform
    目标平台，可选值：trae（默认）、claude-code、codex、cursor、codebuddy、qoder、zcode

.PARAMETER TraePath
    自定义 Trae 安装路径，默认为 $env:USERPROFILE\.trae-cn（仅 Trae 平台使用）

.PARAMETER KeepSkills
    保留 metago 技能不删除，仅恢复 rules.md 和清理 MCP 映射（仅 Trae 平台使用）

.EXAMPLE
    .\uninstall.ps1
    卸载默认平台（Trae）

.EXAMPLE
    .\uninstall.ps1 -Platform claude-code
    卸载 Claude Code 平台

.EXAMPLE
    .\uninstall.ps1 -Platform trae -KeepSkills
    卸载 Trae 但保留技能

.EXAMPLE
    .\uninstall.ps1 -Platform cursor
    卸载 Cursor 平台

.NOTES
    版本：V36.5
    作者：易霄 / MetaGO Lightyear
#>

[CmdletBinding()]
param(
    [ValidateSet('trae','claude-code','codex','cursor','codebuddy','qoder','zcode')]
    [string]$Platform = 'trae',
    [string]$TraePath = "$env:USERPROFILE\.trae-cn",
    [switch]$KeepSkills
)

$ErrorActionPreference = "Stop"

# ============================================================
# 元数据
# ============================================================
$script:MetaGoVersion = "V36.5"

# 统计变量
$script:DeletedSkills = @()
$script:DeleteFailedSkills = @()
$script:RulesRestored = $false
$script:McpDeleted = $false
$script:BackupUsed = $null

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

function Write-Warn {
    param([string]$Message)
    Write-Host "[警告] $Message" -ForegroundColor Yellow
}

# ============================================================
# 基础 rules.md 内容（无备份时使用）
# ============================================================
function Get-BasicRulesContent {
    return @"
# Trae 运行规则

> 本文件是 Trae 的基础运行规则。
> MetaGO Lifeform Kit 已卸载，已恢复为基础版本。
> 卸载时间：$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

---

## 基本原则

1. 遵循用户指令，提供准确的代码和文档
2. 保持代码质量和最佳实践
3. 注释清晰，命名规范
4. 主动发现并提示潜在问题

---

*MetaGO Lifeform Kit 已卸载 - 基础版本*
"@
}

# ============================================================
# 步骤1：环境检查与查找备份
# ============================================================
function Step1-CheckEnvAndFindBackup {
    Write-Step "步骤 1/4：环境检查与查找备份"

    Write-Info "检测 Trae 安装路径：$TraePath"

    if (-not (Test-Path $TraePath)) {
        Write-Fail "Trae 未安装在 $TraePath"
        Write-Info "请确认 Trae CN 已安装，或使用 -TraePath 参数指定自定义路径"
        Write-Info "示例：.\uninstall.ps1 -TraePath 'D:\custom\.trae-cn'"
        exit 1
    }

    Write-Ok "Trae 安装路径检测通过"

    # 设置关键路径
    $script:TraeSkillsDir = Join-Path $TraePath "skills"
    $script:TraeRulesFile = Join-Path $TraePath "rules.md"
    $script:TraeMcpsDir = Join-Path $TraePath "mcps"
    $script:TraeMemoryDir = Join-Path $TraePath "memory"

    # 查找最新备份
    Write-Info "查找 .metago-backup-* 备份目录..."

    $backupDirs = Get-ChildItem $TraePath -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like ".metago-backup-*" } |
        Sort-Object Name -Descending

    if ($backupDirs -and $backupDirs.Count -gt 0) {
        $latestBackup = $backupDirs[0]
        Write-Ok "找到备份目录：$($latestBackup.FullName)"
        Write-Detail "备份数量：$($backupDirs.Count) 个"
        Write-Detail "最新备份：$($latestBackup.Name)"

        # 列出所有备份
        if ($backupDirs.Count -gt 1) {
            Write-Info "所有备份目录："
            foreach ($bd in $backupDirs) {
                Write-Detail $bd.Name
            }
        }

        $script:LatestBackupDir = $latestBackup.FullName
    } else {
        Write-Warn "未找到 .metago-backup-* 备份目录"
        Write-Info "将写入基础版本 rules.md"
        $script:LatestBackupDir = $null
    }

    Write-Ok "环境检查完成"
}

# ============================================================
# 步骤2：恢复 rules.md
# ============================================================
function Step2-RestoreRules {
    Write-Step "步骤 2/4：恢复 rules.md"

    $backupRulesFile = $null

    # 从备份恢复
    if ($script:LatestBackupDir) {
        $backupRulesFile = Join-Path $script:LatestBackupDir "rules\rules.md"
        Write-Info "尝试从备份恢复 rules.md..."
        Write-Detail "备份源：$backupRulesFile"

        if (Test-Path $backupRulesFile) {
            try {
                Copy-Item -Path $backupRulesFile -Destination $TraeRulesFile -Force
                Write-Ok "rules.md 已从备份恢复：$TraeRulesFile"
                $script:RulesRestored = $true
                $script:BackupUsed = $backupRulesFile
                return
            } catch {
                Write-Fail "从备份恢复 rules.md 失败：$($_.Exception.Message)"
                Write-Info "将写入基础版本..."
            }
        } else {
            Write-Info "备份中未找到 rules.md，将写入基础版本"
        }
    }

    # 写入基础版本
    Write-Info "写入基础版本 rules.md..."
    try {
        $basicContent = Get-BasicRulesContent
        Set-Content -Path $TraeRulesFile -Value $basicContent -Encoding UTF8
        Write-Ok "基础版本 rules.md 已写入：$TraeRulesFile"
        $script:RulesRestored = $true
    } catch {
        Write-Fail "写入基础版本 rules.md 失败：$($_.Exception.Message)"
        throw
    }
}

# ============================================================
# 步骤3：删除 metago-* 技能
# ============================================================
function Step3-DeleteSkills {
    Write-Step "步骤 3/4：删除 metago-* 技能"

    if ($KeepSkills) {
        Write-Info "已指定 -KeepSkills，保留 metago 技能不删除"
        return
    }

    if (-not (Test-Path $TraeSkillsDir)) {
        Write-Info "skills 目录不存在：$TraeSkillsDir"
        Write-Info "跳过技能删除"
        return
    }

    Write-Info "查找 metago-* 技能..."
    $metagoSkills = Get-ChildItem $TraeSkillsDir -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "metago-*" }

    if (-not $metagoSkills -or $metagoSkills.Count -eq 0) {
        Write-Info "未找到 metago-* 技能，无需删除"
        return
    }

    Write-Info "找到 $($metagoSkills.Count) 个 metago 技能，开始删除..."

    foreach ($skill in $metagoSkills) {
        $skillName = $skill.Name
        $skillPath = $skill.FullName

        Write-Info "删除 $skillName ..."

        try {
            Remove-Item -Path $skillPath -Recurse -Force

            # 验证删除
            if (-not (Test-Path $skillPath)) {
                Write-Detail "已删除：$skillName"
                $script:DeletedSkills += $skillName
            } else {
                Write-Fail "删除失败（目录仍存在）：$skillName"
                $script:DeleteFailedSkills += $skillName
            }
        } catch {
            Write-Fail "删除失败 ${skillName}: $($_.Exception.Message)"
            $script:DeleteFailedSkills += $skillName
        }
    }

    Write-Info ""
    Write-Info "删除统计："
    Write-Ok "成功删除：$($script:DeletedSkills.Count) 个"
    if ($script:DeleteFailedSkills.Count -gt 0) {
        Write-Fail "删除失败：$($script:DeleteFailedSkills.Count) 个"
    }
}

# ============================================================
# 步骤4：删除 MCP 调度映射与知识晶体索引
# ============================================================
function Step4-CleanMcpAndCrystal {
    Write-Step "步骤 4/4：删除 MCP 调度映射与知识晶体索引"

    # 删除 MCP 调度映射
    Write-Info "删除 MCP 调度映射..."
    $mcpMappingFile = Join-Path $TraeMcpsDir "MCP工具调度映射.md"

    if (Test-Path $mcpMappingFile) {
        try {
            # 验证文件是 MetaGO 创建的
            $mcpContent = [System.IO.File]::ReadAllText($mcpMappingFile, [System.Text.Encoding]::UTF8)
            if ($mcpContent -match "MetaGO MCP Dispatch Mapping" -or $mcpContent -match "元构MCP工具调度映射") {
                Remove-Item -Path $mcpMappingFile -Force
                Write-Ok "MCP 调度映射已删除：$mcpMappingFile"
                $script:McpDeleted = $true
            } else {
                Write-Warn "MCP 映射文件内容不匹配 MetaGO 格式，跳过删除"
                Write-Detail "文件可能已被用户自定义修改"
            }
        } catch {
            Write-Fail "删除 MCP 调度映射失败：$($_.Exception.Message)"
        }
    } else {
        Write-Info "MCP 调度映射不存在，跳过"
    }

    # 删除知识晶体索引
    Write-Info "删除知识晶体索引..."
    $crystalIndexFile = Join-Path $TraeMemoryDir "知识晶体索引.md"

    if (Test-Path $crystalIndexFile) {
        try {
            Remove-Item -Path $crystalIndexFile -Force
            Write-Ok "知识晶体索引已删除：$crystalIndexFile"
        } catch {
            Write-Fail "删除知识晶体索引失败：$($_.Exception.Message)"
        }
    } else {
        Write-Info "知识晶体索引不存在，跳过"
    }
}

# ============================================================
# 输出卸载结果汇总
# ============================================================
function Show-Summary {
    Write-Step "卸载结果汇总"

    Write-Host ""
    Write-Host "  Trae 路径        : $TraePath" -ForegroundColor Gray

    # rules.md 状态
    $rulesStatus = if ($script:RulesRestored) {
        if ($script:BackupUsed) { "✅ 已从备份恢复" } else { "✅ 已写入基础版本" }
    } else {
        "❌ 未恢复"
    }
    $rulesColor = if ($script:RulesRestored) { "Green" } else { "Red" }
    Write-Host "  rules.md         : $rulesStatus" -ForegroundColor $rulesColor

    # 技能删除状态
    if ($KeepSkills) {
        Write-Host "  metago 技能      : ⏸️  已保留（-KeepSkills）" -ForegroundColor Yellow
    } else {
        Write-Host "  技能删除         : $($script:DeletedSkills.Count) 个 ✅" -ForegroundColor Green
        if ($script:DeleteFailedSkills.Count -gt 0) {
            Write-Host "  删除失败         : $($script:DeleteFailedSkills.Count) 个 ❌" -ForegroundColor Red
        }
    }

    # MCP 映射状态
    $mcpStatus = if ($script:McpDeleted) { "✅ 已删除" } else { "⚠️  未删除" }
    $mcpColor = if ($script:McpDeleted) { "Green" } else { "Yellow" }
    Write-Host "  MCP 调度映射     : $mcpStatus" -ForegroundColor $mcpColor

    # 备份信息
    if ($script:LatestBackupDir) {
        Write-Host "  使用的备份       : $($script:LatestBackupDir)" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "  卸载统计：" -ForegroundColor Gray
    Write-Host "    - rules.md 恢复 : $(if ($script:RulesRestored) { '是' } else { '否' })" -ForegroundColor Gray
    Write-Host "    - 删除技能数    : $($script:DeletedSkills.Count)" -ForegroundColor Gray
    Write-Host "    - 删除失败数    : $($script:DeleteFailedSkills.Count)" -ForegroundColor Gray
    Write-Host "    - MCP 映射删除  : $(if ($script:McpDeleted) { '是' } else { '否' })" -ForegroundColor Gray

    # 最终判定
    Write-Host ""
    $success = $script:RulesRestored

    if ($success) {
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "  ✅ MetaGO Lifeform Kit $MetaGoVersion 卸载完成！" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "  元构超级智能生命体已停用。" -ForegroundColor Green
        if ($script:LatestBackupDir) {
            Write-Host "  备份目录保留在：$($script:LatestBackupDir)" -ForegroundColor Yellow
            Write-Host "  如需重新安装，请运行 install.ps1" -ForegroundColor Yellow
        }
        Write-Host "  请重启 Trae 以使更改生效。" -ForegroundColor Yellow
    } else {
        Write-Host "==========================================" -ForegroundColor Red
        Write-Host "  ❌ 卸载未完全成功，请检查上述失败项" -ForegroundColor Red
        Write-Host "==========================================" -ForegroundColor Red
        exit 1
    }
}

# ============================================================
# 非 Trae 平台卸载：删除规则文件
# ============================================================
function Uninstall-NonTraePlatform {
    param([string]$Plat)

    $rulesFiles = @()

    switch ($Plat) {
        'claude-code' {
            $rulesFiles += Join-Path $env:USERPROFILE ".claude\CLAUDE.md"
            $rulesFiles += ".\CLAUDE.md"
        }
        'codex' {
            $rulesFiles += Join-Path $env:USERPROFILE ".codex\AGENTS.md"
            $rulesFiles += ".\AGENTS.md"
        }
        'cursor' {
            $rulesFiles += ".\.cursor\rules\metago.mdc"
        }
        'codebuddy' {
            $rulesFiles += ".\CODEBUDDY.md"
        }
        'qoder' {
            $rulesFiles += ".\.qoder\rules\metago.md"
        }
        'zcode' {
            $rulesFiles += Join-Path $env:USERPROFILE ".claude\CLAUDE.md"
            $rulesFiles += ".\CLAUDE.md"
        }
    }

    Write-Info "目标平台：$Plat"
    Write-Info "将删除以下规则文件（如存在）："
    foreach ($f in $rulesFiles) {
        Write-Detail $f
    }

    $deletedCount = 0
    foreach ($file in $rulesFiles) {
        if (Test-Path $file) {
            try {
                Remove-Item -Path $file -Force
                Write-Ok "已删除：$file"
                $deletedCount++
            } catch {
                Write-Fail "删除失败 ${file}: $($_.Exception.Message)"
            }
        } else {
            Write-Info "文件不存在，跳过：$file"
        }
    }

    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "  ✅ MetaGO Lifeform Kit $script:MetaGoVersion 卸载完成！" -ForegroundColor Green
    Write-Host "  平台：$Plat | 删除文件：$deletedCount 个" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green

    if ($Plat -eq 'zcode' -or $Plat -eq 'claude-code') {
        Write-Host ""
        Write-Host "  ⚠️  注意：ZCode 与 Claude Code 共享 ~/.claude/CLAUDE.md 路径" -ForegroundColor Yellow
        Write-Host "  如需保留另一平台，请重新执行该平台的安装命令" -ForegroundColor Yellow
    }
}

# ============================================================
# 主流程
# ============================================================
function Main {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  MetaGO Lifeform Kit $script:MetaGoVersion 卸载程序" -ForegroundColor Cyan
    Write-Host "  元构超级智能生命体卸载工具" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan

    Write-Host ""
    Write-Host "  参数配置：" -ForegroundColor Gray
    Write-Host "    Platform  : $Platform" -ForegroundColor Gray
    if ($Platform -eq 'trae') {
        Write-Host "    TraePath  : $TraePath" -ForegroundColor Gray
        Write-Host "    KeepSkills: $KeepSkills" -ForegroundColor Gray
    }

    # 确认提示
    Write-Host ""
    Write-Host "  ⚠️  警告：此操作将卸载 MetaGO Lifeform Kit（平台：$Platform）" -ForegroundColor Yellow
    if ($Platform -eq 'trae' -and -not $KeepSkills) {
        Write-Host "  ⚠️  所有 metago-* 技能将被删除" -ForegroundColor Yellow
        Write-Host "  ⚠️  rules.md 将被恢复或替换为基础版本" -ForegroundColor Yellow
        Write-Host "  ⚠️  MCP 调度映射和知识晶体索引将被删除" -ForegroundColor Yellow
    } else {
        Write-Host "  ⚠️  目标平台的规则文件将被删除" -ForegroundColor Yellow
    }
    Write-Host ""

    # 平台分发
    if ($Platform -ne 'trae') {
        Uninstall-NonTraePlatform -Plat $Platform
        return
    }

    # Trae 平台完整卸载流程
    Step1-CheckEnvAndFindBackup
    Step2-RestoreRules
    Step3-DeleteSkills
    Step4-CleanMcpAndCrystal
    Show-Summary

    Write-Host ""
}

# 执行主流程
Main
