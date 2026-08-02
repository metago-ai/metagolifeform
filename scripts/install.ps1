<#
.SYNOPSIS
    MetaGO Agent Harness 一键安装脚本（V36.9.0 - 转发到 cli.js）

.DESCRIPTION
    支持 7 大平台：Trae / Claude Code / Codex / Cursor / CodeBuddy / Qoder / ZCode。
    所有逻辑已统一到 node cli.js install 实现，包含：
    - 自动备份旧配置到 ~/.metago-backups/
    - 动态生成平台法则（第十八章清单自动注入）
    - MCP 服务器配置（metago + metago-algorithms）
    - 技能安装与验证

.PARAMETER Platform
    目标平台，可选值：trae、claude-code、codex、cursor、codebuddy、qoder、zcode
    默认：trae

.PARAMETER Force
    强制覆盖已存在的配置（跳过备份确认）

.PARAMETER SkipBackup
    跳过备份步骤

.PARAMETER SkipSkills
    跳过技能安装，仅安装规则文件

.PARAMETER ProjectLocal
    安装到当前项目目录（.trae/）而非全局用户目录

.EXAMPLE
    .\scripts\install.ps1
    使用默认平台（Trae）全局安装

.EXAMPLE
    .\scripts\install.ps1 -Platform claude-code
    安装到 Claude Code 平台

.EXAMPLE
    .\scripts\install.ps1 -Platform cursor -ProjectLocal
    安装到当前项目（Cursor 项目级）
#>

[CmdletBinding()]
param(
    [ValidateSet('trae','claude-code','codex','cursor','codebuddy','qoder','zcode')]
    [string]$Platform = 'trae',

    [switch]$Force,

    [switch]$SkipBackup,

    [switch]$SkipSkills,

    [switch]$ProjectLocal
)

$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot
$CliPath = Join-Path $ScriptDir "cli.js"

if (-not (Test-Path $CliPath)) {
    Write-Host "[错误] 找不到 cli.js: $CliPath" -ForegroundColor Red
    exit 1
}

$nodeCmd = "node"
try {
    & $nodeCmd --version 2>$null | Out-Null
} catch {
    Write-Host "[错误] 未找到 Node.js，请先安装 Node.js >= 14" -ForegroundColor Red
    exit 1
}

$cliArgs = @($CliPath, "install", "--platform", $Platform)
if ($Force) { $cliArgs += "--force" }
if ($SkipBackup) { $cliArgs += "--skip-backup" }
if ($SkipSkills) { $cliArgs += "--skip-skills" }
if ($ProjectLocal) { $cliArgs += "--project-local" }

& $nodeCmd @cliArgs
exit $LASTEXITCODE
