#requires -Version 5.1
<#
.SYNOPSIS
    MetaGO 本地 AI 工具状态同步脚本（metago-sync.ps1）

.DESCRIPTION
    1. 扫描本地 7 大 AI 工具的安装状态（Trae/Cursor/Claude Code/Codex/CodeBuddy/Qoder/ZCode）。
    2. 统计每个平台的 metago 技能数量（扫描 SKILL.md 文件或 rules 文件中的 metago- 引用）。
    3. 通过 HTTP POST 上报 platform_status 事件到 CloudBase events 云函数。
    4. 输出友好的中文日志；上报失败时提示用户检查网络。

.PARAMETER DryRun
    仅扫描与打印，不实际上报。

.EXAMPLE
    .\metago-sync.ps1
    .\metago-sync.ps1 -DryRun
#>
[CmdletBinding()]
param(
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
try { [Console]::OutputEncoding = $utf8NoBom } catch { }
$OutputEncoding = $utf8NoBom

# ==================== 配置 ====================
$ApiUrl     = 'https://metago.life/api/events'
$AdminToken = 'metago-admin-2026'
$TargetUid  = $env:USERNAME

if (-not $TargetUid) { $TargetUid = 'unknown-user' }

# ==================== 平台定义 ====================
# name      : 平台标识（上报字段）
# rulesPath : 规则/标志文件路径（存在即视为已安装）
# skillsDir : 技能目录（用于扫描 SKILL.md 数量；为空则回退到 rulesPath 统计 metago- 引用）
$platforms = @(
    @{ name = 'trae';       displayName = 'Trae';         rulesPath = Join-Path $env:USERPROFILE '.trae\rules';          skillsDir = Join-Path $env:USERPROFILE '.trae\rules' }
    @{ name = 'cursor';     displayName = 'Cursor';       rulesPath = Join-Path $env:USERPROFILE '.cursor\rules';        skillsDir = Join-Path $env:USERPROFILE '.cursor\rules' }
    @{ name = 'claude-code';displayName = 'Claude Code';  rulesPath = Join-Path $env:USERPROFILE '.claude\CLAUDE.md';    skillsDir = '' }
    @{ name = 'codex';      displayName = 'Codex';        rulesPath = Join-Path $env:USERPROFILE '.codex\AGENTS.md';     skillsDir = '' }
    @{ name = 'codebuddy';  displayName = 'CodeBuddy';    rulesPath = Join-Path $env:USERPROFILE '.codebuddy\CODEBUDDY.md'; skillsDir = '' }
    @{ name = 'qoder';      displayName = 'Qoder';        rulesPath = Join-Path $env:USERPROFILE '.qoder\metago-rules.md'; skillsDir = '' }
    @{ name = 'zcode';      displayName = 'ZCode';        rulesPath = Join-Path $env:USERPROFILE '.zcode\CLAUDE.md';     skillsDir = '' }
)

# ==================== 工具函数 ====================
function Get-MetagoSkillCount {
    param(
        [string]$SkillsDir,
        [string]$RulesPath
    )
    # 优先：扫描目录下的 SKILL.md 文件数
    if ($SkillsDir -and (Test-Path -LiteralPath $SkillsDir)) {
        $skillFiles = @(Get-ChildItem -LiteralPath $SkillsDir -Filter 'SKILL.md' -Recurse -ErrorAction SilentlyContinue)
        if ($skillFiles.Count -gt 0) {
            return $skillFiles.Count
        }
    }
    # 回退：统计 rules 文件中的 metago- 引用（去重）
    $candidates = @()
    if ($RulesPath) {
        if ((Test-Path -LiteralPath $RulesPath) -and (Test-Path -LiteralPath $RulesPath -PathType Leaf)) {
            $candidates += $RulesPath
        } elseif ((Test-Path -LiteralPath $RulesPath) -and (Test-Path -LiteralPath $RulesPath -PathType Container)) {
            $candidates += @(Get-ChildItem -LiteralPath $RulesPath -Filter '*.md' -Recurse -ErrorAction SilentlyContinue).FullName
        }
    }
    $metagoRefs = @{}
    foreach ($f in $candidates) {
        try {
            $text = [System.IO.File]::ReadAllText($f, $utf8NoBom)
            $matchesList = [regex]::Matches($text, 'metago-[a-z0-9-]+')
            foreach ($m in $matchesList) {
                $metagoRefs[$m.Value] = $true
            }
        } catch {
            # 忽略读取失败
        }
    }
    return $metagoRefs.Keys.Count
}

# ==================== 1. 扫描 ====================
Write-Host ''
Write-Host '=======================================' -ForegroundColor Cyan
Write-Host '  MetaGO 本地 AI 工具状态扫描' -ForegroundColor Cyan
Write-Host '=======================================' -ForegroundColor Cyan
Write-Host "目标用户：$TargetUid"
Write-Host "扫描平台数：$($platforms.Count)"
Write-Host ''

$detected = New-Object System.Collections.Generic.List[object]
$events   = New-Object System.Collections.Generic.List[object]

foreach ($p in $platforms) {
    $installed = Test-Path -LiteralPath $p.rulesPath
    $skillCount = 0
    if ($installed) {
        $skillCount = Get-MetagoSkillCount -SkillsDir $p.skillsDir -RulesPath $p.rulesPath
    }

    $status = if ($installed) { '已安装' } else { '未安装' }
    $color  = if ($installed) { 'Green' } else { 'DarkGray' }
    $skillInfo = if ($installed) { " | metago 技能引用：$skillCount" } else { '' }
    Write-Host ("  [{0,-1}] {1,-12} : {2}{3}" -f $(if($installed){'√'}else{'×'}), $p.displayName, $status, $skillInfo) -ForegroundColor $color

    $detected.Add([pscustomobject]@{
        platform    = $p.name
        displayName = $p.displayName
        installed   = $installed
        skillCount  = $skillCount
    })

    # 每个检测到的平台上报一条 platform_status 事件
    if ($installed) {
        $events.Add([pscustomobject]@{
            type      = 'platform_status'
            platform  = $p.name
            timestamp = (Get-Date).ToString('o')
            data      = @{
                platform    = $p.name
                displayName = $p.displayName
                installed   = $true
                skillCount  = $skillCount
                scannedAt   = (Get-Date).ToString('o')
            }
        })
    }
}

$installedCount = ($detected | Where-Object { $_.installed }).Count
Write-Host ''
Write-Host "扫描完成：共检测到 $installedCount / $($platforms.Count) 个平台已安装。" -ForegroundColor Cyan

# ==================== 2. 上报 ====================
if ($DryRun) {
    Write-Host ''
    Write-Host '已指定 -DryRun，跳过上报。' -ForegroundColor Yellow
    Write-Host "待上报事件数：$($events.Count)" -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

if ($events.Count -eq 0) {
    Write-Host ''
    Write-Host '没有检测到任何已安装的平台，无需上报。' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

Write-Host ''
Write-Host '=======================================' -ForegroundColor Cyan
Write-Host '  上报到 CloudBase events 云函数' -ForegroundColor Cyan
Write-Host '=======================================' -ForegroundColor Cyan
Write-Host "接口地址：$ApiUrl"
Write-Host "待上报事件数：$($events.Count)"
Write-Host ''

# 构建 PowerShell 对象数组，序列化时由 ConvertTo-Json 递归处理
$eventsArr = @()
foreach ($e in $events) {
    $eventsArr += [pscustomobject]@{
        type      = $e.type
        platform  = $e.platform
        timestamp = $e.timestamp
        data      = [pscustomobject]$e.data
    }
}

$bodyObj = [pscustomobject]@{
    action     = 'reportBatch'
    adminToken = $AdminToken
    targetUid  = $TargetUid
    events     = $eventsArr
}

$bodyJson = $bodyObj | ConvertTo-Json -Depth 6

$reportSuccess = $false
try {
    $response = Invoke-RestMethod -Uri $ApiUrl -Method Post -ContentType 'application/json; charset=utf-8' -Body $bodyJson -TimeoutSec 15 -ErrorAction Stop
    $reportSuccess = $true
    Write-Host '上报成功！' -ForegroundColor Green
    if ($response) {
        $respJson = $response | ConvertTo-Json -Depth 6 -Compress
        Write-Host "服务端响应：$respJson"
    }
} catch {
    Write-Host '=======================================' -ForegroundColor Red
    Write-Host '  上报失败' -ForegroundColor Red
    Write-Host '=======================================' -ForegroundColor Red
    Write-Host "错误信息：$($_.Exception.Message)" -ForegroundColor Red
    Write-Host ''
    Write-Host '请检查网络连接，确认能够访问 https://metago.life 后重试。' -ForegroundColor Yellow
    Write-Host '可使用 -DryRun 参数仅查看扫描结果而不上报。' -ForegroundColor Yellow
    Write-Host ''
    exit 1
}

Write-Host ''
Write-Host "MetaGO 同步完成：扫描 $($platforms.Count) 个平台，检测到 $installedCount 个已安装，上报 $($events.Count) 条事件。" -ForegroundColor Green
Write-Host ''
exit 0
