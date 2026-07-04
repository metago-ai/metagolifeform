﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<#
.SYNOPSIS
    MetaGO Lifeform Kit 安装验证脚本

.DESCRIPTION
    验证 MetaGO Lifeform Kit 是否正确安装在指定平台。
    检查规则文件、技能目录、知识晶体索引、MCP 调度映射的完整性。

.PARAMETER Platform
    目标平台，默认：trae

.PARAMETER InstallPath
    自定义安装路径

.EXAMPLE
    .\scripts\verify.ps1
    验证默认 Trae 安装

.EXAMPLE
    .\scripts\verify.ps1 -Platform claude-code
    验证 Claude Code 安装

.NOTES
    版本：V36.5
#>

[CmdletBinding()]
param(
    [ValidateSet('trae','claude-code','codex','cursor','codebuddy','qoder','zcode')]
    [string]$Platform = 'trae',

    [string]$InstallPath
)

$ErrorActionPreference = "Stop"

# 平台配置
$platformConfigs = @{
    'trae' = @{ Name='Trae'; DefaultPath="$env:USERPROFILE\.trae-cn"; RulesFile='rules.md'; SkillsDir='skills'; SupportsSkills=$true; SupportsMemory=$true; SupportsMcp=$true }
    'claude-code' = @{ Name='Claude Code'; DefaultPath="$env:USERPROFILE\.claude"; RulesFile='CLAUDE.md'; SkillsDir='skills'; SupportsSkills=$true; SupportsMemory=$false; SupportsMcp=$false }
    'codex' = @{ Name='OpenAI Codex'; DefaultPath="$env:USERPROFILE\.codex"; RulesFile='AGENTS.md'; SkillsDir=''; SupportsSkills=$false; SupportsMemory=$false; SupportsMcp=$false }
    'cursor' = @{ Name='Cursor'; DefaultPath=(Get-Location).Path; RulesFile='.cursor\rules\metago.mdc'; SkillsDir=''; SupportsSkills=$false; SupportsMemory=$false; SupportsMcp=$false }
    'codebuddy' = @{ Name='CodeBuddy'; DefaultPath=(Get-Location).Path; RulesFile='CODEBUDDY.md'; SkillsDir='.codebuddy\rules'; SupportsSkills=$true; SupportsMemory=$false; SupportsMcp=$false }
    'qoder' = @{ Name='Qoder'; DefaultPath=(Get-Location).Path; RulesFile='.qoder\rules\metago.md'; SkillsDir=''; SupportsSkills=$false; SupportsMemory=$false; SupportsMcp=$false }
    'zcode' = @{ Name='ZCode'; DefaultPath="$env:USERPROFILE\.claude"; RulesFile='CLAUDE.md'; SkillsDir='skills'; SupportsSkills=$true; SupportsMemory=$false; SupportsMcp=$false }
}

$config = $platformConfigs[$Platform]
$targetPath = if ($InstallPath) { $InstallPath } else { $config.DefaultPath }

$allSkills = @(
    "metago-action-plan","metago-compliance","metago-coupling-optimize","metago-critique",
    "metago-data-provenance","metago-decision-eval","metago-decision-lock","metago-developer-response",
    "metago-emotion","metago-fact-check","metago-frequency-adapt","metago-holistic-task",
    "metago-meta-create","metago-meta-evolve","metago-negentropy-monitor","metago-objectivity",
    "metago-output-integrity","metago-problem-trace","metago-scene-adapt","metago-self-check",
    "metago-value-align","metago-whatif"
)

$passCount = 0
$failCount = 0

function Write-Pass { param([string]$msg) Write-Host "  [PASS] $msg" -ForegroundColor Green; $script:passCount++ }
function Write-Fail2 { param([string]$msg) Write-Host "  [FAIL] $msg" -ForegroundColor Red; $script:failCount++ }

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  MetaGO Lifeform Kit 安装验证" -ForegroundColor Cyan
Write-Host "  平台：$($config.Name)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 验证安装路径
Write-Host "[1/4] 验证安装路径..." -ForegroundColor Yellow
if (Test-Path $targetPath) {
    Write-Pass "安装路径存在：$targetPath"
} else {
    Write-Fail2 "安装路径不存在：$targetPath"
}

# 2. 验证规则文件
Write-Host ""
Write-Host "[2/4] 验证规则文件..." -ForegroundColor Yellow
$rulesPath = Join-Path $targetPath $config.RulesFile
if (Test-Path $rulesPath) {
    $content = [System.IO.File]::ReadAllText($rulesPath, [System.Text.Encoding]::UTF8)
    if ($content -match "元构" -or $content -match "MetaGO") {
        Write-Pass "规则文件验证通过：$($config.RulesFile)"
    } else {
        Write-Fail2 "规则文件内容不匹配"
    }
} else {
    Write-Fail2 "规则文件不存在：$rulesPath"
}

# 3. 验证技能
Write-Host ""
if ($config.SupportsSkills) {
    Write-Host "[3/4] 验证技能..." -ForegroundColor Yellow
    $skillsDir = Join-Path $targetPath $config.SkillsDir
    $skillPass = 0
    $skillFail = 0
    foreach ($skill in $allSkills) {
        $skillPath = Join-Path $skillsDir $skill
        $skillMd = Join-Path $skillPath "SKILL.md"
        if ((Test-Path $skillPath) -and (Test-Path $skillMd)) {
            $skillPass++
        } else {
            $skillFail++
            Write-Host "    [缺失] $skill" -ForegroundColor Red
        }
    }
    if ($skillFail -eq 0) {
        Write-Pass "全部 $skillPass/$($allSkills.Count) 个技能验证通过"
    } else {
        Write-Fail2 "$skillFail/$($allSkills.Count) 个技能缺失"
    }
} else {
    Write-Host "[3/4] $($config.Name) 平台不支持技能目录，跳过" -ForegroundColor Gray
    $script:passCount++
}

# 4. 验证知识晶体索引和 MCP 映射（仅 Trae）
Write-Host ""
if ($config.SupportsMemory) {
    Write-Host "[4/4] 验证知识晶体索引..." -ForegroundColor Yellow
    $crystalPath = Join-Path $targetPath "memory\知识晶体索引.md"
    if (Test-Path $crystalPath) {
        Write-Pass "知识晶体索引存在"
    } else {
        Write-Fail2 "知识晶体索引不存在"
    }

    Write-Host ""
    Write-Host "[4b/4] 验证 MCP 调度映射..." -ForegroundColor Yellow
    $mcpPath = Join-Path $targetPath "mcps\MCP工具调度映射.md"
    if (Test-Path $mcpPath) {
        Write-Pass "MCP 调度映射存在"
    } else {
        Write-Host "  [SKIP] MCP 调度映射不存在（非必须）" -ForegroundColor Yellow
        $script:passCount++
    }
} else {
    Write-Host "[4/4] $($config.Name) 平台不支持知识晶体索引，跳过" -ForegroundColor Gray
    $script:passCount++
}

# 汇总
Write-Host ""
Write-Host "==========================================" -ForegroundColor $(if ($failCount -eq 0) { 'Green' } else { 'Red' })
if ($failCount -eq 0) {
    Write-Host "  ✅ 验证通过：$passCount 项全部成功" -ForegroundColor Green
    Write-Host "  MetaGO Lifeform Kit 在 $($config.Name) 上运行正常" -ForegroundColor Green
} else {
    Write-Host "  ❌ 验证失败：$failCount 项未通过" -ForegroundColor Red
    Write-Host "  请重新运行安装脚本" -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor $(if ($failCount -eq 0) { 'Green' } else { 'Red' })
Write-Host ""
